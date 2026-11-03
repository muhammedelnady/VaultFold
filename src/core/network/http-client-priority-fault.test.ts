/**
 * Priority + fault injection tests for HttpClient.
 *
 * Priority: foreground callers spend tokens unconditionally; prefetch callers
 * check tokens first and return rate-limited when tokens ≤ reserve (default 1).
 * Fault seam: optional `fault` in attempt injected before fetch, returns a
 * synthetic 429 with Retry-After, penalizes the bucket, jitter via withJitter.
 */

import { describe, expect, it, jest } from "@jest/globals";

import { Connectivity } from "../offline/connectivity";

import { HttpClient } from "./http-client";
import { TokenBucket, withJitter } from "./token-bucket";

function makeFetchStub(handler: (url: string, init: RequestInit) => Promise<Response>) {
  return jest.fn(handler) as unknown as typeof fetch;
}

const baseHeaders = { accept: "application/json" };

function ok(json: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(json), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

function clientFor(
  connectivity: Connectivity,
  overrides: Partial<ConstructorParameters<typeof HttpClient>[0]> = {},
): HttpClient {
  return new HttpClient({
    connectivity,
    defaultHeaders: baseHeaders,
    bucket: new TokenBucket({ capacity: 6, windowMs: 60_000 }),
    ...overrides,
  });
}

describe("HttpClient — priority + fault seam", () => {
  describe("priority: foreground spends unconditionally; prefetch checks reserve", () => {
    it("foreground get() spends when bucket has 0 tokens (exhausted)", async () => {
      const connectivity = new Connectivity();
      const bucket = new TokenBucket({ capacity: 1, windowMs: 60_000, now: () => 0 });
      bucket.spend();
      expect(bucket.untilAvailable().tokensAvailable).toBe(0);

      globalThis.fetch = makeFetchStub(async () => ok({ data: "ok" }));
      const client = clientFor(connectivity, { bucket });
      const result = await client.get("https://api.coingecko.com/api/v3/x");
      expect(result).toMatchObject({ kind: "ok" });
    });

    it("prefetch get() returns rate-limited when tokens ≤ reserve (default 1)", async () => {
      const connectivity = new Connectivity();
      const bucket = new TokenBucket({ capacity: 1, windowMs: 60_000, now: () => 0 });
      expect(bucket.untilAvailable().tokensAvailable).toBe(1);

      globalThis.fetch = makeFetchStub(async () => ok({ data: "ok" }));
      const client = clientFor(connectivity, { bucket });
      const result = await client.get("https://api.coingecko.com/api/v3/x", {
        priority: "prefetch",
      });
      expect(result).toMatchObject({ kind: "err", error: { kind: "rate-limited" } });
    });

    it("prefetch get() succeeds when tokens > reserve", async () => {
      const connectivity = new Connectivity();
      const bucket = new TokenBucket({ capacity: 2, windowMs: 60_000, now: () => 0 });
      expect(bucket.untilAvailable().tokensAvailable).toBe(2);

      globalThis.fetch = makeFetchStub(async () => ok({ data: "ok" }));
      const client = clientFor(connectivity, { bucket });
      const result = await client.get("https://api.coingecko.com/api/v3/x", {
        priority: "prefetch",
      });
      expect(result).toMatchObject({ kind: "ok" });
    });
  });

  describe("fault injection: fault callback in attempt() before fetch", () => {
    it("fault returning 429 + retry-after penalizes bucket and returns rate-limited", async () => {
      const connectivity = new Connectivity();
      const bucket = new TokenBucket({ capacity: 6, windowMs: 60_000 });
      let faultCall = 0;

      const client = clientFor(connectivity, {
        bucket,
        fault: () => {
          faultCall += 1;
          return { status: 429, retryAfterMs: 30_000 };
        },
      });

      const result = await client.get("https://api.coingecko.com/api/v3/x");
      expect(faultCall).toBe(1);
      expect(result).toMatchObject({ kind: "err", error: { kind: "rate-limited" } });
      if (result.kind === "err" && result.error.kind === "rate-limited") {
        expect(result.error.retryAfterMs).toBeGreaterThanOrEqual(28_500);
        expect(result.error.retryAfterMs).toBeLessThanOrEqual(31_500);
      }
      const budget = bucket.untilAvailable();
      expect(budget.tokensAvailable).toBe(0);
      expect(budget.waitMs).toBeGreaterThan(0);
    });

    it("fault returning null proceeds normally (no injection)", async () => {
      const connectivity = new Connectivity();
      let faultCall = 0;

      globalThis.fetch = makeFetchStub(async () => ok({ data: "ok" }));
      const client = clientFor(connectivity, {
        fault: () => {
          faultCall += 1;
          return null;
        },
      });

      const result = await client.get("https://api.coingecko.com/api/v3/x");
      expect(faultCall).toBe(1);
      expect(result).toMatchObject({ kind: "ok" });
    });
  });

  describe("withJitter ±5%", () => {
    it("produces values in [0.95, 1.05] * input", () => {
      const random = () => 0.5;
      expect(withJitter(1000, random)).toBe(1000);
      const randomMax = () => 1;
      expect(withJitter(1000, randomMax)).toBe(1050);
      const randomMin = () => 0;
      expect(withJitter(1000, randomMin)).toBe(950);
    });
  });
});
