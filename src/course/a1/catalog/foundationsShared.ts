/**
 * Shared authored data for the four published Foundations modules.
 */

import { deepFreeze } from "../../foundations/deepFreeze";
import type { A1Lexeme } from "../curriculum/types";
import {
  a1LexemeById,
  a1LexemeByValueId,
  a1Lexemes,
} from "../curriculum/lexicon";
import { A1_LESSON_IDS_BY_MODULE } from "../manifest";

/** The four Foundations module ids, in canonical order. */
export const FOUNDATIONS_MODULE_IDS: readonly string[] = deepFreeze([
  "sentence-foundations",
  "topic-questions",
  "polite-verbs",
  "time-movement",
]);

/** The sixteen Foundations lesson ids, derived from the canonical manifest. */
export const FOUNDATIONS_LESSON_IDS: readonly string[] = deepFreeze([
  ...A1_LESSON_IDS_BY_MODULE["sentence-foundations"],
  ...A1_LESSON_IDS_BY_MODULE["topic-questions"],
  ...A1_LESSON_IDS_BY_MODULE["polite-verbs"],
  ...A1_LESSON_IDS_BY_MODULE["time-movement"],
]);

/**
 * Exact Foundations lesson-to-vocabulary table. Existing canonical IDs retain
 * their established spellings (including `benkyou-suru`); no alias lexeme IDs
 * are introduced for the published Foundations sequence.
 */
export const FOUNDATIONS_LEXEME_IDS_BY_LESSON: Readonly<
  Record<string, readonly string[]>
> = deepFreeze({
  "sentence-foundations-1": [
    "a1-lexeme-desu",
    "a1-lexeme-watashi",
    "a1-lexeme-kore",
    "a1-lexeme-gakusei",
    "a1-lexeme-sensei",
  ],
  "sentence-foundations-2": [
    "a1-lexeme-yuki",
    "a1-lexeme-ken",
    "a1-lexeme-mina",
    "a1-lexeme-namae",
  ],
  "sentence-foundations-3": [
    "a1-lexeme-anata",
    "a1-lexeme-kono-hito",
    "a1-lexeme-sono-hito",
    "a1-lexeme-ano-hito",
  ],
  "sentence-foundations-4": [
    "a1-lexeme-isha",
    "a1-lexeme-kaishain",
    "a1-lexeme-enjinia",
    "a1-lexeme-doukyuusei",
  ],
  "topic-questions-1": [
    "a1-lexeme-nihonjin",
    "a1-lexeme-itaria-jin",
    "a1-lexeme-amerika-jin",
    "a1-lexeme-furansujin",
  ],
  // `wakaru` would force a polite verbal form before the polite-verb module.
  // French supplies the fourth language item while this lesson teaches only
  // nominal topic/focus copular patterns.
  "topic-questions-2": [
    "a1-lexeme-nihongo",
    "a1-lexeme-eigo",
    "a1-lexeme-itaria-go",
    "a1-lexeme-furansugo",
  ],
  "topic-questions-3": [
    "a1-lexeme-dare",
    "a1-lexeme-nani",
    "a1-lexeme-nan",
    "a1-lexeme-doko",
  ],
  "topic-questions-4": [
    "a1-lexeme-sore",
    "a1-lexeme-are",
    "a1-lexeme-dore",
    "a1-lexeme-koppu",
  ],
  "polite-verbs-1": [
    "a1-lexeme-hataraku",
    "a1-lexeme-benkyou-suru",
    "a1-lexeme-suru",
    "a1-lexeme-yasumu",
  ],
  "polite-verbs-2": [
    "a1-lexeme-taberu",
    "a1-lexeme-nomu",
    "a1-lexeme-yomu",
    "a1-lexeme-kaku",
  ],
  "polite-verbs-3": [
    "a1-lexeme-miru",
    "a1-lexeme-kiku",
    "a1-lexeme-kau",
    "a1-lexeme-kaeru",
    "a1-lexeme-iku",
  ],
  "polite-verbs-4": [
    "a1-lexeme-kaisha",
    "a1-lexeme-toshokan",
    "a1-lexeme-kafe",
    "a1-lexeme-gakkou",
  ],
  "time-movement-1": [
    "a1-lexeme-rokuji",
    "a1-lexeme-shichiji",
    "a1-lexeme-hachiji",
    "a1-lexeme-kuji",
  ],
  "time-movement-2": [
    "a1-lexeme-asa",
    "a1-lexeme-hiru",
    "a1-lexeme-ban",
    "a1-lexeme-yoru",
  ],
  "time-movement-3": [
    "a1-lexeme-kinou",
    "a1-lexeme-kyou",
    "a1-lexeme-senshuu",
    "a1-lexeme-ototoi",
  ],
  "time-movement-4": [
    "a1-lexeme-eki",
    "a1-lexeme-densha",
    "a1-lexeme-basu",
    "a1-lexeme-jitensha",
  ],
});

/** Alias for consumers that name the Foundations lexical allocation as vocabulary. */
export const FOUNDATIONS_VOCABULARY_BY_LESSON = FOUNDATIONS_LEXEME_IDS_BY_LESSON;

/**
 * @deprecated The Foundations lexicon is now part of the published A1 lexicon.
 * Retained as an identity alias for legacy authoring consumers.
 */
export const a1ExpandedFoundationsLexemes = a1Lexemes;
/** @deprecated Use {@link a1LexemeById}; this is the same index. */
export const a1ExpandedFoundationsLexemeById = a1LexemeById;
/** @deprecated Use {@link a1LexemeByValueId}; this is the same index. */
export const a1ExpandedFoundationsLexemeByValueId = a1LexemeByValueId;

/** The one Can-do each Foundations module teaches. */
export const FOUNDATIONS_CANDO_IDS_BY_MODULE: Readonly<
  Record<string, readonly string[]>
> = deepFreeze({
  "sentence-foundations": ["a1-can-do-sentence-foundations"],
  "topic-questions": ["a1-can-do-topic-questions"],
  "polite-verbs": ["a1-can-do-polite-verbs"],
  "time-movement": ["a1-can-do-time-movement"],
});

/**
 * Learner-note focus by Foundations lesson.
 */
export const FOUNDATIONS_LEARNING_NOTE_IDS_BY_LESSON: Readonly<
  Record<string, string>
> = deepFreeze({
  "sentence-foundations-1": "a1-note-sentence-chunks",
  "sentence-foundations-2": "a1-note-recoverable-omission",
  "sentence-foundations-3": "a1-note-anata-limited",
  "sentence-foundations-4": "a1-note-identity-dialogue",
  "topic-questions-1": "a1-note-topic-wa-copula-desu",
  "topic-questions-2": "a1-note-particle-ga",
  "topic-questions-3": "a1-note-question-ka-words",
  "topic-questions-4": "a1-note-question-dialogue",
  "polite-verbs-1": "a1-note-dictionary-masu-classes",
  "polite-verbs-2": "a1-note-masu-object-o",
  "polite-verbs-3": "a1-note-masu-masen",
  "polite-verbs-4": "a1-note-location-ni-de-contrast",
  "time-movement-1": "a1-note-time-ni",
  "time-movement-2": "a1-note-mashita",
  "time-movement-3": "a1-note-mashita-masen-deshita",
  "time-movement-4": "a1-note-direction-transport-dialogue",
});

function resolveLessonLexemes(
  lexemeIdsByLesson: Readonly<Record<string, readonly string[]>>,
): Readonly<Record<string, readonly A1Lexeme[]>> {
  const resolved: Record<string, readonly A1Lexeme[]> = {};

  for (const [lessonId, lexemeIds] of Object.entries(lexemeIdsByLesson)) {
    resolved[lessonId] = lexemeIds.map((lexemeId) => {
      const lexeme = a1ExpandedFoundationsLexemeById[lexemeId];
      if (!lexeme) {
        throw new Error(
          `Foundations vocabulary references missing lexeme "${lexemeId}" in "${lessonId}".`,
        );
      }
      return lexeme;
    });
  }

  return deepFreeze(resolved);
}

/** Resolved canonical lexemes for Foundations authoring; never a mutable Map. */
export const FOUNDATIONS_LEXEMES_BY_LESSON = resolveLessonLexemes(
  FOUNDATIONS_LEXEME_IDS_BY_LESSON,
);

function assertFoundationsTableIntegrity(): void {
  const lessonIds = Object.keys(FOUNDATIONS_LEXEME_IDS_BY_LESSON);
  if (
    lessonIds.length !== FOUNDATIONS_LESSON_IDS.length ||
    lessonIds.some((lessonId, index) => lessonId !== FOUNDATIONS_LESSON_IDS[index])
  ) {
    throw new Error("Foundations vocabulary lesson ids must match the expanded manifest order.");
  }

  const seenLexemeIds = new Set<string>();
  for (const [lessonId, lexemeIds] of Object.entries(
    FOUNDATIONS_LEXEME_IDS_BY_LESSON,
  )) {
    if (lexemeIds.length < 4 || lexemeIds.length > 6) {
      throw new Error(`Foundations lesson "${lessonId}" must contain four to six lexemes.`);
    }
    for (const lexemeId of lexemeIds) {
      if (!lexemeId.startsWith("a1-lexeme-")) {
        throw new Error(`Foundations lexeme id "${lexemeId}" must use the a1-lexeme- prefix.`);
      }
      if (seenLexemeIds.has(lexemeId)) {
        throw new Error(`Foundations lexeme id "${lexemeId}" appears more than once.`);
      }
      seenLexemeIds.add(lexemeId);
    }
  }
}

assertFoundationsTableIntegrity();
