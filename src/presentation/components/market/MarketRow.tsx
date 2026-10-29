/**
 * MarketRow component.
 * Memoized FlatList row rendering rank, icon, symbol, price, badge, market cap, and sparkline.
 */
import { Image } from "expo-image";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import type { MarketEntry } from "@domain/market/MarketEntry";
import { PressableScale } from "@presentation/components/ui/PressableScale";
import {
  formatCompactNumber,
  formatCurrency,
  formatPercentChange,
} from "@presentation/utils/formatters";
import { useTheme } from "@stores/themeStore";
import { font } from "@theme";

import { Sparkline } from "./Sparkline";

export interface MarketRowProps {
  readonly entry: MarketEntry;
  readonly vsCurrency?: string;
  readonly onSelect: (coinId: string) => void;
}

function MarketRowComponent({ entry, vsCurrency = "USD", onSelect }: MarketRowProps) {
  const theme = useTheme();
  const change = formatPercentChange(entry.priceChange24h);
  const sparklineColor = change.isPositive ? theme.colors.success : theme.colors.error;

  return (
    <PressableScale
      testID={`market-row-${entry.id}`}
      style={[styles.container, { borderBottomColor: theme.colors.border }]}
      haptic="selection"
      onPress={() => onSelect(entry.id)}
      accessibilityRole="button"
      accessibilityLabel={`${entry.name}, ${entry.symbol.toUpperCase()}, ${formatCurrency(entry.priceUsd, vsCurrency)}, ${change.formatted}`}
    >
      <View style={styles.leftSection} testID={`market-row-${entry.id}-left`}>
        <Text
          style={[styles.rank, { color: theme.colors.muted }]}
          testID={`market-row-${entry.id}-rank`}
        >
          {entry.rank > 0 ? entry.rank : "-"}
        </Text>
        <Image
          testID={`market-row-${entry.id}-icon`}
          source={entry.imageUrl ? { uri: entry.imageUrl } : undefined}
          recyclingKey={entry.imageUrl ?? entry.id}
          cachePolicy="disk"
          style={[styles.icon, { backgroundColor: theme.colors.surface }]}
          contentFit="cover"
          accessibilityLabel={`${entry.name} icon`}
        />
        <View style={styles.titleColumn} testID={`market-row-${entry.id}-title-column`}>
          <Text
            style={[styles.symbol, { color: theme.colors.text }]}
            testID={`market-row-${entry.id}-symbol`}
          >
            {entry.symbol.toUpperCase()}
          </Text>
          <Text
            style={[styles.name, { color: theme.colors.secondary }]}
            numberOfLines={1}
            testID={`market-row-${entry.id}-name`}
          >
            {entry.name}
          </Text>
        </View>
      </View>

      <View style={styles.sparklineSection} testID={`market-row-${entry.id}-sparkline-section`}>
        <Sparkline
          data={entry.sparkline7d}
          color={sparklineColor}
          width={64}
          height={24}
          testID={`market-row-${entry.id}-sparkline`}
        />
      </View>

      <View style={styles.rightSection} testID={`market-row-${entry.id}-right`}>
        <Text
          style={[styles.price, { color: theme.colors.text }]}
          testID={`market-row-${entry.id}-price`}
        >
          {formatCurrency(entry.priceUsd, vsCurrency)}
        </Text>
        <View
          style={[
            styles.badge,
            {
              backgroundColor: theme.colors.surface,
            },
          ]}
          testID={`market-row-${entry.id}-badge`}
        >
          <Text
            style={[
              styles.badgeText,
              {
                color: change.isPositive
                  ? theme.colors.success
                  : change.isNeutral
                    ? theme.colors.secondary
                    : theme.colors.error,
              },
            ]}
            testID={`market-row-${entry.id}-change`}
          >
            {change.formatted}
          </Text>
        </View>
        <Text
          style={[styles.marketCap, { color: theme.colors.muted }]}
          testID={`market-row-${entry.id}-market-cap`}
        >
          MCap {formatCompactNumber(entry.marketCapUsd, vsCurrency)}
        </Text>
      </View>
    </PressableScale>
  );
}

export function areMarketRowPropsEqual(prev: MarketRowProps, next: MarketRowProps): boolean {
  return (
    prev.entry.id === next.entry.id &&
    prev.entry.priceUsd === next.entry.priceUsd &&
    prev.entry.priceChange24h === next.entry.priceChange24h &&
    prev.entry.marketCapUsd === next.entry.marketCapUsd &&
    prev.entry.imageUrl === next.entry.imageUrl &&
    prev.vsCurrency === next.vsCurrency &&
    prev.onSelect === next.onSelect
  );
}

export const MarketRow = React.memo(MarketRowComponent, areMarketRowPropsEqual);

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    minHeight: 72,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1.2,
  },
  rank: {
    ...font("medium"),
    fontSize: 12,
    fontWeight: "500",
    width: 24,
    textAlign: "center",
    marginEnd: 8,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginEnd: 10,
  },
  titleColumn: {
    flex: 1,
  },
  symbol: {
    ...font("bold"),
    fontSize: 15,
    fontWeight: "700",
  },
  name: {
    ...font("regular"),
    fontSize: 12,
    marginTop: 2,
  },
  sparklineSection: {
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  rightSection: {
    alignItems: "flex-end",
    flex: 1.1,
  },
  price: {
    ...font("semibold"),
    fontSize: 15,
    fontWeight: "600",
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 3,
  },
  badgeText: {
    ...font("bold"),
    fontSize: 11,
    fontWeight: "700",
  },
  marketCap: {
    ...font("regular"),
    fontSize: 11,
    marginTop: 3,
  },
});
