# ADR 0003: Application architecture baseline

- Status: Accepted
- Date: 2026-10-07
- Related: Issue #2

## Context

Taalim needs a local application foundation and CI before business features. Issue #2 owns the stack. Production object storage, the live payment provider, and production hosting are deliberately out of scope.

Official package metadata on 2026-10-07 shows `prisma@latest` as `8.0.0-rc.20`. That release is a release candidate, so this decision stays on Prisma ORM 7.10.0. `create-next-app@16.4.0` installs TypeScript 5.9 and ESLint 9. TypeScript 7.0.2 and ESLint 10.12.0 were not adopted. Next.js 16 renames `middleware.ts` to `proxy.ts`; Clerk and `next-intl` are composed in `src/proxy.ts`.

No concrete blocker was found against the requested baseline.

## Decision

Taalim is a modular monolith:

- Next.js 16.4.0 App Router, React 19.3.0, TypeScript 5.9.3
- Tailwind CSS 4.3.3 and a shadcn/ui-compatible button primitive
- `next-intl` 4.14.9
- Enabled launch locales: Arabic and French. Arabic uses `dir="rtl"`. The English catalog exists at `messages/en.json` and is not a routed locale.
- The unprefixed entry redirects to Arabic. That default is a reversible technical choice so RTL is exercised. It is not a product-priority ruling.
- Clerk identifies the session only, through `clerkMiddleware` and `auth()`. Server-side Taalim code authorizes class, file, payment, and admin actions. The browser SDK is not mounted on the public shell: a placeholder development key makes clerk-js replace the document with `host_invalid`. A real Clerk development instance is the point at which `ClerkProvider` is added.
- PostgreSQL, Prisma ORM 7.10.0, and the Prisma driver adapter for `pg`
- Zod 4 and React Hook Form
- A provider-neutral `StorageProvider`. Development uses a private local filesystem provider. Any other storage value refuses to boot because production storage is undecided.
- A provider-neutral payment adapter. Development and tests use a fake provider. Live charges stay off.
- PostgreSQL-backed background jobs. Redis is not required.
- Vitest, React Testing Library, and Playwright
- pnpm 10.33.3, Docker Compose for local PostgreSQL, GitHub Actions
- Pino structured JSON logs with redaction

The only infrastructure table in this issue is `background_jobs`.

## Consequences

- Feature modules import `@/server/storage` and `@/server/payments`. ESLint rejects direct filesystem, S3, Supabase, and Stripe imports outside the provider implementations.
- Tests refuse `TAALIM_ENV` of `staging` or `production` and refuse database hosts other than `localhost`, `127.0.0.1`, and `::1`.
- Staging and production example files document variable names and are not bootable object-storage configurations.
- A later provider change replaces an adapter. It does not rewrite callers.

## Alternatives considered

- Prisma 8 release candidate: rejected until a stable release is the project decision.
- Supabase database or auth, Redis, NestJS, GraphQL, microservices, and Kubernetes: rejected for this issue.
- A caller-chosen storage path or a public object URL: rejected. Keys are server-owned and opaque.

## Related documents

- [Local development](../architecture/local-development.md)
- [Configuration](../architecture/configuration.md)
- [Storage](../architecture/storage.md)
- [Payments](../architecture/payments.md)
- [Processes](../architecture/processes.md)
- [Logging](../architecture/logging.md)
- [Durability](../architecture/durability.md)
- [Workflow](../architecture/workflow.md)
