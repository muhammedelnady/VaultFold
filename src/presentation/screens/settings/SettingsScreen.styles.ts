/**
 * Settings Screen styles with logical properties for RTL compliance and zero hex literals.
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 48,
  },
  mirrorContainer: {
    flex: 1,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    ...font("bold"),
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  subtitle: {
    ...font("regular"),
    fontSize: 14,
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    ...font("semibold"),
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 10,
    marginStart: 4,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLabel: {
    ...font("medium"),
    fontSize: 16,
    fontWeight: "500",
  },
  rowValue: {
    ...font("regular"),
    fontSize: 14,
  },
  rowSubtext: {
    ...font("regular"),
    fontSize: 12,
    marginTop: 2,
  },
  pillGroup: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  pillText: {
    ...font("medium"),
    fontSize: 14,
    fontWeight: "500",
  },
  pillTextActive: {
    ...font("semibold"),
    fontSize: 14,
    fontWeight: "600",
  },
  accentPickerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  accentRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  accentSwatch: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  accentCheckmark: {
    ...font("bold"),
    fontSize: 16,
    fontWeight: "bold",
  },
  contrastWarning: {
    ...font("regular"),
    fontSize: 12,
    marginTop: 8,
    marginStart: 4,
  },
  infoBox: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  infoText: {
    ...font("regular"),
    fontSize: 12,
    lineHeight: 18,
  },
  dangerCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  dangerTitle: {
    ...font("semibold"),
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  dangerDescription: {
    ...font("regular"),
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  dangerButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  dangerButtonText: {
    ...font("semibold"),
    fontWeight: "600",
    fontSize: 14,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  modalTitle: {
    ...font("bold"),
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  modalDescription: {
    ...font("regular"),
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "flex-end",
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modalConfirmBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
});
