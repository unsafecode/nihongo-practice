import type { Locale } from "../../../i18n/LocaleContext";
import { a1FoundationCatalogs } from "../catalog/catalog";
import {
  a1LearningNoteById,
  a1LexemeById,
  // Every published A1 route, including the twenty Base rehomed in Task 16, so
  // the historical phonetic and legacy-route exercise paths keep resolving
  // their authored feedback instead of failing closed.
  legacyA1LessonContentById as a1LessonContentById,
} from "./catalog";
import type { A1PracticeFunction } from "./types";

export interface A1ExerciseFeedback {
  readonly accepted: string;
  readonly retry: string;
}

const FORM_CUE: Readonly<
  Record<Locale, Readonly<Record<A1PracticeFunction, string>>>
> = {
    en: {
      "meaning-comprehension": "meaning",
      "form-discrimination": "form",
      "controlled-production": "word order and form",
      transformation: "changed form",
      "contextual-response": "construction",
      "listening-speaking": "sound contrast",
    },
    it: {
      "meaning-comprehension": "significato",
      "form-discrimination": "forma",
      "controlled-production": "ordine e forma delle parole",
      transformation: "forma trasformata",
      "contextual-response": "costruzione",
      "listening-speaking": "contrasto sonoro",
    },
  };

const FALLBACK_MEANING: Readonly<Record<Locale, string>> = {
  en: "the assessed meaning",
  it: "il significato valutato",
};

const FALLBACK_CONCEPT: Readonly<Record<Locale, string>> = {
  en: "The taught pattern",
  it: "Lo schema studiato",
};

export function feedbackConceptTitle(
  title: string,
  forbiddenFullTargets: readonly string[],
  locale: Locale,
): string {
  const fullTitle = title.trim();
  if (!fullTitle) return FALLBACK_CONCEPT[locale];

  const normalizedTitle = fullTitle.normalize("NFC");
  const containsForbiddenFullTarget = forbiddenFullTargets.some((target) => {
    const fullTarget = target.trim();
    return (
      fullTarget.length > 0 &&
      normalizedTitle.includes(fullTarget.normalize("NFC"))
    );
  });
  return containsForbiddenFullTarget ? FALLBACK_CONCEPT[locale] : fullTitle;
}

/**
 * Localized post-submit explanation for an A1 generated exercise. It draws an
 * answer-safe note label and a lexeme meaning, never a realized target string.
 */
export function buildA1PracticeFeedback(
  lessonId: string,
  practiceFunction: A1PracticeFunction,
  assessedLexemeIds: readonly string[],
  forbiddenFullTargets: readonly string[],
): Readonly<Record<Locale, A1ExerciseFeedback>> | undefined {
  const content = a1LessonContentById[lessonId];
  const note = content ? a1LearningNoteById[content.learningNoteId] : undefined;
  if (!content || !note) return undefined;

  const sense = a1FoundationCatalogs.learningTargetSenses.find((candidate) =>
    assessedLexemeIds.includes(candidate.id),
  );
  const lexeme =
    (sense ? a1LexemeById[sense.lexemeId] : undefined) ??
    content.newLexemeIds
      .map((id) => a1LexemeById[id])
      .find((candidate) => candidate !== undefined);

  const feedback = {} as Record<Locale, A1ExerciseFeedback>;
  for (const locale of ["en", "it"] as const) {
    const meaning =
      lexeme?.meaning[locale].trim() || FALLBACK_MEANING[locale];
    const concept = feedbackConceptTitle(
      note.title[locale],
      forbiddenFullTargets,
      locale,
    );
    const form = FORM_CUE[locale][practiceFunction];
    feedback[locale] = {
      accepted:
        locale === "en"
          ? `${concept}: this construction fits the ${meaning} meaning and the taught ${form}.`
          : `${concept}: questa costruzione si adatta al significato di ${meaning} e alla ${form} studiata.`,
      retry:
        locale === "en"
          ? `${concept}: check the ${form} for ${meaning}, then try the construction again.`
          : `${concept}: controlla la ${form} per ${meaning}, poi riprova la costruzione.`,
    };
  }
  return feedback;
}
