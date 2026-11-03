/**
 * Component tests for CoinStats market statistics grid.
 */

import { describe, expect, it } from "@jest/globals";
import { render } from "@testing-library/react-native";

import type { CoinDetail } from "@domain/coin/CoinDetail";

import { CoinStats } from "./CoinStats";

const mockCoin: CoinDetail = {
  id: "bitcoin",
  name: "Bitcoin",
  symbol: "btc",
  marketCapRank: 1,
  priceUsd: "68000.00",
  priceChange24h: "2.5",
  priceChange7d: "4.5",
  priceChange30d: "-1.2",
  priceChange1y: "120.0",
  high24h: "69000.00",
  low24h: "67000.00",
  marketCapUsd: "1350000000000",
  fullyDilutedUsd: "1420000000000",
  totalVolume24h: "32000000000",
  circulatingSupply: "19700000",
  totalSupply: "21000000",
  lastUpdated: 1700000000000,
};

describe("CoinStats", () => {
  it("renders market stats grid with supply and volume", async () => {
    const { getByText } = await render(<CoinStats coin={mockCoin} />);

    expect(getByText("Market Statistics")).toBeTruthy();
    expect(getByText("Market Cap")).toBeTruthy();
    expect(getByText("24h Volume")).toBeTruthy();
    expect(getByText("Circulating Supply")).toBeTruthy();
    expect(getByText("Total Supply")).toBeTruthy();
    expect(getByText("7d Change")).toBeTruthy();
  });

  it("handles negative percent changes with error color", async () => {
    const negativeCoin: CoinDetail = {
      ...mockCoin,
      priceChange7d: "-4.5",
    };
    const { getByText } = await render(<CoinStats coin={negativeCoin} />);
    expect(getByText(/▼ -4\.50%/)).toBeTruthy();
  });

  it("handles null total supply with Unlimited fallback", async () => {
    const infiniteSupplyCoin: CoinDetail = {
      ...mockCoin,
      totalSupply: null,
    };
    const { getByText } = await render(<CoinStats coin={infiniteSupplyCoin} />);
    expect(getByText("Unlimited")).toBeTruthy();
  });
});
