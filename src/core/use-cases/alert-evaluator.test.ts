/**
 * Tests for price alert evaluation against current market quotes.
 */

import { describe, expect, it, jest } from "@jest/globals";
import * as Notifications from "expo-notifications";

import type { AlertRepository, PriceAlert } from "@domain/alert/PriceAlert";
import { err, ok } from "@domain/Result";

import { evaluateAlerts, evaluateAndDispatchAlerts } from "./alert-evaluator";

describe("evaluateAlerts", () => {
  const alerts: PriceAlert[] = [
    {
      id: "a1",
      coinId: "bitcoin",
      direction: "above",
      targetPrice: "70000",
      currency: "usd",
      active: true,
      createdAt: 1000,
      updatedAt: 1000,
    },
    {
      id: "a2",
      coinId: "bitcoin",
      direction: "below",
      targetPrice: "65000",
      currency: "usd",
      active: true,
      createdAt: 1000,
      updatedAt: 1000,
    },
    {
      id: "a3",
      coinId: "ethereum",
      direction: "above",
      targetPrice: "4000",
      currency: "usd",
      active: false,
      createdAt: 1000,
      updatedAt: 1000,
    },
    {
      id: "a4",
      coinId: "solana",
      direction: "above",
      targetPrice: "not-a-number",
      currency: "usd",
      active: true,
      createdAt: 1000,
      updatedAt: 1000,
    },
  ];

  it("identifies triggered alerts when prices cross targets", () => {
    const prices = {
      bitcoin: "71000",
      ethereum: "4500",
    };

    const triggered = evaluateAlerts(alerts, prices);
    expect(triggered.length).toBe(1);
    expect(triggered[0]!.alert.id).toBe("a1");
    expect(triggered[0]!.currentPrice).toBe("71000");
  });

  it("triggers below alert when price drops", () => {
    const prices = {
      bitcoin: "64500",
    };

    const triggered = evaluateAlerts(alerts, prices);
    expect(triggered.length).toBe(1);
    expect(triggered[0]!.alert.id).toBe("a2");
  });

  it("ignores coins without price data", () => {
    const triggered = evaluateAlerts(alerts, {});
    expect(triggered.length).toBe(0);
  });
});

describe("evaluateAndDispatchAlerts", () => {
  it("dispatches notifications and marks triggered alerts inactive", async () => {
    const activeAlert: PriceAlert = {
      id: "alert-btc",
      coinId: "bitcoin",
      direction: "above",
      targetPrice: "68000",
      currency: "usd",
      active: true,
      createdAt: 1,
      updatedAt: 1,
    };

    const belowAlert: PriceAlert = {
      id: "alert-eth",
      coinId: "ethereum",
      direction: "below",
      targetPrice: "3500",
      currency: "usd",
      active: true,
      createdAt: 1,
      updatedAt: 1,
    };

    const mockUpsert = jest.fn(async () => ok(undefined));
    const mockRepo: AlertRepository = {
      getAll: jest.fn(async () => ok([activeAlert, belowAlert])),
      upsert: mockUpsert,
      delete: jest.fn(async () => ok(undefined)),
    };

    const prices = { bitcoin: "69000", ethereum: "3400" };
    const result = await evaluateAndDispatchAlerts(mockRepo, prices);

    expect(result.length).toBe(2);
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({
          title: "Price Alert: BITCOIN",
          data: { coinId: "bitcoin" },
        }),
      }),
    );
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({
          title: "Price Alert: ETHEREUM",
          body: expect.stringContaining("dropped below"),
          data: { coinId: "ethereum" },
        }),
      }),
    );

    expect(mockUpsert).toHaveBeenCalledTimes(2);
  });

  it("returns empty array on repository error", async () => {
    const mockRepo: AlertRepository = {
      getAll: jest.fn(async () => err({ kind: "unknown" as const, message: "DB Error" })),
      upsert: jest.fn(async () => ok(undefined)),
      delete: jest.fn(async () => ok(undefined)),
    };

    const result = await evaluateAndDispatchAlerts(mockRepo, {
      bitcoin: "70000",
    });
    expect(result).toEqual([]);
  });
});
