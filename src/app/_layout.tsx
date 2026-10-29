/**
 * Root layout.
 *
 * Composition:
 * 1. StatusBar — adaptive style for theme
 * 2. AppProviders — DI bootstrap (async)
 * 3. Dynamic theme & RTL direction provider
 * 4. PersistQueryClientProvider — TanStack Query + MMKV sync persister
 * 5. Stack navigator — typed routes via expo-router
 */
import {
  Rubik_400Regular,
  Rubik_500Medium,
  Rubik_600SemiBold,
  Rubik_700Bold,
} from "@expo-google-fonts/rubik";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { FoldableSimulatorBar } from "@core/foldable/FoldableSimulatorBar";
import {
  createQueryPersister,
  getQueryClient,
  PERSIST_MAX_AGE_MS,
} from "@core/offline/query-client";
import { AppProviders } from "@di/AppProviders";
import { getContainer } from "@di/container";
import { useTranslation } from "@stores/languageStore";
import { useTheme, useThemeStore } from "@stores/themeStore";

const persister = createQueryPersister({
  buster: "v0.1.0-schema-1",
});

// Keep the splash screen up until the Rubik faces (EN + AR) are registered.
void SplashScreen.preventAutoHideAsync().catch(() => {});

function toggleSimulatedOffline(offline: boolean): void {
  try {
    getContainer().connectivity.setSimulatedOffline(offline);
  } catch {}
}

function InnerLayout() {
  const isReviewMode = process.env.EXPO_PUBLIC_REVIEW_MODE === "1";
  const theme = useTheme();
  const mode = useThemeStore((s) => s.mode);
  const { isRtl } = useTranslation();

  return (
    <View
      style={[
        layoutStyles.content,
        {
          backgroundColor: theme.colors.background,
          direction: isRtl ? "rtl" : "ltr",
        },
      ]}
      testID="app-content"
    >
      <StatusBar style={mode === "dark" ? "light" : "dark"} />
      {isReviewMode ? <FoldableSimulatorBar onToggleOffline={toggleSimulatedOffline} /> : null}
      <PersistQueryClientProvider
        client={getQueryClient()}
        persistOptions={{ persister, maxAge: PERSIST_MAX_AGE_MS, buster: "v0.1.0-schema-1" }}
      >
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.colors.background },
          }}
        >
          <Stack.Screen name="index" options={{ title: "VaultFold", headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ title: "VaultFold" }} />
          <Stack.Screen name="market/[coinId]" options={{ title: "Coin Detail" }} />
        </Stack>
      </PersistQueryClientProvider>
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Rubik_400Regular,
    Rubik_500Medium,
    Rubik_600SemiBold,
    Rubik_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      void SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={layoutStyles.root} testID="root-layout">
      <AppProviders>
        <InnerLayout />
      </AppProviders>
    </GestureHandlerRootView>
  );
}

const layoutStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0B0F1A",
  },
  content: {
    flex: 1,
  },
});
