/**
 * Retry policy:
 * - GET only, never histories for other methods
 * - 429 → honor Retry-After (parsed, jittered) — the caller schedules it
 * - 5xx → up to 2 retries with exponential backoff (1 s, 2 s)
 * - other 4xx and validation → no retry
 */

import { TokenBucket, withJitter } from "./token-bucket";

export interface RetryDecision {
  readonly retry: boolean;
  readonly delayMs: number;
  readonly requiresToken: boolean;
}

export interface HttpAttemptOutcome {
  readonly status: number;
  readonly retryAfterHeader?: string;
  readonly networkError?: boolean;
}

export class RetryPolicy {
  private readonly maxRetries: number;
  private readonly baseDelayMs: number;
  private readonly random: () => number;

  public constructor(
    options: {
      readonly maxRetries?: number;
      readonly baseDelayMs?: number;
      readonly random?: () => number;
    } = {},
  ) {
    this.maxRetries = options.maxRetries ?? 2;
    this.baseDelayMs = options.baseDelayMs ?? 1000;
    this.random = options.random ?? Math.random;
  }

  public decide(outcome: HttpAttemptOutcome, attemptIndex: number, isGet: boolean): RetryDecision {
    const noRetry: RetryDecision = { retry: false, delayMs: 0, requiresToken: false };
    if (isGet && outcome.status === 429) {
      return noRetry;
    }
    if (isGet && outcome.networkError === true) {
      return attemptIndex < this.maxRetries
        ? { retry: true, delayMs: this.exponential(attemptIndex), requiresToken: true }
        : noRetry;
    }
    if (isGet && outcome.status >= 500 && outcome.status <= 599) {
      return attemptIndex < this.maxRetries
        ? { retry: true, delayMs: this.exponential(attemptIndex), requiresToken: true }
        : noRetry;
    }
    return noRetry;
  }

  private exponential(attemptIndex: number): number {
    return withJitter(this.baseDelayMs * 2 ** attemptIndex, this.random);
  }
}

export function defaultTokenBucket(): TokenBucket {
  return new TokenBucket({ capacity: 6, windowMs: 60_000 });
}
