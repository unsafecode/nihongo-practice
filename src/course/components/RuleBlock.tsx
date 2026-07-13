import { useLocale } from "../../i18n/LocaleContext";
import type { LessonBlock } from "../data/types";
import { getCourseCopy } from "../i18n/catalog";

type RuleData = Extract<LessonBlock, { type: "rule" }>;

export function RuleBlock({ block }: { block: RuleData }) {
  const { locale } = useLocale();
  const content = getCourseCopy(locale).blocks[block.copyId];
  return (
    <section className="lesson-rule">
      <div className="lesson-rule__gear" lang="ja" aria-hidden="true">
        {block.gear}
      </div>
      <div>
        {content.eyebrow ? (
          <p className="course-eyebrow">{content.eyebrow}</p>
        ) : null}
        <h2>{content.title}</h2>
        {content.body ? <p>{content.body}</p> : null}
      </div>
    </section>
  );
}
