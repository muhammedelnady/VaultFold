// VaultFold global test setup.
// Known-module mocks, MMKV shim, and fixture HTTP adapter mocks.
// Mocks are cleared between tests via `clearMocks: true` in jest.config.js.

require("react-native-gesture-handler/jestSetup");

// Self-contained Reanimated mock: the shipped `react-native-reanimated/mock`
// pulls in `initializers.native`, which calls `setCSSEventHandler` on the
// native module (absent under jest) and throws. This mock exposes only the
// surface the app uses, with synchronous timing, so components using
// Reanimated hooks render and animate under jest.
jest.mock("react-native-reanimated", () => {
  const { View, Text } = require("react-native");

  const useSharedValue = (initial: unknown) => {
    let current = initial;
    return {
      value: current,
      get: () => current,
      set: (next: unknown) => {
        current =
          typeof next === "function" ? (next as (...args: unknown[]) => unknown)(current) : next;
        return current;
      },
    };
  };

  const useAnimatedStyle = (factory: () => Record<string, unknown>) => {
    try {
      return factory();
    } catch {
      return {};
    }
  };

  const withTiming = (value: unknown) => value;
  const withSpring = (value: unknown) => value;

  const Easing = {
    bezier: () => (t: number) => t,
    in: (fn: (t: number) => number) => fn,
    out: (fn: (t: number) => number) => fn,
    inOut: (fn: (t: number) => number) => fn,
    linear: (t: number) => t,
    ease: (t: number) => t,
  };

  const ReduceMotion = { System: 0, Always: 1, Never: 2 };
  const useReducedMotion = () => false;

  const Animated = {
    View,
    Text,
    Image: View,
    ScrollView: View,
    createAnimatedComponent: (component: unknown) => component,
  };

  const interpolate = (value: number, _input: number[], output: number[]) => output[0] ?? value;
  const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

  const FadeIn = { duration: () => FadeIn };
  const FadeOut = { duration: () => FadeOut };

  const setUpTests = () => undefined;

  return {
    __esModule: true,
    default: Animated,
    Animated,
    Easing,
    ReduceMotion,
    FadeIn,
    FadeOut,
    interpolate,
    clamp,
    useSharedValue,
    useAnimatedStyle,
    useReducedMotion,
    useAnimatedReaction: () => undefined,
    useEvent: () => ({}),
    useAnimatedProps: (factory: () => Record<string, unknown>) => {
      try {
        return factory();
      } catch {
        return {};
      }
    },
    withTiming,
    withSpring,
    withDecay: (value: unknown) => value,
    withRepeat: (value: unknown) => value,
    withSequence: (...values: unknown[]) => values[values.length - 1],
    withDelay: (_delay: number, value: unknown) => value,
    cancelAnimation: () => undefined,
    runOnJS:
      (fn: (...args: unknown[]) => unknown) =>
      (...args: unknown[]) =>
        fn(...args),
    runOnUI:
      (fn: (...args: unknown[]) => unknown) =>
      (...args: unknown[]) =>
        fn(...args),
    scheduleOnRN: (fn: (...args: unknown[]) => unknown, ...args: unknown[]) => fn(...args),
    scheduleOnUI: (fn: (...args: unknown[]) => unknown, ...args: unknown[]) => fn(...args),
    setUpTests,
  };
});

// Mock react-native-gesture-handler root view enforcement in tests
jest.mock("react-native-gesture-handler/src/v3/detectors/useEnsureGestureHandlerRootView", () => ({
  useEnsureGestureHandlerRootView: () => undefined,
}));
jest.mock(
  "react-native-gesture-handler/lib/module/v3/detectors/useEnsureGestureHandlerRootView",
  () => ({
    useEnsureGestureHandlerRootView: () => undefined,
  }),
);

// Mock expo-router navigation
jest.mock("expo-router", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    useRouter: () => ({
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
    }),
    useLocalSearchParams: () => ({ coinId: "bitcoin" }),
    Redirect: ({ href }: { href: string }) =>
      React.createElement(Text, { testID: "route-redirect" }, href),
  };
});

// Mock @shopify/react-native-skia
jest.mock("@shopify/react-native-skia", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    Canvas: ({ children, ...props }: { children?: React.ReactNode }) =>
      React.createElement(View, props, children),
    Path: (props: Record<string, unknown>) => React.createElement(View, props),
    Line: (props: Record<string, unknown>) => React.createElement(View, props),
    Circle: (props: Record<string, unknown>) => React.createElement(View, props),
    Group: ({ children, ...props }: { children?: React.ReactNode }) =>
      React.createElement(View, props, children),
    LinearGradient: (props: Record<string, unknown>) => React.createElement(View, props),
    vec: (x: number, y: number) => ({ x, y }),
    Skia: {
      Path: {
        Make: () => ({
          moveTo: jest.fn(),
          lineTo: jest.fn(),
          close: jest.fn(),
        }),
        MakeFromSVGString: (s: string) => ({ toSVGString: () => s }),
      },
    },
  };
});

// Mock expo-haptics
jest.mock("expo-haptics", () => ({
  selectionAsync: jest.fn(),
  notificationAsync: jest.fn(),
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" },
  NotificationFeedbackType: { Success: "success", Warning: "warning", Error: "error" },
}));

// Mock react-native-worklets. The real module cannot be loaded under jest-expo
// (its native unpacker init runs at import time), so we provide a recursive
// Proxy stub: every property is callable and chainable, with a synchronous
// scheduler for the thread functions.
jest.mock("react-native-worklets", () => {
  const makeStub = (): unknown => {
    const fn = (..._args: unknown[]) => undefined;
    return new Proxy(fn, {
      get(_target, prop) {
        if (prop === "IS_JEST") return true;
        if (prop === "then") return undefined; // not a thenable
        return makeStub();
      },
    });
  };
  const stub = makeStub() as Record<string, unknown>;
  // Synchronous schedulers.
  const sync = (fn: (...args: unknown[]) => unknown, ...args: unknown[]) => fn(...args);
  stub["scheduleOnRN"] = sync;
  stub["scheduleOnUI"] = sync;
  stub["runOnJS"] =
    (fn: (...args: unknown[]) => unknown) =>
    (...args: unknown[]) =>
      fn(...args);
  stub["runOnUI"] =
    (fn: (...args: unknown[]) => unknown) =>
    (...args: unknown[]) =>
      fn(...args);
  stub["runOnUISync"] = (...args: unknown[]) => args;
  stub["executeOnUIRuntimeSync"] = (...args: unknown[]) => args;
  stub["runOnUIAsync"] = (fn: (...args: unknown[]) => unknown, ...args: unknown[]) =>
    Promise.resolve(fn(...args));
  stub["getCurrentThreadId"] = () => 0;
  stub["IS_JEST"] = true;
  return stub;
});

jest.mock("expo-notifications", () => ({
  PermissionStatus: {
    GRANTED: "granted",
    UNDETERMINED: "undetermined",
    DENIED: "denied",
  },
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  scheduleNotificationAsync: jest.fn().mockResolvedValue("test-notification-id"),
}));

// Mock expo-local-authentication
jest.mock("expo-local-authentication", () => ({
  AuthenticationType: {
    FINGERPRINT: 1,
    FACIAL_RECOGNITION: 2,
    IRIS: 3,
  },
  hasHardwareAsync: jest.fn().mockResolvedValue(true),
  isEnrolledAsync: jest.fn().mockResolvedValue(true),
  supportedAuthenticationTypesAsync: jest.fn().mockResolvedValue([1, 2]),
  authenticateAsync: jest.fn().mockResolvedValue({ success: true }),
}));

// Mock expo-screen-capture
jest.mock("expo-screen-capture", () => ({
  preventScreenCaptureAsync: jest.fn().mockResolvedValue(undefined),
  allowScreenCaptureAsync: jest.fn().mockResolvedValue(undefined),
  isAvailableAsync: jest.fn().mockResolvedValue(true),
}));

// Mock @expo/vector-icons to prevent asset registry missing errors and font load warnings
jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
  MaterialIcons: "MaterialIcons",
  MaterialCommunityIcons: "MaterialCommunityIcons",
  FontAwesome: "FontAwesome",
  Feather: "Feather",
  AntDesign: "AntDesign",
  Entypo: "Entypo",
  EvilIcons: "EvilIcons",
  FontAwesome5: "FontAwesome5",
  Fontisto: "Fontisto",
  Foundation: "Foundation",
  Octicons: "Octicons",
  SimpleLineIcons: "SimpleLineIcons",
  Zocial: "Zocial",
}));
// Mock @react-native-community/netinfo
jest.mock("@react-native-community/netinfo", () =>
  require("@react-native-community/netinfo/jest/netinfo-mock.js"),
);

// Polyfill console module for @testing-library/react-native v14 compatibility
global.console = global.console || {
  log: (...args: unknown[]) => {
    console.log?.(...args);
  },
  warn: (...args: unknown[]) => {
    console.warn?.(...args);
  },
  error: (...args: unknown[]) => {
    console.error?.(...args);
  },
  info: (...args: unknown[]) => {
    console.info?.(...args);
  },
  debug: (...args: unknown[]) => {
    console.debug?.(...args);
  },
};
