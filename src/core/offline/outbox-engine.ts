/**
 * Outbox engine — persistent offline mutation queue.
 *
 * Storage: one key per entry in the encrypted vault area (`outbox/<id>`), so a
 * crash mid-mutation cannot corrupt the whole queue. FIFO per `entityKey`,
 * coalescing for redundant `watch.toggle` ops, exponential backoff 1 s → 60 s
 * cap with ±20 % jitter, and a `failed` terminal state after 5 attempts with
 * manual Retry (resets attempts) / Discard.
 *
 * Subscriptions feed the "Pending Sync Operations" counter in the dev bar —
 * pub-sub with O(1) reads so candidate lists can observe without extra renders.
 */

import type { LedgerRemote } from "@domain/remote/LedgerRemote";
import type { OutboxEntry, OutboxEntryStatus, OutboxEntryType } from "@domain/sync/outbox-contract";
import { coalescesWith } from "@domain/sync/outbox-contract";

import type { MmkvArea } from "./storage-areas";

const KEY_PREFIX = "outbox/";
export const MAX_ATTEMPTS = 5;
const BACKOFF_BASE_MS = 1_000;
const BACKOFF_CAP_MS = 60_000;
const JITTER_RATIO = 0.2;

export interface OutboxSnapshot {
  readonly pending: number;
  readonly inflight: number;
  readonly failed: number;
}

export interface EnqueueInput {
  readonly type: OutboxEntryType;
  readonly entityKey: string;
  readonly payload: OutboxEntry["payload"];
}

export interface OutboxEngineDeps {
  readonly area: MmkvArea;
  readonly remote: LedgerRemote;
  readonly isOnline?: () => boolean;
  readonly now?: () => number;
  readonly random?: () => number;
  readonly nextId?: () => string;
  readonly schedule?: (fn: () => void, delayMs: number) => () => void;
}

function entryKey(id: string): string {
  return `${KEY_PREFIX}${id}`;
}

function persist(area: MmkvArea, entry: OutboxEntry): void {
  area.set(entryKey(entry.id), JSON.stringify(entry));
}

function loadAll(area: MmkvArea): OutboxEntry[] {
  return area
    .getAllKeys()
    .filter((key) => key.startsWith(KEY_PREFIX))
    .map((key) => {
      const raw = area.getString(key);
      if (raw === undefined) return null;
      try {
        return JSON.parse(raw) as OutboxEntry;
      } catch {
        return null;
      }
    })
    .filter((entry): entry is OutboxEntry => entry !== null)
    .sort((a, b) => a.createdAt - b.createdAt || a.entityKey.localeCompare(b.entityKey));
}

function backoffFor(attempts: number, random: () => number): number {
  const exponential = Math.min(BACKOFF_BASE_MS * 2 ** (attempts - 1), BACKOFF_CAP_MS);
  const jitter = 1 + JITTER_RATIO * (2 * random() - 1);
  return Math.max(1, Math.round(exponential * jitter));
}

function inFlightBatch(entries: readonly OutboxEntry[], now: number): OutboxEntry[] {
  const due = entries.filter(
    (entry) =>
      entry.status === "pending" && (entry.nextAttemptAt === null || entry.nextAttemptAt <= now),
  );
  const earliestByEntity = new Map<string, OutboxEntry>();
  for (const entry of due) {
    const current = earliestByEntity.get(entry.entityKey);
    if (current === undefined || entry.createdAt < current.createdAt) {
      earliestByEntity.set(entry.entityKey, entry);
    }
  }
  return [...earliestByEntity.values()];
}

export function createOutboxEngine(deps: OutboxEngineDeps) {
  const { area, remote } = deps;
  const isOnline = deps.isOnline ?? (() => true);
  const now = deps.now ?? (() => Date.now());
  const random = deps.random ?? Math.random;
  const nextId =
    deps.nextId ??
    (() => {
      throw new Error("OutboxEngine: nextId is required for enqueue");
    });
  const schedule =
    deps.schedule ??
    ((fn: () => void, delayMs: number) => {
      const timer = setTimeout(fn, delayMs);
      return () => clearTimeout(timer);
    });

  let cancelTimer: (() => void) | null = null;
  const listeners = new Set<(snapshot: OutboxSnapshot) => void>();

  function snapshot(): OutboxSnapshot {
    const entries = loadAll(area);
    let pending = 0;
    let inflight = 0;
    let failed = 0;
    for (const entry of entries) {
      if (entry.status === "pending") pending += 1;
      else if (entry.status === "inflight") inflight += 1;
      else failed += 1;
    }
    return { pending, inflight, failed };
  }

  function notify(): void {
    const snap = snapshot();
    for (const listener of listeners) listener(snap);
  }

  function subscribe(listener: (snapshot: OutboxSnapshot) => void): () => void {
    listeners.add(listener);
    listener(snapshot());
    return () => {
      listeners.delete(listener);
    };
  }

  function enqueue(input: EnqueueInput): OutboxEntry {
    const candidates = loadAll(area);
    const baseEntry: OutboxEntry = {
      id: nextId(),
      type: input.type,
      entityKey: input.entityKey,
      payload: input.payload,
      createdAt: now(),
      attempts: 0,
      nextAttemptAt: null,
      status: "pending",
    };
    for (const existing of candidates) {
      if (coalescesWith(existing, baseEntry)) {
        area.remove(entryKey(existing.id));
        continue;
      }
    }
    persist(area, baseEntry);
    notify();
    void flushSoon();
    return baseEntry;
  }

  function flushSoon(): void {
    if (!isOnline()) return;
    if (cancelTimer !== null) return;
    const current = loadAll(area);
    const nowMs = now();
    const due = inFlightBatch(current, nowMs);
    if (due.length === 0 && current.every((entry) => entry.status !== "pending")) return;
    const earliest = current
      .filter((entry) => entry.status === "pending")
      .reduce<number | null>((min, entry) => {
        if (entry.nextAttemptAt === null) return min;
        return min === null ? entry.nextAttemptAt : Math.min(min, entry.nextAttemptAt);
      }, null);
    const delay = earliest === null ? 0 : Math.max(0, earliest - nowMs);
    cancelTimer = schedule(() => {
      cancelTimer = null;
      void flush();
    }, delay);
  }

  async function flush(): Promise<OutboxSnapshot> {
    cancelTimer?.();
    cancelTimer = null;

    if (!isOnline()) {
      notify();
      return snapshot();
    }

    const nowMs = now();
    const batch = inFlightBatch(loadAll(area), nowMs);
    if (batch.length === 0) {
      notify();
      return snapshot();
    }

    for (const entry of batch) {
      persist(area, { ...entry, status: "inflight" });
    }
    notify();

    const result = await remote.push(batch);
    if (result.kind === "ok") {
      for (const entry of batch) {
        area.remove(entryKey(entry.id));
      }
    } else {
      for (const entry of batch) {
        const attempts = entry.attempts + 1;
        if (attempts >= MAX_ATTEMPTS) {
          persist(area, {
            ...entry,
            status: "failed",
            attempts,
            nextAttemptAt: null,
            lastError: result.error,
          });
        } else {
          const delay = backoffFor(attempts, random);
          persist(area, {
            ...entry,
            status: "pending",
            attempts,
            nextAttemptAt: now() + delay,
            lastError: result.error,
          });
        }
      }
      flushSoon();
    }
    notify();
    return snapshot();
  }

  function retry(id: string): void {
    const entry = loadAll(area).find((candidate) => candidate.id === id);
    if (entry === undefined || entry.status === "inflight") return;
    persist(area, { ...entry, status: "pending", attempts: 0, nextAttemptAt: null });
    notify();
    void flushSoon();
  }

  function retryAllFailed(): void {
    for (const entry of loadAll(area)) {
      if (entry.status === "failed") {
        persist(area, { ...entry, status: "pending", attempts: 0, nextAttemptAt: null });
      }
    }
    notify();
    void flushSoon();
  }

  function clearFailed(): void {
    for (const entry of loadAll(area)) {
      if (entry.status === "failed") {
        area.remove(entryKey(entry.id));
      }
    }
    notify();
  }

  function discard(id: string): void {
    area.remove(entryKey(id));
    notify();
  }

  function recoverOrphans(): void {
    for (const entry of loadAll(area)) {
      if (entry.status === "inflight") {
        persist(area, { ...entry, status: "pending", nextAttemptAt: null });
      }
    }
    notify();
    void flushSoon();
  }

  return {
    enqueue,
    flush,
    flushSoon,
    retry,
    retryAllFailed,
    clearFailed,
    discard,
    recoverOrphans,
    subscribe,
    snapshot,
    list: () => loadAll(area),
  };
}

export type OutboxEngine = ReturnType<typeof createOutboxEngine>;
export type { OutboxEntry, OutboxEntryStatus };
