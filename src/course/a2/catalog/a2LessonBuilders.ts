/**
 * A2 lesson authoring + builders (Phase 3 Task 4).
 *
 * The A2 counterpart of `a1/catalog/a1LessonBuilders.ts`: turns compact
 * per-line specs into frozen, validated M1-M4 lesson content by configuring
 * the shared, level-agnostic `instructionalLessonKit` with A2's own
 * choices — roles/referents, round exercise kinds, selection policy,
 * scenario copy, the no-Japanese-scanning variant builder (`a2Variant`), and
 * the recipe validator (`defineA2Lesson`, which enforces A2's *range*
 * depth contract — 8-12 models, 8-12 exercises — rather than A1's exact
 * 8/10). Also owns the `FoundationCatalogs` assembly helper
 * (`assembleA2FoundationCatalogs`), the real kanji-exposure wiring
 * (`a2KanjiExposureIdsForLesson`), and cumulative introduced-content
 * derivation (`computeAvailableContentByLesson`) the aggregate validation
 * test feeds to `validateFoundations`'s `availableContentByLesson` input.
 */

import { deepFreeze } from "../../foundations/deepFreeze";
import {
  buildInstructionalLesson,
  buildLessonPositionRecords,
  KIT_AFFIRMATIVE_PRESENT_POLITE,
  KIT_AFFIRMATIVE_PRESENT_POLITE_QUESTION,
  scenarioCopyId,
  toFoundationLessonDefinition,
  translationCopyId,
  verbUseRecord,
  withLaterUses,
  type InstructionalLessonKitConfig,
  type KitLessonRecipeCandidate,
} from "../../foundations/instructionalLessonKit";
import { realizeVariant, type RealizeVariantCatalogs } from "../../foundations/realizeFamily";
import type {
  CanDo,
  CheckpointDefinition,
  CourseLevel,
  FormSelection,
  FoundationCatalogs,
  FoundationModule,
  LessonPositionRecord,
  LessonPracticeDefinition,
  PedagogicalUse,
  SentenceVariant,
  VerbLaterUse,
  VerbUseRecord,
} from "../../foundations/types";
import { A2_CANONICAL_POSITIONS } from "../manifest";
import { A2_KANJI_EXPOSURES } from "../kanji/a2KanjiCatalog";
import {
  a2Contexts,
  a2LearningTargetSenses,
  a2PersonRoles,
  a2Referents,
  a2Scenario,
  a2SemanticValues,
  a2SentenceFamilies,
  type Bilingual,
} from "./a2SemanticCatalog";

// ---------------------------------------------------------------------------
// Structured authoring error
// ---------------------------------------------------------------------------

export type A2AuthoringErrorCode =
  | "model-count"
  | "duplicate-id"
  | "exercise-count"
  | "duplicate-target-ref"
  | "synthesis-new-content"
  | "japanese-literal"
  | "forbidden-field"
  | "form-interrogative-conflict";

/** A structured, catchable A2 authoring failure with a stable code. */
export class A2AuthoringError extends Error {
  readonly code: A2AuthoringErrorCode;
  readonly detail?: string;

  constructor(code: A2AuthoringErrorCode, message: string, detail?: string) {
    super(message);
    this.name = "A2AuthoringError";
    this.code = code;
    this.detail = detail;
    Object.setPrototypeOf(this, A2AuthoringError.prototype);
  }
}

// ---------------------------------------------------------------------------
// Recursive no-answer / no-Japanese scan (mirrors a1/authoring.ts's guard —
// the same content policy, independently enforced for A2 recipes/variants)
// ---------------------------------------------------------------------------

const FORBIDDEN_FIELD_NAMES: ReadonlySet<string> = new Set([
  "answer",
  "canonical",
  "canonicalAnswer",
  "canonicalJapanese",
  "jp",
  "romaji",
  "visibleTargetKey",
]);

const JAPANESE_PATTERN =
  /[\u3000-\u303f\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff01-\uff60\uff66-\uff9f]/;

function assertNoForbiddenContent(value: unknown, path = "$"): void {
  if (value === null || value === undefined) return;

  if (typeof value === "string") {
    if (JAPANESE_PATTERN.test(value)) {
      throw new A2AuthoringError(
        "japanese-literal",
        `Japanese literal is not allowed outside semantic values (at ${path}).`,
        path,
      );
    }
    return;
  }

  if (typeof value !== "object") return;

  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoForbiddenContent(item, `${path}[${index}]`));
    return;
  }

  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (FORBIDDEN_FIELD_NAMES.has(key)) {
      throw new A2AuthoringError(
        "forbidden-field",
        `Forbidden answer/canonical field "${key}" is not allowed (at ${path}).`,
        `${path}.${key}`,
      );
    }
    assertNoForbiddenContent(child, `${path}.${key}`);
  }
}

function assertUniqueIds(
  ids: readonly string[],
  code: A2AuthoringErrorCode,
  label: string,
): void {
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) {
      throw new A2AuthoringError(code, `Duplicate ${label} id "${id}".`, id);
    }
    seen.add(id);
  }
}

// ---------------------------------------------------------------------------
// Variant builder (variant + its bilingual copy in one honest step)
// ---------------------------------------------------------------------------

export interface A2VariantSpec {
  readonly id: string;
  readonly family: string;
  readonly context: string;
  readonly speakerRole: string;
  readonly addresseeRole: string | null;
  readonly subjectReferent: string | null;
  /** "vocative" (Task 4 final spec-fix "natural vocative") renders the
   * subject referent as a direct-address vocative (name + さん + 、) instead
   * of a topic-marked subject — see `DiscourseFrame.subjectRealization`. */
  readonly subjectRealization: "explicit" | "omitted" | "vocative";
  readonly slots: Readonly<Record<string, string>>;
  readonly interrogative?: boolean;
  /** Explicit polarity/tense/mood override. Mutually exclusive with
   * `interrogative: true` — {@link a2Variant} throws if both are supplied. */
  readonly form?: FormSelection;
  readonly use: PedagogicalUse;
  readonly translation: Bilingual;
  readonly scenario: Bilingual;
}

export interface A2BuiltVariant {
  readonly variant: SentenceVariant;
  readonly en: Readonly<Record<string, string>>;
  readonly it: Readonly<Record<string, string>>;
}

/**
 * Expand a compact spec into a frozen, no-Japanese-scanned `SentenceVariant`
 * plus its EN/IT copy entries. The A2 equivalent of `a1Variant` — same
 * mutual-exclusion contract, same `${id}-translation`/`${id}-scenario` copy
 * convention (via the shared kit's helpers).
 */
export function a2Variant(spec: A2VariantSpec): A2BuiltVariant {
  if (spec.form !== undefined && spec.interrogative === true) {
    throw new A2AuthoringError(
      "form-interrogative-conflict",
      `a2Variant "${spec.id}": mutually exclusive inputs — an explicit ` +
        "`form` and `interrogative: true` were both provided. Set the " +
        "form's own `interrogative` flag instead of also passing " +
        "`interrogative: true` at the spec level.",
      spec.id,
    );
  }

  const tuple = {
    id: spec.id,
    familyId: spec.family,
    discourse: {
      speakerRoleId: spec.speakerRole,
      addresseeRoleId: spec.addresseeRole,
      subjectReferentId: spec.subjectReferent,
      subjectRealization: spec.subjectRealization,
      scenarioNoteCopyId: scenarioCopyId(spec.id),
    },
    contextId: spec.context,
    slotValues: spec.slots,
    form:
      spec.form ??
      (spec.interrogative ? KIT_AFFIRMATIVE_PRESENT_POLITE_QUESTION : KIT_AFFIRMATIVE_PRESENT_POLITE),
    pedagogicalUse: spec.use,
  };
  assertNoForbiddenContent(tuple, "variant");

  const variant: SentenceVariant = deepFreeze({
    id: tuple.id,
    sentenceFamilyId: tuple.familyId,
    discourse: tuple.discourse,
    contextId: tuple.contextId,
    slotValues: { ...tuple.slotValues },
    form: tuple.form,
    pedagogicalUse: tuple.pedagogicalUse,
  });

  return {
    variant,
    en: {
      [translationCopyId(spec.id)]: spec.translation.en,
      [scenarioCopyId(spec.id)]: spec.scenario.en,
    },
    it: {
      [translationCopyId(spec.id)]: spec.translation.it,
      [scenarioCopyId(spec.id)]: spec.scenario.it,
    },
  };
}

// ---------------------------------------------------------------------------
// Lesson recipe (A2's own depth contract: 8-12 models/exercises)
// ---------------------------------------------------------------------------

/** Every instructional/synthesis A2 lesson declares 8-12 models (not A1's
 * fixed 8) — author exactly 8 unless a Can-do genuinely needs more. */
export const A2_INSTRUCTIONAL_MODEL_COUNT_RANGE: readonly [number, number] = [8, 12];
/** The two practice rounds together select 8-12 exercises (target 10: 5+5). */
export const A2_EXERCISE_COUNT_RANGE: readonly [number, number] = [8, 12];

/**
 * The honest, non-default `FormSelection` constants for M4's spec-fix
 * ("form metadata"): every invariant-family variant whose baked Japanese is
 * actually plain/negative/past/past-negative must carry the matching
 * `FormSelection`, never silently default to
 * `KIT_AFFIRMATIVE_PRESENT_POLITE`. `A2_AFFIRMATIVE_PAST_POLITE` (past
 * でした/かったです register) is reused for M4's own past-tense polite
 * invariant content (reason-node, several connector/clarify values) —
 * mirrors A1's own locally-declared `A1_AFFIRMATIVE_PAST_POLITE`; the kit
 * itself only ships the present-tense constants shared by every level.
 */
export const A2_AFFIRMATIVE_PAST_POLITE: FormSelection = deepFreeze({
  polarity: "affirmative",
  tense: "past",
  formality: "polite",
} as const);
export const A2_NEGATIVE_PRESENT_POLITE: FormSelection = deepFreeze({
  polarity: "negative",
  tense: "present",
  formality: "polite",
} as const);
export const A2_NEGATIVE_PAST_POLITE: FormSelection = deepFreeze({
  polarity: "negative",
  tense: "past",
  formality: "polite",
} as const);
/** Plain-register forms — `a2-family-plain-recognition`'s entire purpose is
 * teaching these four, so every one of its variants must carry
 * `formality: "plain"`, never the polite default. */
export const A2_AFFIRMATIVE_PRESENT_PLAIN: FormSelection = deepFreeze({
  polarity: "affirmative",
  tense: "present",
  formality: "plain",
} as const);
export const A2_NEGATIVE_PRESENT_PLAIN: FormSelection = deepFreeze({
  polarity: "negative",
  tense: "present",
  formality: "plain",
} as const);
export const A2_AFFIRMATIVE_PAST_PLAIN: FormSelection = deepFreeze({
  polarity: "affirmative",
  tense: "past",
  formality: "plain",
} as const);
export const A2_NEGATIVE_PAST_PLAIN: FormSelection = deepFreeze({
  polarity: "negative",
  tense: "past",
  formality: "plain",
} as const);

/**
 * A depth-validated A2 lesson recipe. Structurally identical to A1's
 * `A1LessonRecipe` plus `kanjiExposureIds` — the real, automatically-wired
 * contextual-kanji exposure ids scheduled at this lesson (never hand-typed;
 * see {@link a2KanjiExposureIdsForLesson}).
 */
export interface A2LessonRecipe {
  readonly id: string;
  readonly moduleId: string;
  readonly order: 1 | 2 | 3 | 4;
  readonly contract: "instructional" | "synthesis";
  readonly primaryCanDoId: string;
  readonly supportingCanDoIds: readonly string[];
  readonly modelVariantIds: readonly string[];
  readonly guidedVariantIds: readonly [string, string];
  readonly spokenVariantId: string;
  readonly practice: LessonPracticeDefinition;
  readonly diversityConstraints: KitLessonRecipeCandidate["diversityConstraints"];
  readonly introducedConceptIds: readonly string[];
  readonly introducedSenseIds: readonly string[];
  readonly kanjiExposureIds: readonly string[];
}

/** {@link A2LessonRecipe} minus `kanjiExposureIds` — what `defineA2Lesson`
 * (which only ever sees the kit's lesson-id-scoped candidate) can validate
 * and freeze; `buildA2InstructionalLesson` adds the real kanji wiring after. */
export type A2LessonRecipeWithoutKanji = Omit<A2LessonRecipe, "kanjiExposureIds">;

/**
 * Validate and deep-freeze an instructional/synthesis A2 lesson recipe
 * candidate: 8-12 models (inclusive), unique model ids, unique round
 * candidate ids, an 8-12 total exercise count across both rounds, and — for
 * a synthesis lesson — no newly introduced concept/sense.
 */
export function defineA2Lesson(
  candidate: KitLessonRecipeCandidate,
): A2LessonRecipeWithoutKanji {
  assertNoForbiddenContent(candidate, "lesson");

  const modelCount = candidate.modelVariantIds.length;
  const [minModels, maxModels] = A2_INSTRUCTIONAL_MODEL_COUNT_RANGE;
  if (modelCount < minModels || modelCount > maxModels) {
    throw new A2AuthoringError(
      "model-count",
      `Lesson "${candidate.id}" must have ${minModels}-${maxModels} models, has ${modelCount}.`,
      candidate.id,
    );
  }
  assertUniqueIds(candidate.modelVariantIds, "duplicate-id", "model variant");
  assertUniqueIds(
    candidate.practice.roundOne.candidateVariantIds,
    "duplicate-target-ref",
    "round-one candidate variant",
  );
  assertUniqueIds(
    candidate.practice.roundTwo.candidateVariantIds,
    "duplicate-target-ref",
    "round-two candidate variant",
  );

  const totalExercises =
    candidate.practice.roundOne.targetCount + candidate.practice.roundTwo.targetCount;
  const [minExercises, maxExercises] = A2_EXERCISE_COUNT_RANGE;
  if (totalExercises < minExercises || totalExercises > maxExercises) {
    throw new A2AuthoringError(
      "exercise-count",
      `Lesson "${candidate.id}" must select ${minExercises}-${maxExercises} total exercises across both rounds, has ${totalExercises}.`,
      candidate.id,
    );
  }

  if (
    candidate.contract === "synthesis" &&
    (candidate.introducedConceptIds.length > 0 || candidate.introducedSenseIds.length > 0)
  ) {
    throw new A2AuthoringError(
      "synthesis-new-content",
      `Synthesis lesson "${candidate.id}" must not introduce new concepts or senses.`,
      candidate.id,
    );
  }

  return deepFreeze(candidate);
}

// ---------------------------------------------------------------------------
// Instructional-lesson builder (kit config + kanji wiring)
// ---------------------------------------------------------------------------

export interface A2LineSpec {
  readonly id: string;
  readonly family: string;
  readonly context: string;
  readonly subjectReferent: string | null;
  /** "vocative" (Task 4 final spec-fix "natural vocative") renders the
   * subject referent as a direct-address vocative (name + さん + 、) instead
   * of a topic-marked subject — see `DiscourseFrame.subjectRealization`. */
  readonly subjectRealization: "explicit" | "omitted" | "vocative";
  readonly slots: Readonly<Record<string, string>>;
  readonly interrogative?: boolean;
  readonly form?: FormSelection;
  readonly translation: Bilingual;
  readonly speakerRole?: string;
  readonly addresseeRole?: string | null;
}

export interface A2InstructionalLessonInput {
  readonly id: string;
  readonly moduleId: string;
  readonly order: 1 | 2 | 3 | 4;
  readonly contract?: "instructional" | "synthesis";
  readonly primaryCanDoId: string;
  readonly supportingCanDoIds: readonly string[];
  readonly introducedConceptIds: readonly string[];
  readonly introducedSenseIds: readonly string[];
  readonly models: readonly A2LineSpec[];
  readonly transfers: readonly A2LineSpec[];
}

export interface A2BuiltLesson {
  readonly recipe: A2LessonRecipe;
  readonly variants: readonly SentenceVariant[];
  readonly en: Readonly<Record<string, string>>;
  readonly it: Readonly<Record<string, string>>;
}

const A2_ROUND_ONE_KINDS = ["tile-ordering", "choice", "completion"] as const;
const A2_ROUND_TWO_KINDS = ["constrained-construction", "completion", "tile-ordering"] as const;

/** Referent → its person-role, derived from the frozen A2 referent catalog. */
const A2_REFERENT_ROLE: Readonly<Record<string, string>> = Object.freeze(
  Object.fromEntries(a2Referents.map((r) => [r.id, r.personRoleId])),
);

/** Referents that are concrete, animate, named people who can voice a line —
 * everyone except the learner's own self-referent. */
const A2_VOICEABLE_REFERENTS: ReadonlySet<string> = new Set([
  "a2-referent-emi",
  "a2-referent-sora",
  "a2-referent-teacher",
  "a2-referent-colleague",
  "a2-referent-friend",
  "a2-referent-clerk",
]);

/**
 * Referent → its subject-slot semantic value (M5 spec-fix, Phase 3 Task 5
 * quality pass): every M1-M8 module content file (`module01Connected
 * Conversation.ts` .. `module08RestaurantProblems.ts`) used to author its
 * own byte-identical local `subjectReferentValueId` function + table —
 * eight duplicated copies of the same mapping. This is the single, deep-
 * frozen source of truth every module now imports instead of
 * hand-duplicating; `a2-referent-clerk` (added for the I2 spec-fix, "natural
 * clerk-vocative address") lives here alongside the six pre-existing
 * referents.
 */
const A2_SUBJECT_REFERENT_VALUE_IDS: Readonly<Record<string, string>> = deepFreeze({
  "a2-referent-friend": "a2-value-friend-subject",
  "a2-referent-emi": "a2-value-emi",
  "a2-referent-sora": "a2-value-sora",
  "a2-referent-colleague": "a2-value-colleague-subject",
  "a2-referent-teacher": "a2-value-teacher-subject",
  "a2-referent-self": "a2-value-watashi",
  "a2-referent-clerk": "a2-value-clerk-subject",
});

/** Resolve a referent id to its subject-slot semantic value id. Fails closed
 * (throws) on an unknown referent — a programming error in the calling
 * lesson content, never a learner-facing failure — instead of silently
 * returning `undefined`. */
export function a2SubjectReferentValueId(referentId: string): string {
  const valueId = A2_SUBJECT_REFERENT_VALUE_IDS[referentId];
  if (!valueId) {
    throw new Error(`a2SubjectReferentValueId: no subject value mapped for referent "${referentId}"`);
  }
  return valueId;
}

const A2_INSTRUCTIONAL_KIT_CONFIG: InstructionalLessonKitConfig<A2LessonRecipeWithoutKanji> = {
  defaultSpeakerRoleId: "a2-role-learner",
  defaultAddresseeRoleId: "a2-role-teacher",
  referentPersonRoleById: A2_REFERENT_ROLE,
  voiceableReferentIds: A2_VOICEABLE_REFERENTS,
  scenarioCopy: a2Scenario,
  buildVariant: a2Variant,
  modelCountRange: A2_INSTRUCTIONAL_MODEL_COUNT_RANGE,
  minFamilies: 1,
  exerciseCountRange: A2_EXERCISE_COUNT_RANGE,
  roundTargetCount: 5,
  roundOneExerciseKinds: A2_ROUND_ONE_KINDS,
  roundTwoExerciseKinds: A2_ROUND_TWO_KINDS,
  selectionPolicyId: "a2-selection-default",
  defineLesson: defineA2Lesson,
};

/** Every real kanji exposure id scheduled at `lessonId`, queried directly
 * from the frozen `A2_KANJI_EXPOSURES` catalog — never hand-invented. */
export function a2KanjiExposureIdsForLesson(lessonId: string): readonly string[] {
  return A2_KANJI_EXPOSURES.filter((exposure) => exposure.lessonId === lessonId)
    .map((exposure) => exposure.id)
    .sort();
}

/**
 * Expand an instructional lesson's models and transfers into a validated
 * {@link A2LessonRecipe} (via {@link defineA2Lesson}, then automatically
 * wired with this lesson's real `kanjiExposureIds`), its frozen variants,
 * and the merged EN/IT translation+scenario copy. Delegates every
 * level-agnostic assembly step to the shared
 * `instructionalLessonKit.buildInstructionalLesson`.
 */
export function buildA2InstructionalLesson(
  input: A2InstructionalLessonInput,
): A2BuiltLesson {
  const built = buildInstructionalLesson(A2_INSTRUCTIONAL_KIT_CONFIG, input);
  const recipe: A2LessonRecipe = deepFreeze({
    ...built.recipe,
    kanjiExposureIds: a2KanjiExposureIdsForLesson(input.id),
  });
  return { recipe, variants: built.variants, en: built.en, it: built.it };
}

// ---------------------------------------------------------------------------
// Foundation-catalog assembly
// ---------------------------------------------------------------------------

export interface AssembleA2CatalogsInput {
  /** Instructional lesson recipes to expose to the builder. */
  readonly lessons: readonly A2LessonRecipe[];
  /** Every authored sentence variant referenced by the lessons. */
  readonly variants: readonly SentenceVariant[];
  /** Enriched Can-dos (via `canDos.ts`'s `buildA2CanDos`), supplied by the
   * caller once lessons exist — optional so this assembly step itself has
   * no circular dependency on the Can-do layer. Defaults to `[]`. */
  readonly canDos?: readonly CanDo[];
  /** Productive verb-use records (module-local; later reuse may be pending). */
  readonly verbUseRecords?: readonly VerbUseRecord[];
  /** Module records the caller wants `validateFoundations`'s integrity stage
   * to resolve `lesson.moduleId`/`module.lessonIds`/`module.canDoIds`
   * against — optional (defaults to `[]`) for the same reason `canDos` is:
   * per-module unit tests need no module registry at all, while the Task 4
   * aggregate validation test supplies the real M1-M4 module records. */
  readonly modules?: readonly FoundationModule[];
  /** Course-level records for `validateFoundations`'s integrity stage —
   * optional (defaults to `[]`); only the aggregate validation needs one. */
  readonly levels?: readonly CourseLevel[];
  /** Checkpoint records sampling Can-dos for `validateFoundations`'s Can-do
   * stage (§8) — optional (defaults to `[]`); only the aggregate validation
   * needs a real (even if synthetic/interim) checkpoint. */
  readonly checkpoints?: readonly CheckpointDefinition[];
}

/**
 * Build a `FoundationCatalogs` from the shared A2 catalogs plus a set of
 * instructional lessons and their variants, ready for `buildLessonViewModel`,
 * `realizeVariant`, `selectVariants`, `generateFamilyExercise`, and
 * `validateFoundations`. Mirrors `assembleA1FoundationCatalogs` exactly,
 * delegating recipe→`FoundationLessonDefinition` conversion and lesson-
 * position derivation to the shared kit helpers.
 */
export function assembleA2FoundationCatalogs(
  input: AssembleA2CatalogsInput,
): FoundationCatalogs {
  const variantById = new Map(input.variants.map((v) => [v.id, v]));
  const lessons = input.lessons.map((recipe) =>
    toFoundationLessonDefinition(recipe, "a2", variantById),
  );
  const lessonPositions: LessonPositionRecord[] = buildLessonPositionRecords(
    input.lessons,
    "a2",
    A2_CANONICAL_POSITIONS,
  );
  return {
    levels: input.levels ?? [],
    modules: input.modules ?? [],
    checkpoints: input.checkpoints ?? [],
    canDos: input.canDos ?? [],
    contexts: a2Contexts,
    personRoles: a2PersonRoles,
    referents: a2Referents,
    learningTargetSenses: a2LearningTargetSenses,
    semanticValues: a2SemanticValues,
    sentenceFamilies: a2SentenceFamilies,
    sentenceVariants: input.variants,
    lessons,
    lessonPositions,
    verbUseRecords: input.verbUseRecords ?? [],
  };
}

// ---------------------------------------------------------------------------
// Cumulative introduced-content availability (canonical position order)
// ---------------------------------------------------------------------------

export interface A2CumulativeAvailability {
  readonly conceptIds: readonly string[];
  readonly senseIds: readonly string[];
  readonly semanticValueIds: readonly string[];
  readonly forms: readonly string[];
}

/**
 * Compute, for every lesson in `lessonsInCanonicalOrder` (the caller's own
 * responsibility to sort by canonical position first — this function never
 * reorders), the cumulative concept/sense/semantic-value/form availability
 * introduced by that lesson's own models and every earlier lesson's models.
 * Directly usable as `ValidateFoundationsInput.availableContentByLesson`.
 * Mirrors `validateFoundations.ts`'s own per-lesson `analyzeLesson` model-
 * introduction derivation, just accumulated across lessons instead of reset
 * per lesson.
 */
export function computeAvailableContentByLesson(
  lessonsInCanonicalOrder: readonly A2BuiltLesson[],
  catalogs: FoundationCatalogs,
): Readonly<Record<string, A2CumulativeAvailability>> {
  const familyById = new Map(catalogs.sentenceFamilies.map((f) => [f.id, f]));
  const realizeCatalogs: RealizeVariantCatalogs = {
    contexts: catalogs.contexts,
    personRoles: catalogs.personRoles,
    referents: catalogs.referents,
    semanticValues: catalogs.semanticValues,
    learningTargetSenses: catalogs.learningTargetSenses,
  };

  const conceptIds = new Set<string>();
  const senseIds = new Set<string>();
  const semanticValueIds = new Set<string>();
  const forms = new Set<string>();
  const result: Record<string, A2CumulativeAvailability> = {};

  for (const built of lessonsInCanonicalOrder) {
    const modelVariants = built.variants.filter((v) => v.pedagogicalUse === "model");
    for (const variant of modelVariants) {
      const family = familyById.get(variant.sentenceFamilyId);
      if (family) {
        const result_ = realizeVariant(family, variant, realizeCatalogs, {
          availableConceptIds: [...family.requiredConceptIds],
        });
        if (result_.ok) {
          for (const id of result_.sentence.usedConceptIds) conceptIds.add(id);
          for (const id of result_.sentence.usedLexemeSenseIds) senseIds.add(id);
        }
      }
      for (const valueId of Object.values(variant.slotValues)) semanticValueIds.add(valueId);
      forms.add(`${variant.form.polarity}:${variant.form.tense}:${variant.form.formality}`);
    }
    result[built.recipe.id] = {
      conceptIds: [...conceptIds].sort(),
      senseIds: [...senseIds].sort(),
      semanticValueIds: [...semanticValueIds].sort(),
      forms: [...forms].sort(),
    };
  }

  return result;
}

// ---------------------------------------------------------------------------
// Verb-use-record builders (mirrors a1LessonBuilders.ts's a1VerbUseRecord/
// withA1LaterUses — thin wrappers over the shared, level-agnostic
// instructionalLessonKit.verbUseRecord/withLaterUses)
// ---------------------------------------------------------------------------

/**
 * Build a productive verb's introduction record from its ≥2 structurally
 * distinct intro variants and one correctness-bearing intro exercise.
 * `laterUses` is intentionally left to the caller (empty at module-local
 * authoring time — later spaced reuse is a future slice, never falsely
 * pre-claimed here). Delegates to the shared kit's level-agnostic
 * `verbUseRecord("a2", ...)` — the A2 counterpart of A1's `a1VerbUseRecord`.
 */
export function a2VerbUseRecord(input: {
  readonly senseId: string;
  readonly introductionLessonId: string;
  readonly introductionVariantIds: readonly string[];
  readonly exerciseRoundId: string;
  readonly exerciseKind: "tile-ordering" | "choice" | "transformation" | "completion" | "constrained-construction";
  readonly exerciseTargetVariantId: string;
}): VerbUseRecord {
  return verbUseRecord("a2", input);
}

/**
 * Immutably augment an already-authored verb-use record with later spaced
 * reuses, WITHOUT rewriting the module-local source record. Passing an empty
 * `additions` list is a no-op copy (still a fresh frozen record). Delegates
 * to the shared kit's level-agnostic `withLaterUses` — the A2 counterpart of
 * A1's `withA1LaterUses`.
 */
export function withA2LaterUses(
  record: VerbUseRecord,
  additions: readonly VerbLaterUse[],
): VerbUseRecord {
  return withLaterUses(record, additions);
}
