/**
 * Hook for adaptive navigation transitions between compact and expanded postures.
 *
 * Debounces width-class changes to prevent routing thrashing during display rotation/folding.
 * Uses `resolveNavigationTransition` to push or replace routes cleanly.
 */
import { type Href, useLocalSearchParams, usePathname, useRouter } from "expo-router";
import { useEffect, useRef } from "react";

import { resolveNavigationTransition } from "./navigationResolver";
import { useDevicePosture, type DevicePosture } from "./useDevicePosture";

export interface UseAdaptiveNavigationOptions {
  readonly activeCoinId?: string | null;
  readonly debounceMs?: number;
  readonly postureOverride?: "auto" | DevicePosture;
}

export function useAdaptiveNavigation(options?: UseAdaptiveNavigationOptions): void {
  const router = useRouter();
  const pathname = usePathname();
  const params = useLocalSearchParams<Record<string, string | undefined>>();
  const posture = useDevicePosture(
    options?.postureOverride ? { override: options.postureOverride } : undefined,
  );
  const currentWidthClass = posture.widthClass;
  const previousWidthClass = useRef(currentWidthClass);

  useEffect(() => {
    if (previousWidthClass.current === currentWidthClass) {
      return;
    }

    const delay = options?.debounceMs ?? 150;

    const timer = setTimeout(() => {
      previousWidthClass.current = currentWidthClass;

      const action = resolveNavigationTransition(
        {
          pathname,
          params: params as Record<string, string | undefined>,
        },
        currentWidthClass,
        options?.activeCoinId ?? params["coinId"] ?? null,
      );

      if (action.action === "replace" && action.targetPath) {
        router.replace({
          pathname: action.targetPath,
          params: action.targetParams,
        } as Href);
      } else if (action.action === "push" && action.targetPath) {
        router.push(action.targetPath as Href);
      }
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [currentWidthClass, pathname, params, router, options?.activeCoinId, options?.debounceMs]);
}
