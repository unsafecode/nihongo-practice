/**
 * A1 release authoring contracts (Phase 2 Task 1).
 *
 * These types describe the *shape* of an authored A1 release: the exact
 * 12-module / 48-lesson manifest, the per-lesson recipes (instructional,
 * synthesis, and phonetic), the module recipe, the A1 checkpoint, and the
 * structured error/result vocabulary used by the manifest validator and the
 * module-local slice assembler.
 *
 * The A1 layer reuses the Phase 1 foundation *data* contracts (discourse,
 * form, practice, diversity, semantic values) by importing them directly —
 * it never re-defines them — but keeps its own authoring-facing recipe and
 * validation contracts here. No Japanese/romaji literal is ever authored in a
 * recipe: recipes carry semantic IDs only, and the single sanctioned place for
 * Japanese/romaji content is a `SemanticValue`'s token fragments.
 *
 * This file is also the single canonical home for every *structured* A1
 * error/result vocabulary (Task 1 Step 3): the manifest-spec validator
 * (`A1ManifestErrorCode`), the module-local slice assembler
 * (`A1SliceErrorCode`), authoring-time gates (`A1AuthoringErrorCode`), and the
 * whole-level release validator (`A1ReleaseErrorCode`, covering manifest
 * agreement, the phonetic contract, capstone no-new-content, level-scope
 * introduction order, route/copy id resolution, and the exact 12×4/48 release
 * counts). Consumers such as `validateA1` re-export these names for backward
 * compatibility, but never redeclare the underlying literal union — this
 * keeps exactly one source of truth per failure vocabulary.
 */

import type {
  CanDoId,
  CheckpointId,
  ConceptId,
  ContextId,
  CopyId,
  DiscourseFrame,
  FormSelection,
  LessonDiversityConstraints,
  LessonId,
  LessonPracticeDefinition,
  LexemeSenseId,
  ModuleId,
  PedagogicalUse,
  SemanticValueId,
  SentenceFamilyId,
  SentenceSlotId,
  SentenceVariantId,
} from "../foundations/types";

/** The three depth contracts an A1 lesson may declare (§9.1, §12). */
export type A1LessonContract = "phonetic" | "instructional" | "synthesis";

/**
 * The two contracts a *model-bearing* A1 lesson may declare. Phonetic lessons
 * do not carry sentence models/predicates/roles, so they use a separate recipe
 * (`A1PhoneticLessonRecipe`) rather than this union.
 */
export type A1InstructionalContract = Exclude<A1LessonContract, "phonetic">;

/**
 * A depth-validated instructional/synthesis lesson recipe (plan §Task 1 Step 3).
 * Stores semantic references only — model/guided/spoken variant IDs, practice
 * round definitions, and introduced concept/sense IDs — never a canonical
 * Japanese answer.
 */
export interface A1LessonRecipe {
  readonly id: LessonId;
  readonly moduleId: ModuleId;
  readonly order: 1 | 2 | 3 | 4;
  readonly contract: A1InstructionalContract;
  readonly primaryCanDoId: CanDoId;
  readonly supportingCanDoIds: readonly CanDoId[];
  readonly modelVariantIds: readonly SentenceVariantId[];
  readonly guidedVariantIds: readonly [SentenceVariantId, SentenceVariantId];
  readonly spokenVariantId: SentenceVariantId;
  readonly practice: LessonPracticeDefinition;
  readonly diversityConstraints: LessonDiversityConstraints;
  readonly introducedConceptIds: readonly ConceptId[];
  readonly introducedSenseIds: readonly LexemeSenseId[];
}

/**
 * A phonetic lesson recipe (module 1, `sounds`). Deliberately has no sentence
 * models, predicates, or discourse roles: it declares 8-12 contrastive item
 * IDs and matching practice target references plus a locale-independent
 * outcome copy ID. No fake predicate/role fiction is invented for kana drills.
 */
export interface A1PhoneticLessonRecipe {
  readonly id: LessonId;
  readonly moduleId: ModuleId;
  readonly order: 1 | 2 | 3 | 4;
  readonly contract: "phonetic";
  readonly primaryCanDoId: CanDoId;
  readonly supportingCanDoIds: readonly CanDoId[];
  readonly contrastiveItemIds: readonly string[];
  readonly practiceTargetRefs: readonly string[];
  readonly outcomeCopyId: CopyId;
}

/** Either flavour of authored A1 lesson recipe. */
export type A1AnyLessonRecipe = A1LessonRecipe | A1PhoneticLessonRecipe;

/** A module groups exactly four lessons behind a linear prerequisite chain. */
export interface A1ModuleRecipe {
  readonly id: ModuleId;
  readonly order: number;
  readonly prerequisiteIds: readonly ModuleId[];
  readonly lessonIds: readonly LessonId[];
  readonly outcomeCopyId: CopyId;
}

/** The four-scenario A1 checkpoint definition (plan §Task 1 Step 3). */
export interface A1CheckpointDefinition {
  readonly id: CheckpointId;
  readonly level: "a1";
  readonly scenarioLessonIds: readonly LessonId[];
  readonly sampledCanDoIds: readonly CanDoId[];
  readonly minimumAcceptedTransferTargets: number;
}

/**
 * A compact authoring tuple for one sentence variant. `variantFromTuple`
 * expands it into a frozen `SentenceVariant`, defensively copying slot values.
 * Variants store semantic IDs only.
 */
export interface A1VariantTuple {
  readonly id: SentenceVariantId;
  readonly familyId: SentenceFamilyId;
  readonly discourse: DiscourseFrame;
  readonly contextId: ContextId;
  readonly slotValues: Readonly<Record<SentenceSlotId, SemanticValueId>>;
  readonly form: FormSelection;
  readonly pedagogicalUse: PedagogicalUse;
}

// ---------------------------------------------------------------------------
// Manifest entry shapes
// ---------------------------------------------------------------------------

/** One lesson's canonical manifest entry. */
export interface A1LessonManifestEntry {
  readonly lessonId: LessonId;
  readonly moduleId: ModuleId;
  readonly order: 1 | 2 | 3 | 4;
  readonly contract: A1LessonContract;
  readonly position: number;
}

/** One module's canonical manifest entry. */
export interface A1ModuleManifestEntry {
  readonly id: ModuleId;
  readonly order: number;
  readonly contract: A1LessonContract;
  readonly prerequisiteIds: readonly ModuleId[];
  readonly lessonIds: readonly LessonId[];
  readonly outcomeCopyId: CopyId;
}

/**
 * The declarative source-of-truth spec the manifest derives every array/map
 * from. Fields are intentionally mutable so tests can construct deliberately
 * broken variants; the exported canonical spec is deep-frozen at runtime.
 */
export interface A1ManifestSpec {
  moduleIds: ModuleId[];
  lessonIdsByModule: Record<ModuleId, LessonId[]>;
  modulePrerequisites: Record<ModuleId, ModuleId[]>;
  moduleContracts: Record<ModuleId, A1LessonContract>;
  capstoneModuleId: ModuleId;
  aliases: Record<LessonId, LessonId>;
}

// ---------------------------------------------------------------------------
// Manifest validation result vocabulary
// ---------------------------------------------------------------------------

/** The structured failure codes the manifest validator can report. */
export type A1ManifestErrorCode =
  | "duplicate-module-id"
  | "duplicate-lesson-id"
  | "module-lesson-count"
  | "capstone-not-final"
  | "alias-target-missing"
  | "alias-source-published"
  | "prerequisite-order"
  | "contract-assignment";

export interface A1ManifestValidationError {
  readonly code: A1ManifestErrorCode;
  readonly message: string;
  readonly detail?: string;
}

export type A1ManifestValidationResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly errors: readonly A1ManifestValidationError[] };

// ---------------------------------------------------------------------------
// Slice assembly result vocabulary
// ---------------------------------------------------------------------------

/** Failure codes the module-local slice assembler can report. */
export type A1SliceErrorCode =
  | "missing-lesson"
  | "contract-mismatch"
  | "duplicate-lesson-id"
  | "duplicate-module-id"
  | "unknown-lesson-id"
  | "orphan-lesson-id";

export interface A1SliceError {
  readonly code: A1SliceErrorCode;
  readonly message: string;
  readonly detail?: string;
}

export interface A1SliceInput {
  readonly modules: readonly A1ModuleRecipe[];
  readonly lessons: readonly A1AnyLessonRecipe[];
}

export type A1SliceResult =
  | {
      readonly ok: true;
      readonly lessonById: Readonly<Record<LessonId, A1AnyLessonRecipe>>;
      readonly moduleById: Readonly<Record<ModuleId, A1ModuleRecipe>>;
    }
  | { readonly ok: false; readonly errors: readonly A1SliceError[] };

/** The structured authoring-time failure codes surfaced by `AuthoringError`. */
export type A1AuthoringErrorCode =
  | "model-count"
  | "duplicate-id"
  | "round-shape"
  | "duplicate-target-ref"
  | "synthesis-new-content"
  | "japanese-literal"
  | "forbidden-field"
  | "contrastive-count"
  | "practice-ref-count"
  | "practice-ref-unique"
  | "practice-ref-reuse"
  | "empty-fragments"
  | "module-lesson-count";

// ---------------------------------------------------------------------------
// Whole-level release validation result vocabulary (Phase 2 Task 4)
// ---------------------------------------------------------------------------

/**
 * The structured failure codes the whole-level `validateA1` release gate can
 * report (plan §Task 1 Step 3 / Task 4): manifest agreement, the phonetic
 * contract, capstone no-new-content, level-scope introduction order,
 * route/copy id resolution, and the exact 12×4/48 release counts. This is a
 * runtime-checkable `readonly` tuple, not merely a compile-time alias, so
 * consumers (and tests) can prove membership rather than assert a type
 * compiles. `validateA1` imports and re-exports this exact vocabulary as
 * `A1ValidationErrorCode` — it never redeclares its own copy.
 */
export const A1_RELEASE_ERROR_CODES = [
  // structural shape (exact 12 modules × 4 lessons = 48 routes)
  "module-count",
  "lessons-per-module",
  "route-count",
  // route id resolution
  "unknown-lesson-id",
  "duplicate-lesson-id",
  "manifest-mismatch",
  "manifest-invalid",
  "capstone-structure",
  // level-scope introduction order / content closure
  "unknown-content",
  "capstone-introduces-new",
  // recurrence
  "recurrence-incomplete",
  // foundation gate (wrapped oracle) — blocking, per Phase 2 Task 4
  "foundation-invalid",
  // Can-do / checkpoint
  "cando-not-sampled",
  "cando-no-transfer-evidence",
  "cando-primary-mismatch",
  "cando-supporting-overflow",
  "checkpoint-min-transfer",
  // copy id resolution / aliases / claims
  "copy-parity",
  "copy-contains-japanese",
  "personal-alias-match",
  "checkpoint-claims-certification",
  // phonetic contract
  "phonetic-missing-items",
  "phonetic-dangling-contrast",
  "phonetic-duplicate-exercise",
  "phonetic-item-incomplete",
  "phonetic-lesson-mismatch",
] as const;

export type A1ReleaseErrorCode = (typeof A1_RELEASE_ERROR_CODES)[number];

export interface A1ReleaseValidationError {
  readonly code: A1ReleaseErrorCode;
  readonly id?: string;
  readonly referenceId?: string;
  readonly dimension?: string;
  readonly expected?: string | number;
  readonly actual?: string | number;
  /** Preserved lower-layer code when this error surfaces a foundation finding. */
  readonly underlyingCode?: string;
}
