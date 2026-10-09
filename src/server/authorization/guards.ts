import "server-only";
import { UserRole } from "@/generated/prisma/client";
import {
  AccountNotProvisionedError,
  AuthenticationRequiredError,
  AuthorizationDeniedError,
  SecondFactorRequiredError,
} from "../authorization/errors";
import type { TaalimUser } from "../identity/current-user";
import { resolveCurrentUser } from "../identity/current-user";

/**
 * Requires an authenticated Clerk session. Returns the resolved user; the
 * Taalim account may still be absent (see requireTaalimAccount).
 */
export async function requireAuthenticatedUser(): Promise<TaalimUser> {
  const state = await resolveCurrentUser();
  if (state.status === "unauthenticated" || !state.user) {
    throw new AuthenticationRequiredError();
  }
  return state.user;
}

/** Requires an authenticated session with a provisioned Taalim UserAccount. */
export async function requireTaalimAccount(): Promise<TaalimUser & { account: NonNullable<TaalimUser["account"]> }> {
  const user = await requireAuthenticatedUser();
  if (!user.account) throw new AccountNotProvisionedError();
  return user as TaalimUser & { account: NonNullable<TaalimUser["account"]> };
}

export function hasRole(user: TaalimUser, role: UserRole): boolean {
  return user.account?.roles.includes(role) ?? false;
}

export function hasAnyRole(user: TaalimUser, roles: readonly UserRole[]): boolean {
  return roles.some((role) => hasRole(user, role));
}

/** Requires the Taalim-owned database role. Clerk metadata is never consulted. */
export async function requireRole(role: UserRole) {
  const user = await requireTaalimAccount();
  if (!hasRole(user, role)) throw new AuthorizationDeniedError();
  return user;
}

export async function requireAnyRole(roles: readonly UserRole[]) {
  const user = await requireTaalimAccount();
  if (!hasAnyRole(user, roles)) throw new AuthorizationDeniedError();
  return user;
}

/**
 * Privileged teacher/admin operations additionally require that the session
 * itself completed a second factor (Clerk `amr`/`fva` evidence). Fails closed
 * when the session carries no recognizable second-factor evidence.
 */
export async function requirePrivilegedUser(roles: readonly UserRole[]) {
  const user = await requireAnyRole(roles);
  if (!user.secondFactorVerified) throw new SecondFactorRequiredError();
  return user;
}

/** A user can always manage their own account record. */
export function canManageOwnAccount(user: TaalimUser, targetAccountId: string): boolean {
  return user.account?.id === targetAccountId;
}
