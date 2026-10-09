# STATUS.md

> Snapshot: 2026-10-09. GitHub is authoritative for live issue/PR/review/merge state.

## Current phase

The product baseline (#1), AI harness (#17), application architecture/foundation (#2), harness cleanup (#21), Issue #3 core data model, Issue #4 payment-provider preflight/contract, and the Issue #5 authorization implementation are merged on `main`.

Current `main` for the Issue #5 acceptance follow-up: `ed52cefac0224ebc6f7431311932825c7e248d3a`.

## Active work

- Issue: #5 remains open. The authorization implementation is merged. This follow-up does not rewrite it.
- Still open: Ali's explicit approval of the proposed FD-03, FD-10, and FD-11 positions; Clerk development-instance dashboard configuration; the real-instance acceptance run in `docs/architecture/authentication-acceptance.md`.
- Next action: Ali approves or rejects those three proposals, then configures the Clerk development instance and runs the acceptance scenarios. Do not close #5 automatically.

## Architecture posture

- ADR 0003 is Accepted and canonical for the application stack.
- ADR 0001 and ADR 0002 remain Proposed.
- Clerk establishes identity; Taalim server code authorizes. See `docs/architecture/authentication.md`.
- Production storage is deliberately undecided; development uses the private local provider.
- Production payment provider/legal funds flow remain undecided; fake payments only for development/tests.
- Background jobs use committed PostgreSQL leases with idempotent handlers.
- Launch locales are Arabic (RTL) and French. English remains architecture-ready but not launch-enabled.

## Next gate

Issue #5 cannot close until Ali explicitly accepts or rejects the proposed FD-03, FD-10, and FD-11 positions, a real Clerk development instance is configured, and the acceptance scenarios in `docs/architecture/authentication-acceptance.md` are run on that instance. In-process rate limiting still assumes a single web process. Account-suspension semantics beyond Clerk-side suspension still wait on schema and product decisions.
