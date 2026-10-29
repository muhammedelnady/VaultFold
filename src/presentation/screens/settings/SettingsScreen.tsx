/**
 * Settings Screen composing localization, theme studio, vault security, foldable preview, and danger zone.
 */
import * as Haptics from "expo-haptics";
import { Pressable, ScrollView, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { PostureSwitcher } from "@core/foldable/PostureSwitcher";
import { getContainer } from "@di/container";
import { DangerZoneModal } from "@presentation/components/settings/DangerZoneModal";
import { LocalizationSection } from "@presentation/components/settings/LocalizationSection";
import { ThemePreviewCard } from "@presentation/components/settings/ThemePreviewCard";
import { VaultSecuritySection } from "@presentation/components/settings/VaultSecuritySection";
import { useTranslation } from "@stores/languageStore";
import { useTheme } from "@stores/themeStore";

import {
  DARK_PRESET_ACCENTS,
  LIGHT_PRESET_ACCENTS,
  useSettingsViewModel,
} from "./settings.viewmodel";
import { styles } from "./SettingsScreen.styles";

export function SettingsScreen() {
  const theme = useTheme();
  const { t, isRtl } = useTranslation();
  const vm = useSettingsViewModel();

  const handleEraseAllData = async () => {
    await vm.onEraseAllData();
    try {
      getContainer().queryClient?.clear();
    } catch {
      void 0;
    }
  };

  const muted = { color: theme.colors.muted };
  const cardStyle = [
    styles.card,
    { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
  ];
  const dangerCardStyle = [
    styles.dangerCard,
    { backgroundColor: theme.colors.surface, borderColor: theme.colors.error },
  ];
  const rowStyle = [styles.row, { borderBottomColor: theme.colors.border }];
  const postureTokens = {
    chipBackground: theme.colors.surface,
    chipActiveBackground: theme.accent ?? theme.colors.primary,
    chipText: theme.colors.text,
    chipActiveText: theme.colors.onPrimary,
    chipBorder: theme.colors.border,
    chipActiveBorder: theme.accent ?? theme.colors.primary,
  };

  const presets = vm.mode === "dark" ? DARK_PRESET_ACCENTS : LIGHT_PRESET_ACCENTS;

  return (
    <View
      style={[styles.screenWrapper, { backgroundColor: theme.colors.background }]}
      testID="settings.screen"
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.colors.background,
            direction: isRtl ? "rtl" : "ltr",
          },
        ]}
        testID="settings-screen"
      >
        <Animated.View
          key={vm.lang}
          entering={FadeIn.duration(220)}
          style={styles.mirrorContainer}
          testID="settings-mirror-container"
        >
          <ScrollView contentContainerStyle={styles.scrollContent} testID="settings-scroll-view">
            <View
              style={[styles.header, { direction: isRtl ? "rtl" : "ltr" }]}
              testID="settings-header"
            >
              <Text
                style={[
                  styles.title,
                  { color: theme.colors.text, writingDirection: isRtl ? "rtl" : "ltr" },
                ]}
                testID="settings-title"
              >
                {t("settingsScreen.title")}
              </Text>
              <Text
                style={[styles.subtitle, muted, { writingDirection: isRtl ? "rtl" : "ltr" }]}
                testID="settings-subtitle"
              >
                {t("settingsScreen.subtitle")}
              </Text>
            </View>

            <LocalizationSection
              lang={vm.lang}
              currency={vm.currency}
              egpCrossRate={vm.egpCrossRate}
              onSelectLanguage={vm.onSelectLanguage}
              onSelectCurrency={vm.onSelectCurrency}
            />

            <View
              style={[styles.section, { direction: isRtl ? "rtl" : "ltr" }]}
              testID="settings-theme-section"
            >
              <Text
                style={[styles.sectionTitle, muted, { writingDirection: isRtl ? "rtl" : "ltr" }]}
                testID="settings-theme-title"
              >
                {t("settingsScreen.themeStudio")}
              </Text>
              <View style={cardStyle} testID="settings-theme-card">
                <ThemePreviewCard />

                <View
                  style={[rowStyle, { direction: isRtl ? "rtl" : "ltr" }]}
                  testID="settings-color-mode-row"
                >
                  <View>
                    <Text
                      style={[
                        styles.rowLabel,
                        { color: theme.colors.text, writingDirection: isRtl ? "rtl" : "ltr" },
                      ]}
                      testID="settings-color-mode-label"
                    >
                      {t("settingsScreen.colorMode")}
                    </Text>
                    <Text
                      style={[
                        styles.rowSubtext,
                        muted,
                        { writingDirection: isRtl ? "rtl" : "ltr" },
                      ]}
                      testID="settings-color-mode-subtext"
                    >
                      {t("settingsScreen.colorModeSubtext")}
                    </Text>
                  </View>
                  <View
                    style={[styles.pillGroup, { direction: isRtl ? "rtl" : "ltr" }]}
                    testID="settings-color-mode-pills"
                  >
                    {(["light", "dark"] as const).map((mode) => {
                      const isSelected = vm.mode === mode;
                      const activeBg = theme.accent ?? theme.colors.primary;
                      const activeText = theme.colors.onPrimary;
                      return (
                        <Pressable
                          key={mode}
                          testID={`btn-theme-${mode}`}
                          style={[
                            styles.pill,
                            {
                              backgroundColor: isSelected ? activeBg : "transparent",
                              borderColor: isSelected ? activeBg : theme.colors.border,
                            },
                          ]}
                          onPress={() => {
                            void Haptics.selectionAsync();
                            vm.onSelectMode(mode);
                          }}
                        >
                          <Text
                            style={
                              isSelected
                                ? [styles.pillTextActive, { color: activeText }]
                                : [styles.pillText, { color: theme.colors.text }]
                            }
                            testID={`btn-theme-${mode}-label`}
                          >
                            {mode === "light"
                              ? t("settingsScreen.light")
                              : t("settingsScreen.dark")}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <View
                  style={[styles.accentPickerContainer, { direction: isRtl ? "rtl" : "ltr" }]}
                  testID="settings-accent-picker"
                >
                  <Text
                    style={[
                      styles.rowLabel,
                      { color: theme.colors.text, writingDirection: isRtl ? "rtl" : "ltr" },
                    ]}
                    testID="settings-accent-label"
                  >
                    {t("settingsScreen.accentColor")}
                  </Text>
                  <Text
                    style={[styles.rowSubtext, muted, { writingDirection: isRtl ? "rtl" : "ltr" }]}
                    testID="settings-accent-subtext"
                  >
                    {t("settingsScreen.accentSubtext")}
                  </Text>
                  <View
                    style={[styles.accentRow, { direction: isRtl ? "rtl" : "ltr" }]}
                    testID="settings-accent-row"
                  >
                    {presets.map((preset) => {
                      const isSelected = vm.accent === preset.hex;
                      return (
                        <Pressable
                          key={preset.name}
                          testID={`accent-swatch-${preset.name.toLowerCase()}`}
                          style={[
                            styles.accentSwatch,
                            { backgroundColor: preset.hex },
                            isSelected && { borderColor: theme.colors.text, borderWidth: 2 },
                          ]}
                          onPress={() => {
                            void Haptics.selectionAsync();
                            vm.onSelectAccent(preset.hex);
                          }}
                        >
                          {isSelected ? (
                            <Text
                              style={[styles.accentCheckmark, { color: theme.colors.onPrimary }]}
                              testID={`accent-swatch-${preset.name.toLowerCase()}-checkmark`}
                            >
                              ✓
                            </Text>
                          ) : null}
                        </Pressable>
                      );
                    })}
                  </View>
                  {vm.contrastError ? (
                    <Text
                      testID="contrast-error"
                      style={[styles.contrastWarning, { color: theme.colors.error }]}
                    >
                      {t("settingsScreen.contrastError")}
                    </Text>
                  ) : null}
                </View>
              </View>
            </View>

            <VaultSecuritySection
              autoLockTimeout={vm.autoLockTimeout}
              screenProtectionEnabled={vm.screenProtectionEnabled}
              onSelectAutoLock={vm.onSelectAutoLock}
              onToggleScreenProtection={vm.onToggleScreenProtection}
            />

            <View
              style={[styles.section, { direction: isRtl ? "rtl" : "ltr" }]}
              testID="settings-foldable-section"
            >
              <Text
                style={[styles.sectionTitle, muted, { writingDirection: isRtl ? "rtl" : "ltr" }]}
                testID="settings-foldable-title"
              >
                {t("settingsScreen.foldablePreview")}
              </Text>
              <View style={cardStyle} testID="settings-foldable-card">
                <Text
                  style={[styles.rowSubtext, muted, { writingDirection: isRtl ? "rtl" : "ltr" }]}
                  testID="settings-foldable-subtext"
                >
                  {t("settingsScreen.foldableSubtext")}
                </Text>
                <PostureSwitcher tokens={postureTokens} />
              </View>
            </View>

            <View
              style={[styles.section, { direction: isRtl ? "rtl" : "ltr" }]}
              testID="settings-danger-section"
            >
              <Text
                style={[
                  styles.sectionTitle,
                  { color: theme.colors.error, writingDirection: isRtl ? "rtl" : "ltr" },
                ]}
                testID="settings-danger-title"
              >
                {t("settingsScreen.dangerZone")}
              </Text>
              <View style={dangerCardStyle} testID="settings-danger-card">
                <Text
                  style={[
                    styles.dangerTitle,
                    { color: theme.colors.error, writingDirection: isRtl ? "rtl" : "ltr" },
                  ]}
                  testID="settings-danger-card-title"
                >
                  {t("settingsScreen.eraseAllData")}
                </Text>
                <Text
                  style={[
                    styles.dangerDescription,
                    muted,
                    { writingDirection: isRtl ? "rtl" : "ltr" },
                  ]}
                  testID="settings-danger-description"
                >
                  {t("settingsScreen.eraseDataSubtext")}
                </Text>
                <Pressable
                  testID="btn-open-wipe-modal"
                  style={[styles.dangerButton, { backgroundColor: theme.colors.error }]}
                  onPress={() => vm.setIsConfirmWipeOpen(true)}
                >
                  <Text
                    style={[styles.dangerButtonText, { color: theme.colors.onError }]}
                    testID="btn-open-wipe-modal-label"
                  >
                    {t("settingsScreen.eraseAllData")}
                  </Text>
                </Pressable>
              </View>
            </View>

            <View
              style={[styles.section, { direction: isRtl ? "rtl" : "ltr" }]}
              testID="settings-about-section"
            >
              <Text
                style={[styles.sectionTitle, muted, { writingDirection: isRtl ? "rtl" : "ltr" }]}
                testID="settings-about-title"
              >
                {t("settingsScreen.aboutSection")}
              </Text>
              <View style={cardStyle} testID="settings-about-card">
                <View
                  style={[rowStyle, { direction: isRtl ? "rtl" : "ltr" }]}
                  testID="settings-version-row"
                >
                  <Text
                    style={[styles.rowLabel, { color: theme.colors.text }]}
                    testID="settings-app-name"
                  >
                    VaultFold
                  </Text>
                  <Text style={[styles.rowValue, muted]} testID="settings-version-value">
                    {t("settingsScreen.version")}
                  </Text>
                </View>
                <View style={{ paddingTop: 8 }} testID="settings-about-text">
                  <Text
                    style={[
                      styles.infoText,
                      { color: theme.colors.text, writingDirection: isRtl ? "rtl" : "ltr" },
                    ]}
                    testID="settings-compliance-notice"
                  >
                    {t("settingsScreen.complianceNotice")}
                  </Text>
                  <Text
                    style={[
                      styles.infoText,
                      { ...muted, marginTop: 4, writingDirection: isRtl ? "rtl" : "ltr" },
                    ]}
                    testID="settings-coingecko-attribution"
                  >
                    {t("settingsScreen.coingeckoAttribution")}
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </Animated.View>

        <DangerZoneModal
          visible={vm.isConfirmWipeOpen}
          onCancel={() => vm.setIsConfirmWipeOpen(false)}
          onConfirm={handleEraseAllData}
        />
      </View>
    </View>
  );
}
