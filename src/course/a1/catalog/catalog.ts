/**
 * The immutable, fully-assembled A1 release catalog (§6, §15).
 *
 * This module deep-freezes the complete A1 level: the fourteen semantic
 * Can-dos wired to their lessons, the twelve modules, the level and its
 * checkpoint, and every semantic (non-phonetic) instructional/synthesis lesson
 * with its authored sentence variants and recurrence-complete verb-use records.
 * The phonetic module (M1) is deliberately kept *out* of the validated
 * `FoundationCatalogs` — it carries no sentence variants — but its four lessons
 * still appear in `lessonPositions` and in the module/level membership so the
 * full 48-lesson route set is representable.
 *
 * Two `FoundationCatalogs` are exported:
 *   • {@link a1FoundationCatalogs} — the full level view (all 12 modules, 15
 *     Can-dos, 48 lesson positions) used by reporting and for structural
 *     inspection of the whole level.
 *   • {@link a1SemanticFoundationCatalogs} — the 44 non-phonetic lessons wired
 *     to the semantic modules / Can-dos / checkpoint, ready to hand straight to
 *     `validateFoundations` (whose transfer/diversity gates the phonetic lessons
 *     cannot meet).
 *
 * No aggregate counts are authored here; every total the tests assert is derived
 * from the frozen data.
 */

import { deepFreeze } from "../../foundations/deepFreeze";
import type {
  FoundationCatalogs,
  LessonPositionRecord,
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
import { a1CanDosAuthored, a1NonPhoneticCanDos } from "./canDos";
import {
  a1Level,
  a1Modules,
  a1Checkpoint,
  a1LevelNonPhonetic,
  a1SemanticModules,
  a1CheckpointNonPhonetic,
} from "./checkpoint";
import {
  A1_MODULE_IDS,
  A1_LESSON_IDS_BY_MODULE,
  A1_CANONICAL_POSITIONS,
} from "../manifest";
import { a1CopyEn } from "../copy/en";
import { a1CopyIt } from "../copy/it";

// ---------------------------------------------------------------------------
// Semantic (non-phonetic) lessons and their variants — modules 2-12.
// ---------------------------------------------------------------------------

/** Every built semantic lesson, in canonical module/position order. */
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

/** Every authored sentence variant across all semantic lessons. */
export const a1AllVariants: readonly SentenceVariant[] =
  a1SemanticBuiltLessons.flatMap((built) => [...built.variants]);

// The shared assembler wires the 44 semantic lessons, their variants, their
// canonical positions and the recurrence-complete verb records. We then layer
// the authored level/module/Can-do/checkpoint definitions on top.
const semanticBase = assembleA1FoundationCatalogs({
  lessons: a1SemanticBuiltLessons.map((built) => built.recipe),
  variants: [...a1AllVariants],
  verbUseRecords: a1ReleaseVerbUseRecords,
});

// ---------------------------------------------------------------------------
// Lesson positions — the phonetic module contributes positions only.
// ---------------------------------------------------------------------------

const phoneticPositions: readonly LessonPositionRecord[] =
  A1_LESSON_IDS_BY_MODULE["sounds"].map((lessonId) => ({
    lessonId,
    level: "a1",
    moduleId: "sounds",
    position: A1_CANONICAL_POSITIONS[lessonId],
  }));

/** All 48 lesson positions, ordered by canonical position. */
export const a1AllLessonPositions: readonly LessonPositionRecord[] = [
  ...phoneticPositions,
  ...semanticBase.lessonPositions,
].sort((a, b) => a.position - b.position);

// ---------------------------------------------------------------------------
// The two frozen release catalogs.
// ---------------------------------------------------------------------------

/**
 * The semantic (non-phonetic) release catalog: 44 lessons wired to the eleven
 * semantic modules, fourteen Can-dos, the semantic level view and the checkpoint
 * (sounds Can-do removed). This is the catalog `validateFoundations` runs over.
 */
export const a1SemanticFoundationCatalogs: FoundationCatalogs = deepFreeze({
  ...semanticBase,
  canDos: a1NonPhoneticCanDos,
  levels: [a1LevelNonPhonetic],
  modules: a1SemanticModules,
  checkpoints: [a1CheckpointNonPhonetic],
});

/**
 * The full A1 level catalog: all twelve modules, fifteen Can-dos, the level, its
 * checkpoint, and all 48 lesson positions (phonetic lessons present as positions
 * and module/level members only — they contribute no sentence variants).
 */
export const a1FoundationCatalogs: FoundationCatalogs = deepFreeze({
  ...semanticBase,
  canDos: a1CanDosAuthored,
  levels: [a1Level],
  modules: a1Modules,
  checkpoints: [a1Checkpoint],
  lessonPositions: a1AllLessonPositions,
});

/** The aggregated bilingual A1 copy (shared + phonetic + every lesson). */
export const a1FoundationCopy: {
  readonly en: Readonly<Record<string, string>>;
  readonly it: Readonly<Record<string, string>>;
} = deepFreeze({ en: a1CopyEn, it: a1CopyIt });

/** The canonical module order (re-exported for report/validator convenience). */
export const a1ModuleOrder: readonly string[] = [...A1_MODULE_IDS];
