/**
 * Unit tests for HttpClient retry policies, backoff handling, and rate limiting.
 */

import { describe, expect, it, jest } from "@jest/globals";

import { Connectivity } from "../offline/connectivity";

import { HttpClient } from "./http-client";
import { RetryPolicy } from "./retry-policy";
import { TokenBucket } from "./token-bucket";

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

describe("HttpClient - Retries & Rate Limiting", () => {
  it("surfaces 429 as RateLimited carrying the server's Retry-After, and the caller reschedules", async () => {
    const connectivity = new Connectivity();
    let calls = 0;
    globalThis.fetch = makeFetchStub(async () => {
      calls += 1;
      return new Response(JSON.stringify({ status: { error_code: 429 } }), {
        status: 429,
        headers: { "retry-after": "30" },
      });
    });
    const result = await clientFor(connectivity).get(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd",
    );

    expect(result).toMatchObject({ kind: "err", error: { kind: "rate-limited" } });
    if (result.kind === "err" && result.error.kind === "rate-limited") {
      expect(result.error.retryAfterMs).toBeGreaterThanOrEqual(28_000);
      expect(result.error.retryAfterMs).toBeLessThanOrEqual(32_000);
    }
    expect(calls).toBe(1);
  });

  it("retries 5xx twice then reports Http error", async () => {
    const connectivity = new Connectivity();
    let calls = 0;
    globalThis.fetch = makeFetchStub(async () => {
      calls += 1;
      return new Response("boom", { status: 502 });
    });
    const client = clientFor(connectivity, {
      retryPolicy: new RetryPolicy({ maxRetries: 2, baseDelayMs: 100, random: () => 0.5 }),
      delayFn: async () => undefined,
    });

    const result = await client.get("https://api.coingecko.com/api/v3/x");

    expect(result).toMatchObject({ kind: "err", error: { kind: "http", status: 502 } });
    expect(calls).toBe(3);
  });

  it("does not retry validation errors (4xx other than 429)", async () => {
    const connectivity = new Connectivity();
    globalThis.fetch = makeFetchStub(
      async () => new Response('{"error":"invalid vs_currency"}', { status: 400 }),
    );
    const result = await clientFor(connectivity).get(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=egp",
    );

    expect(result).toMatchObject({ kind: "err", error: { kind: "http", status: 400 } });
  });

  it("rejects prefetch when tokens are completely exhausted (waitMs > 0)", async () => {
    const connectivity = new Connectivity();
    const bucket = new TokenBucket({ capacity: 1, windowMs: 60_000 });
    bucket.spend();
    const client = clientFor(connectivity, { bucket });
    const res = await client.get("https://api.coingecko.com/api/v3/prefetch-exhausted", {
      priority: "prefetch",
    });
    expect(res).toMatchObject({
      kind: "err",
      error: { kind: "rate-limited" },
    });
  });

  it("retries when decision delayMs is 0", async () => {
    const connectivity = new Connectivity();
    let attempt = 0;
    globalThis.fetch = makeFetchStub(async () => {
      attempt += 1;
      if (attempt === 1) {
        return new Response("Service Unavailable", { status: 503 });
      }
      return ok({ ok: true });
    });
    const zeroDelayPolicy = {
      decide: (_attempt: unknown, attemptIndex: number) => ({
        retry: attemptIndex === 0,
        delayMs: 0,
      }),
    };
    const client = new HttpClient({
      connectivity,
      defaultHeaders: baseHeaders,
      bucket: new TokenBucket({ capacity: 6, windowMs: 60_000 }),
      retryPolicy: zeroDelayPolicy as never,
    });
    const res = await client.get("https://api.coingecko.com/api/v3/zero-delay-retry");
    expect(res.kind).toBe("ok");
    expect(attempt).toBe(2);
  });

  it("retries transient failure and succeeds on next attempt with delay", async () => {
    const connectivity = new Connectivity();
    let attempt = 0;
    globalThis.fetch = makeFetchStub(async () => {
      attempt += 1;
      if (attempt === 1) {
        return new Response("Service Unavailable", { status: 503 });
      }
      return ok({ restored: true });
    });
    const retryPolicy = new RetryPolicy({ maxRetries: 2, baseDelayMs: 5 });
    const client = new HttpClient({
      connectivity,
      defaultHeaders: baseHeaders,
      bucket: new TokenBucket({ capacity: 6, windowMs: 60_000 }),
      retryPolicy,
    });
    const res = await client.get("https://api.coingecko.com/api/v3/retry-test");
    expect(res.kind).toBe("ok");
    expect(attempt).toBe(2);
  });

  it("handles 429 without Retry-After header using fallback delay", async () => {
    const connectivity = new Connectivity();
    globalThis.fetch = makeFetchStub(async () => new Response("Rate limited", { status: 429 }));
    const client = clientFor(connectivity);
    const res = await client.get("https://api.coingecko.com/api/v3/no-retry-after");
    expect(res.kind).toBe("err");
    if (res.kind === "err") {
      expect(res.error.kind).toBe("rate-limited");
    }
  });

  it("rejects prefetch when token bucket reserve is exceeded", async () => {
    const connectivity = new Connectivity();
    const bucket = new TokenBucket({ capacity: 2, windowMs: 60_000 });
    bucket.spend();
    const client = clientFor(connectivity, { bucket });
    const res = await client.get("https://api.coingecko.com/api/v3/prefetch-denied", {
      priority: "prefetch",
    });
    expect(res).toMatchObject({
      kind: "err",
      error: { kind: "rate-limited" },
    });
  });
});
