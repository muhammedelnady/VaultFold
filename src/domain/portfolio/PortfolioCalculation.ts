/**
 * Pure Domain Portfolio Calculation & Ledger Reconstruction.
 * Strictly uses decimal.js-light for all quantities, prices, cost basis, and P/L.
 * Zero JavaScript floating-point arithmetic.
 */
import { Decimal } from "decimal.js-light";

import type { LedgerEntry } from "@domain/ledger/LedgerEntry";

export interface CoinHolding {
  readonly coinId: string;
  readonly quantity: string;
  readonly averageCostBasisUsd: string;
  readonly totalCostUsd: string;
  readonly currentPriceUsd: string;
  readonly currentValueUsd: string;
  readonly unrealizedPlUsd: string;
  readonly unrealizedPlPercent: string;
  readonly realizedPlUsd: string;
  readonly allocationPercent: string;
}

export interface PortfolioSummary {
  readonly totalValueUsd: string;
  readonly totalCostUsd: string;
  readonly totalRealizedPlUsd: string;
  readonly totalUnrealizedPlUsd: string;
  readonly totalPlUsd: string;
  readonly totalPlPercent: string;
  readonly holdings: readonly CoinHolding[];
}

export function reconstructActiveLedgerEntries(
  entries: readonly LedgerEntry[],
): readonly LedgerEntry[] {
  const activeMap = new Map<string, LedgerEntry>();

  for (const entry of entries) {
    if (entry.prevId) {
      activeMap.delete(entry.prevId);
    }
    if (entry.type !== "tombstone") {
      activeMap.set(entry.id, entry);
    }
  }

  return Array.from(activeMap.values());
}

export function calculatePortfolio(
  entries: readonly LedgerEntry[],
  currentPricesUsd: Record<string, string>,
): PortfolioSummary {
  const activeEntries = reconstructActiveLedgerEntries(entries);

  const entriesByCoin = new Map<string, LedgerEntry[]>();
  for (const entry of activeEntries) {
    const list = entriesByCoin.get(entry.coinId) ?? [];
    list.push(entry);
    entriesByCoin.set(entry.coinId, list);
  }

  const rawHoldings: {
    coinId: string;
    quantity: Decimal;
    totalCost: Decimal;
    realizedPl: Decimal;
    currentPrice: Decimal;
    currentValue: Decimal;
  }[] = [];

  let grandTotalValue = new Decimal(0);
  let grandTotalCost = new Decimal(0);
  let grandTotalRealizedPl = new Decimal(0);

  for (const [coinId, coinEntries] of entriesByCoin.entries()) {
    const sorted = [...coinEntries].sort((a, b) => a.timestamp - b.timestamp);

    let quantity = new Decimal(0);
    let totalCost = new Decimal(0);
    let realizedPl = new Decimal(0);

    for (const entry of sorted) {
      const amount = new Decimal(entry.amount);
      const price = new Decimal(entry.price);
      const fee = new Decimal(entry.fee ?? "0");

      if (entry.type === "buy") {
        quantity = quantity.plus(amount);
        const cost = amount.times(price).plus(fee);
        totalCost = totalCost.plus(cost);
      } else {
        if (quantity.isZero() || amount.isZero()) continue;

        const sellAmount = amount.lessThan(quantity) ? amount : quantity;
        const avgCost = totalCost.dividedBy(quantity);
        const costOfSold = avgCost.times(sellAmount);
        const proceeds = sellAmount.times(price).minus(fee);
        const gain = proceeds.minus(costOfSold);

        realizedPl = realizedPl.plus(gain);
        quantity = quantity.minus(sellAmount);
        totalCost = totalCost.minus(costOfSold);

        if (quantity.isZero()) {
          totalCost = new Decimal(0);
        }
      }
    }

    if (!quantity.isZero() || !realizedPl.isZero()) {
      const priceStr = currentPricesUsd[coinId] ?? "0";
      const currentPrice = new Decimal(priceStr);
      const currentValue = quantity.times(currentPrice);

      rawHoldings.push({
        coinId,
        quantity,
        totalCost,
        realizedPl,
        currentPrice,
        currentValue,
      });

      grandTotalValue = grandTotalValue.plus(currentValue);
      grandTotalCost = grandTotalCost.plus(totalCost);
      grandTotalRealizedPl = grandTotalRealizedPl.plus(realizedPl);
    }
  }

  const holdings: CoinHolding[] = rawHoldings.map((h) => {
    const unrealizedPl = h.currentValue.minus(h.totalCost);
    const unrealizedPlPercent = h.totalCost.isZero()
      ? "0.00"
      : unrealizedPl.dividedBy(h.totalCost).times(100).toFixed(2);

    const avgCostBasis = h.quantity.isZero()
      ? "0.00"
      : h.totalCost.dividedBy(h.quantity).toFixed(2);

    const allocation = grandTotalValue.isZero()
      ? "0.00"
      : h.currentValue.dividedBy(grandTotalValue).times(100).toFixed(2);

    return {
      coinId: h.coinId,
      quantity: h.quantity.toString(),
      averageCostBasisUsd: avgCostBasis,
      totalCostUsd: h.totalCost.toFixed(2),
      currentPriceUsd: h.currentPrice.toString(),
      currentValueUsd: h.currentValue.toFixed(2),
      unrealizedPlUsd: unrealizedPl.toFixed(2),
      unrealizedPlPercent,
      realizedPlUsd: h.realizedPl.toFixed(2),
      allocationPercent: allocation,
    };
  });

  const grandTotalUnrealizedPl = grandTotalValue.minus(grandTotalCost);
  const grandTotalPl = grandTotalRealizedPl.plus(grandTotalUnrealizedPl);
  const grandTotalPlPercent = grandTotalCost.isZero()
    ? "0.00"
    : grandTotalPl.dividedBy(grandTotalCost).times(100).toFixed(2);

  return {
    totalValueUsd: grandTotalValue.toFixed(2),
    totalCostUsd: grandTotalCost.toFixed(2),
    totalRealizedPlUsd: grandTotalRealizedPl.toFixed(2),
    totalUnrealizedPlUsd: grandTotalUnrealizedPl.toFixed(2),
    totalPlUsd: grandTotalPl.toFixed(2),
    totalPlPercent: grandTotalPlPercent,
    holdings,
  };
}
