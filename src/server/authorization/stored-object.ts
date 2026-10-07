import { isOpaqueStorageKey } from "../storage/keys";

export interface StoredObjectRelationship {
  allowed: boolean;
}

export interface StoredObjectReadDecision {
  allowed: boolean;
}

/**
 * Identity and a storage key are not access. The caller must already have
 * resolved the business relationship that grants or denies this object.
 */
export function authorizeStoredObjectRead(input: {
  principalId: string | null;
  key: string;
  relationship: StoredObjectRelationship;
}): StoredObjectReadDecision {
  if (!input.principalId) return { allowed: false };
  if (!input.relationship.allowed) return { allowed: false };
  if (!isOpaqueStorageKey(input.key)) return { allowed: false };
  return { allowed: true };
}
