/**
 * FoldableSimulatorBar — interactive developer bar at the top of the app
 * allowing any reviewer on a regular simulator to preview Compact,
 * Flat-Expanded, Book Mode (dual vertical panes), and Tabletop (horizontal
 * half-folded) layouts on the fly.
 *
 * Selection feeds `postureStore`, so `useDevicePosture` consumers rearrange
 * on the same press. The offline toggle rides the real `effectiveOnline`
 * path through `Connectivity.setSimulatedOffline`, matching NetInfo.
 *
 * Rendered by the root layout inside `AppProviders` (container ready) and
 * only when `EXPO_PUBLIC_REVIEW_MODE === "1"` (preview profile or local
 * review; production stays clean).
 */
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { font } from "@theme";

import { PostureSwitcher } from "./PostureSwitcher";
import type { DevicePosture } from "./useDevicePosture";
import { useDevicePosture } from "./useDevicePosture";

export interface FoldableSimulatorBarProps {
  readonly onPostureChange?: (posture: DevicePosture) => void;
  readonly onToggleOffline?: (offline: boolean) => void;
}

const BAR_COLORS = {
  background: "#111827",
  title: "#F9FAFB",
  accent: "#3B82F6",
  accentText: "#FFFFFF",
  online: "#10B981",
  offline: "#F59E0B",
} as const;

export function FoldableSimulatorBar({
  onPostureChange,
  onToggleOffline,
}: FoldableSimulatorBarProps) {
  const { posture } = useDevicePosture();
  const [offlineMode, setOfflineMode] = useState(false);

  return (
    <View style={BAR_STYLES.container} testID="foldable-simulator-toggle">
      <View style={BAR_STYLES.box} testID="foldable-simulator-box">
        <Text style={BAR_STYLES.title} testID="foldable-simulator-posture">
          {posture} »
        </Text>

        <PostureSwitcher onSelect={onPostureChange} />

        <Pressable
          testID="simulator.offline-toggle"
          nativeID="simulator.offline-toggle"
          accessibilityLabel={offlineMode ? "Disable offline mode" : "Enable offline mode"}
          accessibilityRole="button"
          onPress={() => {
            const next = !offlineMode;
            setOfflineMode(next);
            onToggleOffline?.(next);
          }}
          style={[
            BAR_STYLES.offlineBtn,
            { backgroundColor: offlineMode ? BAR_COLORS.offline : BAR_COLORS.online },
          ]}
        >
          <Text style={BAR_STYLES.offlineBtnText} testID="simulator.offline-toggle-label">
            {offlineMode ? "🛰 Offline" : "🌐 Online"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const BAR_STYLES = StyleSheet.create({
  container: {
    width: "100%",
    paddingTop: 24,
    backgroundColor: BAR_COLORS.background,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  box: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
    width: "100%",
  },
  title: {
    ...font("semibold"),
    fontSize: 16,
    fontWeight: "600",
    color: BAR_COLORS.title,
  },
  offlineBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderCurve: "continuous",
  },
  offlineBtnText: {
    ...font("regular"),
    color: BAR_COLORS.accentText,
    fontSize: 13,
  },
});
