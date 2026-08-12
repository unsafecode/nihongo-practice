import { describe, expect, it } from "vitest";
import { BASE_LESSON_IDS, BASE_LESSON_MANIFEST } from "../manifest";
import { visibleSurfaceFingerprint } from "../validation/fingerprints";
import { V4_ACTIVITY_MIGRATION_MAP } from "../migration/v4ActivityMap";
import { buildBaseLessonViewModel } from "./buildBaseLessonViewModel";
import { buildBasePracticeModel } from "./buildBasePracticeModel";
import type { BaseActivityCategory } from "../catalog/activityContracts";

const CATEGORY_ORDER: readonly BaseActivityCategory[] = [
  "meaning-comprehension",
  "form-function-discrimination",
  "ordering",
  "controlled-production",
  "transformation",
  "error-diagnosis",
  "contextual-response",
  "cumulative-retrieval",
];

function categoryCounts(activities: readonly { readonly category: string }[]): number[] {
  return CATEGORY_ORDER.map(
    (category) => activities.filter((activity) => activity.category === category).length,
  );
}

describe("buildBasePracticeModel", () => {
  it.each(BASE_LESSON_IDS)("builds the required practice for %s", (lessonId) => {
    const result = buildBasePracticeModel(lessonId);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const nonSpoken = result.model.activities.filter((item) => item.mode === "non-spoken");
    const contract = BASE_LESSON_MANIFEST[lessonId].contract;
    expect(nonSpoken.length).toBe(contract === "phonetic" ? 6 : 8);
    if (contract !== "phonetic") {
      expect(new Set(nonSpoken.map((item) => item.category)).size).toBeGreaterThanOrEqual(6);
      expect(Math.max(...categoryCounts(nonSpoken))).toBeLessThanOrEqual(2);
    }
    expect(result.model.activities.filter((item) => item.kind === "listening")).toHaveLength(1);
    expect(result.model.activities.filter((item) => item.kind === "spoken")).toHaveLength(1);
  });

  it("returns unknown-lesson for an unknown id", () => {
    const result = buildBasePracticeModel("not-a-real-lesson");
    expect(result).toEqual({
      ok: false,
      error: { code: "unknown-lesson", lessonId: "not-a-real-lesson", referenceId: "not-a-real-lesson" },
    });
  });

  it("assigns activity ids that never collide with a changed V4 activity id for the same lesson", () => {
    for (const lessonId of BASE_LESSON_IDS) {
      const result = buildBasePracticeModel(lessonId);
      expect(result.ok).toBe(true);
      if (!result.ok) continue;
      const v4Ids = new Set(
        V4_ACTIVITY_MIGRATION_MAP.filter((row) => row.sourceLessonId === lessonId).map(
          (row) => row.sourceActivityId,
        ),
      );
      for (const activity of result.model.activities) {
        expect(v4Ids.has(activity.id)).toBe(false);
      }
    }
  });

  it("gives every practice activity's own visible surface a fingerprint distinct from this lesson's worked examples and dialogue", () => {
    for (const lessonId of BASE_LESSON_IDS) {
      const viewResult = buildBaseLessonViewModel(lessonId, "en");
      const practiceResult = buildBasePracticeModel(lessonId);
      expect(practiceResult.ok).toBe(true);
      if (!practiceResult.ok || !viewResult.ok) continue;
      const exampleFingerprints = new Set(
        viewResult.model.examples.map((example) => visibleSurfaceFingerprint(example.tokens)),
      );
      const dialogueFingerprints = new Set(
        (viewResult.model.dialogue ?? []).map((turn) => visibleSurfaceFingerprint(turn.tokens)),
      );
      for (const activity of practiceResult.model.activities) {
        const tokenSets: (readonly { readonly jp: string }[])[] = [];
        if ("answerTokens" in activity) tokenSets.push(activity.answerTokens);
        if ("tokens" in activity) tokenSets.push(activity.tokens);
        if ("correctTileIds" in activity) tokenSets.push(activity.tiles.map((tile) => tile.token));
        if ("options" in activity && "correctOptionId" in activity) {
          const correct = activity.options.find((option) => option.id === activity.correctOptionId);
          if (correct) tokenSets.push(correct.tokens);
        }
        for (const tokens of tokenSets) {
          const fingerprint = visibleSurfaceFingerprint(tokens);
          if (fingerprint.length === 0) continue;
          expect(exampleFingerprints.has(fingerprint)).toBe(false);
          expect(dialogueFingerprints.has(fingerprint)).toBe(false);
        }
      }
    }
  });

  it("never exposes the raw Japanese surface as the activity's public fingerprint", () => {
    const result = buildBasePracticeModel("sentence-foundations-1");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    for (const activity of result.model.activities) {
      expect(activity.fingerprint).not.toMatch(/[\u3040-\u30ff\u4e00-\u9fff]/u);
    }
  });
});
