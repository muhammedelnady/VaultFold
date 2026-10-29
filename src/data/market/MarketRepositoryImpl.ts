/**
 * MarketRepository implementation.
 * Wraps CoinGeckoClient, returns Result<MarketPage, AppError>.
 * The use case (GetMarketData) only knows the MarketRepository interface.
 */
import { calculateEgpCrossRate } from "@core/use-cases/currency-converter";
import { type ChartDays, type CoinGeckoClient } from "@data/api/coingecko-client";
import type { EgpCrossRate } from "@domain/currency/CurrencyTypes";
import type { AppError } from "@domain/errors";
import type { MarketEntry, MarketFilter, MarketPage, MarketSort } from "@domain/market/MarketEntry";
import type { MarketRepository } from "@domain/market/MarketRepository";
import { type Result } from "@domain/Result";

export class MarketRepositoryImpl implements MarketRepository {
  private readonly client: CoinGeckoClient;

  constructor(client: CoinGeckoClient) {
    this.client = client;
  }

  async getMarkets(
    filter?: MarketFilter,
    _sort: MarketSort = "rank",
    page = 1,
    pageSize = 50,
    vsCurrency: "usd" | "eur" | "sar" = "usd",
  ): Promise<Result<MarketPage, AppError>> {
    const params = {
      vsCurrency: vsCurrency ?? "usd",
      perPage: pageSize,
      page,
      sparkline: true,
      priceChangePercentage: "24h",
      category: filter?.category,
    };
    const result = await this.client.coinMarkets(params);
    if (result.kind === "err") {
      return result;
    }
    const items: MarketEntry[] = result.value.map((row) => {
      const pct = row.price_change_percentage_24h_in_currency as Record<string, number> | undefined;
      const sparkline = row.sparkline_in_7d?.price ?? [];
      return {
        id: row.id,
        name: row.name,
        symbol: row.symbol,
        rank: row.market_cap_rank ?? 0,
        priceUsd: String(row.current_price ?? 0),
        priceChange24h: String(
          pct?.[vsCurrency] ?? pct?.["usd"] ?? row.price_change_percentage_24h ?? 0,
        ),
        marketCapUsd: String(row.market_cap ?? 0),
        volume24hUsd: String(row.total_volume ?? 0),
        sparkline7d: sparkline,
        imageUrl: row.image ?? undefined,
      };
    });
    return {
      kind: "ok",
      value: {
        items,
        hasMore: items.length === pageSize,
        page,
        total: items.length,
      },
    };
  }

  async getMarketChart(
    coinId: string,
    days: ChartDays,
    vsCurrency: "usd" | "eur" | "sar" = "usd",
  ): Promise<
    Result<
      {
        readonly prices: readonly [number, number][];
        readonly marketCaps: readonly [number, number][];
        readonly totalVolumes: readonly [number, number][];
      },
      AppError
    >
  > {
    const result = await this.client.marketChart(coinId, days, vsCurrency ?? "usd");
    if (result.kind === "err") {
      return result;
    }
    return {
      kind: "ok",
      value: {
        prices: result.value.prices.map((p) => [p[0], p[1]]) as [number, number][],
        marketCaps: result.value.market_caps.map((p) => [p[0], p[1]]) as [number, number][],
        totalVolumes: result.value.total_volumes.map((p) => [p[0], p[1]]) as [number, number][],
      },
    };
  }

  async getExchangeRates(): Promise<Result<EgpCrossRate, AppError>> {
    const result = await this.client.exchangeRates();
    if (result.kind === "err") {
      return result;
    }
    return calculateEgpCrossRate(result.value);
  }
}
