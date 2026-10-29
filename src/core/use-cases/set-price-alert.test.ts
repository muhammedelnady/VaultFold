/**
 * Tests for createSetPriceAlertUseCase.
 */
import { describe, expect, it, jest } from "@jest/globals";

import type { OutboxEngine } from "@core/offline/outbox-engine";
import type { AlertRepository, PriceAlert } from "@domain/alert/PriceAlert";
import { err, ok } from "@domain/Result";

import { createSetPriceAlertUseCase } from "./set-price-alert";

describe("createSetPriceAlertUseCase", () => {
  it("rejects non-numeric or non-positive target prices", async () => {
    const mockAlertRepo: AlertRepository = {
      getAll: jest.fn(async () => ok([])),
      upsert: jest.fn(async (_alert: PriceAlert) => ok(undefined)),
      delete: jest.fn(async (_id: string) => ok(undefined)),
    };
    const mockOutbox: OutboxEngine = {
      enqueue: jest.fn(),
    } as unknown as OutboxEngine;

    const useCase = createSetPriceAlertUseCase(mockAlertRepo, mockOutbox);

    const res1 = await useCase.handle({
      coinId: "bitcoin",
      targetPrice: "invalid",
      direction: "above",
    });
    expect(res1.kind).toBe("err");
    if (res1.kind === "err") {
      expect(res1.error.kind).toBe("validation");
    }

    const res2 = await useCase.handle({
      coinId: "bitcoin",
      targetPrice: "-10",
      direction: "above",
    });
    expect(res2.kind).toBe("err");

    const res3 = await useCase.handle({
      coinId: "bitcoin",
      targetPrice: "0",
      direction: "above",
    });
    expect(res3.kind).toBe("err");
  });

  it("successfully persists alert, enqueues outbox entry, and returns ok", async () => {
    const mockUpsert = jest.fn(async (_alert: PriceAlert) => ok(undefined));
    const mockAlertRepo: AlertRepository = {
      getAll: jest.fn(async () => ok([])),
      upsert: mockUpsert,
      delete: jest.fn(async (_id: string) => ok(undefined)),
    };

    const mockEntry = {
      id: "outbox-1",
      type: "alert.upsert" as const,
      entityKey: "alert:bitcoin",
      payload: {
        id: "alert-1",
        coinId: "bitcoin",
        direction: "above" as const,
        targetPrice: "70000",
        currency: "usd" as const,
        active: true,
      },
      createdAt: 1000,
      attempts: 0,
      nextAttemptAt: null,
      status: "pending" as const,
    };
    const mockEnqueue = jest.fn((_input: unknown) => mockEntry);
    const mockOutbox: OutboxEngine = {
      enqueue: mockEnqueue,
    } as unknown as OutboxEngine;

    const useCase = createSetPriceAlertUseCase(mockAlertRepo, mockOutbox);

    const res = await useCase.handle({
      coinId: "bitcoin",
      targetPrice: "70000",
      direction: "above",
    });

    expect(res.kind).toBe("ok");
    if (res.kind === "ok") {
      expect(res.value).toEqual(mockEntry);
    }

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        coinId: "bitcoin",
        direction: "above",
        targetPrice: "70000",
        currency: "usd",
        active: true,
      }),
    );

    const createdAlert = (mockUpsert.mock.calls[0] as unknown as [PriceAlert])[0];
    expect(createdAlert.id).toMatch(/^alert_\d+_/);

    expect(mockEnqueue).toHaveBeenCalledWith({
      type: "alert.upsert",
      entityKey: "alert:bitcoin",
      payload: {
        id: createdAlert.id,
        coinId: "bitcoin",
        direction: "above",
        targetPrice: "70000",
        currency: "usd",
        active: true,
      },
    });
  });

  it("returns error if alert repo upsert fails", async () => {
    const mockAlertRepo: AlertRepository = {
      getAll: jest.fn(async () => ok([])),
      upsert: jest.fn(async (_alert: PriceAlert) =>
        err({ kind: "unknown" as const, message: "Storage error" }),
      ),
      delete: jest.fn(async (_id: string) => ok(undefined)),
    };
    const mockEnqueue = jest.fn();
    const mockOutbox: OutboxEngine = {
      enqueue: mockEnqueue,
    } as unknown as OutboxEngine;

    const useCase = createSetPriceAlertUseCase(mockAlertRepo, mockOutbox);

    const res = await useCase.handle({
      coinId: "bitcoin",
      targetPrice: "70000",
      direction: "above",
    });

    expect(res.kind).toBe("err");
    if (res.kind === "err") {
      expect(res.error.kind).toBe("unknown");
    }
    expect(mockEnqueue).not.toHaveBeenCalled();
  });
});
