import { afterEach, describe, expect, it } from "@jest/globals";
import { act, render } from "@testing-library/react-native";
import { Text } from "react-native";

import { resetHingeStore, useHingeStore } from "./hingeStore";
import { resetPostureOverride } from "./postureStore";
import { useDevicePosture } from "./useDevicePosture";

function Probe() {
  const info = useDevicePosture();
  return <Text testID="probe">{`${info.posture}:${info.source}`}</Text>;
}

describe("useDevicePosture with a live hinge", () => {
  afterEach(async () => {
    await act(async () => {
      resetHingeStore();
      resetPostureOverride();
    });
  });

  it("switches to TABLETOP_MODE (source native) when a horizontal half-open hinge is published", async () => {
    const view = await render(<Probe />);
    await act(async () => {
      useHingeStore.getState().setHinge({ angle: 100, status: "partiallyOpen" }, "horizontal");
    });
    expect(view.getByTestId("probe").props["children"]).toBe("TABLETOP_MODE:native");
  });

  it("returns to the window path when the hinge clears", async () => {
    const view = await render(<Probe />);
    await act(async () => {
      useHingeStore.getState().setHinge({ angle: 100, status: "partiallyOpen" }, "horizontal");
    });
    await act(async () => {
      useHingeStore.getState().setHinge(null, null);
    });
    expect(view.getByTestId("probe").props["children"]).toMatch(/:window$/);
  });
});
