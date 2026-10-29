/**
 * AlertRepository implementation.
 *
 * Encrypted persistence via vault MMKV area; no network calls.
 * Outbox entries are created by the SetPriceAlert use case.
 */

import type { MmkvArea } from "@core/offline/storage-areas";
import type { AlertRepository, PriceAlert } from "@domain/alert/PriceAlert";
import type { AppError } from "@domain/errors";
import { ok, err, type Result } from "@domain/Result";

const ALERTS_KEY = "alerts.v1";

export class AlertRepositoryImpl implements AlertRepository {
  private readonly vaultArea: MmkvArea;

  constructor(vaultArea: MmkvArea) {
    this.vaultArea = vaultArea;
  }

  async getAll(): Promise<Result<readonly PriceAlert[], AppError>> {
    try {
      const raw = this.vaultArea.getString(ALERTS_KEY);
      if (!raw) {
        return ok([]);
      }
      const alerts = JSON.parse(raw) as PriceAlert[];
      return ok(alerts);
    } catch (error) {
      return err({ kind: "parse", message: "Failed to parse alerts", cause: error });
    }
  }

  async upsert(alert: PriceAlert): Promise<Result<void, AppError>> {
    try {
      const current = await this.getAll();
      if (current.kind === "err") {
        return current;
      }
      const existing = current.value;
      const filtered = existing.filter((a: PriceAlert) => a.id !== alert.id);
      const updated = [...filtered, alert];
      this.vaultArea.set(ALERTS_KEY, JSON.stringify(updated));
      return ok(undefined);
    } catch (error) {
      return err({ kind: "unknown", message: "Failed to upsert alert", cause: error });
    }
  }

  async delete(id: string): Promise<Result<void, AppError>> {
    try {
      const current = await this.getAll();
      if (current.kind === "err") {
        return current;
      }
      const updated = current.value.filter((a: PriceAlert) => a.id !== id);
      this.vaultArea.set(ALERTS_KEY, JSON.stringify(updated));
      return ok(undefined);
    } catch (error) {
      return err({ kind: "unknown", message: "Failed to delete alert", cause: error });
    }
  }
}
