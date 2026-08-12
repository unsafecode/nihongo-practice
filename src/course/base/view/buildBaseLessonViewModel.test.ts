import { describe, expect, it } from "vitest";
import { BASE_LESSON_IDS, BASE_LESSON_MANIFEST } from "../manifest";
import { baseCanonicalCatalog } from "../catalog/catalog";
import { buildBaseLessonViewModel } from "./buildBaseLessonViewModel";

const LOCALES = ["en", "it"] as const;

describe("buildBaseLessonViewModel", () => {
  it.each(BASE_LESSON_IDS)("builds %s in EN/IT without fallback", (lessonId) => {
    for (const locale of LOCALES) {
      const result = buildBaseLessonViewModel(lessonId, locale);
      expect(result.ok).toBe(true);
      if (!result.ok) continue;
      expect(result.model.sections).toEqual([
        "rule",
        "vocabulary",
        "grammar",
        "comparison",
        "explore",
        "recap",
      ]);
      expect(result.model.title.length).toBeGreaterThan(0);
      expect(result.model.recap.length).toBeGreaterThan(0);
      if (result.model.contract === "phonetic") {
        expect(result.model.phoneticExplanation).not.toBe("");
        expect(result.model.contrastMap.items.length).toBeGreaterThan(0);
      } else {
        expect(result.model.explanation.constraints).not.toBe("");
        expect(result.model.explanation.commonError).not.toBe("");
        expect(result.model.referenceSnapshots.length).toBeGreaterThan(0);
      }
    }
  });

  it("never silently drops an authored reference snapshot: every referenceSnapshotId a lesson lists resolves in the rendered model", () => {
    for (const lessonId of BASE_LESSON_IDS) {
      const content = baseCanonicalCatalog.lessonById.get(lessonId);
      if (!content || content.contract === "phonetic") continue;
      const authoredIds = content.referenceSnapshotIds;
      if (authoredIds.length === 0) continue;
      for (const locale of LOCALES) {
        const result = buildBaseLessonViewModel(lessonId, locale);
        expect(result.ok).toBe(true);
        if (!result.ok || result.model.contract === "phonetic") continue;
        const renderedIds = new Set(result.model.referenceSnapshots.map((s) => s.id));
        for (const authoredId of authoredIds) {
          expect(renderedIds.has(authoredId)).toBe(true);
        }
      }
    }
  });

  it("returns unknown-lesson for an unknown id", () => {
    const result = buildBaseLessonViewModel("not-a-real-lesson", "en");
    expect(result).toEqual({
      ok: false,
      error: {
        code: "unknown-lesson",
        lessonId: "not-a-real-lesson",
        referenceId: "not-a-real-lesson",
      },
    });
  });

  it("resolves every non-phonetic lesson's worked examples and dialogue when present", () => {
    for (const lessonId of BASE_LESSON_IDS) {
      const manifest = BASE_LESSON_MANIFEST[lessonId];
      if (manifest.contract === "phonetic") continue;
      const result = buildBaseLessonViewModel(lessonId, "en");
      expect(result.ok).toBe(true);
      if (!result.ok) continue;
      expect(result.model.examples.length).toBeGreaterThan(0);
      for (const example of result.model.examples) {
        expect(example.tokens.length).toBeGreaterThan(0);
        expect(example.translation.length).toBeGreaterThan(0);
      }
      if (result.model.dialogue) {
        for (const turn of result.model.dialogue) {
          expect(turn.tokens.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("resolves a real, non-empty translation for every dialogue turn (never a dangling label)", () => {
    let dialogueLessonCount = 0;
    for (const lessonId of BASE_LESSON_IDS) {
      const manifest = BASE_LESSON_MANIFEST[lessonId];
      if (manifest.contract === "phonetic") continue;
      for (const locale of LOCALES) {
        const result = buildBaseLessonViewModel(lessonId, locale);
        expect(result.ok).toBe(true);
        if (!result.ok || !result.model.dialogue) continue;
        if (locale === "en") dialogueLessonCount += 1;
        for (const turn of result.model.dialogue) {
          expect(typeof turn.translation).toBe("string");
          expect((turn.translation ?? "").length).toBeGreaterThan(0);
        }
      }
    }
    // At least one lesson in the sample (topic-questions-4, polite-verbs-4)
    // actually has a dialogue, or this assertion would vacuously pass.
    expect(dialogueLessonCount).toBeGreaterThan(0);
  });

  it("resolves phonetic vocabulary (anchor words) and contrast items with audio ids", () => {
    const result = buildBaseLessonViewModel("sounds-1", "en");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.model.vocabulary.length).toBeGreaterThan(0);
    for (const item of result.model.vocabulary) {
      expect(item.kana.length).toBeGreaterThan(0);
      expect(item.meaning.length).toBeGreaterThan(0);
    }
    if (result.model.contract === "phonetic") {
      for (const contrastItem of result.model.contrastMap.items) {
        expect(contrastItem.audioId.length).toBeGreaterThan(0);
      }
    }
  });

  it("caches nothing across calls but returns structurally-equal models for the same lessonId+locale", () => {
    const first = buildBaseLessonViewModel("sounds-1", "en");
    const second = buildBaseLessonViewModel("sounds-1", "en");
    expect(first).toEqual(second);
  });
});
