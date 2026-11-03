/**
 * NotificationService port (domain/notification/NotificationService.ts).
 *
 * Abstract boundary for scheduling local notifications without coupling
 * core domain and use-cases to React Native / Expo APIs.
 */
export interface NotificationPayload {
  readonly title: string;
  readonly body: string;
  readonly data?: Record<string, unknown>;
  readonly threadIdentifier?: string;
}

export interface NotificationService {
  readonly requestPermissions: () => Promise<boolean>;
  readonly scheduleNotification: (payload: NotificationPayload) => Promise<string | null>;
}
