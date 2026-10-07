import { randomBytes } from "node:crypto";
import type { CreatePaymentIntentInput, PaymentIntent, PaymentProvider } from "../types";

export class FakePaymentProvider implements PaymentProvider {
  private readonly intents = new Map<string, PaymentIntent>();

  async createIntent(input: CreatePaymentIntentInput): Promise<PaymentIntent> {
    if (!Number.isInteger(input.amountMinor) || input.amountMinor <= 0) {
      throw new Error("Payment amount must be a positive minor-unit integer");
    }
    if (!/^[A-Z]{3}$/.test(input.currency)) {
      throw new Error("Payment currency must be a three-letter code");
    }
    if (!/^[a-zA-Z0-9_-]{1,80}$/.test(input.reference)) {
      throw new Error("Payment reference is invalid");
    }
    const intent: PaymentIntent = {
      id: `fake_${randomBytes(8).toString("hex")}`,
      status: "fake_pending",
      provider: "fake",
      amountMinor: input.amountMinor,
      currency: input.currency,
      reference: input.reference,
    };
    this.intents.set(intent.id, intent);
    return intent;
  }

  async markSucceeded(id: string): Promise<PaymentIntent> {
    const current = this.intents.get(id);
    if (!current) throw new Error("Payment intent not found");
    const succeeded: PaymentIntent = { ...current, status: "fake_succeeded" };
    this.intents.set(id, succeeded);
    return succeeded;
  }
}
