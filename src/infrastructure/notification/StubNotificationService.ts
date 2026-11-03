/**
 * StubNotificationService — test double for NotificationService.
 */
import type {
  NotificationPayload,
  NotificationService,
} from "@domain/notification/NotificationService";

export class StubNotificationService implements NotificationService {
  private permitted: boolean = true;
  readonly scheduled: NotificationPayload[] = [];

  constructor(permitted = true) {
    this.permitted = permitted;
  }

  setPermitted(permitted: boolean): void {
    this.permitted = permitted;
  }

  async requestPermissions(): Promise<boolean> {
    return this.permitted;
  }

  async scheduleNotification(payload: NotificationPayload): Promise<string | null> {
    if (!this.permitted) return null;
    this.scheduled.push(payload);
    return `stub-notif-${this.scheduled.length}`;
  }
}
