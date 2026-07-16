import { Fragment } from "react";
import type { AssembledToken } from "../../romaji/types";
import { RomajiSequence } from "../../romaji/RomajiSequence";
import { useLocale } from "../../i18n/LocaleContext";
import { useScript } from "../../settings/ScriptContext";
import { examples } from "../data/examples";
import { exampleSegmentToAssembledToken } from "../data/romajiTokens";
import type {
  ExampleSegment,
  StaticExample,
  TransformComparisonData,
} from "../data/types";
import { getCourseCopy } from "../i18n/catalog";
import { JapaneseSegmentText } from "./JapaneseSegmentText";

type ScriptField = "jp" | "romaji";

function segmentKey(segment: ExampleSegment, index: number): string {
  return segment.id ?? String(index);
}

/** A deliberately invalid sentinel forcing `RomajiSequence`'s error path
 * (never a silent fallback) when an example's segments cannot resolve to
 * real assembled tokens. */
const INVALID_TOKEN: AssembledToken = {
  id: "",
  jp: "",
  romaji: "",
  kind: "lexical",
  boundaryBefore: "attach",
  source: { domain: "catalog", referenceId: "" },
};

function exampleTokens(example: StaticExample): readonly AssembledToken[] {
  const segments = example.segments ?? [];
  if (segments.length === 0) return [INVALID_TOKEN];
  return segments.map(
    (segment) => exampleSegmentToAssembledToken(segment) ?? INVALID_TOKEN,
  );
}

/**
 * Renders one example's main (script-primary) line. The `jp` field keeps
 * rendering each authored segment through the shared
 * {@link JapaneseSegmentText}, wrapping *only* the declared changed segments
 * in a `<mark>` so the highlight is a semantic text cue on exactly the
 * honest delta (design spec §6.3) and nothing else (Japanese never carries
 * inter-word separators). The `romaji` field renders the *entire* runtime
 * segment token list through the shared {@link RomajiSequence} (master spec
 * §13.2-13.3): highlighted token ids come straight from `marked`, and every
 * run separator is emitted by the shared renderer — never a local join.
 */
function ScriptLine({
  example,
  field,
  marked,
  errorText,
}: {
  example: StaticExample;
  field: ScriptField;
  marked: ReadonlySet<string>;
  errorText: string;
}) {
  if (field === "romaji") {
    return (
      <RomajiSequence
        tokens={exampleTokens(example)}
        highlightedTokenIds={[...marked]}
        highlightClassName="lesson-comparison__delta-seg"
        errorText={errorText}
      />
    );
  }
  if (!example.segments) return <>{example.jp}</>;
  return (
    <>
      {example.segments.map((segment, index) => {
        const key = segmentKey(segment, index);
        const content = (
          <JapaneseSegmentText jp={segment.jp} reading={segment.reading} />
        );
        return marked.has(key) ? (
          <mark className="lesson-comparison__delta-seg" key={`${key}-${index}`}>
            {content}
          </mark>
        ) : (
          <Fragment key={`${key}-${index}`}>{content}</Fragment>
        );
      })}
    </>
  );
}

function ComparisonCard({
  variant,
  label,
  exampleId,
  marked,
}: {
  variant: "before" | "after";
  label: string;
  exampleId: string;
  marked: ReadonlySet<string>;
}) {
  const { locale, referenceLocale, showReference } = useLocale();
  const { script } = useScript();
  const example = examples[exampleId];
  const translation = getCourseCopy(locale).examples[exampleId];
  const reference = getCourseCopy(referenceLocale).examples[exampleId];
  const errorText = getCourseCopy(locale).lesson.contentFormattingError;
  const mainField: ScriptField = script === "hiragana" ? "jp" : "romaji";
  const subField: ScriptField = script === "hiragana" ? "romaji" : "jp";

  return (
    <div
      className={`lesson-comparison__card lesson-comparison__card--${variant}`}
    >
      <p className="lesson-comparison__label">{label}</p>
      <p
        className={`lesson-comparison__jp${
          mainField === "romaji" ? " is-romaji" : ""
        }`}
        lang={mainField === "jp" ? "ja" : undefined}
      >
        <ScriptLine
          example={example}
          field={mainField}
          marked={marked}
          errorText={errorText}
        />
      </p>
      <p
        className="lesson-comparison__reading"
        lang={subField === "jp" ? "ja" : undefined}
      >
        <ScriptLine
          example={example}
          field={subField}
          marked={new Set()}
          errorText={errorText}
        />
      </p>
      <p className="lesson-comparison__translation">{translation.translation}</p>
      {showReference ? (
        <p className="lesson-comparison__reference">
          <span>{referenceLocale.toUpperCase()}</span> {reference.translation}
        </p>
      ) : null}
    </div>
  );
}

/**
 * One real declared-delta before/after contrast (design spec §6.3). The base
 * card shows the "before" example unmarked; the changed card marks only the
 * comparison's `changedSegmentIds`; and the delta strip names the changed
 * gears and the localized contrast dimension. `validateComparison` (wired into
 * `validateCourse`) proves the declaration is honest, so the renderer can
 * trust the ids it is asked to mark.
 */
export function TransformComparison({
  comparison,
}: {
  comparison: TransformComparisonData;
}) {
  const { locale } = useLocale();
  const copy = getCourseCopy(locale).lesson.comparison;
  const marked = new Set(comparison.changedSegmentIds);

  return (
    <div className="lesson-comparison">
      <div className="lesson-comparison__cards">
        <ComparisonCard
          variant="before"
          label={copy.before}
          exampleId={comparison.baseExampleId}
          marked={new Set()}
        />
        <ComparisonCard
          variant="after"
          label={copy.after}
          exampleId={comparison.changedExampleId}
          marked={marked}
        />
      </div>
      <div className="lesson-comparison__delta">
        <span className="lesson-comparison__dimension">
          {copy.dimensions[comparison.contrastDimension]}
        </span>
        <p className="lesson-comparison__changed">{copy.changed}</p>
        <ul className="lesson-comparison__gears">
          {comparison.changedGearIds.map((gear) => (
            <li key={gear} className="lesson-comparison__gear">
              <b lang="ja">{gear}</b>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
