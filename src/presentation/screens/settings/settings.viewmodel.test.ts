/**
 * Unit tests for SettingsViewModel preferences state and actions.
 */

import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, renderHook } from "@testing-library/react-native";

import { overrideForTests } from "@di/container";
import { useCurrencyStore } from "@stores/currencyStore";
import { useLanguageStore } from "@stores/languageStore";
import { useThemeStore } from "@stores/themeStore";
import { AUTO_LOCK_TIMEOUTS, useVaultAuthStore } from "@stores/vaultAuthStore";

import { useSettingsViewModel } from "./settings.viewmodel";

describe("useSettingsViewModel", () => {
  const mockClearFailed = jest.fn();
  const mockVaultClear = jest.fn();
  const mockCacheClear = jest.fn();

  beforeEach(() => {
    useLanguageStore.setState({ lang: "en" });
    useCurrencyStore.setState({ currency: "usd", egpCrossRate: null });
    useThemeStore.setState({ mode: "light", accent: undefined });
    useVaultAuthStore.setState({
      autoLockTimeout: AUTO_LOCK_TIMEOUTS.THIRTY_SECONDS,
      screenProtectionEnabled: true,
      isLocked: false,
    });

    overrideForTests({
      outboxEngine: {
        clearFailed: mockClearFailed,
      } as never,
      vaultArea: {
        clearAll: mockVaultClear,
      } as never,
      cacheArea: {
        clearAll: mockCacheClear,
      } as never,
    });
  });

  it("updates language, currency, mode, and auto-lock timeout", async () => {
    const { result } = await renderHook(() => useSettingsViewModel());

    await act(async () => {
      result.current.onSelectLanguage("ar");
    });
    expect(useLanguageStore.getState().lang).toBe("ar");

    await act(async () => {
      result.current.onSelectCurrency("sar");
    });
    expect(useCurrencyStore.getState().currency).toBe("sar");

    await act(async () => {
      result.current.onSelectMode("dark");
    });
    expect(useThemeStore.getState().mode).toBe("dark");

    await act(async () => {
      result.current.onSelectAutoLock(AUTO_LOCK_TIMEOUTS.FIVE_MINUTES);
    });
    expect(useVaultAuthStore.getState().autoLockTimeout).toBe(AUTO_LOCK_TIMEOUTS.FIVE_MINUTES);
  });

  it("handles accent selection with valid and failing contrast", async () => {
    const { result } = await renderHook(() => useSettingsViewModel());

    await act(async () => {
      result.current.onSelectAccent("#2563eb");
    });
    expect(result.current.contrastError).toBeNull();
    expect(useThemeStore.getState().accent).toBe("#2563eb");

    await act(async () => {
      result.current.onSelectAccent(undefined);
    });
    expect(result.current.contrastError).toBeNull();
    expect(useThemeStore.getState().accent).toBeUndefined();

    await act(async () => {
      result.current.onSelectAccent("#ffffff");
    });
    expect(result.current.contrastError).toBeTruthy();
  });

  it("executes onEraseAllData and resets stores", async () => {
    const { result } = await renderHook(() => useSettingsViewModel());

    await act(async () => {
      await result.current.onEraseAllData();
    });

    expect(mockVaultClear).toHaveBeenCalled();
    expect(mockCacheClear).toHaveBeenCalled();
    expect(mockClearFailed).toHaveBeenCalled();
    expect(useVaultAuthStore.getState().isLocked).toBe(true);
    expect(useCurrencyStore.getState().currency).toBe("usd");
    expect(useLanguageStore.getState().lang).toBe("en");
    expect(useThemeStore.getState().mode).toBe("light");
    expect(result.current.isConfirmWipeOpen).toBe(false);
  });
});
