/**
 * Theme engine — composable light/dark theme.
 *
 * Exported tokens: colors, spacing, typography, shadows, border-radius,
 * z-index. All values are plain numbers / strings / color literals.
 */

export const lightColors = {
  background: "#F9FAFB",
  surface: "#FFFFFF",
  primary: "#2563EB",
  onPrimary: "#FFFFFF",
  secondary: "#4B5563",
  onSecondary: "#FFFFFF",
  error: "#DC2626",
  onError: "#FFFFFF",
  warning: "#F59E0B",
  onWarning: "#111827",
  success: "#047857",
  onSuccess: "#FFFFFF",
  text: "#111827",
  onText: "#111827",
  muted: "#6B7280",
  border: "#E5E7EB",
};

export const darkColors = {
  background: "#111827",
  surface: "#1F2937",
  primary: "#60A5FA",
  onPrimary: "#111827",
  secondary: "#9CA3AF",
  onSecondary: "#111827",
  error: "#F87171",
  onError: "#1F2937",
  warning: "#FBBF24",
  onWarning: "#111827",
  success: "#34D399",
  onSuccess: "#1F2937",
  text: "#F9FAFB",
  onText: "#F9FAFB",
  muted: "#6B7280",
  border: "#374151",
};

export const colors = {
  light: lightColors,
  dark: darkColors,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

/**
 * Font family tokens — one family covering every supported app language
 * (Latin + Arabic, plus Cyrillic/Hebrew fallback). Values are the font
 * family names registered at startup via `useFonts` in `src/app/_layout.tsx`.
 * Keep these keys in sync with the faces loaded there.
 */
export const fontFamily = {
  regular: "Rubik_400Regular",
  medium: "Rubik_500Medium",
  semibold: "Rubik_600SemiBold",
  bold: "Rubik_700Bold",
} as const;

export type FontToken = keyof typeof fontFamily;

/**
 * Spread helper for text styles: `{...font("semibold") }`.
 * Falls back to the regular weight when omitted.
 */
export function font(weight: FontToken = "regular"): { fontFamily: string } {
  return { fontFamily: fontFamily[weight] };
}

export const typography = {
  fontFamily,
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
  },
  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const shadows = {
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
};

export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  full: 9999,
};

export const zIndex = {
  base: 0,
  docked: 10,
  modal: 100,
  overlay: 200,
  popover: 300,
  toast: 400,
  tooltip: 500,
};

export function activeColors(mode: "light" | "dark"): typeof lightColors {
  return mode === "light" ? lightColors : darkColors;
}

export function dirSafe<T>(spacingValue: T): T {
  return spacingValue;
}

export type Palette = typeof lightColors & { accent?: string };

export function contrastRatio(hexA: string, hexB: string): number {
  const lum = (hex: string): number => {
    const value = hex.replace("#", "");
    if (!/^[0-9a-fA-F]{6}$/.test(value)) {
      throw new Error(`contrastRatio: invalid hex color ${hex}`);
    }
    const channels = [0, 2, 4].map((offset) => {
      const raw = parseInt(value.slice(offset, offset + 2), 16) / 255;
      return raw <= 0.03928 ? raw / 12.92 : ((raw + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
  };
  const lighter = Math.max(lum(hexA), lum(hexB));
  const darker = Math.min(lum(hexA), lum(hexB));
  return (lighter + 0.05) / (darker + 0.05);
}

export interface Theme {
  readonly colors: Palette;
  readonly accent?: string;
  readonly spacing: typeof spacing;
  readonly typography: typeof typography;
  readonly shadows: typeof shadows;
  readonly borderRadius: typeof borderRadius;
  readonly zIndex: typeof zIndex;
}

export function createTheme(base: Palette, overrides?: Partial<Palette>): Theme {
  const merged: Palette = { ...base, ...overrides };
  return Object.freeze({
    colors: Object.freeze(merged),
    accent: overrides?.accent,
    spacing: Object.freeze(spacing),
    typography: Object.freeze(typography),
    shadows: Object.freeze(shadows),
    borderRadius: Object.freeze(borderRadius),
    zIndex: Object.freeze(zIndex),
  });
}
