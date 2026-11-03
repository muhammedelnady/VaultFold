/**
 * CoinStats component.
 * Formatted statistics grid for a coin with Decimal formatting and accessibility.
 */
import { StyleSheet, Text, View } from "react-native";

import type { CoinDetail } from "@domain/coin/CoinDetail";
import {
  formatCompactNumber,
  formatCurrency,
  formatPercentChange,
} from "@presentation/utils/formatters";
import { useTranslation } from "@stores/languageStore";
import { useTheme } from "@stores/themeStore";
import { font } from "@theme";

export interface CoinStatsProps {
  readonly coin: CoinDetail;
  readonly vsCurrency?: string;
}

interface StatRowProps {
  readonly label: string;
  readonly value: string;
  readonly secondaryValue?: string;
  readonly isPercent?: boolean;
  readonly testID: string;
}

function StatRow({ label, value, secondaryValue, isPercent, testID }: StatRowProps) {
  const theme = useTheme();
  const { isRtl } = useTranslation();

  const textColor = isPercent
    ? value.includes("+")
      ? theme.colors.success
      : value.includes("-")
        ? theme.colors.error
        : theme.colors.text
    : theme.colors.text;

  return (
    <View style={styles.statItem} testID={testID} nativeID={testID}>
      <Text
        testID={`${testID}-label`}
        style={[
          styles.statLabel,
          {
            color: theme.colors.muted,
            writingDirection: isRtl ? "rtl" : "ltr",
          },
        ]}
      >
        {label}
      </Text>
      <View
        style={[styles.valueRow, { direction: isRtl ? "rtl" : "ltr" }]}
        testID={`${testID}-values`}
      >
        <Text style={[styles.statValue, { color: textColor }]} testID={`${testID}-value`}>
          {value}
        </Text>
        {secondaryValue ? (
          <Text
            style={[styles.secondaryValue, { color: theme.colors.muted }]}
            testID={`${testID}-secondary-value`}
          >
            {secondaryValue}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export function CoinStats({ coin, vsCurrency = "USD" }: CoinStatsProps) {
  const theme = useTheme();
  const { t, isRtl } = useTranslation();

  const change7d = formatPercentChange(coin.priceChange7d);
  const change30d = formatPercentChange(coin.priceChange30d);
  const change1y = formatPercentChange(coin.priceChange1y);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          direction: isRtl ? "rtl" : "ltr",
        },
      ]}
      testID="coin-stats"
    >
      <Text
        testID="coin-stats-title"
        style={[
          styles.sectionTitle,
          {
            color: theme.colors.text,
            writingDirection: isRtl ? "rtl" : "ltr",
          },
        ]}
      >
        {t("coinStats.title")}
      </Text>

      <View style={[styles.grid, { direction: isRtl ? "rtl" : "ltr" }]} testID="coin-stats-grid">
        <StatRow
          label={t("coinStats.marketCap")}
          value={formatCompactNumber(coin.marketCapUsd, vsCurrency)}
          testID="coin-stat-market-cap"
        />
        <StatRow
          label={t("coinStats.volume24h")}
          value={formatCompactNumber(coin.totalVolume24h, vsCurrency)}
          testID="coin-stat-volume-24h"
        />
        <StatRow
          label={t("coinStats.fdv")}
          value={formatCompactNumber(coin.fullyDilutedUsd, vsCurrency)}
          testID="coin-stat-fdv"
        />
        <StatRow
          label={t("coinStats.highLow24h")}
          value={formatCurrency(coin.high24h, vsCurrency)}
          secondaryValue={`/ ${formatCurrency(coin.low24h, vsCurrency)}`}
          testID="coin-stat-high-low-24h"
        />
        <StatRow
          label={t("coinStats.circulatingSupply")}
          value={formatCompactNumber(coin.circulatingSupply, "")}
          testID="coin-stat-circulating-supply"
        />
        <StatRow
          label={t("coinStats.totalSupply")}
          value={
            coin.totalSupply ? formatCompactNumber(coin.totalSupply, "") : t("coinStats.unlimited")
          }
          testID="coin-stat-total-supply"
        />
        <StatRow
          label={t("coinStats.change7d")}
          value={change7d.formatted}
          isPercent={true}
          testID="coin-stat-change-7d"
        />
        <StatRow
          label={t("coinStats.change30d")}
          value={change30d.formatted}
          isPercent={true}
          testID="coin-stat-change-30d"
        />
        <StatRow
          label={t("coinStats.change1y")}
          value={change1y.formatted}
          isPercent={true}
          testID="coin-stat-change-1y"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  sectionTitle: {
    ...font("bold"),
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statItem: {
    width: "48%",
    marginBottom: 12,
  },
  statLabel: {
    ...font("regular"),
    fontSize: 12,
    marginBottom: 4,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    flexWrap: "wrap",
    gap: 4,
  },
  statValue: {
    ...font("semibold"),
    fontSize: 14,
    fontWeight: "600",
  },
  secondaryValue: {
    ...font("regular"),
    fontSize: 12,
  },
});
