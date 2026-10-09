import "server-only";
import type { PrismaClient } from "@/generated/prisma/client";
import type { TaalimUser } from "../../identity/current-user";

type ClassResourceDb = Pick<PrismaClient, "classOffering" | "enrollment" | "guardianLearnerRelationship">;

/**
 * Server-side decision for class-scoped business data (sessions, rosters,
 * class-level records). Entitlement is time-bounded and comes from the Issue
 * #3 Enrollment/Entitlement model; a guardian reaches it only through an
 * explicit ACTIVE guardian-capable relationship (`GUARDIAN` or
 * `GUARDIAN_AND_PAYER`) to an entitled learner. A `PAYER`-only relationship
 * is not a privacy/education-data grant.
 *
 * Teacher and administrator paths additionally require the Taalim-owned
 * role AND a completed second factor. Removing the TEACHER role while the
 * profile remains does not keep authorizing the account. Learner access does
 * not require 2FA (FD-10 remains open; this policy does not make learner 2FA
 * mandatory).
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
  if (roles.includes("TEACHER") && classOffering.teacherProfile.userId === accountId) {
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
      relationshipType: { in: ["GUARDIAN", "GUARDIAN_AND_PAYER"] },
    },
    select: { id: true },
  });
  return guardianLink !== null;
}
