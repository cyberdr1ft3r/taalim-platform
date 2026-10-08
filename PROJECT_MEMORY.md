# PROJECT_MEMORY.md

## Product

Taalim is a Morocco-focused online education marketplace and learning platform connecting students with verified teachers. Marketplace discovery, subscriptions, classroom access, payments, teacher settlement and administration are first-class concerns.

## Stable product/architecture facts

- The MVP/product baseline from Issue #1 is merged.
- FD-01 is Accepted: Arabic and French are launch languages; English remains architecture-ready without launch copy.
- ADR 0003 is Accepted: Taalim is a Next.js 16 modular monolith using TypeScript, React, Tailwind, PostgreSQL, Prisma ORM 7, Clerk identity, provider-neutral storage/payments, PostgreSQL background jobs, pnpm and GitHub Actions.
- Identity, application authorization, storage and payment are separate boundaries.
- Clerk establishes session identity; Taalim server-side code authorizes business actions and private access.
- Production storage and payment providers are deliberately undecided. Feature code stays provider-neutral. Live charges remain off until provider, legal and accounting gates are satisfied.
- Background jobs use committed leases; handlers must be idempotent.
- Private learning and verification files stay behind application authorization.
- Native video, AI features, mobile apps and unnecessary infrastructure expansion are deferred.
- Development/test data is synthetic.

## Collaboration

Ali/cyberdr1ft3r and Anass work in parallel with independent agents. Issue ownership, dependency order, shared-surface coordination and human review are mandatory. Task handoffs and live state belong in GitHub issues/PRs, not this file.

## Where truth lives

- Live task/PR/merge state: GitHub.
- Current implementation: source code at a named revision.
- Product decisions: `docs/product/` and accepted founder decisions.
- Architecture: accepted ADRs under `docs/adr/`.
- Task routing: `docs/CONTEXT_MAP.md`.
- Special implementation cautions: `docs/IMPLEMENTATION_GUARDRAILS.md`.
- Goals/roadmap/risks: `docs/GOALS.md`, `docs/ROADMAP.md`, `docs/RISKS.md`.
- Canonical agent policy: `AGENTS.md`.

Keep this file stable and compact. Do not add chronological task history or PR status.
