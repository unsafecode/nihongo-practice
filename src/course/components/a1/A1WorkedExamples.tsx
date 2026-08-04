import type { ReactElement } from "react";
import { RomajiSequence } from "../../../romaji/RomajiSequence";
import { useScript } from "../../../settings/ScriptContext";
import { SentenceMatrix } from "../../foundations/SentenceMatrix";
import type {
  A1CurriculumExample,
  A1CurriculumViewModel,
} from "../../a1/curriculum/buildA1CurriculumViewModel";
import type { CourseCopy } from "../../i18n/types";
import { JapaneseSegmentText } from "../JapaneseSegmentText";
import { A1AudioButton } from "./A1AudioButton";

export interface A1WorkedExamplesProps {
  readonly lessonId: string;
  readonly examples: readonly A1CurriculumExample[];
  readonly dialogue: A1CurriculumViewModel["dialogue"];
  readonly optionalPattern: A1CurriculumViewModel["optionalPattern"];
  readonly copy: CourseCopy;
}

function ExampleCard({
  example,
  copy,
}: {
  readonly example: A1CurriculumExample;
  readonly copy: CourseCopy;
}): ReactElement {
  const exampleCopy = copy.a1Lesson.examples;
  const tokens = example.tokens.map(({ token }) => token);

  return (
    <article className="a1-worked-examples__card">
      <p className="a1-worked-examples__japanese" lang="ja">
        {example.tokens.map(({ token }) => (
          <JapaneseSegmentText
            key={token.id}
            jp={token.jp}
            reading={token.reading}
          />
        ))}
      </p>
      <p className="a1-worked-examples__romaji">
        <RomajiSequence
          tokens={tokens}
          errorText={copy.lesson.contentFormattingError}
        />
      </p>
      <dl
        className="a1-worked-examples__glosses"
        aria-label={exampleCopy.glossesLabel}
      >
        {example.tokens.map(({ token, gloss, role, roleLabel }) => (
          <div key={token.id} data-token-id={token.id} data-token-role={role}>
            <dt lang="ja">
              <JapaneseSegmentText jp={token.jp} reading={token.reading} />
            </dt>
            <dd>
              <span className="a1-worked-examples__role">{roleLabel}</span>
              {gloss ? (
                <span className="a1-worked-examples__gloss">{gloss}</span>
              ) : null}
            </dd>
          </div>
        ))}
      </dl>
      <p className="a1-worked-examples__translation">
        <span>{exampleCopy.translationLabel}: </span>
        {example.translation}
      </p>
      <A1AudioButton
        text={example.spokenJapanese}
        audioKey={`a1-example-${example.variantId}`}
      />
    </article>
  );
}

export function A1WorkedExamples({
  lessonId,
  examples,
  dialogue,
  optionalPattern,
  copy,
}: A1WorkedExamplesProps): ReactElement {
  const { script } = useScript();
  const exampleCopy = copy.a1Lesson.examples;

  return (
    <div className="a1-worked-examples">
      <ol className="a1-worked-examples__list">
        {examples.map((example) => (
          <li key={example.variantId}>
            <ExampleCard example={example} copy={copy} />
          </li>
        ))}
      </ol>

      {dialogue ? (
        <section
          className="a1-worked-examples__dialogue"
          aria-labelledby={`${lessonId}-dialogue`}
        >
          <h3 id={`${lessonId}-dialogue`}>{exampleCopy.dialogueLabel}</h3>
          <ol>
            {dialogue.map((example, index) => (
              <li key={example.variantId}>
                <p className="a1-worked-examples__turn">
                  {exampleCopy.turnLabel(index + 1)}
                </p>
                <ExampleCard example={example} copy={copy} />
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {optionalPattern ? (
        <details className="a1-worked-examples__pattern">
          <summary>{exampleCopy.optionalPattern}</summary>
          <SentenceMatrix
            rows={optionalPattern.rows}
            initialVariantIds={optionalPattern.initialVariantIds}
            script={script}
            copy={copy.foundation}
            errorText={copy.lesson.contentFormattingError}
            idBase={`${lessonId}-optional-pattern`}
          />
        </details>
      ) : null}
    </div>
  );
}
