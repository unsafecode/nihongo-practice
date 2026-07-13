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
import { lessonPath, routePaths } from "../../routing/routes";
import { chapters } from "../data/course";
import { getCourseCopy } from "../i18n/catalog";
import { useProgress } from "../progress/ProgressContext";
import { LessonBlock } from "./LessonBlock";
import { LessonSidebar } from "./LessonSidebar";

const orderedLessons = chapters.flatMap((chapter) =>
  chapter.lessons.map((lesson) => ({ chapter, lesson })),
);

export function LessonPage() {
  const { chapterId, lessonId } = useParams<{
    chapterId: string;
    lessonId: string;
  }>();
  const location = useLocation();
  const { locale } = useLocale();
  const copy = getCourseCopy(locale);
  const { supported, japaneseVoiceAvailable, playbackFailed } = useSpeech();
  const { progress, markVisited, setComplete } = useProgress();
  const chapter = chapters.find((item) => item.id === chapterId);
  const lesson = chapter?.lessons.find((item) => item.id === lessonId);

  useEffect(() => {
    if (lesson) markVisited(lesson.id);
  }, [lesson, markVisited]);

  if (!chapter || !lesson) {
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
  const completed = new Set(progress.completedLessonIds);
  const isComplete = completed.has(lesson.id);
  const lessonCopy = copy.lessons[lesson.id];

  return (
    <main className="lesson-layout">
      <LessonSidebar
        chapter={chapter}
        currentLessonId={lesson.id}
        completedLessonIds={completed}
      />

      <article className="lesson-main">
        <header className="lesson-header">
          <p className="course-eyebrow">
            {copy.lesson.chapterPosition(chapter.order, chapters.length)}
          </p>
          <h1>{lessonCopy.title}</h1>
          <p>{lessonCopy.lead}</p>
        </header>

        <SpeechNotice
          supported={supported}
          japaneseVoiceAvailable={japaneseVoiceAvailable}
          playbackFailed={playbackFailed}
        />

        <div className="lesson-blocks">
          {lesson.blocks.map((block, index) => (
            <LessonBlock key={`${block.copyId}-${index}`} block={block} />
          ))}
        </div>

        <footer className="lesson-footer">
          <div>
            {previous ? (
              <Link to={lessonPath(previous.chapter.id, previous.lesson.id)}>
                ← {copy.lesson.previous}
              </Link>
            ) : <span />}
            {next ? (
              <Link to={lessonPath(next.chapter.id, next.lesson.id)}>
                {copy.lesson.next} →
              </Link>
            ) : <span />}
          </div>
          <button
            type="button"
            className={isComplete ? "course-secondary-action" : "course-primary-action"}
            aria-pressed={isComplete}
            onClick={() => setComplete(lesson.id, !isComplete)}
          >
            {isComplete ? copy.lesson.undoComplete : copy.lesson.complete}
          </button>
        </footer>
      </article>
    </main>
  );
}
