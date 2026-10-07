# PROJECT_MEMORY.md

## Product

Taalim is a Morocco-focused online education marketplace and learning platform connecting students with verified teachers. The marketplace, subscriptions, classroom access, payments, teacher settlement, and administration are first-class product concerns.

## Current stage

The Issue #17 harness and the Issue #1 MVP baseline are on `main`. FD-01 is Accepted: launch languages are Arabic and French, and English stays architecture-ready without launch copy. Issue #2's application foundation is implemented on draft pull request #20 and is not merged. Issue #3 has not started.

## Working principles

- Keep the early product a modular monolith unless evidence requires otherwise.
- Identity, application authorization, storage, and payment concerns are separate boundaries.
- Clerk establishes session identity. Taalim server-side code authorizes access.
- The application baseline is Next.js 16, TypeScript, React, Tailwind, PostgreSQL, and Prisma ORM 7. See `docs/adr/0003-application-architecture-baseline.md`.
- Launch languages are Arabic (RTL) and French. An English message catalog may exist and is not a routed launch locale.
- Production storage and payment providers are deliberately undecided. Feature code stays provider-neutral. Development uses a fake payment adapter. Live charges stay off until written provider confirmation and legal and accounting review.
- Background work starts on PostgreSQL. Redis is not required.
- Backlog rules already stated for the MVP, and only proposed until founder acceptance: teacher-set MAD prices, no minimum enrolment, verification before selling, rolling monthly billing, cancellation at the end of the paid period, and price protection for in-force subscribers.
- Paid access follows trusted payment state. Private learning and verification files stay behind application authorization.
- No native video, AI features, mobile apps, or infrastructure expansion merely because they are possible.
- Use synthetic development/test data only.

## Collaboration

Ali/cyberdr1ft3r and Anass work in parallel with independent agents. Issue ownership, dependency order, shared-surface coordination, and human review are mandatory. Detailed task handoffs belong in issues/PRs, not in this file.

## Where decisions live

- Current operational state: `STATUS.md`
- Goals: `docs/GOALS.md`
- Roadmap: `docs/ROADMAP.md`
- Risks: `docs/RISKS.md`
- Accepted architecture baseline and proposed product records: `docs/adr/`
- MVP baseline: `docs/product/mvp-scope.md`
- Open founder decisions: `docs/product/founder-decision-log.md`
- Local setup and boundaries: `docs/architecture/local-development.md`
- Canonical agent rules: `AGENTS.md`

Keep this file compact. Do not turn it into a chronological chat log or task-specific handoff.
