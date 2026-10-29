/**
 * Holding card component.
 */
import { Text, View } from "react-native";

import type { CoinHolding } from "@domain/portfolio/PortfolioCalculation";
import { PressableScale } from "@presentation/components/ui/PressableScale";
import { formatCurrency, formatPercentChange } from "@presentation/utils/formatters";
import { useTranslation } from "@stores/languageStore";
import { useTheme } from "@stores/themeStore";

import { styles } from "./HoldingCard.styles";

export interface HoldingCardProps {
  readonly holding: CoinHolding;
  readonly onSelect?: (coinId: string) => void;
}

export function HoldingCard({ holding, onSelect }: HoldingCardProps) {
  const theme = useTheme();
  const { isRtl } = useTranslation();
  const holdingPl = formatPercentChange(holding.unrealizedPlPercent);
  const plColor = holdingPl.isPositive ? theme.colors.success : theme.colors.error;

  return (
    <PressableScale
      testID={`holding-card-${holding.coinId}`}
      nativeID={`holding-card-${holding.coinId}`}
      haptic="selection"
      style={[
        styles.holdingCard,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          direction: isRtl ? "rtl" : "ltr",
        },
      ]}
      onPress={() => onSelect?.(holding.coinId)}
    >
      <View
        style={[styles.holdingHeader, { direction: isRtl ? "rtl" : "ltr" }]}
        testID={`holding-card-${holding.coinId}-header`}
      >
        <Text
          style={[
            styles.holdingCoinId,
            { color: theme.colors.text, writingDirection: isRtl ? "rtl" : "ltr" },
          ]}
          testID={`holding-card-${holding.coinId}-coin-id`}
        >
          {holding.coinId.toUpperCase()}
        </Text>
        <Text
          style={[
            styles.holdingValue,
            { color: theme.colors.text, writingDirection: isRtl ? "rtl" : "ltr" },
          ]}
          testID={`holding-card-${holding.coinId}-value`}
        >
          {formatCurrency(holding.currentValueUsd)}
        </Text>
      </View>
      <View
        style={[styles.holdingDetailsRow, { direction: isRtl ? "rtl" : "ltr" }]}
        testID={`holding-card-${holding.coinId}-details`}
      >
        <Text
          style={[
            styles.holdingQuantity,
            { color: theme.colors.muted, writingDirection: isRtl ? "rtl" : "ltr" },
          ]}
          testID={`holding-card-${holding.coinId}-quantity`}
        >
          {holding.quantity} @ {formatCurrency(holding.currentPriceUsd)}
        </Text>
        <Text
          style={[styles.holdingPl, { color: plColor, writingDirection: isRtl ? "rtl" : "ltr" }]}
          testID={`holding-card-${holding.coinId}-pl`}
        >
          {holdingPl.formatted} ({formatCurrency(holding.unrealizedPlUsd)})
        </Text>
      </View>
    </PressableScale>
  );
}
