/**
 * NumericKeypad component.
 * Reusable keypad for on-screen numeric input in transaction entry flows.
 */
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@stores/themeStore";
import { font } from "@theme";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"] as const;

export interface NumericKeypadProps {
  readonly onDigit: (digit: string) => void;
  readonly onBackspace: () => void;
}

export function NumericKeypad({ onDigit, onBackspace }: NumericKeypadProps) {
  const theme = useTheme();

  return (
    <View style={styles.keypad} testID="numeric-keypad" nativeID="numeric-keypad">
      {KEYS.map((key) => {
        const isBackspace = key === "⌫";
        const keyId = isBackspace ? "backspace" : key;
        return (
          <Pressable
            key={key}
            testID={`keypad-${keyId}`}
            nativeID={`keypad-${keyId}`}
            style={[styles.keypadKey, { backgroundColor: theme.colors.background }]}
            onPress={() => {
              if (isBackspace) {
                onBackspace();
              } else {
                onDigit(key);
              }
            }}
          >
            <Text
              style={[styles.keypadKeyText, { color: theme.colors.text }]}
              testID={`keypad-${keyId}-label`}
            >
              {key}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  keypad: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  keypadKey: {
    width: "30%",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  keypadKeyText: {
    ...font("semibold"),
    fontSize: 18,
    fontWeight: "600",
  },
});
