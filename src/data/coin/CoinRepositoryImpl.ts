/**
 * CoinRepository implementation.
 *
 * Wraps CoinGeckoClient, returns Result<CoinDetail, AppError>.
 * The use case (GetCoinDetail) only knows the CoinRepository interface.
 */

import {
  CoinGeckoClient,
  type CoinDetail as CoingeckoCoinDetail,
} from "@data/api/coingecko-client";
import type { CoinDetail } from "@domain/coin/CoinDetail";
import type { CoinRepository } from "@domain/coin/CoinRepository";
import type { AppError } from "@domain/errors";
import { ok, err, type Result } from "@domain/Result";

function mapCoinDetail(raw: CoingeckoCoinDetail): CoinDetail {
  const md = raw.market_data;
  if (!md) {
    throw new Error("CoinGecko response missing market_data");
  }
  return {
    id: raw.id,
    name: raw.name,
    symbol: raw.symbol,
    marketCapRank: raw.market_cap_rank ?? undefined,
    priceUsd: String(md.current_price?.["usd"] ?? 0),
    priceChange24h: String(
      md.price_change_percentage_24h_in_currency?.["usd"] ?? md.price_change_percentage_24h ?? 0,
    ),
    priceChange7d: String(md.price_change_percentage_7d_in_currency?.["usd"] ?? 0),
    priceChange30d: String(md.price_change_percentage_30d_in_currency?.["usd"] ?? 0),
    priceChange1y: String(md.price_change_percentage_1y_in_currency?.["usd"] ?? 0),
    high24h: String(md.high_24h?.["usd"] ?? 0),
    low24h: String(md.low_24h?.["usd"] ?? 0),
    marketCapUsd: String(md.market_cap?.["usd"] ?? 0),
    fullyDilutedUsd: String(md.fully_diluted_valuation?.["usd"] ?? 0),
    totalVolume24h: String(md.total_volume?.["usd"] ?? 0),
    circulatingSupply: String(md.circulating_supply ?? 0),
    totalSupply: md.total_supply != null ? String(md.total_supply) : null,
    lastUpdated: raw.last_updated ? Date.parse(raw.last_updated) : Date.now(),
  };
}

export class CoinRepositoryImpl implements CoinRepository {
  private readonly client: CoinGeckoClient;

  constructor(client: CoinGeckoClient) {
    this.client = client;
  }

  async getCoinDetail(coinGeckoId: string): Promise<Result<CoinDetail, AppError>> {
    const result = await this.client.coinDetail(coinGeckoId);
    if (result.kind === "err") {
      return result;
    }
    try {
      return ok(mapCoinDetail(result.value));
    } catch (error) {
      return err({ kind: "parse", message: "Failed to map coin detail", cause: error });
    }
  }
}
