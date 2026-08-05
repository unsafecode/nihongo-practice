/**
 * A1 lesson authoring + builders (quality-review M5 extraction from the
 * former `shared.ts` monolith; Phase 3 Task 4 shared-kit extraction).
 *
 * Owns everything that turns compact per-line specs into frozen, validated
 * lesson content: the fixed form-selection constants, the variant builder
 * (`a1Variant`, plus its structure-key helper for verb-recurrence tests), the
 * `FoundationCatalogs` assembly helper the module-local view-model pipeline
 * consumes, and the instructional-lesson builder (`buildA1InstructionalLesson`,
 * `a1VerbUseRecord`, `withA1LaterUses`). Depends on the semantic catalogs
 * (`a1SemanticCatalog.ts`) and bilingual copy/gloss (`a1CopyGloss.ts`) but
 * never the reverse, so there is no import cycle. Re-exported through the
 * `shared.ts` barrel so existing `from "./shared"` imports keep working
 * unchanged.
 *
 * The genuinely level-agnostic parts of this pipeline — the default
 * speaker/addressee discourse convention, the model+transfer assembly, the
 * two practice rounds, the diversity-constraints record, the recipe
 * candidate, the `FoundationCatalogs` lesson/position helpers, and the
 * verb-use-record builders (`a1VerbUseRecord`/`withA1LaterUses`, now thin
 * wrappers over the shared kit's `verbUseRecord("a1", ...)`/`withLaterUses`)
 * — now delegate to `../../foundations/instructionalLessonKit`, the shared
 * kit A2 reuses. Every exported symbol below keeps its exact name/type/
 * runtime behavior; this file only changed *how* the output is produced,
 * never *what* it produces (see `a1LessonBuilders.characterization.test.ts`).
 */

import { deepFreeze } from "../../foundations/deepFreeze";
import {
  buildInstructionalLesson,
  buildLessonPositionRecords,
  KIT_AFFIRMATIVE_PRESENT_POLITE,
  KIT_AFFIRMATIVE_PRESENT_POLITE_QUESTION,
  scenarioCopyId as kitScenarioCopyId,
  structureKey as kitStructureKey,
  toFoundationLessonDefinition,
  translationCopyId as kitTranslationCopyId,
  verbUseRecord,
  withLaterUses,
  type InstructionalLessonDiversityOverride,
  type InstructionalLessonKitConfig,
} from "../../foundations/instructionalLessonKit";
import type {
  FormSelection,
  FoundationCatalogs,
  LessonPositionRecord,
  PedagogicalUse,
  SentenceVariant,
  VerbLaterUse,
  VerbUseRecord,
} from "../../foundations/types";
import { A1_CANONICAL_POSITIONS } from "../manifest";
import { defineA1Lesson, variantFromTuple } from "../authoring";
import type { A1LessonRecipe } from "../types";
import type { Bilingual } from "./a1CopyGloss";
import { a1Scenario } from "./a1CopyGloss";
import {
  a1CanDos,
  a1Contexts,
  a1LearningTargetSenses,
  a1PersonRoles,
  a1Referents,
  a1SemanticValues,
  a1SentenceFamilies,
} from "./a1SemanticCatalog";

// ---------------------------------------------------------------------------
// Fixed form selections
// ---------------------------------------------------------------------------

/** The single affirmative-present-polite form every A1 statement uses.
 * Delegates to the shared kit's identical constant — same frozen value, same
 * shape, no A1-specific behavior. */
export const A1_AFFIRMATIVE_PRESENT_POLITE: FormSelection = KIT_AFFIRMATIVE_PRESENT_POLITE;

/** The interrogative counterpart (adds the sentence-final か + mood). */
export const A1_AFFIRMATIVE_PRESENT_POLITE_QUESTION: FormSelection =
  KIT_AFFIRMATIVE_PRESENT_POLITE_QUESTION;

/** Past affirmative polite (ました / でした). A1-only override form (Module 6),
 * not part of the level-agnostic kit defaults. */
export const A1_AFFIRMATIVE_PAST_POLITE: FormSelection = deepFreeze({
  polarity: "affirmative",
  tense: "past",
  formality: "polite",
} as const);

/** Present negative polite (ません / ではありません). */
export const A1_NEGATIVE_PRESENT_POLITE: FormSelection = deepFreeze({
  polarity: "negative",
  tense: "present",
  formality: "polite",
} as const);

/** Past negative polite (ませんでした / ではありませんでした). */
export const A1_NEGATIVE_PAST_POLITE: FormSelection = deepFreeze({
  polarity: "negative",
  tense: "past",
  formality: "polite",
} as const);

// ---------------------------------------------------------------------------
// Variant builder (variant + its bilingual copy in one honest step)
// ---------------------------------------------------------------------------

/** The stable copy id holding a variant's natural translation (mirrors the
 * builder convention `${variantId}-translation`). Delegates to the shared
 * kit's identical naming convention. */
export function a1TranslationCopyId(variantId: string): string {
  return kitTranslationCopyId(variantId);
}

/** The stable copy id holding a variant's scenario note. */
export function a1ScenarioCopyId(variantId: string): string {
  return kitScenarioCopyId(variantId);
}

export interface A1VariantSpec {
  readonly id: string;
  readonly family: string;
  readonly context: string;
  readonly speakerRole: string;
  readonly addresseeRole: string | null;
  readonly subjectReferent: string | null;
  /** A1 content only ever authors "explicit"/"omitted" — "vocative" (Task 4
   * final spec-fix "natural vocative", A2-only) is accepted here purely for
   * structural compatibility with the shared kit's `KitResolvedVariantSpec`
   * (see `DiscourseFrame.subjectRealization`); `a1Variant` never receives it
   * from any real A1 line. */
  readonly subjectRealization: "explicit" | "omitted" | "vocative";
  readonly slots: Readonly<Record<string, string>>;
  readonly interrogative?: boolean;
  /** Explicit polarity/tense/mood override; used by Module 6 to realize
   * past / negative / past-negative forms of already-introduced senses.
   * Mutually exclusive with `interrogative: true` — {@link a1Variant} throws
   * if both are supplied, rather than silently letting `form` win and
   * dropping the requested question mood. */
  readonly form?: FormSelection;
  readonly use: PedagogicalUse;
  readonly translation: Bilingual;
  readonly scenario: Bilingual;
}

export interface A1BuiltVariant {
  readonly variant: SentenceVariant;
  readonly en: Readonly<Record<string, string>>;
  readonly it: Readonly<Record<string, string>>;
}

/**
 * Expand a compact spec into a frozen `SentenceVariant` (via the authoring
 * `variantFromTuple`, which rejects any Japanese literal) plus its EN/IT copy
 * entries. Discourse `scenarioNoteCopyId` follows the `${id}-scenario`
 * convention so the view-model builder resolves constrained-construction
 * intent text against it.
 */
export function a1Variant(spec: A1VariantSpec): A1BuiltVariant {
  // Fail closed on mutually exclusive inputs: an explicit `form` used to
  // silently win over `interrogative: true`, dropping the caller's requested
  // question mood with no signal. `interrogative: false` (or omitted) beside
  // a `form` is unambiguous — the form alone governs — so only the true/true
  // combination is rejected.
  if (spec.form !== undefined && spec.interrogative === true) {
    throw new Error(
      `a1Variant "${spec.id}": mutually exclusive inputs — an explicit ` +
        "`form` and `interrogative: true` were both provided. Set the " +
        "form's own `interrogative` flag instead of also passing " +
        "`interrogative: true` at the spec level.",
    );
  }
  const variant = variantFromTuple({
    id: spec.id,
    familyId: spec.family,
    discourse: {
      speakerRoleId: spec.speakerRole,
      addresseeRoleId: spec.addresseeRole,
      subjectReferentId: spec.subjectReferent,
      subjectRealization: spec.subjectRealization,
      scenarioNoteCopyId: a1ScenarioCopyId(spec.id),
    },
    contextId: spec.context,
    slotValues: spec.slots,
    form:
      spec.form ??
      (spec.interrogative
        ? A1_AFFIRMATIVE_PRESENT_POLITE_QUESTION
        : A1_AFFIRMATIVE_PRESENT_POLITE),
    pedagogicalUse: spec.use,
  });
  return {
    variant,
    en: {
      [a1TranslationCopyId(spec.id)]: spec.translation.en,
      [a1ScenarioCopyId(spec.id)]: spec.scenario.en,
    },
    it: {
      [a1TranslationCopyId(spec.id)]: spec.translation.it,
      [a1ScenarioCopyId(spec.id)]: spec.scenario.it,
    },
  };
}

// ---------------------------------------------------------------------------
// Structure key (mirrors validateFoundations §9.3) for verb-recurrence tests
// ---------------------------------------------------------------------------

/** A verb's structure key: family, subject realization, form, and sorted slot
 * shape — deliberately excluding person/context/value ids. Two intro variants
 * with different structure keys count as structurally distinct (§9.3 rule 2).
 * Delegates to the shared kit's identical, level-agnostic implementation. */
export function a1StructureKey(variant: SentenceVariant): string {
  return kitStructureKey(variant);
}

// ---------------------------------------------------------------------------
// Foundation-catalog assembly (for the module-local view-model pipeline)
// ---------------------------------------------------------------------------

export interface AssembleA1CatalogsInput {
  /** Instructional lesson recipes (modules 2-4) to expose to the builder. */
  readonly lessons: readonly A1LessonRecipe[];
  /** Every authored sentence variant referenced by the lessons. */
  readonly variants: readonly SentenceVariant[];
  /** Productive verb-use records (module-local; later reuse may be pending). */
  readonly verbUseRecords?: readonly VerbUseRecord[];
}

/**
 * Build a `FoundationCatalogs` from the shared A1 catalogs plus a set of
 * instructional lessons and their variants, ready for `buildLessonViewModel`,
 * `realizeVariant`, `selectVariants`, and `generateFamilyExercise`. Levels,
 * modules and checkpoints are intentionally empty — the view-model pipeline
 * reads none of them — while lesson positions come from the canonical manifest
 * so verb-recurrence tests can reason about ordering. The recipe→
 * `FoundationLessonDefinition` conversion and lesson-position derivation
 * delegate to the shared, level-agnostic kit helpers.
 */
export function assembleA1FoundationCatalogs(
  input: AssembleA1CatalogsInput,
): FoundationCatalogs {
  const variantById = new Map(input.variants.map((v) => [v.id, v]));
  const lessons = input.lessons.map((recipe) =>
    toFoundationLessonDefinition(recipe, "a1", variantById),
  );
  const lessonPositions: LessonPositionRecord[] = buildLessonPositionRecords(
    input.lessons,
    "a1",
    A1_CANONICAL_POSITIONS,
  );
  return {
    levels: [],
    modules: [],
    checkpoints: [],
    canDos: a1CanDos,
    contexts: a1Contexts,
    personRoles: a1PersonRoles,
    referents: a1Referents,
    learningTargetSenses: a1LearningTargetSenses,
    semanticValues: a1SemanticValues,
    sentenceFamilies: a1SentenceFamilies,
    sentenceVariants: input.variants,
    lessons,
    lessonPositions,
    verbUseRecords: input.verbUseRecords ?? [],
  };
}

// ---------------------------------------------------------------------------
// Instructional-lesson builder (models + transfers + practice + copy)
// ---------------------------------------------------------------------------
//
// One compact record per sentence line. Speaker defaults to the learner and
// addressee to the teacher (the standard A1 "learner asks/answers" framing);
// either may be overridden. The scenario note is derived from the context so
// every constrained-construction target resolves a real, natural intent.

export interface A1LineSpec {
  readonly id: string;
  readonly family: string;
  readonly context: string;
  readonly subjectReferent: string | null;
  readonly subjectRealization: "explicit" | "omitted";
  readonly slots: Readonly<Record<string, string>>;
  readonly interrogative?: boolean;
  /** Explicit polarity/tense override (Module 6 past / negative / past-negative
   * and copula tense/polarity). Mutually exclusive with `interrogative: true`
   * — {@link buildA1InstructionalLesson} (via the shared kit) throws if both
   * are set. */
  readonly form?: FormSelection;
  readonly translation: Bilingual;
  readonly speakerRole?: string;
  readonly addresseeRole?: string | null;
}

export interface A1InstructionalLessonInput {
  readonly id: string;
  readonly moduleId: string;
  readonly order: 1 | 2 | 3 | 4;
  /** Authoring contract. "instructional" (default) introduces new content;
   * "synthesis" (Module 12 capstones) recombines already-taught content and
   * MUST leave introducedConceptIds/introducedSenseIds empty. */
  readonly contract?: "instructional" | "synthesis";
  readonly primaryCanDoId: string;
  readonly supportingCanDoIds: readonly string[];
  readonly introducedConceptIds: readonly string[];
  readonly introducedSenseIds: readonly string[];
  readonly diversityOverride?: InstructionalLessonDiversityOverride;
  readonly models: readonly A1LineSpec[];
  readonly transfers: readonly A1LineSpec[];
}

export interface A1BuiltLesson {
  readonly recipe: A1LessonRecipe;
  readonly variants: readonly SentenceVariant[];
  readonly en: Readonly<Record<string, string>>;
  readonly it: Readonly<Record<string, string>>;
}

const A1_ROUND_ONE_KINDS = ["tile-ordering", "choice", "completion"] as const;
const A1_ROUND_TWO_KINDS = [
  "constrained-construction",
  "completion",
  "tile-ordering",
  "choice",
] as const;

/** Referent → its person-role, derived from the frozen referent catalog. */
const A1_REFERENT_ROLE: Readonly<Record<string, string>> = Object.freeze(
  Object.fromEntries(a1Referents.map((r) => [r.id, r.personRoleId])),
);

/** Referents that are concrete, animate, named people who can voice a line.
 * Used to default a statement's speaker to its own subject (the self-
 * description convention the foundation fixtures also follow), while generic
 * subjects (self, an unnamed person, an inanimate thing, or none) fall back to
 * the learner as speaker. Question lessons override the speaker explicitly to
 * model who is actually asking. */
const A1_VOICEABLE_REFERENTS: ReadonlySet<string> = new Set([
  "a1-referent-yuki",
  "a1-referent-ken",
  "a1-referent-mina",
  "a1-referent-teacher",
  "a1-referent-classmate",
  "a1-referent-clerk",
  "a1-referent-friend",
]);

/**
 * The shared kit config for A1: fixed roles/referents/round-kinds/selection-
 * policy/scenario-copy, `a1Variant` as the level's own no-Japanese-scanning
 * variant builder (structurally satisfies the kit's `KitResolvedVariantSpec`
 * — see {@link A1VariantSpec}), and `defineA1Lesson` as the level's own
 * recipe validator/freezer. Every default-speaker/addressee, model+transfer
 * assembly, practice-round, and diversity-constraint step below is now the
 * shared, level-agnostic kit's job — this file only supplies A1's own fixed
 * choices for it.
 */
/** @internal Exported for same-directory test access only; not public API.
 * The `export *` barrel in `shared.ts` re-exports this as a consequence of
 * TypeScript's module system — the value is not intended for external consumers.
 */
export const A1_INSTRUCTIONAL_KIT_CONFIG: InstructionalLessonKitConfig<A1LessonRecipe> = {
  defaultSpeakerRoleId: "a1-role-learner",
  defaultAddresseeRoleId: "a1-role-teacher",
  referentPersonRoleById: A1_REFERENT_ROLE,
  voiceableReferentIds: A1_VOICEABLE_REFERENTS,
  scenarioCopy: a1Scenario,
  buildVariant: a1Variant,
  modelCountRange: [8, 8],
  minFamilies: 1,
  exerciseCountRange: [4, 4],
  roundTargetCounts: [2, 2],
  minUniqueTargets: 4,
  roundOneExerciseKinds: A1_ROUND_ONE_KINDS,
  roundTwoExerciseKinds: A1_ROUND_TWO_KINDS,
  selectionPolicyId: "a1-selection-default",
  defineLesson: defineA1Lesson,
};

/**
 * Expand an instructional lesson's eight models and five transfers into a
 * validated {@link A1LessonRecipe} (via {@link defineA1Lesson}), its frozen
 * variants, and the merged EN/IT translation+scenario copy. A1 defaults to
 * eight models, four exercises, ≥3 predicates, ≥3 roles, ≥2 contexts, four
 * unique targets, reuse ≤2, two transfer exercises, and controlled
 * construction. A focused foundation lesson may explicitly lower its predicate
 * floor through `diversityOverride`; defaults remain unchanged. `minFamilies`
 * is declared as 1 (the honest floor — 10 of 44 A1 lessons genuinely teach a
 * single family). Delegates
 * every level-agnostic assembly step to the shared
 * `instructionalLessonKit.buildInstructionalLesson`.
 */
export function buildA1InstructionalLesson(
  input: A1InstructionalLessonInput,
): A1BuiltLesson {
  return buildInstructionalLesson(A1_INSTRUCTIONAL_KIT_CONFIG, input);
}

/**
 * Build a productive verb's introduction record from its ≥2 structurally
 * distinct intro variants and one correctness-bearing intro exercise. `laterUses`
 * is intentionally left to the caller (empty at module-local authoring time —
 * later spaced reuse is a future slice, never falsely pre-claimed here).
 * Delegates to the shared kit's level-agnostic `verbUseRecord("a1", ...)` —
 * same signature, same byte-for-byte output (see
 * `a1LessonBuilders.characterization.test.ts`).
 */
export function a1VerbUseRecord(input: {
  readonly senseId: string;
  readonly introductionLessonId: string;
  readonly introductionVariantIds: readonly string[];
  readonly exerciseRoundId: string;
  readonly exerciseKind: "tile-ordering" | "choice" | "transformation" | "completion" | "constrained-construction";
  readonly exerciseTargetVariantId: string;
}): VerbUseRecord {
  return verbUseRecord("a1", input);
}

/**
 * Immutably augment an already-authored verb-use record with later spaced
 * reuses, WITHOUT rewriting the module-local source record. Modules 2–4 keep
 * their frozen `laterUses: []` intro records exactly as authored; Module 5–8
 * authoring calls this to produce a *new* frozen record whose `laterUses`
 * point at the genuine later variants that reuse the sense. Passing an empty
 * `additions` list is a no-op copy (still a fresh frozen record). Delegates
 * to the shared kit's level-agnostic `withLaterUses` — same signature, same
 * byte-for-byte output.
 */
export function withA1LaterUses(
  record: VerbUseRecord,
  additions: readonly VerbLaterUse[],
): VerbUseRecord {
  return withLaterUses(record, additions);
}
