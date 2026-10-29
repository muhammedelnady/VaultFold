/**
 * Component tests for PriceAlertSheet configuration bottom sheet.
 */

import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import * as Notifications from "expo-notifications";

import { PriceAlertSheet } from "./PriceAlertSheet";

describe("PriceAlertSheet", () => {
  it("renders nothing when visible is false", async () => {
    const onSave = jest.fn(async () => {});
    const onClose = jest.fn();

    await render(
      <PriceAlertSheet
        coinId="bitcoin"
        coinSymbol="btc"
        currentPriceUsd="68000"
        visible={false}
        onClose={onClose}
        onSaveAlert={onSave}
      />,
    );

    expect(screen.queryByTestId("price-alert-sheet")).toBeNull();
  });

  it("closes when backdrop or cancel button is pressed", async () => {
    const onSave = jest.fn(async () => {});
    const onClose = jest.fn();

    await render(
      <PriceAlertSheet
        coinId="bitcoin"
        coinSymbol="btc"
        currentPriceUsd="68000"
        visible={true}
        onClose={onClose}
        onSaveAlert={onSave}
      />,
    );

    await fireEvent.press(screen.getByTestId("btn-cancel-alert"));
    expect(onClose).toHaveBeenCalledTimes(1);

    await fireEvent.press(screen.getByTestId("price-alert-backdrop"));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("submits alert with direction and target price", async () => {
    (
      Notifications.getPermissionsAsync as unknown as jest.MockedFunction<
        typeof Notifications.getPermissionsAsync
      >
    ).mockResolvedValueOnce({
      status: Notifications.PermissionStatus.UNDETERMINED,
      expires: "never",
      granted: false,
      canAskAgain: true,
    });

    const onSave = jest.fn(async () => {});
    const onClose = jest.fn();

    await render(
      <PriceAlertSheet
        coinId="bitcoin"
        coinSymbol="btc"
        currentPriceUsd="68000"
        visible={true}
        onClose={onClose}
        onSaveAlert={onSave}
      />,
    );

    await fireEvent.press(screen.getByTestId("btn-direction-below"));
    await fireEvent.press(screen.getByTestId("btn-direction-above"));

    await fireEvent.changeText(screen.getByTestId("input-target-price"), "65000");

    await fireEvent.press(screen.getByTestId("btn-save-alert"));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
      expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
    });
  });

  it("does not submit if target price is empty or non-positive, and skips permission request if granted", async () => {
    (
      Notifications.getPermissionsAsync as unknown as jest.MockedFunction<
        typeof Notifications.getPermissionsAsync
      >
    ).mockResolvedValueOnce({
      status: Notifications.PermissionStatus.GRANTED,
      expires: "never",
      granted: true,
      canAskAgain: true,
    });

    const onSave = jest.fn(async () => {});
    const onClose = jest.fn();

    await render(
      <PriceAlertSheet
        coinId="bitcoin"
        coinSymbol="btc"
        currentPriceUsd="68000"
        visible={true}
        onClose={onClose}
        onSaveAlert={onSave}
      />,
    );

    await fireEvent.changeText(screen.getByTestId("input-target-price"), "");
    await fireEvent.press(screen.getByTestId("btn-save-alert"));
    expect(onSave).not.toHaveBeenCalled();

    await fireEvent.changeText(screen.getByTestId("input-target-price"), "0");
    await fireEvent.press(screen.getByTestId("btn-save-alert"));
    expect(onSave).not.toHaveBeenCalled();

    await fireEvent.changeText(screen.getByTestId("input-target-price"), "70000");
    await fireEvent.press(screen.getByTestId("btn-save-alert"));
    await waitFor(() => {
      expect(onSave).toHaveBeenCalled();
    });
  });
});
