import "server-only";
import type { PrismaClient } from "@/generated/prisma/client";
import type { TaalimUser } from "../../identity/current-user";

/**
 * FD-02: acting for a learner always requires an explicit ACTIVE
 * GuardianLearnerRelationship of a guardian-capable type (`GUARDIAN` or
 * `GUARDIAN_AND_PAYER`). A `PAYER`-only relationship funds education but is
 * not a privacy/education-data grant, so it never authorizes acting for the
 * learner. Surnames, emails, IDs that "look related", or client-claimed
 * relationships are never consulted.
 */
const GUARDIAN_CAPABLE_TYPES = ["GUARDIAN", "GUARDIAN_AND_PAYER"] as const;

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
      relationshipType: { in: [...GUARDIAN_CAPABLE_TYPES] },
    },
    select: { id: true },
  });
  return relationship !== null;
}

/**
 * Self-management, administrator oversight, or an explicit ACTIVE
 * guardian-capable relationship. Self-management requires no role or
 * second factor; administrator oversight requires the Taalim-owned ADMIN
 * role plus a completed second factor.
 */
export async function canManageLearner(
  db: Pick<PrismaClient, "guardianLearnerRelationship">,
  user: TaalimUser,
  learnerAccountId: string,
): Promise<boolean> {
  if (!user.account) return false;
  if (user.account.id === learnerAccountId) return true;
  if (user.account.roles.includes("ADMIN")) return user.secondFactorVerified;
  return hasActiveGuardianRelationship(db, user.account.id, learnerAccountId);
}
