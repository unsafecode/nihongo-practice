/**
 * The immutable, fully-assembled A2 release catalog (Phase 3 Task 7).
 *
 * This module deep-freezes the complete A2 level: all 59 Can-dos wired to
 * their lessons, the fifteen modules, the level and its checkpoint, and
 * every one of the 60 authored instructional/synthesis lessons with its
 * authored sentence variants. Unlike A1 (whose phonetic Module 1 needs a
 * separate non-phonetic view for the foundation-wrap validator), every A2
 * module is semantic — so there is only ever one catalog view here, ready
 * to hand straight to `validateFoundations`/`validateA2Release`.
 *
 * No aggregate counts are authored here; every total the tests assert is
 * derived from the frozen data.
 */

import { deepFreeze } from "../../foundations/deepFreeze";
import type {
  CheckpointDefinition,
  CourseLevel,
  FoundationCatalogs,
  SentenceVariant,
} from "../../foundations/types";
import {
  assembleA2FoundationCatalogs,
  computeAvailableContentByLesson,
  type A2BuiltLesson,
  type A2CumulativeAvailability,
} from "./a2LessonBuilders";
import { module1Lessons } from "../content/module01ConnectedConversation";
import { module2Lessons } from "../content/module02PlansInvitations";
import { module3Lessons } from "../content/module03ExperiencesNarratives";
import { module4Lessons } from "../content/module04ReasonsOpinions";
import { module5Lessons } from "../content/module05SequencingOngoing";
import { module6Lessons } from "../content/module06PermissionRequests";
import { module7Lessons } from "../content/module07NeighborhoodServices";
import { module8Lessons } from "../content/module08RestaurantProblems";
import { module9Lessons } from "../content/module09ShoppingReturns";
import { module10Lessons } from "../content/module10HealthAdvice";
import { module11Lessons } from "../content/module11WorkStudyMessages";
import { module12Lessons } from "../content/module12TravelReservations";
import { module13Lessons } from "../content/module13RelationshipsEvents";
import { module14Lessons } from "../content/module14PracticalTexts";
import { module15Lessons } from "../content/module15Synthesis";
import { A2_ALL_59_CANDO_IDS, buildA2CanDos } from "./canDos";
import { a2Level, a2Modules, a2Checkpoint } from "./checkpoint";
import { A2_CANONICAL_POSITIONS } from "../manifest";
import { a2CanDoDescriptorCopy } from "./canDos";
import { a2SharedCopy } from "./a2SemanticCatalog";
import { a1Checkpoint, A1_LEVEL_ID } from "../../a1/catalog/checkpoint";

// ---------------------------------------------------------------------------
// Every built lesson, in canonical module/position order.
// ---------------------------------------------------------------------------

const a2BuiltLessonsUnsorted: readonly A2BuiltLesson[] = [
  ...module1Lessons,
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
  ...module13Lessons,
  ...module14Lessons,
  ...module15Lessons,
];

/** Every built A2 lesson (all 60), sorted by canonical position — never
 * assumed to already be authored in that order. */
export const a2SemanticBuiltLessons: readonly A2BuiltLesson[] = [...a2BuiltLessonsUnsorted].sort(
  (a, b) => A2_CANONICAL_POSITIONS[a.recipe.id] - A2_CANONICAL_POSITIONS[b.recipe.id],
);

/** Every authored sentence variant across all 60 lessons. */
export const a2AllVariants: readonly SentenceVariant[] = a2SemanticBuiltLessons.flatMap(
  (built) => [...built.variants],
);

/** The complete, honest 59-entry Can-do set, each with real lessonIds/
 * contextIds derived from the actual authored lessons above. */
export const a2CanDosAuthored = buildA2CanDos(A2_ALL_59_CANDO_IDS, a2SemanticBuiltLessons);

/**
 * A cross-level reference view of the real A1 checkpoint: the same real,
 * frozen `id`/`level`/`minAcceptedTransferTargetsPerCanDo` A1's own
 * `validateA1Release` already validated in full, with `sampledCanDoIds`
 * emptied. A2's own level only *recommends* (never requires) this
 * checkpoint (`CourseLevel.recommendedPrerequisiteCheckpointId`), so
 * `validateFoundations`'s reference-integrity check must be able to resolve
 * the id — but A1's own 15 Can-dos (and the referents/contexts/senses they in
 * turn reference) are that level's own concern, already fully validated by
 * `validateA1Release`, and are never re-validated by pulling A1's entire
 * catalog into this A2-only assembly. Emptying `sampledCanDoIds` here keeps
 * the "Checkpoints → Can-dos" cross-check trivially satisfied (nothing to
 * resolve) without fabricating any A1 content this task does not own.
 */
const A1_CHECKPOINT_REFERENCE_ONLY: CheckpointDefinition = deepFreeze({
  ...a1Checkpoint,
  sampledCanDoIds: [],
});

/**
 * A cross-level reference view of the real A1 level: the same real, frozen
 * `id` A1's own `validateA1Release` already validated in full, with
 * `moduleIds`/`canDoIds` emptied and a dedicated, self-contained alignment
 * copy id (see `A2_LEVEL_COPY` below). `A1_CHECKPOINT_REFERENCE_ONLY` above
 * (level `"a1"`) must itself resolve to a real level id in this same
 * catalog's `levels` array — mirrors that stub's own "reference-only, never
 * fabricated content" contract exactly.
 */
const A1_LEVEL_REFERENCE_ONLY: CourseLevel = deepFreeze({
  id: A1_LEVEL_ID,
  alignmentCopyId: "a1-level-reference-only-alignment",
  moduleIds: [],
  canDoIds: [],
});

// ---------------------------------------------------------------------------
// The single frozen release catalog.
// ---------------------------------------------------------------------------

const semanticBase = assembleA2FoundationCatalogs({
  lessons: a2SemanticBuiltLessons.map((built) => built.recipe),
  variants: [...a2AllVariants],
  canDos: a2CanDosAuthored,
  modules: a2Modules,
  // The real A1 level object is included alongside `a2Level` for the SAME
  // reference-integrity reason `A1_CHECKPOINT_REFERENCE_ONLY` is included
  // in `checkpoints` below (never fabricated content — see its own
  // doc-comment above).
  levels: [A1_LEVEL_REFERENCE_ONLY, a2Level],
  // The A2 level's own `recommendedPrerequisiteCheckpointId` names the real
  // A1 checkpoint ("a1-checkpoint") — a genuine cross-level reference, not
  // just a bare string, so a real reference to it (see
  // `A1_CHECKPOINT_REFERENCE_ONLY` above) is included here too (alongside
  // `a2Checkpoint`) for `validateFoundations`'s own reference-integrity
  // check to resolve against. A2 still only *recommends*, never requires,
  // it — no lock/gate field exists anywhere in `CourseLevel`.
  checkpoints: [A1_CHECKPOINT_REFERENCE_ONLY, a2Checkpoint],
});

/**
 * The complete A2 level catalog: all fifteen modules, all fifty-nine
 * Can-dos, the level, its checkpoint, and all 60 lesson positions. This is
 * the catalog `validateFoundations`/`validateA2Release` run over.
 */
export const a2FoundationCatalogs: FoundationCatalogs = deepFreeze({ ...semanticBase });

/** The A2 level's own alignment-claim copy (never a certification/
 * certificate/equivalent claim — alignment/practice only), keyed by
 * `A2_ALIGNMENT_COPY_ID` (see `level.ts`). The one piece of level-level
 * copy this catalog owns directly, since A2 has no separate copy-gloss file
 * the way A1 does. */
const A2_LEVEL_COPY: { readonly en: Readonly<Record<string, string>>; readonly it: Readonly<Record<string, string>> } = deepFreeze({
  en: {
    "a2-level-a2-alignment":
      "A second step in everyday Japanese, aligned with the JF Standard and CEFR A2 descriptors.",
    "a1-level-reference-only-alignment":
      "A first foundation in everyday Japanese (see the A1 release for the full alignment claim).",
  },
  it: {
    "a2-level-a2-alignment":
      "Un secondo passo nel giapponese quotidiano, allineato agli standard JF e ai descrittori CEFR A2.",
    "a1-level-reference-only-alignment":
      "Una prima base di giapponese quotidiano (vedi la release A1 per l'intera dichiarazione di allineamento).",
  },
});

/** The aggregated bilingual A2 copy (shared + every lesson's own + Can-do
 * descriptors + level alignment). */
export const a2FoundationCopy: {
  readonly en: Readonly<Record<string, string>>;
  readonly it: Readonly<Record<string, string>>;
} = deepFreeze({
  en: {
    ...a2SharedCopy.en,
    ...a2CanDoDescriptorCopy.en,
    ...A2_LEVEL_COPY.en,
    ...Object.fromEntries(a2SemanticBuiltLessons.flatMap((built) => Object.entries(built.en))),
  },
  it: {
    ...a2SharedCopy.it,
    ...a2CanDoDescriptorCopy.it,
    ...A2_LEVEL_COPY.it,
    ...Object.fromEntries(a2SemanticBuiltLessons.flatMap((built) => Object.entries(built.it))),
  },
});

/**
 * The canonical cumulative introduced-content availability map, keyed by
 * lesson id, in canonical position order — directly usable as
 * `ValidateFoundationsInput.availableContentByLesson`.
 */
export const A2_AVAILABLE_CONTENT_BY_LESSON: Readonly<Record<string, A2CumulativeAvailability>> =
  computeAvailableContentByLesson(a2SemanticBuiltLessons, a2FoundationCatalogs);
