import { describe, expect, it } from "vitest";
import { FakePaymentProvider } from "./fake-provider";

describe("FakePaymentProvider", () => {
  it("creates a fake intent and can mark that same intent succeeded", async () => {
    const payments = new FakePaymentProvider();
    const created = await payments.createIntent({
      amountMinor: 15000,
      currency: "MAD",
      reference: "synthetic-reference",
    });
    expect(created.provider).toBe("fake");
    expect(created.status).toBe("fake_pending");
    const succeeded = await payments.markSucceeded(created.id);
    expect(succeeded.status).toBe("fake_succeeded");
    expect(succeeded.id).toBe(created.id);
  });

  it("does not succeed an unknown intent", async () => {
    const payments = new FakePaymentProvider();
    await expect(payments.markSucceeded("fake_missing")).rejects.toThrow(/not found/);
  });
});
