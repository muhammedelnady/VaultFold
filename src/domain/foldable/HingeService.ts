/**
 * HingeService port (domain/foldable/HingeService.ts).
 *
 * Provides device hinge capabilities, real-time angle and status diagnostics,
 * and event subscription. Note: Hinge status/angle is strictly used for
 * interactions and diagnostics, never for driving layout (which follows Window Size Classes).
 */
export type HingeStatus = "closed" | "partiallyOpen" | "fullyOpen" | "unknown";

export interface HingeState {
  readonly angle: number;
  readonly status: HingeStatus;
}

export interface HingeChangeEvent {
  readonly hinge: HingeState | null;
}

export interface HingeService {
  readonly isAvailable: () => boolean;
  readonly getHinge: () => HingeState | null;
  readonly addHingeListener: (listener: (event: HingeChangeEvent) => void) => {
    remove: () => void;
  };
}
