/**
 * Language store: EN/AR with direction plumbing.
 * RTL flips write through the translator module; I18nManager flags are set
 * once for RTL support.
 */
import { beforeEach, describe, expect, it } from "@jest/globals";
import { render } from "@testing-library/react-native";
import { Text } from "react-native";

import { dirs, getDirection, getLanguage, t } from "@infrastructure/i18n/translate";

import {
  bindLanguagePersistence,
  currentLanguageSnapshot,
  LANGUAGE_STORE_KEY,
  languageSnapshot,
  resetLanguageStore,
  useLanguage,
  useLanguageStore,
  type LanguagePersist,
} from "./languageStore";

function memoryArea(): LanguagePersist {
  const map = new Map<string, string>();
  return {
    getString: (key) => map.get(key),
    set: (key, value) => void map.set(key, value),
    remove: (key) => void map.delete(key),
  };
}

describe("languageStore + translator plumbing", () => {
  beforeEach(() => {
    resetLanguageStore();
  });

  it("t() reads the translator bundle for the active language", () => {
    expect(getLanguage()).toBe("en");
    expect(t("welcome")).toBe("Welcome");
  });

  it("setLang('ar') flips translator language + direction to RTL", () => {
    useLanguageStore.getState().setLang("ar");
    expect(getLanguage()).toBe("ar");
    expect(getDirection()).toBe("rtl");
    expect(t("welcome")).toBe("مرحباً");
    expect(dirs()).toMatchObject({ direction: "rtl", isRTL: true });
  });

  it("setLang('en') restores LTR specifics", () => {
    useLanguageStore.getState().setLang("en");
    expect(getDirection()).toBe("ltr");
    expect(dirs().dirStyle).toEqual({ writingDirection: "ltr" });
  });

  it("persists JSON and rebinds from storage", () => {
    const area = memoryArea();
    bindLanguagePersistence(area);
    useLanguageStore.getState().setLang("ar");
    const raw = area.getString(LANGUAGE_STORE_KEY);
    expect(raw).toBeDefined();
    expect(JSON.parse(raw ?? "{}")).toMatchObject({ version: 1, lang: "ar" });

    resetLanguageStore();
    area.set(LANGUAGE_STORE_KEY, JSON.stringify({ version: 1, lang: "ar" }));
    bindLanguagePersistence(area);
    expect(useLanguageStore.getState().lang).toBe("ar");
    expect(getLanguage()).toBe("ar");
  });

  it("resetLanguageStore returns to en/LTR and clears persistence", () => {
    const area = memoryArea();
    bindLanguagePersistence(area);
    useLanguageStore.getState().setLang("ar");
    resetLanguageStore();
    expect(useLanguageStore.getState().lang).toBe("en");
    expect(getDirection()).toBe("ltr");
    expect(area.getString(LANGUAGE_STORE_KEY)).toBe("");
  });

  it("languageSnapshot reads the store state (non-hook)", () => {
    expect(languageSnapshot()).toBe("en");
    expect(currentLanguageSnapshot()).toBe("en");
    useLanguageStore.getState().setLang("ar");
    expect(languageSnapshot()).toBe("ar");
    expect(currentLanguageSnapshot()).toBe("ar");
  });

  it("handles corrupted JSON gracefully during bindLanguagePersistence", () => {
    const area = memoryArea();
    area.set(LANGUAGE_STORE_KEY, "corrupted-json");
    bindLanguagePersistence(area);
    expect(useLanguageStore.getState().lang).toBe("en");
  });

  it("handles invalid version or invalid lang during bindLanguagePersistence", () => {
    const area = memoryArea();
    area.set(LANGUAGE_STORE_KEY, JSON.stringify({ version: 99, lang: "fr" }));
    bindLanguagePersistence(area);
    expect(useLanguageStore.getState().lang).toBe("en");
  });

  it("useLanguage returns active language in component render", async () => {
    function LangTester() {
      const lang = useLanguage();
      return <Text testID="lang-val">{lang}</Text>;
    }
    const { getByTestId } = await render(<LangTester />);
    expect(getByTestId("lang-val").props["children"]).toBe("en");
  });
});
