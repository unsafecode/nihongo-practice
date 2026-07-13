import { Link } from "react-router";
import { useLocale } from "../../i18n/LocaleContext";
import { chapters } from "../data/course";
import type { Lesson } from "../data/types";
import { getCourseCopy } from "../i18n/catalog";
import { completionPercent } from "../progress/progress";
import { useProgress } from "../progress/ProgressContext";
import { lessonPath } from "../../routing/routes";
import { ChapterCard } from "./ChapterCard";
import { RouteNotice } from "./RouteNotice";
import "../course.css";

const lessons = chapters.flatMap((chapter) => chapter.lessons);

function chapterFor(lesson: Lesson) {
  const chapter = chapters.find((item) => item.id === lesson.chapterId);
  if (!chapter) throw new Error(`Missing chapter for lesson ${lesson.id}`);
  return chapter;
}

export function CourseHome() {
  const { locale } = useLocale();
  const copy = getCourseCopy(locale);
  const { progress, corrupted, dismissCorruption, reset } = useProgress();
  const completed = new Set(progress.completedLessonIds);
  const firstIncomplete = lessons.find((lesson) => !completed.has(lesson.id));
  const lastVisited = lessons.find(
    (lesson) =>
      lesson.id === progress.lastVisitedLessonId && !completed.has(lesson.id),
  );
  const continuation = lastVisited ?? firstIncomplete ?? lessons[0];
  const continuationChapter = chapterFor(continuation);
  const completedCount = lessons.filter((lesson) => completed.has(lesson.id)).length;
  const percent = completionPercent(
    lessons.filter((lesson) => completed.has(lesson.id)).map((lesson) => lesson.id),
    lessons.length,
  );
  const allComplete = completedCount === lessons.length;

  const resetProgress = () => {
    if (window.confirm(copy.home.resetConfirm)) reset();
  };

  return (
    <main className="course-home">
      <RouteNotice />
      {corrupted ? (
        <div className="route-notice" role="status">
          <p>{copy.home.corruptProgress}</p>
          <button type="button" onClick={dismissCorruption}>
            {copy.home.dismiss}
          </button>
        </div>
      ) : null}

      <section className="course-hero" aria-labelledby="course-title">
        <div>
          <p className="course-eyebrow">{copy.home.eyebrow}</p>
          <h1 id="course-title">{copy.home.title}</h1>
          <p className="course-lead">{copy.home.lead}</p>
        </div>
        <div className="course-hero__progress">
          <p>
            <strong>{allComplete ? copy.home.completed : `${percent}%`}</strong>
            <span>
              {copy.home.lessonsProgress(
                completedCount,
                lessons.length,
              )}
            </span>
          </p>
          <div
            className="course-progress"
            role="progressbar"
            aria-label={copy.home.lessonsProgress(completedCount, lessons.length)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
          >
            <span style={{ width: `${percent}%` }} />
          </div>
          <Link
            className="course-primary-action"
            to={lessonPath(continuationChapter.id, continuation.id)}
          >
            {allComplete ? copy.home.review : copy.home.continue}
          </Link>
          <button
            className="course-reset"
            type="button"
            onClick={resetProgress}
            disabled={
              completedCount === 0 && progress.lastVisitedLessonId === null
            }
          >
            {copy.home.reset}
          </button>
        </div>
      </section>

      <section className="chapter-grid" aria-label={copy.home.eyebrow}>
        {chapters.map((chapter) => (
          <ChapterCard
            key={chapter.id}
            chapter={chapter}
            completedLessonIds={completed}
          />
        ))}
      </section>
    </main>
  );
}
