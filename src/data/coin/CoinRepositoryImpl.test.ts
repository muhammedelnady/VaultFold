/**
 * Unit tests for CoinRepositoryImpl coin detail fetching and mapping.
 */

import { describe, expect, it, jest } from "@jest/globals";

import { CoinGeckoClient } from "@data/api/coingecko-client";
import { err, ok } from "@domain/Result";

import { CoinRepositoryImpl } from "./CoinRepositoryImpl";

describe("CoinRepositoryImpl", () => {
  it("fetches coin detail and maps raw response to CoinDetail", async () => {
    const mockClient: Partial<CoinGeckoClient> = {
      coinDetail: jest.fn(async () =>
        ok({
          id: "bitcoin",
          name: "Bitcoin",
          symbol: "btc",
          market_cap_rank: 1,
          market_data: {
            current_price: { usd: 68000 },
            price_change_percentage_24h_in_currency: { usd: 2.5 },
            price_change_percentage_7d_in_currency: { usd: 4.1 },
            price_change_percentage_30d_in_currency: { usd: 10.5 },
            price_change_percentage_1y_in_currency: { usd: 120.0 },
            high_24h: { usd: 69000 },
            low_24h: { usd: 67000 },
            market_cap: { usd: 1300000000000 },
            fully_diluted_valuation: { usd: 1400000000000 },
            total_volume: { usd: 25000000000 },
            circulating_supply: 19500000,
            total_supply: 21000000,
          },
          last_updated: "2026-10-25T12:00:00.000Z",
        } as never),
      ),
    };

    const repo = new CoinRepositoryImpl(mockClient as CoinGeckoClient);
    const result = await repo.getCoinDetail("bitcoin");

    expect(result.kind).toBe("ok");
    if (result.kind === "ok") {
      expect(result.value.id).toBe("bitcoin");
      expect(result.value.priceUsd).toBe("68000");
      expect(result.value.priceChange24h).toBe("2.5");
      expect(result.value.totalSupply).toBe("21000000");
    }
  });

  it("returns parse error if market_data is missing", async () => {
    const mockClient: Partial<CoinGeckoClient> = {
      coinDetail: jest.fn(async () =>
        ok({
          id: "missing-data",
          name: "Missing",
          symbol: "mis",
        } as never),
      ),
    };

    const repo = new CoinRepositoryImpl(mockClient as CoinGeckoClient);
    const result = await repo.getCoinDetail("missing-data");

    expect(result.kind).toBe("err");
    if (result.kind === "err") {
      expect(result.error.kind).toBe("parse");
    }
  });

  it("propagates client error", async () => {
    const mockClient: Partial<CoinGeckoClient> = {
      coinDetail: jest.fn(async () =>
        err({ kind: "offline", message: "Network unavailable" } as const),
      ),
    };

    const repo = new CoinRepositoryImpl(mockClient as CoinGeckoClient);
    const result = await repo.getCoinDetail("bitcoin");

    expect(result.kind).toBe("err");
  });

  it("handles null total_supply and fallback fields", async () => {
    const mockClient: Partial<CoinGeckoClient> = {
      coinDetail: jest.fn(async () =>
        ok({
          id: "ethereum",
          name: "Ethereum",
          symbol: "eth",
          market_data: {
            current_price: {},
            price_change_percentage_24h: 1.5,
            total_supply: null,
          },
        } as never),
      ),
    };

    const repo = new CoinRepositoryImpl(mockClient as CoinGeckoClient);
    const result = await repo.getCoinDetail("ethereum");

    expect(result.kind).toBe("ok");
    if (result.kind === "ok") {
      expect(result.value.totalSupply).toBeNull();
      expect(result.value.priceUsd).toBe("0");
      expect(result.value.priceChange24h).toBe("1.5");
      expect(result.value.lastUpdated).toBeGreaterThan(0);
    }
  });
});
