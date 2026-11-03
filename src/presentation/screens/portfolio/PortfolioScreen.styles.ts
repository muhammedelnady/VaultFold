/**
 * Portfolio Screen Styles.
 * RTL-safe logical properties only (start/end), token-driven styles.
 */
import { StyleSheet } from "react-native";

import { font } from "@theme";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screenWrapper: {
    flex: 1,
  },
  demoBanner: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  demoBannerText: {
    ...font("semibold"),
    fontSize: 12,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTitle: {
    ...font("bold"),
    fontSize: 24,
    fontWeight: "800",
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  headerBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  headerBtnText: {
    ...font("semibold"),
    fontWeight: "600",
    fontSize: 13,
  },
  outboxBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  outboxBtnText: {
    ...font("semibold"),
    fontWeight: "600",
    fontSize: 13,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 48,
  },
  summaryHero: {
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    marginBottom: 20,
    borderWidth: 1,
  },
  heroLabel: {
    ...font("semibold"),
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  heroValue: {
    ...font("bold"),
    fontSize: 32,
    fontWeight: "800",
    marginBottom: 12,
  },
  heroMetricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    paddingTop: 12,
  },
  heroMetricItem: {
    flex: 1,
  },
  heroMetricLabel: {
    ...font("medium"),
    fontSize: 11,
    fontWeight: "500",
    marginBottom: 2,
  },
  heroMetricValue: {
    ...font("bold"),
    fontSize: 14,
    fontWeight: "700",
  },
  sectionTitle: {
    ...font("bold"),
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  emptyHoldings: {
    paddingVertical: 40,
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    marginTop: 8,
  },
  emptyHoldingsTitle: {
    ...font("semibold"),
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  emptyHoldingsSubtitle: {
    ...font("regular"),
    fontSize: 13,
    marginBottom: 16,
  },
  txSection: {
    marginTop: 24,
  },
  emptyTx: {
    paddingVertical: 24,
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    marginTop: 4,
  },
  emptyTxText: {
    ...font("regular"),
    fontSize: 13,
  },
});
