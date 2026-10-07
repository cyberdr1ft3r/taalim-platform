import { randomBytes } from "node:crypto";

export const OPAQUE_STORAGE_KEY = /^so_[a-f0-9]{32}$/;

export function isOpaqueStorageKey(key: string): boolean {
  return OPAQUE_STORAGE_KEY.test(key);
}

export function createOpaqueStorageKey(): string {
  return `so_${randomBytes(16).toString("hex")}`;
}
