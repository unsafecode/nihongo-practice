import { useEffect } from "react";
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from "react-router";
import { Notice } from "../../components/Notice";
import { SpeechNotice } from "../../components/SpeechNotice";
import { useSpeech } from "../../hooks/useSpeech";
import { useLocale } from "../../i18n/LocaleContext";
import {
  LESSON_SECTION_ANCHOR_CLASS,
  lessonSectionAnchorId,
} from "../../routing/lessonSections";
import { lessonPath, routePaths } from "../../routing/routes";
import { courseModules } from "../data/course";
import { getCourseCopy } from "../i18n/catalog";
import {
  isLegacyModuleRedirectState,
  LEGACY_MODULE_REDIRECT_STATE,
  resolveLessonRoute,
} from "../routing/lessonRouteResolution";
import { useProgress } from "../progress/ProgressContext";
import { LessonBlock } from "./LessonBlock";
import { LessonSidebar } from "./LessonSidebar";

const orderedLessons = courseModules.flatMap((courseModule) =>
  courseModule.lessons.map((lesson) => ({ courseModule, lesson })),
);

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
  const { progress, markVisited } = useProgress();
  const resolution = resolveLessonRoute(moduleId, lessonId, courseModules);

  useEffect(() => {
    if (resolution.kind === "match") markVisited(resolution.lesson.id);
  }, [resolution, markVisited]);

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
        state={LEGACY_MODULE_REDIRECT_STATE}
      />
    );
  }

  const { courseModule, lesson } = resolution;
  const showLegacyModuleNotice = isLegacyModuleRedirectState(location.state);

  const currentIndex = orderedLessons.findIndex(
    (item) => item.lesson.id === lesson.id,
  );
  const previous = orderedLessons[currentIndex - 1];
  const next = orderedLessons[currentIndex + 1];
  const visited = new Set(progress.visitedLessonIds);
  const lessonCopy = copy.lessons[lesson.titleCopyId];
  const objective = lesson.objectiveCopyIds
    .map((id) => copy.objectives[id])
    .join(" ");

  return (
    <main className="lesson-layout">
      <LessonSidebar
        courseModule={courseModule}
        currentLessonId={lesson.id}
        visitedLessonIds={visited}
      />

      <article className="lesson-main">
        <header className="lesson-header">
          <p className="course-eyebrow">
            {copy.lesson.modulePosition(courseModule.order, courseModules.length)}
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

        <SpeechNotice
          supported={supported}
          japaneseVoiceAvailable={japaneseVoiceAvailable}
          playbackFailed={playbackFailed}
        />

        <div className="lesson-blocks">
          {lesson.sections.map((section) => (
            <section
              key={section.id}
              id={lessonSectionAnchorId(section.id)}
              className={LESSON_SECTION_ANCHOR_CLASS}
            >
              {section.blocks.map((block, index) => (
                <LessonBlock key={`${block.copyId}-${index}`} block={block} />
              ))}
            </section>
          ))}
        </div>

        <footer className="lesson-footer">
          <div>
            {previous ? (
              <Link
                to={lessonPath(previous.courseModule.id, previous.lesson.id)}
              >
                ← {copy.lesson.previous}
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link to={lessonPath(next.courseModule.id, next.lesson.id)}>
                {copy.lesson.next} →
              </Link>
            ) : (
              <span />
            )}
          </div>
        </footer>
      </article>
    </main>
  );
}
