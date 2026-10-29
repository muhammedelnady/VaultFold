/**
 * HoldingsDonut — Skia allocation donut for the portfolio.
 * Slices are press-selectable; the center shows total value. Colors come from
 * theme tokens only (no hex literals).
 */
import { Canvas, Path } from "@shopify/react-native-skia";
import { Decimal } from "decimal.js-light";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { PressableScale } from "@presentation/components/ui/PressableScale";
import { formatCurrency } from "@presentation/utils/formatters";
import { useTheme } from "@stores/themeStore";
import { font } from "@theme";

export interface HoldingSlice {
  readonly coinId: string;
  readonly valueUsd: string;
}

export interface HoldingsDonutProps {
  readonly holdings: readonly HoldingSlice[];
  readonly size?: number;
  readonly onSelect?: (coinId: string) => void;
}

const SLICE_TOKENS = (theme: ReturnType<typeof useTheme>) => [
  theme.accent ?? theme.colors.primary,
  theme.colors.success,
  theme.colors.warning,
  theme.colors.error,
  theme.colors.primary,
  theme.colors.secondary,
];

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startAngle: number,
  endAngle: number,
): string {
  const start = polarToCartesian(cx, cy, outerR, startAngle);
  const end = polarToCartesian(cx, cy, outerR, endAngle);
  const innerStart = polarToCartesian(cx, cy, innerR, endAngle);
  const innerEnd = polarToCartesian(cx, cy, innerR, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return [
    `M ${start.x.toFixed(2)} ${start.y.toFixed(2)}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`,
    `L ${innerStart.x.toFixed(2)} ${innerStart.y.toFixed(2)}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerEnd.x.toFixed(2)} ${innerEnd.y.toFixed(2)}`,
    "Z",
  ].join(" ");
}

export function HoldingsDonut({ holdings, size = 180, onSelect }: HoldingsDonutProps) {
  const theme = useTheme();

  const slices = useMemo(() => {
    const total = holdings.reduce(
      (acc, h) => acc.plus(new Decimal(h.valueUsd || "0")),
      new Decimal(0),
    );
    if (total.lte(0)) return [];
    const palette = SLICE_TOKENS(theme);
    let cursor = 0;
    return holdings.map((h, idx) => {
      const value = new Decimal(h.valueUsd || "0");
      const angle = (value.div(total).toNumber() || 0) * 360;
      const start = cursor;
      const end = cursor + angle;
      cursor = end;
      return {
        coinId: h.coinId,
        color: palette[idx % palette.length] ?? theme.colors.muted,
        path: describeArc(size / 2, size / 2, size / 2 - 4, size / 2 - 28, start, end),
        value: value.toString(),
      };
    });
  }, [holdings, size, theme]);

  const totalValue = useMemo(() => {
    return holdings
      .reduce((acc, h) => acc.plus(new Decimal(h.valueUsd || "0")), new Decimal(0))
      .toString();
  }, [holdings]);

  if (holdings.length === 0 || slices.length === 0) {
    return (
      <View style={styles.empty} testID="holdings-donut-empty">
        <Text
          style={[styles.emptyText, { color: theme.colors.muted }]}
          testID="holdings-donut-empty-text"
        >
          No allocation data
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container} testID="holdings-donut" nativeID="holdings-donut">
      <Canvas style={{ width: size, height: size }} testID="holdings-donut-canvas">
        {slices.map((slice) => (
          <Path key={slice.coinId} path={slice.path} color={slice.color} />
        ))}
      </Canvas>
      <View
        style={[styles.center, { width: size, height: size }]}
        pointerEvents="none"
        testID="holdings-donut-center"
      >
        <Text
          style={[styles.centerLabel, { color: theme.colors.muted }]}
          testID="holdings-donut-center-label"
        >
          Total
        </Text>
        <Text
          style={[styles.centerValue, { color: theme.colors.text }]}
          testID="holdings-donut-center-value"
        >
          {formatCurrency(totalValue)}
        </Text>
      </View>
      <View style={styles.legend} testID="holdings-donut-legend">
        {slices.map((slice) => {
          return (
            <PressableScale
              key={slice.coinId}
              testID={`donut-slice-${slice.coinId}`}
              nativeID={`donut-slice-${slice.coinId}`}
              haptic="selection"
              style={styles.legendItem}
              onPress={() => {
                onSelect?.(slice.coinId);
              }}
            >
              <View
                style={[styles.legendDot, { backgroundColor: slice.color }]}
                testID={`donut-slice-${slice.coinId}-dot`}
              />
              <Text
                style={[styles.legendLabel, { color: theme.colors.text }]}
                testID={`donut-slice-${slice.coinId}-label`}
              >
                {slice.coinId.toUpperCase()}
              </Text>
            </PressableScale>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginVertical: 12,
  },
  center: {
    position: "absolute",
    top: 0,
    start: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  centerLabel: {
    ...font("medium"),
    fontSize: 11,
    fontWeight: "500",
  },
  centerValue: {
    ...font("bold"),
    fontSize: 14,
    fontWeight: "700",
    marginTop: 2,
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    ...font("semibold"),
    fontSize: 12,
    fontWeight: "600",
  },
  empty: {
    paddingVertical: 24,
    alignItems: "center",
  },
  emptyText: {
    ...font("regular"),
    fontSize: 13,
  },
});
