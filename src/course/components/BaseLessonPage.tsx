import { useMemo, type ReactElement } from "react";
import { Notice } from "../../components/Notice";
import { useLocale, type Locale } from "../../i18n/LocaleContext";
import { lessonSectionAnchorId } from "../../routing/lessonSections";
import {
  buildBaseLessonViewModel,
  type BaseLessonSectionId,
  type BaseLessonViewModel,
  type BaseLessonViewModelResult,
} from "../base/view/buildBaseLessonViewModel";
import {
  buildBasePracticeModel,
  type BasePracticeModel,
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
 * (`rule`/`vocabulary`/`grammar`/`comparison`/`explore`/`recap`). It is a
 * standalone whole-page renderer with its own content/leakage/accessibility
 * contracts, independently testable. `LessonPage.tsx` renders Base lessons
 * through {@link BaseLessonSection} below instead (Task 15) — the same
 * per-section dispatch contract `A1LessonSection`/`A2LessonSection` already
 * use — so the shared lesson shell (rail, header, previous/next footer)
 * stays one implementation across all three levels.
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

function cachedPracticeModel(lessonId: string, locale: Locale): BasePracticeModelResult {
  const key = `${lessonId}:${locale}`;
  const cached = practiceModelCache.get(key);
  if (cached) return cached;
  const result = buildBasePracticeModel(lessonId, locale);
  practiceModelCache.set(key, result);
  return result;
}

export interface BaseLessonPageProps {
  readonly lessonId: string;
}

/**
 * The section body for one Base lesson section, shared by the whole-page
 * {@link BaseLessonPage} and the per-section {@link BaseLessonSection}
 * dispatcher LessonPage.tsx uses (Task 15) — a single switch so both call
 * sites can never disagree about what a given section renders.
 */
function baseLessonSectionBody(
  sectionId: BaseLessonSectionId,
  model: BaseLessonViewModel,
  practiceModel: BasePracticeModel,
  lessonId: string,
  copy: ReturnType<typeof getCourseCopy>,
  baseLessonCopy: ReturnType<typeof getCourseCopy>["baseLesson"],
): ReactElement | null {
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

/**
 * Base's per-section dispatcher (Task 15): `LessonPage.tsx` renders one
 * section at a time through this, exactly mirroring `A1LessonSection`'s and
 * `A2LessonSection`'s contract. It independently resolves the same
 * memoized/cached lesson + practice view models `BaseLessonPage` uses, so an
 * unavailable model surfaces the same honest, fail-closed notice no matter
 * which section is asked for first.
 */
export function BaseLessonSection({
  lessonId,
  sectionId,
}: {
  readonly lessonId: string;
  readonly sectionId: BaseLessonSectionId;
}): ReactElement | null {
  const { locale } = useLocale();
  const copy = getCourseCopy(locale);
  const baseLessonCopy = copy.baseLesson;

  const viewResult = useMemo(
    () => cachedLessonViewModel(lessonId, locale),
    [lessonId, locale],
  );
  const practiceResult = useMemo(
    () => cachedPracticeModel(lessonId, locale),
    [lessonId, locale],
  );

  if (!viewResult.ok || !practiceResult.ok) {
    return (
      <Notice
        tone="warning"
        title={baseLessonCopy.unavailableTitle}
        body={baseLessonCopy.unavailableBody}
      />
    );
  }

  return baseLessonSectionBody(
    sectionId,
    viewResult.model,
    practiceResult.model,
    lessonId,
    copy,
    baseLessonCopy,
  );
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
  const practiceResult = useMemo(
    () => cachedPracticeModel(lessonId, locale),
    [lessonId, locale],
  );

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

  return (
    <article className="base-lesson-page" data-lesson-id={lessonId}>
      <header className="base-lesson-page__header">
        <h1>{model.title}</h1>
      </header>
      {/* `base-progress` marks the scrolled lesson-progress column: under
          `prefers-reduced-motion` it stops smooth scrolling and transitions. */}
      <div className="base-lesson-page__sections base-progress">
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
              {baseLessonSectionBody(sectionId, model, practiceModel, lessonId, copy, baseLessonCopy)}
            </section>
          );
        })}
      </div>
    </article>
  );
}
