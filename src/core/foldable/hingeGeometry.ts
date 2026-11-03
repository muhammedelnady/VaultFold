/**
 * Hinge gutter geometry — a pure function so occlusion avoidance is
 * unit-testable.
 *
 * The gutter is a *reserved, empty* strip between the two panes. No text,
 * chart, or button is ever laid out inside it, so nothing can sit behind the
 * crease. Thickness comes from real hinge bounds when the platform reports
 * them, otherwise from the simulated device preset.
 */
import type { DevicePreset } from "./postureStore";
import type { DevicePosture, PostureInfo } from "./useDevicePosture";

export type GutterAxis = "vertical" | "horizontal";

export interface HingeGutterSpec {
  /** `vertical` = a vertical crease (panes side by side). */
  readonly axis: GutterAxis;
  readonly thickness: number;
}

export const GUTTER_THICKNESS = {
  duo: 18,
  book: 32,
  tabletop: 28,
  /** Used when a real fold is detected but bounds are unavailable. */
  fallback: 24,
} as const;

export function resolveHingeGutter(
  posture: DevicePosture,
  preset: DevicePreset | null,
  bounds: PostureInfo["hingeBounds"],
): HingeGutterSpec | null {
  if (posture !== "BOOK_MODE" && posture !== "TABLETOP_MODE") {
    return null;
  }
  const axis: GutterAxis = posture === "TABLETOP_MODE" ? "horizontal" : "vertical";

  if (bounds !== null) {
    const measured = axis === "vertical" ? bounds.width : bounds.height;
    if (measured > 0) {
      return { axis, thickness: Math.max(measured, 8) };
    }
  }

  if (posture === "TABLETOP_MODE") {
    return { axis, thickness: GUTTER_THICKNESS.tabletop };
  }
  if (preset === "duo") {
    return { axis, thickness: GUTTER_THICKNESS.duo };
  }
  if (preset === "book") {
    return { axis, thickness: GUTTER_THICKNESS.book };
  }
  return { axis, thickness: GUTTER_THICKNESS.fallback };
}
