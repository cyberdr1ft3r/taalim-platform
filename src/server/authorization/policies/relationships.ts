import "server-only";
import type { PrismaClient } from "@/generated/prisma/client";
import type { TaalimUser } from "../../identity/current-user";

/**
 * FD-02: acting for a learner always requires an explicit ACTIVE
 * GuardianLearnerRelationship. Surnames, emails, IDs that "look related", or
 * client-claimed relationships are never consulted.
 */
export async function hasActiveGuardianRelationship(
  db: Pick<PrismaClient, "guardianLearnerRelationship">,
  guardianPayerAccountId: string,
  learnerAccountId: string,
): Promise<boolean> {
  const relationship = await db.guardianLearnerRelationship.findFirst({
    where: {
      guardianPayerUserId: guardianPayerAccountId,
      learnerUserId: learnerAccountId,
      status: "ACTIVE",
    },
    select: { id: true },
  });
  return relationship !== null;
}

/** Self-management, administrator oversight, or an explicit ACTIVE relationship. */
export async function canManageLearner(
  db: Pick<PrismaClient, "guardianLearnerRelationship">,
  user: TaalimUser,
  learnerAccountId: string,
): Promise<boolean> {
  if (!user.account) return false;
  if (user.account.id === learnerAccountId) return true;
  if (user.account.roles.includes("ADMIN")) return true;
  return hasActiveGuardianRelationship(db, user.account.id, learnerAccountId);
}
