/**
 * Sync MMKV persister for TanStack Query.
 *
 * Implements TanStack's `Persister` interface synchronously (unlike standard
 * async AsyncStorage wrappers): the persisted first paint must have zero
 * latency. Storage is the unencrypted `cache` MMKV instance only —
 * vault data never lands here. A `buster` (app version + schema version) in
 * the persisted client discards blobs after upgrades; `PersistQueryClientProvider`
 * configures `maxAge` (7 d) and `gcTime ≥ maxAge`. Heavy entries (rotated-out
 * chart ranges) are evicted by the query-cache size guard before persisting.
 */
import type { PersistedClient, Persister } from "@tanstack/react-query-persist-client";

import { isAllowedQueryKey } from "./query-keys";
import { getQueryCacheArea, type MmkvArea } from "./storage-areas";

export const PERSIST_STORAGE_KEY = "VAULTFOLD_OFFLINE_QUERY_CACHE";

export interface CreateMmkvPersisterOptions {
  readonly buster: string;
  readonly maxBytes?: number;
  readonly area?: MmkvArea;
}

export function createMmkvPersister(options: CreateMmkvPersisterOptions): Persister {
  const area = options.area ?? getQueryCacheArea();
  const maxBytes = options.maxBytes ?? 8 * 1024 * 1024;

  return {
    persistClient: (client: PersistedClient): void => {
      const stamped: PersistedClient = { ...client, buster: options.buster };
      if (stamped.clientState?.queries) {
        stamped.clientState.queries = stamped.clientState.queries.filter(
          (q) =>
            isAllowedQueryKey(q.queryKey) &&
            (q.state.data as { kind?: string } | undefined)?.kind !== "err",
        );
      }
      try {
        const serialized = JSON.stringify(stamped);
        if (serialized.length > maxBytes) {
          area.set(PERSIST_STORAGE_KEY, evictChartually(serialized, maxBytes));
          return;
        }
        area.set(PERSIST_STORAGE_KEY, serialized);
      } catch {
        return;
      }
    },
    restoreClient: (): PersistedClient | undefined => {
      const raw = area.getString(PERSIST_STORAGE_KEY);
      if (!raw) {
        return undefined;
      }
      try {
        const client = JSON.parse(raw) as PersistedClient;
        if (!Array.isArray(client?.clientState?.queries)) {
          area.set(PERSIST_STORAGE_KEY, "");
          return undefined;
        }
        if (client.buster !== options.buster) {
          area.set(PERSIST_STORAGE_KEY, "");
          return undefined;
        }
        return client;
      } catch {
        area.set(PERSIST_STORAGE_KEY, "");
        return undefined;
      }
    },
    removeClient: (): void => {
      area.set(PERSIST_STORAGE_KEY, "");
    },
  };
}

function evictChartually(serialized: string, maxBytes: number): string {
  const client = JSON.parse(serialized) as PersistedClient;
  const queries = client.clientState?.queries ?? [];
  const smallest = [...queries].sort((a, b) => b.state.dataUpdatedAt - a.state.dataUpdatedAt);
  while (
    smallest.length > 0 &&
    JSON.stringify({ ...client, clientState: { ...client.clientState, queries: smallest } })
      .length > maxBytes
  ) {
    smallest.pop();
  }
  const evicted: PersistedClient = {
    ...client,
    clientState: {
      ...client.clientState,
      queries: smallest.filter((q) => q.state.status !== "pending"),
    },
  };
  const out = JSON.stringify(evicted);
  return out.length <= maxBytes ? out : "";
}
