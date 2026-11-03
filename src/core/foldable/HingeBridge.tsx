/**
 * HingeBridge — connects the `HingeService` port (expo-hinge adapter) to the
 * live hinge store so `useDevicePosture` reacts to a *real* half-fold.
 *
 * expo-hinge reports angle + status but not the fold axis. The axis is
 * inferred from the current window: a wide window means the crease is
 * vertical (book / iPhone Duo side-by-side), a tall window means it is
 * horizontal (tabletop / flex). Renders nothing.
 */
import { useEffect, useState } from "react";

import type { HingeService } from "@domain/foldable/HingeService";

import { useHingeStore, type HingeAxis } from "./hingeStore";
import type { HingeInfo } from "./useDevicePosture";
import { useViewport } from "./useViewport";

export function inferHingeAxis(width: number, height: number): HingeAxis {
  return width > height ? "vertical" : "horizontal";
}

export interface HingeBridgeProps {
  readonly service: HingeService;
}

export function HingeBridge({ service }: HingeBridgeProps): null {
  const { width, height } = useViewport();
  const [hinge, setHinge] = useState<HingeInfo | null>(() =>
    service.isAvailable() ? service.getHinge() : null,
  );

  useEffect(() => {
    if (!service.isAvailable()) {
      return undefined;
    }
    const subscription = service.addHingeListener((event) => {
      setHinge(event.hinge);
    });
    return () => {
      subscription.remove();
    };
  }, [service]);

  useEffect(() => {
    useHingeStore.getState().setHinge(hinge, hinge ? inferHingeAxis(width, height) : null);
  }, [hinge, width, height]);

  useEffect(
    () => () => {
      useHingeStore.getState().setHinge(null, null);
    },
    [],
  );

  return null;
}
