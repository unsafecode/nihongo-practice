import { deepFreeze } from "../../foundations/deepFreeze";
import { A1_RETAINED_LESSON_IDS } from "../manifest";
import { a1LearningNoteById as sourceLearningNoteById } from "./grammar";
import { a1LexemeById as sourceLexemeById } from "./lexicon";
import { A1_REHOMED_LESSON_CONTENT } from "./inheritedBase";
import { a1Situations01to04LessonContent } from "./modules01to04";
import { a1Modules05to08LessonContent } from "./modules05to08";
import { a1Modules09to12LessonContent } from "./modules09to12";
import type { A1LessonContent, A1Lexeme } from "./types";

type LessonContentIndex = Readonly<Record<string, A1LessonContent | undefined>>;
type LexemeContentIndex = Readonly<Record<string, A1Lexeme | undefined>>;
type LearningNoteContentIndex = Readonly<
  Record<string, (typeof sourceLearningNoteById)[string] | undefined>
>;

function indexById<T extends Readonly<{ id?: string; lessonId?: string }>>(
  values: readonly T[],
  idOf: (value: T) => string,
  label: string,
): Readonly<Record<string, T | undefined>> {
  const result: Record<string, T | undefined> = {};
  for (const value of values) {
    const id = idOf(value);
    if (result[id] !== undefined) {
      throw new Error(`Duplicate A1 ${label} id "${id}".`);
    }
    result[id] = value;
  }
  return deepFreeze(result);
}

function assembleLessonContents(): readonly A1LessonContent[] {
  const contents = [
    ...a1Situations01to04LessonContent,
    ...a1Modules05to08LessonContent,
    ...a1Modules09to12LessonContent,
  ];
  const ids = contents.map(({ lessonId }) => lessonId);
  const known = new Set(ids);

  if (ids.length !== A1_RETAINED_LESSON_IDS.length) {
    throw new Error(
      `A1 curriculum catalog must contain ${A1_RETAINED_LESSON_IDS.length} lessons, has ${ids.length}.`,
    );
  }
  if (known.size !== ids.length) {
    throw new Error("A1 curriculum catalog contains duplicate lesson ids.");
  }
  for (const lessonId of A1_RETAINED_LESSON_IDS) {
    if (!known.has(lessonId)) {
      throw new Error(`A1 curriculum catalog is missing lesson "${lessonId}".`);
    }
  }
  if (ids.join(",") !== A1_RETAINED_LESSON_IDS.join(",")) {
    throw new Error("A1 curriculum catalog lesson order does not match the manifest.");
  }

  return deepFreeze(contents);
}

export const a1LessonContents: readonly A1LessonContent[] = assembleLessonContents();

export const a1LessonContentById: LessonContentIndex = indexById(
  a1LessonContents,
  ({ lessonId }) => lessonId,
  "lesson content",
);

/**
 * Authored lesson content for *every* published A1 route, including the twenty
 * Base rehomed in Task 16.
 *
 * The canonical A1 catalog above is the retained forty-four. This index adds
 * the rehomed lessons' unchanged authoring records so the historical,
 * legacy-route runtime paths — the phonetic exercise model, the review queue's
 * stored-entry reconciliation, and the 64-route practice/spoken models that
 * read `legacyA1CourseModules` — keep resolving the exact content they always
 * did. It is never the A1 level catalog: nothing here widens what A1 teaches.
 */
export const legacyA1LessonContentById: LessonContentIndex = deepFreeze({
  ...indexById(
    A1_REHOMED_LESSON_CONTENT,
    ({ lessonId }) => lessonId,
    "rehomed lesson content",
  ),
  ...a1LessonContentById,
});

export const a1LexemeById: LexemeContentIndex = sourceLexemeById;

export const a1LearningNoteById: LearningNoteContentIndex = sourceLearningNoteById;
