import { describe, expect, it } from "vitest";
import { courseModules } from "./course";
import type { CourseModule } from "./types";
import { A1CourseShapeError, assertA1CourseShape } from "./runtimeShapeAssertion";

/**
 * The production runtime's small fail-closed structural gate (Phase 2 Task
 * 6, finding I3). Unlike `validateA1.test.ts` (which exercises the full
 * content-cross-referencing `validateA1Release()` gate that only the
 * `prebuild` script and the test suite still run), this proves the *always-
 * bundled* runtime counterpart genuinely throws on a malformed shape and
 * genuinely passes on the real release course — never a partial or silently
 * wrong `courseModules` export.
 */

function validModule(overrides: Partial<CourseModule> = {}): CourseModule {
  return {
    id: "m1",
    order: 1,
    prerequisiteIds: [],
    outcomeCopyIds: ["m1-outcome"],
    iconId: "identity",
    lessons: [
      {
        id: "l1",
        moduleId: "m1",
        order: 1,
        titleCopyId: "l1",
        objectiveCopyIds: ["l1-obj"],
      },
    ],
    ...overrides,
  };
}

describe("assertA1CourseShape — the always-bundled runtime structural gate (I3)", () => {
  it("passes silently for the real, validated release course", () => {
    expect(() => assertA1CourseShape(courseModules)).not.toThrow();
  });

  it("throws A1CourseShapeError for an empty module list", () => {
    expect(() => assertA1CourseShape([])).toThrow(A1CourseShapeError);
  });

  it("throws for a module with no lessons", () => {
    const modules = [validModule({ lessons: [] })];
    expect(() => assertA1CourseShape(modules)).toThrow(A1CourseShapeError);
  });

  it("throws for a duplicate module id", () => {
    const modules = [validModule(), validModule()];
    expect(() => assertA1CourseShape(modules)).toThrow(/duplicate module id/);
  });

  it("throws for a duplicate lesson id across modules", () => {
    const modules = [
      validModule(),
      validModule({
        id: "m2",
        lessons: [
          {
            id: "l1", // duplicate of m1's lesson id
            moduleId: "m2",
            order: 1,
            titleCopyId: "l1",
            objectiveCopyIds: ["l1-obj"],
          },
        ],
      }),
    ];
    expect(() => assertA1CourseShape(modules)).toThrow(/duplicate lesson id/);
  });

  it("throws for a lesson whose moduleId disagrees with its owning module", () => {
    const modules = [
      validModule({
        lessons: [
          {
            id: "l1",
            moduleId: "wrong-module",
            order: 1,
            titleCopyId: "l1",
            objectiveCopyIds: ["l1-obj"],
          },
        ],
      }),
    ];
    expect(() => assertA1CourseShape(modules)).toThrow(/owning module/);
  });

  it("throws for a lesson with no titleCopyId or no objectiveCopyIds", () => {
    const noTitle = [
      validModule({
        lessons: [
          { id: "l1", moduleId: "m1", order: 1, titleCopyId: "", objectiveCopyIds: ["l1-obj"] },
        ],
      }),
    ];
    expect(() => assertA1CourseShape(noTitle)).toThrow(A1CourseShapeError);

    const noObjectives = [
      validModule({
        lessons: [
          { id: "l1", moduleId: "m1", order: 1, titleCopyId: "l1", objectiveCopyIds: [] },
        ],
      }),
    ];
    expect(() => assertA1CourseShape(noObjectives)).toThrow(A1CourseShapeError);
  });

  it("throws when the total lesson/module count drifts from the known release totals", () => {
    // A structurally valid single module/lesson is still a corrupted release
    // shape (the real release always has 12 modules / 48 lessons) — this
    // catches a manifest/build regression that silently drops content.
    const modules = [validModule()];
    expect(() => assertA1CourseShape(modules)).toThrow(A1CourseShapeError);
  });
});
