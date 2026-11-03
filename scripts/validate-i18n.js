/**
 * validate-i18n.js (i18n validation).
 *
 * Enforces en/ar parity: every key in `resources.en` must exist in `resources.ar`
 * and vice-versa, with exact type match. Exits non-zero on mismatch so CI can fail fast.
 */

const fs = require("fs");
const path = require("path");

const RESOURCES_DIR = path.resolve(__dirname, "..", "src", "infrastructure", "i18n", "resources");

function loadJson(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`Missing resource file: ${filePath}`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function flattenKeys(obj, prefix = "") {
  let keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      keys = keys.concat(flattenKeys(v, fullKey));
    } else {
      keys.push({ key: fullKey, type: typeof v });
    }
  }
  return keys;
}

function validate() {
  const enPath = path.join(RESOURCES_DIR, "en", "en.json");
  const arPath = path.join(RESOURCES_DIR, "ar", "ar.json");

  const enBundle = loadJson(enPath);
  const arBundle = loadJson(arPath);

  const enKeys = flattenKeys(enBundle);
  const arKeys = flattenKeys(arBundle);

  const enMap = new Map(enKeys.map((item) => [item.key, item.type]));
  const arMap = new Map(arKeys.map((item) => [item.key, item.type]));

  let hasError = false;

  for (const [key, type] of enMap.entries()) {
    if (!arMap.has(key)) {
      console.error(`MISSING in ar.json: ${key}`);
      hasError = true;
    } else if (arMap.get(key) !== type) {
      console.error(`TYPE MISMATCH for ${key}: en=${type} ar=${arMap.get(key)}`);
      hasError = true;
    }
  }

  for (const [key] of arMap.entries()) {
    if (!enMap.has(key)) {
      console.error(`EXTRA in ar.json (missing in en.json): ${key}`);
      hasError = true;
    }
  }

  if (hasError) {
    console.error("i18n validation FAILED.");
    process.exit(1);
  } else {
    console.log(`i18n validation PASSED — ${enKeys.length} keys validated with 100% en/ar parity.`);
  }
}

validate();
