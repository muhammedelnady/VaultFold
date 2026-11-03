/**
 * CoinDetailScreen component.
 * Interactive hardware-accelerated Skia chart, period selector with offline
 * indicators, stats grid, and foldable tabletop layout.
 */
import { useMemo } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useDevicePosture } from "@core/foldable/useDevicePosture";
import { CoinStats } from "@presentation/components/coin/CoinStats";
import { InteractiveChart } from "@presentation/components/coin/InteractiveChart";
import { PriceAlertSheet } from "@presentation/components/coin/PriceAlertSheet";
import { RangeSelector } from "@presentation/components/coin/RangeSelector";
import { AnimatedEmptyState } from "@presentation/components/ui/AnimatedEmptyState";
import { PressableScale } from "@presentation/components/ui/PressableScale";
import { CoinDetailSkeleton } from "@presentation/components/ui/Skeleton";
import { formatCurrency, formatPercentChange } from "@presentation/utils/formatters";
import { getHorizontalSafeInsets } from "@presentation/utils/insets";
import { useTranslation } from "@stores/languageStore";
import { useTheme } from "@stores/themeStore";

import { useCoinDetailViewModel } from "./coin-detail.viewmodel";
import { createCoinDetailStyles } from "./CoinDetailScreen.styles";

export interface CoinDetailScreenProps {
  readonly coinId: string;
  readonly vsCurrency?: string;
  readonly onBack?: () => void;
  readonly isFocused?: boolean;
}

export function CoinDetailScreen({ coinId, vsCurrency = "usd", onBack }: CoinDetailScreenProps) {
  const theme = useTheme();
  const { t, isRtl } = useTranslation();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createCoinDetailStyles(theme), [theme]);
  const posture = useDevicePosture();
  const isTabletop = posture.posture === "TABLETOP_MODE";

  const {
    coin,
    isLoading,
    isOnline,
    selectedRange,
    setSelectedRange,
    chartPoints,
    availableOfflineRanges,
    isChartUnavailableOffline,
    isAlertSheetOpen,
    setAlertSheetOpen,
    onSaveAlert,
    isWatchlisted,
    onToggleWatchlist,
  } = useCoinDetailViewModel({ coinId, vsCurrency });

  if (isLoading && !coin) {
    return <CoinDetailSkeleton />;
  }

  if (!isLoading && !coin) {
    return (
      <View style={styles.screenWrapper} testID="coin-detail.screen">
        <View
          style={[
            styles.container,
            {
              backgroundColor: theme.colors.background,
              direction: isRtl ? "rtl" : "ltr",
            },
          ]}
          testID="coin-detail-screen"
        >
          <AnimatedEmptyState
            iconName="alert-circle-outline"
            title={t("coinDetail.notFoundTitle")}
            description={t("coinDetail.notFoundSub")}
            actionLabel={onBack ? t("common.back") : undefined}
            onAction={onBack}
            testID="coin-detail-not-found"
          />
        </View>
      </View>
    );
  }

  const change24h = formatPercentChange(coin?.priceChange24h ?? "0");
  const horizontalSafeInsets = getHorizontalSafeInsets(insets, isRtl, 16);
  const detailHorizontalInsets = posture.isDualPane
    ? {
        paddingStart: 16,
        paddingEnd: horizontalSafeInsets.paddingEnd,
      }
    : horizontalSafeInsets;

  const watchlistLabel = isWatchlisted
    ? t("coinDetail.watchlistRemove")
    : t("coinDetail.watchlistAdd");
  const watchlistHaptic = isWatchlisted ? "light" : "success";
  const watchlistGlyph = isWatchlisted ? "★" : "☆";

  const header = (
    <View
      style={[
        styles.header,
        {
          paddingTop: Math.max(insets.top, 14),
          direction: isRtl ? "rtl" : "ltr",
          ...detailHorizontalInsets,
        },
      ]}
      testID="coin-detail-header"
    >
      <View
        style={[styles.headerLeft, { direction: isRtl ? "rtl" : "ltr" }]}
        testID="coin-detail-header-left"
      >
        {onBack ? (
          <PressableScale
            testID="btn-back"
            nativeID="coin-detail-back-button"
            haptic="light"
            accessibilityRole="button"
            accessibilityLabel={t("common.back")}
            style={styles.backButton}
            onPress={onBack}
          >
            <Text style={styles.backButtonText} testID="btn-back-label">
              {isRtl ? "→" : "←"}
            </Text>
          </PressableScale>
        ) : null}
        <View style={styles.coinNameGroup} testID="coin-detail-name-group">
          <Text
            style={[styles.coinName, { writingDirection: isRtl ? "rtl" : "ltr" }]}
            numberOfLines={1}
            testID="coin-detail-name"
          >
            {coin?.name ?? coinId}
          </Text>
          <Text style={styles.coinSymbol} testID="coin-detail-symbol">
            {coin?.symbol.toUpperCase() ?? ""}
          </Text>
        </View>
      </View>

      <View
        style={[styles.headerActions, { direction: isRtl ? "rtl" : "ltr" }]}
        testID="coin-detail-header-actions"
      >
        <PressableScale
          testID="btn-watchlist-toggle"
          nativeID="coin-detail-watchlist-toggle"
          haptic={watchlistHaptic}
          accessibilityRole="button"
          accessibilityLabel={watchlistLabel}
          style={styles.iconButton}
          onPress={() => void onToggleWatchlist()}
        >
          <Text style={styles.iconButtonText} testID="btn-watchlist-toggle-label">
            {watchlistGlyph}
          </Text>
        </PressableScale>

        <PressableScale
          testID="btn-open-alert"
          nativeID="coin-detail-open-alert-button"
          haptic="light"
          accessibilityRole="button"
          accessibilityLabel={t("coinDetail.priceAlert")}
          style={styles.iconButton}
          onPress={() => setAlertSheetOpen(true)}
        >
          <Text style={styles.iconButtonText} testID="btn-open-alert-label">
            🔔
          </Text>
        </PressableScale>
      </View>
    </View>
  );

  const priceHero = (
    <View
      style={[styles.priceHero, { direction: isRtl ? "rtl" : "ltr" }]}
      testID="coin-detail-price-hero"
    >
      <Text
        style={[styles.currentPrice, { writingDirection: isRtl ? "rtl" : "ltr" }]}
        testID="coin-detail-current-price"
      >
        {formatCurrency(coin?.priceUsd ?? "0", vsCurrency)}
      </Text>
      <View
        style={[styles.changeRow, { direction: isRtl ? "rtl" : "ltr" }]}
        testID="coin-detail-change-row"
      >
        <Text
          style={[
            styles.changeBadge,
            { color: change24h.isPositive ? theme.colors.success : theme.colors.error },
          ]}
          testID="coin-detail-change-badge"
        >
          {change24h.formatted} ({t("coinDetail.range24h")})
        </Text>
      </View>
    </View>
  );

  const chart = (
    <InteractiveChart
      points={chartPoints}
      isPositive={change24h.isPositive}
      vsCurrency={vsCurrency}
      height={220}
      isUnavailableOffline={isChartUnavailableOffline}
    />
  );

  const ranges = (
    <RangeSelector
      selectedRange={selectedRange}
      onSelectRange={setSelectedRange}
      isOffline={!isOnline}
      availableOfflineRanges={availableOfflineRanges}
    />
  );

  const stats = coin ? <CoinStats coin={coin} vsCurrency={vsCurrency} /> : null;

  const alertSheet = coin ? (
    <PriceAlertSheet
      coinId={coin.id}
      coinSymbol={coin.symbol}
      currentPriceUsd={coin.priceUsd}
      visible={isAlertSheetOpen}
      onClose={() => setAlertSheetOpen(false)}
      onSaveAlert={onSaveAlert}
    />
  ) : null;

  const scrollContentStyle = [
    styles.scrollContent,
    {
      paddingBottom: Math.max(insets.bottom, 16) + 40,
      ...detailHorizontalInsets,
    },
  ];

  if (isTabletop) {
    return (
      <View style={styles.screenWrapper} testID="coin-detail.screen">
        <View
          style={[
            styles.container,
            {
              backgroundColor: theme.colors.background,
              direction: isRtl ? "rtl" : "ltr",
            },
          ]}
          testID="coin-detail-screen"
        >
          {header}
          <View style={styles.tabletopTop} testID="tabletop-top" nativeID="tabletop-top">
            {priceHero}
            {chart}
          </View>
          <ScrollView
            style={styles.tabletopBottom}
            contentContainerStyle={scrollContentStyle}
            testID="tabletop-bottom"
            nativeID="tabletop-bottom"
          >
            <View style={styles.quickActions} testID="tabletop-quick-actions">
              <PressableScale
                testID="tabletop-action-alert"
                haptic="light"
                accessibilityRole="button"
                accessibilityLabel={t("coinDetail.priceAlert")}
                style={styles.quickActionButton}
                onPress={() => setAlertSheetOpen(true)}
              >
                <Text style={styles.quickActionText}>🔔 {t("coinDetail.priceAlert")}</Text>
              </PressableScale>
              <PressableScale
                testID="tabletop-action-watchlist"
                haptic={watchlistHaptic}
                accessibilityRole="button"
                accessibilityLabel={watchlistLabel}
                style={styles.quickActionButton}
                onPress={() => void onToggleWatchlist()}
              >
                <Text style={styles.quickActionText}>
                  {watchlistGlyph} {watchlistLabel}
                </Text>
              </PressableScale>
            </View>
            {ranges}
            {stats}
          </ScrollView>
          {alertSheet}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screenWrapper} testID="coin-detail.screen">
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.colors.background,
            direction: isRtl ? "rtl" : "ltr",
          },
        ]}
        testID="coin-detail-screen"
      >
        {header}
        <ScrollView contentContainerStyle={scrollContentStyle} testID="coin-detail-scroll-view">
          {priceHero}
          {chart}
          {ranges}
          {stats}
        </ScrollView>
        {alertSheet}
      </View>
    </View>
  );
}
