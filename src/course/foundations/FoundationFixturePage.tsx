import type { ReactElement } from "react";
import { useParams } from "react-router";

import { Notice } from "../../components/Notice";
import { useLocale } from "../../i18n/LocaleContext";
import { useScript } from "../../settings/ScriptContext";
import { getCourseCopy } from "../i18n/catalog";
import {
  buildFoundationLessonViewModel,
  foundationAxisLabel,
} from "./foundationViewModel";
import { SentenceMatrix } from "./SentenceMatrix";
import { FamilyGuidedConstruction } from "./FamilyGuidedConstruction";
import { PracticeRounds } from "./PracticeRounds";
import "../course.css";
import "./foundation.css";

/** The fixed preview seed for the deterministic Phase 1 foundation harness. */
export const FOUNDATION_PREVIEW_SEED = "phase1-foundation-preview-v1";

/**
 * The compile-time-gated Phase 1 foundation harness page (design spec §10.3,
 * §11, §12, §19). It resolves the lesson named by the URL, builds the whole
 * pure view model under the fixed preview seed, and composes the Can-do
 * descriptor, the sentence matrix, the same-family guided board, and the two
 * practice rounds. Any unresolved fixture or content error yields a single
 * localized notice with navigation intact — never a partial page.
 */
export function FoundationFixturePage(): ReactElement {
  const { fixtureId } = useParams<{ fixtureId: string }>();
  const { locale } = useLocale();
  const { script } = useScript();
  const courseCopy = getCourseCopy(locale);
  const copy = courseCopy.foundation;
  const errorText = courseCopy.lesson.contentFormattingError;

  const result = buildFoundationLessonViewModel(
    fixtureId ?? "",
    locale,
    FOUNDATION_PREVIEW_SEED,
  );

  if (!result.ok) {
    return (
      <main className="foundation-page">
        <Notice
          tone="warning"
          title={copy.unavailableTitle}
          body={copy.unavailableBody}
        />
      </main>
    );
  }

  const { model } = result;
  const axisLabels = model.guided.activeAxes.map((id) => ({
    id,
    label: foundationAxisLabel(id, locale),
  }));

  return (
    <main className="foundation-page">
      <header className="foundation-page__header">
        <p className="course-eyebrow" data-level-id={model.levelId}>
          {model.levelId}
        </p>
        <h1>{model.lessonId}</h1>
        <p className="foundation-page__can-do">{model.canDoDescriptor}</p>
      </header>
      <SentenceMatrix
        rows={model.matrix.rows}
        initialVariantIds={model.matrix.initialVariantIds}
        script={script}
        copy={copy}
        errorText={errorText}
        idBase={`${model.lessonId}-matrix`}
      />
      <FamilyGuidedConstruction
        initial={model.guided.initial}
        target={model.guided.target}
        activeAxes={axisLabels}
        targetChangedTokenIds={model.guided.targetChangedTokenIds}
        script={script}
        copy={copy}
        errorText={errorText}
        idBase={`${model.lessonId}-guided`}
      />
      <PracticeRounds
        rounds={model.rounds}
        tokenForTile={model.tokenForTile}
        tokensForExample={model.tokensForExample}
        copy={copy}
        exerciseCopy={courseCopy.exercises}
        errorText={errorText}
        idBase={`${model.lessonId}-rounds`}
      />
    </main>
  );
}
