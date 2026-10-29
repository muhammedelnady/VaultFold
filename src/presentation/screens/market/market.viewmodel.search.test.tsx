/**
 * Unit tests for market search diacritic sensitivity and Decimal sorting.
 */
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { Pressable, Text, View } from "react-native";

import { overrideForTests } from "@di/container";
import type { MarketPage } from "@domain/market/MarketEntry";
import type { MarketRepository } from "@domain/market/MarketRepository";
import { ok } from "@domain/Result";
import { useCurrencyStore } from "@stores/currencyStore";

import { useMarketViewModel } from "./market.viewmodel";

const mockMarketsForSearchAndSort: MarketPage = {
  items: [
    {
      id: "bitcoin",
      name: "Bitcoin",
      symbol: "btc",
      rank: 1,
      priceUsd: "68000.00",
      priceChange24h: "2.5",
      marketCapUsd: "1300000000000.50",
      volume24hUsd: "30000000000",
      sparkline7d: [66000, 67000, 68000],
    },
    {
      id: "ethereum",
      name: "Ethereum",
      symbol: "eth",
      rank: 2,
      priceUsd: "3500.00",
      priceChange24h: "10.25",
      marketCapUsd: "420000000000.25",
      volume24hUsd: "15000000000",
      sparkline7d: [3400, 3450, 3500],
    },
    {
      id: "tether",
      name: "Tether",
      symbol: "usdt",
      rank: 3,
      priceUsd: "1.00",
      priceChange24h: "-0.01",
      marketCapUsd: "120000000000",
      volume24hUsd: "50000000000",
      sparkline7d: [1, 1, 1],
    },
  ],
  page: 1,
  hasMore: false,
  total: 3,
};

function createMockRepo(): MarketRepository {
  return {
    getMarkets: jest.fn(async () => ok(mockMarketsForSearchAndSort)),
    getMarketChart: jest.fn(async () => ok({ prices: [], marketCaps: [], totalVolumes: [] })),
    getExchangeRates: jest.fn(async () =>
      ok({ rate: "50.0000", timestamp: 1, btcUsd: "1", btcEgp: "50" }),
    ),
  };
}

function SearchSortHarness() {
  const vm = useMarketViewModel({ isFocused: true });
  return (
    <View testID="search-sort-harness">
      <Text testID="items-count">{String(vm.items.length)}</Text>
      <Text testID="item-0">{vm.items[0]?.id ?? "none"}</Text>
      <Text testID="item-1">{vm.items[1]?.id ?? "none"}</Text>
      <Text testID="item-2">{vm.items[2]?.id ?? "none"}</Text>
      <Pressable testID="btn-search-diacritic" onPress={() => vm.setSearchQuery("bítcòin")} />
      <Pressable testID="btn-sort-mcap" onPress={() => vm.setSortOption("market_cap")} />
      <Pressable testID="btn-sort-change" onPress={() => vm.setSortOption("price_24h_change")} />
      <Pressable testID="btn-sort-rank" onPress={() => vm.setSortOption("rank")} />
    </View>
  );
}

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("useMarketViewModel diacritic search and decimal sorting", () => {
  beforeEach(() => {
    useCurrencyStore.setState({ currency: "usd", egpCrossRate: null });
    overrideForTests({
      marketRepository: createMockRepo(),
      connectivity: { isOnline: () => true } as never,
    });
  });

  it("matches diacritic query 'bítcòin' to 'Bitcoin'", async () => {
    const { getByTestId } = await renderWithClient(<SearchSortHarness />);

    await waitFor(() => {
      expect(getByTestId("items-count").props["children"]).toBe("3");
    });

    fireEvent.press(getByTestId("btn-search-diacritic"));
    await waitFor(() => {
      expect(getByTestId("items-count").props["children"]).toBe("1");
      expect(getByTestId("item-0").props["children"]).toBe("bitcoin");
    });
  });

  it("sorts by market_cap and price_24h_change accurately using Decimal", async () => {
    const { getByTestId } = await renderWithClient(<SearchSortHarness />);

    await waitFor(() => {
      expect(getByTestId("items-count").props["children"]).toBe("3");
    });

    fireEvent.press(getByTestId("btn-sort-change"));
    await waitFor(() => {
      expect(getByTestId("item-0").props["children"]).toBe("ethereum");
      expect(getByTestId("item-1").props["children"]).toBe("bitcoin");
      expect(getByTestId("item-2").props["children"]).toBe("tether");
    });

    fireEvent.press(getByTestId("btn-sort-mcap"));
    await waitFor(() => {
      expect(getByTestId("item-0").props["children"]).toBe("bitcoin");
      expect(getByTestId("item-1").props["children"]).toBe("ethereum");
      expect(getByTestId("item-2").props["children"]).toBe("tether");
    });

    fireEvent.press(getByTestId("btn-sort-rank"));
    await waitFor(() => {
      expect(getByTestId("item-0").props["children"]).toBe("bitcoin");
      expect(getByTestId("item-1").props["children"]).toBe("ethereum");
      expect(getByTestId("item-2").props["children"]).toBe("tether");
    });
  });
});
