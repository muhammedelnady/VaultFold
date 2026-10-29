/**
 * Portfolio Screen ViewModel.
 * Orchestrates ledger entries, real-time prices, portfolio calculations, outbox mutations, and biometric lock.
 */
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";

import { queryKeys, STALE_TIMES } from "@core/offline/query-keys";
import { convertUsdToEgp } from "@core/use-cases/currency-converter";
import { useLedgerRepository, useMarketRepository, useOutboxEngine } from "@di/container";
import type { LedgerEntry } from "@domain/ledger/LedgerEntry";
import { calculatePortfolio, type PortfolioSummary } from "@domain/portfolio/PortfolioCalculation";
import { useCurrencyStore } from "@stores/currencyStore";
import { useVaultAuthStore } from "@stores/vaultAuthStore";

export function usePortfolioViewModel() {
  const queryClient = useQueryClient();
  const ledgerRepo = useLedgerRepository();
  const marketRepo = useMarketRepository();
  const outbox = useOutboxEngine();

  const isLocked = useVaultAuthStore((s) => s.isLocked);
  const isDemoMode = useVaultAuthStore((s) => s.isDemoMode);

  const selectedCurrency = useCurrencyStore((s) => s.currency);
  const egpCrossRate = useCurrencyStore((s) => s.egpCrossRate);
  const effectiveVsCurrency: "usd" | "eur" | "sar" =
    selectedCurrency === "egp" ? "usd" : selectedCurrency;

  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [isOutboxOpen, setIsOutboxOpen] = useState(false);
  const [selectedCoinForTx, setSelectedCoinForTx] = useState<string | undefined>(undefined);

  const exchangeRatesQuery = useQuery({
    queryKey: queryKeys.exchangeRates,
    queryFn: async () => {
      if (!marketRepo.getExchangeRates) {
        return null;
      }
      const res = await marketRepo.getExchangeRates();
      if (res.kind === "ok") {
        useCurrencyStore.getState().setEgpCrossRate(res.value);
        return res.value;
      }
      return null;
    },
    enabled: selectedCurrency === "egp",
    staleTime: STALE_TIMES.exchangeRates,
  });

  const activeCrossRate =
    selectedCurrency === "egp" ? (egpCrossRate ?? exchangeRatesQuery.data) : null;

  const ledgerQuery = useQuery({
    queryKey: queryKeys.ledger.all,
    queryFn: async () => {
      const res = await ledgerRepo.getAllEntries();
      if (res.kind === "ok") return res.value;
      return [];
    },
    enabled: !isLocked || isDemoMode,
  });

  const marketQuery = useQuery({
    queryKey: queryKeys.market.list(effectiveVsCurrency, 1, 100),
    queryFn: async () => {
      const res = await marketRepo.getMarkets(undefined, undefined, 1, 100, effectiveVsCurrency);
      if (res.kind === "ok") return res.value.items;
      return [];
    },
  });

  const pricesMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (marketQuery.data) {
      for (const coin of marketQuery.data) {
        map[coin.id] = coin.priceUsd;
      }
    }
    return map;
  }, [marketQuery.data]);

  const rawSummary: PortfolioSummary = useMemo(() => {
    const entries = ledgerQuery.data ?? [];
    return calculatePortfolio(entries, pricesMap);
  }, [ledgerQuery.data, pricesMap]);

  const summary: PortfolioSummary = useMemo(() => {
    if (selectedCurrency !== "egp" || !activeCrossRate) {
      return rawSummary;
    }
    const rate = activeCrossRate.rate;
    const convertedHoldings = rawSummary.holdings.map((h) => ({
      ...h,
      averageCostBasisUsd: convertUsdToEgp(h.averageCostBasisUsd, rate),
      totalCostUsd: convertUsdToEgp(h.totalCostUsd, rate),
      currentPriceUsd: convertUsdToEgp(h.currentPriceUsd, rate),
      currentValueUsd: convertUsdToEgp(h.currentValueUsd, rate),
      unrealizedPlUsd: convertUsdToEgp(h.unrealizedPlUsd, rate),
      realizedPlUsd: convertUsdToEgp(h.realizedPlUsd, rate),
    }));

    return {
      totalValueUsd: convertUsdToEgp(rawSummary.totalValueUsd, rate),
      totalCostUsd: convertUsdToEgp(rawSummary.totalCostUsd, rate),
      totalRealizedPlUsd: convertUsdToEgp(rawSummary.totalRealizedPlUsd, rate),
      totalUnrealizedPlUsd: convertUsdToEgp(rawSummary.totalUnrealizedPlUsd, rate),
      totalPlUsd: convertUsdToEgp(rawSummary.totalPlUsd, rate),
      totalPlPercent: rawSummary.totalPlPercent,
      holdings: convertedHoldings,
    };
  }, [rawSummary, selectedCurrency, activeCrossRate]);

  const onAddTransaction = useCallback(
    async (entry: LedgerEntry) => {
      await ledgerRepo.appendEntry(entry);

      outbox.enqueue({
        type: "tx.add",
        entityKey: entry.coinId,
        payload: {
          id: entry.id,
          coinId: entry.coinId,
          side: entry.type === "buy" ? "buy" : "sell",
          quantity: entry.amount,
          unitPrice: entry.price,
          fee: entry.fee ?? "0",
          fiatCurrency: "usd",
          at: entry.timestamp,
          note: entry.note,
          revision: 0,
        },
      });

      await queryClient.invalidateQueries({ queryKey: queryKeys.ledger.all });
    },
    [ledgerRepo, outbox, queryClient],
  );

  const onDeleteTransaction = useCallback(
    async (id: string, coinId: string) => {
      await ledgerRepo.tombstoneEntry(id);

      outbox.enqueue({
        type: "tx.delete",
        entityKey: coinId,
        payload: {
          id,
          deletedAt: Date.now(),
        },
      });

      await queryClient.invalidateQueries({ queryKey: queryKeys.ledger.all });
    },
    [ledgerRepo, outbox, queryClient],
  );

  const onRefresh = useCallback(async () => {
    const promises: Promise<unknown>[] = [ledgerQuery.refetch(), marketQuery.refetch()];
    if (selectedCurrency === "egp") {
      promises.push(queryClient.refetchQueries({ queryKey: queryKeys.exchangeRates }));
    }
    await Promise.all(promises);
  }, [ledgerQuery, marketQuery, queryClient, selectedCurrency]);

  return {
    isLocked,
    isDemoMode,
    summary,
    entries: ledgerQuery.data ?? [],
    isLoading: ledgerQuery.isLoading || marketQuery.isLoading,
    isAddTxOpen,
    setIsAddTxOpen,
    isOutboxOpen,
    setIsOutboxOpen,
    selectedCoinForTx,
    setSelectedCoinForTx,
    onAddTransaction,
    onDeleteTransaction,
    onRefresh,
    currency: selectedCurrency,
  };
}
