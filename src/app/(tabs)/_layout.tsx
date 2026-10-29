/**
 * Primary tab layout — native bottom tab bar.
 *
 * Native tab layout: on iOS 26+ this renders the system
 * liquid-glass UITabBarController, and on Android it renders the native
 * Material bottom navigation. Icons use SF Symbols on iOS and Material
 * Symbols on Android so every tab reads correctly on its platform.
 *
 * Motion:
 * - The system animates the liquid-glass selection pill on every switch.
 * - `minimizeBehavior` slides the bar away while scrolling down and brings
 *   it back on scroll up (iOS 26+).
 * - Every tab press fires a selection haptic; the scene itself is animated
 *   by `TabScene` in each route.
 */
import { NativeTabs } from "expo-router/native-tabs";
import { useMemo } from "react";

import { fireHaptic } from "@presentation/components/ui/PressableScale";
import { useTranslation } from "@stores/languageStore";
import { useTheme } from "@stores/themeStore";

export default function TabsLayout() {
  const { t } = useTranslation();
  const theme = useTheme();

  const screenListeners = useMemo(
    () => ({
      tabPress: () => {
        fireHaptic("selection");
      },
    }),
    [],
  );

  return (
    <NativeTabs
      activityEnabled
      minimizeBehavior="onScrollDown"
      screenListeners={screenListeners}
      tintColor={theme.accent ?? theme.colors.primary}
      iconColor={{
        default: theme.colors.muted,
        selected: theme.accent ?? theme.colors.primary,
      }}
      backgroundColor={theme.colors.surface}
    >
      <NativeTabs.Trigger name="market" testID="tabs.market" accessibilityLabel="tab-market">
        <NativeTabs.Trigger.Label
          selectedStyle={{ color: theme.accent ?? theme.colors.primary, fontWeight: "700" }}
        >
          {t("tabs.market")}
        </NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "chart.line.uptrend.xyaxis", selected: "chart.line.uptrend.xyaxis" }}
          md={{ default: "trending_up", selected: "trending_up" }}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="portfolio" testID="tabs.vault" accessibilityLabel="tab-portfolio">
        <NativeTabs.Trigger.Label
          selectedStyle={{ color: theme.accent ?? theme.colors.primary, fontWeight: "700" }}
        >
          {t("tabs.portfolio")}
        </NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "briefcase", selected: "briefcase.fill" }}
          md={{ default: "account_balance_wallet", selected: "account_balance_wallet" }}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="alerts" testID="tabs.alerts" accessibilityLabel="tab-alerts">
        <NativeTabs.Trigger.Label
          selectedStyle={{ color: theme.accent ?? theme.colors.primary, fontWeight: "700" }}
        >
          {t("tabs.alerts")}
        </NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "bell", selected: "bell.fill" }}
          md={{ default: "notifications", selected: "notifications" }}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings" testID="tabs.settings" accessibilityLabel="tab-settings">
        <NativeTabs.Trigger.Label
          selectedStyle={{ color: theme.accent ?? theme.colors.primary, fontWeight: "700" }}
        >
          {t("tabs.settings")}
        </NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "gearshape", selected: "gearshape.fill" }}
          md={{ default: "settings", selected: "settings" }}
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
