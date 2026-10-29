/**
 * Tests for MMKV storage areas partition isolation.
 */

import { describe, expect, it, beforeEach } from "@jest/globals";

import { setVaultKeyForTests } from "@infrastructure/security/vault-key";

import { getQueryCacheArea, getVaultArea, getRemoteSimArea, areaNameFor } from "./storage-areas";

describe("storage-areas facade", () => {
  beforeEach(() => {
    setVaultKeyForTests("a".repeat(32));
  });

  it("provides instances for each named area", () => {
    const cache = getQueryCacheArea();
    expect(cache).toBeDefined();
    expect(typeof cache.getString).toBe("function");

    const vault = getVaultArea();
    expect(vault).toBeDefined();

    const remote = getRemoteSimArea();
    expect(remote).toBeDefined();

    expect(areaNameFor("cache")).toBe(cache);
    expect(areaNameFor("vault")).toBe(vault);
    expect(areaNameFor("remote-sim")).toBe(remote);
  });
});
