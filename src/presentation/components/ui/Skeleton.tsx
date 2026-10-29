/**
 * Skeleton.tsx
 * High-performance, GPU-accelerated loading placeholder skeletons using Reanimated.
 * Prevents screen blanking/spinners during queries or cold starts.
 */
import { useEffect } from "react";
import { StyleSheet, View, type DimensionValue, type ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";

import { useTheme } from "@stores/themeStore";

export interface SkeletonBoxProps {
  readonly width?: DimensionValue;
  readonly height?: DimensionValue;
  readonly borderRadius?: number;
  readonly style?: ViewStyle;
  readonly testID?: string;
}

export function SkeletonBox({
  width = "100%",
  height = 16,
  borderRadius = 8,
  style,
  testID = "skeleton-box",
}: SkeletonBoxProps) {
  const theme = useTheme();
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      testID={testID}
      nativeID={testID}
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: theme.colors.border,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

/**
 * Portfolio Screen loading skeleton
 */
export function PortfolioSkeleton() {
  const theme = useTheme();
  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      testID="portfolio-skeleton"
      nativeID="portfolio-skeleton"
    >
      {/* Header */}
      <View style={styles.rowBetween}>
        <SkeletonBox width={100} height={28} borderRadius={6} />
        <SkeletonBox width={70} height={28} borderRadius={14} />
      </View>

      {/* Hero Balance Card */}
      <View
        style={[
          styles.card,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        ]}
      >
        <SkeletonBox width={110} height={14} borderRadius={4} style={{ marginBottom: 10 }} />
        <SkeletonBox width={190} height={36} borderRadius={8} style={{ marginBottom: 12 }} />
        <SkeletonBox width={90} height={20} borderRadius={6} />
      </View>

      {/* Donut Chart Placeholder */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            alignItems: "center",
            paddingVertical: 24,
          },
        ]}
      >
        <SkeletonBox width={160} height={160} borderRadius={80} style={{ marginBottom: 16 }} />
        <View style={styles.rowBetween}>
          <SkeletonBox width={80} height={14} borderRadius={4} />
          <SkeletonBox width={80} height={14} borderRadius={4} style={{ marginStart: 16 }} />
          <SkeletonBox width={80} height={14} borderRadius={4} style={{ marginStart: 16 }} />
        </View>
      </View>

      {/* Transactions List */}
      <View style={{ marginTop: 12 }}>
        <SkeletonBox width={130} height={18} borderRadius={4} style={{ marginBottom: 12 }} />
        {[1, 2, 3].map((i) => (
          <View
            key={i}
            style={[
              styles.rowBetween,
              styles.transactionRow,
              { borderBottomColor: theme.colors.border },
            ]}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <SkeletonBox width={36} height={36} borderRadius={18} style={{ marginStart: 12 }} />
              <View>
                <SkeletonBox width={60} height={16} borderRadius={4} style={{ marginBottom: 6 }} />
                <SkeletonBox width={90} height={12} borderRadius={4} />
              </View>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <SkeletonBox width={75} height={16} borderRadius={4} style={{ marginBottom: 6 }} />
              <SkeletonBox width={50} height={12} borderRadius={4} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

/**
 * Coin Detail Screen loading skeleton
 */
export function CoinDetailSkeleton() {
  const theme = useTheme();
  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      testID="coin-detail-skeleton"
      nativeID="coin-detail-skeleton"
    >
      {/* Header bar */}
      <View style={[styles.rowBetween, { marginBottom: 20 }]}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <SkeletonBox width={36} height={36} borderRadius={18} style={{ marginStart: 12 }} />
          <View>
            <SkeletonBox width={120} height={20} borderRadius={6} style={{ marginBottom: 6 }} />
            <SkeletonBox width={50} height={14} borderRadius={4} />
          </View>
        </View>
        <SkeletonBox width={36} height={36} borderRadius={18} />
      </View>

      {/* Hero Price & 24h change */}
      <View style={{ marginBottom: 20 }}>
        <SkeletonBox width={170} height={38} borderRadius={8} style={{ marginBottom: 8 }} />
        <SkeletonBox width={90} height={22} borderRadius={6} />
      </View>

      {/* Chart Box Shimmer */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            height: 220,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <SkeletonBox width="90%" height={160} borderRadius={10} />
      </View>

      {/* Range Selector Bar */}
      <View style={[styles.rowBetween, { marginVertical: 16 }]}>
        {[1, 2, 3, 4].map((i) => (
          <SkeletonBox key={i} width="22%" height={32} borderRadius={8} />
        ))}
      </View>

      {/* Stats Grid 2x2 */}
      <View style={styles.grid}>
        {[1, 2, 3, 4].map((i) => (
          <View
            key={i}
            style={[
              styles.gridItem,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
          >
            <SkeletonBox width={80} height={12} borderRadius={4} style={{ marginBottom: 8 }} />
            <SkeletonBox width={100} height={18} borderRadius={6} />
          </View>
        ))}
      </View>
    </View>
  );
}

/**
 * Alerts Screen loading skeleton
 */
export function AlertsSkeleton() {
  const theme = useTheme();
  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      testID="alerts-skeleton"
      nativeID="alerts-skeleton"
    >
      <SkeletonBox width={140} height={26} borderRadius={6} style={{ marginBottom: 6 }} />
      <SkeletonBox width={220} height={14} borderRadius={4} style={{ marginBottom: 20 }} />

      {[1, 2, 3].map((i) => (
        <View
          key={i}
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            },
          ]}
        >
          <View>
            <SkeletonBox width={70} height={18} borderRadius={4} style={{ marginBottom: 8 }} />
            <SkeletonBox width={120} height={14} borderRadius={4} />
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <SkeletonBox width={60} height={28} borderRadius={14} />
            <SkeletonBox width={60} height={28} borderRadius={14} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginVertical: 8,
  },
  transactionRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  gridItem: {
    width: "48%",
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
});
