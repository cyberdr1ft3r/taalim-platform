import { type ClaimedJob, type JobHandler, type JobOutcome, runClaimedJob } from "./handlers";
import { CLAIM_DUE_JOB_SQL, FINALIZE_JOB_SQL, RECOVER_STALE_LEASES_SQL } from "./sql";

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

/**
 * Short transaction: recover expired committed leases, then claim one due job.
 * The `running` lease is committed before this function returns.
 */
export async function claimNextJob(store: JobStore, workerId: string): Promise<ClaimedJob | null> {
  return store.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(RECOVER_STALE_LEASES_SQL);
    const rows = (await tx.$queryRawUnsafe(CLAIM_DUE_JOB_SQL, workerId)) as ClaimedRow[];
    const row = rows[0];
    if (!row) return null;
    return {
      id: row.id,
      type: row.type,
      payload: row.payload,
      attempts: row.attempts,
      maxAttempts: row.max_attempts,
    };
  });
}

/**
 * Separate update. An old worker cannot finalize a job after its lease was reclaimed.
 * A retry is immediately due again. There is no product backoff.
 */
export async function finalizeJob(
  store: JobStore,
  input: { id: string; workerId: string; outcome: JobOutcome },
): Promise<boolean> {
  const status = input.outcome === "succeeded" ? "succeeded" : input.outcome === "retry" ? "pending" : "failed";
  const lastError = input.outcome === "succeeded" ? null : "handler failed";
  const updated = await store.$executeRawUnsafe(FINALIZE_JOB_SQL, status, lastError, input.id, input.workerId);
  return updated === 1;
}

export async function processDueJobs(
  store: JobStore,
  options: { workerId: string; limit: number; handlers?: Record<string, JobHandler> },
): Promise<number> {
  let processed = 0;
  for (let index = 0; index < options.limit; index += 1) {
    const job = await claimNextJob(store, options.workerId);
    if (!job) break;
    const outcome = await runClaimedJob(job, options.handlers);
    const owned = await finalizeJob(store, { id: job.id, workerId: options.workerId, outcome });
    if (owned) processed += 1;
  }
  return processed;
}
