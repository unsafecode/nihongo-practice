/**
 * A1 lesson authoring + builders (quality-review M5 extraction from the
 * former `shared.ts` monolith).
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
 */

import { deepFreeze } from "../../foundations/deepFreeze";
import type {
  FormSelection,
  FoundationCatalogs,
  FoundationLessonDefinition,
  LessonDiversityConstraints,
  LessonPositionRecord,
  LessonPracticeDefinition,
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

/** The single affirmative-present-polite form every A1 statement uses. */
export const A1_AFFIRMATIVE_PRESENT_POLITE: FormSelection = deepFreeze({
  polarity: "affirmative",
  tense: "present",
  formality: "polite",
} as const);

/** The interrogative counterpart (adds the sentence-final か + mood). */
export const A1_AFFIRMATIVE_PRESENT_POLITE_QUESTION: FormSelection = deepFreeze({
  polarity: "affirmative",
  tense: "present",
  formality: "polite",
  interrogative: true,
} as const);

/** Past affirmative polite (ました / でした). */
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
 * builder convention `${variantId}-translation`). */
export function a1TranslationCopyId(variantId: string): string {
  return `${variantId}-translation`;
}

/** The stable copy id holding a variant's scenario note. */
export function a1ScenarioCopyId(variantId: string): string {
  return `${variantId}-scenario`;
}

export interface A1VariantSpec {
  readonly id: string;
  readonly family: string;
  readonly context: string;
  readonly speakerRole: string;
  readonly addresseeRole: string | null;
  readonly subjectReferent: string | null;
  readonly subjectRealization: "explicit" | "omitted";
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
 * with different structure keys count as structurally distinct (§9.3 rule 2). */
export function a1StructureKey(variant: SentenceVariant): string {
  const slots = Object.keys(variant.slotValues).slice().sort().join(",");
  const f = variant.form;
  return `${variant.sentenceFamilyId}|${variant.discourse.subjectRealization}|${f.polarity}:${f.tense}:${f.formality}|${slots}`;
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
 * Convert an A1 instructional lesson recipe into the Phase 1
 * `FoundationLessonDefinition` the view-model builder consumes. `familyIds` is
 * derived from the union of the lesson's model variants' families (authored
 * order preserved), never hand-declared.
 */
function toFoundationLesson(
  recipe: A1LessonRecipe,
  variantById: ReadonlyMap<string, SentenceVariant>,
): FoundationLessonDefinition {
  const familyIds: string[] = [];
  for (const variantId of recipe.modelVariantIds) {
    const variant = variantById.get(variantId);
    if (variant && !familyIds.includes(variant.sentenceFamilyId)) {
      familyIds.push(variant.sentenceFamilyId);
    }
  }
  return {
    id: recipe.id,
    level: "a1",
    moduleId: recipe.moduleId,
    primaryCanDoId: recipe.primaryCanDoId,
    supportingCanDoIds: recipe.supportingCanDoIds,
    modelVariantIds: recipe.modelVariantIds,
    familyIds,
    practice: recipe.practice,
    diversityConstraints: recipe.diversityConstraints,
  };
}

/**
 * Build a `FoundationCatalogs` from the shared A1 catalogs plus a set of
 * instructional lessons and their variants, ready for `buildLessonViewModel`,
 * `realizeVariant`, `selectVariants`, and `generateFamilyExercise`. Levels,
 * modules and checkpoints are intentionally empty — the view-model pipeline
 * reads none of them — while lesson positions come from the canonical manifest
 * so verb-recurrence tests can reason about ordering.
 */
export function assembleA1FoundationCatalogs(
  input: AssembleA1CatalogsInput,
): FoundationCatalogs {
  const variantById = new Map(input.variants.map((v) => [v.id, v]));
  const lessons = input.lessons.map((recipe) =>
    toFoundationLesson(recipe, variantById),
  );
  const lessonPositions: LessonPositionRecord[] = input.lessons.map((recipe) => ({
    lessonId: recipe.id,
    level: "a1",
    moduleId: recipe.moduleId,
    position: A1_CANONICAL_POSITIONS[recipe.id] ?? 0,
  }));
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
   * — {@link lineVariant} (via {@link a1Variant}) throws if both are set. */
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

/** The default speaker for a line: an explicit override, else the subject's own
 * role when the subject is a named animate person, else the learner. Speaker
 * identity is discourse-only metadata — it never changes the realized Japanese,
 * so this default diversifies discourse roles without touching any surface. */
function defaultSpeakerRole(spec: A1LineSpec): string {
  if (spec.speakerRole !== undefined) return spec.speakerRole;
  const ref = spec.subjectReferent;
  if (ref !== null && A1_VOICEABLE_REFERENTS.has(ref)) {
    return A1_REFERENT_ROLE[ref] ?? "a1-role-learner";
  }
  return "a1-role-learner";
}

function lineVariant(spec: A1LineSpec, use: PedagogicalUse): A1BuiltVariant {
  return a1Variant({
    id: spec.id,
    family: spec.family,
    context: spec.context,
    speakerRole: defaultSpeakerRole(spec),
    addresseeRole: spec.addresseeRole === undefined ? "a1-role-teacher" : spec.addresseeRole,
    subjectReferent: spec.subjectReferent,
    subjectRealization: spec.subjectRealization,
    slots: spec.slots,
    interrogative: spec.interrogative,
    form: spec.form,
    use,
    translation: spec.translation,
    scenario: a1Scenario(spec.context),
  });
}

/**
 * Expand an instructional lesson's eight models and five transfers into a
 * validated {@link A1LessonRecipe} (via {@link defineA1Lesson}), its frozen
 * variants, and the merged EN/IT translation+scenario copy. Diversity floors
 * are fixed to the A1 depth contract: eight models, ten exercises, ≥3
 * predicates, ≥3 roles, ≥2 contexts, five unique targets per round, reuse ≤2,
 * five transfer exercises, controlled construction required. `minFamilies` is
 * derived from the models' distinct families (never hand-declared).
 */
export function buildA1InstructionalLesson(
  input: A1InstructionalLessonInput,
): A1BuiltLesson {
  const modelBuilt = input.models.map((m) => lineVariant(m, "model"));
  const transferBuilt = input.transfers.map((t) => lineVariant(t, "transfer"));
  const modelIds = modelBuilt.map((b) => b.variant.id);
  const transferIds = transferBuilt.map((b) => b.variant.id);

  const modelFamilies = new Set(modelBuilt.map((b) => b.variant.sentenceFamilyId));

  const diversityConstraints: LessonDiversityConstraints = {
    modelCountRange: [8, 8],
    exerciseCountRange: [10, 10],
    minFamilies: modelFamilies.size,
    minPredicates: 3,
    minRoles: 3,
    minContexts: 2,
    minUniqueTargets: 5,
    maxTargetReuse: 2,
    minTransferExercises: 5,
    requireControlledConstruction: true,
  };

  const practice: LessonPracticeDefinition = {
    lessonId: input.id,
    roundOne: {
      id: `${input.id}-round-1`,
      purpose: "guided-controlled",
      candidateVariantIds: modelIds,
      selectionPolicyId: "a1-selection-default",
      exerciseKinds: [...A1_ROUND_ONE_KINDS],
      targetCount: 5,
    },
    roundTwo: {
      id: `${input.id}-round-2`,
      purpose: "transfer",
      candidateVariantIds: transferIds,
      selectionPolicyId: "a1-selection-default",
      exerciseKinds: [...A1_ROUND_TWO_KINDS],
      targetCount: 5,
    },
  };

  const recipe = defineA1Lesson({
    id: input.id,
    moduleId: input.moduleId,
    order: input.order,
    contract: input.contract ?? "instructional",
    primaryCanDoId: input.primaryCanDoId,
    supportingCanDoIds: input.supportingCanDoIds,
    modelVariantIds: modelIds,
    guidedVariantIds: [modelIds[0], modelIds[1]],
    spokenVariantId: modelIds[0],
    practice,
    diversityConstraints,
    introducedConceptIds: input.introducedConceptIds,
    introducedSenseIds: input.introducedSenseIds,
  });

  const en: Record<string, string> = {};
  const it: Record<string, string> = {};
  for (const built of [...modelBuilt, ...transferBuilt]) {
    Object.assign(en, built.en);
    Object.assign(it, built.it);
  }

  return {
    recipe,
    variants: [...modelBuilt, ...transferBuilt].map((b) => b.variant),
    en,
    it,
  };
}

/**
 * Build a productive verb's introduction record from its ≥2 structurally
 * distinct intro variants and one correctness-bearing intro exercise. `laterUses`
 * is intentionally left to the caller (empty at module-local authoring time —
 * later spaced reuse is a future slice, never falsely pre-claimed here).
 */
export function a1VerbUseRecord(input: {
  readonly senseId: string;
  readonly introductionLessonId: string;
  readonly introductionVariantIds: readonly string[];
  readonly exerciseRoundId: string;
  readonly exerciseKind: "tile-ordering" | "choice" | "transformation" | "completion" | "constrained-construction";
  readonly exerciseTargetVariantId: string;
}): VerbUseRecord {
  return deepFreeze({
    id: `a1-verb-use-${input.senseId}`,
    senseId: input.senseId,
    learningUse: "productive",
    introductionLessonId: input.introductionLessonId,
    introductionVariantIds: [...input.introductionVariantIds],
    introductionExercise: {
      lessonId: input.introductionLessonId,
      roundId: input.exerciseRoundId,
      exerciseKind: input.exerciseKind,
      targetVariantId: input.exerciseTargetVariantId,
    },
    laterUses: [],
  });
}

/**
 * Immutably augment an already-authored verb-use record with later spaced
 * reuses, WITHOUT rewriting the module-local source record. Modules 2–4 keep
 * their frozen `laterUses: []` intro records exactly as authored; Module 5–8
 * authoring calls this to produce a *new* frozen record whose `laterUses`
 * point at the genuine later variants that reuse the sense. Passing an empty
 * `additions` list is a no-op copy (still a fresh frozen record).
 */
export function withA1LaterUses(
  record: VerbUseRecord,
  additions: readonly VerbLaterUse[],
): VerbUseRecord {
  return deepFreeze({
    ...record,
    laterUses: [...record.laterUses, ...additions.map((u) => ({ ...u }))],
  });
}
