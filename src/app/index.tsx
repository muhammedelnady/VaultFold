/**
 * Root index screen — hands control to the native tab layout.
 */

import { Redirect } from "expo-router";
import { View } from "react-native";

export default function IndexScreen() {
  return (
    <View style={{ flex: 1 }} testID="index-screen">
      <Redirect href="/market" />
    </View>
  );
}
