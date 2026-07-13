import { useLocale } from "../../i18n/LocaleContext";
import { getCatalog } from "../../i18n/catalog";
import { useSpeech } from "../../hooks/useSpeech";
import { useScript } from "../../settings/ScriptContext";
import type { LessonBlock, StaticExample } from "../data/types";
import { examples } from "../data/examples";
import { getCourseCopy } from "../i18n/catalog";

type ExamplesData = Extract<LessonBlock, { type: "examples" }>;
type ScriptField = "jp" | "romaji";

function ExampleText({
  example,
  field,
}: {
  example: StaticExample;
  field: ScriptField;
}) {
  if (!example.segments) return <>{example[field]}</>;
  return (
    <>
      {example.segments.map((segment, index) => (
        <span
          key={`${segment.jp}-${index}`}
          className={segment.kind === "word" ? undefined : segment.kind}
        >
          {segment[field]}
        </span>
      ))}
    </>
  );
}

export function ExampleCollection({
  exampleIds,
  variant,
}: {
  exampleIds: string[];
  variant: "examples" | "comparison";
}) {
  const { locale, referenceLocale, showReference } = useLocale();
  const { script } = useScript();
  const { supported, speakingKey, playbackFailed, speak } = useSpeech();
  const copy = getCourseCopy(locale);
  const referenceCopy = getCourseCopy(referenceLocale);
  const ui = getCatalog(locale).ui;
  const mainField: ScriptField = script === "hiragana" ? "jp" : "romaji";
  const subField: ScriptField = script === "hiragana" ? "romaji" : "jp";
  const hasGears = exampleIds.some((exampleId) =>
    examples[exampleId].segments?.some((segment) => segment.kind !== "word"),
  );

  return (
    <>
      {hasGears ? (
        <div className="lesson-gear-legend">
          <span><b className="particle" lang="ja">を</b>{ui.lab.particles}</span>
          <span><b className="ending" lang="ja">ます</b>{ui.lab.endings}</span>
        </div>
      ) : null}
      <div className={`lesson-examples lesson-examples--${variant}`}>
        {playbackFailed ? (
          <p className="notice notice--warn lesson-audio-error" role="alert">
            {ui.speech.failed}
          </p>
        ) : null}
        {exampleIds.map((exampleId) => {
          const example = examples[exampleId];
          const translation = copy.examples[exampleId];
          const reference = referenceCopy.examples[exampleId];
          const speechKey = `course-${example.id}`;
          return (
            <article className="lesson-example" key={example.id}>
            <p
              className={`lesson-example__main${mainField === "romaji" ? " is-romaji" : ""}`}
              lang={mainField === "jp" ? "ja" : undefined}
            >
              <ExampleText example={example} field={mainField} />
            </p>
            <p
              className="lesson-example__sub"
              lang={subField === "jp" ? "ja" : undefined}
            >
              <ExampleText example={example} field={subField} />
            </p>
            <p className="lesson-example__translation">
              {translation.translation}
            </p>
            {translation.note ? (
              <p className="lesson-example__note">{translation.note}</p>
            ) : null}
            {showReference ? (
              <p className="lesson-example__reference">
                <span>{referenceLocale.toUpperCase()}</span>{" "}
                {reference.translation}
              </p>
            ) : null}
            <button
              type="button"
              className="lesson-listen"
              disabled={!supported}
              onClick={() =>
                speak(example.jp.replace(/\s+/g, ""), { key: speechKey })
              }
              aria-label={`${copy.lesson.listen}: ${translation.translation}`}
            >
              <span aria-hidden="true">▶</span>{" "}
              <span aria-live="polite">
                {speakingKey === speechKey
                  ? copy.lesson.playing
                  : copy.lesson.listen}
              </span>
            </button>
            </article>
          );
        })}
      </div>
    </>
  );
}

export function ExampleBlock({ block }: { block: ExamplesData }) {
  const { locale } = useLocale();
  const content = getCourseCopy(locale).blocks[block.copyId];
  return (
    <section className="lesson-section">
      <header className="lesson-section__header">
        <h2>{content.title}</h2>
        {content.body ? <p>{content.body}</p> : null}
      </header>
      <ExampleCollection exampleIds={block.exampleIds} variant="examples" />
    </section>
  );
}
