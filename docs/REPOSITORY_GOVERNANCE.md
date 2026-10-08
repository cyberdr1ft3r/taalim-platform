# Repository Governance

## Documented workflow

- Human review is required before merge.
- No automatic deployments from feature branches.
- One issue per branch/worktree.
- Shared contracts/config/schema/lockfile changes require coordination.
- Final review must use the latest relevant `main` and include rerun evidence.
- GitHub owns live issue/PR/review/merge state; repository snapshots must not override it.

## Observed enforcement state

As checked on 2026-10-08, GitHub reports `main` as unprotected with enforcement off. The written workflow is therefore policy, not a technical barrier.

Do not claim branch protection or required checks are enforced until the settings are read back from GitHub.

## Target settings for `main`

Configure GitHub branch protection/rulesets to:
- require a pull request before merge;
- require the application CI and harness checks that actually run in this repository;
- block force pushes and branch deletion;
- dismiss stale approvals after material changes where supported;
- require at least one human approval when a second human reviewer is realistically available;
- define founder/admin bypass behavior explicitly rather than leaving it accidental;
- restrict deployment environments/secrets separately from feature-branch CI.

For Taalim, Ali and Anass can cross-review risky changes. Two AI sessions using the same GitHub identity are not two independent human approvals.

## Verification

After changing settings:
1. read back the branch/ruleset configuration;
2. confirm the exact required check contexts match current workflows;
3. test that a failing required check blocks merge;
4. record bypass permissions;
5. update this document only if the durable governance model changes.
