/**
 * E2E fixtures — deterministic test doubles.
 *
 * When EXPO_PUBLIC_E2E=1, the DI container swaps:
 * - httpClient → fixture adapter returning bundled JSON
 * - biometrics → always succeeds (no native prompt)
 */

import { HttpClient } from "@core/network/http-client";
import type { HttpSuccess } from "@core/network/http-client";
import { RetryPolicy } from "@core/network/retry-policy";
import { TokenBucket } from "@core/network/token-bucket";
import { Connectivity } from "@core/offline/connectivity";
import type { AppError } from "@domain/errors";
import { ok, err, type Result } from "@domain/Result";

import categoriesListFixture from "../../__fixtures__/coingecko/categories-list.json";
import coinBitcoinFixture from "../../__fixtures__/coingecko/coin-bitcoin.json";
import exchangeRatesFixture from "../../__fixtures__/coingecko/exchange-rates.json";
import marketChart1dFixture from "../../__fixtures__/coingecko/market-chart-1d.json";
import marketChart30dFixture from "../../__fixtures__/coingecko/market-chart-30d.json";
import marketChart365dFixture from "../../__fixtures__/coingecko/market-chart-365d.json";
import marketChart7dFixture from "../../__fixtures__/coingecko/market-chart-7d.json";
import marketsUsdFixture from "../../__fixtures__/coingecko/markets-usd.json";
import pingFixture from "../../__fixtures__/coingecko/ping.json";
import supportedVsCurrenciesFixture from "../../__fixtures__/coingecko/supported-vs-currencies.json";

const FIXTURES_BY_KEY: Record<string, unknown> = {
  ping: pingFixture,
  "coins-markets": marketsUsdFixture,
  "markets-usd": marketsUsdFixture,
  "coins-categories-list": categoriesListFixture,
  "categories-list": categoriesListFixture,
  exchange_rates: exchangeRatesFixture,
  "exchange-rates": exchangeRatesFixture,
  "simple-supported_vs_currencies": supportedVsCurrenciesFixture,
  "supported-vs-currencies": supportedVsCurrenciesFixture,
  "coins-bitcoin": coinBitcoinFixture,
  "coin-bitcoin": coinBitcoinFixture,
  "market-chart-1d": marketChart1dFixture,
  "market-chart-7d": marketChart7dFixture,
  "market-chart-30d": marketChart30dFixture,
  "market-chart-365d": marketChart365dFixture,
};

function makeError(kind: AppError["kind"], message: string): AppError {
  if (kind === "not-found") {
    return { kind, message, entity: "fixture" };
  }
  if (kind === "http") {
    return { kind, status: 405, message };
  }
  if (kind === "rate-limited") {
    return { kind, retryAfterMs: 60_000, message };
  }
  if (kind === "offline") {
    return { kind, message };
  }
  if (kind === "parse") {
    return { kind, message };
  }
  return { kind, message };
}

class FixtureHttpClient extends HttpClient {
  constructor() {
    const connectivity = new Connectivity();
    super({
      connectivity,
      bucket: new TokenBucket({ capacity: 100, windowMs: 60_000 }),
      retryPolicy: new RetryPolicy(),
    });
  }

  public override async get(url: string): Promise<Result<HttpSuccess, AppError>> {
    const cleanUrl = url.replace("https://api.coingecko.com/api/v3/", "");
    const pathname = cleanUrl.replace(/[?#].*$/, "").replace(/^\//, "");
    const normalizedKey = pathname.replace(/\//g, "-");

    let fixtureData: unknown = FIXTURES_BY_KEY[normalizedKey];

    if (!fixtureData && cleanUrl.includes("market_chart")) {
      if (cleanUrl.includes("days=7")) {
        fixtureData = marketChart7dFixture;
      } else if (cleanUrl.includes("days=30")) {
        fixtureData = marketChart30dFixture;
      } else if (cleanUrl.includes("days=365")) {
        fixtureData = marketChart365dFixture;
      } else {
        fixtureData = marketChart1dFixture;
      }
    }

    if (!fixtureData && normalizedKey.startsWith("coins-")) {
      fixtureData = coinBitcoinFixture;
    }

    if (fixtureData !== undefined) {
      return ok({
        status: 200,
        headers: { "content-type": "application/json" },
        json: fixtureData,
        url,
      });
    }

    return err(makeError("not-found", `No fixture for ${url}`));
  }

  public override async post(): Promise<Result<HttpSuccess, AppError>> {
    return err(makeError("http", "POST not supported in E2E fixtures"));
  }
}

export const E2EFixtures = {
  httpClient: new FixtureHttpClient(),

  biometricResult: { success: true, error: undefined },
};
