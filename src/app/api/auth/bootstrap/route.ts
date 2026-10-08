import { UserRole } from "@/generated/prisma/client";
import { logSecurityEvent } from "@/server/authorization/audit";
import { enforceRateLimit, RATE_LIMITS } from "@/server/authorization/rate-limit";
import { handleApiRequest, isRecord } from "@/server/http/api";
import { isSelfServiceRole, provisionSelfServiceAccount } from "@/server/identity/current-user";
import { requireAuthenticatedUser } from "@/server/authorization/guards";

const ALL_SELF_SERVICE_ROLES: readonly UserRole[] = [UserRole.LEARNER, UserRole.PAYER];

function parseRequestedRoles(body: unknown): UserRole[] | null {
  if (body === undefined || body === null) return [...ALL_SELF_SERVICE_ROLES];
  if (!isRecord(body)) return null;
  const roles = body.roles;
  if (roles === undefined) return [...ALL_SELF_SERVICE_ROLES];
  if (!Array.isArray(roles) || roles.length === 0) return null;
  const parsed: UserRole[] = [];
  for (const role of roles) {
    if (typeof role !== "string") return null;
    if (!Object.values(UserRole).includes(role as UserRole)) return null;
    const typed = role as UserRole;
    // TEACHER/ADMIN are never self-assignable; reject instead of silently dropping.
    if (!isSelfServiceRole(typed)) return null;
    parsed.push(typed);
  }
  return parsed;
}

/**
 * First-run account provisioning for an authenticated Clerk subject.
 *
 * Identity comes from the session; the roles requested here are limited to
 * self-service roles (LEARNER, PAYER). TEACHER and ADMIN are provisioned by
 * their own flows, never by this endpoint.
 */
export function POST(request: Request): Promise<Response> {
  return handleApiRequest(async () => {
    const body: unknown = await request.json().catch(() => undefined);
    const requestedRoles = parseRequestedRoles(body);
    if (!requestedRoles) {
      return Response.json({ error: "invalid_request" }, { status: 400 });
    }

    const user = await requireAuthenticatedUser();
    enforceRateLimit(`bootstrap:${user.clerkSubject}`, RATE_LIMITS.bootstrap);

    const account = await provisionSelfServiceAccount(user.clerkSubject, requestedRoles);
    logSecurityEvent({
      type: "account.bootstrap",
      result: "allowed",
      actorAccountId: account.id,
      actorClerkSubject: user.clerkSubject,
      detail: { roles: account.roles },
    });
    return Response.json({
      accountId: account.id,
      roles: account.roles,
    });
  });
}
