/**
 * Zod schemas — source of truth per
 * Contract-tested against `__fixtures__/coingecko/*.json` (see coingecko-schemas.test.ts).
 */

import { z } from "zod";

export const coinMarketRowSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  name: z.string(),
  image: z.string().nullable().optional(),
  current_price: z.number(),
  market_cap: z.number(),
  market_cap_rank: z.number().int().nullable(),
  fully_diluted_valuation: z.number().nullable(),
  total_volume: z.number(),
  high_24h: z.number().nullable(),
  low_24h: z.number().nullable(),
  price_change_24h: z.number().nullable(),
  price_change_percentage_24h: z.number().nullable(),
  market_cap_change_24h: z.number(),
  market_cap_change_percentage_24h: z.number(),
  circulating_supply: z.number(),
  total_supply: z.number().nullable(),
  max_supply: z.number().nullable(),
  ath: z.number().nullable(),
  ath_change_percentage: z.number(),
  ath_date: z.string().nullable(),
  atl: z.number().nullable(),
  atl_change_percentage: z.number(),
  atl_date: z.string().nullable(),
  last_updated: z.string(),
  sparkline_in_7d: z.object({ price: z.array(z.number()) }).nullable(),
  price_change_percentage_24h_in_currency: z.number().nullable().optional(),
});

export type CoinMarketRow = z.infer<typeof coinMarketRowSchema>;

export const marketChartSchema = z.object({
  prices: z.array(z.tuple([z.number(), z.number()])),
  market_caps: z.array(z.tuple([z.number(), z.number()])),
  total_volumes: z.array(z.tuple([z.number(), z.number()])),
});

export type MarketChart = z.infer<typeof marketChartSchema>;

export const coinDetailSchema = z
  .object({
    id: z.string(),
    symbol: z.string(),
    name: z.string(),
    market_cap_rank: z.number().int().nullable(),
    market_data: z
      .object({
        current_price: z.record(z.string(), z.number()),
        market_cap: z.record(z.string(), z.number()),
        fully_diluted_valuation: z.record(z.string(), z.number()).nullable(),
        total_volume: z.record(z.string(), z.number()),
        circulating_supply: z.number().optional(),
        total_supply: z.number().nullable().optional(),
        max_supply: z.number().nullable().optional(),
        ath: z.record(z.string(), z.number()).nullable(),
        ath_date: z.record(z.string(), z.string()).nullable(),
        atl: z.record(z.string(), z.number()).nullable(),
        atl_date: z.record(z.string(), z.string()).nullable(),
        high_24h: z.record(z.string(), z.number()).nullable(),
        low_24h: z.record(z.string(), z.number()).nullable(),
        price_change_percentage_24h: z.number().nullable().optional(),
        price_change_percentage_7d: z.number().nullable().optional(),
        price_change_percentage_30d: z.number().nullable().optional(),
        price_change_percentage_1y: z.number().nullable().optional(),
        price_change_percentage_24h_in_currency: z
          .record(z.string(), z.number())
          .nullable()
          .optional(),
        price_change_percentage_7d_in_currency: z
          .record(z.string(), z.number())
          .nullable()
          .optional(),
        price_change_percentage_30d_in_currency: z
          .record(z.string(), z.number())
          .nullable()
          .optional(),
        price_change_percentage_1y_in_currency: z
          .record(z.string(), z.number())
          .nullable()
          .optional(),
      })
      .nullable(),
    last_updated: z.string().optional(),
  })
  .loose();

export type CoinDetail = z.infer<typeof coinDetailSchema>;

export const exchangeRateSchema = z.object({
  name: z.string(),
  unit: z.string(),
  value: z.number(),
  type: z.string(),
});

export const exchangeRatesSchema = z.object({
  rates: z.record(z.string(), exchangeRateSchema),
});

export type ExchangeRates = z.infer<typeof exchangeRatesSchema>;

export const supportedVsCurrenciesSchema = z.array(z.string());

export const categorySchema = z.object({
  category_id: z.string(),
  name: z.string(),
});

export const categoriesListSchema = z.array(categorySchema);

export type CategoriesList = z.infer<typeof categoriesListSchema>;

export type Category = z.infer<typeof categorySchema>;

export const apiErrorEnvelopeSchema = z
  .object({
    status: z
      .object({
        error_code: z.number(),
        error_message: z.string(),
      })
      .loose(),
  })
  .loose();
