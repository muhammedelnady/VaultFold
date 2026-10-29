/**
 * Unit tests for currencyStore fiat currency selection and rates.
 */

import { beforeEach, describe, expect, it } from "@jest/globals";

import type { EgpCrossRate } from "@domain/currency/CurrencyTypes";

import {
  bindCurrencyStore,
  CURRENCY_STORE_KEY,
  type CurrencyPersist,
  useCurrencyStore,
} from "./currencyStore";

function createMemoryArea(): CurrencyPersist & { store: Map<string, string> } {
  const store = new Map<string, string>();
  return {
    store,
    getString: (k) => store.get(k),
    set: (k, v) => {
      store.set(k, v);
    },
    remove: (k) => {
      store.delete(k);
    },
  };
}

describe("useCurrencyStore", () => {
  beforeEach(() => {
    useCurrencyStore.setState({
      currency: "usd",
      egpCrossRate: null,
    });
  });

  it("defaults to USD", () => {
    expect(useCurrencyStore.getState().currency).toBe("usd");
    expect(useCurrencyStore.getState().egpCrossRate).toBeNull();
  });

  it("updates currency and persists to bound area", () => {
    const area = createMemoryArea();
    const unbind = bindCurrencyStore(area);

    useCurrencyStore.getState().setCurrency("eur");
    expect(useCurrencyStore.getState().currency).toBe("eur");

    const raw = area.store.get(CURRENCY_STORE_KEY);
    expect(raw).toBeDefined();
    expect(JSON.parse(raw!)).toEqual({
      version: 1,
      currency: "eur",
    });

    unbind();
  });

  it("updates egpCrossRate and rehydrates from storage", () => {
    const area = createMemoryArea();
    const rate: EgpCrossRate = {
      rate: "49.5000",
      timestamp: 1700000000000,
      btcUsd: "68000",
      btcEgp: "3366000",
    };

    const unbind = bindCurrencyStore(area);
    useCurrencyStore.getState().setCurrency("egp");
    useCurrencyStore.getState().setEgpCrossRate(rate);

    expect(useCurrencyStore.getState().egpCrossRate).toEqual(rate);
    unbind();

    useCurrencyStore.setState({ currency: "usd", egpCrossRate: null });
    bindCurrencyStore(area);

    expect(useCurrencyStore.getState().currency).toBe("egp");
    expect(useCurrencyStore.getState().egpCrossRate).toEqual(rate);
  });

  it("handles corrupt JSON in persistence area gracefully", () => {
    const area = createMemoryArea();
    area.store.set(CURRENCY_STORE_KEY, "{ invalid json");

    expect(() => bindCurrencyStore(area)).not.toThrow();
    expect(useCurrencyStore.getState().currency).toBe("usd");
  });

  it("ignores unknown version in persistence area", () => {
    const area = createMemoryArea();
    area.store.set(CURRENCY_STORE_KEY, JSON.stringify({ version: 999 }));

    expect(() => bindCurrencyStore(area)).not.toThrow();
    expect(useCurrencyStore.getState().currency).toBe("usd");
  });
});
