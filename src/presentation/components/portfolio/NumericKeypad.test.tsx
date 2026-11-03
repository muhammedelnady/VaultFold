/**
 * Tests for NumericKeypad component.
 */
import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";

import { NumericKeypad } from "./NumericKeypad";

describe("NumericKeypad", () => {
  it("renders all keys and triggers onDigit and onBackspace", async () => {
    const onDigit = jest.fn();
    const onBackspace = jest.fn();

    await render(<NumericKeypad onDigit={onDigit} onBackspace={onBackspace} />);

    expect(screen.getByTestId("numeric-keypad")).toBeTruthy();

    await fireEvent.press(screen.getByTestId("keypad-1"));
    expect(onDigit).toHaveBeenCalledWith("1");

    await fireEvent.press(screen.getByTestId("keypad-."));
    expect(onDigit).toHaveBeenCalledWith(".");

    await fireEvent.press(screen.getByTestId("keypad-0"));
    expect(onDigit).toHaveBeenCalledWith("0");

    await fireEvent.press(screen.getByTestId("keypad-backspace"));
    expect(onBackspace).toHaveBeenCalledTimes(1);
  });
});
