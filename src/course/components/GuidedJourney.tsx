import { useLocale } from "../../i18n/LocaleContext";
import type { GuidedJourneyData } from "../data/types";
import { getCourseCopy } from "../i18n/catalog";
import { GuidedTransformation } from "./GuidedTransformation";

/**
 * A multi-scene guided journey (design spec §6.6, Task 6 capstone). It replays
 * a coherent day by chaining several honest {@link GuidedTransformation}
 * scenes, each captioned with what it demonstrates. Nothing new is rendered
 * per scene beyond a localized caption and a genuine transformation that
 * `validateExploration` has already proven — the journey never claims an
 * interaction it cannot show. The list is an ordered, accessibly labelled `ol`
 * so the day reads as a numbered sequence rather than colour-only styling.
 */
export function GuidedJourney({ data }: { data: GuidedJourneyData }) {
  const { locale } = useLocale();
  const copy = getCourseCopy(locale);
  return (
    <ol className="guided-journey" aria-label={copy.lesson.guided.journeyLabel}>
      {data.scenes.map((scene) => (
        <li key={scene.id} className="guided-journey__scene">
          <p className="guided-journey__caption">
            {copy.journeyScenes[scene.captionCopyId]}
          </p>
          <GuidedTransformation data={scene.transformation} />
        </li>
      ))}
    </ol>
  );
}
