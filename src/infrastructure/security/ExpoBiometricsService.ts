/**
 * Expo LocalAuthentication biometrics service implementation.
 * Checks hardware/enrollment and gates vault unlock with fallback support.
 */
import * as LocalAuthentication from "expo-local-authentication";

import type { BiometricsCapabilities, BiometricsService } from "@domain/security/BiometricsService";

export class ExpoBiometricsService implements BiometricsService {
  async getCapabilities(): Promise<BiometricsCapabilities> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

      const supportedTypes = types.map((type) => {
        if (type === LocalAuthentication.AuthenticationType.FINGERPRINT) {
          return "fingerprint" as const;
        }
        if (type === LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION) {
          return "facial" as const;
        }
        if (type === LocalAuthentication.AuthenticationType.IRIS) {
          return "iris" as const;
        }
        return "unknown" as const;
      });

      return {
        hasHardware,
        isEnrolled,
        supportedTypes,
      };
    } catch {
      return {
        hasHardware: false,
        isEnrolled: false,
        supportedTypes: [],
      };
    }
  }

  async authenticate(promptMessage = "Unlock VaultFold"): Promise<boolean> {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        fallbackLabel: "Use Passcode",
        cancelLabel: "Cancel",
        disableDeviceFallback: false,
      });

      return result.success;
    } catch {
      return false;
    }
  }
}
