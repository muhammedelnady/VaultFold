/**
 * Danger Zone confirmation modal component for wiping local vault data.
 */
import { Modal, Pressable, Text, View } from "react-native";

import { styles } from "@presentation/screens/settings/SettingsScreen.styles";
import { useTranslation } from "@stores/languageStore";
import { useTheme } from "@stores/themeStore";

export interface DangerZoneModalProps {
  readonly visible: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: () => void | Promise<void>;
}

export function DangerZoneModal({ visible, onCancel, onConfirm }: DangerZoneModalProps) {
  const theme = useTheme();
  const { t, isRtl } = useTranslation();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onCancel}
      testID="wipe-confirmation-modal-root"
    >
      <View style={styles.modalOverlay} testID="wipe-confirmation-modal">
        <View
          style={[
            styles.modalCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              direction: isRtl ? "rtl" : "ltr",
            },
          ]}
          testID="wipe-confirmation-card"
        >
          <Text
            style={[
              styles.modalTitle,
              { color: theme.colors.error, writingDirection: isRtl ? "rtl" : "ltr" },
            ]}
            testID="wipe-confirmation-title"
          >
            {t("dangerZone.title")}
          </Text>
          <Text
            style={[
              styles.modalDescription,
              { color: theme.colors.text, writingDirection: isRtl ? "rtl" : "ltr" },
            ]}
            testID="wipe-confirmation-description"
          >
            {t("dangerZone.description")}
          </Text>
          <View
            style={[styles.modalActions, { direction: isRtl ? "rtl" : "ltr" }]}
            testID="wipe-confirmation-actions"
          >
            <Pressable
              testID="btn-cancel-wipe"
              nativeID="btn-cancel-wipe"
              style={[styles.modalCancelBtn, { backgroundColor: theme.colors.border }]}
              onPress={onCancel}
            >
              <Text style={{ color: theme.colors.text }} testID="btn-cancel-wipe-label">
                {t("dangerZone.cancel")}
              </Text>
            </Pressable>
            <Pressable
              testID="btn-confirm-wipe"
              nativeID="btn-confirm-wipe"
              style={[styles.modalConfirmBtn, { backgroundColor: theme.colors.error }]}
              onPress={() => void onConfirm()}
            >
              <Text
                style={{ color: theme.colors.onError, fontWeight: "600" }}
                testID="btn-confirm-wipe-label"
              >
                {t("dangerZone.confirm")}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
