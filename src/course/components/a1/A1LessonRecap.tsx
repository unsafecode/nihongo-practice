import type { ReactElement } from "react";
import type { A1CurriculumViewModel } from "../../a1/curriculum/buildA1CurriculumViewModel";
import type { CourseCopy } from "../../i18n/types";
import { A1VerbForms } from "./A1VocabularySection";

export interface A1LessonRecapProps {
  readonly recap: A1CurriculumViewModel["recap"];
  readonly vocabularyException: string | null;
  readonly copy: CourseCopy["a1Lesson"];
}

export function A1LessonRecap({
  recap,
  vocabularyException,
  copy,
}: A1LessonRecapProps): ReactElement {
  return (
    <div className="a1-curriculum-recap">
      <section
        className="a1-curriculum-recap__vocabulary"
        aria-labelledby="a1-recap-vocabulary"
      >
        <h3 id="a1-recap-vocabulary">{copy.recap.meaningsAndFormsLabel}</h3>
        {vocabularyException ? (
          <p className="a1-curriculum-recap__review-note">
            <strong>{copy.recap.reviewExceptionLabel}: </strong>
            {vocabularyException}
          </p>
        ) : null}
        <ul>
          {recap.vocabulary.map((item) => (
            <li key={item.id} data-vocabulary-id={item.id}>
              <div className="a1-curriculum-recap__word">
                <span lang="ja">{item.kana}</span>
                <span>{item.romaji}</span>
                {item.isReview ? (
                  <span className="a1-curriculum-recap__review-badge">
                    {copy.vocabulary.reviewBadge}
                  </span>
                ) : null}
              </div>
              <p>
                <span>{copy.vocabulary.meaningLabel}: </span>
                {item.meaning}
              </p>
              {item.verb ? (
                <A1VerbForms verb={item.verb} copy={copy.vocabulary} />
              ) : null}
            </li>
          ))}
        </ul>
      </section>
      <section
        className="a1-curriculum-recap__cue"
        aria-labelledby="a1-recap-retrieval-cue"
      >
        <h3 id="a1-recap-retrieval-cue">{copy.recap.retrievalCueLabel}</h3>
        <p>{recap.retrievalCue}</p>
      </section>
    </div>
  );
}
