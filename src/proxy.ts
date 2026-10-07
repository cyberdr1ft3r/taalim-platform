import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import createIntlMiddleware from "next-intl/middleware";
import { type NextFetchEvent, type NextRequest, NextResponse } from "next/server";
import { routing } from "@/i18n/routing";

const handleI18n = createIntlMiddleware(routing);

const isPublicRoute = createRouteMatcher(["/", "/api/health", "/ar", "/fr"]);

/**
 * Clerk confirms there is a session. It does not decide class, file,
 * payment, or admin access. Those checks belong in server-side Taalim code.
 */
const handleClerk = clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
  if (request.nextUrl.pathname.startsWith("/api")) return;
  return handleI18n(request);
});

const PLACEHOLDER_HANDSHAKE_HOST = "example.clerk.accounts.dev";

export async function proxy(request: NextRequest, event: NextFetchEvent) {
  const response = await handleClerk(request, event);
  if (!isPlaceholderHandshake(response)) return response;
  if (request.nextUrl.pathname.startsWith("/api")) return NextResponse.next();
  return handleI18n(request);
}

function isPlaceholderHandshake(response: unknown): boolean {
  if (!response || typeof response !== "object" || !("headers" in response)) return false;
  const headers = response.headers;
  if (!(headers instanceof Headers)) return false;
  const location = headers.get("location") ?? "";
  return location.includes(`${PLACEHOLDER_HANDSHAKE_HOST}/v1/client/handshake`);
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/(api|trpc)(.*)"],
};
