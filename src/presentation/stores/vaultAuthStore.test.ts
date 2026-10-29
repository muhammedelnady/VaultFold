/**
 * Vault authentication store unit tests.
 */
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import * as ScreenCapture from "expo-screen-capture";

import { overrideForTests } from "@di/container";
import { StubBiometricsService } from "@infrastructure/security/StubBiometricsService";

import {
  AUTO_LOCK_TIMEOUTS,
  bindVaultAuthPersistence,
  resetVaultAuthStore,
  useVaultAuthStore,
  VAULT_AUTH_STORE_KEY,
  type MmkvPersist,
} from "./vaultAuthStore";

function memoryArea(): MmkvPersist {
  const map = new Map<string, string>();
  return {
    getString: (key) => map.get(key),
    set: (key, value) => void map.set(key, value),
    remove: (key) => void map.delete(key),
  };
}

describe("useVaultAuthStore", () => {
  let stubBiometrics: StubBiometricsService;

  beforeEach(() => {
    resetVaultAuthStore();
    stubBiometrics = new StubBiometricsService(true);
    overrideForTests({
      biometricsService: stubBiometrics,
    });
  });

  it("initializes and loads capabilities", async () => {
    await useVaultAuthStore.getState().initialize();
    const caps = useVaultAuthStore.getState().capabilities;
    expect(caps?.hasHardware).toBe(true);
    expect(caps?.isEnrolled).toBe(true);
  });

  it("handles initialization failure", async () => {
    overrideForTests({
      biometricsService: {
        getCapabilities: jest.fn(async () => {
          throw new Error("Fail");
        }),
        authenticate: jest.fn(async () => false),
      },
    });
    await useVaultAuthStore.getState().initialize();
    expect(useVaultAuthStore.getState().capabilities?.hasHardware).toBe(false);
  });

  it("unlocks when biometrics authenticate succeeds", async () => {
    const success = await useVaultAuthStore.getState().unlock();
    expect(success).toBe(true);
    expect(useVaultAuthStore.getState().isLocked).toBe(false);
  });

  it("remains locked when biometrics authenticate fails", async () => {
    stubBiometrics.setShouldSucceed(false);
    const success = await useVaultAuthStore.getState().unlock();
    expect(success).toBe(false);
    expect(useVaultAuthStore.getState().isLocked).toBe(true);
  });

  it("allows explicit lock", () => {
    useVaultAuthStore.setState({ isLocked: false });
    useVaultAuthStore.getState().lock();
    expect(useVaultAuthStore.getState().isLocked).toBe(true);
  });

  it("enters demo mode and unlocks", () => {
    useVaultAuthStore.getState().enterDemoMode();
    expect(useVaultAuthStore.getState().isDemoMode).toBe(true);
    expect(useVaultAuthStore.getState().isLocked).toBe(false);
  });

  it("handles immediate auto-lock on background", () => {
    useVaultAuthStore.getState().setAutoLockTimeout(AUTO_LOCK_TIMEOUTS.IMMEDIATE);
    useVaultAuthStore.setState({ isLocked: false });

    useVaultAuthStore.getState().handleAppStateChange("background");
    expect(useVaultAuthStore.getState().isLocked).toBe(true);
  });

  it("locks after timeout when returning to active", () => {
    useVaultAuthStore.setState({
      isLocked: false,
      autoLockTimeout: 1000,
      lastActiveTimestamp: Date.now() - 2000,
    });

    useVaultAuthStore.getState().handleAppStateChange("active");
    expect(useVaultAuthStore.getState().isLocked).toBe(true);
  });

  it("stays unlocked if elapsed time is less than autoLockTimeout", () => {
    useVaultAuthStore.setState({
      isLocked: false,
      autoLockTimeout: 30000,
      lastActiveTimestamp: Date.now() - 5000,
    });

    useVaultAuthStore.getState().handleAppStateChange("active");
    expect(useVaultAuthStore.getState().isLocked).toBe(false);
  });

  it("prevents re-entrant unlocking when already authenticating", async () => {
    useVaultAuthStore.setState({ isAuthenticating: true });
    const result = await useVaultAuthStore.getState().unlock();
    expect(result).toBe(false);
  });

  it("does not lock on background or active when in demo mode", () => {
    useVaultAuthStore.setState({ isDemoMode: true, isLocked: false, autoLockTimeout: 0 });
    useVaultAuthStore.getState().handleAppStateChange("background");
    expect(useVaultAuthStore.getState().isLocked).toBe(false);

    useVaultAuthStore.getState().handleAppStateChange("active");
    expect(useVaultAuthStore.getState().isLocked).toBe(false);
  });

  it("demo mode does not auto-lock on active", () => {
    useVaultAuthStore.setState({
      isDemoMode: true,
      isLocked: false,
      lastActiveTimestamp: Date.now() - 100000,
    });

    useVaultAuthStore.getState().handleAppStateChange("active");
    expect(useVaultAuthStore.getState().isLocked).toBe(false);
  });

  it("enables and disables screen protection", async () => {
    await useVaultAuthStore.getState().setScreenProtectionEnabled(true);
    expect(ScreenCapture.preventScreenCaptureAsync).toHaveBeenCalled();

    await useVaultAuthStore.getState().setScreenProtectionEnabled(false);
    expect(ScreenCapture.allowScreenCaptureAsync).toHaveBeenCalled();
  });

  it("hydrates autoLockTimeout and screenProtectionEnabled from MMKV", () => {
    const area = memoryArea();
    area.set(
      VAULT_AUTH_STORE_KEY,
      JSON.stringify({
        version: 1,
        autoLockTimeout: 60000,
        screenProtectionEnabled: false,
      }),
    );
    const unbind = bindVaultAuthPersistence(area);
    expect(useVaultAuthStore.getState().autoLockTimeout).toBe(60000);
    expect(useVaultAuthStore.getState().screenProtectionEnabled).toBe(false);
    unbind();
  });

  it("writes updates to MMKV on setAutoLockTimeout and setScreenProtectionEnabled", async () => {
    const area = memoryArea();
    const unbind = bindVaultAuthPersistence(area);
    useVaultAuthStore.getState().setAutoLockTimeout(120000);
    const rawAfterTimeout = area.getString(VAULT_AUTH_STORE_KEY);
    expect(rawAfterTimeout).toBeDefined();
    expect(JSON.parse(rawAfterTimeout ?? "{}")).toMatchObject({
      version: 1,
      autoLockTimeout: 120000,
      screenProtectionEnabled: true,
    });

    await useVaultAuthStore.getState().setScreenProtectionEnabled(false);
    const rawAfterScreen = area.getString(VAULT_AUTH_STORE_KEY);
    expect(JSON.parse(rawAfterScreen ?? "{}")).toMatchObject({
      version: 1,
      autoLockTimeout: 120000,
      screenProtectionEnabled: false,
    });
    unbind();
  });

  it("resets store to defaults and removes persisted entry", () => {
    const area = memoryArea();
    const unbind = bindVaultAuthPersistence(area);
    useVaultAuthStore.getState().setAutoLockTimeout(120000);
    resetVaultAuthStore();
    expect(useVaultAuthStore.getState().autoLockTimeout).toBe(AUTO_LOCK_TIMEOUTS.THIRTY_SECONDS);
    expect(useVaultAuthStore.getState().screenProtectionEnabled).toBe(true);
    expect(area.getString(VAULT_AUTH_STORE_KEY)).toBeUndefined();
    unbind();
  });

  it("unbinds persistence cleanup", () => {
    const area = memoryArea();
    const unbind = bindVaultAuthPersistence(area);
    unbind();
    useVaultAuthStore.getState().setAutoLockTimeout(5000);
    expect(area.getString(VAULT_AUTH_STORE_KEY)).toBeUndefined();
  });

  it("handles corrupted JSON gracefully during bindVaultAuthPersistence", () => {
    const area = memoryArea();
    area.set(VAULT_AUTH_STORE_KEY, "invalid-json{{");
    const unbind = bindVaultAuthPersistence(area);
    expect(useVaultAuthStore.getState().autoLockTimeout).toBe(AUTO_LOCK_TIMEOUTS.THIRTY_SECONDS);
    expect(area.getString(VAULT_AUTH_STORE_KEY)).toBeUndefined();
    unbind();
  });
});
