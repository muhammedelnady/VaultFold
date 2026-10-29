/**
 * Tests for TransactionModal component.
 */
import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import type { LedgerEntry } from "@domain/ledger/LedgerEntry";

import { TransactionModal } from "./TransactionModal";

describe("TransactionModal", () => {
  it("renders nothing when visible is false", async () => {
    await render(
      <TransactionModal
        visible={false}
        onClose={jest.fn()}
        onSave={jest.fn(async (_entry: LedgerEntry) => {})}
      />,
    );
    expect(screen.queryByTestId("transaction-modal")).toBeNull();
  });

  it("submits a valid buy transaction", async () => {
    const onSave = jest.fn(async (_entry: LedgerEntry) => {});
    const onClose = jest.fn();

    await render(
      <TransactionModal
        visible={true}
        defaultCoinId="bitcoin"
        defaultPriceUsd="65000"
        onClose={onClose}
        onSave={onSave}
      />,
    );

    await fireEvent.changeText(screen.getByTestId("input-amount"), "0.5");
    await fireEvent.changeText(screen.getByTestId("input-price"), "65000");
    await fireEvent.changeText(screen.getByTestId("input-fee"), "5.00");
    await fireEvent.changeText(screen.getByTestId("input-note"), "Kraken buy");

    await fireEvent.press(screen.getByTestId("btn-submit-tx"));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "buy",
          coinId: "bitcoin",
          amount: "0.5",
          price: "65000",
          fee: "5.00",
          note: "Kraken buy",
        }),
      );
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("validates sell transaction does not exceed current holding", async () => {
    const onSave = jest.fn(async (_entry: LedgerEntry) => {});
    const onClose = jest.fn();

    await render(
      <TransactionModal
        visible={true}
        defaultCoinId="bitcoin"
        currentHoldingQuantity="1.0"
        onClose={onClose}
        onSave={onSave}
      />,
    );

    await fireEvent.press(screen.getByTestId("btn-side-sell"));

    await fireEvent.changeText(screen.getByTestId("input-amount"), "2.0");
    await fireEvent.press(screen.getByTestId("btn-submit-tx"));

    expect(screen.getByTestId("transaction-validation-error")).toBeTruthy();
    expect(screen.getByText(/Cannot sell more than held balance/)).toBeTruthy();
    expect(onSave).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByTestId("btn-side-buy"));
  });

  it("validates quantity and price are greater than zero", async () => {
    const onSave = jest.fn(async (_entry: LedgerEntry) => {});

    await render(
      <TransactionModal
        visible={true}
        defaultCoinId="bitcoin"
        onClose={jest.fn()}
        onSave={onSave}
      />,
    );

    await fireEvent.changeText(screen.getByTestId("input-amount"), "0");
    await fireEvent.press(screen.getByTestId("btn-submit-tx"));
    expect(screen.getByText("Quantity must be greater than zero")).toBeTruthy();

    await fireEvent.changeText(screen.getByTestId("input-amount"), "1.0");
    await fireEvent.changeText(screen.getByTestId("input-price"), "0");
    await fireEvent.press(screen.getByTestId("btn-submit-tx"));
    expect(screen.getByText("Price must be greater than zero")).toBeTruthy();

    await fireEvent.changeText(screen.getByTestId("input-price"), "invalid");
    await fireEvent.press(screen.getByTestId("btn-submit-tx"));
    expect(screen.getByText("Please enter valid numeric values")).toBeTruthy();

    await fireEvent.changeText(screen.getByTestId("input-coin-id"), "   ");
    await fireEvent.press(screen.getByTestId("btn-submit-tx"));
    expect(screen.getByText("Please specify a valid coin ID")).toBeTruthy();
  });

  it("handles numeric keypad input and backspace across fields", async () => {
    await render(
      <TransactionModal
        visible={true}
        defaultCoinId="bitcoin"
        defaultPriceUsd="100"
        onClose={jest.fn()}
        onSave={jest.fn(async (_entry: LedgerEntry) => {})}
      />,
    );

    await fireEvent(screen.getByTestId("input-amount"), "focus");
    await fireEvent.press(screen.getByTestId("keypad-5"));
    await fireEvent.press(screen.getByTestId("keypad-backspace"));

    await fireEvent(screen.getByTestId("input-price"), "focus");
    await fireEvent.press(screen.getByTestId("keypad-2"));
    await fireEvent.press(screen.getByTestId("keypad-backspace"));

    await fireEvent(screen.getByTestId("input-fee"), "focus");
    await fireEvent.press(screen.getByTestId("keypad-1"));
    await fireEvent.press(screen.getByTestId("keypad-backspace"));

    expect(screen.getByTestId("tx-live-total")).toBeTruthy();
  });

  it("closes when backdrop or cancel button is pressed", async () => {
    const onClose = jest.fn();

    await render(
      <TransactionModal
        visible={true}
        onClose={onClose}
        onSave={jest.fn(async (_entry: LedgerEntry) => {})}
      />,
    );

    await fireEvent.press(screen.getByTestId("btn-cancel-tx"));
    expect(onClose).toHaveBeenCalledTimes(1);

    await fireEvent.press(screen.getByTestId("transaction-backdrop"));
    expect(onClose).toHaveBeenCalledTimes(2);

    await fireEvent.press(screen.getByTestId("btn-close-modal"));
    expect(onClose).toHaveBeenCalledTimes(3);
  });
});
