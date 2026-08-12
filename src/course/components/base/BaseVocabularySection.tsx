import type { ReactElement } from "react";
import type { BaseVocabularyItemView } from "../../base/view/buildBaseLessonViewModel";
import type { CourseCopy } from "../../i18n/types";
import { JapaneseSegmentText } from "../JapaneseSegmentText";

export interface BaseVocabularySectionProps {
  readonly vocabulary: readonly BaseVocabularyItemView[];
  readonly copy: CourseCopy["baseLesson"];
}

/**
 * The Base lesson's vocabulary list (Task 14). Every item shows its kana,
 * romaji, and localized meaning together — new and known-for-reuse words are
 * both shown, distinguished only by a `data-vocabulary-mode` flag (never a
 * different, weaker rendering for review items).
 */
export function BaseVocabularySection({
  vocabulary,
  copy,
}: BaseVocabularySectionProps): ReactElement {
  const newWords = vocabulary.filter((item) => !item.isReview);
  const reviewWords = vocabulary.filter((item) => item.isReview);
  const vocabularyCopy = copy.vocabulary;

  function list(
    items: readonly BaseVocabularyItemView[],
    heading: string,
    mode: "new" | "review",
  ): ReactElement | null {
    if (items.length === 0) return null;
    return (
      <div className="base-vocabulary__group" data-vocabulary-mode={mode}>
        <h4 className="base-vocabulary__group-heading">{heading}</h4>
        <ul className="base-vocabulary__list">
          {items.map((item) => (
            <li
              key={item.id}
              className="base-vocabulary__item"
              data-vocabulary-id={item.id}
            >
              <span className="base-vocabulary__kana" lang="ja">
                <JapaneseSegmentText jp={item.kana} />
              </span>
              <span className="base-vocabulary__romaji">{item.romaji}</span>
              <span className="base-vocabulary__meaning">
                <span className="base-vocabulary__meaning-label">
                  {vocabularyCopy.meaningLabel}:{" "}
                </span>
                {item.meaning}
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="base-vocabulary">
      <h3 className="base-vocabulary__heading">{vocabularyCopy.heading}</h3>
      {list(newWords, vocabularyCopy.newWordsHeading, "new")}
      {list(reviewWords, vocabularyCopy.reviewWordsHeading, "review")}
    </div>
  );
}
