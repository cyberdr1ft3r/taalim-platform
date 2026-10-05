# Repository Governance

## Documented workflow

- Human review is required before merge.
- No automatic deployments from feature branches.
- One issue per branch/worktree.
- Shared contracts/config/schema/lockfile changes require coordination.
- Final review must use the latest relevant `main` and include rerun evidence.

## Settings that maintainers must configure in GitHub

These are policy targets, not assumed to be enforced merely because they are written here:

- Protect `main` against force pushes and direct destructive updates.
- Require pull requests before merge.
- Require at least one approving review for application work when repository/account capabilities allow.
- Require passing CI checks, including the harness check and later application checks from #2.
- Dismiss stale approvals when materially changed code requires re-review, where supported.
- Restrict deployment environments/secrets to approved branches and reviewers where available.

After configuration, verify the actual repository settings and record evidence in the relevant setup PR/issue. Do not state that a protection exists unless it has been checked.
