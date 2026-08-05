import { useState, type ReactElement } from "react";
import { ActionButton } from "../../../components/actions/Action";
import type {
  A1CurriculumViewModel,
  A1CurriculumVocabularyItem,
} from "../../a1/curriculum/buildA1CurriculumViewModel";
import type { CourseCopy } from "../../i18n/types";
import { A1AudioButton } from "./A1AudioButton";

type VocabularyCopy = CourseCopy["a1Lesson"]["vocabulary"];

export interface A1VerbFormsProps {
  readonly verb: NonNullable<A1CurriculumVocabularyItem["verb"]>;
  readonly copy: VocabularyCopy;
}

export function A1VerbForms({ verb, copy }: A1VerbFormsProps): ReactElement {
  return (
    <dl className="a1-vocabulary__verb-forms">
      <div>
        <dt>{copy.dictionaryLabel}</dt>
        <dd>
          <span lang="ja">{verb.dictionary.kana}</span>{" "}
          <span>{verb.dictionary.romaji}</span>
        </dd>
      </div>
      <div>
        <dt>{copy.politeLabel}</dt>
        <dd>
          <span lang="ja">{verb.polite.kana}</span>{" "}
          <span>{verb.polite.romaji}</span>
        </dd>
      </div>
      <div>
        <dt>{copy.classLabel}</dt>
        <dd>{copy.verbClasses[verb.class]}</dd>
      </div>
    </dl>
  );
}

export interface A1VocabularySectionProps {
  readonly vocabulary: A1CurriculumViewModel["vocabulary"];
  readonly vocabularyException: string | null;
  readonly copy: CourseCopy["a1Lesson"];
}

export function A1VocabularySection({
  vocabulary,
  vocabularyException,
  copy,
}: A1VocabularySectionProps): ReactElement {
  const [meaningsVisible, setMeaningsVisible] = useState(true);
  const review = vocabulary.some((item) => item.isReview === true);
  const vocabularyCopy = copy.vocabulary;

  return (
    <div
      className="a1-vocabulary"
      data-vocabulary-mode={review ? "review" : "new"}
    >
      <div className="a1-vocabulary__head">
        <div>
          <h3>
            {review
              ? vocabularyCopy.reviewWordsHeading
              : vocabularyCopy.newWordsHeading}
          </h3>
          {review ? (
            <p className="a1-vocabulary__review-badge">
              {vocabularyCopy.reviewBadge}
            </p>
          ) : null}
        </div>
        <ActionButton
          type="button"
          variant="inline"
          className="a1-vocabulary__meaning-toggle"
          aria-pressed={meaningsVisible}
          onClick={() => setMeaningsVisible((visible) => !visible)}
        >
          {meaningsVisible
            ? vocabularyCopy.hideMeanings
            : vocabularyCopy.showMeanings}
        </ActionButton>
      </div>

      {vocabularyException ? (
        <p className="a1-vocabulary__exception">
          <strong>{vocabularyCopy.reviewExceptionLabel}: </strong>
          {vocabularyException}
        </p>
      ) : null}

      <ul className="a1-vocabulary__list">
        {vocabulary.map((item) => (
          <li
            key={item.id}
            className="a1-vocabulary__item"
            data-vocabulary-id={item.id}
            data-category={item.category}
          >
            <div className="a1-vocabulary__word">
              <span className="a1-vocabulary__kana" lang="ja">
                {item.kana}
              </span>
              <span className="a1-vocabulary__romaji">{item.romaji}</span>
            </div>
            <dl className="a1-vocabulary__metadata">
              <div>
                <dt>{vocabularyCopy.categoryLabel}</dt>
                <dd>{vocabularyCopy.categories[item.category]}</dd>
              </div>
              <div>
                <dt>{vocabularyCopy.meaningLabel}</dt>
                <dd className="a1-vocabulary__meaning">
                  {meaningsVisible ? item.meaning : null}
                </dd>
              </div>
            </dl>
            {item.verb ? (
              <div className="a1-vocabulary__verbs">
                <h4>{vocabularyCopy.verbFormsLabel}</h4>
                <A1VerbForms verb={item.verb} copy={vocabularyCopy} />
              </div>
            ) : null}
            <A1AudioButton
              text={item.kana}
              audioKey={`a1-vocabulary-${item.id}`}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
