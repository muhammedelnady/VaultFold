/**
 * MarketEntry.
 * A single row in the market explorer FlatList. All fields are plain scalars
 * or strings — no Date objects, no nested objects, so JSON round-trips safely
 * through MMKV and the outbox engine.
 */

export interface MarketEntry {
  readonly id: string;
  readonly name: string;
  readonly symbol: string;
  readonly rank: number;
  readonly priceUsd: string;
  readonly priceChange24h: string;
  readonly marketCapUsd: string;
  readonly volume24hUsd: string;
  readonly sparkline7d: readonly number[];
  readonly imageUrl?: string;
}

export interface MarketPage {
  readonly items: readonly MarketEntry[];
  readonly hasMore: boolean;
  readonly page: number;
  readonly total: number;
}

export interface MarketFilter {
  readonly category?: string;
  readonly search?: string;
}

export type MarketSort = "rank" | "price_24h_change" | "market_cap";

export function marketEntryToCardProps(e: MarketEntry) {
  return {
    id: e.id,
    symbol: e.symbol,
    name: e.name,
    rank: e.rank,
    priceUsd: e.priceUsd,
    change24h: e.priceChange24h,
  };
}
