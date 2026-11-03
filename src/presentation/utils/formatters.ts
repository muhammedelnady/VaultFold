/**
 * Decimal-safe number and currency formatting.
 * Enforces LTR isolation on numbers/prices and accessible badges.
 */
import { Decimal } from "decimal.js-light";

const LTR_MARK = "\u200E";

export function formatCurrency(
  value: string | number,
  currency = "USD",
  locale = "en-US",
  isCrossRate = false,
): string {
  const prefix = isCrossRate ? "≈ " : "";
  try {
    const num = typeof value === "string" ? new Decimal(value).toNumber() : value;
    const decimals = Math.abs(num) < 1 && Math.abs(num) > 0 ? 4 : 2;
    const formatted = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
      maximumFractionDigits: decimals,
    }).format(num);

    return `${LTR_MARK}${prefix}${formatted}${LTR_MARK}`;
  } catch {
    return `${LTR_MARK}${prefix}${currency.toUpperCase()} ${value}${LTR_MARK}`;
  }
}

export function formatCompactNumber(
  value: string | number,
  currency = "USD",
  locale = "en-US",
  isCrossRate = false,
): string {
  const prefix = isCrossRate ? "≈ " : "";
  try {
    const num = typeof value === "string" ? new Decimal(value).toNumber() : value;
    const formatted = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency.toUpperCase(),
      notation: "compact",
      maximumFractionDigits: 2,
    }).format(num);

    return `${LTR_MARK}${prefix}${formatted}${LTR_MARK}`;
  } catch {
    return `${LTR_MARK}${prefix}${value}${LTR_MARK}`;
  }
}

export interface PercentChangeFormat {
  readonly formatted: string;
  readonly isPositive: boolean;
  readonly isNeutral: boolean;
  readonly arrow: string;
  readonly sign: string;
}

export function formatPercentChange(value: string | number): PercentChangeFormat {
  try {
    const dec = new Decimal(value);
    const num = dec.toNumber();
    if (dec.isZero()) {
      return {
        formatted: "0.00%",
        isPositive: false,
        isNeutral: true,
        arrow: "■",
        sign: "",
      };
    }
    const isPositive = dec.isPositive();
    const sign = isPositive ? "+" : "";
    const arrow = isPositive ? "▲" : "▼";
    const formatted = `${arrow} ${sign}${num.toFixed(2)}%`;

    return {
      formatted: `${LTR_MARK}${formatted}${LTR_MARK}`,
      isPositive,
      isNeutral: false,
      arrow,
      sign,
    };
  } catch {
    return {
      formatted: `${value}%`,
      isPositive: false,
      isNeutral: true,
      arrow: "■",
      sign: "",
    };
  }
}
