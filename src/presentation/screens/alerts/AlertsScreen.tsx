/**
 * Alerts Screen listing user price alerts with toggle and deletion controls.
 */
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { queryKeys } from "@core/offline/query-keys";
import { useAlertRepository, useOutboxEngine } from "@di/container";
import type { PriceAlert } from "@domain/alert/PriceAlert";
import { AnimatedEmptyState } from "@presentation/components/ui/AnimatedEmptyState";
import { AlertsSkeleton } from "@presentation/components/ui/Skeleton";
import { formatCurrency } from "@presentation/utils/formatters";
import { useTranslation } from "@stores/languageStore";
import { useTheme } from "@stores/themeStore";
import { font } from "@theme";

export function AlertsScreen() {
  const theme = useTheme();
  const { t, isRtl } = useTranslation();
  const queryClient = useQueryClient();
  const alertRepo = useAlertRepository();
  const outbox = useOutboxEngine();

  const alertsQuery = useQuery({
    queryKey: queryKeys.alerts.all,
    queryFn: async () => {
      const res = await alertRepo.getAll();
      if (res.kind === "ok") return res.value;
      return [];
    },
  });

  const alerts = alertsQuery.data ?? [];

  const onToggleActive = useCallback(
    async (alert: PriceAlert) => {
      const updated: PriceAlert = {
        ...alert,
        active: !alert.active,
        updatedAt: Date.now(),
      };
      await alertRepo.upsert(updated);
      outbox.enqueue({
        type: "alert.upsert",
        entityKey: `alert:${alert.coinId}`,
        payload: {
          id: updated.id,
          coinId: updated.coinId,
          direction: updated.direction,
          targetPrice: updated.targetPrice,
          currency: "usd",
          active: updated.active,
        },
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.alerts.all });
    },
    [alertRepo, outbox, queryClient],
  );

  const onDelete = useCallback(
    async (id: string) => {
      await alertRepo.delete(id);
      outbox.enqueue({
        type: "alert.delete",
        entityKey: `alert:${id}`,
        payload: { id },
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.alerts.all });
    },
    [alertRepo, outbox, queryClient],
  );

  if (alertsQuery.isLoading) {
    return <AlertsSkeleton />;
  }

  return (
    <View style={styles.screenWrapper} testID="alerts.screen">
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.colors.background,
            direction: isRtl ? "rtl" : "ltr",
          },
        ]}
        testID="alerts-screen"
      >
        <View style={[styles.header, { direction: isRtl ? "rtl" : "ltr" }]} testID="alerts-header">
          <Text
            style={[
              styles.title,
              {
                color: theme.colors.text,
                writingDirection: isRtl ? "rtl" : "ltr",
              },
            ]}
            testID="alerts-title"
          >
            {t("alertsScreen.title")}
          </Text>
          <Text
            style={[
              styles.subtitle,
              {
                color: theme.colors.muted,
                writingDirection: isRtl ? "rtl" : "ltr",
              },
            ]}
            testID="alerts-subtitle"
          >
            {t("alertsScreen.subtitle")}
          </Text>
        </View>

        <ScrollView contentContainerStyle={styles.listContent} testID="alerts-list">
          {alerts.length === 0 ? (
            <AnimatedEmptyState
              iconName="bell-badge-outline"
              title={t("alertsScreen.emptyTitle")}
              description={t("alertsScreen.emptySub")}
              testID="alerts-empty"
            />
          ) : (
            alerts.map((alert) => (
              <View
                key={alert.id}
                testID={`alert-card-${alert.id}`}
                nativeID={`alert-card-${alert.id}`}
                style={[
                  styles.alertCard,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    direction: isRtl ? "rtl" : "ltr",
                  },
                ]}
              >
                <View style={styles.alertInfo} testID={`alert-card-${alert.id}-info`}>
                  <Text
                    style={[
                      styles.coinId,
                      {
                        color: theme.colors.text,
                        writingDirection: isRtl ? "rtl" : "ltr",
                      },
                    ]}
                    testID={`alert-card-${alert.id}-coin-id`}
                  >
                    {alert.coinId.toUpperCase()}
                  </Text>
                  <Text
                    style={[
                      styles.directionText,
                      {
                        color:
                          alert.direction === "above" ? theme.colors.success : theme.colors.error,
                        writingDirection: isRtl ? "rtl" : "ltr",
                      },
                    ]}
                    testID={`alert-card-${alert.id}-direction`}
                  >
                    {alert.direction === "above"
                      ? t("alertsScreen.risesAbove", {
                          price: formatCurrency(alert.targetPrice, "USD"),
                        })
                      : t("alertsScreen.dropsBelow", {
                          price: formatCurrency(alert.targetPrice, "USD"),
                        })}
                  </Text>
                </View>

                <View
                  style={[styles.actionsRow, { direction: isRtl ? "rtl" : "ltr" }]}
                  testID={`alert-card-${alert.id}-actions`}
                >
                  <Pressable
                    testID={`btn-toggle-alert-${alert.id}`}
                    nativeID={`btn-toggle-alert-${alert.id}`}
                    style={[
                      styles.toggleBadge,
                      {
                        backgroundColor: alert.active
                          ? (theme.accent ?? theme.colors.primary)
                          : theme.colors.border,
                      },
                    ]}
                    onPress={() => void onToggleActive(alert)}
                  >
                    <Text
                      style={[
                        styles.toggleBadgeText,
                        { color: alert.active ? theme.colors.onPrimary : theme.colors.text },
                      ]}
                      testID={`btn-toggle-alert-${alert.id}-label`}
                    >
                      {alert.active ? t("common.active") : t("common.paused")}
                    </Text>
                  </Pressable>

                  <Pressable
                    testID={`btn-delete-alert-${alert.id}`}
                    nativeID={`btn-delete-alert-${alert.id}`}
                    style={[styles.deleteBtn, { borderColor: theme.colors.border }]}
                    onPress={() => void onDelete(alert.id)}
                  >
                    <Text
                      style={[styles.deleteText, { color: theme.colors.error }]}
                      testID={`btn-delete-alert-${alert.id}-label`}
                    >
                      {t("alertsScreen.deleteAlert")}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 16,
  },
  screenWrapper: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  title: {
    ...font("bold"),
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    ...font("regular"),
    fontSize: 14,
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    flexGrow: 1,
  },
  alertCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  alertInfo: {
    flex: 1,
  },
  coinId: {
    ...font("bold"),
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  directionText: {
    ...font("medium"),
    fontSize: 14,
    fontWeight: "500",
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  toggleBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  toggleBadgeText: {
    ...font("semibold"),
    fontSize: 12,
    fontWeight: "600",
  },
  deleteBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  deleteText: {
    ...font("semibold"),
    fontSize: 12,
    fontWeight: "600",
  },
});
