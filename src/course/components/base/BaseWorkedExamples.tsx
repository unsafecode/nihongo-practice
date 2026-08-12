import type { ReactElement } from "react";
import { RomajiSequence } from "../../../romaji/RomajiSequence";
import type {
  BaseDialogueTurnView,
  BaseWorkedExampleView,
} from "../../base/view/buildBaseLessonViewModel";
import type { CourseCopy } from "../../i18n/types";
import { JapaneseSegmentText } from "../JapaneseSegmentText";

export interface BaseWorkedExamplesProps {
  readonly lessonId: string;
  readonly examples: readonly BaseWorkedExampleView[];
  readonly dialogue: readonly BaseDialogueTurnView[] | null;
  readonly copy: CourseCopy;
}

function ExampleCard({
  id,
  tokens,
  translation,
  copy,
}: {
  readonly id: string;
  readonly tokens: BaseWorkedExampleView["tokens"];
  readonly translation: string;
  readonly copy: CourseCopy;
}): ReactElement {
  const exampleCopy = copy.baseLesson.examples;
  return (
    <article className="base-worked-examples__card" data-example-id={id}>
      <p className="base-worked-examples__japanese" lang="ja">
        {tokens.map((token) => (
          <JapaneseSegmentText key={token.id} jp={token.jp} reading={token.reading} />
        ))}
      </p>
      <p className="base-worked-examples__romaji">
        <RomajiSequence tokens={tokens} errorText={copy.lesson.contentFormattingError} />
      </p>
      <p className="base-worked-examples__translation">
        <span>{exampleCopy.translationLabel}: </span>
        {translation}
      </p>
    </article>
  );
}

/**
 * The Base lesson's worked examples (6-14 per contract) plus its separate
 * dialogue, when the lesson has one (Task 14). Examples and dialogue turns
 * are visually and structurally distinct sections — a dialogue is never
 * folded into the example list — matching the "separate dialogue" rendering
 * requirement.
 */
export function BaseWorkedExamples({
  lessonId,
  examples,
  dialogue,
  copy,
}: BaseWorkedExamplesProps): ReactElement {
  const exampleCopy = copy.baseLesson.examples;

  return (
    <div className="base-worked-examples">
      <h3 className="base-worked-examples__heading">{exampleCopy.heading}</h3>
      <ol className="base-worked-examples__list">
        {examples.map((example) => (
          <li key={example.id}>
            <ExampleCard
              id={example.id}
              tokens={example.tokens}
              translation={example.translation}
              copy={copy}
            />
          </li>
        ))}
      </ol>

      {dialogue ? (
        <section
          className="base-worked-examples__dialogue base-dialogue"
          aria-labelledby={`${lessonId}-dialogue-heading`}
        >
          <h4 id={`${lessonId}-dialogue-heading`}>{exampleCopy.dialogueHeading}</h4>
          <ol>
            {dialogue.map((turn, index) => (
              <li key={`${lessonId}-turn-${index}`}>
                <p className="base-worked-examples__turn">
                  {exampleCopy.turnLabel(index + 1)}
                </p>
                <ExampleCard
                  id={`${lessonId}-turn-${index}`}
                  tokens={turn.tokens}
                  translation={turn.translation}
                  copy={copy}
                />
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </div>
  );
}
