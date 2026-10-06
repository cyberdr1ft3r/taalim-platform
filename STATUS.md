# STATUS.md

## Current phase

Product baseline / pre-development. The repository harness is active on `main`.

## Active issues

- #17 — AI development harness and two-developer coordination workflow: merged. Harness is active (PR #18).
- #1 — MVP scope and business-rule decisions: in progress on `cursor/mvp-scope-issue-1-53a7`.

## Blocked implementation

Issue #2 remains blocked on #1 until the founder accepts ADR 0001 and ADR 0002 and settles the product decisions that block #2. The launch-language decision (FD-01) is the decision #2's localization work depends on. Other open decisions block later issues only. See [the founder decision log](docs/product/founder-decision-log.md).

Application scaffold should not begin before that founder review. #17 is no longer the blocker.

## Current architecture posture

- Application stack baseline lives in #2 and is not implemented yet.
- Production storage provider: undecided by design.
- Payment provider: undecided by design. Legal funds-flow is also unapproved.
- No application code, schema, migrations, or production infrastructure yet.
- Accepted product rules so far: [ADR 0001](docs/adr/0001-mvp-subscription-and-supply-rules.md) and [ADR 0002](docs/adr/0002-paid-access-and-private-content.md).

## Next action

Founder review of the MVP baseline and the decision log. Do not start #2, and do not merge the #1 pull request, until that review records which decisions are accepted.
