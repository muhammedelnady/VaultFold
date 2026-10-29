/**
 * GetCoinDetail use case.
 *
 * Input: coinGeckoId string (e.g. "bitcoin", "ethereum").
 * Output: `Result<CoinDetail, AppError>` — the coin detail screen renders
 * this; the UI never calls the repository directly.
 *
 * The domain defines `CoinDetail`; the data layer maps CoinGecko's raw
 * response into this shape via a separate mapper (outside this file).
 */

import type { CoinDetail } from "@domain/coin/CoinDetail";
import type { CoinRepository } from "@domain/coin/CoinRepository";
import type { AppError } from "@domain/errors";
import type { Result } from "@domain/Result";

export interface GetCoinDetailInput {
  readonly coinGeckoId: string;
}

export interface GetCoinDetailUseCase {
  readonly handle: (input: GetCoinDetailInput) => Promise<Result<CoinDetail, AppError>>;
}

export function createGetCoinDetailUseCase(coinRepo: CoinRepository): GetCoinDetailUseCase {
  return {
    handle: async (input: GetCoinDetailInput): Promise<Result<CoinDetail, AppError>> => {
      return coinRepo.getCoinDetail(input.coinGeckoId);
    },
  };
}
