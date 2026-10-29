/**
 * Portfolio / Vault Screen.
 * Offline-first crypto portfolio tracker with biometric authentication,
 * append-only ledger entries, outbox synchronization, allocation donut, and
 * foldable two-pane layout.
 */
import { RefreshControl, ScrollView, Text, View } from "react-native";

import { AdaptiveDualPane } from "@core/foldable/AdaptiveDualPane";
import { useDevicePosture } from "@core/foldable/useDevicePosture";
import { reconstructActiveLedgerEntries } from "@domain/portfolio/PortfolioCalculation";
import { BiometricLockView } from "@presentation/components/portfolio/BiometricLockView";
import { HoldingCard } from "@presentation/components/portfolio/HoldingCard";
import { HoldingsDonut } from "@presentation/components/portfolio/HoldingsDonut";
import { OutboxInspectorSheet } from "@presentation/components/portfolio/OutboxInspectorSheet";
import { TransactionHistoryRow } from "@presentation/components/portfolio/TransactionHistoryRow";
import { TransactionModal } from "@presentation/components/portfolio/TransactionModal";
import { AnimatedEmptyState } from "@presentation/components/ui/AnimatedEmptyState";
import { PressableScale } from "@presentation/components/ui/PressableScale";
import { PortfolioSkeleton } from "@presentation/components/ui/Skeleton";
import { formatCurrency, formatPercentChange } from "@presentation/utils/formatters";
import { useTranslation } from "@stores/languageStore";
import { useTheme } from "@stores/themeStore";

import { usePortfolioViewModel } from "./portfolio.viewmodel";
import { styles } from "./PortfolioScreen.styles";

export interface PortfolioScreenProps {
  readonly onSelectCoin?: (coinId: string) => void;
}

export function PortfolioScreen({ onSelectCoin }: PortfolioScreenProps) {
  const theme = useTheme();
  const { t, isRtl } = useTranslation();
  const vm = usePortfolioViewModel();
  const posture = useDevicePosture();
  const isDualPane = posture.isDualPane;

  if (vm.isLocked && !vm.isDemoMode) {
    return <BiometricLockView />;
  }

  if (vm.isLoading && vm.entries.length === 0) {
    return <PortfolioSkeleton />;
  }

  const plPercentFormatted = formatPercentChange(vm.summary.totalPlPercent);
  const activeTransactions = reconstructActiveLedgerEntries(vm.entries);

  const demoBanner = vm.isDemoMode ? (
    <View
      style={[
        styles.demoBanner,
        {
          backgroundColor: theme.colors.border,
          direction: isRtl ? "rtl" : "ltr",
        },
      ]}
      testID="demo-mode-banner"
    >
      <Text
        style={[
          styles.demoBannerText,
          {
            color: theme.colors.text,
            writingDirection: isRtl ? "rtl" : "ltr",
          },
        ]}
      >
        {t("portfolioScreen.demoBanner")}
      </Text>
    </View>
  ) : null;

  const header = (
    <View style={[styles.header, { direction: isRtl ? "rtl" : "ltr" }]} testID="portfolio-header">
      <Text
        testID="portfolio-title"
        style={[
          styles.headerTitle,
          {
            color: theme.colors.text,
            writingDirection: isRtl ? "rtl" : "ltr",
          },
        ]}
      >
        {t("portfolioScreen.title")}
      </Text>
      <View
        style={[styles.headerActions, { direction: isRtl ? "rtl" : "ltr" }]}
        testID="portfolio-header-actions"
      >
        <View
          testID="portfolio.outbox-inspector-button"
          nativeID="portfolio.outbox-inspector-button"
        >
          <PressableScale
            testID="btn-open-outbox"
            haptic="selection"
            style={[styles.outboxBtn, { borderColor: theme.colors.border }]}
            onPress={() => vm.setIsOutboxOpen(true)}
          >
            <Text
              style={[styles.outboxBtnText, { color: theme.colors.text }]}
              testID="btn-open-outbox-label"
            >
              {t("portfolioScreen.outboxBtn", { count: vm.entries.length })}
            </Text>
          </PressableScale>
        </View>
        <View testID="portfolio.add-tx-button" nativeID="portfolio.add-tx-button">
          <PressableScale
            testID="btn-add-transaction"
            haptic="light"
            style={[styles.headerBtn, { backgroundColor: theme.accent ?? theme.colors.primary }]}
            onPress={() => {
              vm.setSelectedCoinForTx(undefined);
              vm.setIsAddTxOpen(true);
            }}
          >
            <Text
              style={[styles.headerBtnText, { color: theme.colors.onPrimary }]}
              testID="btn-add-transaction-label"
            >
              {t("portfolioScreen.addTransactionBtn")}
            </Text>
          </PressableScale>
        </View>
      </View>
    </View>
  );

  const summaryHero = (
    <View
      testID="portfolio-summary-hero"
      style={[
        styles.summaryHero,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          direction: isRtl ? "rtl" : "ltr",
        },
      ]}
    >
      <Text
        testID="portfolio-total-balance-label"
        style={[
          styles.heroLabel,
          {
            color: theme.colors.muted,
            writingDirection: isRtl ? "rtl" : "ltr",
          },
        ]}
      >
        {t("portfolioScreen.totalBalance")}
      </Text>
      <Text
        testID="portfolio-total-balance-value"
        style={[
          styles.heroValue,
          {
            color: theme.colors.text,
            writingDirection: isRtl ? "rtl" : "ltr",
          },
        ]}
      >
        {formatCurrency(vm.summary.totalValueUsd)}
      </Text>
      <View
        style={[
          styles.heroMetricsRow,
          {
            borderTopColor: theme.colors.border,
            direction: isRtl ? "rtl" : "ltr",
          },
        ]}
        testID="portfolio-hero-metrics"
      >
        <View style={styles.heroMetricItem} testID="portfolio-pl-metric">
          <Text
            style={[
              styles.heroMetricLabel,
              {
                color: theme.colors.muted,
                writingDirection: isRtl ? "rtl" : "ltr",
              },
            ]}
          >
            {t("portfolioScreen.totalProfitLoss")}
          </Text>
          <Text
            style={[
              styles.heroMetricValue,
              { color: plPercentFormatted.isPositive ? theme.colors.success : theme.colors.error },
            ]}
          >
            {plPercentFormatted.formatted} ({formatCurrency(vm.summary.totalPlUsd)})
          </Text>
        </View>
        <View style={styles.heroMetricItem} testID="portfolio-realized-pl-metric">
          <Text
            style={[
              styles.heroMetricLabel,
              {
                color: theme.colors.muted,
                writingDirection: isRtl ? "rtl" : "ltr",
              },
            ]}
            testID="portfolio-realized-pl-label"
          >
            {t("common.active")}
          </Text>
          <Text
            style={[styles.heroMetricValue, { color: theme.colors.text }]}
            testID="portfolio-realized-pl-value"
          >
            {formatCurrency(vm.summary.totalRealizedPlUsd)}
          </Text>
        </View>
      </View>
    </View>
  );

  const holdingsList = (
    <>
      <Text
        style={[
          styles.sectionTitle,
          {
            color: theme.colors.text,
            writingDirection: isRtl ? "rtl" : "ltr",
          },
        ]}
        testID="portfolio-holdings-title"
      >
        {t("portfolioScreen.holdingsTitle")}
      </Text>
      {vm.summary.holdings.length === 0 ? (
        <AnimatedEmptyState
          iconName="wallet-outline"
          title={t("portfolioScreen.emptyHoldingsTitle")}
          description={t("portfolioScreen.emptyHoldingsSub")}
          actionLabel={t("portfolioScreen.addTransactionBtn")}
          actionTestID="btn-empty-add-tx"
          onAction={() => vm.setIsAddTxOpen(true)}
          testID="portfolio-empty-holdings"
        />
      ) : (
        vm.summary.holdings.map((holding) => (
          <HoldingCard key={holding.coinId} holding={holding} onSelect={onSelectCoin} />
        ))
      )}
    </>
  );

  const transactionHistory = (
    <View style={[styles.txSection, { direction: isRtl ? "rtl" : "ltr" }]}>
      <Text
        style={[
          styles.sectionTitle,
          {
            color: theme.colors.text,
            writingDirection: isRtl ? "rtl" : "ltr",
          },
        ]}
        testID="portfolio-transactions-title"
      >
        {t("portfolioScreen.transactionsTitle")}
      </Text>
      {activeTransactions.length === 0 ? (
        <View
          style={[styles.emptyTx, { borderColor: theme.colors.border }]}
          testID="portfolio-empty-transactions"
        >
          <Text
            style={[
              styles.emptyTxText,
              {
                color: theme.colors.muted,
                writingDirection: isRtl ? "rtl" : "ltr",
              },
            ]}
            testID="portfolio-empty-transactions-text"
          >
            {t("portfolioScreen.emptyHoldingsSub")}
          </Text>
        </View>
      ) : (
        activeTransactions.map((tx) => (
          <TransactionHistoryRow
            key={tx.id}
            transaction={tx}
            currency={vm.currency}
            onDelete={vm.onDeleteTransaction}
          />
        ))
      )}
    </View>
  );

  const refreshControl = (
    <RefreshControl
      refreshing={vm.isLoading}
      onRefresh={() => void vm.onRefresh()}
      tintColor={theme.accent ?? theme.colors.primary}
    />
  );

  const donut = (
    <HoldingsDonut
      holdings={vm.summary.holdings.map((h) => ({ coinId: h.coinId, valueUsd: h.currentValueUsd }))}
      onSelect={onSelectCoin}
    />
  );

  const leftPane = (
    <ScrollView testID="portfolio-left-pane" contentContainerStyle={styles.scrollContent}>
      {summaryHero}
      {donut}
    </ScrollView>
  );

  const rightPane = (
    <ScrollView
      testID="portfolio-scroll-view"
      nativeID="portfolio-right-pane"
      contentContainerStyle={styles.scrollContent}
      refreshControl={refreshControl}
    >
      {holdingsList}
      {transactionHistory}
    </ScrollView>
  );

  const singlePane = (
    <ScrollView
      testID="portfolio-scroll-view"
      nativeID="portfolio-single-pane"
      contentContainerStyle={styles.scrollContent}
      refreshControl={refreshControl}
    >
      {summaryHero}
      {donut}
      {holdingsList}
      {transactionHistory}
    </ScrollView>
  );

  return (
    <View style={styles.screenWrapper} testID="portfolio.screen">
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.colors.background,
            direction: isRtl ? "rtl" : "ltr",
          },
        ]}
        testID="portfolio-screen"
      >
        {demoBanner}
        {header}
        {isDualPane ? (
          <AdaptiveDualPane marketPane={leftPane} detailPane={rightPane} />
        ) : (
          singlePane
        )}
        <TransactionModal
          visible={vm.isAddTxOpen}
          defaultCoinId={vm.selectedCoinForTx}
          onClose={() => vm.setIsAddTxOpen(false)}
          onSave={vm.onAddTransaction}
        />
        <OutboxInspectorSheet visible={vm.isOutboxOpen} onClose={() => vm.setIsOutboxOpen(false)} />
      </View>
    </View>
  );
}
