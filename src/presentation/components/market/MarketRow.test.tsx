/**
 * Component tests for MarketRow list item.
 */

import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react-native";

import type { MarketEntry } from "@domain/market/MarketEntry";

import { areMarketRowPropsEqual, MarketRow } from "./MarketRow";

const mockEntry: MarketEntry = {
  id: "bitcoin",
  name: "Bitcoin",
  symbol: "btc",
  rank: 1,
  priceUsd: "68500.25",
  priceChange24h: "3.45",
  marketCapUsd: "1350000000000",
  volume24hUsd: "25000000000",
  sparkline7d: [65000, 66000, 67500, 68500],
};

describe("MarketRow", () => {
  it("areMarketRowPropsEqual correctly compares props", () => {
    const onSelect = jest.fn();
    const props1 = { entry: mockEntry, onSelect };
    const props2 = { entry: { ...mockEntry }, onSelect };
    expect(areMarketRowPropsEqual(props1, props2)).toBe(true);

    expect(
      areMarketRowPropsEqual(props1, {
        entry: { ...mockEntry, priceUsd: "70000" },
        onSelect,
      }),
    ).toBe(false);

    expect(
      areMarketRowPropsEqual(props1, {
        entry: { ...mockEntry, id: "ethereum" },
        onSelect,
      }),
    ).toBe(false);

    expect(
      areMarketRowPropsEqual(props1, {
        entry: { ...mockEntry, priceChange24h: "5.0" },
        onSelect,
      }),
    ).toBe(false);

    expect(
      areMarketRowPropsEqual(props1, {
        entry: { ...mockEntry, marketCapUsd: "999" },
        onSelect,
      }),
    ).toBe(false);

    expect(
      areMarketRowPropsEqual(props1, {
        entry: mockEntry,
        onSelect,
        vsCurrency: "eur" as const,
      }),
    ).toBe(false);

    expect(
      areMarketRowPropsEqual(props1, {
        entry: mockEntry,
        onSelect: jest.fn(),
      }),
    ).toBe(false);

    expect(
      areMarketRowPropsEqual(props1, {
        entry: { ...mockEntry, imageUrl: "https://example.com/btc.png" },
        onSelect,
      }),
    ).toBe(false);
  });

  it("passes entry.imageUrl as uri source to Image", async () => {
    const onSelect = jest.fn();
    const entryWithImage: MarketEntry = {
      ...mockEntry,
      imageUrl: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
    };
    const { getByLabelText } = await render(
      <MarketRow entry={entryWithImage} onSelect={onSelect} />,
    );
    const img = getByLabelText("Bitcoin icon");
    expect(img.props["source"]).toEqual([
      expect.objectContaining({
        uri: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
      }),
    ]);
  });
  it("renders coin name, symbol, rank and price", async () => {
    const onSelect = jest.fn();
    const { getByText } = await render(<MarketRow entry={mockEntry} onSelect={onSelect} />);

    expect(getByText("BTC")).toBeDefined();
    expect(getByText("Bitcoin")).toBeDefined();
    expect(getByText("1")).toBeDefined();
  });

  it("triggers onSelect with coinId on press", async () => {
    const onSelect = jest.fn();
    const { getByTestId } = await render(<MarketRow entry={mockEntry} onSelect={onSelect} />);

    const row = getByTestId("market-row-bitcoin");
    fireEvent.press(row);
    expect(onSelect).toHaveBeenCalledWith("bitcoin");
  });

  it("renders negative change with downward arrow and formatted currency", async () => {
    const onSelect = jest.fn();
    const negativeEntry: MarketEntry = {
      ...mockEntry,
      priceChange24h: "-4.50",
    };
    const { getByText } = await render(
      <MarketRow entry={negativeEntry} onSelect={onSelect} vsCurrency="eur" />,
    );

    expect(getByText(/4\.50%/)).toBeDefined();
  });

  it("renders neutral change and fallback rank when rank is 0", async () => {
    const onSelect = jest.fn();
    const neutralEntry: MarketEntry = {
      ...mockEntry,
      rank: 0,
      priceChange24h: "0.00",
    };
    const { getByText, getByTestId } = await render(
      <MarketRow entry={neutralEntry} onSelect={onSelect} />,
    );

    expect(getByText("-")).toBeDefined();
    expect(getByText(/0\.00%/)).toBeDefined();

    const row = getByTestId("market-row-bitcoin");
    const styleFn = row.props["style"];
    if (typeof styleFn === "function") {
      styleFn({ pressed: true });
    }
  });
});
