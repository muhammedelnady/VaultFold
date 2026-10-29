/**
 * Stylesheet definitions for CoinDetailScreen.
 */

import { StyleSheet } from "react-native";

import { font } from "@theme";
import type { Theme } from "@theme/themeEngine";

export function createCoinDetailStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    screenWrapper: {
      flex: 1,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    backButton: {
      padding: 8,
      marginEnd: 8,
    },
    backButtonText: {
      ...font("semibold"),
      fontSize: 22,
      fontWeight: "600",
      color: theme.colors.text,
    },
    coinNameGroup: {
      flex: 1,
    },
    coinName: {
      ...font("bold"),
      fontSize: 18,
      fontWeight: "700",
      color: theme.colors.text,
    },
    coinSymbol: {
      ...font("semibold"),
      fontSize: 13,
      fontWeight: "600",
      color: theme.colors.muted,
      marginTop: 2,
    },
    headerActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    iconButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    iconButtonText: {
      ...font("regular"),
      fontSize: 16,
      color: theme.colors.text,
    },
    priceHero: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 8,
    },
    currentPrice: {
      ...font("bold"),
      fontSize: 30,
      fontWeight: "800",
      color: theme.colors.text,
    },
    changeRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 6,
    },
    changeBadge: {
      ...font("bold"),
      fontSize: 14,
      fontWeight: "700",
    },
    scrollContent: {
      paddingBottom: 48,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      ...font("regular"),
      fontSize: 14,
      color: theme.colors.muted,
      marginTop: 8,
    },
    tabletopTop: {
      flex: 1,
      paddingHorizontal: 0,
    },
    tabletopBottom: {
      flex: 1,
    },
  });
}
