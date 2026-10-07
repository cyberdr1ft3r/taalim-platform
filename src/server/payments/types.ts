export interface CreatePaymentIntentInput {
  amountMinor: number;
  currency: string;
  reference: string;
}

export interface PaymentIntent {
  id: string;
  status: "fake_pending" | "fake_succeeded";
  provider: "fake";
  amountMinor: number;
  currency: string;
  reference: string;
}

export interface PaymentProvider {
  createIntent(input: CreatePaymentIntentInput): Promise<PaymentIntent>;
  markSucceeded(id: string): Promise<PaymentIntent>;
}
