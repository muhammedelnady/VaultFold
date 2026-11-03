/**
 * Theme store: mode (light/dark) + Theme Studio accent.
 * Accent acceptance mirrors the engine contract: ≥ 4.5:1 against the current
 * mode's background before anything persists. Persistence is a plain JSON
 * blob in a caller-provided MmkvPersist (DI binds the `cache` area; tests
 * inject an in-memory fake).
 */
import { create } from "zustand";

import { colors, contrastRatio, createTheme, type Theme } from "@theme";

export type ThemeMode = "light" | "dark";

interface ThemeState {
  readonly mode: ThemeMode;
  readonly accent?: string;
  setMode: (mode: ThemeMode) => void;
  setAccent: (hex: string | undefined) => boolean;
}

export const THEME_STORE_KEY = "vaultfold.theme.v1";

export interface MmkvPersist {
  readonly getString: (key: string) => string | undefined;
  readonly set: (key: string, value: string) => void;
  readonly remove: (key: string) => void;
}

interface PersistedTheme {
  readonly version: 1;
  readonly mode: ThemeMode;
  readonly accent?: string;
}

let boundArea: MmkvPersist | null = null;

function writePersisted(state: { mode: ThemeMode; accent?: string }): void {
  if (boundArea === null) {
    return;
  }
  const payload: PersistedTheme = {
    version: 1,
    mode: state.mode,
    accent: state.accent,
  };
  boundArea.set(THEME_STORE_KEY, JSON.stringify(payload));
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: "light",
  accent: undefined,
  setMode: (mode) => {
    set({ mode });
    writePersisted(useThemeStore.getState());
  },
  setAccent: (hex) => {
    if (hex === undefined) {
      set({ accent: undefined });
      writePersisted(useThemeStore.getState());
      return true;
    }
    if (!/^#[0-9a-fA-F]{6}$/.test(hex)) {
      return false;
    }
    const background = colors[useThemeStore.getState().mode].background;
    if (contrastRatio(hex, background) < 4.5) {
      return false;
    }
    set({ accent: hex });
    writePersisted(useThemeStore.getState());
    return true;
  },
}));

export function bindThemePersistence(area: MmkvPersist): void {
  boundArea = area;
  const raw = area.getString(THEME_STORE_KEY);
  if (raw === undefined || raw === "") {
    writePersisted(useThemeStore.getState());
    return;
  }
  try {
    const parsed = JSON.parse(raw) as PersistedTheme;
    if (parsed?.version !== 1 || (parsed.mode !== "light" && parsed.mode !== "dark")) {
      area.remove(THEME_STORE_KEY);
      writePersisted(useThemeStore.getState());
      return;
    }
    useThemeStore.setState({
      mode: parsed.mode,
      accent: parsed.accent && /^#[0-9a-fA-F]{6}$/.test(parsed.accent) ? parsed.accent : undefined,
    });
  } catch {
    area.remove(THEME_STORE_KEY);
    writePersisted(useThemeStore.getState());
  }
}

export function resetThemeStore(): void {
  useThemeStore.setState({ mode: "light", accent: undefined });
  if (boundArea !== null) {
    boundArea.set(THEME_STORE_KEY, "");
  }
}

export function useTheme(): Theme {
  const mode = useThemeStore((state) => state.mode);
  const accent = useThemeStore((state) => state.accent);
  return createTheme(colors[mode], accent === undefined ? undefined : { accent });
}

export function themeSnapshot(): Theme {
  const { mode, accent } = useThemeStore.getState();
  return createTheme(colors[mode], accent === undefined ? undefined : { accent });
}
