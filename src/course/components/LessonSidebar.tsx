import { Link } from "react-router";
import { useLocale } from "../../i18n/LocaleContext";
import { lessonPath, routePaths } from "../../routing/routes";
import type { CourseModule } from "../data/types";
import { courseModules } from "../data/course";
import { getCourseCopy } from "../i18n/catalog";

interface LessonSidebarProps {
  courseModule: CourseModule;
  currentLessonId: string;
  visitedLessonIds: ReadonlySet<string>;
}

export function LessonSidebar({
  courseModule,
  currentLessonId,
  visitedLessonIds,
}: LessonSidebarProps) {
  const { locale } = useLocale();
  const copy = getCourseCopy(locale);
  const moduleCopy = copy.modules[courseModule.id];
  const outcome = courseModule.outcomeCopyIds
    .map((id) => copy.outcomes[id])
    .join(" ");
  const visited = courseModule.lessons.filter((lesson) =>
    visitedLessonIds.has(lesson.id)
  ).length;
  const progressLabel = copy.home.lessonsProgress(
    visited,
    courseModule.lessons.length,
  );

  const content = () => (
    <>
      <Link className="lesson-sidebar__back" to={routePaths.course}>
        ← {copy.lesson.back}
      </Link>
      <p className="course-eyebrow">
        {copy.lesson.modulePosition(courseModule.order, courseModules.length)}
      </p>
      <h2>{moduleCopy.title}</h2>
      <p>{outcome}</p>
      <div
        className="course-progress course-progress--small"
        role="progressbar"
        aria-label={progressLabel}
        aria-valuemin={0}
        aria-valuemax={courseModule.lessons.length}
        aria-valuenow={visited}
      >
        <span style={{ width: `${(visited / courseModule.lessons.length) * 100}%` }} />
      </div>
      <ol className="lesson-sidebar__list">
        {courseModule.lessons.map((lesson) => {
          const done = visitedLessonIds.has(lesson.id);
          const current = lesson.id === currentLessonId;
          return (
            <li key={lesson.id} className={done ? "is-visited" : ""}>
              <Link
                to={lessonPath(courseModule.id, lesson.id)}
                aria-current={current ? "page" : undefined}
              >
                <span aria-hidden="true">{done ? "✓" : lesson.order}</span>
                {copy.lessons[lesson.titleCopyId].title}
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
          {copy.lesson.modulePosition(courseModule.order, courseModules.length)} ·{" "}
          {moduleCopy.title}
        </summary>
        <div>{content()}</div>
      </details>
    </>
  );
}
