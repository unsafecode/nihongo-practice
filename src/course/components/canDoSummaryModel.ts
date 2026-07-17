import type { CanDoEvidence } from "../progress/progress";

/**
 * Minimal structural shape the Can-do summary model needs from a catalog
 * entry. A real `CanDo` (see ../foundations/types) satisfies this directly —
 * `a1CanDosAuthored.map(...)` needs no cast — while tests can still build
 * tiny synthetic fixtures.
 */
export interface CanDoSummaryOutline {
  readonly id: string;
  readonly descriptorCopyId: string;
}

/**
 * The four honest evidence tiers a Can-do can show on Course Home (design
 * spec §8/§17, Phase 2 Task 6). Never a pass/fail/mastery verdict — only
 * what evidence has actually been recorded:
 *
 * - `not-started`: no evidence recorded at all.
 * - `visited`: at least one contributing lesson was opened.
 * - `practiced`: at least one contributing lesson's required exercises were
 *   fully attempted at least once.
 * - `demonstrated`: at least one transfer exercise contributing to this
 *   Can-do was accepted, or the Can-do was sampled by a checkpoint attempt
 *   (`checkpointAttemptIds`) — the strongest evidence tier this app records.
 */
export type CanDoEvidenceTier = "not-started" | "visited" | "practiced" | "demonstrated";

export interface CanDoSummaryItem {
  readonly canDoId: string;
  readonly descriptorCopyId: string;
  readonly tier: CanDoEvidenceTier;
}

export interface CanDoSummaryModel {
  /** In the given catalog order (never re-sorted). */
  readonly items: readonly CanDoSummaryItem[];
  readonly totalCount: number;
  readonly demonstratedCount: number;
}

function tierFor(record: CanDoEvidence | undefined): CanDoEvidenceTier {
  if (!record) return "not-started";
  if (record.acceptedTransferExerciseIds.length > 0 || record.checkpointAttemptIds.length > 0) {
    return "demonstrated";
  }
  if (record.practicedLessonIds.length > 0) return "practiced";
  if (record.visitedLessonIds.length > 0) return "visited";
  return "not-started";
}

/**
 * Pure, deterministic Can-do summary view-model (design spec §8/§17). Folds
 * the level's own `canDoEvidence` map against the given Can-do catalog,
 * never inventing evidence for a Can-do the map doesn't mention and never
 * downgrading a stronger tier because a weaker field happens to be empty
 * (e.g. a checkpoint-sampled Can-do with no individually-accepted transfer
 * exercise is still `demonstrated`).
 */
export function buildCanDoSummaryModel<C extends CanDoSummaryOutline>(
  canDos: readonly C[],
  canDoEvidence: Readonly<Record<string, CanDoEvidence>>,
): CanDoSummaryModel {
  const items: CanDoSummaryItem[] = canDos.map((canDo) => ({
    canDoId: canDo.id,
    descriptorCopyId: canDo.descriptorCopyId,
    tier: tierFor(canDoEvidence[canDo.id]),
  }));

  return {
    items,
    totalCount: items.length,
    demonstratedCount: items.filter((item) => item.tier === "demonstrated").length,
  };
}
