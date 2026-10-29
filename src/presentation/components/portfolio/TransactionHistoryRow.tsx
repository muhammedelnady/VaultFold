/**
 * Transaction history row component.
 */
import { Text, View } from "react-native";

import type { LedgerEntry } from "@domain/ledger/LedgerEntry";
import { PressableScale } from "@presentation/components/ui/PressableScale";
import { formatCurrency } from "@presentation/utils/formatters";
import { useTranslation } from "@stores/languageStore";
import { useTheme } from "@stores/themeStore";

import { styles } from "./TransactionHistoryRow.styles";

export interface TransactionHistoryRowProps {
  readonly transaction: LedgerEntry;
  readonly currency: string;
  readonly onDelete: (id: string, coinId: string) => void | Promise<void>;
}

export function TransactionHistoryRow({
  transaction,
  currency,
  onDelete,
}: TransactionHistoryRowProps) {
  const theme = useTheme();
  const { t, isRtl } = useTranslation();
  const isBuy = transaction.type === "buy";
  const typeBg = isBuy ? theme.colors.success : theme.colors.error;
  const typeColor = isBuy ? theme.colors.onSuccess : theme.colors.onError;

  return (
    <View
      testID={`tx-history-row-${transaction.id}`}
      nativeID={`tx-history-row-${transaction.id}`}
      style={[
        styles.txRow,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          direction: isRtl ? "rtl" : "ltr",
        },
      ]}
    >
      <View
        style={[styles.txRowHeader, { direction: isRtl ? "rtl" : "ltr" }]}
        testID={`tx-history-row-${transaction.id}-header`}
      >
        <View
          style={[styles.txBadgeAndCoin, { direction: isRtl ? "rtl" : "ltr" }]}
          testID={`tx-history-row-${transaction.id}-badge-group`}
        >
          <View
            style={[styles.txTypeBadge, { backgroundColor: typeBg }]}
            testID={`tx-history-row-${transaction.id}-type-badge`}
          >
            <Text
              style={[styles.txTypeText, { color: typeColor }]}
              testID={`tx-history-row-${transaction.id}-type`}
            >
              {isBuy
                ? t("transactionModal.buy").toUpperCase()
                : t("transactionModal.sell").toUpperCase()}
            </Text>
          </View>
          <Text
            style={[
              styles.txCoinId,
              { color: theme.colors.text, writingDirection: isRtl ? "rtl" : "ltr" },
            ]}
            testID={`tx-history-row-${transaction.id}-coin-id`}
          >
            {transaction.coinId.toUpperCase()}
          </Text>
        </View>
        <PressableScale
          testID={`btn-delete-tx-${transaction.id}`}
          nativeID={`btn-delete-tx-${transaction.id}`}
          haptic="selection"
          style={[
            styles.txDeleteBtn,
            { borderColor: theme.colors.border, backgroundColor: theme.colors.background },
          ]}
          onPress={() => void onDelete(transaction.id, transaction.coinId)}
        >
          <Text
            style={[styles.txDeleteBtnText, { color: theme.colors.error }]}
            testID={`btn-delete-tx-${transaction.id}-label`}
          >
            {t("common.delete")}
          </Text>
        </PressableScale>
      </View>
      <View
        style={[styles.txRowDetails, { direction: isRtl ? "rtl" : "ltr" }]}
        testID={`tx-history-row-${transaction.id}-details`}
      >
        <Text
          style={[
            styles.txQuantityPrice,
            { color: theme.colors.muted, writingDirection: isRtl ? "rtl" : "ltr" },
          ]}
          testID={`tx-history-row-${transaction.id}-quantity-price`}
        >
          {transaction.amount} @ {formatCurrency(transaction.price, currency)}
        </Text>
        <Text
          style={[
            styles.txDate,
            { color: theme.colors.muted, writingDirection: isRtl ? "rtl" : "ltr" },
          ]}
          testID={`tx-history-row-${transaction.id}-date`}
        >
          {new Date(transaction.timestamp).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );
}
