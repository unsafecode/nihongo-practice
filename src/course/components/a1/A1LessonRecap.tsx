import type { ReactElement } from "react";
import { ActionLink } from "../../../components/actions/Action";
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
      {/*
        Task 16: the grammar systems Base owns are reviewed and applied here,
        never introduced. Each link goes to the Base progressive reference that
        actually teaches the system; the label is Base's own catalog copy.
      */}
      {recap.reviewedBaseReferences.length > 0 ? (
        <section
          className="a1-curriculum-recap__base-references"
          aria-labelledby="a1-recap-base-references"
        >
          <h3 id="a1-recap-base-references">{copy.recap.baseReferencesLabel}</h3>
          <p>{copy.recap.baseReferencesHint}</p>
          <ul>
            {recap.reviewedBaseReferences.map((entry) => (
              <li key={entry.conceptId} data-concept-id={entry.conceptId}>
                {/*
                  A real in-app router link: the app is a HashRouter served
                  under the Pages base, so a bare `href="/riferimenti/..."`
                  would leave the application entirely and 404. `ActionLink`
                  renders the same styled control as a router `Link`.
                */}
                <ActionLink variant="secondary" to={entry.href}>
                  {entry.label}
                </ActionLink>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
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
