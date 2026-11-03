/**
 * Unit tests for biometric authentication services.
 */

import { describe, expect, it, jest } from "@jest/globals";
import * as LocalAuthentication from "expo-local-authentication";

import { ExpoBiometricsService } from "./ExpoBiometricsService";
import { StubBiometricsService } from "./StubBiometricsService";

describe("ExpoBiometricsService", () => {
  it("queries capabilities and maps authentication types", async () => {
    const service = new ExpoBiometricsService();
    const caps = await service.getCapabilities();

    expect(caps.hasHardware).toBe(true);
    expect(caps.isEnrolled).toBe(true);
    expect(caps.supportedTypes).toContain("fingerprint");
    expect(caps.supportedTypes).toContain("facial");

    (
      LocalAuthentication.supportedAuthenticationTypesAsync as unknown as jest.MockedFunction<
        typeof LocalAuthentication.supportedAuthenticationTypesAsync
      >
    ).mockResolvedValueOnce([3, 999] as unknown as LocalAuthentication.AuthenticationType[]);
    const caps2 = await service.getCapabilities();
    expect(caps2.supportedTypes).toContain("iris");
    expect(caps2.supportedTypes).toContain("unknown");
  });

  it("handles getCapabilities exceptions gracefully", async () => {
    (
      LocalAuthentication.hasHardwareAsync as unknown as jest.MockedFunction<
        typeof LocalAuthentication.hasHardwareAsync
      >
    ).mockRejectedValueOnce(new Error("Hardware failure"));

    const service = new ExpoBiometricsService();
    const caps = await service.getCapabilities();

    expect(caps.hasHardware).toBe(false);
    expect(caps.isEnrolled).toBe(false);
    expect(caps.supportedTypes).toEqual([]);
  });

  it("authenticates successfully", async () => {
    const service = new ExpoBiometricsService();
    const ok = await service.authenticate("Unlock VaultFold");
    expect(ok).toBe(true);
  });

  it("handles authentication failure or error", async () => {
    (
      LocalAuthentication.authenticateAsync as unknown as jest.MockedFunction<
        typeof LocalAuthentication.authenticateAsync
      >
    ).mockResolvedValueOnce({
      success: false,
      error: "user_cancel",
    });

    const service = new ExpoBiometricsService();
    const fail = await service.authenticate();
    expect(fail).toBe(false);

    (
      LocalAuthentication.authenticateAsync as unknown as jest.MockedFunction<
        typeof LocalAuthentication.authenticateAsync
      >
    ).mockRejectedValueOnce(new Error("User cancelled"));
    const err = await service.authenticate();
    expect(err).toBe(false);
  });
});

describe("StubBiometricsService", () => {
  it("defaults to success and allows toggling in tests", async () => {
    const stub = new StubBiometricsService();
    expect(await stub.authenticate()).toBe(true);

    stub.setShouldSucceed(false);
    expect(await stub.authenticate()).toBe(false);

    const caps = await stub.getCapabilities();
    expect(caps.hasHardware).toBe(true);

    stub.setCapabilities({
      hasHardware: false,
      isEnrolled: false,
      supportedTypes: [],
    });
    const updated = await stub.getCapabilities();
    expect(updated.hasHardware).toBe(false);
  });
});
