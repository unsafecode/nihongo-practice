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
 * The phase-based course map (design spec §4.2/§5.1-§5.4): a single
 * vertical path of four ordered phase bands (orient, build, navigate,
 * synthesize), each holding its modules as `ModuleCard`s. Exactly the
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

      {model.phases.map((phaseGroup) => {
        const phaseCopy = copy.courseMap.phases[phaseGroup.phaseId];
        const headingId = `course-phase-${phaseGroup.phaseId}-heading`;
        return (
          <section
            key={phaseGroup.phaseId}
            className="course-phase"
            aria-labelledby={headingId}
          >
            <h3 id={headingId} className="course-phase__heading">
              {phaseCopy.title}
            </h3>
            <p className="course-phase__purpose">{phaseCopy.purpose}</p>
            <div className="course-phase__modules">
              {phaseGroup.modules.map((entry) => (
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
      })}
    </section>
  );
}
