import { useLocale } from "../../i18n/LocaleContext";
import type { LessonBlock } from "../data/types";
import { getCourseCopy } from "../i18n/catalog";
import { ExampleCollection } from "./ExampleBlock";

type ComparisonData = Extract<LessonBlock, { type: "comparison" }>;

export function ComparisonBlock({ block }: { block: ComparisonData }) {
  const { locale } = useLocale();
  const content = getCourseCopy(locale).blocks[block.copyId];
  return (
    <section className="lesson-section">
      <header className="lesson-section__header">
        <h2>{content.title}</h2>
        {content.body ? <p>{content.body}</p> : null}
      </header>
      <ExampleCollection exampleIds={block.exampleIds} variant="comparison" />
    </section>
  );
}
