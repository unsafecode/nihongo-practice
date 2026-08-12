import { describe, expect, it } from "vitest";

import { A1_RETAINED_LESSON_IDS } from "../manifest";
import { validateA1Curriculum } from "./validateA1Curriculum";

describe("A1 curriculum reports", () => {
  it("derives 44 retained learner-contract rows from production analysis", () => {
    const reports = validateA1Curriculum().reports;
    const { lessonContractDistribution, productionBuilds } = reports;

    expect(reports.byLesson).toHaveLength(44);
    expect(reports.byLesson.map((row) => row.lessonId)).toEqual(A1_RETAINED_LESSON_IDS);
    expect(reports.byLesson.every((row) => row.visibleTargetKeys.length === 5)).toBe(true);
    // Base owns every phonetic lesson now, so retained A1 is entirely
    // semantic: 40 instructional + 4 synthesis capstones.
    expect(lessonContractDistribution).toEqual({
      instructional: 40,
      synthesis: 4,
    });
    expect(
      lessonContractDistribution.instructional +
        lessonContractDistribution.synthesis,
    ).toBe(44);
    expect(productionBuilds).toEqual({
      analyzed: true,
      semanticLessonCount: 44,
      curriculumViewBuildCount: 88,
      practiceModelBuildCount: 44,
    });
    expect(reports.unresolvedFindings).toEqual([]);
    expect(reports.repeatedFindings).toEqual([]);
  });

  it("aggregates the real production practice functions and interaction kinds", () => {
    const reports = validateA1Curriculum().reports;

    expect(reports.practiceFunctionDistribution["meaning-comprehension"]).toBe(44);
    expect(reports.practiceFunctionDistribution["form-discrimination"]).toBe(44);
    expect(reports.practiceFunctionDistribution["controlled-production"]).toBe(44);
    expect(reports.practiceFunctionDistribution["listening-speaking"]).toBe(44);
    expect(Object.values(reports.interactionKindDistribution).reduce((sum, count) => sum + count, 0)).toBe(
      44 * 5,
    );
  });
});
