/**
 * A1 level assembly (§5, §8, §15) — the `CourseLevel`, its eleven
 * `FoundationModule`s, and the single level `CheckpointDefinition` (Task 16
 * containment: Base owns the phonetic module and the four Foundations
 * modules, so the canonical A1 level is the eleven retained modules only).
 *
 * The checkpoint (`a1-checkpoint`) samples every taught Can-do — the ten
 * module outcomes and the four capstone-scenario outcomes — and requires at
 * least eight accepted transfer targets per Can-do, well above each Can-do's own
 * minimum evidence rule. Evidence is therefore gathered through the four bounded
 * capstone scenarios (`capstones-1..4`), never inferred from lesson visits.
 *
 * Modules and level membership are derived from the canonical retained
 * manifest so the ordering, lesson lists and module ids stay in lock-step
 * with the routes the validator enforces.
 */

import { deepFreeze } from "../../foundations/deepFreeze";
import type {
  CanDoId,
  CheckpointDefinition,
  CourseLevel,
  FoundationModule,
  LessonId,
  ModuleId,
} from "../../foundations/types";
import {
  A1_RETAINED_MODULE_IDS,
  A1_RETAINED_LESSON_IDS_BY_MODULE,
  A1_CAPSTONE_LESSON_IDS,
} from "../manifest";
import {
  a1CanDosAuthored,
  A1_MODULE_CANDO_IDS,
  A1_SCENARIO_CANDO_IDS,
} from "./canDos";

/** @deprecated Use {@link A1_FOUNDATION_CANDO_IDS} from `canDos`. */
export { A1_EXPANDED_FOUNDATION_CANDO_IDS } from "./canDos";

/** The level's stable id. */
export const A1_LEVEL_ID = "a1" as const;

/** The level checkpoint's stable id. */
export const A1_CHECKPOINT_ID = "a1-checkpoint" as const;

/** Minimum accepted transfer targets the checkpoint demands for every Can-do. */
export const A1_CHECKPOINT_MIN_TRANSFER_TARGETS = 8;

/**
 * Which Can-do outcome(s) each retained module teaches, in module order.
 * Every id here is a `primaryCanDoId` of one of that module's lessons, so the
 * module→Can-do membership and the lesson→Can-do membership agree.
 */
const MODULE_CANDO_IDS: Readonly<Record<ModuleId, readonly CanDoId[]>> = {
  introductions: ["a1-can-do-identity", "a1-can-do-origins"],
  "essential-questions": ["a1-can-do-questions"],
  actions: ["a1-can-do-actions"],
  routines: ["a1-can-do-daily-life"],
  "past-negative": ["a1-can-do-daily-life"],
  places: ["a1-can-do-places"],
  people: ["a1-can-do-people"],
  descriptions: ["a1-can-do-descriptions"],
  shopping: ["a1-can-do-shopping"],
  "existence-needs": ["a1-can-do-existence"],
  capstones: [...A1_SCENARIO_CANDO_IDS],
};

/** The eleven A1 modules, in canonical order, with manifest-derived lessons. */
export const a1Modules: readonly FoundationModule[] = deepFreeze(
  A1_RETAINED_MODULE_IDS.map((moduleId, index): FoundationModule => {
    const canDoIds = MODULE_CANDO_IDS[moduleId];
    if (!canDoIds) {
      throw new Error(`checkpoint: no Can-do mapping authored for module ${moduleId}`);
    }
    return {
      id: moduleId,
      level: A1_LEVEL_ID,
      order: index + 1,
      canDoIds,
      lessonIds: [...A1_RETAINED_LESSON_IDS_BY_MODULE[moduleId]!],
    };
  }),
);

/** The A1 course level: all eleven modules, all fourteen Can-dos. */
export const a1Level: CourseLevel = deepFreeze({
  id: A1_LEVEL_ID,
  alignmentCopyId: "a1-level-a1-alignment",
  moduleIds: [...A1_RETAINED_MODULE_IDS],
  canDoIds: a1CanDosAuthored.map((canDo) => canDo.id),
});

/**
 * The level checkpoint. Samples all fourteen taught Can-dos (ten module
 * outcomes + four capstone scenarios); evidence is drawn from the four capstone
 * scenario lessons, which is why the scenario Can-dos and every module Can-do
 * appear together in `sampledCanDoIds`.
 */
export const a1Checkpoint: CheckpointDefinition = deepFreeze({
  id: A1_CHECKPOINT_ID,
  level: A1_LEVEL_ID,
  sampledCanDoIds: [...A1_MODULE_CANDO_IDS, ...A1_SCENARIO_CANDO_IDS],
  minAcceptedTransferTargetsPerCanDo: A1_CHECKPOINT_MIN_TRANSFER_TARGETS,
});

/** The capstone lesson ids whose bounded scenarios carry the checkpoint. */
export const A1_CHECKPOINT_SCENARIO_LESSON_IDS: readonly LessonId[] =
  A1_CAPSTONE_LESSON_IDS;

/**
 * @deprecated There is no more phonetic module to exclude from A1's own
 * level/module/checkpoint views — Base owns `sounds` entirely (Task 16). All
 * three aliases below are identical to their non-"NonPhonetic" counterparts;
 * kept only so `catalog.ts`'s deprecated `a1SemanticFoundationCatalogs` alias
 * (and any other existing importer) does not need a matching rename.
 */
export const a1SemanticModules: readonly FoundationModule[] = a1Modules;

/** @deprecated Identical to {@link a1Level}; see {@link a1SemanticModules}. */
export const a1LevelNonPhonetic: CourseLevel = a1Level;

/** @deprecated Identical to {@link a1Checkpoint}; see {@link a1SemanticModules}. */
export const a1CheckpointNonPhonetic: CheckpointDefinition = a1Checkpoint;
