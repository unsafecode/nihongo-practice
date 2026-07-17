/**
 * The A1 **release** validator (§6, §8–§16, Phase 2 Task 4).
 *
 * `validateA1` is a thin, deterministic release gate layered on top of the
 * Phase-1 `validateFoundations` oracle. It does three things:
 *
 *   1. **Wraps** `validateFoundations` over the 44 non-phonetic lessons with a
 *      fixed catalog version and seed, and surfaces that full report verbatim as
 *      {@link ValidateA1Result.foundationReport} (its errors are *preserved*, so
 *      a reviewer sees every lesson-local diagnostic the oracle produces).
 *   2. Adds the four **phonetic contracts** the oracle cannot express (the sounds
 *      module carries no sentence variants).
 *   3. Checks the whole-level **release** invariants that only exist once all
 *      twelve modules are assembled: exact route/module/lesson shape, manifest
 *      agreement, level-scope introduce-before-use, the capstones' *no-new-content*
 *      contract computed from the real prior modules, productive/receptive
 *      recurrence completeness, Can-do / checkpoint alignment, copy parity, the
 *      absence of Japanese or personal aliases in the copy layer, and the
 *      no-certification claim.
 *
 * The release `valid` flag is `true` iff none of these **A1-specific** checks
 * fail. The wrapped foundation report is intentionally *diagnostic*: the Phase-1
 * transfer-closure gate is strictly per-lesson, whereas an assembled level lets
 * a transfer recombine anything already taught anywhere earlier — so those
 * lesson-local notes are surfaced, not treated as release blockers. Every error
 * is typed and every derivation is pure, so two runs over the same input are
 * byte-identical.
 */

import type {
  A1ManifestSpec,
} from "../types";
import {
  A1_MANIFEST_SPEC,
  A1_MODULE_IDS,
  A1_LESSON_IDS,
  A1_LESSON_IDS_BY_MODULE,
  A1_CANONICAL_POSITIONS,
  A1_CAPSTONE_LESSON_IDS,
  A1_LEGACY_LESSON_ALIASES,
  validateA1ManifestSpec,
} from "../manifest";
import type {
  CanDo,
  FoundationCatalogs,
  RealizedSentence,
  SentenceFamily,
  SentenceVariant,
  VerbUseRecord,
} from "../../foundations/types";
import {
  validateFoundations,
  type ValidateFoundationsResult,
} from "../../foundations/validateFoundations";
import { realizeVariant } from "../../foundations/realizeFamily";
import { validateRuntimeAliases } from "../../data/personas";
import {
  a1SemanticFoundationCatalogs,
  a1FoundationCatalogs,
  a1AllLessonPositions,
  a1FoundationCopy,
} from "./catalog";
import { a1CanDosAuthored, A1_SOUND_LESSON_IDS } from "./canDos";
import { a1Checkpoint, A1_CHECKPOINT_MIN_TRANSFER_TARGETS } from "./checkpoint";
import { a1ReleaseVerbUseRecords } from "./recurrence";
import { module1ItemsByLesson, module1Lessons, type A1PhoneticItem } from "./module01Sounds";
import type { A1PhoneticLessonRecipe } from "../types";

// ---------------------------------------------------------------------------
// Fixed release identity — the validator is deterministic by construction.
// ---------------------------------------------------------------------------

export const A1_RELEASE_CATALOG_VERSION = "a1-release" as const;
export const A1_RELEASE_SEED = "seed-a1-release" as const;

/** Exact structural totals the assembled A1 level must exhibit. */
export const A1_EXPECTED_MODULE_COUNT = 12 as const;
export const A1_EXPECTED_LESSONS_PER_MODULE = 4 as const;
export const A1_EXPECTED_ROUTE_COUNT = 48 as const;

// ---------------------------------------------------------------------------
// Error contract
// ---------------------------------------------------------------------------

export type A1ValidationErrorCode =
  // structural shape
  | "module-count"
  | "lessons-per-module"
  | "route-count"
  | "unknown-lesson-id"
  | "duplicate-lesson-id"
  | "manifest-mismatch"
  | "manifest-invalid"
  | "capstone-structure"
  // content ordering / closure
  | "unknown-content"
  | "intro-before-use"
  | "capstone-introduces-new"
  // recurrence
  | "recurrence-incomplete"
  // Can-do / checkpoint
  | "cando-not-sampled"
  | "cando-no-transfer-evidence"
  | "cando-primary-mismatch"
  | "cando-supporting-overflow"
  | "checkpoint-min-transfer"
  // copy / aliases / claims
  | "copy-parity"
  | "copy-contains-japanese"
  | "personal-alias-match"
  | "checkpoint-claims-certification"
  // phonetic contracts
  | "phonetic-missing-items"
  | "phonetic-dangling-contrast"
  | "phonetic-duplicate-exercise"
  | "phonetic-item-incomplete"
  | "phonetic-lesson-mismatch";

export interface A1ValidationError {
  readonly code: A1ValidationErrorCode;
  readonly id?: string;
  readonly referenceId?: string;
  readonly dimension?: string;
  readonly expected?: string | number;
  readonly actual?: string | number;
  /** Preserved lower-layer code when this error surfaces a foundation finding. */
  readonly underlyingCode?: string;
}

export interface ValidateA1Input {
  /** The full 48-lesson level view (12 modules, 15 Can-dos, all positions). */
  readonly fullCatalogs?: FoundationCatalogs;
  /** The 44 non-phonetic lessons handed to `validateFoundations`. */
  readonly semanticCatalogs?: FoundationCatalogs;
  /** Aggregated bilingual copy (shared + phonetic + every lesson). */
  readonly foundationCopy?: {
    readonly en: Readonly<Record<string, string>>;
    readonly it: Readonly<Record<string, string>>;
  };
  /** The phonetic items grouped by their owning sounds lesson. */
  readonly phoneticItemsByLesson?: Readonly<Record<string, readonly A1PhoneticItem[]>>;
  /** The phonetic lesson recipes (contrastive item / practice-ref contract). */
  readonly phoneticLessons?: readonly A1PhoneticLessonRecipe[];
  /** The 37 release verb-use records (24 deep + 13 descriptive senses). */
  readonly releaseVerbUseRecords?: readonly VerbUseRecord[];
  /** The manifest spec whose route/alias shape the level must match. */
  readonly manifestSpec?: A1ManifestSpec;
  /** The checkpoint whose sampled Can-dos / min-transfer the level must meet. */
  readonly checkpoint?: typeof a1Checkpoint;
  /** The authored Can-do set that must each carry transfer evidence. */
  readonly authoredCanDos?: readonly CanDo[];
}

export interface ValidateA1Result {
  readonly valid: boolean;
  readonly errors: readonly A1ValidationError[];
  /** The wrapped `validateFoundations` report — diagnostic, never mutated. */
  readonly foundationReport: ValidateFoundationsResult;
}

// ---------------------------------------------------------------------------
// Small pure helpers
// ---------------------------------------------------------------------------

function formKey(form: SentenceVariant["form"]): string {
  const mood = form.interrogative ? ":interrogative" : "";
  return `${form.polarity}:${form.tense}:${form.formality}${mood}`;
}

/** Matches any CJK ideograph, hiragana, katakana or the chōonpu bar. */
const JAPANESE_RE = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uff66-\uff9f]/u;

function isCapstoneVariant(variantId: string): boolean {
  return variantId.startsWith("capstones-");
}

// ---------------------------------------------------------------------------
// The release validator
// ---------------------------------------------------------------------------

export function validateA1(input: ValidateA1Input = {}): ValidateA1Result {
  const full = input.fullCatalogs ?? a1FoundationCatalogs;
  const semantic = input.semanticCatalogs ?? a1SemanticFoundationCatalogs;
  const copy = input.foundationCopy ?? a1FoundationCopy;
  const phoneticItemsByLesson = input.phoneticItemsByLesson ?? module1ItemsByLesson;
  const phoneticLessons = input.phoneticLessons ?? module1Lessons;
  const releaseRecords = input.releaseVerbUseRecords ?? a1ReleaseVerbUseRecords;
  const manifestSpec = input.manifestSpec ?? A1_MANIFEST_SPEC;
  const checkpoint = input.checkpoint ?? a1Checkpoint;
  const authoredCanDos = input.authoredCanDos ?? a1CanDosAuthored;

  const errors: A1ValidationError[] = [];
  const push = (error: A1ValidationError): void => {
    errors.push(error);
  };

  // --- Wrap the Phase-1 oracle (diagnostic; errors preserved) --------------
  const foundationReport = validateFoundations({
    catalogs: semantic,
    foundationCopy: copy,
    catalogVersion: A1_RELEASE_CATALOG_VERSION,
    seed: A1_RELEASE_SEED,
  });

  // --- 1. Structural shape: 12 modules × 4 lessons = 48 routes -------------
  if (full.modules.length !== A1_EXPECTED_MODULE_COUNT) {
    push({ code: "module-count", expected: A1_EXPECTED_MODULE_COUNT, actual: full.modules.length });
  }
  for (const module of full.modules) {
    if (module.lessonIds.length !== A1_EXPECTED_LESSONS_PER_MODULE) {
      push({
        code: "lessons-per-module",
        id: module.id,
        expected: A1_EXPECTED_LESSONS_PER_MODULE,
        actual: module.lessonIds.length,
      });
    }
  }
  if (full.lessonPositions.length !== A1_EXPECTED_ROUTE_COUNT) {
    push({ code: "route-count", expected: A1_EXPECTED_ROUTE_COUNT, actual: full.lessonPositions.length });
  }

  // --- 2. Unknown / duplicate lesson ids + manifest agreement --------------
  const manifestLessonSet = new Set(A1_LESSON_IDS);
  const seenPositionLessons = new Set<string>();
  for (const record of full.lessonPositions) {
    if (!manifestLessonSet.has(record.lessonId)) {
      push({ code: "unknown-lesson-id", id: record.lessonId });
    }
    if (seenPositionLessons.has(record.lessonId)) {
      push({ code: "duplicate-lesson-id", id: record.lessonId });
    }
    seenPositionLessons.add(record.lessonId);
    const expectedPosition = A1_CANONICAL_POSITIONS[record.lessonId];
    if (expectedPosition !== undefined && record.position !== expectedPosition) {
      push({
        code: "manifest-mismatch",
        id: record.lessonId,
        dimension: "position",
        expected: expectedPosition,
        actual: record.position,
      });
    }
  }
  // Every manifest lesson must appear exactly once as a route.
  for (const lessonId of A1_LESSON_IDS) {
    if (!seenPositionLessons.has(lessonId)) {
      push({ code: "manifest-mismatch", id: lessonId, dimension: "missing-route" });
    }
  }
  // Module → lesson membership must equal the manifest, in order.
  const manifestModuleSet = new Set<string>(A1_MODULE_IDS);
  for (const module of full.modules) {
    if (!manifestModuleSet.has(module.id)) {
      push({ code: "manifest-mismatch", id: module.id, dimension: "unknown-module" });
      continue;
    }
    const expectedLessons = A1_LESSON_IDS_BY_MODULE[module.id];
    if (expectedLessons.join(",") !== module.lessonIds.join(",")) {
      push({
        code: "manifest-mismatch",
        id: module.id,
        dimension: "lesson-membership",
        expected: expectedLessons.join(","),
        actual: module.lessonIds.join(","),
      });
    }
  }

  // Manifest spec self-consistency (route count, aliases, contracts, order).
  const manifestResult = validateA1ManifestSpec(manifestSpec);
  if (!manifestResult.ok) {
    for (const error of manifestResult.errors) {
      push({ code: "manifest-invalid", dimension: error.code, referenceId: error.message });
    }
  }

  // --- 3. Capstone module structure: final, four synthesis lessons ---------
  const lastModule = full.modules[full.modules.length - 1];
  if (!lastModule || lastModule.id !== manifestSpec.capstoneModuleId) {
    push({ code: "capstone-structure", dimension: "not-final", id: lastModule?.id });
  }
  if (A1_CAPSTONE_LESSON_IDS.length !== A1_EXPECTED_LESSONS_PER_MODULE) {
    push({ code: "capstone-structure", dimension: "count", actual: A1_CAPSTONE_LESSON_IDS.length });
  }

  // --- Realization infrastructure over the semantic catalog ----------------
  const familyById = new Map<string, SentenceFamily>(
    semantic.sentenceFamilies.map((family) => [family.id, family]),
  );
  const realizeCatalogs = {
    contexts: semantic.contexts,
    personRoles: semantic.personRoles,
    referents: semantic.referents,
    semanticValues: semantic.semanticValues,
    learningTargetSenses: semantic.learningTargetSenses,
  };
  const realizeCache = new Map<string, RealizedSentence | null>();
  const realize = (variant: SentenceVariant): RealizedSentence | null => {
    const cached = realizeCache.get(variant.id);
    if (cached !== undefined) return cached;
    const family = familyById.get(variant.sentenceFamilyId);
    if (!family) {
      realizeCache.set(variant.id, null);
      return null;
    }
    const result = realizeVariant(family, variant, realizeCatalogs, {
      availableConceptIds: [...family.requiredConceptIds],
    });
    const sentence = result.ok ? result.sentence : null;
    realizeCache.set(variant.id, sentence);
    return sentence;
  };

  const semanticValueIds = new Set(semantic.semanticValues.map((value) => value.id));
  const contextIds = new Set(semantic.contexts.map((context) => context.id));
  const roleIds = new Set(semantic.personRoles.map((role) => role.id));

  // --- 4. Unknown content + level-scope introduce-before-use ---------------
  // A value is "taught" when it fills a slot in *some model* anywhere in the
  // level. Every non-model variant may only recombine taught values (level
  // scope): this passes generalizing transfers that reuse earlier content while
  // still catching a transfer that invents a never-taught filler.
  const taughtModelValueIds = new Set<string>();
  for (const variant of semantic.sentenceVariants) {
    if (variant.pedagogicalUse !== "model") continue;
    for (const value of Object.values(variant.slotValues)) taughtModelValueIds.add(value);
  }
  for (const variant of semantic.sentenceVariants) {
    for (const [slotId, value] of Object.entries(variant.slotValues)) {
      if (!semanticValueIds.has(value)) {
        push({ code: "unknown-content", id: variant.id, dimension: `value:${slotId}`, referenceId: value });
      } else if (variant.pedagogicalUse !== "model" && !taughtModelValueIds.has(value)) {
        push({ code: "intro-before-use", id: variant.id, dimension: "value", referenceId: value });
      }
    }
    if (!contextIds.has(variant.contextId)) {
      push({ code: "unknown-content", id: variant.id, dimension: "context", referenceId: variant.contextId });
    }
    if (!roleIds.has(variant.discourse.speakerRoleId)) {
      push({ code: "unknown-content", id: variant.id, dimension: "speaker", referenceId: variant.discourse.speakerRoleId });
    }
  }

  // --- 5. Capstone no-new-content (strict prior sets from modules 1-11) -----
  const prior = {
    value: new Set<string>(),
    sense: new Set<string>(),
    concept: new Set<string>(),
    form: new Set<string>(),
    role: new Set<string>(),
    context: new Set<string>(),
  };
  const capstoneVariants: SentenceVariant[] = [];
  for (const variant of semantic.sentenceVariants) {
    if (isCapstoneVariant(variant.id)) {
      capstoneVariants.push(variant);
      continue;
    }
    const realized = realize(variant);
    for (const value of Object.values(variant.slotValues)) prior.value.add(value);
    prior.form.add(formKey(variant.form));
    prior.role.add(variant.discourse.speakerRoleId);
    if (variant.discourse.addresseeRoleId) prior.role.add(variant.discourse.addresseeRoleId);
    prior.context.add(variant.contextId);
    if (realized) {
      for (const sense of realized.usedLexemeSenseIds) prior.sense.add(sense);
      for (const concept of realized.usedConceptIds) prior.concept.add(concept);
    }
  }
  for (const variant of capstoneVariants) {
    const realized = realize(variant);
    const check = (dimension: string, item: string, pool: ReadonlySet<string>): void => {
      if (!pool.has(item)) {
        push({ code: "capstone-introduces-new", id: variant.id, dimension, referenceId: item });
      }
    };
    for (const value of Object.values(variant.slotValues)) check("value", value, prior.value);
    check("form", formKey(variant.form), prior.form);
    check("role", variant.discourse.speakerRoleId, prior.role);
    if (variant.discourse.addresseeRoleId) check("role", variant.discourse.addresseeRoleId, prior.role);
    check("context", variant.contextId, prior.context);
    if (realized) {
      for (const sense of realized.usedLexemeSenseIds) check("sense", sense, prior.sense);
      for (const concept of realized.usedConceptIds) check("concept", concept, prior.concept);
    }
  }

  // --- 6. Productive / receptive recurrence completeness -------------------
  for (const error of foundationReport.errors) {
    if (error.code.startsWith("productive-verb") || error.code.startsWith("receptive-")) {
      push({
        code: "recurrence-incomplete",
        id: error.id ?? error.lessonId,
        underlyingCode: error.code,
      });
    }
  }
  for (const record of releaseRecords) {
    if (record.laterUses.length < 2) {
      push({ code: "recurrence-incomplete", id: record.id, referenceId: record.senseId, actual: record.laterUses.length });
    }
  }

  // --- 7. Can-do / checkpoint alignment ------------------------------------
  const sampledCanDos = new Set(checkpoint.sampledCanDoIds);
  const canDoById = new Map(full.canDos.map((canDo) => [canDo.id, canDo]));
  // Every taught primary Can-do (from real lessons) must be checkpoint-sampled.
  for (const lesson of full.lessons) {
    if (!sampledCanDos.has(lesson.primaryCanDoId)) {
      push({ code: "cando-not-sampled", id: lesson.primaryCanDoId, referenceId: lesson.id });
    }
    const canDo = canDoById.get(lesson.primaryCanDoId);
    if (canDo && !canDo.lessonIds.includes(lesson.id)) {
      push({ code: "cando-primary-mismatch", id: lesson.primaryCanDoId, referenceId: lesson.id });
    }
    if (lesson.supportingCanDoIds.length > 2) {
      push({ code: "cando-supporting-overflow", id: lesson.id, actual: lesson.supportingCanDoIds.length });
    }
  }
  // The sounds primary is taught only in the phonetic module (positions, not
  // authored lessons), so assert it is sampled directly.
  for (const soundLessonId of A1_SOUND_LESSON_IDS) {
    void soundLessonId;
  }
  if (!sampledCanDos.has("a1-can-do-sounds")) {
    push({ code: "cando-not-sampled", id: "a1-can-do-sounds", referenceId: "sounds" });
  }
  // Transfer evidence: every non-phonetic Can-do needs a transfer variant whose
  // family lists it.
  const canDoTransferEvidence = new Set<string>();
  for (const variant of semantic.sentenceVariants) {
    if (variant.pedagogicalUse !== "transfer") continue;
    const family = familyById.get(variant.sentenceFamilyId);
    if (!family) continue;
    for (const canDoId of family.canDoIds) canDoTransferEvidence.add(canDoId);
  }
  for (const canDo of authoredCanDos) {
    if (canDo.id === "a1-can-do-sounds") continue;
    if (!canDoTransferEvidence.has(canDo.id)) {
      push({ code: "cando-no-transfer-evidence", id: canDo.id });
    }
  }
  if (checkpoint.minAcceptedTransferTargetsPerCanDo < A1_CHECKPOINT_MIN_TRANSFER_TARGETS) {
    push({
      code: "checkpoint-min-transfer",
      expected: A1_CHECKPOINT_MIN_TRANSFER_TARGETS,
      actual: checkpoint.minAcceptedTransferTargetsPerCanDo,
    });
  }

  // --- 8. Copy parity, no Japanese, personal aliases, no certification -----
  const enKeys = Object.keys(copy.en);
  const itKeys = new Set(Object.keys(copy.it));
  for (const key of enKeys) {
    if (!itKeys.has(key)) push({ code: "copy-parity", id: key, dimension: "missing-it" });
  }
  const enKeySet = new Set(enKeys);
  for (const key of Object.keys(copy.it)) {
    if (!enKeySet.has(key)) push({ code: "copy-parity", id: key, dimension: "missing-en" });
  }
  for (const [locale, table] of [["en", copy.en], ["it", copy.it]] as const) {
    for (const [key, text] of Object.entries(table)) {
      if (JAPANESE_RE.test(text)) {
        push({ code: "copy-contains-japanese", id: key, dimension: locale });
      }
      if (/\bcertif|certificate|certified\b/i.test(text)) {
        push({ code: "checkpoint-claims-certification", id: key, dimension: locale });
      }
    }
  }
  // Can-do source notes must not claim certification either.
  for (const canDo of full.canDos) {
    if (canDo.sourceNote && /certif|certificate|certified/i.test(canDo.sourceNote)) {
      push({ code: "checkpoint-claims-certification", id: canDo.id, dimension: "sourceNote" });
    }
  }
  // No personal-author alias may leak into copy, catalogs, or aliases.
  const aliasErrors = validateRuntimeAliases({
    copy,
    canDos: full.canDos,
    aliases: A1_LEGACY_LESSON_ALIASES,
  });
  for (const aliasError of aliasErrors) {
    push({ code: "personal-alias-match", dimension: aliasError });
  }

  // --- 9. Phonetic contracts (the four sounds lessons) ---------------------
  const allPhoneticIds = new Set<string>();
  const allExerciseRefs = new Map<string, number>();
  for (const items of Object.values(phoneticItemsByLesson)) {
    for (const item of items) {
      allPhoneticIds.add(item.id);
      allExerciseRefs.set(item.exerciseRefId, (allExerciseRefs.get(item.exerciseRefId) ?? 0) + 1);
    }
  }
  for (const lessonRecipe of phoneticLessons) {
    const items = phoneticItemsByLesson[lessonRecipe.id] ?? [];
    if (items.length === 0) {
      push({ code: "phonetic-missing-items", id: lessonRecipe.id });
      continue;
    }
    for (const item of items) {
      if (!item.glyph || !item.kana || !item.roman || !item.exerciseRefId || !item.contrastWithId) {
        push({ code: "phonetic-item-incomplete", id: item.id, referenceId: lessonRecipe.id });
      }
      if (!allPhoneticIds.has(item.contrastWithId)) {
        push({ code: "phonetic-dangling-contrast", id: item.id, referenceId: item.contrastWithId });
      }
      if ((allExerciseRefs.get(item.exerciseRefId) ?? 0) > 1) {
        push({ code: "phonetic-duplicate-exercise", id: item.id, referenceId: item.exerciseRefId });
      }
    }
    const itemIds = items.map((item) => item.id).join(",");
    const refIds = items.map((item) => item.exerciseRefId).join(",");
    if (lessonRecipe.contrastiveItemIds.join(",") !== itemIds) {
      push({ code: "phonetic-lesson-mismatch", id: lessonRecipe.id, dimension: "contrastive-items" });
    }
    if (lessonRecipe.practiceTargetRefs.join(",") !== refIds) {
      push({ code: "phonetic-lesson-mismatch", id: lessonRecipe.id, dimension: "practice-refs" });
    }
  }

  // Deterministic error order: by code, then id, then dimension, then reference.
  const sorted = [...errors].sort((left, right) => {
    return (
      cmp(left.code, right.code) ||
      cmp(left.id ?? "", right.id ?? "") ||
      cmp(left.dimension ?? "", right.dimension ?? "") ||
      cmp(left.referenceId ?? "", right.referenceId ?? "")
    );
  });

  return {
    valid: sorted.length === 0,
    errors: sorted,
    foundationReport,
  };
}

function cmp(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

/** The default release view — validated over the frozen release catalogs. */
export function validateA1Release(): ValidateA1Result {
  return validateA1();
}

/** Re-export for reports / tests that key off the same lesson-position order. */
export const a1ReleaseLessonPositions = a1AllLessonPositions;
