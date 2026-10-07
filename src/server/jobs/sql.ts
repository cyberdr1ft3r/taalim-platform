/** Infrastructure lease for a crashed worker. This is not a product time limit. */
export const STALE_LOCK_LEASE = "15 minutes";

/**
 * `background_jobs.run_at` is `timestamp(3)`. Assigning `NOW()` can round up
 * by a fraction of a millisecond and leave the row not yet due. Truncating
 * makes an immediate retry claimable in the same transaction.
 */
export const IMMEDIATE_RUN_AT_SQL = "date_trunc('milliseconds', NOW())";

/**
 * Committed `running` rows whose lease has expired.
 * Attempts still under the maximum return to `pending`.
 * A row already at `max_attempts` becomes `failed` and is not requeued.
 */
export const RECOVER_STALE_LEASES_SQL = `
UPDATE background_jobs
SET status = CASE
      WHEN attempts < max_attempts THEN 'pending'
      ELSE 'failed'
    END,
    last_error = CASE
      WHEN attempts < max_attempts THEN NULL
      ELSE 'lease expired'
    END,
    locked_at = NULL,
    locked_by = NULL,
    run_at = CASE
      WHEN attempts < max_attempts THEN ${IMMEDIATE_RUN_AT_SQL}
      ELSE run_at
    END,
    updated_at = NOW()
WHERE status = 'running'
  AND locked_at < NOW() - INTERVAL '${STALE_LOCK_LEASE}'
`;

export const CLAIM_DUE_JOB_SQL = `
WITH next_job AS (
  SELECT id
  FROM background_jobs
  WHERE status = 'pending'
    AND run_at <= NOW()
  ORDER BY run_at ASC, id ASC
  FOR UPDATE SKIP LOCKED
  LIMIT 1
)
UPDATE background_jobs AS job
SET status = 'running',
    locked_at = NOW(),
    locked_by = $1,
    attempts = job.attempts + 1,
    updated_at = NOW()
FROM next_job
WHERE job.id = next_job.id
RETURNING job.id, job.type, job.payload, job.attempts, job.max_attempts
`;

/** Updates a row only while this worker still owns the committed lease. */
export const FINALIZE_JOB_SQL = `
UPDATE background_jobs
SET status = $1,
    last_error = $2,
    locked_at = NULL,
    locked_by = NULL,
    run_at = CASE WHEN $1 = 'pending' THEN ${IMMEDIATE_RUN_AT_SQL} ELSE run_at END,
    updated_at = NOW()
WHERE id = $3
  AND status = 'running'
  AND locked_by = $4
`;
