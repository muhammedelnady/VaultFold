/**
 * MarketScreen ViewModel.
 * Manages TanStack Query market data, local diacritic-insensitive search,
 * sorting, category filtering, focused 60s polling, rate-limit status, and cold-start fallback.
 */
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Decimal } from "decimal.js-light";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";

import { queryKeys, STALE_TIMES } from "@core/offline/query-keys";
import { evaluateAndDispatchAlerts } from "@core/use-cases/alert-evaluator";
import { convertUsdToEgp } from "@core/use-cases/currency-converter";
import { useAlertRepository, useConnectivity, useMarketRepository } from "@di/container";
import type { SupportedCurrency } from "@domain/currency/CurrencyTypes";
import type { MarketEntry, MarketSort } from "@domain/market/MarketEntry";
import { SAMPLE_MARKETS_SNAPSHOT } from "@domain/market/sample-snapshot";
import type { MarketStatusKind } from "@presentation/components/market/StatusChip";
import { useCurrencyStore } from "@stores/currencyStore";

function stripDiacritics(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export interface UseMarketViewModelOptions {
  readonly vsCurrency?: SupportedCurrency;
  readonly isFocused?: boolean;
}

export function useMarketViewModel({
  vsCurrency: vsCurrencyProp,
  isFocused = true,
}: UseMarketViewModelOptions = {}) {
  const marketRepo = useMarketRepository();
  const alertRepo = useAlertRepository();
  const connectivity = useConnectivity();
  const queryClient = useQueryClient();

  const storeCurrency = useCurrencyStore((s) => s.currency);
  const egpCrossRate = useCurrencyStore((s) => s.egpCrossRate);
  const selectedCurrency: SupportedCurrency = vsCurrencyProp ?? storeCurrency;
  const effectiveVsCurrency: "usd" | "eur" | "sar" =
    selectedCurrency === "egp" ? "usd" : selectedCurrency;

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [sortOption, setSortOption] = useState<MarketSort>("rank");
  const [appState, setAppState] = useState<AppStateStatus>("active");

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      setAppState(nextState);
    });
    return () => subscription.remove();
  }, []);

  const isOnline = connectivity.isOnline();
  const shouldPoll = isFocused && appState === "active" && isOnline;

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

  const query = useQuery({
    queryKey: queryKeys.markets(effectiveVsCurrency, selectedCategory ?? "all"),
    queryFn: async () => {
      return marketRepo.getMarkets(
        selectedCategory ? { category: selectedCategory } : undefined,
        sortOption,
        1,
        250,
        effectiveVsCurrency,
      );
    },
    staleTime: (q) =>
      (q.state.data as { kind?: string } | undefined)?.kind === "err" ? 0 : STALE_TIMES.markets,
    refetchInterval: shouldPoll ? 60_000 : false,
    refetchOnWindowFocus: true,
  });

  const queryResult = query.data;

  useEffect(() => {
    if (Boolean(alertRepo) && queryResult?.kind === "ok" && queryResult.value.items.length > 0) {
      const pricesMap: Record<string, string> = {};
      for (const item of queryResult.value.items) {
        pricesMap[item.id] = item.priceUsd;
      }
      void evaluateAndDispatchAlerts(alertRepo, pricesMap);
    }
  }, [queryResult, alertRepo]);

  const statusInfo = useMemo((): {
    kind: MarketStatusKind;
    lastUpdatedAt?: number;
    retryAfterSeconds?: number;
  } => {
    if (queryResult && queryResult.kind === "err") {
      if (queryResult.error.kind === "rate-limited") {
        const waitMs = queryResult.error.retryAfterMs ?? 60_000;
        return {
          kind: "rate_limited",
          lastUpdatedAt: query.dataUpdatedAt,
          retryAfterSeconds: Math.ceil(waitMs / 1000),
        };
      }
      if (!isOnline) {
        return { kind: "sample" };
      }
    }

    if (!isOnline) {
      if (queryResult && queryResult.kind === "ok" && queryResult.value.items.length > 0) {
        return { kind: "cached", lastUpdatedAt: query.dataUpdatedAt };
      }
      return { kind: "sample" };
    }

    if (query.isFetching) {
      return { kind: "cached", lastUpdatedAt: query.dataUpdatedAt };
    }

    if (queryResult && queryResult.kind === "ok") {
      return { kind: "live", lastUpdatedAt: query.dataUpdatedAt };
    }

    return { kind: "sample" };
  }, [queryResult, query.dataUpdatedAt, query.isFetching, isOnline]);

  const rawItems: readonly MarketEntry[] = useMemo(() => {
    if (queryResult && queryResult.kind === "ok" && queryResult.value.items.length > 0) {
      return queryResult.value.items;
    }
    return SAMPLE_MARKETS_SNAPSHOT;
  }, [queryResult]);

  const activeCrossRate =
    selectedCurrency === "egp" ? (egpCrossRate ?? exchangeRatesQuery.data) : null;

  const convertedItems = useMemo(() => {
    if (selectedCurrency !== "egp" || !activeCrossRate) {
      return rawItems;
    }
    const rate = activeCrossRate.rate;
    return rawItems.map((coin) => ({
      ...coin,
      priceUsd: convertUsdToEgp(coin.priceUsd, rate),
      marketCapUsd: convertUsdToEgp(coin.marketCapUsd, rate),
      volume24hUsd: convertUsdToEgp(coin.volume24hUsd, rate),
      sparkline7d: coin.sparkline7d.map((p) => {
        try {
          return new Decimal(p).times(new Decimal(rate)).toNumber();
        } catch {
          return p;
        }
      }),
    }));
  }, [rawItems, selectedCurrency, activeCrossRate]);

  const filteredAndSortedItems = useMemo(() => {
    let items = [...convertedItems];

    const normalizedQuery = stripDiacritics(searchQuery.trim());
    if (normalizedQuery) {
      items = items.filter((coin) => {
        const name = stripDiacritics(coin.name);
        const symbol = stripDiacritics(coin.symbol);
        return name.includes(normalizedQuery) || symbol.includes(normalizedQuery);
      });
    }

    items.sort((a, b) => {
      switch (sortOption) {
        case "rank":
          return a.rank - b.rank;
        case "price_24h_change":
          return new Decimal(b.priceChange24h).comparedTo(new Decimal(a.priceChange24h));
        case "market_cap":
          return new Decimal(b.marketCapUsd).comparedTo(new Decimal(a.marketCapUsd));
      }
    });

    return items;
  }, [convertedItems, searchQuery, sortOption]);

  const onRefresh = useCallback(async () => {
    const promises = [
      queryClient.refetchQueries({
        queryKey: queryKeys.markets(effectiveVsCurrency, selectedCategory ?? "all"),
      }),
    ];
    if (selectedCurrency === "egp") {
      promises.push(queryClient.refetchQueries({ queryKey: queryKeys.exchangeRates }));
    }
    await Promise.all(promises);
  }, [queryClient, effectiveVsCurrency, selectedCategory, selectedCurrency]);

  return {
    items: filteredAndSortedItems,
    isLoading: query.isLoading && !query.data,
    isRefreshing: query.isRefetching,
    statusInfo,
    searchQuery,
    setSearchQuery,
    sortOption,
    setSortOption,
    selectedCategory,
    setSelectedCategory,
    onRefresh,
    isSample: statusInfo.kind === "sample",
    selectedCurrency,
  };
}
