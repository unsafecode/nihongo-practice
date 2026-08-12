import { useState } from "react";
import type { ReactElement } from "react";
import { ActionButton, ActionLink } from "../../components/actions/Action";
import { useLocale } from "../../i18n/LocaleContext";
import { lessonPath } from "../../routing/routes";
import { getCourseCopy } from "../i18n/catalog";
import { lessonOwner } from "../levels/ownership";
import { useProgress } from "../progress/ProgressContext";
import type { CourseLevelId } from "../levels/types";
import { Exercise } from "./Exercise";
import type { GeneratedExercise } from "./lessonExerciseModel";
import { buildReviewQueueView } from "./reviewQueueModel";
import type { ReviewQueueItem } from "./reviewQueueModel";

/**
 * The lightweight `Da ripassare` review-queue surface (Slice C plan Task 4
 * step 4; design spec §10.4). It lists the ordered, de-duplicated queue with a
 * count, links each entry back to its lesson, and reveals the exercise inline
 * in **review mode** on request. A review-mode acceptance calls
 * `resolveReview`, which is the only path that removes an entry — an immediate
 * same-lesson correction never silently resolves it (spec §10.4). Empty, orphan,
 * and storage-unavailable states each have their own explicit localized copy,
 * and the surface never blocks the other practice tools.
 *
 * Level-aware (Phase 3 Task 8 spec-fix, BLOCKER 1): `level` selects *which*
 * level's queue this surface shows. It defaults to `"a1"`, reading the
 * selected V5 level slice. Each entry is checked against the canonical owner
 * registry before it becomes actionable, so a historical or mismatched key is
 * shown only as an orphan and can never default into A1.
 */

export interface ReviewQueueProps {
  /**
   * Which level's review queue to show. Defaults to `"a1"`.
   */
  readonly level?: CourseLevelId;
}

export function ReviewQueue({ level = "a1" }: ReviewQueueProps): ReactElement {
  const { locale } = useLocale();
  const copy = getCourseCopy(locale);
  const reviewCopy = copy.review;
  const { progressV5, persistenceAvailable, recordAttempt, resolveReview } =
    useProgress();
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [resolvedNotice, setResolvedNotice] = useState(false);

  const levelProgress = progressV5.levels[level];
  const ownerMismatchedKeys = levelProgress.reviewQueue
    .filter((entry) => lessonOwner(entry.lessonId)?.levelId !== level)
    .map((entry) => entry.reviewKey);
  const source = {
    ...levelProgress,
    reviewQueue: levelProgress.reviewQueue.filter(
      (entry) => lessonOwner(entry.lessonId)?.levelId === level,
    ),
    orphanedReviewKeys: [...levelProgress.orphanedReviewKeys, ...ownerMismatchedKeys],
  };
  const view = buildReviewQueueView(source, level);

  const handleAttempt = (item: ReviewQueueItem) => (
    outcome: "accepted" | "retry",
    _exercise: GeneratedExercise,
  ): void => {
    if (outcome === "accepted") {
      resolveReview({
        lessonId: item.lessonId,
        exerciseDefinitionId: item.sourceExerciseDefinitionId,
        targetConceptIds: item.targetConceptIds,
        targetLexemeIds: item.targetLexemeIds,
      });
      setOpenKey(null);
      setResolvedNotice(true);
    } else {
      // A wrong review attempt re-opens/increments the queue entry (spec §10.4).
      recordAttempt({
        lessonId: item.lessonId,
        exerciseDefinitionId: item.sourceExerciseDefinitionId,
        outcome: "retry",
        targetConceptIds: item.targetConceptIds,
        targetLexemeIds: item.targetLexemeIds,
      });
      setResolvedNotice(false);
    }
  };

  return (
    <section className="review-queue" aria-labelledby="review-queue-heading">
      <div className="review-queue__head">
        <h2 id="review-queue-heading" className="review-queue__title">
          {reviewCopy.title}
        </h2>
        {view.items.length > 0 ? (
          <span className="review-queue__count">
            {reviewCopy.count(view.items.length)}
          </span>
        ) : null}
      </div>

      <p className="review-queue__lead">{reviewCopy.lead}</p>

      <p className="review-queue__announce" role="status" aria-live="polite">
        {resolvedNotice ? reviewCopy.resolved : ""}
      </p>

      {!persistenceAvailable ? (
        <p className="review-queue__unavailable">{reviewCopy.unavailable}</p>
      ) : null}

      {view.items.length === 0 && view.unresolvableKeys.length === 0 ? (
        <p className="review-queue__empty">{reviewCopy.empty}</p>
      ) : view.items.length > 0 ? (
        <ul className="review-queue__list">
          {view.items.map((item) => {
            const open = openKey === item.reviewKey;
            const bodyId = `review-body-${item.reviewKey}`;
            const lessonTitle = copy.lessons[item.lessonId]?.title ?? item.lessonId;
            const practiceFunctionLabel =
              item.practiceFunction === null
                ? null
                : copy.a1Lesson.practice.functions[item.practiceFunction];
            return (
              <li key={item.reviewKey} className="review-queue__item">
                <div className="review-queue__item-head">
                  <div className="review-queue__item-meta">
                    <p className="review-queue__from">
                      {reviewCopy.fromLesson(lessonTitle)}
                    </p>
                    <p className="review-queue__mistakes">
                      {reviewCopy.mistakes(item.mistakeCount)}
                    </p>
                    {practiceFunctionLabel && item.practiceFunction ? (
                      <p
                        className="review-queue__practice-function"
                        data-practice-function={item.practiceFunction}
                      >
                        <span>{copy.a1Lesson.practice.functionLabel}: </span>
                        <span>{practiceFunctionLabel}</span>
                      </p>
                    ) : null}
                    {item.sourceExerciseDefinitionId !== item.exerciseDefinitionId ? (
                      <p className="review-queue__varied-task">{reviewCopy.variedTask}</p>
                    ) : null}
                  </div>
                  <div className="review-queue__item-actions">
                    <ActionLink
                      variant="inline"
                      to={lessonPath(item.moduleId, item.lessonId)}
                    >
                      {reviewCopy.openLesson}
                    </ActionLink>
                    <ActionButton
                      variant="secondary"
                      aria-expanded={open}
                      aria-controls={bodyId}
                      onClick={() => {
                        setResolvedNotice(false);
                        setOpenKey(open ? null : item.reviewKey);
                      }}
                    >
                      {reviewCopy.practice}
                    </ActionButton>
                  </div>
                </div>

                {open ? (
                  <div id={bodyId} className="review-queue__practice">
                    <ol className="lesson-exercises__list">
                      <Exercise
                        exercise={{
                          definitionId: item.exerciseDefinitionId,
                          targetExampleId: item.targetExampleId,
                          visibleTargetKey: item.visibleTargetKey,
                          prompt: item.prompt,
                          instruction: item.instruction,
                          intentText: item.intentText,
                          practicePurpose: item.practicePurpose,
                          practiceFunction: item.practiceFunction,
                          feedback: item.feedback,
                        }}
                        index={1}
                        total={1}
                        idBase={`review-${item.reviewKey}`}
                        onAttempt={handleAttempt(item)}
                      />
                    </ol>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}

      {view.orphanedKeys.length > 0 ? (
        <p className="review-queue__orphaned">
          {reviewCopy.orphaned(view.orphanedKeys.length)}
        </p>
      ) : null}
      {view.unresolvableKeys.length > 0 ? (
        <p className="review-queue__unresolvable">
          {reviewCopy.unresolvable(view.unresolvableKeys.length)}
        </p>
      ) : null}
    </section>
  );
}
