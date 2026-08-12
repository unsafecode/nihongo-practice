/**
 * The A1 **release** validator (§6, §8–§16, Phase 2 Task 4).
 *
 * `validateA1` is a thin, deterministic release gate layered on top of the
 * Phase-1 `validateFoundations` oracle. It does three things:
 *
 *   1. **Wraps** `validateFoundations` over the 60 non-phonetic lessons with a
 *      fixed catalog version and seed, and surfaces that full report verbatim as
 *      {@link ValidateA1Result.foundationReport} (its errors are *preserved*, so
 *      a reviewer sees every lesson-local diagnostic the oracle produces).
 *   2. Adds the four **phonetic contracts** the oracle cannot express (the sounds
 *      module carries no sentence variants).
 *   3. Checks the whole-level **release** invariants that only exist once all
 *      sixteen modules are assembled: exact route/module/lesson shape, manifest
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
  A1AreaValidationError,
  A1CourseArea,
  A1ManifestSpec,
  A1ReleaseErrorCode,
  A1ReleaseValidationError,
} from "../types";
import {
  validateA1Curriculum,
  type A1CurriculumValidationOverrides,
  type ValidateA1CurriculumResult,
} from "../curriculum/validateA1Curriculum";
import {
  A1_MANIFEST_SPEC,
  A1_RETAINED_MODULE_IDS,
  A1_RETAINED_LESSON_IDS,
  A1_RETAINED_LESSON_IDS_BY_MODULE,
  A1_CANONICAL_POSITIONS,
  A1_CAPSTONE_LESSON_IDS,
  A1_LEGACY_LESSON_ALIASES,
  validateA1ManifestSpec,
} from "../manifest";
import {
  A1_AREA_IDS,
  A1_RETAINED_AREAS,
  validateA1RetainedAreas,
} from "../areas";
import type {
  CanDo,
  FoundationCatalogs,
  RealizedSentence,
  SentenceFamily,
  SentenceVariant,
  VerbUseRecord,
} from "../../foundations/types";
import type { CourseModule } from "../../data/types";
// The *runtime* A1 modules — the eleven Base did not rehome — are what the
// release ships and therefore what the area gate must check.
import { courseModulesByLevel } from "../../data/course";
import { en as enCourseCopy } from "../../i18n/en";
import { it as itCourseCopy } from "../../i18n/it";
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
import { a1CanDosAuthored } from "./canDos";
import { a1Checkpoint, A1_CHECKPOINT_MIN_TRANSFER_TARGETS } from "./checkpoint";
import { A1_INHERITED_BASE_CONTENT } from "./inheritedBaseContent";
import { a1ReleaseVerbUseRecords } from "./recurrence";
import type { A1PhoneticItem } from "./module01Sounds";
import type { A1PhoneticLessonRecipe } from "../types";
import {
  A1_RELEASE_CATALOG_VERSION,
  A1_RELEASE_SEED,
} from "../releaseIdentity";

// ---------------------------------------------------------------------------
// Fixed release identity — the validator is deterministic by construction.
// ---------------------------------------------------------------------------

// Re-exported (not redeclared) from `../releaseIdentity`, the one shared
// source of truth also imported directly by `../a1LessonViewModel.ts`
// (Phase 2 §M1). `selectVariants` ranks candidates by a hash keyed on
// `catalogVersion`/`seed`, so the validator's wrapped `validateFoundations`
// call below and the runtime builder must use the identical pair or the
// certified release and the shipped release can silently diverge, exercise
// for exercise.
export { A1_RELEASE_CATALOG_VERSION, A1_RELEASE_SEED };

/**
 * Exact structural totals the assembled A1 level must exhibit.
 *
 * Task 16 rehomed five modules (the phonetic `sounds` plus the four
 * Foundations modules) to Base, so the canonical A1 release is eleven modules /
 * forty-four routes, every one of them semantic, and the level has no phonetic
 * lessons of its own left. The published route *ids* are unchanged: A1 keeps
 * the exact forty-four it always owned, and Base keeps the other twenty.
 */
export const A1_EXPECTED_MODULE_COUNT = 11 as const;
export const A1_EXPECTED_LESSONS_PER_MODULE = 4 as const;
export const A1_EXPECTED_ROUTE_COUNT = 44 as const;
export const A1_EXPECTED_AREA_COUNT = 2 as const;
export const A1_EXPECTED_SEMANTIC_LESSON_COUNT = 44 as const;
export const A1_EXPECTED_PHONETIC_LESSON_COUNT = 0 as const;
export const A1_EXPECTED_CAPSTONE_LESSON_COUNT = 4 as const;

// ---------------------------------------------------------------------------
// Error contract
// ---------------------------------------------------------------------------

// The release error vocabulary is declared once, in `../types`
// (`A1_RELEASE_ERROR_CODES` / `A1ReleaseErrorCode` / `A1ReleaseValidationError`),
// so it can back both the manifest-spec/slice/authoring gates and this release
// gate from a single source of truth. These names are re-exported unchanged
// for backward compatibility with existing importers of `./validateA1`.
export type A1ValidationErrorCode = A1ReleaseErrorCode;
export type A1ValidationError = A1ReleaseValidationError;

/** The learner-facing title/description pair for one authored A1 area. */
export interface A1AreaLocaleCopy {
  readonly title?: string;
  readonly description?: string;
}

/** The two independently localized runtime area-copy tables. */
export interface A1AreaCopyByLocale {
  readonly en: Readonly<Record<string, A1AreaLocaleCopy | undefined>>;
  readonly it: Readonly<Record<string, A1AreaLocaleCopy | undefined>>;
}

/** The runtime fields whose agreement with the authored area partition matters. */
export type A1RuntimeAreaModule = Pick<CourseModule, "id" | "areaId">;

export interface ValidateA1Input {
  /** The full 64-lesson level view (16 modules, 19 Can-dos, all positions). */
  readonly fullCatalogs?: FoundationCatalogs;
  /** The 60 non-phonetic lessons handed to `validateFoundations`. */
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
  /** The complete published release verb-use records. */
  readonly releaseVerbUseRecords?: readonly VerbUseRecord[];
  /** The manifest spec whose route/alias shape the level must match. */
  readonly manifestSpec?: A1ManifestSpec;
  /** The checkpoint whose sampled Can-dos / min-transfer the level must meet. */
  readonly checkpoint?: typeof a1Checkpoint;
  /** The authored Can-do set that must each carry transfer evidence. */
  readonly authoredCanDos?: readonly CanDo[];
  /** The ordered authoring partition that the runtime course must preserve. */
  readonly areas?: readonly A1CourseArea[];
  /** The assembled A1 runtime modules, checked independently of the authoring partition. */
  readonly runtimeModules?: readonly A1RuntimeAreaModule[];
  /** The actual IT/EN course-map copy rendered for each authored area. */
  readonly areaCopy?: A1AreaCopyByLocale;
  /** Whole-catalog learner-contract overrides for release-gate fixtures. */
  readonly curriculumInput?: A1CurriculumValidationOverrides;
}

export interface ValidateA1Result {
  readonly valid: boolean;
  readonly errors: readonly A1ValidationError[];
  /** The wrapped `validateFoundations` report — diagnostic, never mutated. */
  readonly foundationReport: ValidateFoundationsResult;
  /** Exhaustive learner-contract result over the same release catalogs. */
  readonly curriculumReport: ValidateA1CurriculumResult;
}

// ---------------------------------------------------------------------------
// Small pure helpers
// ---------------------------------------------------------------------------

function formKey(form: SentenceVariant["form"]): string {
  const mood = form.interrogative ? ":interrogative" : "";
  return `${form.polarity}:${form.tense}:${form.formality}${mood}`;
}

/** Form key as the foundation oracle sees it (mood-insensitive): the cumulative
 * availability map handed to `validateFoundations` must key forms exactly the
 * way `checkTransfers` compares them, i.e. `polarity:tense:formality`. */
function foundationFormKey(form: SentenceVariant["form"]): string {
  return `${form.polarity}:${form.tense}:${form.formality}`;
}

/** Matches any CJK ideograph, hiragana, katakana or the chōonpu bar. */
const JAPANESE_RE = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uff66-\uff9f]/u;

function isCapstoneVariant(variantId: string): boolean {
  return variantId.startsWith("capstones-");
}

function areaReleaseCode(
  code: A1AreaValidationError["code"],
): Extract<
  A1ValidationErrorCode,
  "area-count" | "area-module-membership" | "area-order"
> {
  switch (code) {
    case "area-order":
    case "module-union-order":
      return "area-order";
    case "duplicate-module-membership":
    case "unknown-module-membership":
    case "missing-module-membership":
      return "area-module-membership";
    default:
      return "area-count";
  }
}

function addAreaValidationErrors(
  errors: readonly A1AreaValidationError[],
  push: (error: A1ValidationError) => void,
): void {
  for (const error of errors) {
    push({
      code: areaReleaseCode(error.code),
      id: error.detail,
      referenceId: error.message,
      underlyingCode: error.code,
    });
  }
}

function addRuntimeAreaErrors(
  areas: readonly A1CourseArea[],
  runtimeModules: readonly A1RuntimeAreaModule[],
  push: (error: A1ValidationError) => void,
): void {
  const expectedModuleIds = areas.flatMap((area) => area.moduleIds);
  const expectedAreaByModuleId = new Map(
    areas.flatMap((area) =>
      area.moduleIds.map((moduleId) => [moduleId, area.id] as const),
    ),
  );
  const seenModuleIds = new Set<string>();
  let hasMembershipError = false;

  for (const module of runtimeModules) {
    if (seenModuleIds.has(module.id)) {
      hasMembershipError = true;
      push({
        code: "area-module-membership",
        id: module.id,
        dimension: "runtime-module",
        underlyingCode: "runtime-duplicate-module",
      });
      continue;
    }
    seenModuleIds.add(module.id);

    const expectedAreaId = expectedAreaByModuleId.get(module.id);
    if (expectedAreaId === undefined) {
      hasMembershipError = true;
      push({
        code: "area-module-membership",
        id: module.id,
        dimension: "runtime-module",
        underlyingCode: "runtime-unknown-module",
      });
      continue;
    }
    if (module.areaId !== expectedAreaId) {
      hasMembershipError = true;
      push({
        code: "area-module-membership",
        id: module.id,
        referenceId: expectedAreaId,
        dimension: module.areaId ?? "missing-area-id",
        underlyingCode: "runtime-area-mismatch",
      });
    }
  }

  for (const moduleId of expectedModuleIds) {
    if (!seenModuleIds.has(moduleId)) {
      hasMembershipError = true;
      push({
        code: "area-module-membership",
        id: moduleId,
        underlyingCode: "runtime-missing-module",
      });
    }
  }

  const runtimeModuleIds = runtimeModules.map((module) => module.id);
  if (
    !hasMembershipError &&
    (
      runtimeModuleIds.length !== expectedModuleIds.length ||
      runtimeModuleIds.some(
        (moduleId, index) => moduleId !== expectedModuleIds[index],
      )
    )
  ) {
    const mismatchIndex = runtimeModuleIds.findIndex(
      (moduleId, index) => moduleId !== expectedModuleIds[index],
    );
    push({
      code: "area-order",
      id:
        mismatchIndex === -1
          ? undefined
          : runtimeModuleIds[mismatchIndex],
      referenceId:
        mismatchIndex === -1
          ? undefined
          : expectedModuleIds[mismatchIndex],
      underlyingCode: "runtime-module-order",
    });
  }
}

function addAreaCopyErrors(
  areas: readonly A1CourseArea[],
  areaCopy: A1AreaCopyByLocale,
  push: (error: A1ValidationError) => void,
): void {
  // Copy must exist for every area the release *ships*, but a copy entry for a
  // canonical A1 area Base now owns (`sounds`, `foundations`) is not a typo —
  // it stays authored for the unchanged area contract. Only an id outside the
  // canonical partition entirely is an unknown-copy defect.
  const knownAreaIds = new Set<string>([
    ...areas.map((area) => area.id),
    ...A1_AREA_IDS,
  ]);
  for (const area of areas) {
    for (const locale of ["en", "it"] as const) {
      const entry = areaCopy[locale][area.id];
      for (const [field, copyId] of [
        ["title", area.titleCopyId],
        ["description", area.descriptionCopyId],
      ] as const) {
        const text = entry?.[field];
        if (typeof text !== "string" || text.trim().length === 0) {
          push({
            code: "area-copy-parity",
            id: area.id,
            referenceId: copyId,
            dimension: `${locale}:${field}`,
            underlyingCode: `missing-${locale}-area-${field}`,
          });
        }
      }
    }
  }

  for (const locale of ["en", "it"] as const) {
    for (const areaId of Object.keys(areaCopy[locale])) {
      if (!knownAreaIds.has(areaId)) {
        push({
          code: "area-copy-parity",
          id: areaId,
          dimension: locale,
          underlyingCode: `unknown-${locale}-area-copy`,
        });
      }
    }
  }
}

// ---------------------------------------------------------------------------
// The release validator
// ---------------------------------------------------------------------------

export function validateA1(input: ValidateA1Input = {}): ValidateA1Result {
  const full = input.fullCatalogs ?? a1FoundationCatalogs;
  const semantic = input.semanticCatalogs ?? a1SemanticFoundationCatalogs;
  const copy = input.foundationCopy ?? a1FoundationCopy;
  // Base owns the phonetic module; A1 authors no phonetic lessons or items.
  const phoneticItemsByLesson = input.phoneticItemsByLesson ?? {};
  const phoneticLessons = input.phoneticLessons ?? [];
  const releaseRecords = input.releaseVerbUseRecords ?? a1ReleaseVerbUseRecords;
  const manifestSpec = input.manifestSpec ?? A1_MANIFEST_SPEC;
  const checkpoint = input.checkpoint ?? a1Checkpoint;
  const authoredCanDos = input.authoredCanDos ?? a1CanDosAuthored;
  const areas = input.areas ?? A1_RETAINED_AREAS;
  const runtimeModules = input.runtimeModules ?? courseModulesByLevel.a1;
  const areaCopy: A1AreaCopyByLocale = input.areaCopy ?? {
    en: enCourseCopy.courseAreas,
    it: itCourseCopy.courseAreas,
  };
  const curriculumOverrides = input.curriculumInput ?? {};
  const curriculumReport = validateA1Curriculum({
    ...curriculumOverrides,
    foundationCatalogs:
      curriculumOverrides.foundationCatalogs ?? input.semanticCatalogs ?? full,
    foundationCopy: curriculumOverrides.foundationCopy ?? copy,
  });

  const errors: A1ValidationError[] = [];
  const push = (error: A1ValidationError): void => {
    errors.push(error);
  };

  // The learner-contract validator deliberately uses the exact canonical A1
  // release error vocabulary. Preserve every attribution rather than wrapping
  // it in a generic release error, so prebuild output names the lesson and
  // underlying curriculum invariant directly.
  for (const error of curriculumReport.errors) {
    push(error);
  }

  // --- Realization infrastructure over the semantic catalog ----------------
  const familyById = new Map<string, SentenceFamily>(
    semantic.sentenceFamilies.map((family) => [family.id, family]),
  );
  const variantById = new Map<string, SentenceVariant>(
    semantic.sentenceVariants.map((variant) => [variant.id, variant]),
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

  // --- Canonical-order cumulative availability (Phase 2 Task 4) -------------
  // For each lesson, compute the introduced content (values, senses, concepts,
  // forms) drawn from *its own models plus every model of every lesson at an
  // earlier canonical position*. A transfer may recombine anything modelled at
  // or before its lesson; nothing modelled only later can leak backwards. This
  // map is handed to the foundation oracle, whose per-lesson transfer gate uses
  // it in place of the strict same-lesson closure.
  const positionByLessonId = new Map(
    semantic.lessonPositions.map((record) => [record.lessonId, record.position]),
  );
  interface ModelContent {
    readonly values: Set<string>;
    readonly senses: Set<string>;
    readonly concepts: Set<string>;
    readonly forms: Set<string>;
  }
  const perLessonModelContent = new Map<string, ModelContent>();
  for (const lesson of semantic.lessons) {
    const content: ModelContent = { values: new Set(), senses: new Set(), concepts: new Set(), forms: new Set() };
    for (const variantId of lesson.modelVariantIds) {
      const variant = variantById.get(variantId);
      if (!variant) continue;
      for (const value of Object.values(variant.slotValues)) content.values.add(value);
      content.forms.add(foundationFormKey(variant.form));
      const realized = realize(variant);
      if (realized) {
        for (const sense of realized.usedLexemeSenseIds) content.senses.add(sense);
        for (const concept of realized.usedConceptIds) content.concepts.add(concept);
      }
    }
    perLessonModelContent.set(lesson.id, content);
  }
  const orderedLessonIds = [...semantic.lessons]
    .map((lesson) => lesson.id)
    .sort((left, right) => (positionByLessonId.get(left) ?? 0) - (positionByLessonId.get(right) ?? 0));
  const availableContentByLesson: Record<
    string,
    { conceptIds: string[]; senseIds: string[]; semanticValueIds: string[]; forms: string[] }
  > = {};
  // Task 16 containment: Base models the four rehomed Foundations modules
  // before retained A1 opens, so the cumulative walk starts from that inherited
  // content rather than from nothing. The seed is intersected with the catalog
  // under validation, so it can only ever unlock ids this catalog genuinely
  // contains — never a reference the availability gate could not check.
  const cumulative: ModelContent = {
    values: new Set(
      A1_INHERITED_BASE_CONTENT.semanticValueIds.filter((id) =>
        semantic.semanticValues.some((value) => value.id === id),
      ),
    ),
    senses: new Set(
      A1_INHERITED_BASE_CONTENT.senseIds.filter((id) =>
        semantic.learningTargetSenses.some((sense) => sense.id === id),
      ),
    ),
    concepts: new Set(
      A1_INHERITED_BASE_CONTENT.conceptIds.filter((id) =>
        semantic.sentenceFamilies.some((family) => family.requiredConceptIds.includes(id)),
      ),
    ),
    forms: new Set(A1_INHERITED_BASE_CONTENT.forms),
  };
  for (const lessonId of orderedLessonIds) {
    const content = perLessonModelContent.get(lessonId);
    if (content) {
      for (const value of content.values) cumulative.values.add(value);
      for (const sense of content.senses) cumulative.senses.add(sense);
      for (const concept of content.concepts) cumulative.concepts.add(concept);
      for (const form of content.forms) cumulative.forms.add(form);
    }
    availableContentByLesson[lessonId] = {
      conceptIds: [...cumulative.concepts],
      senseIds: [...cumulative.senses],
      semanticValueIds: [...cumulative.values],
      forms: [...cumulative.forms],
    };
  }

  // --- Wrap the Phase-1 oracle (gating; the cumulative availability map lets
  // transfers recombine anything modelled at or before their lesson) ---------
  const foundationReport = validateFoundations({
    catalogs: semantic,
    foundationCopy: copy,
    catalogVersion: A1_RELEASE_CATALOG_VERSION,
    seed: A1_RELEASE_SEED,
    availableContentByLesson,
  });

  // --- 1. Structural shape: 16 modules × 4 lessons = 64 routes -------------
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
  if (semantic.lessons.length !== A1_EXPECTED_SEMANTIC_LESSON_COUNT) {
    push({
      code: "manifest-mismatch",
      dimension: "semantic-lesson-count",
      expected: A1_EXPECTED_SEMANTIC_LESSON_COUNT,
      actual: semantic.lessons.length,
    });
  }
  // A1 authors no phonetic lessons of its own any more (Base owns `sounds`),
  // so the *release* path must supply none. The phonetic rule engine below is
  // kept fully intact for callers that hand it a phonetic roster explicitly:
  // for those, the two rosters must still agree lesson-for-lesson.
  const suppliedPhoneticInput =
    input.phoneticLessons !== undefined || input.phoneticItemsByLesson !== undefined;
  const phoneticItemLessonIds = Object.keys(phoneticItemsByLesson);
  const expectedPhoneticLessonCount = suppliedPhoneticInput
    ? Math.max(phoneticLessons.length, phoneticItemLessonIds.length)
    : A1_EXPECTED_PHONETIC_LESSON_COUNT;
  if (phoneticLessons.length !== expectedPhoneticLessonCount) {
    push({
      code: "phonetic-lesson-mismatch",
      dimension: "lesson-count",
      expected: expectedPhoneticLessonCount,
      actual: phoneticLessons.length,
    });
  }
  if (phoneticItemLessonIds.length !== expectedPhoneticLessonCount) {
    push({
      code: "phonetic-lesson-mismatch",
      dimension: "item-lesson-count",
      expected: expectedPhoneticLessonCount,
      actual: phoneticItemLessonIds.length,
    });
  }
  const semanticCapstoneCount = semantic.lessons.filter((lesson) =>
    A1_CAPSTONE_LESSON_IDS.includes(lesson.id),
  ).length;
  if (semanticCapstoneCount !== A1_EXPECTED_CAPSTONE_LESSON_COUNT) {
    push({
      code: "capstone-structure",
      dimension: "semantic-count",
      expected: A1_EXPECTED_CAPSTONE_LESSON_COUNT,
      actual: semanticCapstoneCount,
    });
  }

  // --- 2. Unknown / duplicate lesson ids + manifest agreement --------------
  const manifestLessonSet = new Set(A1_RETAINED_LESSON_IDS);
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
  // Every retained manifest lesson must appear exactly once as a route.
  for (const lessonId of A1_RETAINED_LESSON_IDS) {
    if (!seenPositionLessons.has(lessonId)) {
      push({ code: "manifest-mismatch", id: lessonId, dimension: "missing-route" });
    }
  }
  // Module → lesson membership must equal the manifest, in order.
  const manifestModuleSet = new Set<string>(A1_RETAINED_MODULE_IDS);
  for (const module of full.modules) {
    if (!manifestModuleSet.has(module.id)) {
      push({ code: "manifest-mismatch", id: module.id, dimension: "unknown-module" });
      continue;
    }
    const expectedLessons = A1_RETAINED_LESSON_IDS_BY_MODULE[module.id] ?? [];
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

  // --- 3. Area partition, runtime membership, and localized area copy -------
  if (areas.length !== A1_EXPECTED_AREA_COUNT) {
    push({
      code: "area-count",
      expected: A1_EXPECTED_AREA_COUNT,
      actual: areas.length,
      underlyingCode: "release-area-count",
    });
  }
  const areaResult = validateA1RetainedAreas(areas);
  if (!areaResult.ok) {
    addAreaValidationErrors(areaResult.errors, push);
  } else {
    addRuntimeAreaErrors(areas, runtimeModules, push);
    addAreaCopyErrors(areas, areaCopy, push);
  }

  // --- 4. Capstone module structure: final, four synthesis lessons ---------
  const lastModule = full.modules[full.modules.length - 1];
  if (!lastModule || lastModule.id !== manifestSpec.capstoneModuleId) {
    push({ code: "capstone-structure", dimension: "not-final", id: lastModule?.id });
  }
  if (A1_CAPSTONE_LESSON_IDS.length !== A1_EXPECTED_LESSONS_PER_MODULE) {
    push({ code: "capstone-structure", dimension: "count", actual: A1_CAPSTONE_LESSON_IDS.length });
  }

  const semanticValueIds = new Set(semantic.semanticValues.map((value) => value.id));
  const contextIds = new Set(semantic.contexts.map((context) => context.id));
  const roleIds = new Set(semantic.personRoles.map((role) => role.id));

  // --- 5. Unknown content (values, contexts, roles must exist) -------------
  // Level-scope introduce-before-use is no longer computed from an order-
  // *insensitive* global model-value set. Ordering is enforced by the
  // canonical-order cumulative availability map handed to the foundation
  // oracle above, whose per-lesson transfer gate rejects any value/sense/
  // concept/form used before it is modelled. Here we only reject content that
  // is entirely unknown to the catalog.
  for (const variant of semantic.sentenceVariants) {
    for (const [slotId, value] of Object.entries(variant.slotValues)) {
      if (!semanticValueIds.has(value)) {
        push({ code: "unknown-content", id: variant.id, dimension: `value:${slotId}`, referenceId: value });
      }
    }
    if (!contextIds.has(variant.contextId)) {
      push({ code: "unknown-content", id: variant.id, dimension: "context", referenceId: variant.contextId });
    }
    if (!roleIds.has(variant.discourse.speakerRoleId)) {
      push({ code: "unknown-content", id: variant.id, dimension: "speaker", referenceId: variant.discourse.speakerRoleId });
    }
  }

  // --- 6. Capstone no-new-content (strict prior taught-content sets) --------
  // Base models the four rehomed Foundations modules before retained A1 opens,
  // so their content is genuine prior content for the capstones (for example
  // `a1-value-time-7`, modelled by Base's `time-movement-2`). The seed is
  // derived from those lessons' own model variants — never hand-listed.
  const prior = {
    value: new Set<string>(A1_INHERITED_BASE_CONTENT.semanticValueIds),
    sense: new Set<string>(A1_INHERITED_BASE_CONTENT.senseIds),
    concept: new Set<string>(A1_INHERITED_BASE_CONTENT.conceptIds),
    form: new Set<string>(A1_INHERITED_BASE_CONTENT.forms),
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

  // --- 6b. Capstone required-scenario coverage (Phase 2 Task 4 spec fix) ---
  // No-new-content alone cannot tell a whole-level synthesis apart from a
  // wrong-but-plausible remix of Modules 9-11 (the B1/B2 findings). Each
  // capstone must additionally exercise its required family/referent/
  // interrogative combination. Coverage is asserted on stable semantic
  // metadata — family ids, referents, slot values, interrogative mood,
  // discourse roles — never on localized prose, so it cannot be satisfied by
  // superficially plausible but wrong content.
  const COP_FAMILY = "a1-family-topic-copular";
  const OBJ_FAMILY = "a1-family-object-action";
  const NOM_FAMILY = "a1-family-nominative-action";
  const LOCF_FAMILY = "a1-family-location-action";
  const DIR_FAMILY = "a1-family-direction-action";
  const TRANS_FAMILY = "a1-family-transport-action";
  const ROUTE_FAMILY = "a1-family-route-action";
  const SCHED_FAMILY = "a1-family-schedule-action";
  const ADV_FAMILY = "a1-family-adverbial-time-action";
  const PREF_FAMILY = "a1-family-preference";
  const QUANT_FAMILY = "a1-family-quantified-action";
  const REQ_FAMILY = "a1-family-request";
  const DESC_FAMILY = "a1-family-description";
  const SELF_REFERENT = "a1-referent-self";
  const THING_REFERENT = "a1-referent-thing";
  const LEARNER_ROLE = "a1-role-learner";
  const NAMED_PERSON_REFERENTS = new Set(["a1-referent-yuki", "a1-referent-ken", "a1-referent-mina"]);
  const referentById = new Map(semantic.referents.map((referent) => [referent.id, referent]));

  const capstoneVariantsByLesson = new Map<string, SentenceVariant[]>(
    A1_CAPSTONE_LESSON_IDS.map((id) => [id, []]),
  );
  for (const variant of capstoneVariants) {
    const owner = A1_CAPSTONE_LESSON_IDS.find((id) => variant.id.startsWith(`${id}-`));
    if (owner) capstoneVariantsByLesson.get(owner)!.push(variant);
  }
  const familiesOf = (variants: readonly SentenceVariant[]): Set<string> =>
    new Set(variants.map((v) => v.sentenceFamilyId));
  const modelsOf = (variants: readonly SentenceVariant[]): SentenceVariant[] =>
    variants.filter((v) => /-m\d+$/.test(v.id));

  const scenarioCoverageChecks: Readonly<Record<string, (all: readonly SentenceVariant[]) => void>> = {
    "capstones-1": (all) => {
      const models = modelsOf(all);
      const modelFamilies = familiesOf(models);
      if (!modelFamilies.has(COP_FAMILY)) {
        push({ code: "capstone-scenario-incomplete", id: "capstones-1", dimension: "identity" });
      }
      if (!modelFamilies.has(OBJ_FAMILY) && !modelFamilies.has(NOM_FAMILY)) {
        push({ code: "capstone-scenario-incomplete", id: "capstones-1", dimension: "self-predicate" });
      }
      const selfModels = models.filter((v) => v.discourse.subjectReferentId === SELF_REFERENT);
      if (selfModels.length < 4) {
        push({ code: "capstone-scenario-incomplete", id: "capstones-1", dimension: "self-referent-count", actual: selfModels.length, expected: 4 });
      }
      const reciprocal = all.filter(
        (v) =>
          v.form.interrogative === true &&
          v.discourse.subjectReferentId === SELF_REFERENT &&
          v.discourse.addresseeRoleId === LEARNER_ROLE &&
          v.discourse.speakerRoleId !== LEARNER_ROLE,
      );
      if (reciprocal.length < 1) {
        push({ code: "capstone-scenario-incomplete", id: "capstones-1", dimension: "reciprocal-question" });
      }
      // A genuine reciprocal exchange gates *both* directions: someone else
      // asks the learner about the learner (above), and the learner asks
      // back about the other party. "About the other party" is asserted
      // structurally — the subject referent's own person-role must equal
      // the addressee's role — never by hardcoding a specific referent id,
      // so any true "and you?" follow-up satisfies it (quality-review M1).
      const reciprocalBack = all.filter(
        (v) =>
          v.form.interrogative === true &&
          v.discourse.speakerRoleId === LEARNER_ROLE &&
          v.discourse.addresseeRoleId !== LEARNER_ROLE &&
          referentById.get(v.discourse.subjectReferentId ?? "")?.personRoleId === v.discourse.addresseeRoleId,
      );
      if (reciprocalBack.length < 1) {
        push({ code: "capstone-scenario-incomplete", id: "capstones-1", dimension: "reciprocal-question-back" });
      }
    },
    "capstones-2": (all) => {
      const models = modelsOf(all);
      const families = familiesOf(all);
      if (!families.has(SCHED_FAMILY) && !families.has(ADV_FAMILY)) {
        push({ code: "capstone-scenario-incomplete", id: "capstones-2", dimension: "routine-time" });
      }
      if (!families.has(LOCF_FAMILY)) {
        push({ code: "capstone-scenario-incomplete", id: "capstones-2", dimension: "place" });
      }
      if (!families.has(PREF_FAMILY)) {
        push({ code: "capstone-scenario-incomplete", id: "capstones-2", dimension: "preference" });
      }
      if (!families.has(REQ_FAMILY) && !families.has(QUANT_FAMILY)) {
        push({ code: "capstone-scenario-incomplete", id: "capstones-2", dimension: "purchase-request" });
      }
      const namedPersonModels = models.filter((v) => NAMED_PERSON_REFERENTS.has(v.discourse.subjectReferentId ?? ""));
      if (namedPersonModels.length < 1) {
        push({ code: "capstone-scenario-incomplete", id: "capstones-2", dimension: "person" });
      }
    },
    "capstones-3": (all) => {
      const families = familiesOf(all);
      if (!families.has(LOCF_FAMILY) && !families.has(DIR_FAMILY)) {
        push({ code: "capstone-scenario-incomplete", id: "capstones-3", dimension: "movement" });
      }
      if (!families.has(TRANS_FAMILY)) {
        push({ code: "capstone-scenario-incomplete", id: "capstones-3", dimension: "transport" });
      }
      if (!families.has(ROUTE_FAMILY)) {
        push({ code: "capstone-scenario-incomplete", id: "capstones-3", dimension: "route" });
      }
      if (!families.has(PREF_FAMILY)) {
        push({ code: "capstone-scenario-incomplete", id: "capstones-3", dimension: "immediate-need" });
      }
      const routeQuestions = all.filter(
        (v) =>
          v.sentenceFamilyId === COP_FAMILY &&
          v.form.interrogative === true &&
          v.discourse.subjectReferentId === THING_REFERENT &&
          Object.values(v.slotValues).includes("a1-value-q-doko"),
      );
      if (routeQuestions.length < 1) {
        push({ code: "capstone-scenario-incomplete", id: "capstones-3", dimension: "route-question" });
      }
      const wantVariants = all.filter(
        (v) => v.sentenceFamilyId === PREF_FAMILY && Object.values(v.slotValues).includes("a1-value-want"),
      );
      if (wantVariants.length < 1) {
        push({ code: "capstone-scenario-incomplete", id: "capstones-3", dimension: "want-need" });
      }
    },
    "capstones-4": (all) => {
      const families = familiesOf(all);
      if (!families.has(COP_FAMILY)) {
        push({ code: "capstone-scenario-incomplete", id: "capstones-4", dimension: "identity" });
      }
      if (!families.has(OBJ_FAMILY)) {
        push({ code: "capstone-scenario-incomplete", id: "capstones-4", dimension: "action" });
      }
      if (!families.has(DESC_FAMILY)) {
        push({ code: "capstone-scenario-incomplete", id: "capstones-4", dimension: "description" });
      }
      const clarification = all.filter(
        (v) =>
          v.sentenceFamilyId === COP_FAMILY &&
          v.form.interrogative === true &&
          v.discourse.subjectReferentId === THING_REFERENT &&
          Object.values(v.slotValues).includes("a1-value-q-nan"),
      );
      if (clarification.length < 1) {
        push({ code: "capstone-scenario-incomplete", id: "capstones-4", dimension: "clarification-question" });
      }
    },
  };
  for (const lessonId of A1_CAPSTONE_LESSON_IDS) {
    scenarioCoverageChecks[lessonId]?.(capstoneVariantsByLesson.get(lessonId) ?? []);
  }

  // capstones-4 must change its subject-referent topic exactly once across
  // its eight models — a genuine topic change (a single transition in *what
  // is being talked about*), never a vacuous "some Japanese changed" proxy.
  // The check order is the lesson's own authored `modelVariantIds` (quality-
  // review M3) rather than a hardcoded `capstones-4-m1..m8` id scheme: the
  // authored order is the only source of truth for "what order the learner
  // actually encounters these models in," and a hardcoded id array would
  // silently diverge from it (or from a renamed/reordered id scheme) without
  // ever being caught.
  {
    const topicChangeLesson = semantic.lessons.find((lesson) => lesson.id === "capstones-4");
    const ids = topicChangeLesson?.modelVariantIds ?? [];
    const referents = ids.map((id) => variantById.get(id)?.discourse.subjectReferentId ?? null);
    if (referents.some((r) => r === null)) {
      push({ code: "capstone-topic-change-count", id: "capstones-4", dimension: "missing-subject-referent" });
    } else {
      let transitions = 0;
      for (let i = 1; i < referents.length; i += 1) {
        if (referents[i] !== referents[i - 1]) transitions += 1;
      }
      if (transitions !== 1) {
        push({ code: "capstone-topic-change-count", id: "capstones-4", actual: transitions, expected: 1 });
      }
    }
  }

  // --- 7. Foundation gate: every foundation error blocks release -----------
  // The wrapped oracle is authoritative. Recurrence findings are translated to
  // the release-scoped `recurrence-incomplete` code (below); every *other*
  // foundation error is surfaced verbatim as a blocking `foundation-invalid`
  // so a release can never report valid while the foundation report is invalid.
  for (const error of foundationReport.errors) {
    const isRecurrence = error.code.startsWith("productive-verb") || error.code.startsWith("receptive-");
    if (isRecurrence) {
      push({
        code: "recurrence-incomplete",
        id: error.id ?? error.lessonId,
        underlyingCode: error.code,
      });
    } else {
      push({
        code: "foundation-invalid",
        id: error.id ?? error.lessonId,
        referenceId: error.referenceId,
        dimension: error.dimension,
        underlyingCode: error.code,
      });
    }
  }
  for (const record of releaseRecords) {
    if (record.laterUses.length < 2) {
      push({ code: "recurrence-incomplete", id: record.id, referenceId: record.senseId, actual: record.laterUses.length });
    }
  }

  // --- 8. Can-do / checkpoint alignment ------------------------------------
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
  // `a1-can-do-sounds` moved to Base with the phonetic module; Base's own
  // checkpoint samples it. A1 must NOT claim it — that would report evidence
  // for an outcome this level no longer teaches.
  if (sampledCanDos.has("a1-can-do-sounds")) {
    push({ code: "cando-not-sampled", id: "a1-can-do-sounds", referenceId: "sounds", dimension: "rehomed-to-base" });
  }
  // Transfer evidence: every non-phonetic Can-do needs a transfer variant,
  // from one of the four capstone scenario lessons, whose family lists it.
  // Evidence is scoped to the capstones (not every module's own internal
  // transfers) because that is where the checkpoint actually draws its
  // evidence from — see `checkpoint.ts`'s "never inferred from lesson
  // visits" contract. A module's own transfers no longer count.
  const capstoneTransferVariantIds = new Set<string>();
  for (const lesson of full.lessons) {
    if (!A1_CAPSTONE_LESSON_IDS.includes(lesson.id)) continue;
    for (const id of lesson.practice.roundTwo.candidateVariantIds) capstoneTransferVariantIds.add(id);
  }
  const canDoTransferEvidence = new Set<string>();
  for (const variant of semantic.sentenceVariants) {
    if (variant.pedagogicalUse !== "transfer") continue;
    if (!capstoneTransferVariantIds.has(variant.id)) continue;
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

  // --- 9. Copy parity, no Japanese, personal aliases, no certification -----
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

  // --- 10. Phonetic contracts (the four sounds lessons) --------------------
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
    // The lesson's own ids, used to check `contrastWithId` the same way the
    // lesson UI does: `PhoneticSection`'s comparison case only ever looks up
    // a partner within this lesson's own item array (`contrastPartnerMap`
    // in A1LessonPage.tsx never sees any other lesson's items), so a
    // contrast that only resolves *globally* would render as an unresolved
    // partner in the UI even though the id exists somewhere in the catalog.
    const lessonItemIds = new Set(items.map((item) => item.id));
    for (const item of items) {
      if (!item.glyph || !item.kana || !item.roman || !item.exerciseRefId || !item.contrastWithId) {
        push({ code: "phonetic-item-incomplete", id: item.id, referenceId: lessonRecipe.id });
      }
      if (!lessonItemIds.has(item.contrastWithId)) {
        if (allPhoneticIds.has(item.contrastWithId)) {
          push({
            code: "phonetic-contrast-cross-lesson",
            id: item.id,
            referenceId: item.contrastWithId,
          });
        } else {
          push({ code: "phonetic-dangling-contrast", id: item.id, referenceId: item.contrastWithId });
        }
      }
      if ((allExerciseRefs.get(item.exerciseRefId) ?? 0) > 1) {
        push({ code: "phonetic-duplicate-exercise", id: item.id, referenceId: item.exerciseRefId });
      }
    }
    const itemIds = items.map((item) => item.id).join(",");
    const refIds = items.slice(0, 4).map((item) => item.exerciseRefId).join(",");
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
    valid: sorted.length === 0 && foundationReport.valid,
    errors: sorted,
    foundationReport,
    curriculumReport,
  };
}

function cmp(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

/** The default release view — validated over the frozen release catalogs. */
export function validateA1Release(input: ValidateA1Input = {}): ValidateA1Result {
  return validateA1(input);
}

/** Re-export for reports / tests that key off the same lesson-position order. */
export const a1ReleaseLessonPositions = a1AllLessonPositions;
