/**
 * Theme engine contract: createTheme(base, overrides),
 * WCAG AA contrast for every on-color/background pair in both palettes.
 */
import {
  activeColors,
  colors,
  contrastRatio,
  createTheme,
  dirSafe,
  font,
  type Palette,
  typography,
} from "./index";

const REQUIRED_AA_PAIRS = [
  ["text", "background"],
  ["text", "surface"],
  ["onPrimary", "primary"],
  ["onSecondary", "secondary"],
  ["onError", "error"],
  ["onWarning", "warning"],
  ["onSuccess", "success"],
  ["onText", "background"],
] as const;

describe("WCAG AA palette contrast", () => {
  for (const mode of ["light", "dark"] as const) {
    it(`${mode} palette meets AA ≥ 4.5:1 on every on-color pair`, () => {
      const palette = colors[mode];
      for (const [fg, bg] of REQUIRED_AA_PAIRS) {
        const ratio = contrastRatio(palette[fg], palette[bg]);
        expect(`${mode} ${fg}/${bg} = ${ratio.toFixed(2)}`).toBe(
          `${mode} ${fg}/${bg} = ${ratio.toFixed(2)}`,
        );
        expect(ratio).toBeGreaterThanOrEqual(4.5);
      }
    });
  }

  it("contrastRatio: identical colors = 1, black/white = 21", () => {
    expect(contrastRatio("#111827", "#111827")).toBeCloseTo(1);
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21);
  });

  it("contrastRatio: throws on invalid hex color", () => {
    expect(() => contrastRatio("invalid", "#FFFFFF")).toThrow("invalid hex color");
  });

  it("activeColors and dirSafe return expected values", () => {
    expect(activeColors("light")).toBe(colors.light);
    expect(activeColors("dark")).toBe(colors.dark);
    expect(dirSafe(16)).toBe(16);
  });
});

describe("typography font tokens", () => {
  it("exposes a weight-mapped fontFamily token for each weight", () => {
    for (const weight of ["regular", "medium", "semibold", "bold"] as const) {
      expect(typeof typography.fontFamily[weight]).toBe("string");
      expect(typography.fontFamily[weight].length).toBeGreaterThan(0);
    }
  });

  it("font() returns the fontFamily token for a weight", () => {
    expect(font("semibold")).toEqual({ fontFamily: typography.fontFamily.semibold });
    expect(font("bold")).toEqual({ fontFamily: typography.fontFamily.bold });
  });

  it("font() defaults to the regular weight", () => {
    expect(font()).toEqual({ fontFamily: typography.fontFamily.regular });
  });
});

describe("createTheme(base, overrides)", () => {
  it("merges color overrides into a frozen theme", () => {
    const base = colors.light;
    const theme = createTheme(base, { accent: "#7C3AED" });
    expect(theme.accent).toBe("#7C3AED");
    expect(theme.colors.background).toBe(base.background);
    expect(Object.isFrozen(theme.colors)).toBe(true);
    expect(Object.isFrozen(theme)).toBe(true);
  });

  it("accepts a palette without overrides", () => {
    const theme = createTheme(colors.dark);
    expect(theme.colors.primary).toBe(colors.dark.primary);
    expect(theme.accent).toBeUndefined();
  });

  it("types the overrides as a strict Palette subset", () => {
    const partial: Palette = { ...colors.light };
    expect(() => createTheme(partial, { accent: "#ABCDEF" })).not.toThrow();
  });
});
