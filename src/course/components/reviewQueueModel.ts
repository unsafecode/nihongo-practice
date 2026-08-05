import { courseModulesByLevel } from "../data/course";
import type { Locale } from "../../i18n/LocaleContext";
import type { CourseLevelId, ReviewQueueEntry } from "../progress/progress";
import { orderedReviewQueue } from "../progress/reviewQueue";
import type { GeneratedExercise } from "./lessonExerciseModel";
import type { ExercisePrompt } from "../exercises/types";
import { getLessonExercises } from "./lessonExerciseModel";
import { a1LessonContentById } from "../a1/curriculum/catalog";
import {
  validateReviewRetrievalPair,
  type A1ReviewRetrievalTarget,
} from "../a1/curriculum/validateA1Curriculum";
import { A1_RELEASE_CATALOG_VERSION } from "../a1/releaseIdentity";

/**
 * The pure `Da ripassare` review-queue view-model (Slice C plan Task 4 step 4;
 * design spec §10.4). It turns the stored, already-deduplicated review queue
 * into renderable items in canonical order (most recent mistake first, stable
 * review-key tie-break) and keeps three failure states explicit rather than
 * silently dropping anything:
 *
 *   - `items` — entries whose lesson/exercise the current catalog still resolves
 *     to an engine prompt, each carrying its module id for a lesson deep link;
 *   - `unresolvableKeys` — active entries whose exercise no longer generates a
 *     prompt (a defensive bucket; `reconcileReviewQueue` normally moves unknown
 *     keys to orphans before they ever reach here);
 *   - `orphanedKeys` — the obsolete keys migration preserved on the progress
 *     record, excluded from the active queue until an explicit alias resolves
 *     them (spec §10.4, §11.3).
 *
 * No answer string is ever reconstructed here — the shared engine regenerates
 * each prompt from the same catalog the lesson uses.
 *
 * Level-aware (Phase 3 Task 8 spec-fix): it accepts the minimal
 * {@link ReviewQueueSource} shape (satisfied by both the A1 v3-compat
 * `CourseProgressV3` and any v4 `LevelProgress`) plus the `level` whose course
 * catalog resolves each entry's module id. `level` defaults to `"a1"`, so
 * every existing single-argument A1/PracticeHome call is byte-for-byte
 * unchanged. Module ids are resolved *only* against the given level's own
 * course modules, so an A2 review surface never reads A1's catalog and vice
 * versa; the disjoint lesson-id namespaces mean a foreign entry lands in the
 * explicit `unresolvableKeys` bucket rather than being cross-resolved.
 */

/**
 * The minimum progress shape the review view-model reads. Both
 * `CourseProgressV3` (the A1 v3-compat projection) and a v4 `LevelProgress`
 * structurally satisfy it, so one implementation serves both levels.
 */
export interface ReviewQueueSource {
  readonly reviewQueue: readonly ReviewQueueEntry[];
  readonly orphanedReviewKeys: readonly string[];
}

export interface ReviewQueueItem {
  readonly reviewKey: string;
  readonly lessonId: string;
  readonly moduleId: string;
  /** Original stored definition that owns the review key and progress evidence. */
  readonly sourceExerciseDefinitionId: string;
  /** The task rendered for this review; A1 uses a safe alternate, A2 the source. */
  readonly exerciseDefinitionId: string;
  /** The shared target example, for deriving in-sentence romaji in review mode. */
  readonly targetExampleId: string;
  /** The exercise's real displayed target (still the raw value here; hashed
   * only inside `Exercise.tsx` via `opaqueTargetKey` into
   * `data-visible-target-key` DOM metadata — never emitted raw) — carried
   * through review mode so a reviewed exercise is exactly as
   * diversity-auditable as a fresh one. */
  readonly visibleTargetKey: string;
  readonly prompt: ExercisePrompt;
  /** Localized instruction for the exercise's kind, by locale. */
  readonly instruction: Readonly<Record<Locale, string>>;
  /** Localized constrained-construction intent/scenario note, or null, by locale. */
  readonly intentText: Readonly<Record<Locale, string | null>>;
  /** The exercise's original round purpose, for `Exercise`'s prop contract. */
  readonly practicePurpose: "guided-controlled" | "transfer";
  /** A1-only blueprint function, null for unchanged A2 exercises. */
  readonly practiceFunction: GeneratedExercise["practiceFunction"];
  /** Post-submit feedback for the generated exercise rendered in review. */
  readonly feedback: GeneratedExercise["feedback"];
  readonly mistakeCount: number;
  /**
   * The stored attempt evidence, deliberately left unchanged. Retrieval
   * compatibility is normalized only while selecting the alternate; the
   * alternate prompt exposes its current assessed IDs separately.
   */
  readonly targetConceptIds: readonly string[];
  readonly targetLexemeIds: readonly string[];
}

export interface ReviewQueueView {
  readonly items: readonly ReviewQueueItem[];
  readonly unresolvableKeys: readonly string[];
  readonly orphanedKeys: readonly string[];
}

const moduleIdByLessonForLevel: Readonly<Record<CourseLevelId, ReadonlyMap<string, string>>> = {
  a1: new Map(
    courseModulesByLevel.a1.flatMap((courseModule) =>
      courseModule.lessons.map((lesson) => [lesson.id, courseModule.id]),
    ),
  ),
  a2: new Map(
    courseModulesByLevel.a2.flatMap((courseModule) =>
      courseModule.lessons.map((lesson) => [lesson.id, courseModule.id]),
    ),
  ),
};

function exerciseFor(
  lessonId: string,
  exerciseDefinitionId: string,
): GeneratedExercise | undefined {
  return getLessonExercises(lessonId)?.exercises.find(
    (exercise) => exercise.definitionId === exerciseDefinitionId,
  );
}

function assessedIdsFor(exercise: GeneratedExercise): readonly string[] {
  return [...exercise.prompt.assessedConceptIds, ...exercise.prompt.assessedLexemeIds];
}

/**
 * Reconstructs enough transient source metadata to retrieve a safe alternate
 * for entries recorded before Task 10 added lesson-level assessment metadata.
 * It never changes the persisted entry or the evidence surfaced to the UI.
 */
function normalizedSourceAssessedIds(
  entry: ReviewQueueEntry,
  original: GeneratedExercise,
): readonly string[] {
  const learningNoteId = a1LessonContentById[entry.lessonId]?.learningNoteId;
  return [
    ...new Set([
      ...entry.targetConceptIds,
      ...entry.targetLexemeIds,
      ...assessedIdsFor(original),
      ...(learningNoteId ? [learningNoteId] : []),
    ]),
  ];
}

function reviewTargetFor(
  exercise: GeneratedExercise,
  assessedIds = assessedIdsFor(exercise),
): A1ReviewRetrievalTarget | undefined {
  if (exercise.practiceFunction === null) return undefined;
  return {
    id: exercise.definitionId,
    function: exercise.practiceFunction,
    visibleTargetKey: exercise.visibleTargetKey,
    assessedIds,
  };
}

/**
 * A small locale-independent FNV-1a hash used only to stably rank otherwise
 * valid A1 review alternates. It is not an identity or security primitive.
 */
export function stableReviewCandidateHash(input: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash = Math.imul(hash ^ input.charCodeAt(index), 0x01000193);
  }
  return hash >>> 0;
}

function compareA1ReviewCandidates(
  reviewKey: string,
  genuineSourceAssessedIds: readonly string[],
  left: GeneratedExercise,
  right: GeneratedExercise,
): number {
  const leftSharesGenuineAssessment = assessedIdsFor(left).some((id) =>
    genuineSourceAssessedIds.includes(id),
  );
  const rightSharesGenuineAssessment = assessedIdsFor(right).some((id) =>
    genuineSourceAssessedIds.includes(id),
  );
  if (leftSharesGenuineAssessment !== rightSharesGenuineAssessment) {
    return leftSharesGenuineAssessment ? -1 : 1;
  }
  const leftRank = stableReviewCandidateHash(
    `${A1_RELEASE_CATALOG_VERSION}|${reviewKey}|${left.definitionId}`,
  );
  const rightRank = stableReviewCandidateHash(
    `${A1_RELEASE_CATALOG_VERSION}|${reviewKey}|${right.definitionId}`,
  );
  if (leftRank !== rightRank) return leftRank < rightRank ? -1 : 1;
  if (left.definitionId !== right.definitionId) {
    return left.definitionId < right.definitionId ? -1 : 1;
  }
  return 0;
}

function alternateA1ExerciseFor(
  entry: ReviewQueueEntry,
  original: GeneratedExercise,
): GeneratedExercise | undefined {
  const learningNoteId = a1LessonContentById[entry.lessonId]?.learningNoteId;
  const source = reviewTargetFor(
    original,
    normalizedSourceAssessedIds(entry, original),
  );
  if (!source) return undefined;
  const genuineSourceAssessedIds = assessedIdsFor(original).filter(
    (id) => id !== learningNoteId,
  );

  const candidates = (getLessonExercises(entry.lessonId)?.exercises ?? [])
    .filter((candidate) => candidate.definitionId !== original.definitionId)
    .filter((candidate) => {
      const target = reviewTargetFor(candidate);
      return target !== undefined && validateReviewRetrievalPair(source, target) === undefined;
    })
    .sort((left, right) =>
      compareA1ReviewCandidates(
        entry.reviewKey,
        genuineSourceAssessedIds,
        left,
        right,
      ),
    );
  return candidates[0];
}

export function buildReviewQueueView(
  source: ReviewQueueSource,
  level: CourseLevelId = "a1",
): ReviewQueueView {
  const items: ReviewQueueItem[] = [];
  const unresolvableKeys: string[] = [];
  const moduleIdByLesson = moduleIdByLessonForLevel[level];

  for (const entry of orderedReviewQueue(source.reviewQueue)) {
    const moduleId = moduleIdByLesson.get(entry.lessonId);
    const original = exerciseFor(entry.lessonId, entry.exerciseDefinitionId);
    if (moduleId === undefined || original === undefined) {
      unresolvableKeys.push(entry.reviewKey);
      continue;
    }
    const exercise =
      level === "a1" ? alternateA1ExerciseFor(entry, original) : original;
    if (exercise === undefined) {
      unresolvableKeys.push(entry.reviewKey);
      continue;
    }
    items.push({
      reviewKey: entry.reviewKey,
      lessonId: entry.lessonId,
      moduleId,
      sourceExerciseDefinitionId: entry.exerciseDefinitionId,
      exerciseDefinitionId: exercise.definitionId,
      targetExampleId: exercise.targetExampleId,
      visibleTargetKey: exercise.visibleTargetKey,
      prompt: exercise.prompt,
      instruction: exercise.instruction,
      intentText: exercise.intentText,
      practicePurpose: exercise.practicePurpose,
      practiceFunction: exercise.practiceFunction,
      feedback: exercise.feedback,
      mistakeCount: entry.mistakeCount,
      targetConceptIds: entry.targetConceptIds,
      targetLexemeIds: entry.targetLexemeIds,
    });
  }

  return {
    items,
    unresolvableKeys,
    orphanedKeys: [...source.orphanedReviewKeys],
  };
}
