import { Link } from "react-router";
import { useLocale } from "../../i18n/LocaleContext";
import { lessonPath, routePaths } from "../../routing/routes";
import type { Chapter } from "../data/types";
import { chapters } from "../data/course";
import { getCourseCopy } from "../i18n/catalog";

interface LessonSidebarProps {
  chapter: Chapter;
  currentLessonId: string;
  completedLessonIds: ReadonlySet<string>;
}

export function LessonSidebar({
  chapter,
  currentLessonId,
  completedLessonIds,
}: LessonSidebarProps) {
  const { locale } = useLocale();
  const copy = getCourseCopy(locale);
  const chapterCopy = copy.chapters[chapter.id];
  const completed = chapter.lessons.filter((lesson) =>
    completedLessonIds.has(lesson.id)
  ).length;
  const progressLabel = copy.home.lessonsProgress(
    completed,
    chapter.lessons.length,
  );

  const content = () => (
    <>
      <Link className="lesson-sidebar__back" to={routePaths.course}>
        ← {copy.lesson.back}
      </Link>
      <p className="course-eyebrow">
        {copy.lesson.chapterPosition(chapter.order, chapters.length)}
      </p>
      <h2>{chapterCopy.title}</h2>
      <p>{chapterCopy.description}</p>
      <div
        className="course-progress course-progress--small"
        role="progressbar"
        aria-label={progressLabel}
        aria-valuemin={0}
        aria-valuemax={chapter.lessons.length}
        aria-valuenow={completed}
      >
        <span style={{ width: `${(completed / chapter.lessons.length) * 100}%` }} />
      </div>
      <ol className="lesson-sidebar__list">
        {chapter.lessons.map((lesson) => {
          const done = completedLessonIds.has(lesson.id);
          const current = lesson.id === currentLessonId;
          return (
            <li key={lesson.id} className={done ? "is-complete" : ""}>
              <Link
                to={lessonPath(chapter.id, lesson.id)}
                aria-current={current ? "page" : undefined}
              >
                <span aria-hidden="true">{done ? "✓" : lesson.order}</span>
                {copy.lessons[lesson.id].title}
              </Link>
            </li>
          );
        })}
      </ol>
    </>
  );

  return (
    <>
      <aside className="lesson-sidebar">{content()}</aside>
      <details className="lesson-sidebar-mobile">
        <summary>
          {copy.lesson.chapterPosition(chapter.order, chapters.length)} ·{" "}
          {chapterCopy.title}
        </summary>
        <div>{content()}</div>
      </details>
    </>
  );
}
