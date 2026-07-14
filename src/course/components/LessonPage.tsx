import { useEffect } from "react";
import {
  Link,
  Navigate,
  useLocation,
  useParams,
} from "react-router";
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
import { useProgress } from "../progress/ProgressContext";
import { LessonBlock } from "./LessonBlock";
import { LessonSidebar } from "./LessonSidebar";

const orderedLessons = courseModules.flatMap((courseModule) =>
  courseModule.lessons.map((lesson) => ({ courseModule, lesson })),
);

export function LessonPage() {
  // The `:moduleId` segment is cosmetic only (see routePaths.ts): a lesson
  // is looked up by its own stable id across every module so old bookmarked
  // URLs still resolve even where the module id in the path has changed.
  const { lessonId } = useParams<{ moduleId: string; lessonId: string }>();
  const location = useLocation();
  const { locale } = useLocale();
  const copy = getCourseCopy(locale);
  const { supported, japaneseVoiceAvailable, playbackFailed } = useSpeech();
  const { progress, markVisited } = useProgress();
  const entry = orderedLessons.find((item) => item.lesson.id === lessonId);
  const courseModule = entry?.courseModule;
  const lesson = entry?.lesson;

  useEffect(() => {
    if (lesson) markVisited(lesson.id);
  }, [lesson, markVisited]);

  if (!courseModule || !lesson) {
    return (
      <Navigate
        replace
        to={routePaths.course}
        state={{ invalidPath: location.pathname }}
      />
    );
  }

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
