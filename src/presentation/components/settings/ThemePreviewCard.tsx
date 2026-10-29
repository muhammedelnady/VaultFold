/**
 * ThemePreviewCard providing live preview canvas for Theme Studio.
 */
import { StyleSheet, Text, View } from "react-native";

import { Sparkline } from "@presentation/components/market/Sparkline";
import { useTranslation } from "@stores/languageStore";
import { useTheme } from "@stores/themeStore";
import { font } from "@theme";

export function ThemePreviewCard() {
  const theme = useTheme();
  const { t, isRtl } = useTranslation();

  return (
    <View
      testID="theme-preview-card"
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          direction: isRtl ? "rtl" : "ltr",
        },
      ]}
    >
      <View
        style={[
          styles.navBar,
          { backgroundColor: theme.colors.background, direction: isRtl ? "rtl" : "ltr" },
        ]}
        testID="theme-preview-nav-bar"
      >
        <Text
          style={[styles.navTitle, { color: theme.colors.text }]}
          testID="theme-preview-nav-title"
        >
          VaultFold
        </Text>
        <View
          style={[styles.chip, { backgroundColor: theme.accent ?? theme.colors.primary }]}
          testID="theme-preview-live-chip"
        >
          <Text
            style={[styles.chipText, { color: theme.colors.onPrimary }]}
            testID="theme-preview-live-chip-label"
          >
            {t("marketScreen.liveStatus")}
          </Text>
        </View>
      </View>
      <View
        style={[styles.balanceRow, { direction: isRtl ? "rtl" : "ltr" }]}
        testID="theme-preview-balance-row"
      >
        <View testID="theme-preview-balance-group">
          <Text
            style={[
              styles.balanceLabel,
              { color: theme.colors.muted, writingDirection: isRtl ? "rtl" : "ltr" },
            ]}
            testID="theme-preview-balance-label"
          >
            {t("portfolioScreen.totalBalance")}
          </Text>
          <Text
            style={[
              styles.balanceValue,
              { color: theme.colors.text, writingDirection: isRtl ? "rtl" : "ltr" },
            ]}
            testID="theme-preview-balance-value"
          >
            $12,345.67
          </Text>
        </View>
        <Sparkline
          data={[10, 12, 11, 14, 13, 16, 15]}
          color={theme.colors.success}
          width={80}
          height={28}
          testID="theme-preview-sparkline"
        />
      </View>
      <View
        style={[styles.actionButton, { backgroundColor: theme.accent ?? theme.colors.primary }]}
        testID="theme-preview-action-button"
      >
        <Text
          style={[styles.actionButtonText, { color: theme.colors.onPrimary }]}
          testID="theme-preview-action-button-label"
        >
          {t("portfolioScreen.addTransactionBtn")}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },
  navBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    borderRadius: 10,
  },
  navTitle: {
    ...font("bold"),
    fontSize: 14,
    fontWeight: "700",
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  chipText: {
    ...font("bold"),
    fontSize: 11,
    fontWeight: "700",
  },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  balanceLabel: {
    ...font("medium"),
    fontSize: 12,
    fontWeight: "500",
  },
  balanceValue: {
    ...font("bold"),
    fontSize: 18,
    fontWeight: "700",
  },
  actionButton: {
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  actionButtonText: {
    ...font("semibold"),
    fontSize: 13,
    fontWeight: "600",
  },
});
