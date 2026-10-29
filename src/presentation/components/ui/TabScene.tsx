/**
 * TabScene — container wrapper for tab screens.
 *
 * Provides solid theme background to prevent any background flash or transparency
 * bleed when switching between tabs in native navigation.
 */
import { type ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { useTheme } from "@stores/themeStore";

export interface TabSceneProps {
  readonly children: ReactNode;
  readonly testID?: string;
}

export function TabScene({ children, testID = "tab-scene" }: TabSceneProps) {
  const theme = useTheme();

  return (
    <View testID={testID} style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
