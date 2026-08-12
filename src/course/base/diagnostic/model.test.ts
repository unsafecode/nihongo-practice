import { describe, expect, it } from "vitest";

import {
  BASE_DIAGNOSTIC_DIMENSION_IDS,
  BASE_DIAGNOSTIC_RECOMMENDATION_MODULE_IDS,
  evaluateBaseDiagnostic,
} from "./model";

const completeAnswers = Object.freeze({
  "mora-timing": true,
  "sentence-anatomy": true,
  "particle-sense": true,
  "polite-verb-form": true,
});

describe("Base diagnostic evaluator", () => {
  it("uses exactly four content-independent dimensions", () => {
    expect(BASE_DIAGNOSTIC_DIMENSION_IDS).toEqual([
      "mora-timing",
      "sentence-anatomy",
      "particle-sense",
      "polite-verb-form",
    ]);
    expect(Object.isFrozen(BASE_DIAGNOSTIC_DIMENSION_IDS)).toBe(true);
  });

  it("returns only an immutable level, valid module, and boolean dimension record", () => {
    const result = evaluateBaseDiagnostic(completeAnswers);
    expect(result).toEqual({
      recommendedLevel: "a1",
      recommendedModuleId: "introductions",
      dimensionResults: completeAnswers,
    });
    if (result && !("error" in result)) {
      expect(["a0", "a1"]).toContain(result.recommendedLevel);
      expect(BASE_DIAGNOSTIC_RECOMMENDATION_MODULE_IDS).toContain(
        result.recommendedModuleId,
      );
      expect(Object.isFrozen(result)).toBe(true);
      expect(Object.isFrozen(result.dimensionResults)).toBe(true);
      expect(Object.keys(JSON.parse(JSON.stringify(result))).sort()).toEqual([
        "dimensionResults",
        "recommendedLevel",
        "recommendedModuleId",
      ]);
      expect(JSON.stringify(result)).not.toMatch(
        /acceptedExercise|canDo|checkpoint|consolidatedAt|timestamp/i,
      );
    }
  });

  it("is pure, deterministic, idempotent, and never mutates its input", () => {
    const answers = { ...completeAnswers, "particle-sense": false };
    const before = JSON.stringify(answers);
    const first = evaluateBaseDiagnostic(answers);
    const second = evaluateBaseDiagnostic(answers);

    expect(first).toEqual(second);
    expect(JSON.stringify(answers)).toBe(before);
    expect(first).toEqual({
      recommendedLevel: "a0",
      recommendedModuleId: "argument-particles",
      dimensionResults: answers,
    });
  });

  it("returns null for skip and fails hostile input closed", () => {
    expect(evaluateBaseDiagnostic("skip")).toBeNull();
    expect(evaluateBaseDiagnostic(undefined)).toEqual({
      error: "invalid-diagnostic-input",
    });
    expect(evaluateBaseDiagnostic({ ...completeAnswers, extra: true })).toEqual({
      error: "invalid-diagnostic-input",
    });
    expect(
      evaluateBaseDiagnostic({ ...completeAnswers, "mora-timing": undefined }),
    ).toEqual({ error: "invalid-diagnostic-input" });

    let getterCalls = 0;
    const accessor = Object.defineProperty({}, "mora-timing", {
      enumerable: true,
      get() {
        getterCalls += 1;
        return true;
      },
    });
    expect(evaluateBaseDiagnostic(accessor)).toEqual({
      error: "invalid-diagnostic-input",
    });
    expect(getterCalls).toBe(0);
  });
});
