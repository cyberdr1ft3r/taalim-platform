import { getPrismaClient } from "@/server/db/client";
import { requireTaalimAccount } from "@/server/authorization/guards";
import { readStoredObjectForUser } from "@/server/authorization/policies/stored-object-access";
import { handleApiRequest } from "@/server/http/api";
import { getStorageProvider } from "@/server/storage";

/**
 * Private object content. Access is decided entirely server-side from the
 * object's business relationships; the storage provider is never consulted
 * before the decision, and denied requests answer 404 so object existence
 * cannot be probed.
 */
export function GET(
  _request: Request,
  context: { params: Promise<{ objectId: string }> },
): Promise<Response> {
  return handleApiRequest(async () => {
    const { objectId } = await context.params;
    const user = await requireTaalimAccount();
    const { stream, mimeType } = await readStoredObjectForUser(
      getPrismaClient(),
      getStorageProvider(),
      user,
      objectId,
    );
    return new Response(stream, {
      headers: {
        "content-type": mimeType,
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
        "content-disposition": "inline",
      },
    });
  });
}
