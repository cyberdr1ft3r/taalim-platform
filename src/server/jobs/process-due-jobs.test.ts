import { describe, expect, it } from "vitest";
import { z } from "zod";
import { runClaimedJob, type JobHandler } from "./handlers";
import { claimNextJob, finalizeJob, processDueJobs, type JobStore } from "./process-due-jobs";
import { CLAIM_DUE_JOB_SQL, FINALIZE_JOB_SQL, RECOVER_STALE_LEASES_SQL } from "./sql";

describe("job foundation", () => {
  it("claims with skip locked and recovers stale leases without exceeding max attempts", () => {
    expect(CLAIM_DUE_JOB_SQL).toContain("FOR UPDATE SKIP LOCKED");
    expect(RECOVER_STALE_LEASES_SQL).toContain("15 minutes");
    expect(RECOVER_STALE_LEASES_SQL).toContain("attempts < max_attempts");
    expect(RECOVER_STALE_LEASES_SQL).toContain("failed");
    expect(RECOVER_STALE_LEASES_SQL).toContain("date_trunc('milliseconds', NOW())");
    expect(FINALIZE_JOB_SQL).toContain("date_trunc('milliseconds', NOW())");
    expect(FINALIZE_JOB_SQL).toContain("status = 'running'");
    expect(FINALIZE_JOB_SQL).toContain("locked_by = $4");
  });

  it("retries a failing handler until attempts are exhausted", async () => {
    const handlers: Record<string, JobHandler> = {
      "foundation.ping": {
        schema: z.object({ nonce: z.string() }),
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

  it("commits the claim before the handler and finalizes only for the owning worker", async () => {
    const events: string[] = [];
    const row = {
      id: "job_1",
      type: "foundation.ping",
      payload: { nonce: "synthetic" },
      attempts: 1,
      max_attempts: 5,
    };
    let claimed = false;
    const store: JobStore = {
      async $executeRawUnsafe(query: string, ...values: unknown[]) {
        const finalizing = query.includes("locked_by = $4");
        events.push(finalizing ? `finalize:${String(values[0])}:${String(values[3])}` : "recover");
        if (finalizing && values[3] !== "worker-test") return 0;
        return 1;
      },
      async $queryRawUnsafe() {
        events.push("claim");
        if (claimed) return [];
        claimed = true;
        return [row];
      },
      async $transaction(fn) {
        events.push("begin");
        const result = await fn(store);
        events.push("commit");
        return result;
      },
    };
    const processed = await processDueJobs(store, {
      workerId: "worker-test",
      limit: 1,
      handlers: {
        "foundation.ping": {
          schema: z.object({ nonce: z.string() }),
          handle: async () => {
            events.push("handler");
          },
        },
      },
    });
    expect(processed).toBe(1);
    expect(events).toEqual(["begin", "recover", "claim", "commit", "handler", "finalize:succeeded:worker-test"]);
    const lost = await finalizeJob(store, { id: "job_1", workerId: "other-worker", outcome: "succeeded" });
    expect(lost).toBe(false);
  });
});

describe("claimNextJob", () => {
  it("returns null when no due job is available", async () => {
    const store: JobStore = {
      async $executeRawUnsafe() {
        return 0;
      },
      async $queryRawUnsafe() {
        return [];
      },
      async $transaction(fn) {
        return fn(store);
      },
    };
    expect(await claimNextJob(store, "worker-test")).toBeNull();
  });
});
