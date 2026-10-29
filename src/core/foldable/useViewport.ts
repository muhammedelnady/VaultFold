/**
 * useViewport — the ONLY place `useWindowDimensions` may
 * be called; non-negotiable 8 (enforced by lint).
 */
import { useWindowDimensions } from "react-native";

export interface Viewport {
  readonly width: number;
  readonly height: number;
}

export function useViewport(): Viewport {
  const { width, height } = useWindowDimensions();
  return { width, height };
}
