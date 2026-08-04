/**
 * A1 Can-do catalogue (§8) — the product-authored, JF/CEFR-aligned outcome
 * statements the level reports against.
 *
 * The stub `a1CanDos` in `shared.ts` fixes each Can-do's identity, domain,
 * descriptor copy and evidence rule, but carries empty `lessonIds`/`contextIds`
 * because the shared layer is authored before the modules exist. This module
 * closes that gap *from the real lessons*: `lessonIds` come from the authored
 * lesson→primary map (which every lesson's `primaryCanDoId` must agree with),
 * and `contextIds` are computed from the actual sentence variants those lessons
 * teach — never hand-invented. Each entry also records the alignment claim
 * explicitly (`sourceNote`) rather than implying a certification.
 *
 * Two views are exported:
 *   • `a1CanDosAuthored` — all fifteen Can-dos (the eleven module outcomes plus
 *     the four capstone-scenario outcomes) for the level/checkpoint/report.
 *   • `a1NonPhoneticCanDos` — the same set minus `a1-can-do-sounds`, for the
 *     foundation-wrap catalog whose transfer-coverage gate cannot see the
 *     phonetic module's non-sentence lessons.
 */

import { deepFreeze } from "../../foundations/deepFreeze";
import type { CanDo, ContextId, LessonId } from "../../foundations/types";
import { a1CanDos } from "./shared";
import type { A1BuiltLesson } from "./shared";
import { module2Lessons } from "./module02Introductions";
import { module3Lessons } from "./module03Questions";
import { module4Lessons } from "./module04Actions";
import { module5Lessons } from "./module05Routines";
import { module6Lessons } from "./module06TensePolarity";
import { module7Lessons } from "./module07Places";
import { module8Lessons } from "./module08People";
import { module9Lessons } from "./module09Descriptions";
import { module10Lessons } from "./module10Shopping";
import { module11Lessons } from "./module11ExistenceNeeds";
import { module12Lessons } from "./module12Capstones";

/** The phonetic module's lesson ids (no sentence variants; contexts stay []). */
export const A1_SOUND_LESSON_IDS: readonly LessonId[] = Object.freeze([
  "sounds-1",
  "sounds-2",
  "sounds-3",
  "sounds-4",
]);

/**
 * Authored Can-do → lesson map. Every non-phonetic lesson's `primaryCanDoId`
 * must name a Can-do whose list includes that lesson (validated by
 * `checkCanDos`), so this table is the single source of truth the modules were
 * authored against.
 */
const CANDO_LESSONS: Readonly<Record<string, readonly LessonId[]>> = {
  "a1-can-do-sounds": A1_SOUND_LESSON_IDS,
  "a1-can-do-identity": ["introductions-1", "introductions-2", "introductions-4"],
  "a1-can-do-origins": ["introductions-2"],
  "a1-can-do-questions": [
    "essential-questions-1",
    "essential-questions-2",
    "essential-questions-3",
    "essential-questions-4",
  ],
  "a1-can-do-actions": [
    "introductions-3",
    "actions-1",
    "actions-2",
    "actions-3",
    "actions-4",
  ],
  "a1-can-do-daily-life": [
    "routines-1",
    "routines-2",
    "routines-3",
    "routines-4",
    "past-negative-1",
    "past-negative-2",
    "past-negative-3",
    "past-negative-4",
  ],
  "a1-can-do-places": ["places-1", "places-2", "places-3", "places-4"],
  "a1-can-do-people": ["people-1", "people-2", "people-3", "people-4"],
  "a1-can-do-descriptions": [
    "descriptions-1",
    "descriptions-2",
    "descriptions-3",
    "descriptions-4",
  ],
  "a1-can-do-shopping": ["shopping-1", "shopping-2", "shopping-3", "shopping-4"],
  "a1-can-do-existence": [
    "existence-needs-1",
    "existence-needs-2",
    "existence-needs-3",
    "existence-needs-4",
  ],
  "a1-can-do-scenario-1": ["capstones-1"],
  "a1-can-do-scenario-2": ["capstones-2"],
  "a1-can-do-scenario-3": ["capstones-3"],
  "a1-can-do-scenario-4": ["capstones-4"],
};

// Every semantic (non-phonetic) built lesson, keyed by lesson id, so context
// coverage can be read straight from the variants each lesson actually teaches.
const semanticBuilt: readonly A1BuiltLesson[] = [
  ...module2Lessons,
  ...module3Lessons,
  ...module4Lessons,
  ...module5Lessons,
  ...module6Lessons,
  ...module7Lessons,
  ...module8Lessons,
  ...module9Lessons,
  ...module10Lessons,
  ...module11Lessons,
  ...module12Lessons,
];

const contextsByLesson = new Map<string, readonly ContextId[]>();
for (const built of semanticBuilt) {
  const contexts: ContextId[] = [];
  for (const variant of built.variants) {
    if (!contexts.includes(variant.contextId)) contexts.push(variant.contextId);
  }
  contexts.sort();
  contextsByLesson.set(built.recipe.id, contexts);
}

/** Union of the contexts taught across a Can-do's mapped lessons (sorted). */
function contextsForCanDo(lessonIds: readonly LessonId[]): readonly ContextId[] {
  const seen = new Set<ContextId>();
  for (const lessonId of lessonIds) {
    for (const contextId of contextsByLesson.get(lessonId) ?? []) {
      seen.add(contextId);
    }
  }
  return [...seen].sort();
}

/**
 * The fifteen authored Can-dos, in the canonical stub order, each enriched with
 * its lesson mapping, computed context coverage, and the JF/CEFR alignment note.
 */
export const a1CanDosAuthored: readonly CanDo[] = deepFreeze(
  a1CanDos.map((stub): CanDo => {
    const lessonIds = CANDO_LESSONS[stub.id];
    if (!lessonIds) {
      throw new Error(`canDos: no lesson mapping authored for ${stub.id}`);
    }
    return {
      ...stub,
      lessonIds,
      contextIds: contextsForCanDo(lessonIds),
      sourceNote: "product-authored-jf-cefr-aligned",
    };
  }),
);

/** Fast lookup by id. */
export const a1CanDoById: ReadonlyMap<string, CanDo> = new Map(
  a1CanDosAuthored.map((canDo) => [canDo.id, canDo]),
);

/**
 * The Can-dos exposed to the foundation-wrap catalog: every authored outcome
 * except `a1-can-do-sounds`, whose only lessons are phonetic and therefore have
 * no transfer variant to satisfy `checkCanDos`' transfer-coverage gate.
 */
export const a1NonPhoneticCanDos: readonly CanDo[] = deepFreeze(
  a1CanDosAuthored.filter((canDo) => canDo.id !== "a1-can-do-sounds"),
);

/** The eleven module (non-scenario) outcome ids, in catalogue order. */
export const A1_MODULE_CANDO_IDS: readonly string[] = Object.freeze(
  a1CanDosAuthored
    .map((canDo) => canDo.id)
    .filter((id) => !id.startsWith("a1-can-do-scenario-")),
);

/** The four capstone-scenario outcome ids, in catalogue order. */
export const A1_SCENARIO_CANDO_IDS: readonly string[] = Object.freeze([
  "a1-can-do-scenario-1",
  "a1-can-do-scenario-2",
  "a1-can-do-scenario-3",
  "a1-can-do-scenario-4",
]);
