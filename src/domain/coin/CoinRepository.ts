/**
 * CoinRepository.
 *
 * Provides coin-detail queries. The data-layer implementation maps
 * CoinGecko's raw API response into the `CoinDetail` domain shape.
 */

import type { AppError } from "@domain/errors";
import type { Result } from "@domain/Result";

import type { CoinDetail } from "./CoinDetail";

export interface CoinRepository {
  readonly getCoinDetail: (coinGeckoId: string) => Promise<Result<CoinDetail, AppError>>;
}
