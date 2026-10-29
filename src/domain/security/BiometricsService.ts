/**
 * Biometrics domain interface.
 * Hardware check, enrollment status, and authentication gate.
 */

export interface BiometricsCapabilities {
  readonly hasHardware: boolean;
  readonly isEnrolled: boolean;
  readonly supportedTypes: readonly ("fingerprint" | "facial" | "iris" | "unknown")[];
}

export interface BiometricsService {
  getCapabilities(): Promise<BiometricsCapabilities>;
  authenticate(promptMessage?: string): Promise<boolean>;
}
