import "server-only";
import type { PrismaClient } from "@/generated/prisma/client";
import type { TaalimUser } from "../../identity/current-user";

type ClassResourceDb = Pick<PrismaClient, "classOffering" | "enrollment" | "guardianLearnerRelationship">;

/**
 * Server-side decision for class-scoped business data (sessions, rosters,
 * class-level records). Entitlement is time-bounded and comes from the Issue
 * #3 Enrollment/Entitlement model; a payer/guardian reaches it only through an
 * explicit ACTIVE relationship to an entitled learner.
 *
 * Teacher and administrator paths additionally require that the session
 * completed a second factor. Learner access does not (FD-10 remains open;
 * this policy does not make learner 2FA mandatory).
 */
export async function canAccessClassResource(
  db: ClassResourceDb,
  user: TaalimUser,
  classId: string,
  now: Date = new Date(),
): Promise<boolean> {
  if (!user.account) return false;
  const accountId = user.account.id;
  const roles = user.account.roles;

  if (roles.includes("ADMIN")) {
    return user.secondFactorVerified;
  }

  const classOffering = await db.classOffering.findUnique({
    where: { id: classId },
    select: { teacherProfile: { select: { userId: true } } },
  });
  if (!classOffering) return false;
  if (classOffering.teacherProfile.userId === accountId) {
    return user.secondFactorVerified;
  }

  const entitledLearnerIds = await db.enrollment
    .findMany({
      where: { classId, state: "ACTIVE" },
      select: {
        learnerUserId: true,
        entitlements: {
          where: { state: "ACTIVE", startsAt: { lte: now }, endsAt: { gt: now } },
          select: { id: true },
        },
      },
    })
    .then((rows) => rows.filter((row) => row.entitlements.length > 0).map((row) => row.learnerUserId));

  if (entitledLearnerIds.length === 0) return false;
  if (entitledLearnerIds.includes(accountId)) return true;

  const guardianLink = await db.guardianLearnerRelationship.findFirst({
    where: {
      guardianPayerUserId: accountId,
      learnerUserId: { in: entitledLearnerIds },
      status: "ACTIVE",
    },
    select: { id: true },
  });
  return guardianLink !== null;
}
