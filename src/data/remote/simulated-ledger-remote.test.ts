/**
 * Tests for the dev-only simulated sync target: exactly-once push semantics,
 * monotonic versioning, and `pull` filtering — the contract a real server must
 * honor.
 */

import type { MmkvArea } from "@core/offline/storage-areas";
import { isOk, isErr } from "@domain/Result";
import type { OutboxEntry, TransactionAddedPayload } from "@domain/sync/outbox-contract";

import {
  createSimulatedLedgerRemote,
  seedSimulatedLedger,
  setupSimulatedLedgerRemote,
  wipeSimulatedLedger,
} from "./simulated-ledger-remote";

function memoryArea(): MmkvArea {
  const store = new Map<string, string>();
  return {
    getString: (key) => store.get(key),
    set: (key, value) => {
      store.set(key, value);
    },
    remove: (key) => {
      store.delete(key);
    },
    contains: (key) => store.has(key),
    getAllKeys: () => [...store.keys()],
    clearAll: () => store.clear(),
  };
}

function txAddEntry(id: string, coindId = "bitcoin"): OutboxEntry {
  const payload: TransactionAddedPayload = {
    id: coindId === "bitcoin" ? "t1" : "t2",
    coinId: coindId,
    side: "buy",
    quantity: "0.5",
    unitPrice: "50000",
    fee: "0",
    fiatCurrency: "usd",
    at: 1_700_000_000_000,
    revision: 1,
  };
  return {
    id,
    type: "tx.add",
    entityKey: "transaction",
    payload,
    createdAt: 1,
    attempts: 0,
    nextAttemptAt: null,
    status: "inflight",
  };
}

describe("SimulatedLedgerRemote", () => {
  let area: MmkvArea;
  let remote: ReturnType<typeof createSimulatedLedgerRemote>;

  beforeEach(() => {
    area = memoryArea();
    remote = createSimulatedLedgerRemote(area);
  });

  it("applies a batch and bumps the version by the number of applied ops", async () => {
    const applied = await remote.push([txAddEntry("cm-1"), txAddEntry("cm-2", "ethereum")]);
    expect(isOk(applied)).toBe(true);
    if (isOk(applied)) {
      expect(applied.value).toBe(2);
    }

    const pulled = await remote.pull(0);
    expect(isOk(pulled)).toBe(true);
    if (isOk(pulled)) {
      expect(pulled.value.version).toBe(2);
      expect(pulled.value.mutations).toHaveLength(2);
    }
  });

  it("treats a replayed clientMutationId as a no-op (exactly-once)", async () => {
    await remote.push([txAddEntry("cm-1")]);

    const replay = await remote.push([txAddEntry("cm-1"), txAddEntry("cm-2", "ethereum")]);
    expect(isOk(replay)).toBe(true);
    if (isOk(replay)) {
      expect(replay.value).toBe(1);
    }

    const pulled = await remote.pull(1);
    expect(isOk(pulled)).toBe(true);
    if (isOk(pulled)) {
      expect(pulled.value.version).toBe(2);
      expect(pulled.value.mutations.map((record) => record.clientMutationId)).toEqual(["cm-2"]);
    }
  });

  it("pull filters strictly by server version", async () => {
    await remote.push([txAddEntry("cm-1")]);
    await remote.push([txAddEntry("cm-2", "ethereum")]);
    await remote.push([txAddEntry("cm-3", "solana")]);

    const pulled = await remote.pull(2);
    expect(isOk(pulled)).toBe(true);
    if (isOk(pulled)) {
      expect(pulled.value.version).toBe(3);
      expect(pulled.value.mutations.map((m) => m.clientMutationId)).toEqual(["cm-3"]);
    }
  });

  it("starts from zero after wipe", async () => {
    await remote.push([txAddEntry("cm-1")]);
    wipeSimulatedLedger(area);

    const pulled = await remote.pull(0);
    expect(isOk(pulled)).toBe(true);
    if (isOk(pulled)) {
      expect(pulled.value.version).toBe(0);
      expect(pulled.value.mutations).toHaveLength(0);
    }
    expect(isErr(pulled)).toBe(false);
  });

  it("handles corrupted or non-array records JSON gracefully", async () => {
    area.set("vaultfold.remote.records.v1", "corrupted-json");
    const emptyPull = await remote.pull(0);
    expect(isOk(emptyPull)).toBe(true);

    area.set("vaultfold.remote.records.v1", JSON.stringify({ not: "an array" }));
    const nonArrayPull = await remote.pull(0);
    expect(isOk(nonArrayPull)).toBe(true);
  });

  it("seeds records via seedSimulatedLedger and calls setupSimulatedLedgerRemote", async () => {
    setupSimulatedLedgerRemote(remote);
    await seedSimulatedLedger(remote, [txAddEntry("seed-1")]);
    const pulled = await remote.pull(0);
    expect(isOk(pulled)).toBe(true);
    if (isOk(pulled)) {
      expect(pulled.value.mutations).toHaveLength(1);
    }
  });

  it("is a no-op for an empty batch (0 applied, version untouched)", async () => {
    const applied = await remote.push([]);
    expect(isOk(applied)).toBe(true);
    if (isOk(applied)) {
      expect(applied.value).toBe(0);
    }
    const pulled = await remote.pull(0);
    expect(isOk(pulled)).toBe(true);
    if (isOk(pulled)) {
      expect(pulled.value.version).toBe(0);
    }
  });
});
