import { describe, expect, it } from "vitest";
import { FakePaymentProvider } from "./fake-provider";

const checkoutInput = {
  paymentAttemptId: "attempt_1",
  amountMinor: 15000,
  currency: "MAD",
  description: "Synthetic lesson payment",
  returnUrl: "https://example.test/payment-return",
  cancelUrl: "https://example.test/payment-cancelled",
  requestMandate: true,
  idempotencyKey: "checkout:attempt_1",
};

describe("FakePaymentProvider", () => {
  it("creates a hosted checkout idempotently without treating the browser return as success", async () => {
    const payments = new FakePaymentProvider();
    const created = await payments.createCheckout(checkoutInput);
    const replayed = await payments.createCheckout(checkoutInput);
    const lookedUp = await payments.getPayment(created.providerPaymentReference);

    expect(created).toMatchObject({
      provider: "fake",
      paymentAttemptId: "attempt_1",
      status: "requires_customer_action",
      amountMinor: 15000,
      currency: "MAD",
    });
    expect(created.checkoutUrl).toMatch(/^https:\/\/fake-payments\.invalid\/checkout\//);
    expect(replayed).toEqual(created);
    expect(lookedUp).toEqual(created);
    await expect(
      payments.createCheckout({ ...checkoutInput, amountMinor: 16000 }),
    ).rejects.toThrow(/idempotency key.*different input/i);
  });

  it("supports an off-session mandate charge and makes revocation idempotent", async () => {
    const payments = new FakePaymentProvider();
    const mandate = payments.activateMandate("mandate_1");
    const charge = {
      paymentAttemptId: "attempt_2",
      mandateReference: mandate.mandateReference,
      amountMinor: 25000,
      currency: "MAD",
      description: "Synthetic renewal",
      idempotencyKey: "charge:attempt_2",
    };

    const charged = await payments.chargeMandate(charge);
    const replayed = await payments.chargeMandate(charge);

    expect(charged).toMatchObject({ status: "processing", mandateReference: "mandate_1" });
    expect(replayed).toEqual(charged);
    await expect(
      payments.revokeMandate({ mandateReference: "mandate_1", idempotencyKey: "revoke:mandate_1" }),
    ).resolves.toMatchObject({ status: "revoked" });
    await expect(
      payments.revokeMandate({ mandateReference: "mandate_1", idempotencyKey: "revoke:mandate_1" }),
    ).resolves.toMatchObject({ status: "revoked" });
    await expect(
      payments.chargeMandate({
        ...charge,
        paymentAttemptId: "attempt_3",
        idempotencyKey: "charge:attempt_3",
      }),
    ).rejects.toThrow(/active mandate/i);
  });

  it("creates partial and full refunds idempotently only for succeeded payments", async () => {
    const payments = new FakePaymentProvider();
    const created = await payments.createCheckout(checkoutInput);
    const partialInput = {
      refundRecordId: "refund_1",
      providerPaymentReference: created.providerPaymentReference,
      amountMinor: 5000,
      currency: "MAD",
      idempotencyKey: "refund:1",
    };

    await expect(payments.refundPayment(partialInput)).rejects.toThrow(/succeeded payment/i);
    payments.setPaymentStatus(created.providerPaymentReference, "succeeded");
    const partial = await payments.refundPayment(partialInput);
    const replayed = await payments.refundPayment(partialInput);
    const remainder = await payments.refundPayment({
      ...partialInput,
      refundRecordId: "refund_2",
      amountMinor: 10000,
      idempotencyKey: "refund:2",
    });

    expect(partial.amountMinor).toBe(5000);
    expect(replayed).toEqual(partial);
    expect(remainder.amountMinor).toBe(10000);
    await expect(
      payments.refundPayment({
        ...partialInput,
        refundRecordId: "refund_3",
        amountMinor: 1,
        idempotencyKey: "refund:3",
      }),
    ).rejects.toThrow(/exceeds/i);
  });

  it("verifies signatures and preserves duplicate and out-of-order event identities", async () => {
    const payments = new FakePaymentProvider("test-secret");
    const succeeded = {
      providerEventId: "event_2",
      type: "payment.succeeded" as const,
      occurredAt: "2026-10-08T11:00:00.000Z",
      providerPaymentReference: "fake_pay_1",
      paymentAttemptId: "attempt_1",
      amountMinor: 15000,
      currency: "MAD",
    };
    const processing = {
      providerEventId: "event_1",
      type: "payment.processing" as const,
      occurredAt: "2026-10-08T10:00:00.000Z",
      providerPaymentReference: "fake_pay_1",
      paymentAttemptId: "attempt_1",
      amountMinor: 15000,
      currency: "MAD",
    };

    const events = await payments.verifyAndParseWebhook(
      payments.signWebhook([succeeded, processing, succeeded]),
    );

    expect(events.map((event) => event.providerEventId)).toEqual(["event_2", "event_1", "event_2"]);
    expect(events[0]).toMatchObject({ provider: "fake", type: "payment.succeeded" });
    expect(events[0]?.occurredAt).toEqual(new Date("2026-10-08T11:00:00.000Z"));
    expect(events[0]?.payloadHash).toMatch(/^[a-f0-9]{64}$/);
    await expect(
      payments.verifyAndParseWebhook({
        rawBody: JSON.stringify(succeeded),
        headers: { "x-fake-signature": "00" },
      }),
    ).rejects.toThrow(/invalid.*signature/i);
  });

  it("pages reconciliation entries and rejects unknown payment references", async () => {
    const payments = new FakePaymentProvider();
    const first = await payments.createCheckout(checkoutInput);
    await payments.createCheckout({
      ...checkoutInput,
      paymentAttemptId: "attempt_2",
      idempotencyKey: "checkout:attempt_2",
    });

    const from = new Date(Date.now() - 1000);
    const to = new Date(Date.now() + 1000);
    const pageOne = await payments.listReconciliationEntries({ from, to, limit: 1 });
    const pageTwo = await payments.listReconciliationEntries({
      from,
      to,
      limit: 1,
      cursor: pageOne.nextCursor,
    });

    expect(pageOne.entries).toHaveLength(1);
    expect(pageOne.nextCursor).toBe("1");
    expect(pageTwo.entries).toHaveLength(1);
    expect(pageTwo.nextCursor).toBeUndefined();
    expect(pageOne.entries[0]).toMatchObject({
      kind: "payment",
      providerPaymentReference: first.providerPaymentReference,
    });
    await expect(payments.getPayment("fake_missing")).rejects.toThrow(/not found/i);
  });
});
