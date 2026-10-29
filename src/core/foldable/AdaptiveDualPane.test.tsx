/**
 * Tests for AdaptiveDualPane layout and master-detail width clamping.
 */

import { describe, expect, it } from "@jest/globals";
import { render } from "@testing-library/react-native";
import { Text } from "react-native";

import { AdaptiveDualPane, clampMasterWidth } from "./AdaptiveDualPane";

describe("AdaptiveDualPane", () => {
  it("clampMasterWidth clamps properly between 320 and 420", () => {
    expect(clampMasterWidth(500)).toBe(320);
    expect(clampMasterWidth(1000)).toBe(380);
    expect(clampMasterWidth(2000)).toBe(420);
  });

  it("renders market pane and detail pane for dual pane posture", async () => {
    const { getByText } = await render(
      <AdaptiveDualPane
        marketPane={<Text>Market List</Text>}
        detailPane={<Text>Coin Detail</Text>}
      />,
    );
    expect(getByText("Market List")).toBeDefined();
    expect(getByText("Coin Detail")).toBeDefined();
  });

  it("renders emptyDetail fallback when detailPane is not provided", async () => {
    const { getByText } = await render(
      <AdaptiveDualPane
        marketPane={<Text>Market List</Text>}
        detailPane={null}
        emptyDetail={<Text>Select a coin</Text>}
      />,
    );
    expect(getByText("Market List")).toBeDefined();
    expect(getByText("Select a coin")).toBeDefined();
  });

  it("renders single pane in COMPACT posture override", async () => {
    const { getByText, queryByText } = await render(
      <AdaptiveDualPane
        marketPane={<Text>Market List Only</Text>}
        detailPane={<Text>Should Not Appear</Text>}
        postureOverride="COMPACT"
      />,
    );
    expect(getByText("Market List Only")).toBeDefined();
    expect(queryByText("Should Not Appear")).toBeNull();
  });

  it("renders stacked panes in TABLETOP_MODE posture override with emptyDetail fallback", async () => {
    const { getByText } = await render(
      <AdaptiveDualPane
        marketPane={<Text>Market Bottom</Text>}
        detailPane={null}
        emptyDetail={<Text>Tabletop Empty Detail</Text>}
        postureOverride="TABLETOP_MODE"
      />,
    );
    expect(getByText("Market Bottom")).toBeDefined();
    expect(getByText("Tabletop Empty Detail")).toBeDefined();
  });
});
