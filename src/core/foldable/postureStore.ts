/**
 * Posture override store — the single source for the simulator /
 * preview posture override. The review bar (FoldableSimulatorBar) and the
 * Settings foldable-preview section both write here; `useDevicePosture`
 * consumes it by default, so any posture can be previewed on any device —
 * which is what makes the Maestro `foldable-simulator-modes` flow and the
 * tester path work without a foldable in hand.
 */
import { create } from "zustand";

import type { DevicePosture } from "./useDevicePosture";

export type PostureOverride = "auto" | DevicePosture;

interface PostureOverrideState {
  readonly override: PostureOverride;
  setOverride: (override: PostureOverride) => void;
}

export const usePostureOverrideStore = create<PostureOverrideState>((set) => ({
  override: "auto",
  setOverride: (override) => set({ override }),
}));

export function resetPostureOverride(): void {
  usePostureOverrideStore.setState({ override: "auto" });
}
