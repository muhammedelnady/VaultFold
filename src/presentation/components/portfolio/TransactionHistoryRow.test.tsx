/**
 * Tests for TransactionHistoryRow component.
 */
import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";

import type { LedgerEntry } from "@domain/ledger/LedgerEntry";

import { TransactionHistoryRow } from "./TransactionHistoryRow";

describe("TransactionHistoryRow", () => {
  const mockBuyTx: LedgerEntry = {
    id: "tx-test-1",
    type: "buy",
    coinId: "ethereum",
    amount: "2.0",
    price: "3500",
    currency: "usd",
    timestamp: 1700000000000,
  };

  const mockSellTx: LedgerEntry = {
    id: "tx-test-2",
    type: "sell",
    coinId: "bitcoin",
    amount: "0.5",
    price: "65000",
    currency: "usd",
    timestamp: 1700000001000,
  };

  it("renders buy transaction details and invokes delete", async () => {
    const onDelete = jest.fn((_id: string, _coinId: string) => {});
    await render(
      <TransactionHistoryRow transaction={mockBuyTx} currency="usd" onDelete={onDelete} />,
    );

    expect(screen.getByText("BUY")).toBeTruthy();
    expect(screen.getByText("ETHEREUM")).toBeTruthy();
    expect(screen.getByTestId("tx-history-row-tx-test-1")).toBeTruthy();

    await fireEvent.press(screen.getByTestId("btn-delete-tx-tx-test-1"));
    expect(onDelete).toHaveBeenCalledWith("tx-test-1", "ethereum");
  });

  it("renders sell transaction badge styling", async () => {
    const onDelete = jest.fn((_id: string, _coinId: string) => {});
    await render(
      <TransactionHistoryRow transaction={mockSellTx} currency="usd" onDelete={onDelete} />,
    );

    expect(screen.getByText("SELL")).toBeTruthy();
    expect(screen.getByText("BITCOIN")).toBeTruthy();
  });
});
