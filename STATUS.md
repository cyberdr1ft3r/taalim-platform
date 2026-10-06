# STATUS.md

## Current phase

Founder review of the MVP baseline. The repository harness is active on `main`.

## Active issues

- #17 — AI development harness and two-developer coordination workflow: merged. Harness is active (PR #18).
- #1 — MVP scope and business-rule decisions: in founder review on `cursor/mvp-scope-issue-1-53a7` (PR #19).

## Blocked implementation

Issue #2 remains blocked only on FD-01, the launch-language decision. Issue #2's localization work depends on that decision, and the founder has not accepted it.

The source-backed recommendation, still unaccepted, is Arabic and French launch copy, with English architecture-ready and deferred unless interviews show demand.

Other open decisions block later issues only. They do not block the scaffold, the fake payment adapter, or the provider-neutral storage boundary. See [the founder decision log](docs/product/founder-decision-log.md).

#17 is no longer the blocker.

## Current architecture posture

- Application stack baseline lives in #2 and is not implemented yet.
- Production storage provider: undecided by design.
- Payment provider: undecided by design. No production route is approved. Legal and accounting review is required before the first paid customer. Live charges stay disabled.
- No application code, schema, migrations, or production infrastructure yet.
- [ADR 0001](docs/adr/0001-mvp-subscription-and-supply-rules.md) and [ADR 0002](docs/adr/0002-paid-access-and-private-content.md) are Proposed. They are not Accepted.

## Next action

Founder review of the MVP baseline and the decision log, starting with FD-01. Do not merge PR #19. Do not start #2 until FD-01 is accepted.
