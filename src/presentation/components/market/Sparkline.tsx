/**
 * Sparkline component.
 * Downsamples data to <= 40 points using LTTB and renders a precomputed SVG
 * path with a subtle gradient fill under the line and color coding by delta.
 */
import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";

import { buildSparklineSvgPath, downsampleLTTB } from "./lttb";

export interface SparklineProps {
  readonly data: readonly number[];
  readonly color: string;
  readonly width?: number;
  readonly height?: number;
  readonly testID?: string;
}

export const Sparkline = React.memo(function Sparkline({
  data,
  color,
  width = 68,
  height = 24,
  testID = "sparkline",
}: SparklineProps) {
  const { linePath, areaPath, gradientId } = useMemo(() => {
    if (data.length === 0) {
      return { linePath: "", areaPath: "", gradientId: "" };
    }
    const downsampled = downsampleLTTB(data, 40);
    const line = buildSparklineSvgPath(downsampled, width, height);
    if (!line) {
      return { linePath: "", areaPath: "", gradientId: "" };
    }
    const area = `${line} L ${width} ${height} L 0 ${height} Z`;
    return {
      linePath: line,
      areaPath: area,
      gradientId: `spark-${color.replace(/[^a-z0-9]/gi, "")}`,
    };
  }, [data, width, height, color]);

  if (!linePath) {
    return (
      <View
        style={[styles.container, { width, height }]}
        testID={`${testID}-empty`}
        nativeID={`${testID}-empty`}
      />
    );
  }

  return (
    <View style={[styles.container, { width, height }]} testID={testID} nativeID={testID}>
      <Svg width={width} height={height} testID={`${testID}-svg`}>
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity={0.32} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
        <Path
          d={linePath}
          stroke={color}
          strokeWidth={1.5}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
});
