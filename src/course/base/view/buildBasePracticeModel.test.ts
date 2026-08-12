import { describe, expect, it } from "vitest";
import { BASE_LESSON_IDS, BASE_LESSON_MANIFEST } from "../manifest";
import { visibleSurfaceFingerprint } from "../validation/fingerprints";
import { V4_ACTIVITY_MIGRATION_MAP } from "../migration/v4ActivityMap";
import { baseCanonicalCatalog } from "../catalog/catalog";
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

const LOCALES = ["en", "it"] as const;

function categoryCounts(activities: readonly { readonly category: string }[]): number[] {
  return CATEGORY_ORDER.map(
    (category) => activities.filter((activity) => activity.category === category).length,
  );
}

describe("buildBasePracticeModel", () => {
  it.each(BASE_LESSON_IDS)("builds the required practice for %s", (lessonId) => {
    const result = buildBasePracticeModel(lessonId, "en");
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
    const result = buildBasePracticeModel("not-a-real-lesson", "en");
    expect(result).toEqual({
      ok: false,
      error: { code: "unknown-lesson", lessonId: "not-a-real-lesson", referenceId: "not-a-real-lesson" },
    });
  });

  it("assigns activity ids that never collide with a changed V4 activity id for the same lesson", () => {
    for (const lessonId of BASE_LESSON_IDS) {
      const result = buildBasePracticeModel(lessonId, "en");
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
      const practiceResult = buildBasePracticeModel(lessonId, "en");
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
    const result = buildBasePracticeModel("sentence-foundations-1", "en");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    for (const activity of result.model.activities) {
      expect(activity.fingerprint).not.toMatch(/[\u3040-\u30ff\u4e00-\u9fff]/u);
    }
  });

  it("resolves every activity's authored instruction/accepted/retry feedback to a real, distinct EN and IT string (never a bare copy id)", () => {
    for (const lessonId of BASE_LESSON_IDS) {
      for (const locale of LOCALES) {
        const result = buildBasePracticeModel(lessonId, locale);
        expect(result.ok).toBe(true);
        if (!result.ok) continue;
        for (const activity of result.model.activities) {
          expect(activity.instruction.length).toBeGreaterThan(0);
          expect(activity.acceptedFeedback.length).toBeGreaterThan(0);
          expect(activity.retryFeedback.length).toBeGreaterThan(0);
          // Never the raw copy-id shape (e.g. "lesson-activity-1-instruction").
          expect(activity.instruction).not.toMatch(/-instruction$/);
          expect(activity.acceptedFeedback).not.toMatch(/-feedback-accepted$/);
          expect(activity.retryFeedback).not.toMatch(/-feedback-retry$/);
        }
      }
      const en = buildBasePracticeModel(lessonId, "en");
      const it = buildBasePracticeModel(lessonId, "it");
      expect(en.ok).toBe(true);
      expect(it.ok).toBe(true);
      if (!en.ok || !it.ok) continue;
      // At least one activity's instruction must actually differ between
      // locales, or EN/IT copy resolution would be silently coincidental.
      const anyDiffers = en.model.activities.some((activity, index) => {
        const other = it.model.activities[index];
        return other && activity.instruction !== other.instruction;
      });
      expect(anyDiffers).toBe(true);
    }
  });

  it("grades completion/constrained-construction/transformation activities as choice-equivalent whenever the catalog authors optionTargetIds, instead of an ungraded reveal", () => {
    for (const lessonId of BASE_LESSON_IDS) {
      const content = baseCanonicalCatalog.lessonById.get(lessonId);
      if (!content || content.contract === "phonetic") continue;
      const result = buildBasePracticeModel(lessonId, "en");
      expect(result.ok).toBe(true);
      if (!result.ok) continue;
      for (const rawActivity of content.activities) {
        if (
          rawActivity.interactionKind !== "completion" &&
          rawActivity.interactionKind !== "constrained-construction" &&
          rawActivity.interactionKind !== "transformation"
        ) {
          continue;
        }
        const built = result.model.activities.find((activity) => activity.id === rawActivity.id);
        expect(built).toBeDefined();
        if (!built) continue;
        const hasOptions = (rawActivity.optionTargetIds?.length ?? 0) > 0;
        if (hasOptions) {
          expect(built.interactionKind).toBe("choice");
          if (built.interactionKind === "choice") {
            expect(built.options.length).toBeGreaterThan(0);
            expect(built.options.some((option) => option.id === built.correctOptionId)).toBe(true);
          }
        } else {
          expect(built.interactionKind).toBe("reveal");
        }
      }
    }
  });

  it("gives every tile-ordering activity's initial bank order a deterministic order provably different from correctTileIds", () => {
    // Known previously-affected activities (opaque-id sort coincided with
    // canonical order): sentence-foundations-3 activity 3,
    // sentence-foundations-4 activity 3, topic-questions-4 activity 3.
    let tileOrderingCount = 0;
    for (const lessonId of BASE_LESSON_IDS) {
      const result = buildBasePracticeModel(lessonId, "en");
      expect(result.ok).toBe(true);
      if (!result.ok) continue;
      for (const activity of result.model.activities) {
        if (activity.interactionKind !== "tile-ordering") continue;
        tileOrderingCount += 1;
        if (activity.tiles.length < 2) continue;
        const bankOrder = activity.bankTileIds;
        expect(bankOrder).toHaveLength(activity.correctTileIds.length);
        const matchesCanonical = bankOrder.every(
          (id, index) => id === activity.correctTileIds[index],
        );
        expect(matchesCanonical).toBe(false);
      }
    }
    expect(tileOrderingCount).toBeGreaterThan(0);
  });
});
