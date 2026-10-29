/**
 * AdaptiveDualPane — renders the arrangement for the
 * current posture. One route tree for every posture; selection/navigation
 * wiring comes from the router.
 *
 * COMPACT single pane (master only; detail pushes on the Stack).
 * FLAT_EXPANDED master/detail side by side; master width = clamp(38 % w, 320, 420).
 * BOOK_MODE master/detail either side of the hinge gutter; master at the
 * start edge (flips in RTL via logical props only).
 * TABLETOP_MODE stacked vertically: detail on top, master at the bottom.
 */
import React from "react";
import { StyleSheet, View } from "react-native";

import { useDevicePosture, type PostureInfo } from "./useDevicePosture";
import { useViewport } from "./useViewport";

export function clampMasterWidth(widthDp: number): number {
  return Math.min(420, Math.max(320, Math.round(widthDp * 0.38)));
}

interface PaneProps {
  readonly marketPane: React.ReactNode;
  readonly detailPane: React.ReactNode;
  readonly emptyDetail?: React.ReactNode;
  readonly compactDetail?: React.ReactNode;
  readonly compactDetailVisible?: boolean;
  readonly postureOverride?: "auto" | "COMPACT" | "FLAT_EXPANDED" | "BOOK_MODE" | "TABLETOP_MODE";
}

function DualPaneBody({
  posture,
  masterWidthDp,
  marketPane,
  detailPane,
  emptyDetail,
}: {
  readonly posture: PostureInfo;
  readonly masterWidthDp: number;
} & PaneProps): React.ReactElement {
  if (posture.posture === "TABLETOP_MODE") {
    return (
      <View style={styles.stackRoot} testID="adaptive-dual-pane-tabletop">
        <View style={styles.detailTop} testID="tabletop-top">
          {detailPane ?? emptyDetail}
        </View>
        <View style={styles.masterBottom} testID="tabletop-bottom">
          {marketPane}
        </View>
      </View>
    );
  }
  return (
    <View style={styles.rowRoot} testID="adaptive-dual-pane">
      <View
        style={[styles.masterStart, { width: clampMasterWidth(masterWidthDp) }]}
        testID="dual-pane-master"
      >
        {marketPane}
      </View>
      <View style={styles.detailEnd} testID="dual-pane-detail">
        {detailPane ?? emptyDetail}
      </View>
    </View>
  );
}

export function AdaptiveDualPane({
  marketPane,
  detailPane,
  emptyDetail,
  postureOverride,
}: PaneProps) {
  const { width } = useViewport();
  const posture = useDevicePosture(postureOverride ? { override: postureOverride } : undefined);
  if (!posture.isDualPane) {
    return (
      <View style={styles.compactRoot} testID="dual-pane-compact">
        {marketPane}
      </View>
    );
  }
  return (
    <DualPaneBody
      posture={posture}
      masterWidthDp={width}
      marketPane={marketPane}
      detailPane={detailPane}
      emptyDetail={emptyDetail}
    />
  );
}

const styles = StyleSheet.create({
  rowRoot: {
    flex: 1,
    flexDirection: "row",
  },
  stackRoot: {
    flex: 1,
  },
  masterStart: {
    flex: 0,
  },
  detailEnd: {
    flex: 1,
  },
  masterBottom: {
    flex: 1,
  },
  detailTop: {
    flex: 1,
  },
  compactRoot: {
    flex: 1,
  },
});
