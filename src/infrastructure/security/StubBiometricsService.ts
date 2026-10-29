/**
 * Deterministic Stub Biometrics service for E2E tests and CI.
 */
import type { BiometricsCapabilities, BiometricsService } from "@domain/security/BiometricsService";

export class StubBiometricsService implements BiometricsService {
  private shouldSucceed: boolean;
  private capabilities: BiometricsCapabilities;

  constructor(
    shouldSucceed = true,
    capabilities: BiometricsCapabilities = {
      hasHardware: true,
      isEnrolled: true,
      supportedTypes: ["facial", "fingerprint"],
    },
  ) {
    this.shouldSucceed = shouldSucceed;
    this.capabilities = capabilities;
  }

  setShouldSucceed(value: boolean): void {
    this.shouldSucceed = value;
  }

  setCapabilities(caps: BiometricsCapabilities): void {
    this.capabilities = caps;
  }

  async getCapabilities(): Promise<BiometricsCapabilities> {
    return this.capabilities;
  }

  async authenticate(): Promise<boolean> {
    return this.shouldSucceed;
  }
}
