import { Link } from "react-router";
import { useLocale } from "../../i18n/LocaleContext";
import { routePaths } from "../../routing/routes";
import type { LessonBlock } from "../data/types";
import { getCourseCopy } from "../i18n/catalog";

type GuidedToolData = Extract<LessonBlock, { type: "guidedTool" }>;

export function GuidedToolBlock({ block }: { block: GuidedToolData }) {
  const { locale } = useLocale();
  const copy = getCourseCopy(locale);
  const content = copy.blocks[block.copyId];
  const to =
    block.target === "lab" ? routePaths.lab : routePaths.syllabary;

  return (
    <section className="lesson-guided-tool">
      <div>
        <p className="course-eyebrow">{copy.practice.eyebrow}</p>
        <h2>{content.title}</h2>
        {content.body ? <p>{content.body}</p> : null}
      </div>
      <Link className="course-primary-action" to={to}>
        {content.action ?? copy.practice.open} →
      </Link>
    </section>
  );
}
