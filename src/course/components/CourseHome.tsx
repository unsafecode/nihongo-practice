import type { ReactElement } from "react";
import { ActionButton, ActionLink } from "../../components/actions/Action";
import { Notice } from "../../components/Notice";
import { useLocale } from "../../i18n/LocaleContext";
import { lessonPath, routePaths } from "../../routing/routes";
import { a1CanDosAuthored } from "../a1/catalog/canDos";
import { courseModules } from "../data/course";
import { getCourseCopy } from "../i18n/catalog";
import { useProgress } from "../progress/ProgressContext";
import { visitedLessonIds } from "../progress/progress";
import { buildCanDoSummaryModel } from "./canDoSummaryModel";
import { buildCourseMapModel } from "./courseMapModel";
import { CourseMap } from "./CourseMap";
import { RouteNotice } from "./RouteNotice";
import "../course.css";

const lessons = courseModules.flatMap((courseModule) => courseModule.lessons);

const canDoEvidenceTierCopyKey = {
  "not-started": "tierNotStarted",
  visited: "tierVisited",
  practiced: "tierPracticed",
  demonstrated: "tierDemonstrated",
} as const;

/**
 * Course home (design spec §5.7/§6.1, extended for the A1 release by Phase 2
 * Task 6): a bounded "editoriale mnemonico" hero (title, eyebrow, lead,
 * A1/JF-CEFR alignment badge, fixed course shape, visited progress, primary
 * + secondary actions), the one-time v3→v4 migration notice/help, the
 * flat CourseMap, a truthful Can-do evidence summary, and the A1 checkpoint
 * attempt-state section. Replaces the old uniform chapter grid and raw
 * status markup - all route/reset/storage/migration status uses the Task 1
 * `Notice`/Action primitives, and nothing here locks or blocks navigation to
 * any lesson or claims certification, mastery, or that A1 was "completed" or
 * "passed" (§3.1) — every dynamic section reports only recorded evidence.
 */
export function CourseHome(): ReactElement {
  const { locale } = useLocale();
  const copy = getCourseCopy(locale);
  const {
    progress,
    corrupted,
    persistenceAvailable,
    dismissCorruption,
    reset,
    migrationNotice,
    acknowledgeMigrationNotice,
    canDoEvidence,
    checkpointAttempts,
  } = useProgress();
  const visitedIds = visitedLessonIds(progress);

  const model = buildCourseMapModel(
    courseModules,
    visitedIds,
    progress.lastVisitedLessonId,
    progress.lessons,
  );

  const canDoSummary = buildCanDoSummaryModel(a1CanDosAuthored, canDoEvidence);
  const latestCheckpointAttempt = checkpointAttempts[checkpointAttempts.length - 1] ?? null;

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

      {migrationNotice && migrationNotice.acknowledgedAt === null ? (
        <Notice
          tone="info"
          title={copy.progressMigration.noticeTitle}
          body={copy.progressMigration.noticeBody}
          dismissLabel={copy.progressMigration.acknowledge}
          onDismiss={acknowledgeMigrationNotice}
        />
      ) : null}

      <section className="course-hero" aria-labelledby="course-title">
        <div>
          <p className="course-hero__eyebrow">{copy.home.eyebrow}</p>
          <h1 id="course-title" className="course-hero__title">
            {copy.home.title}
          </h1>
          <p className="course-hero__lead">{copy.home.lead}</p>
          <p className="course-hero__badge">{copy.home.levelBadge}</p>
          <p className="course-hero__shape">
            {copy.home.courseShape(courseModules.length, lessons.length)}
          </p>
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

      <section className="can-do-summary" aria-labelledby="can-do-summary-heading">
        <h2 id="can-do-summary-heading" className="can-do-summary__heading">
          {copy.canDoSummary.heading}
        </h2>
        <p className="can-do-summary__count" role="status">
          {copy.canDoSummary.demonstratedCount(
            canDoSummary.demonstratedCount,
            canDoSummary.totalCount,
          )}
        </p>
        <ul className="can-do-summary__list">
          {canDoSummary.items.map((item) => (
            <li key={item.canDoId} className="can-do-summary__item">
              <span className="can-do-summary__descriptor">
                {copy.objectives[item.descriptorCopyId]}
              </span>
              <span
                className={`can-do-summary__tier can-do-summary__tier--${item.tier}`}
              >
                {copy.canDoSummary[canDoEvidenceTierCopyKey[item.tier]]}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="checkpoint-state" aria-labelledby="checkpoint-state-heading">
        <h2 id="checkpoint-state-heading" className="checkpoint-state__heading">
          {copy.checkpoint.heading}
        </h2>
        <p className="checkpoint-state__body" role="status">
          {latestCheckpointAttempt
            ? copy.checkpoint.attemptedBody(
                latestCheckpointAttempt.acceptedExerciseIds.length,
                latestCheckpointAttempt.sampledCanDoIds.length,
              )
            : copy.checkpoint.notAttemptedBody}
        </p>
      </section>

      {migrationNotice ? (
        <section
          className="progress-migration-help"
          aria-labelledby="progress-migration-help-heading"
        >
          <h2
            id="progress-migration-help-heading"
            className="progress-migration-help__heading"
          >
            {copy.progressMigration.helpTitle}
          </h2>
          <p className="progress-migration-help__body">
            {copy.progressMigration.helpBody}
          </p>
        </section>
      ) : null}
    </main>
  );
}

