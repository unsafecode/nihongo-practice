import { Fragment } from "react";
import { useLocale } from "../../i18n/LocaleContext";
import { useScript } from "../../settings/ScriptContext";
import { examples } from "../data/examples";
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

/**
 * Renders one example's main (script-primary) line, wrapping *only* the
 * declared changed segments in a `<mark>` so the highlight is a semantic text
 * cue on exactly the honest delta (design spec §6.3) and nothing else. The
 * base ("before") card passes an empty `marked` set, so it carries no marks.
 * The `jp` field is rendered through the shared {@link JapaneseSegmentText}
 * so a katakana loanword's first-exposure hiragana reading (spec §7, §8.3)
 * shows as a ruby annotation exactly when the segment carries one; the
 * `romaji` field is unaffected plain text, already derived from that same
 * shared reading upstream in `assembleCourse`.
 */
function ScriptLine({
  example,
  field,
  marked,
}: {
  example: StaticExample;
  field: ScriptField;
  marked: ReadonlySet<string>;
}) {
  if (!example.segments) return <>{example[field]}</>;
  return (
    <>
      {example.segments.map((segment, index) => {
        const key = segmentKey(segment, index);
        const content =
          field === "jp" ? (
            <JapaneseSegmentText jp={segment.jp} reading={segment.reading} />
          ) : (
            segment[field]
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
        <ScriptLine example={example} field={mainField} marked={marked} />
      </p>
      <p
        className="lesson-comparison__reading"
        lang={subField === "jp" ? "ja" : undefined}
      >
        <ScriptLine example={example} field={subField} marked={new Set()} />
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
