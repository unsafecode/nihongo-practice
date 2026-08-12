/**
 * The immutable, fully-assembled A1 release catalog (§6, §15; Task 16
 * containment).
 *
 * Base now owns the phonetic module and the four Foundations modules
 * (`sounds`, `sentence-foundations`, `topic-questions`, `polite-verbs`,
 * `time-movement` — rehomed to `src/course/base`), so canonical A1 is exactly
 * eleven modules / forty-four scenario-and-synthesis lessons: `introductions`,
 * `essential-questions`, `actions`, `routines`, `past-negative`, `places`,
 * `people`, `descriptions`, `shopping`, `existence-needs`, `capstones`. There
 * is no more phonetic/semantic split to make — every retained A1 module has
 * real sentence variants — so {@link a1FoundationCatalogs} and
 * {@link a1SemanticFoundationCatalogs} are the same forty-four-lesson catalog;
 * both names are kept so existing call sites (the release validator, the
 * curriculum builders, the lesson-exercise model) do not have to agree on one
 * import.
 *
 * No aggregate counts are authored here; every total the tests assert is derived
 * from the frozen data.
 */

import { deepFreeze } from "../../foundations/deepFreeze";
import type {
  FoundationCatalogs,
  SentenceFamily,
  SentenceVariant,
} from "../../foundations/types";
import {
  assembleA1FoundationCatalogs,
  type A1BuiltLesson,
} from "./shared";
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
import { a1ReleaseVerbUseRecords } from "./recurrence";
import { a1CanDosAuthored } from "./canDos";
import { a1Level, a1Modules, a1Checkpoint } from "./checkpoint";
import { A1_RETAINED_MODULE_IDS } from "../manifest";
import { a1CopyEn } from "../copy/en";
import { a1CopyIt } from "../copy/it";

// ---------------------------------------------------------------------------
// The forty-four retained scenario/synthesis lessons and their variants.
// ---------------------------------------------------------------------------

/** Every built retained A1 lesson, in canonical module/position order. */
export const a1SemanticBuiltLessons: readonly A1BuiltLesson[] = [
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

/** Every authored sentence variant across all retained lessons. */
export const a1AllVariants: readonly SentenceVariant[] =
  a1SemanticBuiltLessons.flatMap((built) => [...built.variants]);

// The shared assembler wires the 44 retained lessons, their variants, their
// canonical positions and the recurrence-complete verb records. We then layer
// the authored level/module/Can-do/checkpoint definitions on top.
const semanticBase = assembleA1FoundationCatalogs({
  lessons: a1SemanticBuiltLessons.map((built) => built.recipe),
  variants: [...a1AllVariants],
  verbUseRecords: a1ReleaseVerbUseRecords,
});

/** All 44 lesson positions, ordered by canonical position. */
export const a1AllLessonPositions = semanticBase.lessonPositions;

// ---------------------------------------------------------------------------
// Sentence-family projection onto the retained Can-do set.
// ---------------------------------------------------------------------------
//
// `a1SentenceFamilies` is the shared authored pool: a family such as
// `a1-family-topic-copular` legitimately serves both retained A1 outcomes
// (`a1-can-do-identity`) and outcomes Base now owns
// (`a1-can-do-sentence-foundations`). A level catalog may only reference
// Can-dos it publishes, so the pool is *projected* — never rewritten at the
// authoring source — onto A1's retained Can-do set: each family keeps its
// authored identity, slots, axes, rule and required concepts, and drops only
// the Can-do ids that moved to Base with their modules. Families left with no
// A1 Can-do at all (the Foundations-only `a1-family-foundation-*` pool) drop
// out entirely; the assertion below fails closed if any retained lesson still
// needs one of them.

const retainedCanDoIds = new Set(a1CanDosAuthored.map(({ id }) => id));
const semanticValueById = new Map(
  semanticBase.semanticValues.map((value) => [value.id, value]),
);

const projectedSentenceFamilies: readonly SentenceFamily[] = semanticBase
  .sentenceFamilies
  .map((family) => ({
    ...family,
    canDoIds: family.canDoIds.filter((canDoId) => retainedCanDoIds.has(canDoId)),
  }))
  .filter((family) => family.canDoIds.length > 0);

// The same projection applies to learning-target senses. `a1-sense-go-bare`,
// `a1-sense-rest-bare`, `a1-sense-return-bare` and `a1-sense-return-location`
// are the dictionary/bare-form senses the rehomed `polite-verbs` and
// `time-movement` modules teach. Retained A1 realizes none of them, so they
// carry no practice context here and would be indistinguishable from their
// polite counterparts (`conflated-sense-context`) purely because their lessons
// left. Keeping only the senses retained variants genuinely realize is the
// truthful catalog — and the sense-conflation gate stays fully in force over
// everything A1 still teaches.
const retainedSenseIds = new Set(
  a1AllVariants.flatMap((variant) =>
    Object.values(variant.slotValues)
      .map((valueId) => semanticValueById.get(valueId)?.senseId)
      .filter((senseId): senseId is string => senseId !== undefined),
  ),
);

const projectedLearningTargetSenses = semanticBase.learningTargetSenses.filter(
  (sense) => retainedSenseIds.has(sense.id),
);

// A predicate-sense value is meaningless without its sense, so the same
// projection drops the values that point at a rehomed sense. Values without a
// `senseId` (nouns, times, quantities, locations …) are untouched.
const projectedSemanticValues = semanticBase.semanticValues.filter(
  (value) => value.senseId === undefined || retainedSenseIds.has(value.senseId),
);

const projectedFamilyIds = new Set(projectedSentenceFamilies.map(({ id }) => id));
const orphanedFamilyIds = [
  ...new Set(
    a1AllVariants
      .map((variant) => variant.sentenceFamilyId)
      .filter((familyId) => !projectedFamilyIds.has(familyId)),
  ),
].sort();
if (orphanedFamilyIds.length > 0) {
  throw new Error(
    `a1 catalog: retained variants use families with no retained Can-do: ${orphanedFamilyIds.join(", ")}`,
  );
}

// ---------------------------------------------------------------------------
// The frozen release catalog.
// ---------------------------------------------------------------------------

/**
 * The canonical A1 release catalog: eleven modules, fourteen Can-dos (ten
 * module outcomes + four capstone-scenario outcomes), the level, its
 * checkpoint, and all 44 lesson positions. This is the catalog
 * `validateFoundations` runs over.
 */
export const a1FoundationCatalogs: FoundationCatalogs = deepFreeze({
  ...semanticBase,
  sentenceFamilies: projectedSentenceFamilies,
  learningTargetSenses: projectedLearningTargetSenses,
  semanticValues: projectedSemanticValues,
  canDos: a1CanDosAuthored,
  levels: [a1Level],
  modules: a1Modules,
  checkpoints: [a1Checkpoint],
});

/**
 * @deprecated Identical to {@link a1FoundationCatalogs}. Base's rehoming of
 * the phonetic module removed the phonetic/semantic split this name used to
 * mark; kept so existing importers (the release validator, the curriculum
 * view-model builders) do not need to agree on one name.
 */
export const a1SemanticFoundationCatalogs: FoundationCatalogs =
  a1FoundationCatalogs;

/** The aggregated bilingual A1 copy (shared + every retained lesson). */
export const a1FoundationCopy: {
  readonly en: Readonly<Record<string, string>>;
  readonly it: Readonly<Record<string, string>>;
} = deepFreeze({ en: a1CopyEn, it: a1CopyIt });

/** The canonical module order (re-exported for report/validator convenience). */
export const a1ModuleOrder: readonly string[] = [...A1_RETAINED_MODULE_IDS];
