/**
 * Unit tests for usePortfolioViewModel.
 */
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { Pressable, Text, View } from "react-native";

import { overrideForTests } from "@di/container";
import type { LedgerEntry } from "@domain/ledger/LedgerEntry";
import { err, ok } from "@domain/Result";
import { useCurrencyStore } from "@stores/currencyStore";
import { useVaultAuthStore } from "@stores/vaultAuthStore";

import { usePortfolioViewModel } from "./portfolio.viewmodel";

const mockEntries: LedgerEntry[] = [
  {
    id: "tx-1",
    type: "buy",
    coinId: "bitcoin",
    amount: "1.0",
    price: "60000",
    currency: "usd",
    timestamp: 1000,
  },
];

function ViewModelHarness() {
  const vm = usePortfolioViewModel();
  return (
    <View testID="portfolio-vm-harness">
      <Text testID="total-value">{vm.summary.totalValueUsd}</Text>
      <Text testID="holdings-count">{String(vm.summary.holdings.length)}</Text>
      <Text testID="is-locked">{String(vm.isLocked)}</Text>
      <Pressable
        testID="btn-add-tx"
        onPress={() =>
          void vm.onAddTransaction({
            id: "tx-2",
            type: "buy",
            coinId: "ethereum",
            amount: "10",
            price: "3000",
            currency: "usd",
            timestamp: 2000,
          })
        }
      />
      <Pressable
        testID="btn-delete-tx"
        onPress={() => void vm.onDeleteTransaction("tx-1", "bitcoin")}
      />
      <Pressable testID="btn-refresh" onPress={() => void vm.onRefresh()} />
    </View>
  );
}

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("usePortfolioViewModel", () => {
  beforeEach(() => {
    useCurrencyStore.setState({ currency: "usd", egpCrossRate: null });
  });

  it("fetches ledger and market prices and calculates portfolio metrics", async () => {
    useVaultAuthStore.setState({ isLocked: false, isDemoMode: false });

    const mockAppend = jest.fn(async (_entry: LedgerEntry) => ok(undefined));
    const mockTombstone = jest.fn(async (_id: string) => ok(undefined));
    const mockEnqueue = jest.fn();

    overrideForTests({
      ledgerRepository: {
        getAllEntries: jest.fn(async () => ok(mockEntries)),
        appendEntry: mockAppend,
        reviseEntry: jest.fn(async () => ok(undefined)),
        tombstoneEntry: mockTombstone,
        getWatchlist: jest.fn(async () => ok([])),
        setWatchlist: jest.fn(async () => ok(undefined)),
        toggleWatch: jest.fn(async () => ok(undefined)),
      },
      marketRepository: {
        getMarkets: jest.fn(async () =>
          ok({
            items: [
              {
                id: "bitcoin",
                name: "Bitcoin",
                symbol: "btc",
                rank: 1,
                priceUsd: "70000",
                priceChange24h: "5.0",
                marketCapUsd: "1400000000000",
                volume24hUsd: "30000000000",
                sparkline7d: [65000, 70000],
              },
            ],
            hasMore: false,
            page: 1,
            total: 1,
          }),
        ),
        getMarketChart: jest.fn(async () => ok({ prices: [], marketCaps: [], totalVolumes: [] })),
        getExchangeRates: jest.fn(async () =>
          ok({ rate: "50.0000", timestamp: 1, btcUsd: "1", btcEgp: "50" }),
        ),
      },
      outboxEngine: {
        enqueue: mockEnqueue,
        list: jest.fn(() => []),
        snapshot: jest.fn(() => ({ pending: 0, inflight: 0, failed: 0 })),
        subscribe: jest.fn(() => () => {}),
        flush: jest.fn(),
        retry: jest.fn(),
        retryAllFailed: jest.fn(),
        clearFailed: jest.fn(),
        discard: jest.fn(),
      } as never,
    });

    const { getByTestId, findByText } = await renderWithClient(<ViewModelHarness />);

    await findByText("70000.00");
    expect(getByTestId("total-value").props["children"]).toBe("70000.00");
    expect(getByTestId("holdings-count").props["children"]).toBe("1");
    expect(getByTestId("is-locked").props["children"]).toBe("false");

    await fireEvent.press(getByTestId("btn-add-tx"));
    await waitFor(() => {
      expect(mockAppend).toHaveBeenCalled();
      expect(mockEnqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "tx.add",
          entityKey: "ethereum",
        }),
      );
    });

    await fireEvent.press(getByTestId("btn-delete-tx"));
    await waitFor(() => {
      expect(mockTombstone).toHaveBeenCalledWith("tx-1");
      expect(mockEnqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "tx.delete",
          entityKey: "bitcoin",
        }),
      );
    });

    await fireEvent.press(getByTestId("btn-refresh"));
  });

  it("handles repository errors gracefully and defaults to empty", async () => {
    useVaultAuthStore.setState({ isLocked: false, isDemoMode: false });

    overrideForTests({
      ledgerRepository: {
        getAllEntries: jest.fn(async () =>
          err({ kind: "unknown" as const, message: "Storage fail" }),
        ),
        appendEntry: jest.fn(async () => ok(undefined)),
        reviseEntry: jest.fn(async () => ok(undefined)),
        tombstoneEntry: jest.fn(async () => ok(undefined)),
        getWatchlist: jest.fn(async () => ok([])),
        setWatchlist: jest.fn(async () => ok(undefined)),
        toggleWatch: jest.fn(async () => ok(undefined)),
      },
      marketRepository: {
        getMarkets: jest.fn(async () => err({ kind: "offline" as const, message: "Network fail" })),
        getMarketChart: jest.fn(async () => ok({ prices: [], marketCaps: [], totalVolumes: [] })),
        getExchangeRates: jest.fn(async () =>
          ok({ rate: "50.0000", timestamp: 1, btcUsd: "1", btcEgp: "50" }),
        ),
      },
      outboxEngine: {
        enqueue: jest.fn(),
        list: jest.fn(() => []),
        snapshot: jest.fn(() => ({ pending: 0, inflight: 0, failed: 0 })),
        subscribe: jest.fn(() => () => {}),
        flush: jest.fn(),
        retry: jest.fn(),
        retryAllFailed: jest.fn(),
        clearFailed: jest.fn(),
        discard: jest.fn(),
      } as never,
    });

    const { getByTestId, findByText } = await renderWithClient(<ViewModelHarness />);

    await findByText("0.00");
    expect(getByTestId("total-value").props["children"]).toBe("0.00");
    expect(getByTestId("holdings-count").props["children"]).toBe("0");
  });

  it("converts portfolio summary to EGP when currencyStore is set to egp", async () => {
    useVaultAuthStore.setState({ isLocked: false, isDemoMode: false });
    useCurrencyStore.setState({
      currency: "egp",
      egpCrossRate: { rate: "50.0000", timestamp: 1, btcUsd: "1", btcEgp: "50" },
    });

    overrideForTests({
      ledgerRepository: {
        getAllEntries: jest.fn(async () => ok(mockEntries)),
        appendEntry: jest.fn(async () => ok(undefined)),
        reviseEntry: jest.fn(async () => ok(undefined)),
        tombstoneEntry: jest.fn(async () => ok(undefined)),
        getWatchlist: jest.fn(async () => ok([])),
        setWatchlist: jest.fn(async () => ok(undefined)),
        toggleWatch: jest.fn(async () => ok(undefined)),
      },
      marketRepository: {
        getMarkets: jest.fn(async () =>
          ok({
            items: [
              {
                id: "bitcoin",
                name: "Bitcoin",
                symbol: "btc",
                rank: 1,
                priceUsd: "70000",
                priceChange24h: "5.0",
                marketCapUsd: "1400000000000",
                volume24hUsd: "30000000000",
                sparkline7d: [65000, 70000],
              },
            ],
            hasMore: false,
            page: 1,
            total: 1,
          }),
        ),
        getMarketChart: jest.fn(async () => ok({ prices: [], marketCaps: [], totalVolumes: [] })),
        getExchangeRates: jest.fn(async () =>
          ok({ rate: "50.0000", timestamp: 1, btcUsd: "1", btcEgp: "50" }),
        ),
      },
      outboxEngine: {
        enqueue: jest.fn(),
        list: jest.fn(() => []),
        snapshot: jest.fn(() => ({ pending: 0, inflight: 0, failed: 0 })),
        subscribe: jest.fn(() => () => {}),
        flush: jest.fn(),
        retry: jest.fn(),
        retryAllFailed: jest.fn(),
        clearFailed: jest.fn(),
        discard: jest.fn(),
      } as never,
    });

    const { getByTestId, findByText } = await renderWithClient(<ViewModelHarness />);

    await findByText("3500000.00");
    expect(getByTestId("total-value").props["children"]).toBe("3500000.00");
    await fireEvent.press(getByTestId("btn-refresh"));
  });
});
