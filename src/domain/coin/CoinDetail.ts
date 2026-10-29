/**
 * CoinDetail.
 *
 * The single-coin detail screen renders this shape. All decimal fields are
 * strings to avoid JavaScript float imprecision; callers format with the
 * selected fiat currency (USD/EGP/SAR/EUR).
 */

export interface CoinDetail {
  readonly id: string;
  readonly name: string;
  readonly symbol: string;
  readonly marketCapRank: number | undefined;
  readonly priceUsd: string;
  readonly priceChange24h: string;
  readonly priceChange7d: string;
  readonly priceChange30d: string;
  readonly priceChange1y: string;
  readonly high24h: string;
  readonly low24h: string;
  readonly marketCapUsd: string;
  readonly fullyDilutedUsd: string;
  readonly totalVolume24h: string;
  readonly circulatingSupply: string;
  readonly totalSupply: string | null;
  readonly lastUpdated: number;
}
