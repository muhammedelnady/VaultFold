/**
 * Alerts route (/alerts).
 */
import { TabScene } from "@presentation/components/ui/TabScene";
import { AlertsScreen } from "@presentation/screens/alerts/AlertsScreen";

export default function AlertsRoute() {
  return (
    <TabScene testID="alerts-route">
      <AlertsScreen />
    </TabScene>
  );
}
