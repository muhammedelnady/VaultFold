/**
 * Primary tab layout — universal horizontal bottom tab bar.
 *
 * Renders a consistent, polished bottom tab bar across ordinary iPhones,
 * foldables, and iPhone Duo (both folded and unfolded).
 */
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { fireHaptic } from "@presentation/components/ui/PressableScale";
import { useTranslation } from "@stores/languageStore";
import { useTheme } from "@stores/themeStore";
import { font } from "@theme";

export default function TabsLayout() {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const activeColor = theme.accent ?? theme.colors.primary;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 60 + Math.max(insets.bottom, 12),
          paddingBottom: Math.max(insets.bottom, 12),
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          ...font("medium"),
          fontSize: 12,
          fontWeight: "600",
        },
      }}
      screenListeners={{
        tabPress: () => {
          fireHaptic("selection");
        },
      }}
    >
      <Tabs.Screen
        name="market"
        options={{
          title: t("tabs.market"),
          tabBarLabel: t("tabs.market"),
          tabBarButtonTestID: "tabs.market",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="chart-timeline-variant"
              size={size}
              color={color as string}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="portfolio"
        options={{
          title: t("tabs.portfolio"),
          tabBarLabel: t("tabs.portfolio"),
          tabBarButtonTestID: "tabs.vault",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="wallet-outline" size={size} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: t("tabs.alerts"),
          tabBarLabel: t("tabs.alerts"),
          tabBarButtonTestID: "tabs.alerts",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="bell-outline" size={size} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t("tabs.settings"),
          tabBarLabel: t("tabs.settings"),
          tabBarButtonTestID: "tabs.settings",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog-outline" size={size} color={color as string} />
          ),
        }}
      />
    </Tabs>
  );
}
