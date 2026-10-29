/**
 * HTTP client.
 *
 * fetch + AbortController (10 s timeout), a token bucket tuned to the keyless
 * CoinGecko profile, GET-only retries per RetryPolicy,
 * request coalescing for identical GETs, and offline fail-fast through the shared
 * `effectiveOnline` state (core/offline/connectivity).
 *
 * Every response is a `Result<HttpSuccess, AppError>` — never a thrown
 * exception — so callers can bridge to `Result<T, AppError>` use cases.
 */

import { AppError, RateLimitedError } from "@domain/errors";
import type { Result } from "@domain/Result";

import { Connectivity } from "../offline/connectivity";

import { RetryPolicy, defaultTokenBucket } from "./retry-policy";
import { TokenBucket, parseRetryAfter, withJitter } from "./token-bucket";

export const DEFAULT_TIMEOUT_MS = 10_000;

export interface HttpRequestInit {
  readonly url: string;
  readonly headers?: Readonly<Record<string, string>>;
  readonly body?: string;
  readonly priority?: "foreground" | "prefetch";
}

export interface HttpSuccess {
  readonly status: number;
  readonly headers: Readonly<Record<string, string>>;
  readonly json: unknown;
  readonly url: string;
}

export type HttpResult = Result<HttpSuccess, AppError>;

export interface HttpClientOptions {
  readonly timeoutMs?: number;
  readonly bucket?: TokenBucket;
  readonly retryPolicy?: RetryPolicy;
  readonly connectivity: Connectivity;
  readonly defaultHeaders?: Readonly<Record<string, string>>;
  readonly delayFn?: (ms: number) => Promise<void>;
  readonly fault?: () => null | { readonly status: 429; readonly retryAfterMs: number };
}

interface Inflight {
  readonly promise: Promise<HttpResult>;
}

interface Attempt {
  readonly status: number;
  readonly retryAfterHeader?: string;
  readonly networkError?: boolean;
  readonly result: HttpResult;
}

export class HttpClient {
  private readonly bucket: TokenBucket;
  private readonly retryPolicy: RetryPolicy;
  private readonly connectivity: Connectivity;
  private readonly timeoutMs: number;
  private readonly defaultHeaders: Readonly<Record<string, string>>;
  private readonly delayFn: (ms: number) => Promise<void>;
  private readonly fault?: () => null | { readonly status: 429; readonly retryAfterMs: number };
  private inflightGets = new Map<string, Inflight>();

  public constructor(options: HttpClientOptions) {
    this.bucket = options.bucket ?? defaultTokenBucket();
    this.retryPolicy = options.retryPolicy ?? new RetryPolicy();
    this.connectivity = options.connectivity;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.defaultHeaders = options.defaultHeaders ?? {};
    this.delayFn =
      options.delayFn ?? ((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)));
    this.fault = options.fault;
  }

  public get(
    url: string,
    headersOrOptions?:
      | Readonly<Record<string, string>>
      | {
          readonly headers?: Readonly<Record<string, string>>;
          readonly priority?: "foreground" | "prefetch";
        },
    priorityArg?: "foreground" | "prefetch",
  ): Promise<HttpResult> {
    let resolvedHeaders: Readonly<Record<string, string>> | undefined;
    let resolvedPriority: "foreground" | "prefetch" | undefined = priorityArg;

    if (headersOrOptions && typeof headersOrOptions === "object") {
      if (
        "priority" in headersOrOptions &&
        (headersOrOptions.priority === "foreground" || headersOrOptions.priority === "prefetch")
      ) {
        resolvedPriority = headersOrOptions.priority;
        resolvedHeaders =
          "headers" in headersOrOptions
            ? (headersOrOptions.headers as Readonly<Record<string, string>>)
            : undefined;
      } else {
        resolvedHeaders = headersOrOptions as Readonly<Record<string, string>>;
      }
    }

    const existing = this.inflightGets.get(url);
    if (existing) {
      return existing.promise;
    }
    const promise: Promise<HttpResult> = this.execute(
      url,
      "GET",
      resolvedHeaders,
      undefined,
      resolvedPriority,
    ).finally(() => {
      this.inflightGets.delete(url);
    });
    this.inflightGets.set(url, { promise });
    return promise;
  }

  public async post(
    url: string,
    body: string,
    headers?: Readonly<Record<string, string>>,
  ): Promise<HttpResult> {
    return this.execute(url, "POST", headers, body);
  }

  private async execute(
    url: string,
    method: "GET" | "POST",
    headers: Readonly<Record<string, string>> | undefined,
    body: string | undefined,
    priority?: "foreground" | "prefetch",
  ): Promise<HttpResult> {
    if (!this.connectivity.isOnline()) {
      return {
        kind: "err",
        error: { kind: "offline", message: "Offline (effectiveOnline=false)" },
      };
    }
    for (let attempt = 0; ; attempt++) {
      const budget = this.bucket.untilAvailable();
      const isPrefetch = priority === "prefetch";
      const reserve = 1;
      if (isPrefetch && budget.tokensAvailable <= reserve) {
        return {
          kind: "err",
          error: {
            kind: "rate-limited",
            retryAfterMs: budget.waitMs > 0 ? budget.waitMs : 60_000,
            message: "Local rate budget reserve exceeded for prefetch",
          },
        };
      }
      this.bucket.spend();
      const outcome = await this.attempt({ url, method, headers, body });
      const decision = this.retryPolicy.decide(outcome, attempt, method === "GET");
      if (!decision.retry) {
        return outcome.result;
      }
      if (decision.delayMs > 0) {
        await this.delayFn(decision.delayMs);
      }
    }
  }

  private async attempt(
    init: HttpRequestInit & { readonly method: "GET" | "POST" },
  ): Promise<Attempt> {
    const injected = this.fault?.();
    if (injected !== undefined && injected !== null) {
      const waitMs = withJitter(injected.retryAfterMs);
      this.bucket.penalize(waitMs);
      const error: RateLimitedError = {
        kind: "rate-limited",
        retryAfterMs: waitMs,
        message: "Rate limit exceeded (fault injected)",
      };
      return { status: injected.status, result: { kind: "err", error } };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await fetch(init.url, {
        method: init.method,
        headers: { ...this.defaultHeaders, ...(init.headers ?? {}) },
        body: init.body,
        signal: controller.signal,
      });
      if (response.status === 429) {
        const raw = response.headers.get("retry-after");
        const waitMs = withJitter(parseRetryAfter(raw));
        this.bucket.penalize(waitMs);
        const error: RateLimitedError = {
          kind: "rate-limited",
          retryAfterMs: waitMs,
          message: "Rate limit exceeded (429)",
        };
        return { status: 429, retryAfterHeader: raw ?? undefined, result: { kind: "err", error } };
      }
      const headers: Record<string, string> = {};
      for (const name of ["retry-after", "cache-control", "content-type"]) {
        const value = response.headers.get(name);
        if (value !== null) {
          headers[name] = value;
        }
      }
      const text = await response.text();
      if (!response.ok) {
        return {
          status: response.status,
          result: {
            kind: "err",
            error: {
              kind: "http",
              status: response.status,
              message: `HTTP ${response.status}: ${text.slice(0, 200)}`,
              cause: text.slice(0, 300),
            },
          },
        };
      }
      let json: unknown;
      try {
        json = text.length > 0 ? JSON.parse(text) : null;
      } catch (parseError) {
        return {
          status: response.status,
          result: {
            kind: "err",
            error: { kind: "parse", message: "Response is not valid JSON", cause: parseError },
          },
        };
      }
      return {
        status: response.status,
        result: {
          kind: "ok",
          value: { status: response.status, headers, json, url: init.url },
        },
      };
    } catch (error) {
      const aborted = error instanceof Error && error.name === "AbortError";
      return {
        status: 0,
        networkError: true,
        result: {
          kind: "err",
          error: aborted
            ? { kind: "http", status: 0, message: "Request timed out" }
            : { kind: "offline", message: "Network request failed", cause: error },
        },
      };
    } finally {
      clearTimeout(timer);
    }
  }
}

export { RetryPolicy, TokenBucket, parseRetryAfter, withJitter, defaultTokenBucket };
