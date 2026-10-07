# PROJECT_MEMORY.md

## Product

Taalim is a Morocco-focused online education marketplace and learning platform connecting students with verified teachers. The marketplace, subscriptions, classroom access, payments, teacher settlement, and administration are first-class product concerns.

## Current stage

The repository harness is on `main`. Issue #2 is implementing the application foundation. Issue #1 product documentation is an open pull request and is not merged. Core schema and state modeling remain Issue #3.

## Accepted working principles

- Keep the early product a modular monolith unless evidence requires otherwise.
- Identity, application authorization, storage, and payment concerns are separate boundaries.
- Clerk establishes session identity. Taalim server-side code authorizes access.
- The application baseline is Next.js 16, TypeScript, React, Tailwind, PostgreSQL, and Prisma ORM 7. See `docs/adr/0003-application-architecture-baseline.md`.
- Enabled launch locales are Arabic (RTL) and French. An English message catalog may exist and is not a routed launch locale.
- Production storage provider is deliberately undecided; feature code must remain provider-neutral.
- Payment provider is deliberately undecided; development uses fake/sandbox adapters. Live charges stay off.
- Background work starts on PostgreSQL. Redis is not required.
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
- Local setup and boundaries: `docs/architecture/local-development.md`
- Canonical agent rules: `AGENTS.md`

Keep this file compact. Do not turn it into a chronological chat log or task-specific handoff.
