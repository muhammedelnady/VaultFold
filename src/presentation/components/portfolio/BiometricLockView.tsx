/**
 * Biometric Lock View rendering lock gate when portfolio is locked.
 */
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTranslation } from "@stores/languageStore";
import { useTheme } from "@stores/themeStore";
import { useVaultAuthStore } from "@stores/vaultAuthStore";
import { font } from "@theme";

export function BiometricLockView() {
  const theme = useTheme();
  const { t, isRtl } = useTranslation();
  const { unlock, enterDemoMode, isAuthenticating, capabilities } = useVaultAuthStore();

  const hasBiometrics = capabilities?.hasHardware && capabilities?.isEnrolled;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
          direction: isRtl ? "rtl" : "ltr",
        },
      ]}
      testID="biometric-lock-view"
      nativeID="vault.biometric-gate"
    >
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
        testID="biometric-lock-card"
      >
        <Text style={styles.lockIcon} testID="biometric-lock-icon">
          🔒
        </Text>

        <Text
          style={[
            styles.title,
            {
              color: theme.colors.text,
              writingDirection: isRtl ? "rtl" : "ltr",
            },
          ]}
          testID="biometric-lock-title"
        >
          {t("portfolioScreen.vaultLocked")}
        </Text>

        <Text
          style={[
            styles.subtitle,
            {
              color: theme.colors.muted,
              writingDirection: isRtl ? "rtl" : "ltr",
            },
          ]}
          testID="biometric-lock-subtitle"
        >
          {hasBiometrics ? t("portfolioScreen.bioSubtitle") : t("portfolioScreen.demoSubtitle")}
        </Text>

        {hasBiometrics ? (
          <Pressable
            testID="btn-unlock-vault"
            nativeID="vault.unlock-button"
            style={[styles.unlockBtn, { backgroundColor: theme.accent ?? theme.colors.primary }]}
            onPress={() => void unlock()}
            disabled={isAuthenticating}
          >
            <Text
              style={[styles.unlockBtnText, { color: theme.colors.onPrimary }]}
              testID="btn-unlock-vault-label"
            >
              {isAuthenticating ? t("portfolioScreen.verifying") : t("portfolioScreen.unlockVault")}
            </Text>
          </Pressable>
        ) : null}

        <Pressable
          testID="btn-demo-mode"
          nativeID="vault.demo-mode-button"
          style={[styles.demoBtn, { borderColor: theme.colors.border }]}
          onPress={enterDemoMode}
        >
          <Text
            style={[styles.demoBtnText, { color: theme.colors.text }]}
            testID="btn-demo-mode-label"
          >
            {t("portfolioScreen.continueDemo")}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 20,
    borderWidth: 1,
    padding: 32,
    alignItems: "center",
  },
  lockIcon: {
    ...font("regular"),
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    ...font("bold"),
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    ...font("regular"),
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  unlockBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  unlockBtnText: {
    ...font("semibold"),
    fontSize: 16,
    fontWeight: "600",
  },
  demoBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  demoBtnText: {
    ...font("medium"),
    fontSize: 15,
    fontWeight: "500",
  },
});
