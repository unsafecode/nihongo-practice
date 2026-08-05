/**
 * Pure, deterministic `Da ripassare` review queue operations (design spec §10.4,
 * §11.1-§11.3; Slice C plan Task 3, steps 3-4).
 *
 * The queue is intentionally lightweight: a non-accepted valid attempt upserts a
 * single lightweight entry keyed by `lessonId:exerciseDefinitionId`, repeated
 * mistakes increment rather than duplicate it, an accepted review-mode attempt
 * resolves it, and a later mistake reopens it. There are deliberately no
 * intervals, due dates, ease factors, streak multipliers, or hidden mastery
 * scores — only a mistake count, the last-mistake timestamp, and the assessed
 * target IDs the learner should revisit.
 *
 * Every function here is a total function of its inputs: no `Date`, no
 * randomness, no locale- or iteration-order dependence. Entries carry only
 * semantic IDs (never answer strings), so the queue is locale independent and
 * safe to persist verbatim inside `CourseProgressV3`.
 */

import type { CourseProgressV3, ReviewQueueEntry } from "./progress";

/** A single non-accepted, valid exercise attempt to fold into the queue. */
export interface ReviewMistake {
  readonly lessonId: string;
  readonly exerciseDefinitionId: string;
  readonly targetConceptIds: readonly string[];
  readonly targetLexemeIds: readonly string[];
  /** ISO timestamp of the mistake, supplied by the caller so this stays pure. */
  readonly at: string;
}

/**
 * The stable review key derived from the lesson and exercise definition (plan
 * Task 3 step 3). Exercise definition IDs are globally unique, so this pair is a
 * stable, de-duplicating identity: repeated mistakes on the same exercise upsert
 * the same entry rather than appending a duplicate.
 */
export function reviewKeyFor(lessonId: string, exerciseDefinitionId: string): string {
  return `${lessonId}:${exerciseDefinitionId}`;
}

/**
 * Canonical queue order (spec §10.4): most recent mistake first, ties broken by
 * review key ascending so identical timestamps never reorder unpredictably.
 * ISO-8601 strings sort lexicographically in chronological order, so no date
 * parsing is required and the comparison stays deterministic.
 */
function byRecencyThenKey(left: ReviewQueueEntry, right: ReviewQueueEntry): number {
  if (left.lastMistakeAt !== right.lastMistakeAt) {
    return left.lastMistakeAt < right.lastMistakeAt ? 1 : -1;
  }
  if (left.reviewKey !== right.reviewKey) {
    return left.reviewKey < right.reviewKey ? -1 : 1;
  }
  return 0;
}

/** A stable, most-recent-first copy of a queue; never mutates the input. */
export function orderedReviewQueue(
  queue: readonly ReviewQueueEntry[],
): ReviewQueueEntry[] {
  return [...queue].sort(byRecencyThenKey);
}

/**
 * Upsert one mistake into the queue: a fresh exercise gets a new entry with
 * `mistakeCount` 1; a repeat increments the existing entry's count and refreshes
 * its last-mistake timestamp and assessed targets. Returns a new, canonically
 * ordered array — the input is never mutated.
 */
export function upsertReviewMistake(
  queue: readonly ReviewQueueEntry[],
  mistake: ReviewMistake,
): ReviewQueueEntry[] {
  const reviewKey = reviewKeyFor(mistake.lessonId, mistake.exerciseDefinitionId);
  const existing = queue.find((entry) => entry.reviewKey === reviewKey);
  const upserted: ReviewQueueEntry = {
    reviewKey,
    lessonId: mistake.lessonId,
    exerciseDefinitionId: mistake.exerciseDefinitionId,
    targetConceptIds: [...mistake.targetConceptIds],
    targetLexemeIds: [...mistake.targetLexemeIds],
    mistakeCount: (existing?.mistakeCount ?? 0) + 1,
    lastMistakeAt: mistake.at,
  };
  const others = queue.filter((entry) => entry.reviewKey !== reviewKey);
  return orderedReviewQueue([...others, upserted]);
}

/**
 * Resolve (remove) the entry with `reviewKey`. A no-op for an absent key so
 * resolving a never-missed or already-resolved exercise is safe and idempotent.
 */
export function resolveReviewEntry(
  queue: readonly ReviewQueueEntry[],
  reviewKey: string,
): ReviewQueueEntry[] {
  return queue.filter((entry) => entry.reviewKey !== reviewKey);
}

/** Whether an active review entry still exists for a lesson (consolidation gate). */
export function lessonHasOpenReview(
  queue: readonly ReviewQueueEntry[],
  lessonId: string,
): boolean {
  return queue.some((entry) => entry.lessonId === lessonId);
}

/**
 * Reconciles a bare review queue + orphan list against the catalog's current
 * review keys (spec §10.4, §11.3) — the container-agnostic core of
 * `reconcileReviewQueue`, reused directly for `LevelProgress` (v4) as well as
 * `CourseProgressV3`. Any entry whose lesson/exercise the catalog no longer
 * recognises is removed from the active queue and preserved in
 * `orphanedReviewKeys` — obsolete metadata is never silently dropped, and it
 * stays excluded from the active queue until an explicit catalog alias
 * resolves it. Pre-existing orphan keys are retained in order, newly orphaned
 * keys are appended in queue order, deduplicated. `changed` is `false` (and
 * the returned arrays are the same references) when nothing needed
 * reconciling, so callers can avoid needless churn.
 */
export function reconcileReviewQueueEntries(
  reviewQueue: readonly ReviewQueueEntry[],
  orphanedReviewKeys: readonly string[],
  knownReviewKeys: ReadonlySet<string>,
): {
  reviewQueue: ReviewQueueEntry[];
  orphanedReviewKeys: string[];
  changed: boolean;
} {
  const dedupe = (keys: readonly string[]): string[] => {
    const seen = new Set<string>();
    return keys.filter((key) => {
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };
  const active: ReviewQueueEntry[] = [];
  const newlyOrphaned: string[] = [];
  for (const entry of reviewQueue) {
    if (knownReviewKeys.has(entry.reviewKey)) {
      active.push(entry);
    } else {
      newlyOrphaned.push(entry.reviewKey);
    }
  }
  const normalizedOrphanedReviewKeys = dedupe(orphanedReviewKeys);
  const existingOrphansChanged =
    normalizedOrphanedReviewKeys.length !== orphanedReviewKeys.length;
  if (newlyOrphaned.length === 0) {
    if (!existingOrphansChanged) {
      return {
        reviewQueue: reviewQueue as ReviewQueueEntry[],
        orphanedReviewKeys: orphanedReviewKeys as string[],
        changed: false,
      };
    }
    return {
      reviewQueue: active,
      orphanedReviewKeys: normalizedOrphanedReviewKeys,
      changed: true,
    };
  }

  const merged = dedupe([...normalizedOrphanedReviewKeys, ...newlyOrphaned]);
  return { reviewQueue: active, orphanedReviewKeys: merged, changed: true };
}

/**
 * Reconcile the queue against the catalog's current review keys (spec §10.4,
 * §11.3): any entry whose lesson/exercise the catalog no longer recognises is
 * removed from the active queue and preserved in `orphanedReviewKeys` — obsolete
 * metadata is never silently dropped, and it stays excluded from the active
 * queue until an explicit catalog alias resolves it. Pre-existing orphan keys
 * are retained in order, newly orphaned keys are appended in queue order, and
 * the whole operation is deduplicating and idempotent. Returns the same
 * reference when nothing needs reconciling so callers avoid needless churn.
 */
export function reconcileReviewQueue(
  progress: CourseProgressV3,
  knownReviewKeys: ReadonlySet<string>,
): CourseProgressV3 {
  const result = reconcileReviewQueueEntries(
    progress.reviewQueue,
    progress.orphanedReviewKeys,
    knownReviewKeys,
  );
  if (!result.changed) return progress;
  return {
    ...progress,
    reviewQueue: result.reviewQueue,
    orphanedReviewKeys: result.orphanedReviewKeys,
  };
}
