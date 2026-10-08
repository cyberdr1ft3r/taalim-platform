# Implementation Guardrails

This file is a durable coordination layer between the product baseline, accepted architecture, GitHub issues, and coding agents. It does not replace issue bodies, ADRs, or the founder decision log.

Use it to identify issues that need extra preflight, unresolved founder decisions, shared-surface coordination, or architecture-specific handling before implementation.

## Status and authority

- Product rules and unresolved founder choices live in `docs/product/mvp-scope.md` and `docs/product/founder-decision-log.md`.
- Accepted architecture decisions live in `docs/adr/`.
- Issue #2 / PR #20 is still under review. Until it is merged, its implementation is not canonical on `main`.
- After Issue #2 merges, ADR 0003 and the canonical storage/payment/job/localization contracts from that PR become the application architecture baseline.
- ADR 0001 and ADR 0002 remain Proposed unless founder approval is explicitly recorded.

If this file conflicts with an accepted ADR, the accepted ADR wins. If it conflicts with a founder decision, stop and reconcile the conflict.

## Global implementation rules

1. Do not start an issue until its GitHub dependencies are merged and every founder decision required by that issue is either accepted or explicitly deferred by the issue.
2. Run a short preflight before coding: identify required founder decisions, shared schema/contracts, touched cross-cutting surfaces, and parallel-agent overlap.
3. Feature work must use the canonical architecture from Issue #2. Do not replace Next.js, Clerk, Prisma/PostgreSQL, pnpm, the storage/payment boundaries, or the PostgreSQL job foundation inside a feature PR.
4. Clerk establishes identity. Taalim server code authorizes business actions and private data access.
5. Feature modules use the canonical `StorageProvider`; no direct filesystem/S3/R2/Supabase SDK use outside provider implementations.
6. Feature modules use the canonical payment abstraction; live provider SDKs and normalized provider events stay in integration modules.
7. Background jobs must preserve committed lease/ownership semantics from the final Issue #2 implementation. Feature handlers must be idempotent.
8. Arabic and French are the launch locales. Arabic is RTL. English stays architecture-ready but is not launch-enabled unless a later founder decision changes that.
9. Tests use synthetic data and must refuse production databases.
10. Do not turn unresolved product questions into schema constraints, defaults, numeric constants, or UI assumptions.

## Issue-specific handling

| Issue | Special handling before implementation |
| --- | --- |
| #3 Core schema/state | **Mandatory design preflight before migrations.** Map every proposed table/state/constraint to accepted product rules or a clearly infrastructure-only need. Do not freeze FD-02, FD-09 recovery anchor, FD-24 rounding, or FD-25 short-month behavior into schema before founder decisions. Keep stored-object identity provider-neutral. |
| #4 Payment provider validation | Reuse the PaymentProvider contract from #2 after merge; do not redefine application-wide payment concepts casually. This issue validates real provider/legal capability and may extend the adapter through a separately reviewed architecture change when required. Live charges remain disabled. |
| #5 Auth/authorization | Reuse Clerk identity boundary from #2. Before implementation resolve or explicitly scope FD-02, FD-03, FD-10, and FD-11. Never model Clerk roles/metadata as the sole Taalim authorization source. |
| #6 Teacher verification | Use #3 stored-object metadata and #2 storage service. FD-18, FD-22, and FD-23 must be decided or explicitly deferred for the affected paths. Quarantine/scanning state is business-visible security state; do not treat upload success as document approval. |
| #7 Class lifecycle | Requires #3 + #6. Do not invent stop-renewal/reactivation/schedule/recording/preview/curriculum behavior. Check FD-04, FD-07, FD-12, FD-17, FD-18 before implementing affected transitions. |
| #8 Marketplace UI | Reuse next-intl and AR/FR locale architecture from #2. Do not add a second localization system. Review/review-count/preview/commission/verification-copy display must respect FD-16, FD-17, FD-19, FD-23. Public pages must never infer private or unverified data. |
| #9 Payment events | Build on #2 payment abstraction and final job model. Provider callbacks are normalized at the integration boundary, then durable/idempotent domain processing occurs server-side. Do not trust browser redirects. |
| #10 Checkout/activation | Treat seat reservation, payment confirmation, subscription creation, and entitlement creation as separate state transitions. FD-15 and commission decisions must not be invented. Concurrency tests are mandatory. |
| #11 Renewals/grace | **High-risk concurrency issue.** Use durable idempotent jobs/events. Resolve or explicitly gate FD-04, FD-05, FD-06, FD-08, FD-09 recovery anchor, and FD-25. The source-backed three-day grace length itself is not an open choice. |
| #12 Classroom/resources | Reuse #2 storage authorization boundary and #3 stored-object metadata. FD-07, FD-12, FD-13, and FD-17 gate affected behavior. No direct public URLs, storage paths, or provider-specific file logic in feature code. |
| #13 Refunds/settlements | **Ledger-first handling.** Never derive balances only from mutable subscription state. Resolve FD-19, FD-20, and FD-24 before locking financial formulas. Provider settlement and Taalim accounting are separate facts. |
| #14 Founder admin/audit | Reuse authorization model from #5. Audit records for sensitive actions should be append-oriented and must capture actor/reason/outcome. Financial admin actions depend on accepted refund/settlement behavior from #13. |
| #15 Notifications/metrics | Use durable jobs/events; notification retries must be idempotent. FD-26 decides launch channels. Metrics read authoritative domain/ledger data rather than becoming a second financial source of truth. |
| #16 Pilot readiness | Validate the **actual configured** production/staging provider choices and deployment topology. Do not assume local filesystem behavior. Release readiness requires recovery evidence, authorization tests, legal/provider approval, monitoring, rollback, and no critical unresolved defects. |

## Shared-surface warnings

Coordinate before changing:

- `prisma/schema.prisma` and migrations
- shared domain state-machine definitions
- canonical storage/payment contracts
- background job infrastructure
- root package/config/lockfile
- localization routing and navigation
- global auth middleware/proxy
- common audit/logging contracts

Prefer a small agreed interface PR before parallel feature work when two issues need the same shared contract.

## Preflight template for future agents

Before coding, write into the issue/PR:

```text
Issue:
Owner / agent session:
Branch:
Base commit:
Merged dependencies:
Founder decisions required:
Accepted architecture contracts reused:
Shared surfaces:
Parallel work / overlap risk:
Blocked decisions:
Implementation scope:
Explicit non-goals:
Verification plan:
Ready to code: YES/NO
```

If `Ready to code` is NO, do not solve the blocker by inventing a product rule.
