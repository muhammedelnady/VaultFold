/**
 * Tests for AppTabs bottom tab bar navigation and switching.
 */

import { describe, expect, it, jest } from "@jest/globals";
import { NavigationContainer } from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render } from "@testing-library/react-native";

import { overrideForTests } from "@di/container";
import { ok } from "@domain/Result";

import { AppTabs } from "./app-tabs";

describe("AppTabs", () => {
  it("renders all tabs and navigates between screens", async () => {
    overrideForTests({
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
      marketRepository: {
        getMarkets: jest.fn(async () =>
          ok({
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
            ],
            page: 1,
            hasMore: false,
            total: 1,
          }),
        ),
        getMarketChart: jest.fn(async () => ok({ prices: [], marketCaps: [], totalVolumes: [] })),
      },
      connectivity: {
        isOnline: () => true,
      } as never,
    });

    const queryClient = new QueryClient();
    const { getByText, findByTestId, findAllByTestId } = await render(
      <NavigationContainer>
        <QueryClientProvider client={queryClient}>
          <AppTabs />
        </QueryClientProvider>
      </NavigationContainer>,
    );

    const row = await findByTestId("market-row-bitcoin");
    await fireEvent.press(row);

    expect(await findByTestId("tab-bar-blur")).toBeTruthy();
    expect((await findAllByTestId("tab-icon-market-pill")).length).toBeGreaterThanOrEqual(1);
    expect((await findAllByTestId("tab-icon-market-indicator")).length).toBeGreaterThanOrEqual(1);

    await fireEvent.press(getByText("Portfolio"));
    expect(await findByTestId("biometric-lock-view")).toBeTruthy();
    expect((await findAllByTestId("tab-icon-portfolio-pill")).length).toBeGreaterThanOrEqual(1);

    await fireEvent.press(getByText("Alerts"));
    expect(await findByTestId("alerts-screen")).toBeTruthy();
    expect((await findAllByTestId("tab-icon-alerts-pill")).length).toBeGreaterThanOrEqual(1);

    await fireEvent.press(getByText("Settings"));
    expect(await findByTestId("settings-screen")).toBeTruthy();
    expect((await findAllByTestId("tab-icon-settings-pill")).length).toBeGreaterThanOrEqual(1);
  });
});
