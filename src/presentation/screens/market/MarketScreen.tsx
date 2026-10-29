/**
 * MarketScreen — FlatList market explorer with sparklines, diacritic search,
 * local sorting,
 * live status, category tags, skeleton cold-start, and foldable two-pane
 * master-detail preview.
 */
import { useCallback, useMemo, useState } from "react";
import { FlatList, RefreshControl, Text, TextInput, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { AdaptiveDualPane } from "@core/foldable/AdaptiveDualPane";
import { useDevicePosture } from "@core/foldable/useDevicePosture";
import type { MarketEntry, MarketSort } from "@domain/market/MarketEntry";
import { MarketRow } from "@presentation/components/market/MarketRow";
import { MarketRowSkeleton } from "@presentation/components/market/MarketRowSkeleton";
import { StatusChip } from "@presentation/components/market/StatusChip";
import { AnimatedEmptyState } from "@presentation/components/ui/AnimatedEmptyState";
import { PressableScale } from "@presentation/components/ui/PressableScale";
import { CoinDetailScreen } from "@presentation/screens/coin/CoinDetailScreen";
import { useTranslation } from "@stores/languageStore";
import { useTheme } from "@stores/themeStore";

import { useMarketViewModel } from "./market.viewmodel";
import { createMarketStyles } from "./MarketScreen.styles";

export interface MarketScreenProps {
  readonly onSelectCoin: (coinId: string) => void;
  readonly vsCurrency?: "usd" | "eur" | "sar";
  readonly isFocused?: boolean;
}

const CATEGORY_TAGS: readonly { readonly id: string | undefined; readonly label: string }[] = [
  { id: undefined, label: "All" },
  { id: "decentralized-finance-defi", label: "DeFi" },
  { id: "layer-1", label: "Layer 1" },
  { id: "stablecoins", label: "Stablecoins" },
];

export function MarketScreen({
  onSelectCoin,
  vsCurrency = "usd",
  isFocused = true,
}: MarketScreenProps) {
  const theme = useTheme();
  const { t, isRtl } = useTranslation();
  const styles = useMemo(() => createMarketStyles(theme), [theme]);
  const posture = useDevicePosture();
  const isDualPane = posture.isDualPane;

  const {
    items,
    isLoading,
    isRefreshing,
    statusInfo,
    searchQuery,
    setSearchQuery,
    sortOption,
    setSortOption,
    selectedCategory,
    setSelectedCategory,
    onRefresh,
  } = useMarketViewModel({ vsCurrency, isFocused });

  const [manualSelectedCoinId, setManualSelectedCoinId] = useState<string | null>(null);

  const selectedCoinId = isDualPane
    ? (manualSelectedCoinId ?? (items.length > 0 ? items[0]!.id : null))
    : null;

  const handleSelectCoin = useCallback(
    (coinId: string) => {
      if (isDualPane) {
        setManualSelectedCoinId(coinId);
      } else {
        onSelectCoin(coinId);
      }
    },
    [isDualPane, onSelectCoin],
  );

  const renderItem = useCallback(
    ({ item }: { readonly item: MarketEntry }) => (
      <MarketRow entry={item} vsCurrency={vsCurrency.toUpperCase()} onSelect={handleSelectCoin} />
    ),
    [handleSelectCoin, vsCurrency],
  );

  const keyExtractor = useCallback((item: MarketEntry) => item.id, []);

  const detailPane = selectedCoinId ? (
    <CoinDetailScreen coinId={selectedCoinId} vsCurrency={vsCurrency} />
  ) : (
    <View style={styles.emptyDetailPane}>
      <Text style={styles.emptyDetailText}>{t("coinDetail.notFoundSub")}</Text>
    </View>
  );

  const sortOptions = useMemo(
    () => [
      { id: "rank" as MarketSort, label: t("marketScreen.sortRank") },
      { id: "market_cap" as MarketSort, label: t("marketScreen.sortPrice") },
      { id: "price_24h_change" as MarketSort, label: t("marketScreen.sortChange") },
    ],
    [t],
  );

  const masterPane = (
    <>
      {isLoading ? (
        <View testID="market-loading-skeleton">
          {Array.from({ length: 6 }).map((_, idx) => (
            <MarketRowSkeleton key={`skeleton-${idx}`} />
          ))}
        </View>
      ) : (
        <FlatList
          testID="market-list"
          data={items}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          extraData={vsCurrency}
          contentContainerStyle={{ paddingBottom: theme.spacing.xxl }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={theme.accent ?? theme.colors.primary}
            />
          }
          ListEmptyComponent={
            <AnimatedEmptyState
              iconName="magnify-remove-outline"
              title={t("marketScreen.emptyTitle")}
              description={t("marketScreen.emptySub")}
              testID="market-empty-state"
            />
          }
        />
      )}
    </>
  );

  return (
    <View style={styles.screenWrapper} testID="market.screen">
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.colors.background,
            direction: isRtl ? "rtl" : "ltr",
          },
        ]}
        testID="market-screen"
      >
        <View style={[styles.header, { direction: isRtl ? "rtl" : "ltr" }]} testID="market-header">
          <View
            style={[styles.statusRow, { direction: isRtl ? "rtl" : "ltr" }]}
            testID="market-status-row"
          >
            <Text
              style={[
                styles.title,
                {
                  writingDirection: isRtl ? "rtl" : "ltr",
                },
              ]}
              testID="market-title"
            >
              {t("marketScreen.title")}
            </Text>
            <StatusChip
              kind={statusInfo.kind}
              lastUpdatedAt={statusInfo.lastUpdatedAt}
              retryAfterSeconds={statusInfo.retryAfterSeconds}
            />
          </View>

          <View
            style={[styles.searchContainer, { direction: isRtl ? "rtl" : "ltr" }]}
            testID="market-search-container"
          >
            <TextInput
              testID="market-search-input"
              nativeID="market.search-input"
              style={[
                styles.searchInput,
                {
                  textAlign: isRtl ? "right" : "left",
                  writingDirection: isRtl ? "rtl" : "ltr",
                },
              ]}
              placeholder={t("marketScreen.searchPlaceholder")}
              placeholderTextColor={theme.colors.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
          </View>

          <View
            style={[styles.categoryRow, { direction: isRtl ? "rtl" : "ltr" }]}
            testID="market-category-row"
          >
            {CATEGORY_TAGS.map((tag) => {
              const isActive = selectedCategory === tag.id;
              return (
                <PressableScale
                  key={tag.label}
                  testID={`category-chip-${tag.label.toLowerCase().replace(/\s+/g, "-")}`}
                  haptic="selection"
                  style={[styles.categoryChip, isActive && styles.categoryChipActive]}
                  onPress={() => setSelectedCategory(tag.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                >
                  <Text
                    style={[styles.categoryChipText, isActive && styles.categoryChipTextActive]}
                    testID={`category-chip-${tag.label.toLowerCase().replace(/\s+/g, "-")}-label`}
                  >
                    {tag.label}
                  </Text>
                </PressableScale>
              );
            })}
          </View>

          <View
            style={[styles.sortRow, { direction: isRtl ? "rtl" : "ltr" }]}
            testID="market-sort-row"
          >
            {sortOptions.map((opt) => {
              const isActive = sortOption === opt.id;
              return (
                <PressableScale
                  key={opt.id}
                  testID={`sort-chip-${opt.id}`}
                  nativeID={opt.id === "rank" ? "market.sort-toggle" : undefined}
                  haptic="selection"
                  style={[styles.sortChip, isActive && styles.sortChipActive]}
                  onPress={() => setSortOption(opt.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                >
                  <Text
                    style={[styles.sortChipText, isActive && styles.sortChipTextActive]}
                    testID={`sort-chip-${opt.id}-label`}
                  >
                    {opt.label}
                  </Text>
                  {isActive ? (
                    <Animated.View
                      entering={FadeIn.duration(120)}
                      exiting={FadeOut.duration(80)}
                      style={styles.sortIndicator}
                      testID={`sort-chip-${opt.id}-indicator`}
                    />
                  ) : null}
                </PressableScale>
              );
            })}
          </View>
        </View>

        {isDualPane ? (
          <AdaptiveDualPane marketPane={masterPane} detailPane={detailPane} />
        ) : (
          masterPane
        )}
      </View>
    </View>
  );
}
