/**
 * Transaction history row styles.
 */
import { StyleSheet } from "react-native";

import { font } from "@theme";

export const styles = StyleSheet.create({
  txRow: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 8,
  },
  txRowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  txBadgeAndCoin: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  txTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  txTypeText: {
    ...font("bold"),
    fontSize: 11,
    fontWeight: "700",
  },
  txCoinId: {
    ...font("bold"),
    fontSize: 15,
    fontWeight: "700",
  },
  txDeleteBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  txDeleteBtnText: {
    ...font("semibold"),
    fontSize: 12,
    fontWeight: "600",
  },
  txRowDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  txQuantityPrice: {
    ...font("regular"),
    fontSize: 13,
  },
  txDate: {
    ...font("regular"),
    fontSize: 12,
  },
});
