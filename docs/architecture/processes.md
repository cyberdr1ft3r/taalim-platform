# Processes

## Web

`pnpm dev` and `pnpm start` run the Next.js server. `GET /api/health` returns `{ "status": "ok", "service": "taalim-web" }` and does not read secrets or the database. Next.js 16 `cacheComponents` rejects a route-level `runtime` export, so the health route does not set one. The handler uses only the web `Response` API.

`src/proxy.ts` runs Clerk before rendering. Public paths are `/`, `/ar`, `/fr`, and `/api/health`. Other paths call `auth.protect()` so a Clerk session is required. That check is identity only. Server functions that read or change private data must call Taalim authorization as well. `getTaalimPrincipal` reads `auth().userId` and returns no permissions.

The checked-in publishable key decodes to `example.clerk.accounts.dev`. Clerk treats `pk_test_` keys as development instances and redirects document requests to that host for a dev-browser handshake. The placeholder host answers `host_invalid`, so `src/proxy.ts` does not follow a handshake redirect aimed at that host. A real Clerk development key uses a different frontend API, and its handshake is left intact. The public shell does not mount `ClerkProvider` until that real instance exists, because the browser SDK would otherwise load from the same placeholder host.

## Worker

`pnpm worker` loads the same environment schema, then runs one PostgreSQL job pass and exits. It logs the worker id and environment name. It does not log the database URL or the caught error text, because a driver error can contain a connection string.

The only handler is `foundation.ping`. There is no subscription, billing, or notification job.

A pass uses three separate steps:

1. Claim. One short transaction recovers expired leases, then takes one due `pending` row with `FOR UPDATE SKIP LOCKED`. It commits `status = running`, `locked_at`, `locked_by`, and `attempts` before it returns. The handler does not run inside this transaction.
2. Execute. The handler runs after that commit. A crash can happen after an external effect and before finalization, and a later worker can run the handler again, so handlers must be idempotent. `foundation.ping` has no external effect.
3. Finalize. A separate update changes the row only when `id` matches, `status` is still `running`, and `locked_by` is still this worker. Success clears the lease and the error. A retry sets `pending`, clears the lease, and makes `run_at` due immediately. There is no product backoff. A terminal failure sets `failed` and clears the lease. An old worker cannot finalize a job after another worker has reclaimed the lease.

The 15-minute threshold applies to committed `running` rows. It is infrastructure recovery, not a product or business timeout. Recovery clears the lease. If `attempts` is still below `max_attempts`, the row returns to `pending`. If `attempts` is already at the maximum, the row becomes `failed` and is not requeued. A thrown handler uses the same attempt ceiling: the stored error text is `handler failed`. A lease that expires at the ceiling stores `lease expired`.
