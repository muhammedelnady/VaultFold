/**
 * Unit tests for number and currency formatters.
 */
import { describe, expect, it } from "@jest/globals";

import { formatCompactNumber, formatCurrency, formatPercentChange } from "./formatters";

describe("formatCurrency", () => {
  it("formats positive USD price with LTR mark", () => {
    const formatted = formatCurrency("64123.50", "USD");
    expect(formatted).toContain("64,123.50");
    expect(formatted.startsWith("\u200E")).toBe(true);
    expect(formatted.endsWith("\u200E")).toBe(true);
  });

  it("formats sub-dollar tokens with 4 decimal places", () => {
    const formatted = formatCurrency("0.0543", "USD");
    expect(formatted).toContain("0.0543");

    const eur = formatCurrency("100.50", "EUR");
    expect(eur).toContain("100.50");

    const sar = formatCurrency("500", "SAR");
    expect(sar).toContain("500");

    const egp = formatCurrency("250", "EGP");
    expect(egp).toContain("250");
  });

  it("formats numeric input directly", () => {
    const formatted = formatCurrency(500.25, "USD");
    expect(formatted).toContain("500.25");
  });

  it("formats with default currency USD when omitted", () => {
    const formatted = formatCurrency("100");
    expect(formatted).toContain("100.00");

    const compact = formatCompactNumber("1000000");
    expect(compact).toMatch(/1(\.00?)?M/i);
  });

  it("prefixes with approximation symbol when isCrossRate is true", () => {
    const formatted = formatCurrency("123.45", "EGP", "en-US", true);
    expect(formatted).toContain("≈");
    expect(formatted).toContain("123.45");

    const compact = formatCompactNumber("1000000", "EGP", "en-US", true);
    expect(compact).toContain("≈");
  });

  it("handles fallback on error gracefully", () => {
    const formatted = formatCurrency("invalid", "XYZ");
    expect(formatted).toContain("XYZ invalid");
  });
});

describe("formatCompactNumber", () => {
  it("formats billions and trillions in compact notation", () => {
    const b = formatCompactNumber("1200000000", "USD");
    expect(b).toMatch(/1\.20?B/i);

    const t = formatCompactNumber("1500000000000", "USD");
    expect(t).toMatch(/1\.50?T/i);
  });

  it("formats numeric value directly", () => {
    const formatted = formatCompactNumber(5000000, "USD");
    expect(formatted).toMatch(/5(\.00?)?M/i);
  });

  it("handles error in formatCompactNumber gracefully", () => {
    const fallback = formatCompactNumber("not-a-number", "USD");
    expect(fallback).toContain("not-a-number");
  });
});

describe("formatPercentChange", () => {
  it("formats zero percent change as neutral with square indicator", () => {
    const res = formatPercentChange("0.00");
    expect(res.isNeutral).toBe(true);
    expect(res.isPositive).toBe(false);
    expect(res.arrow).toBe("■");
    expect(res.formatted).toBe("0.00%");
  });

  it("handles invalid number gracefully in formatPercentChange", () => {
    const res = formatPercentChange("invalid");
    expect(res.isNeutral).toBe(true);
    expect(res.arrow).toBe("■");
    expect(res.formatted).toBe("invalid%");
  });

  it("includes + sign and upward arrow for positive change", () => {
    const res = formatPercentChange("5.42");
    expect(res.isPositive).toBe(true);
    expect(res.arrow).toBe("▲");
    expect(res.sign).toBe("+");
    expect(res.formatted).toContain("▲ +5.42%");
  });

  it("includes downward arrow for negative change", () => {
    const res = formatPercentChange("-3.18");
    expect(res.isPositive).toBe(false);
    expect(res.isNeutral).toBe(false);
    expect(res.arrow).toBe("▼");
    expect(res.sign).toBe("");
    expect(res.formatted).toContain("▼ -3.18%");
  });

  it("handles zero change as neutral", () => {
    const res = formatPercentChange("0.00");
    expect(res.isNeutral).toBe(true);
    expect(res.formatted).toBe("0.00%");
  });
});
