import { describe, expect, it } from "vitest";
import { curriculumFoundation } from "./foundation";
import { validateCurriculumFoundation } from "./validateFoundation";

describe("A0→A1 curriculum foundation", () => {
  it("declares 12 modules across the four stable phases", () => {
    expect(curriculumFoundation.modules).toHaveLength(12);
    expect(new Set(curriculumFoundation.modules.map(({ phase }) => phase))).toEqual(
      new Set(["orient", "build", "navigate", "synthesize"]),
    );
  });

  it("matches the approved coverage budget", () => {
    expect(validateCurriculumFoundation(curriculumFoundation)).toEqual({
      valid: true,
      errors: [],
      totals: { lessons: 40, introducedVerbs: 42, vocabulary: 270 },
    });
  });
});
