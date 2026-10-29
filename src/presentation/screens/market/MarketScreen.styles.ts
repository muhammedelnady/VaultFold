/**
 * Stylesheet definitions for MarketScreen.
 */

import { StyleSheet } from "react-native";

import { font } from "@theme";
import type { Theme } from "@theme/themeEngine";

export function createMarketStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    screenWrapper: {
      flex: 1,
    },
    header: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 8,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    statusRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
    },
    title: {
      ...font("bold"),
      fontSize: 22,
      fontWeight: "700",
      color: theme.colors.text,
    },
    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderRadius: 10,
      paddingHorizontal: 12,
      height: 40,
      marginBottom: 10,
    },
    searchInput: {
      ...font("regular"),
      flex: 1,
      fontSize: 14,
      color: theme.colors.text,
      paddingVertical: 4,
    },
    sortRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    sortChip: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    sortChipActive: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.accent,
    },
    sortChipText: {
      ...font("medium"),
      fontSize: 12,
      color: theme.colors.secondary,
      fontWeight: "500",
    },
    sortChipTextActive: {
      ...font("bold"),
      color: theme.accent,
      fontWeight: "700",
    },
    emptyContainer: {
      padding: 32,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyText: {
      ...font("regular"),
      fontSize: 15,
      color: theme.colors.secondary,
      textAlign: "center",
      marginTop: 8,
    },
    categoryRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 10,
      flexWrap: "wrap",
    },
    categoryChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    categoryChipActive: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.accent,
    },
    categoryChipText: {
      ...font("medium"),
      fontSize: 12,
      color: theme.colors.secondary,
      fontWeight: "500",
    },
    categoryChipTextActive: {
      ...font("bold"),
      color: theme.accent,
      fontWeight: "700",
    },
    sortIndicator: {
      position: "absolute",
      bottom: -4,
      start: "50%",
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.accent,
    },
    emptyDetailPane: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    },
    emptyDetailText: {
      ...font("regular"),
      fontSize: 14,
      color: theme.colors.muted,
      textAlign: "center",
    },
  });
}
