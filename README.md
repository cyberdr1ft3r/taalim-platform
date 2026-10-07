# Taalim Platform

Morocco-focused online education marketplace and learning platform.

## Start here

All human and AI contributors must read `AGENTS.md` first, then `STATUS.md`, the relevant GitHub issue, and any applicable skill files under `docs/skills/`.

Issue #2 owns the application architecture and scaffold. Local setup is documented in `docs/architecture/local-development.md`. The accepted baseline is `docs/adr/0003-application-architecture-baseline.md`.

## Current workflow

- One issue per branch/worktree.
- Record owner, agent/session, branch, base commit, dependencies, shared surfaces, blockers, and next action on the issue/PR.
- No automatic merges or deployments.
- Run `node scripts/check-harness.mjs` before review.

See `AGENTS.md` for the canonical rules.
