import { mkdtempSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { LocalFilesystemStorageProvider, verifyLocalTemporaryAccess } from "./local-filesystem";

const secret = "test-only-storage-access-secret-32";

function provider(root = mkdtempSync(path.join(os.tmpdir(), "taalim-storage-"))): LocalFilesystemStorageProvider {
  return new LocalFilesystemStorageProvider({ rootDirectory: root, accessSecret: secret });
}

describe("LocalFilesystemStorageProvider", () => {
  it("stores and reads a private object without a caller-chosen key", async () => {
    const storage = provider();
    const stored = await storage.put({
      body: new TextEncoder().encode("synthetic-file"),
      contentType: "text/plain",
    });
    expect(stored.key).toMatch(/^so_[a-f0-9]{32}$/);
    expect(stored.key).not.toContain("/");
    const stream = await storage.get(stored.key);
    const text = new TextDecoder().decode(await new Response(stream).arrayBuffer());
    expect(text).toBe("synthetic-file");
    expect(await storage.exists(stored.key)).toBe(true);
    await storage.delete(stored.key);
    expect(await storage.exists(stored.key)).toBe(false);
  });

  it("rejects path traversal and missing objects", async () => {
    const storage = provider();
    await expect(storage.get("../public/secret")).rejects.toThrow(/not found|Invalid storage key/);
    expect(await storage.metadata("../../etc/passwd")).toBeNull();
  });

  it("refuses a root inside public/", () => {
    expect(
      () =>
        new LocalFilesystemStorageProvider({
          rootDirectory: path.join(process.cwd(), "public", "uploads"),
          accessSecret: secret,
        }),
    ).toThrow(/public/);
  });

  it("creates an expiring capability token that is not a public URL", async () => {
    const storage = provider();
    const stored = await storage.put({
      body: new Uint8Array([1, 2, 3]),
      contentType: "application/octet-stream",
    });
    const token = await storage.createTemporaryAccess(stored.key, 60);
    expect(token.startsWith("http")).toBe(false);
    expect(token).not.toContain(path.resolve(".data"));
    const verified = verifyLocalTemporaryAccess(token, secret);
    expect(verified?.key).toBe(stored.key);
    expect(verifyLocalTemporaryAccess(`${token}tampered`, secret)).toBeNull();
    const expired = verifyLocalTemporaryAccess(token, secret);
    expect(expired).not.toBeNull();
  });
});
