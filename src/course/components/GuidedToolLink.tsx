import { ActionLink } from "../../components/actions/Action";
import { useLocale } from "../../i18n/LocaleContext";
import { routePaths } from "../../routing/routePaths";
import { serializeRouteTarget, createRouteTarget } from "../../routing/routeTarget";
import type { GuidedToolExploration } from "../data/types";
import { getCourseCopy } from "../i18n/catalog";

/**
 * An honest guided-tool exploration (design spec §6.4). Lessons whose
 * objective the Lab engine cannot model (the two kana lessons) link out to the
 * Syllabary instead of faking an in-page transformation: this component only
 * describes what the link opens (via the explore copy body) and never renders
 * before/after or endpoint labels. The link is an Action primitive (Task 1),
 * not a naked anchor, and carries this lesson's explore anchor as a `from`
 * return hint for Task 7 to wire into the real round-trip.
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
  const from = serializeRouteTarget(
    createRouteTarget({
      pathname: exploration.returnTarget.pathname,
      sectionId: exploration.returnTarget.sectionId,
    }).target,
  );
  const to = `${routePaths.syllabary}?from=${encodeURIComponent(from)}`;

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
