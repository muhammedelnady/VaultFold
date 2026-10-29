/**
 * Transaction Modal Styles.
 * Token-driven styles with logical properties and zero hex literals.
 */
import { StyleSheet } from "react-native";

import { font } from "@theme";
import type { Theme } from "@theme";

export function createTransactionModalStyles(theme: Theme) {
  return StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFill,
      justifyContent: "flex-end",
      backgroundColor: "rgba(0,0,0,0.5)",
    },
    backdrop: {
      ...StyleSheet.absoluteFill,
    },
    keyboardAvoid: {
      width: "100%",
    },
    sheet: {
      borderTopStartRadius: 20,
      borderTopEndRadius: 20,
      maxHeight: "85%",
      backgroundColor: theme.colors.surface,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 32,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    title: {
      ...font("bold"),
      fontSize: 18,
      fontWeight: "700",
      color: theme.colors.text,
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
    toggleRow: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 16,
    },
    toggleBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 8,
      alignItems: "center",
      backgroundColor: theme.colors.border,
    },
    toggleBtnBuyActive: {
      backgroundColor: theme.colors.success,
    },
    toggleBtnSellActive: {
      backgroundColor: theme.colors.error,
    },
    toggleText: {
      ...font("bold"),
      fontWeight: "700",
      fontSize: 14,
      color: theme.colors.text,
    },
    toggleTextBuyActive: {
      color: theme.colors.onSuccess,
    },
    toggleTextSellActive: {
      color: theme.colors.onError,
    },
    errorBox: {
      padding: 10,
      borderRadius: 8,
      backgroundColor: theme.colors.error,
      marginBottom: 12,
    },
    errorText: {
      ...font("semibold"),
      color: theme.colors.onError,
      fontSize: 12,
      fontWeight: "600",
    },
    inputGroup: {
      marginBottom: 12,
    },
    label: {
      ...font("semibold"),
      fontSize: 12,
      fontWeight: "600",
      marginBottom: 6,
      color: theme.colors.muted,
    },
    input: {
      ...font("regular"),
      height: 44,
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 12,
      fontSize: 14,
      color: theme.colors.text,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
    },
    actionRow: {
      flexDirection: "row",
      gap: 12,
      marginTop: 16,
    },
    cancelBtn: {
      flex: 1,
      height: 48,
      borderWidth: 1,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
      borderColor: theme.colors.border,
    },
    cancelBtnText: {
      ...font("semibold"),
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.text,
    },
    submitBtn: {
      flex: 2,
      height: 48,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.accent,
    },
    submitBtnText: {
      ...font("semibold"),
      color: theme.colors.onPrimary,
      fontSize: 14,
      fontWeight: "600",
    },
    previewBox: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 10,
      borderRadius: 8,
      backgroundColor: "transparent",
      marginBottom: 12,
      borderWidth: 1,
      borderColor: "transparent",
    },
    previewLabel: {
      ...font("semibold"),
      fontSize: 12,
      fontWeight: "600",
      color: theme.colors.muted,
    },
    previewValue: {
      ...font("bold"),
      fontSize: 14,
      fontWeight: "700",
      color: theme.colors.text,
    },
  });
}
