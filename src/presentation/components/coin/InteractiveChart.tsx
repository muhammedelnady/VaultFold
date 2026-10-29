/**
 * Interactive Skia Chart component.
 * Hardware-accelerated Skia line & gradient area chart with shared-value
 * scrubbing, a floating HUD tooltip pinned to the pointer, LTR-isolated
 * timestamp/price badges, min/max markers, and haptic feedback.
 */
import { Canvas, Circle, Line, LinearGradient, Path, Skia, vec } from "@shopify/react-native-skia";
import * as Haptics from "expo-haptics";
import { useCallback, useMemo, useState } from "react";
import { Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { formatCurrency } from "@presentation/utils/formatters";
import { useTheme } from "@stores/themeStore";

import { styles } from "./InteractiveChart.styles";

export interface ChartPoint {
  readonly timestamp: number;
  readonly price: number;
}

export interface InteractiveChartProps {
  readonly points: readonly [number, number][];
  readonly isPositive?: boolean;
  readonly vsCurrency?: string;
  readonly height?: number;
  readonly width?: number;
  readonly isUnavailableOffline?: boolean;
}

export function buildPanGesture(onScrubUpdate: (touchX: number) => void, onScrubEnd: () => void) {
  return Gesture.Pan()
    .runOnJS(true)
    .onBegin((e) => onScrubUpdate(e.x))
    .onUpdate((e) => onScrubUpdate(e.x))
    .onEnd(() => onScrubEnd())
    .onFinalize(() => onScrubEnd());
}

function isLocalExtremum(points: { x: number; y: number }[], index: number): boolean {
  if (index <= 0 || index >= points.length - 1) return false;
  const prev = points[index - 1]!.y;
  const curr = points[index]!.y;
  const next = points[index + 1]!.y;
  return (curr >= prev && curr >= next) || (curr <= prev && curr <= next);
}

export function InteractiveChart({
  points,
  isPositive = true,
  vsCurrency = "USD",
  height = 240,
  width = 360,
  isUnavailableOffline = false,
}: InteractiveChartProps) {
  const theme = useTheme();
  const [scrubIndex, setScrubIndex] = useState<number | null>(null);

  const strokeColor = isPositive ? theme.colors.success : theme.colors.error;
  const paddingVertical = 24;
  const paddingHorizontal = 16;
  const chartWidth = Math.max(10, width - paddingHorizontal * 2);
  const chartHeight = Math.max(10, height - paddingVertical * 2);
  const pointerX = useSharedValue<number>(paddingHorizontal);

  const { linePath, areaPath, scaledPoints, minPrice, maxPrice, minIndex, maxIndex } =
    useMemo(() => {
      if (!points || points.length < 2) {
        return {
          linePath: null,
          areaPath: null,
          scaledPoints: [],
          minPrice: 0,
          maxPrice: 0,
          minIndex: -1,
          maxIndex: -1,
        };
      }

      let minP = Number.POSITIVE_INFINITY;
      let maxP = Number.NEGATIVE_INFINITY;
      const minT = points[0]![0];
      const maxT = points[points.length - 1]![0];
      const timeDelta = maxT - minT || 1;

      for (const pt of points) {
        if (pt[1] < minP) minP = pt[1];
        if (pt[1] > maxP) maxP = pt[1];
      }

      const priceDelta = maxP - minP || 1;
      let lineSvg = "";
      let areaSvg = "";
      const scaled: { x: number; y: number; timestamp: number; price: number }[] = [];

      points.forEach((pt, idx) => {
        const [t, p] = pt;
        const x = paddingHorizontal + ((t - minT) / timeDelta) * chartWidth;
        const y = paddingVertical + chartHeight - ((p - minP) / priceDelta) * chartHeight;
        scaled.push({ x, y, timestamp: t, price: p });

        const xStr = x.toFixed(1);
        const yStr = y.toFixed(1);
        const baseStr = (paddingVertical + chartHeight).toFixed(1);

        lineSvg += idx === 0 ? `M ${xStr} ${yStr}` : ` L ${xStr} ${yStr}`;
        areaSvg += idx === 0 ? `M ${xStr} ${baseStr} L ${xStr} ${yStr}` : ` L ${xStr} ${yStr}`;
        if (idx === points.length - 1) areaSvg += ` L ${xStr} ${baseStr} Z`;
      });

      const lPath = Skia.Path.MakeFromSVGString(lineSvg);
      const aPath = Skia.Path.MakeFromSVGString(areaSvg);

      let minI = 0;
      let maxI = 0;
      for (let i = 1; i < scaled.length; i++) {
        if (scaled[i]!.price < scaled[minI]!.price) minI = i;
        if (scaled[i]!.price > scaled[maxI]!.price) maxI = i;
      }

      return {
        linePath: lPath,
        areaPath: aPath,
        scaledPoints: scaled,
        minPrice: minP,
        maxPrice: maxP,
        minIndex: minI,
        maxIndex: maxI,
      };
    }, [points, chartWidth, chartHeight]);

  const onScrubUpdate = useCallback(
    (touchX: number) => {
      if (scaledPoints.length === 0) return;
      let closestIdx = 0;
      let minDistance = Number.POSITIVE_INFINITY;
      for (let i = 0; i < scaledPoints.length; i++) {
        const dist = Math.abs(scaledPoints[i]!.x - touchX);
        if (dist < minDistance) {
          minDistance = dist;
          closestIdx = i;
        }
      }
      const point = scaledPoints[closestIdx];
      if (point) pointerX.set(point.x);
      if (scrubIndex !== closestIdx) {
        setScrubIndex(closestIdx);
        scheduleOnRN(Haptics.selectionAsync);
        if (isLocalExtremum(scaledPoints, closestIdx)) {
          scheduleOnRN(Haptics.impactAsync, Haptics.ImpactFeedbackStyle.Light);
        }
      }
    },
    [scaledPoints, scrubIndex, pointerX],
  );

  const onScrubEnd = useCallback(() => setScrubIndex(null), []);
  const panGesture = useMemo(
    () => buildPanGesture(onScrubUpdate, onScrubEnd),
    [onScrubUpdate, onScrubEnd],
  );
  const hudStyle = useAnimatedStyle(() => ({ transform: [{ translateX: pointerX.get() }] }));

  if (isUnavailableOffline) {
    return (
      <View
        testID="chart-offline-empty"
        style={[
          styles.emptyContainer,
          { height, backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        ]}
      >
        <Text
          style={[styles.emptyTitle, { color: theme.colors.text }]}
          testID="chart-offline-empty-title"
        >
          Chart range unavailable offline
        </Text>
        <Text
          style={[styles.emptySubtitle, { color: theme.colors.muted }]}
          testID="chart-offline-empty-subtitle"
        >
          Only previously cached ranges can be viewed while offline.
        </Text>
      </View>
    );
  }

  if (!linePath || !areaPath || scaledPoints.length === 0) {
    return (
      <View
        testID="chart-no-data"
        style={[
          styles.emptyContainer,
          { height, backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        ]}
      >
        <Text
          style={[styles.emptyTitle, { color: theme.colors.text }]}
          testID="chart-no-data-title"
        >
          No chart data available
        </Text>
      </View>
    );
  }

  const activePoint = scrubIndex !== null ? scaledPoints[scrubIndex] : null;
  const minPoint = scaledPoints[minIndex]!;
  const maxPoint = scaledPoints[maxIndex]!;

  return (
    <GestureDetector gesture={panGesture}>
      <View
        style={[styles.container, { height, width }]}
        testID="interactive-chart"
        onTouchStart={(e) => onScrubUpdate(e.nativeEvent.locationX)}
        onTouchMove={(e) => onScrubUpdate(e.nativeEvent.locationX)}
        onTouchEnd={() => setScrubIndex(null)}
      >
        {activePoint ? (
          <Animated.View
            testID="chart-scrub-badge"
            style={[
              styles.scrubBadge,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              hudStyle,
            ]}
          >
            <Text
              style={[styles.scrubPrice, { color: theme.colors.text }]}
              testID="chart-scrub-price"
            >
              {formatCurrency(String(activePoint.price), vsCurrency)}
            </Text>
            <Text
              style={[styles.scrubDate, { color: theme.colors.muted }]}
              testID="chart-scrub-date"
            >
              {new Date(activePoint.timestamp).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </Animated.View>
        ) : null}

        <Canvas style={{ width, height }} testID="chart-canvas">
          <Path path={areaPath} opacity={0.25}>
            <LinearGradient
              start={vec(0, paddingVertical)}
              end={vec(0, paddingVertical + chartHeight)}
              colors={[strokeColor, "transparent"]}
            />
          </Path>
          <Path
            path={linePath}
            strokeWidth={2}
            style="stroke"
            strokeCap="round"
            strokeJoin="round"
            color={strokeColor}
          />
          <Circle cx={minPoint.x} cy={minPoint.y} r={4} color={theme.colors.muted} />
          <Circle cx={maxPoint.x} cy={maxPoint.y} r={4} color={strokeColor} />
          {activePoint ? (
            <Line
              p1={vec(activePoint.x, paddingVertical)}
              p2={vec(activePoint.x, paddingVertical + chartHeight)}
              color={theme.colors.muted}
              strokeWidth={1}
            />
          ) : null}
          {activePoint ? (
            <Circle cx={activePoint.x} cy={activePoint.y} r={5} color={strokeColor} />
          ) : null}
        </Canvas>

        <View style={styles.axisRow} testID="chart-axis">
          <Text style={[styles.axisText, { color: theme.colors.muted }]} testID="chart-axis-min">
            {`\u200E${formatCurrency(String(minPrice), vsCurrency)}\u200E`}
          </Text>
          <Text style={[styles.axisText, { color: theme.colors.muted }]} testID="chart-axis-max">
            {`\u200E${formatCurrency(String(maxPrice), vsCurrency)}\u200E`}
          </Text>
        </View>
      </View>
    </GestureDetector>
  );
}
