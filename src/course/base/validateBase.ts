import type { Locale } from "../../i18n/LocaleContext";
import type { AssembledToken } from "../../romaji/types";
import { baseCourseModules } from "../data/course";
import { assertBaseCourseShape } from "../data/runtimeShapeAssertion";
import { LEGACY_LESSON_ALIASES } from "../routing/lessonRouteResolution";
import { A1_RETAINED_LESSON_IDS, A1_RETAINED_MODULE_IDS } from "../a1/manifest";
import { A2_LESSON_IDS } from "../a2/manifest";
import {
  BASE_LESSON_IDS,
  BASE_LESSON_IDS_BY_MODULE,
  BASE_MODULE_IDS,
  baseLessonManifestEntry,
} from "./manifest";
import { baseLessonContents } from "./content/catalog";
import { BASE_SOUND_VALIDATION_CATALOGS } from "./content/module01Sounds";
import { BASE_SENTENCE_FOUNDATIONS_VALIDATION_CATALOGS } from "./content/module02SentenceFoundations";
import { BASE_TOPIC_QUESTIONS_VALIDATION_CATALOGS } from "./content/module03TopicQuestions";
import { BASE_POLITE_VERBS_VALIDATION_CATALOGS } from "./content/module04PoliteVerbs";
import { BASE_ARGUMENT_PARTICLES_VALIDATION_CATALOGS } from "./content/module05ArgumentParticles";
import { BASE_TIME_MOVEMENT_VALIDATION_CATALOGS } from "./content/module06TimeMovement";
import { BASE_COPULA_ADJECTIVES_VALIDATION_CATALOGS } from "./content/module07CopulaAdjectives";
import { BASE_EXISTENCE_LOCATION_VALIDATION_CATALOGS } from "./content/module08ExistenceLocation";
import { BASE_REQUESTS_CONNECTION_VALIDATION_CATALOGS } from "./content/module09RequestsConnection";
import { BASE_SYNTHESIS_VALIDATION_CATALOGS } from "./content/module10Synthesis";
import {
  BASE_LEXEME_RECURRENCE_VALIDATION,
  BASE_CANONICAL_CATALOG_VALIDATION,
} from "./catalog/catalog";
import { BASE_LEXICON } from "./catalog/lexicon";
import { BASE_CONCEPTS, BASE_RETRIEVAL_SYSTEMS } from "./catalog/concepts";
import { BASE_FIRST_TEACH_OWNERS } from "./catalog/firstTeach";
import {
  activityOptionTargetReferencesFor,
  activityPromptTargetReferenceFor,
  activityTargetReferenceFor,
  audioTargetReferenceFor,
} from "./catalog/visibleTargets";
import type {
  BaseLessonContent,
  BaseValidationCatalogs,
  BaseVisibleTarget,
} from "./catalog/types";
import { validateBaseLessonDepth } from "./validation/lessonRules";
import {
  validateBaseLessonPrerequisiteGraph,
  validateFirstTeachOrder,
} from "./validation/sequenceRules";
import { validateParticleFrame } from "./forms/particleLicensing";
import {
  realizeIAdjectivePredicate,
  realizeNaAdjectivePredicate,
} from "./forms/adjectiveForms";
import { realizePoliteGrid } from "./forms/verbForms";
import {
  BASE_REFERENCE_CATALOG,
  BASE_REFERENCE_IDS,
  inspectBaseReferenceCatalog,
} from "./references/catalog";
import { BASE_AUDIO_CATALOG } from "./audio/catalog";
import {
  BASE_AUDIO_REVIEW_INVENTORY,
  BASE_AUDIO_REVIEW_VALIDATION,
} from "./audio/reviewLedger";
import {
  BASE_NATURALNESS_REVIEW_INVENTORY,
  BASE_NATURALNESS_REVIEW_VALIDATION,
} from "./review/naturalnessLedger";
import { V4_ACTIVITY_INVENTORY } from "./migration/v4ActivityInventory";
import { V4_ACTIVITY_MIGRATION_MAP } from "./migration/v4ActivityMap";
import { V4_CANDO_MIGRATION_MAP } from "./migration/v4CanDoMap";
import {
  V4_OWNERSHIP_MIGRATION_MAP,
  V4_REHOMED_LESSON_IDS,
} from "./migration/v4OwnershipMap";
import { buildBaseLessonViewModel } from "./view/buildBaseLessonViewModel";
import { buildBasePracticeModel } from "./view/buildBasePracticeModel";
import {
  buildBaseReleaseReport,
  visibleSurfaceKey,
  type BaseReleaseInput,
  type BaseReleaseLessonRecord,
  type BaseReleaseLessonView,
  type BaseReleaseReport,
  type BaseReleaseRenderProbe,
  type BaseReleaseVisibleTarget,
} from "./reports";

export type {
  BaseReleaseInput,
  BaseReleaseReport,
  BaseReleaseVisibleTarget,
} from "./reports";

/**
 * Task 17 — the complete Base release gate.
 *
 * `validateBaseRelease()` is deliberately **additive**: it walks every check
 * and collects every structured finding, so one broken invariant can never
 * mask the next. It validates the shipped production catalogs *and* the
 * realized learner views (the surfaces, both locale view models, and the
 * pre-attempt practice metadata a learner's browser actually receives).
 *
 * ## Honest handling of external editorial review
 *
 * Two review ledgers back this release: the naturalness ledger
 * (`review/naturalnessLedger.ts`) and the canonical audio human-ear sign-off
 * (`audio/reviewLedger.ts`). Both are genuinely still `pending`, because the
 * external review is happening in parallel with this work. This gate models
 * that situation explicitly, with two *different* concepts:
 *
 *  - **Stale review** — the shipped content no longer matches what the ledger
 *    inventoried (a changed Japanese surface, a changed audio asset hash, or
 *    a drifted corpus fingerprint). That is a hard error
 *    (`naturalness-review-stale` / `audio-review-stale`): the release is
 *    shipping content nobody has looked at under that identity.
 *  - **Pending external acceptance** — the reviewer simply has not signed off
 *    yet. That is *not* an error and *not* a pass: it is counted and
 *    reported as `report.unresolvedFindings`, and the script prints it. This
 *    gate never writes an acceptance, never infers one, and never turns
 *    `pending` into `accepted`; equally, it is never permanently red merely
 *    because acceptance has not arrived. See `scripts/validateBaseRelease.ts`
 *    for the deliberate exit behaviour that follows from this distinction.
 */

export type BaseReleaseErrorCode =
  // structure / identity
  | "base-module-count"
  | "base-lesson-count"
  | "base-runtime-shape"
  | "lessons-per-module"
  | "duplicate-owner"
  | "duplicate-route"
  | "duplicate-alias"
  | "alias-target-unknown"
  | "a1-identity-changed"
  | "a2-identity-changed"
  | "level-route-collision"
  // contracts and ranges
  | "lesson-contract-mismatch"
  | "contract-lexeme-range"
  | "contract-example-range"
  | "contract-dialogue-range"
  | "contract-activity-range"
  | "explanation-block-count"
  // catalogs
  | "canonical-catalog-invalid"
  | "lexicon-ceiling"
  | "lexeme-recurrence"
  | "catalog-finding"
  | "reference-count"
  | "reference-catalog-invalid"
  | "reference-prerequisite-closure"
  // sequencing
  | "first-teach-missing-owner"
  | "first-teach-order"
  | "prerequisite-closure"
  // pattern systems
  | "pattern-cell-missing"
  | "system-component-missing"
  // hazards
  | "dynamic-nonpast-ongoing"
  | "i-adjective-copula-da"
  | "forbidden-explanatory-no"
  | "bounded-te-before-owner"
  | "unlicensed-particle"
  | "form-engine-mismatch"
  // realized views
  | "duplicate-visible-fingerprint"
  | "locale-parity"
  | "script-parity"
  | "view-unrendered"
  | "pre-attempt-answer-leak"
  // review ledgers
  | "audio-review-stale"
  | "audio-review-missing"
  | "naturalness-review-stale"
  | "naturalness-review-missing"
  // migration
  | "migration-inventory-mismatch"
  | "migration-evidence-mismatch";

export interface BaseReleaseError {
  readonly code: BaseReleaseErrorCode;
  readonly lessonId?: string;
  readonly contentId?: string;
  readonly referenceId?: string;
  readonly detail?: string;
}

export interface BaseReleaseValidationResult {
  readonly valid: boolean;
  readonly errors: readonly BaseReleaseError[];
  readonly report: BaseReleaseReport;
}

/** The five progressive references Base publishes. */
const EXPECTED_REFERENCE_COUNT = 5;
/** The authored ceiling on meaningful Base lexemes. */
const LEXEME_CEILING = 250;
const EXPECTED_MODULES = 10;
const EXPECTED_LESSONS = 40;
const EXPECTED_LESSONS_PER_MODULE = 4;
const EXPECTED_A1_MODULES = 11;
const EXPECTED_A1_LESSONS = 44;
const EXPECTED_A2_LESSONS = 60;
const EXPECTED_EXPLANATION_BLOCKS = 5;

/** Form ids that must never reach a Base learner (the の / んです hazard). */
const FORBIDDEN_FORM_IDS: ReadonlySet<string> = new Set([
  "explanatory-no",
  "ndesu",
]);

/** The bounded-て inventory and the lesson that owns each construction. */
const BOUNDED_TE_OWNER_BY_FORM: Readonly<Record<string, string>> = {
  "base-form-te": "requests-connection-1",
  "base-construction-te-kudasai": "requests-connection-2",
  "base-construction-sequential-te": "requests-connection-3",
  "base-construction-te-imasu": "requests-connection-4",
};

/**
 * The learner-visible surfaces the release presents as *correct* Japanese.
 * Activity prompts and options may deliberately carry ill-formed distractors.
 */
const CANONICAL_SURFACE_KINDS: ReadonlySet<BaseReleaseVisibleTarget["kind"]> =
  new Set(["example", "dialogue-turn", "activity-answer"]);

/** The `ている` construction is the only licence for an ongoing-now gloss. */
const ONGOING_LICENSING_FORM_ID = "base-construction-te-imasu";

/** Per-contract authored ranges, inclusive. */
const CONTRACT_RANGES: Readonly<
  Record<
    string,
    Readonly<{
      newLexemes: readonly [number, number];
      examples: readonly [number, number];
      dialogueTurns: readonly [number, number];
      activities: readonly [number, number];
    }>
  >
> = {
  phonetic: {
    newLexemes: [0, 12],
    // A phonetic lesson's model surfaces are its audio exemplars.
    examples: [1, 24],
    dialogueTurns: [0, 0],
    activities: [1, 20],
  },
  content: {
    newLexemes: [0, 12],
    examples: [1, 20],
    dialogueTurns: [0, 20],
    activities: [1, 20],
  },
  system: {
    newLexemes: [0, 12],
    examples: [1, 24],
    dialogueTurns: [0, 20],
    activities: [1, 20],
  },
  synthesis: {
    newLexemes: [0, 12],
    examples: [1, 24],
    dialogueTurns: [0, 24],
    activities: [1, 24],
  },
};

const LOCALES: readonly Locale[] = ["en", "it"];

/**
 * Each content module publishes the *cumulative* validation catalogs visible
 * up to and including itself, and gates its own lessons against exactly those
 * at import time. The release gate re-runs the same per-lesson depth
 * validation against the same owning-module catalogs, so a lesson is never
 * judged against provenance it could not legitimately see.
 */
const CATALOGS_BY_MODULE: Readonly<Record<string, BaseValidationCatalogs>> = {
  sounds: BASE_SOUND_VALIDATION_CATALOGS,
  "sentence-foundations": BASE_SENTENCE_FOUNDATIONS_VALIDATION_CATALOGS,
  "topic-questions": BASE_TOPIC_QUESTIONS_VALIDATION_CATALOGS,
  "polite-verbs": BASE_POLITE_VERBS_VALIDATION_CATALOGS,
  "argument-particles": BASE_ARGUMENT_PARTICLES_VALIDATION_CATALOGS,
  "time-movement": BASE_TIME_MOVEMENT_VALIDATION_CATALOGS,
  "copula-adjectives": BASE_COPULA_ADJECTIVES_VALIDATION_CATALOGS,
  "existence-location": BASE_EXISTENCE_LOCATION_VALIDATION_CATALOGS,
  "requests-connection": BASE_REQUESTS_CONNECTION_VALIDATION_CATALOGS,
  "base-synthesis": BASE_SYNTHESIS_VALIDATION_CATALOGS,
};

function catalogsForLesson(lesson: BaseLessonContent): BaseValidationCatalogs {
  const moduleId = baseLessonManifestEntry(lesson.lessonId)?.moduleId ?? "";
  return CATALOGS_BY_MODULE[moduleId] ?? BASE_SYNTHESIS_VALIDATION_CATALOGS;
}

function japaneseOf(tokens: readonly AssembledToken[] | undefined): string {
  return (tokens ?? []).map(({ jp }) => jp).join("");
}

function romajiOf(tokens: readonly AssembledToken[] | undefined): string {
  return (tokens ?? [])
    .map(({ romaji }) => romaji)
    .filter((romaji) => romaji.length > 0)
    .join(" ");
}

function targetRecord(
  id: string,
  lessonId: string,
  ownerId: string,
  sourceId: string,
  kind: BaseReleaseVisibleTarget["kind"],
  target: BaseVisibleTarget,
): BaseReleaseVisibleTarget {
  return {
    id,
    lessonId,
    ownerId,
    sourceId,
    kind,
    japanese: japaneseOf(target.tokens),
    romaji: romajiOf(target.tokens),
    lexemeIds: [...target.lexemeIds],
    conceptIds: [...target.conceptIds],
    formIds: [...target.formIds],
    patternCellIds: [...target.patternCellIds],
    interpretationTags: [...target.interpretationTags],
    predicateAspect: target.predicateAspect ?? null,
    predicateSenseId: target.predicateSenseId ?? null,
    predicateLexemeId: target.predicateLexemeId ?? null,
    particleFrame: target.particleFrame
      ? {
          predicateSenseId: target.particleFrame.predicateSenseId,
          provided: { ...target.particleFrame.provided } as Readonly<
            Record<string, string>
          >,
        }
      : null,
  };
}

function visibleTargetsFor(
  lesson: BaseLessonContent,
  catalogs: BaseValidationCatalogs,
): readonly BaseReleaseVisibleTarget[] {
  const lessonId = lesson.lessonId;
  const records: BaseReleaseVisibleTarget[] = [];

  if (lesson.contract === "phonetic") {
    for (const audioTargetId of lesson.audioExemplarIds) {
      const reference = audioTargetReferenceFor(audioTargetId, catalogs);
      if (!reference) continue;
      records.push(
        targetRecord(
          `audio:${lessonId}:${audioTargetId}`,
          lessonId,
          audioTargetId,
          audioTargetId,
          "example",
          reference.target,
        ),
      );
    }
  } else {
    for (const exampleId of lesson.workedExampleIds) {
      const example = catalogs.examples.get(exampleId);
      if (!example) continue;
      records.push(
        targetRecord(
          `example:${exampleId}`,
          lessonId,
          exampleId,
          exampleId,
          "example",
          example,
        ),
      );
    }
    const dialogue = lesson.dialogueId
      ? catalogs.dialogues.get(lesson.dialogueId)
      : undefined;
    if (dialogue) {
      dialogue.turns.forEach((turn, index) => {
        records.push(
          targetRecord(
            `dialogue:${dialogue.id}:${index}`,
            lessonId,
            dialogue.id,
            `${dialogue.id}#${index}`,
            "dialogue-turn",
            turn,
          ),
        );
      });
    }
  }

  for (const activity of lesson.activities) {
    const answer = activityTargetReferenceFor(activity, catalogs);
    if (answer) {
      records.push(
        targetRecord(
          `activity-answer:${lessonId}:${activity.id}`,
          lessonId,
          activity.id,
          answer.referenceId,
          "activity-answer",
          answer.target,
        ),
      );
    }
    const prompt = activityPromptTargetReferenceFor(lessonId, activity, catalogs);
    if (prompt) {
      records.push(
        targetRecord(
          `activity-prompt:${lessonId}:${activity.id}`,
          lessonId,
          activity.id,
          `prompt:${lessonId}:${activity.id}`,
          "activity-prompt",
          prompt.target,
        ),
      );
    }
    activityOptionTargetReferencesFor(activity, catalogs).forEach(
      (option, index) => {
        records.push(
          targetRecord(
            `activity-option:${lessonId}:${activity.id}:${index}`,
            lessonId,
            activity.id,
            option.referenceId,
            "activity-option",
            option.target,
          ),
        );
      },
    );
  }

  return records;
}

function lessonRecord(lesson: BaseLessonContent): BaseReleaseLessonRecord {
  const manifest = baseLessonManifestEntry(lesson.lessonId);
  const semantic = lesson.contract !== "phonetic";
  return {
    lessonId: lesson.lessonId,
    moduleId: manifest?.moduleId ?? "",
    position: manifest?.position ?? 0,
    contract: lesson.contract,
    prerequisiteLessonIds: [...lesson.prerequisiteLessonIds],
    newLexemeIds: semantic ? [...lesson.newLexemeIds] : [],
    reviewLexemeIds: semantic ? [...lesson.reviewLexemeIds] : [],
    introducedConceptIds: semantic ? [...lesson.introducedConceptIds] : [],
    explanationBlockIds: semantic
      ? Object.values(lesson.explanationBlockIds)
      : [],
    patternCellIds: semantic ? [...lesson.patternCellIds] : [],
    workedExampleIds: semantic ? [...lesson.workedExampleIds] : [],
    dialogueId: semantic ? lesson.dialogueId : null,
    activityIds: lesson.activities.map(({ id }) => id),
    activityCategories: lesson.activities.map(({ category }) => category),
    referenceSnapshotIds: semantic ? [...lesson.referenceSnapshotIds] : [],
    retrievedSystemIds: semantic ? [...lesson.retrievedSystemIds] : [],
  };
}

function lessonViewsFor(lessonId: string): readonly BaseReleaseLessonView[] {
  const views: BaseReleaseLessonView[] = [];
  for (const locale of LOCALES) {
    const result = buildBaseLessonViewModel(lessonId, locale);
    if (!result.ok) continue;
    const model = result.model;
    views.push({
      lessonId,
      locale: locale as BaseReleaseLessonView["locale"],
      contract: model.contract,
      title: model.title,
      canDo: model.canDo,
      recap: model.recap,
      explanationBlocks:
        model.contract === "phonetic"
          ? [model.phoneticExplanation]
          : Object.values(model.explanation),
      vocabulary: model.vocabulary.map((item) => ({
        id: item.id,
        kana: item.kana,
        romaji: item.romaji,
        meaning: item.meaning,
        isReview: item.isReview,
      })),
      exampleTranslations: model.examples.map(({ translation }) => translation),
      dialogueTranslations:
        model.contract === "phonetic"
          ? []
          : (model.dialogue ?? []).map(({ translation }) => translation),
      referenceSnapshotTitles: model.referenceSnapshots.map(({ title }) => title),
    });
  }
  return views;
}

/**
 * The metadata one practice activity ships *before* the learner attempts it.
 *
 * These are model-level probes, not DOM snapshots: `buildBasePracticeModel()`
 * is exactly what the practice card renders from, so anything reachable here
 * pre-attempt is reachable in the learner's browser pre-attempt. The
 * `forbiddenAnswers` are the canonical answers that genuinely *are* secret
 * before an attempt (a tile-ordering canonical order, a reveal answer); a
 * choice/listening activity legitimately renders every option's Japanese, so
 * its secret is *which* option is correct, checked here as "no pre-attempt
 * attribute may name or mark the answer".
 */
function renderProbesFor(lessonId: string): readonly BaseReleaseRenderProbe[] {
  const result = buildBasePracticeModel(lessonId, "en");
  if (!result.ok) return [];
  return result.model.activities.map((activity): BaseReleaseRenderProbe => {
    const attributes: Record<string, string> = {
      "data-activity-id": activity.id,
      "data-activity-kind": activity.interactionKind,
      "data-activity-mode": activity.mode,
      "data-target-key": activity.fingerprint,
    };
    const preAttemptText: string[] = [activity.instruction];
    const forbiddenAnswers: string[] = [];

    switch (activity.interactionKind) {
      case "choice":
      case "listening": {
        activity.options.forEach((option, index) => {
          attributes[`data-option-${index}`] = option.id;
          preAttemptText.push(japaneseOf(option.tokens));
        });
        break;
      }
      case "tile-ordering": {
        const tokenById = new Map(
          activity.tiles.map((tile) => [tile.id, tile.token]),
        );
        activity.bankTileIds.forEach((tileId, index) => {
          attributes[`data-tile-${index}`] = tileId;
          preAttemptText.push(tokenById.get(tileId)?.jp ?? "");
        });
        forbiddenAnswers.push(
          activity.correctTileIds
            .map((tileId) => tokenById.get(tileId)?.jp ?? "")
            .join(""),
        );
        break;
      }
      case "reveal": {
        preAttemptText.push(japaneseOf(activity.promptTokens ?? []));
        forbiddenAnswers.push(japaneseOf(activity.answerTokens));
        break;
      }
      case "spoken": {
        preAttemptText.push(japaneseOf(activity.tokens));
        break;
      }
    }

    return {
      lessonId,
      activityId: activity.id,
      interactionKind: activity.interactionKind,
      preAttemptAttributes: attributes,
      preAttemptText: preAttemptText.filter((text) => text.length > 0),
      forbiddenAnswers: forbiddenAnswers.filter((text) => text.length > 0),
    };
  });
}

function runtimeShapeSnapshot(): BaseReleaseInput["runtimeShape"] {
  let error: string | null = null;
  try {
    assertBaseCourseShape(baseCourseModules);
  } catch (cause) {
    error = cause instanceof Error ? cause.message : String(cause);
  }
  return {
    modules: baseCourseModules.length,
    lessons: baseCourseModules.reduce(
      (sum, courseModule) => sum + courseModule.lessons.length,
      0,
    ),
    error,
  };
}

/** Assembles the full, plain-data snapshot of the shipped Base release. */
export function buildBaseReleaseInput(): BaseReleaseInput {
  const referenceInspection = inspectBaseReferenceCatalog();

  return {
    manifest: {
      moduleIds: [...BASE_MODULE_IDS],
      lessonIds: [...BASE_LESSON_IDS],
      lessonIdsByModule: Object.fromEntries(
        BASE_MODULE_IDS.map((moduleId) => [
          moduleId,
          [...(BASE_LESSON_IDS_BY_MODULE[moduleId] ?? [])],
        ]),
      ),
    },
    lessons: baseLessonContents.map(lessonRecord),
    lexemes: BASE_LEXICON.map((lexeme) => ({
      id: lexeme.id,
      category: lexeme.category,
      firstTeachLessonId: lexeme.firstTeachLessonId,
      countable: lexeme.countable,
    })),
    concepts: BASE_CONCEPTS.map((concept) => ({
      id: concept.id,
      kind: concept.kind,
      prerequisiteIds: [...concept.prerequisiteIds],
      firstTeachLessonId: concept.firstTeachLessonId,
    })),
    firstTeachOwners: BASE_FIRST_TEACH_OWNERS.map((owner) => ({
      kind: owner.kind,
      id: owner.contentId,
      lessonId: owner.lessonId,
    })),
    systems: BASE_RETRIEVAL_SYSTEMS.map((system) => ({
      id: system.id,
      firstTeachLessonId: system.firstTeachLessonId,
      componentContentIds: [...system.componentContentIds],
    })),
    references: {
      ids: [...BASE_REFERENCE_IDS],
      entries: BASE_REFERENCE_CATALOG.flatMap((reference) =>
        reference.entries.map((entry) => ({
          referenceId: reference.id,
          semanticId: entry.semanticId,
          firstTeachLessonId: entry.firstTeachLessonId,
          prerequisiteEntryIds: [...entry.prerequisiteEntryIds],
          cellIds: entry.canonicalFormCells.map(({ id }) => id),
        })),
      ),
    },
    visibleTargets: baseLessonContents.flatMap((lesson) =>
      visibleTargetsFor(lesson, catalogsForLesson(lesson)),
    ),
    lessonViews: BASE_LESSON_IDS.flatMap((lessonId) => lessonViewsFor(lessonId)),
    renderProbes: BASE_LESSON_IDS.flatMap((lessonId) => renderProbesFor(lessonId)),
    audio: {
      assets: BASE_AUDIO_CATALOG.map((record) => ({
        id: record.id,
        sha256: record.sha256,
        fingerprint: record.fingerprint,
        kana: record.kana,
      })),
      reviews: BASE_AUDIO_REVIEW_INVENTORY.map((entry) => ({
        contentId: entry.contentId,
        lessonId: entry.lessonId,
        sourceKind: entry.sourceKind,
        assetId: entry.sourceKind === "physical-asset" ? entry.assetId : null,
        assetSha256: entry.assetSha256,
        transcript: entry.transcript,
        fingerprint: entry.fingerprint,
        status: entry.status,
      })),
      ledgerValidation: {
        ok: BASE_AUDIO_REVIEW_VALIDATION.ok,
        errors: [...BASE_AUDIO_REVIEW_VALIDATION.errors],
      },
    },
    naturalness: {
      surfaces: BASE_NATURALNESS_REVIEW_INVENTORY.map((entry) => ({
        contentId: entry.contentId,
        lessonId: entry.lessonId,
        jp: entry.jp,
        en: entry.en,
        it: entry.it,
      })),
      reviews: BASE_NATURALNESS_REVIEW_INVENTORY.map((entry) => ({
        contentId: entry.contentId,
        lessonId: entry.lessonId,
        sourceKind: entry.sourceKind,
        jp: entry.jp,
        en: entry.en,
        it: entry.it,
        fingerprint: entry.fingerprint,
        status: entry.status,
      })),
      ledgerValidation: {
        ok: BASE_NATURALNESS_REVIEW_VALIDATION.ok,
        errors: [...BASE_NATURALNESS_REVIEW_VALIDATION.errors],
      },
    },
    migration: {
      rehomedLessonIds: [...V4_REHOMED_LESSON_IDS],
      ownership: V4_OWNERSHIP_MIGRATION_MAP.map((row) => ({
        sourceLessonId: row.sourceLessonId,
        destinationLessonId: row.destinationLessonId,
      })),
      canDos: V4_CANDO_MIGRATION_MAP.map((row) => ({
        sourceCanDoId: row.sourceCanDoId,
        destinationCanDoId: row.destinationCanDoId,
      })),
      activities: V4_ACTIVITY_MIGRATION_MAP.map((row) => ({
        sourceLessonId: row.sourceLessonId,
        sourceActivityId: row.sourceActivityId,
        destinationLessonId: row.destinationLessonId,
        disposition: row.disposition,
      })),
      inventory: V4_ACTIVITY_INVENTORY.map((row) => ({
        lessonId: row.lessonId,
        definitionId: row.definitionId,
        reviewKey: row.reviewKey,
        practiceFunction: row.practiceFunction,
      })),
    },
    identity: {
      a1ModuleIds: [...A1_RETAINED_MODULE_IDS],
      a1LessonIds: [...A1_RETAINED_LESSON_IDS],
      a2LessonIds: [...A2_LESSON_IDS],
      routes: BASE_MODULE_IDS.flatMap((moduleId) =>
        (BASE_LESSON_IDS_BY_MODULE[moduleId] ?? []).map((lessonId) => ({
          level: "a0",
          moduleId,
          lessonId,
          path: `/a0/${moduleId}/${lessonId}`,
        })),
      ),
      aliases: LEGACY_LESSON_ALIASES.map((alias) => ({
        legacyLessonId: alias.legacyLessonId,
        lessonId: alias.lessonId,
        moduleId: alias.moduleId,
      })),
    },
    catalogFindings: [
      ...baseLessonContents.flatMap((lesson) =>
        validateBaseLessonDepth(lesson, catalogsForLesson(lesson)).map((finding) => ({
          code: finding.code as string,
          stage: finding.stage as string,
          lessonId: finding.lessonId,
          referenceId: finding.referenceId,
        })),
      ),
      ...[
        ...validateFirstTeachOrder(
          baseLessonContents,
          BASE_FIRST_TEACH_OWNERS,
          BASE_SYNTHESIS_VALIDATION_CATALOGS,
        ),
        ...validateBaseLessonPrerequisiteGraph(baseLessonContents),
      ].map((finding) => ({
        code: finding.code as string,
        stage: finding.stage as string,
        lessonId: finding.lessonId,
        referenceId: finding.referenceId,
      })),
      ...(BASE_CANONICAL_CATALOG_VALIDATION.ok
        ? []
        : BASE_CANONICAL_CATALOG_VALIDATION.errors.map((code) => ({
            code: code as string,
            stage: "canonical-catalog",
            lessonId: "",
            referenceId: undefined as string | undefined,
          }))),
      ...referenceInspection.errors.map((error) => ({
        code: error.code as string,
        stage: "references",
        lessonId: "",
        referenceId: error.referenceId as string | undefined,
      })),
    ].map((finding) => ({
      code: finding.code,
      stage: finding.stage,
      lessonId: finding.lessonId,
      ...(finding.referenceId === undefined
        ? {}
        : { referenceId: finding.referenceId }),
    })),
    runtimeShape: runtimeShapeSnapshot(),
  };
}

interface Collector {
  readonly push: (error: BaseReleaseError) => void;
}

function checkStructure(input: BaseReleaseInput, out: Collector): void {
  if (input.manifest.moduleIds.length !== EXPECTED_MODULES) {
    out.push({
      code: "base-module-count",
      detail: String(input.manifest.moduleIds.length),
    });
  }
  if (input.lessons.length !== EXPECTED_LESSONS) {
    out.push({ code: "base-lesson-count", detail: String(input.lessons.length) });
  }
  for (const moduleId of input.manifest.moduleIds) {
    const lessonIds = input.manifest.lessonIdsByModule[moduleId] ?? [];
    if (lessonIds.length !== EXPECTED_LESSONS_PER_MODULE) {
      out.push({
        code: "lessons-per-module",
        referenceId: moduleId,
        detail: String(lessonIds.length),
      });
    }
  }

  const seenOwners = new Set<string>();
  for (const owner of input.firstTeachOwners) {
    const key = `${owner.kind}:${owner.id}`;
    if (seenOwners.has(key)) {
      out.push({ code: "duplicate-owner", contentId: key });
    }
    seenOwners.add(key);
  }

  const seenRoutes = new Set<string>();
  const seenLessons = new Set<string>();
  for (const route of input.identity.routes) {
    if (seenRoutes.has(route.path)) {
      out.push({ code: "duplicate-route", referenceId: route.path });
    }
    seenRoutes.add(route.path);
    if (seenLessons.has(route.lessonId)) {
      out.push({ code: "duplicate-route", referenceId: route.lessonId });
    }
    seenLessons.add(route.lessonId);
  }

  const publishedLessonIds = new Set(input.manifest.lessonIds);
  const seenAliases = new Set<string>();
  for (const alias of input.identity.aliases) {
    if (seenAliases.has(alias.legacyLessonId)) {
      out.push({ code: "duplicate-alias", referenceId: alias.legacyLessonId });
    }
    seenAliases.add(alias.legacyLessonId);
    if (publishedLessonIds.has(alias.legacyLessonId)) {
      out.push({ code: "duplicate-alias", referenceId: alias.legacyLessonId });
    }
  }

  const a1 = new Set(input.identity.a1LessonIds);
  const a2 = new Set(input.identity.a2LessonIds);
  for (const lessonId of input.manifest.lessonIds) {
    if (a1.has(lessonId)) {
      out.push({ code: "level-route-collision", lessonId, detail: "a1" });
    }
    if (a2.has(lessonId)) {
      out.push({ code: "level-route-collision", lessonId, detail: "a2" });
    }
  }
  if (
    input.identity.a1ModuleIds.length !== EXPECTED_A1_MODULES ||
    input.identity.a1LessonIds.length !== EXPECTED_A1_LESSONS
  ) {
    out.push({ code: "a1-identity-changed" });
  }
  if (input.identity.a2LessonIds.length !== EXPECTED_A2_LESSONS) {
    out.push({ code: "a2-identity-changed" });
  }

  if (
    input.runtimeShape.error !== null ||
    input.runtimeShape.modules !== EXPECTED_MODULES ||
    input.runtimeShape.lessons !== EXPECTED_LESSONS
  ) {
    out.push({
      code: "base-runtime-shape",
      detail: input.runtimeShape.error ?? "shape",
    });
  }
}

function checkContracts(
  input: BaseReleaseInput,
  targetsByLesson: ReadonlyMap<string, readonly BaseReleaseVisibleTarget[]>,
  out: Collector,
): void {
  for (const lesson of input.lessons) {
    const ranges = CONTRACT_RANGES[lesson.contract];
    if (!ranges) {
      out.push({
        code: "lesson-contract-mismatch",
        lessonId: lesson.lessonId,
        detail: lesson.contract,
      });
      continue;
    }
    const targets = targetsByLesson.get(lesson.lessonId) ?? [];
    const counts = {
      newLexemes: lesson.newLexemeIds.length,
      examples: targets.filter(({ kind }) => kind === "example").length,
      dialogueTurns: targets.filter(({ kind }) => kind === "dialogue-turn").length,
      activities: lesson.activityIds.length,
    } as const;
    const codes = {
      newLexemes: "contract-lexeme-range",
      examples: "contract-example-range",
      dialogueTurns: "contract-dialogue-range",
      activities: "contract-activity-range",
    } as const;
    for (const key of ["newLexemes", "examples", "dialogueTurns", "activities"] as const) {
      const [min, max] = ranges[key];
      if (counts[key] < min || counts[key] > max) {
        out.push({
          code: codes[key],
          lessonId: lesson.lessonId,
          detail: `${counts[key]} not in ${min}..${max}`,
        });
      }
    }
    if (
      lesson.contract !== "phonetic" &&
      lesson.explanationBlockIds.length !== EXPECTED_EXPLANATION_BLOCKS
    ) {
      out.push({
        code: "explanation-block-count",
        lessonId: lesson.lessonId,
        detail: String(lesson.explanationBlockIds.length),
      });
    }
  }
}

function checkCatalogs(input: BaseReleaseInput, out: Collector): void {
  if (input.lexemes.length > LEXEME_CEILING) {
    out.push({ code: "lexicon-ceiling", detail: String(input.lexemes.length) });
  }
  if (!BASE_LEXEME_RECURRENCE_VALIDATION.ok) {
    for (const error of BASE_LEXEME_RECURRENCE_VALIDATION.errors) {
      out.push({
        code: "lexeme-recurrence",
        contentId: error.lexemeId,
        lessonId: error.lessonId,
      });
    }
  }
  if (input.references.ids.length !== EXPECTED_REFERENCE_COUNT) {
    out.push({
      code: "reference-count",
      detail: String(input.references.ids.length),
    });
  }

  const positionByLesson = new Map(
    input.lessons.map((lesson) => [lesson.lessonId, lesson.position]),
  );
  const entryPosition = new Map(
    input.references.entries.map((entry) => [
      entry.semanticId,
      positionByLesson.get(entry.firstTeachLessonId) ?? Number.MAX_SAFE_INTEGER,
    ]),
  );
  for (const entry of input.references.entries) {
    const own = entryPosition.get(entry.semanticId) ?? Number.MAX_SAFE_INTEGER;
    for (const prerequisiteId of entry.prerequisiteEntryIds) {
      const required = entryPosition.get(prerequisiteId);
      if (required === undefined || required > own) {
        out.push({
          code: "reference-prerequisite-closure",
          referenceId: entry.referenceId,
          contentId: prerequisiteId,
        });
      }
    }
  }

  for (const finding of input.catalogFindings) {
    out.push({
      code: "catalog-finding",
      lessonId: finding.lessonId,
      referenceId: finding.referenceId,
      detail: `${finding.stage}:${finding.code}`,
    });
  }
}

function checkSequencing(
  input: BaseReleaseInput,
  targetsByLesson: ReadonlyMap<string, readonly BaseReleaseVisibleTarget[]>,
  out: Collector,
): void {
  const positionByLesson = new Map(
    input.lessons.map((lesson) => [lesson.lessonId, lesson.position]),
  );
  const ownerKeys = new Set(
    input.firstTeachOwners.map((owner) => `${owner.kind}:${owner.id}`),
  );
  for (const lexeme of input.lexemes) {
    if (!ownerKeys.has(`lexeme:${lexeme.id}`)) {
      out.push({ code: "first-teach-missing-owner", contentId: lexeme.id });
    }
  }
  for (const concept of input.concepts) {
    if (!ownerKeys.has(`${concept.kind}:${concept.id}`)) {
      out.push({ code: "first-teach-missing-owner", contentId: concept.id });
    }
  }

  const firstTeachPosition = new Map<string, number>([
    ...input.lexemes.map(
      (lexeme) =>
        [
          lexeme.id,
          positionByLesson.get(lexeme.firstTeachLessonId) ?? Number.MAX_SAFE_INTEGER,
        ] as const,
    ),
    ...input.concepts.map(
      (concept) =>
        [
          concept.id,
          positionByLesson.get(concept.firstTeachLessonId) ??
            Number.MAX_SAFE_INTEGER,
        ] as const,
    ),
  ]);

  for (const lesson of input.lessons) {
    for (const prerequisiteId of lesson.prerequisiteLessonIds) {
      const position = positionByLesson.get(prerequisiteId);
      if (position === undefined || position >= lesson.position) {
        out.push({
          code: "prerequisite-closure",
          lessonId: lesson.lessonId,
          referenceId: prerequisiteId,
        });
      }
    }
    for (const target of targetsByLesson.get(lesson.lessonId) ?? []) {
      for (const contentId of [
        ...target.lexemeIds,
        ...target.conceptIds,
        ...target.formIds,
      ]) {
        const taughtAt = firstTeachPosition.get(contentId);
        if (taughtAt !== undefined && taughtAt > lesson.position) {
          out.push({
            code: "first-teach-order",
            lessonId: lesson.lessonId,
            contentId,
          });
        }
      }
    }
  }

  // A retrieval system is *introduced* at its first-teach lesson and completed
  // across later lessons, so a component may legitimately be taught after the
  // system id itself. What must hold is that every component is genuinely owned
  // somewhere in the release — never a dangling id.
  const ownedContentIds = new Set(
    input.firstTeachOwners.map((owner) => owner.id),
  );
  for (const system of input.systems) {
    for (const componentId of system.componentContentIds) {
      if (!ownedContentIds.has(componentId)) {
        out.push({
          code: "system-component-missing",
          referenceId: system.id,
          contentId: componentId,
        });
      }
    }
  }
}

function checkPatternCells(
  input: BaseReleaseInput,
  targetsByLesson: ReadonlyMap<string, readonly BaseReleaseVisibleTarget[]>,
  out: Collector,
): void {
  for (const lesson of input.lessons) {
    // A *system* lesson exists to make its paradigm visible, so every cell it
    // declares must be realized by a surface inside that lesson. Content and
    // synthesis lessons legitimately declare cells they *retrieve* from an
    // earlier owner rather than re-realize; that relationship is enforced by
    // the per-lesson depth validator this gate also runs.
    if (lesson.contract !== "system" || lesson.patternCellIds.length === 0) {
      continue;
    }
    const realized = new Set(
      (targetsByLesson.get(lesson.lessonId) ?? []).flatMap((target) => [
        ...target.patternCellIds,
      ]),
    );
    for (const cellId of lesson.patternCellIds) {
      if (!realized.has(cellId)) {
        out.push({
          code: "pattern-cell-missing",
          lessonId: lesson.lessonId,
          referenceId: cellId,
        });
      }
    }
  }
}

function checkHazards(input: BaseReleaseInput, out: Collector): void {
  const positionByLesson = new Map(
    input.lessons.map((lesson) => [lesson.lessonId, lesson.position]),
  );
  const iAdjectiveKanaById = new Map<string, string>();
  for (const lexeme of BASE_LEXICON) {
    if (lexeme.category === "adjective" && lexeme.adjectiveClass === "i") {
      iAdjectiveKanaById.set(lexeme.id, lexeme.kana);
    }
  }

  for (const target of input.visibleTargets) {
    const position = positionByLesson.get(target.lessonId) ?? 0;

    // A dynamic predicate in the non-past is habitual/future. Only the bounded
    // `ている` construction licenses an ongoing-now reading.
    if (
      target.predicateAspect === "dynamic" &&
      target.interpretationTags.includes("ongoing-now") &&
      !target.formIds.includes(ONGOING_LICENSING_FORM_ID)
    ) {
      out.push({
        code: "dynamic-nonpast-ongoing",
        lessonId: target.lessonId,
        contentId: target.id,
      });
    }

    // An i-adjective never takes the copula だ — in a surface the release
    // presents as *correct* Japanese. Activity prompts and options carry
    // deliberately ill-formed distractors (an `error-diagnosis` prompt is
    // precisely the sentence a learner must repair), so only the canonical
    // model surfaces are policed here.
    if (CANONICAL_SURFACE_KINDS.has(target.kind)) {
      for (const lexemeId of target.lexemeIds) {
        const kana = iAdjectiveKanaById.get(lexemeId);
        if (kana && target.japanese.includes(`${kana}だ`)) {
          out.push({
            code: "i-adjective-copula-da",
            lessonId: target.lessonId,
            contentId: target.id,
            referenceId: lexemeId,
          });
        }
      }
    }

    for (const formId of target.formIds) {
      if (FORBIDDEN_FORM_IDS.has(formId)) {
        out.push({
          code: "forbidden-explanatory-no",
          lessonId: target.lessonId,
          contentId: target.id,
          referenceId: formId,
        });
      }
      const ownerLessonId = BOUNDED_TE_OWNER_BY_FORM[formId];
      if (ownerLessonId !== undefined) {
        const ownerPosition = positionByLesson.get(ownerLessonId);
        if (ownerPosition === undefined || position < ownerPosition) {
          out.push({
            code: "bounded-te-before-owner",
            lessonId: target.lessonId,
            contentId: target.id,
            referenceId: formId,
          });
        }
      }
    }

    if (target.particleFrame) {
      const frame = validateParticleFrame(
        target.particleFrame.predicateSenseId,
        target.particleFrame.provided,
      );
      if (!frame.ok) {
        for (const error of frame.errors) {
          out.push({
            code:
              error.code === "unlicensed-particle"
                ? "unlicensed-particle"
                : "unlicensed-particle",
            lessonId: target.lessonId,
            contentId: target.id,
            referenceId:
              "role" in error && error.role !== undefined
                ? error.role
                : target.particleFrame.predicateSenseId,
            detail: error.code,
          });
        }
      }
    }
  }

  // Form-engine equality: every authored predicate lexeme must still realize
  // through the shipped form engine, and the i-adjective grid must never emit
  // the copula だ.
  for (const lexeme of BASE_LEXICON) {
    if (lexeme.category === "verb") {
      if (!realizePoliteGrid(lexeme.id).ok) {
        out.push({ code: "form-engine-mismatch", contentId: lexeme.id });
      }
      continue;
    }
    if (lexeme.category !== "adjective") continue;
    if (lexeme.adjectiveClass === "i") {
      const grid = realizeIAdjectivePredicate(lexeme.id);
      if (!grid.ok) {
        out.push({ code: "form-engine-mismatch", contentId: lexeme.id });
        continue;
      }
      for (const cell of Object.values(grid.value)) {
        if (japaneseOf(cell.tokens).includes("だ")) {
          out.push({ code: "i-adjective-copula-da", contentId: lexeme.id });
        }
      }
    } else if (!realizeNaAdjectivePredicate(lexeme.id).ok) {
      out.push({ code: "form-engine-mismatch", contentId: lexeme.id });
    }
  }
}

function checkRealizedViews(
  input: BaseReleaseInput,
  targetsByLesson: ReadonlyMap<string, readonly BaseReleaseVisibleTarget[]>,
  out: Collector,
): void {
  // Visible-surface uniqueness within each lesson, per *role*: two distinct
  // worked examples, two dialogue turns, or two activity answers may never
  // render the identical surface. Comparison is keyed by the canonical source
  // id, so the same authored target resolved twice is never mistaken for a
  // collision — and an activity that legitimately drills the exact surface a
  // worked example teaches is a different role, not a duplicate.
  for (const lesson of input.lessons) {
    const sourcesBySurface = new Map<string, Set<string>>();
    for (const target of targetsByLesson.get(lesson.lessonId) ?? []) {
      if (!CANONICAL_SURFACE_KINDS.has(target.kind)) continue;
      if (target.japanese.length === 0) continue;
      const key = `${target.kind}:${visibleSurfaceKey(target)}`;
      const sources = sourcesBySurface.get(key) ?? new Set<string>();
      sources.add(target.sourceId);
      sourcesBySurface.set(key, sources);
    }
    for (const [fingerprint, sources] of sourcesBySurface) {
      if (sources.size > 1) {
        out.push({
          code: "duplicate-visible-fingerprint",
          lessonId: lesson.lessonId,
          referenceId: fingerprint,
          detail: [...sources].sort().join(","),
        });
      }
    }
  }

  const localesByLesson = new Map<string, Set<string>>();
  for (const view of input.lessonViews) {
    const locales = localesByLesson.get(view.lessonId) ?? new Set<string>();
    locales.add(view.locale);
    localesByLesson.set(view.lessonId, locales);
    const strings = [
      view.title,
      view.canDo,
      view.recap,
      ...view.explanationBlocks,
      ...view.exampleTranslations,
      ...view.dialogueTranslations,
      ...view.referenceSnapshotTitles,
      ...view.vocabulary.map(({ meaning }) => meaning),
    ];
    if (strings.some((text) => text.trim().length === 0)) {
      out.push({
        code: "locale-parity",
        lessonId: view.lessonId,
        detail: view.locale,
      });
    }
  }
  for (const lesson of input.lessons) {
    const locales = localesByLesson.get(lesson.lessonId) ?? new Set<string>();
    if (!locales.has("en") || !locales.has("it")) {
      out.push({ code: "view-unrendered", lessonId: lesson.lessonId });
    }
  }

  // Script parity: every visible surface must render in both kana and romaji.
  for (const target of input.visibleTargets) {
    if (target.japanese.length === 0 || target.romaji.length === 0) {
      out.push({
        code: "script-parity",
        lessonId: target.lessonId,
        contentId: target.id,
      });
    }
  }

  for (const probe of input.renderProbes) {
    for (const [name, value] of Object.entries(probe.preAttemptAttributes)) {
      if (/answer|correct|solution/iu.test(name)) {
        out.push({
          code: "pre-attempt-answer-leak",
          lessonId: probe.lessonId,
          contentId: probe.activityId,
          referenceId: name,
          detail: "attribute-name",
        });
        continue;
      }
      for (const answer of probe.forbiddenAnswers) {
        if (value.includes(answer)) {
          out.push({
            code: "pre-attempt-answer-leak",
            lessonId: probe.lessonId,
            contentId: probe.activityId,
            referenceId: name,
            detail: "attribute-value",
          });
        }
      }
    }
    for (const text of probe.preAttemptText) {
      for (const answer of probe.forbiddenAnswers) {
        if (text.includes(answer)) {
          out.push({
            code: "pre-attempt-answer-leak",
            lessonId: probe.lessonId,
            contentId: probe.activityId,
            detail: "visible-text",
          });
        }
      }
    }
  }
}

function checkReviewLedgers(input: BaseReleaseInput, out: Collector): void {
  // --- Audio -------------------------------------------------------------
  // Staleness only. `status: "pending"` means the human-ear sign-off has not
  // arrived yet; that is counted in `report.unresolvedFindings`, never
  // converted into an acceptance and never treated as an error here.
  const assetById = new Map(input.audio.assets.map((asset) => [asset.id, asset]));
  const reviewedAssetIds = new Set<string>();
  for (const review of input.audio.reviews) {
    if (review.assetId === null) continue;
    reviewedAssetIds.add(review.assetId);
    const asset = assetById.get(review.assetId);
    if (!asset) {
      out.push({
        code: "audio-review-missing",
        contentId: review.contentId,
        referenceId: review.assetId,
      });
      continue;
    }
    if (review.assetSha256 !== asset.sha256) {
      out.push({
        code: "audio-review-stale",
        contentId: review.contentId,
        referenceId: review.assetId,
        detail: "sha256",
      });
    }
    if (review.transcript !== asset.kana) {
      out.push({
        code: "audio-review-stale",
        contentId: review.contentId,
        referenceId: review.assetId,
        detail: "transcript",
      });
    }
  }
  for (const asset of input.audio.assets) {
    if (!reviewedAssetIds.has(asset.id)) {
      out.push({ code: "audio-review-missing", referenceId: asset.id });
    }
  }
  for (const error of input.audio.ledgerValidation.errors) {
    out.push({
      code: error.includes("stale") ? "audio-review-stale" : "audio-review-missing",
      detail: error,
    });
  }

  // --- Naturalness -------------------------------------------------------
  const surfaceById = new Map(
    input.naturalness.surfaces.map((surface) => [surface.contentId, surface]),
  );
  const reviewedIds = new Set<string>();
  for (const review of input.naturalness.reviews) {
    reviewedIds.add(review.contentId);
    const surface = surfaceById.get(review.contentId);
    if (!surface) {
      out.push({
        code: "naturalness-review-missing",
        contentId: review.contentId,
      });
      continue;
    }
    if (
      review.jp !== surface.jp ||
      review.en !== surface.en ||
      review.it !== surface.it ||
      review.lessonId !== surface.lessonId
    ) {
      out.push({
        code: "naturalness-review-stale",
        contentId: review.contentId,
        lessonId: review.lessonId,
      });
    }
  }
  for (const surface of input.naturalness.surfaces) {
    if (!reviewedIds.has(surface.contentId)) {
      out.push({
        code: "naturalness-review-missing",
        contentId: surface.contentId,
      });
    }
  }
  for (const error of input.naturalness.ledgerValidation.errors) {
    out.push({
      code: error.includes("stale")
        ? "naturalness-review-stale"
        : "naturalness-review-missing",
      detail: error,
    });
  }
}

function checkMigration(input: BaseReleaseInput, out: Collector): void {
  const rehomed = [...input.migration.rehomedLessonIds].sort();
  const ownershipDestinations = [
    ...new Set(input.migration.ownership.map((row) => row.destinationLessonId)),
  ].sort();
  if (ownershipDestinations.join(",") !== rehomed.join(",")) {
    out.push({ code: "migration-evidence-mismatch", detail: "ownership" });
  }

  const inventoryLessonIds = [
    ...new Set(input.migration.inventory.map((row) => row.lessonId)),
  ].sort();
  if (inventoryLessonIds.join(",") !== rehomed.join(",")) {
    out.push({ code: "migration-inventory-mismatch", detail: "lessons" });
  }

  const inventoryKeys = new Set(
    input.migration.inventory.map((row) => `${row.lessonId}:${row.definitionId}`),
  );
  if (inventoryKeys.size !== input.migration.inventory.length) {
    out.push({ code: "migration-inventory-mismatch", detail: "duplicate" });
  }
  for (const row of input.migration.inventory) {
    if (row.reviewKey !== `${row.lessonId}:${row.definitionId}`) {
      out.push({
        code: "migration-inventory-mismatch",
        referenceId: row.definitionId,
        detail: "review-key",
      });
    }
  }

  const activityKeys = new Set(
    input.migration.activities.map(
      (row) => `${row.sourceLessonId}:${row.sourceActivityId}`,
    ),
  );
  for (const key of inventoryKeys) {
    if (!activityKeys.has(key)) {
      out.push({
        code: "migration-evidence-mismatch",
        referenceId: key,
        detail: "activity-disposition",
      });
    }
  }
  if (activityKeys.size !== inventoryKeys.size) {
    out.push({ code: "migration-evidence-mismatch", detail: "activity-count" });
  }

  const publishedModules = new Set(
    input.lessons.map((lesson) => lesson.moduleId),
  );
  for (const row of input.migration.canDos) {
    if (row.destinationCanDoId.length === 0) {
      out.push({ code: "migration-evidence-mismatch", detail: "can-do" });
    }
  }
  if (input.migration.canDos.length !== publishedModules.size / 2) {
    // Only the five rehomed modules carry a V4 Can-do disposition; the other
    // five Base modules are new authoring with no V4 ancestor.
    if (input.migration.canDos.length !== 5) {
      out.push({ code: "migration-evidence-mismatch", detail: "can-do-count" });
    }
  }
}

/**
 * Validates a complete Base release. Additive by construction: every check
 * runs, and the caller receives the full structured finding list.
 */
export function validateBaseRelease(
  input: BaseReleaseInput = buildBaseReleaseInput(),
): BaseReleaseValidationResult {
  const errors: BaseReleaseError[] = [];
  const out: Collector = { push: (error) => void errors.push(error) };

  const targetsByLesson = new Map<string, BaseReleaseVisibleTarget[]>();
  for (const target of input.visibleTargets) {
    const bucket = targetsByLesson.get(target.lessonId) ?? [];
    bucket.push(target);
    targetsByLesson.set(target.lessonId, bucket);
  }

  checkStructure(input, out);
  checkContracts(input, targetsByLesson, out);
  checkCatalogs(input, out);
  checkSequencing(input, targetsByLesson, out);
  checkPatternCells(input, targetsByLesson, out);
  checkHazards(input, out);
  checkRealizedViews(input, targetsByLesson, out);
  checkReviewLedgers(input, out);
  checkMigration(input, out);

  return {
    valid: errors.length === 0,
    errors,
    report: buildBaseReleaseReport(input),
  };
}
