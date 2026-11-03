/**
 * RangeSelector component for switching chart intervals with offline availability indicators.
 */
import { StyleSheet, Text, View } from "react-native";

import { PressableScale } from "@presentation/components/ui/PressableScale";
import { useTheme } from "@stores/themeStore";
import { font } from "@theme";

export type ChartRange = "24h" | "7d" | "30d" | "1y";

export const CHART_RANGES: readonly ChartRange[] = ["24h", "7d", "30d", "1y"];

export const RANGE_DAYS_MAP: Record<ChartRange, "1" | "7" | "30" | "365"> = {
  "24h": "1",
  "7d": "7",
  "30d": "30",
  "1y": "365",
};

export interface RangeSelectorProps {
  readonly selectedRange: ChartRange;
  readonly onSelectRange: (range: ChartRange) => void;
  readonly availableOfflineRanges?: readonly ChartRange[];
  readonly isOffline?: boolean;
  readonly testID?: string;
}

export function RangeSelector({
  selectedRange,
  onSelectRange,
  availableOfflineRanges = CHART_RANGES,
  isOffline = false,
  testID = "range-selector",
}: RangeSelectorProps) {
  const theme = useTheme();

  return (
    <View style={styles.container} testID={testID} nativeID={testID}>
      {CHART_RANGES.map((range) => {
        const isSelected = selectedRange === range;
        const isAvailable = !isOffline || availableOfflineRanges.includes(range);

        return (
          <PressableScale
            key={range}
            testID={`range-selector-${range}`}
            haptic="selection"
            disabled={!isAvailable}
            accessibilityRole="button"
            accessibilityLabel={`Select ${range} range${!isAvailable ? " (offline unavailable)" : ""}`}
            accessibilityState={{ selected: isSelected, disabled: !isAvailable }}
            style={[
              styles.pill,
              {
                backgroundColor: isSelected
                  ? (theme.accent ?? theme.colors.primary)
                  : "transparent",
                opacity: isAvailable ? 1 : 0.4,
              },
            ]}
            onPress={() => onSelectRange(range)}
          >
            <Text
              testID={`range-selector-${range}-label`}
              style={[
                styles.label,
                {
                  color: isSelected
                    ? theme.colors.onPrimary
                    : isAvailable
                      ? theme.colors.text
                      : theme.colors.muted,
                  fontWeight: isSelected ? "700" : "500",
                },
              ]}
            >
              {range}
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    minWidth: 54,
    alignItems: "center",
    borderCurve: "continuous",
  },
  label: {
    ...font("regular"),
    fontSize: 13,
  },
});
