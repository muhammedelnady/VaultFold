/**
 * Posture override store — the single source for the simulator /
 * preview posture override. The review bar (FoldableSimulatorBar) and the
 * Settings foldable-preview section both write here; `useDevicePosture`
 * consumes it by default, so any posture can be previewed on any device —
 * which is what makes the Maestro `foldable-simulator-modes` flow and the
 * tester path work without a foldable in hand.
 *
 * `preset` refines the override with the *device identity* being previewed
 * (Standard iPhone, iPhone Duo, generic foldable Book, Tabletop). Layout
 * still follows `override`; the preset only changes the hinge geometry
 * (see `hingeGeometry.ts`) so iPhone Duo's slim seam and a foldable's
 * wider crease render differently.
 */
import { create } from "zustand";

import type { DevicePosture } from "./useDevicePosture";

export type PostureOverride = "auto" | DevicePosture;

export type DevicePreset = "standard" | "duo" | "book" | "tabletop";

export const PRESET_POSTURE: Readonly<Record<DevicePreset, DevicePosture>> = {
  standard: "COMPACT",
  duo: "BOOK_MODE",
  book: "BOOK_MODE",
  tabletop: "TABLETOP_MODE",
};

interface PostureOverrideState {
  readonly override: PostureOverride;
  readonly preset: DevicePreset | null;
  setOverride: (override: PostureOverride) => void;
  setPreset: (preset: DevicePreset) => void;
}

export const usePostureOverrideStore = create<PostureOverrideState>((set) => ({
  override: "auto",
  preset: null,
  setOverride: (override) => set({ override, preset: null }),
  setPreset: (preset) => set({ override: PRESET_POSTURE[preset], preset }),
}));

export function resetPostureOverride(): void {
  usePostureOverrideStore.setState({ override: "auto", preset: null });
}
