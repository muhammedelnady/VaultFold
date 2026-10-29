/**
 * App bootstrap — wires the DI container.
 *
 * Called once from `src/app/_layout.tsx` before any React component reads the container.
 * Async order:
 * 1. Vault key (infra/security/vault-key) — provisioned before encrypted area opens
 * 2. MMKV areas (infra/storage/mmkvInstances)
 * 3. Connectivity (core/offline/connectivity) + NetInfo listener
 * 4. HttpClient (core/network) with token bucket + connectivity
 * 5. QueryClient (core/offline/query-client) with MMKV persister
 * 6. Repositories (data layer) + Remotes
 * 7. Theme/Language/Currency/VaultAuth stores hydrated from storage areas
 *   8. Foldable simulator presets store
 *
 * E2E mode (EXPO_PUBLIC_E2E=1): swaps to deterministic biometric stub + fixture HTTP adapter.
 */
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import { onlineManager } from "@tanstack/react-query";
import * as ScreenCapture from "expo-screen-capture";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, AppState, Pressable, StyleSheet, Text, View } from "react-native";

import { HttpClient, defaultTokenBucket } from "@core/network/http-client";
import { Connectivity } from "@core/offline/connectivity";
import { createOutboxEngine } from "@core/offline/outbox-engine";
import { getQueryClient, createQueryPersister } from "@core/offline/query-client";
import { AlertRepositoryImpl } from "@data/alert/AlertRepositoryImpl";
import { CoinGeckoApi } from "@data/api/coingecko-client";
import { CoinRepositoryImpl } from "@data/coin/CoinRepositoryImpl";
import { LedgerRepositoryImpl } from "@data/ledger/LedgerRepositoryImpl";
import { MarketRepositoryImpl } from "@data/market/MarketRepositoryImpl";
import {
  createSimulatedLedgerRemote as createRemote,
  wipeSimulatedLedger,
} from "@data/remote/simulated-ledger-remote";
import {
  hasInitializedContainer,
  initContainer,
  overrideForTests,
  type Container,
} from "@di/container";
import { ExpoBiometricsService } from "@infrastructure/security/ExpoBiometricsService";
import { StubBiometricsService } from "@infrastructure/security/StubBiometricsService";
import {
  ensureVaultKey,
  eraseVaultKey,
  type VaultKeyState,
} from "@infrastructure/security/vault-key";
import {
  deleteVaultStorage,
  getStorageArea,
  vaultDataExists,
} from "@infrastructure/storage/mmkvInstances";
import { E2EFixtures } from "@mocks/fixtures";
import { bindCurrencyPersistence } from "@stores/currencyStore";
import { bindLanguagePersistence } from "@stores/languageStore";
import { bindThemePersistence } from "@stores/themeStore";
import { bindVaultAuthPersistence, useVaultAuthStore } from "@stores/vaultAuthStore";
import { font } from "@theme";

const APP_VERSION = "0.1.0";
const SCHEMA_VERSION = "1";
const BUSTER = `${APP_VERSION}-schema-${SCHEMA_VERSION}`;

type VaultBlock = Exclude<VaultKeyState, { readonly status: "ready" }>;

interface BootstrapState {
  readonly ready: boolean;
  readonly error?: Error;
  readonly vaultBlock?: VaultBlock;
}

const RECOVERY_COPY: Record<VaultBlock["status"], { title: string; body: string }> = {
  unavailable: {
    title: "Vault is temporarily unavailable",
    body: "The secure key store could not be accessed (for example, the device is locked). Your data has not been changed. Unlock the device and try again.",
  },
  recovery: {
    title: "Vault cannot be opened",
    body: "The encryption key for your local vault is missing or no longer valid, for example after a device restore or an app update that changed the key format. VaultFold never uploads or backs up your data, so it cannot be recovered. Resetting creates a new empty vault.",
  },
};

export function AppProviders({ children }: { readonly children: React.ReactNode }) {
  const [state, setState] = useState<BootstrapState>({ ready: false });
  const [attempt, setAttempt] = useState(0);

  const resetVault = useCallback(async () => {
    try {
      deleteVaultStorage();
      await eraseVaultKey();
      setState({ ready: false });
      setAttempt((n) => n + 1);
    } catch (error) {
      setState({ ready: false, error: error as Error });
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    let netInfoUnsub: (() => void) | null = null;
    let onlineHookUnsub: (() => void) | null = null;
    let connUnsub: (() => void) | null = null;
    let appStateSub: { remove: () => void } | null = null;
    let unbindVaultAuth: (() => void) | null = null;

    async function bootstrap() {
      try {
        const keyState = await ensureVaultKey({ vaultDataExists: vaultDataExists() });
        if (cancelled) return;
        if (keyState.status !== "ready") {
          setState({ ready: false, vaultBlock: keyState });
          return;
        }

        const cacheArea = getStorageArea("cache");
        const vaultArea = getStorageArea("vault");
        const remoteSimArea = getStorageArea("remote-sim");

        const realProbe = { read: () => true };
        const connectivity = new Connectivity(realProbe);

        try {
          netInfoUnsub = NetInfo.addEventListener((net: NetInfoState) => {
            const isOnline = Boolean(net.isConnected);
            connectivity.setRealOnline(isOnline);
          });
        } catch {}

        const httpClient = new HttpClient({
          connectivity,
          bucket: defaultTokenBucket(),
          defaultHeaders: {
            accept: "application/json",
            "user-agent": `VaultFold/${APP_VERSION} (https://github.com/vaultfold/vaultfold; open-source market tracker)`,
          },
        });

        const coingeckoClient = new CoinGeckoApi(httpClient);

        const queryClient = getQueryClient();
        createQueryPersister({ buster: BUSTER });

        const marketRepo = new MarketRepositoryImpl(coingeckoClient);
        const coinRepo = new CoinRepositoryImpl(coingeckoClient);
        const alertRepo = new AlertRepositoryImpl(vaultArea);
        const ledgerRepo = new LedgerRepositoryImpl(vaultArea);
        const ledgerRemote = createRemote(remoteSimArea);
        const biometricsService = new ExpoBiometricsService();
        const outboxEngine = createOutboxEngine({
          area: vaultArea,
          remote: ledgerRemote,
          isOnline: () => connectivity.isOnline(),
          nextId: () => `outbox_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        });

        void outboxEngine.recoverOrphans();

        onlineHookUnsub = connectivity.addOnlineManagerHook((online) => {
          onlineManager.setOnline(online);
        });

        connUnsub = connectivity.subscribe((online) => {
          if (online) {
            void outboxEngine.flush();
          }
        });

        if (cancelled) {
          netInfoUnsub?.();
          onlineHookUnsub?.();
          connUnsub?.();
          return;
        }

        if (process.env.EXPO_PUBLIC_E2E === "1") {
          wipeSimulatedLedger(remoteSimArea);
        }

        bindThemePersistence(cacheArea);
        bindLanguagePersistence(cacheArea);
        bindCurrencyPersistence(cacheArea);
        unbindVaultAuth = bindVaultAuthPersistence(vaultArea);

        const container: Container = {
          marketRepository: marketRepo,
          coinRepository: coinRepo,
          alertRepository: alertRepo,
          ledgerRepository: ledgerRepo,
          ledgerRemote,
          biometricsService,
          outboxEngine,
          httpClient,
          connectivity,
          queryClient,
          cacheArea,
          vaultArea,
          remoteSimArea,
        };

        if (!hasInitializedContainer()) {
          initContainer(container);
        }

        if (process.env.EXPO_PUBLIC_E2E === "1") {
          overrideForTests({
            httpClient: E2EFixtures.httpClient,
            biometricsService: new StubBiometricsService(true),
          });
        }

        await useVaultAuthStore.getState().initialize();
        if (cancelled) {
          netInfoUnsub?.();
          onlineHookUnsub?.();
          connUnsub?.();
          unbindVaultAuth?.();
          return;
        }

        if (useVaultAuthStore.getState().screenProtectionEnabled) {
          try {
            void ScreenCapture.preventScreenCaptureAsync();
          } catch {}
        }

        appStateSub = AppState.addEventListener("change", (appState) => {
          useVaultAuthStore.getState().handleAppStateChange(appState);
        });

        if (!cancelled) {
          setState({ ready: true });
        }
      } catch (error) {
        if (!cancelled) {
          setState({ ready: false, error: error as Error });
        }
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
      netInfoUnsub?.();
      onlineHookUnsub?.();
      connUnsub?.();
      appStateSub?.remove();
      unbindVaultAuth?.();
    };
  }, [attempt]);

  if (state.vaultBlock) {
    const copy = RECOVERY_COPY[state.vaultBlock.status];
    const isRecovery = state.vaultBlock.status === "recovery";
    return (
      <View style={styles.centerContainer} testID="vault-recovery">
        <Text style={styles.errorTitle} testID="vault-recovery-title">
          {copy.title}
        </Text>
        <Text style={styles.errorMessage} testID="vault-recovery-message">
          {copy.body}
        </Text>
        <Pressable
          accessibilityRole="button"
          testID={isRecovery ? "vault-recovery-reset" : "vault-recovery-retry"}
          style={styles.recoveryButton}
          onPress={() => {
            if (isRecovery) {
              void resetVault();
            } else {
              setState({ ready: false });
              setAttempt((n) => n + 1);
            }
          }}
        >
          <Text style={styles.recoveryButtonText}>{isRecovery ? "Reset vault" : "Try again"}</Text>
        </Pressable>
      </View>
    );
  }

  if (state.error) {
    console.error("Bootstrap failed:", state.error);
    return (
      <View style={styles.centerContainer} testID="app-providers-error">
        <Text style={styles.errorTitle} testID="app-providers-error-title">
          Initialization Failed
        </Text>
        <Text style={styles.errorMessage} testID="app-providers-error-message">
          {state.error.message || String(state.error)}
        </Text>
      </View>
    );
  }

  if (!state.ready) {
    return (
      <View style={styles.centerContainer} testID="app-providers-loading">
        <ActivityIndicator size="large" color="#3B82F6" testID="app-providers-loading-indicator" />
      </View>
    );
  }

  return (
    <View style={styles.rootContainer} testID="app-providers-root">
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: "#0B0F1A",
  },
  centerContainer: {
    flex: 1,
    backgroundColor: "#0B0F1A",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  recoveryButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#3B82F6",
  },
  recoveryButtonText: {
    ...font("bold"),
    color: "#FFFFFF",
    fontSize: 16,
  },
  errorTitle: {
    ...font("bold"),
    color: "#EF4444",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  errorMessage: {
    ...font("regular"),
    color: "#94A3B8",
    textAlign: "center",
    fontSize: 14,
  },
});
