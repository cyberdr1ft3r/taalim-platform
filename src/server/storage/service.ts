import { authorizeStoredObjectRead, type StoredObjectRelationship } from "../authorization/stored-object";
import type { StorageProvider } from "./types";

export class StorageAccessDeniedError extends Error {
  constructor() {
    super("Stored object access denied");
    this.name = "StorageAccessDeniedError";
  }
}

export async function readAuthorizedObject(
  provider: StorageProvider,
  input: { principalId: string | null; key: string; relationship: StoredObjectRelationship },
): Promise<ReadableStream<Uint8Array>> {
  const decision = authorizeStoredObjectRead(input);
  if (!decision.allowed) throw new StorageAccessDeniedError();
  return provider.get(input.key);
}

export async function createAuthorizedTemporaryAccess(
  provider: StorageProvider,
  input: {
    principalId: string | null;
    key: string;
    relationship: StoredObjectRelationship;
    expiresInSeconds: number;
  },
): Promise<string> {
  const decision = authorizeStoredObjectRead(input);
  if (!decision.allowed) throw new StorageAccessDeniedError();
  if (!provider.createTemporaryAccess) {
    throw new Error("Storage provider does not support temporary access");
  }
  return provider.createTemporaryAccess(input.key, input.expiresInSeconds);
}
