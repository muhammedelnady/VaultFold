/**
 * Adaptive navigation resolution specification and pure router state resolver.
 *
 * Resolves desired navigation state between compact (single-pane stack)
 * and expanded (two-pane master-detail) displays.
 */
export type WidthClass = "compact" | "medium" | "expanded";

export interface NavigationRouteState {
  readonly pathname: string;
  readonly params: Record<string, string | undefined>;
}

export interface NavigationTransitionAction {
  readonly action: "none" | "push" | "replace" | "pop";
  readonly targetPath?: string;
  readonly targetParams?: Record<string, string | undefined>;
}

/**
 * Pure transition resolver:
 * - If transitioning to compact width class while viewing a selected coin in two-pane mode
 *   (pathname is "/market" or "/(tabs)/market" with a coin selected):
 *   We push or open the standalone detail route `/market/${coinId}`.
 * - If transitioning to expanded/medium width class while on standalone `/market/[coinId]`:
 *   We replace with `/market?coinId=${coinId}` and pop the detail stack so the detail
 *   pane seamlessly lives side-by-side without stacked duplicates.
 * - In all other cases: preserve current route.
 */
export function resolveNavigationTransition(
  current: NavigationRouteState,
  newWidthClass: WidthClass,
  activeSelectedCoinId?: string | null,
): NavigationTransitionAction {
  const isCoinDetailRoute =
    current.pathname.startsWith("/market/") && current.pathname !== "/market";
  const isMarketListRoute = current.pathname === "/market" || current.pathname === "/(tabs)/market";

  if (newWidthClass === "compact") {
    // When shrinking from expanded to compact:
    // If we're on the market list route and user had a coin actively selected in two-pane,
    // push to the detail screen so selection context is retained.
    if (isMarketListRoute && activeSelectedCoinId) {
      return {
        action: "push",
        targetPath: `/market/${activeSelectedCoinId}`,
      };
    }
  } else if (isCoinDetailRoute) {
    // When expanding to medium or expanded:
    // If we're currently on the pushed detail route `/market/[coinId]`:
    // Transition back to the master-detail list with coinId param in-place.
    const coinId = current.params["coinId"] ?? activeSelectedCoinId ?? undefined;
    return {
      action: "replace",
      targetPath: "/(tabs)/market",
      targetParams: coinId ? { coinId } : undefined,
    };
  }

  return { action: "none" };
}
