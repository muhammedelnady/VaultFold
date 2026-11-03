/**
 * i18n translation engine and text dispatcher for VaultFold.
 * Reads directly from structured resource JSON files:
 * - src/infrastructure/i18n/resources/en/en.json
 * - src/infrastructure/i18n/resources/ar/ar.json
 */
import { I18nManager } from "react-native";

import arBundle from "./resources/ar/ar.json";
import enBundle from "./resources/en/en.json";

export type SupportedLanguage = "en" | "ar";

const resources: Record<SupportedLanguage, Record<string, unknown>> = {
  en: enBundle as Record<string, unknown>,
  ar: arBundle as Record<string, unknown>,
};

let currentLang: SupportedLanguage = "en";

export function directionFromLangTag(lang: string): "rtl" | "ltr" {
  const rtlLangs = [
    "ar",
    "ar-AE",
    "ar-DZ",
    "ar-EG",
    "ar-IQ",
    "ar-JO",
    "ar-KW",
    "ar-LB",
    "ar-LY",
    "ar-MA",
    "ar-OM",
    "ar-PS",
    "ar-QA",
    "ar-SA",
    "ar-SY",
    "ar-TN",
  ];
  return rtlLangs.includes(lang) ? "rtl" : "ltr";
}

export function setLanguage(lang: SupportedLanguage): void {
  currentLang = lang;
  const isRtl = directionFromLangTag(lang) === "rtl";
  I18nManager.allowRTL(isRtl);
  I18nManager.forceRTL(isRtl);
}

export function getLanguage(): SupportedLanguage {
  return currentLang;
}

export function getDirection(): "ltr" | "rtl" {
  return directionFromLangTag(currentLang);
}

export function isRTL(): boolean {
  return getDirection() === "rtl";
}

export interface DirInfo {
  readonly direction: "ltr" | "rtl";
  readonly isRTL: boolean;
  readonly dirStyle: Readonly<{ writingDirection: "ltr" | "rtl" }>;
}

export function dirs(): DirInfo {
  const direction = getDirection();
  return {
    direction,
    isRTL: direction === "rtl",
    dirStyle: { writingDirection: direction },
  };
}

export type TxKeyPath = string;

/**
 * Resolves a dot-notated or top-level key from a bundle.
 */
function resolveKey(bundle: Record<string, unknown>, key: string): string | undefined {
  if (key in bundle && typeof bundle[key] === "string") {
    return bundle[key] as string;
  }
  const parts = key.split(".");
  let current: unknown = bundle;
  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return typeof current === "string" ? current : undefined;
}

/**
 * Translates a key path in the active language, with optional param interpolation.
 * Example: t("coinDetail.rank", { rank: 1 }) -> "Rank #1"
 */
export function t(key: TxKeyPath, params?: Record<string, string | number>): string {
  const bundle = resources[currentLang];
  let text = resolveKey(bundle, key);

  // Fallback to English if missing in current language
  if (text === undefined && currentLang !== "en") {
    text = resolveKey(resources.en, key);
  }

  if (text === undefined) {
    throw new Error(`Missing translation key: ${key} (lang: ${currentLang})`);
  }

  if (!params) {
    return text;
  }

  return text.replace(/\{(\w+)\}/g, (match, paramName: string) => {
    if (paramName in params) {
      return String(params[paramName]);
    }
    return match;
  });
}
