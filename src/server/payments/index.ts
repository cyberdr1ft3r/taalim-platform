import { loadEnv } from "../config/env";
import { FakePaymentProvider } from "./providers/fake-provider";
import type { PaymentProvider } from "./types";

export function getPaymentProvider(env = loadEnv()): PaymentProvider {
  if (env.PAYMENT_PROVIDER === "fake") return new FakePaymentProvider();
  throw new Error("Live payments are disabled. The payment provider is undecided.");
}

export type { CreatePaymentIntentInput, PaymentIntent, PaymentProvider } from "./types";
