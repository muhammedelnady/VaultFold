/** Environment validation (production readiness). */
const missing: string[] = [];

const env = process.env;

if (!env["EXPO_PUBLIC_ENVIRONMENT"]) {
  missing.push("EXPO_PUBLIC_ENVIRONMENT");
}

if (missing.length) {
  console.warn("[env-validation] Missing optional production env vars:", missing);
  console.warn("[env-validation] Set these in your EAS build env config or .env file.");
} else {
  console.log("[env-validation] All required production env vars present");
}
