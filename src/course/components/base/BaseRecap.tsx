import type { ReactElement } from "react";
import type { BaseVocabularyItemView } from "../../base/view/buildBaseLessonViewModel";
import type { CourseCopy } from "../../i18n/types";

export interface BaseRecapProps {
  readonly canDo: string;
  readonly recap: string;
  readonly vocabulary: readonly BaseVocabularyItemView[];
  readonly copy: CourseCopy["baseLesson"];
}

/**
 * The Base lesson's cumulative recap (Task 14): the restated can-do, the
 * authored recap prose, and every vocabulary item taught or reused this
 * lesson — the "cumulative recap" rendering requirement.
 */
export function BaseRecap({
  canDo,
  recap,
  vocabulary,
  copy,
}: BaseRecapProps): ReactElement {
  const recapCopy = copy.recap;
  return (
    <div className="base-recap">
      <p className="base-recap__can-do">
        <span className="base-recap__can-do-label">{recapCopy.canDoLabel}: </span>
        {canDo}
      </p>
      <p className="base-recap__body">{recap}</p>
      <section aria-label={recapCopy.vocabularyHeading}>
        <h3>{recapCopy.vocabularyHeading}</h3>
        <ul className="base-recap__vocabulary">
          {vocabulary.map((item) => (
            <li key={item.id} data-vocabulary-id={item.id}>
              <span lang="ja">{item.kana}</span> — {item.meaning}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
