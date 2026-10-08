import { beforeEach, describe, expect, it, vi } from "vitest";
import { RateLimitExceededError } from "./errors";
import { enforceRateLimit, RATE_LIMITS, resetRateLimits } from "./rate-limit";

vi.mock("server-only", () => ({}));

describe("rate limiting", () => {
  beforeEach(resetRateLimits);

  it("allows attempts up to the limit", () => {
    const now = 1_000_000;
    for (let i = 0; i < RATE_LIMITS.bootstrap.limit; i += 1) {
      expect(() => enforceRateLimit("subject-a", RATE_LIMITS.bootstrap, now)).not.toThrow();
    }
  });

  it("rejects the attempt past the limit with retry information", () => {
    const now = 1_000_000;
    for (let i = 0; i < RATE_LIMITS.bootstrap.limit; i += 1) {
      enforceRateLimit("subject-a", RATE_LIMITS.bootstrap, now);
    }
    try {
      enforceRateLimit("subject-a", RATE_LIMITS.bootstrap, now);
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(RateLimitExceededError);
      expect((error as RateLimitExceededError).retryAfterSeconds).toBeGreaterThan(0);
    }
  });

  it("resets after the window elapses", () => {
    const now = 1_000_000;
    for (let i = 0; i < RATE_LIMITS.bootstrap.limit; i += 1) {
      enforceRateLimit("subject-a", RATE_LIMITS.bootstrap, now);
    }
    expect(() =>
      enforceRateLimit("subject-a", RATE_LIMITS.bootstrap, now + RATE_LIMITS.bootstrap.windowMs),
    ).not.toThrow();
  });

  it("keeps buckets isolated per key", () => {
    const now = 1_000_000;
    for (let i = 0; i < RATE_LIMITS.bootstrap.limit; i += 1) {
      enforceRateLimit("subject-a", RATE_LIMITS.bootstrap, now);
    }
    expect(() => enforceRateLimit("subject-b", RATE_LIMITS.bootstrap, now)).not.toThrow();
  });

  it("keeps buckets isolated per rule", () => {
    const now = 1_000_000;
    for (let i = 0; i < RATE_LIMITS.bootstrap.limit; i += 1) {
      enforceRateLimit("subject-a", RATE_LIMITS.bootstrap, now);
    }
    expect(() => enforceRateLimit("subject-a", RATE_LIMITS.relationshipDecision, now)).not.toThrow();
  });
});
