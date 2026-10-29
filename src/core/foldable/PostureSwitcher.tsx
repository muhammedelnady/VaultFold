/**
 * PostureSwitcher — the posture option row shared by the developer
 * review bar and the Settings foldable-preview section.
 *
 * Self-contained (`core/foldable` imports nothing from presentation): styling
 * is injected through `tokens`; selection lands in the posture override store
 * so every consumer of `useDevicePosture` reacts on the same press.
 */
import { Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";

import { font } from "@theme";

import { usePostureOverrideStore } from "./postureStore";
import type { DevicePosture } from "./useDevicePosture";

export interface PostureSwitcherTokens {
  readonly chipBackground: string;
  readonly chipActiveBackground: string;
  readonly chipText: string;
  readonly chipActiveText: string;
  readonly chipBorder: string;
  readonly chipActiveBorder: string;
}

export const REVIEW_BAR_SWITCHER_TOKENS: PostureSwitcherTokens = {
  chipBackground: "#1F2937",
  chipActiveBackground: "#3B82F6",
  chipText: "#D1D5DB",
  chipActiveText: "#FFFFFF",
  chipBorder: "#374151",
  chipActiveBorder: "#60A5FA",
};

export const DEFAULT_POSTURES: readonly DevicePosture[] = [
  "COMPACT",
  "FLAT_EXPANDED",
  "BOOK_MODE",
  "TABLETOP_MODE",
];

export function shortLabelFor(posture: DevicePosture): string {
  switch (posture) {
    case "BOOK_MODE":
      return "book";
    case "TABLETOP_MODE":
      return "tabletop";
    case "FLAT_EXPANDED":
      return "flat_expanded";
    case "COMPACT":
      return "compact";
  }
}

export interface PostureSwitcherProps {
  readonly onSelect?: (posture: DevicePosture) => void;
  readonly tokens?: PostureSwitcherTokens;
  readonly testIdPrefix?: string;
  readonly accessibilityLabelPrefix?: string;
  readonly style?: ViewStyle;
}

export function PostureSwitcher({
  onSelect,
  tokens = REVIEW_BAR_SWITCHER_TOKENS,
  testIdPrefix = "posture-select",
  accessibilityLabelPrefix = "",
  style,
}: PostureSwitcherProps) {
  const override = usePostureOverrideStore((state) => state.override);

  return (
    <View style={[SWITCHER_STYLES.row, style]} testID="posture-switcher">
      {DEFAULT_POSTURES.map((posture) => {
        const shortLabel = shortLabelFor(posture);
        const isActive = override === posture;

        return (
          <Pressable
            key={posture}
            testID={`${testIdPrefix}-${shortLabel}`}
            accessibilityLabel={`${accessibilityLabelPrefix}${accessibilityLabelPrefix ? " " : ""}${posture}`}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            onPress={() => {
              usePostureOverrideStore.getState().setOverride(posture);
              onSelect?.(posture);
            }}
            style={[
              SWITCHER_STYLES.chip,
              {
                backgroundColor: isActive ? tokens.chipActiveBackground : tokens.chipBackground,
                borderColor: isActive ? tokens.chipActiveBorder : tokens.chipBorder,
              },
            ]}
          >
            <Text
              testID={`${testIdPrefix}-${shortLabel}-label`}
              style={[
                SWITCHER_STYLES.chipText,
                { color: isActive ? tokens.chipActiveText : tokens.chipText },
              ]}
            >
              {posture}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const SWITCHER_STYLES = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
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
