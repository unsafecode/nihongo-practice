import type { ReactElement } from "react";
import type { A1CurriculumViewModel } from "../../a1/curriculum/buildA1CurriculumViewModel";
import type { CourseCopy } from "../../i18n/types";

export interface A1LearningNoteProps {
  readonly note: A1CurriculumViewModel["note"];
  readonly copy: CourseCopy["a1Lesson"]["learningNote"];
}

export function A1LearningNote({
  note,
  copy,
}: A1LearningNoteProps): ReactElement {
  return (
    <article className="a1-learning-note" data-note-kind={note.kind}>
      <header className="a1-learning-note__head">
        <p>
          <span>{copy.kindLabel}: </span>
          <span>{copy.kinds[note.kind]}</span>
        </p>
        <h3>{note.title}</h3>
      </header>

      <dl className="a1-learning-note__fields">
        <div>
          <dt>{copy.meaningLabel}</dt>
          <dd>{note.meaning}</dd>
        </div>
        <div>
          <dt>{copy.useLabel}</dt>
          <dd>{note.use}</dd>
        </div>
        <div>
          <dt>{copy.constructionLabel}</dt>
          <dd>{note.construction}</dd>
        </div>
        <div>
          <dt>{copy.typicalMistakeLabel}</dt>
          <dd>{note.typicalMistake}</dd>
        </div>
        {note.subjectOmission ? (
          <div>
            <dt>{copy.subjectOmissionLabel}</dt>
            <dd>{note.subjectOmission}</dd>
          </div>
        ) : null}
        {note.nearestContrast ? (
          <div>
            <dt>{copy.nearestContrastLabel}</dt>
            <dd>{note.nearestContrast.title}</dd>
          </div>
        ) : null}
      </dl>

      <section
        className="a1-learning-note__pattern"
        aria-labelledby={`${note.id}-pattern`}
      >
        <h4 id={`${note.id}-pattern`}>{copy.patternLabel}</h4>
        <ul>
          {note.pattern.map((token, index) => (
            <li
              key={`${token.kind}-${token.text}-${index}`}
              data-pattern-kind={token.kind}
            >
              <span className="a1-learning-note__pattern-text" lang="ja">
                {token.text}
              </span>
              <span className="a1-learning-note__pattern-label">
                {token.label}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
