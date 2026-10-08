import { describe, expect, it, vi } from "vitest";
import { sessionHasSecondFactor } from "./second-factor";

vi.mock("server-only", () => ({}));

describe("sessionHasSecondFactor", () => {
  it("accepts an amr second-factor method", () => {
    expect(
      sessionHasSecondFactor({
        claims: {
          amr: [
            { method: "password", timestamp: 1000 },
            { method: "totp", timestamp: 2000 },
          ],
        },
      }),
    ).toBe(true);
  });

  it.each(["otp", "backup_code", "passkey"])("accepts amr method %s", (method) => {
    expect(sessionHasSecondFactor({ claims: { amr: [{ method }] } })).toBe(true);
  });

  it("fails closed for password-only sessions", () => {
    expect(
      sessionHasSecondFactor({ claims: { amr: [{ method: "password", timestamp: 1000 }] } }),
    ).toBe(false);
  });

  it("fails closed when amr and fva are absent", () => {
    expect(sessionHasSecondFactor({ claims: {} })).toBe(false);
    expect(sessionHasSecondFactor({ claims: null })).toBe(false);
    expect(sessionHasSecondFactor({})).toBe(false);
  });

  it("ignores malformed amr entries", () => {
    expect(
      sessionHasSecondFactor({
        claims: { amr: [null, "totp", { method: 42 }, { method: "password" }] },
      }),
    ).toBe(false);
  });

  it("falls back to a verified fva second-factor age", () => {
    expect(sessionHasSecondFactor({ claims: { fva: [100, 50] } })).toBe(true);
    expect(sessionHasSecondFactor({ factorVerificationAge: [100, 0] })).toBe(true);
  });

  it("fails closed when the second factor was never verified in fva", () => {
    expect(sessionHasSecondFactor({ claims: { fva: [100, -1] } })).toBe(false);
    expect(sessionHasSecondFactor({ factorVerificationAge: [100, -1] })).toBe(false);
  });
});
