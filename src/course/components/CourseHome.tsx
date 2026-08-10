import { useEffect, useRef, type ReactElement } from "react";
import { useLocation } from "react-router";
import { ActionButton, ActionLink } from "../../components/actions/Action";
import { Notice } from "../../components/Notice";
import { useLocale } from "../../i18n/LocaleContext";
import { browserStorage } from "../../settings/storage";
import { lessonPath, routePaths } from "../../routing/routes";
import { courseLevelParam } from "../../routing/routePaths";
import { getCourseCopy } from "../i18n/catalog";
import { LEVEL_RUNTIME_CONFIG } from "../levels/runtimeConfig";
import {
  courseLevelEvidence,
  parseExplicitCourseLevel,
  readCourseLevelPreference,
  resolveCourseLevel,
} from "../levels/selection";
import { useProgress } from "../progress/ProgressContext";
import { visitedLessonIdsForLevel } from "../progress/progress";
import { buildCanDoSummaryModel } from "./canDoSummaryModel";
import { buildCourseMapModel } from "./courseMapModel";
import { CheckpointState } from "./CheckpointState";
import { CourseMap } from "./CourseMap";
import { LevelSelector } from "./LevelSelector";
import { ReviewQueue } from "./ReviewQueue";
import { RouteNotice } from "./RouteNotice";
import "../course.css";

const canDoEvidenceTierCopyKey = {
  "not-started": "tierNotStarted",
  visited: "tierVisited",
  practiced: "tierPracticed",
  demonstrated: "tierDemonstrated",
} as const;

/**
 * Can-do evidence-tier glyphs (M2/M3, quality-review Phase 2 Task 6),
 * unified with `LessonExercises.tsx`'s own `STATE_GLYPH` and `ModuleCard`'s
 * `LESSON_EVIDENCE_GLYPH` so the same shape always means the same evidence
 * tier everywhere in the app. `not-started` intentionally carries no glyph
 * (there is no evidence to depict yet). Rendered as an explicit
 * `aria-hidden` JSX span next to the always-visible tier text — never
 * injected only via a CSS `::before` pseudo-element, which assistive
 * technology (and anything reading the DOM/accessibility tree rather than
 * painted pixels) would never see at all.
 */
const CAN_DO_TIER_GLYPH: Partial<Record<keyof typeof canDoEvidenceTierCopyKey, string>> = {
  visited: "\u25CB",
  practiced: "\u25D0",
  demonstrated: "\u25CF",
};

export function CourseHome(): ReactElement {
  const { locale } = useLocale();
  const copy = getCourseCopy(locale);
  const location = useLocation();
  const explicit = parseExplicitCourseLevel(
    new URLSearchParams(location.search).get(courseLevelParam),
  );

  const {
    corrupted,
    persistenceAvailable,
    dismissCorruption,
    clearLevel,
    migrationNotice,
    acknowledgeMigrationNotice,
    progressV5,
    mutationError,
    clearMutationError,
  } = useProgress();
  const preference = readCourseLevelPreference(browserStorage());
  const evidence = courseLevelEvidence(progressV5);
  const level = resolveCourseLevel({ explicit, preference, evidence });
  const config = LEVEL_RUNTIME_CONFIG[level];

  // Move focus to the selected level's heading whenever the level changes
  // (never on the initial render), so a keyboard/AT user lands in the newly
  // selected level's content instead of being left on the link they clicked.
  const headingRef = useRef<HTMLHeadingElement>(null);
  const previousLevelRef = useRef(level);
  useEffect(() => {
    if (previousLevelRef.current !== level) {
      previousLevelRef.current = level;
      headingRef.current?.focus();
    }
  }, [level]);

  const modules = config.modules;
  const lessons = modules.flatMap((courseModule) => courseModule.lessons);
  const levelProgress = progressV5.levels[config.progressLevel];
  const visitedIds = visitedLessonIdsForLevel(levelProgress);
  const lastVisitedLessonId = levelProgress.lastVisitedLessonId;
  const lessonEvidenceMap = levelProgress.lessons;

  const model = buildCourseMapModel(
    modules,
    visitedIds,
    lastVisitedLessonId,
    lessonEvidenceMap,
    config.areas,
  );

  const canDoSummary = buildCanDoSummaryModel(config.canDos, levelProgress.canDos);
  const canDoItems = canDoSummary.items.map((item) => ({
    item,
    descriptor: config.resolveDescriptor(locale, item.descriptorCopyId),
  }));
  const descriptorUnavailable = canDoItems.some(({ descriptor }) => descriptor === null);
  const levelCheckpointAttempts = levelProgress.checkpointAttempts;
  const latestCheckpointAttempt =
    levelCheckpointAttempts[levelCheckpointAttempts.length - 1] ?? null;

  const recommendedLevel =
    progressV5.levels.a1.checkpointAttempts.length > 0 ? "a2" : "a0";
  const badge = copy.courseLevels[config.copy.badgeKey];
  const levelHeading = copy.courseLevels[config.copy.headingKey];
  const checkpointHeading = copy.courseLevels[config.copy.checkpointHeadingKey];
  const checkpointMet = latestCheckpointAttempt !== null;
  const levelLabel = copy.courseLevels[config.copy.shortLabelKey];
  const checkpointBody = checkpointMet
    ? copy.courseLevels.checkpointAttemptRecorded(levelLabel)
    : copy.courseLevels.checkpointNotAttempted(levelLabel);

  const continuationLessonId = model.recommendedLessonId ?? model.currentLessonId;
  const continuation =
    lessons.find((lesson) => lesson.id === continuationLessonId) ?? lessons[0];
  const continuationModule =
    modules.find((courseModule) => courseModule.id === continuation.moduleId) ??
    modules[0];

  let primaryLabel = copy.home.start;
  if (model.visitedLessonCount > 0) primaryLabel = copy.home.continue;
  if (model.allVisited) primaryLabel = copy.home.review;

  const canReset = visitedIds.length > 0 || lastVisitedLessonId !== null;

  const resetProgress = () => {
    if (window.confirm(copy.courseLevels.resetLevelConfirm(levelLabel)))
      clearLevel(level);
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

      {mutationError ? (
        <Notice
          tone="error"
          title={copy.progressMutation.title}
          body={copy.progressMutation.body(mutationError.lessonId)}
          dismissLabel={copy.progressMutation.dismiss}
          onDismiss={clearMutationError}
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
          <p className="course-hero__badge">{badge}</p>
          <p className="course-hero__shape">
            {copy.home.courseShape(modules.length, lessons.length)}
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
              {copy.courseLevels.resetLevel(levelLabel)}
            </ActionButton>
          </div>
        </div>
      </section>

      <LevelSelector
        level={level}
        recommendedLevel={recommendedLevel}
        copy={copy.courseLevels}
      />

      <h2
        ref={headingRef}
        id="course-level-heading"
        className="course-level-heading"
        tabIndex={-1}
      >
        {levelHeading}
      </h2>

      <CourseMap model={model} />

      {descriptorUnavailable ? (
        <Notice
          tone="warning"
          title={copy.courseLevels.descriptorUnavailableTitle}
          body={copy.courseLevels.descriptorUnavailableBody}
        />
      ) : (
        <section
          id="can-do-summary"
          className="can-do-summary"
          aria-labelledby="can-do-summary-heading"
          tabIndex={-1}
        >
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
            {canDoItems.map(({ item, descriptor }) => {
              const glyph = CAN_DO_TIER_GLYPH[item.tier];
              return (
                <li
                  key={item.canDoId}
                  className="can-do-summary__item"
                  data-can-do-id={item.canDoId}
                >
                  <span className="can-do-summary__descriptor">{descriptor}</span>
                  <span
                    className={`can-do-summary__tier can-do-summary__tier--${item.tier}`}
                  >
                    {glyph ? (
                      <>
                        <span className="can-do-summary__tier-glyph" aria-hidden="true">
                          {glyph}
                        </span>{" "}
                      </>
                    ) : null}
                    <span className="can-do-summary__tier-text">
                      {copy.canDoSummary[canDoEvidenceTierCopyKey[item.tier]]}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <CheckpointState
        heading={checkpointHeading}
        body={checkpointBody}
        linkLabel={copy.checkpoint.evidenceLink}
        linkTargetId="can-do-summary"
        met={checkpointMet}
      />

      <ReviewQueue level={level} />

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
