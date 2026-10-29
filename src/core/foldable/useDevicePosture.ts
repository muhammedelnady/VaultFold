/**
 * useDevicePosture — the decision-table implementation.
 *
 * Principle: layout follows window size; posture refines the arrangement;
 * hinge state drives effects. Inputs: window size through `useViewport`
 * (the only `useWindowDimensions` caller, enforced by lint), fold/hinge
 * facts, and the review.simulator override. The override substitutes the
 * preset-derived inputs upstream (FoldableSimulatorBar), so the pure
 * decision function here stays total and unit-testable.
 *
 * Decision table (first match wins):
 * 1. simulator override ≠ auto → the override (source: simulator)
 * 2. partiallyOpen + horizontal → TABLETOP_MODE (source: native)
 * 3. partiallyOpen + vertical, width ≠ compact → BOOK_MODE (source: native)
 * 4. width ≠ compact → FLAT_EXPANDED (source: window)
 * 5. otherwise → COMPACT
 * Axis unknown + partiallyOpen infers horizontal on landscape, else vertical.
 */
import { usePostureOverrideStore } from "./postureStore";
import { useViewport } from "./useViewport";

export type DevicePosture = "COMPACT" | "FLAT_EXPANDED" | "BOOK_MODE" | "TABLETOP_MODE";

export type HingeStatus = "closed" | "partiallyOpen" | "fullyOpen" | "unknown";

export interface HingeInfo {
  readonly angle: number;
  readonly status: HingeStatus;
}

export interface PostureInputs {
  readonly width: number;
  readonly height: number;
  readonly hinge: HingeInfo | null;
  readonly axis: "vertical" | "horizontal" | null;
  readonly bounds: {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
  } | null;
  readonly override: "auto" | DevicePosture;
}

export interface PostureInfo {
  readonly posture: DevicePosture;
  readonly widthClass: "compact" | "medium" | "expanded";
  readonly heightClass: "compact" | "medium" | "expanded";
  readonly isDualPane: boolean;
  readonly hinge: HingeInfo | null;
  readonly hingeAxis: "vertical" | "horizontal" | null;
  readonly hingeBounds: {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
  } | null;
  readonly source: "simulator" | "native" | "heuristic" | "window";
}

export function widthClassFor(widthDp: number): PostureInfo["widthClass"] {
  if (widthDp < 600) {
    return "compact";
  }
  return widthDp < 840 ? "medium" : "expanded";
}

export function heightClassFor(heightDp: number): PostureInfo["heightClass"] {
  if (heightDp < 480) {
    return "compact";
  }
  return heightDp < 900 ? "medium" : "expanded";
}

export function derivePosture(inputs: PostureInputs): PostureInfo {
  const widthClass = widthClassFor(inputs.width);
  const heightClass = heightClassFor(inputs.height);

  if (inputs.override !== "auto") {
    return {
      posture: inputs.override,
      widthClass,
      heightClass,
      isDualPane: inputs.override !== "COMPACT",
      hinge: inputs.hinge,
      hingeAxis: inputs.axis,
      hingeBounds: inputs.bounds,
      source: "simulator",
    };
  }

  const partiallyOpen = inputs.hinge !== null && inputs.hinge.status === "partiallyOpen";

  if (partiallyOpen) {
    const axis: "vertical" | "horizontal" =
      inputs.axis ?? (inputs.width > inputs.height ? "horizontal" : "vertical");
    const source: PostureInfo["source"] = inputs.axis === null ? "heuristic" : "native";
    if (axis === "horizontal") {
      return {
        posture: "TABLETOP_MODE",
        widthClass,
        heightClass,
        isDualPane: true,
        hinge: inputs.hinge,
        hingeAxis: axis,
        hingeBounds: inputs.bounds,
        source,
      };
    }
    if (widthClass !== "compact") {
      return {
        posture: "BOOK_MODE",
        widthClass,
        heightClass,
        isDualPane: true,
        hinge: inputs.hinge,
        hingeAxis: axis,
        hingeBounds: inputs.bounds,
        source,
      };
    }
    return {
      posture: "COMPACT",
      widthClass,
      heightClass,
      isDualPane: false,
      hinge: inputs.hinge,
      hingeAxis: axis,
      hingeBounds: inputs.bounds,
      source,
    };
  }

  if (widthClass !== "compact") {
    return {
      posture: "FLAT_EXPANDED",
      widthClass,
      heightClass,
      isDualPane: true,
      hinge: inputs.hinge,
      hingeAxis: null,
      hingeBounds: null,
      source: "window",
    };
  }

  return {
    posture: "COMPACT",
    widthClass,
    heightClass,
    isDualPane: false,
    hinge: inputs.hinge,
    hingeAxis: null,
    hingeBounds: null,
    source: "window",
  };
}

export function deriveWindowPosture(widthDp: number): DevicePosture {
  return derivePosture({
    width: widthDp,
    height: 800,
    hinge: null,
    axis: null,
    bounds: null,
    override: "auto",
  }).posture;
}

export interface UseDevicePostureOptions {
  readonly override?: "auto" | DevicePosture;
  readonly hinge?: HingeInfo | null;
  readonly axis?: "vertical" | "horizontal" | null;
  readonly bounds?: PostureInputs["bounds"];
}

export function useDevicePosture(options?: UseDevicePostureOptions): PostureInfo {
  const viewport = useViewport();
  const storeOverride = usePostureOverrideStore((state) => state.override);
  const override = options?.override ?? storeOverride;
  return derivePosture({
    width: viewport.width,
    height: viewport.height,
    hinge: options?.hinge ?? null,
    axis: options?.axis ?? null,
    bounds: options?.bounds ?? null,
    override,
  });
}
