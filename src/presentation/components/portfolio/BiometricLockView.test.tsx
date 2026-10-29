/**
 * Component tests for BiometricLockView lock screen overlay.
 */

import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";

import { useVaultAuthStore } from "@stores/vaultAuthStore";

import { BiometricLockView } from "./BiometricLockView";

describe("BiometricLockView", () => {
  it("renders unlock button when biometrics available and triggers unlock", async () => {
    const mockUnlock = jest.fn(async () => true);
    useVaultAuthStore.setState({
      capabilities: {
        hasHardware: true,
        isEnrolled: true,
        supportedTypes: ["fingerprint"],
      },
      unlock: mockUnlock,
      isAuthenticating: false,
    });

    await render(<BiometricLockView />);

    expect(screen.getByTestId("biometric-lock-view")).toBeTruthy();
    expect(screen.getByTestId("btn-unlock-vault")).toBeTruthy();

    await fireEvent.press(screen.getByTestId("btn-unlock-vault"));
    expect(mockUnlock).toHaveBeenCalled();
  });

  it("triggers enter demo mode", async () => {
    const mockDemo = jest.fn();
    useVaultAuthStore.setState({
      capabilities: {
        hasHardware: false,
        isEnrolled: false,
        supportedTypes: [],
      },
      enterDemoMode: mockDemo,
    });

    await render(<BiometricLockView />);

    expect(screen.queryByTestId("btn-unlock-vault")).toBeNull();
    expect(screen.getByTestId("btn-demo-mode")).toBeTruthy();

    await fireEvent.press(screen.getByTestId("btn-demo-mode"));
    expect(mockDemo).toHaveBeenCalled();
  });

  it("renders verifying state when isAuthenticating is true", async () => {
    useVaultAuthStore.setState({
      capabilities: {
        hasHardware: true,
        isEnrolled: true,
        supportedTypes: ["facial"],
      },
      isAuthenticating: true,
    });

    await render(<BiometricLockView />);
    expect(screen.getByText("Verifying...")).toBeTruthy();
  });
});
