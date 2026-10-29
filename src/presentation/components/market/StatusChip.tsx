/**
 * Market status chip.
 * Displays live synchronization state, cache age, rate limiting, or sample data indicators.
 */
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@stores/themeStore";
import { font } from "@theme";

export type MarketStatusKind = "live" | "cached" | "offline" | "rate_limited" | "sample";

export interface StatusChipProps {
  readonly kind: MarketStatusKind;
  readonly lastUpdatedAt?: number;
  readonly retryAfterSeconds?: number;
  readonly testID?: string;
}

export const StatusChip = React.memo(function StatusChip({
  kind,
  lastUpdatedAt,
  retryAfterSeconds,
  testID = "status-chip",
}: StatusChipProps) {
  const theme = useTheme();

  const config = (() => {
    switch (kind) {
      case "live":
        return {
          label: "Live",
          dotColor: theme.colors.success,
          bgColor: theme.colors.surface,
          textColor: theme.colors.success,
        };
      case "cached": {
        const minutes = lastUpdatedAt
          ? Math.max(1, Math.round((Date.now() - lastUpdatedAt) / 60_000))
          : 1;
        return {
          label: `Cached • ${minutes}m ago`,
          dotColor: theme.colors.secondary,
          bgColor: theme.colors.surface,
          textColor: theme.colors.secondary,
        };
      }
      case "offline":
        return {
          label: "Offline",
          dotColor: theme.colors.muted,
          bgColor: theme.colors.surface,
          textColor: theme.colors.muted,
        };
      case "rate_limited": {
        const retryText = retryAfterSeconds ? ` (retry in ${retryAfterSeconds}s)` : "";
        return {
          label: `Rate-limited • using snapshot${retryText}`,
          dotColor: theme.colors.warning,
          bgColor: theme.colors.surface,
          textColor: theme.colors.warning,
        };
      }
      case "sample":
        return {
          label: "Sample data (offline cold-start)",
          dotColor: theme.accent ?? theme.colors.primary,
          bgColor: theme.colors.surface,
          textColor: theme.accent ?? theme.colors.primary,
        };
    }
  })();

  return (
    <View
      style={[styles.chip, { backgroundColor: config.bgColor }]}
      testID={testID}
      nativeID={testID}
    >
      <View style={[styles.dot, { backgroundColor: config.dotColor }]} testID={`${testID}-dot`} />
      <Text style={[styles.label, { color: config.textColor }]} testID={`${testID}-label`}>
        {config.label}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginEnd: 6,
  },
  label: {
    ...font("medium"),
    fontSize: 12,
    fontWeight: "500",
  },
});
