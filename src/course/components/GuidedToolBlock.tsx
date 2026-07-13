import { Link, useLocation } from "react-router";
import { useLocale } from "../../i18n/LocaleContext";
import { serializeLabPreset } from "../../lab/presets";
import { routePaths } from "../../routing/routes";
import type { LessonBlock } from "../data/types";
import { getCourseCopy } from "../i18n/catalog";
import { GuidedLabPreview } from "./GuidedLabPreview";

type GuidedToolData = Extract<LessonBlock, { type: "guidedTool" }>;

export function GuidedToolBlock({ block }: { block: GuidedToolData }) {
  const { locale } = useLocale();
  const location = useLocation();
  const copy = getCourseCopy(locale);
  const content = copy.blocks[block.copyId];
  if (block.target === "lab") {
    if (!block.preset) {
      throw new Error(`Missing Lab preset for ${block.copyId}`);
    }
    const params = serializeLabPreset(block.preset, location.pathname);
    const to = `${routePaths.lab}?${params.toString()}`;
    return (
      <GuidedLabPreview
        selection={block.preset}
        to={to}
        title={content.title}
        body={content.body}
      />
    );
  }

  return (
    <section className="lesson-guided-tool">
      <div>
        <p className="course-eyebrow">{copy.practice.eyebrow}</p>
        <h2>{content.title}</h2>
        {content.body ? <p>{content.body}</p> : null}
      </div>
      <Link className="course-primary-action" to={routePaths.syllabary}>
        {content.action ?? copy.practice.open} →
      </Link>
    </section>
  );
}
