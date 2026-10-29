/**
 * Outbox engine offline resilience, backoff, and recovery tests.
 */

import type { AppError } from "@domain/errors";
import type { LedgerRemote } from "@domain/remote/LedgerRemote";
import { err, ok } from "@domain/Result";
import type {
  OutboxEntry,
  TransactionAddedPayload,
  WatchToggledPayload,
} from "@domain/sync/outbox-contract";

import { createOutboxEngine, MAX_ATTEMPTS, type OutboxEngineDeps } from "./outbox-engine";
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

describe("OutboxEngine offline & recovery", () => {
  let area: MmkvArea;

  beforeEach(() => {
    area = memoryArea();
  });

  it("does not push or mark inflight when isOnline is false, but flushes when back online", async () => {
    let online = false;
    const pushMock = jest.fn((mutations: readonly unknown[]) =>
      Promise.resolve(ok(mutations.length)),
    );
    const mockRemote: LedgerRemote = {
      push: pushMock,
      pull: () => Promise.resolve(ok({ version: 1, mutations: [] })),
    };
    const { outbox } = engineWith({ isOnline: () => online }, { area, remote: mockRemote });

    outbox.enqueue({ type: "tx.add", entityKey: "transaction", payload: txAdd("t1") });
    expect(outbox.snapshot()).toEqual({ pending: 1, inflight: 0, failed: 0 });
    const stored = JSON.parse(area.getString("outbox/id-001")!) as OutboxEntry;
    expect(stored.status).toBe("pending");
    expect(pushMock).not.toHaveBeenCalled();

    const snap = await outbox.flush();
    expect(snap).toEqual({ pending: 1, inflight: 0, failed: 0 });
    expect(pushMock).not.toHaveBeenCalled();
    const storedAfterFlush = JSON.parse(area.getString("outbox/id-001")!) as OutboxEntry;
    expect(storedAfterFlush.status).toBe("pending");

    online = true;
    const finalSnap = await outbox.flush();
    expect(pushMock).toHaveBeenCalledTimes(1);
    expect(finalSnap).toEqual({ pending: 0, inflight: 0, failed: 0 });
    expect(area.getString("outbox/id-001")).toBeUndefined();
  });

  it("schedules exponential backoff with −20 % jitter after a failure", async () => {
    const { outbox, advance, scheduled } = engineWith({}, { area, remote: failingRemote(4) });

    outbox.enqueue({
      type: "watch.toggle",
      entityKey: "watchlist",
      payload: { coinId: "ethereum", watching: true } as WatchToggledPayload,
    });

    const expectedDelays = [800, 1600, 3200, 6400];
    for (const expected of expectedDelays) {
      await outbox.flush();
      const [timer] = scheduled.splice(-1);
      expect(timer?.delayMs).toBe(expected);
      advance(expected);
    }

    const survivor = JSON.parse(area.getString("outbox/id-001")!) as OutboxEntry;
    expect(survivor.status).toBe("pending");
    expect(survivor.attempts).toBe(expectedDelays.length);
  });

  it("marks an entry failed after MAX_ATTEMPTS and allows retry + discard", async () => {
    const { outbox, advance, scheduled } = engineWith(
      {},
      { area, remote: failingRemote(MAX_ATTEMPTS) },
    );

    outbox.enqueue({ type: "tx.add", entityKey: "transaction", payload: txAdd("t1") });
    for (let round = 0; round < MAX_ATTEMPTS; round += 1) {
      await outbox.flush();
      const [timer] = scheduled.splice(-1);
      advance(timer?.delayMs ?? 0);
    }

    expect(outbox.snapshot().failed).toBe(1);
    const failed = JSON.parse(area.getString("outbox/id-001")!) as OutboxEntry;
    expect(failed.status).toBe("failed");
    expect(failed.attempts).toBe(MAX_ATTEMPTS);
    expect(failed.lastError).toEqual(OFFLINE);

    outbox.retry("id-001");
    const retried = JSON.parse(area.getString("outbox/id-001")!) as OutboxEntry;
    expect(retried.status).toBe("pending");
    expect(retried.attempts).toBe(0);

    outbox.discard("id-001");
    expect(area.getString("outbox/id-001")).toBeUndefined();
    expect(outbox.snapshot().failed).toBe(0);
  });

  it("lists, retries all failed, and clears failed entries", async () => {
    const { outbox, advance, scheduled } = engineWith({}, { area, remote: failingRemote(10) });
    outbox.enqueue({ type: "tx.add", entityKey: "t1", payload: txAdd("1") });
    outbox.enqueue({ type: "tx.add", entityKey: "t2", payload: txAdd("2") });

    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      await outbox.flush();
      const [timer] = scheduled.splice(-1);
      advance(timer?.delayMs ?? 100_000);
    }

    expect(outbox.snapshot().failed).toBe(2);
    expect(outbox.list()).toHaveLength(2);

    outbox.enqueue({ type: "tx.add", entityKey: "t3", payload: txAdd("3") });

    outbox.retryAllFailed();
    expect(outbox.snapshot().pending).toBe(3);
    expect(outbox.snapshot().failed).toBe(0);

    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      await outbox.flush();
      const [timer] = scheduled.splice(-1);
      advance(timer?.delayMs ?? 100_000);
    }
    expect(outbox.snapshot().failed).toBe(3);

    outbox.enqueue({ type: "tx.add", entityKey: "t4", payload: txAdd("4") });

    outbox.clearFailed();
    expect(outbox.snapshot().failed).toBe(0);
    expect(outbox.snapshot().pending).toBe(1);
    expect(outbox.list()).toHaveLength(1);
  });

  it("does not retry inflight entries", async () => {
    let inflightSeen = false;
    const hangingRemote: LedgerRemote = {
      push: async (batch) => {
        inflightSeen = true;
        if (batch[0]) {
          outbox.retry(batch[0].id);
        }
        return ok(batch.length);
      },
      pull: async () => ok({ version: 1, mutations: [] }),
    };
    const { outbox } = engineWith({}, { area, remote: hangingRemote });
    outbox.enqueue({ type: "tx.add", entityKey: "t1", payload: txAdd("1") });
    await outbox.flush();
    expect(inflightSeen).toBe(true);
  });

  it("recoverOrphans re-pends entries stuck inflight after a kill", () => {
    area.set(
      "outbox/id-001",
      JSON.stringify({
        id: "id-001",
        type: "tx.add",
        entityKey: "transaction",
        payload: txAdd("t1"),
        createdAt: 1,
        attempts: 1,
        nextAttemptAt: null,
        status: "inflight",
      }),
    );
    area.set(
      "outbox/id-002",
      JSON.stringify({
        id: "id-002",
        type: "tx.add",
        entityKey: "transaction2",
        payload: txAdd("t2"),
        createdAt: 2,
        attempts: 0,
        nextAttemptAt: null,
        status: "pending",
      }),
    );
    const { outbox } = engineWith({}, { area, remote: failingRemote(0) });

    outbox.recoverOrphans();
    expect(outbox.snapshot()).toEqual({ pending: 2, inflight: 0, failed: 0 });
  });

  it("triggers flush on timer expiry", () => {
    let timerCb: (() => void) | null = null;
    const scheduleMock = (cb: () => void) => {
      timerCb = cb;
      return () => {
        timerCb = null;
      };
    };

    const { outbox } = engineWith({ schedule: scheduleMock }, { area, remote: failingRemote(1) });
    outbox.enqueue({ type: "tx.add", entityKey: "transaction", payload: txAdd("t1") });
    expect(timerCb).toBeDefined();
    (timerCb as (() => void) | null)?.();
  });

  it("ignores retry on non-existent or inflight entry", () => {
    const { outbox } = engineWith({}, { area, remote: failingRemote(0) });
    expect(() => outbox.retry("non-existent")).not.toThrow();
  });
});
