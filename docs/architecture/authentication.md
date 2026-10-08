# Authentication and Authorization

Status: Implemented for Issue #5. This document is the architecture-level description of how Taalim separates identity, business authorization, and storage access.

## Boundary

- **Clerk** establishes identity and owns sessions: registration, contact verification, sign-in, password recovery, and session lifecycle.
- **Taalim server code** is the only source of business authorization: roles, guardian/payer relationships, enrollments, entitlements, verification ownership, and stored-object relationships.
- **Storage** serves bytes only after Taalim authorization has already succeeded.

Possession of an email address, surname, object ID, storage key, URL, bucket path, or signed link is never authorization. Clerk metadata, UI visibility, and route names are never authorization.

## Identity model

- `UserAccount.clerkSubject` is the durable link between a Clerk session and a Taalim account. Email is deliberately not consulted.
- `resolveCurrentUser()` (`src/server/identity/current-user.ts`) returns one of three states: `unauthenticated` (no session), `no_account` (valid session, no Taalim account yet), or `active` (session plus account and roles).
- Account bootstrap (`POST /api/auth/bootstrap`) provisions the self-service roles `LEARNER` and `PAYER` idempotently. `TEACHER` and `ADMIN` are never self-assignable through this path; the service silently drops them and the endpoint rejects them with `400`.
- Roles are read from `RoleAssignment` rows in the Taalim database, never from session claims.

## Authentication flows

Registration, contact verification, sign-in, and password recovery are Clerk-hosted flows. They are tenant/dashboard configuration:

- The Clerk development instance, configured redirect URLs, and password-reset options are dashboard state, not repository state.
- This repository intentionally does not mount the Clerk browser SDK yet (ADR 0003): with placeholder keys the hosted widgets cannot render, so this repository cannot exercise them end to end. The flows are configuration-complete on the Clerk side and verified by CI configuration, not by in-repo UI.
- Sign-out combines the Clerk client sign-out with server-side session revocation (`DELETE /api/auth/sessions/[sessionId]`, including the current session).

The proxy (`src/proxy.ts`) treats `/`, `/api/health`, `/ar`, and `/fr` as public. Every other page requires a session via `auth.protect()`. Every other `/api/*` route returns JSON `401 {"error":"authentication_required"}` instead of a redirect. Route handlers still re-enforce authorization internally; the proxy check is a first line, not the authorization decision.

## Authorization model

Guards (`src/server/authorization/guards.ts`):

- `requireAuthenticatedUser()` — session required.
- `requireTaalimAccount()` — session plus provisioned `UserAccount`.
- `requireRole()` / `requireAnyRole()` — database roles only.
- `requirePrivilegedUser()` — role check **plus** second-factor session evidence; used for teacher/admin privileged operations.

Policies (`src/server/authorization/policies/`):

- `relationships.ts` — acting for a learner requires an explicit `ACTIVE` `GuardianLearnerRelationship`.
- `class-resource.ts` — class-scoped data requires the owning teacher (second factor), an `ACTIVE` enrollment with a time-bounded `ACTIVE` entitlement (learner), or an `ACTIVE` guardian relationship to an entitled learner. Administrators require a second factor.
- `teacher-verification.ts` — verification cases are reachable only by the owning teacher (matched through `TeacherProfile.userId`) or an administrator, and both paths require a second factor.
- `stored-object-access.ts` — resolves object plus business relationship in the database first, then calls `authorizeStoredObjectRead`, and only then the storage provider (see below).

Errors map to documented statuses through `authorizationErrorResponse()`: `401` authentication required, `403` missing account / policy denial / missing second factor, `429` rate limited, generic `500` for anything unexpected.

## Second factor

`sessionHasSecondFactor()` reads Clerk session evidence (`amr` second-factor methods such as `totp`, `otp`, `backup_code`, `passkey`, falling back to the `fva` tuple) and fails closed when no recognizable evidence exists.

- Teacher/admin privileged operations require this evidence server-side.
- Enforcing MFA enrollment is Clerk tenant configuration (dashboard multi-factor requirement); repository code cannot enroll users and does not claim to.
- **FD-10 (student second factor) is open.** Learner access is not made 2FA-dependent here; the risk-based/full-handoff conflict is a founder decision.

## Guardian/payer relationships (FD-02)

FD-02 is Accepted: explicit guardian/payer relationships, and one account may be both learner and payer.

Lifecycle in `src/server/relationships/service.ts`, exposed under `/api/relationships`:

1. A `PAYER`-role account invites an explicit learner account → `PENDING` (idempotent for existing open triples; a `REVOKED` triple may be re-invited).
2. Only the learner-side account accepts → `ACTIVE`.
3. Either party revokes → `REVOKED` (terminal for that row).

All checks are server-side against database rows. Self-relationships and targets without the `LEARNER` role are rejected. **FD-03 (minors) is open**: who creates and accepts on behalf of a minor, and any age threshold, are not invented here.

## Private object access

`resolveStoredObjectAccess()` → `authorizeStoredObjectRead()` → storage provider, in that order:

1. Load `StoredObject` by ID; require `ACTIVE` status.
2. Resolve the relationship: creator, owning teacher of the verification case containing the object (second factor required), or administrator (second factor required). Class-resource object links arrive with later issues (#7/#12).
3. Deny returns `404 not_found` so object existence cannot be probed. Denied decisions never invoke the provider, so no bytes and no temporary link can be produced.

Routes: `GET /api/objects/[objectId]/content` (streamed with `cache-control: private, no-store`) and `POST /api/objects/[objectId]/temporary-access` (TTL clamped to 60–3600 seconds, rate limited).

Storage provider credentials stay server-side; browsers receive content or short-lived links only after authorization.

## Session management

- `GET /api/auth/sessions` lists the caller's own active Clerk sessions (queried with the caller's subject only).
- `DELETE /api/auth/sessions/[sessionId]` verifies `session.userId === caller subject` server-side before revoking. A guessed or leaked session ID cannot revoke another user's session.
- **FD-11 (device/session caps) is open**: no numeric device cap is invented; session listing and revocation are implemented, full device management is not.

## Rate limiting

Fixed-window, in-process limiting in `src/server/authorization/rate-limit.ts`:

| Action | Limit |
| --- | --- |
| Account bootstrap | 10 / minute per subject |
| Relationship invite | 20 / minute per subject |
| Accept/revoke decisions | 60 / minute per subject |
| Session revocation | 30 / minute per subject |
| Temporary access issuance | 30 / minute per subject |

This is intentionally process-local: ADR 0003 keeps the baseline free of Redis and the deployment is a single web process. Horizontal scaling must replace it with a shared limiter before these limits are relied on for security. Clerk-side controls (password reset attempt limits, lockouts) are dashboard configuration.

## Audit logging

`logSecurityEvent()` (`src/server/authorization/audit.ts`) records security decisions: account bootstrap, authorization denials, second-factor requirements, rate-limit hits, relationship lifecycle, session list/revoke, and stored-object grants/denials. Payloads carry account IDs, Clerk subjects, target IDs, and safe reasons only. The shared pino redaction paths cover tokens, cookies, signed URLs, and verification material; emails and storage keys are not logged.

## Suspended accounts

The Issue #3 schema has no account-suspension state on `UserAccount`. Current handling:

- A Clerk-suspended user cannot obtain a session at all; identity fails before authorization.
- A revoked guardian relationship immediately removes guardian access (tested).
- `VerificationCaseStatus.SUSPENDED` semantics for teachers belong to Issue #6 teacher approval and are not reinterpreted here.

If a first-party account suspension state is added later, it must gate `resolveCurrentUser()` centrally rather than each policy.

## Verification evidence

- Unit: second-factor evidence, rate limiting, error mapping, identity states, provisioning role restrictions, guard escalation, session ownership.
- Integration (`TAALIM_RUN_DB_TESTS=1`): concurrent provisioning, relationship lifecycle with cross-user negatives, class-resource entitlement and 2FA requirements, verification-document ownership, storage-provider spy proving denied access never reaches the provider.
- All checks: `prisma validate`, migrations on a clean database, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, Playwright e2e, `scripts/check-harness.mjs`.
