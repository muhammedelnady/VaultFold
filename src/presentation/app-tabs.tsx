/**
 * AppTabs.
 *
 * Root tab navigation compositing:
 *   - Market (FlatList)
 *   - Portfolio (offline-first, biometric protected)
 *   - Alerts (watchlist + price alerts)
 *   - Settings (theme + language + currency)
 *
 * Coin detail is not a tab; it lives on the route
 * tree (`/market`, `/market/[coinId]`) with the detail pushed on the Stack.
 */
import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator, type BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  NavigationIndependentTree,
} from "@react-navigation/native";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { initialWindowMetrics } from "react-native-safe-area-context";

import { fireHaptic } from "@presentation/components/ui/PressableScale";
import { AlertsScreen } from "@presentation/screens/alerts/AlertsScreen";
import { MarketScreen } from "@presentation/screens/market/MarketScreen";
import { PortfolioScreen } from "@presentation/screens/portfolio/PortfolioScreen";
import { SettingsScreen } from "@presentation/screens/settings/SettingsScreen";
import { useTranslation } from "@stores/languageStore";
import { useTheme, useThemeStore } from "@stores/themeStore";
import { font } from "@theme";

type RootTabParamList = {
  Market: undefined;
  Portfolio: undefined;
  Alerts: undefined;
  Settings: undefined;
};

const TAB_ICONS: Record<
  keyof RootTabParamList,
  {
    readonly active: keyof typeof Ionicons.glyphMap;
    readonly inactive: keyof typeof Ionicons.glyphMap;
  }
> = {
  Market: { active: "stats-chart", inactive: "stats-chart-outline" },
  Portfolio: { active: "wallet", inactive: "wallet-outline" },
  Alerts: { active: "notifications", inactive: "notifications-outline" },
  Settings: { active: "settings", inactive: "settings-outline" },
};

function MarketTabScreen() {
  const router = useRouter();

  return (
    <MarketScreen
      onSelectCoin={(coinId) => {
        router.push(`/market/${coinId}` as never);
      }}
    />
  );
}

function PortfolioTabScreen() {
  const router = useRouter();

  return (
    <PortfolioScreen
      onSelectCoin={(coinId) => {
        router.push(`/market/${coinId}` as never);
      }}
    />
  );
}

function SettingsTabScreen() {
  return <SettingsScreen />;
}

function AlertsTabScreen() {
  return <AlertsScreen />;
}

const Tab = createBottomTabNavigator<RootTabParamList>();

const tabIconStyles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    width: 48,
    height: 36,
  },
  activePill: {
    position: "absolute",
    top: 0,
    left: 4,
    right: 4,
    bottom: 2,
    borderRadius: 16,
  },
  indicator: {
    marginTop: 3,
    height: 3,
    borderRadius: 2,
  },
});

function TabIcon({
  focused,
  color,
  size,
  icons,
  name,
}: {
  readonly focused: boolean;
  readonly color: string;
  readonly size: number;
  readonly icons: {
    readonly active: keyof typeof Ionicons.glyphMap;
    readonly inactive: keyof typeof Ionicons.glyphMap;
  };
  readonly name: string;
}) {
  const theme = useTheme();
  const scale = useSharedValue(focused ? 1.15 : 1);
  const pillOpacity = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    scale.set(withSpring(focused ? 1.15 : 1, { damping: 14, stiffness: 280 }));
    pillOpacity.set(withTiming(focused ? 1 : 0, { duration: 180 }));
  }, [focused, scale, pillOpacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));

  const pillStyle = useAnimatedStyle(() => ({
    opacity: pillOpacity.get(),
  }));

  const tabKey = name.toLowerCase();

  return (
    <View style={tabIconStyles.wrapper} testID={`tab-icon-${tabKey}`}>
      <Animated.View
        style={[
          tabIconStyles.activePill,
          {
            backgroundColor: `${theme.accent ?? theme.colors.primary}1E`,
          },
          pillStyle,
        ]}
        testID={`tab-icon-${tabKey}-pill`}
      />
      <Animated.View style={animatedStyle} testID={`tab-icon-${tabKey}-glyph`}>
        <Ionicons name={focused ? icons.active : icons.inactive} size={size} color={color} />
      </Animated.View>
      <View
        style={[
          tabIconStyles.indicator,
          {
            backgroundColor: color,
            width: focused ? 14 : 0,
            opacity: focused ? 1 : 0,
          },
        ]}
        testID={`tab-icon-${tabKey}-indicator`}
      />
    </View>
  );
}

function useTabScreenOptions(insets: { bottom: number }) {
  const theme = useTheme();
  const mode = useThemeStore((s) => s.mode);
  const isDark = mode === "dark";

  const overlay = isDark ? "rgba(17, 24, 39, 0.82)" : "rgba(255, 255, 255, 0.94)";
  const tint = isDark ? "dark" : "light";
  const hairline = isDark ? "rgba(255, 255, 255, 0.18)" : "rgba(17, 24, 39, 0.12)";

  return ({ route }: { route: BottomTabScreenProps<RootTabParamList>["route"] }) => ({
    headerShown: false,
    tabBarActiveTintColor: theme.accent ?? theme.colors.primary,
    tabBarInactiveTintColor: theme.colors.muted,
    tabBarHideOnKeyboard: true,
    tabBarBackground: () => (
      <View style={StyleSheet.absoluteFill} testID="tab-bar-background">
        <BlurView
          testID="tab-bar-blur"
          style={StyleSheet.absoluteFill}
          intensity={92}
          tint={tint}
          experimentalBlurMethod="dimezisBlurView"
        />
        <View
          testID="tab-bar-overlay"
          style={[StyleSheet.absoluteFill, { backgroundColor: overlay }]}
        />
      </View>
    ),
    tabBarStyle: {
      position: "absolute" as const,
      left: 16,
      right: 16,
      bottom: Math.max(insets.bottom, 10),
      height: 66,
      borderRadius: 30,
      borderWidth: 1.2,
      borderColor: hairline,
      overflow: "hidden" as const,
      paddingHorizontal: 8,
      paddingTop: 8,
      paddingBottom: 8,
      borderTopWidth: 1.2,
      elevation: 20,
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 14 },
      shadowOpacity: isDark ? 0.4 : 0.16,
      shadowRadius: 26,
      backgroundColor: "transparent",
    },
    tabBarIcon: ({ color, size, focused }: { color: string; size: number; focused: boolean }) => (
      <TabIcon
        focused={focused}
        color={color}
        size={size}
        icons={TAB_ICONS[route.name]}
        name={route.name}
      />
    ),
    tabBarLabelStyle: {
      fontSize: 11,
      fontWeight: "600" as const,
      letterSpacing: 0.2,
      ...font("medium"),
    },
  });
}

export function AppTabs() {
  const theme = useTheme();
  const mode = useThemeStore((s) => s.mode);
  const { t, isRtl } = useTranslation();
  const insets = initialWindowMetrics?.insets ?? { top: 0, left: 0, right: 0, bottom: 0 };
  const tabScreenOptions = useTabScreenOptions(insets);
  const baseTheme = mode === "dark" ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...baseTheme,
    dark: mode === "dark",
    colors: {
      ...baseTheme.colors,
      primary: theme.accent ?? theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.text,
      border: theme.colors.border,
      notification: theme.accent ?? theme.colors.primary,
    },
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.background,
        direction: isRtl ? "rtl" : "ltr",
      }}
      testID="app-tabs"
    >
      <NavigationIndependentTree>
        <NavigationContainer theme={navTheme}>
          <Tab.Navigator
            initialRouteName="Market"
            screenOptions={(props) => ({
              ...tabScreenOptions(props),
              sceneStyle: { backgroundColor: theme.colors.background },
            })}
            screenListeners={{
              tabPress: () => {
                fireHaptic("selection");
              },
            }}
          >
            <Tab.Screen
              name="Market"
              component={MarketTabScreen}
              options={{
                title: t("tabs.market"),
                tabBarButtonTestID: "tabs.market",
                tabBarAccessibilityLabel: "tab-market",
              }}
            />
            <Tab.Screen
              name="Portfolio"
              component={PortfolioTabScreen}
              options={{
                title: t("tabs.portfolio"),
                tabBarButtonTestID: "tabs.vault",
                tabBarAccessibilityLabel: "tab-portfolio",
              }}
            />
            <Tab.Screen
              name="Alerts"
              component={AlertsTabScreen}
              options={{
                title: t("tabs.alerts"),
                tabBarButtonTestID: "tabs.alerts",
                tabBarAccessibilityLabel: "tab-alerts",
              }}
            />
            <Tab.Screen
              name="Settings"
              component={SettingsTabScreen}
              options={{
                title: t("tabs.settings"),
                tabBarButtonTestID: "tabs.settings",
                tabBarAccessibilityLabel: "tab-settings",
              }}
            />
          </Tab.Navigator>
        </NavigationContainer>
      </NavigationIndependentTree>
    </View>
  );
}
