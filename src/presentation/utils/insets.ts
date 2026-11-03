export interface SafeInsetsInput {
  readonly left: number;
  readonly right: number;
}

export interface HorizontalSafeInsets {
  readonly paddingStart: number;
  readonly paddingEnd: number;
}

/**
 * Calculates logical paddingStart and paddingEnd from raw safe area horizontal insets.
 * Handles RTL flipping so that physical left/right insets map to start/end correctly.
 * Caps excessive insets (e.g. simulated landscape device insets) to maxPadding to avoid
 * massive dead margin gaps on unfolded foldables and tablets.
 */
export function getHorizontalSafeInsets(
  insets: SafeInsetsInput,
  isRtl: boolean,
  minPadding = 0,
  maxPadding = 24,
): HorizontalSafeInsets {
  const rawStart = isRtl ? insets.right : insets.left;
  const rawEnd = isRtl ? insets.left : insets.right;

  return {
    paddingStart: Math.min(Math.max(rawStart, minPadding), Math.max(minPadding, maxPadding)),
    paddingEnd: Math.min(Math.max(rawEnd, minPadding), Math.max(minPadding, maxPadding)),
  };
}
