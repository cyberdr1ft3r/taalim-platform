import { describe, expect, it } from "vitest";
import { CLAIM_DUE_JOB_SQL, RELEASE_STALE_LOCKS_SQL } from "./sql";
import { processDueJobs, type JobStore } from "./process-due-jobs";
import { runClaimedJob, type JobHandler } from "./handlers";

describe("job foundation", () => {
  it("claims with skip locked and releases stale running locks", () => {
    expect(CLAIM_DUE_JOB_SQL).toContain("FOR UPDATE SKIP LOCKED");
    expect(RELEASE_STALE_LOCKS_SQL).toContain("15 minutes");
  });

  it("retries a failing handler until attempts are exhausted", async () => {
    const handlers: Record<string, JobHandler> = {
      "foundation.ping": {
        schema: (await import("zod")).z.object({ nonce: (await import("zod")).z.string() }),
        handle: async () => {
          throw new Error("synthetic failure");
        },
      },
    };
    expect(
      await runClaimedJob(
        { id: "job_1", type: "foundation.ping", payload: { nonce: "a" }, attempts: 1, maxAttempts: 5 },
        handlers,
      ),
    ).toBe("retry");
    expect(
      await runClaimedJob(
        { id: "job_1", type: "foundation.ping", payload: { nonce: "a" }, attempts: 5, maxAttempts: 5 },
        handlers,
      ),
    ).toBe("failed");
    expect(
      await runClaimedJob(
        { id: "job_1", type: "missing", payload: { nonce: "a" }, attempts: 1, maxAttempts: 5 },
        handlers,
      ),
    ).toBe("failed");
  });

  it("moves a claimed job to succeeded through the store", async () => {
    const updates: unknown[][] = [];
    const row = {
      id: "job_1",
      type: "foundation.ping",
      payload: { nonce: "synthetic" },
      attempts: 1,
      max_attempts: 5,
    };
    let claimed = false;
    const store: JobStore = {
      async $executeRawUnsafe(_query: string, ...values: unknown[]) {
        if (values.length > 0) updates.push(values);
        return 1;
      },
      async $queryRawUnsafe() {
        if (claimed) return [];
        claimed = true;
        return [row];
      },
      async $transaction(fn) {
        return fn(store);
      },
    };
    const processed = await processDueJobs(store, { workerId: "worker-test", limit: 5 });
    expect(processed).toBe(1);
    expect(updates[0]?.[0]).toBe("succeeded");
  });
});
