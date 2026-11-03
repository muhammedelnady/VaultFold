/**
 * Tests for TokenBucket rate limiter implementation.
 */

import { describe, expect, it } from "@jest/globals";

import { TokenBucket, parseRetryAfter, withJitter } from "./token-bucket";

function bucketWithClock(initialTime: number) {
  let time = initialTime;
  const bucket = new TokenBucket({ capacity: 6, windowMs: 60_000, now: () => time });
  return {
    bucket,
    advance: (ms: number) => {
      time += ms;
    },
    time: () => time,
  };
}

const START = 1_790_000_000_000;

describe("TokenBucket (verified keyless profile)", () => {
  it("allows a burst of 6 then shuts the gate", () => {
    const ctx = bucketWithClock(START);
    for (let i = 0; i < 6; i++) {
      expect(ctx.bucket.trySpend()).toBe(true);
    }
    expect(ctx.bucket.trySpend()).toBe(false);
  });

  it("refills to capacity when the 60 s window expires", () => {
    const ctx = bucketWithClock(START);
    for (let i = 0; i < 6; i++) ctx.bucket.trySpend();
    ctx.advance(60_001);
    expect(ctx.bucket.untilAvailable()).toEqual({ tokensAvailable: 6, waitMs: 0 });
  });

  it("reports waitMs until the window reset when empty", () => {
    const ctx = bucketWithClock(START);
    for (let i = 0; i < 6; i++) ctx.bucket.trySpend();
    ctx.advance(20_000);
    const budget = ctx.bucket.untilAvailable();
    expect(budget.tokensAvailable).toBe(0);
    expect(budget.waitMs).toBe(40_000);
  });

  it("penalize empties the bucket and shifts the window to Retry-After", () => {
    const ctx = bucketWithClock(START);
    for (let i = 0; i < 6; i++) ctx.bucket.trySpend();
    ctx.bucket.penalize(30_000);
    ctx.advance(29_999);
    expect(ctx.bucket.trySpend()).toBe(false);
    ctx.advance(2);
    expect(ctx.bucket.trySpend()).toBe(true);
  });

  it("models the observed Retry-After countdown (60→24s sequence)", () => {
    const ctx = bucketWithClock(START);
    for (let i = 0; i < 6; i++) ctx.bucket.trySpend();
    for (const retryAfter of [60, 53, 45, 38, 31, 24]) {
      ctx.bucket.penalize(retryAfter * 1000);
    }
    ctx.advance(23_999);
    expect(ctx.bucket.trySpend()).toBe(false);
    ctx.advance(1);
    expect(ctx.bucket.trySpend()).toBe(true);
  });

  it("reset restores bucket to full capacity immediately", () => {
    const ctx = bucketWithClock(START);
    ctx.bucket.trySpend();
    ctx.bucket.trySpend();
    expect(ctx.bucket.untilAvailable().tokensAvailable).toBe(4);
    ctx.bucket.reset();
    expect(ctx.bucket.untilAvailable().tokensAvailable).toBe(6);
  });
});

describe("parseRetryAfter", () => {
  it("parses delay-seconds form", () => {
    expect(parseRetryAfter("53")).toBe(53_000);
  });
  it("parses HTTP-date form", () => {
    const futureDate = new Date(Date.now() + 15_000).toUTCString();
    const wait = parseRetryAfter(futureDate);
    expect(wait).toBeGreaterThan(10_000);
    expect(wait).toBeLessThanOrEqual(16_000);
  });
  it("defaults to 60s when missing or garbage", () => {
    expect(parseRetryAfter(null)).toBe(60_000);
    expect(parseRetryAfter("soon-ish")).toBe(60_000);
  });
});

describe("withJitter", () => {
  it("stays within ±5%", () => {
    expect(withJitter(10_000, () => 0)).toBe(9_500);
    expect(withJitter(10_000, () => 1)).toBe(10_500);
    expect(withJitter(10_000, () => 0.5)).toBe(10_000);
  });
});
