/**
 * Token bucket tuned to the *verified* keyless CoinGecko profile
 *: a burst allowance (~6 requests) followed by
 * a ~60 s window; `Retry-After` from 429s is always honored over computation.
 *
 * Semantics are "reset-time" based: `nextResetMs` is the absolute time at which
 * the bucket refills to capacity. A 429 penalty empties the tokens and pushes
 * the reset to at least `Retry-After` later, matching the live behavior where
 * the server answers back-to-back 429s with a countdown (60 → 24 s).
 */

export interface TokenBucketOptions {
  readonly capacity: number;
  readonly windowMs: number;
  readonly now?: () => number;
}

export interface TokenBudget {
  readonly tokensAvailable: number;
  readonly waitMs: number;
}

export class TokenBucket {
  private tokens: number;
  private nextResetMs: number;

  private readonly capacity: number;
  private readonly windowMs: number;
  private readonly now: () => number;

  public constructor(options: TokenBucketOptions) {
    this.capacity = Math.max(1, options.capacity);
    this.windowMs = Math.max(1, options.windowMs);
    this.now = options.now ?? Date.now;
    this.tokens = this.capacity;
    this.nextResetMs = this.now() + this.windowMs;
  }

  public trySpend(): boolean {
    this.refillIfReset();
    if (this.tokens <= 0) {
      return false;
    }
    this.tokens -= 1;
    return true;
  }

  public untilAvailable(): TokenBudget {
    this.refillIfReset();
    if (this.tokens > 0) {
      return { tokensAvailable: this.tokens, waitMs: 0 };
    }
    const waitMs = Math.max(0, this.nextResetMs - this.now());
    return { tokensAvailable: 0, waitMs };
  }

  public penalize(retryAfterMs: number): void {
    this.tokens = 0;
    this.nextResetMs = this.now() + Math.max(0, retryAfterMs);
  }

  public spend(): void {
    this.refillIfReset();
    this.tokens = Math.max(0, this.tokens - 1);
  }

  public reset(): void {
    this.tokens = this.capacity;
    this.nextResetMs = this.now() + this.windowMs;
  }

  private refillIfReset(): void {
    if (this.now() >= this.nextResetMs) {
      this.tokens = this.capacity;
      this.nextResetMs = this.now() + this.windowMs;
    }
  }
}

export function parseRetryAfter(headerValue: string | null): number {
  if (headerValue === null) {
    return 60_000;
  }
  const seconds = Number.parseInt(headerValue, 10);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return seconds * 1000;
  }
  const date = Date.parse(headerValue);
  if (Number.isFinite(date)) {
    return Math.max(0, date - Date.now());
  }
  return 60_000;
}

export function withJitter(ms: number, random: () => number = Math.random): number {
  const factor = 1 + (random() * 0.1 - 0.05);
  return Math.max(0, Math.round(ms * factor));
}
