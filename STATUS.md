# STATUS.md

## Current phase

Issue #1 is merged. Issue #2 is implemented on draft pull request #20 and is not merged. The repository harness from #17 is on `main`.

## Active work

- Issue: #2
- Owner: Ali (cyberdr1ft3r)
- Agent/session: `bc-58579c28-a3b7-5926-bd1c-c93b27fa53a7`
- Branch: `cursor/app-foundation-issue-2-53a7`
- Integrated main: `a53496679194e1485b46a29298dde2afe1f9b137`
- Dependencies: #17 and #1 are on `main`. FD-01 is Accepted.
- Shared surfaces reconciled with merged #19: `STATUS.md`, `PROJECT_MEMORY.md`, `README.md`, and `docs/adr/README.md`.
- Blockers: production storage, the live payment provider, and legal funds-flow remain undecided. Do not merge automatically.
- Next action: human review of draft pull request #20.

## Architecture posture

- Modular monolith. [ADR 0003](docs/adr/0003-application-architecture-baseline.md) is Accepted for the application baseline and is not yet merged.
- [ADR 0001](docs/adr/0001-mvp-subscription-and-supply-rules.md) and [ADR 0002](docs/adr/0002-paid-access-and-private-content.md) remain Proposed.
- Clerk identifies the session. Taalim server code authorizes.
- Production storage is undecided. Development uses a private local filesystem provider.
- The payment provider is undecided. Development and tests use a fake provider. Live charges are off.
- Background jobs use PostgreSQL. Redis is not required.
- Launch locales are Arabic (RTL) and French. English is architecture-ready and is not a routed launch locale. Arabic as the unprefixed route is a technical choice, not a founder landing-locale decision.

## Not started

- Issue #3, including the business schema.
- Subscriptions, teacher onboarding, checkout, real payment integration, production object storage, and production deployment.
