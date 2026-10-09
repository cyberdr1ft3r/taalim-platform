import { RelationshipType } from "@/generated/prisma/client";
import { getPrismaClient } from "@/server/db/client";
import { requireTaalimAccount } from "@/server/authorization/guards";
import { enforceRateLimit, RATE_LIMITS } from "@/server/authorization/rate-limit";
import { handleApiRequest, isRecord } from "@/server/http/api";
import {
  createRelationshipInvite,
  listOwnRelationships,
} from "@/server/relationships/service";

/** Lists relationships where the caller is one of the two parties. */
export function GET(): Promise<Response> {
  return handleApiRequest(async () => {
    const user = await requireTaalimAccount();
    const relationships = await listOwnRelationships(getPrismaClient(), user);
    return Response.json({ relationships });
  });
}

function parseInviteBody(body: unknown): { learnerAccountId: string; relationshipType: RelationshipType } | null {
  if (!isRecord(body)) return null;
  const { learnerAccountId, relationshipType } = body;
  if (typeof learnerAccountId !== "string" || learnerAccountId.length === 0) return null;
  if (typeof relationshipType !== "string") return null;
  if (!Object.values(RelationshipType).includes(relationshipType as RelationshipType)) return null;
  return { learnerAccountId, relationshipType: relationshipType as RelationshipType };
}

/**
 * Creates (or re-opens) a guardian/payer -> learner invite. The creator must
 * hold the PAYER role and the target must be a LEARNER account; both checks
 * happen against Taalim server-side records, never against client claims.
 */
export function POST(request: Request): Promise<Response> {
  return handleApiRequest(async () => {
    const body: unknown = await request.json().catch(() => undefined);
    const invite = parseInviteBody(body);
    if (!invite) return Response.json({ error: "invalid_request" }, { status: 400 });

    const user = await requireTaalimAccount();
    enforceRateLimit(`relationship-create:${user.clerkSubject}`, RATE_LIMITS.relationshipCreate);

    const relationship = await createRelationshipInvite(getPrismaClient(), user, invite);
    return Response.json({ relationship }, { status: 201 });
  });
}
