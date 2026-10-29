/**
 * Typed surface for the public `EXPO_PUBLIC_*` environment variables
 * (bundled into the JS build; never hold secrets — see.env.example).
 * Declared properties let call sites use static `process.env.FOO` access,
 * satisfying `noPropertyAccessFromIndexSignature` (tsc) and the Expo
 * env-var lint rules simultaneously.
 */
declare namespace NodeJS {
  interface ProcessEnv {
    readonly EXPO_PUBLIC_COINGECKO_DEMO_KEY?: string;
    readonly EXPO_PUBLIC_CG_BURST?: string;
    readonly EXPO_PUBLIC_CG_WINDOW_MS?: string;
    readonly EXPO_PUBLIC_REVIEW_MODE?: string;
    readonly EXPO_PUBLIC_E2E?: string;
    readonly EXPO_PUBLIC_ENVIRONMENT?: string;
  }
}
