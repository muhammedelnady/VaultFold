/**
 * LedgerRepository implementation.
 *
 * Encrypted append-only ledger via vault MMKV area.
 * Edit = revision (new entry with prevId), delete = tombstone.
 */

import type { MmkvArea } from "@core/offline/storage-areas";
import type { AppError } from "@domain/errors";
import type { LedgerRepository, LedgerEntry } from "@domain/ledger/LedgerEntry";
import { ok, err, type Result } from "@domain/Result";

const LEDGER_KEY = "ledger.entries.v1";
const WATCHLIST_KEY = "watchlist.v1";

export class LedgerRepositoryImpl implements LedgerRepository {
  private readonly vaultArea: MmkvArea;

  constructor(vaultArea: MmkvArea) {
    this.vaultArea = vaultArea;
  }

  async getAllEntries(): Promise<Result<readonly LedgerEntry[], AppError>> {
    try {
      const raw = this.vaultArea.getString(LEDGER_KEY);
      if (!raw) {
        return ok([]);
      }
      const entries = JSON.parse(raw) as LedgerEntry[];
      return ok(entries);
    } catch (error) {
      return err({ kind: "parse", message: "Failed to parse ledger entries", cause: error });
    }
  }

  async appendEntry(entry: LedgerEntry): Promise<Result<void, AppError>> {
    try {
      const current = await this.getAllEntries();
      if (current.kind === "err") {
        return current;
      }
      const updated = [...current.value, entry];
      this.vaultArea.set(LEDGER_KEY, JSON.stringify(updated));
      return ok(undefined);
    } catch (error) {
      return err({ kind: "unknown", message: "Failed to append ledger entry", cause: error });
    }
  }

  async reviseEntry(entry: LedgerEntry): Promise<Result<void, AppError>> {
    return this.appendEntry(entry);
  }

  async tombstoneEntry(id: string): Promise<Result<void, AppError>> {
    try {
      const current = await this.getAllEntries();
      if (current.kind === "err") {
        return current;
      }
      const existing = current.value.find((e) => e.id === id);
      if (!existing) {
        return err({ kind: "not-found", message: "Entry not found", entity: "ledger" });
      }
      const tombstone: LedgerEntry = {
        ...existing,
        id: crypto.randomUUID(),
        type: "tombstone",
        prevId: existing.id,
        timestamp: Date.now(),
      };
      return this.appendEntry(tombstone);
    } catch (error) {
      return err({ kind: "unknown", message: "Failed to tombstone entry", cause: error });
    }
  }

  async getWatchlist(): Promise<Result<readonly string[], AppError>> {
    try {
      const raw = this.vaultArea.getString(WATCHLIST_KEY);
      if (!raw) {
        return ok([]);
      }
      const watchlist = JSON.parse(raw) as string[];
      return ok(watchlist);
    } catch (error) {
      return err({ kind: "parse", message: "Failed to parse watchlist", cause: error });
    }
  }

  async setWatchlist(coinIds: readonly string[]): Promise<Result<void, AppError>> {
    try {
      this.vaultArea.set(WATCHLIST_KEY, JSON.stringify(coinIds));
      return ok(undefined);
    } catch (error) {
      return err({ kind: "unknown", message: "Failed to set watchlist", cause: error });
    }
  }

  async toggleWatch(coinId: string): Promise<Result<void, AppError>> {
    const res = await this.toggleWatchlist(coinId);
    return res.kind === "ok" ? ok(undefined) : res;
  }

  async toggleWatchlist(coinId: string): Promise<Result<boolean, AppError>> {
    const current = await this.getWatchlist();
    if (current.kind === "err") {
      return current;
    }
    const list = current.value;
    const watching = !list.includes(coinId);
    const updated = watching ? [...list, coinId] : list.filter((id: string) => id !== coinId);
    const saved = await this.setWatchlist(updated);
    return saved.kind === "ok" ? ok(watching) : saved;
  }
}
