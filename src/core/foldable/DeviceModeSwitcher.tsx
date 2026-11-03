/**
 * DeviceModeSwitcher — the demo-friendly device picker in the review bar:
 * Standard iPhone · iPhone Duo · Foldable Book · Tabletop.
 *
 * Each chip carries a tiny device pictogram whose seam shows where the hinge
 * is, and selection writes the posture + preset into `postureStore`, so every
 * `useDevicePosture` consumer re-arranges on the same press with no reload.
 */
import { Pressable, StyleSheet, Text, View } from "react-native";

import { font } from "@theme";

import { PRESET_POSTURE, usePostureOverrideStore, type DevicePreset } from "./postureStore";
import type { DevicePosture } from "./useDevicePosture";

export interface DeviceModeTokens {
  readonly chipBackground: string;
  readonly chipActiveBackground: string;
  readonly chipText: string;
  readonly chipActiveText: string;
  readonly chipBorder: string;
  readonly chipActiveBorder: string;
}

export const DEVICE_MODE_TOKENS: DeviceModeTokens = {
  chipBackground: "#1F2937",
  chipActiveBackground: "#3B82F6",
  chipText: "#D1D5DB",
  chipActiveText: "#FFFFFF",
  chipBorder: "#374151",
  chipActiveBorder: "#60A5FA",
};

export interface DeviceMode {
  readonly preset: DevicePreset;
  readonly label: string;
  /** Short id suffix; matches the legacy `posture-select-*` Maestro ids. */
  readonly id: "compact" | "duo" | "book" | "tabletop";
}

export const DEVICE_MODES: readonly DeviceMode[] = [
  { preset: "standard", label: "Standard iPhone", id: "compact" },
  { preset: "duo", label: "iPhone Duo", id: "duo" },
  { preset: "book", label: "Foldable Book", id: "book" },
  { preset: "tabletop", label: "Tabletop", id: "tabletop" },
];

export interface DeviceModeSwitcherProps {
  readonly onSelect?: (posture: DevicePosture, preset: DevicePreset) => void;
  readonly tokens?: DeviceModeTokens;
  readonly testIdPrefix?: string;
}

function DevicePictogram({
  preset,
  color,
}: {
  readonly preset: DevicePreset;
  readonly color: string;
}) {
  const isTabletop = preset === "tabletop";
  const hasSeam = preset !== "standard";
  return (
    <View
      testID={`device-pictogram-${preset}`}
      style={[
        PICTO.frame,
        { borderColor: color },
        isTabletop ? PICTO.frameTabletop : PICTO.frameWide,
        preset === "standard" ? PICTO.frameStandard : null,
      ]}
    >
      {hasSeam ? (
        <View
          testID={`device-pictogram-${preset}-seam`}
          style={[
            isTabletop ? PICTO.seamHorizontal : PICTO.seamVertical,
            { backgroundColor: color },
          ]}
        />
      ) : null}
    </View>
  );
}

export function DeviceModeSwitcher({
  onSelect,
  tokens = DEVICE_MODE_TOKENS,
  testIdPrefix = "posture-select",
}: DeviceModeSwitcherProps) {
  const activePreset = usePostureOverrideStore((state) => state.preset);
  const override = usePostureOverrideStore((state) => state.override);

  return (
    <View style={STYLES.row} testID="device-mode-switcher">
      {DEVICE_MODES.map((mode) => {
        const posture = PRESET_POSTURE[mode.preset];
        const isActive =
          activePreset !== null
            ? activePreset === mode.preset
            : override === posture && mode.preset !== "duo";
        const textColor = isActive ? tokens.chipActiveText : tokens.chipText;
        return (
          <Pressable
            key={mode.preset}
            testID={`${testIdPrefix}-${mode.id}`}
            accessibilityRole="button"
            accessibilityLabel={mode.label}
            accessibilityState={{ selected: isActive }}
            onPress={() => {
              usePostureOverrideStore.getState().setPreset(mode.preset);
              onSelect?.(posture, mode.preset);
            }}
            style={[
              STYLES.chip,
              {
                backgroundColor: isActive ? tokens.chipActiveBackground : tokens.chipBackground,
                borderColor: isActive ? tokens.chipActiveBorder : tokens.chipBorder,
              },
            ]}
          >
            <DevicePictogram preset={mode.preset} color={textColor} />
            <Text
              testID={`${testIdPrefix}-${mode.id}-label`}
              style={[STYLES.chipText, { color: textColor }]}
            >
              {mode.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const PICTO = StyleSheet.create({
  frame: {
    borderWidth: 1.5,
    borderRadius: 3,
    alignItems: "center",
    justifyContent: "center",
    borderCurve: "continuous",
  },
  frameWide: { width: 20, height: 14 },
  frameTabletop: { width: 20, height: 14 },
  frameStandard: { width: 9, height: 14 },
  seamVertical: { width: 1.5, alignSelf: "stretch" },
  seamHorizontal: { height: 1.5, alignSelf: "stretch" },
});

const STYLES = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderCurve: "continuous",
  },
  chipText: {
    ...font("semibold"),
    fontSize: 13,
    fontWeight: "600",
  },
});
