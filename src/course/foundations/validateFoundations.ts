import type {
  CanDo,
  CheckpointDefinition,
  Context,
  CourseLevel,
  CourseLevelId,
  FoundationCatalogs,
  FoundationLessonDefinition,
  FoundationModule,
  LearningTargetSense,
  LessonPositionRecord,
  PersonRole,
  RealizedSentence,
  Referent,
  SemanticValue,
  SentenceFamily,
  SentenceVariant,
  VariationAxis,
  VerbUseRecord,
} from "./types";
import {
  realizeVariant,
  type RealizeVariantCatalogs,
} from "./realizeFamily";
import {
  selectVariants,
  type PracticeCandidate,
  type SelectedPracticeTarget,
  type SelectVariantsError,
  type SelectVariantsRoundConstraints,
} from "./selectVariants";
import {
  generateFamilyExercise,
  type FamilyPracticeContext,
} from "./practiceEngine";
import { validateRuntimeAliases } from "../data/personas";
import { COURSE_LEVEL_IDS } from "../levels/types";
import {
  aggregateFoundationReports,
  type CheckpointReportRow,
  type FoundationCoverageReports,
  type LessonCoverageReport,
  type LevelMeta,
  type ModuleMeta,
  type VerbUseReportRow,
  sortAxes,
  sortedUnique,
} from "./reports";

/**
 * Pure, staged validation of a sentence-foundation catalog set (design spec
 * §8–§11, §16; Phase 1 Task 4). Given catalogs, flat bilingual copy, an
 * explicit catalog version, and a deterministic seed, it re-derives every
 * diversity/transfer/learning-use/Can-do invariant from the authored data —
 * realizing every model and practice candidate with the *lesson's own*
 * available concepts, running the production selector for both rounds, and
 * generating the selected exercises — and returns `{valid, errors, reports}`.
 *
 * The reports are always populated with actual, resolvable rows (never a
 * success-shaped empty), so a reviewer sees real coverage even when the set is
 * invalid. Input is never mutated: every derived structure is freshly built.
 */

// ---------------------------------------------------------------------------
// Error contract
// ---------------------------------------------------------------------------
export type ValidationErrorCode =
  // stage 1 — integrity / reference / copy / alias
  | "duplicate-entity-id"
  | "missing-level-reference"
  | "missing-module-reference"
  | "missing-checkpoint-reference"
  | "missing-lesson-reference"
  | "missing-lesson-position"
  | "missing-can-do-reference"
  | "missing-family-reference"
  | "missing-variant-reference"
  | "missing-role-reference"
  | "missing-referent-reference"
  | "missing-context-reference"
  | "missing-sense-reference"
  | "missing-value-reference"
  | "invalid-copy-parity"
  | "personal-alias-match"
  // stage 2 — realization
  | "realization-failed"
  // stage 3 — model diversity
  | "invalid-model-count"
  | "insufficient-family-diversity"
  | "insufficient-predicate-diversity"
  | "insufficient-role-diversity"
  | "insufficient-context-diversity"
  // stage 4 — selection / exercises
  | "invalid-exercise-count"
  | "insufficient-unique-targets"
  | "target-reuse-exceeded"
  | "duplicate-semantic-target"
  | "insufficient-transfer"
  | "missing-controlled-transfer"
  | "selection-failed"
  | "practice-generation-failed"
  // stage 5 — transfer tuple
  | "transfer-duplicates-model"
  | "transfer-uses-unintroduced-content"
  | "invalid-availability-reference"
  // stage 6 — learning use / senses / verb recurrence
  | "productive-verb-introduction-structure"
  | "productive-verb-introduction-exercise"
  | "productive-verb-later-reuse"
  | "productive-verb-spaced-reuse"
  | "productive-verb-later-module"
  | "productive-verb-structure-reuse"
  | "productive-verb-later-use-wrong-sense"
  | "receptive-use-insufficient-input"
  | "receptive-use-missing-comprehension"
  | "conflated-sense-context"
  // stage 7 — Can-do
  | "can-do-primary-coverage"
  | "can-do-supporting-overflow"
  | "can-do-transfer-coverage"
  | "can-do-checkpoint-coverage";

/** A single, fully-attributed validation failure. Optional fields are only
 * populated when meaningful for the code, so a reviewer can locate the exact
 * offending entity and see the expected/actual it violated. */
export interface ValidationError {
  readonly code: ValidationErrorCode;
  readonly stage: number;
  readonly lessonId?: string;
  readonly moduleId?: string;
  readonly level?: CourseLevelId;
  readonly id?: string;
  readonly referenceId?: string;
  readonly dimension?: string;
  readonly expected?: string | number;
  readonly actual?: string | number;
  /** Preserved underlying lower-layer code when this error wraps a typed
   * realization/selection/generation failure — never re-derived. */
  readonly underlyingCode?: string;
}

export interface ValidateFoundationsInput {
  readonly catalogs: FoundationCatalogs;
  readonly foundationCopy: {
    readonly en: Readonly<Record<string, string>>;
    readonly it: Readonly<Record<string, string>>;
  };
  readonly catalogVersion: string;
  readonly seed: string;
  /** Optional per-lesson seed override; a lesson with no entry uses `seed`. */
  readonly seedByLesson?: Readonly<Record<string, string>>;
  /**
   * Optional caller-computed cumulative availability per lesson (Phase 2 Task 4).
   * When an entry is present for a lesson, `checkTransfers` gates that lesson's
   * transfers against these explicit sets (introduced content available up to
   * and including the lesson) instead of the lesson's own same-lesson model
   * content. Lessons with no entry fall back to same-lesson introduced sets,
   * preserving the Phase-1 per-lesson closure behaviour for existing fixtures.
   * `forms` are foundation form keys (`polarity:tense:formality`).
   */
  readonly availableContentByLesson?: Readonly<
    Record<
      string,
      {
        readonly conceptIds: readonly string[];
        readonly senseIds: readonly string[];
        readonly semanticValueIds: readonly string[];
        readonly forms: readonly string[];
      }
    >
  >;
}

export interface ValidateFoundationsResult {
  readonly valid: boolean;
  readonly errors: readonly ValidationError[];
  readonly reports: FoundationCoverageReports;
}

const STAGE = {
  integrity: 1,
  realization: 2,
  modelDiversity: 3,
  selection: 4,
  transfer: 5,
  learningUse: 6,
  canDo: 7,
} as const;

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

const LEVEL_RANK_BY_ID: ReadonlyMap<CourseLevelId, number> = new Map(
  COURSE_LEVEL_IDS.map((level, index) => [level, index]),
);

function levelRank(level: CourseLevelId): number {
  return LEVEL_RANK_BY_ID.get(level) ?? COURSE_LEVEL_IDS.length;
}

function byId<T extends { readonly id: string }>(items: readonly T[]): Map<string, T> {
  const map = new Map<string, T>();
  for (const item of items) {
    if (!map.has(item.id)) map.set(item.id, item);
  }
  return map;
}

function formKey(form: SentenceVariant["form"]): string {
  return `${form.polarity}:${form.tense}:${form.formality}`;
}

/**
 * A verb's "true structure key" (§9.3): family, subject realization
 * (explicit/omitted), grammatical form, and the sorted slot-argument shape —
 * deliberately *excluding* person/context/value ids, so the same structure
 * reused with a different subject/context counts as the same structure.
 */
function structureKey(variant: SentenceVariant): string {
  const slots = Object.keys(variant.slotValues).slice().sort().join(",");
  return `${variant.sentenceFamilyId}|${variant.discourse.subjectRealization}|${formKey(variant.form)}|${slots}`;
}

// ---------------------------------------------------------------------------
// Per-lesson realization + selection analysis
// ---------------------------------------------------------------------------

interface LessonAnalysis {
  readonly lesson: FoundationLessonDefinition;
  readonly realizeCatalogs: RealizeVariantCatalogs;
  readonly modelSentences: readonly RealizedSentence[];
  /** Realized round-one (guided/controlled) practice candidates — may include
   * dedicated controlled-practice variants that are neither taught models nor
   * round-two transfer candidates. Retained separately so the single live
   * selection/generation path can build its context from the full pool. */
  readonly roundOneCandidateSentences: readonly RealizedSentence[];
  readonly transferSentences: readonly RealizedSentence[];
  readonly modelFingerprints: readonly string[];
  readonly introducedConceptIds: ReadonlySet<string>;
  readonly introducedSenseIds: ReadonlySet<string>;
  readonly introducedValueIds: ReadonlySet<string>;
  readonly introducedForms: ReadonlySet<string>;
  readonly realizationErrors: readonly ValidationError[];
  /** True when every model + candidate realized successfully. */
  readonly realized: boolean;
}

function resolveDiversitySelectionConstraints(
  lesson: FoundationLessonDefinition,
  round: "one" | "two",
): SelectVariantsRoundConstraints {
  const d = lesson.diversityConstraints;
  // Model diversity (family/predicate/role/context) is owned by stage 3 over
  // the authored model set, so the selector's own family/predicate/role/
  // context minima are relaxed here to 1: the selector's job in this validator
  // is to enforce the *practice* contract (unique visible targets, visible
  // reuse ceiling, transfer count, controlled construction) over its chosen
  // exercises, deterministically. Whole-lesson thresholds are enforced by
  // passing round one's output as round two's `alreadySelected`.
  return {
    minFamilies: 1,
    minPredicates: 1,
    minRoles: 1,
    minContexts: 1,
    minUniqueVisibleTargets:
      round === "one"
        ? Math.min(d.minUniqueTargets, lesson.practice.roundOne.targetCount)
        : d.minUniqueTargets,
    maxVisibleReuse: d.maxTargetReuse,
    minTransferTargets: round === "two" ? d.minTransferExercises : 0,
    requireControlledConstruction: round === "two" ? d.requireControlledConstruction : false,
  };
}

function analyzeLesson(
  lesson: FoundationLessonDefinition,
  ctx: CatalogIndex,
): LessonAnalysis {
  const realizeCatalogs: RealizeVariantCatalogs = {
    contexts: ctx.catalogs.contexts,
    personRoles: ctx.catalogs.personRoles,
    referents: ctx.catalogs.referents,
    semanticValues: ctx.catalogs.semanticValues,
    learningTargetSenses: ctx.catalogs.learningTargetSenses,
  };

  // available concepts = union of the lesson's authored families' requirements.
  const available = new Set<string>();
  for (const familyId of lesson.familyIds) {
    const family = ctx.familyById.get(familyId);
    if (family) for (const id of family.requiredConceptIds) available.add(id);
  }
  const availableConceptIds = [...available];

  const realizationErrors: ValidationError[] = [];
  // Memoize per variant id so a variant that appears in more than one pool
  // (e.g. a taught model reused as a round-one candidate) realizes exactly
  // once and records its realization failure exactly once.
  const realizedCache = new Map<string, RealizedSentence | null>();
  const realize = (variantId: string): RealizedSentence | undefined => {
    const cached = realizedCache.get(variantId);
    if (cached !== undefined) return cached ?? undefined;
    const variant = ctx.variantById.get(variantId);
    if (!variant) {
      realizationErrors.push({
        code: "missing-variant-reference",
        stage: STAGE.realization,
        lessonId: lesson.id,
        id: lesson.id,
        referenceId: variantId,
      });
      realizedCache.set(variantId, null);
      return undefined;
    }
    const family = ctx.familyById.get(variant.sentenceFamilyId);
    if (!family) {
      realizationErrors.push({
        code: "missing-family-reference",
        stage: STAGE.realization,
        lessonId: lesson.id,
        id: variantId,
        referenceId: variant.sentenceFamilyId,
      });
      realizedCache.set(variantId, null);
      return undefined;
    }
    const result = realizeVariant(family, variant, realizeCatalogs, { availableConceptIds });
    if (!result.ok) {
      for (const error of result.errors) {
        realizationErrors.push({
          code: "realization-failed",
          stage: STAGE.realization,
          lessonId: lesson.id,
          id: variantId,
          referenceId: error.referenceId ?? error.slotId,
          underlyingCode: error.code,
        });
      }
      realizedCache.set(variantId, null);
      return undefined;
    }
    realizedCache.set(variantId, result.sentence);
    return result.sentence;
  };

  const realizePool = (ids: readonly string[]): RealizedSentence[] => {
    const sentences: RealizedSentence[] = [];
    for (const id of ids) {
      const sentence = realize(id);
      if (sentence) sentences.push(sentence);
    }
    return sentences;
  };

  const modelSentences = realizePool(lesson.modelVariantIds);
  const roundOneCandidateSentences = realizePool(lesson.practice.roundOne.candidateVariantIds);
  const transferSentences = realizePool(lesson.practice.roundTwo.candidateVariantIds);

  const realized = realizationErrors.length === 0;

  const modelFingerprints = modelSentences.map((sentence) => sentence.semanticFingerprint);
  const introducedConceptIds = new Set<string>();
  const introducedSenseIds = new Set<string>();
  const introducedValueIds = new Set<string>();
  const introducedForms = new Set<string>();
  for (const sentence of modelSentences) {
    for (const id of sentence.usedConceptIds) introducedConceptIds.add(id);
    for (const id of sentence.usedLexemeSenseIds) introducedSenseIds.add(id);
  }
  for (const id of lesson.modelVariantIds) {
    const variant = ctx.variantById.get(id);
    if (!variant) continue;
    for (const value of Object.values(variant.slotValues)) introducedValueIds.add(value);
    introducedForms.add(formKey(variant.form));
  }

  return {
    lesson,
    realizeCatalogs,
    modelSentences,
    roundOneCandidateSentences,
    transferSentences,
    modelFingerprints,
    introducedConceptIds,
    introducedSenseIds,
    introducedValueIds,
    introducedForms,
    realizationErrors,
    realized,
  };
}

// ---------------------------------------------------------------------------
// Catalog index
// ---------------------------------------------------------------------------

interface CatalogIndex {
  readonly catalogs: FoundationCatalogs;
  readonly familyById: Map<string, SentenceFamily>;
  readonly variantById: Map<string, SentenceVariant>;
  readonly contextById: Map<string, Context>;
  readonly roleById: Map<string, PersonRole>;
  readonly referentById: Map<string, Referent>;
  readonly senseById: Map<string, LearningTargetSense>;
  readonly valueById: Map<string, SemanticValue>;
  readonly canDoById: Map<string, CanDo>;
  readonly moduleById: Map<string, FoundationModule>;
  readonly checkpointById: Map<string, CheckpointDefinition>;
  readonly levelById: Map<string, CourseLevel>;
  readonly positionByLesson: Map<string, LessonPositionRecord>;
}

function indexCatalogs(catalogs: FoundationCatalogs): CatalogIndex {
  return {
    catalogs,
    familyById: byId(catalogs.sentenceFamilies),
    variantById: byId(catalogs.sentenceVariants),
    contextById: byId(catalogs.contexts),
    roleById: byId(catalogs.personRoles),
    referentById: byId(catalogs.referents),
    senseById: byId(catalogs.learningTargetSenses),
    valueById: byId(catalogs.semanticValues),
    canDoById: byId(catalogs.canDos),
    moduleById: byId(catalogs.modules),
    checkpointById: byId(catalogs.checkpoints),
    levelById: byId(catalogs.levels),
    positionByLesson: new Map(catalogs.lessonPositions.map((p) => [p.lessonId, p])),
  };
}

// ---------------------------------------------------------------------------
// Stage 1 — integrity / reference / copy / alias
// ---------------------------------------------------------------------------

function checkDuplicates(ctx: CatalogIndex, errors: ValidationError[]): void {
  const groups: readonly (readonly [string, readonly { readonly id: string }[]])[] = [
    ["context", ctx.catalogs.contexts],
    ["role", ctx.catalogs.personRoles],
    ["referent", ctx.catalogs.referents],
    ["sense", ctx.catalogs.learningTargetSenses],
    ["value", ctx.catalogs.semanticValues],
    ["family", ctx.catalogs.sentenceFamilies],
    ["variant", ctx.catalogs.sentenceVariants],
    ["module", ctx.catalogs.modules],
    ["checkpoint", ctx.catalogs.checkpoints],
    ["can-do", ctx.catalogs.canDos],
    ["lesson", ctx.catalogs.lessons],
    ["level", ctx.catalogs.levels],
  ];
  for (const [dimension, items] of groups) {
    const seen = new Set<string>();
    for (const item of items) {
      if (seen.has(item.id)) {
        errors.push({
          code: "duplicate-entity-id",
          stage: STAGE.integrity,
          id: item.id,
          referenceId: item.id,
          dimension,
        });
      }
      seen.add(item.id);
    }
  }
  // lesson positions keyed by lessonId
  const seenPos = new Set<string>();
  for (const record of ctx.catalogs.lessonPositions) {
    if (seenPos.has(record.lessonId)) {
      errors.push({
        code: "duplicate-entity-id",
        stage: STAGE.integrity,
        id: record.lessonId,
        referenceId: record.lessonId,
        dimension: "lesson-position",
      });
    }
    seenPos.add(record.lessonId);
  }
}

function checkReferences(ctx: CatalogIndex, errors: ValidationError[]): void {
  const c = ctx.catalogs;

  // Variants → families / contexts / referents / roles / senses(values) / values.
  for (const variant of c.sentenceVariants) {
    if (!ctx.familyById.has(variant.sentenceFamilyId)) {
      errors.push({ code: "missing-family-reference", stage: STAGE.integrity, id: variant.id, referenceId: variant.sentenceFamilyId });
    }
    if (!ctx.contextById.has(variant.contextId)) {
      errors.push({ code: "missing-context-reference", stage: STAGE.integrity, id: variant.id, referenceId: variant.contextId });
    }
    if (!ctx.roleById.has(variant.discourse.speakerRoleId)) {
      errors.push({ code: "missing-role-reference", stage: STAGE.integrity, id: variant.id, referenceId: variant.discourse.speakerRoleId });
    }
    if (variant.discourse.addresseeRoleId !== null && !ctx.roleById.has(variant.discourse.addresseeRoleId)) {
      errors.push({ code: "missing-role-reference", stage: STAGE.integrity, id: variant.id, referenceId: variant.discourse.addresseeRoleId });
    }
    if (variant.discourse.subjectReferentId !== null && !ctx.referentById.has(variant.discourse.subjectReferentId)) {
      errors.push({ code: "missing-referent-reference", stage: STAGE.integrity, id: variant.id, referenceId: variant.discourse.subjectReferentId });
    }
    for (const value of Object.values(variant.slotValues)) {
      if (!ctx.valueById.has(value)) {
        errors.push({ code: "missing-value-reference", stage: STAGE.integrity, id: variant.id, referenceId: value });
      }
    }
  }

  // Referents → roles.
  for (const referent of c.referents) {
    if (!ctx.roleById.has(referent.personRoleId)) {
      errors.push({ code: "missing-role-reference", stage: STAGE.integrity, id: referent.id, referenceId: referent.personRoleId });
    }
  }

  // Predicate-sense values → senses.
  for (const value of c.semanticValues) {
    if (value.senseId !== undefined && !ctx.senseById.has(value.senseId)) {
      errors.push({ code: "missing-sense-reference", stage: STAGE.integrity, id: value.id, referenceId: value.senseId });
    }
  }

  // Families → Can-dos.
  for (const family of c.sentenceFamilies) {
    for (const canDoId of family.canDoIds) {
      if (!ctx.canDoById.has(canDoId)) {
        errors.push({ code: "missing-can-do-reference", stage: STAGE.integrity, id: family.id, referenceId: canDoId });
      }
    }
  }

  // Modules → lessons (resolvable against authored lessons OR lesson positions).
  const lessonUniverse = new Set<string>([
    ...c.lessons.map((l) => l.id),
    ...c.lessonPositions.map((p) => p.lessonId),
  ]);
  for (const module of c.modules) {
    for (const lessonId of module.lessonIds) {
      if (!lessonUniverse.has(lessonId)) {
        errors.push({ code: "missing-lesson-reference", stage: STAGE.integrity, id: module.id, moduleId: module.id, referenceId: lessonId });
      }
    }
    for (const canDoId of module.canDoIds) {
      if (!ctx.canDoById.has(canDoId)) {
        errors.push({ code: "missing-can-do-reference", stage: STAGE.integrity, id: module.id, moduleId: module.id, referenceId: canDoId });
      }
    }
  }

  // Lessons → modules / Can-dos / families / variants / position.
  for (const lesson of c.lessons) {
    if (!ctx.moduleById.has(lesson.moduleId)) {
      errors.push({ code: "missing-module-reference", stage: STAGE.integrity, id: lesson.id, lessonId: lesson.id, referenceId: lesson.moduleId });
    }
    if (!ctx.canDoById.has(lesson.primaryCanDoId)) {
      errors.push({ code: "missing-can-do-reference", stage: STAGE.integrity, id: lesson.id, lessonId: lesson.id, referenceId: lesson.primaryCanDoId });
    }
    for (const canDoId of lesson.supportingCanDoIds) {
      if (!ctx.canDoById.has(canDoId)) {
        errors.push({ code: "missing-can-do-reference", stage: STAGE.integrity, id: lesson.id, lessonId: lesson.id, referenceId: canDoId });
      }
    }
    for (const familyId of lesson.familyIds) {
      if (!ctx.familyById.has(familyId)) {
        errors.push({ code: "missing-family-reference", stage: STAGE.integrity, id: lesson.id, lessonId: lesson.id, referenceId: familyId });
      }
    }
    for (const variantId of [...lesson.modelVariantIds, ...lesson.practice.roundOne.candidateVariantIds, ...lesson.practice.roundTwo.candidateVariantIds]) {
      if (!ctx.variantById.has(variantId)) {
        errors.push({ code: "missing-variant-reference", stage: STAGE.integrity, id: lesson.id, lessonId: lesson.id, referenceId: variantId });
      }
    }
    if (!ctx.positionByLesson.has(lesson.id)) {
      errors.push({ code: "missing-lesson-position", stage: STAGE.integrity, id: lesson.id, lessonId: lesson.id, referenceId: lesson.id });
    }
  }

  // Lesson positions → modules.
  for (const record of c.lessonPositions) {
    if (!ctx.moduleById.has(record.moduleId)) {
      errors.push({ code: "missing-module-reference", stage: STAGE.integrity, id: record.lessonId, referenceId: record.moduleId });
    }
  }

  // Can-dos → lessons / contexts.
  for (const canDo of c.canDos) {
    for (const lessonId of canDo.lessonIds) {
      if (!lessonUniverse.has(lessonId)) {
        errors.push({ code: "missing-lesson-reference", stage: STAGE.integrity, id: canDo.id, referenceId: lessonId });
      }
    }
    for (const contextId of canDo.contextIds) {
      if (!ctx.contextById.has(contextId)) {
        errors.push({ code: "missing-context-reference", stage: STAGE.integrity, id: canDo.id, referenceId: contextId });
      }
    }
  }

  // Checkpoints → Can-dos.
  for (const checkpoint of c.checkpoints) {
    for (const canDoId of checkpoint.sampledCanDoIds) {
      if (!ctx.canDoById.has(canDoId)) {
        errors.push({ code: "missing-can-do-reference", stage: STAGE.integrity, id: checkpoint.id, referenceId: canDoId });
      }
    }
  }

  // Levels → modules / Can-dos / prerequisite checkpoint.
  for (const level of c.levels) {
    for (const moduleId of level.moduleIds) {
      if (!ctx.moduleById.has(moduleId)) {
        errors.push({ code: "missing-module-reference", stage: STAGE.integrity, id: level.id, level: level.id, referenceId: moduleId });
      }
    }
    for (const canDoId of level.canDoIds) {
      if (!ctx.canDoById.has(canDoId)) {
        errors.push({ code: "missing-can-do-reference", stage: STAGE.integrity, id: level.id, level: level.id, referenceId: canDoId });
      }
    }
    if (level.recommendedPrerequisiteCheckpointId !== undefined && !ctx.checkpointById.has(level.recommendedPrerequisiteCheckpointId)) {
      errors.push({ code: "missing-checkpoint-reference", stage: STAGE.integrity, id: level.id, level: level.id, referenceId: level.recommendedPrerequisiteCheckpointId });
    }
  }

  // Verb records → lessons / variants.
  for (const record of c.verbUseRecords) {
    if (!lessonUniverse.has(record.introductionLessonId)) {
      errors.push({ code: "missing-lesson-reference", stage: STAGE.integrity, id: record.id, referenceId: record.introductionLessonId });
    }
    if (record.senseId !== undefined && !ctx.senseById.has(record.senseId)) {
      errors.push({ code: "missing-sense-reference", stage: STAGE.integrity, id: record.id, referenceId: record.senseId });
    }
    for (const variantId of record.introductionVariantIds) {
      if (!ctx.variantById.has(variantId)) {
        errors.push({ code: "missing-variant-reference", stage: STAGE.integrity, id: record.id, referenceId: variantId });
      }
    }
    if (!ctx.variantById.has(record.introductionExercise.targetVariantId)) {
      errors.push({ code: "missing-variant-reference", stage: STAGE.integrity, id: record.id, referenceId: record.introductionExercise.targetVariantId });
    }
    for (const use of record.laterUses) {
      if (!lessonUniverse.has(use.lessonId)) {
        errors.push({ code: "missing-lesson-reference", stage: STAGE.integrity, id: record.id, referenceId: use.lessonId });
      }
      if (!ctx.variantById.has(use.variantId)) {
        errors.push({ code: "missing-variant-reference", stage: STAGE.integrity, id: record.id, referenceId: use.variantId });
      }
    }
  }

  // Level membership: every entity that declares a `level` must reference a
  // declared CourseLevel. Modules, lessons, Can-dos, checkpoints and families
  // all carry a `level` discriminator that must resolve.
  for (const module of c.modules) {
    if (!ctx.levelById.has(module.level)) {
      errors.push({ code: "missing-level-reference", stage: STAGE.integrity, id: module.id, moduleId: module.id, level: module.level, referenceId: module.level });
    }
  }
  for (const lesson of c.lessons) {
    if (!ctx.levelById.has(lesson.level)) {
      errors.push({ code: "missing-level-reference", stage: STAGE.integrity, id: lesson.id, lessonId: lesson.id, level: lesson.level, referenceId: lesson.level });
    }
  }
  for (const canDo of c.canDos) {
    if (!ctx.levelById.has(canDo.level)) {
      errors.push({ code: "missing-level-reference", stage: STAGE.integrity, id: canDo.id, level: canDo.level, referenceId: canDo.level });
    }
  }
  for (const checkpoint of c.checkpoints) {
    if (!ctx.levelById.has(checkpoint.level)) {
      errors.push({ code: "missing-level-reference", stage: STAGE.integrity, id: checkpoint.id, level: checkpoint.level, referenceId: checkpoint.level });
    }
  }
  for (const family of c.sentenceFamilies) {
    if (!ctx.levelById.has(family.level)) {
      errors.push({ code: "missing-level-reference", stage: STAGE.integrity, id: family.id, level: family.level, referenceId: family.level });
    }
  }
}

function checkCopyParityAndReferences(
  ctx: CatalogIndex,
  copy: ValidateFoundationsInput["foundationCopy"],
  errors: ValidationError[],
): void {
  const enKeys = new Set(Object.keys(copy.en));
  const itKeys = new Set(Object.keys(copy.it));
  for (const key of enKeys) {
    if (!itKeys.has(key)) {
      errors.push({ code: "invalid-copy-parity", stage: STAGE.integrity, id: key, referenceId: key, dimension: "missing-it" });
    }
  }
  for (const key of itKeys) {
    if (!enKeys.has(key)) {
      errors.push({ code: "invalid-copy-parity", stage: STAGE.integrity, id: key, referenceId: key, dimension: "missing-en" });
    }
  }

  const requireCopy = (copyId: string, id: string): void => {
    if (!enKeys.has(copyId) || !itKeys.has(copyId)) {
      errors.push({ code: "invalid-copy-parity", stage: STAGE.integrity, id, referenceId: copyId, dimension: "unresolved" });
    }
  };

  for (const context of ctx.catalogs.contexts) requireCopy(context.labelCopyId, context.id);
  for (const role of ctx.catalogs.personRoles) requireCopy(role.labelCopyId, role.id);
  for (const referent of ctx.catalogs.referents) requireCopy(referent.labelCopyId, referent.id);
  for (const variant of ctx.catalogs.sentenceVariants) requireCopy(variant.discourse.scenarioNoteCopyId, variant.id);
  for (const canDo of ctx.catalogs.canDos) requireCopy(canDo.descriptorCopyId, canDo.id);
  for (const level of ctx.catalogs.levels) requireCopy(level.alignmentCopyId, level.id);
}

function checkAliases(
  ctx: CatalogIndex,
  copy: ValidateFoundationsInput["foundationCopy"],
  errors: ValidationError[],
): void {
  const flags = [
    ...validateRuntimeAliases(ctx.catalogs),
    ...validateRuntimeAliases(copy),
  ];
  for (const flag of new Set(flags)) {
    errors.push({ code: "personal-alias-match", stage: STAGE.integrity, id: flag, referenceId: flag });
  }
}

// ---------------------------------------------------------------------------
// Stage 3 — model diversity
// ---------------------------------------------------------------------------

function distinctRoleIds(sentences: readonly RealizedSentence[]): readonly string[] {
  return sortedUnique(sentences.map((sentence) => sentence.discourse.speakerRoleId));
}

function checkModelDiversity(analysis: LessonAnalysis, errors: ValidationError[]): void {
  const lesson = analysis.lesson;
  const d = lesson.diversityConstraints;
  const models = analysis.modelSentences;

  const modelCount = models.length;
  if (modelCount < d.modelCountRange[0] || modelCount > d.modelCountRange[1]) {
    errors.push({
      code: "invalid-model-count",
      stage: STAGE.modelDiversity,
      lessonId: lesson.id,
      id: lesson.id,
      expected: `${d.modelCountRange[0]}-${d.modelCountRange[1]}`,
      actual: modelCount,
    });
  }

  const families = sortedUnique(models.map((sentence) => sentence.familyId));
  if (families.length < d.minFamilies) {
    errors.push({
      code: "insufficient-family-diversity",
      stage: STAGE.modelDiversity,
      lessonId: lesson.id,
      id: lesson.id,
      dimension: "family",
      expected: d.minFamilies,
      actual: families.length,
    });
  }

  const predicates = sortedUnique(models.map((sentence) => sentence.predicateSenseId));
  if (predicates.length < d.minPredicates) {
    errors.push({ code: "insufficient-predicate-diversity", stage: STAGE.modelDiversity, lessonId: lesson.id, id: lesson.id, dimension: "predicate", expected: d.minPredicates, actual: predicates.length });
  }
  const roles = distinctRoleIds(models);
  if (roles.length < d.minRoles) {
    errors.push({ code: "insufficient-role-diversity", stage: STAGE.modelDiversity, lessonId: lesson.id, id: lesson.id, dimension: "role", expected: d.minRoles, actual: roles.length });
  }
  const contexts = sortedUnique(models.map((sentence) => sentence.contextId));
  if (contexts.length < d.minContexts) {
    errors.push({ code: "insufficient-context-diversity", stage: STAGE.modelDiversity, lessonId: lesson.id, id: lesson.id, dimension: "context", expected: d.minContexts, actual: contexts.length });
  }
}

// ---------------------------------------------------------------------------
// Stage 4 — selection / exercises
// ---------------------------------------------------------------------------

function mapSelectionError(
  error: SelectVariantsError,
  lesson: FoundationLessonDefinition,
  roundId: string,
): ValidationError {
  const base = { stage: STAGE.selection, lessonId: lesson.id, id: lesson.id, referenceId: error.referenceId ?? roundId, underlyingCode: error.code, dimension: error.dimension } as const;
  if (error.code === "missing-controlled-transfer") {
    return { code: "missing-controlled-transfer", ...base };
  }
  if (error.code === "model-duplicate-transfer") {
    return { code: "transfer-duplicates-model", ...base };
  }
  if (error.code === "constraint-unsatisfied") {
    switch (error.dimension) {
      case "unique-visible-target":
        return { code: "insufficient-unique-targets", ...base };
      case "max-visible-reuse":
        return { code: "target-reuse-exceeded", ...base };
      case "transfer-count":
        return { code: "insufficient-transfer", ...base };
      default:
        return { code: "selection-failed", ...base };
    }
  }
  if (error.code === "insufficient-candidates" && roundId === lesson.practice.roundTwo.id) {
    return { code: "insufficient-transfer", ...base };
  }
  return { code: "selection-failed", ...base };
}

function runSelectionForErrors(
  analysis: LessonAnalysis,
  ctx: CatalogIndex,
  catalogVersion: string,
  seed: string,
  errors: ValidationError[],
  select: SelectVariantsFn,
): { readonly r1: readonly SelectedPracticeTarget[]; readonly r2: readonly SelectedPracticeTarget[]; readonly ok: boolean } {
  const lesson = analysis.lesson;
  const sentenceById = new Map<string, RealizedSentence>();
  for (const sentence of [
    ...analysis.modelSentences,
    ...analysis.roundOneCandidateSentences,
    ...analysis.transferSentences,
  ]) {
    if (!sentenceById.has(sentence.variantId)) sentenceById.set(sentence.variantId, sentence);
  }
  const buildCandidates = (ids: readonly string[]): PracticeCandidate[] =>
    ids
      .map((id) => {
        const variant = ctx.variantById.get(id);
        const sentence = sentenceById.get(id);
        return variant && sentence ? { variant, sentence } : undefined;
      })
      .filter((candidate): candidate is PracticeCandidate => candidate !== undefined);

  const r1 = select({
    catalogVersion,
    lessonId: lesson.id,
    round: lesson.practice.roundOne,
    seed,
    candidates: buildCandidates(lesson.practice.roundOne.candidateVariantIds),
    modelSemanticFingerprints: analysis.modelFingerprints,
    alreadySelected: [],
    constraints: resolveDiversitySelectionConstraints(lesson, "one"),
  });
  if (!r1.ok) {
    for (const error of r1.errors) errors.push(mapSelectionError(error, lesson, lesson.practice.roundOne.id));
    return { r1: [], r2: [], ok: false };
  }
  const r2 = select({
    catalogVersion,
    lessonId: lesson.id,
    round: lesson.practice.roundTwo,
    seed,
    candidates: buildCandidates(lesson.practice.roundTwo.candidateVariantIds),
    modelSemanticFingerprints: analysis.modelFingerprints,
    alreadySelected: r1.targets,
    constraints: resolveDiversitySelectionConstraints(lesson, "two"),
  });
  if (!r2.ok) {
    for (const error of r2.errors) errors.push(mapSelectionError(error, lesson, lesson.practice.roundTwo.id));
    return { r1: r1.targets, r2: [], ok: false };
  }
  return { r1: r1.targets, r2: r2.targets, ok: true };
}

interface SelectionSummary {
  readonly exerciseCount: number;
  readonly visibleTargetCounts: Readonly<Record<string, number>>;
  readonly uniqueVisibleTargetCount: number;
  readonly maximumVisibleReuse: number;
  readonly transferTargetIds: readonly string[];
  readonly ok: boolean;
}

function checkSelectionAndExercises(
  analysis: LessonAnalysis,
  ctx: CatalogIndex,
  catalogVersion: string,
  seed: string,
  errors: ValidationError[],
  deps: ValidateFoundationsDeps,
): SelectionSummary {
  const lesson = analysis.lesson;
  const d = lesson.diversityConstraints;

  const { r1, r2, ok } = runSelectionForErrors(analysis, ctx, catalogVersion, seed, errors, deps.selectVariants);
  const selected = [...r1, ...r2];

  // Duplicate semantic target among model realizations (§9.1): a hidden
  // semantic duplicate disguised by a different UI kind/locale must be caught
  // on the model fingerprints, not just the selected exercises.
  const fingerprintSeen = new Map<string, string>();
  for (const sentence of analysis.modelSentences) {
    const prior = fingerprintSeen.get(sentence.semanticFingerprint);
    if (prior !== undefined && prior !== sentence.variantId) {
      errors.push({ code: "duplicate-semantic-target", stage: STAGE.selection, lessonId: lesson.id, id: sentence.variantId, referenceId: prior, dimension: "model" });
    } else {
      fingerprintSeen.set(sentence.semanticFingerprint, sentence.variantId);
    }
  }

  const visibleTargetCounts: Record<string, number> = {};
  for (const target of selected) {
    visibleTargetCounts[target.visibleTargetKey] = (visibleTargetCounts[target.visibleTargetKey] ?? 0) + 1;
  }
  const counts = Object.values(visibleTargetCounts);
  const uniqueVisibleTargetCount = counts.length;
  const maximumVisibleReuse = counts.length === 0 ? 0 : Math.max(...counts);
  const transferTargetIds = sortedUnique(
    r2.map((target) => target.sourceVariantId ?? target.variantId),
  );

  const exerciseCount = selected.length;

  if (ok) {
    if (exerciseCount < d.exerciseCountRange[0] || exerciseCount > d.exerciseCountRange[1]) {
      errors.push({ code: "invalid-exercise-count", stage: STAGE.selection, lessonId: lesson.id, id: lesson.id, expected: `${d.exerciseCountRange[0]}-${d.exerciseCountRange[1]}`, actual: exerciseCount });
    }
    if (uniqueVisibleTargetCount < d.minUniqueTargets) {
      errors.push({ code: "insufficient-unique-targets", stage: STAGE.selection, lessonId: lesson.id, id: lesson.id, dimension: "unique-visible-target", expected: d.minUniqueTargets, actual: uniqueVisibleTargetCount });
    }
    if (maximumVisibleReuse > d.maxTargetReuse) {
      errors.push({ code: "target-reuse-exceeded", stage: STAGE.selection, lessonId: lesson.id, id: lesson.id, dimension: "max-visible-reuse", expected: d.maxTargetReuse, actual: maximumVisibleReuse });
    }
    // Distinct semantic target disguised by kind among the selected exercises.
    const selectedFingerprints = new Map<string, string>();
    for (const target of selected) {
      const prior = selectedFingerprints.get(target.semanticFingerprint);
      if (prior !== undefined && prior !== target.variantId) {
        errors.push({ code: "duplicate-semantic-target", stage: STAGE.selection, lessonId: lesson.id, id: target.variantId, referenceId: prior, dimension: "selected" });
      } else {
        selectedFingerprints.set(target.semanticFingerprint, target.variantId);
      }
    }

    // Generate every selected exercise using the fully realized context.
    generateExercises(analysis, selected, errors, deps.generateExercise);
  }

  return { exerciseCount, visibleTargetCounts, uniqueVisibleTargetCount, maximumVisibleReuse, transferTargetIds, ok };
}

function generateExercises(
  analysis: LessonAnalysis,
  selected: readonly SelectedPracticeTarget[],
  errors: ValidationError[],
  generateExercise: GenerateFamilyExerciseFn,
): void {
  const sentenceById = new Map<string, RealizedSentence>();
  for (const sentence of [
    ...analysis.modelSentences,
    ...analysis.roundOneCandidateSentences,
    ...analysis.transferSentences,
  ]) {
    if (!sentenceById.has(sentence.variantId)) sentenceById.set(sentence.variantId, sentence);
  }
  const context: FamilyPracticeContext = {
    seed: analysis.lesson.practice.lessonId,
    realizedSentences: [...sentenceById.values()],
  };
  for (const target of selected) {
    const sentence = sentenceById.get(target.variantId);
    if (!sentence) {
      errors.push({ code: "practice-generation-failed", stage: STAGE.selection, lessonId: analysis.lesson.id, id: target.variantId, referenceId: target.variantId, underlyingCode: "missing-realized-target" });
      continue;
    }
    const result = generateExercise(target, sentence, context);
    if (!result.ok) {
      errors.push({ code: "practice-generation-failed", stage: STAGE.selection, lessonId: analysis.lesson.id, id: target.variantId, referenceId: result.error.referenceId, underlyingCode: result.error.underlyingCode ?? result.error.code });
    }
  }
}

// ---------------------------------------------------------------------------
// Stage 5 — transfer tuple
// ---------------------------------------------------------------------------

/** Resolved cumulative availability for a single lesson (Phase 2 Task 4). */
interface LessonAvailability {
  readonly conceptIds: ReadonlySet<string>;
  readonly senseIds: ReadonlySet<string>;
  readonly valueIds: ReadonlySet<string>;
  readonly forms: ReadonlySet<string>;
}

/** The universe of concept ids known to the catalog (union of every family's
 * `requiredConceptIds`) — used to validate caller-supplied availability refs. */
function conceptUniverse(ctx: CatalogIndex): ReadonlySet<string> {
  const universe = new Set<string>();
  for (const family of ctx.catalogs.sentenceFamilies) {
    for (const id of family.requiredConceptIds) universe.add(id);
  }
  return universe;
}

/** Validates that a caller-supplied availability map references only entities
 * that exist in the catalog, so a typo can never silently widen the gate. */
function checkAvailabilityRefs(
  lessonId: string,
  availability: {
    readonly conceptIds: readonly string[];
    readonly senseIds: readonly string[];
    readonly semanticValueIds: readonly string[];
    readonly forms: readonly string[];
  },
  ctx: CatalogIndex,
  concepts: ReadonlySet<string>,
  errors: ValidationError[],
): void {
  for (const id of availability.conceptIds) {
    if (!concepts.has(id)) {
      errors.push({ code: "invalid-availability-reference", stage: STAGE.transfer, lessonId, id: lessonId, referenceId: id, dimension: "concept" });
    }
  }
  for (const id of availability.senseIds) {
    if (!ctx.senseById.has(id)) {
      errors.push({ code: "invalid-availability-reference", stage: STAGE.transfer, lessonId, id: lessonId, referenceId: id, dimension: "sense" });
    }
  }
  for (const id of availability.semanticValueIds) {
    if (!ctx.valueById.has(id)) {
      errors.push({ code: "invalid-availability-reference", stage: STAGE.transfer, lessonId, id: lessonId, referenceId: id, dimension: "value" });
    }
  }
}

function checkTransfers(
  analysis: LessonAnalysis,
  ctx: CatalogIndex,
  errors: ValidationError[],
  availability?: LessonAvailability,
): void {
  const lesson = analysis.lesson;
  const modelFingerprints = new Set(analysis.modelFingerprints);
  // When explicit cumulative availability is supplied for the lesson, gate the
  // transfers against it (introduced content available up to and including this
  // lesson). Otherwise fall back to same-lesson model content (Phase-1 closure).
  const introducedConceptIds = availability ? availability.conceptIds : analysis.introducedConceptIds;
  const introducedSenseIds = availability ? availability.senseIds : analysis.introducedSenseIds;
  const introducedValueIds = availability ? availability.valueIds : analysis.introducedValueIds;
  const introducedForms = availability ? availability.forms : analysis.introducedForms;
  for (const sentence of analysis.transferSentences) {
    const variant = ctx.variantById.get(sentence.variantId);
    if (!variant) continue;
    if (modelFingerprints.has(sentence.semanticFingerprint)) {
      errors.push({ code: "transfer-duplicates-model", stage: STAGE.transfer, lessonId: lesson.id, id: sentence.variantId, referenceId: sentence.semanticFingerprint });
    }
    for (const conceptId of sentence.usedConceptIds) {
      if (!introducedConceptIds.has(conceptId)) {
        errors.push({ code: "transfer-uses-unintroduced-content", stage: STAGE.transfer, lessonId: lesson.id, id: sentence.variantId, referenceId: conceptId, dimension: "concept" });
      }
    }
    for (const senseId of sentence.usedLexemeSenseIds) {
      if (!introducedSenseIds.has(senseId)) {
        errors.push({ code: "transfer-uses-unintroduced-content", stage: STAGE.transfer, lessonId: lesson.id, id: sentence.variantId, referenceId: senseId, dimension: "sense" });
      }
    }
    for (const value of Object.values(variant.slotValues)) {
      if (!introducedValueIds.has(value)) {
        errors.push({ code: "transfer-uses-unintroduced-content", stage: STAGE.transfer, lessonId: lesson.id, id: sentence.variantId, referenceId: value, dimension: "value" });
      }
    }
    if (!introducedForms.has(formKey(variant.form))) {
      errors.push({ code: "transfer-uses-unintroduced-content", stage: STAGE.transfer, lessonId: lesson.id, id: sentence.variantId, referenceId: formKey(variant.form), dimension: "form" });
    }
  }
}

// ---------------------------------------------------------------------------
// Stage 6 — learning use / senses / verb recurrence
// ---------------------------------------------------------------------------

const CORRECTNESS_BEARING_KINDS = new Set([
  "tile-ordering",
  "choice",
  "transformation",
  "completion",
  "constrained-construction",
]);

interface VerbAnalysis {
  readonly row: VerbUseReportRow;
}

/**
 * Independently REALIZES a cited later-use variant (quality-review I1) —
 * never trusts the citation's raw catalog metadata. Uses the whole-catalog
 * concept universe as a permissive `availableConceptIds` set so this works
 * for a variant hosted in ANY lesson, independent of which lesson introduced
 * the record being checked. Returns `undefined` when the variant/family
 * cannot be resolved or fails to realize at all (a distinct failure mode from
 * "realizes, but the wrong sense").
 */
function realizeLaterUseVariant(
  ctx: CatalogIndex,
  concepts: ReadonlySet<string>,
  variantId: string,
): readonly string[] | undefined {
  const variant = ctx.variantById.get(variantId);
  if (!variant) return undefined;
  const family = ctx.familyById.get(variant.sentenceFamilyId);
  if (!family) return undefined;
  const realizeCatalogs: RealizeVariantCatalogs = {
    contexts: ctx.catalogs.contexts,
    personRoles: ctx.catalogs.personRoles,
    referents: ctx.catalogs.referents,
    semanticValues: ctx.catalogs.semanticValues,
    learningTargetSenses: ctx.catalogs.learningTargetSenses,
  };
  const result = realizeVariant(family, variant, realizeCatalogs, { availableConceptIds: [...concepts] });
  return result.ok ? result.sentence.usedLexemeSenseIds : undefined;
}

function analyzeVerbRecord(
  record: VerbUseRecord,
  ctx: CatalogIndex,
  concepts: ReadonlySet<string>,
  errors: ValidationError[],
): VerbAnalysis {
  const introPos = ctx.positionByLesson.get(record.introductionLessonId);
  const introPosition = introPos?.position ?? -1;
  const introModuleId = introPos?.moduleId;

  const introVariants = record.introductionVariantIds
    .map((id) => ctx.variantById.get(id))
    .filter((variant): variant is SentenceVariant => variant !== undefined);
  const introStructureKeys = sortedUnique(introVariants.map(structureKey));

  const laterVariants = record.laterUses
    .map((use) => ({ use, variant: ctx.variantById.get(use.variantId) }))
    .filter((entry): entry is { use: (typeof record.laterUses)[number]; variant: SentenceVariant } => entry.variant !== undefined);
  const laterPositions = record.laterUses.map((use) => ctx.positionByLesson.get(use.lessonId)?.position ?? -1);
  const laterModuleIds = record.laterUses.map((use) => ctx.positionByLesson.get(use.lessonId)?.moduleId);
  const maxPositionGap = laterPositions.reduce((max, pos) => (pos >= 0 && introPosition >= 0 ? Math.max(max, pos - introPosition) : max), 0);
  const hasLaterModule = laterModuleIds.some((moduleId) => moduleId !== undefined && moduleId !== introModuleId);
  const allStructureKeys = sortedUnique([...introVariants, ...laterVariants.map((entry) => entry.variant)].map(structureKey));

  const recordErrors: ValidationError[] = [];

  if (record.learningUse === "receptive") {
    // Receptive validation (§9.3): distinct contextual input instances plus a
    // correctness-bearing comprehension exercise; no productive recurrence
    // credit is granted.
    const inputContexts = sortedUnique(introVariants.map((variant) => variant.contextId));
    // Split the diagnostic so reports name the *actual* deficiency: too few
    // input instances (input-count) vs enough inputs but too few distinct
    // contexts (context). Input count is the more fundamental deficiency, so it
    // is reported first and exclusively.
    if (introVariants.length < 2) {
      recordErrors.push({ code: "receptive-use-insufficient-input", stage: STAGE.learningUse, id: record.id, referenceId: record.senseId, dimension: "input-count", expected: 2, actual: introVariants.length });
    } else if (inputContexts.length < 2) {
      recordErrors.push({ code: "receptive-use-insufficient-input", stage: STAGE.learningUse, id: record.id, referenceId: record.senseId, dimension: "context", expected: 2, actual: inputContexts.length });
    }
    const exerciseKindOk = CORRECTNESS_BEARING_KINDS.has(record.introductionExercise.exerciseKind);
    const targetIsInput = record.introductionVariantIds.includes(record.introductionExercise.targetVariantId);
    if (!exerciseKindOk || !targetIsInput) {
      recordErrors.push({ code: "receptive-use-missing-comprehension", stage: STAGE.learningUse, id: record.id, referenceId: record.introductionExercise.targetVariantId });
    }
  } else {
    if (introVariants.length < 2 || introStructureKeys.length < 2) {
      recordErrors.push({ code: "productive-verb-introduction-structure", stage: STAGE.learningUse, id: record.id, referenceId: record.senseId, expected: 2, actual: introStructureKeys.length });
    }
    const exerciseKindOk = CORRECTNESS_BEARING_KINDS.has(record.introductionExercise.exerciseKind);
    const targetIsIntro = record.introductionVariantIds.includes(record.introductionExercise.targetVariantId);
    if (!exerciseKindOk || !targetIsIntro) {
      recordErrors.push({ code: "productive-verb-introduction-exercise", stage: STAGE.learningUse, id: record.id, referenceId: record.introductionExercise.targetVariantId });
    }
    if (record.laterUses.length < 2) {
      recordErrors.push({ code: "productive-verb-later-reuse", stage: STAGE.learningUse, id: record.id, referenceId: record.senseId, expected: 2, actual: record.laterUses.length });
    }
    if (maxPositionGap < 2) {
      recordErrors.push({ code: "productive-verb-spaced-reuse", stage: STAGE.learningUse, id: record.id, referenceId: record.senseId, expected: 2, actual: maxPositionGap });
    }
    if (!hasLaterModule) {
      recordErrors.push({ code: "productive-verb-later-module", stage: STAGE.learningUse, id: record.id, referenceId: record.senseId });
    }
    if (allStructureKeys.length < 2) {
      recordErrors.push({ code: "productive-verb-structure-reuse", stage: STAGE.learningUse, id: record.id, referenceId: record.senseId, expected: 2, actual: allStructureKeys.length });
    }
    // Quality-review I1: a later-use citation is only genuine if the cited
    // variant, once REALIZED, actually produces the claimed sense among its
    // `usedLexemeSenseIds`. Structure-key diversity above is computed from
    // raw catalog metadata and says nothing about which sense a variant
    // realizes — an author could cite any resolvable variant from an
    // unrelated family/predicate and every check above would still pass.
    for (const use of record.laterUses) {
      const realizedSenseIds = realizeLaterUseVariant(ctx, concepts, use.variantId);
      if (realizedSenseIds === undefined || !realizedSenseIds.includes(record.senseId)) {
        recordErrors.push({
          code: "productive-verb-later-use-wrong-sense",
          stage: STAGE.learningUse,
          id: record.id,
          referenceId: use.variantId,
          dimension: "sense",
          expected: record.senseId,
          actual: realizedSenseIds === undefined ? "unresolved" : (realizedSenseIds.join(", ") || "none"),
        });
      }
    }
  }

  for (const error of recordErrors) errors.push(error);

  const row: VerbUseReportRow = {
    recordId: record.id,
    senseId: record.senseId,
    learningUse: record.learningUse,
    introductionLessonId: record.introductionLessonId,
    introductionPosition: introPosition,
    introductionStructureKeys: introStructureKeys,
    laterUseLessonIds: record.laterUses.map((use) => use.lessonId),
    laterUsePositions: laterPositions,
    maxPositionGap,
    hasLaterModule,
    distinctStructureCount: allStructureKeys.length,
    validationErrorCodes: sortedUnique(recordErrors.map((error) => error.code)),
  };
  return { row };
}

/**
 * Pure conservative rule for whether two same-orthography senses (senses that
 * share a `lexemeId`) are contextually distinguishable, or conflated.
 *
 * Returns the *conflation dimension* when the pair is NOT safely distinct:
 *  - `"frame"`   — the two senses share a `semanticFrameId`, so nothing in the
 *                  authored data distinguishes them semantically.
 *  - `"context"` — frames differ, but the realized practice contexts fail the
 *                  distinctness bar: either set is empty, or the two sets are
 *                  not *mutually exclusive* (each sense must contribute at least
 *                  one context the other never uses). This conservative rule
 *                  also rejects identical sets and subset relationships.
 * Returns `null` when the pair is legitimately distinct (different frame AND
 * each sense owns at least one exclusive nonempty practice context).
 */
export function senseConflationDimension(
  a: { readonly semanticFrameId: string; readonly contexts: ReadonlySet<string> },
  b: { readonly semanticFrameId: string; readonly contexts: ReadonlySet<string> },
): "frame" | "context" | null {
  if (a.semanticFrameId === b.semanticFrameId) return "frame";
  if (a.contexts.size === 0 || b.contexts.size === 0) return "context";
  const aExclusive = [...a.contexts].some((context) => !b.contexts.has(context));
  const bExclusive = [...b.contexts].some((context) => !a.contexts.has(context));
  if (!aExclusive || !bExclusive) return "context";
  return null;
}

function checkConflatedSenses(
  ctx: CatalogIndex,
  senseContexts: ReadonlyMap<string, ReadonlySet<string>>,
  errors: ValidationError[],
): void {
  const byLexeme = new Map<string, LearningTargetSense[]>();
  for (const sense of ctx.catalogs.learningTargetSenses) {
    const group = byLexeme.get(sense.lexemeId);
    if (group) group.push(sense);
    else byLexeme.set(sense.lexemeId, [sense]);
  }
  const EMPTY: ReadonlySet<string> = new Set<string>();
  for (const group of byLexeme.values()) {
    if (group.length < 2) continue;
    for (let i = 0; i < group.length; i += 1) {
      for (let j = i + 1; j < group.length; j += 1) {
        const earlier = group[i];
        const later = group[j];
        const dimension = senseConflationDimension(
          { semanticFrameId: earlier.semanticFrameId, contexts: senseContexts.get(earlier.id) ?? EMPTY },
          { semanticFrameId: later.semanticFrameId, contexts: senseContexts.get(later.id) ?? EMPTY },
        );
        if (dimension !== null) {
          errors.push({ code: "conflated-sense-context", stage: STAGE.learningUse, id: later.id, referenceId: earlier.id, dimension });
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Stage 7 — Can-do
// ---------------------------------------------------------------------------

function checkCanDos(
  ctx: CatalogIndex,
  transferByCanDo: ReadonlyMap<string, boolean>,
  errors: ValidationError[],
): void {
  const c = ctx.catalogs;

  // Each authored lesson: exactly one valid primary Can-do (same level, covers
  // the lesson) and at most two supporting Can-dos.
  for (const lesson of c.lessons) {
    const primary = ctx.canDoById.get(lesson.primaryCanDoId);
    if (!primary || primary.level !== lesson.level || !primary.lessonIds.includes(lesson.id)) {
      errors.push({ code: "can-do-primary-coverage", stage: STAGE.canDo, lessonId: lesson.id, id: lesson.id, referenceId: lesson.primaryCanDoId });
    }
    if (lesson.supportingCanDoIds.length > 2) {
      errors.push({ code: "can-do-supporting-overflow", stage: STAGE.canDo, lessonId: lesson.id, id: lesson.id, expected: 2, actual: lesson.supportingCanDoIds.length });
    }
  }

  // Every Can-do has at least one transfer exercise (§8).
  for (const canDo of c.canDos) {
    if (!transferByCanDo.get(canDo.id)) {
      errors.push({ code: "can-do-transfer-coverage", stage: STAGE.canDo, level: canDo.level, id: canDo.id, referenceId: canDo.id });
    }
  }

  // Each taught primary Can-do is sampled by a checkpoint at its level, with a
  // per-Can-do accepted-transfer minimum at least as strong as the Can-do's own
  // evidence rule (§8: evidence is checkpoint-sampled, never inferred).
  const checkpointsByLevel = new Map<string, CheckpointDefinition[]>();
  for (const checkpoint of c.checkpoints) {
    const list = checkpointsByLevel.get(checkpoint.level) ?? [];
    list.push(checkpoint);
    checkpointsByLevel.set(checkpoint.level, list);
  }
  const taughtPrimaryIds = new Set(c.lessons.map((lesson) => lesson.primaryCanDoId));
  for (const canDo of c.canDos) {
    if (!taughtPrimaryIds.has(canDo.id)) continue;
    const required = canDo.checkpointEvidenceRule.minAcceptedTransferTargets;
    const sampled = (checkpointsByLevel.get(canDo.level) ?? []).some(
      (checkpoint) => checkpoint.sampledCanDoIds.includes(canDo.id) && checkpoint.minAcceptedTransferTargetsPerCanDo >= required,
    );
    if (!sampled) {
      errors.push({ code: "can-do-checkpoint-coverage", stage: STAGE.canDo, level: canDo.level, id: canDo.id, referenceId: canDo.id, expected: required });
    }
  }
}

// ---------------------------------------------------------------------------
// Report assembly
// ---------------------------------------------------------------------------

function variationAxesForLesson(analysis: LessonAnalysis, ctx: CatalogIndex): readonly VariationAxis[] {
  const axes = new Set<VariationAxis>();
  for (const familyId of analysis.lesson.familyIds) {
    const family = ctx.familyById.get(familyId);
    if (family) for (const axis of family.permittedAxes) axes.add(axis);
  }
  return sortAxes(axes);
}

function buildLessonRow(
  analysis: LessonAnalysis,
  ctx: CatalogIndex,
  selection: SelectionSummary,
  lessonErrors: readonly ValidationError[],
  transferTargetIds: readonly string[],
): LessonCoverageReport {
  const lesson = analysis.lesson;
  const models = analysis.modelSentences;
  const position = ctx.positionByLesson.get(lesson.id)?.position ?? 0;

  const productiveSenseIds = new Set<string>();
  const receptiveSenseIds = new Set<string>();
  for (const senseId of models.flatMap((sentence) => sentence.usedLexemeSenseIds)) {
    const sense = ctx.senseById.get(senseId);
    if (!sense) continue;
    if (sense.learningUse === "receptive") receptiveSenseIds.add(senseId);
    else productiveSenseIds.add(senseId);
  }

  const modelDuplicateTransferIds = analysis.transferSentences
    .filter((sentence) => analysis.modelFingerprints.includes(sentence.semanticFingerprint))
    .map((sentence) => sentence.variantId);

  const codes = sortedUnique(lessonErrors.map((error) => error.code));

  return {
    lessonId: lesson.id,
    level: lesson.level,
    moduleId: lesson.moduleId,
    position,
    modelCount: models.length,
    modelSemanticFingerprints: [...analysis.modelFingerprints].sort(),
    familyIds: sortedUnique(lesson.familyIds),
    variationAxes: variationAxesForLesson(analysis, ctx),
    productiveSenseIds: sortedUnique(productiveSenseIds),
    receptiveSenseIds: sortedUnique(receptiveSenseIds),
    predicateSenseIds: sortedUnique(models.map((sentence) => sentence.predicateSenseId)),
    roleIds: distinctRoleIds(models),
    omittedSubjectCount: models.filter((sentence) => sentence.discourse.subjectRealization === "omitted").length,
    contextIds: sortedUnique(models.map((sentence) => sentence.contextId)),
    exerciseCount: selection.exerciseCount,
    visibleTargetCounts: selection.visibleTargetCounts,
    uniqueVisibleTargetCount: selection.uniqueVisibleTargetCount,
    maximumVisibleReuse: selection.maximumVisibleReuse,
    transferTargetIds,
    modelDuplicateTransferIds: sortedUnique(modelDuplicateTransferIds),
    primaryCanDoId: lesson.primaryCanDoId,
    supportingCanDoIds: sortedUnique(lesson.supportingCanDoIds),
    validationErrorCodes: codes,
    complete: analysis.realized && selection.ok && codes.length === 0,
  };
}

// ---------------------------------------------------------------------------
// Error ordering
// ---------------------------------------------------------------------------

function canonicalPosition(error: ValidationError, ctx: CatalogIndex): number {
  if (error.lessonId) {
    const record = ctx.positionByLesson.get(error.lessonId);
    if (record) {
      const module = ctx.moduleById.get(record.moduleId);
      return levelRank(record.level) * 1_000_000 + (module?.order ?? 0) * 1000 + record.position;
    }
  }
  if (error.moduleId) {
    const module = ctx.moduleById.get(error.moduleId);
    if (module) return levelRank(module.level) * 1_000_000 + module.order * 1000;
  }
  if (error.level) return levelRank(error.level) * 1_000_000;
  return -1;
}

function compareErrors(a: ValidationError, b: ValidationError, ctx: CatalogIndex): number {
  if (a.stage !== b.stage) return a.stage - b.stage;
  const posA = canonicalPosition(a, ctx);
  const posB = canonicalPosition(b, ctx);
  if (posA !== posB) return posA - posB;
  const idA = a.id ?? "";
  const idB = b.id ?? "";
  if (idA !== idB) return idA < idB ? -1 : 1;
  if (a.code !== b.code) return a.code < b.code ? -1 : 1;
  const refA = a.referenceId ?? "";
  const refB = b.referenceId ?? "";
  if (refA !== refB) return refA < refB ? -1 : 1;
  const dimA = a.dimension ?? "";
  const dimB = b.dimension ?? "";
  return dimA < dimB ? -1 : dimA > dimB ? 1 : 0;
}

function dedupeErrors(errors: readonly ValidationError[]): readonly ValidationError[] {
  const seen = new Set<string>();
  const result: ValidationError[] = [];
  for (const error of errors) {
    const key = JSON.stringify([
      error.code,
      error.stage,
      error.lessonId ?? "",
      error.moduleId ?? "",
      error.level ?? "",
      error.id ?? "",
      error.referenceId ?? "",
      error.dimension ?? "",
    ]);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(error);
  }
  return result;
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

/** The production selector, injectable so behavioral tests can observe or force
 * selection outcomes without an ambient mutable mock. */
export type SelectVariantsFn = typeof selectVariants;
/** The production exercise generator, injectable for the same reason. */
export type GenerateFamilyExerciseFn = typeof generateFamilyExercise;

/**
 * The two impure boundaries the validator drives per lesson: variant selection
 * and exercise generation. Production wires the real functions via
 * {@link validateFoundations}; tests pass their own to observe calls or force a
 * `Result` error, keeping the validator itself pure and free of broad catches.
 */
export interface ValidateFoundationsDeps {
  readonly selectVariants: SelectVariantsFn;
  readonly generateExercise: GenerateFamilyExerciseFn;
}

const DEFAULT_DEPS: ValidateFoundationsDeps = {
  selectVariants,
  generateExercise: generateFamilyExercise,
};

export function validateFoundations(input: ValidateFoundationsInput): ValidateFoundationsResult {
  return validateFoundationsWithDeps(input, DEFAULT_DEPS);
}

export function validateFoundationsWithDeps(
  input: ValidateFoundationsInput,
  deps: ValidateFoundationsDeps,
): ValidateFoundationsResult {
  const ctx = indexCatalogs(input.catalogs);

  // --- Stage 1: integrity (gating) ---
  const stage1: ValidationError[] = [];
  checkDuplicates(ctx, stage1);
  checkReferences(ctx, stage1);
  checkCopyParityAndReferences(ctx, input.foundationCopy, stage1);
  checkAliases(ctx, input.foundationCopy, stage1);

  const analyses = new Map<string, LessonAnalysis>();
  const selectionSummaries = new Map<string, SelectionSummary>();
  const verbRows: VerbUseReportRow[] = [];

  const gateStage1 = stage1.length > 0;

  const stageRest: ValidationError[] = [];

  if (!gateStage1) {
    // --- Stage 2: realization (gating) ---
    for (const lesson of input.catalogs.lessons) {
      const analysis = analyzeLesson(lesson, ctx);
      analyses.set(lesson.id, analysis);
      for (const error of analysis.realizationErrors) stageRest.push(error);
    }

    const gateStage2 = stageRest.some((error) => error.stage === STAGE.realization);

    if (!gateStage2) {
      // --- Stages 3-6 per lesson ---
      const concepts = conceptUniverse(ctx);
      for (const lesson of input.catalogs.lessons) {
        const analysis = analyses.get(lesson.id)!;
        const seed = input.seedByLesson?.[lesson.id] ?? input.seed;
        const lessonErrors: ValidationError[] = [];
        checkModelDiversity(analysis, lessonErrors);
        const selection = checkSelectionAndExercises(analysis, ctx, input.catalogVersion, seed, lessonErrors, deps);
        const rawAvailability = input.availableContentByLesson?.[lesson.id];
        let availability: LessonAvailability | undefined;
        if (rawAvailability) {
          checkAvailabilityRefs(lesson.id, rawAvailability, ctx, concepts, lessonErrors);
          availability = {
            conceptIds: new Set(rawAvailability.conceptIds),
            senseIds: new Set(rawAvailability.senseIds),
            valueIds: new Set(rawAvailability.semanticValueIds),
            forms: new Set(rawAvailability.forms),
          };
        }
        checkTransfers(analysis, ctx, lessonErrors, availability);
        selectionSummaries.set(lesson.id, selection);
        for (const error of lessonErrors) stageRest.push(error);
      }

      // --- Stage 6: verb recurrence + conflated senses ---
      for (const record of input.catalogs.verbUseRecords) {
        const { row } = analyzeVerbRecord(record, ctx, concepts, stageRest);
        verbRows.push(row);
      }
      const senseContexts = collectSensePracticeContexts(analyses, ctx);
      checkConflatedSenses(ctx, senseContexts, stageRest);

      // --- Stage 7: Can-dos ---
      const transferByCanDo = computeTransferByCanDo(ctx);
      checkCanDos(ctx, transferByCanDo, stageRest);
    }
  }

  const allErrors = dedupeErrors([...stage1, ...stageRest]);

  // --- Reports (always built, best-effort) ---
  const reports = buildReports(input, ctx, analyses, selectionSummaries, verbRows, allErrors);

  const sortedErrors = [...allErrors].sort((a, b) => compareErrors(a, b, ctx));

  return { valid: sortedErrors.length === 0, errors: sortedErrors, reports };
}

/**
 * Derive each sense's realized practice-context set from the fully realized
 * model + round-one + round-two sentences across every lesson, *plus* every
 * context reachable through the sense's own `VerbUseRecord` recurrence
 * timeline (`introductionVariantIds` and `laterUses`). A sense's contexts are
 * therefore the union of:
 *  - the `contextId`s of every realized sentence whose `usedLexemeSenseIds`
 *    includes it (depth-lesson model/practice pools), and
 *  - the `contextId`s of the variants referenced by any `VerbUseRecord` whose
 *    `senseId` matches it, resolved against the sentence-variant catalog.
 * The second source matters for receptive-only timelines (§9.3): a purely
 * receptive sense may never appear in a lesson's model/practice pools at all,
 * yet still have a legitimate, distinct set of practice contexts recorded on
 * its `VerbUseRecord`. Missing/invalid variant references are skipped here —
 * stage 1's reference check (`checkReferences`) already gates the pipeline
 * before this runs, so a genuinely dangling reference never reaches this
 * function as a silent success. Used by the same-orthography conflation
 * check to decide whether two senses sharing a lexeme are contextually
 * distinct.
 */
function collectSensePracticeContexts(
  analyses: ReadonlyMap<string, LessonAnalysis>,
  ctx: CatalogIndex,
): ReadonlyMap<string, ReadonlySet<string>> {
  const map = new Map<string, Set<string>>();
  const addContext = (senseId: string, contextId: string): void => {
    let set = map.get(senseId);
    if (!set) {
      set = new Set<string>();
      map.set(senseId, set);
    }
    set.add(contextId);
  };

  for (const analysis of analyses.values()) {
    for (const sentence of [
      ...analysis.modelSentences,
      ...analysis.roundOneCandidateSentences,
      ...analysis.transferSentences,
    ]) {
      for (const senseId of sentence.usedLexemeSenseIds) {
        addContext(senseId, sentence.contextId);
      }
    }
  }

  for (const record of ctx.catalogs.verbUseRecords) {
    const variantIds = [...record.introductionVariantIds, ...record.laterUses.map((use) => use.variantId)];
    for (const variantId of variantIds) {
      const variant = ctx.variantById.get(variantId);
      if (!variant) continue; // Dangling reference: stage 1 already gates this catalog.
      addContext(record.senseId, variant.contextId);
    }
  }

  return map;
}

function computeTransferByCanDo(ctx: CatalogIndex): ReadonlyMap<string, boolean> {
  const map = new Map<string, boolean>();
  for (const canDo of ctx.catalogs.canDos) map.set(canDo.id, false);
  for (const variant of ctx.catalogs.sentenceVariants) {
    if (variant.pedagogicalUse !== "transfer") continue;
    const family = ctx.familyById.get(variant.sentenceFamilyId);
    if (!family) continue;
    for (const canDoId of family.canDoIds) {
      if (map.has(canDoId)) map.set(canDoId, true);
    }
  }
  return map;
}

function buildReports(
  input: ValidateFoundationsInput,
  ctx: CatalogIndex,
  analyses: ReadonlyMap<string, LessonAnalysis>,
  selectionSummaries: ReadonlyMap<string, SelectionSummary>,
  verbRows: readonly VerbUseReportRow[],
  allErrors: readonly ValidationError[],
): FoundationCoverageReports {
  const emptySelection: SelectionSummary = {
    exerciseCount: 0,
    visibleTargetCounts: {},
    uniqueVisibleTargetCount: 0,
    maximumVisibleReuse: 0,
    transferTargetIds: [],
    ok: false,
  };

  const lessonRows: LessonCoverageReport[] = [];
  for (const lesson of input.catalogs.lessons) {
    const analysis = analyses.get(lesson.id);
    const selection = selectionSummaries.get(lesson.id) ?? emptySelection;
    const attributed = allErrors.filter((error) => error.lessonId === lesson.id);
    if (analysis) {
      lessonRows.push(buildLessonRow(analysis, ctx, selection, attributed, selection.transferTargetIds));
    } else {
      // Gating stage prevented analysis: still emit a resolvable, diagnostic row.
      lessonRows.push(diagnosticLessonRow(lesson, ctx, attributed));
    }
  }

  const modules: ModuleMeta[] = input.catalogs.modules.map((module) => ({
    id: module.id,
    level: module.level,
    order: module.order,
    canDoIds: module.canDoIds,
  }));
  const levels: LevelMeta[] = input.catalogs.levels.map((level) => ({
    level: level.id,
    moduleIds: level.moduleIds,
    canDoIds: level.canDoIds,
  }));

  const checkpoints: CheckpointReportRow[] = input.catalogs.checkpoints.map((checkpoint) => {
    const canDoEvidenceMins: Record<string, number> = {};
    for (const canDoId of checkpoint.sampledCanDoIds) {
      const canDo = ctx.canDoById.get(canDoId);
      if (canDo) canDoEvidenceMins[canDoId] = canDo.checkpointEvidenceRule.minAcceptedTransferTargets;
    }
    const codes = sortedUnique(
      allErrors
        .filter((error) => error.code === "can-do-checkpoint-coverage" && checkpoint.sampledCanDoIds.includes(error.id ?? ""))
        .map((error) => error.code),
    );
    return {
      checkpointId: checkpoint.id,
      level: checkpoint.level,
      sampledCanDoIds: checkpoint.sampledCanDoIds,
      minAcceptedTransferTargetsPerCanDo: checkpoint.minAcceptedTransferTargetsPerCanDo,
      canDoEvidenceMins,
      validationErrorCodes: codes,
    };
  });

  return aggregateFoundationReports({ lessonRows, modules, levels, verbUse: verbRows, checkpoints });
}

function diagnosticLessonRow(
  lesson: FoundationLessonDefinition,
  ctx: CatalogIndex,
  attributed: readonly ValidationError[],
): LessonCoverageReport {
  const position = ctx.positionByLesson.get(lesson.id)?.position ?? 0;
  // Resolve what we still can from authored variants (no realization).
  const modelVariants = lesson.modelVariantIds
    .map((id) => ctx.variantById.get(id))
    .filter((variant): variant is SentenceVariant => variant !== undefined);
  const predicateSenseIds = sortedUnique(
    modelVariants
      .map((variant) => ctx.valueById.get(variant.slotValues["predicate"] ?? "")?.senseId)
      .filter((id): id is string => id !== undefined),
  );
  return {
    lessonId: lesson.id,
    level: lesson.level,
    moduleId: lesson.moduleId,
    position,
    modelCount: modelVariants.length,
    modelSemanticFingerprints: [],
    familyIds: sortedUnique(lesson.familyIds),
    variationAxes: [],
    productiveSenseIds: [],
    receptiveSenseIds: [],
    predicateSenseIds,
    roleIds: sortedUnique(modelVariants.map((variant) => variant.discourse.speakerRoleId)),
    omittedSubjectCount: modelVariants.filter((variant) => variant.discourse.subjectRealization === "omitted").length,
    contextIds: sortedUnique(modelVariants.map((variant) => variant.contextId)),
    exerciseCount: 0,
    visibleTargetCounts: {},
    uniqueVisibleTargetCount: 0,
    maximumVisibleReuse: 0,
    transferTargetIds: [],
    modelDuplicateTransferIds: [],
    primaryCanDoId: lesson.primaryCanDoId,
    supportingCanDoIds: sortedUnique(lesson.supportingCanDoIds),
    validationErrorCodes: sortedUnique(attributed.map((error) => error.code)),
    complete: false,
  };
}
