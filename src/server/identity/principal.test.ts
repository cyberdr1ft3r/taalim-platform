import { describe, expect, it } from "vitest";
import { principalFromClerkUserId } from "./principal";

describe("principalFromClerkUserId", () => {
  it("keeps only the Clerk user id", () => {
    expect(principalFromClerkUserId("user_synthetic")).toEqual({ userId: "user_synthetic" });
    expect(principalFromClerkUserId(null)).toBeNull();
    expect(principalFromClerkUserId("")).toBeNull();
  });
});
