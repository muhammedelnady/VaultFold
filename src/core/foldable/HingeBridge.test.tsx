import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { act, render } from "@testing-library/react-native";

import type { HingeChangeEvent, HingeService } from "@domain/foldable/HingeService";

import { HingeBridge, inferHingeAxis } from "./HingeBridge";
import { resetHingeStore, useHingeStore } from "./hingeStore";

function makeService(available: boolean) {
  let listener: ((event: HingeChangeEvent) => void) | null = null;
  const remove = jest.fn();
  const service: HingeService = {
    isAvailable: () => available,
    getHinge: () => null,
    addHingeListener: (l) => {
      listener = l;
      return { remove };
    },
  };
  return { service, emit: (e: HingeChangeEvent) => listener?.(e), remove };
}

describe("HingeBridge", () => {
  afterEach(() => resetHingeStore());

  it("infers a vertical axis for wide windows and horizontal for tall ones", () => {
    expect(inferHingeAxis(900, 700)).toBe("vertical");
    expect(inferHingeAxis(400, 800)).toBe("horizontal");
  });

  it("publishes hinge events to the store and clears them on unmount", async () => {
    const { service, emit, remove } = makeService(true);
    const view = await render(<HingeBridge service={service} />);

    await act(async () => {
      emit({ hinge: { angle: 110, status: "partiallyOpen" } });
    });
    expect(useHingeStore.getState().hinge).toEqual({ angle: 110, status: "partiallyOpen" });
    expect(useHingeStore.getState().axis).not.toBeNull();

    await view.unmount();
    expect(remove).toHaveBeenCalled();
    expect(useHingeStore.getState().hinge).toBeNull();
  });

  it("does nothing when the hinge sensor is unavailable", async () => {
    const { service } = makeService(false);
    await render(<HingeBridge service={service} />);
    expect(useHingeStore.getState().hinge).toBeNull();
    expect(useHingeStore.getState().axis).toBeNull();
  });
});
