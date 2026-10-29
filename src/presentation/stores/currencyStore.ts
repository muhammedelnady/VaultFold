/**
 * Currency store.
 * Manages user's selected display currency (USD, EUR, SAR, EGP) and cached EGP cross-rate.
 * Persists in caller-provided MMKV area.
 */
import { create } from "zustand";

import type { EgpCrossRate, SupportedCurrency } from "@domain/currency/CurrencyTypes";

export const CURRENCY_STORE_KEY = "vaultfold.currency.v1";

export interface CurrencyPersist {
  readonly getString: (key: string) => string | undefined;
  readonly set: (key: string, value: string) => void;
  readonly remove: (key: string) => void;
}

interface PersistedCurrency {
  readonly version: 1;
  readonly currency: SupportedCurrency;
  readonly egpCrossRate?: EgpCrossRate;
}

interface CurrencyState {
  readonly currency: SupportedCurrency;
  readonly egpCrossRate: EgpCrossRate | null;
  readonly setCurrency: (currency: SupportedCurrency) => void;
  readonly setEgpCrossRate: (rate: EgpCrossRate) => void;
}

let boundArea: CurrencyPersist | null = null;

function writePersisted(state: {
  currency: SupportedCurrency;
  egpCrossRate: EgpCrossRate | null;
}): void {
  if (boundArea === null) {
    return;
  }
  const payload: PersistedCurrency = {
    version: 1,
    currency: state.currency,
    egpCrossRate: state.egpCrossRate ?? undefined,
  };
  boundArea.set(CURRENCY_STORE_KEY, JSON.stringify(payload));
}

export const useCurrencyStore = create<CurrencyState>((set) => ({
  currency: "usd",
  egpCrossRate: null,
  setCurrency: (currency) => {
    set({ currency });
    writePersisted(useCurrencyStore.getState());
  },
  setEgpCrossRate: (egpCrossRate) => {
    set({ egpCrossRate });
    writePersisted(useCurrencyStore.getState());
  },
}));

export function bindCurrencyStore(area: CurrencyPersist): () => void {
  boundArea = area;
  const raw = area.getString(CURRENCY_STORE_KEY);
  if (raw !== undefined) {
    try {
      const parsed = JSON.parse(raw) as PersistedCurrency;
      if (parsed.version === 1 && parsed.currency) {
        useCurrencyStore.setState({
          currency: parsed.currency,
          egpCrossRate: parsed.egpCrossRate ?? null,
        });
      }
    } catch {}
  }

  return () => {
    boundArea = null;
  };
}

export const bindCurrencyPersistence = bindCurrencyStore;
