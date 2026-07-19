/**
 * The A2 **release** validator (Phase 3 Task 7).
 *
 * `validateA2`/`validateA2Release` compose the eight numbered release gates
 * the design spec requires, in stable order:
 *
 *  1. Manifest structural shape — module/lesson/route counts, unknown/
 *     duplicate lesson ids, manifest membership agreement, and the
 *     injected `A2ManifestSpec`'s own self-consistency (wrapped).
 *  2. The Phase-1 `validateFoundations` oracle, run over the complete
 *     catalogs + copy + the real cumulative availability map (wrapped;
 *     every underlying code preserved, never re-derived).
 *  3. The grammar spiral: structural shape (`validateA2GrammarSpiral`) and
 *     content evidence (`auditA2GrammarSpiralEvidence`), both wrapped.
 *  4. The contextual kanji catalog (`validateA2Kanji`; exact 120/
 *     distribution/order/no-bypass), wrapped.
 *  5. Can-do / checkpoint / synthesis-integration coverage: every one of
 *     the 59 canonical Can-dos is genuinely served and has real transfer
 *     evidence; the checkpoint samples all 59 with every id resolving and
 *     a minimum accepted-transfer-targets floor; the synthesis-integration
 *     map covers exactly the 14 instructional modules (never itself).
 *  6. The synthesis module introduces nothing new: every sentence family,
 *     semantic value, and lexeme sense a synthesis-module variant uses is
 *     independently proven to already have been used by some non-synthesis
 *     lesson (never inferred from the module's own declared, and
 *     independently-checked-empty, `introducedConceptIds`/`introducedSenseIds`).
 *  7. EN/IT copy parity (both directions, plus non-empty values), no
 *     Japanese literal anywhere in copy, and no personal alias
 *     (normalized-match, via the shared `validateRuntimeAliases`).
 *  8. No certification/certificate/equivalent claim anywhere in copy.
 *
 * `validateA2(input?)` is the injectable, unit-testable core — every
 * dependency defaults to the real, frozen release data but can be swapped
 * for a deliberately broken fixture so each check's representative failure
 * path is provable. `validateA2Release()` is the zero-argument release
 * view additionally carrying `buildA2Reports()`'s machine-readable metrics,
 * exactly like `validateA1Release()` does for A1.
 */
import { validateFoundations } from "../../foundations/validateFoundations";
import { realizeVariant, type RealizeVariantCatalogs } from "../../foundations/realizeFamily";
import { validateRuntimeAliases } from "../../data/personas";
import type {
  CheckpointDefinition,
  FoundationCatalogs,
  RealizedSentence,
  SentenceVariant,
} from "../../foundations/types";
import { a2FoundationCatalogs, a2FoundationCopy, A2_AVAILABLE_CONTENT_BY_LESSON } from "./catalog";
import { buildA2Reports, type A2CoverageReports } from "./reports";
import {
  A2_MANIFEST_SPEC,
  A2_MODULE_IDS,
  A2_LESSON_IDS_BY_MODULE,
  A2_CANONICAL_POSITIONS,
  validateA2ManifestSpec,
} from "../manifest";
import type { A2ManifestSpec } from "../types";
import { a2Checkpoint, A2_SYNTHESIS_INTEGRATION, A2_INSTRUCTIONAL_MODULE_IDS } from "./checkpoint";
import { A2_ALL_59_CANDO_IDS } from "./canDos";
import { A2_GRAMMAR_SPIRAL, type A2GrammarForm } from "../forms/grammarSpiral";
import {
  validateA2GrammarSpiral,
  auditA2GrammarSpiralEvidence,
  type GrammarEvidenceLesson,
} from "../forms/validateA2GrammarSpiral";
import { validateA2Kanji } from "../kanji/validateA2Kanji";
import {
  A2_KANJI_ENTRIES,
  A2_KANJI_EXPOSURES,
  A2_KANJI_READINGS,
  A2_KANJI_DISTRIBUTION,
} from "../kanji/a2KanjiCatalog";
import type { KanjiEntry, KanjiExposure, KanjiReading } from "../kanji/kanjiTypes";

const A2_RELEASE_CATALOG_VERSION = "a2-validate-release" as const;
const A2_RELEASE_SEED = "a2-validate-release-seed" as const;
const A2_SYNTHESIS_MODULE_ID = "a2-synthesis" as const;

/** Same character class every other A2 no-Japanese guard uses (hiragana,
 * katakana, CJK ideographs, and half-width katakana). */
const JAPANESE_RE = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uff66-\uff9f]/u;
/** Certification/certificate/equivalent, any inflection, case-insensitive. */
const CERTIFICATION_RE = /\b(certif\w*|equivalent\w*)\b/i;

// ---------------------------------------------------------------------------
// Error vocabulary
// ---------------------------------------------------------------------------

export const A2_RELEASE_ERROR_CODES = [
  // 1. manifest structural shape
  "module-count",
  "lessons-per-module",
  "route-count",
  "unknown-lesson-id",
  "duplicate-lesson-id",
  "manifest-mismatch",
  "manifest-invalid",
  // 2. foundation gate (wrapped oracle)
  "foundation-invalid",
  // 3. grammar spiral (wrapped)
  "grammar-spiral-invalid",
  "grammar-evidence-incomplete",
  // 4. kanji (wrapped)
  "kanji-invalid",
  // 5. Can-do / checkpoint / synthesis-integration coverage
  "cando-not-served",
  "cando-no-transfer-evidence",
  "cando-not-sampled",
  "checkpoint-cando-unresolved",
  "checkpoint-min-transfer",
  "synthesis-integration-count",
  // 6. synthesis introduces nothing new
  "synthesis-introduces-content",
  "synthesis-introduces-kanji",
  // 7. copy parity / no Japanese / alias
  "copy-parity",
  "copy-contains-japanese",
  "personal-alias-match",
  // 8. no certification claim
  "checkpoint-claims-certification",
] as const;

export type A2ReleaseErrorCode = (typeof A2_RELEASE_ERROR_CODES)[number];

export interface A2ReleaseValidationError {
  readonly code: A2ReleaseErrorCode;
  readonly id?: string;
  readonly referenceId?: string;
  readonly dimension?: string;
  readonly expected?: string | number;
  readonly actual?: string | number;
  /** Preserved lower-layer code when this error surfaces a foundation/
   * grammar-spiral/kanji finding — never re-derived. */
  readonly underlyingCode?: string;
}

// ---------------------------------------------------------------------------
// Injectable input
// ---------------------------------------------------------------------------

export interface ValidateA2Input {
  readonly catalogs?: FoundationCatalogs;
  readonly foundationCopy?: {
    readonly en: Readonly<Record<string, string>>;
    readonly it: Readonly<Record<string, string>>;
  };
  readonly manifestSpec?: A2ManifestSpec;
  readonly checkpoint?: CheckpointDefinition;
  readonly grammarSpiral?: readonly A2GrammarForm[];
  readonly kanjiEntries?: readonly KanjiEntry[];
  readonly kanjiExposures?: readonly KanjiExposure[];
  readonly kanjiReadings?: readonly KanjiReading[];
  readonly kanjiDistribution?: Readonly<Record<string, number>>;
  readonly allCanDoIds?: readonly string[];
  readonly instructionalModuleIds?: readonly string[];
  readonly synthesisModuleId?: string;
  readonly synthesisIntegration?: Readonly<Record<string, readonly string[]>>;
}

export interface ValidateA2Result {
  readonly valid: boolean;
  readonly errors: readonly A2ReleaseValidationError[];
}

export interface ValidateA2ReleaseResult extends ValidateA2Result {
  readonly reports: A2CoverageReports;
}

function cmp(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

// ---------------------------------------------------------------------------
// The composed validator
// ---------------------------------------------------------------------------

export function validateA2(input: ValidateA2Input = {}): ValidateA2Result {
  const catalogs = input.catalogs ?? a2FoundationCatalogs;
  const copy = input.foundationCopy ?? a2FoundationCopy;
  const manifestSpec = input.manifestSpec ?? A2_MANIFEST_SPEC;
  const checkpoint = input.checkpoint ?? a2Checkpoint;
  const grammarSpiral = input.grammarSpiral ?? A2_GRAMMAR_SPIRAL;
  const kanjiEntries = input.kanjiEntries ?? A2_KANJI_ENTRIES;
  const kanjiExposures = input.kanjiExposures ?? A2_KANJI_EXPOSURES;
  const kanjiReadings = input.kanjiReadings ?? A2_KANJI_READINGS;
  const kanjiDistribution = input.kanjiDistribution ?? A2_KANJI_DISTRIBUTION;
  const allCanDoIds = input.allCanDoIds ?? A2_ALL_59_CANDO_IDS;
  const instructionalModuleIds = input.instructionalModuleIds ?? A2_INSTRUCTIONAL_MODULE_IDS;
  const synthesisModuleId = input.synthesisModuleId ?? A2_SYNTHESIS_MODULE_ID;
  const synthesisIntegration = input.synthesisIntegration ?? A2_SYNTHESIS_INTEGRATION;

  const errors: A2ReleaseValidationError[] = [];
  const push = (error: A2ReleaseValidationError): void => {
    errors.push(error);
  };

  // -------------------------------------------------------------------
  // 1. Manifest structural shape — the assembled catalogs against the
  // real, canonical manifest constants, plus the injected spec's own
  // self-consistency.
  // -------------------------------------------------------------------
  if (catalogs.modules.length !== A2_MODULE_IDS.length) {
    push({ code: "module-count", expected: A2_MODULE_IDS.length, actual: catalogs.modules.length });
  }
  for (const module of catalogs.modules) {
    const expectedLessons = A2_LESSON_IDS_BY_MODULE[module.id];
    const expectedCount = expectedLessons ? expectedLessons.length : 4;
    if (module.lessonIds.length !== expectedCount) {
      push({
        code: "lessons-per-module",
        id: module.id,
        expected: expectedCount,
        actual: module.lessonIds.length,
      });
    }
  }
  const expectedRouteCount = Object.keys(A2_CANONICAL_POSITIONS).length;
  if (catalogs.lessonPositions.length !== expectedRouteCount) {
    push({ code: "route-count", expected: expectedRouteCount, actual: catalogs.lessonPositions.length });
  }

  const canonicalLessonIdSet = new Set(Object.keys(A2_CANONICAL_POSITIONS));
  const seenPositionLessons = new Set<string>();
  for (const record of catalogs.lessonPositions) {
    if (!canonicalLessonIdSet.has(record.lessonId)) {
      push({ code: "unknown-lesson-id", id: record.lessonId });
    }
    if (seenPositionLessons.has(record.lessonId)) {
      push({ code: "duplicate-lesson-id", id: record.lessonId });
    }
    seenPositionLessons.add(record.lessonId);
    const expectedPosition = A2_CANONICAL_POSITIONS[record.lessonId];
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
  for (const lessonId of canonicalLessonIdSet) {
    if (!seenPositionLessons.has(lessonId)) {
      push({ code: "manifest-mismatch", id: lessonId, dimension: "missing-route" });
    }
  }
  const manifestModuleSet = new Set<string>(A2_MODULE_IDS);
  for (const module of catalogs.modules) {
    if (!manifestModuleSet.has(module.id)) {
      push({ code: "manifest-mismatch", id: module.id, dimension: "unknown-module" });
      continue;
    }
    const expectedLessons = A2_LESSON_IDS_BY_MODULE[module.id] ?? [];
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

  const manifestResult = validateA2ManifestSpec(manifestSpec);
  if (!manifestResult.ok) {
    for (const error of manifestResult.errors) {
      push({ code: "manifest-invalid", dimension: error.code, referenceId: error.message });
    }
  }

  // -------------------------------------------------------------------
  // 2. Wrapped `validateFoundations` oracle.
  // -------------------------------------------------------------------
  const foundationResult = validateFoundations({
    catalogs,
    foundationCopy: copy,
    catalogVersion: A2_RELEASE_CATALOG_VERSION,
    seed: A2_RELEASE_SEED,
    availableContentByLesson: A2_AVAILABLE_CONTENT_BY_LESSON,
  });
  for (const error of foundationResult.errors) {
    push({
      code: "foundation-invalid",
      id: error.id ?? error.lessonId,
      dimension: error.dimension,
      referenceId: error.referenceId,
      underlyingCode: error.code,
    });
  }

  // -------------------------------------------------------------------
  // 3. Grammar spiral — structural shape, then content evidence.
  // -------------------------------------------------------------------
  const spiralResult = validateA2GrammarSpiral(grammarSpiral, A2_CANONICAL_POSITIONS);
  for (const error of spiralResult.errors) {
    push({ code: "grammar-spiral-invalid", id: error.id, underlyingCode: error.code });
  }

  const servingFamiliesByCanDoId = new Map<string, Set<string>>();
  for (const family of catalogs.sentenceFamilies) {
    for (const canDoId of family.canDoIds) {
      const set = servingFamiliesByCanDoId.get(canDoId) ?? new Set<string>();
      set.add(family.id);
      servingFamiliesByCanDoId.set(canDoId, set);
    }
  }
  const variantById = new Map<string, SentenceVariant>(catalogs.sentenceVariants.map((v) => [v.id, v]));
  const evidenceByLessonId = new Map<string, GrammarEvidenceLesson>();
  const lessonModuleById = new Map<string, string>();
  for (const lesson of catalogs.lessons) {
    lessonModuleById.set(lesson.id, lesson.moduleId);
    const variantIds = new Set<string>([
      ...lesson.modelVariantIds,
      ...lesson.practice.roundOne.candidateVariantIds,
      ...lesson.practice.roundTwo.candidateVariantIds,
    ]);
    const variants = [...variantIds]
      .map((id) => variantById.get(id))
      .filter((variant): variant is SentenceVariant => variant !== undefined)
      .map((variant) => ({ sentenceFamilyId: variant.sentenceFamilyId, pedagogicalUse: variant.pedagogicalUse }));
    evidenceByLessonId.set(lesson.id, { variants });
  }
  const evidenceResult = auditA2GrammarSpiralEvidence(grammarSpiral, servingFamiliesByCanDoId, evidenceByLessonId);
  for (const error of evidenceResult.errors) {
    push({ code: "grammar-evidence-incomplete", id: error.id, underlyingCode: error.code });
  }

  // -------------------------------------------------------------------
  // 4. Contextual kanji catalog.
  // -------------------------------------------------------------------
  const kanjiCountByModule: Record<string, number> = {};
  for (const moduleId of Object.keys(kanjiDistribution)) kanjiCountByModule[moduleId] = 0;
  for (const exposure of kanjiExposures) {
    if (exposure.stage !== "first-supported") continue;
    const moduleId = lessonModuleById.get(exposure.lessonId);
    if (!moduleId) continue;
    kanjiCountByModule[moduleId] = (kanjiCountByModule[moduleId] ?? 0) + 1;
  }
  const synthesisLessonIds = (A2_LESSON_IDS_BY_MODULE[synthesisModuleId] ?? []) as readonly string[];
  const kanjiResult = validateA2Kanji({
    entries: kanjiEntries,
    exposures: kanjiExposures,
    readings: kanjiReadings,
    positions: A2_CANONICAL_POSITIONS,
    synthesisLessonIds,
    countByModule: kanjiCountByModule,
    expectedCount: 120,
    expectedByModule: kanjiDistribution,
  });
  for (const error of kanjiResult.errors) {
    push({ code: "kanji-invalid", id: error.id, underlyingCode: error.code });
  }

  // -------------------------------------------------------------------
  // 5. Can-do / checkpoint / synthesis-integration coverage.
  // -------------------------------------------------------------------
  const canDoById = new Map(catalogs.canDos.map((canDo) => [canDo.id, canDo]));
  for (const canDoId of allCanDoIds) {
    const canDo = canDoById.get(canDoId);
    if (!canDo || canDo.lessonIds.length === 0) {
      push({ code: "cando-not-served", id: canDoId });
    }
  }

  const familyById = new Map(catalogs.sentenceFamilies.map((family) => [family.id, family]));
  const transferEvidenceCounts = new Map<string, number>();
  for (const variant of catalogs.sentenceVariants) {
    if (variant.pedagogicalUse !== "transfer") continue;
    const family = familyById.get(variant.sentenceFamilyId);
    if (!family) continue;
    for (const canDoId of family.canDoIds) {
      transferEvidenceCounts.set(canDoId, (transferEvidenceCounts.get(canDoId) ?? 0) + 1);
    }
  }
  for (const canDoId of allCanDoIds) {
    if ((transferEvidenceCounts.get(canDoId) ?? 0) === 0) {
      push({ code: "cando-no-transfer-evidence", id: canDoId });
    }
  }

  const sampledSet = new Set(checkpoint.sampledCanDoIds);
  for (const canDoId of allCanDoIds) {
    if (!sampledSet.has(canDoId)) {
      push({ code: "cando-not-sampled", id: canDoId });
    }
  }
  for (const sampledId of checkpoint.sampledCanDoIds) {
    if (!canDoById.has(sampledId)) {
      push({ code: "checkpoint-cando-unresolved", id: sampledId });
    }
  }
  if (checkpoint.minAcceptedTransferTargetsPerCanDo < 3) {
    push({
      code: "checkpoint-min-transfer",
      expected: 3,
      actual: checkpoint.minAcceptedTransferTargetsPerCanDo,
    });
  }

  const integrationKeys = Object.keys(synthesisIntegration);
  const expectedModuleSet = new Set(instructionalModuleIds);
  const integrationKeySet = new Set(integrationKeys);
  const integrationCoversExactly =
    integrationKeys.length === instructionalModuleIds.length &&
    integrationKeys.every((key) => expectedModuleSet.has(key)) &&
    instructionalModuleIds.every((moduleId) => integrationKeySet.has(moduleId));
  if (!integrationCoversExactly) {
    push({
      code: "synthesis-integration-count",
      expected: instructionalModuleIds.length,
      actual: integrationKeys.length,
    });
  }
  if (integrationKeySet.has(synthesisModuleId)) {
    push({ code: "synthesis-integration-count", id: synthesisModuleId, dimension: "self-reference" });
  }

  // -------------------------------------------------------------------
  // 6. Synthesis introduces nothing new.
  // -------------------------------------------------------------------
  const realizeCatalogs: RealizeVariantCatalogs = {
    contexts: catalogs.contexts,
    personRoles: catalogs.personRoles,
    referents: catalogs.referents,
    semanticValues: catalogs.semanticValues,
    learningTargetSenses: catalogs.learningTargetSenses,
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

  const nonSynthesisVariantIds = new Set<string>();
  const synthesisVariantIds = new Set<string>();
  for (const lesson of catalogs.lessons) {
    const variantIds = new Set<string>([
      ...lesson.modelVariantIds,
      ...lesson.practice.roundOne.candidateVariantIds,
      ...lesson.practice.roundTwo.candidateVariantIds,
    ]);
    const target = lesson.moduleId === synthesisModuleId ? synthesisVariantIds : nonSynthesisVariantIds;
    for (const id of variantIds) target.add(id);
  }

  const introducedFamilies = new Set<string>();
  const introducedValues = new Set<string>();
  const introducedSenses = new Set<string>();
  for (const variantId of nonSynthesisVariantIds) {
    const variant = variantById.get(variantId);
    if (!variant) continue;
    introducedFamilies.add(variant.sentenceFamilyId);
    for (const value of Object.values(variant.slotValues)) introducedValues.add(value);
    const realized = realize(variant);
    if (realized) {
      for (const sense of realized.usedLexemeSenseIds) introducedSenses.add(sense);
    }
  }

  for (const variantId of synthesisVariantIds) {
    const variant = variantById.get(variantId);
    if (!variant) continue;
    if (!introducedFamilies.has(variant.sentenceFamilyId)) {
      push({
        code: "synthesis-introduces-content",
        id: variantId,
        dimension: "family",
        referenceId: variant.sentenceFamilyId,
      });
    }
    for (const value of Object.values(variant.slotValues)) {
      if (!introducedValues.has(value)) {
        push({ code: "synthesis-introduces-content", id: variantId, dimension: "value", referenceId: value });
      }
    }
    const realized = realize(variant);
    if (realized) {
      for (const sense of realized.usedLexemeSenseIds) {
        if (!introducedSenses.has(sense)) {
          push({ code: "synthesis-introduces-content", id: variantId, dimension: "sense", referenceId: sense });
        }
      }
    }
  }

  for (const exposure of kanjiExposures) {
    if (exposure.stage !== "first-supported") continue;
    if (lessonModuleById.get(exposure.lessonId) === synthesisModuleId) {
      push({ code: "synthesis-introduces-kanji", id: exposure.kanjiId, referenceId: exposure.lessonId });
    }
  }

  // -------------------------------------------------------------------
  // 7. EN/IT copy parity, no Japanese, no personal alias.
  // -------------------------------------------------------------------
  const enKeys = new Set(Object.keys(copy.en));
  const itKeys = new Set(Object.keys(copy.it));
  for (const key of enKeys) {
    if (!itKeys.has(key)) push({ code: "copy-parity", id: key, dimension: "missing-it" });
  }
  for (const key of itKeys) {
    if (!enKeys.has(key)) push({ code: "copy-parity", id: key, dimension: "missing-en" });
  }
  for (const [key, value] of Object.entries(copy.en)) {
    if (!value || value.trim().length === 0) {
      push({ code: "copy-parity", id: key, dimension: "empty-en" });
    }
    if (JAPANESE_RE.test(value)) {
      push({ code: "copy-contains-japanese", id: key, dimension: "en" });
    }
    // -----------------------------------------------------------------
    // 8. No certification/certificate/equivalent claim.
    // -----------------------------------------------------------------
    if (CERTIFICATION_RE.test(value)) {
      push({ code: "checkpoint-claims-certification", id: key, dimension: "en" });
    }
  }
  for (const [key, value] of Object.entries(copy.it)) {
    if (!value || value.trim().length === 0) {
      push({ code: "copy-parity", id: key, dimension: "empty-it" });
    }
    if (JAPANESE_RE.test(value)) {
      push({ code: "copy-contains-japanese", id: key, dimension: "it" });
    }
    if (CERTIFICATION_RE.test(value)) {
      push({ code: "checkpoint-claims-certification", id: key, dimension: "it" });
    }
  }
  const aliasFlags = new Set([...validateRuntimeAliases(catalogs), ...validateRuntimeAliases(copy)]);
  for (const flag of aliasFlags) {
    push({ code: "personal-alias-match", id: flag });
  }

  // -------------------------------------------------------------------
  // Deterministic error order: by code, then id, then dimension, then
  // reference — exactly the ordering convention `validateA1` uses.
  // -------------------------------------------------------------------
  const sorted = [...errors].sort(
    (left, right) =>
      cmp(left.code, right.code) ||
      cmp(left.id ?? "", right.id ?? "") ||
      cmp(left.dimension ?? "", right.dimension ?? "") ||
      cmp(left.referenceId ?? "", right.referenceId ?? ""),
  );

  return { valid: sorted.length === 0, errors: sorted };
}

/** The default release view — validated over the frozen release catalogs,
 * with `buildA2Reports()`'s deterministic, machine-readable metrics
 * attached (exactly like `validateA1Release`'s own zero-argument view). */
export function validateA2Release(): ValidateA2ReleaseResult {
  const result = validateA2();
  return { ...result, reports: buildA2Reports() };
}
