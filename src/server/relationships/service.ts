import "server-only";
import { Prisma } from "@/generated/prisma/client";
import type { PrismaClient, RelationshipType } from "@/generated/prisma/client";
import { logSecurityEvent } from "../authorization/audit";
import { AuthorizationDeniedError } from "../authorization/errors";
import type { TaalimUser } from "../identity/current-user";

type RelationshipDb = Pick<
  PrismaClient,
  "guardianLearnerRelationship" | "userAccount" | "roleAssignment"
>;

export interface RelationshipSummary {
  id: string;
  relationshipType: RelationshipType;
  status: "PENDING" | "ACTIVE" | "REVOKED";
  guardianPayerUserId: string;
  learnerUserId: string;
  createdAt: Date;
  updatedAt: Date;
}

function toSummary(row: {
  id: string;
  relationshipType: RelationshipType;
  status: "PENDING" | "ACTIVE" | "REVOKED";
  guardianPayerUserId: string;
  learnerUserId: string;
  createdAt: Date;
  updatedAt: Date;
}): RelationshipSummary {
  return { ...row };
}

function deny(): never {
  throw new AuthorizationDeniedError();
}

async function loadRelationship(db: RelationshipDb, id: string) {
  const relationship = await db.guardianLearnerRelationship.findUnique({ where: { id } });
  if (!relationship) deny();
  return relationship;
}

async function isLearnerAccount(db: RelationshipDb, accountId: string): Promise<boolean> {
  const assignment = await db.roleAssignment.findUnique({
    where: { userId_role: { userId: accountId, role: "LEARNER" } },
    select: { id: true },
  });
  return assignment !== null;
}

async function isPayerAccount(db: RelationshipDb, accountId: string): Promise<boolean> {
  const assignment = await db.roleAssignment.findUnique({
    where: { userId_role: { userId: accountId, role: "PAYER" } },
    select: { id: true },
  });
  return assignment !== null;
}

/**
 * FD-02: a guardian/payer invites an explicit learner account. The creator
 * must hold the PAYER role; the target must exist as a LEARNER account; and
 * self-relationships are rejected (the schema enforces distinct users).
 *
 * Re-inviting an existing PENDING/ACTIVE triple is idempotent and never
 * resets an ACTIVE relationship. A REVOKED triple may be re-invited.
 */
export async function createRelationshipInvite(
  db: RelationshipDb,
  actor: TaalimUser,
  input: { learnerAccountId: string; relationshipType: RelationshipType },
): Promise<RelationshipSummary> {
  if (!actor.account) deny();
  const actorId = actor.account.id;
  if (actorId === input.learnerAccountId) deny();
  if (!(await isPayerAccount(db, actorId))) deny();
  if (!(await isLearnerAccount(db, input.learnerAccountId))) deny();

  const existing = await db.guardianLearnerRelationship.findUnique({
    where: {
      guardianPayerUserId_learnerUserId_relationshipType: {
        guardianPayerUserId: actorId,
        learnerUserId: input.learnerAccountId,
        relationshipType: input.relationshipType,
      },
    },
  });
  if (existing && existing.status !== "REVOKED") {
    return toSummary(existing);
  }

  try {
    const created = await db.guardianLearnerRelationship.upsert({
      where: {
        guardianPayerUserId_learnerUserId_relationshipType: {
          guardianPayerUserId: actorId,
          learnerUserId: input.learnerAccountId,
          relationshipType: input.relationshipType,
        },
      },
      update: { status: "PENDING" },
      create: {
        guardianPayerUserId: actorId,
        learnerUserId: input.learnerAccountId,
        relationshipType: input.relationshipType,
        status: "PENDING",
      },
    });
    logSecurityEvent({
      type: "relationship.invite_created",
      result: "allowed",
      actorAccountId: actorId,
      actorClerkSubject: actor.clerkSubject,
      targetId: created.id,
      detail: { relationshipType: input.relationshipType },
    });
    return toSummary(created);
  } catch (error) {
    // Concurrent invite creation can still collide on the unique triple;
    // re-read instead of failing, keeping the operation idempotent.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const raced = await db.guardianLearnerRelationship.findUnique({
        where: {
          guardianPayerUserId_learnerUserId_relationshipType: {
            guardianPayerUserId: actorId,
            learnerUserId: input.learnerAccountId,
            relationshipType: input.relationshipType,
          },
        },
      });
      if (raced) return toSummary(raced);
    }
    throw error;
  }
}

/**
 * Only the learner-side account may accept an invite. The PENDING -> ACTIVE
 * transition is a single conditional database update guarded on the current
 * status, so a revoke that lands between the ownership check and the write
 * cannot be overwritten by a stale accept: the conditional update matches
 * zero rows and the invite is reported as no longer acceptable.
 */
export async function acceptRelationshipInvite(
  db: RelationshipDb,
  actor: TaalimUser,
  relationshipId: string,
): Promise<RelationshipSummary> {
  if (!actor.account) deny();
  const actorId = actor.account.id;
  const relationship = await loadRelationship(db, relationshipId);
  if (relationship.learnerUserId !== actorId) deny();
  if (relationship.status !== "PENDING") deny();

  const result = await db.guardianLearnerRelationship.updateMany({
    where: { id: relationshipId, status: "PENDING" },
    data: { status: "ACTIVE" },
  });
  if (result.count === 0) {
    // A concurrent revoke (or another accept) won the race; re-read and
    // report the authoritative state instead of resurrecting the invite.
    const raced = await db.guardianLearnerRelationship.findUnique({
      where: { id: relationshipId },
    });
    if (raced) return toSummary(raced);
    deny();
  }
  logSecurityEvent({
    type: "relationship.invite_accepted",
    result: "allowed",
    actorAccountId: actorId,
    actorClerkSubject: actor.clerkSubject,
    targetId: relationshipId,
  });
  const updated = await loadRelationship(db, relationshipId);
  return toSummary(updated);
}

/**
 * Either party may revoke. Revocation is terminal for the row's use and is
 * also a conditional transition, so an accept racing a revoke can never
 * leave the relationship ACTIVE when both operations were requested.
 */
export async function revokeRelationship(
  db: RelationshipDb,
  actor: TaalimUser,
  relationshipId: string,
): Promise<RelationshipSummary> {
  if (!actor.account) deny();
  const actorId = actor.account.id;
  const relationship = await loadRelationship(db, relationshipId);
  if (relationship.guardianPayerUserId !== actorId && relationship.learnerUserId !== actorId) deny();
  if (relationship.status === "REVOKED") return toSummary(relationship);

  const result = await db.guardianLearnerRelationship.updateMany({
    where: { id: relationshipId, status: { in: ["PENDING", "ACTIVE"] } },
    data: { status: "REVOKED" },
  });
  if (result.count === 0) {
    const raced = await db.guardianLearnerRelationship.findUnique({
      where: { id: relationshipId },
    });
    if (raced) return toSummary(raced);
    deny();
  }
  logSecurityEvent({
    type: "relationship.revoked",
    result: "allowed",
    actorAccountId: actorId,
    actorClerkSubject: actor.clerkSubject,
    targetId: relationshipId,
    detail: { previousStatus: relationship.status },
  });
  const updated = await loadRelationship(db, relationshipId);
  return toSummary(updated);
}

/** The caller sees only rows where they are one of the two parties. */
export async function listOwnRelationships(
  db: RelationshipDb,
  actor: TaalimUser,
): Promise<RelationshipSummary[]> {
  if (!actor.account) deny();
  const actorId = actor.account.id;
  const rows = await db.guardianLearnerRelationship.findMany({
    where: { OR: [{ guardianPayerUserId: actorId }, { learnerUserId: actorId }] },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toSummary);
}
