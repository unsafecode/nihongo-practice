import { Link } from "react-router";
import { Icon } from "../../components/icons/Icon";
import { useLocale } from "../../i18n/LocaleContext";
import { lessonPath } from "../../routing/routes";
import type { CourseModule } from "../data/types";
import { getCourseCopy } from "../i18n/catalog";

interface ChapterCardProps {
  courseModule: CourseModule;
  visitedLessonIds: ReadonlySet<string>;
}

export function ChapterCard({
  courseModule,
  visitedLessonIds,
}: ChapterCardProps) {
  const { locale } = useLocale();
  const copy = getCourseCopy(locale);
  const moduleCopy = copy.modules[courseModule.id];
  const outcome = courseModule.outcomeCopyIds
    .map((id) => copy.outcomes[id])
    .join(" ");
  const visited = courseModule.lessons.filter((lesson) =>
    visitedLessonIds.has(lesson.id)
  ).length;
  const total = courseModule.lessons.length;
  const done = visited === total;
  const target =
    courseModule.lessons.find((lesson) => !visitedLessonIds.has(lesson.id)) ??
    courseModule.lessons[0];
  const progressLabel = copy.home.lessonsProgress(visited, total);

  return (
    <article className={`chapter-card${done ? " is-visited" : ""}`}>
      <div className="chapter-card__meta">
        <Icon id={courseModule.iconId} decorative size="small" />
        <span>{String(courseModule.order).padStart(2, "0")}</span>
        {done ? <span className="chapter-card__check" aria-hidden="true">✓</span> : null}
      </div>
      <h2>{moduleCopy.title}</h2>
      <p>{outcome}</p>
      <div className="chapter-card__footer">
        <div>
          <span>{progressLabel}</span>
          <div
            className="course-progress course-progress--small"
            role="progressbar"
            aria-label={progressLabel}
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={visited}
          >
            <span style={{ width: `${(visited / total) * 100}%` }} />
          </div>
        </div>
        <Link
          to={lessonPath(courseModule.id, target.id)}
          aria-label={`${done ? copy.home.review : copy.home.start}: ${moduleCopy.title}; ${progressLabel}`}
        >
          {done ? copy.home.review : copy.home.start}
        </Link>
      </div>
    </article>
  );
}
