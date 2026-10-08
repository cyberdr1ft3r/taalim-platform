import "server-only";
import { RateLimitExceededError } from "./errors";

export interface RateLimitRule {
  /** Maximum number of attempts per window. */
  limit: number;
  windowMs: number;
}

/**
 * Fixed-window in-process rate limiting for abuse-sensitive endpoints
 * (account bootstrap, relationship mutations, session revocation, temporary
 * access issuance).
 *
 * Intentionally process-local: ADR 0003 keeps the baseline free of Redis and
 * the current deployment runs a single web process. Horizontal scaling or
 * multi-region deployments must replace this with a shared limiter before
 * relying on the limits for security. See docs/architecture/authentication.md.
 */
interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export const RATE_LIMITS = {
  bootstrap: { limit: 10, windowMs: 60_000 },
  relationshipCreate: { limit: 20, windowMs: 60_000 },
  relationshipDecision: { limit: 60, windowMs: 60_000 },
  sessionRevoke: { limit: 30, windowMs: 60_000 },
  temporaryAccess: { limit: 30, windowMs: 60_000 },
} as const satisfies Record<string, RateLimitRule>;

/** Throws RateLimitExceededError when the caller has exhausted its window. */
export function enforceRateLimit(
  key: string,
  rule: RateLimitRule,
  now: number = Date.now(),
): void {
  prune(now);
  const bucketKey = `${key}:${rule.limit}:${rule.windowMs}`;
  const bucket = buckets.get(bucketKey);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(bucketKey, { count: 1, resetAt: now + rule.windowMs });
    return;
  }
  bucket.count += 1;
  if (bucket.count > rule.limit) {
    throw new RateLimitExceededError(Math.max(bucket.resetAt - now, 0));
  }
}

function prune(now: number): void {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

/** Test hook. */
export function resetRateLimits(): void {
  buckets.clear();
}
