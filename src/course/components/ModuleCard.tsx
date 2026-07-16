import { useState, type ReactElement } from "react";
import { Link } from "react-router";
import { ActionButton, ActionLink } from "../../components/actions/Action";
import { Icon } from "../../components/icons/Icon";
import { useLocale } from "../../i18n/LocaleContext";
import { lessonPath } from "../../routing/routes";
import type { CourseModule } from "../data/types";
import { getCourseCopy } from "../i18n/catalog";
import type { ModuleMapEntry } from "./courseMapModel";

export interface ModuleCardProps {
  entry: ModuleMapEntry<CourseModule>;
  /** Whether this card's lesson list starts expanded (§5.3/Task 4 item 4).
   * Purely a starting point: the card keeps its own override once a user
   * toggles the disclosure, so this can change on later renders (as the
   * recommended module shifts) without fighting user intent. */
  initiallyExpanded: boolean;
  /** The course-wide recommended lesson id, if any, so exactly one lesson
   * row (when it belongs to this module) can carry the recommended state. */
  recommendedLessonId: string | null;
}

/**
 * A single module's place on the phase path (design spec §5.1-5.4). Shows
 * the module's icon/title/outcome/prerequisites/estimate/visited count and
 * current/recommended/visited state as redundant text (never color alone),
 * plus an expandable, accessible lesson list. Never locks or blocks
 * navigation — every lesson link is always reachable.
 */
export function ModuleCard({
  entry,
  initiallyExpanded,
  recommendedLessonId,
}: ModuleCardProps): ReactElement {
  const { locale } = useLocale();
  const copy = getCourseCopy(locale);
  const {
    module: courseModule,
    prerequisiteModules,
    visitedLessonIds,
    visitedCount,
    totalCount,
    isFullyVisited,
    isCurrent,
    isRecommended,
  } = entry;

  // Derived, not synced via effect: recomputes from the latest prop every
  // render unless the user has explicitly toggled this card, so the
  // auto-expanded module can follow the recommendation as progress changes
  // without any effect loop (design spec §5.3/Task 4 item 4).
  const [expandedOverride, setExpandedOverride] = useState<boolean | null>(null);
  const expanded = expandedOverride ?? initiallyExpanded;

  const moduleCopy = copy.modules[courseModule.id];
  const outcome = courseModule.outcomeCopyIds
    .map((id) => copy.outcomes[id])
    .join(" ");
  const prerequisiteNames = prerequisiteModules.map(
    (prerequisite) => copy.modules[prerequisite.id].title,
  );
  const progressLabel = copy.home.lessonsProgress(visitedCount, totalCount);
  const panelId = `module-lessons-${courseModule.id}`;
  const disclosureLabel = expanded
    ? copy.courseMap.collapseLabel(moduleCopy.title)
    : copy.courseMap.expandLabel(moduleCopy.title);

  const ctaTarget =
    courseModule.lessons.find((lesson) => !visitedLessonIds.has(lesson.id)) ??
    courseModule.lessons[0];
  const ctaLabel = isFullyVisited
    ? copy.home.review
    : visitedCount > 0
      ? copy.home.continue
      : copy.home.start;

  const stateClassNames = [
    "module-card",
    isCurrent ? "is-current" : "",
    isRecommended ? "is-recommended" : "",
    isFullyVisited ? "is-visited" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article className={stateClassNames}>
      <div className="module-card__marker">
        <Icon id={courseModule.iconId} decorative size="medium" />
      </div>
      <div className="module-card__body">
        <div className="module-card__head">
          <h4 className="module-card__title">{moduleCopy.title}</h4>
          <ActionButton
            variant="icon"
            className="module-card__disclosure"
            aria-expanded={expanded}
            aria-controls={panelId}
            aria-label={disclosureLabel}
            onClick={() => setExpandedOverride(!expanded)}
          >
            <span aria-hidden="true">{expanded ? "\u2212" : "+"}</span>
          </ActionButton>
        </div>

        {isCurrent || isRecommended || isFullyVisited ? (
          <p className="module-card__tags">
            {isCurrent ? (
              <span className="module-card__tag module-card__tag--current">
                {copy.courseMap.stateCurrent}
              </span>
            ) : null}
            {isRecommended ? (
              <span className="module-card__tag module-card__tag--recommended">
                {copy.courseMap.stateRecommended}
              </span>
            ) : null}
            {isFullyVisited ? (
              <span className="module-card__tag module-card__tag--visited">
                {copy.courseMap.stateVisited}
              </span>
            ) : null}
          </p>
        ) : null}

        <p className="module-card__outcome">{outcome}</p>

        <p className="module-card__prerequisites">
          {copy.courseMap.prerequisites(prerequisiteNames)}
        </p>

        <p className="module-card__meta">
          <span>{copy.courseMap.estimatedMinutes(courseModule.estimatedMinutes)}</span>
          <span>
            {copy.courseMap.coverageMetadata(
              courseModule.lessons.length,
              courseModule.coverage.verbCount,
              courseModule.coverage.vocabularyCount,
            )}
          </span>
          <span>{progressLabel}</span>
        </p>

        <div className="module-card__actions">
          <ActionLink
            variant="secondary"
            to={lessonPath(courseModule.id, ctaTarget.id)}
          >
            {ctaLabel}
          </ActionLink>
        </div>

        <ul id={panelId} className="module-card__lessons" hidden={!expanded}>
          {courseModule.lessons.map((lesson) => {
            const lessonCopy = copy.lessons[lesson.titleCopyId];
            const objective = lesson.objectiveCopyIds
              .map((id) => copy.objectives[id])
              .join(" ");
            const visited = visitedLessonIds.has(lesson.id);
            const recommended = lesson.id === recommendedLessonId;
            return (
              <li key={lesson.id}>
                <Link
                  className="module-card__lesson-link"
                  to={lessonPath(courseModule.id, lesson.id)}
                  aria-current={recommended ? "step" : undefined}
                >
                  <span className="module-card__lesson-title">
                    {lessonCopy.title}
                  </span>
                  <span className="module-card__lesson-objective">{objective}</span>
                  <span className="module-card__lesson-meta">
                    {copy.courseMap.estimatedMinutes(lesson.estimatedMinutes)}
                    {visited ? (
                      <span className="module-card__lesson-state">
                        {copy.courseMap.stateVisited}
                      </span>
                    ) : null}
                    {recommended ? (
                      <span className="module-card__lesson-state">
                        {copy.courseMap.stateRecommended}
                      </span>
                    ) : null}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </article>
  );
}
