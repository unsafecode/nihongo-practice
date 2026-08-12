import { deepFreeze } from "../../foundations/deepFreeze";
import { immutableReadonlyMap } from "../../foundations/immutableReadonlyMap";
import { immutableReadonlySet } from "../../foundations/immutableReadonlySet";
import type { BaseActivityDefinition, BaseConcept, BaseDialogue, BaseExample, BaseLexeme } from "./types";
import { BASE_CONCEPTS } from "./concepts";
import { BASE_LEXICON } from "./lexicon";
import { baseNavigationCopyEn } from "../copy/en";
import { baseNavigationCopyIt } from "../copy/it";
import { BASE_LESSON_IDS } from "../manifest";
import { baseLessonContents } from "../content/catalog";
import {
  BASE_SOUND_MODULE,
} from "../content/module01Sounds";
import { BASE_SENTENCE_FOUNDATIONS_MODULE } from "../content/module02SentenceFoundations";
import { BASE_TOPIC_QUESTIONS_MODULE } from "../content/module03TopicQuestions";
import {
  BASE_POLITE_VERBS_MODULE,
  task11PlainDataEqual,
  task11PlainDataSnapshot,
} from "../content/module04PoliteVerbs";
import { BASE_ARGUMENT_PARTICLES_MODULE } from "../content/module05ArgumentParticles";
import { BASE_TIME_MOVEMENT_MODULE } from "../content/module06TimeMovement";
import { BASE_COPULA_ADJECTIVES_MODULE } from "../content/module07CopulaAdjectives";
import { BASE_EXISTENCE_LOCATION_MODULE } from "../content/module08ExistenceLocation";
import { BASE_REQUESTS_CONNECTION_MODULE } from "../content/module09RequestsConnection";
import {
  BASE_SYNTHESIS_MODULE,
  BASE_SYNTHESIS_VALIDATION_CATALOGS,
} from "../content/module10Synthesis";
import type { BaseLessonContent } from "./types";

export interface BaseLocalizedCopyRecord {
  readonly id: string;
  readonly en: string;
  readonly it: string;
}

export interface BaseCanonicalCatalog {
  readonly lessons: readonly BaseLessonContent[];
  readonly lexemes: readonly BaseLexeme[];
  readonly concepts: readonly BaseConcept[];
  readonly examples: readonly BaseExample[];
  readonly dialogues: readonly BaseDialogue[];
  readonly activities: readonly BaseActivityDefinition[];
  readonly copies: readonly BaseLocalizedCopyRecord[];
  readonly lessonById: ReadonlyMap<string, BaseLessonContent>;
  readonly lexemeById: ReadonlyMap<string, BaseLexeme>;
  readonly conceptById: ReadonlyMap<string, BaseConcept>;
  readonly exampleById: ReadonlyMap<string, BaseExample>;
  readonly dialogueById: ReadonlyMap<string, BaseDialogue>;
  readonly activityById: ReadonlyMap<string, BaseActivityDefinition>;
  readonly copyById: ReadonlyMap<string, BaseLocalizedCopyRecord>;
}

export type BaseCanonicalCatalogError =
  | "invalid-catalog-shape"
  | "duplicate-id"
  | "missing-id"
  | "catalog-order";

export interface BaseCanonicalCatalogValidation {
  readonly ok: boolean;
  readonly errors: readonly BaseCanonicalCatalogError[];
}

const examples = deepFreeze([
  ...BASE_SYNTHESIS_VALIDATION_CATALOGS.examples.values(),
]);
const dialogues = deepFreeze([
  ...BASE_SYNTHESIS_VALIDATION_CATALOGS.dialogues.values(),
]);
const activities = deepFreeze(
  baseLessonContents.flatMap((lesson) => [...lesson.activities]),
);

function localizedCopy(id: string): BaseLocalizedCopyRecord {
  const en = baseNavigationCopyEn.content[id];
  const it = baseNavigationCopyIt.content[id];
  if (
    typeof en !== "string" ||
    en.trim().length === 0 ||
    typeof it !== "string" ||
    it.trim().length === 0
  ) {
    throw new Error(`Missing localized Base copy "${id}".`);
  }
  return { id, en, it };
}

const copies = deepFreeze(
  [...BASE_SYNTHESIS_VALIDATION_CATALOGS.copyIds]
    .sort()
    .map(localizedCopy),
);

export const baseLexemes: readonly BaseLexeme[] = BASE_LEXICON;

function ownData(value: unknown, key: string): unknown {
  if (value === null || typeof value !== "object") return undefined;
  try {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    return descriptor && descriptor.enumerable && "value" in descriptor
      ? descriptor.value
      : undefined;
  } catch {
    return undefined;
  }
}

function denseArray(value: unknown): readonly unknown[] | null {
  if (!Array.isArray(value)) return null;
  try {
    if (
      Object.getPrototypeOf(value) !== Array.prototype ||
      Object.getOwnPropertySymbols(value).length > 0
    ) {
      return null;
    }
    const descriptors = Object.getOwnPropertyDescriptors(value);
    const length = descriptors["length"] as PropertyDescriptor | undefined;
    if (
      !length ||
      !("value" in length) ||
      typeof length.value !== "number" ||
      Object.getOwnPropertyNames(value).length !== length.value + 1
    ) {
      return null;
    }
    const result: unknown[] = [];
    for (let index = 0; index < length.value; index += 1) {
      const descriptor = descriptors[String(index)];
      if (
        !descriptor ||
        !descriptor.enumerable ||
        !("value" in descriptor)
      ) {
        return null;
      }
      result.push(descriptor.value);
    }
    return Object.freeze(result);
  } catch {
    return null;
  }
}

function itemId(value: unknown): string | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  try {
    const prototype = Object.getPrototypeOf(value);
    if (
      (prototype !== Object.prototype && prototype !== null) ||
      Object.getOwnPropertySymbols(value).length > 0
    ) {
      return null;
    }
    const descriptor = Object.getOwnPropertyDescriptor(value, "id");
    return descriptor &&
      descriptor.enumerable &&
      "value" in descriptor &&
      typeof descriptor.value === "string" &&
      descriptor.value.length > 0
      ? descriptor.value
      : null;
  } catch {
    return null;
  }
}

function lessonItemId(value: unknown): string | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  try {
    const descriptor = Object.getOwnPropertyDescriptor(value, "lessonId");
    return descriptor &&
      descriptor.enumerable &&
      "value" in descriptor &&
      typeof descriptor.value === "string" &&
      descriptor.value.length > 0
      ? descriptor.value
      : null;
  } catch {
    return null;
  }
}

function idsFor(
  value: unknown,
  idOf: (entry: unknown) => string | null,
): readonly string[] | null {
  const values = denseArray(value);
  if (!values) return null;
  const ids: string[] = [];
  for (const entry of values) {
    const id = idOf(entry);
    if (!id) return null;
    ids.push(id);
  }
  return ids;
}

const EXPECTED_IDS = {
  lessons: BASE_LESSON_IDS,
  lexemes: BASE_LEXICON.map(({ id }) => id),
  concepts: BASE_CONCEPTS.map(({ id }) => id),
  examples: examples.map(({ id }) => id),
  dialogues: dialogues.map(({ id }) => id),
  activities: activities.map(({ id }) => id),
  copies: copies.map(({ id }) => id),
} as const;

export function validateBaseCanonicalCatalog(
  value: unknown,
): BaseCanonicalCatalogValidation {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return { ok: false, errors: ["invalid-catalog-shape"] };
  }
  try {
    const prototype = Object.getPrototypeOf(value);
    if (
      (prototype !== Object.prototype && prototype !== null) ||
      Object.getOwnPropertySymbols(value).length > 0
    ) {
      return { ok: false, errors: ["invalid-catalog-shape"] };
    }
  } catch {
    return { ok: false, errors: ["invalid-catalog-shape"] };
  }

  const errors = new Set<BaseCanonicalCatalogError>();
  for (const key of Object.keys(EXPECTED_IDS) as (keyof typeof EXPECTED_IDS)[]) {
    const ids = idsFor(
      ownData(value, key),
      key === "lessons" ? lessonItemId : itemId,
    );
    if (!ids) {
      errors.add("invalid-catalog-shape");
      continue;
    }
    if (new Set(ids).size !== ids.length) errors.add("duplicate-id");
    const expected = EXPECTED_IDS[key];
    if (
      ids.length !== expected.length ||
      expected.some((id) => !ids.includes(id))
    ) {
      errors.add("missing-id");
    }
    if (ids.some((id, index) => id !== expected[index])) {
      errors.add("catalog-order");
    }
  }
  return errors.size === 0
    ? { ok: true, errors: [] }
    : { ok: false, errors: [...errors] };
}

const rawCanonicalCatalog: BaseCanonicalCatalog = {
  lessons: baseLessonContents,
  lexemes: BASE_LEXICON,
  concepts: BASE_CONCEPTS,
  examples,
  dialogues,
  activities,
  copies,
  lessonById: immutableReadonlyMap(
    baseLessonContents.map((lesson) => [lesson.lessonId, lesson]),
  ),
  lexemeById: immutableReadonlyMap(BASE_LEXICON.map((lexeme) => [lexeme.id, lexeme])),
  conceptById: immutableReadonlyMap(BASE_CONCEPTS.map((concept) => [concept.id, concept])),
  exampleById: immutableReadonlyMap(examples.map((example) => [example.id, example])),
  dialogueById: immutableReadonlyMap(dialogues.map((dialogue) => [dialogue.id, dialogue])),
  activityById: immutableReadonlyMap(activities.map((activity) => [activity.id, activity])),
  copyById: immutableReadonlyMap(copies.map((copy) => [copy.id, copy])),
};

export const baseCanonicalCatalog: BaseCanonicalCatalog =
  deepFreeze(rawCanonicalCatalog);

export const BASE_CANONICAL_CATALOG_VALIDATION =
  validateBaseCanonicalCatalog(baseCanonicalCatalog);

export type BaseLexemeRecurrenceErrorCode =
  | "invalid-content-catalog"
  | "first-teach-not-visible"
  | "insufficient-later-retrieval";

export interface BaseLexemeRecurrenceError {
  readonly code: BaseLexemeRecurrenceErrorCode;
  readonly lexemeId?: string;
  readonly lessonId?: string;
}

export interface BaseLexemeRecurrenceValidation {
  readonly ok: boolean;
  readonly errors: readonly BaseLexemeRecurrenceError[];
}

const SEMANTIC_LESSONS = deepFreeze([
  ...BASE_SENTENCE_FOUNDATIONS_MODULE.lessons,
  ...BASE_TOPIC_QUESTIONS_MODULE.lessons,
  ...BASE_POLITE_VERBS_MODULE.lessons,
  ...BASE_ARGUMENT_PARTICLES_MODULE.lessons,
  ...BASE_TIME_MOVEMENT_MODULE.lessons,
  ...BASE_COPULA_ADJECTIVES_MODULE.lessons,
  ...BASE_EXISTENCE_LOCATION_MODULE.lessons,
  ...BASE_REQUESTS_CONNECTION_MODULE.lessons,
  ...BASE_SYNTHESIS_MODULE.lessons,
]);

const VISIBLE_LEXEME_IDS_BY_LESSON: ReadonlyMap<string, ReadonlySet<string>> =
  (() => {
    const entries: (readonly [string, ReadonlySet<string>])[] = [];
    for (const lesson of BASE_SOUND_MODULE.lessons) {
      entries.push([
        lesson.content.lessonId,
        new Set(lesson.anchorWords.map(({ id }) => id)),
      ]);
    }
    for (const lesson of SEMANTIC_LESSONS) {
      const ids = new Set<string>();
      const targets = [
        ...lesson.examples,
        ...(lesson.dialogue?.turns ?? []),
        ...lesson.activityDesigns.flatMap((design) => [
          design.promptTarget,
          design.acceptedAnswerTarget,
          ...design.optionTargets,
        ]),
      ];
      for (const target of targets) {
        for (const id of target.lexemeIds) ids.add(id);
      }
      entries.push([lesson.content.lessonId, ids]);
    }
    return immutableReadonlyMap(entries);
  })();

const SYNTHESIS_SURFACES_BY_LEXEME: ReadonlyMap<string, ReadonlySet<string>> =
  (() => {
    const surfacesByLexeme = new Map<string, Set<string>>();
    for (const lesson of BASE_SYNTHESIS_MODULE.lessons) {
      const targets = [
        ...lesson.examples,
        ...(lesson.dialogue?.turns ?? []),
        ...lesson.activityDesigns.flatMap((design) => [
          design.promptTarget,
          design.acceptedAnswerTarget,
          ...design.optionTargets,
        ]),
      ];
      for (const target of targets) {
        const surface = target.tokens.map(({ jp }) => jp).join("");
        for (const lexemeId of target.lexemeIds) {
          const surfaces = surfacesByLexeme.get(lexemeId) ?? new Set<string>();
          surfaces.add(surface);
          surfacesByLexeme.set(lexemeId, surfaces);
        }
      }
    }
    return immutableReadonlyMap(
      [...surfacesByLexeme].map(([lexemeId, surfaces]) => [
        lexemeId,
        immutableReadonlySet(surfaces),
      ]),
    );
  })();

// Do not force a sensitive death verb into contrived later propositions merely
// to satisfy a recurrence count; its owned form lesson remains fully validated.
const NATURALNESS_RECURRENCE_EXEMPT_LEXEME_IDS: ReadonlySet<string> =
  immutableReadonlySet(["verb-shinu"]);

export function validateBaseLexemeRecurrence(
  value: unknown,
): BaseLexemeRecurrenceValidation {
  const snapshot = task11PlainDataSnapshot(value);
  const lessonIds = snapshot ? idsFor(snapshot.value, lessonItemId) : null;
  if (
    !lessonIds ||
    lessonIds.length !== BASE_LESSON_IDS.length ||
    lessonIds.some((id, index) => id !== BASE_LESSON_IDS[index]) ||
    !task11PlainDataEqual(snapshot?.value, baseLessonContents)
  ) {
    return {
      ok: false,
      errors: [{ code: "invalid-content-catalog" }],
    };
  }

  const errors: BaseLexemeRecurrenceError[] = [];
  for (const lexeme of BASE_LEXICON) {
    const firstPosition = BASE_LESSON_IDS.indexOf(lexeme.firstTeachLessonId);
    const firstVisible =
      VISIBLE_LEXEME_IDS_BY_LESSON.get(lexeme.firstTeachLessonId)?.has(
        lexeme.id,
      ) === true;
    if (!firstVisible) {
      errors.push({
        code: "first-teach-not-visible",
        lexemeId: lexeme.id,
        lessonId: lexeme.firstTeachLessonId,
      });
      continue;
    }
    const laterLessons = BASE_LESSON_IDS.filter(
      (lessonId, position) =>
        position > firstPosition &&
        VISIBLE_LEXEME_IDS_BY_LESSON.get(lessonId)?.has(lexeme.id) === true,
    );
    const synthesisSurfaceCount =
      SYNTHESIS_SURFACES_BY_LEXEME.get(lexeme.id)?.size ?? 0;
    if (
      laterLessons.length < 2 &&
      synthesisSurfaceCount < 2 &&
      !NATURALNESS_RECURRENCE_EXEMPT_LEXEME_IDS.has(lexeme.id)
    ) {
      errors.push({
        code: "insufficient-later-retrieval",
        lexemeId: lexeme.id,
        lessonId: lexeme.firstTeachLessonId,
      });
    }
  }
  return {
    ok: errors.length === 0,
    errors: deepFreeze(errors),
  };
}

export const BASE_LEXEME_RECURRENCE_VALIDATION =
  validateBaseLexemeRecurrence(baseLessonContents);
