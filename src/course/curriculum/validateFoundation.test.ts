import { describe, expect, it } from "vitest";
import type {
  CurriculumFoundation,
  CurriculumModuleFoundation,
} from "./types";
import { validateCurriculumFoundation } from "./validateFoundation";

const module = (
  id: string,
  order: number,
  prerequisiteIds: readonly string[] = [],
): CurriculumModuleFoundation => ({
  id,
  order,
  phase: "orient",
  prerequisiteIds,
  coverage: { lessons: 1, introducedVerbs: 0, vocabulary: 1 },
});

const foundation = (
  modules: readonly CurriculumModuleFoundation[],
): CurriculumFoundation => ({
  version: "a0-a1-v1",
  modules,
});

describe("validateCurriculumFoundation", () => {
  it("reports duplicate ids and orders", () => {
    const result = validateCurriculumFoundation(
      foundation([module("a", 1), module("a", 1)]),
      { enforceReleaseTotals: false },
    );
    expect(result.errors.map(({ code }) => code)).toEqual([
      "duplicate-module-id",
      "duplicate-module-order",
    ]);
  });

  it("reports missing and non-earlier prerequisites", () => {
    const result = validateCurriculumFoundation(
      foundation([
        module("a", 1, ["missing"]),
        module("b", 2, ["c"]),
        module("c", 3),
      ]),
      { enforceReleaseTotals: false },
    );
    expect(result.errors).toEqual([
      { code: "missing-prerequisite", moduleId: "a", referenceId: "missing" },
      { code: "prerequisite-not-earlier", moduleId: "b", referenceId: "c" },
    ]);
  });

  it("reports cycles even when release totals are not enforced", () => {
    const result = validateCurriculumFoundation(
      foundation([module("a", 1, ["b"]), module("b", 2, ["a"])]),
      { enforceReleaseTotals: false },
    );
    const cycle = result.errors.find(({ code }) => code === "prerequisite-cycle");
    expect(cycle).toBeDefined();
    expect(new Set([cycle?.moduleId, cycle?.referenceId])).toEqual(
      new Set(["a", "b"]),
    );
  });

  it("reports a phase that regresses in the ordered path", () => {
    const result = validateCurriculumFoundation(
      foundation([
        { ...module("a", 1), phase: "build" },
        { ...module("b", 2), phase: "orient" },
      ]),
      { enforceReleaseTotals: false },
    );
    expect(result.errors).toContainEqual({
      code: "invalid-phase-order",
      moduleId: "b",
    });
  });

  it("reports invalid coverage values", () => {
    const result = validateCurriculumFoundation(
      foundation([
        {
          ...module("a", 1),
          coverage: { lessons: 0, introducedVerbs: -1, vocabulary: -2 },
        },
      ]),
      { enforceReleaseTotals: false },
    );
    expect(result.errors.map(({ code }) => code)).toEqual([
      "invalid-lesson-count",
      "invalid-verb-count",
      "invalid-vocabulary-count",
    ]);
  });

  it("reports release module and total mismatches", () => {
    const result = validateCurriculumFoundation(foundation([module("a", 1)]));
    expect(result.errors.map(({ code }) => code)).toEqual([
      "invalid-module-count",
      "invalid-lesson-total",
      "invalid-verb-total",
      "invalid-vocabulary-total",
    ]);
  });
});
