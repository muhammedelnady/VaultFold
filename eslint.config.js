// VaultFold ESLint config (flat) — enforces Clean Architecture layer boundaries and RTL rules.
// Run via `npx expo lint`.
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const tseslint = require("typescript-eslint");

module.exports = defineConfig([
  ...expoConfig,
  tseslint.configs.recommended,
  {
    ignores: ["node_modules/**", "ios/**", "android/**", "dist/**", "coverage/**", ".expo/**"],
  },
  {
    files: ["*.js", "scripts/**/*.js"],
    languageOptions: {
      sourceType: "commonjs",
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "no-undef": "off",
    },
  },
  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    settings: {
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
          project: "./tsconfig.json",
        },
      },
    },
    rules: {
      "import/order": [
        "error",
        {
          groups: ["builtin", "external", "internal", "parent", "sibling", "index"],
          alphabetize: { order: "asc", caseInsensitive: true },
          "newlines-between": "always",
        },
      ],
      "import/no-duplicates": "error",
      "import/no-cycle": ["error", { allowUnsafeDynamicCyclicDependency: false }],
      "no-restricted-properties": "off",
    },
  },
  // Layer boundaries: domain must stay pure (no data/presentation/infrastructure/di imports).
  {
    files: ["src/domain/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@data/*",
                "@presentation/*",
                "@infrastructure/*",
                "@di/*",
                "@/data/*",
                "@/presentation/*",
                "@/infrastructure/*",
                "@/di/*",
                "react",
                "react-native",
                "expo*",
                "@expo*",
                "@tanstack/*",
                "zustand",
              ],
              message: "Domain layer must be pure TypeScript.",
            },
          ],
        },
      ],
    },
  },
  // Presentation must go through DI. No direct `@data/*` imports.
  {
    files: ["src/presentation/**/*.ts", "src/presentation/**/*.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@data/*", "@/data/*"],
              message: "Presentation must not import the data layer; use use cases via DI.",
            },
          ],
        },
      ],
    },
  },
  // RTL hygiene (I18N-3): logical props only. The escape hatch is a rule option via
  // inline comment `/* eslint-disable-next-line react-native/no-rtl-props -- rtl-ok: <reason> */`-style
  // handling; here we forbid physical props outright in src/**.
  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "Property[key.name=/^(marginLeft|marginRight|paddingLeft|paddingRight|borderLeftWidth|borderRightWidth|borderLeftColor|borderRightColor)$/]",
          message:
            "RTL: use marginStart/marginEnd/paddingStart/paddingEnd/borderStart*/borderEnd* instead of Left/Right (I18N-3).",
        },
        {
          selector: "Property[key.name='textAlign'][value.raw=/'(left|right)'/]",
          message: "RTL: use textAlign 'start' | 'end' (I18N-3).",
        },
      ],
    },
  },
  // Tests: allow dev-only patterns and relax cycle checking on mocks.
  {
    files: [
      "**/*.test.ts",
      "**/*.test.tsx",
      "src/__mocks__/**",
      "src/**/test-utils*",
      "setupTests.ts",
    ],
    rules: {
      "import/no-cycle": "off",
      "@typescript-eslint/no-require-imports": "off",
    },
  },
]);
