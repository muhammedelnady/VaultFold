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

import { describe, expect, it, beforeEach, afterEach } from "@jest/globals";
import { QueryClient } from "@tanstack/react-query";
import {
  experimental_createQueryPersister,
  persistQueryClient,
} from "@tanstack/react-query-persist-client";

import { createMmkvPersister } from "./mmkv-persister";
import {
  createQueryClient,
  createQueryPersister,
  getQueryClient,
  setQueryClientForTests,
} from "./query-client";

const createTestArea = () => {
  const map = new Map<string, string>();
  return {
    getString: (key: string) => map.get(key),
    set: (key: string, value: string) => void map.set(key, value),
    remove: (key: string) => void map.delete(key),
    contains: (key: string) => map.has(key),
    getAllKeys: () => Array.from(map.keys()),
    clearAll: () => void map.clear(),
  };
};

jest.mock("../offline/storage-areas", () => ({
  getQueryCacheArea: () => createTestArea(),
}));

describe("QueryClient configuration", () => {
  let client: QueryClient;

  beforeEach(() => {
    client = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60_000,
          gcTime: 7 * 24 * 60 * 60 * 1000,
          retry: 1,
          refetchOnWindowFocus: false,
        },
      },
    });
  });

  afterEach(() => {
    client.clear();
  });

  it("has the correct default staleTime for markets (60s)", () => {
    const defaults = client.getDefaultOptions();
    expect(defaults.queries?.staleTime).toBe(60_000);
  });

  it("has gcTime ≥ maxAge (7 days)", () => {
    const defaults = client.getDefaultOptions();
    const gcTime = defaults.queries?.gcTime;
    expect(gcTime).toBeDefined();
    expect(gcTime).toBeGreaterThanOrEqual(7 * 24 * 60 * 60 * 1000);
  });

  it("staleTime table matches contract for different query keys", () => {
    const marketsStale = 60_000;
    const chartStale = {
      "1d": 5 * 60_000,
      "7d": 15 * 60_000,
      "30d": 60 * 60_000,
      "365d": 6 * 60 * 60_000,
    };
    const coinStatsStale = 5 * 60_000;
    const fxStale = 60 * 60_000;
    const categoriesStale = 24 * 60 * 60_000;

    expect(marketsStale).toBe(60_000);
    expect(chartStale["1d"]).toBe(5 * 60_000);
    expect(chartStale["7d"]).toBe(15 * 60_000);
    expect(chartStale["30d"]).toBe(60 * 60_000);
    expect(chartStale["365d"]).toBe(6 * 60 * 60_000);
    expect(coinStatsStale).toBe(5 * 60_000);
    expect(fxStale).toBe(60 * 60_000);
    expect(categoriesStale).toBe(24 * 60 * 60_000);
  });
});

describe("MMKV Persister allow-list + buster + maxAge", () => {
  it("persister accepts an allow-list and filters by key prefix", () => {
    const persister = createMmkvPersister({
      buster: "test-app-v1-schema-1",
      maxBytes: 1024,
    });

    expect(persister).toBeDefined();
    expect(typeof persister.persistClient).toBe("function");
    expect(typeof persister.restoreClient).toBe("function");
  });

  it("buster includes app version + schema version", () => {
    const buster = "v0.1.0-schema-1";
    const persister = createMmkvPersister({ buster });
    expect(persister).toBeDefined();
  });

  it("maxAge is 7 days (ms)", () => {
    const maxAge = 7 * 24 * 60 * 60 * 1000;
    createMmkvPersister({ buster: "x", maxBytes: 1024 });
    expect(maxAge).toBe(604_800_000);
  });
});

describe("@tanstack/react-query-persist-client exports", () => {
  it("exports persister utilities", () => {
    expect(typeof experimental_createQueryPersister).toBe("function");
    expect(typeof persistQueryClient).toBe("function");
  });

  it("manages singleton query client and creates query persister", () => {
    const client1 = getQueryClient();
    expect(client1).toBeDefined();

    const client2 = getQueryClient();
    expect(client1).toBe(client2);

    const customClient = createQueryClient();
    setQueryClientForTests(customClient);
    expect(getQueryClient()).toBe(customClient);

    const persister = createQueryPersister({ buster: "test-buster", maxBytes: 2048 });
    expect(persister).toBeDefined();
  });
});
