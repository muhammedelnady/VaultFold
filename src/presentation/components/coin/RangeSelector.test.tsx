/**
 * Component tests for RangeSelector chart timeframe picker.
 */

import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react-native";

import { RangeSelector } from "./RangeSelector";

describe("RangeSelector", () => {
  it("renders all ranges and triggers onSelectRange when clicked", async () => {
    const onSelect = jest.fn();
    const { getByTestId, getByText } = await render(
      <RangeSelector selectedRange="24h" onSelectRange={onSelect} />,
    );

    expect(getByText("24h")).toBeTruthy();
    expect(getByText("7d")).toBeTruthy();
    expect(getByText("30d")).toBeTruthy();
    expect(getByText("1y")).toBeTruthy();

    fireEvent.press(getByTestId("range-selector-7d"));
    expect(onSelect).toHaveBeenCalledWith("7d");
  });

  it("disables unavailable ranges in offline mode", async () => {
    const onSelect = jest.fn();
    const { getByTestId } = await render(
      <RangeSelector
        selectedRange="24h"
        onSelectRange={onSelect}
        isOffline={true}
        availableOfflineRanges={["24h"]}
      />,
    );

    const btn1y = getByTestId("range-selector-1y");
    fireEvent.press(btn1y);
    expect(onSelect).not.toHaveBeenCalled();
  });
});
