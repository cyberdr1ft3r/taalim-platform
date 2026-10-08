# STATUS.md

> Snapshot: 2026-10-08. GitHub is authoritative for live issue/PR/review/merge state.

## Current phase

The product baseline (#1), AI harness (#17), and application architecture/foundation (#2) are merged on `main`.

Current `main` foundation commit: `3473e7e625244e50b8c82ac40db45bfe5f669131`.

## Current coordination work

- #21 — reconcile backlog with architecture and implementation guardrails.
- The guardrails/context-loading cleanup is documentation/harness work only.
- #3 business schema work has not started.

## Architecture posture

- ADR 0003 is Accepted and canonical for the application stack.
- ADR 0001 and ADR 0002 remain Proposed.
- Clerk establishes identity; Taalim server code authorizes.
- Production storage is deliberately undecided; development uses the private local provider.
- Production payment provider/legal funds flow remain undecided; fake payments only for development/tests.
- Background jobs use committed PostgreSQL leases with idempotent handlers.
- Launch locales are Arabic (RTL) and French. English remains architecture-ready but not launch-enabled.

## Next gate

Complete and review the harness/guardrails cleanup, then run the mandatory design preflight for Issue #3 before any business migration is written.
