/**
 * Tests for HoldingCard component.
 */
import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";

import type { CoinHolding } from "@domain/portfolio/PortfolioCalculation";

import { HoldingCard } from "./HoldingCard";

describe("HoldingCard", () => {
  const mockHolding: CoinHolding = {
    coinId: "bitcoin",
    quantity: "1.5",
    averageCostBasisUsd: "60000",
    totalCostUsd: "90000",
    currentPriceUsd: "70000",
    currentValueUsd: "105000",
    unrealizedPlUsd: "15000",
    unrealizedPlPercent: "16.67",
    realizedPlUsd: "0",
    allocationPercent: "100.0",
  };

  it("renders positive holding details and fires onSelect callback", async () => {
    const onSelect = jest.fn();
    await render(<HoldingCard holding={mockHolding} onSelect={onSelect} />);

    expect(screen.getByText("BITCOIN")).toBeTruthy();
    expect(screen.getByTestId("holding-card-bitcoin")).toBeTruthy();

    await fireEvent.press(screen.getByTestId("holding-card-bitcoin"));
    expect(onSelect).toHaveBeenCalledWith("bitcoin");
  });

  it("renders negative holding details", async () => {
    const lossHolding: CoinHolding = {
      ...mockHolding,
      coinId: "ethereum",
      unrealizedPlUsd: "-2000",
      unrealizedPlPercent: "-5.0",
    };
    await render(<HoldingCard holding={lossHolding} />);
    expect(screen.getByText("ETHEREUM")).toBeTruthy();
  });
});
