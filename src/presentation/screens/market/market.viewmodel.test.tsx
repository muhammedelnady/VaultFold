/**
 * Unit tests for useMarketViewModel.
 */
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { Pressable, Text, View } from "react-native";

import { overrideForTests } from "@di/container";
import type { PriceAlert } from "@domain/alert/PriceAlert";
import type { MarketPage } from "@domain/market/MarketEntry";
import type { MarketRepository } from "@domain/market/MarketRepository";
import { err, ok } from "@domain/Result";
import { useCurrencyStore } from "@stores/currencyStore";

import { useMarketViewModel } from "./market.viewmodel";

const mockMarkets: MarketPage = {
  items: [
    {
      id: "bitcoin",
      name: "Bitcoin",
      symbol: "btc",
      rank: 1,
      priceUsd: "68000.00",
      priceChange24h: "2.5",
      marketCapUsd: "1300000000000",
      volume24hUsd: "30000000000",
      sparkline7d: [66000, 67000, 68000],
    },
    {
      id: "ethereum",
      name: "Ethereum",
      symbol: "eth",
      rank: 2,
      priceUsd: "3500.00",
      priceChange24h: "-1.2",
      marketCapUsd: "420000000000",
      volume24hUsd: "15000000000",
      sparkline7d: [3400, 3450, 3500],
    },
  ],
  page: 1,
  hasMore: false,
  total: 2,
};

function createMockMarketRepo(overrides: Partial<MarketRepository> = {}): MarketRepository {
  return {
    getMarkets: jest.fn(async () => ok(mockMarkets)),
    getMarketChart: jest.fn(async () => ok({ prices: [], marketCaps: [], totalVolumes: [] })),
    getExchangeRates: jest.fn(async () =>
      ok({ rate: "50.0000", timestamp: 1, btcUsd: "1", btcEgp: "50" }),
    ),
    ...overrides,
  };
}

function ViewModelHarness() {
  const vm = useMarketViewModel({ isFocused: true });
  return (
    <View testID="vm-harness">
      <Text testID="vm-items-count">{String(vm.items.length)}</Text>
      <Text testID="vm-status-kind">{vm.statusInfo.kind}</Text>
      <Text testID="vm-is-sample">{String(vm.isSample)}</Text>
      <Text testID="vm-selected-category">{vm.selectedCategory ?? "none"}</Text>
      <Text testID="vm-sort">{vm.sortOption}</Text>
      <Text testID="vm-first-coin">{vm.items[0]?.symbol ?? "none"}</Text>
      <Text testID="vm-first-price">{vm.items[0]?.priceUsd ?? "none"}</Text>
      <Pressable testID="btn-sort-mcap" onPress={() => vm.setSortOption("market_cap")} />
      <Pressable testID="btn-sort-change" onPress={() => vm.setSortOption("price_24h_change")} />
      <Pressable testID="btn-category" onPress={() => vm.setSelectedCategory("layer-1")} />
      <Pressable testID="btn-search" onPress={() => vm.setSearchQuery("eth")} />
      <Pressable testID="btn-refresh" onPress={() => void vm.onRefresh()} />
    </View>
  );
}

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("useMarketViewModel", () => {
  beforeEach(() => {
    useCurrencyStore.setState({ currency: "usd", egpCrossRate: null });
    overrideForTests({
      alertRepository: {
        getAll: jest.fn(async () => ok([])),
        upsert: jest.fn(async () => ok(undefined)),
        delete: jest.fn(async () => ok(undefined)),
      },
    });
  });

  it("provides live markets and handles search and sorting", async () => {
    overrideForTests({
      marketRepository: createMockMarketRepo(),
      connectivity: { isOnline: () => true } as never,
    });

    const { getByTestId } = await renderWithClient(<ViewModelHarness />);

    await waitFor(() => {
      expect(getByTestId("vm-status-kind").props["children"]).toBe("live");
    });
    expect(getByTestId("vm-items-count").props["children"]).toBe("2");

    fireEvent.press(getByTestId("btn-sort-mcap"));
    await waitFor(() => {
      expect(getByTestId("vm-sort").props["children"]).toBe("market_cap");
    });

    fireEvent.press(getByTestId("btn-sort-change"));
    await waitFor(() => {
      expect(getByTestId("vm-sort").props["children"]).toBe("price_24h_change");
    });

    fireEvent.press(getByTestId("btn-category"));
    await waitFor(() => {
      expect(getByTestId("vm-selected-category").props["children"]).toBe("layer-1");
    });

    fireEvent.press(getByTestId("btn-search"));
    await waitFor(() => {
      expect(getByTestId("vm-items-count").props["children"]).toBe("1");
      expect(getByTestId("vm-first-coin").props["children"]).toBe("eth");
    });

    fireEvent.press(getByTestId("btn-refresh"));
  });

  it("handles offline cold-start fallback to sample snapshot", async () => {
    overrideForTests({
      marketRepository: createMockMarketRepo({
        getMarkets: jest.fn(async () => err({ kind: "offline" as const, message: "Offline" })),
      }),
      connectivity: { isOnline: () => false } as never,
    });

    const { getByTestId, findByText } = await renderWithClient(<ViewModelHarness />);

    await findByText("sample");
    expect(getByTestId("vm-is-sample").props["children"]).toBe("true");
    expect(Number(getByTestId("vm-items-count").props["children"])).toBeGreaterThan(0);
  });

  it("handles rate-limited error with retry after timing", async () => {
    overrideForTests({
      marketRepository: createMockMarketRepo({
        getMarkets: jest.fn(async () =>
          err({
            kind: "rate-limited" as const,
            message: "Rate limited",
            retryAfterMs: 45_000,
          }),
        ),
      }),
      connectivity: { isOnline: () => true } as never,
    });

    const { findByText } = await renderWithClient(<ViewModelHarness />);
    await findByText("rate_limited");
  });

  it("handles offline with cached query data yielding 'cached' status", async () => {
    overrideForTests({
      marketRepository: createMockMarketRepo(),
      connectivity: { isOnline: () => false } as never,
    });

    const { findByText } = await renderWithClient(<ViewModelHarness />);
    await findByText("cached");
  });

  it("handles offline with query error yielding 'sample' status", async () => {
    overrideForTests({
      marketRepository: createMockMarketRepo({
        getMarkets: jest.fn(async () =>
          err({ kind: "http" as const, status: 500, message: "Server Error" }),
        ),
      }),
      connectivity: { isOnline: () => false } as never,
    });

    const { findByText } = await renderWithClient(<ViewModelHarness />);
    await findByText("sample");
  });

  it("requests markets in EUR when currencyStore is set to eur", async () => {
    useCurrencyStore.setState({ currency: "eur", egpCrossRate: null });
    const getMarketsMock = jest.fn<MarketRepository["getMarkets"]>(async () => ok(mockMarkets));
    overrideForTests({
      marketRepository: createMockMarketRepo({ getMarkets: getMarketsMock }),
      connectivity: { isOnline: () => true } as never,
    });

    const { getByTestId } = await renderWithClient(<ViewModelHarness />);
    await waitFor(() => {
      expect(getByTestId("vm-status-kind").props["children"]).toBe("live");
    });
    expect(getMarketsMock).toHaveBeenCalledWith(undefined, "rank", 1, 250, "eur");
  });

  it("requests markets in USD, fetches exchange rates, and converts prices when currency is egp", async () => {
    useCurrencyStore.setState({ currency: "egp", egpCrossRate: null });
    const getMarketsMock = jest.fn<MarketRepository["getMarkets"]>(async () => ok(mockMarkets));
    const getExchangeRatesMock = jest.fn(async () =>
      ok({ rate: "50.0000", timestamp: 1, btcUsd: "1", btcEgp: "50" }),
    );
    overrideForTests({
      marketRepository: createMockMarketRepo({
        getMarkets: getMarketsMock,
        getExchangeRates: getExchangeRatesMock,
      }),
      connectivity: { isOnline: () => true } as never,
    });

    const { getByTestId } = await renderWithClient(<ViewModelHarness />);
    await waitFor(() => {
      expect(getByTestId("vm-status-kind").props["children"]).toBe("live");
    });
    expect(getMarketsMock).toHaveBeenCalledWith(undefined, "rank", 1, 250, "usd");
    await waitFor(() => {
      expect(getByTestId("vm-first-price").props["children"]).toBe("3400000.00");
    });

    fireEvent.press(getByTestId("btn-refresh"));
  });

  it("handles exchangeRates query error gracefully when currency is egp", async () => {
    useCurrencyStore.setState({ currency: "egp", egpCrossRate: null });
    overrideForTests({
      marketRepository: createMockMarketRepo({
        getExchangeRates: jest.fn(async () =>
          err({ kind: "http" as const, status: 500, message: "Fail" }),
        ),
      }),
      connectivity: { isOnline: () => true } as never,
    });

    const { getByTestId } = await renderWithClient(<ViewModelHarness />);
    await waitFor(() => {
      expect(getByTestId("vm-status-kind").props["children"]).toBe("live");
    });
    expect(getByTestId("vm-first-price").props["children"]).toBe("68000.00");
  });

  it("evaluates matching price alerts when market query resolves successfully", async () => {
    const mockGetAll = jest.fn(async () =>
      ok([
        {
          id: "alert-btc",
          coinId: "bitcoin",
          direction: "above" as const,
          targetPrice: "65000",
          currency: "usd" as const,
          active: true,
          createdAt: 1000,
          updatedAt: 1000,
        },
      ]),
    );
    const mockUpsert = jest.fn(async (_alert: PriceAlert) => ok(undefined));

    overrideForTests({
      marketRepository: createMockMarketRepo(),
      alertRepository: {
        getAll: mockGetAll,
        upsert: mockUpsert,
        delete: jest.fn(async () => ok(undefined)),
      },
      connectivity: { isOnline: () => true } as never,
    });

    const { getByTestId } = await renderWithClient(<ViewModelHarness />);

    await waitFor(() => {
      expect(getByTestId("vm-status-kind").props["children"]).toBe("live");
    });

    await waitFor(() => {
      expect(mockGetAll).toHaveBeenCalled();
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({ id: "alert-btc", active: false }),
      );
    });
  });
});
