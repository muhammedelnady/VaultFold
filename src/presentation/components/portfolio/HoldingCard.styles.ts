/**
 * Holding card styles.
 */
import { StyleSheet } from "react-native";

import { font } from "@theme";

export const styles = StyleSheet.create({
  holdingCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 10,
  },
  holdingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  holdingCoinId: {
    ...font("bold"),
    fontSize: 16,
    fontWeight: "700",
  },
  holdingValue: {
    ...font("bold"),
    fontSize: 16,
    fontWeight: "700",
  },
  holdingDetailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  holdingQuantity: {
    ...font("regular"),
    fontSize: 13,
  },
  holdingPl: {
    ...font("semibold"),
    fontSize: 13,
    fontWeight: "600",
  },
});
