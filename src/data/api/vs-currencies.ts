/**
 * vs_currency rule:
 * `usd`, `eur`, `sar` are native `vs_currency` values on every endpoint;
 * `egp` is NOT — it must never be sent; it is a cross-rate from /exchange_rates.
 */

import { err, ok, type Result } from "@domain/Result";

export const NATIVE_VS_CURRENCIES = ["usd", "eur", "sar"] as const;
export type NativeVsCurrency = (typeof NATIVE_VS_CURRENCIES)[number];

export const DISPLAY_CURRENCIES = ["usd", "eur", "sar", "egp"] as const;
export type DisplayCurrency = (typeof DISPLAY_CURRENCIES)[number];

export function isNativeVsCurrency(value: string): value is NativeVsCurrency {
  return (NATIVE_VS_CURRENCIES as readonly string[]).includes(value);
}

export function requestCurrencyOf(
  display: DisplayCurrency,
): Result<NativeVsCurrency, "egp-not-addressable" | "unsupported"> {
  if (isNativeVsCurrency(display)) {
    return ok(display);
  }
  if (display === "egp") {
    return ok("usd");
  }
  return err("unsupported");
}

export function isCrossRate(display: DisplayCurrency): boolean {
  return display === "egp";
}
