import "server-only";
import type { PrismaClient } from "@/generated/prisma/client";
import type { TaalimUser } from "../../identity/current-user";
import {
  authorizeStoredObjectRead,
  type StoredObjectRelationship,
} from "../stored-object";
import {
  createAuthorizedTemporaryAccess,
  readAuthorizedObject,
  StorageAccessDeniedError,
} from "../../storage/service";
import type { StorageProvider } from "../../storage/types";
import { logSecurityEvent } from "../audit";

export { StorageAccessDeniedError };

type StoredObjectDb = Pick<
  PrismaClient,
  "storedObject" | "teacherProfile" | "teacherVerificationCase"
>;

export type StoredObjectDenyReason =
  | "unauthenticated"
  | "object_not_found"
  | "object_not_active"
  | "relationship_not_granted";

export interface StoredObjectAccessDecision {
  allowed: boolean;
  objectId: string;
  storageKey: string | null;
  mimeType: string | null;
  reason: StoredObjectDenyReason | "allowed";
}

/**
 * Resolves a StoredObject and the Taalim business relationship that could
 * grant access, entirely inside the database. Possession of an object ID or
 * storage key is not consulted as authorization: only the resolved
 * relationship is.
 *
 * Relationship sources supported by the Issue #3 schema:
 * - the creator of the object;
 * - the teacher who owns the verification case containing the object
 *   (privileged: requires a second-factor session);
 * - an administrator (privileged: requires a second-factor session).
 *
 * Class-resource object links arrive with later issues (#7/#12); this policy
 * deliberately grants nothing that the merged schema cannot represent.
 */
export async function resolveStoredObjectAccess(
  db: StoredObjectDb,
  user: TaalimUser,
  objectId: string,
): Promise<StoredObjectAccessDecision> {
  const deny = (reason: StoredObjectDenyReason): StoredObjectAccessDecision => ({
    allowed: false,
    objectId,
    storageKey: null,
    mimeType: null,
    reason,
  });

  if (!user.account) return deny("unauthenticated");

  const object = await db.storedObject.findUnique({
    where: { id: objectId },
    select: { id: true, storageKey: true, mimeType: true, status: true, createdByUserId: true },
  });
  if (!object) return deny("object_not_found");
  if (object.status !== "ACTIVE") return deny("object_not_active");

  let relationshipGranted = false;

  if (object.createdByUserId === user.account.id) {
    relationshipGranted = true;
  } else if (user.secondFactorVerified) {
    if (user.account.roles.includes("ADMIN")) {
      relationshipGranted = true;
    } else if (user.account.roles.includes("TEACHER")) {
      const ownedCase = await db.teacherVerificationCase.findFirst({
        where: {
          documents: { some: { storedObjectId: objectId } },
          teacherProfile: { userId: user.account.id },
        },
        select: { id: true },
      });
      relationshipGranted = ownedCase !== null;
    }
  }

  const relationship: StoredObjectRelationship = { allowed: relationshipGranted };
  const decision = authorizeStoredObjectRead({
    principalId: user.account.id,
    key: object.storageKey,
    relationship,
  });
  if (!decision.allowed) return deny("relationship_not_granted");
  return {
    allowed: true,
    objectId,
    storageKey: object.storageKey,
    mimeType: object.mimeType,
    reason: "allowed",
  };
}

function auditActor(user: TaalimUser) {
  return {
    actorAccountId: user.account?.id,
    actorClerkSubject: user.clerkSubject,
  };
}

export interface StoredObjectReadResult {
  stream: ReadableStream<Uint8Array>;
  mimeType: string;
}

/**
 * Full private-object read path: identity -> account -> business relationship
 * -> authorizeStoredObjectRead -> ONLY THEN the storage provider. Unauthorized
 * access never reaches the provider, so no bytes can be produced from a denied
 * decision. Both outcomes are audited.
 */
export async function readStoredObjectForUser(
  db: StoredObjectDb,
  provider: StorageProvider,
  user: TaalimUser,
  objectId: string,
): Promise<StoredObjectReadResult> {
  const access = await resolveStoredObjectAccess(db, user, objectId);
  if (!access.allowed || !access.storageKey || !user.account) {
    logSecurityEvent({
      type: "stored_object.read_denied",
      result: "denied",
      ...auditActor(user),
      targetId: objectId,
      detail: { reason: access.reason },
    });
    throw new StorageAccessDeniedError();
  }
  const stream = await readAuthorizedObject(provider, {
    principalId: user.account.id,
    key: access.storageKey,
    relationship: { allowed: true },
  });
  logSecurityEvent({
    type: "stored_object.read_granted",
    result: "allowed",
    ...auditActor(user),
    targetId: objectId,
  });
  return { stream, mimeType: access.mimeType ?? "application/octet-stream" };
}

/** Temporary-link generation follows the same deny-before-provider rule. */
export async function createTemporaryAccessForUser(
  db: StoredObjectDb,
  provider: StorageProvider,
  user: TaalimUser,
  objectId: string,
  expiresInSeconds: number,
): Promise<string> {
  const access = await resolveStoredObjectAccess(db, user, objectId);
  if (!access.allowed || !access.storageKey || !user.account) {
    logSecurityEvent({
      type: "stored_object.temporary_access_denied",
      result: "denied",
      ...auditActor(user),
      targetId: objectId,
      detail: { reason: access.reason },
    });
    throw new StorageAccessDeniedError();
  }
  const url = await createAuthorizedTemporaryAccess(provider, {
    principalId: user.account.id,
    key: access.storageKey,
    relationship: { allowed: true },
    expiresInSeconds,
  });
  logSecurityEvent({
    type: "stored_object.temporary_access_granted",
    result: "allowed",
    ...auditActor(user),
    targetId: objectId,
    detail: { expiresInSeconds },
  });
  return url;
}
