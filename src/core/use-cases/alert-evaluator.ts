/**
 * Local Alert Evaluator & Notifications Dispatcher.
 * Evaluates active user price alerts against current market prices and dispatches notifications.
 */
import { Decimal } from "decimal.js-light";
import * as Notifications from "expo-notifications";

import type { AlertRepository, PriceAlert } from "@domain/alert/PriceAlert";

export interface TriggeredAlert {
  readonly alert: PriceAlert;
  readonly currentPrice: string;
}

export function evaluateAlerts(
  alerts: readonly PriceAlert[],
  currentPricesUsd: Record<string, string>,
): readonly TriggeredAlert[] {
  const triggered: TriggeredAlert[] = [];

  for (const alert of alerts) {
    if (!alert.active) continue;

    const priceStr = currentPricesUsd[alert.coinId];
    if (!priceStr) continue;

    try {
      const current = new Decimal(priceStr);
      const target = new Decimal(alert.targetPrice);

      if (alert.direction === "above" && current.gte(target)) {
        triggered.push({ alert, currentPrice: priceStr });
      } else if (alert.direction === "below" && current.lte(target)) {
        triggered.push({ alert, currentPrice: priceStr });
      }
    } catch {}
  }

  return triggered;
}

export async function evaluateAndDispatchAlerts(
  alertRepo: AlertRepository,
  currentPricesUsd: Record<string, string>,
): Promise<readonly TriggeredAlert[]> {
  const alertsResult = await alertRepo.getAll();
  if (alertsResult.kind === "err") return [];

  const triggered = evaluateAlerts(alertsResult.value, currentPricesUsd);

  for (const { alert, currentPrice } of triggered) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `Price Alert: ${alert.coinId.toUpperCase()}`,
          body: `${alert.coinId.toUpperCase()} has ${
            alert.direction === "above" ? "risen above" : "dropped below"
          } $${alert.targetPrice} (now $${currentPrice})`,
          data: { coinId: alert.coinId },
        },
        trigger: null,
      });
    } catch {}

    const updated: PriceAlert = {
      ...alert,
      active: false,
      updatedAt: Date.now(),
    };
    await alertRepo.upsert(updated);
  }

  return triggered;
}
