/**
 * Settings route (/settings).
 */
import { TabScene } from "@presentation/components/ui/TabScene";
import { SettingsScreen } from "@presentation/screens/settings/SettingsScreen";

export default function SettingsRoute() {
  return (
    <TabScene testID="settings-route">
      <SettingsScreen />
    </TabScene>
  );
}
