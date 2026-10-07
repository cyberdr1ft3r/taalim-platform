import "server-only";
import { auth } from "@clerk/nextjs/server";
import { principalFromClerkUserId, type TaalimPrincipal } from "./principal";

export async function getTaalimPrincipal(): Promise<TaalimPrincipal | null> {
  const { userId } = await auth();
  return principalFromClerkUserId(userId);
}
