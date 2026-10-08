# Payments

The canonical `PaymentProvider` boundary is provider-neutral. It exposes hosted checkout creation, payment lookup, mandate charging and revocation, refunds, signed-webhook normalization, and reconciliation reads. Capabilities are declared explicitly because providers do not offer equivalent recurring, refund, webhook, reconciliation, or marketplace-settlement models.

`getPaymentProvider` returns `FakePaymentProvider` only when `PAYMENT_PROVIDER=fake`. Any other value throws. No production provider SDK, credentials, endpoint, or live charge path exists.

## Trust boundary

- All amounts are positive safe minor-unit integers with a three-letter uppercase currency code.
- Browser return and cancellation URLs are navigation only. They never prove payment success.
- A successful payment state comes from a verified provider webhook or an authenticated provider lookup.
- Raw webhook bodies are verified before parsing. Adapters return normalized events with the provider event ID and payload hash so the application can persist and deduplicate them.
- Provider references are opaque. Card numbers, CVVs, bank credentials, and raw provider secrets never cross this interface.
- Idempotency keys are required for every mutating provider call.

## State ownership

Taalim owns subscription cadence, retries, cancellation intent, lesson access, and ledger posting. A provider owns payment execution, mandate state, refunds, disputes, and settlement reports. Cancelling a Taalim subscription stops future scheduling; revoking a provider mandate is a separate explicit operation. Neither action rewrites historical financial events.

`PaymentAttempt` stores an attempt and its opaque provider payment reference. `PaymentEvent` stores verified provider events and enforces provider/event-ID uniqueness. `FinancialEvent` remains the source of truth for gross, commission, and teacher-payable accounting. Refunds and payouts remain separate records. Settlement notices can drive reconciliation, but never create or rewrite learner charges.

The provider boundary deliberately has no teacher-payout method. Collection, marketplace splitting, and payout responsibility remain unresolved under founder decision FD-21 and require written provider and legal confirmation before a payout adapter can be designed.

The fake provider is in-memory and synthetic. It can exercise checkout, mandate, refund, webhook, duplicate/out-of-order delivery, and reconciliation behavior without network calls or card data. It never writes the ledger.

See [payment-provider-preflight.md](./payment-provider-preflight.md) for the Issue #4 capability evidence, shortlist, open questions, and readiness decision.
