import { createTemporaryAccessForUser } from "@/server/authorization/policies/stored-object-access";
import { requireTaalimAccount } from "@/server/authorization/guards";
import { enforceRateLimit, RATE_LIMITS } from "@/server/authorization/rate-limit";
import { handleApiRequest, isRecord } from "@/server/http/api";
import { getPrismaClient } from "@/server/db/client";
import { getStorageProvider } from "@/server/storage";

const MIN_TTL_SECONDS = 60;
const MAX_TTL_SECONDS = 3_600;

/**
 * Issues a short-lived temporary access URL for an authorized object. The
 * same server-side relationship decision precedes provider involvement as in
 * the content route; possession of the object ID alone issues nothing.
 */
export function POST(
  request: Request,
  context: { params: Promise<{ objectId: string }> },
): Promise<Response> {
  return handleApiRequest(async () => {
    const { objectId } = await context.params;
    const body: unknown = await request.json().catch(() => undefined);

    let expiresInSeconds = 300;
    if (body !== undefined && body !== null) {
      if (!isRecord(body) || typeof body.expiresInSeconds !== "number") {
        return Response.json({ error: "invalid_request" }, { status: 400 });
      }
      expiresInSeconds = Math.trunc(body.expiresInSeconds);
      if (expiresInSeconds < MIN_TTL_SECONDS || expiresInSeconds > MAX_TTL_SECONDS) {
        return Response.json({ error: "invalid_request" }, { status: 400 });
      }
    }

    const user = await requireTaalimAccount();
    enforceRateLimit(`temporary-access:${user.clerkSubject}`, RATE_LIMITS.temporaryAccess);

    const url = await createTemporaryAccessForUser(
      getPrismaClient(),
      getStorageProvider(),
      user,
      objectId,
      expiresInSeconds,
    );
    return Response.json({ url, expiresInSeconds });
  });
}
