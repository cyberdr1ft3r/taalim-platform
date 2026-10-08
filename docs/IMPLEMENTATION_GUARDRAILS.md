# Implementation Guardrails

This is a compact special-handling guide. It does not replace issue bodies, accepted ADRs or the founder decision log.

## Authority

- Issue #2 / PR #20 is merged. ADR 0003 and its storage, payment, committed-lease job, localization, configuration and testing boundaries are canonical.
- ADR 0001 and ADR 0002 remain Proposed unless founder approval is explicitly recorded.
- GitHub is authoritative for live task/PR state.

## Global rules

1. Do not start an issue until dependencies are merged and required founder decisions are accepted or explicitly deferred.
2. Run a preflight before coding: decisions, shared contracts, overlap risk, scope and verification.
3. Reuse the Issue #2 stack/boundaries. Do not swap core architecture inside feature work.
4. Clerk establishes identity; Taalim server code authorizes.
5. Feature code uses canonical storage/payment abstractions.
6. Jobs preserve committed lease ownership; handlers are idempotent.
7. Arabic/French are launch locales; English is not launch-enabled.
8. Tests use synthetic data and refuse production databases.
9. Never encode unresolved founder choices as schema defaults, constants or UI assumptions.

## Issue-specific handling

| Issue | Special handling |
| --- | --- |
| #3 | **Mandatory design preflight before migrations.** Do not freeze FD-02, FD-09 recovery anchor, FD-24 rounding or FD-25 short-month behavior into schema. Keep stored-object identity provider-neutral. |
| #4 | Reuse the canonical PaymentProvider. Validate real provider/legal capability; keep live charges disabled. |
| #5 | Reuse Clerk identity boundary. Resolve/scope FD-02, FD-03, FD-10 and FD-11 before affected implementation. |
| #6 | Use #3 stored-object metadata + #2 storage. FD-18, FD-22, FD-23 gate affected paths. Quarantine/scanning is explicit state. |
| #7 | Build on #3/#6. Do not invent FD-04, FD-07, FD-12, FD-17 or FD-18 behavior. |
| #8 | Reuse `next-intl` AR/FR architecture. Respect FD-16, FD-17, FD-19 and FD-23 on public display. |
| #9 | Build on payment abstraction + committed-lease jobs. Normalize provider events at the boundary; process durably/idempotently. |
| #10 | Separate seat reservation, payment confirmation, subscription activation and entitlement. FD-15/commission remain decision gates; concurrency tests required. |
| #11 | **High-risk concurrency.** Durable idempotent jobs/events; gate FD-04, FD-05, FD-06, FD-08, FD-09 anchor and FD-25. |
| #12 | Reuse storage authorization + stored-object model. Gate FD-07, FD-12, FD-13 and FD-17. |
| #13 | **Ledger-first.** Resolve FD-19, FD-20 and FD-24 before financial formulas. Provider settlement and Taalim accounting are separate facts. |
| #14 | Reuse #5 authorization and #13 financial services. Sensitive audit entries are append-oriented. |
| #15 | Durable idempotent notification jobs. FD-26 decides channels. Metrics read authoritative domain/ledger data. |
| #16 | Validate actual configured providers/deployment. Require recovery, authorization, monitoring, rollback, provider/legal approval and no critical defects. |

## Preflight template

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

If `Ready to code` is NO, do not invent a product rule to unblock yourself.
