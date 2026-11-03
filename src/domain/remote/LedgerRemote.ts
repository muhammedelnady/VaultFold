/**
 * `LedgerRemote` — the domain port for the sync target.
 *
 * CoinGecko is read-only, so "sync" needs a contract to point at. Implementations:
 * - `SimulatedLedgerRemote` (Data layer): a separate MMKV instance acting as a
 * fake server — swappable with a real API without touching the domain.
 */

import type { AppError } from "@domain/errors";
import type { Result } from "@domain/Result";

import type { OutboxEntry, OutboxPayloadForType } from "../sync/outbox-contract";

export interface ServerMutationRecord {
  readonly clientMutationId: string;
  readonly type: OutboxEntry["type"];
  readonly payload: OutboxPayloadForType<OutboxEntry["type"]>;
  readonly appliedAt: number;
}

export interface LedgerPullResponse {
  readonly version: number;
  readonly mutations: readonly ServerMutationRecord[];
}

export interface LedgerRemote {
  readonly push: (mutations: readonly OutboxEntry[]) => Promise<Result<number, AppError>>;
  readonly pull: (sinceVersion: number) => Promise<Result<LedgerPullResponse, AppError>>;
}
