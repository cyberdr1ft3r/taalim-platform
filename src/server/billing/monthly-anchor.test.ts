import { describe, expect, it } from "vitest";
import { billingDateForMonth, nextBillingLocalDate } from "./monthly-anchor";

describe("monthly billing anchor", () => {
  it("clamps a 31st-day anchor in February and returns to the original day", () => {
    const feb = billingDateForMonth(2027, 2, 31);
    expect(feb).toEqual({ year: 2027, month: 2, day: 28 });
    expect(nextBillingLocalDate(feb, 31)).toEqual({ year: 2027, month: 3, day: 31 });
  });

  it("uses leap day when available", () => {
    expect(billingDateForMonth(2028, 2, 31)).toEqual({ year: 2028, month: 2, day: 29 });
  });

  it("preserves ordinary anchors", () => {
    expect(billingDateForMonth(2027, 4, 15)).toEqual({ year: 2027, month: 4, day: 15 });
  });
});
