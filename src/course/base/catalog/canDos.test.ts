import { describe, expect, it } from "vitest";

import { baseLessonContents } from "../content/catalog";
import { BASE_MODULE_IDS } from "../manifest";
import { BASE_REFERENCE_IDS } from "../references/catalog";
import {
  BASE_CAN_DO_OUTCOMES,
  BASE_CAN_DO_VALIDATION,
  baseCanDos,
} from "./canDos";
import {
  BASE_CHECKPOINT_REFERENCE_IDS,
  BASE_CHECKPOINT_SYNTHESIS_LESSON_IDS,
  BASE_CHECKPOINT_VALIDATION,
  baseCheckpoint,
} from "./checkpoint";

const forbiddenClaims =
  /\b(?:certif(?:y|ied|ication)|deficien(?:cy|t)|fail(?:ed|ure)?|lock(?:ed|ing)?|official\s+(?:cefr|jf))\b/iu;

describe("Base Can-do outcomes", () => {
  it("has a stable product-authored mechanics outcome for every module", () => {
    expect(baseCanDos).toHaveLength(10);
    expect(
      BASE_CAN_DO_OUTCOMES.map(({ moduleId }) => moduleId),
    ).toEqual(BASE_MODULE_IDS);
    expect(new Set(BASE_CAN_DO_OUTCOMES.map(({ canDoId }) => canDoId)).size).toBe(
      BASE_CAN_DO_OUTCOMES.length,
    );

    for (const outcome of BASE_CAN_DO_OUTCOMES) {
      expect([
        "a1-performance-mechanics",
        "practical-mechanics",
      ]).toContain(outcome.mechanicsLabel);
      expect(outcome.lessonIds.length).toBeGreaterThan(0);
      expect(outcome.evidenceActivityIds.length).toBeGreaterThan(0);
      expect(outcome.evidenceActivityIds).toEqual(
        outcome.lessonIds.map(
          (lessonId) =>
            baseLessonContents.find((lesson) => lesson.lessonId === lessonId)
              ?.activities[0]?.id,
        ),
      );
    }
    expect(BASE_CAN_DO_VALIDATION.errors).toEqual([]);
    expect(JSON.stringify({ baseCanDos, outcomes: BASE_CAN_DO_OUTCOMES })).not.toMatch(
      forbiddenClaims,
    );
  });
});

describe("Base checkpoint", () => {
  it("samples all five references and all four synthesis lessons", () => {
    expect(BASE_CHECKPOINT_REFERENCE_IDS).toEqual(BASE_REFERENCE_IDS);
    expect(BASE_CHECKPOINT_REFERENCE_IDS).toHaveLength(5);
    expect(BASE_CHECKPOINT_SYNTHESIS_LESSON_IDS).toEqual([
      "base-synthesis-1",
      "base-synthesis-2",
      "base-synthesis-3",
      "base-synthesis-4",
    ]);
    expect(BASE_CHECKPOINT_VALIDATION.errors).toEqual([]);
  });

  it("records observed evidence without certification or A1 unlocking", () => {
    const serialized = JSON.stringify(baseCheckpoint);
    expect(serialized).not.toMatch(forbiddenClaims);
    expect(serialized).not.toMatch(/unlock|acceptedExercise|consolidatedAt/i);
    expect(baseCheckpoint.observationPolicy).toEqual({
      recordsObservedEvidenceOnly: true,
      unlocksA1: false,
      isCertification: false,
    });
  });
});
