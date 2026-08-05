import type { ReactElement } from "react";
import { Notice } from "../../components/Notice";
import { Icon } from "../../components/icons/Icon";
import { useLocale } from "../../i18n/LocaleContext";
import type { CourseModule } from "../data/types";
import { getCourseCopy } from "../i18n/catalog";
import type { CourseMapModel } from "./courseMapModel";
import { ModuleCard } from "./ModuleCard";

export interface CourseMapProps {
  model: CourseMapModel<CourseModule>;
}

/**
 * A level-aware course map. A1 supplies explicit authored areas, while levels
 * without one (currently A2) retain the existing flat accessible map.
 */
export function CourseMap({ model }: CourseMapProps): ReactElement {
  const { locale } = useLocale();
  const copy = getCourseCopy(locale);
  const expandedModuleId = model.recommendedModuleId ?? model.currentModuleId;
  const renderModuleCards = (
    entries: typeof model.modules,
    headingLevel: 3 | 4,
  ): ReactElement[] =>
    entries.map((entry) => (
      <ModuleCard
        key={entry.module.id}
        entry={entry}
        headingLevel={headingLevel}
        initiallyExpanded={entry.module.id === expandedModuleId}
        recommendedLessonId={model.recommendedLessonId}
      />
    ));

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

      {model.areas.length > 0 ? (
        model.areas.map(({ area, modules }) => {
          const areaCopy = copy.courseAreas[area.id];
          const foundations = area.id === "foundations";
          const headingId = `course-area-${area.id}`;
          return (
            <section
              key={area.id}
              className={`course-area${foundations ? " course-area--foundations" : ""}`}
              aria-labelledby={headingId}
            >
              <div className="course-area__header">
                {foundations ? (
                  <span className="course-area__icon" aria-hidden="true">
                    <Icon id="sentence" decorative size="medium" />
                  </span>
                ) : null}
                <div>
                  <h3 id={headingId} className="course-area__heading">
                    {areaCopy.title}
                  </h3>
                  <p className="course-area__description">{areaCopy.description}</p>
                </div>
              </div>
              <div className="course-area__modules">{renderModuleCards(modules, 4)}</div>
            </section>
          );
        })
      ) : (
        <div className="course-map__modules">{renderModuleCards(model.modules, 3)}</div>
      )}
    </section>
  );
}
