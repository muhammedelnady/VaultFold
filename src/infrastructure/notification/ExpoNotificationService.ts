/**
 * ExpoNotificationService — infrastructure adapter wrapping `expo-notifications`.
 * Implements SDK 58 threadIdentifier grouping and notification handler.
 */
import * as Notifications from "expo-notifications";

import type {
  NotificationPayload,
  NotificationService,
} from "@domain/notification/NotificationService";

let handlerConfigured = false;

function ensureNotificationHandler(): void {
  if (!handlerConfigured) {
    handlerConfigured = true;
    try {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: false,
          shouldSetBadge: false,
        }),
      });
    } catch {}
  }
}

export class ExpoNotificationService implements NotificationService {
  constructor() {
    ensureNotificationHandler();
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      return finalStatus === "granted";
    } catch {
      return false;
    }
  }

  async scheduleNotification(payload: NotificationPayload): Promise<string | null> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: payload.title,
          body: payload.body,
          data: payload.data ?? {},
          ...(payload.threadIdentifier ? { threadIdentifier: payload.threadIdentifier } : {}),
        },
        trigger: null,
      });
      return notificationId;
    } catch {
      return null;
    }
  }
}
