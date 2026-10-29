/**
 * Unit tests for DI container dependency resolution and test overrides.
 */

import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import {
  clearTestOverrides,
  getContainer,
  hasInitializedContainer,
  initContainer,
  overrideForTests,
  resetContainerForTests,
  useAlertRepository,
  useCacheArea,
  useCoinRepository,
  useConnectivity,
  useHttpClient,
  useLedgerRemote,
  useLedgerRepository,
  useOutboxEngine,
  useBiometricsService,
  useMarketRepository,
  useQueryClient,
  useRemoteSimArea,
  useVaultArea,
  type Container,
} from "./container";

describe("DI Container", () => {
  const mockContainer: Container = {
    marketRepository: { getMarkets: jest.fn(), getMarketChart: jest.fn() },
    coinRepository: { getCoinDetail: jest.fn() },
    alertRepository: { getAll: jest.fn(), upsert: jest.fn(), delete: jest.fn() },
    ledgerRepository: {
      getAllEntries: jest.fn(),
      appendEntry: jest.fn(),
      reviseEntry: jest.fn(),
      tombstoneEntry: jest.fn(),
      getWatchlist: jest.fn(),
      setWatchlist: jest.fn(),
      toggleWatch: jest.fn(),
    },
    ledgerRemote: { push: jest.fn(), pull: jest.fn() },
    biometricsService: { getCapabilities: jest.fn(), authenticate: jest.fn() },
    outboxEngine: {
      enqueue: jest.fn(),
      flush: jest.fn(),
      flushSoon: jest.fn(),
      retry: jest.fn(),
      retryAllFailed: jest.fn(),
      clearFailed: jest.fn(),
      discard: jest.fn(),
      recoverOrphans: jest.fn(),
      subscribe: jest.fn(),
      snapshot: jest.fn(),
      list: jest.fn(),
    } as never,
    httpClient: { get: jest.fn() } as never,
    connectivity: { isOnline: () => true } as never,
    queryClient: {} as never,
    cacheArea: { set: jest.fn(), getString: jest.fn() } as never,
    vaultArea: { set: jest.fn(), getString: jest.fn() } as never,
    remoteSimArea: { set: jest.fn(), getString: jest.fn() } as never,
  };

  beforeEach(() => {
    clearTestOverrides();
  });

  afterEach(() => {
    clearTestOverrides();
  });

  it("throws when getContainer is called without init and without overrides", () => {
    expect(() => getContainer()).toThrow("DI container not initialized");
  });

  it("throws when overrideForTests is called in production", () => {
    const origEnv = process.env.NODE_ENV;
    try {
      (process.env as NodeJS.ProcessEnv).NODE_ENV = "production";
      (process.env as unknown as { EXPO_PUBLIC_E2E?: string }).EXPO_PUBLIC_E2E = "";
      expect(() => overrideForTests({})).toThrow(
        "overrideForTests only allowed in test/E2E environment",
      );
    } finally {
      (process.env as NodeJS.ProcessEnv).NODE_ENV = origEnv;
    }
  });

  it("returns container when overridden for tests", () => {
    overrideForTests(mockContainer);
    expect(getContainer()).toBeDefined();
    expect(useMarketRepository()).toBe(mockContainer.marketRepository);
    expect(useCoinRepository()).toBe(mockContainer.coinRepository);
    expect(useAlertRepository()).toBe(mockContainer.alertRepository);
    expect(useLedgerRepository()).toBe(mockContainer.ledgerRepository);
    expect(useLedgerRemote()).toBe(mockContainer.ledgerRemote);
    expect(useBiometricsService()).toBe(mockContainer.biometricsService);
    expect(useOutboxEngine()).toBe(mockContainer.outboxEngine);
    expect(useHttpClient()).toBe(mockContainer.httpClient);
    expect(useConnectivity()).toBe(mockContainer.connectivity);
    expect(useQueryClient()).toBe(mockContainer.queryClient);
    expect(useCacheArea()).toBe(mockContainer.cacheArea);
    expect(useVaultArea()).toBe(mockContainer.vaultArea);
    expect(useRemoteSimArea()).toBe(mockContainer.remoteSimArea);
  });

  it("handles initContainer and prevents double initialization", () => {
    resetContainerForTests();
    expect(hasInitializedContainer()).toBe(false);
    initContainer(mockContainer);
    expect(hasInitializedContainer()).toBe(true);
    expect(getContainer()).toBe(mockContainer);
    expect(() => initContainer(mockContainer)).toThrow("DI container already initialized");
  });
});
