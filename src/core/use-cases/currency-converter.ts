/**
 * Currency Converter & EGP Cross-rate Calculator.
 *
 * Computes EGP cross-rate from CoinGecko /exchange_rates:
 * BTC-USD rate and BTC-EGP rate -> 1 USD in EGP = (BTC-EGP) / (BTC-USD).
 * Uses Decimal library for exact financial division and multiplication.
 */
import { Decimal } from "decimal.js-light";

import type { EgpCrossRate, RawExchangeRatesMap } from "@domain/currency/CurrencyTypes";
import type { AppError } from "@domain/errors";
import { err, ok, type Result } from "@domain/Result";

export function calculateEgpCrossRate(
  rates: RawExchangeRatesMap,
  timestamp = Date.now(),
): Result<EgpCrossRate, AppError> {
  const usdEntry = rates.rates["usd"];
  const egpEntry = rates.rates["egp"];

  if (!usdEntry || !egpEntry) {
    return err({
      kind: "parse",
      message: "Exchange rates response missing USD or EGP quote",
    });
  }

  if (usdEntry.value <= 0 || egpEntry.value <= 0) {
    return err({
      kind: "validation",
      message: "Exchange rates must be strictly positive",
    });
  }

  const btcUsd = new Decimal(usdEntry.value);
  const btcEgp = new Decimal(egpEntry.value);
  const egpPerUsd = btcEgp.dividedBy(btcUsd).toFixed(4);

  return ok({
    rate: egpPerUsd,
    timestamp,
    btcUsd: btcUsd.toString(),
    btcEgp: btcEgp.toString(),
  });
}

export function convertUsdToEgp(usdAmount: string, egpRate: string): string {
  try {
    const usd = new Decimal(usdAmount);
    const rate = new Decimal(egpRate);
    return usd.times(rate).toFixed(2);
  } catch {
    return "0.00";
  }
}
