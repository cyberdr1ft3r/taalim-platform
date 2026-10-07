import { describe, expect, it } from "vitest";
import { assertTestDatabaseAllowed } from "./database-safety";

describe("assertTestDatabaseAllowed", () => {
  it("allows a local test database", () => {
    expect(() =>
      assertTestDatabaseAllowed({
        taalimEnv: "test",
        databaseUrl: "postgresql://taalim:taalim@127.0.0.1:5432/taalim_test",
      }),
    ).not.toThrow();
  });

  it("refuses a remote host even when the environment says test", () => {
    expect(() =>
      assertTestDatabaseAllowed({
        taalimEnv: "test",
        databaseUrl: "postgresql://taalim:taalim@production-db.internal:5432/taalim_production",
      }),
    ).toThrow(/non-local database host/);
  });

  it("refuses production and staging labels", () => {
    expect(() =>
      assertTestDatabaseAllowed({
        taalimEnv: "production",
        databaseUrl: "postgresql://taalim:taalim@127.0.0.1:5432/taalim_test",
      }),
    ).toThrow(/TAALIM_ENV=production/);
    expect(() =>
      assertTestDatabaseAllowed({
        taalimEnv: "staging",
        databaseUrl: "postgresql://taalim:taalim@127.0.0.1:5432/taalim_test",
      }),
    ).toThrow(/TAALIM_ENV=staging/);
  });
});
