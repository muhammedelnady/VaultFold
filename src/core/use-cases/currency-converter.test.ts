/**
 * Tests for currency converter cross-rate calculations.
 */

import { describe, expect, it } from "@jest/globals";

import type { RawExchangeRatesMap } from "@domain/currency/CurrencyTypes";

import { calculateEgpCrossRate, convertUsdToEgp } from "./currency-converter";

describe("currency-converter (EGP Cross-Rate)", () => {
  const mockExchangeRates: RawExchangeRatesMap = {
    rates: {
      usd: { name: "US Dollar", unit: "$", value: 68000, type: "fiat" },
      egp: { name: "Egyptian Pound", unit: "EGP", value: 3366000, type: "fiat" },
      eur: { name: "Euro", unit: "€", value: 62500, type: "fiat" },
    },
  };

  it("calculates EGP cross-rate accurately from BTC rates", () => {
    const result = calculateEgpCrossRate(mockExchangeRates, 1700000000000);

    expect(result.kind).toBe("ok");
    if (result.kind === "ok") {
      expect(result.value.rate).toBe("49.5000");
      expect(result.value.btcUsd).toBe("68000");
      expect(result.value.btcEgp).toBe("3366000");
      expect(result.value.timestamp).toBe(1700000000000);
    }

    const defaultTimestamp = calculateEgpCrossRate(mockExchangeRates);
    expect(defaultTimestamp.kind).toBe("ok");
  });

  it("converts USD decimal amounts to EGP", () => {
    const egp = convertUsdToEgp("100.00", "49.5000");
    expect(egp).toBe("4950.00");

    const zero = convertUsdToEgp("0", "49.5000");
    expect(zero).toBe("0.00");

    const fractional = convertUsdToEgp("1.50", "50.00");
    expect(fractional).toBe("75.00");

    const invalid = convertUsdToEgp("invalid", "49.50");
    expect(invalid).toBe("0.00");
  });

  it("returns parse error when USD or EGP quote is missing", () => {
    const missingEgp: RawExchangeRatesMap = {
      rates: {
        usd: { name: "US Dollar", unit: "$", value: 68000, type: "fiat" },
      },
    };
    const res1 = calculateEgpCrossRate(missingEgp);
    expect(res1.kind).toBe("err");
    if (res1.kind === "err") {
      expect(res1.error.kind).toBe("parse");
    }

    const missingUsd: RawExchangeRatesMap = {
      rates: {
        egp: { name: "Egyptian Pound", unit: "EGP", value: 3366000, type: "fiat" },
      },
    };
    const res2 = calculateEgpCrossRate(missingUsd);
    expect(res2.kind).toBe("err");
  });

  it("returns validation error when quotes are non-positive", () => {
    const zeroUsd: RawExchangeRatesMap = {
      rates: {
        usd: { name: "US Dollar", unit: "$", value: 0, type: "fiat" },
        egp: { name: "Egyptian Pound", unit: "EGP", value: 3366000, type: "fiat" },
      },
    };
    const res = calculateEgpCrossRate(zeroUsd);
    expect(res.kind).toBe("err");
    if (res.kind === "err") {
      expect(res.error.kind).toBe("validation");
    }
  });
});
