/**
 * Staged shared authoring data for the four expanded Foundations modules.
 *
 * This module is intentionally not imported by the published A1 catalog. It
 * gives later authoring tasks one frozen vocabulary, Can-do, and learning-note
 * source without adding incomplete lessons to the 12-module / 48-lesson
 * runtime.
 */

import { deepFreeze } from "../../foundations/deepFreeze";
import type { A1Lexeme } from "../curriculum/types";
import {
  a1LexemeById,
  a1Lexemes,
  defineA1Lexeme,
} from "../curriculum/lexicon";
import { a1CanonicalSemanticValues } from "./a1SemanticCatalog";
import { A1_EXPANDED_LESSON_IDS_BY_MODULE } from "../manifest";

/** The four staged module ids, in their planned authoring order. */
export const FOUNDATIONS_MODULE_IDS: readonly string[] = deepFreeze([
  "sentence-foundations",
  "topic-questions",
  "polite-verbs",
  "time-movement",
]);

/** The sixteen staged lesson ids, derived from the expanded manifest in order. */
export const FOUNDATIONS_LESSON_IDS: readonly string[] = deepFreeze([
  ...A1_EXPANDED_LESSON_IDS_BY_MODULE["sentence-foundations"],
  ...A1_EXPANDED_LESSON_IDS_BY_MODULE["topic-questions"],
  ...A1_EXPANDED_LESSON_IDS_BY_MODULE["polite-verbs"],
  ...A1_EXPANDED_LESSON_IDS_BY_MODULE["time-movement"],
]);

/**
 * Exact Foundations lesson-to-vocabulary table. Existing canonical IDs retain
 * their established spellings (including `benkyou-suru`); no alias lexeme IDs
 * are introduced for the staged plan.
 */
export const FOUNDATIONS_LEXEME_IDS_BY_LESSON: Readonly<
  Record<string, readonly string[]>
> = deepFreeze({
  "sentence-foundations-1": [
    "a1-lexeme-watashi",
    "a1-lexeme-namae",
    "a1-lexeme-gakusei",
    "a1-lexeme-sensei",
  ],
  "sentence-foundations-2": [
    "a1-lexeme-yuki",
    "a1-lexeme-ken",
    "a1-lexeme-mina",
    "a1-lexeme-tomodachi",
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
  "topic-questions-2": [
    "a1-lexeme-nihongo",
    "a1-lexeme-eigo",
    "a1-lexeme-itaria-go",
    "a1-lexeme-wakaru",
  ],
  "topic-questions-3": [
    "a1-lexeme-dare",
    "a1-lexeme-nani",
    "a1-lexeme-nan",
    "a1-lexeme-doko",
  ],
  "topic-questions-4": [
    "a1-lexeme-kore",
    "a1-lexeme-sore",
    "a1-lexeme-are",
    "a1-lexeme-dore",
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
    "a1-lexeme-ashita",
    "a1-lexeme-mainichi",
  ],
  "time-movement-4": [
    "a1-lexeme-eki",
    "a1-lexeme-densha",
    "a1-lexeme-basu",
    "a1-lexeme-jitensha",
  ],
});

/** Alias for consumers that name the staged lexical allocation as vocabulary. */
export const FOUNDATIONS_VOCABULARY_BY_LESSON = FOUNDATIONS_LEXEME_IDS_BY_LESSON;

type ExpandedFoundationsLexemeIndex = Readonly<Record<string, A1Lexeme | undefined>>;

const publishedYasumu = a1LexemeById["a1-lexeme-yasumu"];
if (!publishedYasumu) {
  throw new Error('Published A1 lexicon is missing "a1-lexeme-yasumu".');
}

const expandedFoundationsYasumu = defineA1Lexeme({
  ...publishedYasumu,
  valueIds: ["a1-value-rest-bare", "a1-value-rest-routine"],
});

/**
 * Canonical lexemes for staged Foundations authoring. The published lexicon
 * deliberately remains limited to published semantic values until Task5
 * promotes the rest-routine value and its lesson atomically.
 */
export const a1ExpandedFoundationsLexemes: readonly A1Lexeme[] = deepFreeze(
  a1Lexemes.map((lexeme) =>
    lexeme.id === expandedFoundationsYasumu.id ? expandedFoundationsYasumu : lexeme,
  ),
);

function buildExpandedFoundationsLexemeIndexes(
  lexemes: readonly A1Lexeme[],
): Readonly<{
  byId: ExpandedFoundationsLexemeIndex;
  byValueId: ExpandedFoundationsLexemeIndex;
}> {
  const canonicalValueIds = new Set(a1CanonicalSemanticValues.map((value) => value.id));
  const byId: Record<string, A1Lexeme | undefined> = {};
  const byValueId: Record<string, A1Lexeme | undefined> = {};

  for (const lexeme of lexemes) {
    if (byId[lexeme.id] !== undefined) {
      throw new Error(`Duplicate expanded Foundations lexeme id "${lexeme.id}".`);
    }
    byId[lexeme.id] = lexeme;

    for (const valueId of lexeme.valueIds) {
      if (!canonicalValueIds.has(valueId)) {
        throw new Error(
          `Expanded Foundations lexeme "${lexeme.id}" references missing canonical semantic value "${valueId}".`,
        );
      }
      if (byValueId[valueId] !== undefined) {
        throw new Error(
          `Semantic value "${valueId}" has more than one expanded Foundations lexeme owner.`,
        );
      }
      byValueId[valueId] = lexeme;
    }
  }

  return deepFreeze({ byId, byValueId });
}

const a1ExpandedFoundationsLexemeIndexes = buildExpandedFoundationsLexemeIndexes(
  a1ExpandedFoundationsLexemes,
);

/** Canonical staged lookup, including the future rest-routine association. */
export const a1ExpandedFoundationsLexemeById: ExpandedFoundationsLexemeIndex =
  a1ExpandedFoundationsLexemeIndexes.byId;
export const a1ExpandedFoundationsLexemeByValueId: ExpandedFoundationsLexemeIndex =
  a1ExpandedFoundationsLexemeIndexes.byValueId;

/** The one staged Can-do each expanded Foundations module will teach. */
export const FOUNDATIONS_CANDO_IDS_BY_MODULE: Readonly<
  Record<string, readonly string[]>
> = deepFreeze({
  "sentence-foundations": ["a1-can-do-sentence-foundations"],
  "topic-questions": ["a1-can-do-topic-questions"],
  "polite-verbs": ["a1-can-do-polite-verbs"],
  "time-movement": ["a1-can-do-time-movement"],
});

/**
 * Planned learner-note focus by Foundations lesson. These references are staged
 * only: existing lesson content and first-teaching assignments remain unchanged.
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
  "topic-questions-4": "a1-note-question-ka-words",
  "polite-verbs-1": "a1-note-dictionary-masu-classes",
  "polite-verbs-2": "a1-note-particle-o",
  "polite-verbs-3": "a1-note-masu-masen",
  "polite-verbs-4": "a1-note-location-ni-de-contrast",
  "time-movement-1": "a1-note-time-ni",
  "time-movement-2": "a1-note-time-ni",
  "time-movement-3": "a1-note-mashita-masen-deshita",
  "time-movement-4": "a1-note-particle-he-contrast",
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

/** Resolved canonical lexemes for staged authoring; never a mutable Map. */
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
    if (lexemeIds.length !== 4) {
      throw new Error(`Foundations lesson "${lessonId}" must contain exactly four lexemes.`);
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
