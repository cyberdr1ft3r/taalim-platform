# Durability by environment

| Environment | Database | Object storage | What is backed up | Who restores it |
| --- | --- | --- | --- | --- |
| Development | Docker Compose PostgreSQL on the developer machine | Private local directory `.data/storage`, gitignored | Nothing. Treat it as disposable synthetic data. | The developer recreates it with `pnpm db:migrate`. |
| Test | Local or CI PostgreSQL database `taalim_test` | Temporary local directory | Nothing. CI discards the service container. | CI creates an empty database and applies migrations. |
| Staging | Not provisioned. The example URL is a placeholder. | Undecided. The app refuses `STORAGE_PROVIDER=undecided`. | No staging backup exists. | Unassigned until a staging host is approved. |
| Production | Not provisioned. | Undecided. No vendor SDK is wired. | No production backup exists. | Unassigned. Do not store learner files on a laptop disk or in `public/`. |

PostgreSQL durability, point-in-time recovery, and object-store replication are deployment work. They are not selected here. Local files under `.data/` are outside git and outside the Next.js public directory.
