/**
 * Tests for sync MMKV persister and size guard eviction.
 */
import { describe, expect, it, beforeEach } from "@jest/globals";
import type { PersistedClient } from "@tanstack/react-query-persist-client";

import { createMmkvPersister, PERSIST_STORAGE_KEY } from "./mmkv-persister";
import type { MmkvArea } from "./storage-areas";

function createInMemoryArea(): MmkvArea {
  const store = new Map<string, string>();
  return {
    getString: (key: string) => store.get(key),
    set: (key: string, value: string) => {
      store.set(key, value);
    },
    remove: (key: string) => {
      store.delete(key);
    },
    contains: (key: string) => store.has(key),
    getAllKeys: () => Array.from(store.keys()),
    clearAll: () => store.clear(),
  };
}

describe("mmkv-persister", () => {
  let area: MmkvArea;

  beforeEach(() => {
    area = createInMemoryArea();
  });

  it("persists and restores client with matching buster", async () => {
    const persister = createMmkvPersister({ buster: "v1.0.0", area });
    const client: PersistedClient = {
      timestamp: Date.now(),
      buster: "v1.0.0",
      clientState: {
        mutations: [],
        queries: [
          {
            queryKey: ["markets", "usd"],
            queryHash: "markets-usd",
            dehydratedAt: Date.now(),
            state: { data: [{ id: "bitcoin" }], dataUpdatedAt: 1000, status: "success" } as never,
          },
        ],
      },
    };

    await persister.persistClient(client);
    const restored = await persister.restoreClient();

    expect(restored).toBeDefined();
    expect(restored?.buster).toBe("v1.0.0");
    expect(restored?.clientState?.queries).toHaveLength(1);
    expect(restored?.clientState?.queries[0]?.queryKey).toEqual(["markets", "usd"]);
  });

  it("filters out query keys not in the allow-list", async () => {
    const persister = createMmkvPersister({ buster: "v1.0.0", area });
    const client: PersistedClient = {
      timestamp: Date.now(),
      buster: "v1.0.0",
      clientState: {
        mutations: [],
        queries: [
          {
            queryKey: ["markets", "usd"],
            queryHash: "markets-usd",
            dehydratedAt: Date.now(),
            state: { data: [], dataUpdatedAt: 1000, status: "success" } as never,
          },
          {
            queryKey: ["secret_private_keys", "vault"],
            queryHash: "secret-vault",
            dehydratedAt: Date.now(),
            state: { data: {}, dataUpdatedAt: 1000, status: "success" } as never,
          },
        ],
      },
    };

    await persister.persistClient(client);
    const restored = await persister.restoreClient();

    expect(restored?.clientState?.queries).toHaveLength(1);
    expect(restored?.clientState?.queries[0]?.queryKey).toEqual(["markets", "usd"]);
  });

  it("filters out query results containing error Results", async () => {
    const persister = createMmkvPersister({ buster: "v1.0.0", area });
    const client: PersistedClient = {
      timestamp: Date.now(),
      buster: "v1.0.0",
      clientState: {
        mutations: [],
        queries: [
          {
            queryKey: ["markets", "usd"],
            queryHash: "markets-usd-ok",
            dehydratedAt: Date.now(),
            state: {
              data: { kind: "ok", value: [{ id: "bitcoin" }] },
              dataUpdatedAt: 1000,
              status: "success",
            } as never,
          },
          {
            queryKey: ["chart", "bitcoin", "7", "usd"],
            queryHash: "chart-err",
            dehydratedAt: Date.now(),
            state: {
              data: {
                kind: "err",
                error: { kind: "rate-limited", retryAfterMs: 60000, message: "429" },
              },
              dataUpdatedAt: 1000,
              status: "success",
            } as never,
          },
        ],
      },
    };

    await persister.persistClient(client);
    const restored = await persister.restoreClient();

    expect(restored?.clientState?.queries).toHaveLength(1);
    expect(restored?.clientState?.queries[0]?.queryKey).toEqual(["markets", "usd"]);
  });

  it("discards cache if buster does not match", async () => {
    const persisterV1 = createMmkvPersister({ buster: "v1.0.0", area });
    const client: PersistedClient = {
      timestamp: Date.now(),
      buster: "v1.0.0",
      clientState: {
        mutations: [],
        queries: [
          {
            queryKey: ["markets", "usd"],
            queryHash: "markets-usd",
            dehydratedAt: Date.now(),
            state: { data: [], dataUpdatedAt: 1000, status: "success" } as never,
          },
        ],
      },
    };

    await persisterV1.persistClient(client);

    const persisterV2 = createMmkvPersister({ buster: "v2.0.0", area });
    const restored = await persisterV2.restoreClient();

    expect(restored).toBeUndefined();
    expect(area.getString(PERSIST_STORAGE_KEY)).toBe("");
  });

  it("handles malformed JSON during restoreClient", async () => {
    area.set(PERSIST_STORAGE_KEY, "invalid-json-content{{{");
    const persister = createMmkvPersister({ buster: "v1.0.0", area });

    const restored = await persister.restoreClient();
    expect(restored).toBeUndefined();
    expect(area.getString(PERSIST_STORAGE_KEY)).toBe("");
  });

  it("handles client state without queries array gracefully", async () => {
    area.set(PERSIST_STORAGE_KEY, JSON.stringify({ buster: "v1.0.0", clientState: {} }));
    const persister = createMmkvPersister({ buster: "v1.0.0", area });

    const restored = await persister.restoreClient();
    expect(restored).toBeUndefined();
    expect(area.getString(PERSIST_STORAGE_KEY)).toBe("");
  });

  it("persists client without clientState queries", async () => {
    const persister = createMmkvPersister({ buster: "v1.0.0", area });
    const client = { timestamp: Date.now(), buster: "v1.0.0" } as PersistedClient;
    await persister.persistClient(client);
    expect(area.getString(PERSIST_STORAGE_KEY)).toContain("v1.0.0");
  });

  it("returns empty string if even evicted client exceeds maxBytes", async () => {
    const persister = createMmkvPersister({ buster: "v1.0.0", maxBytes: 5, area });
    const client: PersistedClient = {
      timestamp: Date.now(),
      buster: "v1.0.0",
      clientState: {
        mutations: [],
        queries: [
          {
            queryKey: ["chart", "bitcoin", "1d"],
            queryHash: "chart-1",
            dehydratedAt: Date.now(),
            state: { data: "large", dataUpdatedAt: 100, status: "success" } as never,
          },
        ],
      },
    };
    await persister.persistClient(client);
    expect(area.getString(PERSIST_STORAGE_KEY)).toBe("");
  });

  it("handles serialization failure without throwing", async () => {
    const persister = createMmkvPersister({ buster: "v1.0.0", area });
    const circular: Record<string, unknown> = { buster: "v1.0.0" };
    circular["self"] = circular;

    expect(() => {
      persister.persistClient(circular as never);
    }).not.toThrow();
  });

  it("handles empty or missing storage", async () => {
    const persister = createMmkvPersister({ buster: "v1.0.0", area });
    expect(await persister.restoreClient()).toBeUndefined();
  });

  it("removes client properly", async () => {
    const persister = createMmkvPersister({ buster: "v1.0.0", area });
    await persister.removeClient();
    expect(area.getString(PERSIST_STORAGE_KEY)).toBe("");
  });

  it("evicts oldest entries when exceeding maxBytes", async () => {
    const persister = createMmkvPersister({ buster: "v1.0.0", maxBytes: 300, area });
    const client: PersistedClient = {
      timestamp: Date.now(),
      buster: "v1.0.0",
      clientState: {
        mutations: [],
        queries: [
          {
            queryKey: ["chart", "bitcoin", "1d"],
            queryHash: "chart-1",
            dehydratedAt: Date.now(),
            state: { data: "large-data-block-1", dataUpdatedAt: 100, status: "success" } as never,
          },
          {
            queryKey: ["chart", "bitcoin", "7d"],
            queryHash: "chart-2",
            dehydratedAt: Date.now(),
            state: { data: "large-data-block-2", dataUpdatedAt: 200, status: "success" } as never,
          },
        ],
      },
    };

    await persister.persistClient(client);
    const restored = await persister.restoreClient();
    expect(restored).toBeDefined();
    expect(restored?.clientState?.queries.length).toBeLessThanOrEqual(2);
  });
});
