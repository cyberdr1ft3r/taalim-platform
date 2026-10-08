import "server-only";
import { createLogger } from "../logging/logger";

export type SecurityEventType =
  | "account.bootstrap"
  | "account.not_provisioned"
  | "authorization.denied"
  | "second_factor.required"
  | "rate_limit.exceeded"
  | "relationship.invite_created"
  | "relationship.invite_accepted"
  | "relationship.revoked"
  | "session.listed"
  | "session.revoked"
  | "stored_object.read_granted"
  | "stored_object.read_denied"
  | "stored_object.temporary_access_granted"
  | "stored_object.temporary_access_denied";

export interface SecurityEvent {
  type: SecurityEventType;
  result: "allowed" | "denied" | "error";
  /** Database account id when one is known. */
  actorAccountId?: string;
  /** Clerk subject for the actor. Never an email address. */
  actorClerkSubject?: string;
  /** Target object: account id, relationship id, object id, session id. */
  targetId?: string;
  /** Safe, non-sensitive detail only: reasons, roles, routes. Never tokens,
   * URLs, emails, verification material, or storage keys. */
  detail?: Record<string, unknown>;
}

const logger = createLogger();

/**
 * Security audit trail for decisions that affect identity, authorization,
 * relationships, sessions, and private storage. Logging is a decision
 * consequence: the outcome is logged after the decision, never instead of it.
 */
export function logSecurityEvent(event: SecurityEvent): void {
  logger.info({ security: true, ...event }, `security:${event.type}`);
}
