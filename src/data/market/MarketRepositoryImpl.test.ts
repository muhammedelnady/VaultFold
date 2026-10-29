/**
 * Unit tests for MarketRepositoryImpl market data fetching and caching.
 */

import { describe, expect, it, jest } from "@jest/globals";

import { CoinGeckoClient } from "@data/api/coingecko-client";
import { err, ok } from "@domain/Result";

import { MarketRepositoryImpl } from "./MarketRepositoryImpl";

describe("MarketRepositoryImpl", () => {
  it("fetches markets and maps rows to MarketEntry with decimal strings", async () => {
    const mockClient: Partial<CoinGeckoClient> = {
      coinMarkets: jest.fn(async () =>
        ok([
          {
            id: "bitcoin",
            name: "Bitcoin",
            symbol: "btc",
            market_cap_rank: 1,
            current_price: 65000,
            price_change_percentage_24h: 3.2,
            market_cap: 1200000000000,
            total_volume: 25000000000,
            sparkline_in_7d: { price: [64000, 65000] },
          } as never,
        ]),
      ),
    };

    const repo = new MarketRepositoryImpl(mockClient as CoinGeckoClient);
    const result = await repo.getMarkets();

    expect(result.kind).toBe("ok");
    if (result.kind === "ok") {
      expect(result.value.items).toHaveLength(1);
      const btc = result.value.items[0]!;
      expect(btc.id).toBe("bitcoin");
      expect(btc.priceUsd).toBe("65000");
      expect(btc.rank).toBe(1);
    }
  });

  it("handles missing optional fields and currency percentage fallback", async () => {
    const mockClient: Partial<CoinGeckoClient> = {
      coinMarkets: jest.fn(async () =>
        ok([
          {
            id: "solana",
            name: "Solana",
            symbol: "sol",
            price_change_percentage_24h_in_currency: { usd: 7.8 },
          } as never,
        ]),
      ),
    };

    const repo = new MarketRepositoryImpl(mockClient as CoinGeckoClient);
    const result = await repo.getMarkets();

    expect(result.kind).toBe("ok");
    if (result.kind === "ok") {
      const sol = result.value.items[0]!;
      expect(sol.rank).toBe(0);
      expect(sol.priceUsd).toBe("0");
      expect(sol.priceChange24h).toBe("7.8");
      expect(sol.sparkline7d).toEqual([]);
    }
  });

  it("maps the row image URL to imageUrl so icons render", async () => {
    const mockClient: Partial<CoinGeckoClient> = {
      coinMarkets: jest.fn(async () =>
        ok([
          {
            id: "solana",
            name: "Solana",
            symbol: "sol",
            image: "https://assets.coingecko.com/coins/images/4128/large/solana.png",
            market_cap_rank: 5,
            current_price: 150,
            price_change_percentage_24h: 4.2,
            market_cap: 70000000000,
            total_volume: 3000000000,
            sparkline_in_7d: { price: [140, 150] },
          } as never,
        ]),
      ),
    };

    const repo = new MarketRepositoryImpl(mockClient as CoinGeckoClient);
    const result = await repo.getMarkets();

    expect(result.kind).toBe("ok");
    if (result.kind === "ok") {
      expect(result.value.items[0]?.imageUrl).toBe(
        "https://assets.coingecko.com/coins/images/4128/large/solana.png",
      );
    }
  });

  it("propagates error when coinMarkets client call fails", async () => {
    const mockClient: Partial<CoinGeckoClient> = {
      coinMarkets: jest.fn(async () =>
        err({ kind: "offline", message: "Network unavailable" } as const),
      ),
    };

    const repo = new MarketRepositoryImpl(mockClient as CoinGeckoClient);
    const result = await repo.getMarkets();

    expect(result.kind).toBe("err");
  });

  it("fetches marketChart and maps prices arrays", async () => {
    const mockClient: Partial<CoinGeckoClient> = {
      marketChart: jest.fn(async () =>
        ok({
          prices: [[1700000000, 65000]] as [number, number][],
          market_caps: [[1700000000, 1200000000]] as [number, number][],
          total_volumes: [[1700000000, 300000000]] as [number, number][],
        }),
      ),
    };

    const repo = new MarketRepositoryImpl(mockClient as CoinGeckoClient);
    const result = await repo.getMarketChart("bitcoin", "1");

    expect(result.kind).toBe("ok");
    if (result.kind === "ok") {
      expect(result.value.prices).toHaveLength(1);
      expect(result.value.prices[0]).toEqual([1700000000, 65000]);
    }
  });

  it("propagates error when marketChart client call fails", async () => {
    const mockClient: Partial<CoinGeckoClient> = {
      marketChart: jest.fn(async () =>
        err({ kind: "http", status: 500, message: "Server error" } as const),
      ),
    };

    const repo = new MarketRepositoryImpl(mockClient as CoinGeckoClient);
    const result = await repo.getMarketChart("bitcoin", "7");

    expect(result.kind).toBe("err");
  });

  it("passes custom vsCurrency to coinMarkets", async () => {
    const coinMarketsMock = jest.fn<CoinGeckoClient["coinMarkets"]>(async () => ok([]));
    const mockClient: Partial<CoinGeckoClient> = {
      coinMarkets: coinMarketsMock,
    };

    const repo = new MarketRepositoryImpl(mockClient as CoinGeckoClient);
    await repo.getMarkets(undefined, "rank", 1, 50, "eur");

    expect(coinMarketsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        vsCurrency: "eur",
      }),
    );
  });

  it("passes custom vsCurrency to marketChart", async () => {
    const marketChartMock = jest.fn<CoinGeckoClient["marketChart"]>(async () =>
      ok({
        prices: [] as [number, number][],
        market_caps: [] as [number, number][],
        total_volumes: [] as [number, number][],
      }),
    );
    const mockClient: Partial<CoinGeckoClient> = {
      marketChart: marketChartMock,
    };

    const repo = new MarketRepositoryImpl(mockClient as CoinGeckoClient);
    await repo.getMarketChart("bitcoin", "7", "sar");

    expect(marketChartMock).toHaveBeenCalledWith("bitcoin", "7", "sar");
  });

  it("fetches exchange rates and computes EgpCrossRate", async () => {
    const mockClient: Partial<CoinGeckoClient> = {
      exchangeRates: jest.fn(async () =>
        ok({
          rates: {
            usd: { name: "US Dollar", unit: "$", value: 1, type: "fiat" },
            egp: { name: "Egyptian Pound", unit: "EGP", value: 50, type: "fiat" },
          },
        }),
      ),
    };

    const repo = new MarketRepositoryImpl(mockClient as CoinGeckoClient);
    const result = await repo.getExchangeRates();

    expect(result.kind).toBe("ok");
    if (result.kind === "ok") {
      expect(result.value.rate).toBe("50.0000");
    }
  });

  it("propagates error when exchangeRates client call fails", async () => {
    const mockClient: Partial<CoinGeckoClient> = {
      exchangeRates: jest.fn(async () =>
        err({ kind: "http", status: 500, message: "Server error" } as const),
      ),
    };

    const repo = new MarketRepositoryImpl(mockClient as CoinGeckoClient);
    const result = await repo.getExchangeRates();

    expect(result.kind).toBe("err");
  });
});
