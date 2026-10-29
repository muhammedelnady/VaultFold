/**
 * Unit tests for InteractiveChart component.
 */
import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react-native";

import { buildPanGesture, InteractiveChart } from "./InteractiveChart";

describe("InteractiveChart", () => {
  const mockPoints: [number, number][] = [
    [1700000000, 65000],
    [1700010000, 65500],
    [1700020000, 66000],
    [1700030000, 65800],
    [1700040000, 67000],
  ];

  it("buildPanGesture handles onBegin, onUpdate, onEnd, and onFinalize", () => {
    const onScrubUpdate = jest.fn();
    const onScrubEnd = jest.fn();
    const gesture = buildPanGesture(onScrubUpdate, onScrubEnd);

    const handlers = (
      gesture as unknown as {
        handlers: {
          onBegin?: (e: { x: number }) => void;
          onUpdate?: (e: { x: number }) => void;
          onEnd?: () => void;
          onFinalize?: () => void;
        };
      }
    ).handlers;
    if (handlers) {
      handlers.onBegin?.({ x: 50 });
      expect(onScrubUpdate).toHaveBeenCalledWith(50);

      handlers.onUpdate?.({ x: 100 });
      expect(onScrubUpdate).toHaveBeenCalledWith(100);

      handlers.onEnd?.();
      expect(onScrubEnd).toHaveBeenCalledTimes(1);

      handlers.onFinalize?.();
      expect(onScrubEnd).toHaveBeenCalledTimes(2);
    }
  });

  it("renders chart surface with points and supports gesture scrubbing", async () => {
    const { getByTestId, queryByTestId } = await render(
      <InteractiveChart points={mockPoints} isPositive={true} />,
    );

    const chart = getByTestId("interactive-chart");
    expect(chart).toBeTruthy();
    expect(queryByTestId("chart-scrub-badge")).toBeNull();

    await fireEvent(chart, "touchMove", { nativeEvent: { locationX: 100 } });
    expect(getByTestId("chart-scrub-badge")).toBeTruthy();

    await fireEvent(chart, "touchEnd");
    expect(queryByTestId("chart-scrub-badge")).toBeNull();
  });

  it("renders designed empty state when unavailable offline", async () => {
    const { getByTestId, getByText } = await render(
      <InteractiveChart points={[]} isUnavailableOffline={true} />,
    );

    expect(getByTestId("chart-offline-empty")).toBeTruthy();
    expect(getByText("Chart range unavailable offline")).toBeTruthy();
  });

  it("renders no data empty state when points array is empty", async () => {
    const { getByTestId, getByText } = await render(
      <InteractiveChart points={[]} isUnavailableOffline={false} />,
    );

    expect(getByTestId("chart-no-data")).toBeTruthy();
    expect(getByText("No chart data available")).toBeTruthy();
  });

  it("renders with flat (constant) price data", async () => {
    const flatPoints: [number, number][] = [
      [1700000000, 65000],
      [1700010000, 65000],
      [1700020000, 65000],
    ];
    const { getByTestId } = await render(
      <InteractiveChart points={flatPoints} isPositive={true} />,
    );
    expect(getByTestId("interactive-chart")).toBeTruthy();
  });

  it("scrubs to the same point twice without crashing", async () => {
    const { getByTestId, queryByTestId } = await render(
      <InteractiveChart points={mockPoints} isPositive={true} />,
    );
    const chart = getByTestId("interactive-chart");
    await fireEvent(chart, "touchMove", { nativeEvent: { locationX: 100 } });
    expect(getByTestId("chart-scrub-badge")).toBeTruthy();
    await fireEvent(chart, "touchMove", { nativeEvent: { locationX: 100 } });
    await fireEvent(chart, "touchEnd");
    expect(queryByTestId("chart-scrub-badge")).toBeNull();
  });

  it("scrubs at the left edge (first point)", async () => {
    const { getByTestId } = await render(
      <InteractiveChart points={mockPoints} isPositive={false} />,
    );
    const chart = getByTestId("interactive-chart");
    await fireEvent(chart, "touchMove", { nativeEvent: { locationX: 0 } });
    expect(getByTestId("chart-scrub-badge")).toBeTruthy();
    await fireEvent(chart, "touchEnd");
  });
});
