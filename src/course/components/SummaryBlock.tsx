import { useLocale } from "../../i18n/LocaleContext";
import type { LessonBlock } from "../data/types";
import { getCourseCopy } from "../i18n/catalog";

type SummaryData = Extract<LessonBlock, { type: "summary" }>;

export function SummaryBlock({ block }: { block: SummaryData }) {
  const { locale, referenceLocale, showReference } = useLocale();
  const primary = getCourseCopy(locale).blocks[block.copyId];
  const reference = getCourseCopy(referenceLocale).blocks[block.copyId];

  return (
    <section className="lesson-summary">
      <h2>{primary.title}</h2>
      <ul>
        {primary.bullets?.map((bullet) => <li key={bullet}>{bullet}</li>)}
      </ul>
      {showReference && reference.bullets ? (
        <div className="lesson-summary__reference">
          <span>{referenceLocale.toUpperCase()}</span>
          <ul>
            {reference.bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
