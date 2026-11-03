/**
 * Market route (/market).
 */
import { useLocalSearchParams, useRouter } from "expo-router";

import { useAdaptiveNavigation } from "@core/foldable/useAdaptiveNavigation";
import { TabScene } from "@presentation/components/ui/TabScene";
import { MarketScreen } from "@presentation/screens/market/MarketScreen";

export default function MarketRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ coinId?: string }>();

  useAdaptiveNavigation({ activeCoinId: params.coinId });

  return (
    <TabScene testID="market-route">
      <MarketScreen
        initialSelectedCoinId={params.coinId}
        onSelectCoin={(coinId) => {
          router.push(`/market/${coinId}`);
        }}
        onExpandedSelectCoin={(coinId) => {
          router.setParams({ coinId });
        }}
      />
    </TabScene>
  );
}
