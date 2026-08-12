import { describe, expect, it } from "vitest";
import {
  courseModulesByLevel,
  legacyA1CourseModules,
} from "../data/course";
import { a1FoundationCatalogs } from "./catalog/catalog";
import { a1LessonContents } from "./curriculum/catalog";
import {
  A1_LESSON_IDS,
  A1_MODULE_IDS,
  A1_CANONICAL_POSITIONS,
  A1_RETAINED_LESSON_IDS,
  A1_RETAINED_MODULE_IDS,
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
    missingLessonContents: A1_RETAINED_LESSON_IDS.filter(
      (lessonId) => !lessonContentIds.has(lessonId),
    ),
  };
}

describe("A1 atomic Foundations promotion", () => {
  it("publishes the 11-module, 44-lesson retained course everywhere", () => {
    // The canonical 64 published route ids and their canonical positions are
    // untouched by Task 16 — the twenty Base rehomed keep the exact ids and
    // positions they always had; only ownership moved.
    expect(A1_MODULE_IDS).toHaveLength(16);
    expect(A1_LESSON_IDS).toHaveLength(64);
    expect(A1_CANONICAL_POSITIONS["sentence-foundations-1"]).toBe(5);
    expect(A1_CANONICAL_POSITIONS["capstones-4"]).toBe(64);
    expect(legacyA1CourseModules).toHaveLength(16);
    expect(legacyA1CourseModules.flatMap(({ lessons }) => lessons)).toHaveLength(64);

    expect(A1_RETAINED_MODULE_IDS).toHaveLength(11);
    expect(A1_RETAINED_LESSON_IDS).toHaveLength(44);
    expect(a1LessonContents.map(({ lessonId }) => lessonId)).toEqual(
      A1_RETAINED_LESSON_IDS,
    );
    expect(a1FoundationCatalogs.modules).toHaveLength(11);
    expect(a1FoundationCatalogs.lessonPositions).toHaveLength(44);
    expect(courseModulesByLevel.a1).toHaveLength(11);
    expect(
      courseModulesByLevel.a1.flatMap(({ lessons }) => lessons),
    ).toHaveLength(44);
  });

  it("reports no duplicate or missing first introductions across all 44 retained lessons", () => {
    expect(A1_RETAINED_LESSON_IDS).toHaveLength(44);
    expect(firstIntroductionDiagnostic()).toEqual({
      duplicateIntroductions: [],
      missingLessonContents: [],
    });
  });
});
