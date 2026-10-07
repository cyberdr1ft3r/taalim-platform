import { describe, expect, it } from "vitest";
import { loadEnv } from "./env";

const secret = "super-secret-storage-value-should-not-leak";

function baseEnv(overrides: Record<string, string> = {}): NodeJS.ProcessEnv {
  return {
    NODE_ENV: "test",
    TAALIM_ENV: "test",
    DATABASE_URL: "postgresql://taalim:taalim@127.0.0.1:5432/taalim_test",
    STORAGE_PROVIDER: "local",
    STORAGE_LOCAL_ROOT: ".data/test-storage",
    STORAGE_ACCESS_SECRET: secret,
    PAYMENT_PROVIDER: "fake",
    LOG_LEVEL: "silent",
    APP_BASE_URL: "http://127.0.0.1:3000",
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_ZXhhbXBsZS5jbGVyay5hY2NvdW50cy5kZXYk",
    CLERK_SECRET_KEY: "sk_test_local_placeholder_not_a_live_secret",
    ...overrides,
  };
}

describe("loadEnv", () => {
  it("accepts the local test configuration", () => {
    expect(loadEnv(baseEnv()).STORAGE_PROVIDER).toBe("local");
  });

  it("refuses an undecided storage provider without echoing secrets", () => {
    expect(() => loadEnv(baseEnv({ STORAGE_PROVIDER: "s3" }))).toThrow(/STORAGE_PROVIDER/);
    try {
      loadEnv(baseEnv({ STORAGE_PROVIDER: "s3" }));
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).not.toContain(secret);
    }
  });

  it("refuses a test run pointed at a remote database", () => {
    expect(() =>
      loadEnv(
        baseEnv({
          DATABASE_URL: "postgresql://taalim:secret@production-db.internal:5432/taalim_production",
        }),
      ),
    ).toThrow(/non-local database host/);
  });
});
