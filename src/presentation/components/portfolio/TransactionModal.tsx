/**
 * Transaction Modal component.
 * Bottom sheet modal for adding Buy and Sell transactions to the append-only ledger.
 */
import { Decimal } from "decimal.js-light";
import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import type { LedgerEntry } from "@domain/ledger/LedgerEntry";
import { useTranslation } from "@stores/languageStore";
import { useTheme } from "@stores/themeStore";

import { NumericKeypad } from "./NumericKeypad";
import { createTransactionModalStyles } from "./TransactionModal.styles";

export interface TransactionModalProps {
  readonly visible: boolean;
  readonly defaultCoinId?: string;
  readonly defaultPriceUsd?: string;
  readonly currentHoldingQuantity?: string;
  readonly onClose: () => void;
  readonly onSave: (entry: LedgerEntry) => Promise<void>;
}

export function TransactionModal({
  visible,
  defaultCoinId = "bitcoin",
  defaultPriceUsd = "68000",
  currentHoldingQuantity = "0",
  onClose,
  onSave,
}: TransactionModalProps) {
  const theme = useTheme();
  const { t, isRtl } = useTranslation();
  const styles = useMemo(() => createTransactionModalStyles(theme), [theme]);

  const [type, setType] = useState<"buy" | "sell">("buy");
  const [coinId, setCoinId] = useState(defaultCoinId);
  const [amount, setAmount] = useState("");
  const [price, setPrice] = useState(defaultPriceUsd);
  const [fee, setFee] = useState("");
  const [note, setNote] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<"amount" | "price" | "fee">("amount");

  const updateFocused = (fn: (v: string) => string) => {
    if (focusedField === "amount") setAmount(fn);
    else if (focusedField === "price") setPrice(fn);
    else setFee(fn);
  };
  const appendToFocused = (digit: string) => updateFocused((v) => v + digit);
  const backspaceFocused = () => updateFocused((v) => v.slice(0, -1));

  const liveTotal = (() => {
    try {
      const a = new Decimal(amount || "0");
      const p = new Decimal(price || "0");
      const f = fee.trim() ? new Decimal(fee) : new Decimal(0);
      return a.times(p).minus(f).toString();
    } catch {
      return null;
    }
  })();

  if (!visible) return null;

  const handleSubmit = async () => {
    setValidationError(null);
    if (!coinId.trim()) return setValidationError(t("transactionModal.errCoin"));
    try {
      const decAmount = new Decimal(amount);
      const decPrice = new Decimal(price);
      if (decAmount.lte(0)) return setValidationError(t("transactionModal.errQty"));
      if (decPrice.lte(0)) return setValidationError(t("transactionModal.errPrice"));
      const held = new Decimal(currentHoldingQuantity);
      if (type === "sell" && decAmount.gt(held)) {
        return setValidationError(t("transactionModal.errSellExceed", { held: held.toString() }));
      }
    } catch {
      return setValidationError(t("transactionModal.errNumeric"));
    }
    setIsSubmitting(true);
    try {
      await onSave({
        id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        type,
        coinId: coinId.toLowerCase().trim(),
        amount: amount.trim(),
        price: price.trim(),
        currency: "usd",
        fee: fee.trim() || undefined,
        note: note.trim() || undefined,
        timestamp: Date.now(),
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.overlay} testID="transaction-modal" nativeID="transaction-modal">
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        testID="transaction-backdrop"
        nativeID="transaction-backdrop"
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardAvoid}
        testID="transaction-keyboard-avoid"
      >
        <View
          style={[styles.sheet, { direction: isRtl ? "rtl" : "ltr" }]}
          testID="transaction-sheet"
        >
          <ScrollView contentContainerStyle={styles.scrollContent} testID="transaction-scroll">
            <View
              style={[styles.header, { direction: isRtl ? "rtl" : "ltr" }]}
              testID="transaction-header"
            >
              <Text
                style={[styles.title, { writingDirection: isRtl ? "rtl" : "ltr" }]}
                testID="transaction-title"
              >
                {t("transactionModal.addTitle")}
              </Text>
              <Pressable
                onPress={onClose}
                style={styles.closeBtn}
                testID="btn-close-modal"
                nativeID="btn-close-modal"
              >
                <Text style={styles.closeText} testID="btn-close-modal-label">
                  ✕
                </Text>
              </Pressable>
            </View>

            <View
              style={[styles.toggleRow, { direction: isRtl ? "rtl" : "ltr" }]}
              testID="transaction-side-toggle"
            >
              <Pressable
                testID="btn-side-buy"
                nativeID="btn-side-buy"
                style={[styles.toggleBtn, type === "buy" && styles.toggleBtnBuyActive]}
                onPress={() => setType("buy")}
              >
                <Text
                  style={[styles.toggleText, type === "buy" && styles.toggleTextBuyActive]}
                  testID="btn-side-buy-label"
                >
                  {t("transactionModal.buy")}
                </Text>
              </Pressable>
              <Pressable
                testID="btn-side-sell"
                nativeID="btn-side-sell"
                style={[styles.toggleBtn, type === "sell" && styles.toggleBtnSellActive]}
                onPress={() => setType("sell")}
              >
                <Text
                  style={[styles.toggleText, type === "sell" && styles.toggleTextSellActive]}
                  testID="btn-side-sell-label"
                >
                  {t("transactionModal.sell")}
                </Text>
              </Pressable>
            </View>

            {validationError ? (
              <View style={styles.errorBox} testID="transaction-validation-error">
                <Text
                  style={[styles.errorText, { writingDirection: isRtl ? "rtl" : "ltr" }]}
                  testID="transaction-validation-error-text"
                >
                  {validationError}
                </Text>
              </View>
            ) : null}

            <View style={styles.inputGroup} testID="transaction-coin-id-group">
              <Text
                style={[styles.label, { writingDirection: isRtl ? "rtl" : "ltr" }]}
                testID="transaction-coin-id-label"
              >
                {t("transactionModal.coinId")}
              </Text>
              <TextInput
                testID="input-coin-id"
                nativeID="input-coin-id"
                style={[
                  styles.input,
                  {
                    textAlign: isRtl ? "right" : "left",
                    writingDirection: isRtl ? "rtl" : "ltr",
                  },
                ]}
                value={coinId}
                onChangeText={setCoinId}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup} testID="transaction-amount-group">
              <Text
                style={[styles.label, { writingDirection: isRtl ? "rtl" : "ltr" }]}
                testID="transaction-amount-label"
              >
                {t("transactionModal.quantity")}
              </Text>
              <TextInput
                testID="input-amount"
                nativeID="tx-amount-input"
                style={[
                  styles.input,
                  {
                    textAlign: isRtl ? "right" : "left",
                    writingDirection: isRtl ? "rtl" : "ltr",
                  },
                ]}
                value={amount}
                onChangeText={setAmount}
                onFocus={() => setFocusedField("amount")}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={theme.colors.muted}
              />
            </View>

            <View style={styles.inputGroup} testID="transaction-price-group">
              <Text
                style={[styles.label, { writingDirection: isRtl ? "rtl" : "ltr" }]}
                testID="transaction-price-label"
              >
                {t("transactionModal.price")}
              </Text>
              <TextInput
                testID="input-price"
                nativeID="tx-price-input"
                style={[
                  styles.input,
                  {
                    textAlign: isRtl ? "right" : "left",
                    writingDirection: isRtl ? "rtl" : "ltr",
                  },
                ]}
                value={price}
                onChangeText={setPrice}
                onFocus={() => setFocusedField("price")}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={theme.colors.muted}
              />
            </View>

            <View style={styles.inputGroup} testID="transaction-fee-group">
              <Text
                style={[styles.label, { writingDirection: isRtl ? "rtl" : "ltr" }]}
                testID="transaction-fee-label"
              >
                {t("transactionModal.fee")}
              </Text>
              <TextInput
                testID="input-fee"
                nativeID="input-fee"
                style={[
                  styles.input,
                  {
                    textAlign: isRtl ? "right" : "left",
                    writingDirection: isRtl ? "rtl" : "ltr",
                  },
                ]}
                value={fee}
                onChangeText={setFee}
                onFocus={() => setFocusedField("fee")}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={theme.colors.muted}
              />
            </View>

            <View style={styles.inputGroup} testID="transaction-note-group">
              <Text
                style={[styles.label, { writingDirection: isRtl ? "rtl" : "ltr" }]}
                testID="transaction-note-label"
              >
                {t("transactionModal.note")}
              </Text>
              <TextInput
                testID="input-note"
                nativeID="input-note"
                style={[
                  styles.input,
                  {
                    textAlign: isRtl ? "right" : "left",
                    writingDirection: isRtl ? "rtl" : "ltr",
                  },
                ]}
                value={note}
                onChangeText={setNote}
                placeholder={t("transactionModal.notePlaceholder")}
                placeholderTextColor={theme.colors.muted}
              />
            </View>

            {liveTotal !== null ? (
              <View
                style={[styles.previewBox, { direction: isRtl ? "rtl" : "ltr" }]}
                testID="tx-live-total"
                nativeID="tx-live-total"
              >
                <Text
                  style={[styles.previewLabel, { writingDirection: isRtl ? "rtl" : "ltr" }]}
                  testID="tx-live-total-label"
                >
                  {t("transactionModal.estimatedTotal")}
                </Text>
                <Text style={styles.previewValue} testID="tx-live-total-value">
                  {liveTotal}
                </Text>
              </View>
            ) : null}

            <NumericKeypad onDigit={appendToFocused} onBackspace={backspaceFocused} />

            <View
              style={[styles.actionRow, { direction: isRtl ? "rtl" : "ltr" }]}
              testID="transaction-action-row"
            >
              <Pressable
                testID="btn-cancel-tx"
                nativeID="btn-cancel-tx"
                style={styles.cancelBtn}
                onPress={onClose}
              >
                <Text style={styles.cancelBtnText} testID="btn-cancel-tx-label">
                  {t("transactionModal.cancel")}
                </Text>
              </Pressable>
              <Pressable
                testID="btn-submit-tx"
                nativeID="tx-submit-button"
                style={styles.submitBtn}
                onPress={() => void handleSubmit()}
                disabled={isSubmitting}
              >
                <Text style={styles.submitBtnText} testID="btn-submit-tx-label">
                  {isSubmitting ? t("transactionModal.saving") : t("transactionModal.saveTx")}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
