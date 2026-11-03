/**
 * MarketRepository.
 *
 * All use cases depend on this interface — the data layer provides the
 * concrete `MarketRepositoryImpl`. The use case never knows the concrete
 * type; only the port.
 */
import type { EgpCrossRate } from "@domain/currency/CurrencyTypes";
import type { AppError } from "@domain/errors";
import type { Result } from "@domain/Result";

import type { MarketFilter, MarketPage, MarketSort } from "./MarketEntry";

export interface MarketRepository {
  getMarkets(
    filter?: MarketFilter,
    sort?: MarketSort,
    page?: number,
    pageSize?: number,
    vsCurrency?: "usd" | "eur" | "sar",
  ): Promise<Result<MarketPage, AppError>>;

  getMarketChart(
    coinId: string,
    days: "1" | "7" | "30" | "365",
    vsCurrency?: "usd" | "eur" | "sar",
  ): Promise<
    Result<
      {
        readonly prices: readonly [number, number][];
        readonly marketCaps: readonly [number, number][];
        readonly totalVolumes: readonly [number, number][];
      },
      AppError
    >
  >;

  getExchangeRates?(): Promise<Result<EgpCrossRate, AppError>>;
}
