/**
 * GetMarketData use case.
 *
 * Input: pagination + optional filter (category, sort, search).
 * Output: `Result<MarketPage, AppError>` — the market explorer screen renders
 * this directly; the UI layer never touches the repository.
 *
 * Dependency: `MarketRepository` port from domain. The data layer provides the
 * concrete `MarketRepositoryImpl`; the use case only knows the interface.
 */

import type { AppError } from "@domain/errors";
import type { MarketFilter, MarketPage, MarketSort } from "@domain/market/MarketEntry";
import type { MarketRepository } from "@domain/market/MarketRepository";
import type { Result } from "@domain/Result";

export interface GetMarketDataInput {
  readonly page?: number;
  readonly pageSize?: number;
  readonly category?: string;
  readonly sort?: MarketSort;
  readonly search?: string;
  readonly filter?: MarketFilter;
}

export interface GetMarketDataUseCase {
  readonly handle: (input: GetMarketDataInput) => Promise<Result<MarketPage, AppError>>;
}

export function createGetMarketDataUseCase(marketRepo: MarketRepository): GetMarketDataUseCase {
  return {
    handle: async (input: GetMarketDataInput): Promise<Result<MarketPage, AppError>> => {
      const page = Math.max(1, input.page ?? 1);
      const pageSize = Math.max(1, Math.min(input.pageSize ?? 20, 100));

      return marketRepo.getMarkets(input.filter, input.sort, page, pageSize);
    },
  };
}
