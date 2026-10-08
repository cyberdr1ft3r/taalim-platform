import "server-only";
import { auth } from "@clerk/nextjs/server";
import { Prisma, UserRole } from "@/generated/prisma/client";
import { getPrismaClient } from "../db/client";
import { sessionHasSecondFactor } from "./second-factor";

export interface TaalimAccount {
  id: string;
  clerkSubject: string;
  roles: UserRole[];
}

/**
 * Resolved request context. `account` is null when the Clerk session is valid
 * but no Taalim UserAccount exists for the subject. `secondFactorVerified`
 * reports whether the session itself completed a second factor; it is session
 * assurance, never a business permission.
 */
export interface TaalimUser {
  clerkSubject: string;
  sessionId: string | null;
  account: TaalimAccount | null;
  secondFactorVerified: boolean;
}

export type CurrentUserState =
  | { status: "unauthenticated"; user: null }
  | { status: "no_account"; user: TaalimUser }
  | { status: "active"; user: TaalimUser };

/**
 * Self-service roles a user may hold after registration. TEACHER and ADMIN are
 * never self-assigned here; they are provisioned through application services
 * (teacher onboarding, administrator grant) outside this bootstrap path.
 */
export const SELF_SERVICE_ROLES: readonly UserRole[] = [UserRole.LEARNER, UserRole.PAYER];

export function isSelfServiceRole(role: UserRole): boolean {
  return SELF_SERVICE_ROLES.includes(role);
}

async function loadAccount(clerkSubject: string): Promise<TaalimAccount | null> {
  const account = await getPrismaClient().userAccount.findUnique({
    where: { clerkSubject },
    include: { roles: { select: { role: true } } },
  });
  if (!account) return null;
  return {
    id: account.id,
    clerkSubject: account.clerkSubject,
    roles: account.roles.map((assignment) => assignment.role),
  };
}

/**
 * Identity resolution: Clerk subject -> UserAccount.clerkSubject -> Taalim
 * account + roles. Email is deliberately not consulted; the durable link is
 * the Clerk subject. A missing application account is a distinct state, not an
 * error and not an implicit registration.
 */
export async function resolveCurrentUser(): Promise<CurrentUserState> {
  const { userId, sessionId, sessionClaims, factorVerificationAge } = await auth();
  if (!userId) {
    return { status: "unauthenticated", user: null };
  }
  const account = await loadAccount(userId);
  const user: TaalimUser = {
    clerkSubject: userId,
    sessionId: sessionId ?? null,
    account,
    secondFactorVerified: sessionHasSecondFactor({ claims: sessionClaims, factorVerificationAge }),
  };
  return account ? { status: "active", user } : { status: "no_account", user };
}

/**
 * Provisioning is idempotent and concurrency-safe: UserAccount.clerkSubject is
 * unique, so parallel sign-ins cannot create duplicate accounts. If two
 * requests race the insert, the loser re-reads the winner's row. Existing
 * accounts are returned unchanged; this never downgrades or removes roles.
 */
export async function provisionSelfServiceAccount(
  clerkSubject: string,
  roles: readonly UserRole[] = SELF_SERVICE_ROLES,
): Promise<TaalimAccount> {
  const requested = [...new Set(roles)].filter(isSelfServiceRole);
  if (requested.length === 0) {
    throw new Error("At least one self-service role is required");
  }
  const prisma = getPrismaClient();
  let account: { id: string };
  try {
    account = await prisma.userAccount.upsert({
      where: { clerkSubject },
      update: {},
      create: { clerkSubject },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const existing = await prisma.userAccount.findUnique({ where: { clerkSubject } });
      if (!existing) throw error;
      account = existing;
    } else {
      throw error;
    }
  }
  await prisma.roleAssignment.createMany({
    data: requested.map((role) => ({ userId: account.id, role })),
    skipDuplicates: true,
  });
  const resolved = await loadAccount(clerkSubject);
  if (!resolved) throw new Error("Failed to resolve provisioned account");
  return resolved;
}
