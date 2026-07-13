import { Link } from "react-router";
import { useLocale } from "../../i18n/LocaleContext";
import { lessonPath } from "../../routing/routes";
import type { Chapter } from "../data/types";
import { getCourseCopy } from "../i18n/catalog";

interface ChapterCardProps {
  chapter: Chapter;
  completedLessonIds: ReadonlySet<string>;
}

export function ChapterCard({
  chapter,
  completedLessonIds,
}: ChapterCardProps) {
  const { locale } = useLocale();
  const copy = getCourseCopy(locale);
  const chapterCopy = copy.chapters[chapter.id];
  const completed = chapter.lessons.filter((lesson) =>
    completedLessonIds.has(lesson.id)
  ).length;
  const total = chapter.lessons.length;
  const done = completed === total;
  const target =
    chapter.lessons.find((lesson) => !completedLessonIds.has(lesson.id)) ??
    chapter.lessons[0];
  const progressLabel = copy.home.lessonsProgress(completed, total);

  return (
    <article className={`chapter-card${done ? " is-complete" : ""}`}>
      <div className="chapter-card__meta">
        <span aria-hidden="true">{chapter.emoji}</span>
        <span>{String(chapter.order).padStart(2, "0")}</span>
        {done ? <span className="chapter-card__check" aria-hidden="true">✓</span> : null}
      </div>
      <h2>{chapterCopy.title}</h2>
      <p>{chapterCopy.description}</p>
      <div className="chapter-card__footer">
        <div>
          <span>{progressLabel}</span>
          <div
            className="course-progress course-progress--small"
            role="progressbar"
            aria-label={progressLabel}
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={completed}
          >
            <span style={{ width: `${(completed / total) * 100}%` }} />
          </div>
        </div>
        <Link
          to={lessonPath(chapter.id, target.id)}
          aria-label={`${done ? copy.home.review : copy.home.start}: ${chapterCopy.title}; ${progressLabel}`}
        >
          {done ? copy.home.review : copy.home.start}
        </Link>
      </div>
    </article>
  );
}
