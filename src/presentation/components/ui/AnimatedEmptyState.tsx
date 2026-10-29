/**
 * AnimatedEmptyState.tsx
 * High-performance, GPU-accelerated empty state component using Reanimated.
 * Features:
 * - Continuous smooth vertical floating motion
 * - Pulsing ambient glow halo ring behind the icon
 * - Localized title and description
 * - Optional primary and secondary action buttons
 * - Posture and RTL aware
 */
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";

import { useTranslation } from "@stores/languageStore";
import { useTheme } from "@stores/themeStore";
import { font } from "@theme";

export interface AnimatedEmptyStateProps {
  readonly iconName?: keyof typeof MaterialCommunityIcons.glyphMap;
  readonly title: string;
  readonly description?: string;
  readonly actionLabel?: string;
  readonly onAction?: () => void;
  readonly actionTestID?: string;
  readonly secondaryActionLabel?: string;
  readonly onSecondaryAction?: () => void;
  readonly secondaryActionTestID?: string;
  readonly testID?: string;
  readonly style?: ViewStyle;
}

export function AnimatedEmptyState({
  iconName = "package-variant",
  title,
  description,
  actionLabel,
  onAction,
  actionTestID,
  secondaryActionLabel,
  onSecondaryAction,
  secondaryActionTestID,
  testID = "animated-empty-state",
  style,
}: AnimatedEmptyStateProps) {
  const theme = useTheme();
  const { isRtl } = useTranslation();

  // Floating icon animation
  const translateY = useSharedValue(0);
  // Pulsing glow ring animation
  const glowScale = useSharedValue(0.9);
  const glowOpacity = useSharedValue(0.3);

  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      true,
    );

    glowScale.value = withRepeat(
      withSequence(
        withTiming(1.25, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.9, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );

    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.2, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, [translateY, glowScale, glowOpacity]);

  const floatingAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
    opacity: glowOpacity.value,
  }));

  const primaryAccent = theme.accent ?? theme.colors.primary;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
          direction: isRtl ? "rtl" : "ltr",
        },
        style,
      ]}
      testID={testID}
    >
      <View style={styles.iconWrapper} testID={`${testID}-icon-wrapper`}>
        {/* Pulsing ambient halo behind the icon */}
        <Animated.View
          style={[styles.glowRing, { backgroundColor: primaryAccent }, glowAnimatedStyle]}
          testID={`${testID}-glow`}
        />
        {/* Floating animated icon container */}
        <Animated.View
          style={[
            styles.iconBubble,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
            floatingAnimatedStyle,
          ]}
          testID={`${testID}-icon`}
        >
          <MaterialCommunityIcons name={iconName} size={42} color={primaryAccent} />
        </Animated.View>
      </View>

      <Text
        testID={`${testID}-title`}
        style={[
          styles.title,
          {
            color: theme.colors.text,
            textAlign: "center",
            writingDirection: isRtl ? "rtl" : "ltr",
          },
        ]}
      >
        {title}
      </Text>

      {description ? (
        <Text
          testID={`${testID}-description`}
          style={[
            styles.description,
            {
              color: theme.colors.muted,
              textAlign: "center",
              writingDirection: isRtl ? "rtl" : "ltr",
            },
          ]}
        >
          {description}
        </Text>
      ) : null}

      {actionLabel && onAction ? (
        <Pressable
          testID={actionTestID ?? `${testID}-action`}
          style={[styles.primaryButton, { backgroundColor: primaryAccent }]}
          onPress={onAction}
        >
          <Text
            style={[styles.primaryButtonText, { color: theme.colors.onPrimary }]}
            testID={`${actionTestID ?? `${testID}-action`}-label`}
          >
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}

      {secondaryActionLabel && onSecondaryAction ? (
        <Pressable
          testID={secondaryActionTestID ?? `${testID}-secondary-action`}
          style={[styles.secondaryButton, { borderColor: theme.colors.border }]}
          onPress={onSecondaryAction}
        >
          <Text
            style={[styles.secondaryButtonText, { color: theme.colors.text }]}
            testID={`${secondaryActionTestID ?? `${testID}-secondary-action`}-label`}
          >
            {secondaryActionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  iconWrapper: {
    width: 110,
    height: 110,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  glowRing: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  iconBubble: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 8,
  },
  title: {
    ...font("bold"),
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
    maxWidth: 320,
  },
  description: {
    ...font("regular"),
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 24,
    maxWidth: 300,
  },
  primaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 160,
    alignItems: "center",
    marginBottom: 10,
  },
  primaryButtonText: {
    ...font("semibold"),
    fontSize: 15,
    fontWeight: "600",
  },
  secondaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  secondaryButtonText: {
    ...font("medium"),
    fontSize: 14,
    fontWeight: "500",
  },
});
