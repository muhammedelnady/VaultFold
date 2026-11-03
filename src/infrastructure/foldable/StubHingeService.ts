/**
 * StubHingeService — test double for HingeService.
 */
import type { HingeChangeEvent, HingeService, HingeState } from "@domain/foldable/HingeService";

export class StubHingeService implements HingeService {
  private available: boolean = false;
  private currentHinge: HingeState | null = null;
  private listeners: Set<(event: HingeChangeEvent) => void> = new Set();

  constructor(available: boolean = false, initialHinge: HingeState | null = null) {
    this.available = available;
    this.currentHinge = initialHinge;
  }

  isAvailable(): boolean {
    return this.available;
  }

  getHinge(): HingeState | null {
    return this.currentHinge;
  }

  addHingeListener(listener: (event: HingeChangeEvent) => void): { remove: () => void } {
    this.listeners.add(listener);
    return {
      remove: () => {
        this.listeners.delete(listener);
      },
    };
  }

  setHinge(hinge: HingeState | null): void {
    this.currentHinge = hinge;
    for (const listener of this.listeners) {
      listener({ hinge });
    }
  }

  setAvailable(available: boolean): void {
    this.available = available;
  }
}
