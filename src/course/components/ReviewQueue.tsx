import { useState } from "react";
import type { ReactElement } from "react";
import { ActionButton, ActionLink } from "../../components/actions/Action";
import { useLocale } from "../../i18n/LocaleContext";
import { lessonPath } from "../../routing/routes";
import { getCourseCopy } from "../i18n/catalog";
import { useProgress } from "../progress/ProgressContext";
import { Exercise } from "./Exercise";
import type { GeneratedExercise } from "./lessonExerciseModel";
import { buildReviewQueueView } from "./reviewQueueModel";
import type { ReviewQueueItem } from "./reviewQueueModel";

/**
 * The lightweight `Da ripassare` review-queue surface on Practice Home (Slice C
 * plan Task 4 step 4; design spec §10.4). It lists the ordered, de-duplicated
 * queue with a count, links each entry back to its lesson, and reveals the
 * exercise inline in **review mode** on request. A review-mode acceptance calls
 * `resolveReview`, which is the only path that removes an entry — an immediate
 * same-lesson correction never silently resolves it (spec §10.4). Empty, orphan,
 * and storage-unavailable states each have their own explicit localized copy,
 * and the surface never blocks the other practice tools.
 */

export function ReviewQueue(): ReactElement {
  const { locale } = useLocale();
  const copy = getCourseCopy(locale);
  const reviewCopy = copy.review;
  const { progress, persistenceAvailable, recordAttempt, resolveReview } =
    useProgress();
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [resolvedNotice, setResolvedNotice] = useState(false);

  const view = buildReviewQueueView(progress);

  const handleAttempt = (item: ReviewQueueItem) => (
    outcome: "accepted" | "retry",
    _exercise: GeneratedExercise,
  ): void => {
    if (outcome === "accepted") {
      resolveReview({
        lessonId: item.lessonId,
        exerciseDefinitionId: item.exerciseDefinitionId,
        targetConceptIds: item.targetConceptIds,
        targetLexemeIds: item.targetLexemeIds,
      });
      setOpenKey(null);
      setResolvedNotice(true);
    } else {
      // A wrong review attempt re-opens/increments the queue entry (spec §10.4).
      recordAttempt({
        lessonId: item.lessonId,
        exerciseDefinitionId: item.exerciseDefinitionId,
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
                          prompt: item.prompt,
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
