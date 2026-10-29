/**
 * Localization and Currency settings section component.
 */
import * as Haptics from "expo-haptics";
import { Pressable, Text, View } from "react-native";

import {
  CURRENCY_CONFIGS,
  type EgpCrossRate,
  SUPPORTED_CURRENCIES,
  type SupportedCurrency,
} from "@domain/currency/CurrencyTypes";
import { styles } from "@presentation/screens/settings/SettingsScreen.styles";
import type { Language } from "@stores/languageStore";
import { useTranslation } from "@stores/languageStore";
import { useTheme } from "@stores/themeStore";

export interface LocalizationSectionProps {
  readonly lang: Language;
  readonly currency: SupportedCurrency;
  readonly egpCrossRate: EgpCrossRate | null;
  readonly onSelectLanguage: (lang: Language) => void;
  readonly onSelectCurrency: (currency: SupportedCurrency) => void;
}

export function LocalizationSection({
  lang,
  currency,
  egpCrossRate,
  onSelectLanguage,
  onSelectCurrency,
}: LocalizationSectionProps) {
  const theme = useTheme();
  const { t, isRtl } = useTranslation();

  return (
    <View
      style={[styles.section, { direction: isRtl ? "rtl" : "ltr" }]}
      testID="settings-localization-section"
    >
      <Text
        style={[
          styles.sectionTitle,
          {
            color: theme.colors.muted,
            writingDirection: isRtl ? "rtl" : "ltr",
          },
        ]}
        testID="settings-localization-title"
      >
        {t("settingsScreen.localizationSection")}
      </Text>
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            direction: isRtl ? "rtl" : "ltr",
          },
        ]}
        testID="settings-localization-card"
      >
        <View
          style={[
            styles.row,
            { borderBottomColor: theme.colors.border, direction: isRtl ? "rtl" : "ltr" },
          ]}
          testID="settings-language-row"
        >
          <View testID="settings-language-label-group">
            <Text
              style={[
                styles.rowLabel,
                { color: theme.colors.text, writingDirection: isRtl ? "rtl" : "ltr" },
              ]}
              testID="settings-language-label"
            >
              {t("settingsScreen.languageLabel")}
            </Text>
            <Text
              style={[
                styles.rowSubtext,
                { color: theme.colors.muted, writingDirection: isRtl ? "rtl" : "ltr" },
              ]}
              testID="settings-language-subtext"
            >
              {t("settingsScreen.languageSubtext")}
            </Text>
          </View>
          <View
            style={[styles.pillGroup, { direction: isRtl ? "rtl" : "ltr" }]}
            testID="settings-language-pills"
          >
            <Pressable
              testID="btn-lang-en"
              nativeID="settings.language-en"
              style={[
                styles.pill,
                {
                  backgroundColor:
                    lang === "en" ? (theme.accent ?? theme.colors.primary) : "transparent",
                  borderColor:
                    lang === "en" ? (theme.accent ?? theme.colors.primary) : theme.colors.border,
                },
              ]}
              onPress={() => {
                void Haptics.selectionAsync();
                onSelectLanguage("en");
              }}
            >
              <Text
                style={
                  lang === "en"
                    ? [styles.pillTextActive, { color: theme.colors.onPrimary }]
                    : [styles.pillText, { color: theme.colors.text }]
                }
                testID="btn-lang-en-label"
              >
                English
              </Text>
            </Pressable>

            <Pressable
              testID="btn-lang-ar"
              nativeID="settings.language-ar"
              style={[
                styles.pill,
                {
                  backgroundColor:
                    lang === "ar" ? (theme.accent ?? theme.colors.primary) : "transparent",
                  borderColor:
                    lang === "ar" ? (theme.accent ?? theme.colors.primary) : theme.colors.border,
                },
              ]}
              onPress={() => {
                void Haptics.selectionAsync();
                onSelectLanguage("ar");
              }}
            >
              <Text
                style={
                  lang === "ar"
                    ? [styles.pillTextActive, { color: theme.colors.onPrimary }]
                    : [styles.pillText, { color: theme.colors.text }]
                }
                testID="btn-lang-ar-label"
              >
                العربية
              </Text>
            </Pressable>
          </View>
        </View>

        <View
          style={[
            styles.row,
            { borderBottomColor: theme.colors.border, direction: isRtl ? "rtl" : "ltr" },
          ]}
          testID="settings-currency-row"
        >
          <View testID="settings-currency-label-group">
            <Text
              style={[
                styles.rowLabel,
                { color: theme.colors.text, writingDirection: isRtl ? "rtl" : "ltr" },
              ]}
              testID="settings-currency-label"
            >
              {t("settingsScreen.currencyLabel")}
            </Text>
            <Text
              style={[
                styles.rowSubtext,
                { color: theme.colors.muted, writingDirection: isRtl ? "rtl" : "ltr" },
              ]}
              testID="settings-currency-subtext"
            >
              {t("settingsScreen.currencySubtext")}
            </Text>
          </View>
          <View
            style={[styles.pillGroup, { direction: isRtl ? "rtl" : "ltr" }]}
            testID="settings-currency-pills"
          >
            {SUPPORTED_CURRENCIES.map((c) => {
              const isSelected = currency === c;
              const cfg = CURRENCY_CONFIGS[c];
              return (
                <Pressable
                  key={c}
                  testID={`btn-currency-${c.toLowerCase()}`}
                  nativeID={c === "egp" ? "settings.currency-egp" : undefined}
                  style={[
                    styles.pill,
                    {
                      backgroundColor: isSelected
                        ? (theme.accent ?? theme.colors.primary)
                        : "transparent",
                      borderColor: isSelected
                        ? (theme.accent ?? theme.colors.primary)
                        : theme.colors.border,
                    },
                  ]}
                  onPress={() => {
                    void Haptics.selectionAsync();
                    onSelectCurrency(c);
                  }}
                >
                  <Text
                    style={
                      isSelected
                        ? [styles.pillTextActive, { color: theme.colors.onPrimary }]
                        : [styles.pillText, { color: theme.colors.text }]
                    }
                    testID={`btn-currency-${c.toLowerCase()}-label`}
                  >
                    {cfg.symbol} {c}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {currency === "egp" && egpCrossRate ? (
          <View
            testID="egp-cross-rate-info"
            style={[styles.infoBox, { direction: isRtl ? "rtl" : "ltr" }]}
          >
            <Text
              style={[
                styles.rowSubtext,
                { color: theme.colors.muted, writingDirection: isRtl ? "rtl" : "ltr" },
              ]}
              testID="egp-cross-rate-text"
            >
              {t("settingsScreen.egpCrossRate", { rate: egpCrossRate.rate })}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}
