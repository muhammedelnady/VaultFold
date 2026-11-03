/**
 * Component tests for PriceAlertSheet configuration bottom sheet.
 */

import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import { overrideForTests } from "@di/container";
import { StubNotificationService } from "@infrastructure/notification/StubNotificationService";

import { PriceAlertSheet } from "./PriceAlertSheet";

describe("PriceAlertSheet", () => {
  let stubNotifications: StubNotificationService;

  beforeEach(() => {
    stubNotifications = new StubNotificationService(true);
    overrideForTests({
      notificationService: stubNotifications,
    });
  });
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
    const requestSpy = jest.spyOn(stubNotifications, "requestPermissions");
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
      expect(requestSpy).toHaveBeenCalled();
    });
  });

  it("does not submit if target price is empty or non-positive", async () => {
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
