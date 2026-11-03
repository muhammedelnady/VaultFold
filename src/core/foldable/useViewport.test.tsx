/**
 * Tests for the useViewport hook and window dimension metrics.
 */

import { describe, expect, it } from "@jest/globals";
import { render } from "@testing-library/react-native";
import { Text } from "react-native";

import { useViewport } from "./useViewport";

function ViewportTester() {
  const { width, height } = useViewport();
  return <Text testID="viewport">{`${width}x${height}`}</Text>;
}

describe("useViewport", () => {
  it("returns width and height from useWindowDimensions", async () => {
    const { getByTestId } = await render(<ViewportTester />);
    const text = getByTestId("viewport").props["children"];
    const [w, h] = String(text).split("x").map(Number);
    expect(w).toBeGreaterThan(0);
    expect(h).toBeGreaterThan(0);
  });
});
