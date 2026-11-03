/**
 * Unit tests for MMKV instance factory and encryption options.
 */

import { afterEach, describe, expect, it } from "@jest/globals";

import { setVaultKeyForTests } from "@infrastructure/security/vault-key";

import {
  CACHE_INSTANCE_ID,
  getStorageArea,
  type MmkvOptions,
  setMmkvFactoryForTests,
  toArea,
  VAULT_INSTANCE_ID,
  wipeAllStorage,
} from "./mmkvInstances";

interface MemoryNote {
  readonly id: string;
  readonly encryptionKey?: string;
  readonly encryptionType?: string;
}

const created: MemoryNote[] = [];

afterEach(() => {
  created.length = 0;
  setMmkvFactoryForTests(null);
});

function memoryFactory() {
  return (options: MmkvOptions) => {
    created.push(options);
    let store = new Map<string, string>();
    return {
      getString: (key: string) => store.get(key),
      set: (key: string, value: string) => {
        store = new Map(store);
        store.set(key, value);
      },
      remove: (key: string) => {
        store = new Map(store);
        store.delete(key);
      },
      contains: (key: string) => store.has(key),
      getAllKeys: () => Array.from(store.keys()),
      clearAll: () => {
        store = new Map();
      },
    };
  };
}

const TEST_KEY = "a".repeat(32);

describe("mmkvInstances", () => {
  it("creates distinct areas with the expected ids and encrypts only the vault", () => {
    setMmkvFactoryForTests(memoryFactory());
    setVaultKeyForTests(TEST_KEY);

    getStorageArea("cache").set("k", "1");
    getStorageArea("vault").set("k", "2");
    getStorageArea("remote-sim").set("k", "3");

    expect(created.map((c) => c.id)).toEqual([
      CACHE_INSTANCE_ID,
      VAULT_INSTANCE_ID,
      "vaultfold-remote-sim",
    ]);
    expect(created.find((c) => c.id === VAULT_INSTANCE_ID)?.encryptionKey).toBe(TEST_KEY);
    expect(created.find((c) => c.id === VAULT_INSTANCE_ID)?.encryptionType).toBe("AES-256");
    expect(created.find((c) => c.id === VAULT_INSTANCE_ID)?.encryptionKey).toHaveLength(32);
    expect(created.find((c) => c.id === CACHE_INSTANCE_ID)?.encryptionKey).toBeUndefined();
    expect(getStorageArea("cache").getString("k")).toBe("1");
    expect(getStorageArea("vault").getString("k")).toBe("2");
  });

  it("reuses the same area per name across calls", () => {
    setMmkvFactoryForTests(memoryFactory());
    setVaultKeyForTests(TEST_KEY);
    const area = getStorageArea("cache");
    expect(getStorageArea("cache")).toBe(area);
  });

  it("supports instance with delete instead of remove in toArea", () => {
    let deletedKey = "";
    const area = toArea({
      getString: () => undefined,
      set: () => {},
      delete: (key: string) => {
        deletedKey = key;
      },
      contains: () => false,
      getAllKeys: () => [],
      clearAll: () => {},
    });
    area.remove("test-key");
    expect(deletedKey).toBe("test-key");
  });

  it("wipeAllStorage clears every area", () => {
    setMmkvFactoryForTests(memoryFactory());
    setVaultKeyForTests(TEST_KEY);
    getStorageArea("cache").set("a", "1");
    getStorageArea("vault").set("b", "2");
    getStorageArea("remote-sim").set("c", "3");

    wipeAllStorage();

    for (const name of ["cache", "vault", "remote-sim"] as const) {
      expect(getStorageArea(name).getAllKeys()).toEqual([]);
    }
  });

  it("uses default MMKV factory and toArea wrapper when factory override is null", () => {
    setMmkvFactoryForTests(null);
    setVaultKeyForTests(TEST_KEY);
    const area = getStorageArea("cache");
    area.set("foo", "bar");
    expect(area.getString("foo")).toBe("bar");
    expect(area.contains("foo")).toBe(true);
    expect(area.getAllKeys()).toContain("foo");
    area.remove("foo");
    expect(area.contains("foo")).toBe(false);
    area.clearAll();
  });
});
