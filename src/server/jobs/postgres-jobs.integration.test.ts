import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { getPrismaClient } from "../db/client";
import { jobHandlers } from "./handlers";
import { processDueJobs } from "./process-due-jobs";

const enabled = process.env.TAALIM_RUN_DB_TESTS === "1";

describe.skipIf(!enabled)("postgres background jobs", () => {
  const prisma = enabled ? getPrismaClient() : null;

  beforeEach(async () => {
    if (!prisma) return;
    await prisma.backgroundJob.deleteMany({ where: { status: "pending" } });
  });

  afterAll(async () => {
    if (!prisma) return;
    await prisma.backgroundJob.deleteMany({ where: { type: "foundation.ping" } });
    await prisma.$disconnect();
  });

  it("claims a due foundation.ping job once", async () => {
    if (!prisma) return;
    const created = await prisma.backgroundJob.create({
      data: {
        type: "foundation.ping",
        payload: { nonce: "synthetic" },
        status: "pending",
        runAt: new Date(Date.now() - 1000),
      },
    });
    const processed = await processDueJobs(prisma, {
      workerId: "worker-integration",
      limit: 5,
      handlers: jobHandlers,
    });
    expect(processed).toBeGreaterThanOrEqual(1);
    const stored = await prisma.backgroundJob.findUniqueOrThrow({ where: { id: created.id } });
    expect(stored.status).toBe("succeeded");
    const second = await processDueJobs(prisma, { workerId: "worker-integration", limit: 5 });
    const again = await prisma.backgroundJob.findUniqueOrThrow({ where: { id: created.id } });
    expect(again.status).toBe("succeeded");
    expect(again.attempts).toBe(1);
    expect(second).toBe(0);
  });

  it("does not let two workers commit the same job", async () => {
    if (!prisma) return;
    const created = await prisma.backgroundJob.create({
      data: {
        type: "foundation.ping",
        payload: { nonce: "synthetic-concurrent" },
        status: "pending",
        runAt: new Date(Date.now() - 1000),
      },
    });
    const [first, second] = await Promise.all([
      processDueJobs(prisma, { workerId: "worker-a", limit: 1, handlers: jobHandlers }),
      processDueJobs(prisma, { workerId: "worker-b", limit: 1, handlers: jobHandlers }),
    ]);
    const stored = await prisma.backgroundJob.findUniqueOrThrow({ where: { id: created.id } });
    expect(stored.status).toBe("succeeded");
    expect(stored.attempts).toBe(1);
    expect(first + second).toBe(1);
  });
});
