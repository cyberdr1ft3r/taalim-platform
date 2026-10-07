import { getPrismaClient } from "../db/client";
import { loadEnv } from "../config/env";
import { createLogger } from "../logging/logger";
import { processDueJobs } from "./process-due-jobs";

const env = loadEnv();
const logger = createLogger({ level: env.LOG_LEVEL });

async function main(): Promise<void> {
  const workerId = `worker-${process.pid}`;
  logger.info({ workerId, taalimEnv: env.TAALIM_ENV }, "background worker started");
  const processed = await processDueJobs(getPrismaClient(), { workerId, limit: 10 });
  logger.info({ workerId, processed }, "background worker pass finished");
}

main().catch((error: unknown) => {
  logger.error(
    { errorName: error instanceof Error ? error.name : "unknown" },
    "background worker failed",
  );
  process.exitCode = 1;
});
