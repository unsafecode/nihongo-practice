/**
 * Pure semantic-diversity check for a lesson's opaque visible-target keys
 * (Phase 2 Task 7, finding M3). It decides whether a list of
 * `data-visible-target-key` values collected from a rendered lesson's
 * `.lesson-exercise` cards satisfies the authoring contract's diversity
 * floor: at least `minUnique` distinct real visible targets, none reused
 * more than `maxReuse` times.
 *
 * It intentionally never re-derives "distinct" from an exercise id/variant
 * id (which is trivially unique by construction and would make the check
 * tautological — the very defect this replaces): the caller must supply the
 * keys already derived from each exercise's actual realized target
 * (`GeneratedExercise.visibleTargetKey`, opaque-hashed by
 * {@link opaqueTargetKey} before it ever reaches the DOM). This module is
 * pure and framework-free so both a fast unit fixture and the live e2e DOM
 * evidence exercise the exact same logic.
 */
export interface VisibleTargetDiversityResult {
  /** The number of distinct visible-target keys among the input. */
  readonly uniqueCount: number;
  /** Every key reused more than `maxReuse` times, in first-seen order. */
  readonly overusedKeys: readonly string[];
}

export function checkVisibleTargetDiversity(
  keys: readonly string[],
  maxReuse: number,
): VisibleTargetDiversityResult {
  const counts = new Map<string, number>();
  for (const key of keys) counts.set(key, (counts.get(key) ?? 0) + 1);
  const overusedKeys: string[] = [];
  for (const [key, count] of counts) {
    if (count > maxReuse) overusedKeys.push(key);
  }
  return { uniqueCount: counts.size, overusedKeys };
}
