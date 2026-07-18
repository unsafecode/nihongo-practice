/**
 * A2 release authoring contracts (Phase 3 Task 1).
 *
 * These types describe the *shape* of the immutable A2 manifest spine: the
 * exact 15-module / 60-lesson structure, the manifest-entry shapes, and the
 * structured error/result vocabulary the manifest validator reports. There is
 * no content yet — recipes, catalogs, and the whole-level release validator
 * belong to later tasks.
 *
 * A2 reuses the Phase 1 foundation *data* contracts (`../foundations/types`)
 * directly and never redeclares them. A2 has no phonetic module — unlike A1's
 * three-way `A1LessonContract`, {@link A2LessonContract} is a closed
 * `"instructional" | "synthesis"` union — and its single synthesis contract
 * is tracked by module id (`synthesisModuleId`), not a fixed "final module"
 * position.
 *
 * This file is also the single canonical home for the *structured* A2 error
 * vocabularies: the manifest-spec validator (`A2ManifestErrorCode`) here, and
 * the whole-level release validator's full code set (`A2ReleaseErrorCode`),
 * exported as a runtime-checkable `readonly` tuple so later tasks and tests
 * can prove membership rather than merely assert a type compiles. No
 * Japanese/romaji literal is ever authored in this file.
 */

import type { CopyId, LessonId, ModuleId } from "../foundations/types";

/** The two depth contracts an A2 module/lesson may declare. A2 has no phonetic module. */
export type A2LessonContract = "instructional" | "synthesis";

// ---------------------------------------------------------------------------
// Manifest entry shapes
// ---------------------------------------------------------------------------

/** One lesson's canonical manifest entry. */
export interface A2LessonManifestEntry {
  readonly lessonId: LessonId;
  readonly moduleId: ModuleId;
  readonly order: 1 | 2 | 3 | 4;
  readonly contract: A2LessonContract;
  readonly position: number;
}

/** One module's canonical manifest entry. */
export interface A2ModuleManifestEntry {
  readonly id: ModuleId;
  readonly order: number;
  readonly contract: A2LessonContract;
  readonly prerequisiteIds: readonly ModuleId[];
  readonly lessonIds: readonly LessonId[];
  readonly outcomeCopyId: CopyId;
}

/**
 * The declarative source-of-truth spec the manifest derives every array/map
 * from. Fields are intentionally mutable so tests can construct deliberately
 * broken variants; the exported canonical spec is deep-frozen at runtime.
 */
export interface A2ManifestSpec {
  moduleIds: ModuleId[];
  lessonIdsByModule: Record<ModuleId, LessonId[]>;
  modulePrerequisites: Record<ModuleId, ModuleId[]>;
  moduleContracts: Record<ModuleId, A2LessonContract>;
  synthesisModuleId: ModuleId;
  aliases: Record<LessonId, LessonId>;
}

// ---------------------------------------------------------------------------
// Manifest validation result vocabulary
// ---------------------------------------------------------------------------

/** The structured failure codes the manifest validator can report. */
export type A2ManifestErrorCode =
  | "module-count"
  | "duplicate-module-id"
  | "lessons-per-module"
  | "duplicate-lesson-id"
  | "unknown-synthesis-module"
  | "unknown-prerequisite"
  | "prerequisite-cycle"
  | "alias-target-missing";

export interface A2ManifestValidationError {
  readonly code: A2ManifestErrorCode;
  readonly message: string;
  readonly detail?: string;
}

export type A2ManifestValidationResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly errors: readonly A2ManifestValidationError[] };

// ---------------------------------------------------------------------------
// Whole-level release validation result vocabulary (later tasks)
// ---------------------------------------------------------------------------

/**
 * The structured failure codes the whole-level `validateA2` release gate will
 * report (later tasks): manifest agreement, the synthesis no-new-content
 * contract, recurrence, foundation-gate wrapping, Can-do/checkpoint sampling,
 * copy resolution, and the grammar-form/kanji introduction-order contracts
 * unique to A2. Declared here — a runtime-checkable `readonly` tuple, not
 * merely a compile-time alias — so this task can freeze the full release
 * error vocabulary before any of the validators that report it exist.
 */
export const A2_RELEASE_ERROR_CODES = [
  // structural shape (exact 15 modules × 4 lessons = 60 routes)
  "module-count",
  "lessons-per-module",
  "route-count",
  // route id resolution
  "unknown-lesson-id",
  "manifest-mismatch",
  // synthesis structure / no-new-content
  "synthesis-structure",
  "synthesis-introduces-new",
  // level-scope introduction order / content closure
  "unknown-content",
  // recurrence
  "recurrence-incomplete",
  // foundation gate (wrapped oracle)
  "foundation-invalid",
  // Can-do / checkpoint
  "cando-not-sampled",
  "cando-untransferred",
  "checkpoint-min-transfer",
  "checkpoint-module-coverage",
  "checkpoint-claims-certification",
  // copy id resolution / aliases
  "copy-parity",
  "copy-contains-japanese",
  "personal-alias-match",
  // grammar-form introduction/practice/transfer/recurrence order (A2-specific)
  "grammar-form-missing-cando",
  "grammar-form-missing-intro",
  "grammar-form-missing-practice",
  "grammar-form-missing-transfer",
  "grammar-form-missing-recurrence",
  "grammar-role-before-intro",
  // contextual kanji introduction/support contracts (A2-specific)
  "kanji-count",
  "kanji-unknown-reading",
  "kanji-exposure-order",
  "kanji-synthesis-first-exposure",
  "kanji-furigana-premature-hide",
  "kanji-assessed-without-support",
  "kanji-romaji-bypass",
  "kanji-standalone-dump",
  "kanji-distribution-sum",
] as const;

export type A2ReleaseErrorCode = (typeof A2_RELEASE_ERROR_CODES)[number];
