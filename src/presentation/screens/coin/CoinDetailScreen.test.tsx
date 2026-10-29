/**
 * Tests for CoinDetailScreen.
 */
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, waitFor } from "@testing-library/react-native";

import { usePostureOverrideStore } from "@core/foldable/postureStore";
import * as viewportModule from "@core/foldable/useViewport";
import { overrideForTests } from "@di/container";
import type { CoinDetail } from "@domain/coin/CoinDetail";
import { ok } from "@domain/Result";

import { CoinDetailScreen } from "./CoinDetailScreen";

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

describe("CoinDetailScreen", () => {
  beforeEach(() => {
    usePostureOverrideStore.getState().setOverride("auto");
    overrideForTests({
      outboxEngine: {
        enqueue: jest.fn(() => ({ id: "1" })),
      } as never,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders coin header, price hero, interactive chart, range selector, and stats", async () => {
    const onBack = jest.fn();

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
        getWatchlist: jest.fn(async () => ok(["bitcoin"])),
        setWatchlist: jest.fn(async () => ok(undefined)),
        toggleWatch: jest.fn(async (_id: string) => ok(undefined)),
      },
      connectivity: {
        isOnline: () => true,
      } as never,
    });

    const { getByTestId, findByText } = await renderWithClient(
      <CoinDetailScreen coinId="bitcoin" onBack={onBack} />,
    );

    await findByText("Bitcoin");
    expect(getByTestId("coin-detail-screen")).toBeTruthy();
    expect(getByTestId("interactive-chart")).toBeTruthy();
    expect(getByTestId("range-selector-24h")).toBeTruthy();

    await fireEvent.press(getByTestId("btn-back"));
    expect(onBack).toHaveBeenCalled();

    await fireEvent.press(getByTestId("btn-watchlist-toggle"));

    await fireEvent.press(getByTestId("btn-open-alert"));
    await waitFor(() => {
      expect(getByTestId("price-alert-sheet")).toBeTruthy();
    });

    await fireEvent.press(getByTestId("btn-cancel-alert"));
    await waitFor(() => {
      expect(getByTestId("coin-detail-screen")).toBeTruthy();
    });
  });

  it("renders in tabletop posture", async () => {
    usePostureOverrideStore.getState().setOverride("TABLETOP_MODE");

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
        toggleWatch: jest.fn(async (_id: string) => ok(undefined)),
      },
      connectivity: {
        isOnline: () => true,
      } as never,
    });

    const { getByTestId } = await renderWithClient(<CoinDetailScreen coinId="bitcoin" />);
    await waitFor(() => {
      expect(getByTestId("coin-detail-screen")).toBeTruthy();
    });
  });

  it("renders coin with negative price change", async () => {
    overrideForTests({
      coinRepository: {
        getCoinDetail: jest.fn(async () =>
          ok({
            ...mockCoin,
            priceChange24h: "-3.50",
          }),
        ),
      },
      marketRepository: {
        getMarkets: jest.fn(async () => ok({ items: [], page: 1, hasMore: false, total: 0 })),
        getMarketChart: jest.fn(async () =>
          ok({
            prices: [],
            marketCaps: [],
            totalVolumes: [],
          }),
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
        toggleWatch: jest.fn(async (_id: string) => ok(undefined)),
      },
      connectivity: {
        isOnline: () => false,
      } as never,
    });

    const { findByText, getByTestId } = await renderWithClient(
      <CoinDetailScreen coinId="bitcoin" />,
    );

    await findByText("Bitcoin");
    expect(getByTestId("coin-detail-screen")).toBeTruthy();
  });

  it("passes half width to InteractiveChart when posture is dual-pane", async () => {
    jest.spyOn(viewportModule, "useViewport").mockReturnValue({ width: 840, height: 900 });

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
        toggleWatch: jest.fn(async (_id: string) => ok(undefined)),
      },
      connectivity: {
        isOnline: () => true,
      } as never,
    });

    const { getByTestId, findByText } = await renderWithClient(
      <CoinDetailScreen coinId="bitcoin" />,
    );

    await findByText("Bitcoin");
    const chart = getByTestId("interactive-chart");
    expect(chart.props["style"]).toEqual(
      expect.arrayContaining([expect.objectContaining({ width: 420 })]),
    );
  });
});
