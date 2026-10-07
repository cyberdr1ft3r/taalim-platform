import { loadEnv } from "../config/env";
import { LocalFilesystemStorageProvider } from "./providers/local-filesystem";
import type { StorageProvider } from "./types";

export function getStorageProvider(env = loadEnv()): StorageProvider {
  if (env.STORAGE_PROVIDER === "local") {
    return new LocalFilesystemStorageProvider({
      rootDirectory: env.STORAGE_LOCAL_ROOT,
      accessSecret: env.STORAGE_ACCESS_SECRET,
    });
  }
  throw new Error("Production object storage is undecided. Refusing to select a storage vendor.");
}

export { createAuthorizedTemporaryAccess, readAuthorizedObject, StorageAccessDeniedError } from "./service";
export type { ObjectMetadata, PutObjectInput, StorageProvider, StoredObject } from "./types";
