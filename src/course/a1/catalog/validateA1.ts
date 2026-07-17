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
  A1ReleaseErrorCode,
  A1ReleaseValidationError,
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

// The release error vocabulary is declared once, in `../types`
// (`A1_RELEASE_ERROR_CODES` / `A1ReleaseErrorCode` / `A1ReleaseValidationError`),
// so it can back both the manifest-spec/slice/authoring gates and this release
// gate from a single source of truth. These names are re-exported unchanged
// for backward compatibility with existing importers of `./validateA1`.
export type A1ValidationErrorCode = A1ReleaseErrorCode;
export type A1ValidationError = A1ReleaseValidationError;

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
  const cumulative: ModelContent = { values: new Set(), senses: new Set(), concepts: new Set(), forms: new Set() };
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

  const semanticValueIds = new Set(semantic.semanticValues.map((value) => value.id));
  const contextIds = new Set(semantic.contexts.map((context) => context.id));
  const roleIds = new Set(semantic.personRoles.map((role) => role.id));

  // --- 4. Unknown content (values, contexts, roles must exist) -------------
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

  // --- 5b. Capstone required-scenario coverage (Phase 2 Task 4 spec fix) ---
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
  {
    const ids = Array.from({ length: 8 }, (_, i) => `capstones-4-m${i + 1}`);
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

  // --- 6. Foundation gate: every foundation error blocks release -----------
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
    valid: sorted.length === 0 && foundationReport.valid,
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
