import { useEffect } from "react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router";
import { ActionLink } from "../../components/actions/Action";
import { Icon } from "../../components/icons/Icon";
import { Notice } from "../../components/Notice";
import { SpeechNotice } from "../../components/SpeechNotice";
import { useSpeech } from "../../hooks/useSpeech";
import { useLocale } from "../../i18n/LocaleContext";
import {
  A1_LESSON_SECTION_IDS,
  A2_LESSON_SECTION_IDS,
  LESSON_SECTION_ANCHOR_CLASS,
  isA1LessonSectionId,
  isA2LessonSectionId,
  lessonSectionAnchorId,
  type LessonSectionId,
} from "../../routing/lessonSections";
import { lessonPath, routePaths } from "../../routing/routes";
import { courseModulesByLevel } from "../data/course";
import type { CourseModule } from "../data/types";
import { A2_MODULE_IDS } from "../a2/manifest";
import { getCourseCopy } from "../i18n/catalog";
import {
  isLegacyConsolidatedRedirectState,
  isLegacyModuleRedirectState,
  LEGACY_CONSOLIDATED_REDIRECT_STATE,
  LEGACY_MODULE_REDIRECT_STATE,
  resolveLessonRoute,
} from "../routing/lessonRouteResolution";
import { useProgress } from "../progress/ProgressContext";
import { A1LessonSection } from "./A1LessonPage";
import { A2LessonSection } from "./A2LessonPage";
import { LessonRail } from "./LessonRail";
import { useActiveSection } from "./useActiveSection";

/**
 * Resolves which level (and therefore which module set + section renderer) a
 * lesson URL belongs to (Phase 3 Task 8). A2 module ids are disjoint from
 * A1's, so an A2 module id in the URL selects the A2 course + A2 renderer;
 * everything else (including A1 legacy module aliases) resolves against A1.
 */
const a2ModuleIdSet = new Set<string>(A2_MODULE_IDS);

function levelForModule(moduleId: string | undefined): "a1" | "a2" {
  return moduleId !== undefined && a2ModuleIdSet.has(moduleId) ? "a2" : "a1";
}

const orderedLessonsByLevel: Readonly<
  Record<"a1" | "a2", readonly { courseModule: CourseModule; lesson: CourseModule["lessons"][number] }[]>
> = {
  a1: courseModulesByLevel.a1.flatMap((courseModule) =>
    courseModule.lessons.map((lesson) => ({ courseModule, lesson })),
  ),
  a2: courseModulesByLevel.a2.flatMap((courseModule) =>
    courseModule.lessons.map((lesson) => ({ courseModule, lesson })),
  ),
};

export function LessonPage() {
  // The URL's `:moduleId` segment must name either the lesson's real
  // module or a recognized legacy alias for it (see
  // routing/lessonRouteResolution.ts): a lesson is never accepted by its
  // `lessonId` alone, so a mismatched module (e.g. an unrelated module
  // paired with someone else's lesson) resolves invalid instead of
  // silently rendering the wrong module's lesson.
  const { moduleId, lessonId } = useParams<{
    moduleId: string;
    lessonId: string;
  }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { locale } = useLocale();
  const copy = getCourseCopy(locale);
  const { supported, japaneseVoiceAvailable, playbackFailed } = useSpeech();
  const { markVisited } = useProgress();
  // The A2 module ids are disjoint from A1's, so the URL's module segment
  // selects the level: an A2 module resolves against the A2 course and renders
  // through the A2 section renderer, everything else against A1 (unchanged).
  const level = levelForModule(moduleId);
  const sectionIds: readonly LessonSectionId[] =
    level === "a2" ? A2_LESSON_SECTION_IDS : A1_LESSON_SECTION_IDS;
  const activeSectionId = useActiveSection(sectionIds);
  const modules = courseModulesByLevel[level];
  const orderedLessons = orderedLessonsByLevel[level];
  const resolution = resolveLessonRoute(moduleId, lessonId, modules);
  // A stable primitive derived from `resolution`, used (instead of the
  // `resolution` object itself, which is a fresh reference every render) as
  // the effect dependency below: it only actually changes when the matched
  // lesson changes, so the effect - and the markVisited call it makes -
  // does not re-run every render even though `resolution` always does.
  const matchedLessonId = resolution.kind === "match" ? resolution.lesson.id : null;

  useEffect(() => {
    if (matchedLessonId !== null) markVisited(matchedLessonId);
  }, [matchedLessonId, markVisited]);

  if (resolution.kind === "invalid") {
    return (
      <Navigate
        replace
        to={routePaths.course}
        state={{ invalidPath: location.pathname }}
      />
    );
  }

  if (resolution.kind === "redirect") {
    return (
      <Navigate
        replace
        to={lessonPath(resolution.courseModule.id, resolution.lesson.id)}
        state={
          resolution.consolidated
            ? LEGACY_CONSOLIDATED_REDIRECT_STATE
            : resolution.moduleChanged
              ? LEGACY_MODULE_REDIRECT_STATE
              : undefined
        }
      />
    );
  }

  const { courseModule, lesson } = resolution;
  const showLegacyModuleNotice = isLegacyModuleRedirectState(location.state);
  const showConsolidatedNotice = isLegacyConsolidatedRedirectState(
    location.state,
  );

  const currentIndex = orderedLessons.findIndex(
    (item) => item.lesson.id === lesson.id,
  );
  const previous = orderedLessons[currentIndex - 1];
  const next = orderedLessons[currentIndex + 1];
  const lessonCopy = copy.lessons[lesson.titleCopyId];
  const objective = lesson.objectiveCopyIds
    .map((id) => copy.objectives[id])
    .join(" ");

  const renderSectionBody = (sectionId: LessonSectionId) => {
    if (level === "a2") {
      return isA2LessonSectionId(sectionId) ? (
        <A2LessonSection lessonId={lesson.id} sectionId={sectionId} />
      ) : null;
    }
    return isA1LessonSectionId(sectionId) ? (
      <A1LessonSection lessonId={lesson.id} sectionId={sectionId} />
    ) : null;
  };

  const sectionLabel = (sectionId: LessonSectionId): string =>
    level === "a2" && isA2LessonSectionId(sectionId)
      ? copy.lesson.sections[sectionId]
      : isA1LessonSectionId(sectionId)
        ? copy.a1Lesson.sections[sectionId]
        : "";

  return (
    <main className="lesson-layout">
      <LessonRail
        moduleId={courseModule.id}
        lessonId={lesson.id}
        level={level}
        sections={sectionIds}
        activeSectionId={activeSectionId}
      />

      <article className="lesson-main">
        <header className="lesson-header">
          <p className="course-eyebrow lesson-header__eyebrow">
            <Icon id={courseModule.iconId} size="small" decorative />
            {copy.lesson.modulePosition(
              courseModule.order,
              modules.length,
            )}
          </p>
          <h1>{lessonCopy.title}</h1>
          <p>{objective}</p>
        </header>

        {showLegacyModuleNotice ? (
          <Notice
            tone="info"
            title={copy.lesson.legacyModuleNoticeTitle}
            body={copy.lesson.legacyModuleNoticeBody}
            dismissLabel={copy.home.dismiss}
            onDismiss={() =>
              navigate(
                { pathname: location.pathname, search: location.search },
                { replace: true, state: null },
              )
            }
          />
        ) : null}

        {showConsolidatedNotice ? (
          <Notice
            tone="info"
            title={copy.lesson.legacyLessonConsolidatedNoticeTitle}
            body={copy.lesson.legacyLessonConsolidatedNoticeBody}
            dismissLabel={copy.home.dismiss}
            onDismiss={() =>
              navigate(
                { pathname: location.pathname, search: location.search },
                { replace: true, state: null },
              )
            }
          />
        ) : null}

        <SpeechNotice
          supported={supported}
          japaneseVoiceAvailable={japaneseVoiceAvailable}
          playbackFailed={playbackFailed}
        />

        <div className="lesson-sections">
          {sectionIds.map((sectionId) => {
            const headingId = `${lessonSectionAnchorId(sectionId)}-heading`;
            return (
              <section
                key={sectionId}
                id={lessonSectionAnchorId(sectionId)}
                className={`lesson-section ${LESSON_SECTION_ANCHOR_CLASS}`}
                aria-labelledby={headingId}
              >
                <h2 id={headingId} className="lesson-section__landmark">
                  {sectionLabel(sectionId)}
                </h2>
                {renderSectionBody(sectionId)}
              </section>
            );
          })}
        </div>

        <footer className="lesson-footer">
          {previous ? (
            <ActionLink
              variant="secondary"
              to={lessonPath(previous.courseModule.id, previous.lesson.id)}
            >
              ← {copy.lesson.previous}
            </ActionLink>
          ) : (
            <span />
          )}
          <ActionLink variant="inline" to={routePaths.course}>
            {copy.lesson.map}
          </ActionLink>
          {next ? (
            <ActionLink
              variant="primary"
              to={lessonPath(next.courseModule.id, next.lesson.id)}
            >
              {copy.lesson.next} →
            </ActionLink>
          ) : (
            <span />
          )}
        </footer>
      </article>
    </main>
  );
}
