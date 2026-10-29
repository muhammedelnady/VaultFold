/**
 * Tests for exponential backoff and jitter retry policy.
 */

import { describe, expect, it } from "@jest/globals";

import { RetryPolicy, defaultTokenBucket } from "./retry-policy";

describe("RetryPolicy", () => {
  const policy = new RetryPolicy({ maxRetries: 2, baseDelayMs: 1000, random: () => 0.5 });

  it("does not retry 429: surfaces directly to caller", () => {
    const decision = policy.decide({ status: 429 }, 0, true);
    expect(decision.retry).toBe(false);
  });

  it("retries 5xx on GET up to maxRetries", () => {
    const attempt0 = policy.decide({ status: 500 }, 0, true);
    expect(attempt0.retry).toBe(true);
    expect(attempt0.delayMs).toBe(1000);

    const attempt1 = policy.decide({ status: 502 }, 1, true);
    expect(attempt1.retry).toBe(true);
    expect(attempt1.delayMs).toBe(2000);

    const attempt2 = policy.decide({ status: 503 }, 2, true);
    expect(attempt2.retry).toBe(false);
  });

  it("retries networkError on GET", () => {
    const attempt0 = policy.decide({ status: 0, networkError: true }, 0, true);
    expect(attempt0.retry).toBe(true);
    expect(attempt0.delayMs).toBe(1000);
  });

  it("does not retry other 4xx errors", () => {
    expect(policy.decide({ status: 400 }, 0, true).retry).toBe(false);
    expect(policy.decide({ status: 404 }, 0, true).retry).toBe(false);
  });

  it("never retries non-GET methods", () => {
    expect(policy.decide({ status: 500 }, 0, false).retry).toBe(false);
    expect(policy.decide({ status: 0, networkError: true }, 0, false).retry).toBe(false);
  });

  it("creates defaultTokenBucket with 6 capacity and 60s window", () => {
    const bucket = defaultTokenBucket();
    expect(bucket.untilAvailable().tokensAvailable).toBe(6);
  });
});
