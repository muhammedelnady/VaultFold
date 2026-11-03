/**
 * Styles for InteractiveChart component.
 */
import { StyleSheet } from "react-native";

import { font } from "@theme";

export const styles = StyleSheet.create({
  container: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTitle: {
    ...font("bold"),
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 6,
    textAlign: "center",
  },
  emptySubtitle: {
    ...font("regular"),
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
  scrubBadge: {
    position: "absolute",
    top: 8,
    start: 0,
    zIndex: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "transparent",
    backgroundColor: "transparent",
    alignItems: "center",
  },
  scrubPrice: {
    ...font("bold"),
    fontSize: 15,
    fontWeight: "700",
  },
  scrubDate: {
    ...font("regular"),
    fontSize: 11,
    marginTop: 2,
  },
  axisRow: {
    position: "absolute",
    bottom: 4,
    start: 16,
    end: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  axisText: {
    ...font("regular"),
    fontSize: 11,
  },
});
