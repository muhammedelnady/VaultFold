/**
 * Component tests for SettingsScreen preferences and danger zone flows.
 */

import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";

import { overrideForTests } from "@di/container";
import { useCurrencyStore } from "@stores/currencyStore";
import { useLanguageStore } from "@stores/languageStore";
import { useThemeStore } from "@stores/themeStore";
import { AUTO_LOCK_TIMEOUTS, useVaultAuthStore } from "@stores/vaultAuthStore";

import { SettingsScreen } from "./SettingsScreen";

describe("SettingsScreen", () => {
  const mockClearFailed = jest.fn();

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
        clearAll: jest.fn(),
      } as never,
      cacheArea: {
        clearAll: jest.fn(),
      } as never,
    });
  });

  it("renders all setting sections and default selections", async () => {
    await render(<SettingsScreen />);

    expect(screen.getByTestId("settings-screen")).toBeTruthy();
    expect(screen.getByText("Localization & Currency")).toBeTruthy();
    expect(screen.getByText("Theme Studio")).toBeTruthy();
    expect(screen.getByText("Vault Security")).toBeTruthy();
    expect(screen.getByText("Danger Zone")).toBeTruthy();
    expect(screen.getByText("About & Attribution")).toBeTruthy();
  });

  it("changes language between English and Arabic", async () => {
    await render(<SettingsScreen />);

    await fireEvent.press(screen.getByTestId("btn-lang-ar"));
    expect(useLanguageStore.getState().lang).toBe("ar");

    await fireEvent.press(screen.getByTestId("btn-lang-en"));
    expect(useLanguageStore.getState().lang).toBe("en");
  });

  it("changes display currency and displays EGP cross-rate info when EGP is selected", async () => {
    useCurrencyStore.setState({
      currency: "usd",
      egpCrossRate: {
        rate: "49.5000",
        timestamp: 1700000000000,
        btcUsd: "68000",
        btcEgp: "3366000",
      },
    });

    await render(<SettingsScreen />);

    expect(screen.queryByTestId("egp-cross-rate-info")).toBeNull();

    await fireEvent.press(screen.getByTestId("btn-currency-eur"));
    expect(useCurrencyStore.getState().currency).toBe("eur");

    await fireEvent.press(screen.getByTestId("btn-currency-sar"));
    expect(useCurrencyStore.getState().currency).toBe("sar");

    await fireEvent.press(screen.getByTestId("btn-currency-egp"));
    expect(useCurrencyStore.getState().currency).toBe("egp");
    expect(screen.getByTestId("egp-cross-rate-info")).toBeTruthy();
    expect(screen.getByText(/49\.5000 EGP/)).toBeTruthy();
  });

  it("switches theme mode and accent color", async () => {
    await render(<SettingsScreen />);

    await fireEvent.press(screen.getByTestId("btn-theme-dark"));
    expect(useThemeStore.getState().mode).toBe("dark");

    await fireEvent.press(screen.getByTestId("btn-theme-light"));
    expect(useThemeStore.getState().mode).toBe("light");

    await fireEvent.press(screen.getByTestId("accent-swatch-blue"));
    expect(useThemeStore.getState().accent).toBe("#2563eb");

    await fireEvent.press(screen.getByTestId("accent-swatch-indigo"));
    expect(useThemeStore.getState().accent).toBe("#4338ca");

    await fireEvent.press(screen.getByTestId("accent-swatch-emerald"));
    expect(useThemeStore.getState().accent).toBe("#047857");
  });

  it("configures auto-lock timeout and toggles screen protection", async () => {
    await render(<SettingsScreen />);

    await fireEvent.press(screen.getByTestId("btn-autolock-1m"));
    expect(useVaultAuthStore.getState().autoLockTimeout).toBe(AUTO_LOCK_TIMEOUTS.ONE_MINUTE);

    await fireEvent.press(screen.getByTestId("btn-autolock-immediate"));
    expect(useVaultAuthStore.getState().autoLockTimeout).toBe(AUTO_LOCK_TIMEOUTS.IMMEDIATE);

    await fireEvent(screen.getByTestId("switch-screen-protection"), "valueChange", false);
    expect(useVaultAuthStore.getState().screenProtectionEnabled).toBe(false);
  });

  it("opens confirmation modal, cancels or confirms data wipe", async () => {
    await render(<SettingsScreen />);

    await fireEvent.press(screen.getByTestId("btn-open-wipe-modal"));
    expect(screen.getByTestId("wipe-confirmation-modal")).toBeTruthy();

    await fireEvent.press(screen.getByTestId("btn-cancel-wipe"));

    await fireEvent.press(screen.getByTestId("btn-open-wipe-modal"));
    await fireEvent.press(screen.getByTestId("btn-confirm-wipe"));

    expect(mockClearFailed).toHaveBeenCalled();
    expect(useVaultAuthStore.getState().isLocked).toBe(true);
    expect(useCurrencyStore.getState().currency).toBe("usd");
  });
});
