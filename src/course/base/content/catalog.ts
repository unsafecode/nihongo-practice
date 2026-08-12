import { deepFreeze } from "../../foundations/deepFreeze";
import type { BaseLessonContent } from "../catalog/types";
import { BASE_LESSON_IDS } from "../manifest";
import { BASE_SOUND_LESSONS } from "./module01Sounds";
import { BASE_SENTENCE_FOUNDATIONS_LESSONS } from "./module02SentenceFoundations";
import { BASE_TOPIC_QUESTIONS_LESSONS } from "./module03TopicQuestions";
import { BASE_POLITE_VERBS_LESSONS } from "./module04PoliteVerbs";
import { BASE_ARGUMENT_PARTICLES_LESSONS } from "./module05ArgumentParticles";
import { BASE_TIME_MOVEMENT_LESSONS } from "./module06TimeMovement";
import { BASE_COPULA_ADJECTIVES_LESSONS } from "./module07CopulaAdjectives";
import { BASE_EXISTENCE_LOCATION_LESSONS } from "./module08ExistenceLocation";
import { BASE_REQUESTS_CONNECTION_LESSONS } from "./module09RequestsConnection";
import { BASE_SYNTHESIS_LESSON_CONTENTS } from "./module10Synthesis";

export type BaseContentCatalogError =
  | "invalid-catalog-shape"
  | "lesson-count"
  | "missing-lesson"
  | "duplicate-lesson"
  | "lesson-order";

export interface BaseContentCatalogValidation {
  readonly ok: boolean;
  readonly errors: readonly BaseContentCatalogError[];
}

function denseLessonArray(
  value: unknown,
): readonly Readonly<Record<string, unknown>>[] | null {
  if (!Array.isArray(value)) return null;
  try {
    if (
      Object.getPrototypeOf(value) !== Array.prototype ||
      Object.getOwnPropertySymbols(value).length > 0
    ) {
      return null;
    }
    const descriptors = Object.getOwnPropertyDescriptors(value);
    const lengthDescriptor = descriptors["length"] as
      | PropertyDescriptor
      | undefined;
    if (
      !lengthDescriptor ||
      !("value" in lengthDescriptor) ||
      typeof lengthDescriptor.value !== "number" ||
      Object.getOwnPropertyNames(value).length !== lengthDescriptor.value + 1
    ) {
      return null;
    }
    const lessons: Readonly<Record<string, unknown>>[] = [];
    for (let index = 0; index < lengthDescriptor.value; index += 1) {
      const itemDescriptor = descriptors[String(index)];
      if (
        !itemDescriptor ||
        !itemDescriptor.enumerable ||
        !("value" in itemDescriptor)
      ) {
        return null;
      }
      const item = itemDescriptor.value;
      if (item === null || typeof item !== "object" || Array.isArray(item)) {
        return null;
      }
      const prototype = Object.getPrototypeOf(item);
      if (
        (prototype !== Object.prototype && prototype !== null) ||
        Object.getOwnPropertySymbols(item).length > 0
      ) {
        return null;
      }
      const lessonId = Object.getOwnPropertyDescriptor(item, "lessonId");
      if (
        !lessonId ||
        !lessonId.enumerable ||
        !("value" in lessonId) ||
        typeof lessonId.value !== "string"
      ) {
        return null;
      }
      lessons.push(item as Readonly<Record<string, unknown>>);
    }
    return Object.freeze(lessons);
  } catch {
    return null;
  }
}

export function validateBaseLessonContentCatalog(
  value: unknown,
): BaseContentCatalogValidation {
  const lessons = denseLessonArray(value);
  if (!lessons) {
    return { ok: false, errors: ["invalid-catalog-shape"] };
  }
  const errors = new Set<BaseContentCatalogError>();
  if (lessons.length !== BASE_LESSON_IDS.length) errors.add("lesson-count");
  const seen = new Set<string>();
  for (let index = 0; index < lessons.length; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(lessons[index], "lessonId");
    const lessonId = descriptor && "value" in descriptor ? descriptor.value : null;
    if (typeof lessonId !== "string") {
      errors.add("invalid-catalog-shape");
      continue;
    }
    if (seen.has(lessonId)) errors.add("duplicate-lesson");
    seen.add(lessonId);
    if (!BASE_LESSON_IDS.includes(lessonId)) errors.add("missing-lesson");
    if (lessonId !== BASE_LESSON_IDS[index]) errors.add("lesson-order");
  }
  for (const lessonId of BASE_LESSON_IDS) {
    if (!seen.has(lessonId)) errors.add("missing-lesson");
  }
  return errors.size === 0
    ? { ok: true, errors: [] }
    : { ok: false, errors: [...errors] };
}

export const baseLessonContents: readonly BaseLessonContent[] = deepFreeze([
  ...BASE_SOUND_LESSONS,
  ...BASE_SENTENCE_FOUNDATIONS_LESSONS,
  ...BASE_TOPIC_QUESTIONS_LESSONS,
  ...BASE_POLITE_VERBS_LESSONS,
  ...BASE_ARGUMENT_PARTICLES_LESSONS,
  ...BASE_TIME_MOVEMENT_LESSONS,
  ...BASE_COPULA_ADJECTIVES_LESSONS,
  ...BASE_EXISTENCE_LOCATION_LESSONS,
  ...BASE_REQUESTS_CONNECTION_LESSONS,
  ...BASE_SYNTHESIS_LESSON_CONTENTS,
]);

export const BASE_CONTENT_CATALOG_VALIDATION =
  validateBaseLessonContentCatalog(baseLessonContents);

if (!BASE_CONTENT_CATALOG_VALIDATION.ok) {
  throw new Error(
    `Invalid aggregate Base content catalog: ${BASE_CONTENT_CATALOG_VALIDATION.errors.join(", ")}`,
  );
}
