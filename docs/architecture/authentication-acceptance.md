# Authentication acceptance for Issue #5

Status: the authorization implementation from the merged Issue #5 work is on `main` at `ed52cefac0224ebc6f7431311932825c7e248d3a`. This record separates that repository behavior from founder decisions, Clerk dashboard configuration, and a real development-instance run.

Issue #5 stays open. This record does not close it.

## What is already implemented

Clerk establishes identity. Taalim server code authorizes. The merged code, described in [authentication.md](authentication.md), already does the following:

- Account bootstrap grants only `LEARNER` and `PAYER`. `TEACHER` and `ADMIN` requests are rejected.
- Authorization reads database roles and explicit `GuardianLearnerRelationship` rows. Email and surname are not consulted.
- `PAYER` does not grant learner privacy access. `GUARDIAN` and `GUARDIAN_AND_PAYER` do, while `ACTIVE`.
- Teacher and administrator privileged routes, including verification-document reads, require Clerk `fva` second-factor evidence. A missing or `-1` second-factor age fails closed. `amr` and passkeys do not override that.
- Denied stored-object decisions do not call the storage provider.
- Session list and revoke use the caller's Clerk subject. A session id alone cannot revoke another user's session. Those routes work when no Taalim `UserAccount` exists yet.
- No numeric device cap and no legal-age threshold are encoded.

Automated tests cover those rules with synthetic database rows and mocked Clerk clients. They are not a substitute for a live Clerk development instance.

## Founder decisions

| ID | Proposed MVP position | Status |
| --- | --- | --- |
| FD-03 | Do not hard-code an age. Keep explicit guardian relationships. Defer age enforcement until legal and product review. Do not infer guardianship. | **Accepted by Ali on 2026-10-09.** |
| FD-10 | Learner MFA optional. Teacher and administrator privileged access requires MFA. Later step-up stays possible and is not specified here. | **Accepted by Ali on 2026-10-09.** |
| FD-11 | No numeric device cap. Session listing and remote revocation only. No device console. Later suspicious-session controls need evidence. | **Accepted by Ali on 2026-10-09.** |

## Clerk instance tested

No Taalim Clerk development instance was available in this run.

- Checked-in publishable key: `pk_test_…` decoding to `example.clerk.accounts.dev`.
- That host is the placeholder from the example files. It is not a configured Taalim tenant. Clerk answers `host_invalid` for it.
- `CLERK_SECRET_KEY` in the examples is a synthetic placeholder. It was not used against Clerk's API. No secret was added to Git or GitHub Actions.
- `@clerk/nextjs` 7.9.11. Account Portal paths below are from Clerk's current Account Portal documentation for that integration style.

Real-instance test environment: **not available**. Result for every live scenario: **NOT TESTED**.

## Hosted flow

The repository uses Clerk's hosted Account Portal. It does not embed `<SignIn>`, `<SignUp>`, or `ClerkProvider`. ADR 0003 keeps the browser SDK off the public shell until a real development key exists, because the placeholder key makes clerk-js replace the document.

The public home page now links to the tenant encoded in the publishable key:

| Flow | URL | Where it lives |
| --- | --- | --- |
| Registration | `https://<frontend-api>/sign-up?redirect_url=<APP_BASE_URL>` | Account Portal |
| Contact verification | The sign-up page's email code step | Account Portal. Development test code is `424242` for `+clerk_test` addresses. |
| Sign-in | `https://<frontend-api>/sign-in?redirect_url=<APP_BASE_URL>` | Account Portal |
| Password recovery | Forgot-password step on the sign-in page | Account Portal. It is not a separate Taalim route. |
| Sign-out and MFA enrollment | `https://<frontend-api>/user?redirect_url=<APP_BASE_URL>` | Account Portal user profile |
| Session revoke with an ownership check | `GET /api/auth/sessions`, `DELETE /api/auth/sessions/[sessionId]` | Taalim server |

`auth.protect()` on non-public pages redirects to the Account Portal when a real key is present and the dashboard has not pointed Paths at an application `/sign-in` route. `/`, `/ar`, `/fr`, and `/api/health` stay public, so the home links are the reachable entry points.

With the placeholder key, those links target `example.clerk.accounts.dev`. Automated Playwright checks the hrefs. It does not follow them. Following them is **NOT TESTED** and would not complete a real registration.

## Dashboard actions Ali must perform

These were not performed. Names match the Clerk Dashboard as documented for the installed SDK.

1. Open [the Clerk Dashboard](https://dashboard.clerk.com) and create or select a **development** instance. Do not use a production instance for this acceptance run.
2. Copy that instance's publishable key and secret key into the local gitignored `.env` only. Do not commit them and do not paste them into GitHub. The example files stay placeholders.
3. Confirm the publishable key decodes to a host ending in `accounts.dev`, and that the host is not `example.clerk.accounts.dev`. Rebuild and restart the app. The home page is prerendered, so the Account Portal links follow the publishable key present at `pnpm build`.
4. **Account Portal → Overview.** Read the displayed sign-in, sign-up, and user URLs. They must be on that same host.
5. **Account Portal → Redirects.** Use one canonical development origin for this acceptance run: `http://127.0.0.1:3000`. Set `APP_BASE_URL` and the browser URL to that same origin, and set the sign-in/sign-up fallback redirects to it. Do not mix `localhost` and `127.0.0.1` while the generated links carry an explicit `redirect_url`.
6. **Paths.** Leave the application sign-in and sign-up paths unset. Do not point them at `/sign-in` or `/sign-up` on the Taalim app. Those routes do not exist. Embedded components are not the chosen surface.
7. **User & authentication → Email.** Enable email address. Enable email verification by code.
8. **User & authentication → Password.** Enable password so the hosted sign-in page offers forgot-password. Leave social providers off. Issue #5 defers social login.
9. **Multi-factor.** Enable **Authenticator application**. Enable **Backup codes**. Leave SMS off for this run. Leave **Require multi-factor authentication** off. That setting is instance-wide and would force learners, which the proposed FD-10 position does not do. Leave **Passkeys satisfy multi-factor authentication** off. The server ignores passkeys as second-factor evidence.
10. Do not set a device or session cap.
11. Create only synthetic development users, using Clerk's test-email form `<name>+clerk_test@example.com`. The email verification code is `424242`. No customer data.
    - one learner
    - one payer
    - one teacher
    - one administrator
12. For the teacher and the administrator, open the hosted `/user` page and enroll an authenticator application. Sign out and sign in again so the new session carries `fva` with a non-negative second-factor age. A single-factor session must still be rejected by Taalim privileged routes.
13. Teacher and administrator `RoleAssignment` rows are not self-service. Create them with the existing server provisioning path used in tests, or a direct database insert of synthetic accounts tied to those Clerk subjects. Do not add a self-assign endpoint to make the test pass.

Values that come from the local environment, not from the dashboard:

| Variable | Local development value |
| --- | --- |
| `APP_BASE_URL` | `http://127.0.0.1:3000` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | the development instance publishable key, local `.env` only |
| `CLERK_SECRET_KEY` | the development instance secret key, local `.env` only |
| `TAALIM_ENV` | `development` |

## MFA

Server policy is already fail-closed. It was not weakened.

| Check | Result |
| --- | --- |
| Privileged teacher/admin route without `fva` second-factor evidence is denied | AUTOMATED PASS, synthetic session claims |
| The same route with a non-negative second-factor age is allowed | AUTOMATED PASS, synthetic session claims |
| `amr` or a passkey does not override `fva` absence | AUTOMATED PASS |
| A real teacher can enroll an authenticator application on the development tenant | NOT TESTED |
| That live session exposes `factorVerificationAge` / `fva` and is accepted | NOT TESTED |
| The same user, signed in with only the first factor, is rejected | NOT TESTED |

## Recovery security

The live forgot-password flow was **NOT TESTED**. The repository properties that recovery must not violate are covered by automated tests of bootstrap and identity resolution:

| Property | Result |
| --- | --- |
| Bootstrap cannot assign `TEACHER` or `ADMIN` | AUTOMATED PASS |
| The same Clerk subject maps to one `UserAccount` | AUTOMATED PASS, including a concurrent first sign-in |
| Authorization does not use email | AUTOMATED PASS by construction: lookup is `clerkSubject` only |
| A second factor is still required after any future recovery for privileged routes | AUTOMATED PASS for the policy. The live recovery session was NOT TESTED |
| Recovery does not create a second account for the same subject | NOT TESTED on a live reset. The unique `clerkSubject` constraint is what enforces it |

## Acceptance scenarios

Legend: **AUTOMATED PASS** means a repository test proved the behavior with synthetic data or mocks. **NOT TESTED** means no real Clerk development instance was available. Nothing below is a **MANUAL PASS**. Nothing untested is marked pass.

| # | Scenario | Result |
| --- | --- | --- |
| 1 | New learner registration | NOT TESTED |
| 2 | Contact/email verification | NOT TESTED |
| 3 | Sign-in | NOT TESTED |
| 4 | `GET /api/auth/me` | AUTOMATED PASS for unauthenticated `401`. Authenticated body NOT TESTED |
| 5 | Account bootstrap | AUTOMATED PASS for idempotent `LEARNER`/`PAYER` provisioning against PostgreSQL. Live Clerk session NOT TESTED |
| 6 | `LEARNER`/`PAYER` self-service role behavior | AUTOMATED PASS |
| 7 | Attempted `TEACHER` self-assignment is rejected | AUTOMATED PASS |
| 8 | Attempted `ADMIN` self-assignment is rejected | AUTOMATED PASS |
| 9 | Sign-out | NOT TESTED. Hosted `/user` sign-out was not exercised |
| 10 | Sign back in | NOT TESTED |
| 11 | Password/account recovery | NOT TESTED |
| 12 | List own active sessions | AUTOMATED PASS against a mocked Clerk client, including the caller's subject filter. Live list NOT TESTED. Unauthenticated `401` is an e2e AUTOMATED PASS |
| 13 | Revoke another own session | AUTOMATED PASS against a mocked Clerk client. Live revoke NOT TESTED |
| 14 | Cross-user session revocation is denied | AUTOMATED PASS. `revokeSession` is not called when `session.userId` differs |
| 15 | Guardian/payer relationship invite | AUTOMATED PASS on PostgreSQL with synthetic accounts |
| 16 | Learner acceptance | AUTOMATED PASS |
| 17 | `PAYER`-only relationship does not grant guardian privacy access | AUTOMATED PASS |
| 18 | `GUARDIAN` relationship grants permitted learner access | AUTOMATED PASS |
| 19 | Relationship revocation removes access | AUTOMATED PASS |
| 20 | Teacher privileged route without MFA is denied | AUTOMATED PASS |
| 21 | Teacher privileged route with MFA is allowed | AUTOMATED PASS on synthetic `fva`. Live enrollment NOT TESTED |
| 22 | Admin privileged route without MFA is denied | AUTOMATED PASS |
| 23 | Admin privileged route with MFA is allowed | AUTOMATED PASS on synthetic `fva`. Live enrollment NOT TESTED |
| 24 | Verification-document access respects MFA | AUTOMATED PASS, including the creator-bypass regression |
| 25 | Negative object access does not reach the storage provider | AUTOMATED PASS |
| 26 | Session management still works when the Taalim account is absent | AUTOMATED PASS against a mocked Clerk client |

Public home links to the configured Account Portal host are an additional AUTOMATED PASS. They do not prove the remote tenant works.

## Unresolved external gates

- FD-03, FD-10, and FD-11 are Accepted. They no longer block Issue #5.
- No Clerk development instance, allowed origins, MFA strategies, or synthetic users were configured from this environment.
- Live registration, verification, sign-in, sign-out, recovery, and authenticator enrollment were not run.
- In-process rate limiting remains single-process, as already documented. That does not by itself keep #5 open once the items above are done.
- First-party account suspension, beyond Clerk refusing a session, is still unspecified. It is not part of this acceptance run.

## Can Issue #5 close?

No.

Closing it requires all of the following:

1. The dashboard steps above are done on a development instance, with secrets kept out of Git.
2. Scenarios 1–3, 9–11, and the live halves of 4, 12, 13, 20–23 are run with synthetic `+clerk_test` users and recorded as MANUAL PASS or as a failure with evidence.
3. The server MFA policy stays fail-closed. Do not weaken it to obtain a pass.
