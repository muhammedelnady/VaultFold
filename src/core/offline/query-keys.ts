/**
 * Query key allow-list — shared between query-client and mmkv-persister
 * to avoid import cycles.
 */
import type { QueryKey } from "@tanstack/react-query";

export const ALLOWED_QUERY_KEY_PREFIXES: readonly string[] = [
  "markets",
  "chart",
  "coin",
  "exchangeRates",
  "categories",
] as const;

export function isAllowedQueryKey(key: QueryKey): boolean {
  const prefix = Array.isArray(key) ? key[0] : key;
  return ALLOWED_QUERY_KEY_PREFIXES.some((allowed) => String(prefix).startsWith(allowed));
}

export const STALE_TIMES = {
  markets: 60_000,
  chart: {
    "1d": 5 * 60_000,
    "7d": 15 * 60_000,
    "30d": 60 * 60_000,
    "365d": 6 * 60 * 60_000,
  },
  coinStats: 5 * 60_000,
  exchangeRates: 60 * 60_000,
  categories: 24 * 60 * 60_000,
} as const;

export function chartStaleTime(
  days: "1d" | "7d" | "30d" | "365d" | "1" | "7" | "30" | "365",
): number {
  const key = (days.endsWith("d") ? days : `${days}d`) as keyof typeof STALE_TIMES.chart;
  return STALE_TIMES.chart[key];
}

export const PERSIST_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export const MIN_GC_TIME_MS = PERSIST_MAX_AGE_MS;

export const queryKeys = {
  markets: (vsCurrency = "usd", category = "all") => ["markets", vsCurrency, category] as const,
  coinDetail: (coinId: string) => ["coin", coinId] as const,
  marketChart: (coinId: string, days: string, vsCurrency: string) =>
    ["chart", coinId, days, vsCurrency] as const,
  watchlist: ["watchlist"] as const,
  alerts: {
    all: ["alerts"] as const,
  },
  ledger: {
    all: ["ledger"] as const,
  },
  market: {
    list: (vsCurrency = "usd", page = 1, perPage = 100) =>
      ["markets", vsCurrency, page, perPage] as const,
  },
  exchangeRates: ["exchangeRates"] as const,
  categories: ["categories"] as const,
} as const;
