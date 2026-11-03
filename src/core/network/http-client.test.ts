/**
 * Unit tests for the resilient HttpClient request methods, headers, and parsing.
 */

import { describe, expect, it, jest } from "@jest/globals";

import { Connectivity } from "../offline/connectivity";

import { HttpClient } from "./http-client";
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

describe("HttpClient", () => {
  it("fails fast with offline when effectiveOnline is false", async () => {
    const connectivity = new Connectivity();
    connectivity.setSimulatedOffline(true);
    const fetchMock = makeFetchStub(async () => ok({}));
    globalThis.fetch = fetchMock;
    const client = clientFor(connectivity);

    const result = await client.get("https://api.coingecko.com/api/v3/ping");

    expect(result).toMatchObject({ kind: "err", error: { kind: "offline" } });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns parsed JSON on success", async () => {
    const connectivity = new Connectivity();
    globalThis.fetch = makeFetchStub(async () => ok({ gecko_says: "(V3)" }));
    const result = await clientFor(connectivity).get("https://api.coingecko.com/api/v3/ping");

    expect(result.kind).toBe("ok");
    expect(
      result.kind === "ok" && (result.value.json as Record<string, unknown>)["gecko_says"],
    ).toBe("(V3)");
  });

  it("maps parse failures to the parse error kind", async () => {
    const connectivity = new Connectivity();
    globalThis.fetch = makeFetchStub(async () => new Response("<html>bad</html>", { status: 200 }));
    const result = await clientFor(connectivity).get("https://bad.example");

    expect(result).toMatchObject({ kind: "err", error: { kind: "parse" } });
  });

  it("coalesces identical concurrent GETs", async () => {
    const connectivity = new Connectivity();
    let calls = 0;
    globalThis.fetch = makeFetchStub(async (url) => {
      calls += 1;
      await new Promise((r) => setTimeout(r, 5));
      return ok({ url });
    });
    const client = clientFor(connectivity);
    const endpoint = "https://api.coingecko.com/api/v3/exchange_rates";

    const [a, b] = await Promise.all([client.get(endpoint), client.get(endpoint)]);

    expect(calls).toBe(1);
    expect(a.kind).toBe("ok");
    expect(b.kind).toBe("ok");
  });

  it("executes GET with plain headers object", async () => {
    const connectivity = new Connectivity();
    let capturedHeaders: HeadersInit | undefined;
    globalThis.fetch = makeFetchStub(async (_url, init) => {
      capturedHeaders = init.headers;
      return ok({ ok: true });
    });
    const client = clientFor(connectivity);
    const res = await client.get("https://api.coingecko.com/api/v3/plain-headers", {
      "x-custom-header": "test-123",
    });
    expect(res.kind).toBe("ok");
    expect((capturedHeaders as Record<string, string>)["x-custom-header"]).toBe("test-123");
  });

  it("constructs HttpClient with default options and executes GET", async () => {
    const connectivity = new Connectivity();
    globalThis.fetch = makeFetchStub(async () => ok({ status: "default-ok" }));
    const defaultClient = new HttpClient({ connectivity });
    const res = await defaultClient.get("https://api.coingecko.com/api/v3/defaults");
    expect(res.kind).toBe("ok");
  });

  it("handles GET with priority and explicit headers inside options object", async () => {
    const connectivity = new Connectivity();
    let capturedHeaders: HeadersInit | undefined;
    globalThis.fetch = makeFetchStub(async (_url, init) => {
      capturedHeaders = init.headers;
      return ok({ ok: true });
    });
    const client = clientFor(connectivity);
    const res = await client.get("https://api.coingecko.com/api/v3/priority-headers", {
      priority: "foreground",
      headers: { "x-explicit": "yes" },
    });
    expect(res.kind).toBe("ok");
    expect((capturedHeaders as Record<string, string>)["x-explicit"]).toBe("yes");
  });

  it("handles non-JSON response body as parse error", async () => {
    const connectivity = new Connectivity();
    globalThis.fetch = makeFetchStub(
      async () =>
        new Response("not-valid-json", {
          status: 200,
          headers: { "content-type": "text/html" },
        }),
    );
    const client = clientFor(connectivity);
    const res = await client.get("https://api.coingecko.com/api/v3/bad-json");
    expect(res).toMatchObject({
      kind: "err",
      error: { kind: "parse" },
    });
  });

  it("handles HTTP 500 server error response", async () => {
    const connectivity = new Connectivity();
    globalThis.fetch = makeFetchStub(
      async () =>
        new Response("Server Error", {
          status: 500,
          headers: { "content-type": "text/plain" },
        }),
    );
    const client = clientFor(connectivity);
    const res = await client.get("https://api.coingecko.com/api/v3/server-error");
    expect(res).toMatchObject({
      kind: "err",
      error: { kind: "http", status: 500 },
    });
  });

  it("handles generic network error mapping to offline", async () => {
    const connectivity = new Connectivity();
    globalThis.fetch = makeFetchStub(async () => {
      throw new Error("Network failed");
    });
    const client = clientFor(connectivity);
    const res = await client.get("https://api.coingecko.com/api/v3/network-fail");
    expect(res).toMatchObject({
      kind: "err",
      error: { kind: "offline" },
    });
  });

  it("handles empty response body gracefully", async () => {
    const connectivity = new Connectivity();
    globalThis.fetch = makeFetchStub(async () => new Response("", { status: 200 }));
    const client = clientFor(connectivity);
    const res = await client.get("https://api.coingecko.com/api/v3/empty-body");
    expect(res.kind).toBe("ok");
    if (res.kind === "ok") {
      expect(res.value.json).toBeNull();
    }
  });

  it("executes POST request successfully", async () => {
    const connectivity = new Connectivity();
    globalThis.fetch = makeFetchStub(async () => ok({ status: "created" }, 201));
    const client = clientFor(connectivity);
    const result = await client.post(
      "https://api.coingecko.com/api/v3/post",
      JSON.stringify({ a: 1 }),
    );
    expect(result.kind).toBe("ok");
  });

  it("aborts when request exceeds timeoutMs", async () => {
    const connectivity = new Connectivity();
    globalThis.fetch = makeFetchStub(
      async (_url, init) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener("abort", () => {
            const err = new Error("aborted");
            err.name = "AbortError";
            reject(err);
          });
        }),
    );
    const client = clientFor(connectivity, { timeoutMs: 5 });
    const result = await client.get("https://api.coingecko.com/api/v3/real-timeout");
    expect(result).toMatchObject({
      kind: "err",
      error: { kind: "http", status: 0, message: "Request timed out" },
    });
  });

  it("handles AbortError timeout mapping to status 0", async () => {
    const connectivity = new Connectivity();
    globalThis.fetch = makeFetchStub(async () => {
      const abortErr = new Error("aborted");
      abortErr.name = "AbortError";
      throw abortErr;
    });
    const client = clientFor(connectivity);
    const result = await client.get("https://api.coingecko.com/api/v3/slow");
    expect(result).toMatchObject({
      kind: "err",
      error: { kind: "http", status: 0, message: "Request timed out" },
    });
  });
});
