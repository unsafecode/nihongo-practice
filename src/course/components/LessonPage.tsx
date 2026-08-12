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
import { coursePathForLevel } from "../../routing/routePaths";
import { lessonPath, routePaths } from "../../routing/routes";
import type { CourseModule, Lesson } from "../data/types";
import { getCourseCopy } from "../i18n/catalog";
import { LEVEL_RUNTIME_CONFIG } from "../levels/runtimeConfig";
import { COURSE_LEVEL_IDS, type CourseLevelId } from "../levels/types";
import {
  isLegacyConsolidatedRedirectState,
  isLegacyModuleRedirectState,
  LEGACY_CONSOLIDATED_REDIRECT_STATE,
  LEGACY_MODULE_REDIRECT_STATE,
  levelOwningModule,
  resolveOwnedLessonRoute,
} from "../routing/lessonRouteResolution";
import { useProgress } from "../progress/ProgressContext";
import { A1LessonSection } from "./A1LessonPage";
import { A2LessonSection } from "./A2LessonPage";
import { BaseLessonSection } from "./BaseLessonPage";
import { LessonRail } from "./LessonRail";
import { useActiveSection } from "./useActiveSection";

interface LessonSectionRendererProps {
  readonly lessonId: string;
  readonly sectionId: LessonSectionId;
}

/**
 * One section renderer per published course level (Task 15). Total over
 * {@link CourseLevelId} — never a binary `a2 ? a2 : a1` guess — so adding a
 * level requires extending this table, not hoping every call site remembers
 * it. Base (`a0`) and A1 share the same six stable section ids; each level's
 * renderer still guards with its own type predicate and returns `null` for a
 * section id it does not use, exactly like the pre-existing A1/A2 renderers.
 */
const LESSON_SECTION_RENDERER_BY_LEVEL: Readonly<
  Record<CourseLevelId, (props: LessonSectionRendererProps) => ReturnType<typeof A1LessonSection> | null>
> = {
  a0: ({ lessonId, sectionId }) =>
    isA1LessonSectionId(sectionId) ? (
      <BaseLessonSection lessonId={lessonId} sectionId={sectionId} />
    ) : null,
  a1: ({ lessonId, sectionId }) =>
    isA1LessonSectionId(sectionId) ? (
      <A1LessonSection lessonId={lessonId} sectionId={sectionId} />
    ) : null,
  a2: ({ lessonId, sectionId }) =>
    isA2LessonSectionId(sectionId) ? (
      <A2LessonSection lessonId={lessonId} sectionId={sectionId} />
    ) : null,
};

/** Base and A1 render the same six stable section anchors; A2 keeps its four. */
const LESSON_SECTION_IDS_BY_LEVEL: Readonly<Record<CourseLevelId, readonly LessonSectionId[]>> = {
  a0: A1_LESSON_SECTION_IDS,
  a1: A1_LESSON_SECTION_IDS,
  a2: A2_LESSON_SECTION_IDS,
};

interface OrderedLessonEntry {
  readonly courseModule: CourseModule;
  readonly lesson: Lesson;
}

/**
 * Previous/next navigation for every level is exclusively that level's own
 * ordered lesson list (each level's runtime-config modules, flattened in
 * module order) — for Base this is exactly the 40-lesson canonical order
 * (`BASE_LESSON_IDS`), so a lesson at the end of one module (e.g.
 * `time-movement-4`) advances into the next module's first lesson
 * (`copula-adjectives-1`) instead of dead-ending at a module boundary, and it
 * never reaches into another level's lessons.
 */
const orderedLessonsByLevel: Readonly<Record<CourseLevelId, readonly OrderedLessonEntry[]>> =
  Object.fromEntries(
    COURSE_LEVEL_IDS.map((levelId) => [
      levelId,
      LEVEL_RUNTIME_CONFIG[levelId].modules.flatMap((courseModule) =>
        courseModule.lessons.map((lesson) => ({ courseModule, lesson })),
      ),
    ]),
  ) as unknown as Record<CourseLevelId, readonly OrderedLessonEntry[]>;

export function LessonPage() {
  // The URL's `:moduleId` segment must name either the lesson's real
  // module or a recognized legacy alias for it (see
  // routing/lessonRouteResolution.ts): a lesson is never accepted by its
  // `lessonId` alone, so a mismatched module (e.g. an unrelated module
  // paired with someone else's lesson) resolves invalid instead of
  // silently rendering the wrong module's lesson. An unrecognized module id
  // is likewise always invalid — it is never guessed as A1.
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
  // A pure guess of which level this URL's module belongs to, used only to
  // pick which section-id list to give the (unconditionally-called)
  // scrollspy hook below. It is never the source of truth for rendering —
  // `resolution.levelId` from `resolveOwnedLessonRoute` is — but for every
  // "match" outcome the two always agree, since both resolve module
  // ownership the same way. For an invalid/redirect outcome the guess (which
  // defaults to "a1" for an unrecognized/legacy module id) only affects this
  // transient scroll state; the page navigates away before rendering.
  const guessedLevelId: CourseLevelId =
    (moduleId && levelOwningModule(moduleId)) || "a1";
  const sectionIds = LESSON_SECTION_IDS_BY_LEVEL[guessedLevelId];
  const activeSectionId = useActiveSection(sectionIds);
  const resolution = resolveOwnedLessonRoute(moduleId, lessonId);
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

  const { levelId, courseModule, lesson } = resolution;
  const runtimeConfig = LEVEL_RUNTIME_CONFIG[levelId];
  const modules = runtimeConfig.modules;
  const orderedLessons = orderedLessonsByLevel[levelId];
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

  const renderSectionBody = (sectionId: LessonSectionId) =>
    LESSON_SECTION_RENDERER_BY_LEVEL[levelId]({ lessonId: lesson.id, sectionId });

  const sectionLabel = (sectionId: LessonSectionId): string => {
    if (levelId === "a2") {
      return isA2LessonSectionId(sectionId) ? copy.lesson.sections[sectionId] : "";
    }
    if (levelId === "a0") {
      return isA1LessonSectionId(sectionId) ? copy.baseLesson.sections[sectionId] : "";
    }
    return isA1LessonSectionId(sectionId) ? copy.a1Lesson.sections[sectionId] : "";
  };

  return (
    <main className="lesson-layout">
      <LessonRail
        moduleId={courseModule.id}
        lessonId={lesson.id}
        level={levelId}
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
          <ActionLink variant="inline" to={coursePathForLevel(levelId)}>
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
