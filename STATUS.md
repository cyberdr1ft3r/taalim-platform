# STATUS.md

> Snapshot: 2026-10-08. GitHub is authoritative for live issue/PR/review/merge state.

## Current phase

The product baseline (#1), AI harness (#17), application architecture/foundation (#2), harness cleanup (#21), Issue #3 core data model, and Issue #4 payment-provider preflight/contract are merged on `main`.

Current `main` base for Issue #5 implementation: `023aec9ea619c53d19ae31ce41ca87acd363ceec`.

## Active work

- Issue: #5 — authentication, guardian/payer relationships, and server-side authorization.
- Branch: `feat/issue-5-auth-authorization`, delivered as a draft PR.
- Founder decisions still open: FD-03 minors, FD-10 student second factor, FD-11 device/session restrictions.
- Next action: human review of the draft PR, plus Clerk dashboard configuration for MFA enrollment. Do not merge automatically.

## Architecture posture

- ADR 0003 is Accepted and canonical for the application stack.
- ADR 0001 and ADR 0002 remain Proposed.
- Clerk establishes identity; Taalim server code authorizes. See `docs/architecture/authentication.md`.
- Production storage is deliberately undecided; development uses the private local provider.
- Production payment provider/legal funds flow remain undecided; fake payments only for development/tests.
- Background jobs use committed PostgreSQL leases with idempotent handlers.
- Launch locales are Arabic (RTL) and French. English remains architecture-ready but not launch-enabled.

## Next gate

Review of the Issue #5 draft PR. Unresolved beside FD-03/FD-10/FD-11: Clerk tenant MFA enrollment is dashboard state, in-process rate limiting assumes a single web process, and account-suspension semantics beyond Clerk-side suspension wait on schema/product decisions.
