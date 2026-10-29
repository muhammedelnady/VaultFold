/**
 * Tests for AlertsScreen component.
 */
import { describe, expect, it, jest } from "@jest/globals";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react-native";

import { overrideForTests } from "@di/container";
import type { PriceAlert } from "@domain/alert/PriceAlert";
import { err, ok } from "@domain/Result";

import { AlertsScreen } from "./AlertsScreen";

const mockAlerts: PriceAlert[] = [
  {
    id: "a1",
    coinId: "bitcoin",
    direction: "above",
    targetPrice: "70000",
    currency: "usd",
    active: true,
    createdAt: 1000,
    updatedAt: 1000,
  },
  {
    id: "a2",
    coinId: "ethereum",
    direction: "below",
    targetPrice: "3000",
    currency: "usd",
    active: false,
    createdAt: 1000,
    updatedAt: 1000,
  },
];

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("AlertsScreen", () => {
  it("renders list of alerts and handles toggle and delete", async () => {
    const mockUpsert = jest.fn(async (_alert: PriceAlert) => ok(undefined));
    const mockDelete = jest.fn(async (_id: string) => ok(undefined));
    const mockEnqueue = jest.fn((_input: unknown) => ({ id: "outbox-1" }));

    overrideForTests({
      outboxEngine: {
        enqueue: mockEnqueue,
      } as never,
      alertRepository: {
        getAll: jest.fn(async () => ok(mockAlerts)),
        upsert: mockUpsert,
        delete: mockDelete,
      },
    });

    await renderWithClient(<AlertsScreen />);

    expect(await screen.findByTestId("alerts-screen")).toBeTruthy();
    expect(await screen.findByTestId("alert-card-a1")).toBeTruthy();
    expect(await screen.findByTestId("alert-card-a2")).toBeTruthy();

    await fireEvent.press(screen.getByTestId("btn-toggle-alert-a1"));
    expect(mockUpsert).toHaveBeenCalledWith(expect.objectContaining({ id: "a1", active: false }));
    expect(mockEnqueue).toHaveBeenCalledWith({
      type: "alert.upsert",
      entityKey: "alert:bitcoin",
      payload: {
        id: "a1",
        coinId: "bitcoin",
        direction: "above",
        targetPrice: "70000",
        currency: "usd",
        active: false,
      },
    });

    await fireEvent.press(screen.getByTestId("btn-delete-alert-a2"));
    expect(mockDelete).toHaveBeenCalledWith("a2");
    expect(mockEnqueue).toHaveBeenCalledWith({
      type: "alert.delete",
      entityKey: "alert:a2",
      payload: { id: "a2" },
    });
  });

  it("renders empty state when there are no alerts", async () => {
    overrideForTests({
      alertRepository: {
        getAll: jest.fn(async () => ok([])),
        upsert: jest.fn(async () => ok(undefined)),
        delete: jest.fn(async () => ok(undefined)),
      },
    });

    await renderWithClient(<AlertsScreen />);

    expect(await screen.findByTestId("alerts-empty")).toBeTruthy();
    expect(screen.getByText("No active alerts")).toBeTruthy();
  });

  it("handles repository failure gracefully and renders empty state", async () => {
    overrideForTests({
      alertRepository: {
        getAll: jest.fn(async () => err({ kind: "unknown" as const, message: "Storage fail" })),
        upsert: jest.fn(async () => ok(undefined)),
        delete: jest.fn(async () => ok(undefined)),
      },
    });

    await renderWithClient(<AlertsScreen />);
    expect(await screen.findByTestId("alerts-empty")).toBeTruthy();
  });
});
