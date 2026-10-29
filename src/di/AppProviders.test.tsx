/**
 * AppProviders integration tests.
 */
import { onlineManager } from "@tanstack/react-query";
import { act, fireEvent, render } from "@testing-library/react-native";
import { AppState, Text } from "react-native";

import * as vaultKeyModule from "@infrastructure/security/vault-key";
import { deleteVaultStorage } from "@infrastructure/storage/mmkvInstances";
import { resetVaultAuthStore, useVaultAuthStore } from "@stores/vaultAuthStore";

import { AppProviders } from "./AppProviders";
import { getContainer, resetContainerForTests } from "./container";

describe("AppProviders", () => {
  beforeEach(async () => {
    resetContainerForTests();
    resetVaultAuthStore();
    deleteVaultStorage();
    await vaultKeyModule.eraseVaultKey();
  });

  describe("vault key failure handling", () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("shows a retryable state, not a crash, when the key store is unavailable", async () => {
      jest
        .spyOn(vaultKeyModule, "ensureVaultKey")
        .mockResolvedValueOnce({ status: "unavailable", reason: "read-failed" });

      const { findByTestId, findByText } = await render(
        <AppProviders>
          <Text>Vault Opened</Text>
        </AppProviders>,
      );

      expect(await findByText("Vault is temporarily unavailable")).toBeDefined();
      await act(async () => {
        fireEvent.press(await findByTestId("vault-recovery-retry"));
      });
      expect(await findByText("Vault Opened")).toBeDefined();
    });

    it("routes a legacy or key-less vault to the reset path and opens a fresh vault", async () => {
      jest
        .spyOn(vaultKeyModule, "ensureVaultKey")
        .mockResolvedValueOnce({ status: "recovery", reason: "legacy-key" });

      const { findByTestId, findByText } = await render(
        <AppProviders>
          <Text>Fresh Vault Opened</Text>
        </AppProviders>,
      );

      expect(await findByText("Vault cannot be opened")).toBeDefined();
      await act(async () => {
        fireEvent.press(await findByTestId("vault-recovery-reset"));
      });
      expect(await findByText("Fresh Vault Opened")).toBeDefined();
    });
  });

  it("bootstraps container and renders children", async () => {
    const { findByText } = await render(
      <AppProviders>
        <Text testID="child-content">Loaded Successfully</Text>
      </AppProviders>,
    );

    const child = await findByText("Loaded Successfully");
    expect(child).toBeDefined();
  });

  it("renders error view when bootstrap fails", async () => {
    jest
      .spyOn(vaultKeyModule, "ensureVaultKey")
      .mockRejectedValueOnce(new Error("SecureStore Hardware Fault"));

    const { findByText } = await render(
      <AppProviders>
        <Text>Never Rendered</Text>
      </AppProviders>,
    );

    const errorView = await findByText("Initialization Failed");
    expect(errorView).toBeDefined();

    const errorDetail = await findByText("SecureStore Hardware Fault");
    expect(errorDetail).toBeDefined();
  });

  it("supports E2E mode with fixture overrides", async () => {
    Object.defineProperty(process.env, "EXPO_PUBLIC_E2E", {
      value: "1",
      configurable: true,
      writable: true,
    });
    const { findByText } = await render(
      <AppProviders>
        <Text>E2E Ready</Text>
      </AppProviders>,
    );
    expect(await findByText("E2E Ready")).toBeDefined();
    Object.defineProperty(process.env, "EXPO_PUBLIC_E2E", {
      value: undefined,
      configurable: true,
      writable: true,
    });
  });

  it("wires connectivity to onlineManager and outboxEngine flush", async () => {
    const { findByText } = await render(
      <AppProviders>
        <Text>Spine Ready</Text>
      </AppProviders>,
    );
    await findByText("Spine Ready");

    const container = getContainer();
    const connectivity = container.connectivity;
    const outboxEngine = container.outboxEngine;
    const flushSpy = jest
      .spyOn(outboxEngine, "flush")
      .mockResolvedValue({ pending: 0, inflight: 0, failed: 0 });

    expect(onlineManager.isOnline()).toBe(true);

    await act(async () => {
      connectivity.setSimulatedOffline(true);
    });
    expect(onlineManager.isOnline()).toBe(false);
    expect(flushSpy).not.toHaveBeenCalled();

    await act(async () => {
      connectivity.setSimulatedOffline(false);
      await flushSpy.mock.results[0]?.value;
    });
    expect(onlineManager.isOnline()).toBe(true);
    expect(flushSpy).toHaveBeenCalledTimes(1);
  });

  it("cleans up listeners on unmount so subsequent changes do not trigger callbacks", async () => {
    const { findByText, unmount } = await render(
      <AppProviders>
        <Text>Unmount Target</Text>
      </AppProviders>,
    );
    await findByText("Unmount Target");

    const container = getContainer();
    const connectivity = container.connectivity;
    const outboxEngine = container.outboxEngine;
    const flushSpy = jest.spyOn(outboxEngine, "flush");

    await unmount();

    await act(async () => {
      connectivity.setSimulatedOffline(true);
    });
    expect(onlineManager.isOnline()).toBe(true);

    await act(async () => {
      connectivity.setSimulatedOffline(false);
    });
    expect(flushSpy).not.toHaveBeenCalled();
  });

  it("wires vault auth auto-lock on AppState change and cleans up on unmount", async () => {
    const { findByText, unmount } = await render(
      <AppProviders>
        <Text>Vault Lifecycle Active</Text>
      </AppProviders>,
    );
    await findByText("Vault Lifecycle Active");

    expect(useVaultAuthStore.getState().capabilities).not.toBeNull();
    expect(AppState.addEventListener).toHaveBeenCalledWith("change", expect.any(Function));

    const calls = (AppState.addEventListener as jest.Mock).mock.calls;
    const changeIndices = calls
      .map((call: unknown[], index: number) => (call[0] === "change" ? index : -1))
      .filter((idx: number) => idx !== -1);
    const lastChangeIndex = changeIndices[changeIndices.length - 1];
    expect(lastChangeIndex).toBeDefined();
    if (lastChangeIndex === undefined) {
      throw new Error("No change listener found");
    }

    const handler = (AppState.addEventListener as jest.Mock).mock.calls[lastChangeIndex][1] as (
      state: string,
    ) => void;
    const subscription = (AppState.addEventListener as jest.Mock).mock.results[lastChangeIndex]
      ?.value;

    useVaultAuthStore.setState({ isLocked: false, autoLockTimeout: 0 });
    handler("background");
    expect(useVaultAuthStore.getState().isLocked).toBe(true);

    await unmount();
    expect(subscription.remove).toHaveBeenCalled();
  });
});
