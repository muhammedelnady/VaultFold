/**
 * Price Alert domain types.
 *
 * Price alerts are user-defined triggers: "notify me when BTC crosses $X".
 * They live in the vault (encrypted) and are managed via the outbox for offline support.
 */

import type { AppError } from "@domain/errors";
import type { Result } from "@domain/Result";

export interface PriceAlert {
  readonly id: string;
  readonly coinId: string;
  readonly direction: "above" | "below";
  readonly targetPrice: string;
  readonly currency: "usd";
  readonly active: boolean;
  readonly createdAt: number;
  readonly updatedAt: number;
}

export interface AlertRepository {
  getAll(): Promise<Result<readonly PriceAlert[], AppError>>;
  upsert(alert: PriceAlert): Promise<Result<void, AppError>>;
  delete(id: string): Promise<Result<void, AppError>>;
}
