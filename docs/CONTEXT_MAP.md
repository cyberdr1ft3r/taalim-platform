# Context Map

Use this map after reading the current GitHub task. Load only the rows relevant to the work. Search further when the listed context is insufficient.

| Work type | Read first | Key implementation surfaces | Required verification emphasis |
| --- | --- | --- | --- |
| Schema / state machines | Issue #3, founder decision log, ADR 0003, implementation guardrails | `prisma/schema.prisma`, migrations, domain state definitions | design preflight, clean migration chain, constraints, transaction/race tests, production-DB refusal |
| Authentication / permissions | Issue #5, ADR 0003, security/privacy skill | Clerk identity helpers, server authorization modules, proxy | negative cross-user tests, escalation/recovery abuse, server-side authorization |
| Private files / verification docs | Issues #6/#12, storage architecture, #3 stored-object model | `src/server/storage/`, authorization services | key/path tampering, cross-owner access, expiry, private-root/provider boundary |
| Payment provider / events | Issues #4/#9, payment architecture, billing-ledger skill | `src/server/payments/`, provider integrations, event processing | callback authenticity, duplicates/out-of-order events, idempotency, reconciliation |
| Checkout / subscriptions / renewals | Issues #10/#11, accepted product decisions, payment/job contracts | subscription/entitlement services, background jobs | final-seat race, retries vs cancel, stale jobs, late events, billing anchors |
| Refunds / settlements | Issue #13, founder decision log, billing-ledger skill | ledger/financial event services | rounding, partial/full refund, reserves, negative balances, reconciliation |
| Marketplace / UI | Issues #7/#8, locale architecture, product scope | App Router pages/components, `next-intl` routing | Arabic RTL, French LTR, accessibility, loading/empty/error/denied states |
| Background jobs | ADR 0003, process architecture | `src/server/jobs/` | committed lease visibility, ownership guard, stale reclaim, max attempts, idempotency |
| Admin / audit | Issue #14, auth model, ledger rules | admin services, audit events | unauthorized actions, immutable/append-oriented audit evidence, impersonation restrictions |
| Notifications / metrics | Issue #15, job model, authoritative ledger/domain sources | notification handlers, reporting queries | deduplication/retry, no sensitive payload leakage, metric reconciliation |
| Release / recovery | Issue #16, runbooks, actual provider/deployment config | CI/deployment/recovery paths | migration/rollback, DB + object restore, authorization after restore, monitoring/smoke |
| Harness / docs | AGENTS, governance, guardrails, roadmap | `scripts/check-harness.mjs`, templates, CI | structural lint, broken links, adapter drift, source-authority consistency |

## Shared surfaces

Coordinate before editing:
- Prisma schema/migrations;
- storage/payment contracts;
- background-job infrastructure;
- root package/config/lockfile;
- localization routing/navigation;
- global auth proxy;
- audit/logging contracts.

When two issues need the same shared interface, agree and merge the smallest interface first before parallel consumers.
