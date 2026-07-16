import type { ReactElement } from "react";
import { ActionButton, ActionLink } from "../../components/actions/Action";
import { Notice } from "../../components/Notice";
import { useLocale } from "../../i18n/LocaleContext";
import { lessonPath, routePaths } from "../../routing/routes";
import { courseModules } from "../data/course";
import { getCourseCopy } from "../i18n/catalog";
import { useProgress } from "../progress/ProgressContext";
import { visitedLessonIds } from "../progress/progress";
import { buildCourseMapModel } from "./courseMapModel";
import { CourseMap } from "./CourseMap";
import { RouteNotice } from "./RouteNotice";
import "../course.css";

const lessons = courseModules.flatMap((courseModule) => courseModule.lessons);

/**
 * Course home (design spec §5.7/§6.1): a bounded "editoriale mnemonico"
 * hero (title, eyebrow, lead, visited progress, primary + secondary
 * actions) followed by the phase-based `CourseMap`. Replaces the old
 * uniform chapter grid and raw status markup - all route/reset/storage
 * status uses the Task 1 `Notice`/Action primitives, and nothing here
 * locks or blocks navigation to any lesson.
 */
export function CourseHome(): ReactElement {
  const { locale } = useLocale();
  const copy = getCourseCopy(locale);
  const { progress, corrupted, persistenceAvailable, dismissCorruption, reset } =
    useProgress();
  const visitedIds = visitedLessonIds(progress);

  const model = buildCourseMapModel(
    courseModules,
    visitedIds,
    progress.lastVisitedLessonId,
  );

  const continuationLessonId = model.recommendedLessonId ?? model.currentLessonId;
  const continuation =
    lessons.find((lesson) => lesson.id === continuationLessonId) ?? lessons[0];
  const continuationModule =
    courseModules.find((courseModule) => courseModule.id === continuation.moduleId) ??
    courseModules[0];

  const primaryLabel = model.allVisited
    ? copy.home.review
    : model.visitedLessonCount > 0
      ? copy.home.continue
      : copy.home.start;

  const canReset =
    visitedIds.length > 0 || progress.lastVisitedLessonId !== null;

  const resetProgress = () => {
    if (window.confirm(copy.home.resetConfirm)) reset();
  };

  return (
    <main className="course-home">
      <RouteNotice />

      {corrupted ? (
        <Notice
          tone="warning"
          title={copy.home.corruptProgressTitle}
          body={copy.home.corruptProgress}
          dismissLabel={copy.home.dismiss}
          onDismiss={dismissCorruption}
        />
      ) : null}

      {!persistenceAvailable ? (
        <Notice
          tone="warning"
          title={copy.home.persistenceWarningTitle}
          body={copy.home.persistenceWarningBody}
        />
      ) : null}

      <section className="course-hero" aria-labelledby="course-title">
        <div>
          <p className="course-hero__eyebrow">{copy.home.eyebrow}</p>
          <h1 id="course-title" className="course-hero__title">
            {copy.home.title}
          </h1>
          <p className="course-hero__lead">{copy.home.lead}</p>
        </div>
        <div className="course-hero__progress">
          <p className="course-hero__progress-summary">
            {copy.home.lessonsProgress(model.visitedLessonCount, model.totalLessonCount)}
          </p>
          <div className="course-hero__actions">
            <ActionLink
              variant="primary"
              to={lessonPath(continuationModule.id, continuation.id)}
            >
              {primaryLabel}
            </ActionLink>
            <ActionLink variant="secondary" to={routePaths.practice}>
              {copy.home.explorePractice}
            </ActionLink>
            <ActionButton
              variant="destructive"
              onClick={resetProgress}
              disabled={!canReset}
            >
              {copy.home.reset}
            </ActionButton>
          </div>
        </div>
      </section>

      <CourseMap model={model} />
    </main>
  );
}
