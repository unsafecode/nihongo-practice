import type { ReactElement } from "react";
import { Notice } from "../../components/Notice";
import { useLocale } from "../../i18n/LocaleContext";
import { useScript } from "../../settings/ScriptContext";
import type { A2LessonSectionId } from "../../routing/lessonSections";
import { foundationAxisLabel } from "../foundations/buildLessonViewModel";
import { FamilyGuidedConstruction } from "../foundations/FamilyGuidedConstruction";
import { SentenceMatrix } from "../foundations/SentenceMatrix";
// A2 semantic lessons render the same `SentenceMatrix`/`FamilyGuidedConstruction`
// foundation components as A1, whose styles live in `foundation.css`. It is
// imported directly (not only as a side effect of the gated fixture harness)
// so a real production build always ships those styles — mirrors the same
// import in `A1LessonPage.tsx`.
import "../foundations/foundation.css";
import { buildA2LessonViewModel, type A2KanjiExposureView } from "../a2/view/buildA2LessonViewModel";
import type { KanjiExposure } from "../a2/kanji/kanjiTypes";
import { getCourseCopy } from "../i18n/catalog";
import { RecapContent, distinctLexicalTokens } from "./A1LessonPage";
import { KanjiRubyText } from "./KanjiRubyText";
import { LessonExercises } from "./LessonExercises";
import { A2SpokenAttempt } from "./A2SpokenAttempt";

/**
 * The A2 release's deep lesson body (Phase 3 Task 8). `LessonPage.tsx`
 * delegates every A2 lesson section to this dispatcher, exactly as it does to
 * `A1LessonSection` for A1 lessons. It renders the complete A2 lesson
 * experience — reusing the shared foundation components rather than forking:
 *
 *   - rule: the primary Can-do restated, the 8-12-model scenario/person
 *     matrix ({@link SentenceMatrix}), and this lesson's staged contextual
 *     kanji ({@link KanjiRubyText}, driven entirely by each exposure's stage).
 *   - comparison: the same-family guided construction ("honest comparison",
 *     {@link FamilyGuidedConstruction}).
 *   - explore: round 1 (guided/controlled) + round 2 (transfer) practice via
 *     {@link LessonExercises}, plus the optional, truthful {@link A2SpokenAttempt}.
 *   - recap: the restated Can-do, what varied, this lesson's vocabulary, and
 *     the honest note that anything missed returns to review.
 *
 * The whole lesson resolves from the single fail-closed
 * {@link buildA2LessonViewModel} source; a build failure surfaces the same
 * localized unavailable notice A1 uses, never a success-shaped empty lesson.
 */
export function A2LessonSection({
  lessonId,
  sectionId,
}: {
  readonly lessonId: string;
  readonly sectionId: A2LessonSectionId;
}): ReactElement | null {
  const { locale } = useLocale();
  const { script } = useScript();
  const copy = getCourseCopy(locale);

  const result = buildA2LessonViewModel(lessonId, locale);
  if (!result.ok) {
    return (
      <Notice
        tone="warning"
        title={copy.foundation.unavailableTitle}
        body={copy.foundation.unavailableBody}
      />
    );
  }
  const { foundation: model, kanjiExposures } = result.model;
  const errorText = copy.lesson.contentFormattingError;

  switch (sectionId) {
    case "rule":
      return (
        <div className="a2-lesson-rule">
          <p className="a1-lesson-rule__can-do">{model.canDoDescriptor}</p>
          <SentenceMatrix
            rows={model.matrix.rows}
            initialVariantIds={model.matrix.initialVariantIds}
            script={script}
            copy={copy.foundation}
            errorText={errorText}
            idBase={`${lessonId}-matrix`}
          />
          <A2KanjiSection lessonId={lessonId} exposures={kanjiExposures} script={script} />
        </div>
      );

    case "comparison": {
      const activeAxes = model.guided.activeAxes.map((id) => ({
        id,
        label: foundationAxisLabel(id, locale),
      }));
      return (
        <FamilyGuidedConstruction
          initial={model.guided.initial}
          target={model.guided.target}
          activeAxes={activeAxes}
          targetChangedTokenIds={model.guided.targetChangedTokenIds}
          script={script}
          copy={copy.foundation}
          errorText={errorText}
          idBase={`${lessonId}-guided`}
        />
      );
    }

    case "explore":
      return (
        <>
          <LessonExercises lessonId={lessonId} />
          <A2SpokenAttempt lessonId={lessonId} />
        </>
      );

    case "recap": {
      const axisLabels = model.guided.activeAxes.map((id) =>
        foundationAxisLabel(id, locale),
      );
      const vocab = distinctLexicalTokens(model.matrix.rows);
      return (
        <RecapContent
          canDoText={model.canDoDescriptor}
          variationLabels={axisLabels}
          vocab={vocab}
          script={script}
          copy={copy}
        />
      );
    }
  }
}

/**
 * This lesson's contextual-kanji exposures, each rendered through the shared
 * {@link KanjiRubyText} recognition-only renderer. Behavior is driven entirely
 * by each exposure's `stage`: first-supported/supported-retrieval show a
 * semantic ruby, revealable hides the reading behind an accessible reveal
 * control, and assessed shows the contextual word with the taught glyph
 * emphasised and a visible explanation caption
 * and NO romaji/furigana — even under the romaji script setting (the assistance
 * policy has no bypass). Renders nothing when the lesson has no kanji.
 */
function A2KanjiSection({
  lessonId,
  exposures,
  script,
}: {
  readonly lessonId: string;
  readonly exposures: readonly A2KanjiExposureView[];
  readonly script: ReturnType<typeof useScript>["script"];
}): ReactElement | null {
  const { locale } = useLocale();
  const copy = getCourseCopy(locale);
  if (exposures.length === 0) return null;

  return (
    <section className="a2-kanji" aria-labelledby={`${lessonId}-kanji-heading`}>
      <h3 id={`${lessonId}-kanji-heading`} className="a2-kanji__heading">
        {copy.kanji.sectionHeading}
      </h3>
      <p className="a2-kanji__intro">{copy.kanji.sectionIntro}</p>
      <ul className="a2-kanji__list">
        {exposures.map((view) => {
          const exposure: KanjiExposure = {
            id: view.exposureId,
            kanjiId: view.kanjiId,
            lexemeSenseId: view.lexemeSenseId,
            lessonId,
            stage: view.stage,
            readingId: view.readingId,
            contextId: view.contextId,
          };
          return (
            <li
              key={view.exposureId}
              className="a2-kanji__item"
              data-exposure-id={view.exposureId}
              data-stage={view.stage}
            >
              <KanjiRubyText
                glyph={view.glyph}
                reading={view.reading}
                romaji={view.romaji}
                meaning={copy.kanjiMeanings[view.meaningCopyId]}
                exposure={exposure}
                script={script}
                assessedExplanation={copy.kanji.assessedExplanation}
                revealShowLabel={copy.kanji.revealShow}
                revealHideLabel={copy.kanji.revealHide}
                word={view.word}
                wordKana={view.wordKana}
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
