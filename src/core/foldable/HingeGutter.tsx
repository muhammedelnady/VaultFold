/**
 * HingeGutter — the reserved, empty strip that sits exactly where the
 * physical hinge / crease is (or would be, in the simulator).
 *
 * Because panes are laid out on either side of this strip, no text, chart,
 * or control can ever be hidden behind the crease. The visual — a centre
 * seam plus soft shading on both sides — doubles as the demo hinge indicator.
 */
import { StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import type { HingeGutterSpec } from "./hingeGeometry";

const SEAM = "rgba(120,120,128,0.65)";
const SHADE = "rgba(0,0,0,0.12)";

export interface HingeGutterProps {
  readonly gutter: HingeGutterSpec;
}

export function HingeGutter({ gutter }: HingeGutterProps) {
  const isVertical = gutter.axis === "vertical";
  return (
    <Animated.View
      entering={FadeIn.duration(180)}
      exiting={FadeOut.duration(120)}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      testID="hinge-gutter"
      style={[
        isVertical ? { width: gutter.thickness } : { height: gutter.thickness },
        styles.base,
        isVertical ? styles.verticalRoot : styles.horizontalRoot,
      ]}
    >
      <View
        testID="hinge-gutter-seam"
        style={isVertical ? styles.verticalSeam : styles.horizontalSeam}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: SHADE,
  },
  verticalRoot: {
    alignSelf: "stretch",
  },
  horizontalRoot: {
    alignSelf: "stretch",
  },
  verticalSeam: {
    width: 2,
    alignSelf: "stretch",
    backgroundColor: SEAM,
    borderRadius: 1,
  },
  horizontalSeam: {
    height: 2,
    alignSelf: "stretch",
    backgroundColor: SEAM,
    borderRadius: 1,
  },
});
