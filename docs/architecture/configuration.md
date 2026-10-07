# Configuration

`loadEnv` in `src/server/config/env.ts` validates the process environment with Zod. Errors list field names only.

| File | Boots the app | Database | Storage | Payments |
| --- | --- | --- | --- | --- |
| `.env.development.example` | Yes, after copy to `.env` | Local PostgreSQL `taalim_dev` | `local` | `fake` |
| `.env.test.example` | Yes, for tests | Local PostgreSQL `taalim_test` | `local` | `fake` |
| `.env.staging.example` | No | Placeholder remote host | `undecided` | `fake` |
| `.env.production.example` | No | Placeholder remote host | `undecided` | `fake` |

`.env`, `.env.local`, and `.env.*.local` are gitignored. The example files contain synthetic Clerk key shapes and local passwords, not live credentials.

## Secrets

- Local development copies an example file. Do not put production secrets in that copy.
- CI uses the synthetic values declared in `.github/workflows/ci.yml`. Those values do not call live Clerk or a payment provider.
- Staging and production secrets belong in the host secret manager when a deployment exists. This issue does not deploy.
- `prisma.config.ts` falls back to a localhost URL only so `prisma generate` can run without a database. Application code still requires `DATABASE_URL`.

## Test guard

`assertTestDatabaseAllowed` runs from the Vitest setup and from `loadEnv` when `TAALIM_ENV=test`. It rejects staging, production, and any database host outside `localhost`, `127.0.0.1`, and `::1`.
