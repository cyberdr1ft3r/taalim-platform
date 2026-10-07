# STATUS.md

## Current phase

Application foundation (#2) is in progress. The repository harness from #17 is on `main`. Product-scope documentation (#1) is still an open pull request and is not on this branch.

## Active work

- Issue: #2
- Owner: Ali (cyberdr1ft3r)
- Agent/session: `bc-58579c28-a3b7-5926-bd1c-c93b27fa53a7`
- Branch: `cursor/app-foundation-issue-2-53a7`
- Base commit: `7e5e1241d2447c5604b401d220f34afd6728af9c`
- Dependencies: #17 harness is on `main`. Arabic and French are the enabled launch locales for this scaffold. English is catalogued and not routed. Pull request #19 was not merged when this branch was cut.
- Shared surfaces: `STATUS.md`, `PROJECT_MEMORY.md`, `README.md`, and `docs/adr/README.md` also change on open pull request #19. This branch adds `package.json`, `pnpm-lock.yaml`, GitHub Actions, Docker Compose, and the first Prisma migration.
- Blockers: production storage, the live payment provider, and legal funds-flow remain undecided. Do not merge automatically.
- Next action: human review of the #2 pull request.

## Architecture posture

- Modular monolith. The accepted baseline is `docs/adr/0003-application-architecture-baseline.md`.
- Clerk identifies the session. Taalim server code authorizes.
- Production storage is undecided. Development uses a private local filesystem provider.
- The payment provider is undecided. Development and tests use a fake provider. Live charges are off.
- Background jobs use PostgreSQL. Redis is not required.
- Enabled locales are Arabic (RTL) and French. The English catalog is present and not routed.

## Not started here

Final business schema, subscriptions, teacher onboarding, checkout, real payment integration, production object storage, and production deployment.
