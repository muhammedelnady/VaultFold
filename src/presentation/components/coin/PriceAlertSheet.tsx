/**
 * Price alert bottom sheet modal for configuring one-shot threshold notifications.
 */
import * as Notifications from "expo-notifications";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import type { PriceAlert } from "@domain/alert/PriceAlert";
import { formatCurrency } from "@presentation/utils/formatters";
import { useTranslation } from "@stores/languageStore";
import { useTheme } from "@stores/themeStore";
import { font } from "@theme";

export interface PriceAlertSheetProps {
  readonly coinId: string;
  readonly coinSymbol: string;
  readonly currentPriceUsd: string;
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly onSaveAlert: (alert: PriceAlert) => Promise<void>;
}

export function PriceAlertSheet({
  coinId,
  coinSymbol,
  currentPriceUsd,
  visible,
  onClose,
  onSaveAlert,
}: PriceAlertSheetProps) {
  const theme = useTheme();
  const { t, isRtl } = useTranslation();
  const [direction, setDirection] = useState<"above" | "below">("above");
  const [targetPrice, setTargetPrice] = useState(currentPriceUsd);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!visible) return null;

  const handleSubmit = async () => {
    if (!targetPrice || Number(targetPrice) <= 0 || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const perm = await Notifications.getPermissionsAsync();
      if (perm.status !== "granted") {
        await Notifications.requestPermissionsAsync();
      }

      const alert: PriceAlert = {
        id: `alert_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        coinId,
        direction,
        targetPrice,
        currency: "usd",
        active: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await onSaveAlert(alert);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.overlay} testID="price-alert-sheet" nativeID="price-alert-sheet">
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        testID="price-alert-backdrop"
        nativeID="price-alert-backdrop"
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardAvoid}
        testID="price-alert-keyboard-avoid"
      >
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.surface,
              direction: isRtl ? "rtl" : "ltr",
            },
          ]}
          testID="price-alert-sheet-body"
        >
          <View
            style={[styles.header, { direction: isRtl ? "rtl" : "ltr" }]}
            testID="price-alert-header"
          >
            <Text
              testID="price-alert-title"
              style={[
                styles.title,
                {
                  color: theme.colors.text,
                  writingDirection: isRtl ? "rtl" : "ltr",
                },
              ]}
            >
              {t("priceAlertSheet.title", { symbol: coinSymbol.toUpperCase() })}
            </Text>
            <Text
              testID="price-alert-subtitle"
              style={[
                styles.subtitle,
                {
                  color: theme.colors.muted,
                  writingDirection: isRtl ? "rtl" : "ltr",
                },
              ]}
            >
              {t("priceAlertSheet.currentPrice", { price: formatCurrency(currentPriceUsd, "USD") })}
            </Text>
          </View>

          <View
            style={[styles.toggleRow, { direction: isRtl ? "rtl" : "ltr" }]}
            testID="price-alert-direction-row"
          >
            <Pressable
              testID="btn-direction-above"
              nativeID="btn-direction-above"
              style={[
                styles.toggleBtn,
                {
                  backgroundColor:
                    direction === "above"
                      ? (theme.accent ?? theme.colors.primary)
                      : theme.colors.border,
                },
              ]}
              onPress={() => setDirection("above")}
            >
              <Text
                testID="btn-direction-above-label"
                style={[
                  styles.toggleText,
                  { color: direction === "above" ? theme.colors.onPrimary : theme.colors.text },
                ]}
              >
                {t("priceAlertSheet.risesAbove")}
              </Text>
            </Pressable>

            <Pressable
              testID="btn-direction-below"
              nativeID="btn-direction-below"
              style={[
                styles.toggleBtn,
                {
                  backgroundColor:
                    direction === "below"
                      ? (theme.accent ?? theme.colors.primary)
                      : theme.colors.border,
                },
              ]}
              onPress={() => setDirection("below")}
            >
              <Text
                testID="btn-direction-below-label"
                style={[
                  styles.toggleText,
                  { color: direction === "below" ? theme.colors.onPrimary : theme.colors.text },
                ]}
              >
                {t("priceAlertSheet.dropsBelow")}
              </Text>
            </Pressable>
          </View>

          <View style={styles.inputContainer} testID="price-alert-input-container">
            <Text
              testID="price-alert-input-label"
              style={[
                styles.inputLabel,
                {
                  color: theme.colors.muted,
                  writingDirection: isRtl ? "rtl" : "ltr",
                },
              ]}
            >
              {t("priceAlertSheet.targetPrice")}
            </Text>
            <TextInput
              testID="input-target-price"
              nativeID="input-target-price"
              style={[
                styles.input,
                {
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.background,
                  textAlign: isRtl ? "right" : "left",
                  writingDirection: isRtl ? "rtl" : "ltr",
                },
              ]}
              value={targetPrice}
              onChangeText={setTargetPrice}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={theme.colors.muted}
            />
          </View>

          <View
            style={[styles.actionRow, { direction: isRtl ? "rtl" : "ltr" }]}
            testID="price-alert-action-row"
          >
            <Pressable
              testID="btn-cancel-alert"
              nativeID="btn-cancel-alert"
              style={[styles.cancelBtn, { borderColor: theme.colors.border }]}
              onPress={onClose}
            >
              <Text
                style={[styles.cancelText, { color: theme.colors.text }]}
                testID="btn-cancel-alert-label"
              >
                {t("priceAlertSheet.cancel")}
              </Text>
            </Pressable>

            <Pressable
              testID="btn-save-alert"
              nativeID="btn-save-alert"
              style={[styles.saveBtn, { backgroundColor: theme.accent ?? theme.colors.primary }]}
              onPress={() => void handleSubmit()}
            >
              <Text
                style={[styles.saveText, { color: theme.colors.onPrimary }]}
                testID="btn-save-alert-label"
              >
                {t("priceAlertSheet.save")}
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 999,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  keyboardAvoid: {
    width: "100%",
  },
  sheet: {
    borderTopStartRadius: 20,
    borderTopEndRadius: 20,
    padding: 24,
    paddingBottom: 36,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    ...font("bold"),
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    ...font("regular"),
    fontSize: 14,
  },
  toggleRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  toggleText: {
    ...font("semibold"),
    fontWeight: "600",
    fontSize: 14,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    ...font("regular"),
    fontSize: 13,
    marginBottom: 8,
  },
  input: {
    ...font("regular"),
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  cancelText: {
    ...font("semibold"),
    fontWeight: "600",
    fontSize: 15,
  },
  saveBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  saveText: {
    ...font("semibold"),
    fontWeight: "600",
    fontSize: 15,
  },
});
