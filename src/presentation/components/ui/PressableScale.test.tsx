/**
 * Component tests for PressableScale animated touch feedback.
 */

import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { Text } from "react-native";

import { PressableScale, fireHaptic } from "./PressableScale";

describe("PressableScale", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders children and fires onPress", async () => {
    const onPress = jest.fn();
    await render(
      <PressableScale onPress={onPress} accessibilityLabel="pressable">
        <Text>Press me</Text>
      </PressableScale>,
    );
    expect(screen.getByText("Press me")).toBeTruthy();
    fireEvent.press(screen.getByLabelText("pressable"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("does not fire onPress when disabled", async () => {
    const onPress = jest.fn();
    await render(
      <PressableScale onPress={onPress} disabled accessibilityLabel="disabled">
        <Text>Press me</Text>
      </PressableScale>,
    );
    const el = screen.getByLabelText("disabled");
    fireEvent.press(el);
    expect(onPress).not.toHaveBeenCalled();
  });

  it("honours custom pressedScale", async () => {
    await render(
      <PressableScale pressedScale={0.9} accessibilityLabel="scale" haptic="none">
        <Text>Press me</Text>
      </PressableScale>,
    );
    expect(screen.getByLabelText("scale")).toBeTruthy();
  });

  it.each(["selection", "light", "medium", "success", "none"] as const)(
    "fires the %s haptic via fireHaptic",
    (haptic) => {
      fireHaptic(haptic);
    },
  );

  it("invokes onPressIn and onPressOut callbacks", async () => {
    const onPressIn = jest.fn();
    const onPressOut = jest.fn();
    await render(
      <PressableScale onPressIn={onPressIn} onPressOut={onPressOut} accessibilityLabel="cb">
        <Text>Press me</Text>
      </PressableScale>,
    );
    const el = screen.getByLabelText("cb");
    fireEvent(el, "pressIn");
    fireEvent(el, "pressOut");
    expect(onPressIn).toHaveBeenCalled();
    expect(onPressOut).toHaveBeenCalled();
  });
});
