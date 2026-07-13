import { useLocale } from "../../i18n/LocaleContext";
import type { LessonBlock } from "../data/types";
import { getCourseCopy } from "../i18n/catalog";

type CalloutData = Extract<LessonBlock, { type: "callout" }>;

export function CalloutBlock({ block }: { block: CalloutData }) {
  const { locale } = useLocale();
  const content = getCourseCopy(locale).blocks[block.copyId];
  return (
    <aside className={`lesson-callout lesson-callout--${block.tone}`}>
      <h2>{content.title}</h2>
      {content.body ? <p>{content.body}</p> : null}
    </aside>
  );
}
