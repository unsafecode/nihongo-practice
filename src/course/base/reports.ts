import { canonicalReviewFingerprint } from "./review/fingerprint";

/**
 * Task 17 — measured Base release reporting.
 *
 * This module owns two things:
 *
 *  1. `BaseReleaseInput`, the plain-data snapshot of a Base release. It holds
 *     both the *production catalogs* (lessons, lexicon, concepts, first-teach
 *     owners, references, migration evidence) and the *realized learner
 *     views* (every learner-visible Japanese surface, both locale view
 *     models, and the pre-attempt render probes). `validateBase.ts` builds it
 *     from the shipped modules; test fixtures deep-clone it and change
 *     exactly one field.
 *  2. The report builders. **Every value in a report is measured from the
 *     input** — nothing here is a hardcoded count, so a report can never
 *     agree with a release it does not describe.
 *
 * Nothing in this file is reachable from the production runtime: it is a
 * source-only release artefact, like the review ledgers, so Rollup drops it.
 */

export type BaseReleaseLocale = "en" | "it";
export type BaseReleaseScript = "kana" | "romaji";

export type BaseReleaseTargetKind =
  | "example"
  | "dialogue-turn"
  | "activity-prompt"
  | "activity-answer"
  | "activity-option";

export interface BaseReleaseParticleFrame {
  readonly predicateSenseId: string;
  readonly provided: Readonly<Record<string, string>>;
}

/**
 * One learner-visible Japanese surface, as realized for the learner, carrying
 * the canonical provenance the authoring catalogs attach to it.
 */
export interface BaseReleaseVisibleTarget {
  readonly id: string;
  readonly lessonId: string;
  readonly ownerId: string;
  /** The canonical catalog target this surface was realized from. */
  readonly sourceId: string;
  readonly kind: BaseReleaseTargetKind;
  readonly japanese: string;
  readonly romaji: string;
  readonly lexemeIds: readonly string[];
  readonly conceptIds: readonly string[];
  readonly formIds: readonly string[];
  readonly patternCellIds: readonly string[];
  readonly interpretationTags: readonly string[];
  readonly predicateAspect: string | null;
  readonly predicateSenseId: string | null;
  readonly predicateLexemeId: string | null;
  readonly particleFrame: BaseReleaseParticleFrame | null;
}

export interface BaseReleaseVocabularyView {
  readonly id: string;
  readonly kana: string;
  readonly romaji: string;
  readonly meaning: string;
  readonly isReview: boolean;
}

/** One lesson's realized learner view, for one locale. */
export interface BaseReleaseLessonView {
  readonly lessonId: string;
  readonly locale: BaseReleaseLocale;
  readonly contract: string;
  readonly title: string;
  readonly canDo: string;
  readonly recap: string;
  readonly explanationBlocks: readonly string[];
  readonly vocabulary: readonly BaseReleaseVocabularyView[];
  readonly exampleTranslations: readonly string[];
  readonly dialogueTranslations: readonly string[];
  readonly referenceSnapshotTitles: readonly string[];
}

/**
 * The metadata one practice activity exposes *before* the learner attempts
 * it, plus the canonical answer text that must not be reachable from it.
 */
export interface BaseReleaseRenderProbe {
  readonly lessonId: string;
  readonly activityId: string;
  readonly interactionKind: string;
  readonly preAttemptAttributes: Readonly<Record<string, string>>;
  readonly preAttemptText: readonly string[];
  readonly forbiddenAnswers: readonly string[];
}

export interface BaseReleaseAudioAsset {
  readonly id: string;
  readonly sha256: string;
  readonly fingerprint: string;
  readonly kana: string;
}

export interface BaseReleaseAudioReview {
  readonly contentId: string;
  readonly lessonId: string;
  readonly sourceKind: string;
  readonly assetId: string | null;
  readonly assetSha256: string | null;
  readonly transcript: string;
  readonly fingerprint: string;
  readonly status: string;
}

export interface BaseReleaseNaturalnessSurface {
  readonly contentId: string;
  readonly lessonId: string;
  readonly jp: string;
  readonly en: string;
  readonly it: string;
}

export interface BaseReleaseNaturalnessReview
  extends BaseReleaseNaturalnessSurface {
  readonly sourceKind: string;
  readonly fingerprint: string;
  readonly status: string;
}

export interface BaseReleaseLedgerValidation {
  readonly ok: boolean;
  readonly errors: readonly string[];
}

export interface BaseReleaseLessonRecord {
  readonly lessonId: string;
  readonly moduleId: string;
  readonly position: number;
  readonly contract: string;
  readonly prerequisiteLessonIds: readonly string[];
  readonly newLexemeIds: readonly string[];
  readonly reviewLexemeIds: readonly string[];
  readonly introducedConceptIds: readonly string[];
  readonly explanationBlockIds: readonly string[];
  readonly patternCellIds: readonly string[];
  readonly workedExampleIds: readonly string[];
  readonly dialogueId: string | null;
  readonly activityIds: readonly string[];
  readonly activityCategories: readonly string[];
  readonly referenceSnapshotIds: readonly string[];
  readonly retrievedSystemIds: readonly string[];
}

export interface BaseReleaseSystemRecord {
  readonly id: string;
  readonly firstTeachLessonId: string;
  readonly componentContentIds: readonly string[];
}

export interface BaseReleaseReferenceEntryRecord {
  readonly referenceId: string;
  readonly semanticId: string;
  readonly firstTeachLessonId: string;
  readonly prerequisiteEntryIds: readonly string[];
  readonly cellIds: readonly string[];
}

export interface BaseReleaseMigration {
  readonly rehomedLessonIds: readonly string[];
  readonly ownership: readonly {
    readonly sourceLessonId: string;
    readonly destinationLessonId: string;
  }[];
  readonly canDos: readonly {
    readonly sourceCanDoId: string;
    readonly destinationCanDoId: string;
  }[];
  readonly activities: readonly {
    readonly sourceLessonId: string;
    readonly sourceActivityId: string;
    readonly destinationLessonId: string;
    readonly disposition: string;
  }[];
  readonly inventory: readonly {
    readonly lessonId: string;
    readonly definitionId: string;
    readonly reviewKey: string;
    readonly practiceFunction: string;
  }[];
}

export interface BaseReleaseRoute {
  readonly level: string;
  readonly moduleId: string;
  readonly lessonId: string;
  readonly path: string;
}

export interface BaseReleaseIdentity {
  readonly a1ModuleIds: readonly string[];
  readonly a1LessonIds: readonly string[];
  readonly a2LessonIds: readonly string[];
  readonly routes: readonly BaseReleaseRoute[];
  readonly aliases: readonly {
    readonly legacyLessonId: string;
    readonly lessonId: string;
    readonly moduleId: string;
  }[];
}

export interface BaseReleaseInput {
  readonly manifest: {
    readonly moduleIds: readonly string[];
    readonly lessonIds: readonly string[];
    readonly lessonIdsByModule: Readonly<Record<string, readonly string[]>>;
  };
  readonly lessons: readonly BaseReleaseLessonRecord[];
  readonly lexemes: readonly {
    readonly id: string;
    readonly category: string;
    readonly firstTeachLessonId: string;
    readonly countable: boolean;
  }[];
  readonly concepts: readonly {
    readonly id: string;
    readonly kind: string;
    readonly prerequisiteIds: readonly string[];
    readonly firstTeachLessonId: string;
  }[];
  readonly firstTeachOwners: readonly {
    readonly kind: string;
    readonly id: string;
    readonly lessonId: string;
  }[];
  readonly systems: readonly BaseReleaseSystemRecord[];
  readonly references: {
    readonly ids: readonly string[];
    readonly entries: readonly BaseReleaseReferenceEntryRecord[];
  };
  readonly visibleTargets: readonly BaseReleaseVisibleTarget[];
  readonly lessonViews: readonly BaseReleaseLessonView[];
  readonly renderProbes: readonly BaseReleaseRenderProbe[];
  readonly audio: {
    readonly assets: readonly BaseReleaseAudioAsset[];
    readonly reviews: readonly BaseReleaseAudioReview[];
    readonly ledgerValidation: BaseReleaseLedgerValidation;
  };
  readonly naturalness: {
    readonly surfaces: readonly BaseReleaseNaturalnessSurface[];
    readonly reviews: readonly BaseReleaseNaturalnessReview[];
    readonly ledgerValidation: BaseReleaseLedgerValidation;
  };
  readonly migration: BaseReleaseMigration;
  readonly identity: BaseReleaseIdentity;
  /** Findings from the shipped per-lesson/sequence catalog validators. */
  readonly catalogFindings: readonly {
    readonly code: string;
    readonly stage: string;
    readonly lessonId: string;
    readonly referenceId?: string;
  }[];
  /** `assertBaseCourseShape()` outcome over the assembled runtime modules. */
  readonly runtimeShape: {
    readonly modules: number;
    readonly lessons: number;
    readonly error: string | null;
  };
}

export interface BaseLessonReport {
  readonly lessonId: string;
  readonly moduleId: string;
  readonly position: number;
  readonly contract: string;
  readonly newLexemes: number;
  readonly reviewedLexemes: number;
  readonly recurringLexemes: number;
  readonly visibleLexemes: number;
  readonly examples: number;
  readonly dialogueTurns: number;
  readonly activities: number;
  readonly exampleFingerprints: readonly string[];
  readonly dialogueFingerprints: readonly string[];
  readonly activityFingerprints: readonly string[];
  readonly explanationBlocks: number;
  readonly patternCells: number;
  readonly referenceEntries: number;
  readonly firstTeachOwned: number;
  readonly prerequisiteClosure: boolean;
  readonly locales: readonly BaseReleaseLocale[];
  readonly scripts: readonly BaseReleaseScript[];
  readonly rendered: boolean;
  readonly naturalnessFingerprints: readonly string[];
  readonly audioFingerprints: readonly string[];
}

export interface BaseReleaseReport {
  readonly modules: number;
  readonly lessons: number;
  readonly lexemes: number;
  readonly examples: number;
  readonly dialogueTurns: number;
  readonly activities: number;
  readonly patternCells: number;
  readonly references: number;
  readonly referenceEntries: number;
  readonly categories: Readonly<Record<string, number>>;
  readonly contracts: Readonly<Record<string, number>>;
  readonly audioReviews: number;
  readonly pendingAudioReviews: number;
  readonly reviewedAudio: number;
  readonly naturalnessReviews: number;
  readonly pendingNaturalnessReviews: number;
  /**
   * Editorial work that is genuinely still outstanding with an *external*
   * reviewer. It is a count, never an acceptance and never a hard error: see
   * `validateBase.ts` for why staleness and pending acceptance are different
   * things.
   */
  readonly unresolvedFindings: number;
  readonly a1Modules: number;
  readonly a1Lessons: number;
  readonly a2Lessons: number;
  readonly byLesson: readonly BaseLessonReport[];
}

const LOCALES: readonly BaseReleaseLocale[] = ["en", "it"];
const SCRIPTS: readonly BaseReleaseScript[] = ["kana", "romaji"];

/**
 * The learner-facing identity of a surface: the Japanese a learner actually
 * reads. Two authored items that render this identically are indistinguishable
 * to a learner however different their provenance is.
 */
export function visibleSurfaceKey(target: BaseReleaseVisibleTarget): string {
  return canonicalReviewFingerprint({ japanese: target.japanese });
}

/** Stable content fingerprint of one learner-visible surface, with provenance. */
export function visibleTargetFingerprint(
  target: BaseReleaseVisibleTarget,
): string {
  return canonicalReviewFingerprint({
    japanese: target.japanese,
    lexemeIds: [...target.lexemeIds],
    formIds: [...target.formIds],
    patternCellIds: [...target.patternCellIds],
  });
}

/** Renders `{b:2,a:1}` as `a=1, b=2`, or `none` when empty. */
export function formatDistribution(
  distribution: Readonly<Record<string, number>>,
): string {
  const entries = Object.entries(distribution).sort(([left], [right]) =>
    left.localeCompare(right),
  );
  return entries.length === 0
    ? "none"
    : entries.map(([name, count]) => `${name}=${count}`).join(", ");
}

function countBy(values: readonly string[]): Readonly<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const value of values) counts[value] = (counts[value] ?? 0) + 1;
  return counts;
}

function targetsByLesson(
  input: BaseReleaseInput,
): ReadonlyMap<string, readonly BaseReleaseVisibleTarget[]> {
  const byLesson = new Map<string, BaseReleaseVisibleTarget[]>();
  for (const target of input.visibleTargets) {
    const bucket = byLesson.get(target.lessonId) ?? [];
    bucket.push(target);
    byLesson.set(target.lessonId, bucket);
  }
  return byLesson;
}

/**
 * True when this lesson's declared prerequisites all sit strictly earlier in
 * the published order, and every concept it makes visible was first taught at
 * or before it. Measured, never assumed.
 */
function prerequisiteClosureFor(
  lesson: BaseReleaseLessonRecord,
  positionByLesson: ReadonlyMap<string, number>,
  firstTeachPositionByConcept: ReadonlyMap<string, number>,
  targets: readonly BaseReleaseVisibleTarget[],
): boolean {
  for (const prerequisiteId of lesson.prerequisiteLessonIds) {
    const position = positionByLesson.get(prerequisiteId);
    if (position === undefined || position >= lesson.position) return false;
  }
  for (const target of targets) {
    for (const contentId of [...target.conceptIds, ...target.formIds]) {
      const taughtAt = firstTeachPositionByConcept.get(contentId);
      if (taughtAt !== undefined && taughtAt > lesson.position) return false;
    }
  }
  return true;
}

export function buildBaseLessonReports(
  input: BaseReleaseInput,
): readonly BaseLessonReport[] {
  const positionByLesson = new Map(
    input.lessons.map((lesson) => [lesson.lessonId, lesson.position]),
  );
  const firstTeachPositionByLexeme = new Map(
    input.lexemes.map((lexeme) => [
      lexeme.id,
      positionByLesson.get(lexeme.firstTeachLessonId) ?? Number.MAX_SAFE_INTEGER,
    ]),
  );
  const firstTeachPositionByConcept = new Map(
    input.concepts.map((concept) => [
      concept.id,
      positionByLesson.get(concept.firstTeachLessonId) ?? Number.MAX_SAFE_INTEGER,
    ]),
  );
  const newLexemeCountByLesson = countBy(
    input.lexemes.map((lexeme) => lexeme.firstTeachLessonId),
  );
  const referenceEntryCountByLesson = countBy(
    input.references.entries.map((entry) => entry.firstTeachLessonId),
  );
  const firstTeachOwnedByLesson = countBy(
    input.firstTeachOwners.map((owner) => owner.lessonId),
  );
  const byLesson = targetsByLesson(input);
  const viewsByLesson = new Map<string, BaseReleaseLessonView[]>();
  for (const view of input.lessonViews) {
    const bucket = viewsByLesson.get(view.lessonId) ?? [];
    bucket.push(view);
    viewsByLesson.set(view.lessonId, bucket);
  }
  const naturalnessByLesson = new Map<string, string[]>();
  for (const review of input.naturalness.reviews) {
    const bucket = naturalnessByLesson.get(review.lessonId) ?? [];
    bucket.push(review.fingerprint);
    naturalnessByLesson.set(review.lessonId, bucket);
  }
  const audioByLesson = new Map<string, string[]>();
  for (const review of input.audio.reviews) {
    const bucket = audioByLesson.get(review.lessonId) ?? [];
    bucket.push(review.fingerprint);
    audioByLesson.set(review.lessonId, bucket);
  }

  return input.lessons.map((lesson): BaseLessonReport => {
    const targets = byLesson.get(lesson.lessonId) ?? [];
    const visibleLexemeIds = new Set(
      targets.flatMap((target) => [...target.lexemeIds]),
    );
    const recurringLexemes = [...visibleLexemeIds].filter((lexemeId) => {
      const taughtAt = firstTeachPositionByLexeme.get(lexemeId);
      return taughtAt !== undefined && taughtAt < lesson.position;
    }).length;
    const views = viewsByLesson.get(lesson.lessonId) ?? [];
    const locales = LOCALES.filter((locale) =>
      views.some((view) => view.locale === locale),
    );
    const rendered =
      locales.length === LOCALES.length &&
      targets.length > 0 &&
      targets.every(
        (target) => target.japanese.length > 0 && target.romaji.length > 0,
      );

    const fingerprintsFor = (
      kinds: readonly BaseReleaseTargetKind[],
    ): readonly string[] =>
      targets
        .filter((target) => kinds.includes(target.kind))
        .map(visibleTargetFingerprint);

    return {
      lessonId: lesson.lessonId,
      moduleId: lesson.moduleId,
      position: lesson.position,
      contract: lesson.contract,
      newLexemes: newLexemeCountByLesson[lesson.lessonId] ?? 0,
      reviewedLexemes: lesson.reviewLexemeIds.length,
      recurringLexemes,
      visibleLexemes: visibleLexemeIds.size,
      examples: targets.filter(({ kind }) => kind === "example").length,
      dialogueTurns: targets.filter(({ kind }) => kind === "dialogue-turn").length,
      activities: lesson.activityIds.length,
      exampleFingerprints: fingerprintsFor(["example"]),
      dialogueFingerprints: fingerprintsFor(["dialogue-turn"]),
      activityFingerprints: lesson.activityIds.map((activityId) =>
        canonicalReviewFingerprint({
          lessonId: lesson.lessonId,
          activityId,
          surfaces: targets
            .filter((target) => target.ownerId === activityId)
            .map((target) => target.japanese)
            .sort(),
        }),
      ),
      explanationBlocks: lesson.explanationBlockIds.length,
      patternCells: lesson.patternCellIds.length,
      referenceEntries: referenceEntryCountByLesson[lesson.lessonId] ?? 0,
      firstTeachOwned: firstTeachOwnedByLesson[lesson.lessonId] ?? 0,
      prerequisiteClosure: prerequisiteClosureFor(
        lesson,
        positionByLesson,
        firstTeachPositionByConcept,
        targets,
      ),
      locales,
      scripts: SCRIPTS,
      rendered,
      naturalnessFingerprints: naturalnessByLesson.get(lesson.lessonId) ?? [],
      audioFingerprints: audioByLesson.get(lesson.lessonId) ?? [],
    };
  });
}

export function buildBaseReleaseReport(
  input: BaseReleaseInput,
): BaseReleaseReport {
  const byLesson = buildBaseLessonReports(input);
  const pendingAudioReviews = input.audio.reviews.filter(
    ({ status }) => status !== "accepted",
  ).length;
  const pendingNaturalnessReviews = input.naturalness.reviews.filter(
    ({ status }) => status !== "accepted",
  ).length;
  const patternCells = new Set(
    input.lessons.flatMap((lesson) => [...lesson.patternCellIds]),
  ).size;

  return {
    modules: input.manifest.moduleIds.length,
    lessons: input.lessons.length,
    lexemes: input.lexemes.length,
    examples: byLesson.reduce((sum, lesson) => sum + lesson.examples, 0),
    dialogueTurns: byLesson.reduce((sum, lesson) => sum + lesson.dialogueTurns, 0),
    activities: byLesson.reduce((sum, lesson) => sum + lesson.activities, 0),
    patternCells,
    references: input.references.ids.length,
    referenceEntries: input.references.entries.length,
    categories: countBy(
      input.lessons.flatMap((lesson) => [...lesson.activityCategories]),
    ),
    contracts: countBy(input.lessons.map((lesson) => lesson.contract)),
    audioReviews: input.audio.reviews.length,
    pendingAudioReviews,
    reviewedAudio: input.audio.reviews.length - pendingAudioReviews,
    naturalnessReviews: input.naturalness.reviews.length,
    pendingNaturalnessReviews,
    unresolvedFindings: pendingAudioReviews + pendingNaturalnessReviews,
    a1Modules: input.identity.a1ModuleIds.length,
    a1Lessons: input.identity.a1LessonIds.length,
    a2Lessons: input.identity.a2LessonIds.length,
    byLesson,
  };
}
