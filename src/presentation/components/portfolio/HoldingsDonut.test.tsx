/**
 * Component tests for HoldingsDonut portfolio allocation chart.
 */

import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";

import { HoldingsDonut } from "./HoldingsDonut";

describe("HoldingsDonut", () => {
  const holdings = [
    { coinId: "bitcoin", valueUsd: "7000" },
    { coinId: "ethereum", valueUsd: "3000" },
  ];

  it("renders the donut and legend slices", async () => {
    await render(<HoldingsDonut holdings={holdings} />);
    expect(screen.getByTestId("holdings-donut")).toBeTruthy();
    expect(screen.getByTestId("donut-slice-bitcoin")).toBeTruthy();
    expect(screen.getByTestId("donut-slice-ethereum")).toBeTruthy();
  });

  it("renders empty state when no holdings", async () => {
    await render(<HoldingsDonut holdings={[]} />);
    expect(screen.getByTestId("holdings-donut-empty")).toBeTruthy();
  });

  it("fires onSelect when a legend slice is pressed", async () => {
    const onSelect = jest.fn();
    await render(<HoldingsDonut holdings={holdings} onSelect={onSelect} />);
    fireEvent.press(screen.getByTestId("donut-slice-bitcoin"));
    expect(onSelect).toHaveBeenCalledWith("bitcoin");
  });

  it("renders with a zero-value holding", async () => {
    await render(
      <HoldingsDonut
        holdings={[
          { coinId: "bitcoin", valueUsd: "0" },
          { coinId: "ethereum", valueUsd: "100" },
        ]}
      />,
    );
    expect(screen.getByTestId("holdings-donut")).toBeTruthy();
  });

  it("renders empty state for all-zero holdings", async () => {
    await render(<HoldingsDonut holdings={[{ coinId: "bitcoin", valueUsd: "0" }]} />);
    expect(screen.getByTestId("holdings-donut-empty")).toBeTruthy();
  });
});
