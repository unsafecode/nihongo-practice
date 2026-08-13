import type { ReactElement } from "react";
import { useParams } from "react-router";
import { Notice } from "../../../components/Notice";
import { useLocale } from "../../../i18n/LocaleContext";
import type { LocalizedText } from "../types";
import { pick } from "../steps/stepView";
import { LessonRunner } from "../LessonRunner";
import { pilotLessonForSlug } from "./pilotCatalog";

const NOT_FOUND_TITLE: LocalizedText = {
  it: "Lezione pilota non trovata",
  en: "Pilot lesson not found",
};

const NOT_FOUND_BODY: LocalizedText = {
  it: "Questo link di anteprima non corrisponde a nessuna delle lezioni pilota disponibili.",
  en: "This preview link doesn't match any of the available pilot lessons.",
};

/**
 * Preview surface for the Phase 0 pilot lessons (Task 13,
 * `#/anteprima/:pilotId`). The slug is resolved through `pilotCatalog` —
 * never an `if` on an archetype or lesson id — and an unrecognized slug
 * renders a visible, in-place `role="alert"` `Notice` (mirroring
 * `BaseReferencePage`) instead of crashing or redirecting, so a bad preview
 * link stays honest about what went wrong. Copy is kept local to the engine
 * rather than added to the shared course i18n catalog, picked the same way
 * `stepView.ts`'s `pick()` does it elsewhere in the engine.
 */
export default function PilotLessonPage(): ReactElement {
  const { pilotId } = useParams<{ pilotId: string }>();
  const { locale } = useLocale();
  const lesson = pilotId ? pilotLessonForSlug(pilotId) : undefined;

  if (!lesson) {
    return (
      <main className="pilot-lesson-page">
        <Notice
          tone="error"
          title={pick(NOT_FOUND_TITLE, locale)}
          body={pick(NOT_FOUND_BODY, locale)}
        />
      </main>
    );
  }

  return <LessonRunner lesson={lesson} locale={locale} />;
}
