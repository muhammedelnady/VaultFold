/**
 * Unit tests for query-keys and allow-list.
 */
import { describe, expect, it } from "@jest/globals";

import {
  isAllowedQueryKey,
  chartStaleTime,
  STALE_TIMES,
  ALLOWED_QUERY_KEY_PREFIXES,
  PERSIST_MAX_AGE_MS,
  MIN_GC_TIME_MS,
  queryKeys,
} from "./query-keys";

describe("query-keys", () => {
  it("allows all whitelisted prefixes", () => {
    ALLOWED_QUERY_KEY_PREFIXES.forEach((prefix) => {
      expect(isAllowedQueryKey([prefix, "param"])).toBe(true);
      expect(isAllowedQueryKey([prefix])).toBe(true);
      expect(isAllowedQueryKey(prefix as never)).toBe(true);
    });
  });

  it("rejects non-whitelisted keys", () => {
    expect(isAllowedQueryKey(["user_secrets"])).toBe(false);
    expect(isAllowedQueryKey(["portfolio_private"])).toBe(false);
    expect(isAllowedQueryKey(["internal_state"])).toBe(false);
    expect(isAllowedQueryKey("internal_state" as never)).toBe(false);
  });

  it("allows aligned query keys in allow-list", () => {
    expect(isAllowedQueryKey(queryKeys.marketChart("bitcoin", "7", "usd"))).toBe(true);
    expect(isAllowedQueryKey(queryKeys.coinDetail("bitcoin"))).toBe(true);
  });

  it("returns correct chartStaleTime per range", () => {
    expect(chartStaleTime("1d")).toBe(STALE_TIMES.chart["1d"]);
    expect(chartStaleTime("7d")).toBe(STALE_TIMES.chart["7d"]);
    expect(chartStaleTime("30d")).toBe(STALE_TIMES.chart["30d"]);
    expect(chartStaleTime("365d")).toBe(STALE_TIMES.chart["365d"]);
    expect(chartStaleTime("1")).toBe(STALE_TIMES.chart["1d"]);
    expect(chartStaleTime("7")).toBe(STALE_TIMES.chart["7d"]);
    expect(chartStaleTime("30")).toBe(STALE_TIMES.chart["30d"]);
    expect(chartStaleTime("365")).toBe(STALE_TIMES.chart["365d"]);
  });

  it("enforces MIN_GC_TIME_MS >= PERSIST_MAX_AGE_MS", () => {
    expect(MIN_GC_TIME_MS).toBeGreaterThanOrEqual(PERSIST_MAX_AGE_MS);
  });

  it("generates correct query keys for all factories", () => {
    expect(queryKeys.markets()).toEqual(["markets", "usd", "all"]);
    expect(queryKeys.markets("eur", "defi")).toEqual(["markets", "eur", "defi"]);

    expect(queryKeys.coinDetail("bitcoin")).toEqual(["coin", "bitcoin"]);

    expect(queryKeys.marketChart("bitcoin", "7", "usd")).toEqual(["chart", "bitcoin", "7", "usd"]);

    expect(queryKeys.watchlist).toEqual(["watchlist"]);
    expect(queryKeys.alerts.all).toEqual(["alerts"]);
    expect(queryKeys.ledger.all).toEqual(["ledger"]);

    expect(queryKeys.market.list()).toEqual(["markets", "usd", 1, 100]);
    expect(queryKeys.market.list("sar", 2, 50)).toEqual(["markets", "sar", 2, 50]);

    expect(queryKeys.exchangeRates).toEqual(["exchangeRates"]);
    expect(queryKeys.categories).toEqual(["categories"]);
  });
});
