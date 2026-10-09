import { enforceRateLimit, RATE_LIMITS } from "@/server/authorization/rate-limit";
import { requireAuthenticatedUser } from "@/server/authorization/guards";
import { handleExternalBackendRequest } from "@/server/http/api";
import { revokeOwnSession } from "@/server/identity/sessions";

/**
 * Revokes one of the caller's own sessions. Requires only an authenticated
 * Clerk session (not a Taalim account row); ownership is verified server-side
 * by the session's userId, so a stolen or guessed session ID cannot revoke
 * someone else's session.
 */
export function DELETE(
  _request: Request,
  context: { params: Promise<{ sessionId: string }> },
): Promise<Response> {
  return handleExternalBackendRequest(async () => {
    const { sessionId } = await context.params;
    const user = await requireAuthenticatedUser();
    enforceRateLimit(`session-revoke:${user.clerkSubject}`, RATE_LIMITS.sessionRevoke);
    await revokeOwnSession(user, sessionId);
    return Response.json({ revoked: true });
  });
}
