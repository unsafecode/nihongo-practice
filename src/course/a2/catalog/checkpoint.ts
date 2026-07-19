/**
 * A2 level assembly (Phase 3 Task 7) — the `CourseLevel`, its fifteen
 * `FoundationModule`s, the level `CheckpointDefinition`, and the synthesis
 * integration map.
 *
 * Unlike A1 (whose phonetic Module 1 carries no sentence variants and needs
 * a separate non-phonetic view for the foundation-wrap validator), every one
 * of A2's fifteen modules is semantic — fourteen instructional modules plus
 * the single `a2-synthesis` capstone — so there is only ever one level/
 * module/checkpoint view here, never a split.
 *
 * The checkpoint (`a2-checkpoint`) samples all 59 taught Can-dos (15 grammar
 * + 40 topical + 4 capstone-scenario outcomes) and requires at least 3
 * accepted transfer targets per Can-do — exactly each Can-do's own
 * `checkpointEvidenceRule.minAcceptedTransferTargets` (see `canDos.ts`'s
 * `stub()`), never a stronger, hand-picked minimum. Evidence for the four
 * scenario Can-dos comes from the four `a2-synthesis` lessons; evidence for
 * the 15 grammar Can-dos and every topical Can-do comes from wherever that
 * Can-do's own transfer-flagged content actually lives (recipe support or
 * genuine unlabeled recurrence — see `forms/validateA2GrammarSpiral.ts`'s
 * `auditA2GrammarSpiralEvidence`). No certification claim is made anywhere
 * in this file — the checkpoint is alignment/practice evidence only, and A2
 * only *recommends* (never requires) the A1 checkpoint first.
 */

import { deepFreeze } from "../../foundations/deepFreeze";
import type {
  CanDoId,
  CheckpointDefinition,
  CourseLevel,
  FoundationModule,
  ModuleId,
} from "../../foundations/types";
import { A2_MODULE_IDS, A2_LESSON_IDS_BY_MODULE, A2_MANIFEST_SPEC } from "../manifest";
import { buildA2Level, A2_LEVEL_ID } from "./level";
import { A2_ALL_59_CANDO_IDS, A2_SCENARIO_CANDO_IDS } from "./canDos";
import { A2_GRAMMAR_SPIRAL } from "../forms/grammarSpiral";

/** The level checkpoint's stable id. */
export const A2_CHECKPOINT_ID = "a2-checkpoint" as const;

/** Minimum accepted transfer targets the checkpoint demands for every
 * Can-do — matches every registered Can-do's own
 * `checkpointEvidenceRule.minAcceptedTransferTargets` exactly (see
 * `canDos.ts`'s `stub()`), never a stronger, hand-picked minimum. */
export const A2_CHECKPOINT_MIN_TRANSFER_TARGETS = 3;

const SYNTHESIS_MODULE_ID: ModuleId = A2_MANIFEST_SPEC.synthesisModuleId;

/** The 14 instructional module ids (every module except the single
 * synthesis capstone), in canonical manifest order. */
export const A2_INSTRUCTIONAL_MODULE_IDS: readonly ModuleId[] = deepFreeze(
  A2_MODULE_IDS.filter((moduleId) => moduleId !== SYNTHESIS_MODULE_ID),
);

/**
 * Which Can-do outcome(s) each module teaches, derived from the exact
 * primary/support mapping every module's own content authors — never
 * hand-guessed. Each module's list is the union of every one of its four
 * lessons' `primaryCanDoId`/`supportingCanDoIds`, restricted to the ids that
 * module's own lessons FIRST introduce (grammar Can-dos already served by
 * an earlier module are not re-listed here — see each module's own
 * recipe/spec for the authoritative per-lesson mapping).
 */
const MODULE_CANDO_IDS: Readonly<Record<ModuleId, readonly CanDoId[]>> = {
  "connected-conversation": [
    "a2-cando-backchannel-followup",
    "a2-cando-connectors",
    "a2-cando-clarify-repeat",
    "a2-cando-recognize-plain-forms",
  ],
  "plans-invitations": [
    "a2-cando-intentions-plans",
    "a2-cando-invite-accept-decline",
    "a2-cando-arrange-meeting",
  ],
  "experiences-narratives": [
    "a2-cando-experience-takoto",
    "a2-cando-narrate-order",
    "a2-cando-ask-experience",
  ],
  "reasons-opinions": [
    "a2-cando-give-reasons",
    "a2-cando-reason-kara",
    "a2-cando-reason-node",
    "a2-cando-opinion-toomou",
    "a2-cando-agree-disagree",
  ],
  "sequencing-ongoing": ["a2-cando-sequence-te", "a2-cando-describe-now", "a2-cando-describe-ongoing", "a2-cando-ongoing-teiru", "a2-cando-morning-routine"],
  "permission-requests": [
    "a2-cando-permission-temoii",
    "a2-cando-prohibition-tewaikenai",
    "a2-cando-request-tekudasai",
    "a2-cando-negative-request",
  ],
  "neighborhood-services": [
    "a2-cando-possibility",
    "a2-cando-can-cannot",
    "a2-cando-ask-directions",
    "a2-cando-explain-facility",
  ],
  "restaurant-problems": [
    "a2-cando-order-food",
    "a2-cando-special-request",
    "a2-cando-report-problem",
    "a2-cando-pay-handle-problem",
  ],
  "shopping-returns": ["a2-cando-compare", "a2-cando-ask-price-decide", "a2-cando-return-exchange"],
  "health-advice": [
    "a2-cando-describe-symptoms",
    "a2-cando-advice-tahouga",
    "a2-cando-get-better",
    "a2-cando-clinic-appointment",
  ],
  "work-study-messages": [
    "a2-cando-message-late-absent",
    "a2-cando-ask-colleague",
    "a2-cando-report-progress",
    "a2-cando-reply-confirm",
  ],
  "travel-reservations": [
    "a2-cando-make-reservation",
    "a2-cando-travel-schedule",
    "a2-cando-travel-problem",
    "a2-cando-change-cancel",
  ],
  "relationships-events": [
    "a2-cando-family-relations",
    "a2-cando-give-receive",
    "a2-cando-events-celebrations",
    "a2-cando-choose-gift",
  ],
  "practical-texts": [
    "a2-cando-read-schedule",
    "a2-cando-read-notice",
    "a2-cando-read-reply-message",
    "a2-cando-fill-form",
  ],
  "a2-synthesis": [...A2_SCENARIO_CANDO_IDS],
};

/** The fifteen A2 modules, in canonical order, with manifest-derived lessons. */
export const a2Modules: readonly FoundationModule[] = deepFreeze(
  A2_MODULE_IDS.map((moduleId, index): FoundationModule => {
    const canDoIds = MODULE_CANDO_IDS[moduleId];
    if (!canDoIds) {
      throw new Error(`checkpoint: no Can-do mapping authored for module ${moduleId}`);
    }
    return {
      id: moduleId,
      level: A2_LEVEL_ID,
      order: index + 1,
      canDoIds,
      lessonIds: [...A2_LESSON_IDS_BY_MODULE[moduleId]],
    };
  }),
);

/** The A2 course level: all fifteen modules, all fifty-nine Can-dos. */
export const a2Level: CourseLevel = buildA2Level(A2_ALL_59_CANDO_IDS as readonly CanDoId[]);

/**
 * The level checkpoint. Samples all fifty-nine taught Can-dos (15 grammar +
 * 40 topical + 4 capstone-scenario outcomes); evidence for the scenario
 * Can-dos is drawn from the four `a2-synthesis` lessons, evidence for every
 * other Can-do from wherever its own transfer content genuinely lives —
 * never inferred from mere lesson presence.
 */
export const a2Checkpoint: CheckpointDefinition = deepFreeze({
  id: A2_CHECKPOINT_ID,
  level: A2_LEVEL_ID,
  sampledCanDoIds: [...A2_ALL_59_CANDO_IDS],
  minAcceptedTransferTargetsPerCanDo: A2_CHECKPOINT_MIN_TRANSFER_TARGETS,
});

/**
 * The synthesis integration map: for each of the 14 instructional modules,
 * the exact grammar-spiral form ids (never Can-do ids — a module can teach a
 * topical Can-do with no dedicated grammar-spiral row) that genuinely recur
 * at one of the four `a2-synthesis` lessons, derived directly from
 * `A2_GRAMMAR_SPIRAL`'s own frozen `recurrenceLessonIds`. Covers exactly the
 * 14 instructional module ids — `a2-synthesis` never lists itself (a
 * synthesis lesson cannot be its own prior-module integration point).
 */
function synthesisFormIdsIntroducedBy(moduleId: ModuleId): readonly string[] {
  const introducedHere = A2_GRAMMAR_SPIRAL.filter(
    (row) => row.introLessonId.startsWith(`${moduleId}-`),
  );
  return introducedHere
    .filter((row) => row.recurrenceLessonIds.some((lessonId) => lessonId.startsWith("a2-synthesis-")))
    .map((row) => row.id)
    .sort();
}

export const A2_SYNTHESIS_INTEGRATION: Readonly<Record<ModuleId, readonly string[]>> = deepFreeze(
  Object.fromEntries(
    A2_INSTRUCTIONAL_MODULE_IDS.map((moduleId) => [moduleId, synthesisFormIdsIntroducedBy(moduleId)]),
  ),
);
