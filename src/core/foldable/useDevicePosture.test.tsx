/**
 * Window-driven posture ladder.
 */
import { describe, expect, it } from "@jest/globals";
import { render } from "@testing-library/react-native";
import { Text } from "react-native";

import { deriveWindowPosture, useDevicePosture } from "./useDevicePosture";

function PostureTester({ override }: { override?: "auto" | "BOOK_MODE" }) {
  const posture = useDevicePosture({ override });
  return <Text testID="posture-text">{`${posture.posture}:${posture.isDualPane}`}</Text>;
}

describe("deriveWindowPosture (window source)", () => {
  it("returns COMPACT for a phone width (390 dp)", () => {
    expect(deriveWindowPosture(390)).toBe("COMPACT");
  });

  it("returns COMPACT just under the 600 dp size-class boundary (599)", () => {
    expect(deriveWindowPosture(599)).toBe("COMPACT");
  });

  it("returns FLAT_EXPANDED at the 600 dp boundary (width no longer compact)", () => {
    expect(deriveWindowPosture(600)).toBe("FLAT_EXPANDED");
  });

  it("returns FLAT_EXPANDED for the expanded width class (840)", () => {
    expect(deriveWindowPosture(840)).toBe("FLAT_EXPANDED");
  });

  it("renders useDevicePosture hook correctly in component", async () => {
    const { getByTestId, rerender } = await render(<PostureTester />);
    expect(getByTestId("posture-text").props["children"]).toContain("FLAT_EXPANDED");

    await rerender(<PostureTester override="BOOK_MODE" />);
    expect(getByTestId("posture-text").props["children"]).toBe("BOOK_MODE:true");
  });
});
