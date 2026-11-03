/**
 * Live hinge store — written by `HingeBridge` from the `HingeService` port
 * (expo-hinge on iOS 27.1+ / Android 11 foldables) and read by
 * `useDevicePosture` so a real half-fold produces BOOK_MODE / TABLETOP_MODE
 * without the simulator. Defaults to `null` (no hinge), which keeps every
 * non-foldable device on the pure window-size path.
 */
import { create } from "zustand";

import type { HingeInfo } from "./useDevicePosture";

export type HingeAxis = "vertical" | "horizontal";

interface HingeStoreState {
  readonly hinge: HingeInfo | null;
  readonly axis: HingeAxis | null;
  setHinge: (hinge: HingeInfo | null, axis: HingeAxis | null) => void;
}

export const useHingeStore = create<HingeStoreState>((set) => ({
  hinge: null,
  axis: null,
  setHinge: (hinge, axis) => set({ hinge, axis }),
}));

export function resetHingeStore(): void {
  useHingeStore.setState({ hinge: null, axis: null });
}
