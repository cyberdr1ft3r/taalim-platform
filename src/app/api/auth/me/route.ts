import { resolveCurrentUser } from "@/server/identity/current-user";
import { handleApiRequest } from "@/server/http/api";

/**
 * Current identity state for the session. Answers 401 when there is no
 * session; a valid session without a Taalim account reports
 * `provisioned: false` so the client can call bootstrap. Never returns email
 * or other profile data: the durable identity is the Clerk subject.
 */
export function GET(): Promise<Response> {
  return handleApiRequest(async () => {
    const state = await resolveCurrentUser();
    if (state.status === "unauthenticated") {
      return Response.json({ error: "authentication_required" }, { status: 401 });
    }
    const { user } = state;
    return Response.json({
      clerkSubject: user.clerkSubject,
      sessionId: user.sessionId,
      provisioned: user.account !== null,
      accountId: user.account?.id ?? null,
      roles: user.account?.roles ?? [],
      secondFactorVerified: user.secondFactorVerified,
    });
  });
}
