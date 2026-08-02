/**
 * Layout & Scroll Padding Constants for NorthPaw
 */
export const TAB_BAR_HEIGHT = 64;

/**
 * Bottom padding for top-level tab screens (with floating bottom tab bar)
 */
export function getTabScrollPadding(insetsBottom: number): number {
  return Math.max(insetsBottom, 12) + TAB_BAR_HEIGHT + 24;
}

/**
 * Bottom padding for pushed detail screens (without bottom tab bar)
 */
export function getDetailScrollPadding(insetsBottom: number): number {
  return Math.max(insetsBottom, 16) + 24;
}
