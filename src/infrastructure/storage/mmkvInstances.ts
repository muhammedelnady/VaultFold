/**
 * MMKV storage instances.
 *
 * Two persistent instances only:
 * - `cache` — unencrypted: query cache, charts, FX, sample snapshot, the
 * persisted TanStack Query cache.
 * - `vault` — encrypted (MMKV AES-256, set explicitly because the library
 * default is AES-128): ledger, watchlist, alerts, outbox, sensitive settings.
 * The 32-byte key is random (expo-crypto) and persisted in
 * expo-secure-store (WHEN_UNLOCKED_THIS_DEVICE_ONLY).
 *
 * A third instance, `remote-sim`, backs the dev-only SimulatedLedgerRemote.
 *
 * In tests, `src/__mocks__/react-native-mmkv.js` (wired by jest moduleNameMapper)
 * replaces the native Nitro module, so this module never loads native code in Jest.
 *
 * The `vault` instance requires the key provisioned by `ensureVaultKey` during
 * DI bootstrap; access before that throws deterministically.
 */

import { createMMKV, deleteMMKV, existsMMKV } from "react-native-mmkv";

import { getVaultKey } from "@infrastructure/security/vault-key";

export const CACHE_INSTANCE_ID = "vaultfold-cache";
export const VAULT_INSTANCE_ID = "vaultfold-vault";
export const REMOTE_SIM_INSTANCE_ID = "vaultfold-remote-sim";

export type StorageAreaName = "cache" | "vault" | "remote-sim";

export interface Area {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
  remove(key: string): void;
  contains(key: string): boolean;
  getAllKeys(): string[];
  clearAll(): void;
}

export function toArea(instance: {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
  contains(key: string): boolean;
  getAllKeys(): string[];
  clearAll(): void;
  remove?(key: string): void;
  delete?(key: string): void;
}): Area {
  return {
    getString: (key) => instance.getString(key),
    set: (key, value) => instance.set(key, value),
    remove: (key) => {
      if (typeof instance.remove === "function") {
        instance.remove(key);
      } else if (typeof instance.delete === "function") {
        instance.delete(key);
      }
    },
    contains: (key) => instance.contains(key),
    getAllKeys: () => instance.getAllKeys(),
    clearAll: () => instance.clearAll(),
  };
}

export interface MmkvOptions {
  readonly id: string;
  readonly encryptionKey?: string;
  readonly encryptionType?: "AES-128" | "AES-256";
}

let cacheArea: Area | null = null;
let vaultArea: Area | null = null;
let remoteSimArea: Area | null = null;

let factoryOverride: ((options: MmkvOptions) => Area) | null = null;

export function setMmkvFactoryForTests(factory: ((options: MmkvOptions) => Area) | null): void {
  factoryOverride = factory;
  cacheArea = null;
  vaultArea = null;
  remoteSimArea = null;
}

function areaFor(name: StorageAreaName): Area {
  const factory = factoryOverride ?? ((options: MmkvOptions) => toArea(createMMKV(options)));
  switch (name) {
    case "cache":
      cacheArea ??= factory({ id: CACHE_INSTANCE_ID });
      return cacheArea;
    case "vault":
      vaultArea ??= factory({
        id: VAULT_INSTANCE_ID,
        encryptionKey: getVaultKey(),
        encryptionType: "AES-256",
      });
      return vaultArea;
    case "remote-sim":
      remoteSimArea ??= factory({ id: REMOTE_SIM_INSTANCE_ID });
      return remoteSimArea;
  }
}

export function getStorageArea(name: StorageAreaName): Area {
  return areaFor(name);
}

export function wipeAllStorage(): void {
  for (const name of ["cache", "vault", "remote-sim"] as const) {
    areaFor(name).clearAll();
  }
}

/** True when an encrypted vault file already exists on disk (key may be lost). */
export function vaultDataExists(): boolean {
  return existsMMKV(VAULT_INSTANCE_ID);
}

/** Irreversibly deletes the encrypted vault file. Used only by the recovery/reset flow. */
export function deleteVaultStorage(): void {
  vaultArea = null;
  deleteMMKV(VAULT_INSTANCE_ID);
}
