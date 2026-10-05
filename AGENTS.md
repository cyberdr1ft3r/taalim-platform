# AGENTS.md — Canonical Development Policy

This file is the source of truth for human developers and coding agents working on Taalim. Thin tool-specific entry points may point here but must not duplicate policy.

## 1. Required reading before work

Read, in order:
1. `STATUS.md`
2. `PROJECT_MEMORY.md`
3. The assigned GitHub issue and its dependencies
4. Relevant files under `docs/skills/`
5. Accepted ADRs under `docs/adr/`

If these sources disagree, stop and surface the conflict. Do not silently reconcile contradictory requirements.

## 2. Issue ownership and isolation

- One issue per branch and isolated worktree.
- Before coding, record on the issue/PR: owner, agent/session, branch, base commit, dependencies, touched shared surfaces, blockers, and next action.
- Assignment means ownership, not that work has started.
- Do not edit another agent's branch or depend on an unmerged branch unless explicitly approved.
- Shared schema, migrations, shared contracts, root configuration, dependency lockfiles, navigation, and cross-cutting adapters require coordination before editing. Prefer merging an agreed interface first.
- Re-check current `main` before final review, integrate relevant changes, and rerun applicable verification on the final PR commit.

## 3. Workflow states

Backlog → Ready → In progress → In review → Done. Use Blocked when a dependency or decision prevents progress.

Done means merged work plus acceptance evidence. A branch or PR alone is not Done.

## 4. Architecture boundaries

Issue #2 owns the application stack and architecture baseline. Do not opportunistically swap frameworks, providers, package managers, ORM versions, auth systems, or core infrastructure inside feature work. Propose architecture changes separately with current documentation, migration impact, and founder review.

### Authentication and authorization

Authentication establishes identity. Taalim server-side application logic decides authorization.

- UI hiding is not authorization.
- Possession of an object ID, storage key, URL, meeting link, or payment reference is not authorization.
- Every private read/write/action must be checked server-side against the relevant business relationship or permission.

### Storage boundary

Feature code must use the canonical storage service defined by Issue #2.

Agents must not:
- import Supabase, S3, R2, or other object-storage SDKs directly into feature modules;
- write directly to the filesystem from feature modules;
- persist permanent provider URLs or absolute filesystem paths as file identity;
- create public storage paths/buckets to bypass application authorization.

Provider-specific code belongs only inside storage provider implementations. Production storage remains a deployment/configuration choice unless an accepted architecture decision says otherwise.

### Payment boundary

Feature code must use the canonical payment adapter. Provider SDK calls, signatures, webhook normalization, and provider-specific identifiers stay inside provider integration modules. Development and tests use fake/sandbox adapters until live capability and approval gates are satisfied.

## 5. Security and privacy

Never commit or place in agent context:
- production secrets or access tokens;
- real learner/teacher identity documents;
- raw card data or CVV;
- privileged storage credentials;
- sensitive signed URLs;
- production personal data in fixtures.

Use synthetic data. Redact logs and evidence. Treat teacher verification material, learner records, submissions, payment records, and private classroom content as sensitive.

## 6. Scope discipline

Implement only the assigned issue and the minimum supporting changes needed for its acceptance criteria. Do not smuggle unrelated refactors or deferred product features into a PR.

If a requirement is unclear, preserve the ambiguity in documentation and ask for a decision rather than inventing a product rule.

## 7. Evidence and review

Every PR must state:
- issue and owner;
- dependencies;
- included and excluded scope;
- shared surfaces touched;
- tests/checks run and results;
- security/privacy impact;
- blockers/unresolved decisions;
- next action.

No automatic merge and no automatic deployment. Keep implementation PRs open for human review unless explicitly instructed otherwise.

## 8. Harness validation

Run:

```bash
node scripts/check-harness.mjs
```

The harness check validates required coordination files, conflict markers, local Markdown references, and thin agent entry points. A passing harness check does not replace feature-specific lint, type, test, build, migration, or security checks.

## 9. Tool-specific entry points

`CLAUDE.md` and `.cursor/rules/taalim.mdc` are intentionally thin. If they contradict this file, `AGENTS.md` wins and the contradiction must be fixed.
