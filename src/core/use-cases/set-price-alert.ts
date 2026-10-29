/**
 * SetPriceAlert use case.
 */
import type { OutboxEngine } from "@core/offline/outbox-engine";
import type { AlertRepository, PriceAlert } from "@domain/alert/PriceAlert";
import type { Result } from "@domain/Result";
import { err, ok } from "@domain/Result";
import type { AlertUpsertedPayload, OutboxEntry } from "@domain/sync/outbox-contract";

export interface SetPriceAlertInput {
  readonly coinId: string;
  readonly targetPrice: string;
  readonly direction: "above" | "below";
}

export type SetPriceAlertError =
  | { kind: "validation"; field: "targetPrice"; message: string }
  | { kind: "unknown"; message: string };

export interface SetPriceAlertUseCase {
  readonly handle: (input: SetPriceAlertInput) => Promise<Result<OutboxEntry, SetPriceAlertError>>;
}

export function createSetPriceAlertUseCase(
  alertRepo: AlertRepository,
  outbox: OutboxEngine,
): SetPriceAlertUseCase {
  return {
    handle: async (input: SetPriceAlertInput): Promise<Result<OutboxEntry, SetPriceAlertError>> => {
      if (!/^\d+(\.\d+)?$/.test(input.targetPrice) || Number(input.targetPrice) <= 0) {
        return err({
          kind: "validation",
          field: "targetPrice",
          message: "Price must be a positive number",
        });
      }

      const alertId = `alert_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const alert: PriceAlert = {
        id: alertId,
        coinId: input.coinId,
        direction: input.direction,
        targetPrice: input.targetPrice,
        currency: "usd",
        active: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const upsertResult = await alertRepo.upsert(alert);
      if (upsertResult.kind === "err") {
        return err({
          kind: "unknown",
          message: upsertResult.error.message,
        });
      }

      const payload: AlertUpsertedPayload = {
        id: alert.id,
        coinId: alert.coinId,
        direction: alert.direction,
        targetPrice: alert.targetPrice,
        currency: "usd",
        active: true,
      };

      const entry = outbox.enqueue({
        type: "alert.upsert",
        entityKey: `alert:${input.coinId}`,
        payload,
      });

      return ok(entry);
    },
  };
}
