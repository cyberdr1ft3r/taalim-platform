# PROJECT_MEMORY.md

## Product

Taalim is a Morocco-focused online education marketplace and learning platform connecting students with verified teachers. The marketplace, subscriptions, classroom access, payments, teacher settlement, and administration are first-class product concerns.

## Current stage

Pre-development. The Issue #17 harness is on `main`. Issue #1 is defining the MVP baseline and is in founder review. Issue #2 stays blocked on the launch-language decision until the founder accepts it. Core schema/state modeling is Issue #3.

## Working principles

- Keep the early product a modular monolith unless evidence requires otherwise.
- Identity, application authorization, storage, and payment concerns are separate boundaries.
- Production storage provider is deliberately undecided; feature code must remain provider-neutral.
- Payment provider is deliberately undecided; development uses fake/sandbox adapters.
- No native video, AI features, mobile apps, or infrastructure expansion merely because they are possible.
- Use synthetic development/test data only.
- Backlog rules already stated for the MVP, and only proposed until founder acceptance: teacher-set MAD prices, no minimum enrolment, verification before selling, rolling monthly billing, cancellation at the end of the paid period, and price protection for in-force subscribers.
- Paid access follows trusted payment state. Private learning and verification files stay behind application authorization.
- Storage and payment providers remain undecided. Live charges stay off until written provider confirmation and legal and accounting review.

## Collaboration

Ali/cyberdr1ft3r and Anass work in parallel with independent agents. Issue ownership, dependency order, shared-surface coordination, and human review are mandatory. Detailed task handoffs belong in issues/PRs, not in this file.

## Where decisions live

- Current operational state: `STATUS.md`
- Goals: `docs/GOALS.md`
- Roadmap: `docs/ROADMAP.md`
- Risks: `docs/RISKS.md`
- Proposed product records, not yet Accepted: [docs/adr/](docs/adr/README.md)
- MVP baseline: [docs/product/mvp-scope.md](docs/product/mvp-scope.md)
- Open founder decisions: [docs/product/founder-decision-log.md](docs/product/founder-decision-log.md)
- Canonical agent rules: `AGENTS.md`

Keep this file compact. Do not turn it into a chronological chat log or task-specific handoff.
