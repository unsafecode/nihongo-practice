import { describe, expect, it } from "vitest";

import { A1_LESSON_IDS } from "../manifest";
import { validateA1Curriculum } from "./validateA1Curriculum";

describe("A1 curriculum reports", () => {
  it("derives 64 canonical learner-contract rows from production analysis", () => {
    const reports = validateA1Curriculum().reports;

    expect(reports.byLesson).toHaveLength(64);
    expect(reports.byLesson.map((row) => row.lessonId)).toEqual(A1_LESSON_IDS);
    expect(reports.byLesson.every((row) => row.visibleTargetKeys.length === 5)).toBe(true);
    expect(reports.unresolvedFindings).toEqual([]);
    expect(reports.repeatedFindings).toEqual([]);
  });

  it("aggregates the real production practice functions and interaction kinds", () => {
    const reports = validateA1Curriculum().reports;

    expect(reports.practiceFunctionDistribution["meaning-comprehension"]).toBe(64);
    expect(reports.practiceFunctionDistribution["form-discrimination"]).toBe(64);
    expect(reports.practiceFunctionDistribution["controlled-production"]).toBe(64);
    expect(reports.practiceFunctionDistribution["listening-speaking"]).toBe(64);
    expect(Object.values(reports.interactionKindDistribution).reduce((sum, count) => sum + count, 0)).toBe(
      64 * 5,
    );
  });
});
