/**
 * Outbox Inspector Sheet Styles.
 * Token-driven styles with logical properties and zero hex literals.
 */
import { StyleSheet } from "react-native";

import { font, type Theme } from "@theme";

export function createOutboxInspectorStyles(theme: Theme) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: "rgba(0,0,0,0.5)",
    },
    backdrop: {
      ...StyleSheet.absoluteFill,
    },
    sheet: {
      borderTopStartRadius: 20,
      borderTopEndRadius: 20,
      maxHeight: "80%",
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 32,
      backgroundColor: theme.colors.surface,
    },
    connectivityBanner: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
      marginBottom: 12,
      alignItems: "center",
      backgroundColor: theme.colors.success,
    },
    connectivityBannerOffline: {
      backgroundColor: theme.colors.error,
    },
    connectivityBannerText: {
      ...font("semibold"),
      color: theme.colors.onPrimary,
      fontSize: 12,
      fontWeight: "600",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 16,
    },
    title: {
      ...font("bold"),
      fontSize: 18,
      fontWeight: "700",
      color: theme.colors.text,
    },
    subtitle: {
      ...font("regular"),
      fontSize: 12,
      marginTop: 2,
      color: theme.colors.muted,
    },
    closeBtn: {
      padding: 6,
    },
    closeText: {
      ...font("bold"),
      fontSize: 18,
      fontWeight: "bold",
      color: theme.colors.text,
    },
    badgeRow: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 16,
    },
    badge: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
      backgroundColor: theme.colors.border,
    },
    badgeInflight: {
      backgroundColor: theme.accent,
    },
    badgeFailed: {
      backgroundColor: theme.colors.error,
    },
    badgeLabel: {
      ...font("semibold"),
      fontSize: 12,
      fontWeight: "600",
      color: theme.colors.text,
    },
    badgeLabelInflight: {
      ...font("semibold"),
      fontSize: 12,
      fontWeight: "600",
      color: theme.colors.onPrimary,
    },
    badgeLabelFailed: {
      color: theme.colors.onError,
    },
    actionRow: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 16,
    },
    actionBtn: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 8,
      backgroundColor: theme.accent,
    },
    actionBtnSecondary: {
      backgroundColor: theme.colors.border,
    },
    actionBtnText: {
      ...font("semibold"),
      color: theme.colors.onPrimary,
      fontWeight: "600",
      fontSize: 13,
    },
    actionBtnTextSecondary: {
      ...font("semibold"),
      fontWeight: "600",
      fontSize: 13,
      color: theme.colors.text,
    },
    actionBtnTextClear: {
      color: theme.colors.error,
    },
    listContainer: {
      maxHeight: 320,
    },
    emptyContainer: {
      paddingVertical: 32,
      alignItems: "center",
    },
    emptyText: {
      ...font("regular"),
      fontSize: 13,
      color: theme.colors.muted,
    },
    item: {
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
    },
    itemHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    itemHeaderLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      flex: 1,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    itemType: {
      ...font("semibold"),
      fontSize: 13,
      fontWeight: "600",
      color: theme.colors.text,
    },
    itemStatus: {
      ...font("medium"),
      fontSize: 11,
      fontWeight: "500",
    },
    itemError: {
      fontSize: 11,
      marginTop: 4,
      color: theme.colors.error,
    },
    itemActions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: 16,
      marginTop: 8,
    },
  });
}
