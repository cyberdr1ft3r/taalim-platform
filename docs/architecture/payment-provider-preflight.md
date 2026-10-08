# Payment provider preflight (Issue #4)

Date: 2026-10-08

Status: provider-neutral contract finalized; sandbox and live-provider implementation remain blocked by the gates below.

This record distinguishes **confirmed public evidence**, **inference**, and **unknown requiring written confirmation**. Provider marketing pages are evidence of a stated feature, not proof that Taalim's business model has been approved. This is an engineering assessment, not legal, tax, or accounting advice.

Evidence labels used below:

- **Confirmed:** stated in the cited public provider or regulator material.
- **Reasonable inference:** an engineering recommendation derived from confirmed facts, not a provider commitment.
- **Requires provider confirmation:** unavailable or ambiguous in public technical material.
- **Requires legal/accounting review:** a funds-flow, merchant-of-record, tax, invoicing, custody, or regulatory question that engineering evidence cannot decide.

## 1. Current architecture and schema

Payments are isolated behind `src/server/payments`. The application selects only an in-memory fake adapter; every non-fake configuration fails closed. There is no production SDK, credential, checkout route, webhook route, or live charge path.

The Issue #3 schema provides the future service's durable primitives:

- `PaymentAttempt`: internal attempt, opaque provider reference, amount, currency, state, and unique idempotency key.
- `PaymentEvent`: normalized provider event, payload hash, receipt time, and uniqueness on `(provider, providerEventId)`.
- `FinancialEvent`: append-oriented gross, commission, and teacher-payable amounts.
- `RefundRecord` and `PayoutRecord`: separate lifecycles, not inferred from a mutable payment balance.

No mandate record exists. `RefundRecord` also has no provider/refund reference field, while `PayoutRecord` already separates its optional provider payout ID. Those are deliberate unresolved persistence gaps, not reasons to overload another record: a focused migration will be required before a real mandate or refund adapter is implemented, after the chosen provider's identifier and consent models are confirmed. This contract/preflight PR does not need or include that migration.

## 2. Previous contract audit

The previous fake-only interface exposed `createIntent` and the test helper `markSucceeded`. Its statuses and identifiers were fake-specific, with no lookup, recurring mandate, refund, webhook, reconciliation, or capability model. It could not support a production adapter without leaking provider choices into domain code.

## 3. Domain mapping

| Normalized adapter state | Durable application treatment |
| --- | --- |
| `requires_customer_action` | `PaymentAttempt.CREATED` or `PENDING`; no access or ledger posting |
| `processing` | `PaymentAttempt.PENDING`; no success assumption |
| `succeeded` | `PaymentAttempt.SUCCEEDED`; Issue #9 may post financial events exactly once |
| `failed` | `PaymentAttempt.FAILED`; preserve prior financial history |
| `cancelled` / `expired` | `PaymentAttempt.CANCELLED`; no success assumption |
| refund events | update `RefundRecord`; compensating financial events remain separate |
| dispute events | future dispute workflow; never rewrite a historical charge silently |
| settlement / payout events | reconciliation and `PayoutRecord`; never proof of learner payment |

Browser redirects are never authoritative. Only verified webhooks or authenticated provider lookup may confirm success. Issue #9 owns durable ingestion, deduplication, transition guards, and ledger posting.

## 4. Provider research scope

Morocco-relevant paths reviewed: CMI, NAPS, Payzone/Vantage Payment System, ChariPay/Chari Money, and Aslan. Stripe was checked only as an availability control and does not list direct support for Moroccan businesses.

Bank Al-Maghrib's 2024 supervision report lists CMI, NAPS, Chari Money, and Vantage Payment System among payment institutions. That confirms institution-level regulatory status, not approval of Taalim's marketplace, recurring, custody, or payout model.

## 5. Capability comparison

| Provider | Recurring model | Marketplace / submerchant | Refund and reconciliation | Webhook / sandbox evidence | Public commercial evidence |
| --- | --- | --- | --- | --- | --- |
| CMI | Card recording and recurring test fields; exact merchant-initiated/off-session rules unknown | No public split, onboarding, or payout evidence found | Back office states capture, cancel, lookup, partial/full refund | Hash/security-key exchange stated; retries, ordering, replay, and public sandbox onboarding unknown | No public fees found; deposit/debit-order onboarding stated |
| NAPS | Tokenization, Card on File, recurring, and lighter later authentication stated; exact off-session behavior needs confirmation | No public split/payout evidence found | Full/partial refund API, capture, dashboard tracking stated | Public signature/retry and self-serve sandbox detail not found | National 1.98%/1.68%, international/premium 3%; setup/annual plan fees published with conditions |
| Payzone | Merchant- or provider-scheduled recurring, token, variable amount/calendar, eligible later no-3DS stated | No public split/payout evidence found | Dashboard/export; public guide states one full/partial refund operation per transaction and 48-hour CMI crediting | API/plugins claimed; detailed documentation supplied after contact; public retry/signature evidence absent | Quote-based, degressive pricing; no exact public rate found |
| ChariPay / Chari Money | ChariPay sends a single-use payment link each due date with 3DS: customer reauthorization, not proven off-session charging | Checkout supports settlement distribution; Chari Money describes seller wallets, KYC/KYB, split, commission, scheduled settlement | Full/partial refunds, lookup/timeline/CSV, instant payment-account availability, automatic/on-demand transfer stated | Self-serve sandbox, public API/Postman, HMAC-SHA256/timestamp, event ID, up to 16 retries over about 72 hours, replay stated | Production KYB and 6,000 MAD TTC one-time activation published; complete economics unknown |
| Aslan | Public detail insufficient for recurring/off-session proof | KYC/KYB, cash-in, split, scheduled/threshold payout, seller ledger, reconciliation stated | Marketplace reconciliation stated; refund/dispute detail unknown | APIs/webhooks stated; accessible signature/retry/sandbox detail not found | Fees/reserves not public; describes itself as principal agent of a licensed institution |

## 6. Confirmed public capabilities

### CMI

CMI describes hosted multilingual checkout, 3-D Secure, local/international cards, automatic card recording for returning buyers, lookup, capture, cancellation, and partial/full refund. A brochure says exchanges use a hash and security key. A public test-store page includes recurring number and frequency fields.

### NAPS

NAPS describes tokenization, Card on File, recurring payments, full/partial refund APIs, capture/overcapture, dashboard monitoring, and lighter authentication for a previously authenticated user. Its application asks for identity/company registration, site, activity, and volume.

### Payzone

Payzone describes direct, mail-order, and recurring payment, 3-D Secure, reporting/export, tokenized repeat payment, merchant- or provider-managed schedules, variable amount/calendar, and eligible subsequent payment without 3-D Secure. Its guide documents authorization/capture with a seven-day capture window and MAD settlement through CMI.

### ChariPay / Chari Money

ChariPay publishes a self-serve sandbox, hosted checkout, payment links, refunds, lookup, webhooks, and API/Postman documentation. It says redirects are not authoritative, creates use `externalId` for idempotency, webhooks use HMAC-SHA256 and a timestamp window, and failed deliveries are retried. Checkout may include settlement distribution to a submerchant wallet.

Chari Money describes seller IBAN wallets, KYC/KYB, split payment, commission, scheduled settlement, seller reporting, and refund adjustment. It also says production marketplace use requires use-case approval and principal-agent/regulatory arrangements.

### Aslan

Aslan describes marketplace seller KYC/KYB, cash-in, split, scheduled or threshold payouts, per-seller ledgers, reconciliation, APIs, and webhooks. It describes itself as principal agent of a Bank Al-Maghrib-licensed payment institution.

## 7. Requires provider confirmation: unsupported or unclear capabilities

Written answers are required for:

- marketplace collection for independent teachers and the required licensed/principal-agent structure;
- who contracts with and KYC/KYBs each teacher, who holds funds, and whether Taalim has custody;
- true merchant-initiated/off-session authority, consent evidence, 3DS/SCA rules, and reauthentication recovery;
- webhook raw-body/signature/replay rules, retries, ordering, retention, and manual replay;
- sandbox access/parity, test clocks/cards/accounts, and marketplace test entities;
- partial-refund limits, disputes/chargebacks, reserves, negative balances, and refund funding;
- gross/fee/net/reserve fields, cutoffs, payout timing, report retention, and stable reconciliation IDs;
- all fixed, transaction, authorization, refund, chargeback, payout, reserve, and minimum-volume charges;
- data residency, subprocessors, PCI scope, incident notice, audit evidence, and retention/deletion.

## 8. Shortlist

**Reasonable inference:** this order ranks public technical evidence and fit for the next evaluation step. It does not select or approve a production provider.

1. **ChariPay / Chari Money — primary sandbox candidate.** Best public technical evidence and clearest documented marketplace shape; it does not prove off-session recurring.
2. **NAPS — primary off-session-recurring commercial candidate.** Strong public feature claims and price visibility, gated on private technical docs and marketplace approval.
3. **Payzone — alternate recurring candidate.** Useful recurring controls, gated on API/webhook docs, marketplace support, and refund constraints.
4. **CMI — acquiring benchmark.** Broad acceptance/operations, but insufficient public integration, recurring-consent, and marketplace evidence.
5. **Aslan — marketplace challenger.** Strong stated marketplace operations, but technical, recurring, refund, and commercial evidence needs diligence.

## 9. Primary sandbox recommendation

Use ChariPay/Chari Money for the first **exploratory sandbox adapter** only after sandbox credentials and written permission for the intended test use. Validate hosted checkout, immutable IDs, idempotent creation, raw-body signature verification, duplicate/out-of-order delivery, lookup recovery, refunds, reconciliation, and a test submerchant settlement instruction.

Do not call this recurring-payment validation. ChariPay's public subscription model asks the customer to authorize each due payment through a new link and 3-D Secure. Taalim must either accept that behavior or separately validate a lawful off-session mandate with NAPS, Payzone, CMI, or another approved provider.

## 10. Final provider-neutral contract

`PaymentProvider` exposes:

- `capabilities`: checkout, recurring, refund, webhook, lookup, reconciliation, marketplace-settlement modes;
- `createCheckout`: hosted checkout with internal attempt ID and mandatory idempotency key;
- `getPayment`: authenticated state lookup for recovery/reconciliation;
- `chargeMandate` and `revokeMandate`: separate execution and consent-revocation operations;
- `refundPayment`: amount-specific, idempotent refund request;
- `verifyAndParseWebhook`: signature-first normalized event parsing;
- `listReconciliationEntries`: cursor-paged transactions, fees, reserves, settlements, and payouts.

Only opaque provider references cross the boundary. There are no raw card fields or arbitrary metadata bags. Capabilities keep customer reauthorization, provider scheduling, and true off-session mandates distinct.

## 11. Changes made

- Replaced fake-specific intent methods/states with the neutral contract.
- Added typed capabilities and payment/refund/event/reconciliation models.
- Expanded the fake adapter for checkout, lookup, mandates, revocation, refunds, signed webhooks, duplicate/out-of-order delivery, and reconciliation pagination.
- Kept live selection disabled and added no SDK or credential.
- Added focused safety-invariant tests.
- Made no database, UI, route, ledger, pricing, payout, or production-provider change.

## 12. Normalized event model

Events cover payment processing/success/failure/cancellation/expiry, mandate activation/revocation, refund processing/success/failure, dispute opened/won/lost, settlement available/paid/held, and `unknown`.

Every event has provider, provider event ID, occurrence time, and payload hash, plus applicable payment/refund/mandate/attempt/amount/currency/failure references. An authentic unknown event is retained as `unknown`, not guessed into a financial state.

## 13. Webhook, idempotency, and reconciliation

Production adapters must verify the exact raw body before parsing and enforce documented timestamp/replay rules. The application stores the event and uses `(provider, providerEventId)` uniqueness before side effects. Duplicate delivery returns success after confirming the stored event. Arrival order cannot regress a terminal state to processing; Issue #9 should query provider state when chronology or transition validity is uncertain.

Every mutating call has an application idempotency key. Adapters pass it through when supported and otherwise bind it locally to a request fingerprint/reference. Reusing a key with materially different input must fail.

Reconciliation compares attempts/refunds/payouts with provider transactions, fees, reserves, settlements, and payouts. Gross, fee, reserve, net settlement, availability, and payout are distinct facts. Settlement cannot synthesize payment success or overwrite financial-event history.

## 14. Settlement and payout separation

Learner collection, teacher-payable calculation, provider settlement, and teacher payout are four lifecycles. Marketplace split may reduce custody risk but does not replace Taalim's ledger. A collection-only provider does not authorize Taalim to hold and pay teacher funds.

No payout method exists in the contract while FD-21 and legal/provider responsibility are open. Add a future payout boundary only after deciding who onboards teachers, holds balances, and executes payouts.

## 15. Requires legal/accounting review and other blocking approvals

- FD-19 commission model/rate is not approved.
- FD-20 refund/cancellation policy is not approved.
- FD-21 provider and teacher-payout model is not approved.
- Provider acceptance of the exact marketplace, teacher, subscription, and refund use case is missing.
- Moroccan legal/regulatory, tax/VAT/invoicing, consumer, privacy, and accounting review is missing.
- Sandbox credentials, commercial/security documents, and an approved data-flow diagram are missing.

These gates block production credentials, a real adapter, live webhooks, charges, and payouts.

## 16. Questions for providers

1. Will you approve a Moroccan platform charging learners for independent-teacher subscriptions? Describe contracting/licensed roles.
2. Must each teacher be a submerchant, wallet holder, or beneficiary? Who performs KYC/KYB and sanctions screening?
3. Does Taalim receive/control funds? How are split, commission, refund, negative balance, and reserve represented?
4. Can monthly amounts be charged off-session without new action? What consent, mandate evidence, 3DS/SCA, notifications, limits, and reauthentication apply?
5. If not, is each cycle a hosted link? Who owns scheduling, retries, dunning, cancellation, and revocation?
6. Supply current API/OpenAPI, webhook, sandbox, reconciliation, and marketplace documents.
7. What signature/timestamp/raw-body scheme applies? Detail retries, ordering, duplicates, replay, retention, and redelivery.
8. Which operations are natively idempotent? State key scope/retention and changed-parameter behavior.
9. Can transactions be retrieved independently of webhooks? State retention and stable IDs.
10. Detail partial refunds, chargebacks, evidence, fees, reserves, negative balances, and refund funding.
11. Detail gross/fee/tax/reserve/net/availability/settlement/payout data, cutoffs, pagination, corrections, retention.
12. Quote all setup, monthly, authorization, transaction, international, recurring, refund, dispute, payout, reserve, minimum, termination charges and tax.
13. List sandbox entities and simulated success/failure/webhook/submerchant/split/refund/dispute/settlement cases.
14. Supply PCI evidence, security audit summary, residency/subprocessors, encryption/key management, incident SLA, retention/deletion.
15. Which written approvals or regulator notifications precede pilot/production, including principal-agent/use-case approval?
16. Who is merchant/seller of record, and who issues the learner invoice/receipt and teacher commission invoice? Confirm VAT, refund-note, and settlement/reserve ownership treatment for review by Moroccan counsel and accounting.

## 17. Proposed PR split

1. **Issue #4 contract/evidence (this change):** neutral types, fake adapter/tests, decision record; no schema/network adapter.
2. **Diligence artifact:** written provider answers, commercial/security/legal review, FD-19/20/21 decisions, sandbox approval.
3. **Sandbox adapter:** one provider module, config validation, contract tests, webhook fixtures; no live enablement.
4. **Issue #9 service/webhooks:** durable events, duplicate/out-of-order handling, lookup recovery, state guards, exactly-once ledger posting.
5. **Mandate migration/orchestration:** only if the approved provider supports the selected recurring model.
6. **Reconciliation/payout:** after ownership, settlement, and FD-21 are approved.
7. **Production enablement:** sign-offs, runbooks, alerts, pilot, rollback/kill switch, explicit launch approval.

## 18. Ready for sandbox adapter implementation?

**NO.** The contract and candidate choice are ready, but implementation waits for usable ChariPay/Chari Money sandbox credentials and written permission to test the marketplace/submerchant flow. Off-session recurring remains a separate track and cannot be inferred from customer-reauthorization subscriptions.

## 19. Ready for live integration?

**NO.** Provider acceptance, terms, security evidence, recurring authority, marketplace/payout responsibility, FD-19/20/21, legal/regulatory/tax/accounting review, production credentials, runbooks, and a tested sandbox adapter are unresolved. Live selection and charges remain disabled.

## Sources reviewed

- Bank Al-Maghrib supervision report: <https://www.bkam.ma/content/download/828688/9035256/Rapport%20DSB%202024.pdf>
- CMI: <https://www.cmi.co.ma/fr/solutions-paiement-ecommerce>, <https://www.cmi.co.ma/sites/default/files/cmi_solutions_livret_e-com.pdf>, <https://testpayment.cmi.co.ma/fim/est3dteststoreutf8?pagelang=en>
- NAPS: <https://naps.ma/paiements-en-ligne/>
- Payzone: <https://payzone.ma/paiement-recurrent-fr/>, <https://payzone.ma/payzone-e-com/>, <https://payzone.ma/documentation/>, <https://developers.payzone.ma/files/GUIDE_UTILISATEUR_BACK_OFFICE_PAYZONE.pdf>, <https://payzone.ma/faqs/>
- ChariPay: <https://charipay.ma/en/developpeurs>, <https://charipay.ma/en/api-docs>, <https://charipay.ma/en/api-docs/checkout-sessions>
- Chari Money: <https://www.baas.ma/fr/paiement-marketplace-maroc>, <https://www.baas.ma/fr/api-docs>
- Aslan: <https://aslan.ma/marketplace>, <https://doc.aslan.ma/>
- Stripe global availability: <https://stripe.com/global>
