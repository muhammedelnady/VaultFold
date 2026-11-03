/**
 * Outbox contract. Persisted across app kills, FIFO per
 * `entityKey`, idempotent replays by `id` (= clientMutationId), exponential
 * backoff 1 s → 60 s cap (±20 % jitter), `failed` after 5 attempts with manual
 * Retry/Discard (discard rolls back the optimistic state).
 */

export type OutboxEntryType =
  "tx.add" | "tx.delete" | "watch.toggle" | "alert.upsert" | "alert.delete";
export type OutboxEntryStatus = "pending" | "inflight" | "failed";

export interface OutboxEntry {
  readonly id: string;
  readonly type: OutboxEntryType;
  readonly entityKey: string;
  readonly payload: OutboxPayloadForType<OutboxEntryType>;
  readonly createdAt: number;
  readonly attempts: number;
  readonly nextAttemptAt: number | null;
  readonly status: OutboxEntryStatus;
  readonly lastError?: import("../errors").AppError;
}

export type OutboxPayloadForType<T extends OutboxEntryType> = T extends "tx.add"
  ? TransactionAddedPayload
  : T extends "tx.delete"
    ? TransactionDeletedPayload
    : T extends "watch.toggle"
      ? WatchToggledPayload
      : T extends "alert.upsert"
        ? AlertUpsertedPayload
        : AlertDeletedPayload;

export interface TransactionAddedPayload {
  readonly id: string;
  readonly coinId: string;
  readonly side: "buy" | "sell";
  readonly quantity: string;
  readonly unitPrice: string;
  readonly fee: string;
  readonly fiatCurrency: "usd" | "eur" | "sar" | "egp";
  readonly at: number;
  readonly note?: string;
  readonly revision: number;
  readonly supersedes?: string;
}

export interface TransactionDeletedPayload {
  readonly id: string;
  readonly deletedAt: number;
}

export interface WatchToggledPayload {
  readonly coinId: string;
  readonly watching: boolean;
}

export interface AlertUpsertedPayload {
  readonly id: string;
  readonly coinId: string;
  readonly direction: "above" | "below";
  readonly targetPrice: string;
  readonly currency: "usd" | "eur" | "sar" | "egp";
  readonly active: boolean;
}

export interface AlertDeletedPayload {
  readonly id: string;
}

export type OutboxPayloadByType = {
  readonly [T in OutboxEntryType]: OutboxPayloadForType<T>;
};

export function coalescesWith(previous: OutboxEntry, incoming: OutboxEntry): boolean {
  return (
    previous.type === "watch.toggle" &&
    incoming.type === "watch.toggle" &&
    previous.status === "pending" &&
    previous.entityKey === incoming.entityKey
  );
}
