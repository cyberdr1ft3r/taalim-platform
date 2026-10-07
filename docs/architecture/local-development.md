# Local development

## Prerequisites

- Node.js 22 or newer
- pnpm 10.33.3 (`packageManager` in `package.json`)
- Docker, for the PostgreSQL Compose file

The agent environment used to build this branch did not have Docker installed. CI starts PostgreSQL as a GitHub Actions service instead of Compose.

## Setup

```bash
pnpm install
cp .env.development.example .env
docker compose up -d
pnpm db:migrate
pnpm dev
```

The web app listens on `http://127.0.0.1:3000`. Arabic is served at `/ar` and French at `/fr`.

Run one worker pass:

```bash
pnpm worker
```

## Checks

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
node scripts/check-harness.mjs
```

Set `TAALIM_RUN_DB_TESTS=1` after `pnpm db:migrate` to run the PostgreSQL job test. The default unit tests do not open a database connection.

Copy `.env.test.example` to `.env` before `pnpm test` and Playwright if you want the documented test values loaded by Next. Vitest itself refuses a non-local database even when `.env` is absent.
