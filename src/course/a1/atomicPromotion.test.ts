import { describe, expect, it } from "vitest";
import { courseModules } from "../data/course";
import { a1FoundationCatalogs } from "./catalog/catalog";
import { a1LessonContents } from "./curriculum/catalog";
import {
  A1_LESSON_IDS,
  A1_MODULE_IDS,
  A1_CANONICAL_POSITIONS,
} from "./manifest";

function firstIntroductionDiagnostic(): {
  readonly duplicateIntroductions: readonly string[];
  readonly missingLessonContents: readonly string[];
} {
  const introducedBy = new Map<string, string>();
  const duplicateIntroductions: string[] = [];

  for (const content of a1LessonContents) {
    for (const lexemeId of content.newLexemeIds) {
      const firstLessonId = introducedBy.get(lexemeId);
      if (firstLessonId) {
        duplicateIntroductions.push(
          `${lexemeId}: ${firstLessonId}, ${content.lessonId}`,
        );
      } else {
        introducedBy.set(lexemeId, content.lessonId);
      }
    }
  }

  const lessonContentIds = new Set(
    a1LessonContents.map((content) => content.lessonId),
  );
  return {
    duplicateIntroductions: duplicateIntroductions.sort(),
    missingLessonContents: A1_LESSON_IDS.filter(
      (lessonId) => !lessonContentIds.has(lessonId),
    ),
  };
}

describe("A1 atomic Foundations promotion", () => {
  it("publishes the 16-module, 64-lesson canonical course everywhere", () => {
    expect(A1_MODULE_IDS).toHaveLength(16);
    expect(A1_LESSON_IDS).toHaveLength(64);
    expect(a1LessonContents.map(({ lessonId }) => lessonId)).toEqual(
      A1_LESSON_IDS,
    );
    expect(a1FoundationCatalogs.modules).toHaveLength(16);
    expect(a1FoundationCatalogs.lessonPositions).toHaveLength(64);
    expect(courseModules).toHaveLength(16);
    expect(courseModules.flatMap(({ lessons }) => lessons)).toHaveLength(64);
    expect(A1_CANONICAL_POSITIONS["sentence-foundations-1"]).toBe(5);
    expect(A1_CANONICAL_POSITIONS["capstones-4"]).toBe(64);
  });

  it("reports no duplicate or missing first introductions across all 64 lessons", () => {
    expect(A1_LESSON_IDS).toHaveLength(64);
    expect(firstIntroductionDiagnostic()).toEqual({
      duplicateIntroductions: [],
      missingLessonContents: [],
    });
  });
});
