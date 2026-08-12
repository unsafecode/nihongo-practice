import { useMemo, type ReactElement } from "react";
import { Notice } from "../../components/Notice";
import { useLocale, type Locale } from "../../i18n/LocaleContext";
import { lessonSectionAnchorId } from "../../routing/lessonSections";
import {
  buildBaseLessonViewModel,
  type BaseLessonSectionId,
  type BaseLessonViewModelResult,
} from "../base/view/buildBaseLessonViewModel";
import {
  buildBasePracticeModel,
  type BasePracticeModelResult,
} from "../base/view/buildBasePracticeModel";
import { getCourseCopy } from "../i18n/catalog";
import { BaseExplanation } from "./base/BaseExplanation";
import { BaseLessonOverview } from "./base/BaseLessonOverview";
import { BasePracticeSequence } from "./base/BasePracticeSequence";
import { BaseRecap } from "./base/BaseRecap";
import { BaseVocabularySection } from "./base/BaseVocabularySection";
import { BaseWorkedExamples } from "./base/BaseWorkedExamples";

/**
 * The Base level's deep lesson page (Task 14): the single fail-closed source
 * (`buildBaseLessonViewModel`/`buildBasePracticeModel`) rendered through the
 * six stable A1-style section anchors
 * (`rule`/`vocabulary`/`grammar`/`comparison`/`explore`/`recap`). This
 * component is deliberately a standalone whole-page renderer (not yet wired
 * into the shared `LessonPage.tsx` shell/router — that is Task 15's
 * responsibility) so its own content/leakage/accessibility contracts are
 * independently testable.
 *
 * Both view models are cached per `(lessonId, locale)` (view model) /
 * `lessonId` (practice model, locale-independent) at the component-module
 * level: since both builders are pure and their frozen catalog inputs never
 * change at runtime, memoizing avoids rebuilding the same immutable result on
 * every render/navigation without ever risking a stale result — the cache key
 * is exactly the builder's own input.
 */

const lessonViewModelCache = new Map<string, BaseLessonViewModelResult>();
const practiceModelCache = new Map<string, BasePracticeModelResult>();

function cachedLessonViewModel(lessonId: string, locale: Locale): BaseLessonViewModelResult {
  const key = `${lessonId}:${locale}`;
  const cached = lessonViewModelCache.get(key);
  if (cached) return cached;
  const result = buildBaseLessonViewModel(lessonId, locale);
  lessonViewModelCache.set(key, result);
  return result;
}

function cachedPracticeModel(lessonId: string): BasePracticeModelResult {
  const cached = practiceModelCache.get(lessonId);
  if (cached) return cached;
  const result = buildBasePracticeModel(lessonId);
  practiceModelCache.set(lessonId, result);
  return result;
}

export interface BaseLessonPageProps {
  readonly lessonId: string;
}

export function BaseLessonPage({ lessonId }: BaseLessonPageProps): ReactElement {
  const { locale } = useLocale();
  const copy = getCourseCopy(locale);
  const baseLessonCopy = copy.baseLesson;

  // Recomputed only when the memoized inputs change (a real effect of the
  // module-level cache above), never on every render.
  const viewResult = useMemo(
    () => cachedLessonViewModel(lessonId, locale),
    [lessonId, locale],
  );
  const practiceResult = useMemo(() => cachedPracticeModel(lessonId), [lessonId]);

  if (!viewResult.ok) {
    return (
      <Notice
        tone="warning"
        title={baseLessonCopy.unavailableTitle}
        body={baseLessonCopy.unavailableBody}
      />
    );
  }
  if (!practiceResult.ok) {
    return (
      <Notice
        tone="warning"
        title={baseLessonCopy.unavailableTitle}
        body={baseLessonCopy.unavailableBody}
      />
    );
  }

  const model = viewResult.model;
  const practiceModel = practiceResult.model;
  const sectionLabel = (sectionId: BaseLessonSectionId): string =>
    baseLessonCopy.sections[sectionId];

  function sectionBody(sectionId: BaseLessonSectionId): ReactElement | null {
    switch (sectionId) {
      case "rule":
        return (
          <BaseLessonOverview title={model.title} canDo={model.canDo} copy={baseLessonCopy} />
        );
      case "vocabulary":
        return (
          <BaseVocabularySection vocabulary={model.vocabulary} copy={baseLessonCopy} />
        );
      case "grammar":
        return model.contract === "phonetic" ? (
          <BaseExplanation
            contract="phonetic"
            phoneticExplanation={model.phoneticExplanation}
            contrastMap={model.contrastMap}
            copy={baseLessonCopy}
          />
        ) : (
          <BaseExplanation
            contract={model.contract}
            explanation={model.explanation}
            referenceSnapshots={model.referenceSnapshots}
            copy={baseLessonCopy}
          />
        );
      case "comparison":
        return (
          <BaseWorkedExamples
            lessonId={lessonId}
            examples={model.examples}
            dialogue={model.dialogue}
            copy={copy}
          />
        );
      case "explore":
        return (
          <BasePracticeSequence
            lessonId={lessonId}
            activities={practiceModel.activities}
            copy={copy}
          />
        );
      case "recap":
        return (
          <BaseRecap
            canDo={model.canDo}
            recap={model.recap}
            vocabulary={model.vocabulary}
            copy={baseLessonCopy}
          />
        );
    }
  }

  return (
    <article className="base-lesson-page" data-lesson-id={lessonId}>
      <header className="base-lesson-page__header">
        <h1>{model.title}</h1>
      </header>
      <div className="base-lesson-page__sections">
        {model.sections.map((sectionId) => {
          const headingId = `${lessonSectionAnchorId(sectionId)}-heading`;
          return (
            <section
              key={sectionId}
              id={lessonSectionAnchorId(sectionId)}
              className="base-lesson-page__section lesson-section-anchor"
              aria-labelledby={headingId}
            >
              <h2 id={headingId} className="base-lesson-page__section-heading">
                {sectionLabel(sectionId)}
              </h2>
              {sectionBody(sectionId)}
            </section>
          );
        })}
      </div>
    </article>
  );
}
