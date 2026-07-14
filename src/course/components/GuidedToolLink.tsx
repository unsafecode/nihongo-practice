import { ActionLink } from "../../components/actions/Action";
import { useLocale } from "../../i18n/LocaleContext";
import { buildGuidedToolHref } from "../../routing/guidedToolLink";
import { routePaths } from "../../routing/routePaths";
import { buildSyllabaryDeepLink } from "../../syllabary/groups";
import type { GuidedToolExploration } from "../data/types";
import { getCourseCopy } from "../i18n/catalog";

/**
 * An honest guided-tool exploration (design spec §6.4). Lessons whose
 * objective the Lab engine cannot model (the two kana lessons) link out to the
 * Syllabary instead of faking an in-page transformation: this component only
 * describes what the link opens (via the explore copy body) and never renders
 * before/after or endpoint labels. The link is an Action primitive (Task 1),
 * not a naked anchor, and carries — through the shared guided-tool contract —
 * this lesson's target Syllabary group plus the exact `#explore` return.
 */
export function GuidedToolLink({
  exploration,
  copyId,
}: {
  exploration: GuidedToolExploration;
  copyId: string;
}) {
  const { locale } = useLocale();
  const copy = getCourseCopy(locale);
  const content = copy.blocks[copyId];
  const returnInput = {
    pathname: exploration.returnTarget.pathname,
    sectionId: exploration.returnTarget.sectionId,
  };
  const { href: to } = exploration.group
    ? buildSyllabaryDeepLink(exploration.group, returnInput)
    : buildGuidedToolHref(routePaths.syllabary, new URLSearchParams(), returnInput);

  return (
    <div className="lesson-tool">
      <div className="lesson-tool__body">
        <h3>{content.title}</h3>
        {content.body ? <p>{content.body}</p> : null}
      </div>
      <ActionLink variant="primary" to={to} className="lesson-tool__action">
        {copy.lesson.guided.openSyllabary} →
      </ActionLink>
    </div>
  );
}
