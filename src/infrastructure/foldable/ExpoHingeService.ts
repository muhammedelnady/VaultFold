/**
 * ExpoHingeService — infrastructure adapter wrapping official `expo-hinge`.
 */
import * as ExpoHinge from "expo-hinge";

import type { HingeChangeEvent, HingeService, HingeState } from "@domain/foldable/HingeService";

export class ExpoHingeService implements HingeService {
  isAvailable(): boolean {
    try {
      return ExpoHinge.isAvailable();
    } catch {
      return false;
    }
  }

  getHinge(): HingeState | null {
    try {
      const h = ExpoHinge.getHinge();
      if (!h) return null;
      return {
        angle: h.angle,
        status: h.status,
      };
    } catch {
      return null;
    }
  }

  addHingeListener(listener: (event: HingeChangeEvent) => void): { remove: () => void } {
    try {
      const sub = ExpoHinge.addHingeListener((e) => {
        listener({
          hinge: e.hinge
            ? {
                angle: e.hinge.angle,
                status: e.hinge.status,
              }
            : null,
        });
      });
      return {
        remove: () => sub.remove(),
      };
    } catch {
      return { remove: () => {} };
    }
  }
}
