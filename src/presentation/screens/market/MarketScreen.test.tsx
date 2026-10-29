/**
 * Component tests for MarketScreen live list and search filters.
 */

import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, waitFor } from "@testing-library/react-native";

import { usePostureOverrideStore } from "@core/foldable/postureStore";
import { overrideForTests } from "@di/container";
import type { MarketPage } from "@domain/market/MarketEntry";
import { ok } from "@domain/Result";

import { MarketScreen } from "./MarketScreen";

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
      sparkline7d: [36000, 35500, 35000],
    },
  ],
  hasMore: false,
  page: 1,
  total: 2,
};

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

describe("MarketScreen", () => {
  beforeEach(() => {
    usePostureOverrideStore.getState().setOverride("auto");
  });
  it("renders market list with coins and filters locally on search query", async () => {
    overrideForTests({
      marketRepository: {
        getMarkets: jest.fn(async () => ok(mockMarkets)),
        getMarketChart: jest.fn(async () => ok({ prices: [], marketCaps: [], totalVolumes: [] })),
      },
      connectivity: {
        isOnline: () => true,
      } as never,
    });
    usePostureOverrideStore.getState().setOverride("COMPACT");

    const onSelectCoin = jest.fn();
    const { getByTestId, getByText, queryByText, findByText, findByTestId } =
      await renderWithClient(<MarketScreen onSelectCoin={onSelectCoin} />);

    expect(await findByTestId("market-list")).toBeDefined();
    expect(await findByText("BTC")).toBeDefined();
    expect(getByText("ETH")).toBeDefined();

    const searchInput = getByTestId("market-search-input");
    fireEvent.changeText(searchInput, "bit");

    expect(await findByText("BTC")).toBeDefined();
    await waitFor(() => {
      expect(queryByText("ETH")).toBeNull();
    });
  });

  it("handles sorting chip selection", async () => {
    overrideForTests({
      marketRepository: {
        getMarkets: jest.fn(async () => ok(mockMarkets)),
        getMarketChart: jest.fn(async () => ok({ prices: [], marketCaps: [], totalVolumes: [] })),
      },
      connectivity: {
        isOnline: () => true,
      } as never,
    });
    usePostureOverrideStore.getState().setOverride("COMPACT");

    const onSelectCoin = jest.fn();
    const { findByTestId } = await renderWithClient(<MarketScreen onSelectCoin={onSelectCoin} />);

    const sort24h = await findByTestId("sort-chip-price_24h_change");
    fireEvent.press(sort24h);
    expect(sort24h).toBeDefined();
  });

  it("triggers onSelectCoin when a coin row is pressed", async () => {
    overrideForTests({
      marketRepository: {
        getMarkets: jest.fn(async () => ok(mockMarkets)),
        getMarketChart: jest.fn(async () => ok({ prices: [], marketCaps: [], totalVolumes: [] })),
      },
      connectivity: {
        isOnline: () => true,
      } as never,
    });
    usePostureOverrideStore.getState().setOverride("COMPACT");

    const onSelectCoin = jest.fn();
    const { findByTestId } = await renderWithClient(<MarketScreen onSelectCoin={onSelectCoin} />);

    const row = await findByTestId("market-row-bitcoin");
    fireEvent.press(row);
    expect(onSelectCoin).toHaveBeenCalledWith("bitcoin");
  });
});
