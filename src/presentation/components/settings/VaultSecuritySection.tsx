/**
 * Vault Security settings section component.
 */
import * as Haptics from "expo-haptics";
import { Pressable, Switch, Text, View } from "react-native";

import { styles } from "@presentation/screens/settings/SettingsScreen.styles";
import { useTranslation } from "@stores/languageStore";
import { useTheme } from "@stores/themeStore";
import { AUTO_LOCK_TIMEOUTS, useVaultAuthStore } from "@stores/vaultAuthStore";

export interface VaultSecuritySectionProps {
  readonly autoLockTimeout: number;
  readonly screenProtectionEnabled: boolean;
  readonly onSelectAutoLock: (timeoutMs: number) => void;
  readonly onToggleScreenProtection: () => void;
}

const TIMEOUT_OPTIONS = [
  { label: "Immediate", val: AUTO_LOCK_TIMEOUTS.IMMEDIATE },
  { label: "30s", val: AUTO_LOCK_TIMEOUTS.THIRTY_SECONDS },
  { label: "1m", val: AUTO_LOCK_TIMEOUTS.ONE_MINUTE },
  { label: "5m", val: AUTO_LOCK_TIMEOUTS.FIVE_MINUTES },
] as const;

export function VaultSecuritySection({
  autoLockTimeout,
  screenProtectionEnabled,
  onSelectAutoLock,
  onToggleScreenProtection,
}: VaultSecuritySectionProps) {
  const theme = useTheme();
  const { t, isRtl } = useTranslation();
  const capabilities = useVaultAuthStore((s) => s.capabilities);
  const hasBiometrics = Boolean(capabilities?.hasHardware && capabilities?.isEnrolled);

  return (
    <View
      style={[styles.section, { direction: isRtl ? "rtl" : "ltr" }]}
      testID="settings-security-section"
    >
      <Text
        style={[
          styles.sectionTitle,
          {
            color: theme.colors.muted,
            writingDirection: isRtl ? "rtl" : "ltr",
          },
        ]}
        testID="settings-security-title"
      >
        {t("settingsScreen.securitySection")}
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
        testID="settings-security-card"
      >
        <View
          style={[
            styles.row,
            { borderBottomColor: theme.colors.border, direction: isRtl ? "rtl" : "ltr" },
          ]}
          testID="settings-biometrics-row"
        >
          <View testID="settings-biometrics-label-group">
            <Text
              style={[
                styles.rowLabel,
                { color: theme.colors.text, writingDirection: isRtl ? "rtl" : "ltr" },
              ]}
              testID="settings-biometrics-label"
            >
              {t("settingsScreen.biometricsTitle")}
            </Text>
            <Text
              style={[
                styles.rowSubtext,
                { color: theme.colors.muted, writingDirection: isRtl ? "rtl" : "ltr" },
              ]}
              testID="settings-biometrics-subtext"
            >
              {hasBiometrics
                ? t("settingsScreen.biometricsSubtext")
                : t("portfolioScreen.demoSubtitle")}
            </Text>
          </View>
          <Text
            style={[styles.rowValue, { color: theme.colors.muted }]}
            testID="settings-biometrics-value"
          >
            {hasBiometrics ? t("common.active") : t("common.paused")}
          </Text>
        </View>

        <View
          style={[
            styles.row,
            { borderBottomColor: theme.colors.border, direction: isRtl ? "rtl" : "ltr" },
          ]}
          testID="settings-auto-lock-row"
        >
          <View testID="settings-auto-lock-label-group">
            <Text
              style={[
                styles.rowLabel,
                { color: theme.colors.text, writingDirection: isRtl ? "rtl" : "ltr" },
              ]}
              testID="settings-auto-lock-label"
            >
              {t("settingsScreen.autoLockTitle")}
            </Text>
            <Text
              style={[
                styles.rowSubtext,
                { color: theme.colors.muted, writingDirection: isRtl ? "rtl" : "ltr" },
              ]}
              testID="settings-auto-lock-subtext"
            >
              {t("settingsScreen.autoLockSubtext")}
            </Text>
          </View>
        </View>

        <View
          style={[styles.pillGroup, { direction: isRtl ? "rtl" : "ltr" }]}
          testID="settings-auto-lock-pills"
        >
          {TIMEOUT_OPTIONS.map(({ label, val }) => {
            const isSelected = autoLockTimeout === val;
            const activeColor = theme.accent ?? theme.colors.primary;
            return (
              <Pressable
                key={label}
                testID={`btn-autolock-${label.toLowerCase()}`}
                style={[
                  styles.pill,
                  {
                    backgroundColor: isSelected ? activeColor : "transparent",
                    borderColor: isSelected ? activeColor : theme.colors.border,
                  },
                ]}
                onPress={() => {
                  void Haptics.selectionAsync();
                  onSelectAutoLock(val);
                }}
              >
                <Text
                  style={
                    isSelected
                      ? [styles.pillTextActive, { color: theme.colors.onPrimary }]
                      : [styles.pillText, { color: theme.colors.text }]
                  }
                  testID={`btn-autolock-${label.toLowerCase()}-label`}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View
          style={[styles.row, { direction: isRtl ? "rtl" : "ltr" }]}
          testID="settings-screen-protection-row"
        >
          <View testID="settings-screen-protection-label-group">
            <Text
              style={[
                styles.rowLabel,
                { color: theme.colors.text, writingDirection: isRtl ? "rtl" : "ltr" },
              ]}
              testID="settings-screen-protection-label"
            >
              {t("settingsScreen.screenProtectionTitle")}
            </Text>
            <Text
              style={[
                styles.rowSubtext,
                { color: theme.colors.muted, writingDirection: isRtl ? "rtl" : "ltr" },
              ]}
              testID="settings-screen-protection-subtext"
            >
              {t("settingsScreen.screenProtectionSubtext")}
            </Text>
          </View>
          <Switch
            testID="switch-screen-protection"
            nativeID="switch-screen-protection"
            value={screenProtectionEnabled}
            onValueChange={onToggleScreenProtection}
            trackColor={{ false: theme.colors.border, true: theme.accent ?? theme.colors.primary }}
          />
        </View>
      </View>
    </View>
  );
}
