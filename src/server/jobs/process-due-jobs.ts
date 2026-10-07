import { type JobHandler, type JobOutcome, runClaimedJob } from "./handlers";
import { CLAIM_DUE_JOB_SQL, RELEASE_STALE_LOCKS_SQL } from "./sql";

interface ClaimedRow {
  id: string;
  type: string;
  payload: unknown;
  attempts: number;
  max_attempts: number;
}

export interface JobStore {
  $executeRawUnsafe(query: string, ...values: unknown[]): Promise<number>;
  $queryRawUnsafe(query: string, ...values: unknown[]): Promise<unknown>;
  $transaction<T>(fn: (tx: JobStore) => Promise<T>): Promise<T>;
}

export async function processDueJobs(
  store: JobStore,
  options: { workerId: string; limit: number; handlers?: Record<string, JobHandler> },
): Promise<number> {
  await store.$executeRawUnsafe(RELEASE_STALE_LOCKS_SQL);
  let processed = 0;
  for (let index = 0; index < options.limit; index += 1) {
    const didProcess = await store.$transaction(async (tx) => {
      const rows = (await tx.$queryRawUnsafe(CLAIM_DUE_JOB_SQL, options.workerId)) as ClaimedRow[];
      const row = rows[0];
      if (!row) return false;
      const outcome: JobOutcome = await runClaimedJob(
        {
          id: row.id,
          type: row.type,
          payload: row.payload,
          attempts: row.attempts,
          maxAttempts: row.max_attempts,
        },
        options.handlers,
      );
      const status = outcome === "succeeded" ? "succeeded" : outcome === "retry" ? "pending" : "failed";
      const lastError = outcome === "succeeded" ? null : "handler failed";
      await tx.$executeRawUnsafe(
        `
        UPDATE background_jobs
        SET status = $1,
            last_error = $2,
            locked_at = NULL,
            locked_by = NULL,
            updated_at = NOW()
        WHERE id = $3
        `,
        status,
        lastError,
        row.id,
      );
      return true;
    });
    if (!didProcess) break;
    processed += 1;
  }
  return processed;
}
