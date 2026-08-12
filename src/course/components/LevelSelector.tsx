import { useEffect, useId, type ReactElement } from "react";
import { ActionLink } from "../../components/actions/Action";
import { browserStorage } from "../../settings/storage";
import { courseLevelParam, coursePathForLevel } from "../../routing/routePaths";
import { useLocation } from "react-router";
import type { CourseLevelId } from "../levels/types";
import {
  parseExplicitCourseLevel,
  writeCourseLevelPreference,
} from "../levels/selection";
import type { CourseCopy } from "../i18n/types";

export interface LevelSelectorProps {
  /** The currently-selected level resolved by the caller. */
  readonly level: CourseLevelId;
  /** Soft recommendation only; all options remain enabled. */
  readonly recommendedLevel: CourseLevelId | null;
  readonly copy: CourseCopy["courseLevels"];
}

const LEVEL_OPTIONS: readonly {
  readonly level: CourseLevelId;
  readonly labelKey: "base" | "a1" | "a2";
  readonly hintKey: "baseAvailableHint" | "a1AvailableHint" | "a2AvailableHint";
  readonly recommendedHintKey:
    | "baseRecommendedHint"
    | "a1RecommendedHint"
    | "a2RecommendedHint";
}[] = [
  {
    level: "a0",
    labelKey: "base",
    hintKey: "baseAvailableHint",
    recommendedHintKey: "baseRecommendedHint",
  },
  {
    level: "a1",
    labelKey: "a1",
    hintKey: "a1AvailableHint",
    recommendedHintKey: "a1RecommendedHint",
  },
  {
    level: "a2",
    labelKey: "a2",
    hintKey: "a2AvailableHint",
    recommendedHintKey: "a2RecommendedHint",
  },
];

export function LevelSelector({
  level,
  recommendedLevel,
  copy,
}: LevelSelectorProps): ReactElement {
  const labelId = useId();
  const location = useLocation();

  useEffect(() => {
    const explicitLevel = parseExplicitCourseLevel(
      new URLSearchParams(location.search).get(courseLevelParam),
    );
    if (explicitLevel !== null) {
      writeCourseLevelPreference(browserStorage(), explicitLevel);
    }
  }, [location.search]);

  return (
    <nav className="level-selector" aria-labelledby={labelId}>
      <p id={labelId} className="level-selector__label">
        {copy.selectorLabel}
      </p>
      <ul className="level-selector__options">
        {LEVEL_OPTIONS.map((option) => {
          const selected = option.level === level;
          const recommended = option.level === recommendedLevel;
          const hint = recommended
            ? copy[option.recommendedHintKey]
            : copy[option.hintKey];
          return (
            <li key={option.level} className="level-selector__option-item">
              <ActionLink
                variant="secondary"
                className={`level-selector__option${selected ? " is-selected" : ""}`}
                to={coursePathForLevel(option.level)}
                data-level={option.level}
                data-selected={selected}
                aria-current={selected ? "true" : undefined}
              >
                <span className="level-selector__option-label">
                  {copy[option.labelKey]}
                </span>
                {recommended ? (
                  <span className="level-selector__recommended">
                    {copy.recommendedMarker}
                  </span>
                ) : null}
                <span className="level-selector__hint">{hint}</span>
              </ActionLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
