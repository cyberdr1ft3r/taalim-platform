# Development Operations Skill

Use this for branches, worktrees, CI, configuration, deployment/recovery documentation, and shared developer workflow.

## Workflow
- One issue per branch/worktree.
- Record branch and base commit before changes.
- Coordinate shared root/config/schema/lockfile edits.
- No automatic merge or deployment.
- Keep development/test/staging/production configuration separate.
- Never use production secrets/data for local development or CI.
- Verify final PR against current `main` and rerun relevant checks.

## Repository harness
Run `node scripts/check-harness.mjs` locally. CI must run the same command so local and remote policy validation agree.

Document repository settings that humans must configure separately; do not claim a documented rule is technically enforced when it is not.
