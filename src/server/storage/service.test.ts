import { describe, expect, it, vi } from "vitest";
import { createAuthorizedTemporaryAccess, StorageAccessDeniedError } from "./service";
import type { StorageProvider } from "./types";

const key = `so_${"cd".repeat(16)}`;

function provider(): StorageProvider {
  return {
    put: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
    exists: vi.fn(),
    metadata: vi.fn(),
    createTemporaryAccess: vi.fn(async () => "taalim-local.payload.signature"),
  };
}

describe("createAuthorizedTemporaryAccess", () => {
  it("does not issue a token when the relationship denies access", async () => {
    const storage = provider();
    await expect(
      createAuthorizedTemporaryAccess(storage, {
        principalId: "user_synthetic",
        key,
        relationship: { allowed: false },
        expiresInSeconds: 60,
      }),
    ).rejects.toBeInstanceOf(StorageAccessDeniedError);
    expect(storage.createTemporaryAccess).not.toHaveBeenCalled();
  });

  it("issues a token only after the relationship allows access", async () => {
    const storage = provider();
    const token = await createAuthorizedTemporaryAccess(storage, {
      principalId: "user_synthetic",
      key,
      relationship: { allowed: true },
      expiresInSeconds: 60,
    });
    expect(token).toBe("taalim-local.payload.signature");
    expect(storage.createTemporaryAccess).toHaveBeenCalledWith(key, 60);
  });
});
