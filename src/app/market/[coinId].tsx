/**
 * Coin detail route (/market/[coinId]).
 */
import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";

import { CoinDetailScreen } from "@presentation/screens/coin/CoinDetailScreen";

export default function CoinDetailRoute() {
  const router = useRouter();
  const { coinId } = useLocalSearchParams<{ coinId: string }>();

  return (
    <View style={styles.container} testID="coin-detail-route">
      <CoinDetailScreen coinId={coinId ?? "bitcoin"} onBack={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
