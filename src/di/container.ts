/**
 * DI Container — typed, testable dependency graph.
 *
 * Layers: presentation → domain ← data, infrastructure/di outer.
 * Domain has zero React/Expo/RN imports (lint-enforced via import/no-restricted-paths).
 * Every boundary crossing returns `Result<T, AppError>` — no exceptions across layers.
 *
 * The container is a plain object with lazy getters; tests swap implementations
 * via `overrideForTests` (only in test env; prod code never calls it).
 */

import type { QueryClient } from "@tanstack/react-query";

import type { HttpClient } from "@core/network/http-client";
import { Connectivity } from "@core/offline/connectivity";
import type { OutboxEngine } from "@core/offline/outbox-engine";
import type { MmkvArea } from "@core/offline/storage-areas";
import type { AlertRepository } from "@domain/alert/PriceAlert";
import type { CoinRepository } from "@domain/coin/CoinRepository";
import type { LedgerRepository } from "@domain/ledger/LedgerEntry";
import type { MarketRepository } from "@domain/market/MarketRepository";
import type { LedgerRemote } from "@domain/remote/LedgerRemote";
import type { BiometricsService } from "@domain/security/BiometricsService";

export interface Container {
  readonly marketRepository: MarketRepository;
  readonly coinRepository: CoinRepository;
  readonly alertRepository: AlertRepository;
  readonly ledgerRepository: LedgerRepository;
  readonly ledgerRemote: LedgerRemote;
  readonly biometricsService: BiometricsService;
  readonly outboxEngine: OutboxEngine;
  readonly httpClient: HttpClient;
  readonly connectivity: Connectivity;
  readonly queryClient: QueryClient;
  readonly cacheArea: MmkvArea;
  readonly vaultArea: MmkvArea;
  readonly remoteSimArea: MmkvArea;
}

let prodContainer: Container | null = null;

const testOverrides: Partial<Container> = {};

export function overrideForTests(overrides: Partial<Container>): void {
  if (process.env.NODE_ENV !== "test" && process.env.EXPO_PUBLIC_E2E !== "1") {
    throw new Error("overrideForTests only allowed in test/E2E environment");
  }
  Object.assign(testOverrides, overrides as Record<string, unknown>);
}

export function clearTestOverrides(): void {
  (Object.keys(testOverrides) as (keyof Container)[]).forEach((k) => delete testOverrides[k]);
}

export function getContainer(): Container {
  if (Object.keys(testOverrides).length > 0) {
    return { ...prodContainer!, ...testOverrides } as Container;
  }
  if (!prodContainer) {
    throw new Error("DI container not initialized — call initContainer() at bootstrap");
  }
  return prodContainer;
}

export function hasInitializedContainer(): boolean {
  return prodContainer !== null;
}

export function initContainer(container: Container): void {
  if (prodContainer) {
    throw new Error("DI container already initialized");
  }
  prodContainer = container;
}

export function resetContainerForTests(): void {
  prodContainer = null;
  clearTestOverrides();
}

export function useMarketRepository(): MarketRepository {
  return getContainer().marketRepository;
}

export function useCoinRepository(): CoinRepository {
  return getContainer().coinRepository;
}

export function useAlertRepository(): AlertRepository {
  return getContainer().alertRepository;
}

export function useLedgerRepository(): LedgerRepository {
  return getContainer().ledgerRepository;
}

export function useLedgerRemote(): LedgerRemote {
  return getContainer().ledgerRemote;
}

export function useBiometricsService(): BiometricsService {
  return getContainer().biometricsService;
}

export function useOutboxEngine(): OutboxEngine {
  return getContainer().outboxEngine;
}

export function useHttpClient(): HttpClient {
  return getContainer().httpClient;
}

export function useConnectivity(): Connectivity {
  return getContainer().connectivity;
}

export function useQueryClient(): QueryClient {
  return getContainer().queryClient;
}

export function useCacheArea(): MmkvArea {
  return getContainer().cacheArea;
}

export function useVaultArea(): MmkvArea {
  return getContainer().vaultArea;
}

export function useRemoteSimArea(): MmkvArea {
  return getContainer().remoteSimArea;
}
