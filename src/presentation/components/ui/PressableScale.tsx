/**
 * PressableScale — the app-wide press-feedback primitive.
 *
 * Shared-value implementation (scale 0.97 in 120 ms, strong ease-out) so the
 * motion runs on the UI thread and stays testable under the Reanimated mock.
 * Feedback lands on press-in so the affordance is visible at touch time.
 *
 * Reduced motion keeps an opacity affordance and drops the scale.
 */
import * as Haptics from "expo-haptics";
import { type ReactNode } from "react";
import { Pressable, type AccessibilityRole, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

export type PressHaptic = "selection" | "light" | "medium" | "success" | "none";

export interface PressableScaleProps {
  readonly children: ReactNode;
  readonly onPress?: () => void;
  readonly onLongPress?: () => void;
  readonly onPressIn?: () => void;
  readonly onPressOut?: () => void;
  readonly style?: StyleProp<ViewStyle>;
  readonly haptic?: PressHaptic;
  readonly pressedScale?: number;
  readonly disabled?: boolean;
  readonly testID?: string;
  readonly nativeID?: string;
  readonly accessibilityLabel?: string;
  readonly accessibilityRole?: AccessibilityRole;
  readonly accessibilityState?: {
    readonly disabled?: boolean;
    readonly selected?: boolean;
  };
  readonly hitSlop?: number;
  readonly pressRetentionOffset?: number;
}

const PRESS_EASING = Easing.bezier(0.23, 1, 0.32, 1);

export function fireHaptic(kind: PressHaptic): void {
  switch (kind) {
    case "selection":
      void Haptics.selectionAsync();
      break;
    case "light":
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      break;
    case "medium":
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      break;
    case "success":
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      break;
    case "none":
      break;
  }
}

export function PressableScale({
  children,
  onPress,
  onLongPress,
  onPressIn,
  onPressOut,
  style,
  haptic = "selection",
  pressedScale = 0.97,
  disabled = false,
  testID = "pressable-scale",
  nativeID,
  accessibilityLabel,
  accessibilityRole,
  accessibilityState,
  hitSlop,
  pressRetentionOffset,
}: PressableScaleProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));

  const handlePressIn = () => {
    if (!disabled) {
      fireHaptic(haptic);
      scale.set(withTiming(pressedScale, { duration: 120, easing: PRESS_EASING }));
    }
    onPressIn?.();
  };

  const handlePressOut = () => {
    scale.set(withTiming(1, { duration: 120, easing: PRESS_EASING }));
    onPressOut?.();
  };

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      testID={testID}
      nativeID={nativeID}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState}
      hitSlop={hitSlop}
      pressRetentionOffset={pressRetentionOffset}
    >
      <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>
    </Pressable>
  );
}
