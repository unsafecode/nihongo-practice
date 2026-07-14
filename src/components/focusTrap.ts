/**
 * Pure focus-trap helpers used by SettingsDrawer. Kept dependency-free
 * (no DOM) so the trap math is directly unit-testable with plain arrays
 * standing in for ordered focusable elements.
 */

export function isDismissKey(key: string): boolean {
  return key === "Escape";
}

export type TabDirection = "forward" | "backward";

/**
 * Computes the next index when Tab-trapping within `total` focusable
 * elements, wrapping past either end. Returns 0 when there is nothing to
 * cycle through, guarding callers against divide-by-zero.
 */
export function nextTrappedFocusIndex(
  currentIndex: number,
  total: number,
  direction: TabDirection,
): number {
  if (total <= 0) return 0;
  const delta = direction === "forward" ? 1 : -1;
  return (currentIndex + delta + total) % total;
}

/**
 * Given an ordered list of focusable elements inside a trap container and
 * the currently active one, decides where Tab/Shift+Tab should move focus
 * next, looping past the ends instead of escaping the container. Returns
 * -1 when there is nothing focusable to trap into.
 */
export function resolveTrapFocusIndex<T>(
  focusables: readonly T[],
  activeElement: T,
  shiftKey: boolean,
): number {
  const total = focusables.length;
  if (total === 0) return -1;
  const currentIndex = focusables.indexOf(activeElement);
  const safeCurrent = currentIndex === -1 ? 0 : currentIndex;
  return nextTrappedFocusIndex(
    safeCurrent,
    total,
    shiftKey ? "backward" : "forward",
  );
}
