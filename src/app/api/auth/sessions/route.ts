import { handleExternalBackendRequest } from "@/server/http/api";
import { requireTaalimAccount } from "@/server/authorization/guards";
import { listOwnSessions } from "@/server/identity/sessions";

/** Lists the caller's own active Clerk sessions. */
export function GET(): Promise<Response> {
  return handleExternalBackendRequest(async () => {
    const user = await requireTaalimAccount();
    const sessions = await listOwnSessions(user);
    return Response.json({ sessions });
  });
}
