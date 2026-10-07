# Processes

## Web

`pnpm dev` and `pnpm start` run the Next.js server. `GET /api/health` returns `{ "status": "ok", "service": "taalim-web" }` and does not read secrets or the database. Next.js 16 `cacheComponents` rejects a route-level `runtime` export, so the health route does not set one. The handler uses only the web `Response` API.

`src/proxy.ts` runs Clerk before rendering. Public paths are `/`, `/ar`, `/fr`, and `/api/health`. Other paths call `auth.protect()` so a Clerk session is required. That check is identity only. Server functions that read or change private data must call Taalim authorization as well. `getTaalimPrincipal` reads `auth().userId` and returns no permissions.

The checked-in publishable key decodes to `example.clerk.accounts.dev`. Clerk treats `pk_test_` keys as development instances and redirects document requests to that host for a dev-browser handshake. The placeholder host answers `host_invalid`, so `src/proxy.ts` does not follow a handshake redirect aimed at that host. A real Clerk development key uses a different frontend API, and its handshake is left intact. The public shell does not mount `ClerkProvider` until that real instance exists, because the browser SDK would otherwise load from the same placeholder host.

## Worker

`pnpm worker` loads the same environment schema, then runs one PostgreSQL job pass and exits. It logs the worker id and environment name. It does not log the database URL or the caught error text, because a driver error can contain a connection string.

The only handler is `foundation.ping`. Claim uses `FOR UPDATE SKIP LOCKED`. A running lock older than 15 minutes returns to `pending`. That lease is infrastructure recovery, not a product deadline. A failed handler is retried until `maxAttempts`, then marked `failed`. The stored error text is the fixed string `handler failed`.

Business jobs, schedules, and email or SMS delivery are later issues.
