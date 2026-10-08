import { enforceRateLimit, RATE_LIMITS } from "@/server/authorization/rate-limit";
import { requireTaalimAccount } from "@/server/authorization/guards";
import { handleExternalBackendRequest } from "@/server/http/api";
import { revokeOwnSession } from "@/server/identity/sessions";

/**
 * Revokes one of the caller's own sessions. Ownership is verified server-side
 * by the session's userId; a stolen or guessed session ID cannot revoke
 * someone else's session.
 */
export function DELETE(
  _request: Request,
  context: { params: Promise<{ sessionId: string }> },
): Promise<Response> {
  return handleExternalBackendRequest(async () => {
    const { sessionId } = await context.params;
    const user = await requireTaalimAccount();
    enforceRateLimit(`session-revoke:${user.clerkSubject}`, RATE_LIMITS.sessionRevoke);
    await revokeOwnSession(user, sessionId);
    return Response.json({ revoked: true });
  });
}
