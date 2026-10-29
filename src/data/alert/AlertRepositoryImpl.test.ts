/**
 * Unit tests for AlertRepositoryImpl MMKV persistence.
 */

import { describe, expect, it } from "@jest/globals";

import type { MmkvArea } from "@core/offline/storage-areas";
import type { PriceAlert } from "@domain/alert/PriceAlert";

import { AlertRepositoryImpl } from "./AlertRepositoryImpl";

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

describe("AlertRepositoryImpl", () => {
  it("initializes with empty alerts and handles upsert, getAll, and delete", async () => {
    const area = createMockMmkvArea();
    const repo = new AlertRepositoryImpl(area);

    const initial = await repo.getAll();
    expect(initial.kind).toBe("ok");
    if (initial.kind === "ok") {
      expect(initial.value).toEqual([]);
    }

    const alert1: PriceAlert = {
      id: "a1",
      coinId: "bitcoin",
      direction: "above",
      targetPrice: "70000",
      currency: "usd",
      active: true,
      createdAt: 1000,
      updatedAt: 1000,
    };

    const upsertRes = await repo.upsert(alert1);
    expect(upsertRes.kind).toBe("ok");

    const afterUpsert = await repo.getAll();
    expect(afterUpsert.kind).toBe("ok");
    if (afterUpsert.kind === "ok") {
      expect(afterUpsert.value.length).toBe(1);
      expect(afterUpsert.value[0]!.id).toBe("a1");
    }

    const delRes = await repo.delete("a1");
    expect(delRes.kind).toBe("ok");

    const afterDelete = await repo.getAll();
    expect(afterDelete.kind).toBe("ok");
    if (afterDelete.kind === "ok") {
      expect(afterDelete.value).toEqual([]);
    }
  });

  it("handles parse error gracefully on corrupt data", async () => {
    const area = createMockMmkvArea();
    area.set("alerts.v1", "not-valid-json{{{");

    const repo = new AlertRepositoryImpl(area);
    const res = await repo.getAll();
    expect(res.kind).toBe("err");
  });
});
