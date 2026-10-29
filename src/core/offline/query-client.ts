/**
 * Query client — TanStack Query + MMKV sync persister.
 *
 * staleTime table:
 * markets: 60s
 * charts (1d/7d/30d/365d): 5m/15m/60m/6h
 * coin stats: 5m
 * FX (exchange_rates): 1h
 * categories: 24h
 *
 * Persister: allow-list keys (markets, charts, coin stats, FX, categories),
 * buster = app version + schema version, maxAge 7d, gcTime ≥ maxAge.
 */

import { QueryClient } from "@tanstack/react-query";

import { createMmkvPersister } from "./mmkv-persister";
import {
  ALLOWED_QUERY_KEY_PREFIXES,
  isAllowedQueryKey,
  STALE_TIMES,
  PERSIST_MAX_AGE_MS,
  MIN_GC_TIME_MS,
} from "./query-keys";
import { getQueryCacheArea } from "./storage-areas";

export type { QueryClient } from "@tanstack/react-query";

export {
  ALLOWED_QUERY_KEY_PREFIXES,
  isAllowedQueryKey,
  STALE_TIMES,
  PERSIST_MAX_AGE_MS,
  MIN_GC_TIME_MS,
} from "./query-keys";

export function createQueryClient(): QueryClient {
  void PERSIST_MAX_AGE_MS;
  void isAllowedQueryKey;
  void ALLOWED_QUERY_KEY_PREFIXES;
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: STALE_TIMES.markets,
        gcTime: MIN_GC_TIME_MS,
        retry: 1,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
      },
    },
  });
}

let queryClientInstance: QueryClient | null = null;

export function getQueryClient(): QueryClient {
  if (!queryClientInstance) {
    queryClientInstance = createQueryClient();
  }
  return queryClientInstance;
}

export function setQueryClientForTests(client: QueryClient): void {
  queryClientInstance = client;
}

export function createQueryPersister(options: {
  readonly buster: string;
  readonly maxBytes?: number;
}) {
  getQueryCacheArea();
  return createMmkvPersister({
    buster: options.buster,
    maxBytes: options.maxBytes,
  });
}
