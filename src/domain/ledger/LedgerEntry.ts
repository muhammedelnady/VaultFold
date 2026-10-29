/**
 * Ledger domain types.
 *
 * The ledger is append-only: edit = revision (new entry with prevId),
 * delete = tombstone entry. All quantities/prices are decimal strings.
 */

import type { SupportedCurrency } from "@domain/currency/CurrencyTypes";
import type { AppError } from "@domain/errors";
import type { Result } from "@domain/Result";

export type LedgerEntryType = "buy" | "sell" | "tombstone";

export interface LedgerEntry {
  readonly id: string;
  readonly type: LedgerEntryType;
  readonly coinId: string;
  readonly amount: string;
  readonly price: string;
  readonly currency: SupportedCurrency;
  readonly fee?: string;
  readonly note?: string;
  readonly timestamp: number;
  readonly prevId?: string;
}

export interface LedgerRepository {
  getAllEntries(): Promise<Result<readonly LedgerEntry[], AppError>>;
  appendEntry(entry: LedgerEntry): Promise<Result<void, AppError>>;
  reviseEntry(entry: LedgerEntry): Promise<Result<void, AppError>>;
  tombstoneEntry(id: string): Promise<Result<void, AppError>>;
  getWatchlist(): Promise<Result<readonly string[], AppError>>;
  setWatchlist(coinIds: readonly string[]): Promise<Result<void, AppError>>;
  toggleWatch(coinId: string): Promise<Result<void, AppError>>;
  toggleWatchlist?(coinId: string): Promise<Result<boolean, AppError>>;
}
