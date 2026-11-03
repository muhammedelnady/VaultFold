/**
 * Tests for OutboxInspectorSheet.
 */
import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";

import { overrideForTests } from "@di/container";

import { OutboxInspectorSheet } from "./OutboxInspectorSheet";

const mockFailedEntry = {
  id: "out-1",
  type: "tx.add",
  entityKey: "bitcoin",
  status: "failed",
  attempts: 3,
  lastError: { message: "Gateway timeout" },
} as never;

describe("OutboxInspectorSheet", () => {
  it("renders empty outbox state", async () => {
    const mockList = jest.fn(() => []);
    const mockSnapshot = jest.fn(() => ({ pending: 0, inflight: 0, failed: 0 }));

    overrideForTests({
      outboxEngine: {
        list: mockList,
        snapshot: mockSnapshot,
        subscribe: jest.fn((cb?: () => void) => {
          cb?.();
          return () => {};
        }),
        flush: jest.fn(),
        retry: jest.fn(),
        retryAllFailed: jest.fn(),
        clearFailed: jest.fn(),
        discard: jest.fn(),
      } as never,
    });

    await render(<OutboxInspectorSheet visible={true} onClose={jest.fn()} />);

    expect(screen.getByTestId("outbox-inspector-sheet")).toBeTruthy();
    expect(screen.getByTestId("outbox-empty")).toBeTruthy();
    expect(screen.getByText("Pending: 0")).toBeTruthy();
  });

  it("renders offline banner when disconnected", async () => {
    overrideForTests({
      outboxEngine: {
        list: jest.fn(() => []),
        snapshot: jest.fn(() => ({ pending: 0, inflight: 0, failed: 0 })),
        subscribe: jest.fn(() => () => {}),
        flush: jest.fn(),
        retry: jest.fn(),
        retryAllFailed: jest.fn(),
        clearFailed: jest.fn(),
        discard: jest.fn(),
      } as never,
      connectivity: {
        isOnline: () => false,
      } as never,
    });

    await render(<OutboxInspectorSheet visible={true} onClose={jest.fn()} />);
    expect(screen.getByTestId("outbox-connectivity-banner")).toBeTruthy();
  });

  it("renders failed items and triggers retry and clear actions", async () => {
    const mockList = jest.fn(() => [mockFailedEntry]);
    const mockSnapshot = jest.fn(() => ({ pending: 0, inflight: 0, failed: 1 }));
    const mockRetryAll = jest.fn();
    const mockClearFailed = jest.fn();
    const mockFlush = jest.fn();
    const mockRetry = jest.fn();
    const mockDiscard = jest.fn();
    const onClose = jest.fn();

    overrideForTests({
      outboxEngine: {
        list: mockList,
        snapshot: mockSnapshot,
        subscribe: jest.fn(() => () => {}),
        flush: mockFlush,
        retry: mockRetry,
        retryAllFailed: mockRetryAll,
        clearFailed: mockClearFailed,
        discard: mockDiscard,
      } as never,
    });

    await render(<OutboxInspectorSheet visible={true} onClose={onClose} />);

    expect(screen.getByTestId("outbox-item-out-1")).toBeTruthy();
    expect(screen.getByText("Gateway timeout")).toBeTruthy();

    await fireEvent.press(screen.getByTestId("btn-retry-failed"));
    expect(mockRetryAll).toHaveBeenCalled();

    await fireEvent.press(screen.getByTestId("btn-sync-now"));
    expect(mockFlush).toHaveBeenCalled();

    await fireEvent.press(screen.getByTestId("btn-retry-entry-out-1"));
    expect(mockRetry).toHaveBeenCalledWith("out-1");

    await fireEvent.press(screen.getByTestId("btn-discard-entry-out-1"));
    expect(mockDiscard).toHaveBeenCalledWith("out-1");

    await fireEvent.press(screen.getByTestId("btn-clear-failed"));
    expect(mockClearFailed).toHaveBeenCalled();

    await fireEvent.press(screen.getByTestId("btn-close-outbox"));
    expect(onClose).toHaveBeenCalled();
  });

  it("renders null when visible is false", async () => {
    await render(<OutboxInspectorSheet visible={false} onClose={jest.fn()} />);
    expect(screen.queryByTestId("outbox-inspector-sheet")).toBeNull();
  });
});
