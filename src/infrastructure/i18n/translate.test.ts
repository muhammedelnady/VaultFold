/**
 * Tests for i18n translation dispatcher and direction handling.
 */
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { I18nManager } from "react-native";

import { dirs, getDirection, getLanguage, setLanguage, t, type TxKeyPath } from "./translate";

describe("i18n translate", () => {
  beforeEach(() => {
    setLanguage("en");
  });

  it("translates existing keys in English", () => {
    expect(t("welcome")).toBe("Welcome");
    expect(getLanguage()).toBe("en");
    expect(getDirection()).toBe("ltr");
    expect(dirs()).toEqual({
      direction: "ltr",
      isRTL: false,
      dirStyle: { writingDirection: "ltr" },
    });
  });

  it("translates existing keys in Arabic and sets RTL direction", () => {
    setLanguage("ar");
    expect(t("welcome")).toBe("مرحباً");
    expect(getLanguage()).toBe("ar");
    expect(getDirection()).toBe("rtl");
    expect(dirs()).toEqual({
      direction: "rtl",
      isRTL: true,
      dirStyle: { writingDirection: "rtl" },
    });
  });

  it("resets forceRTL to false when switching from Arabic to English", () => {
    const forceRTLSpy = jest.spyOn(I18nManager, "forceRTL");
    setLanguage("ar");
    expect(forceRTLSpy).toHaveBeenCalledWith(true);
    setLanguage("en");
    expect(forceRTLSpy).toHaveBeenCalledWith(false);
  });

  it("throws descriptive error on missing translation key", () => {
    expect(() => t("non_existent_key" as TxKeyPath)).toThrow(
      "Missing translation key: non_existent_key",
    );
  });
});
