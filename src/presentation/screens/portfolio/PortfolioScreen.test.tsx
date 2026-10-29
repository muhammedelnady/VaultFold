/**
 * Tests for PortfolioScreen.
 */
import { describe, expect, it, jest } from "@jest/globals";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react-native";

import { usePostureOverrideStore } from "@core/foldable/postureStore";
import { overrideForTests } from "@di/container";
import type { LedgerEntry } from "@domain/ledger/LedgerEntry";
import { ok } from "@domain/Result";
import { useVaultAuthStore } from "@stores/vaultAuthStore";

import { PortfolioScreen } from "./PortfolioScreen";

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

function createDefaultMocks(entries: LedgerEntry[] = mockEntries) {
  return {
    ledgerRepository: {
      getAllEntries: jest.fn(async () => ok(entries)),
      appendEntry: jest.fn(async (_entry: LedgerEntry) => ok(undefined)),
      reviseEntry: jest.fn(async (_id: string, _entry: LedgerEntry) => ok(undefined)),
      tombstoneEntry: jest.fn(async (_id: string) => ok(undefined)),
      getWatchlist: jest.fn(async () => ok([])),
      setWatchlist: jest.fn(async (_list: string[]) => ok(undefined)),
      toggleWatch: jest.fn(async (_id: string) => ok(undefined)),
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
          ] as never[],
          hasMore: false,
          page: 1,
          total: 1,
        }),
      ),
      getMarketChart: jest.fn(async () => ok({ prices: [], marketCaps: [], totalVolumes: [] })),
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
    },
  };
}

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("PortfolioScreen", () => {
  beforeEach(() => {
    usePostureOverrideStore.getState().setOverride("auto");
    overrideForTests(createDefaultMocks() as never);
  });

  it("renders BiometricLockView when vault is locked", async () => {
    useVaultAuthStore.setState({ isLocked: true, isDemoMode: false });
    await renderWithClient(<PortfolioScreen />);

    expect(screen.getByTestId("biometric-lock-view")).toBeTruthy();
    expect(screen.queryByTestId("portfolio-screen")).toBeNull();
  });

  it("renders portfolio summary hero and holdings when unlocked", async () => {
    useVaultAuthStore.setState({ isLocked: false, isDemoMode: false });
    overrideForTests(createDefaultMocks() as never);

    const onSelectCoin = jest.fn();
    await renderWithClient(<PortfolioScreen onSelectCoin={onSelectCoin} />);

    expect(await screen.findByTestId("portfolio-screen")).toBeTruthy();
    expect(screen.getByTestId("portfolio-summary-hero")).toBeTruthy();
    expect(await screen.findByTestId("holding-card-bitcoin")).toBeTruthy();

    await fireEvent.press(screen.getByTestId("holding-card-bitcoin"));
    expect(onSelectCoin).toHaveBeenCalledWith("bitcoin");

    await fireEvent.press(screen.getByTestId("btn-open-outbox"));
    expect(screen.getByTestId("outbox-inspector-sheet")).toBeTruthy();
    await fireEvent.press(screen.getByTestId("btn-close-outbox"));

    await fireEvent.press(screen.getByTestId("btn-add-transaction"));
    expect(screen.getByTestId("transaction-modal")).toBeTruthy();
    await fireEvent.press(screen.getByTestId("btn-cancel-tx"));

    const scrollView = screen.getByTestId("portfolio-scroll-view");
    const { refreshControl } = scrollView.props;
    if (refreshControl) {
      await fireEvent(refreshControl, "refresh");
    }
  });

  it("renders empty holdings state and demo mode banner", async () => {
    useVaultAuthStore.setState({ isLocked: false, isDemoMode: true });
    const mocks = createDefaultMocks([]);
    mocks.marketRepository.getMarkets = jest.fn(async () =>
      ok({ items: [], hasMore: false, page: 1, total: 0 }),
    );
    overrideForTests(mocks as never);

    await renderWithClient(<PortfolioScreen />);

    expect(await screen.findByTestId("demo-mode-banner")).toBeTruthy();
    expect(screen.getByTestId("portfolio-empty-holdings")).toBeTruthy();
    expect(screen.getByTestId("portfolio-empty-transactions")).toBeTruthy();

    await fireEvent.press(screen.getByTestId("btn-empty-add-tx"));
    expect(screen.getByTestId("transaction-modal")).toBeTruthy();
  });

  it("renders in compact posture", async () => {
    usePostureOverrideStore.getState().setOverride("COMPACT");
    useVaultAuthStore.setState({ isLocked: false, isDemoMode: false });
    const mocks = createDefaultMocks([]);
    mocks.marketRepository.getMarkets = jest.fn(async () =>
      ok({ items: [], page: 1, hasMore: false, total: 0 }),
    );
    overrideForTests(mocks as never);

    await renderWithClient(<PortfolioScreen />);
    expect(await screen.findByTestId("portfolio-screen")).toBeTruthy();
    expect(screen.getByTestId("portfolio-scroll-view")).toBeTruthy();
  });

  it("renders transaction history and handles deletion", async () => {
    useVaultAuthStore.setState({ isLocked: false, isDemoMode: false });

    const activeTxEntries: LedgerEntry[] = [
      {
        id: "tx_1",
        type: "buy",
        coinId: "bitcoin",
        amount: "1.5",
        price: "60000",
        currency: "usd",
        timestamp: 1600000000000,
      },
    ];

    const mocks = createDefaultMocks(activeTxEntries);
    const tombstoneMock = jest.fn(async (_id: string) => ok(undefined));
    const enqueueMock = jest.fn();
    mocks.ledgerRepository.tombstoneEntry = tombstoneMock;
    mocks.outboxEngine.enqueue = enqueueMock;
    overrideForTests(mocks as never);

    await renderWithClient(<PortfolioScreen />);

    expect(await screen.findByTestId("tx-history-row-tx_1")).toBeTruthy();
    expect(screen.getByText("Transaction History")).toBeTruthy();

    await fireEvent.press(screen.getByTestId("btn-delete-tx-tx_1"));

    expect(tombstoneMock).toHaveBeenCalledWith("tx_1");
    expect(enqueueMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "tx.delete",
        entityKey: "bitcoin",
        payload: expect.objectContaining({ id: "tx_1" }),
      }),
    );
  });
});
