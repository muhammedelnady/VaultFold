/**
 * Outbox Inspector Sheet component.
 * Displays pending/in-flight/failed outbox mutations with retry, discard, and manual sync controls.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";

import type { OutboxSnapshot } from "@core/offline/outbox-engine";
import { useConnectivity, useOutboxEngine } from "@di/container";
import type { OutboxEntry } from "@domain/sync/outbox-contract";
import { AnimatedEmptyState } from "@presentation/components/ui/AnimatedEmptyState";
import { useTranslation } from "@stores/languageStore";
import { useTheme } from "@stores/themeStore";

import { createOutboxInspectorStyles } from "./OutboxInspectorSheet.styles";

export interface OutboxInspectorSheetProps {
  readonly visible: boolean;
  readonly onClose: () => void;
}

export function OutboxInspectorSheet({ visible, onClose }: OutboxInspectorSheetProps) {
  const theme = useTheme();
  const { t, isRtl } = useTranslation();
  const styles = useMemo(() => createOutboxInspectorStyles(theme), [theme]);
  const outbox = useOutboxEngine();
  const connectivity = useConnectivity();

  const [isOnline, setIsOnline] = useState(() => {
    try {
      return connectivity?.isOnline?.() ?? true;
    } catch {
      return true;
    }
  });

  const [entries, setEntries] = useState<readonly OutboxEntry[]>(() => outbox.list());
  const [snapshot, setSnapshot] = useState<OutboxSnapshot>(() => outbox.snapshot());

  const onRefresh = useCallback(() => {
    setEntries(outbox.list());
    setSnapshot(outbox.snapshot());
  }, [outbox]);

  useEffect(() => {
    if (!connectivity?.subscribe) return undefined;
    const unsubscribe = connectivity.subscribe(setIsOnline);
    return () => {
      unsubscribe();
    };
  }, [connectivity]);

  useEffect(() => {
    if (!visible) return undefined;
    const timer = setTimeout(() => {
      onRefresh();
    }, 0);
    const unsubscribe = outbox.subscribe(() => {
      onRefresh();
    });
    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [visible, onRefresh, outbox]);

  const onSyncNow = async () => {
    await outbox.flush();
    onRefresh();
  };

  const onRetryAllFailed = async () => {
    await outbox.retryAllFailed();
    onRefresh();
  };

  const onClearAllFailed = () => {
    outbox.clearFailed();
    onRefresh();
  };

  const onRetryItem = async (id: string) => {
    await outbox.retry(id);
    onRefresh();
  };

  const onDiscardItem = (id: string) => {
    outbox.discard(id);
    onRefresh();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      testID="outbox-inspector-modal"
    >
      <View
        style={styles.overlay}
        testID="outbox-inspector-sheet"
        nativeID="outbox-inspector-sheet"
      >
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          testID="outbox-backdrop"
          nativeID="outbox-backdrop"
        />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.surface,
              direction: isRtl ? "rtl" : "ltr",
            },
          ]}
          testID="outbox-sheet"
        >
          <View
            testID="outbox-connectivity-banner"
            style={[
              styles.connectivityBanner,
              !isOnline && styles.connectivityBannerOffline,
              { direction: isRtl ? "rtl" : "ltr" },
            ]}
          >
            <Text
              style={[styles.connectivityBannerText, { writingDirection: isRtl ? "rtl" : "ltr" }]}
              testID="outbox-connectivity-text"
            >
              {isOnline ? t("outboxSheet.online") : t("outboxSheet.offline")}
            </Text>
          </View>

          <View
            style={[styles.header, { direction: isRtl ? "rtl" : "ltr" }]}
            testID="outbox-header"
          >
            <View>
              <Text
                style={[styles.title, { writingDirection: isRtl ? "rtl" : "ltr" }]}
                testID="outbox-title"
              >
                {t("outboxSheet.title")}
              </Text>
              <Text
                style={[styles.subtitle, { writingDirection: isRtl ? "rtl" : "ltr" }]}
                testID="outbox-subtitle"
              >
                {t("outboxSheet.subtitle")}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              style={styles.closeBtn}
              testID="btn-close-outbox"
              nativeID="btn-close-outbox"
            >
              <Text style={styles.closeText} testID="btn-close-outbox-label">
                ✕
              </Text>
            </Pressable>
          </View>

          <View
            style={[styles.badgeRow, { direction: isRtl ? "rtl" : "ltr" }]}
            testID="outbox-badge-row"
          >
            <View style={styles.badge} testID="outbox-badge-pending">
              <Text style={styles.badgeLabel} testID="outbox-badge-pending-label">
                {t("outboxSheet.pending", { count: snapshot.pending })}
              </Text>
            </View>
            <View style={[styles.badge, styles.badgeInflight]} testID="outbox-badge-inflight">
              <Text style={styles.badgeLabelInflight} testID="outbox-badge-inflight-label">
                {t("outboxSheet.inflight", { count: snapshot.inflight })}
              </Text>
            </View>
            <View style={styles.badge} testID="outbox-badge-failed">
              <Text
                style={[styles.badgeLabel, snapshot.failed > 0 && styles.badgeLabelFailed]}
                testID="outbox-badge-failed-label"
              >
                {t("outboxSheet.failed", { count: snapshot.failed })}
              </Text>
            </View>
          </View>

          <View
            style={[styles.actionRow, { direction: isRtl ? "rtl" : "ltr" }]}
            testID="outbox-action-row"
          >
            <Pressable
              testID="btn-sync-now"
              nativeID="btn-sync-now"
              style={[styles.actionBtn, { backgroundColor: theme.accent ?? theme.colors.primary }]}
              onPress={() => void onSyncNow()}
            >
              <Text style={styles.actionBtnText} testID="btn-sync-now-label">
                {t("outboxSheet.syncNow")}
              </Text>
            </Pressable>
            {snapshot.failed > 0 ? (
              <>
                <Pressable
                  testID="btn-retry-failed"
                  nativeID="outbox-retry-all-button"
                  style={styles.actionBtnSecondary}
                  onPress={() => void onRetryAllFailed()}
                >
                  <Text style={styles.actionBtnTextSecondary} testID="btn-retry-failed-label">
                    {t("outboxSheet.retryFailed")}
                  </Text>
                </Pressable>
                <Pressable
                  testID="btn-clear-failed"
                  nativeID="btn-clear-failed"
                  style={styles.actionBtnSecondary}
                  onPress={onClearAllFailed}
                >
                  <Text
                    style={[styles.actionBtnTextSecondary, styles.actionBtnTextClear]}
                    testID="btn-clear-failed-label"
                  >
                    {t("outboxSheet.clearFailed")}
                  </Text>
                </Pressable>
              </>
            ) : null}
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
            {entries.length === 0 ? (
              <AnimatedEmptyState
                iconName="check-decagram-outline"
                title={t("outboxSheet.emptyTitle")}
                description={t("outboxSheet.emptyText")}
                testID="outbox-empty"
              />
            ) : (
              entries.map((entry) => {
                const statusColor =
                  entry.status === "failed"
                    ? theme.colors.error
                    : entry.status === "inflight"
                      ? theme.colors.warning
                      : theme.colors.muted;

                return (
                  <View
                    key={entry.id}
                    style={[styles.item, { direction: isRtl ? "rtl" : "ltr" }]}
                    testID={`outbox-item-${entry.id}`}
                  >
                    <View style={styles.itemHeader} testID={`outbox-item-${entry.id}-header`}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemType} testID={`outbox-item-${entry.id}-type`}>
                          {entry.type} · {entry.entityKey}
                        </Text>
                        <Text
                          style={[styles.itemStatus, { color: statusColor }]}
                          testID={`outbox-item-${entry.id}-status`}
                        >
                          {entry.status.toUpperCase()} (attempt #{entry.attempts})
                        </Text>
                        {entry.lastError ? (
                          <Text style={styles.itemError} testID={`outbox-item-${entry.id}-error`}>
                            {entry.lastError.message}
                          </Text>
                        ) : null}
                      </View>
                    </View>

                    <View
                      style={[styles.itemActions, { direction: isRtl ? "rtl" : "ltr" }]}
                      testID={`outbox-item-${entry.id}-actions`}
                    >
                      {entry.status === "failed" ? (
                        <Pressable
                          testID={`btn-retry-entry-${entry.id}`}
                          nativeID={`btn-retry-entry-${entry.id}`}
                          onPress={() => void onRetryItem(entry.id)}
                        >
                          <Text
                            style={{ color: theme.accent ?? theme.colors.primary }}
                            testID={`btn-retry-entry-${entry.id}-label`}
                          >
                            {t("outboxSheet.retry")}
                          </Text>
                        </Pressable>
                      ) : null}
                      <Pressable
                        testID={`btn-discard-entry-${entry.id}`}
                        nativeID={`btn-discard-entry-${entry.id}`}
                        onPress={() => onDiscardItem(entry.id)}
                      >
                        <Text
                          style={{ color: theme.colors.muted }}
                          testID={`btn-discard-entry-${entry.id}-label`}
                        >
                          {t("outboxSheet.discard")}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
