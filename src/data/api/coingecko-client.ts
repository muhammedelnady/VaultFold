/**
 * CoinGecko endpoints.
 *
 * Wraps core/network's HttpClient, validates with the Zod schemas and returns
 * `Result<T, AppError>` — no exception ever crosses a layer boundary.
 * Attribution: every request identifies VaultFold per CoinGecko terms.
 */

import type { HttpClient } from "@core/network/http-client";
import type { AppError } from "@domain/errors";
import { err, ok, type Result } from "@domain/Result";

import {
  categoriesListSchema,
  coinDetailSchema,
  coinMarketRowSchema,
  exchangeRatesSchema,
  marketChartSchema,
  supportedVsCurrenciesSchema,
  type CategoriesList,
  type CoinDetail,
  type CoinMarketRow,
  type ExchangeRates,
  type MarketChart,
} from "./coingecko-schemas";

export const BASE_URL = "https://api.coingecko.com/api/v3";

const DEFAULT_HEADERS = {
  accept: "application/json",
  "user-agent":
    "VaultFold/0.1 (https://github.com/vaultfold/vaultfold; open-source market tracker)",
};

export type ChartDays = "1" | "7" | "30" | "365";

export interface CoinMarketsParams {
  readonly vsCurrency: "usd" | "eur" | "sar";
  readonly perPage?: number;
  readonly page?: number;
  readonly sparkline?: boolean;
  readonly priceChangePercentage?: string;
  readonly category?: string;
}

export interface CoinGeckoClient {
  readonly ping: () => Promise<Result<void, AppError>>;
  readonly coinMarkets: (
    options: CoinMarketsParams,
  ) => Promise<Result<readonly CoinMarketRow[], AppError>>;
  readonly coinDetail: (id: string) => Promise<Result<CoinDetail, AppError>>;
  readonly marketChart: (
    id: string,
    days: ChartDays,
    vsCurrency?: "usd" | "eur" | "sar",
  ) => Promise<Result<MarketChart, AppError>>;
  readonly exchangeRates: () => Promise<Result<ExchangeRates, AppError>>;
  readonly supportedVsCurrencies: () => Promise<Result<string[], AppError>>;
  readonly categoriesList: () => Promise<Result<CategoriesList, AppError>>;
}

export class CoinGeckoApi implements CoinGeckoClient {
  private readonly http: HttpClient;

  public constructor(http: HttpClient) {
    this.http = http;
  }

  public async ping(): Promise<Result<void, AppError>> {
    const response = await this.http.get(`${BASE_URL}/ping`, DEFAULT_HEADERS);
    return response.kind === "ok" ? ok(undefined) : response;
  }

  public async coinMarkets(
    params: CoinMarketsParams,
  ): Promise<Result<readonly CoinMarketRow[], AppError>> {
    const url = new URL(`${BASE_URL}/coins/markets`);
    url.searchParams.set("vs_currency", params.vsCurrency);
    url.searchParams.set("order", "market_cap_desc");
    url.searchParams.set("per_page", String(params.perPage ?? 250));
    url.searchParams.set("page", String(params.page ?? 1));
    if (params.sparkline ?? true) {
      url.searchParams.set("sparkline", "true");
    }
    url.searchParams.set("price_change_percentage", params.priceChangePercentage ?? "24h");
    if (params.category !== undefined) {
      url.searchParams.set("category", params.category);
    }
    return this.getAndParse(url.toString(), coinMarketRowSchema.array(), "/coins/markets");
  }

  public async coinDetail(id: string): Promise<Result<CoinDetail, AppError>> {
    const url = `${BASE_URL}/coins/${encodeURIComponent(id)}?localization=false&tickers=false&community_data=false&developer_data=false`;
    return this.getAndParse(url, coinDetailSchema, `/coins/${id}`);
  }

  public async marketChart(
    id: string,
    days: ChartDays,
    vsCurrency: "usd" | "eur" | "sar" = "usd",
  ): Promise<Result<MarketChart, AppError>> {
    const url = `${BASE_URL}/coins/${encodeURIComponent(id)}/market_chart?vs_currency=${vsCurrency}&days=${days}`;
    return this.getAndParse(url, marketChartSchema, `/coins/${id}/market_chart`);
  }

  public async exchangeRates(): Promise<Result<ExchangeRates, AppError>> {
    return this.getAndParse(`${BASE_URL}/exchange_rates`, exchangeRatesSchema, "/exchange_rates");
  }

  public async supportedVsCurrencies(): Promise<Result<string[], AppError>> {
    return this.getAndParse(
      `${BASE_URL}/simple/supported_vs_currencies`,
      supportedVsCurrenciesSchema,
      "/simple/supported_vs_currencies",
    );
  }

  public async categoriesList(): Promise<Result<CategoriesList, AppError>> {
    return this.getAndParse(
      `${BASE_URL}/coins/categories/list`,
      categoriesListSchema,
      "/coins/categories/list",
    );
  }

  private async getAndParse<T>(
    url: string,
    schema: {
      safeParse: (json: unknown) => { success: true; data: T } | { success: false; error: unknown };
    },
    endpoint: string,
  ): Promise<Result<T, AppError>> {
    const response = await this.http.get(url, DEFAULT_HEADERS);
    if (response.kind === "err") {
      return response;
    }
    const parsed = schema.safeParse(response.value.json);
    if (!parsed.success) {
      return err({ kind: "parse", message: `${endpoint} payload drifted`, cause: parsed.error });
    }
    return ok(parsed.data);
  }
}

export type { CoinMarketRow, CoinDetail, ExchangeRates, MarketChart, CategoriesList };
