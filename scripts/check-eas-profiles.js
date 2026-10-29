/**
 * check-eas-profiles.js
 *
 * EXPO_PUBLIC_E2E=1 swaps the real biometric service for an always-succeeding stub
 * (src/di/AppProviders.tsx) and EXPO_PUBLIC_* values are inlined into the JS bundle.
 * That flag must therefore exist only in the dedicated `e2e` EAS build profile.
 * Exits non-zero if any other profile (or a profile that extends `e2e`) sets it.
 */

const fs = require("node:fs");
const path = require("node:path");

const FLAG = "EXPO_PUBLIC_E2E";
const ALLOWED_PROFILE = "e2e";

const easPath = path.join(__dirname, "..", "eas.json");
const eas = JSON.parse(fs.readFileSync(easPath, "utf8"));
const profiles = eas.build ?? {};

const violations = [];
for (const [name, profile] of Object.entries(profiles)) {
  const setsFlag = profile.env !== undefined && FLAG in profile.env;
  const extendsE2e = profile.extends === ALLOWED_PROFILE;
  if (name !== ALLOWED_PROFILE && (setsFlag || extendsE2e)) {
    violations.push(
      setsFlag
        ? `profile "${name}" sets ${FLAG}`
        : `profile "${name}" extends "${ALLOWED_PROFILE}" and would inherit ${FLAG}`,
    );
  }
}

if (!(ALLOWED_PROFILE in profiles)) {
  violations.push(`expected an "${ALLOWED_PROFILE}" profile in eas.json`);
}

if (violations.length > 0) {
  console.error("eas.json check failed:");
  for (const v of violations) console.error(`  - ${v}`);
  process.exit(1);
}
console.log(`eas.json OK: ${FLAG} is only set in the "${ALLOWED_PROFILE}" profile.`);
