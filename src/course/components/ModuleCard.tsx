import { useState, type ReactElement } from "react";
import { Link } from "react-router";
import { ActionButton, ActionLink } from "../../components/actions/Action";
import { Icon } from "../../components/icons/Icon";
import { useLocale } from "../../i18n/LocaleContext";
import { lessonPath } from "../../routing/routes";
import type { CourseModule } from "../data/types";
import { getCourseCopy } from "../i18n/catalog";
import type { ModuleMapEntry } from "./courseMapModel";

/**
 * Per-lesson evidence-tier glyphs (M2/M3, quality-review Phase 2 Task 6),
 * unified with `LessonExercises.tsx`'s own `STATE_GLYPH` so the same shape
 * always means the same evidence tier everywhere in the app: an open circle
 * for "visited", a half-filled circle for "practiced", a filled circle for
 * the strongest ("demonstrated" here / "consolidated" in-lesson) tier.
 * Rendered as an explicit `aria-hidden` JSX span next to the always-visible
 * text label — never injected only via a CSS `::before` pseudo-element,
 * which assistive technology (and anything reading the DOM/accessibility
 * tree rather than painted pixels) would never see at all.
 */
const LESSON_EVIDENCE_GLYPH = {
  visited: "○",
  practiced: "◐",
  demonstrated: "●",
} as const;

export interface ModuleCardProps {
  entry: ModuleMapEntry<CourseModule>;
  /** Heading level supplied by the containing course-map structure. */
  headingLevel?: 3 | 4;
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
 * A single module's place on the course map (Phase 2 Task 6). Shows the
 * module's icon/title/outcome/prerequisites/visited count and
 * current/recommended/visited state as redundant text (never color alone),
 * plus an expandable, accessible lesson list. Never locks or blocks
 * navigation — every lesson link is always reachable. The A1 release
 * catalog tracks no per-module time estimate or verb/vocabulary coverage
 * count, so this card never fabricates one (unlike the legacy curriculum).
 */
export function ModuleCard({
  entry,
  headingLevel = 3,
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
    practicedLessonIds,
    demonstratedLessonIds,
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
  const Heading = headingLevel === 3 ? "h3" : "h4";

  return (
    <article className={stateClassNames}>
      <div className="module-card__marker">
        <Icon id={courseModule.iconId} decorative size="medium" />
      </div>
      <div className="module-card__body">
        <div className="module-card__head">
          <Heading className="module-card__title">{moduleCopy.title}</Heading>
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
            const practiced = practicedLessonIds.has(lesson.id);
            const demonstrated = demonstratedLessonIds.has(lesson.id);
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
                    {visited ? (
                      <span className="module-card__lesson-state module-card__lesson-state--visited">
                        <span className="module-card__lesson-state-glyph" aria-hidden="true">
                          {LESSON_EVIDENCE_GLYPH.visited}
                        </span>{" "}
                        <span className="module-card__lesson-state-text">
                          {copy.courseMap.stateVisited}
                        </span>
                      </span>
                    ) : null}
                    {demonstrated ? (
                      <span className="module-card__lesson-state module-card__lesson-state--demonstrated">
                        <span className="module-card__lesson-state-glyph" aria-hidden="true">
                          {LESSON_EVIDENCE_GLYPH.demonstrated}
                        </span>{" "}
                        <span className="module-card__lesson-state-text">
                          {copy.courseMap.stateDemonstrated}
                        </span>
                      </span>
                    ) : practiced ? (
                      <span className="module-card__lesson-state module-card__lesson-state--practiced">
                        <span className="module-card__lesson-state-glyph" aria-hidden="true">
                          {LESSON_EVIDENCE_GLYPH.practiced}
                        </span>{" "}
                        <span className="module-card__lesson-state-text">
                          {copy.courseMap.statePracticed}
                        </span>
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
