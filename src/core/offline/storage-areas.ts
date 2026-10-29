/**
 * Storage facade.
 *
 * All code outside `src/infrastructure` accesses MMKV through this module so
 * the instances, their identities and encryption live in exactly one place.
 */

import { getStorageArea, type StorageAreaName } from "@infrastructure/storage/mmkvInstances";

export interface MmkvArea {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
  remove(key: string): void;
  contains(key: string): boolean;
  getAllKeys(): string[];
  clearAll(): void;
}

export function getQueryCacheArea(): MmkvArea {
  return getStorageArea("cache");
}

export function getVaultArea(): MmkvArea {
  return getStorageArea("vault");
}

export function getRemoteSimArea(): MmkvArea {
  return getStorageArea("remote-sim");
}

export function areaNameFor(name: StorageAreaName): MmkvArea {
  return getStorageArea(name);
}

export type { StorageAreaName };
