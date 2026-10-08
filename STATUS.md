# STATUS.md

> Snapshot: 2026-10-08. GitHub is authoritative for live issue/PR/review/merge state.

## Current phase

The product baseline (#1), AI harness (#17), application architecture/foundation (#2), harness cleanup (#21), and Issue #3 design preflight are merged on `main`.

Current `main` base for Issue #3 implementation: `43fbfd93fd35254adac3dc1f7fe5758aef47709e`.

## Active work

- Issue: #3 — core entities, money records, subscription states, and provider-neutral stored-object metadata.
- Implementation PR: #26 on `feat/issue-3-core-data-model`.
- Current reviewed head: `2e1def9a3b2c570f4a4be1be2a94701c6d5fae27`.
- Founder decisions used: FD-02, FD-24, FD-25 Accepted; FD-09 post-failure recovery anchor remains deferred to #11.
- GitHub Actions on the current head: Harness checks PASS; Application CI PASS.
- Next action: human review of PR #26. Do not merge automatically.

## Architecture posture

- ADR 0003 is Accepted and canonical for the application stack.
- ADR 0001 and ADR 0002 remain Proposed.
- Clerk establishes identity; Taalim server code authorizes.
- Production storage is deliberately undecided; development uses the private local provider.
- Production payment provider/legal funds flow remain undecided; fake payments only for development/tests.
- Background jobs use committed PostgreSQL leases with idempotent handlers.
- Launch locales are Arabic (RTL) and French. English remains architecture-ready but not launch-enabled.

## Next gate

After PR #26 is reviewed and merged, Issue #3 can close and downstream schema consumers (#5/#6/#7/#9/#10/#11/#12/#13) may build on the merged contracts subject to their own founder-decision gates.
