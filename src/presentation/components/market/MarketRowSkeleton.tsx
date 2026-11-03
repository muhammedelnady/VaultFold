/**
 * MarketRowSkeleton — shimmer placeholder row shown during cold-start
 * and initial fetch so the screen never paints a blank spinner.
 */
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { useTheme } from "@stores/themeStore";

export function MarketRowSkeleton() {
  const theme = useTheme();
  const barColor = theme.colors.border;
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.set(withRepeat(withTiming(1, { duration: 900 }), -1, true));
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.get() }));

  return (
    <View
      style={[styles.row, { borderBottomColor: theme.colors.border }]}
      testID="market-row-skeleton"
    >
      <View
        style={[styles.rank, { backgroundColor: barColor }]}
        testID="market-row-skeleton-rank"
      />
      <View
        style={[styles.icon, { backgroundColor: barColor }]}
        testID="market-row-skeleton-icon"
      />
      <View style={styles.titleColumn} testID="market-row-skeleton-title-column">
        <View
          style={[styles.symbol, { backgroundColor: barColor }]}
          testID="market-row-skeleton-symbol"
        />
        <View
          style={[styles.name, { backgroundColor: barColor }]}
          testID="market-row-skeleton-name"
        />
      </View>
      <View
        style={[styles.sparkline, { backgroundColor: barColor }]}
        testID="market-row-skeleton-sparkline"
      />
      <View style={styles.rightColumn} testID="market-row-skeleton-right">
        <View
          style={[styles.price, { backgroundColor: barColor }]}
          testID="market-row-skeleton-price"
        />
        <View
          style={[styles.badge, { backgroundColor: barColor }]}
          testID="market-row-skeleton-badge"
        />
      </View>
      <Animated.View
        style={[styles.shimmerOverlay, { backgroundColor: theme.colors.surface }, animatedStyle]}
        testID="market-row-skeleton-shimmer"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    minHeight: 72,
    position: "relative",
    overflow: "hidden",
  },
  rank: { width: 24, height: 10, borderRadius: 4, marginEnd: 8 },
  icon: { width: 32, height: 32, borderRadius: 16, marginEnd: 10 },
  titleColumn: { flex: 1, gap: 6 },
  symbol: { width: 48, height: 12, borderRadius: 4 },
  name: { width: 80, height: 10, borderRadius: 4 },
  sparkline: { width: 64, height: 24, borderRadius: 4, marginHorizontal: 8 },
  rightColumn: { alignItems: "flex-end", gap: 6, flex: 1.1 },
  price: { width: 64, height: 12, borderRadius: 4 },
  badge: { width: 48, height: 16, borderRadius: 4 },
  shimmerOverlay: { ...StyleSheet.absoluteFill },
});
