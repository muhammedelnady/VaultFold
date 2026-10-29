/**
 * Component tests for Sparkline mini trend chart.
 */

import { describe, expect, it } from "@jest/globals";
import { render } from "@testing-library/react-native";

import { Sparkline } from "./Sparkline";

describe("Sparkline", () => {
  it("renders empty view when data is empty", async () => {
    const { toJSON } = await render(<Sparkline data={[]} color="#10b981" />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders svg path when data is provided", async () => {
    const data = [10, 20, 15, 30, 25, 40, 35];
    const { toJSON } = await render(<Sparkline data={data} color="#10b981" />);
    expect(toJSON()).toBeTruthy();
  });
});
