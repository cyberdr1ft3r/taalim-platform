import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type {
  ChargeMandateInput,
  CreateCheckoutInput,
  NormalizedPaymentEvent,
  PaymentProvider,
  PaymentProviderCapabilities,
  PaymentStatus,
  ProviderMandate,
  ProviderPayment,
  ProviderRefund,
  ProviderWebhookRequest,
  ReconciliationPage,
  ReconciliationQuery,
  RefundPaymentInput,
  RevokeMandateInput,
} from "../types";

interface FakeEventPayload extends Omit<NormalizedPaymentEvent, "provider" | "occurredAt" | "payloadHash"> {
  occurredAt: string;
}

interface StoredPayment extends ProviderPayment {
  createdAt: Date;
}

export class FakePaymentProvider implements PaymentProvider {
  readonly provider = "fake";
  readonly capabilities: PaymentProviderCapabilities = {
    checkout: "hosted_redirect",
    recurring: "off_session",
    refunds: "full_and_partial",
    webhookVerification: "signature",
    transactionLookup: true,
    reconciliation: true,
    marketplaceSettlement: "unknown",
  };

  private readonly payments = new Map<string, StoredPayment>();
  private readonly mandates = new Map<string, ProviderMandate>();
  private readonly refunds = new Map<string, ProviderRefund>();
  private readonly idempotentPayments = new Map<string, string>();
  private readonly paymentFingerprints = new Map<string, string>();
  private readonly idempotentRefunds = new Map<string, string>();
  private readonly refundFingerprints = new Map<string, string>();
  private readonly idempotentRevocations = new Map<string, string>();
  private sequence = 0;

  constructor(private readonly webhookSecret = "fake-webhook-secret") {}

  async createCheckout(input: CreateCheckoutInput): Promise<ProviderPayment> {
    this.validateAmount(input.amountMinor, input.currency);
    this.validateInternalId(input.paymentAttemptId, "payment attempt");
    this.validateIdempotencyKey(input.idempotencyKey);

    const fingerprint = this.fingerprint({ operation: "createCheckout", ...input });
    const replay = this.getReplay(
      input.idempotencyKey,
      fingerprint,
      this.idempotentPayments,
      this.paymentFingerprints,
    );
    if (replay) return this.getPayment(replay);

    const providerPaymentReference = this.nextReference("pay");
    const payment: StoredPayment = {
      provider: this.provider,
      providerPaymentReference,
      paymentAttemptId: input.paymentAttemptId,
      status: "requires_customer_action",
      amountMinor: input.amountMinor,
      currency: input.currency,
      checkoutUrl: `https://fake-payments.invalid/checkout/${providerPaymentReference}`,
      createdAt: new Date(),
    };
    this.payments.set(providerPaymentReference, payment);
    this.idempotentPayments.set(input.idempotencyKey, providerPaymentReference);
    this.paymentFingerprints.set(input.idempotencyKey, fingerprint);
    return this.publicPayment(payment);
  }

  async getPayment(providerPaymentReference: string): Promise<ProviderPayment> {
    const payment = this.payments.get(providerPaymentReference);
    if (!payment) throw new Error("Payment not found");
    return this.publicPayment(payment);
  }

  async chargeMandate(input: ChargeMandateInput): Promise<ProviderPayment> {
    this.validateAmount(input.amountMinor, input.currency);
    this.validateInternalId(input.paymentAttemptId, "payment attempt");
    this.validateIdempotencyKey(input.idempotencyKey);
    const fingerprint = this.fingerprint({ operation: "chargeMandate", ...input });
    const replay = this.getReplay(
      input.idempotencyKey,
      fingerprint,
      this.idempotentPayments,
      this.paymentFingerprints,
    );
    if (replay) return this.getPayment(replay);

    const mandate = this.mandates.get(input.mandateReference);
    if (!mandate || mandate.status !== "active") throw new Error("Active mandate not found");

    const providerPaymentReference = this.nextReference("pay");
    const payment: StoredPayment = {
      provider: this.provider,
      providerPaymentReference,
      paymentAttemptId: input.paymentAttemptId,
      status: "processing",
      amountMinor: input.amountMinor,
      currency: input.currency,
      mandateReference: input.mandateReference,
      createdAt: new Date(),
    };
    this.payments.set(providerPaymentReference, payment);
    this.idempotentPayments.set(input.idempotencyKey, providerPaymentReference);
    this.paymentFingerprints.set(input.idempotencyKey, fingerprint);
    return this.publicPayment(payment);
  }

  async revokeMandate(input: RevokeMandateInput): Promise<ProviderMandate> {
    this.validateIdempotencyKey(input.idempotencyKey);
    const previousMandate = this.idempotentRevocations.get(input.idempotencyKey);
    if (previousMandate && previousMandate !== input.mandateReference) {
      throw new Error("Idempotency key was already used with different input");
    }
    const mandate = this.mandates.get(input.mandateReference);
    if (!mandate) throw new Error("Mandate not found");
    const revoked: ProviderMandate = { ...mandate, status: "revoked" };
    this.mandates.set(input.mandateReference, revoked);
    this.idempotentRevocations.set(input.idempotencyKey, input.mandateReference);
    return { ...revoked };
  }

  async refundPayment(input: RefundPaymentInput): Promise<ProviderRefund> {
    this.validateAmount(input.amountMinor, input.currency);
    this.validateInternalId(input.refundRecordId, "refund record");
    this.validateIdempotencyKey(input.idempotencyKey);
    const payment = this.payments.get(input.providerPaymentReference);
    if (!payment || payment.status !== "succeeded") throw new Error("Succeeded payment not found");
    const fingerprint = this.fingerprint({ operation: "refundPayment", ...input });
    const replay = this.getReplay(
      input.idempotencyKey,
      fingerprint,
      this.idempotentRefunds,
      this.refundFingerprints,
    );
    if (replay) return { ...this.refunds.get(replay)! };

    const alreadyRefunding = [...this.refunds.values()]
      .filter((refund) => refund.providerPaymentReference === input.providerPaymentReference)
      .reduce((total, refund) => total + refund.amountMinor, 0);
    if (
      payment.currency !== input.currency ||
      input.amountMinor + alreadyRefunding > payment.amountMinor
    ) {
      throw new Error("Refund exceeds or does not match the original payment");
    }

    const providerRefundReference = this.nextReference("ref");
    const refund: ProviderRefund = {
      provider: this.provider,
      providerRefundReference,
      refundRecordId: input.refundRecordId,
      providerPaymentReference: input.providerPaymentReference,
      status: "processing",
      amountMinor: input.amountMinor,
      currency: input.currency,
    };
    this.refunds.set(providerRefundReference, refund);
    this.idempotentRefunds.set(input.idempotencyKey, providerRefundReference);
    this.refundFingerprints.set(input.idempotencyKey, fingerprint);
    return { ...refund };
  }

  async verifyAndParseWebhook(request: ProviderWebhookRequest): Promise<NormalizedPaymentEvent[]> {
    const signature = request.headers["x-fake-signature"];
    if (!signature) throw new Error("Missing fake webhook signature");
    const expected = createHmac("sha256", this.webhookSecret).update(request.rawBody).digest("hex");
    const suppliedBytes = Buffer.from(signature, "hex");
    const expectedBytes = Buffer.from(expected, "hex");
    if (suppliedBytes.length !== expectedBytes.length || !timingSafeEqual(suppliedBytes, expectedBytes)) {
      throw new Error("Invalid fake webhook signature");
    }

    const payload = JSON.parse(request.rawBody) as FakeEventPayload | FakeEventPayload[];
    const events = Array.isArray(payload) ? payload : [payload];
    return events.map((event) => ({
      ...event,
      provider: this.provider,
      occurredAt: new Date(event.occurredAt),
      payloadHash: createHash("sha256").update(request.rawBody).digest("hex"),
    }));
  }

  async listReconciliationEntries(query: ReconciliationQuery): Promise<ReconciliationPage> {
    const limit = Math.min(Math.max(query.limit ?? 100, 1), 500);
    const offset = query.cursor ? Number.parseInt(query.cursor, 10) : 0;
    if (!Number.isInteger(offset) || offset < 0 || query.from > query.to) {
      throw new Error("Invalid reconciliation query");
    }
    const candidates = [...this.payments.values()].filter(
      (payment) => payment.createdAt >= query.from && payment.createdAt <= query.to,
    );
    const page = candidates.slice(offset, offset + limit);
    const entries = page.map((payment) => ({
      provider: this.provider,
      providerTransactionReference: payment.providerPaymentReference,
      providerPaymentReference: payment.providerPaymentReference,
      kind: "payment" as const,
      status: payment.status,
      grossAmountMinor: payment.amountMinor,
      currency: payment.currency,
      occurredAt: payment.createdAt,
    }));
    const nextOffset = offset + page.length;
    return nextOffset < candidates.length ? { entries, nextCursor: String(nextOffset) } : { entries };
  }

  activateMandate(mandateReference = this.nextReference("mandate")): ProviderMandate {
    const mandate: ProviderMandate = { provider: this.provider, mandateReference, status: "active" };
    this.mandates.set(mandateReference, mandate);
    return { ...mandate };
  }

  setPaymentStatus(providerPaymentReference: string, status: PaymentStatus, failureCode?: string): ProviderPayment {
    const payment = this.payments.get(providerPaymentReference);
    if (!payment) throw new Error("Payment not found");
    const updated: StoredPayment = { ...payment, status };
    if (failureCode) updated.failureCode = failureCode;
    else delete updated.failureCode;
    this.payments.set(providerPaymentReference, updated);
    return this.publicPayment(updated);
  }

  signWebhook(payload: FakeEventPayload | FakeEventPayload[]): ProviderWebhookRequest {
    const rawBody = JSON.stringify(payload);
    return {
      rawBody,
      headers: {
        "x-fake-signature": createHmac("sha256", this.webhookSecret).update(rawBody).digest("hex"),
      },
    };
  }

  private nextReference(prefix: string) {
    this.sequence += 1;
    return `fake_${prefix}_${this.sequence}`;
  }

  private validateAmount(amountMinor: number, currency: string) {
    if (!Number.isSafeInteger(amountMinor) || amountMinor <= 0) {
      throw new Error("Payment amount must be a positive safe minor-unit integer");
    }
    if (!/^[A-Z]{3}$/.test(currency)) throw new Error("Payment currency must be a three-letter code");
  }

  private validateInternalId(value: string, label: string) {
    if (!/^[a-zA-Z0-9_-]{1,100}$/.test(value)) throw new Error(`Invalid ${label} identifier`);
  }

  private validateIdempotencyKey(value: string) {
    if (!/^[a-zA-Z0-9:_-]{1,160}$/.test(value)) throw new Error("Invalid idempotency key");
  }

  private fingerprint(value: unknown) {
    const keys = value && typeof value === "object" ? Object.keys(value).sort() : undefined;
    return createHash("sha256").update(JSON.stringify(value, keys)).digest("hex");
  }

  private getReplay(
    idempotencyKey: string,
    fingerprint: string,
    references: ReadonlyMap<string, string>,
    fingerprints: ReadonlyMap<string, string>,
  ) {
    const reference = references.get(idempotencyKey);
    if (!reference) return undefined;
    if (fingerprints.get(idempotencyKey) !== fingerprint) {
      throw new Error("Idempotency key was already used with different input");
    }
    return reference;
  }

  private publicPayment(payment: StoredPayment): ProviderPayment {
    const result: ProviderPayment & { createdAt?: Date } = { ...payment };
    delete result.createdAt;
    return { ...result };
  }
}
