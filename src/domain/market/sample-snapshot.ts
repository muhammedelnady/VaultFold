/**
 * Bundled sample market snapshot.
 * Shown on cold start when there is no cached data and the network is unavailable.
 * Sourced from verified CoinGecko fixtures (<= 20 coins, labeled).
 */
import fixture from "../../../__fixtures__/coingecko/markets-usd.json";

import type { MarketEntry } from "./MarketEntry";

export const SAMPLE_MARKETS_SNAPSHOT: readonly MarketEntry[] = (fixture as readonly unknown[]).map(
  (raw: unknown) => {
    const row = raw as {
      readonly id: string;
      readonly name: string;
      readonly symbol: string;
      readonly market_cap_rank: number;
      readonly current_price: number;
      readonly price_change_percentage_24h: number;
      readonly market_cap: number;
      readonly total_volume: number;
      readonly sparkline_in_7d: { readonly price: readonly number[] };
      readonly image?: string;
    };

    return {
      id: row.id,
      name: row.name,
      symbol: row.symbol,
      rank: row.market_cap_rank,
      priceUsd: String(row.current_price),
      priceChange24h: String(row.price_change_percentage_24h),
      marketCapUsd: String(row.market_cap),
      volume24hUsd: String(row.total_volume),
      sparkline7d: row.sparkline_in_7d.price,
      imageUrl: row.image,
    };
  },
);
