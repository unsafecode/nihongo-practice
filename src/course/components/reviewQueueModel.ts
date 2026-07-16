import { courseModules } from "../data/course";
import type { CourseProgressV3 } from "../progress/progress";
import { orderedReviewQueue } from "../progress/reviewQueue";
import type { GeneratedExercise } from "./lessonExerciseModel";
import type { ExercisePrompt } from "../exercises/types";
import { getLessonExercises } from "./lessonExerciseModel";

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
 */

export interface ReviewQueueItem {
  readonly reviewKey: string;
  readonly lessonId: string;
  readonly moduleId: string;
  readonly exerciseDefinitionId: string;
  /** The shared target example, for deriving in-sentence romaji in review mode. */
  readonly targetExampleId: string;
  readonly prompt: ExercisePrompt;
  readonly mistakeCount: number;
  readonly targetConceptIds: readonly string[];
  readonly targetLexemeIds: readonly string[];
}

export interface ReviewQueueView {
  readonly items: readonly ReviewQueueItem[];
  readonly unresolvableKeys: readonly string[];
  readonly orphanedKeys: readonly string[];
}

const moduleIdByLesson = new Map<string, string>(
  courseModules.flatMap((courseModule) =>
    courseModule.lessons.map((lesson) => [lesson.id, courseModule.id]),
  ),
);

function exerciseFor(
  lessonId: string,
  exerciseDefinitionId: string,
): GeneratedExercise | undefined {
  return getLessonExercises(lessonId)?.exercises.find(
    (exercise) => exercise.definitionId === exerciseDefinitionId,
  );
}

export function buildReviewQueueView(
  progress: CourseProgressV3,
): ReviewQueueView {
  const items: ReviewQueueItem[] = [];
  const unresolvableKeys: string[] = [];

  for (const entry of orderedReviewQueue(progress.reviewQueue)) {
    const moduleId = moduleIdByLesson.get(entry.lessonId);
    const exercise = exerciseFor(entry.lessonId, entry.exerciseDefinitionId);
    if (moduleId === undefined || exercise === undefined) {
      unresolvableKeys.push(entry.reviewKey);
      continue;
    }
    items.push({
      reviewKey: entry.reviewKey,
      lessonId: entry.lessonId,
      moduleId,
      exerciseDefinitionId: entry.exerciseDefinitionId,
      targetExampleId: exercise.targetExampleId,
      prompt: exercise.prompt,
      mistakeCount: entry.mistakeCount,
      targetConceptIds: entry.targetConceptIds,
      targetLexemeIds: entry.targetLexemeIds,
    });
  }

  return {
    items,
    unresolvableKeys,
    orphanedKeys: progress.orphanedReviewKeys,
  };
}
