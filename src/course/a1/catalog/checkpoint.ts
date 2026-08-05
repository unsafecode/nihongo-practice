/**
 * A1 level assembly (§5, §8, §15) — the `CourseLevel`, its twelve
 * `FoundationModule`s, and the single level `CheckpointDefinition`.
 *
 * The checkpoint (`a1-checkpoint`) samples every taught Can-do — the eleven
 * module outcomes and the four capstone-scenario outcomes — and requires at
 * least eight accepted transfer targets per Can-do, well above each Can-do's own
 * minimum evidence rule. Evidence is therefore gathered through the four bounded
 * capstone scenarios (`capstones-1..4`), never inferred from lesson visits.
 *
 * Modules and level membership are derived from the canonical manifest so the
 * ordering, lesson lists and module ids stay in lock-step with the routes the
 * validator enforces.
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
  A1_MODULE_IDS,
  A1_LESSON_IDS_BY_MODULE,
  A1_CAPSTONE_LESSON_IDS,
} from "../manifest";
import {
  a1CanDosAuthored,
  A1_MODULE_CANDO_IDS,
  A1_SCENARIO_CANDO_IDS,
} from "./canDos";

/**
 * Staged checkpoint membership for the four expanded Foundations Can-dos.
 * It is intentionally not merged into `a1Checkpoint.sampledCanDoIds` until
 * Task 5 promotes the expanded manifest and authored lessons together.
 */
export { A1_EXPANDED_FOUNDATION_CANDO_IDS } from "./canDos";

/** The level's stable id. */
export const A1_LEVEL_ID = "a1" as const;

/** The level checkpoint's stable id. */
export const A1_CHECKPOINT_ID = "a1-checkpoint" as const;

/** Minimum accepted transfer targets the checkpoint demands for every Can-do. */
export const A1_CHECKPOINT_MIN_TRANSFER_TARGETS = 8;

/**
 * Which Can-do outcome(s) each module teaches, in module order. Every id here
 * is a `primaryCanDoId` of one of that module's lessons, so the module→Can-do
 * membership and the lesson→Can-do membership agree.
 */
const MODULE_CANDO_IDS: Readonly<Record<ModuleId, readonly CanDoId[]>> = {
  sounds: ["a1-can-do-sounds"],
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

/** The twelve A1 modules, in canonical order, with manifest-derived lessons. */
export const a1Modules: readonly FoundationModule[] = deepFreeze(
  A1_MODULE_IDS.map((moduleId, index): FoundationModule => {
    const canDoIds = MODULE_CANDO_IDS[moduleId];
    if (!canDoIds) {
      throw new Error(`checkpoint: no Can-do mapping authored for module ${moduleId}`);
    }
    return {
      id: moduleId,
      level: A1_LEVEL_ID,
      order: index + 1,
      canDoIds,
      lessonIds: [...A1_LESSON_IDS_BY_MODULE[moduleId]],
    };
  }),
);

/** The A1 course level: all twelve modules, all fifteen Can-dos. */
export const a1Level: CourseLevel = deepFreeze({
  id: A1_LEVEL_ID,
  alignmentCopyId: "a1-level-a1-alignment",
  moduleIds: [...A1_MODULE_IDS],
  canDoIds: a1CanDosAuthored.map((canDo) => canDo.id),
});

/**
 * The level checkpoint. Samples all fifteen taught Can-dos (eleven module
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

// ---------------------------------------------------------------------------
// Non-phonetic views (for the foundation-wrap validation pass)
//
// The phonetic module has no sentence variants, so its lessons cannot satisfy
// the foundation validator's transfer-coverage / diversity gates. The
// foundation wrap therefore sees only the eleven semantic modules and their
// fourteen Can-dos; these derived views keep that subset perfectly consistent
// (module → Can-do, level → module/Can-do, checkpoint sample) with the full
// definitions above.
// ---------------------------------------------------------------------------

/** The eleven semantic modules (everything except `sounds`). */
export const a1SemanticModules: readonly FoundationModule[] = deepFreeze(
  a1Modules.filter((module) => module.id !== "sounds"),
);

/** The A1 level restricted to its semantic modules and Can-dos. */
export const a1LevelNonPhonetic: CourseLevel = deepFreeze({
  ...a1Level,
  moduleIds: a1Level.moduleIds.filter((id) => id !== "sounds"),
  canDoIds: a1Level.canDoIds.filter((id) => id !== "a1-can-do-sounds"),
});

/** The checkpoint restricted to the fourteen semantic Can-dos it samples. */
export const a1CheckpointNonPhonetic: CheckpointDefinition = deepFreeze({
  ...a1Checkpoint,
  sampledCanDoIds: a1Checkpoint.sampledCanDoIds.filter(
    (id) => id !== "a1-can-do-sounds",
  ),
});
