import "server-only";
import { clerkClient } from "@clerk/nextjs/server";
import { AuthorizationDeniedError } from "../authorization/errors";
import { logSecurityEvent } from "../authorization/audit";
import type { TaalimUser } from "./current-user";

export interface OwnSessionSummary {
  id: string;
  status: string;
  createdAt: number;
  lastActiveAt: number;
  expireAt: number;
  isCurrent: boolean;
}

/**
 * Lists the caller's own Clerk sessions. The Clerk Backend API is queried
 * with the authenticated subject only; an account cannot list another
 * subject's sessions.
 */
export async function listOwnSessions(user: TaalimUser): Promise<OwnSessionSummary[]> {
  const client = await clerkClient();
  const sessions = await client.sessions.getSessionList({
    userId: user.clerkSubject,
    status: "active",
  });
  logSecurityEvent({
    type: "session.listed",
    result: "allowed",
    actorAccountId: user.account?.id,
    actorClerkSubject: user.clerkSubject,
    detail: { count: sessions.data.length },
  });
  return sessions.data.map((session) => ({
    id: session.id,
    status: session.status,
    createdAt: session.createdAt,
    lastActiveAt: session.lastActiveAt,
    expireAt: session.expireAt,
    isCurrent: session.id === user.sessionId,
  }));
}

/**
 * Revokes one of the caller's own sessions. Ownership is verified
 * server-side against the session's userId before revocation: possession of
 * a session ID (in a URL, body, or log) is not authorization.
 */
export async function revokeOwnSession(user: TaalimUser, sessionId: string): Promise<void> {
  const client = await clerkClient();
  const session = await client.sessions.getSession(sessionId);
  if (session.userId !== user.clerkSubject) {
    logSecurityEvent({
      type: "session.revoked",
      result: "denied",
      actorAccountId: user.account?.id,
      actorClerkSubject: user.clerkSubject,
      targetId: sessionId,
      detail: { reason: "not_owner" },
    });
    throw new AuthorizationDeniedError();
  }
  await client.sessions.revokeSession(sessionId);
  logSecurityEvent({
    type: "session.revoked",
    result: "allowed",
    actorAccountId: user.account?.id,
    actorClerkSubject: user.clerkSubject,
    targetId: sessionId,
    detail: { self: sessionId === user.sessionId },
  });
}
