import { describe, expect, it } from "vitest";
import { courseModules } from "../data/course";
import { module1ItemsByLesson } from "../a1/catalog/module01Sounds";
import { evaluateTranscript } from "../speech/evaluateTranscript";
import { normalizeTranscript } from "../speech/normalizeTranscript";
import { getA1SpokenAttemptModel } from "./a1SpokenAttemptModel";

/**
 * The A1-native spoken-attempt model contract (Phase 2 Task 6, master task
 * point 4). Every one of the release's 48 lessons must resolve to a complete
 * `SpokenAttemptModel`, or a structured error — never a partial model, and
 * never a legacy example-catalog lookup. The 44 semantic lessons resolve
 * from their guided-construction target's realized tokens; the 4 phonetic
 * `sounds-*` lessons resolve from their first authored phonetic item, so
 * that every lesson has a target or an explicit phonetic listen/repeat
 * equivalent, honoring the same `SpokenAttemptModel` shape either way.
 */
const allLessonIds = courseModules.flatMap((courseModule) =>
  courseModule.lessons.map((lesson) => lesson.id),
);

describe("getA1SpokenAttemptModel — every release lesson resolves", () => {
  it("names exactly 48 lessons across 12 modules", () => {
    expect(allLessonIds).toHaveLength(48);
  });

  for (const locale of ["en", "it"] as const) {
    it(`builds a complete model for all 48 lessons (${locale})`, () => {
      for (const lessonId of allLessonIds) {
        const result = getA1SpokenAttemptModel(lessonId, locale);
        if (!result.ok) {
          throw new Error(
            `getA1SpokenAttemptModel(${lessonId}, ${locale}) failed: ${result.error.code}` +
              (result.error.referenceId ? ` (${result.error.referenceId})` : ""),
          );
        }
        expect(result.model.lessonId).toBe(lessonId);
        expect(result.model.targetJp.length).toBeGreaterThan(0);
        expect(result.model.targetRomaji.length).toBeGreaterThan(0);
        expect(result.model.lessonTitle.length).toBeGreaterThan(0);
        expect(result.model.meaning.length).toBeGreaterThan(0);
        expect(result.model.segments.length).toBeGreaterThan(0);
        // No Japanese literal ever appears in localized copy fields.
        expect(result.model.meaning).not.toMatch(/[\u3040-\u30ff\u4e00-\u9fff]/);
        expect(result.model.lessonTitle).not.toMatch(/[\u3040-\u30ff\u4e00-\u9fff]/);
      }
    });
  }

  it("gives the 4 phonetic sounds lessons a single-item listen/repeat target", () => {
    for (const lessonId of Object.keys(module1ItemsByLesson)) {
      const result = getA1SpokenAttemptModel(lessonId, "en");
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.model.segments).toHaveLength(1);
      const [item] = module1ItemsByLesson[lessonId];
      expect(result.model.targetJp).toBe(item.glyph);
      expect(result.model.targetExampleId).toBe(item.id);
    }
  });

  it("gives semantic lessons a multi-token guided-construction target", () => {
    const result = getA1SpokenAttemptModel("introductions-1", "en");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.model.segments.length).toBeGreaterThan(0);
    expect(result.model.variants).toEqual([]);
  });

  it("fails structurally, not silently, for an unknown lesson id", () => {
    const result = getA1SpokenAttemptModel("no-such-lesson", "en");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("unknown-lesson");
    expect(result.error.lessonId).toBe("no-such-lesson");
  });

  it("resolves a prompt that the shared transcript evaluator can judge exactly against itself", () => {
    const result = getA1SpokenAttemptModel("actions-1", "en");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const transcript = normalizeTranscript(result.model.targetJp);
    const evaluation = evaluateTranscript(transcript, result.model.prompt);
    expect(evaluation.state).toBe("matched");
  });

  it("resolves a phonetic prompt the shared transcript evaluator can judge exactly against itself", () => {
    const result = getA1SpokenAttemptModel("sounds-1", "en");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const transcript = normalizeTranscript(result.model.targetJp);
    const evaluation = evaluateTranscript(transcript, result.model.prompt);
    expect(evaluation.state).toBe("matched");
  });
});
