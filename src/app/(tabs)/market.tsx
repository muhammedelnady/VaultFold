/**
 * Market route (/market).
 */
import { useRouter } from "expo-router";

import { TabScene } from "@presentation/components/ui/TabScene";
import { MarketScreen } from "@presentation/screens/market/MarketScreen";

export default function MarketRoute() {
  const router = useRouter();

  return (
    <TabScene testID="market-route">
      <MarketScreen
        onSelectCoin={(coinId) => {
          router.push(`/market/${coinId}` as never);
        }}
      />
    </TabScene>
  );
}
