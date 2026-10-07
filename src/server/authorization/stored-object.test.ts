import { describe, expect, it } from "vitest";
import { authorizeStoredObjectRead } from "./stored-object";

const key = `so_${"ab".repeat(16)}`;

describe("authorizeStoredObjectRead", () => {
  it("denies access when the relationship is not allowed, even if the caller knows the key", () => {
    expect(
      authorizeStoredObjectRead({
        principalId: "user_synthetic",
        key,
        relationship: { allowed: false },
      }).allowed,
    ).toBe(false);
  });

  it("denies access with no principal", () => {
    expect(
      authorizeStoredObjectRead({
        principalId: null,
        key,
        relationship: { allowed: true },
      }).allowed,
    ).toBe(false);
  });

  it("denies a tampered key", () => {
    expect(
      authorizeStoredObjectRead({
        principalId: "user_synthetic",
        key: "../public/secret",
        relationship: { allowed: true },
      }).allowed,
    ).toBe(false);
  });

  it("allows a known opaque key only when the relationship allows it", () => {
    expect(
      authorizeStoredObjectRead({
        principalId: "user_synthetic",
        key,
        relationship: { allowed: true },
      }).allowed,
    ).toBe(true);
  });
});
