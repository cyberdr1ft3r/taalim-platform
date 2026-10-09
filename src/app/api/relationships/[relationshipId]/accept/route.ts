import { getPrismaClient } from "@/server/db/client";
import { requireTaalimAccount } from "@/server/authorization/guards";
import { enforceRateLimit, RATE_LIMITS } from "@/server/authorization/rate-limit";
import { handleApiRequest } from "@/server/http/api";
import { acceptRelationshipInvite } from "@/server/relationships/service";

/**
 * Accepts a pending invite. Only the learner-side account can accept, and the
 * service enforces PENDING -> ACTIVE server-side.
 */
export function POST(
  _request: Request,
  context: { params: Promise<{ relationshipId: string }> },
): Promise<Response> {
  return handleApiRequest(async () => {
    const { relationshipId } = await context.params;
    const user = await requireTaalimAccount();
    enforceRateLimit(`relationship-decision:${user.clerkSubject}`, RATE_LIMITS.relationshipDecision);
    const relationship = await acceptRelationshipInvite(getPrismaClient(), user, relationshipId);
    return Response.json({ relationship });
  });
}
