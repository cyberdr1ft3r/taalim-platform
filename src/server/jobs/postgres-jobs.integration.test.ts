import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { getPrismaClient } from "../db/client";
import { jobHandlers, type JobHandler } from "./handlers";
import { claimNextJob, finalizeJob, processDueJobs } from "./process-due-jobs";

const enabled = process.env.TAALIM_RUN_DB_TESTS === "1";

describe.skipIf(!enabled)("postgres background jobs", () => {
  const prisma = enabled ? getPrismaClient() : null;

  beforeEach(async () => {
    if (!prisma) return;
    await prisma.backgroundJob.deleteMany({ where: { type: "foundation.ping" } });
  });

  afterAll(async () => {
    if (!prisma) return;
    await prisma.backgroundJob.deleteMany({ where: { type: "foundation.ping" } });
    await prisma.$disconnect();
  });

  async function insertPing(input: {
    nonce: string;
    status?: string;
    attempts?: number;
    maxAttempts?: number;
    lockedBy?: string | null;
    runAt?: Date;
  }) {
    if (!prisma) throw new Error("postgres tests are disabled");
    return prisma.backgroundJob.create({
      data: {
        type: "foundation.ping",
        payload: { nonce: input.nonce },
        status: input.status ?? "pending",
        attempts: input.attempts ?? 0,
        maxAttempts: input.maxAttempts ?? 5,
        lockedBy: input.lockedBy ?? null,
        runAt: input.runAt ?? new Date(Date.now() - 1000),
      },
    });
  }

  async function setLockAge(id: string, age: "stale" | "fresh") {
    if (!prisma) throw new Error("postgres tests are disabled");
    const interval = age === "stale" ? "16 minutes" : "0 minutes";
    await prisma.$executeRawUnsafe(
      `UPDATE background_jobs SET locked_at = NOW() - INTERVAL '${interval}' WHERE id = $1`,
      id,
    );
  }

  it("succeeds a foundation.ping job exactly once", async () => {
    if (!prisma) return;
    const created = await insertPing({ nonce: "synthetic-once" });
    const processed = await processDueJobs(prisma, {
      workerId: "worker-integration",
      limit: 5,
      handlers: jobHandlers,
    });
    expect(processed).toBe(1);
    const stored = await prisma.backgroundJob.findUniqueOrThrow({ where: { id: created.id } });
    expect(stored.status).toBe("succeeded");
    expect(stored.attempts).toBe(1);
    expect(stored.lockedBy).toBeNull();
    const second = await processDueJobs(prisma, { workerId: "worker-integration", limit: 5 });
    expect(second).toBe(0);
    const again = await prisma.backgroundJob.findUniqueOrThrow({ where: { id: created.id } });
    expect(again.attempts).toBe(1);
  });

  it("does not let two workers claim the same job", async () => {
    if (!prisma) return;
    const created = await insertPing({ nonce: "synthetic-concurrent" });
    const [first, second] = await Promise.all([
      claimNextJob(prisma, "worker-a"),
      claimNextJob(prisma, "worker-b"),
    ]);
    const claims = [first, second].filter((job) => job !== null);
    expect(claims).toHaveLength(1);
    expect(claims[0]?.id).toBe(created.id);
    expect(claims[0]?.attempts).toBe(1);
    const stored = await prisma.backgroundJob.findUniqueOrThrow({ where: { id: created.id } });
    expect(stored.status).toBe("running");
    expect(stored.attempts).toBe(1);
    expect([first?.id, second?.id].filter(Boolean)).toEqual([created.id]);
    expect(stored.lockedBy === "worker-a" || stored.lockedBy === "worker-b").toBe(true);
  });

  it("shows a committed running lease while the handler is still executing", async () => {
    if (!prisma) return;
    const created = await insertPing({ nonce: "synthetic-visible" });
    let seen: { status: string; lockedBy: string | null; attempts: number } | null = null;
    const handlers: Record<string, JobHandler> = {
      "foundation.ping": {
        schema: jobHandlers["foundation.ping"].schema,
        handle: async () => {
          const row = await prisma.backgroundJob.findUniqueOrThrow({ where: { id: created.id } });
          seen = { status: row.status, lockedBy: row.lockedBy, attempts: row.attempts };
        },
      },
    };
    const processed = await processDueJobs(prisma, { workerId: "worker-visible", limit: 1, handlers });
    expect(processed).toBe(1);
    expect(seen).toEqual({ status: "running", lockedBy: "worker-visible", attempts: 1 });
    const finished = await prisma.backgroundJob.findUniqueOrThrow({ where: { id: created.id } });
    expect(finished.status).toBe("succeeded");
    expect(finished.attempts).toBe(1);
  });

  it("does not claim an unexpired running job", async () => {
    if (!prisma) return;
    const created = await insertPing({
      nonce: "synthetic-fresh-lease",
      status: "running",
      attempts: 1,
      lockedBy: "worker-owner",
    });
    await setLockAge(created.id, "fresh");
    const claimed = await claimNextJob(prisma, "worker-other");
    expect(claimed).toBeNull();
    const stored = await prisma.backgroundJob.findUniqueOrThrow({ where: { id: created.id } });
    expect(stored.status).toBe("running");
    expect(stored.lockedBy).toBe("worker-owner");
    expect(stored.attempts).toBe(1);
  });

  it("requeues a stale running job and lets another worker claim one of them", async () => {
    if (!prisma) return;
    const older = await insertPing({
      nonce: "synthetic-stale-older",
      status: "running",
      attempts: 1,
      maxAttempts: 5,
      lockedBy: "worker-dead",
      runAt: new Date(Date.now() - 120_000),
    });
    const newer = await insertPing({
      nonce: "synthetic-stale-newer",
      status: "running",
      attempts: 1,
      maxAttempts: 5,
      lockedBy: "worker-dead",
      runAt: new Date(Date.now() - 60_000),
    });
    await setLockAge(older.id, "stale");
    await setLockAge(newer.id, "stale");
    const claimed = await claimNextJob(prisma, "worker-new");
    expect(claimed?.id).toBe(older.id);
    expect(claimed?.attempts).toBe(2);
    const claimedRow = await prisma.backgroundJob.findUniqueOrThrow({ where: { id: older.id } });
    expect(claimedRow.status).toBe("running");
    expect(claimedRow.lockedBy).toBe("worker-new");
    const waiting = await prisma.backgroundJob.findUniqueOrThrow({ where: { id: newer.id } });
    expect(waiting.status).toBe("pending");
    expect(waiting.lockedBy).toBeNull();
    expect(waiting.lockedAt).toBeNull();
    expect(waiting.attempts).toBe(1);
  });

  it("fails a stale job that has no attempts remaining", async () => {
    if (!prisma) return;
    const created = await insertPing({
      nonce: "synthetic-stale-exhausted",
      status: "running",
      attempts: 5,
      maxAttempts: 5,
      lockedBy: "worker-dead",
    });
    await setLockAge(created.id, "stale");
    const claimed = await claimNextJob(prisma, "worker-new");
    expect(claimed).toBeNull();
    const stored = await prisma.backgroundJob.findUniqueOrThrow({ where: { id: created.id } });
    expect(stored.status).toBe("failed");
    expect(stored.attempts).toBe(5);
    expect(stored.lockedBy).toBeNull();
    expect(stored.lockedAt).toBeNull();
    expect(stored.lastError).toBe("lease expired");
  });

  it("refuses finalization after another worker reclaims the lease", async () => {
    if (!prisma) return;
    const created = await insertPing({
      nonce: "synthetic-stolen-lease",
      status: "running",
      attempts: 1,
      maxAttempts: 5,
      lockedBy: "worker-old",
    });
    await setLockAge(created.id, "stale");
    const reclaimed = await claimNextJob(prisma, "worker-new");
    expect(reclaimed?.id).toBe(created.id);
    expect(reclaimed?.attempts).toBe(2);
    const stolen = await finalizeJob(prisma, {
      id: created.id,
      workerId: "worker-old",
      outcome: "succeeded",
    });
    expect(stolen).toBe(false);
    const stored = await prisma.backgroundJob.findUniqueOrThrow({ where: { id: created.id } });
    expect(stored.status).toBe("running");
    expect(stored.lockedBy).toBe("worker-new");
    expect(stored.attempts).toBe(2);
  });

  it("increments attempts on each committed claim", async () => {
    if (!prisma) return;
    const created = await insertPing({ nonce: "synthetic-attempts", maxAttempts: 5 });
    const first = await claimNextJob(prisma, "worker-1");
    expect(first?.attempts).toBe(1);
    const released = await finalizeJob(prisma, {
      id: created.id,
      workerId: "worker-1",
      outcome: "retry",
    });
    expect(released).toBe(true);
    const afterRetry = await prisma.backgroundJob.findUniqueOrThrow({ where: { id: created.id } });
    expect(afterRetry.status).toBe("pending");
    expect(afterRetry.attempts).toBe(1);
    expect(afterRetry.lockedBy).toBeNull();
    const second = await claimNextJob(prisma, "worker-2");
    expect(second?.attempts).toBe(2);
    const stored = await prisma.backgroundJob.findUniqueOrThrow({ where: { id: created.id } });
    expect(stored.status).toBe("running");
    expect(stored.lockedBy).toBe("worker-2");
    expect(stored.attempts).toBe(2);
  });
});
