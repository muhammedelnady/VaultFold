/**
 * Vault Authentication Store & Auto-Lock State Machine.
 * Manages biometric lock, auto-lock timeouts, demo-mode, and screen protection.
 */
import * as ScreenCapture from "expo-screen-capture";
import type { AppStateStatus } from "react-native";
import { create } from "zustand";

import { getContainer } from "@di/container";
import type { BiometricsCapabilities } from "@domain/security/BiometricsService";

export const AUTO_LOCK_TIMEOUTS = {
  IMMEDIATE: 0,
  THIRTY_SECONDS: 30_000,
  ONE_MINUTE: 60_000,
  FIVE_MINUTES: 300_000,
} as const;

export const VAULT_AUTH_STORE_KEY = "vaultfold.vault_auth.v1";

export interface MmkvPersist {
  readonly getString: (key: string) => string | undefined;
  readonly set: (key: string, value: string) => void;
  readonly remove: (key: string) => void;
}

interface PersistedVaultAuth {
  readonly version: 1;
  readonly autoLockTimeout: number;
  readonly screenProtectionEnabled: boolean;
}

let boundArea: MmkvPersist | null = null;

function writePersisted(state: {
  autoLockTimeout: number;
  screenProtectionEnabled: boolean;
}): void {
  if (boundArea === null) {
    return;
  }
  const payload: PersistedVaultAuth = {
    version: 1,
    autoLockTimeout: state.autoLockTimeout,
    screenProtectionEnabled: state.screenProtectionEnabled,
  };
  boundArea.set(VAULT_AUTH_STORE_KEY, JSON.stringify(payload));
}

export interface VaultAuthState {
  readonly isLocked: boolean;
  readonly isDemoMode: boolean;
  readonly autoLockTimeout: number;
  readonly lastActiveTimestamp: number;
  readonly capabilities: BiometricsCapabilities | null;
  readonly isAuthenticating: boolean;
  readonly screenProtectionEnabled: boolean;

  initialize: () => Promise<void>;
  unlock: () => Promise<boolean>;
  lock: () => void;
  enterDemoMode: () => void;
  setAutoLockTimeout: (timeout: number) => void;
  handleAppStateChange: (nextAppState: AppStateStatus) => void;
  setScreenProtectionEnabled: (enabled: boolean) => Promise<void>;
}

export const useVaultAuthStore = create<VaultAuthState>((set, get) => ({
  isLocked: true,
  isDemoMode: false,
  autoLockTimeout: AUTO_LOCK_TIMEOUTS.THIRTY_SECONDS,
  lastActiveTimestamp: Date.now(),
  capabilities: null,
  isAuthenticating: false,
  screenProtectionEnabled: true,

  initialize: async () => {
    try {
      const { biometricsService } = getContainer();
      const capabilities = await biometricsService.getCapabilities();
      set({ capabilities });
    } catch {
      set({
        capabilities: {
          hasHardware: false,
          isEnrolled: false,
          supportedTypes: [],
        },
      });
    }
  },

  unlock: async () => {
    const { isAuthenticating } = get();
    if (isAuthenticating) return false;

    set({ isAuthenticating: true });
    try {
      const { biometricsService } = getContainer();
      const success = await biometricsService.authenticate("Unlock VaultFold Portfolio");
      if (success) {
        set({ isLocked: false, lastActiveTimestamp: Date.now() });
        return true;
      }
      return false;
    } finally {
      set({ isAuthenticating: false });
    }
  },

  lock: () => {
    set({ isLocked: true });
  },

  enterDemoMode: () => {
    set({ isDemoMode: true, isLocked: false, lastActiveTimestamp: Date.now() });
  },

  setAutoLockTimeout: (timeout: number) => {
    set({ autoLockTimeout: timeout });
    writePersisted(get());
  },

  handleAppStateChange: (nextAppState: AppStateStatus) => {
    const { isDemoMode, autoLockTimeout, lastActiveTimestamp } = get();

    if (nextAppState === "background" || nextAppState === "inactive") {
      set({ lastActiveTimestamp: Date.now() });
      if (autoLockTimeout === 0 && !isDemoMode) {
        set({ isLocked: true });
      }
    } else if (nextAppState === "active") {
      if (!isDemoMode) {
        const elapsed = Date.now() - lastActiveTimestamp;
        if (elapsed >= autoLockTimeout) {
          set({ isLocked: true });
        }
      }
    }
  },

  setScreenProtectionEnabled: async (enabled: boolean) => {
    set({ screenProtectionEnabled: enabled });
    writePersisted(get());
    try {
      if (enabled) {
        await ScreenCapture.preventScreenCaptureAsync();
      } else {
        await ScreenCapture.allowScreenCaptureAsync();
      }
    } catch {}
  },
}));

export function bindVaultAuthPersistence(area: MmkvPersist): () => void {
  boundArea = area;
  const raw = area.getString(VAULT_AUTH_STORE_KEY);
  if (raw !== undefined && raw !== "") {
    try {
      const parsed = JSON.parse(raw) as PersistedVaultAuth;
      if (parsed?.version === 1) {
        useVaultAuthStore.setState({
          autoLockTimeout:
            typeof parsed.autoLockTimeout === "number"
              ? parsed.autoLockTimeout
              : AUTO_LOCK_TIMEOUTS.THIRTY_SECONDS,
          screenProtectionEnabled:
            typeof parsed.screenProtectionEnabled === "boolean"
              ? parsed.screenProtectionEnabled
              : true,
        });
      }
    } catch {
      area.remove(VAULT_AUTH_STORE_KEY);
    }
  }
  return () => {
    boundArea = null;
  };
}

export function resetVaultAuthStore(): void {
  useVaultAuthStore.setState({
    isLocked: true,
    isDemoMode: false,
    autoLockTimeout: AUTO_LOCK_TIMEOUTS.THIRTY_SECONDS,
    lastActiveTimestamp: Date.now(),
    capabilities: null,
    isAuthenticating: false,
    screenProtectionEnabled: true,
  });
  if (boundArea !== null) {
    boundArea.remove(VAULT_AUTH_STORE_KEY);
  }
}
