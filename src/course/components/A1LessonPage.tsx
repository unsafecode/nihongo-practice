import type { ReactElement } from "react";
import { Notice } from "../../components/Notice";
import type { Locale } from "../../i18n/LocaleContext";
import { useLocale } from "../../i18n/LocaleContext";
import { JapaneseSegmentText } from "./JapaneseSegmentText";
import type { Script } from "../../settings/ScriptContext";
import type { AssembledToken } from "../../romaji/types";
import type { A1LessonSectionId } from "../../routing/lessonSections";
import {
  buildA1CurriculumViewModel,
  type A1CurriculumViewModelResult,
} from "../a1/curriculum/buildA1CurriculumViewModel";
import { deepFreeze } from "../foundations/deepFreeze";
import type { FoundationLocalizedRow } from "../foundations/buildLessonViewModel";
import "../foundations/foundation.css";
import { getCourseCopy } from "../i18n/catalog";
import { A1LessonOverview } from "./a1/A1LessonOverview";
import { A1VocabularySection } from "./a1/A1VocabularySection";
import { A1LearningNote } from "./a1/A1LearningNote";
import { A1WorkedExamples } from "./a1/A1WorkedExamples";
import { A1PracticeLadder } from "./a1/A1PracticeLadder";
import { A1LessonRecap } from "./a1/A1LessonRecap";

/**
 * Lesson realization is pure catalog data, so it is safe to cache a deeply
 * frozen result by its two inputs. This prevents six section renderers from
 * re-realizing the same semantic lesson while keeping English and Italian
 * models isolated from each other. Learner state remains in React providers,
 * never in this cache.
 */
const curriculumViewModelCache = new Map<
  Locale,
  Map<string, A1CurriculumViewModelResult>
>();

export function getCachedA1CurriculumViewModel(
  lessonId: string,
  locale: Locale,
): A1CurriculumViewModelResult {
  let byLesson = curriculumViewModelCache.get(locale);
  if (!byLesson) {
    byLesson = new Map();
    curriculumViewModelCache.set(locale, byLesson);
  }
  const cached = byLesson.get(lessonId);
  if (cached) return cached;

  const result = deepFreeze(buildA1CurriculumViewModel(lessonId, locale));
  byLesson.set(lessonId, result);
  return result;
}

/**
 * A1's six-section body dispatcher. LessonPage owns the anchors and headings;
 * this component receives one section at a time and shares a cached immutable
 * curriculum view model across those calls.
 */
export function A1LessonSection({
  lessonId,
  sectionId,
}: {
  readonly lessonId: string;
  readonly sectionId: A1LessonSectionId;
}): ReactElement {
  const { locale } = useLocale();
  const copy = getCourseCopy(locale);
  const result = getCachedA1CurriculumViewModel(lessonId, locale);

  if (!result.ok) {
    return (
      <Notice
        tone="warning"
        title={copy.foundation.unavailableTitle}
        body={copy.foundation.unavailableBody}
      />
    );
  }

  const { model } = result;
  switch (sectionId) {
    case "rule":
      return <A1LessonOverview overview={model.overview} copy={copy.a1Lesson.overview} />;
    case "vocabulary":
      return (
        <A1VocabularySection
          vocabulary={model.vocabulary}
          vocabularyException={model.vocabularyException}
          copy={copy.a1Lesson}
        />
      );
    case "grammar":
      return <A1LearningNote note={model.note} copy={copy.a1Lesson.learningNote} />;
    case "comparison":
      return (
        <A1WorkedExamples
          lessonId={lessonId}
          examples={model.examples}
          dialogue={model.dialogue}
          optionalPattern={model.optionalPattern}
          copy={copy}
        />
      );
    case "explore":
      return <A1PracticeLadder lessonId={lessonId} />;
    case "recap":
      return (
        <A1LessonRecap
          recap={model.recap}
          vocabularyException={model.vocabularyException}
          copy={copy.a1Lesson}
        />
      );
  }
}

/**
 * A2 retains the established four-section recap view. These exports stay here
 * solely so A2 can share the proven token extraction without duplicating its
 * legacy foundation rendering.
 */
export function distinctLexicalTokens(
  rows: readonly FoundationLocalizedRow[],
): readonly AssembledToken[] {
  const seen = new Set<string>();
  const result: AssembledToken[] = [];
  for (const row of rows) {
    for (const token of row.tokens) {
      if (token.kind !== "lexical") continue;
      const key = `${token.jp}\u0000${token.romaji}`;
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(token);
    }
  }
  return result;
}

export function RecapContent({
  canDoText,
  variationLabels,
  vocab,
  script,
  copy,
}: {
  readonly canDoText: string;
  readonly variationLabels: readonly string[];
  readonly vocab: readonly AssembledToken[];
  readonly script: Script;
  readonly copy: ReturnType<typeof getCourseCopy>;
}): ReactElement {
  const recapCopy = copy.lesson.recap;
  return (
    <div className="a1-lesson-recap">
      <p className="a1-lesson-recap__can-do" data-recap="can-do">
        <strong>{recapCopy.canDoLabel}: </strong>
        {canDoText}
      </p>
      {variationLabels.length > 0 ? (
        <div data-recap="variation">
          <h3>{recapCopy.variationLabel}</h3>
          <ul>
            {variationLabels.map((label) => (
              <li key={label}>{label}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <div data-recap="vocab">
        <h3>{recapCopy.vocabLabel}</h3>
        <ul className="a1-lesson-recap__vocab">
          {vocab.map((token) => (
            <li key={token.id}>
              {script === "hiragana" ? (
                <span lang="ja">
                  <JapaneseSegmentText jp={token.jp} reading={token.reading} />
                </span>
              ) : null}
              <span className="a1-lesson-recap__romaji">{token.romaji}</span>
            </li>
          ))}
        </ul>
      </div>
      <Notice
        tone="info"
        title={recapCopy.nextRetrievalTitle}
        body={recapCopy.nextRetrievalBody}
      />
    </div>
  );
}
