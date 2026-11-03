/**
 * Language store: EN/AR selection with direction plumbing.
 *
 * The zustand store is the single writer of the translator module's language
 * (`src/infrastructure/i18n/translate`). RTL support flags are synchronized;
 * Yoga direction is driven dynamically by `isRtl` across all views.
 */
import { I18nManager } from "react-native";
import { create } from "zustand";

import {
  directionFromLangTag,
  dirs,
  getLanguage,
  setLanguage,
  t,
  type TxKeyPath,
} from "@infrastructure/i18n/translate";

export const LANGUAGE_STORE_KEY = "vaultfold.language.v1";

export interface LanguagePersist {
  readonly getString: (key: string) => string | undefined;
  readonly set: (key: string, value: string) => void;
  readonly remove: (key: string) => void;
}

export type Language = "en" | "ar";

interface LanguageState {
  readonly lang: Language;
  readonly isRtl: boolean;
  readonly direction: "ltr" | "rtl";
  setLang: (lang: Language) => void;
}

export interface PersistedLanguage {
  readonly version: 1;
  readonly lang: Language;
}

let boundArea: LanguagePersist | null = null;

function writePersisted(lang: Language): void {
  if (boundArea === null) {
    return;
  }
  const payload: PersistedLanguage = { version: 1, lang };
  boundArea.set(LANGUAGE_STORE_KEY, JSON.stringify(payload));
}

function applyLanguageFlags(lang: Language): boolean {
  setLanguage(lang);
  const isRtl = directionFromLangTag(lang) === "rtl";
  I18nManager.allowRTL(isRtl);
  I18nManager.forceRTL(isRtl);
  return isRtl;
}

export const useLanguageStore = create<LanguageState>((set) => {
  const initialLang = getLanguage();
  const initialRtl = directionFromLangTag(initialLang) === "rtl";
  return {
    lang: initialLang,
    isRtl: initialRtl,
    direction: initialRtl ? "rtl" : "ltr",
    setLang: (lang: Language) => {
      const isRtl = applyLanguageFlags(lang);
      set({
        lang,
        isRtl,
        direction: isRtl ? "rtl" : "ltr",
      });
      writePersisted(lang);
    },
  };
});

export function bindLanguagePersistence(area: LanguagePersist): void {
  boundArea = area;
  const raw = area.getString(LANGUAGE_STORE_KEY);
  if (raw === undefined || raw === "") {
    writePersisted(useLanguageStore.getState().lang);
    return;
  }
  try {
    const parsed = JSON.parse(raw) as PersistedLanguage;
    if (parsed?.version !== 1 || (parsed.lang !== "en" && parsed.lang !== "ar")) {
      area.remove(LANGUAGE_STORE_KEY);
      writePersisted(useLanguageStore.getState().lang);
      return;
    }
    const isRtl = applyLanguageFlags(parsed.lang);
    useLanguageStore.setState({
      lang: parsed.lang,
      isRtl,
      direction: isRtl ? "rtl" : "ltr",
    });
  } catch {
    area.remove(LANGUAGE_STORE_KEY);
    writePersisted(useLanguageStore.getState().lang);
  }
}

export function resetLanguageStore(): void {
  const isRtl = applyLanguageFlags("en");
  useLanguageStore.setState({
    lang: "en",
    isRtl,
    direction: "ltr",
  });
  if (boundArea !== null) {
    boundArea.set(LANGUAGE_STORE_KEY, "");
  }
}

export function useLanguage(): Language {
  return useLanguageStore((state) => state.lang);
}

export function languageSnapshot(): Language {
  return useLanguageStore.getState().lang;
}

export const currentLanguageSnapshot = languageSnapshot;

/**
 * Universal hook for components to consume translations and direction.
 * Subscribes reactively to the language store so any language switch
 * triggers an immediate re-render with the new translations and RTL direction.
 */
export function useTranslation() {
  const lang = useLanguageStore((state) => state.lang);
  const isRtl = useLanguageStore((state) => state.isRtl);
  const direction = useLanguageStore((state) => state.direction);

  return {
    t: (key: TxKeyPath, params?: Record<string, string | number>) => t(key, params),
    lang,
    isRtl,
    direction,
    dirInfo: dirs(),
  };
}
