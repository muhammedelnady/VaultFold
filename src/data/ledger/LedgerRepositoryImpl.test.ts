/**
 * Unit tests for LedgerRepositoryImpl append-only ledger and outbox integration.
 */

import { describe, expect, it } from "@jest/globals";

import type { MmkvArea } from "@core/offline/storage-areas";
import type { LedgerEntry } from "@domain/ledger/LedgerEntry";

import { LedgerRepositoryImpl } from "./LedgerRepositoryImpl";

function createMockMmkvArea(): MmkvArea {
  const store = new Map<string, string>();
  return {
    getString: (key: string) => store.get(key),
    set: (key: string, value: string) => {
      store.set(key, value);
    },
    remove: (key: string) => {
      store.delete(key);
    },
    getAllKeys: () => Array.from(store.keys()),
    clearAll: () => store.clear(),
    contains: (key: string) => store.has(key),
  };
}

describe("LedgerRepositoryImpl", () => {
  it("appends entries, handles revisions and tombstones", async () => {
    const area = createMockMmkvArea();
    const repo = new LedgerRepositoryImpl(area);

    const initial = await repo.getAllEntries();
    expect(initial.kind).toBe("ok");
    if (initial.kind === "ok") {
      expect(initial.value).toEqual([]);
    }

    const entry1: LedgerEntry = {
      id: "tx-1",
      type: "buy",
      coinId: "bitcoin",
      amount: "1.0",
      price: "60000",
      currency: "usd",
      timestamp: 1000,
    };

    const appendRes = await repo.appendEntry(entry1);
    expect(appendRes.kind).toBe("ok");

    const entryRevision: LedgerEntry = {
      id: "tx-2",
      prevId: "tx-1",
      type: "buy",
      coinId: "bitcoin",
      amount: "1.2",
      price: "60000",
      currency: "usd",
      timestamp: 2000,
    };
    const reviseRes = await repo.reviseEntry(entryRevision);
    expect(reviseRes.kind).toBe("ok");

    const tombRes = await repo.tombstoneEntry("tx-2");
    expect(tombRes.kind).toBe("ok");

    const all = await repo.getAllEntries();
    expect(all.kind).toBe("ok");
    if (all.kind === "ok") {
      expect(all.value.length).toBe(3);
      expect(all.value[2]!.type).toBe("tombstone");
      expect(all.value[2]!.prevId).toBe("tx-2");
    }
  });

  it("returns error when tombstoning non-existent entry", async () => {
    const area = createMockMmkvArea();
    const repo = new LedgerRepositoryImpl(area);

    const errRes = await repo.tombstoneEntry("missing-id");
    expect(errRes.kind).toBe("err");
  });

  it("handles watchlist get, set, and toggleWatch", async () => {
    const area = createMockMmkvArea();
    const repo = new LedgerRepositoryImpl(area);

    const initialWatch = await repo.getWatchlist();
    expect(initialWatch.kind).toBe("ok");
    if (initialWatch.kind === "ok") {
      expect(initialWatch.value).toEqual([]);
    }

    await repo.toggleWatch("bitcoin");
    const afterFirst = await repo.getWatchlist();
    if (afterFirst.kind === "ok") {
      expect(afterFirst.value).toContain("bitcoin");
    }

    await repo.toggleWatch("bitcoin");
    const afterSecond = await repo.getWatchlist();
    if (afterSecond.kind === "ok") {
      expect(afterSecond.value).not.toContain("bitcoin");
    }

    const firstToggle = await repo.toggleWatchlist("solana");
    expect(firstToggle).toEqual({ kind: "ok", value: true });
    const secondToggle = await repo.toggleWatchlist("solana");
    expect(secondToggle).toEqual({ kind: "ok", value: false });

    await repo.setWatchlist(["ethereum", "solana"]);
    const explicit = await repo.getWatchlist();
    if (explicit.kind === "ok") {
      expect(explicit.value).toEqual(["ethereum", "solana"]);
    }
  });

  it("handles parse error gracefully on corrupt data", async () => {
    const area = createMockMmkvArea();
    area.set("ledger.entries.v1", "corrupt-json{{{");
    area.set("watchlist.v1", "corrupt-json{{{");

    const repo = new LedgerRepositoryImpl(area);
    expect((await repo.getAllEntries()).kind).toBe("err");
    expect((await repo.getWatchlist()).kind).toBe("err");
  });
});
