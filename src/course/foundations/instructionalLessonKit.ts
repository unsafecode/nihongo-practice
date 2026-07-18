/**
 * Shared, level-agnostic instructional lesson kit (Phase 3 Task 4).
 *
 * Extracted from the proven A1 builder (`a1/catalog/a1LessonBuilders.ts`)
 * without changing A1's observable output: this module owns every part of
 * "compact per-line spec → validated, frozen lesson content" that does not
 * depend on which level is authoring it — the default speaker/addressee
 * discourse convention, the model+transfer variant assembly, the two
 * deterministic-selection practice rounds, the diversity-constraints record,
 * the lesson-recipe candidate handed to the level's own validator, the
 * merged EN/IT copy, and the `FoundationCatalogs` lesson/position helpers.
 *
 * Every level-specific choice is supplied through {@link InstructionalLessonKitConfig}:
 * which roles/referents exist, which round kinds each practice round uses,
 * the selection-policy id, how to render a context's scenario copy, how to
 * expand a resolved spec into a frozen `SentenceVariant` (the level's own
 * no-Japanese-scanning `variantFromTuple`-equivalent), and how to validate
 * the assembled recipe candidate (the level's own `defineLesson`). This file
 * imports nothing from `a1/` or `a2/` — no level import inside the kit — so
 * it has no upward dependency on either level's catalogs.
 */

import type { ExerciseKind } from "../exercises/types";
import type {
  CourseLevelId,
  FormSelection,
  FoundationLessonDefinition,
  LessonDiversityConstraints,
  LessonPositionRecord,
  LessonPracticeDefinition,
  PedagogicalUse,
  SentenceVariant,
} from "./types";
import { deepFreeze } from "./deepFreeze";

// ---------------------------------------------------------------------------
// Fixed form selections (the standard baseline every statement/question model
// uses unless the line spec overrides `form` explicitly).
// ---------------------------------------------------------------------------

/** The single affirmative-present-polite form every plain statement model uses. */
export const KIT_AFFIRMATIVE_PRESENT_POLITE: FormSelection = deepFreeze({
  polarity: "affirmative",
  tense: "present",
  formality: "polite",
} as const);

/** The interrogative counterpart (adds the sentence-final か + mood). */
export const KIT_AFFIRMATIVE_PRESENT_POLITE_QUESTION: FormSelection = deepFreeze({
  polarity: "affirmative",
  tense: "present",
  formality: "polite",
  interrogative: true,
} as const);

// ---------------------------------------------------------------------------
// Copy-id conventions
// ---------------------------------------------------------------------------

/** The stable copy id holding a variant's natural translation. */
export function translationCopyId(variantId: string): string {
  return `${variantId}-translation`;
}

/** The stable copy id holding a variant's scenario note. */
export function scenarioCopyId(variantId: string): string {
  return `${variantId}-scenario`;
}

// ---------------------------------------------------------------------------
// Structure key (mirrors validateFoundations §9.3) for verb-recurrence tests
// ---------------------------------------------------------------------------

/**
 * A verb's structure key: family, subject realization, form, and sorted slot
 * shape — deliberately excluding person/context/value ids. Two intro variants
 * with different structure keys count as structurally distinct (§9.3 rule 2).
 */
export function structureKey(variant: SentenceVariant): string {
  const slots = Object.keys(variant.slotValues).slice().sort().join(",");
  const f = variant.form;
  return `${variant.sentenceFamilyId}|${variant.discourse.subjectRealization}|${f.polarity}:${f.tense}:${f.formality}|${slots}`;
}

// ---------------------------------------------------------------------------
// Compact line spec → resolved variant spec
// ---------------------------------------------------------------------------

/** A bilingual (EN/IT) copy pair. Never carries Japanese. Structurally
 * compatible with any level's own `Bilingual` type — no shared import needed. */
export interface KitBilingual {
  readonly en: string;
  readonly it: string;
}

/**
 * One compact, level-agnostic authored sentence line. Speaker defaults to the
 * config's `defaultSpeakerRoleId` and addressee to `defaultAddresseeRoleId`
 * (the standard "learner asks/answers the teacher" framing); either may be
 * overridden per line. The scenario note is derived from the context via the
 * config's `scenarioCopy`, so every constrained-construction target resolves
 * a real, natural intent.
 */
export interface KitLineSpec {
  readonly id: string;
  readonly family: string;
  readonly context: string;
  readonly subjectReferent: string | null;
  readonly subjectRealization: "explicit" | "omitted";
  readonly slots: Readonly<Record<string, string>>;
  readonly interrogative?: boolean;
  /** Explicit polarity/tense/mood override. Mutually exclusive with
   * `interrogative: true` — {@link buildInstructionalLesson} throws if both
   * are supplied, rather than silently letting `form` win and dropping the
   * requested question mood. */
  readonly form?: FormSelection;
  readonly translation: KitBilingual;
  readonly speakerRole?: string;
  readonly addresseeRole?: string | null;
}

/** The fully-resolved spec handed to the level's own `buildVariant`. */
export interface KitResolvedVariantSpec {
  readonly id: string;
  readonly family: string;
  readonly context: string;
  readonly speakerRole: string;
  readonly addresseeRole: string | null;
  readonly subjectReferent: string | null;
  readonly subjectRealization: "explicit" | "omitted";
  readonly slots: Readonly<Record<string, string>>;
  readonly form: FormSelection;
  readonly use: PedagogicalUse;
  readonly translation: KitBilingual;
  readonly scenario: KitBilingual;
}

/** What the level's own `buildVariant` returns for one line: the frozen
 * `SentenceVariant` plus its EN/IT translation+scenario copy entries. */
export interface KitBuiltVariant {
  readonly variant: SentenceVariant;
  readonly en: Readonly<Record<string, string>>;
  readonly it: Readonly<Record<string, string>>;
}

/**
 * The candidate handed to the level's own `defineLesson` validator. Shaped to
 * match both A1's `A1LessonRecipe` and A2's `A2LessonRecipe` structurally (no
 * shared import needed) — a level's `defineLesson` can accept this directly.
 */
export interface KitLessonRecipeCandidate {
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
  readonly diversityConstraints: LessonDiversityConstraints;
  readonly introducedConceptIds: readonly string[];
  readonly introducedSenseIds: readonly string[];
}

/**
 * The typed config a level supplies so the kit never has to know its own
 * roles/referents/round-kinds/selection-policy/scenario-copy/variant-builder/
 * recipe-validator (§ shared instructional kit contract).
 */
export interface InstructionalLessonKitConfig<TRecipe> {
  readonly defaultSpeakerRoleId: string;
  readonly defaultAddresseeRoleId: string | null;
  /** Referent id → its person-role id, derived from the level's own frozen
   * referent catalog. */
  readonly referentPersonRoleById: Readonly<Record<string, string>>;
  /** Referents that are concrete, animate, named people who can voice a line
   * (default the speaker to the subject's own role instead of the learner). */
  readonly voiceableReferentIds: ReadonlySet<string>;
  /** The situational scenario note for a context (never Japanese). */
  readonly scenarioCopy: (contextId: string) => KitBilingual;
  /** The level's own no-Japanese-scanning variant builder (wraps its
   * `variantFromTuple`-equivalent plus translation/scenario copy-id entries). */
  readonly buildVariant: (spec: KitResolvedVariantSpec) => KitBuiltVariant;
  readonly modelCountRange: readonly [number, number];
  readonly exerciseCountRange: readonly [number, number];
  /** Each of the two practice rounds selects this many targets. */
  readonly roundTargetCount: number;
  readonly roundOneExerciseKinds: readonly ExerciseKind[];
  readonly roundTwoExerciseKinds: readonly ExerciseKind[];
  readonly selectionPolicyId: string;
  /** The level's own recipe validator/freezer (e.g. `defineA1Lesson`,
   * `defineA2Lesson`) — receives exactly a {@link KitLessonRecipeCandidate}. */
  readonly defineLesson: (candidate: KitLessonRecipeCandidate) => TRecipe;
}

/** Referent → its person-role, resolved from the level's config. */
function referentRole(
  referentId: string,
  config: Pick<InstructionalLessonKitConfig<unknown>, "referentPersonRoleById" | "defaultSpeakerRoleId">,
): string {
  return config.referentPersonRoleById[referentId] ?? config.defaultSpeakerRoleId;
}

/**
 * The default speaker for a line: an explicit override, else the subject's
 * own role when the subject is a named, voiceable animate person, else the
 * level's configured default (typically the learner). Speaker identity is
 * discourse-only metadata — it never changes the realized Japanese, so this
 * default diversifies discourse roles without touching any surface.
 */
export function defaultSpeakerRoleId(
  spec: KitLineSpec,
  config: Pick<
    InstructionalLessonKitConfig<unknown>,
    "referentPersonRoleById" | "voiceableReferentIds" | "defaultSpeakerRoleId"
  >,
): string {
  if (spec.speakerRole !== undefined) return spec.speakerRole;
  const ref = spec.subjectReferent;
  if (ref !== null && config.voiceableReferentIds.has(ref)) {
    return referentRole(ref, config);
  }
  return config.defaultSpeakerRoleId;
}

function lineToBuiltVariant<TRecipe>(
  spec: KitLineSpec,
  use: PedagogicalUse,
  config: InstructionalLessonKitConfig<TRecipe>,
): KitBuiltVariant {
  // Fail closed on mutually exclusive inputs: an explicit `form` used to
  // silently win over `interrogative: true`, dropping the caller's requested
  // question mood with no signal. `interrogative: false` (or omitted) beside
  // a `form` is unambiguous — the form alone governs — so only the true/true
  // combination is rejected.
  if (spec.form !== undefined && spec.interrogative === true) {
    throw new Error(
      `instructionalLessonKit "${spec.id}": mutually exclusive inputs — an ` +
        "explicit `form` and `interrogative: true` were both provided. Set " +
        "the form's own `interrogative` flag instead of also passing " +
        "`interrogative: true` at the spec level.",
    );
  }
  const speakerRole = defaultSpeakerRoleId(spec, config);
  const addresseeRole =
    spec.addresseeRole === undefined ? config.defaultAddresseeRoleId : spec.addresseeRole;
  const form =
    spec.form ??
    (spec.interrogative ? KIT_AFFIRMATIVE_PRESENT_POLITE_QUESTION : KIT_AFFIRMATIVE_PRESENT_POLITE);
  const scenario = config.scenarioCopy(spec.context);

  return config.buildVariant({
    id: spec.id,
    family: spec.family,
    context: spec.context,
    speakerRole,
    addresseeRole,
    subjectReferent: spec.subjectReferent,
    subjectRealization: spec.subjectRealization,
    slots: spec.slots,
    form,
    use,
    translation: spec.translation,
    scenario,
  });
}

// ---------------------------------------------------------------------------
// Instructional-lesson builder (models + transfers + practice + copy)
// ---------------------------------------------------------------------------

export interface InstructionalLessonInput {
  readonly id: string;
  readonly moduleId: string;
  readonly order: 1 | 2 | 3 | 4;
  /** Authoring contract. "instructional" (default) introduces new content;
   * "synthesis" recombines already-taught content and MUST leave
   * introducedConceptIds/introducedSenseIds empty (enforced by the level's
   * own `defineLesson`). */
  readonly contract?: "instructional" | "synthesis";
  readonly primaryCanDoId: string;
  readonly supportingCanDoIds: readonly string[];
  readonly introducedConceptIds: readonly string[];
  readonly introducedSenseIds: readonly string[];
  readonly models: readonly KitLineSpec[];
  readonly transfers: readonly KitLineSpec[];
}

export interface BuiltInstructionalLesson<TRecipe> {
  readonly recipe: TRecipe;
  readonly variants: readonly SentenceVariant[];
  readonly en: Readonly<Record<string, string>>;
  readonly it: Readonly<Record<string, string>>;
}

/**
 * Expand an instructional lesson's models and transfers into a validated
 * recipe (via the level's own `config.defineLesson`), its frozen variants,
 * and the merged EN/IT translation+scenario copy. Diversity floors follow
 * the level's configured model/exercise-count ranges plus the fixed depth
 * contract every A1/A2 instructional lesson shares: ≥3 predicates, ≥3 roles,
 * ≥2 contexts, ≥5 unique targets per round, reuse ≤2, `roundTargetCount`
 * transfer exercises, controlled construction required. `minFamilies` is
 * derived from the models' distinct families (never hand-declared).
 */
export function buildInstructionalLesson<TRecipe>(
  config: InstructionalLessonKitConfig<TRecipe>,
  input: InstructionalLessonInput,
): BuiltInstructionalLesson<TRecipe> {
  const modelBuilt = input.models.map((m) => lineToBuiltVariant(m, "model", config));
  const transferBuilt = input.transfers.map((t) => lineToBuiltVariant(t, "transfer", config));
  const modelIds = modelBuilt.map((b) => b.variant.id);
  const transferIds = transferBuilt.map((b) => b.variant.id);

  const modelFamilies = new Set(modelBuilt.map((b) => b.variant.sentenceFamilyId));

  const diversityConstraints: LessonDiversityConstraints = {
    modelCountRange: config.modelCountRange,
    exerciseCountRange: config.exerciseCountRange,
    minFamilies: modelFamilies.size,
    minPredicates: 3,
    minRoles: 3,
    minContexts: 2,
    minUniqueTargets: 5,
    maxTargetReuse: 2,
    minTransferExercises: config.roundTargetCount,
    requireControlledConstruction: true,
  };

  const practice: LessonPracticeDefinition = {
    lessonId: input.id,
    roundOne: {
      id: `${input.id}-round-1`,
      purpose: "guided-controlled",
      candidateVariantIds: modelIds,
      selectionPolicyId: config.selectionPolicyId,
      exerciseKinds: [...config.roundOneExerciseKinds],
      targetCount: config.roundTargetCount,
    },
    roundTwo: {
      id: `${input.id}-round-2`,
      purpose: "transfer",
      candidateVariantIds: transferIds,
      selectionPolicyId: config.selectionPolicyId,
      exerciseKinds: [...config.roundTwoExerciseKinds],
      targetCount: config.roundTargetCount,
    },
  };

  const candidate: KitLessonRecipeCandidate = {
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
  };
  const recipe = config.defineLesson(candidate);

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

// ---------------------------------------------------------------------------
// Foundation-catalog assembly helpers
// ---------------------------------------------------------------------------

/** The subset of a level's own lesson recipe `toFoundationLessonDefinition` needs. */
export interface FoundationRecipeLike {
  readonly id: string;
  readonly moduleId: string;
  readonly primaryCanDoId: string;
  readonly supportingCanDoIds: readonly string[];
  readonly modelVariantIds: readonly string[];
  readonly practice: LessonPracticeDefinition;
  readonly diversityConstraints: LessonDiversityConstraints;
}

/**
 * Convert a level's instructional lesson recipe into the `FoundationLessonDefinition`
 * the view-model builder consumes. `familyIds` is derived from the union of
 * the lesson's model variants' families (authored order preserved), never
 * hand-declared.
 */
export function toFoundationLessonDefinition(
  recipe: FoundationRecipeLike,
  level: CourseLevelId,
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
    level,
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
 * Build one `LessonPositionRecord` per recipe from the level's canonical
 * position manifest. A recipe with no manifest entry defaults to position 0
 * rather than throwing — the same conservative fallback A1's own assembly
 * helper has always used.
 */
export function buildLessonPositionRecords(
  recipes: readonly { readonly id: string; readonly moduleId: string }[],
  level: CourseLevelId,
  canonicalPositions: Readonly<Record<string, number>>,
): LessonPositionRecord[] {
  return recipes.map((recipe) => ({
    lessonId: recipe.id,
    level,
    moduleId: recipe.moduleId,
    position: canonicalPositions[recipe.id] ?? 0,
  }));
}
