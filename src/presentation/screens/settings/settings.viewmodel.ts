/**
 * Settings ViewModel.
 * Manages preferences for language, currency, theme studio, security, and data wiping.
 */
import { useCallback, useState } from "react";

import { getContainer, useOutboxEngine } from "@di/container";
import type { SupportedCurrency } from "@domain/currency/CurrencyTypes";
import { useCurrencyStore } from "@stores/currencyStore";
import { type Language, useLanguageStore } from "@stores/languageStore";
import { type ThemeMode, useThemeStore } from "@stores/themeStore";
import { AUTO_LOCK_TIMEOUTS, useVaultAuthStore } from "@stores/vaultAuthStore";

export const LIGHT_PRESET_ACCENTS = [
  { name: "Blue", hex: "#2563eb" },
  { name: "Emerald", hex: "#047857" },
  { name: "Teal", hex: "#0f766e" },
  { name: "Indigo", hex: "#4338ca" },
  { name: "Rose", hex: "#be123c" },
  { name: "Violet", hex: "#6d28d9" },
] as const;

export const DARK_PRESET_ACCENTS = [
  { name: "Blue", hex: "#60a5fa" },
  { name: "Emerald", hex: "#34d399" },
  { name: "Teal", hex: "#2dd4bf" },
  { name: "Indigo", hex: "#818cf8" },
  { name: "Rose", hex: "#fb7185" },
  { name: "Violet", hex: "#c084fc" },
] as const;

export const PRESET_ACCENTS = LIGHT_PRESET_ACCENTS;

export function useSettingsViewModel() {
  const lang = useLanguageStore((s) => s.lang);
  const setLang = useLanguageStore((s) => s.setLang);
  const currency = useCurrencyStore((s) => s.currency);
  const setCurrency = useCurrencyStore((s) => s.setCurrency);
  const egpCrossRate = useCurrencyStore((s) => s.egpCrossRate);
  const mode = useThemeStore((s) => s.mode);
  const accent = useThemeStore((s) => s.accent);
  const setMode = useThemeStore((s) => s.setMode);
  const setAccent = useThemeStore((s) => s.setAccent);
  const autoLockTimeout = useVaultAuthStore((s) => s.autoLockTimeout);
  const setAutoLockTimeout = useVaultAuthStore((s) => s.setAutoLockTimeout);
  const screenProtectionEnabled = useVaultAuthStore((s) => s.screenProtectionEnabled);
  const setScreenProtectionEnabled = useVaultAuthStore((s) => s.setScreenProtectionEnabled);
  const lock = useVaultAuthStore((s) => s.lock);
  const outbox = useOutboxEngine();

  const [contrastError, setContrastError] = useState<string | null>(null);
  const [isWiping, setIsWiping] = useState(false);
  const [isConfirmWipeOpen, setIsConfirmWipeOpen] = useState(false);

  const onSelectLanguage = useCallback(
    (newLang: Language) => {
      setLang(newLang);
    },
    [setLang],
  );

  const onSelectCurrency = useCallback(
    (newCurrency: SupportedCurrency) => {
      setCurrency(newCurrency);
    },
    [setCurrency],
  );

  const onSelectMode = useCallback(
    (newMode: ThemeMode) => {
      setMode(newMode);
    },
    [setMode],
  );

  const onSelectAccent = useCallback(
    (hex: string | undefined) => {
      setContrastError(null);
      const ok = setAccent(hex);
      if (!ok) {
        setContrastError(
          "Selected accent color does not meet WCAG AA (4.5:1) contrast against background.",
        );
      }
    },
    [setAccent],
  );

  const onSelectAutoLock = useCallback(
    (timeoutMs: number) => {
      setAutoLockTimeout(timeoutMs);
    },
    [setAutoLockTimeout],
  );

  const onToggleScreenProtection = useCallback(() => {
    void setScreenProtectionEnabled(!screenProtectionEnabled);
  }, [screenProtectionEnabled, setScreenProtectionEnabled]);

  const onEraseAllData = useCallback(async () => {
    setIsWiping(true);
    try {
      const container = getContainer();
      container.vaultArea.clearAll();
      container.cacheArea.clearAll();

      // The vault key is intentionally kept: the live encrypted instance is bound to it,
      // and rotating it mid-session would orphan everything written afterwards.

      outbox.clearFailed();

      lock();

      setCurrency("usd");
      setLang("en");
      setMode("light");
      setAccent(undefined);
      setAutoLockTimeout(AUTO_LOCK_TIMEOUTS.THIRTY_SECONDS);
      setIsConfirmWipeOpen(false);
    } finally {
      setIsWiping(false);
    }
  }, [lock, outbox, setAccent, setAutoLockTimeout, setCurrency, setLang, setMode]);

  return {
    lang,
    currency,
    egpCrossRate,
    mode,
    accent,
    presetAccents: mode === "dark" ? DARK_PRESET_ACCENTS : LIGHT_PRESET_ACCENTS,
    contrastError,
    autoLockTimeout,
    screenProtectionEnabled,
    isWiping,
    isConfirmWipeOpen,
    setIsConfirmWipeOpen,
    onSelectLanguage,
    onSelectCurrency,
    onSelectMode,
    onSelectAccent,
    onSelectAutoLock,
    onToggleScreenProtection,
    onEraseAllData,
  };
}
