/**
 * A2 level architecture (Phase 3 Task 1) — the level's stable id, its
 * alignment copy id, and the pure `CourseLevel` builder.
 *
 * There is no A2 module/Can-do catalog yet, so `buildA2Level` takes the
 * authored Can-do id list as a parameter (later tasks call it with the real
 * catalog) rather than reading one itself; `moduleIds` is the one piece
 * already locked, sourced directly from the frozen manifest so level
 * membership can never drift from the routes the (later) release validator
 * enforces.
 *
 * A2 only *recommends* the A1 checkpoint (`CourseLevel.recommendedPrerequisiteCheckpointId`
 * is optional, soft-advisory metadata per `../../foundations/types`) — it
 * never locks/gates entry into A2 on it, so the returned shape carries no
 * separate required/locked field.
 */

import { deepFreeze } from "../../foundations/deepFreeze";
import type { CanDoId, CourseLevel } from "../../foundations/types";
import { A2_MODULE_IDS } from "../manifest";

/** The level's stable id. */
export const A2_LEVEL_ID = "a2" as const;

/** The level's alignment claim copy id (locale-independent, ASCII only). */
export const A2_ALIGNMENT_COPY_ID = "a2-level-a2-alignment" as const;

/** The A1 checkpoint A2 recommends (but does not require) before starting. */
export const A2_RECOMMENDED_PREREQUISITE_CHECKPOINT_ID = "a1-checkpoint" as const;

/**
 * Build the A2 `CourseLevel`. Pure — same `canDoIds` input always produces a
 * deep-equal, independently-owned output — and deep-frozen, so a caller
 * mutating its input array after the call cannot affect the returned level.
 */
export function buildA2Level(canDoIds: readonly CanDoId[]): CourseLevel {
  return deepFreeze({
    id: A2_LEVEL_ID,
    alignmentCopyId: A2_ALIGNMENT_COPY_ID,
    moduleIds: [...A2_MODULE_IDS],
    canDoIds: [...canDoIds],
    recommendedPrerequisiteCheckpointId:
      A2_RECOMMENDED_PREREQUISITE_CHECKPOINT_ID,
  });
}
