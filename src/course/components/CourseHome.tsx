import { useEffect, useRef, type ReactElement } from "react";
import { useLocation } from "react-router";
import { ActionButton, ActionLink } from "../../components/actions/Action";
import { Notice } from "../../components/Notice";
import { useLocale } from "../../i18n/LocaleContext";
import { lessonPath, routePaths } from "../../routing/routes";
import { courseLevelFromParam, courseLevelParam } from "../../routing/routePaths";
import { a1CanDosAuthored } from "../a1/catalog/canDos";
import { A1_AREAS } from "../a1/areas";
import { a2CanDoDescriptorCopy } from "../a2/catalog/canDos";
import { a2CanDosAuthored } from "../a2/catalog/catalog";
import { courseModulesByLevel } from "../data/course";
import { getCourseCopy } from "../i18n/catalog";
import { useProgress } from "../progress/ProgressContext";
import { visitedLessonIds, visitedLessonIdsForLevel } from "../progress/progress";
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

/**
 * Course home (design spec 5.7/6.1; extended level-aware for the A2 release
 * by Phase 3 Task 8). It reads the `livello` URL search param (missing/invalid
 * defaults to A1, so every bare `/percorso` A1 URL and its output stay stable),
 * renders the accessible {@link LevelSelector}, and shows the *selected*
 * level's own heading, area-aware/flat CourseMap as appropriate, truthful
 * Can-do evidence summary, and checkpoint attempt-state section. A1 and A2
 * evidence never cross-contaminate:
 * A1 reads the v3-compat `progress`/`canDoEvidence`/`checkpointAttempts`
 * surfaces (unchanged), while A2 reads its own `progressV4.levels.a2`. Nothing
 * here locks or blocks navigation to any level or lesson, or claims
 * certification, mastery, or that a level was "completed"/"passed" (3.1) --
 * every dynamic section reports only recorded evidence, and A2 is only ever
 * *recommended* as a soft, non-blocking hint after the A1 checkpoint.
 */
export function CourseHome(): ReactElement {
  const { locale } = useLocale();
  const copy = getCourseCopy(locale);
  const location = useLocation();
  const level = courseLevelFromParam(
    new URLSearchParams(location.search).get(courseLevelParam),
  );
  const levelIsA1 = level === "a1";

  const {
    progress,
    corrupted,
    persistenceAvailable,
    dismissCorruption,
    clearLevel,
    migrationNotice,
    acknowledgeMigrationNotice,
    canDoEvidence,
    checkpointAttempts,
    progressV4,
  } = useProgress();

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

  const modules = courseModulesByLevel[level];
  const lessons = modules.flatMap((courseModule) => courseModule.lessons);

  // The selected level's own progress source. A1 keeps reading the existing
  // v3-compat projection (so A1 output is byte-for-byte stable); A2 reads its
  // own, independent `levels.a2` slice.
  const a2LevelProgress = progressV4.levels.a2;
  const visitedIds = levelIsA1
    ? visitedLessonIds(progress)
    : visitedLessonIdsForLevel(a2LevelProgress);
  const lastVisitedLessonId = levelIsA1
    ? progress.lastVisitedLessonId
    : a2LevelProgress.lastVisitedLessonId;
  const lessonEvidenceMap = levelIsA1 ? progress.lessons : a2LevelProgress.lessons;

  const model = buildCourseMapModel(
    modules,
    visitedIds,
    lastVisitedLessonId,
    lessonEvidenceMap,
    levelIsA1 ? A1_AREAS : [],
  );

  const canDos = levelIsA1 ? a1CanDosAuthored : a2CanDosAuthored;
  const levelCanDoEvidence = levelIsA1 ? canDoEvidence : a2LevelProgress.canDos;
  const canDoSummary = buildCanDoSummaryModel(canDos, levelCanDoEvidence);
  const resolveDescriptor = (descriptorCopyId: string): string =>
    (levelIsA1 ? copy.objectives : a2CanDoDescriptorCopy[locale])[descriptorCopyId] ?? "";

  const levelCheckpointAttempts = levelIsA1
    ? checkpointAttempts
    : a2LevelProgress.checkpointAttempts;
  const latestCheckpointAttempt =
    levelCheckpointAttempts[levelCheckpointAttempts.length - 1] ?? null;

  // A2 is *recommended* (soft, non-blocking) once the A1 checkpoint has been
  // attempted -- derived from real A1 checkpoint evidence, never a lock.
  const a2Recommended = checkpointAttempts.length > 0;

  const badge = levelIsA1 ? copy.home.levelBadge : copy.courseLevels.a2Badge;
  const levelHeading = levelIsA1
    ? copy.courseLevels.a1Heading
    : copy.courseLevels.a2Heading;
  const checkpointHeading = levelIsA1
    ? copy.checkpoint.heading
    : copy.courseLevels.a2CheckpointHeading;
  const checkpointMet = latestCheckpointAttempt !== null;
  const checkpointBody = checkpointMet ? copy.checkpoint.met : copy.checkpoint.notMet;

  const continuationLessonId = model.recommendedLessonId ?? model.currentLessonId;
  const continuation =
    lessons.find((lesson) => lesson.id === continuationLessonId) ?? lessons[0];
  const continuationModule =
    modules.find((courseModule) => courseModule.id === continuation.moduleId) ??
    modules[0];

  const primaryLabel = model.allVisited
    ? copy.home.review
    : model.visitedLessonCount > 0
      ? copy.home.continue
      : copy.home.start;

  const canReset = visitedIds.length > 0 || lastVisitedLessonId !== null;

  // Level-scoped reset (ISSUE 3): the button always names the *selected* level
  // and clears only that level, leaving the other level's saved progress
  // untouched. `canReset` above is already computed from the selected level's
  // own visited/last-visited evidence, so the enabled state follows the
  // selected level too — never the other one.
  const levelLabel = levelIsA1 ? copy.courseLevels.a1 : copy.courseLevels.a2;
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
        a2Recommended={a2Recommended}
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
          {canDoSummary.items.map((item) => {
            const glyph = CAN_DO_TIER_GLYPH[item.tier];
            return (
              <li
                key={item.canDoId}
                className="can-do-summary__item"
                data-can-do-id={item.canDoId}
              >
                <span className="can-do-summary__descriptor">
                  {resolveDescriptor(item.descriptorCopyId)}
                </span>
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

      <CheckpointState
        heading={checkpointHeading}
        body={checkpointBody}
        linkLabel={copy.checkpoint.evidenceLink}
        linkTargetId="can-do-summary"
        met={checkpointMet}
      />

      {/*
        The selected level's own review queue (Phase 3 Task 8 spec-fix,
        BLOCKER 1). `ReviewQueue` reads `progressV4.levels[level]` for A2 and
        the A1 v3-compat projection for A1, resolving every entry against the
        selected level's catalog — it never reads the other level. Switching
        levels (or back/forward) re-renders it with the new `level`, swapping
        the surface. Its practice/resolve actions infer the owning level from
        each entry's lesson id, so an A2 entry is genuinely actionable.
      */}
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
