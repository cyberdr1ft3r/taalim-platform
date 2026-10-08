export type PaymentStatus =
  | "requires_customer_action"
  | "processing"
  | "succeeded"
  | "failed"
  | "cancelled"
  | "expired";

export type RefundStatus = "processing" | "succeeded" | "failed";

export type NormalizedPaymentEventType =
  | "payment.processing"
  | "payment.succeeded"
  | "payment.failed"
  | "payment.cancelled"
  | "payment.expired"
  | "mandate.activated"
  | "mandate.revoked"
  | "refund.processing"
  | "refund.succeeded"
  | "refund.failed"
  | "dispute.opened"
  | "dispute.won"
  | "dispute.lost"
  | "settlement.available"
  | "settlement.paid"
  | "settlement.held"
  | "unknown";

export interface PaymentProviderCapabilities {
  checkout: "hosted_redirect";
  recurring: "off_session" | "provider_scheduled" | "customer_reauthorizes" | "unsupported";
  refunds: "full_and_partial" | "full_only" | "unsupported";
  webhookVerification: "signature" | "shared_secret" | "unsupported";
  transactionLookup: boolean;
  reconciliation: boolean;
  marketplaceSettlement: "split_and_payout" | "collection_only" | "unsupported" | "unknown";
}

export interface CreateCheckoutInput {
  paymentAttemptId: string;
  amountMinor: number;
  currency: string;
  description: string;
  returnUrl?: string;
  cancelUrl?: string;
  requestMandate: boolean;
  idempotencyKey: string;
}

export interface ProviderPayment {
  provider: string;
  providerPaymentReference: string;
  paymentAttemptId: string;
  status: PaymentStatus;
  amountMinor: number;
  currency: string;
  checkoutUrl?: string;
  mandateReference?: string;
  failureCode?: string;
}

export interface ChargeMandateInput {
  paymentAttemptId: string;
  mandateReference: string;
  amountMinor: number;
  currency: string;
  description: string;
  idempotencyKey: string;
}

export interface RevokeMandateInput {
  mandateReference: string;
  idempotencyKey: string;
}

export interface ProviderMandate {
  provider: string;
  mandateReference: string;
  status: "active" | "revoked";
}

export interface RefundPaymentInput {
  refundRecordId: string;
  providerPaymentReference: string;
  amountMinor: number;
  currency: string;
  reason?: string;
  idempotencyKey: string;
}

export interface ProviderRefund {
  provider: string;
  providerRefundReference: string;
  refundRecordId: string;
  providerPaymentReference: string;
  status: RefundStatus;
  amountMinor: number;
  currency: string;
}

export interface ProviderWebhookRequest {
  rawBody: string;
  headers: Readonly<Record<string, string | undefined>>;
}

export interface NormalizedPaymentEvent {
  provider: string;
  providerEventId: string;
  type: NormalizedPaymentEventType;
  occurredAt: Date;
  providerPaymentReference?: string;
  providerRefundReference?: string;
  mandateReference?: string;
  paymentAttemptId?: string;
  amountMinor?: number;
  currency?: string;
  failureCode?: string;
  payloadHash: string;
}

export interface ReconciliationQuery {
  from: Date;
  to: Date;
  cursor?: string;
  limit?: number;
}

export interface ReconciliationEntry {
  provider: string;
  providerTransactionReference: string;
  providerPaymentReference?: string;
  kind: "payment" | "refund" | "fee" | "reserve" | "settlement" | "payout";
  status: string;
  grossAmountMinor?: number;
  providerFeeMinor?: number;
  netSettlementMinor?: number;
  reserveAmountMinor?: number;
  currency: string;
  occurredAt: Date;
  availableAt?: Date;
  settledAt?: Date;
}

export interface ReconciliationPage {
  entries: ReconciliationEntry[];
  nextCursor?: string;
}

export interface PaymentProvider {
  readonly provider: string;
  readonly capabilities: PaymentProviderCapabilities;
  createCheckout(input: CreateCheckoutInput): Promise<ProviderPayment>;
  getPayment(providerPaymentReference: string): Promise<ProviderPayment>;
  chargeMandate(input: ChargeMandateInput): Promise<ProviderPayment>;
  revokeMandate(input: RevokeMandateInput): Promise<ProviderMandate>;
  refundPayment(input: RefundPaymentInput): Promise<ProviderRefund>;
  verifyAndParseWebhook(request: ProviderWebhookRequest): Promise<NormalizedPaymentEvent[]>;
  listReconciliationEntries(query: ReconciliationQuery): Promise<ReconciliationPage>;
}

export class UnsupportedPaymentCapabilityError extends Error {
  constructor(provider: string, capability: string) {
    super(`Payment provider ${provider} does not support ${capability}`);
    this.name = "UnsupportedPaymentCapabilityError";
  }
}
