import type { ReactElement } from "react";
import { Notice } from "../../components/Notice";
import { useLocale } from "../../i18n/LocaleContext";
import type { CourseModule } from "../data/types";
import { getCourseCopy } from "../i18n/catalog";
import type { CourseMapModel } from "./courseMapModel";
import { ModuleCard } from "./ModuleCard";

export interface CourseMapProps {
  model: CourseMapModel<CourseModule>;
}

/**
 * The course map (Phase 2 Task 6, design spec §6/§17): a single ordered
 * path of the twelve A1 modules, each holding its lessons as a `ModuleCard`.
 * The A1 release has no phase concept, so — unlike the legacy phase-banded
 * map — this is one flat, accessible list in course order. Exactly the
 * recommended module (or, once every lesson is visited, the recognized
 * current/capstone module) starts expanded; nothing here locks or blocks
 * navigation to any lesson.
 */
export function CourseMap({ model }: CourseMapProps): ReactElement {
  const { locale } = useLocale();
  const copy = getCourseCopy(locale);
  const expandedModuleId = model.recommendedModuleId ?? model.currentModuleId;

  return (
    <section className="course-map" aria-label={copy.courseMap.heading}>
      <h2 className="course-map__heading">{copy.courseMap.heading}</h2>

      {model.allVisited ? (
        <Notice
          tone="info"
          title={copy.courseMap.revisitTitle}
          body={copy.courseMap.revisitBody}
        />
      ) : null}

      <div className="course-map__modules">
        {model.modules.map((entry) => (
          <ModuleCard
            key={entry.module.id}
            entry={entry}
            initiallyExpanded={entry.module.id === expandedModuleId}
            recommendedLessonId={model.recommendedLessonId}
          />
        ))}
      </div>
    </section>
  );
}
