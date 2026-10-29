/**
 * Unit tests for useCoinDetailViewModel.
 */
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { Pressable, Text, View } from "react-native";

import { overrideForTests } from "@di/container";
import type { CoinDetail } from "@domain/coin/CoinDetail";
import { ok } from "@domain/Result";
import { useCurrencyStore } from "@stores/currencyStore";

import { useCoinDetailViewModel } from "./coin-detail.viewmodel";

const mockCoin: CoinDetail = {
  id: "bitcoin",
  name: "Bitcoin",
  symbol: "btc",
  marketCapRank: 1,
  priceUsd: "68000.00",
  priceChange24h: "2.5",
  priceChange7d: "4.5",
  priceChange30d: "-1.2",
  priceChange1y: "120.0",
  high24h: "69000.00",
  low24h: "67000.00",
  marketCapUsd: "1350000000000",
  fullyDilutedUsd: "1420000000000",
  totalVolume24h: "32000000000",
  circulatingSupply: "19700000",
  totalSupply: "21000000",
  lastUpdated: 1700000000000,
};

function DetailViewModelHarness() {
  const vm = useCoinDetailViewModel({ coinId: "bitcoin" });
  return (
    <View testID="detail-vm-harness">
      <Text testID="coin-name">{vm.coin?.name ?? "none"}</Text>
      <Text testID="coin-price">{vm.coin?.priceUsd ?? "none"}</Text>
      <Text testID="chart-points-count">{String(vm.chartPoints.length)}</Text>
      <Text testID="chart-first-point-price">{String(vm.chartPoints[0]?.[1] ?? 0)}</Text>
      <Text testID="selected-range">{vm.selectedRange}</Text>
      <Text testID="is-watchlisted">{String(vm.isWatchlisted)}</Text>
      <Text testID="is-alert-open">{String(vm.isAlertSheetOpen)}</Text>
      <Pressable testID="btn-select-7d" onPress={() => vm.setSelectedRange("7d")} />
      <Pressable testID="btn-toggle-watchlist" onPress={() => void vm.onToggleWatchlist()} />
      <Pressable testID="btn-open-alert" onPress={() => vm.setAlertSheetOpen(true)} />
      <Pressable
        testID="btn-save-alert"
        onPress={() =>
          void vm.onSaveAlert({
            id: "a1",
            coinId: "bitcoin",
            direction: "above",
            targetPrice: "70000",
            currency: "usd",
            active: true,
            createdAt: 1,
            updatedAt: 1,
          })
        }
      />
    </View>
  );
}

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("useCoinDetailViewModel", () => {
  beforeEach(() => {
    useCurrencyStore.setState({ currency: "usd", egpCrossRate: null });
  });

  it("fetches coin detail and market chart, handles range switch and watchlist toggle", async () => {
    const mockUpsertAlert = jest.fn(async () => ok(undefined));
    const mockToggleWatch = jest.fn(async (_id: string) => ok(undefined));
    const mockEnqueue = jest.fn((_input: unknown) => ({ id: "outbox-1" }));

    overrideForTests({
      outboxEngine: {
        enqueue: mockEnqueue,
      } as never,
      coinRepository: {
        getCoinDetail: jest.fn(async () => ok(mockCoin)),
      },
      marketRepository: {
        getMarkets: jest.fn(async () => ok({ items: [], page: 1, hasMore: false, total: 0 })),
        getMarketChart: jest.fn(async () =>
          ok({
            prices: [
              [1700000000, 68000],
              [1700010000, 68500],
            ] as [number, number][],
            marketCaps: [],
            totalVolumes: [],
          }),
        ),
        getExchangeRates: jest.fn(async () =>
          ok({ rate: "50.0000", timestamp: 1, btcUsd: "1", btcEgp: "50" }),
        ),
      },
      alertRepository: {
        getAll: jest.fn(async () => ok([])),
        upsert: mockUpsertAlert,
        delete: jest.fn(async () => ok(undefined)),
      },
      ledgerRepository: {
        getAllEntries: jest.fn(async () => ok([])),
        appendEntry: jest.fn(async () => ok(undefined)),
        reviseEntry: jest.fn(async () => ok(undefined)),
        tombstoneEntry: jest.fn(async () => ok(undefined)),
        getWatchlist: jest.fn(async () => ok(["bitcoin"])),
        setWatchlist: jest.fn(async () => ok(undefined)),
        toggleWatch: mockToggleWatch,
      },
      connectivity: {
        isOnline: () => true,
      } as never,
    });

    const { getByTestId, findByText } = await renderWithClient(<DetailViewModelHarness />);

    await findByText("Bitcoin");
    expect(getByTestId("coin-name").props["children"]).toBe("Bitcoin");
    expect(getByTestId("chart-points-count").props["children"]).toBe("2");
    expect(getByTestId("is-watchlisted").props["children"]).toBe("true");

    await fireEvent.press(getByTestId("btn-select-7d"));
    await waitFor(() => {
      expect(getByTestId("selected-range").props["children"]).toBe("7d");
    });

    await fireEvent.press(getByTestId("btn-toggle-watchlist"));
    expect(mockToggleWatch).toHaveBeenCalledWith("bitcoin");
    expect(mockEnqueue).toHaveBeenCalledWith({
      type: "watch.toggle",
      entityKey: "bitcoin",
      payload: { coinId: "bitcoin", watching: false },
    });

    await fireEvent.press(getByTestId("btn-open-alert"));
    await waitFor(() => {
      expect(getByTestId("is-alert-open").props["children"]).toBe("true");
    });

    await fireEvent.press(getByTestId("btn-save-alert"));
    await waitFor(() => {
      expect(mockUpsertAlert).toHaveBeenCalled();
    });
    expect(mockEnqueue).toHaveBeenCalledWith({
      type: "alert.upsert",
      entityKey: "alert:bitcoin",
      payload: {
        id: "a1",
        coinId: "bitcoin",
        direction: "above",
        targetPrice: "70000",
        currency: "usd",
        active: true,
      },
    });
  });

  it("converts coin details and chart prices to EGP when currencyStore is set to egp", async () => {
    useCurrencyStore.setState({
      currency: "egp",
      egpCrossRate: null,
    });

    overrideForTests({
      coinRepository: {
        getCoinDetail: jest.fn(async () => ok(mockCoin)),
      },
      marketRepository: {
        getMarkets: jest.fn(async () => ok({ items: [], page: 1, hasMore: false, total: 0 })),
        getMarketChart: jest.fn(async () =>
          ok({
            prices: [
              [1700000000, 68000],
              [1700010000, 68500],
            ] as [number, number][],
            marketCaps: [],
            totalVolumes: [],
          }),
        ),
        getExchangeRates: jest.fn(async () =>
          ok({ rate: "50.0000", timestamp: 1, btcUsd: "1", btcEgp: "50" }),
        ),
      },
      alertRepository: {
        getAll: jest.fn(async () => ok([])),
        upsert: jest.fn(async () => ok(undefined)),
        delete: jest.fn(async () => ok(undefined)),
      },
      ledgerRepository: {
        getAllEntries: jest.fn(async () => ok([])),
        appendEntry: jest.fn(async () => ok(undefined)),
        reviseEntry: jest.fn(async () => ok(undefined)),
        tombstoneEntry: jest.fn(async () => ok(undefined)),
        getWatchlist: jest.fn(async () => ok([])),
        setWatchlist: jest.fn(async () => ok(undefined)),
        toggleWatch: jest.fn(async () => ok(undefined)),
      },
      connectivity: {
        isOnline: () => true,
      } as never,
    });

    const { getByTestId, findByText } = await renderWithClient(<DetailViewModelHarness />);

    await findByText("Bitcoin");
    expect(getByTestId("coin-price").props["children"]).toBe("3400000.00");
    expect(getByTestId("chart-first-point-price").props["children"]).toBe("3400000");
  });

  it("enqueues watch.toggle using boolean returned by toggleWatchlist", async () => {
    const mockToggleWatchlist = jest.fn(async (_id: string) => ok(true));
    const mockEnqueue = jest.fn((_input: unknown) => ({ id: "outbox-1" }));

    overrideForTests({
      outboxEngine: {
        enqueue: mockEnqueue,
      } as never,
      coinRepository: {
        getCoinDetail: jest.fn(async () => ok(mockCoin)),
      },
      marketRepository: {
        getMarkets: jest.fn(async () => ok({ items: [], page: 1, hasMore: false, total: 0 })),
        getMarketChart: jest.fn(async () => ok({ prices: [], marketCaps: [], totalVolumes: [] })),
        getExchangeRates: jest.fn(async () =>
          ok({ rate: "50.0000", timestamp: 1, btcUsd: "1", btcEgp: "50" }),
        ),
      },
      alertRepository: {
        getAll: jest.fn(async () => ok([])),
        upsert: jest.fn(async () => ok(undefined)),
        delete: jest.fn(async () => ok(undefined)),
      },
      ledgerRepository: {
        getAllEntries: jest.fn(async () => ok([])),
        appendEntry: jest.fn(async () => ok(undefined)),
        reviseEntry: jest.fn(async () => ok(undefined)),
        tombstoneEntry: jest.fn(async () => ok(undefined)),
        getWatchlist: jest.fn(async () => ok([])),
        setWatchlist: jest.fn(async () => ok(undefined)),
        toggleWatch: jest.fn(async () => ok(undefined)),
        toggleWatchlist: mockToggleWatchlist,
      } as never,
      connectivity: {
        isOnline: () => true,
      } as never,
    });

    const { getByTestId, findByText } = await renderWithClient(<DetailViewModelHarness />);
    await findByText("Bitcoin");
    await fireEvent.press(getByTestId("btn-toggle-watchlist"));
    expect(mockToggleWatchlist).toHaveBeenCalledWith("bitcoin");
    expect(mockEnqueue).toHaveBeenCalledWith({
      type: "watch.toggle",
      entityKey: "bitcoin",
      payload: { coinId: "bitcoin", watching: true },
    });
  });
});
