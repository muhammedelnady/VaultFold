/**
 * AdaptiveDualPane — renders the arrangement for the
 * current posture.
 *
 * Tree Stability & Scroll/List State Preservation:
 * ONE container and ONE child order (master → hinge gutter → detail) are used
 * for every posture. Postures only change container flex direction and pane
 * sizing, so the master pane (the market list) is never unmounted when
 * folding / unfolding and keeps its scroll offset. Reanimated's
 * `LinearTransition` animates the pane frames between postures.
 *
 * COMPACT: single pane (master only; detail pushes on the Stack).
 * FLAT_EXPANDED: master/detail side by side; master width = clamp(38 % w, 320, 420).
 * BOOK_MODE (incl. iPhone Duo): master/detail either side of a reserved vertical hinge gutter.
 * TABLETOP_MODE: detail (chart/analytics) on top, a reserved horizontal hinge gutter,
 *   master (list + tactile controls) on the bottom (`column-reverse`).
 */
import React from "react";
import { StyleSheet } from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";

import { resolveHingeGutter } from "./hingeGeometry";
import { HingeGutter } from "./HingeGutter";
import { usePostureOverrideStore } from "./postureStore";
import { useDevicePosture } from "./useDevicePosture";
import { useViewport } from "./useViewport";

export function clampMasterWidth(widthDp: number): number {
  return Math.min(420, Math.max(320, Math.round(widthDp * 0.38)));
}

interface PaneProps {
  readonly marketPane: React.ReactNode;
  readonly detailPane: React.ReactNode;
  readonly emptyDetail?: React.ReactNode;
  readonly postureOverride?: "auto" | "COMPACT" | "FLAT_EXPANDED" | "BOOK_MODE" | "TABLETOP_MODE";
}

const PANE_TRANSITION = LinearTransition.duration(260);

export function AdaptiveDualPane({
  marketPane,
  detailPane,
  emptyDetail,
  postureOverride,
}: PaneProps) {
  const { width } = useViewport();
  const posture = useDevicePosture(postureOverride ? { override: postureOverride } : undefined);
  const preset = usePostureOverrideStore((state) => state.preset);

  const isTabletop = posture.posture === "TABLETOP_MODE";
  const isDual = posture.isDualPane;
  const isFoldableSplit =
    posture.posture === "BOOK_MODE" || posture.hinge !== null || (isDual && width < 1000);
  const gutter = isDual ? resolveHingeGutter(posture.posture, preset, posture.hingeBounds) : null;

  const rootTestId = isTabletop
    ? "adaptive-dual-pane-tabletop"
    : isDual
      ? "adaptive-dual-pane"
      : "dual-pane-compact";

  const masterStyle = !isDual
    ? styles.fill
    : isTabletop || isFoldableSplit
      ? styles.fill
      : { width: clampMasterWidth(width) };

  return (
    <Animated.View
      layout={PANE_TRANSITION}
      style={[styles.fill, isTabletop ? styles.column : isDual ? styles.row : null]}
      testID={rootTestId}
    >
      <Animated.View
        layout={PANE_TRANSITION}
        style={masterStyle}
        testID={isTabletop ? "tabletop-bottom" : "dual-pane-master"}
      >
        {marketPane}
      </Animated.View>
      {gutter ? <HingeGutter key="hinge-gutter" gutter={gutter} /> : null}
      {isDual ? (
        <Animated.View
          layout={PANE_TRANSITION}
          style={styles.fill}
          testID={isTabletop ? "tabletop-top" : "dual-pane-detail"}
        >
          {detailPane ?? emptyDetail}
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
  },
  /** Reversed so the detail (chart) pane renders on top and the list below. */
  column: {
    flexDirection: "column-reverse",
  },
});
