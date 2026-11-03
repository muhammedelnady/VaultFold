/**
 * Unit tests for ExpoNotificationService infrastructure adapter.
 */
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import * as Notifications from "expo-notifications";

import { ExpoNotificationService } from "./ExpoNotificationService";

describe("ExpoNotificationService", () => {
  let service: ExpoNotificationService;

  beforeEach(() => {
    service = new ExpoNotificationService();
  });

  it("sets notification handler that returns foreground alert behavior", async () => {
    const handlerArg = (
      Notifications.setNotificationHandler as jest.MockedFunction<
        typeof Notifications.setNotificationHandler
      >
    ).mock.calls[0]?.[0];
    if (handlerArg?.handleNotification) {
      const behavior = await handlerArg.handleNotification({} as never);
      expect(behavior).toEqual({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      });
    }
  });

  it("requests permissions when already granted", async () => {
    (
      Notifications.getPermissionsAsync as jest.MockedFunction<
        typeof Notifications.getPermissionsAsync
      >
    ).mockResolvedValueOnce({
      status: Notifications.PermissionStatus.GRANTED,
      granted: true,
      canAskAgain: true,
      expires: "never",
    });

    const granted = await service.requestPermissions();
    expect(granted).toBe(true);
    expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
  });

  it("requests permissions when not granted", async () => {
    (
      Notifications.getPermissionsAsync as jest.MockedFunction<
        typeof Notifications.getPermissionsAsync
      >
    ).mockResolvedValueOnce({
      status: Notifications.PermissionStatus.DENIED,
      granted: false,
      canAskAgain: true,
      expires: "never",
    });
    (
      Notifications.requestPermissionsAsync as jest.MockedFunction<
        typeof Notifications.requestPermissionsAsync
      >
    ).mockResolvedValueOnce({
      status: Notifications.PermissionStatus.GRANTED,
      granted: true,
      canAskAgain: true,
      expires: "never",
    });

    const granted = await service.requestPermissions();
    expect(granted).toBe(true);
    expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
  });

  it("handles requestPermissions error gracefully", async () => {
    (
      Notifications.getPermissionsAsync as jest.MockedFunction<
        typeof Notifications.getPermissionsAsync
      >
    ).mockRejectedValueOnce(new Error("Permissions error"));

    const granted = await service.requestPermissions();
    expect(granted).toBe(false);
  });

  it("schedules notification with threadIdentifier and data", async () => {
    const id = await service.scheduleNotification({
      title: "Bitcoin alert",
      body: "Bitcoin crossed $70k",
      data: { coinId: "bitcoin" },
      threadIdentifier: "price-alert-bitcoin",
    });

    expect(id).toBe("test-notification-id");
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
      content: {
        title: "Bitcoin alert",
        body: "Bitcoin crossed $70k",
        data: { coinId: "bitcoin" },
        threadIdentifier: "price-alert-bitcoin",
      },
      trigger: null,
    });
  });

  it("schedules notification without optional fields", async () => {
    const id = await service.scheduleNotification({
      title: "Alert",
      body: "Notice",
    });

    expect(id).toBe("test-notification-id");
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
      content: {
        title: "Alert",
        body: "Notice",
        data: {},
      },
      trigger: null,
    });
  });

  it("handles scheduleNotification error gracefully", async () => {
    (
      Notifications.scheduleNotificationAsync as jest.MockedFunction<
        typeof Notifications.scheduleNotificationAsync
      >
    ).mockRejectedValueOnce(new Error("Scheduling failed"));

    const id = await service.scheduleNotification({
      title: "Alert",
      body: "Notice",
    });

    expect(id).toBeNull();
  });
});
