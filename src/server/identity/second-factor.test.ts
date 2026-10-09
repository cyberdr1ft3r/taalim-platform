import { describe, expect, it, vi } from "vitest";
import { sessionHasSecondFactor } from "./second-factor";

vi.mock("server-only", () => ({}));

describe("sessionHasSecondFactor", () => {
  it("accepts a verified second-factor age from the fva claim", () => {
    expect(sessionHasSecondFactor({ claims: { fva: [100, 50] } })).toBe(true);
    expect(sessionHasSecondFactor({ claims: { fva: [100, 0] } })).toBe(true);
  });

  it("accepts a verified second-factor age from the auth-object tuple", () => {
    expect(sessionHasSecondFactor({ factorVerificationAge: [100, 50] })).toBe(true);
    expect(sessionHasSecondFactor({ factorVerificationAge: [100, 0] })).toBe(true);
  });

  it("fails closed when the second factor was never verified in fva", () => {
    expect(sessionHasSecondFactor({ claims: { fva: [100, -1] } })).toBe(false);
    expect(sessionHasSecondFactor({ factorVerificationAge: [100, -1] })).toBe(false);
  });

  it("does not let amr or a passkey entry override an explicit fva absence", () => {
    expect(
      sessionHasSecondFactor({
        claims: {
          amr: [
            { method: "password", timestamp: 1000 },
            { method: "totp", timestamp: 2000 },
          ],
          fva: [100, -1],
        },
      }),
    ).toBe(false);
    expect(
      sessionHasSecondFactor({
        claims: { amr: [{ method: "passkey", timestamp: 1000 }], fva: [100, -1] },
        factorVerificationAge: [100, -1],
      }),
    ).toBe(false);
  });

  it("does not treat amr alone as second-factor evidence", () => {
    expect(
      sessionHasSecondFactor({
        claims: {
          amr: [
            { method: "password", timestamp: 1000 },
            { method: "totp", timestamp: 2000 },
          ],
        },
      }),
    ).toBe(false);
    expect(
      sessionHasSecondFactor({ claims: { amr: [{ method: "passkey", timestamp: 1000 }] } }),
    ).toBe(false);
  });

  it("fails closed when fva evidence is absent or malformed", () => {
    expect(sessionHasSecondFactor({ claims: {} })).toBe(false);
    expect(sessionHasSecondFactor({ claims: null })).toBe(false);
    expect(sessionHasSecondFactor({})).toBe(false);
    expect(sessionHasSecondFactor({ claims: { fva: [100] } })).toBe(false);
    expect(sessionHasSecondFactor({ claims: { fva: [100, "50"] } })).toBe(false);
    expect(sessionHasSecondFactor({ claims: { fva: "100,50" } })).toBe(false);
  });

  it("prefers the claims fva over the auth-object tuple when both exist", () => {
    expect(
      sessionHasSecondFactor({
        claims: { fva: [100, -1] },
        factorVerificationAge: [100, 50],
      }),
    ).toBe(false);
    expect(
      sessionHasSecondFactor({
        claims: { fva: [100, 50] },
        factorVerificationAge: [100, -1],
      }),
    ).toBe(true);
  });
});
