/**
 * Unit tests for CoinGeckoClient REST endpoint adapters.
 */

import { describe, expect, it, jest } from "@jest/globals";

import type { HttpClient, HttpSuccess } from "@core/network/http-client";
import { ok, err } from "@domain/Result";

import { CoinGeckoApi } from "./coingecko-client";
import type {
  CoinMarketRow,
  CoinDetail,
  MarketChart,
  ExchangeRates,
  CategoriesList,
} from "./coingecko-schemas";

function createMockHttpClient(): HttpClient {
  return {
    get: jest.fn(),
    post: jest.fn(),
  } as unknown as HttpClient;
}

function createHttpSuccess<T>(data: T): HttpSuccess {
  return {
    status: 200,
    headers: { "content-type": "application/json" },
    json: data,
    url: "https://api.coingecko.com/api/v3/test",
  };
}

describe("CoinGeckoApi", () => {
  let httpClient: HttpClient;
  let api: CoinGeckoApi;

  beforeEach(() => {
    httpClient = createMockHttpClient();
    api = new CoinGeckoApi(httpClient);
  });

  describe("ping", () => {
    it("returns ok on success", async () => {
      jest
        .mocked(httpClient.get)
        .mockResolvedValueOnce(ok(createHttpSuccess({ gecko_says: "V3" })));
      const result = await api.ping();
      expect(result.kind).toBe("ok");
    });

    it("returns error on http failure", async () => {
      jest
        .mocked(httpClient.get)
        .mockResolvedValueOnce(err({ kind: "http", status: 500, message: "Server error" }));
      const result = await api.ping();
      expect(result.kind).toBe("err");
    });
  });

  describe("coinMarkets", () => {
    const mockMarkets: readonly CoinMarketRow[] = [
      {
        id: "bitcoin",
        symbol: "btc",
        name: "Bitcoin",
        current_price: 68000,
        market_cap: 1300000000000,
        market_cap_rank: 1,
        fully_diluted_valuation: 1400000000000,
        total_volume: 30000000000,
        high_24h: 69000,
        low_24h: 67000,
        price_change_24h: 1500,
        price_change_percentage_24h: 2.5,
        market_cap_change_24h: 30000000000,
        market_cap_change_percentage_24h: 2.3,
        circulating_supply: 19700000,
        total_supply: 21000000,
        max_supply: 21000000,
        ath: 73000,
        ath_change_percentage: -6.8,
        ath_date: "2021-11-10T14:24:11.849Z",
        atl: 67,
        atl_change_percentage: 100000,
        atl_date: "2013-07-06T00:00:00.000Z",
        last_updated: "2024-01-01T00:00:00Z",
        sparkline_in_7d: { price: [66000, 67000, 68000] },
        price_change_percentage_24h_in_currency: 2.5,
      },
    ];

    it("fetches markets with default params", async () => {
      jest.mocked(httpClient.get).mockResolvedValueOnce(ok(createHttpSuccess(mockMarkets)));
      const result = await api.coinMarkets({ vsCurrency: "usd" });
      expect(result.kind).toBe("ok");
      expect(jest.mocked(httpClient.get)).toHaveBeenCalled();
    });

    it("omits sparkline param when explicitly set to false", async () => {
      jest.mocked(httpClient.get).mockResolvedValueOnce(ok(createHttpSuccess(mockMarkets)));
      await api.coinMarkets({ vsCurrency: "usd", sparkline: false });
      const callArg = jest.mocked(httpClient.get).mock.calls[0]?.[0] as string;
      expect(callArg).not.toContain("sparkline=");
    });

    it("includes category when provided", async () => {
      jest.mocked(httpClient.get).mockResolvedValueOnce(ok(createHttpSuccess(mockMarkets)));
      await api.coinMarkets({ vsCurrency: "usd", category: "decentralized-finance-defi" });
      const callArg = jest.mocked(httpClient.get).mock.calls[0]?.[0] as string;
      expect(callArg).toContain("category=decentralized-finance-defi");
    });

    it("returns error on http failure", async () => {
      jest
        .mocked(httpClient.get)
        .mockResolvedValueOnce(err({ kind: "http", status: 500, message: "Server error" }));
      const result = await api.coinMarkets({ vsCurrency: "usd" });
      expect(result.kind).toBe("err");
    });

    it("returns parse error on invalid response", async () => {
      jest.mocked(httpClient.get).mockResolvedValueOnce(ok(createHttpSuccess("invalid")));
      const result = await api.coinMarkets({ vsCurrency: "usd" });
      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error.kind).toBe("parse");
      }
    });
  });

  describe("coinDetail", () => {
    const mockDetail: CoinDetail = {
      id: "bitcoin",
      symbol: "btc",
      name: "Bitcoin",
      market_cap_rank: 1,
      market_data: {
        current_price: { usd: 68000 },
        market_cap: { usd: 1300000000000 },
        fully_diluted_valuation: { usd: 1400000000000 },
        total_volume: { usd: 30000000000 },
        circulating_supply: 19700000,
        total_supply: 21000000,
        max_supply: 21000000,
        ath: { usd: 73000 },
        ath_date: { usd: "2021-11-10T14:24:11.849Z" },
        atl: { usd: 67 },
        atl_date: { usd: "2013-07-06T00:00:00.000Z" },
        high_24h: { usd: 69000 },
        low_24h: { usd: 67000 },
        price_change_percentage_24h: 2.5,
        price_change_percentage_7d: 4.5,
        price_change_percentage_30d: -1.2,
        price_change_percentage_1y: 120.0,
        price_change_percentage_24h_in_currency: { usd: 2.5 },
        price_change_percentage_7d_in_currency: { usd: 4.5 },
        price_change_percentage_30d_in_currency: { usd: -1.2 },
        price_change_percentage_1y_in_currency: { usd: 120.0 },
      },
      last_updated: "2024-01-01T00:00:00Z",
    };

    it("fetches coin detail", async () => {
      jest.mocked(httpClient.get).mockResolvedValueOnce(ok(createHttpSuccess(mockDetail)));
      const result = await api.coinDetail("bitcoin");
      expect(result.kind).toBe("ok");
    });

    it("returns error on http failure", async () => {
      jest
        .mocked(httpClient.get)
        .mockResolvedValueOnce(err({ kind: "http", status: 404, message: "Not found" }));
      const result = await api.coinDetail("invalid");
      expect(result.kind).toBe("err");
    });
  });

  describe("marketChart", () => {
    const mockChart: MarketChart = {
      prices: [
        [1700000000, 68000],
        [1700010000, 68500],
      ],
      market_caps: [],
      total_volumes: [],
    };

    it("fetches market chart for 1 day", async () => {
      jest.mocked(httpClient.get).mockResolvedValueOnce(ok(createHttpSuccess(mockChart)));
      const result = await api.marketChart("bitcoin", "1");
      expect(result.kind).toBe("ok");
    });

    it("fetches market chart for 365 days", async () => {
      jest.mocked(httpClient.get).mockResolvedValueOnce(ok(createHttpSuccess(mockChart)));
      const result = await api.marketChart("bitcoin", "365");
      expect(result.kind).toBe("ok");
    });
  });

  describe("exchangeRates", () => {
    const mockRates: ExchangeRates = {
      rates: { usd: { type: "fiat", name: "US Dollar", unit: "$", value: 1 } },
    };

    it("fetches exchange rates", async () => {
      jest.mocked(httpClient.get).mockResolvedValueOnce(ok(createHttpSuccess(mockRates)));
      const result = await api.exchangeRates();
      expect(result.kind).toBe("ok");
    });
  });

  describe("supportedVsCurrencies", () => {
    it("fetches supported currencies", async () => {
      jest
        .mocked(httpClient.get)
        .mockResolvedValueOnce(ok(createHttpSuccess(["usd", "eur", "sar"])));
      const result = await api.supportedVsCurrencies();
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value).toContain("usd");
      }
    });
  });

  describe("categoriesList", () => {
    const mockCategories: CategoriesList = [
      { category_id: "decentralized-finance-defi", name: "DeFi" },
      { category_id: "layer-1", name: "Layer 1" },
    ];

    it("fetches categories list", async () => {
      jest.mocked(httpClient.get).mockResolvedValueOnce(ok(createHttpSuccess(mockCategories)));
      const result = await api.categoriesList();
      expect(result.kind).toBe("ok");
    });
  });
});
