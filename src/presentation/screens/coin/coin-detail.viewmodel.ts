/**
 * CoinDetail ViewModel.
 * Manages coin detail data, interactive market charts with range switching,
 * offline range detection, price alert creation, and multi-currency/EGP cross-rate conversion.
 */
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Decimal } from "decimal.js-light";
import { useCallback, useMemo, useState } from "react";

import { chartStaleTime, queryKeys, STALE_TIMES } from "@core/offline/query-keys";
import { convertUsdToEgp } from "@core/use-cases/currency-converter";
import {
  useAlertRepository,
  useCoinRepository,
  useConnectivity,
  useLedgerRepository,
  useMarketRepository,
  useOutboxEngine,
} from "@di/container";
import type { PriceAlert } from "@domain/alert/PriceAlert";
import type { CoinDetail } from "@domain/coin/CoinDetail";
import type { SupportedCurrency } from "@domain/currency/CurrencyTypes";
import {
  CHART_RANGES,
  RANGE_DAYS_MAP,
  type ChartRange,
} from "@presentation/components/coin/RangeSelector";
import { useCurrencyStore } from "@stores/currencyStore";

export interface UseCoinDetailViewModelOptions {
  readonly coinId: string;
  readonly vsCurrency?: string;
}

export function useCoinDetailViewModel({
  coinId,
  vsCurrency: vsCurrencyProp,
}: UseCoinDetailViewModelOptions) {
  const coinRepo = useCoinRepository();
  const marketRepo = useMarketRepository();
  const alertRepo = useAlertRepository();
  const ledgerRepo = useLedgerRepository();
  const outbox = useOutboxEngine();
  const connectivity = useConnectivity();
  const queryClient = useQueryClient();

  const storeCurrency = useCurrencyStore((s) => s.currency);
  const egpCrossRate = useCurrencyStore((s) => s.egpCrossRate);
  const selectedCurrency: SupportedCurrency =
    (vsCurrencyProp?.toLowerCase() as SupportedCurrency | undefined) ?? storeCurrency;
  const effectiveVsCurrency: "usd" | "eur" | "sar" =
    selectedCurrency === "egp" ? "usd" : (selectedCurrency as "usd" | "eur" | "sar");

  const [selectedRange, setSelectedRange] = useState<ChartRange>("24h");
  const [isAlertSheetOpen, setAlertSheetOpen] = useState(false);

  const isOnline = connectivity.isOnline();

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

  const detailQuery = useQuery({
    queryKey: queryKeys.coinDetail(coinId),
    queryFn: async () => {
      const res = await coinRepo.getCoinDetail(coinId);
      return res;
    },
    staleTime: (q) =>
      (q.state.data as { kind?: string } | undefined)?.kind === "err" ? 0 : STALE_TIMES.coinStats,
  });

  const chartQuery = useQuery({
    queryKey: queryKeys.marketChart(coinId, RANGE_DAYS_MAP[selectedRange], effectiveVsCurrency),
    queryFn: async () => {
      const days = RANGE_DAYS_MAP[selectedRange];
      const res = await marketRepo.getMarketChart(coinId, days, effectiveVsCurrency);
      return res;
    },
    staleTime: (q) =>
      (q.state.data as { kind?: string } | undefined)?.kind === "err"
        ? 0
        : chartStaleTime(RANGE_DAYS_MAP[selectedRange]),
  });

  const watchlistQuery = useQuery({
    queryKey: queryKeys.watchlist,
    queryFn: async () => {
      const res = await ledgerRepo.getWatchlist();
      return res;
    },
  });

  const availableOfflineRanges = useMemo(() => {
    return CHART_RANGES.filter((range) => {
      const days = RANGE_DAYS_MAP[range];
      const cached = queryClient.getQueryData(
        queryKeys.marketChart(coinId, days, effectiveVsCurrency),
      );
      return Boolean(cached);
    });
  }, [queryClient, coinId, effectiveVsCurrency]);

  const onSelectRange = useCallback((range: ChartRange) => {
    setSelectedRange(range);
  }, []);

  const isWatchlisted = useMemo(() => {
    if (watchlistQuery.data && watchlistQuery.data.kind === "ok") {
      return watchlistQuery.data.value.includes(coinId);
    }
    return false;
  }, [watchlistQuery.data, coinId]);

  const onSaveAlert = useCallback(
    async (alert: PriceAlert) => {
      await alertRepo.upsert(alert);
      outbox.enqueue({
        type: "alert.upsert",
        entityKey: `alert:${alert.coinId}`,
        payload: {
          id: alert.id,
          coinId: alert.coinId,
          direction: alert.direction,
          targetPrice: alert.targetPrice,
          currency: "usd",
          active: alert.active,
        },
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.alerts.all });
    },
    [alertRepo, outbox, queryClient],
  );

  const onToggleWatchlist = useCallback(async () => {
    const res = ledgerRepo.toggleWatchlist
      ? await ledgerRepo.toggleWatchlist(coinId)
      : await ledgerRepo.toggleWatch(coinId);
    if (res.kind === "ok") {
      const watching = typeof res.value === "boolean" ? res.value : !isWatchlisted;
      outbox.enqueue({
        type: "watch.toggle",
        entityKey: coinId,
        payload: { coinId, watching },
      });
    }
    await queryClient.invalidateQueries({ queryKey: queryKeys.watchlist });
  }, [ledgerRepo, coinId, isWatchlisted, outbox, queryClient]);

  const activeCrossRate =
    selectedCurrency === "egp" ? (egpCrossRate ?? exchangeRatesQuery.data) : null;

  const rawCoin: CoinDetail | null = useMemo(() => {
    if (detailQuery.data && detailQuery.data.kind === "ok") {
      return detailQuery.data.value;
    }
    return null;
  }, [detailQuery.data]);

  const coin: CoinDetail | null = useMemo(() => {
    if (!rawCoin) {
      return null;
    }
    if (selectedCurrency !== "egp" || !activeCrossRate) {
      return rawCoin;
    }
    const rate = activeCrossRate.rate;
    return {
      ...rawCoin,
      priceUsd: convertUsdToEgp(rawCoin.priceUsd, rate),
      high24h: convertUsdToEgp(rawCoin.high24h, rate),
      low24h: convertUsdToEgp(rawCoin.low24h, rate),
      marketCapUsd: convertUsdToEgp(rawCoin.marketCapUsd, rate),
      fullyDilutedUsd: convertUsdToEgp(rawCoin.fullyDilutedUsd, rate),
      totalVolume24h: convertUsdToEgp(rawCoin.totalVolume24h, rate),
    };
  }, [rawCoin, selectedCurrency, activeCrossRate]);

  const rawChartPoints: readonly [number, number][] = useMemo(() => {
    if (chartQuery.data && chartQuery.data.kind === "ok") {
      return chartQuery.data.value.prices;
    }
    return [];
  }, [chartQuery.data]);

  const chartPoints: readonly [number, number][] = useMemo(() => {
    if (selectedCurrency !== "egp" || !activeCrossRate) {
      return rawChartPoints;
    }
    const rate = activeCrossRate.rate;
    return rawChartPoints.map((p) => {
      try {
        const converted = new Decimal(p[1]).times(new Decimal(rate)).toNumber();
        return [p[0], converted];
      } catch {
        return p;
      }
    });
  }, [rawChartPoints, selectedCurrency, activeCrossRate]);

  const isChartUnavailableOffline = !isOnline && !availableOfflineRanges.includes(selectedRange);

  return {
    coin,
    chartPoints,
    isLoading: detailQuery.isLoading || chartQuery.isLoading,
    isOnline,
    selectedRange,
    setSelectedRange: onSelectRange,
    availableOfflineRanges,
    isChartUnavailableOffline,
    isAlertSheetOpen,
    setAlertSheetOpen,
    onSaveAlert,
    isWatchlisted,
    onToggleWatchlist,
    selectedCurrency,
  };
}
