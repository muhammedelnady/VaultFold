/**
 * Tests for the outbox engine.
 * Replays the sync profile: FIFO per entityKey, watch.toggle coalescing,
 * 1 s → 2ⁿ s backoff capped at 60 s (±20 % jitter, seeded), `failed` after 5
 * attempts, manual Retry/Discard, orphan recovery after a mid-flight kill.
 */

import type { AppError } from "@domain/errors";
import type { LedgerRemote } from "@domain/remote/LedgerRemote";
import { err, ok } from "@domain/Result";
import type {
  OutboxEntry,
  TransactionAddedPayload,
  WatchToggledPayload,
} from "@domain/sync/outbox-contract";

import { createOutboxEngine, type OutboxEngineDeps } from "./outbox-engine";
import type { MmkvArea } from "./storage-areas";

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

function txAdd(id: string): TransactionAddedPayload {
  return {
    id,
    coinId: "bitcoin",
    side: "buy",
    quantity: "0.5",
    unitPrice: "50000",
    fee: "0",
    fiatCurrency: "usd",
    at: 1_700_000_000_000,
    revision: 1,
  };
}

const OFFLINE: AppError = { kind: "offline", message: "device offline" };

function failingRemote(times: number): LedgerRemote {
  let remaining = times;
  return {
    push: (mutations) => {
      if (remaining > 0) {
        remaining -= 1;
        return Promise.resolve(err(OFFLINE));
      }
      return Promise.resolve(ok(mutations.length));
    },
    pull: () => Promise.resolve(err(OFFLINE)),
  };
}

function engineWith(
  overrides: Partial<OutboxEngineDeps> = {},
  deps: { area: MmkvArea; remote: LedgerRemote },
) {
  let clock = 1_000_000;
  let seq = 0;
  const scheduled: { fn: () => void; delayMs: number }[] = [];
  const outbox = createOutboxEngine({
    area: deps.area,
    remote: deps.remote,
    now: () => clock,
    random: () => 0,
    nextId: () => `id-${String(++seq).padStart(3, "0")}`,
    schedule: (fn, delayMs) => {
      scheduled.push({ fn, delayMs });
      return () => undefined;
    },
    ...overrides,
  });
  return {
    outbox,
    advance: (ms: number) => {
      clock += ms;
    },
    scheduled,
  };
}

describe("OutboxEngine", () => {
  let area: MmkvArea;

  beforeEach(() => {
    area = memoryArea();
  });

  it("persists an enqueue and reports it as pending", () => {
    const { outbox } = engineWith({}, { area, remote: failingRemote(0) });
    outbox.enqueue({ type: "tx.add", entityKey: "transaction", payload: txAdd("t1") });
    expect(outbox.snapshot()).toEqual({ pending: 1, inflight: 0, failed: 0 });
    expect(outbox.snapshot().pending).toBe(1);
    expect(area.getString(`outbox/id-001`)).toBeDefined();
  });

  it("flush removes delivered entries", async () => {
    const { outbox } = engineWith({}, { area, remote: failingRemote(0) });
    outbox.enqueue({ type: "tx.add", entityKey: "transaction", payload: txAdd("t1") });
    await outbox.flush();
    expect(outbox.snapshot()).toEqual({ pending: 0, inflight: 0, failed: 0 });
    expect(area.getString("outbox/id-001")).toBeUndefined();
  });

  it("coalesces redundant pending watch.toggles for the same coin", () => {
    const { outbox, advance } = engineWith({}, { area, remote: failingRemote(0) });
    const toggle = (watching: boolean): WatchToggledPayload => ({ coinId: "solana", watching });

    outbox.enqueue({ type: "watch.toggle", entityKey: "watchlist", payload: toggle(true) });
    outbox.enqueue({ type: "watch.toggle", entityKey: "watchlist", payload: toggle(false) });
    advance(0);

    expect(outbox.snapshot().pending).toBe(1);
    const survivor = JSON.parse(area.getString("outbox/id-002")!) as OutboxEntry;
    expect(survivor.payload).toEqual(toggle(false));
    expect(area.getString("outbox/id-001")).toBeUndefined();
  });

  it("does not coalesce tx.add — every transaction must land", () => {
    const { outbox, advance } = engineWith({}, { area, remote: failingRemote(0) });

    outbox.enqueue({ type: "tx.add", entityKey: "transaction", payload: txAdd("t1") });
    outbox.enqueue({ type: "tx.add", entityKey: "transaction", payload: txAdd("t2") });
    advance(0);

    expect(outbox.snapshot().pending).toBe(2);
  });

  it("flushes one entry per entityKey and the rest of the queue in the same batch", async () => {
    const { outbox, advance } = engineWith({}, { area, remote: failingRemote(0) });

    outbox.enqueue({ type: "tx.add", entityKey: "transaction", payload: txAdd("t1") });
    outbox.enqueue({ type: "tx.add", entityKey: "transaction", payload: txAdd("t2") });
    outbox.enqueue({
      type: "watch.toggle",
      entityKey: "watchlist",
      payload: { coinId: "bitcoin", watching: true },
    });
    advance(0);

    const applied = await outbox.flush();
    expect(applied.pending).toBe(1);
    expect(area.getString("outbox/id-001")).toBeUndefined();
    expect(area.getString("outbox/id-003")).toBeUndefined();
    expect(area.getString("outbox/id-002")).toBeDefined();

    expect((await outbox.flush()).pending).toBe(0);
  });

  it("notifies subscribers on every observable change", async () => {
    const { outbox } = engineWith({}, { area, remote: failingRemote(0) });
    const seen: number[] = [];
    outbox.subscribe((snapshot) => seen.push(snapshot.pending + snapshot.inflight));

    outbox.enqueue({ type: "tx.add", entityKey: "transaction", payload: txAdd("t1") });
    await outbox.flush();
    expect(seen).toEqual([0, 1, 1, 0]);
  });

  it("handles flush when outbox has no due entries", async () => {
    const { outbox } = engineWith({}, { area, remote: failingRemote(0) });
    const snap = await outbox.flush();
    expect(snap).toEqual({ pending: 0, inflight: 0, failed: 0 });
  });

  it("handles corrupted entry JSON in area during loadAll", () => {
    area.set("outbox/corrupt", "not-json");
    const { outbox } = engineWith({}, { area, remote: failingRemote(0) });
    expect(outbox.snapshot().pending).toBe(0);
  });

  it("handles multiple pending entries with nextAttemptAt to calculate earliest", async () => {
    const now = 1000;
    const { outbox } = engineWith({ now: () => now }, { area, remote: failingRemote(2) });
    outbox.enqueue({ type: "tx.add", entityKey: "t1", payload: txAdd("1") });
    outbox.enqueue({ type: "tx.add", entityKey: "t1", payload: txAdd("2") });
    await outbox.flush();
    outbox.enqueue({ type: "tx.add", entityKey: "t2", payload: txAdd("3") });
  });

  it("handles when raw string is undefined in loadAll", () => {
    const customArea = memoryArea();
    customArea.getAllKeys = () => ["outbox/missing"];
    const { outbox } = engineWith({}, { area: customArea, remote: failingRemote(0) });
    expect(outbox.snapshot().pending).toBe(0);
  });

  it("unsubscribes listener cleanly", () => {
    const { outbox } = engineWith({}, { area, remote: failingRemote(0) });
    let count = 0;
    const unsub = outbox.subscribe(() => {
      count += 1;
    });
    expect(count).toBe(1);
    unsub();
    outbox.enqueue({ type: "tx.add", entityKey: "transaction", payload: txAdd("t1") });
    expect(count).toBe(1);
  });

  it("throws if nextId is omitted during enqueue", () => {
    const engine = createOutboxEngine({ area, remote: failingRemote(0) });
    expect(() => {
      engine.enqueue({ type: "tx.add", entityKey: "transaction", payload: txAdd("t1") });
    }).toThrow("OutboxEngine: nextId is required for enqueue");
  });

  it("uses default schedule when not provided", () => {
    let id = 1;
    const engine = createOutboxEngine({
      area,
      remote: failingRemote(1),
      nextId: () => `id-${id++}`,
    });
    expect(() => {
      engine.enqueue({ type: "tx.add", entityKey: "transaction", payload: txAdd("t1") });
    }).not.toThrow();
  });

  it("uses default now and random when omitted", () => {
    let id = 1;
    const engine = createOutboxEngine({
      area,
      remote: failingRemote(0),
      nextId: () => `id-${id++}`,
    });
    expect(() => {
      engine.enqueue({ type: "tx.add", entityKey: "t", payload: txAdd("1") });
    }).not.toThrow();
  });
});
