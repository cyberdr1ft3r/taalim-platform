import { getPrismaClient } from "@/server/db/client";
import { requireTaalimAccount } from "@/server/authorization/guards";
import { enforceRateLimit, RATE_LIMITS } from "@/server/authorization/rate-limit";
import { handleApiRequest } from "@/server/http/api";
import { revokeRelationship } from "@/server/relationships/service";

/** Revokes a relationship. Either party may revoke; strangers are denied. */
export function POST(
  _request: Request,
  context: { params: Promise<{ relationshipId: string }> },
): Promise<Response> {
  return handleApiRequest(async () => {
    const { relationshipId } = await context.params;
    const user = await requireTaalimAccount();
    enforceRateLimit(`relationship-decision:${user.clerkSubject}`, RATE_LIMITS.relationshipDecision);
    const relationship = await revokeRelationship(getPrismaClient(), user, relationshipId);
    return Response.json({ relationship });
  });
}
