import { handleExternalBackendRequest } from "@/server/http/api";
import { requireAuthenticatedUser } from "@/server/authorization/guards";
import { listOwnSessions } from "@/server/identity/sessions";

/**
 * Lists the caller's own active Clerk sessions. Session lifecycle belongs to
 * the identity layer: a valid Clerk session can manage its own sessions even
 * when no Taalim account row exists. Ownership is enforced inside the
 * session service against the authenticated subject.
 */
export function GET(): Promise<Response> {
  return handleExternalBackendRequest(async () => {
    const user = await requireAuthenticatedUser();
    const sessions = await listOwnSessions(user);
    return Response.json({ sessions });
  });
}
