import { describe, expect, it } from "vitest";
import { splitCommissionHalfUp } from "./commission";

describe("splitCommissionHalfUp", () => {
  it("rounds the platform commission half-up and balances the gross amount", () => {
    expect(splitCommissionHalfUp(10001, 2000)).toEqual({
      grossMinor: 10001,
      platformCommissionMinor: 2000,
      teacherPayableMinor: 8001,
    });
    expect(splitCommissionHalfUp(10003, 5000)).toEqual({
      grossMinor: 10003,
      platformCommissionMinor: 5002,
      teacherPayableMinor: 5001,
    });
  });

  it("keeps the split exact for edge rates", () => {
    expect(splitCommissionHalfUp(12345, 0)).toEqual({
      grossMinor: 12345,
      platformCommissionMinor: 0,
      teacherPayableMinor: 12345,
    });
    expect(splitCommissionHalfUp(12345, 10000)).toEqual({
      grossMinor: 12345,
      platformCommissionMinor: 12345,
      teacherPayableMinor: 0,
    });
  });

  it("rejects invalid inputs", () => {
    expect(() => splitCommissionHalfUp(-1, 1000)).toThrow();
    expect(() => splitCommissionHalfUp(100, 10001)).toThrow();
    expect(() => splitCommissionHalfUp(1.5, 1000)).toThrow();
  });
});
