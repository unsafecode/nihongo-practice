import type { ReactElement } from "react";
import { Link } from "react-router";
import { baseReferencePath } from "../../../routing/routePaths";
import type {
  BaseContrastMapView,
  BaseReferenceSnapshotView,
  BaseSemanticExplanationView,
} from "../../base/view/buildBaseLessonViewModel";
import type { CourseCopy } from "../../i18n/types";
import { JapaneseSegmentText } from "../JapaneseSegmentText";

export interface BaseSemanticExplanationProps {
  readonly contract: "content" | "system" | "synthesis";
  readonly explanation: BaseSemanticExplanationView;
  readonly referenceSnapshots: readonly BaseReferenceSnapshotView[];
  /**
   * The lesson offering these references. It is required, not optional: a
   * reference opened without it falls back to the end-of-course view, which
   * would show a beginner every later grammar point the progressive surface
   * exists to withhold.
   */
  readonly lessonId: string;
  readonly copy: CourseCopy["baseLesson"];
}

export interface BasePhoneticExplanationProps {
  readonly contract: "phonetic";
  readonly phoneticExplanation: string;
  readonly contrastMap: BaseContrastMapView;
  readonly copy: CourseCopy["baseLesson"];
}

export type BaseExplanationProps =
  | BaseSemanticExplanationProps
  | BasePhoneticExplanationProps;

/**
 * The Base lesson's main grammar/sound explanation (Task 14). Every
 * non-phonetic lesson renders the construction, the constraints on where it
 * applies, the common learner error, and the nearest contrast — every field
 * `buildBaseLessonViewModel` guarantees is non-empty. Phonetic lessons render
 * the sound explanation plus the full contrast map instead.
 */
export function BaseExplanation(props: BaseExplanationProps): ReactElement {
  const explanationCopy = props.copy.explanation;

  if (props.contract === "phonetic") {
    return (
      <div className="base-explanation base-explanation--phonetic">
        <h3 className="base-explanation__heading">{explanationCopy.phoneticLabel}</h3>
        <p className="base-explanation__main">{props.phoneticExplanation}</p>
        <section
          className="base-contrast-map"
          aria-label={explanationCopy.contrastMapHeading}
        >
          <h4>{explanationCopy.contrastMapHeading}</h4>
          <ul className="base-contrast-map__list">
            {props.contrastMap.items.map((item) => (
              <li
                key={item.id}
                className="base-contrast-map__item"
                data-contrast-id={item.id}
              >
                <span className="base-contrast-map__kana" lang="ja">
                  <JapaneseSegmentText jp={item.kana} />
                </span>
                <span className="base-contrast-map__romaji">{item.romaji}</span>
                <span className="base-contrast-map__explanation">
                  {item.explanation}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    );
  }

  const { explanation } = props;
  return (
    <div className="base-explanation">
      <h3 className="base-explanation__heading">{explanationCopy.mainLabel}</h3>
      <p className="base-explanation__main">{explanation.main}</p>
      <dl className="base-explanation__details">
        <div>
          <dt>{explanationCopy.constructionLabel}</dt>
          <dd>{explanation.construction}</dd>
        </div>
        <div>
          <dt>{explanationCopy.constraintsLabel}</dt>
          <dd className="base-explanation__constraints">
            {explanation.constraints}
          </dd>
        </div>
        <div>
          <dt>{explanationCopy.commonErrorLabel}</dt>
          <dd className="base-explanation__common-error">
            {explanation.commonError}
          </dd>
        </div>
        <div>
          <dt>{explanationCopy.nearestContrastLabel}</dt>
          <dd className="base-explanation__nearest-contrast">
            {explanation.nearestContrast}
          </dd>
        </div>
      </dl>
      <section
        className="base-reference-snapshot"
        aria-label={props.copy.reference.heading}
      >
        <h4>{props.copy.reference.heading}</h4>
        <ul className="base-reference-snapshot__list">
          {props.referenceSnapshots.map((snapshot) => (
            <li
              key={snapshot.id}
              className="base-reference-snapshot__item"
              data-reference-id={snapshot.id}
            >
              <Link to={baseReferencePath(snapshot.id, props.lessonId)}>
                {snapshot.title}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
