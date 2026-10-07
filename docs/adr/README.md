# Architecture Decision Records

Accepted product and architecture decisions live here after founder approval is recorded. A record with status Proposed is not yet that approval.

Use sequential filenames such as `0001-example-decision.md` with:

- Status: Proposed / Accepted / Superseded
- Context
- Decision
- Consequences
- Alternatives considered
- Related issues/PRs

Do not use ADRs as task logs. Unresolved questions remain in the relevant issue until decided.

## Proposed product records

- [0001 — MVP subscription and supply rules](0001-mvp-subscription-and-supply-rules.md) — Proposed, not Accepted. Teacher-set MAD prices, no minimum enrolment, verification before selling, rolling monthly billing, cancellation at the end of the paid period, and price protection for in-force subscribers.
- [0002 — Paid access and private-content semantics](0002-paid-access-and-private-content.md) — Proposed, not Accepted. Entitlement and private-file access without a storage-vendor choice.

No founder approval is recorded for these records. Until status moves to Accepted, they are not product truth.

Open product questions are listed in [the founder decision log](../product/founder-decision-log.md). A Proposed ADR is a candidate decision. It does not close an item that the decision log still marks as a founder choice.

## Accepted architecture record

- [0003 — Application architecture baseline](0003-application-architecture-baseline.md) — Accepted for the Issue #2 stack and boundaries. It is implemented on draft pull request #20 and is not merged. Accepting this record does not accept ADR 0001 or ADR 0002.
