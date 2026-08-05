import { describe, expect, it } from "vitest";

import { A1_MODULE_IDS } from "./manifest";
import {
  A1_AREAS,
  A1_AREA_IDS,
  validateA1Areas,
} from "./areas";
import type { A1CourseArea } from "./types";

function cloneAreas(): A1CourseArea[] {
  return A1_AREAS.map((area) => ({
    ...area,
    moduleIds: [...area.moduleIds],
  }));
}

function expectAreaError(
  areas: readonly A1CourseArea[],
  code: string,
): void {
  const result = validateA1Areas(areas);
  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.errors.map((error) => error.code)).toContain(code);
  }
}

function missingAreaIdFixture(areaId: A1CourseArea["id"]): A1CourseArea[] {
  return cloneAreas().filter((area) => area.id !== areaId);
}

describe("A1 areas", () => {
  it("defines the exact ordered canonical Foundations authoring contract", () => {
    expect(A1_AREA_IDS).toEqual([
      "sounds",
      "foundations",
      "situations",
      "synthesis",
    ]);
    expect(A1_AREAS).toEqual([
      {
        id: "sounds",
        moduleIds: ["sounds"],
        titleCopyId: "a1-area-sounds-title",
        descriptionCopyId: "a1-area-sounds-description",
      },
      {
        id: "foundations",
        moduleIds: [
          "sentence-foundations",
          "topic-questions",
          "polite-verbs",
          "time-movement",
        ],
        titleCopyId: "a1-area-foundations-title",
        descriptionCopyId: "a1-area-foundations-description",
      },
      {
        id: "situations",
        moduleIds: [
          "introductions",
          "essential-questions",
          "actions",
          "routines",
          "past-negative",
          "places",
          "people",
          "descriptions",
          "shopping",
          "existence-needs",
        ],
        titleCopyId: "a1-area-situations-title",
        descriptionCopyId: "a1-area-situations-description",
      },
      {
        id: "synthesis",
        moduleIds: ["capstones"],
        titleCopyId: "a1-area-synthesis-title",
        descriptionCopyId: "a1-area-synthesis-description",
      },
    ]);
    expect(A1_AREAS.flatMap((area) => area.moduleIds)).toEqual(A1_MODULE_IDS);
  });

  it("accepts the canonical area authoring contract", () => {
    expect(validateA1Areas(A1_AREAS)).toEqual({ ok: true });
  });

  it("rejects a non-four-area contract", () => {
    expectAreaError(cloneAreas().slice(0, 3), "area-count");
  });

  it("rejects area IDs out of the required order", () => {
    const areas = cloneAreas();
    [areas[0], areas[1]] = [areas[1], areas[0]];
    expectAreaError(areas, "area-order");
  });

  it("rejects duplicate area IDs", () => {
    const areas = cloneAreas();
    areas[1] = { ...areas[1], id: "sounds" };
    expectAreaError(areas, "duplicate-area-id");
  });

  it("rejects unknown area IDs", () => {
    const areas = cloneAreas();
    areas[1] = {
      ...areas[1],
      id: "unknown" as A1CourseArea["id"],
    };
    expectAreaError(areas, "unknown-area-id");
  });

  it("rejects a required area ID missing from a dedicated fixture", () => {
    expectAreaError(missingAreaIdFixture("foundations"), "missing-area-id");
  });

  it("rejects an empty area", () => {
    const areas = cloneAreas();
    areas[2] = { ...areas[2], moduleIds: [] };
    expectAreaError(areas, "empty-area");
  });

  it("rejects a module assigned to multiple areas", () => {
    const areas = cloneAreas();
    areas[1] = {
      ...areas[1],
      moduleIds: [...areas[1].moduleIds, "sounds"],
    };
    expectAreaError(areas, "duplicate-module-membership");
  });

  it("rejects an unknown module membership", () => {
    const areas = cloneAreas();
    areas[1] = {
      ...areas[1],
      moduleIds: [
        ...areas[1].moduleIds,
        "not-an-a1-module",
      ] as A1CourseArea["moduleIds"],
    };
    expectAreaError(areas, "unknown-module-membership");
  });

  it("rejects a missing canonical module", () => {
    const areas = cloneAreas();
    areas[1] = {
      ...areas[1],
      moduleIds: areas[1].moduleIds.filter(
        (moduleId) => moduleId !== "polite-verbs",
      ),
    };
    expectAreaError(areas, "missing-module-membership");
  });

  it("rejects a complete module union in the wrong order", () => {
    const areas = cloneAreas();
    const modules = [...areas[1].moduleIds];
    [modules[0], modules[1]] = [modules[1], modules[0]];
    areas[1] = { ...areas[1], moduleIds: modules };
    expectAreaError(areas, "module-union-order");
  });

  it("deep-freezes the canonical area authoring contract", () => {
    expect(Object.isFrozen(A1_AREA_IDS)).toBe(true);
    expect(Object.isFrozen(A1_AREAS)).toBe(true);
    for (const area of A1_AREAS) {
      expect(Object.isFrozen(area)).toBe(true);
      expect(Object.isFrozen(area.moduleIds)).toBe(true);
    }
  });
});
