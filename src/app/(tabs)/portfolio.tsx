/**
 * Portfolio / Vault route (/portfolio).
 */
import { useRouter } from "expo-router";

import { TabScene } from "@presentation/components/ui/TabScene";
import { PortfolioScreen } from "@presentation/screens/portfolio/PortfolioScreen";

export default function PortfolioRoute() {
  const router = useRouter();

  return (
    <TabScene testID="portfolio-route">
      <PortfolioScreen
        onSelectCoin={(coinId) => {
          router.push(`/market/${coinId}` as never);
        }}
      />
    </TabScene>
  );
}
