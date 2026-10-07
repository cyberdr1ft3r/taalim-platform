/** Infrastructure lease for a crashed worker. This is not a product time limit. */
export const STALE_LOCK_LEASE = "15 minutes";

export const RELEASE_STALE_LOCKS_SQL = `
UPDATE background_jobs
SET status = 'pending',
    locked_at = NULL,
    locked_by = NULL,
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
