/**
 * Unit tests for portfolio aggregate calculation and PnL metrics.
 */

import { describe, expect, it } from "@jest/globals";
import * as fc from "fast-check";

import type { LedgerEntry } from "@domain/ledger/LedgerEntry";

import { calculatePortfolio } from "./PortfolioCalculation";

describe("calculatePortfolio", () => {
  it("computes weighted average cost basis and unrealized gain", () => {
    const entries: LedgerEntry[] = [
      {
        id: "1",
        type: "buy",
        coinId: "bitcoin",
        amount: "1.0",
        price: "50000",
        currency: "usd",
        timestamp: 1000,
      },
      {
        id: "2",
        type: "buy",
        coinId: "bitcoin",
        amount: "1.0",
        price: "70000",
        currency: "usd",
        timestamp: 2000,
      },
    ];

    const prices = { bitcoin: "65000" };
    const summary = calculatePortfolio(entries, prices);

    expect(summary.totalCostUsd).toBe("120000.00");
    expect(summary.totalValueUsd).toBe("130000.00");
    expect(summary.totalUnrealizedPlUsd).toBe("10000.00");
    expect(summary.totalPlPercent).toBe("8.33");

    const btc = summary.holdings[0]!;
    expect(btc.averageCostBasisUsd).toBe("60000.00");
    expect(btc.quantity).toBe("2");
    expect(btc.allocationPercent).toBe("100.00");
  });

  it("calculates realized profit and loss on partial sale", () => {
    const entries: LedgerEntry[] = [
      {
        id: "1",
        type: "buy",
        coinId: "bitcoin",
        amount: "2.0",
        price: "50000",
        currency: "usd",
        timestamp: 1000,
      },
      {
        id: "2",
        type: "sell",
        coinId: "bitcoin",
        amount: "1.0",
        price: "60000",
        currency: "usd",
        timestamp: 2000,
      },
    ];

    const prices = { bitcoin: "55000" };
    const summary = calculatePortfolio(entries, prices);

    expect(summary.totalRealizedPlUsd).toBe("10000.00");
    expect(summary.totalCostUsd).toBe("50000.00");
    expect(summary.totalValueUsd).toBe("55000.00");
    expect(summary.totalUnrealizedPlUsd).toBe("5000.00");
    expect(summary.totalPlUsd).toBe("15000.00");
  });

  it("handles selling when balance is zero or amount is zero and full liquidation", () => {
    const entries: LedgerEntry[] = [
      {
        id: "1",
        type: "sell",
        coinId: "bitcoin",
        amount: "1.0",
        price: "50000",
        currency: "usd",
        timestamp: 500,
      },
      {
        id: "2",
        type: "buy",
        coinId: "bitcoin",
        amount: "1.0",
        price: "50000",
        currency: "usd",
        timestamp: 1000,
      },
      {
        id: "3",
        type: "sell",
        coinId: "bitcoin",
        amount: "0",
        price: "50000",
        currency: "usd",
        timestamp: 1500,
      },
      {
        id: "4",
        type: "sell",
        coinId: "bitcoin",
        amount: "1.0",
        price: "60000",
        currency: "usd",
        timestamp: 2000,
      },
      {
        id: "5",
        type: "sell",
        coinId: "dogecoin",
        amount: "100",
        price: "0.10",
        currency: "usd",
        timestamp: 100,
      },
    ];

    const summary = calculatePortfolio(entries, { bitcoin: "60000" });
    expect(summary.totalRealizedPlUsd).toBe("10000.00");
    expect(summary.holdings[0]!.quantity).toBe("0");
    expect(summary.holdings[0]!.totalCostUsd).toBe("0.00");
  });

  it("uses fallback zero price when coin is missing from price map", () => {
    const entries: LedgerEntry[] = [
      {
        id: "1",
        type: "buy",
        coinId: "solana",
        amount: "5.0",
        price: "150",
        currency: "usd",
        timestamp: 1000,
      },
    ];

    const summary = calculatePortfolio(entries, {});
    expect(summary.totalCostUsd).toBe("750.00");
    expect(summary.totalValueUsd).toBe("0.00");
    expect(summary.holdings[0]!.currentPriceUsd).toBe("0");
  });

  it("calculates multi-asset allocation percentages accurately", () => {
    const entries: LedgerEntry[] = [
      {
        id: "1",
        type: "buy",
        coinId: "bitcoin",
        amount: "1.0",
        price: "75000",
        currency: "usd",
        timestamp: 1000,
      },
      {
        id: "2",
        type: "buy",
        coinId: "ethereum",
        amount: "10.0",
        price: "2500",
        currency: "usd",
        timestamp: 2000,
      },
    ];

    const prices = { bitcoin: "75000", ethereum: "2500" };
    const summary = calculatePortfolio(entries, prices);

    expect(summary.totalValueUsd).toBe("100000.00");
    const btc = summary.holdings.find((h) => h.coinId === "bitcoin")!;
    const eth = summary.holdings.find((h) => h.coinId === "ethereum")!;

    expect(btc.allocationPercent).toBe("75.00");
    expect(eth.allocationPercent).toBe("25.00");
  });
});

describe("Property Tests (fast-check) — balance invariants", () => {
  it("remaining coin quantity is always >= 0", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            type: fc.constantFrom<"buy" | "sell">("buy", "sell"),
            amount: fc.double({ min: 0.0001, max: 100, noNaN: true }),
            price: fc.double({ min: 1, max: 100000, noNaN: true }),
            timestamp: fc.integer({ min: 1000, max: 100000 }),
          }),
          { minLength: 1, maxLength: 30 },
        ),
        (rawEntries) => {
          const entries: LedgerEntry[] = rawEntries.map((e, idx) => ({
            id: `tx-${idx}`,
            coinId: "test-coin",
            type: e.type,
            amount: e.amount.toFixed(6),
            price: e.price.toFixed(2),
            currency: "usd",
            timestamp: e.timestamp,
          }));

          const summary = calculatePortfolio(entries, { "test-coin": "50000" });
          for (const holding of summary.holdings) {
            expect(Number(holding.quantity)).toBeGreaterThanOrEqual(0);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("append-only reconstructibility & determinism: independent entry sets yield identical calculations", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            amount: fc.double({ min: 0.01, max: 10, noNaN: true }),
            price: fc.double({ min: 100, max: 50000, noNaN: true }),
            timestamp: fc.integer({ min: 1, max: 10000 }),
          }),
          { minLength: 2, maxLength: 10 },
        ),
        (rawBuys) => {
          const entries: LedgerEntry[] = rawBuys.map((b, idx) => ({
            id: `btc-${idx}`,
            coinId: "bitcoin",
            type: "buy",
            amount: b.amount.toFixed(4),
            price: b.price.toFixed(2),
            currency: "usd",
            timestamp: b.timestamp,
          }));

          const summary1 = calculatePortfolio(entries, { bitcoin: "60000" });
          const summary2 = calculatePortfolio([...entries], { bitcoin: "60000" });

          expect(summary1.totalValueUsd).toBe(summary2.totalValueUsd);
          expect(summary1.totalCostUsd).toBe(summary2.totalCostUsd);
          expect(summary1.totalUnrealizedPlUsd).toBe(summary2.totalUnrealizedPlUsd);
        },
      ),
      { numRuns: 100 },
    );
  });
});
