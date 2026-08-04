/**
 * A1 release authoring helpers (Phase 2 Task 1).
 *
 * These builders turn authoring-time recipes into deeply-frozen, validated A1
 * release contracts. They never accept canonical Japanese answers: a recursive
 * scan rejects any Japanese literal or forbidden answer/canonical field that
 * leaks into a recipe, variant, or module. The *only* sanctioned place for
 * Japanese/romaji content is a `SemanticValue`'s token fragments, authored
 * through {@link defineA1SemanticValue}.
 *
 * Every failure is structured — an {@link AuthoringError} with a stable `code`
 * — and thrown during authoring; nothing is silently normalized.
 */

import { deepFreeze } from "../foundations/deepFreeze";
import { A1_LESSON_MANIFEST } from "./manifest";
import type {
  A1AnyLessonRecipe,
  A1AuthoringErrorCode,
  A1LessonRecipe,
  A1ModuleRecipe,
  A1PhoneticLessonRecipe,
  A1SliceError,
  A1SliceInput,
  A1SliceResult,
  A1VariantTuple,
} from "./types";
import type {
  LessonId,
  LessonPracticeDefinition,
  ModuleId,
  SemanticValue,
  SentenceVariant,
} from "../foundations/types";

// ---------------------------------------------------------------------------
// Authoring gates: shared thresholds
// ---------------------------------------------------------------------------

/** Every instructional/synthesis A1 lesson carries exactly eight models (§9.1). */
export const A1_INSTRUCTIONAL_MODEL_COUNT = 8;

/** The guided and transfer rounds each select two targets (§11.1). */
export const A1_ROUND_TARGET_COUNTS: readonly [number, number] = deepFreeze([2, 2]);

/** A phonetic lesson declares between 8 and 12 contrastive items (inclusive). */
export const A1_PHONETIC_CONTRASTIVE_MIN = 8;
export const A1_PHONETIC_CONTRASTIVE_MAX = 12;

/**
 * A phonetic lesson declares between 8 and 12 practice target references
 * (inclusive) — one per practice exercise. At least five must be distinct so a
 * drill is never four items padded by repeats, and no single target may be
 * reused more than twice, so spaced repetition never collapses onto one glyph.
 */
export const A1_PHONETIC_PRACTICE_MIN = 8;
export const A1_PHONETIC_PRACTICE_MAX = 12;
export const A1_PHONETIC_PRACTICE_MIN_UNIQUE = 5;
export const A1_PHONETIC_PRACTICE_MAX_REUSE = 2;

// ---------------------------------------------------------------------------
// Structured authoring error
// ---------------------------------------------------------------------------

/** A structured, catchable authoring failure with a stable code. */
export class AuthoringError extends Error {
  readonly code: A1AuthoringErrorCode;
  readonly detail?: string;

  constructor(code: A1AuthoringErrorCode, message: string, detail?: string) {
    super(message);
    this.name = "AuthoringError";
    this.code = code;
    this.detail = detail;
    // Preserve `instanceof AuthoringError` across the TS/ES class transpile.
    Object.setPrototypeOf(this, AuthoringError.prototype);
  }
}

// ---------------------------------------------------------------------------
// Recursive no-answer / no-Japanese scan
// ---------------------------------------------------------------------------

/**
 * Field names that would smuggle a learner-visible answer or raw Japanese/romaji
 * literal into a recipe. Semantic-value authoring uses `jp`/`romaji` fragments
 * legitimately, so those objects go through {@link defineA1SemanticValue}, which
 * bypasses this scan.
 */
const FORBIDDEN_FIELD_NAMES: ReadonlySet<string> = new Set([
  "answer",
  "canonical",
  "canonicalAnswer",
  "canonicalJapanese",
  "jp",
  "romaji",
  "visibleTargetKey",
]);

/**
 * Hiragana, katakana (incl. halfwidth), CJK ideographs, CJK compatibility
 * ideographs, CJK symbols/punctuation (incl. the iteration mark 々 and
 * ideographic punctuation like 。 and 、), and fullwidth ASCII (fullwidth
 * romaji/digits/punctuation, which can otherwise smuggle Japanese-rendered
 * text past a naive ASCII check).
 */
const JAPANESE_PATTERN =
  /[\u3000-\u303f\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff01-\uff60\uff66-\uff9f]/;

/**
 * Recursively assert that a value carries neither a forbidden answer/canonical
 * field nor a Japanese literal. Throws the first violation it finds.
 */
function assertNoForbiddenContent(value: unknown, path = "$"): void {
  if (value === null || value === undefined) return;

  if (typeof value === "string") {
    if (JAPANESE_PATTERN.test(value)) {
      throw new AuthoringError(
        "japanese-literal",
        `Japanese literal is not allowed outside semantic values (at ${path}).`,
        path,
      );
    }
    return;
  }

  if (typeof value !== "object") return;

  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      assertNoForbiddenContent(item, `${path}[${index}]`),
    );
    return;
  }

  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (FORBIDDEN_FIELD_NAMES.has(key)) {
      throw new AuthoringError(
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
  code: A1AuthoringErrorCode,
  label: string,
): void {
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) {
      throw new AuthoringError(code, `Duplicate ${label} id "${id}".`, id);
    }
    seen.add(id);
  }
}

function assertRoundShape(practice: LessonPracticeDefinition): void {
  for (const [index, round] of [practice.roundOne, practice.roundTwo].entries()) {
    const expectedTargetCount = A1_ROUND_TARGET_COUNTS[index];
    if (round.targetCount !== expectedTargetCount) {
      throw new AuthoringError(
        "round-shape",
        `Round "${round.id}" must select exactly ${expectedTargetCount} targets, has ${round.targetCount}.`,
        round.id,
      );
    }
    assertUniqueIds(
      round.candidateVariantIds,
      "duplicate-target-ref",
      "candidate variant",
    );
  }
}

// ---------------------------------------------------------------------------
// Builders
// ---------------------------------------------------------------------------

/**
 * Validate and deep-freeze an instructional/synthesis lesson recipe. Enforces
 * the exact model count, unique model IDs, round shape, unique target refs, and
 * that a synthesis lesson introduces no new concept/sense — then freezes.
 */
export function defineA1Lesson(recipe: A1LessonRecipe): A1LessonRecipe {
  assertNoForbiddenContent(recipe, "lesson");

  if (recipe.modelVariantIds.length !== A1_INSTRUCTIONAL_MODEL_COUNT) {
    throw new AuthoringError(
      "model-count",
      `Lesson "${recipe.id}" must have exactly ${A1_INSTRUCTIONAL_MODEL_COUNT} models, has ${recipe.modelVariantIds.length}.`,
      recipe.id,
    );
  }
  assertUniqueIds(recipe.modelVariantIds, "duplicate-id", "model variant");
  assertRoundShape(recipe.practice);

  if (
    recipe.contract === "synthesis" &&
    (recipe.introducedConceptIds.length > 0 ||
      recipe.introducedSenseIds.length > 0)
  ) {
    throw new AuthoringError(
      "synthesis-new-content",
      `Synthesis lesson "${recipe.id}" must not introduce new concepts or senses.`,
      recipe.id,
    );
  }

  return deepFreeze(recipe);
}

/**
 * Validate and deep-freeze a phonetic lesson recipe. Enforces the 8-12
 * contrastive-item threshold and unique contrastive items, then the practice
 * target-ref contract: 8-12 refs, at least five distinct, and each reused at
 * most twice. There is deliberately *no* blanket uniqueness on the practice
 * refs — that would forbid the allowed up-to-twice spaced reuse. No
 * predicate/role fiction is invented for a kana drill.
 */
export function defineA1PhoneticLesson(
  recipe: A1PhoneticLessonRecipe,
): A1PhoneticLessonRecipe {
  assertNoForbiddenContent(recipe, "phonetic-lesson");

  const count = recipe.contrastiveItemIds.length;
  if (
    count < A1_PHONETIC_CONTRASTIVE_MIN ||
    count > A1_PHONETIC_CONTRASTIVE_MAX
  ) {
    throw new AuthoringError(
      "contrastive-count",
      `Phonetic lesson "${recipe.id}" must have ${A1_PHONETIC_CONTRASTIVE_MIN}-${A1_PHONETIC_CONTRASTIVE_MAX} contrastive items, has ${count}.`,
      recipe.id,
    );
  }
  assertUniqueIds(recipe.contrastiveItemIds, "duplicate-id", "contrastive item");

  const refs = recipe.practiceTargetRefs;
  if (
    refs.length < A1_PHONETIC_PRACTICE_MIN ||
    refs.length > A1_PHONETIC_PRACTICE_MAX
  ) {
    throw new AuthoringError(
      "practice-ref-count",
      `Phonetic lesson "${recipe.id}" must have ${A1_PHONETIC_PRACTICE_MIN}-${A1_PHONETIC_PRACTICE_MAX} practice target refs, has ${refs.length}.`,
      recipe.id,
    );
  }

  const refCounts = new Map<string, number>();
  for (const ref of refs) {
    refCounts.set(ref, (refCounts.get(ref) ?? 0) + 1);
  }

  if (refCounts.size < A1_PHONETIC_PRACTICE_MIN_UNIQUE) {
    throw new AuthoringError(
      "practice-ref-unique",
      `Phonetic lesson "${recipe.id}" must have at least ${A1_PHONETIC_PRACTICE_MIN_UNIQUE} unique practice target refs, has ${refCounts.size}.`,
      recipe.id,
    );
  }

  for (const [ref, uses] of refCounts) {
    if (uses > A1_PHONETIC_PRACTICE_MAX_REUSE) {
      throw new AuthoringError(
        "practice-ref-reuse",
        `Practice target ref "${ref}" in phonetic lesson "${recipe.id}" is reused ${uses} times (max ${A1_PHONETIC_PRACTICE_MAX_REUSE}).`,
        ref,
      );
    }
  }

  return deepFreeze(recipe);
}

/**
 * Validate and deep-freeze a module recipe. Enforces exactly four unique
 * lesson IDs.
 */
export function defineA1Module(recipe: A1ModuleRecipe): A1ModuleRecipe {
  assertNoForbiddenContent(recipe, "module");

  if (recipe.lessonIds.length !== 4) {
    throw new AuthoringError(
      "module-lesson-count",
      `Module "${recipe.id}" must have exactly 4 lessons, has ${recipe.lessonIds.length}.`,
      recipe.id,
    );
  }
  assertUniqueIds(recipe.lessonIds, "duplicate-id", "lesson");

  return deepFreeze(recipe);
}

/**
 * The single sanctioned path for authoring Japanese/romaji content. Enforces
 * at least one token fragment, then deep-freezes the semantic value. This does
 * NOT run the no-Japanese scan — its whole purpose is to carry the authored
 * `jp`/`romaji` fragments.
 */
export function defineA1SemanticValue(value: SemanticValue): SemanticValue {
  if (value.tokenFragments.length === 0) {
    throw new AuthoringError(
      "empty-fragments",
      `Semantic value "${value.id}" must have at least one token fragment.`,
      value.id,
    );
  }
  return deepFreeze(value);
}

/**
 * Expand an authoring tuple into a frozen `SentenceVariant`. `slotValues` is
 * shallow-copied into a new object before freezing, so later mutation of the
 * *source tuple's* `slotValues` reference cannot leak into the returned
 * variant. `discourse` and `form`, by contrast, are carried over *by
 * reference* — the returned variant's `discourse`/`form` is the exact same
 * object the tuple was authored with, not a copy. `deepFreeze` then walks and
 * freezes that shared object in place, so if the same `discourse`/`form`
 * object is reused across multiple tuples (a common authoring pattern), it
 * becomes frozen for all of them the first time any variant referencing it is
 * built. Variants store semantic IDs only; a Japanese literal anywhere is
 * rejected.
 */
export function variantFromTuple(tuple: A1VariantTuple): SentenceVariant {
  assertNoForbiddenContent(tuple, "variant");

  return deepFreeze({
    id: tuple.id,
    sentenceFamilyId: tuple.familyId,
    discourse: tuple.discourse,
    contextId: tuple.contextId,
    slotValues: { ...tuple.slotValues },
    form: tuple.form,
    pedagogicalUse: tuple.pedagogicalUse,
  });
}

// ---------------------------------------------------------------------------
// Module-local slice assembly
// ---------------------------------------------------------------------------

/**
 * Assemble a *partial* A1 slice (one or more modules with their lessons) for
 * module-local authoring in later tasks, without pretending the full 48-lesson
 * release is valid. A partial slice may cover any subset of the canonical
 * modules/lessons, but within that subset it must be internally consistent:
 * no lesson or module ID is provided twice (never silently overwritten), every
 * lesson a module references is present, every provided lesson is referenced
 * by exactly one provided module (no orphans), every provided lesson ID is a
 * canonical A1 lesson (validated against the manifest *before* comparing
 * contracts), and every provided lesson's contract matches its canonical
 * manifest contract.
 */
export function assembleA1Slice(input: A1SliceInput): A1SliceResult {
  const errors: A1SliceError[] = [];

  const lessonById: Record<LessonId, A1AnyLessonRecipe> = {};
  for (const lesson of input.lessons) {
    if (Object.prototype.hasOwnProperty.call(lessonById, lesson.id)) {
      errors.push({
        code: "duplicate-lesson-id",
        message: `Lesson "${lesson.id}" is provided more than once.`,
        detail: lesson.id,
      });
      continue;
    }
    lessonById[lesson.id] = lesson;
  }

  const moduleById: Record<ModuleId, A1ModuleRecipe> = {};
  for (const module of input.modules) {
    if (Object.prototype.hasOwnProperty.call(moduleById, module.id)) {
      errors.push({
        code: "duplicate-module-id",
        message: `Module "${module.id}" is provided more than once.`,
        detail: module.id,
      });
      continue;
    }
    moduleById[module.id] = module;
  }

  const referencedLessonIds = new Set<LessonId>();
  for (const module of Object.values(moduleById)) {
    for (const lessonId of module.lessonIds) {
      referencedLessonIds.add(lessonId);
      if (!Object.prototype.hasOwnProperty.call(lessonById, lessonId)) {
        errors.push({
          code: "missing-lesson",
          message: `Module "${module.id}" references missing lesson "${lessonId}".`,
          detail: lessonId,
        });
      }
    }
  }

  for (const lesson of Object.values(lessonById)) {
    if (!referencedLessonIds.has(lesson.id)) {
      errors.push({
        code: "orphan-lesson-id",
        message: `Lesson "${lesson.id}" is provided but no provided module references it.`,
        detail: lesson.id,
      });
    }

    // Validate the lesson id against the canonical manifest *before* ever
    // comparing contracts: an unrecognized id has no manifest contract to
    // compare against, so it must not also be reported as a mismatch.
    const manifestEntry = A1_LESSON_MANIFEST[lesson.id];
    if (!manifestEntry) {
      errors.push({
        code: "unknown-lesson-id",
        message: `Lesson "${lesson.id}" is not a canonical A1 lesson id.`,
        detail: lesson.id,
      });
      continue;
    }

    if (lesson.contract !== manifestEntry.contract) {
      errors.push({
        code: "contract-mismatch",
        message: `Lesson "${lesson.id}" contract "${lesson.contract}" does not match manifest contract "${manifestEntry.contract}".`,
        detail: lesson.id,
      });
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, lessonById, moduleById };
}
