import type { ReactElement } from "react";
import { Link } from "react-router";
import { lessonPath } from "../../../routing/routePaths";
import { courseModulesByLevel } from "../../data/course";
import type { A1CurriculumViewModel } from "../../a1/curriculum/buildA1CurriculumViewModel";
import type { CourseCopy } from "../../i18n/types";

export interface A1LessonOverviewProps {
  readonly overview: A1CurriculumViewModel["overview"];
  readonly copy: CourseCopy["a1Lesson"]["overview"];
}

function prerequisitePath(lessonId: string): string | null {
  const module = courseModulesByLevel.a1.find((courseModule) =>
    courseModule.lessons.some((lesson) => lesson.id === lessonId),
  );
  return module ? lessonPath(module.id, lessonId) : null;
}

export function A1LessonOverview({
  overview,
  copy,
}: A1LessonOverviewProps): ReactElement {
  return (
    <div className="a1-lesson-overview">
      <dl className="a1-lesson-overview__details">
        <div>
          <dt>{copy.canDoLabel}</dt>
          <dd>{overview.canDo}</dd>
        </div>
        <div>
          <dt>{copy.situationLabel}</dt>
          <dd>{overview.situation}</dd>
        </div>
      </dl>
      <nav
        className="a1-lesson-overview__prerequisites"
        aria-label={copy.prerequisitesLabel}
      >
        <h3>{copy.prerequisitesLabel}</h3>
        <ul>
          {overview.prerequisites.map((prerequisite) => {
            const to = prerequisitePath(prerequisite.id);
            return (
              <li key={prerequisite.id}>
                {to ? (
                  <Link to={to}>{prerequisite.title}</Link>
                ) : (
                  prerequisite.title
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
