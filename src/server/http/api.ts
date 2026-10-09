import "server-only";
import { authorizationErrorResponse } from "../authorization/errors";
import { StorageAccessDeniedError } from "../storage/service";
import { createLogger } from "../logging/logger";

const logger = createLogger();

/**
 * Uniform API error boundary: authorization-layer errors map to their
 * documented status, denied storage reads answer as not-found so object
 * existence cannot be probed, and anything unexpected is logged and answered
 * with a generic 500. Handlers never leak internals.
 */
export async function handleApiRequest(run: () => Promise<Response>): Promise<Response> {
  try {
    return await run();
  } catch (error) {
    const mapped = authorizationErrorResponse(error);
    if (mapped) return mapped;
    if (error instanceof StorageAccessDeniedError) {
      return Response.json({ error: "not_found" }, { status: 404 });
    }
    logger.error({ err: error }, "api:unhandled_error");
    return Response.json({ error: "internal_error" }, { status: 500 });
  }
}

/**
 * Backend-API failures (Clerk session management) are external-dependency
 * failures, not authorization outcomes. They answer 503 instead of a misleading
 * 401/403/500.
 */
export async function handleExternalBackendRequest(run: () => Promise<Response>): Promise<Response> {
  try {
    return await run();
  } catch (error) {
    const mapped = authorizationErrorResponse(error);
    if (mapped) return mapped;
    if (error instanceof StorageAccessDeniedError) {
      return Response.json({ error: "not_found" }, { status: 404 });
    }
    logger.warn({ err: error }, "api:backend_unavailable");
    return Response.json({ error: "backend_unavailable" }, { status: 503 });
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
