# STATUS.md

## Current phase

Harness bootstrap / pre-development.

## Active issues

- #17 — AI development harness and two-developer coordination workflow: in progress on `chore/issue-17-ai-harness`.
- #1 — MVP scope and business-rule decisions: may proceed in parallel.

## Blocked implementation

Application scaffold (#2) should not begin until the minimal #17 harness is reviewed and #1 provides the required product decisions.

## Current architecture posture

- Application stack baseline lives in #2 and is not implemented yet.
- Production storage provider: undecided by design.
- Payment provider: undecided by design.
- No application code, schema, migrations, or production infrastructure yet.

## Next action

Complete #17, run `node scripts/check-harness.mjs`, open PR, and obtain founder review.
