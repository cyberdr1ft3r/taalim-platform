# Payments

`PaymentProvider` exposes `createIntent` and `markSucceeded`. `getPaymentProvider` returns `FakePaymentProvider` when `PAYMENT_PROVIDER=fake`. Any other value throws, and live charges stay disabled.

The fake provider keeps intents in memory. It does not call a network, store card data, or write a ledger. Amounts are opaque positive minor-unit integers plus a three-letter currency code. This issue does not define prices, commission, refunds, or settlement.

Payment SDKs such as `stripe` are rejected by ESLint outside `src/server/payments/providers`. A future provider module owns the SDK, signatures, and provider identifiers. Domain code keeps importing `@/server/payments`.

Written provider confirmation and legal or accounting review remain unresolved and block any live integration.
