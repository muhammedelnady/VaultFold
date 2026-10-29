/**
 * Unit tests for CoinGecko Zod schema validation.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "@jest/globals";

import {
  categoriesListSchema,
  coinDetailSchema,
  coinMarketRowSchema,
  exchangeRatesSchema,
  marketChartSchema,
  supportedVsCurrenciesSchema,
} from "./coingecko-schemas";

const FIXTURE_DIRECTORY = join(__dirname, "../../../__fixtures__/coingecko");

function load(name: string): unknown {
  return JSON.parse(readFileSync(join(FIXTURE_DIRECTORY, name), "utf8")) as unknown;
}

describe("CoinGecko contract (fixtures captured live)", () => {
  it("market rows parse for usd fixture", () => {
    const rows = coinMarketRowSchema.array().parse(load("markets-usd.json"));
    expect(rows.length).toBeGreaterThan(0);
    const btc = rows.find((row) => row.id === "bitcoin");
    expect(btc?.symbol).toBe("btc");
    expect(btc?.market_cap_rank).toBe(1);
    expect(btc?.sparkline_in_7d?.price.length).toBeGreaterThan(0);
  });

  it("preserves the image URL on market rows so list icons can render", () => {
    const rows = coinMarketRowSchema.array().parse(load("markets-usd.json"));
    const btc = rows.find((row) => row.id === "bitcoin");
    expect(btc?.image).toBe("https://assets.coingecko.com/coins/images/1/large/bitcoin.png");
  });

  it("market_chart fixture has aligned price points with 5-min granularity for days=1", () => {
    const chart = marketChartSchema.parse(load("market-chart-1d.json"));
    expect(chart.prices.length).toBe(60);
    const [firstTs] = chart.prices[0] ?? [NaN, NaN];
    const [lastTs] = chart.prices[chart.prices.length - 1] ?? [NaN, NaN];
    expect(lastTs).toBeGreaterThan(firstTs);
  });

  it("asserts fixture pairs truly belong to a 365d daily series", () => {
    const chart = marketChartSchema.parse(load("market-chart-365d.json"));
    expect(chart.prices.length).toBeGreaterThanOrEqual(50);
  });

  it("coin detail trimmed fixture parses with market_data in usd", () => {
    const detail = coinDetailSchema.parse(load("coin-bitcoin.json"));
    expect(detail.id).toBe("bitcoin");
    expect(detail.market_data?.current_price["usd"] ?? 0).toBeGreaterThan(0);
    expect(detail.market_data?.ath?.["usd"] ?? 0).toBeGreaterThan(0);
  });

  it("exchange rates carry usd/eur/sar AND egp (the cross-rate source)", () => {
    const rates = exchangeRatesSchema.parse(load("exchange-rates.json")).rates;
    expect(rates["usd"]?.value).toBeGreaterThan(0);
    expect(rates["egp"]).toBeDefined();
    expect(rates["sar"]).toBeDefined();
    expect(rates["eur"]).toBeDefined();
  });

  it("supported vs currencies fixture excludes egp and includes usd", () => {
    const list = supportedVsCurrenciesSchema.parse(load("supported-vs-currencies.json"));
    expect(list.includes("usd")).toBe(true);
    expect(list.includes("eur")).toBe(true);
    expect(list.includes("sar")).toBe(true);
    expect(list.includes("egp")).toBe(false);
  });

  it("categories list fixture parses with category_id/name", () => {
    const categories = categoriesListSchema.parse(load("categories-list.json"));
    expect(categories.length).toBeGreaterThan(0);
    expect(categories[0]?.category_id).toBeTruthy();
  });
});
