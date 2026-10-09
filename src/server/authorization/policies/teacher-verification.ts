import "server-only";
import type { PrismaClient } from "@/generated/prisma/client";
import type { TaalimUser } from "../../identity/current-user";

type TeacherVerificationDb = Pick<PrismaClient, "teacherProfile" | "teacherVerificationCase">;

/**
 * Teacher verification documents are sensitive. Only the owning teacher
 * (matched through TeacherProfile.userId, not email, and holding the current
 * Taalim-owned TEACHER role) or an ADMIN may access a verification case, and
 * both privileged paths require a second-factor session. Removing the
 * TEACHER role while the profile remains does not keep authorizing the
 * account. Possession of a case ID grants nothing.
 */
export async function canAccessTeacherVerification(
  db: TeacherVerificationDb,
  user: TaalimUser,
  verificationCaseId: string,
): Promise<boolean> {
  if (!user.account || !user.secondFactorVerified) return false;
  const accountId = user.account.id;
  const roles = user.account.roles;

  if (roles.includes("ADMIN")) return true;
  if (!roles.includes("TEACHER")) return false;

  const verificationCase = await db.teacherVerificationCase.findUnique({
    where: { id: verificationCaseId },
    select: { teacherProfile: { select: { userId: true } } },
  });
  if (!verificationCase) return false;
  return verificationCase.teacherProfile.userId === accountId;
}
