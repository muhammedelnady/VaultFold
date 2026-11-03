/**
 * In-memory react-native-mmkv shim for Jest (mapped via moduleNameMapper in
 * jest.config.js). Implements only the API VaultFold uses. Each id gets its own
 * independent map; `encryptionKey` is accepted and validated to exercise callers.
 */

const instances = new Map();

function createMMKV(options) {
  const id = options?.id ?? "default";
  if (options?.encryptionKey !== undefined && typeof options.encryptionKey !== "string") {
    throw new Error("mock-mmkv: encryptionKey must be a string");
  }
  if (options?.encryptionKey !== undefined) {
    const max = options.encryptionType === "AES-256" ? 32 : 16;
    if (options.encryptionKey.length > max) {
      throw new Error(
        `mock-mmkv: encryptionKey is ${options.encryptionKey.length} chars; max ${max} for ${options.encryptionType ?? "AES-128"}`,
      );
    }
  }
  if (instances.has(id)) {
    return instances.get(id);
  }
  const store = new Map();
  const instance = {
    getString: (key) => (store.has(key) ? store.get(key) : undefined),
    set: (key, value) => {
      store.set(key, value);
    },
    remove: (key) => {
      store.delete(key);
    },
    contains: (key) => store.has(key),
    getAllKeys: () => Array.from(store.keys()),
    clearAll: () => {
      store.clear();
    },
  };
  instances.set(id, instance);
  return instance;
}

function existsMMKV(id) {
  return instances.has(id);
}

function deleteMMKV(id) {
  return instances.delete(id);
}

function __resetAllInstancesForTests() {
  instances.clear();
}

module.exports = { createMMKV, existsMMKV, deleteMMKV, __resetAllInstancesForTests };
