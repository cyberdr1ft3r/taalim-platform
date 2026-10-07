export interface TaalimPrincipal {
  userId: string;
}

/** Clerk user id only. This object does not grant Taalim permissions. */
export function principalFromClerkUserId(userId: string | null | undefined): TaalimPrincipal | null {
  if (!userId) return null;
  return { userId };
}
