/**
 * Vault key lifecycle: fresh install, restart, and every failure mode that must
 * never generate or cache a key that could orphan existing data.
 */

import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import * as SecureStore from "expo-secure-store";

import {
  ensureVaultKey,
  eraseVaultKey,
  getVaultKey,
  hasVaultKey,
  resetCachedKeyForTests,
  setVaultKeyForTests,
  VAULT_KEY_LENGTH,
} from "./vault-key";

const mockRegistry = new Map<string, string>();

jest.mock("expo-secure-store", () => ({
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: "whenUnlockedThisDeviceOnly",
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock("expo-crypto", () => {
  let state = 0x2f6e2b1;
  return {
    getRandomBytes: (count: number) =>
      Uint8Array.from({ length: count }, () => {
        state = (state * 1103515245 + 12345) & 0x7fffffff;
        return (state >>> 16) & 0xff;
      }),
  };
});

const store = jest.mocked(SecureStore);
const V2 = "vaultfold.vault.key.v2";
const V1 = "vaultfold.vault.key.v1";
const GOOD_KEY = "k".repeat(VAULT_KEY_LENGTH);
const FRESH = { vaultDataExists: false };

beforeEach(() => {
  mockRegistry.clear();
  resetCachedKeyForTests();
  store.getItemAsync.mockImplementation(async (key: string) => mockRegistry.get(key) ?? null);
  store.setItemAsync.mockImplementation(async (key: string, value: string) => {
    mockRegistry.set(key, value);
  });
  store.deleteItemAsync.mockImplementation(async (key: string) => {
    mockRegistry.delete(key);
  });
});

describe("vault-key", () => {
  it("generates a 32-char key on a fresh install and persists it as v2", async () => {
    await expect(ensureVaultKey(FRESH)).resolves.toEqual({ status: "ready" });
    const key = getVaultKey();
    expect(key).toHaveLength(VAULT_KEY_LENGTH);
    expect(key).toMatch(/^[A-Za-z0-9_-]{32}$/);
    expect(mockRegistry.get(V2)).toBe(key);
    expect(store.setItemAsync).toHaveBeenCalledWith(
      V2,
      key,
      expect.objectContaining({ keychainAccessible: "whenUnlockedThisDeviceOnly" }),
    );
  });

  it("reuses the persisted key across restarts", async () => {
    await ensureVaultKey(FRESH);
    const first = getVaultKey();
    resetCachedKeyForTests();
    await expect(ensureVaultKey({ vaultDataExists: true })).resolves.toEqual({ status: "ready" });
    expect(getVaultKey()).toBe(first);
  });

  it("does not generate or cache a key when SecureStore cannot be read (device locked)", async () => {
    store.getItemAsync.mockRejectedValue(new Error("device locked"));
    await expect(ensureVaultKey(FRESH)).resolves.toEqual({
      status: "unavailable",
      reason: "read-failed",
    });
    expect(hasVaultKey()).toBe(false);
    expect(store.setItemAsync).not.toHaveBeenCalled();
  });

  it("recovers from a read error on the next attempt without losing the original key", async () => {
    mockRegistry.set(V2, GOOD_KEY);
    store.getItemAsync.mockRejectedValueOnce(new Error("device locked"));
    await expect(ensureVaultKey({ vaultDataExists: true })).resolves.toMatchObject({
      status: "unavailable",
    });
    await expect(ensureVaultKey({ vaultDataExists: true })).resolves.toEqual({ status: "ready" });
    expect(getVaultKey()).toBe(GOOD_KEY);
  });

  it("does not cache a key that failed to persist", async () => {
    store.setItemAsync.mockRejectedValue(new Error("disk full"));
    await expect(ensureVaultKey(FRESH)).resolves.toEqual({
      status: "unavailable",
      reason: "persist-failed",
    });
    expect(hasVaultKey()).toBe(false);
    expect(() => getVaultKey()).toThrow("ensureVaultKey");
  });

  it("enters recovery when vault data exists but the key is missing (restore to new device)", async () => {
    await expect(ensureVaultKey({ vaultDataExists: true })).resolves.toEqual({
      status: "recovery",
      reason: "key-missing",
    });
    expect(hasVaultKey()).toBe(false);
    expect(store.setItemAsync).not.toHaveBeenCalled();
  });

  it("enters recovery for a legacy v1 (AES-128 era) install instead of crashing", async () => {
    mockRegistry.set(V1, "ab".repeat(32));
    await expect(ensureVaultKey({ vaultDataExists: true })).resolves.toEqual({
      status: "recovery",
      reason: "legacy-key",
    });
    expect(hasVaultKey()).toBe(false);
    expect(store.setItemAsync).not.toHaveBeenCalled();
  });

  it("enters recovery for a corrupt stored key", async () => {
    mockRegistry.set(V2, "too-short");
    await expect(ensureVaultKey({ vaultDataExists: true })).resolves.toEqual({
      status: "recovery",
      reason: "key-corrupt",
    });
  });

  it("eraseVaultKey removes both key generations and clears the cache", async () => {
    mockRegistry.set(V1, "ab".repeat(32));
    await ensureVaultKey({ vaultDataExists: true }).catch(() => undefined);
    setVaultKeyForTests(GOOD_KEY);
    mockRegistry.set(V2, GOOD_KEY);

    await eraseVaultKey();

    expect(mockRegistry.size).toBe(0);
    expect(hasVaultKey()).toBe(false);
    await expect(ensureVaultKey(FRESH)).resolves.toEqual({ status: "ready" });
  });

  it("rejects malformed test keys", () => {
    expect(() => setVaultKeyForTests("nope")).toThrow("malformed");
    expect(() => setVaultKeyForTests("a".repeat(64))).toThrow("malformed");
  });
});
