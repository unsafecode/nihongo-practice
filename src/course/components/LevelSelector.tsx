import type { ReactElement } from "react";
import { ActionLink } from "../../components/actions/Action";
import type { CourseCopy } from "../i18n/types";
import { coursePathForLevel, type CourseLevelParam } from "../../routing/routePaths";

/**
 * The visible, accessible, URL-reflected level selector (Phase 3 Task 8,
 * design spec §5). Two options — A1 and A2 — rendered as real internal links
 * to `coursePathForLevel(level)`, so selecting a level is an ordinary
 * client-side push navigation: it is directly URL-routable, yields a distinct
 * browser history entry (back/forward restores the previously-selected level),
 * and is keyboard/touch operable natively. Both options are ALWAYS enabled —
 * A2 is never disabled or hard-locked; the recommendation is a soft,
 * non-blocking hint only.
 *
 * A visible `<p id="level-selector-label" className="level-selector__label">`
 * element renders `copy.selectorLabel` as the first child of the `<nav>`. The
 * landmark is named via `aria-labelledby="level-selector-label"` so sighted
 * and AT users both see the same label text — no separate hidden aria-label is
 * needed (using both simultaneously would risk an ambiguous accessible name).
 *
 * The selected level (driven by the `livello` URL param, resolved by the
 * caller) is marked with `aria-current="true"`. The two options use the shared
 * `ActionLink` primitive, whose `.action` class carries the ≥44px touch-target
 * contract (see `src/styles.css`). Focus after a level change is owned by the
 * caller (Course Home moves focus to the newly-selected level heading).
 */
export interface LevelSelectorProps {
  /** The currently-selected level (from the `livello` URL param). */
  readonly level: CourseLevelParam;
  /**
   * Whether to show the "recommended next" hint (once the A1 checkpoint has
   * been attempted) instead of the always-available hint. Purely a soft hint —
   * it never changes whether A2 is selectable.
   */
  readonly a2Recommended: boolean;
  readonly copy: CourseCopy["courseLevels"];
}

const LEVEL_OPTIONS: readonly { readonly level: CourseLevelParam; readonly labelKey: "a1" | "a2" }[] = [
  { level: "a1", labelKey: "a1" },
  { level: "a2", labelKey: "a2" },
];

export function LevelSelector({
  level,
  a2Recommended,
  copy,
}: LevelSelectorProps): ReactElement {
  return (
    <nav className="level-selector" aria-labelledby="level-selector-label">
      <p id="level-selector-label" className="level-selector__label">
        {copy.selectorLabel}
      </p>
      <ul className="level-selector__options">
        {LEVEL_OPTIONS.map((option) => {
          const selected = option.level === level;
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
                {copy[option.labelKey]}
              </ActionLink>
            </li>
          );
        })}
      </ul>
      <p
        className="level-selector__hint"
        data-hint={a2Recommended ? "recommended" : "available"}
      >
        {a2Recommended ? copy.a2RecommendedHint : copy.a2AvailableHint}
      </p>
    </nav>
  );
}
