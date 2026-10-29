/**
 * Theme store: mode (light/dark) + Theme Studio accent.
 * Accent acceptance mirrors the engine contract: ≥ 4.5:1 against the current
 * mode's background before anything persists. Persistence is a plain JSON
 * blob in a caller-provided MmkvPersist (DI binds the `cache` area; tests
 * inject an in-memory fake).
 */
import { beforeEach, describe, expect, it } from "@jest/globals";
import { render } from "@testing-library/react-native";
import { Text } from "react-native";

import {
  bindThemePersistence,
  resetThemeStore,
  themeSnapshot,
  useTheme,
  useThemeStore,
  type MmkvPersist,
} from "./themeStore";

function memoryArea(): MmkvPersist {
  const map = new Map<string, string>();
  return {
    getString: (key) => map.get(key),
    set: (key, value) => void map.set(key, value),
    remove: (key) => void map.delete(key),
  };
}

describe("themeStore", () => {
  beforeEach(() => {
    resetThemeStore();
  });

  it("defaults to light mode without an accent", () => {
    expect(useThemeStore.getState().mode).toBe("light");
    expect(useThemeStore.getState().accent).toBeUndefined();
  });

  it("setMode switches and persists JSON", () => {
    const area = memoryArea();
    bindThemePersistence(area);
    useThemeStore.getState().setMode("dark");
    expect(useThemeStore.getState().mode).toBe("dark");
    const raw = area.getString("vaultfold.theme.v1");
    expect(raw).toBeDefined();
    expect(JSON.parse(raw ?? "{}")).toMatchObject({ version: 1, mode: "dark" });
  });

  it("rejects an accent below AA against the mode background; accepts a strong one", () => {
    const arena = memoryArea();
    bindThemePersistence(arena);
    const rejected = useThemeStore.getState().setAccent("#F9FAFB");
    expect(rejected).toBe(false);
    expect(useThemeStore.getState().accent).toBeUndefined();
    const accepted = useThemeStore.getState().setAccent("#2563EB");
    expect(accepted).toBe(true);
    expect(useThemeStore.getState().accent).toBe("#2563EB");
  });

  it("bindThemePersistence hydrates persisted mode + accent", () => {
    const arena = memoryArea();
    arena.set(
      "vaultfold.theme.v1",
      JSON.stringify({ version: 1, mode: "dark", accent: "#2563EB" }),
    );
    bindThemePersistence(arena);
    expect(useThemeStore.getState().mode).toBe("dark");
    expect(useThemeStore.getState().accent).toBe("#2563EB");
    expect(themeSnapshot().accent).toBe("#2563EB");
    expect(themeSnapshot().colors.background).toBe("#111827");
  });

  it("resetThemeStore restores defaults and clears persistence", () => {
    const arena = memoryArea();
    bindThemePersistence(arena);
    useThemeStore.getState().setMode("dark");
    useThemeStore.getState().setAccent("#2563EB");
    resetThemeStore();
    expect(useThemeStore.getState().mode).toBe("light");
    expect(useThemeStore.getState().accent).toBeUndefined();
    expect(arena.getString("vaultfold.theme.v1")).toBe("");
  });

  it("rebinding persistence overwrites in-memory state to stored values", () => {
    const one = memoryArea();
    const two = memoryArea();
    bindThemePersistence(one);
    useThemeStore.getState().setMode("dark");
    two.set("vaultfold.theme.v1", JSON.stringify({ version: 1, mode: "light" }));
    bindThemePersistence(two);
    expect(useThemeStore.getState().mode).toBe("light");
  });

  it("handles writePersisted when boundArea is null", () => {
    resetThemeStore();
    useThemeStore.getState().setMode("dark");
    expect(useThemeStore.getState().mode).toBe("dark");
    expect(useThemeStore.getState().setAccent(undefined)).toBe(true);
    expect(useThemeStore.getState().setAccent("invalid-hex")).toBe(false);
  });

  it("handles invalid version or mode in persisted theme", () => {
    const arena = memoryArea();
    arena.set("vaultfold.theme.v1", JSON.stringify({ version: 99, mode: "unknown" }));
    bindThemePersistence(arena);
    expect(useThemeStore.getState().mode).toBe("light");
  });

  it("handles corrupted JSON gracefully during bindThemePersistence", () => {
    const arena = memoryArea();
    arena.set("vaultfold.theme.v1", "corrupted{{json");
    bindThemePersistence(arena);
    expect(useThemeStore.getState().mode).toBe("light");
  });

  it("useTheme returns current theme in component render", async () => {
    function ThemeTester() {
      const theme = useTheme();
      return <Text testID="theme-mode">{theme.colors.background}</Text>;
    }
    const { getByTestId } = await render(<ThemeTester />);
    expect(getByTestId("theme-mode").props["children"]).toBe("#F9FAFB");
  });

  it("themeSnapshot returns theme with accent when defined", () => {
    useThemeStore.getState().setAccent("#1E40AF");
    const snapshot = themeSnapshot();
    expect(snapshot.accent).toBe("#1E40AF");
  });
});
