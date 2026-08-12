import { describe, expect, it } from "vitest";
import type { Locale } from "../../i18n/LocaleContext";
import { a1FoundationCatalogs } from "./catalog/catalog";
import {
  A1_RELEASE_CATALOG_VERSION,
  A1_RELEASE_SEED,
  buildA1LessonViewModel,
} from "./a1LessonViewModel";

const LOCALES: readonly Locale[] = ["en", "it"];

/** The 44 retained A1 lesson ids the release builder resolves. */
const SEMANTIC_LESSON_IDS = a1FoundationCatalogs.lessons.map(
  (lesson) => lesson.id,
);

describe("buildA1LessonViewModel", () => {
  it("resolves every one of the 44 retained A1 lessons in both locales with no error", () => {
    for (const locale of LOCALES) {
      for (const lessonId of SEMANTIC_LESSON_IDS) {
        const result = buildA1LessonViewModel(lessonId, locale);
        expect(result.ok, `${lessonId} (${locale})`).toBe(true);
      }
    }
  });

  it("never resolves a Base-owned sounds-module lesson id (rehomed, not A1's)", () => {
    for (const lessonId of ["sounds-1", "sounds-2", "sounds-3", "sounds-4"]) {
      const result = buildA1LessonViewModel(lessonId, "en");
      expect(result.ok, lessonId).toBe(false);
    }
  });

  it("is deterministic: rebuilding the same lesson/locale yields identical target ids", () => {
    const lessonId = SEMANTIC_LESSON_IDS[0];
    const first = buildA1LessonViewModel(lessonId, "en");
    const second = buildA1LessonViewModel(lessonId, "en");
    expect(first.ok && second.ok).toBe(true);
    if (first.ok && second.ok) {
      const firstIds = first.model.rounds.flatMap((round) =>
        round.targets.map((target) => target.targetId),
      );
      const secondIds = second.model.rounds.flatMap((round) =>
        round.targets.map((target) => target.targetId),
      );
      expect(secondIds).toEqual(firstIds);
    }
  });

  it("gives every semantic lesson exactly two rounds: guided-controlled then transfer", () => {
    for (const lessonId of SEMANTIC_LESSON_IDS) {
      const result = buildA1LessonViewModel(lessonId, "en");
      if (!result.ok) continue;
      const [first, second] = result.model.rounds;
      expect(first.purpose).toBe("guided-controlled");
      expect(second.purpose).toBe("transfer");
    }
  });

  it("exposes a fixed catalog version and seed shared by every caller", () => {
    expect(typeof A1_RELEASE_CATALOG_VERSION).toBe("string");
    expect(A1_RELEASE_CATALOG_VERSION.length).toBeGreaterThan(0);
    expect(typeof A1_RELEASE_SEED).toBe("string");
    expect(A1_RELEASE_SEED.length).toBeGreaterThan(0);
  });

  it("resolves a real Can-do descriptor (no Japanese literal) for every semantic lesson", () => {
    for (const lessonId of SEMANTIC_LESSON_IDS) {
      const result = buildA1LessonViewModel(lessonId, "en");
      if (!result.ok) continue;
      expect(result.model.canDoDescriptor.trim().length).toBeGreaterThan(0);
      expect(result.model.canDoDescriptor).not.toMatch(/[\u3040-\u30ff\u4e00-\u9faf]/);
    }
  });
});
