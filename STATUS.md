# STATUS.md

> Snapshot: 2026-10-08. GitHub is authoritative for live issue/PR/review/merge state.

## Current phase

The product baseline (#1), AI harness (#17), application architecture/foundation (#2), harness cleanup (#21), and Issue #3 core data model are merged on `main`.

Current `main` base for Issue #4 implementation: `d71e0d399a513f3239afe07bf15eebaf5f2e2a89`.

## Active work

- Issue: #4 — Morocco payment-provider capability preflight and provider-neutral payment contract.
- Branch: `feat/issue-4-payment-provider-preflight`.
- Founder decisions still open: FD-19 commission, FD-20 refund policy, and FD-21 provider/funds-flow responsibility.
- Next action: human review of the draft PR and direct provider/legal/accounting diligence. Do not merge automatically.

## Architecture posture

- ADR 0003 is Accepted and canonical for the application stack.
- ADR 0001 and ADR 0002 remain Proposed.
- Clerk establishes identity; Taalim server code authorizes.
- Production storage is deliberately undecided; development uses the private local provider.
- Production payment provider/legal funds flow remain undecided; fake payments only for development/tests.
- Background jobs use committed PostgreSQL leases with idempotent handlers.
- Launch locales are Arabic (RTL) and French. English remains architecture-ready but not launch-enabled.

## Next gate

The provider-neutral contract is ready for review. A sandbox adapter is not ready until credentials and written marketplace test approval are available; live payments remain blocked by provider, legal/accounting, security, operational, and FD-19/20/21 gates.
