import { describe, expect, it } from "vitest";

import { BASE_LESSON_IDS } from "../manifest";
import {
  BASE_CANONICAL_CATALOG_VALIDATION,
  BASE_LEXEME_RECURRENCE_VALIDATION,
  baseCanonicalCatalog,
  baseLexemes,
  validateBaseCanonicalCatalog,
  validateBaseLexemeRecurrence,
} from "../catalog/catalog";
import {
  BASE_CONTENT_CATALOG_VALIDATION,
  baseLessonContents,
  validateBaseLessonContentCatalog,
} from "./catalog";

describe("aggregate Base content catalog", () => {
  it("publishes all forty lessons in exact manifest order", () => {
    expect(baseLessonContents.map(({ lessonId }) => lessonId)).toEqual(
      BASE_LESSON_IDS,
    );
    expect(baseLessonContents).toHaveLength(40);
    expect(BASE_CONTENT_CATALOG_VALIDATION.errors).toEqual([]);
  });

  it("fails closed for missing, duplicate, reordered, sparse, and accessor input", () => {
    expect(validateBaseLessonContentCatalog(baseLessonContents.slice(1)).ok).toBe(
      false,
    );
    expect(
      validateBaseLessonContentCatalog([
        baseLessonContents[0],
        ...baseLessonContents.slice(0, -1),
      ]).ok,
    ).toBe(false);
    expect(
      validateBaseLessonContentCatalog([
        baseLessonContents[1],
        baseLessonContents[0],
        ...baseLessonContents.slice(2),
      ]).ok,
    ).toBe(false);

    const sparse = Array(baseLessonContents.length);
    sparse[0] = baseLessonContents[0];
    expect(validateBaseLessonContentCatalog(sparse).ok).toBe(false);

    let getterCalls = 0;
    const accessor = Object.defineProperty([], "0", {
      enumerable: true,
      get() {
        getterCalls += 1;
        return baseLessonContents[0];
      },
    });
    expect(validateBaseLessonContentCatalog(accessor).ok).toBe(false);
    expect(getterCalls).toBe(0);
  });
});

describe("canonical Base catalog", () => {
  it("indexes every canonical entity without mutable Map escape", () => {
    expect(baseLexemes.length).toBeGreaterThan(0);
    expect(baseLexemes.length).toBeLessThanOrEqual(250);
    expect(baseCanonicalCatalog.lessonById.size).toBe(40);
    expect(baseCanonicalCatalog.lexemeById.size).toBe(baseLexemes.length);
    expect(baseCanonicalCatalog.conceptById.size).toBe(
      baseCanonicalCatalog.concepts.length,
    );
    expect(baseCanonicalCatalog.exampleById.size).toBe(
      baseCanonicalCatalog.examples.length,
    );
    expect(baseCanonicalCatalog.dialogueById.size).toBe(
      baseCanonicalCatalog.dialogues.length,
    );
    expect(baseCanonicalCatalog.activityById.size).toBe(
      baseCanonicalCatalog.activities.length,
    );
    expect(baseCanonicalCatalog.copyById.size).toBe(
      baseCanonicalCatalog.copies.length,
    );
    expect(baseCanonicalCatalog.examples).toHaveLength(361);
    expect(baseCanonicalCatalog.dialogues).toHaveLength(10);
    expect(baseCanonicalCatalog.activities).toHaveLength(392);
    expect(
      "set" in (baseCanonicalCatalog.lessonById as unknown as object),
    ).toBe(false);
    expect(
      "delete" in (baseCanonicalCatalog.activityById as unknown as object),
    ).toBe(false);
    expect(BASE_CANONICAL_CATALOG_VALIDATION.errors).toEqual([]);
  });

  it("rejects duplicate and hostile catalog candidates without invoking accessors", () => {
    const duplicate = {
      ...baseCanonicalCatalog,
      lessons: [
        baseCanonicalCatalog.lessons[0],
        ...baseCanonicalCatalog.lessons,
      ],
    };
    expect(validateBaseCanonicalCatalog(duplicate).ok).toBe(false);

    let getterCalls = 0;
    const hostile = Object.defineProperty({}, "lessons", {
      enumerable: true,
      get() {
        getterCalls += 1;
        return baseCanonicalCatalog.lessons;
      },
    });
    expect(validateBaseCanonicalCatalog(hostile).ok).toBe(false);
    expect(getterCalls).toBe(0);
  });

  it("proves lexeme recurrence from actual visible targets", () => {
    expect(BASE_LEXEME_RECURRENCE_VALIDATION.errors).toEqual([]);
    expect(validateBaseLexemeRecurrence(baseLessonContents).errors).toEqual([]);
    expect(
      validateBaseLexemeRecurrence(
        baseLessonContents.map((lesson, index) =>
          index === 0 ? { ...lesson, activities: [] } : lesson,
        ),
      ).ok,
    ).toBe(false);
    expect(validateBaseLexemeRecurrence(undefined).ok).toBe(false);
    expect(validateBaseLexemeRecurrence(Array(40)).ok).toBe(false);
  });
});
