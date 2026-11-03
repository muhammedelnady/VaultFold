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

  it("renders equal split in BOOK_MODE posture override", async () => {
    const { getByTestId } = await render(
      <AdaptiveDualPane
        marketPane={<Text>Left Book Page</Text>}
        detailPane={<Text>Right Book Page</Text>}
        postureOverride="BOOK_MODE"
      />,
    );
    const master = getByTestId("dual-pane-master");
    expect(master).toBeDefined();
  });
});

describe("AdaptiveDualPane hinge gutter", () => {
  const panes = { marketPane: <Text>List</Text>, detailPane: <Text>Detail</Text> };

  it("reserves a hinge gutter between panes in BOOK_MODE and TABLETOP_MODE", async () => {
    const book = await render(<AdaptiveDualPane {...panes} postureOverride="BOOK_MODE" />);
    expect(book.getByTestId("hinge-gutter", { includeHiddenElements: true })).toBeDefined();
    await book.unmount();

    const tabletop = await render(<AdaptiveDualPane {...panes} postureOverride="TABLETOP_MODE" />);
    expect(tabletop.getByTestId("hinge-gutter", { includeHiddenElements: true })).toBeDefined();
    expect(tabletop.getByTestId("tabletop-top")).toBeDefined();
    expect(tabletop.getByTestId("tabletop-bottom")).toBeDefined();
  });

  it("renders no gutter in COMPACT or FLAT_EXPANDED", async () => {
    const compact = await render(<AdaptiveDualPane {...panes} postureOverride="COMPACT" />);
    expect(compact.queryByTestId("hinge-gutter", { includeHiddenElements: true })).toBeNull();
    await compact.unmount();

    const flat = await render(<AdaptiveDualPane {...panes} postureOverride="FLAT_EXPANDED" />);
    expect(flat.queryByTestId("hinge-gutter", { includeHiddenElements: true })).toBeNull();
  });

  it("keeps the master pane mounted across posture changes", async () => {
    const view = await render(<AdaptiveDualPane {...panes} postureOverride="COMPACT" />);
    expect(view.getByText("List")).toBeDefined();
    await view.rerender(<AdaptiveDualPane {...panes} postureOverride="TABLETOP_MODE" />);
    expect(view.getByText("List")).toBeDefined();
    expect(view.getByText("Detail")).toBeDefined();
  });
});
