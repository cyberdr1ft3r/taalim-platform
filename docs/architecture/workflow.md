# Branch and review workflow

- One issue per branch. This foundation is Issue #2 on `cursor/app-foundation-issue-2-53a7`.
- Record the owner, agent, branch, base commit, dependencies, shared surfaces, blockers, and next action on the pull request.
- Pull requests stay open for human review. Do not merge or deploy automatically.
- Required checks are the harness workflow and Application CI: install, migrate, lint, typecheck, Vitest, build, Playwright, and `node scripts/check-harness.mjs`.
- Shared edits to `STATUS.md`, `PROJECT_MEMORY.md`, `README.md`, `docs/adr/README.md`, the lockfile, and the Prisma schema need coordination before merge. Issue #1's pull request is merged. This foundation is draft pull request #20.
- Re-check current `main` before the final review and rerun the checks above.

Repository settings such as required status checks and branch protection are configured by a person in GitHub. This document does not make those settings exist.
