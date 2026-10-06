# PROJECT_MEMORY.md

## Product

Taalim is a Morocco-focused online education marketplace and learning platform connecting students with verified teachers. The marketplace, subscriptions, classroom access, payments, teacher settlement, and administration are first-class product concerns.

## Current stage

Pre-development. Repository harness work is Issue #17. Product decisions are Issue #1. Application architecture/scaffold is Issue #2. Core schema/state modeling is Issue #3.

## Accepted working principles

- Keep the early product a modular monolith unless evidence requires otherwise.
- Identity, application authorization, storage, and payment concerns are separate boundaries.
- Production storage provider is deliberately undecided; feature code must remain provider-neutral.
- Payment provider is deliberately undecided; development uses fake/sandbox adapters.
- No native video, AI features, mobile apps, or infrastructure expansion merely because they are possible.
- Use synthetic development/test data only.

## Collaboration

Ali/cyberdr1ft3r and Anass work in parallel with independent agents. Issue ownership, dependency order, shared-surface coordination, and human review are mandatory. Detailed task handoffs belong in issues/PRs, not in this file.

## Where decisions live

- Current operational state: `STATUS.md`
- Goals: `docs/GOALS.md`
- Roadmap: `docs/ROADMAP.md`
- Risks: `docs/RISKS.md`
- Accepted architecture/product decisions: `docs/adr/`
- Canonical agent rules: `AGENTS.md`

Keep this file compact. Do not turn it into a chronological chat log or task-specific handoff.
