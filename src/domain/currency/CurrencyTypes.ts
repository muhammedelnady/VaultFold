/**
 * Currency domain types.
 *
 * Supported display currencies: USD, EUR, SAR, and EGP.
 * CoinGecko public API does not support EGP as vs_currency; EGP is computed
 * via cross-rate from /exchange_rates.
 */

export const SUPPORTED_CURRENCIES = ["usd", "eur", "sar", "egp"] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export interface RawRateQuote {
  readonly name: string;
  readonly unit: string;
  readonly value: number;
  readonly type: string;
}

export interface RawExchangeRatesMap {
  readonly rates: Record<string, RawRateQuote>;
}

export interface EgpCrossRate {
  readonly rate: string;
  readonly timestamp: number;
  readonly btcUsd: string;
  readonly btcEgp: string;
}

export interface CurrencyConfig {
  readonly code: SupportedCurrency;
  readonly symbol: string;
  readonly name: string;
  readonly isCrossRate: boolean;
}

export const CURRENCY_CONFIGS: Record<SupportedCurrency, CurrencyConfig> = {
  usd: { code: "usd", symbol: "$", name: "US Dollar", isCrossRate: false },
  eur: { code: "eur", symbol: "€", name: "Euro", isCrossRate: false },
  sar: { code: "sar", symbol: "ر.س", name: "Saudi Riyal", isCrossRate: false },
  egp: { code: "egp", symbol: "ج.م", name: "Egyptian Pound", isCrossRate: true },
};
