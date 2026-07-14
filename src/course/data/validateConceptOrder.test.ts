import { describe, expect, it } from "vitest";
import type { CourseConceptId, PhaseId } from "./types";
import { courseModules } from "./course";
import { validateConceptOrder } from "./validate";

/**
 * Synthetic prerequisite-contract fixtures (design spec §2.6/§6.5, Task A).
 * `validateConceptOrder` proves every `requiredConceptId` is introduced in an
 * earlier lesson/module — or the same lesson — before it is used, that no
 * concept is introduced twice or is unknown, and that a synthesize-phase
 * (capstone) lesson introduces no foundational grammar. It never throws and
 * returns stable string error codes.
 */
interface ConceptLesson {
  readonly id: string;
  readonly introducedConceptIds: readonly CourseConceptId[];
  readonly requiredConceptIds: readonly CourseConceptId[];
}

function mod(
  id: string,
  order: number,
  lessons: readonly ConceptLesson[],
  phase: PhaseId = "build",
) {
  return { id, order, phase, lessons };
}

describe("validateConceptOrder — required-before-introduced", () => {
  it("flags a concept required by a lesson that no earlier lesson introduces", () => {
    const modules = [
      mod("m1", 1, [
        { id: "l1", introducedConceptIds: ["copula-desu"], requiredConceptIds: [] },
      ]),
      mod("m2", 2, [
        {
          id: "l2",
          introducedConceptIds: [],
          requiredConceptIds: ["object-o"],
        },
      ]),
    ];
    expect(validateConceptOrder(modules)).toContain(
      "concept-required-before-introduced:l2:object-o",
    );
  });

  it("flags a concept required before the later lesson that introduces it", () => {
    const modules = [
      mod("m1", 1, [
        { id: "l1", introducedConceptIds: [], requiredConceptIds: ["object-o"] },
      ]),
      mod("m2", 2, [
        { id: "l2", introducedConceptIds: ["object-o"], requiredConceptIds: [] },
      ]),
    ];
    expect(validateConceptOrder(modules)).toContain(
      "concept-required-before-introduced:l1:object-o",
    );
  });

  it("accepts a concept required and introduced in the same lesson", () => {
    const modules = [
      mod("m1", 1, [
        {
          id: "l1",
          introducedConceptIds: ["object-o"],
          requiredConceptIds: ["object-o"],
        },
      ]),
    ];
    expect(validateConceptOrder(modules)).toEqual([]);
  });

  it("accepts a concept introduced in an earlier module of a later requirer", () => {
    const modules = [
      mod("m2", 2, [
        {
          id: "l2",
          introducedConceptIds: [],
          requiredConceptIds: ["object-o"],
        },
      ]),
      mod("m1", 1, [
        { id: "l1", introducedConceptIds: ["object-o"], requiredConceptIds: [] },
      ]),
    ];
    expect(validateConceptOrder(modules)).toEqual([]);
  });

  it("flags a concept introduced by two different lessons", () => {
    const modules = [
      mod("m1", 1, [
        { id: "l1", introducedConceptIds: ["object-o"], requiredConceptIds: [] },
        { id: "l2", introducedConceptIds: ["object-o"], requiredConceptIds: [] },
      ]),
    ];
    expect(validateConceptOrder(modules)).toContain(
      "concept-duplicate-introduced:object-o:l2",
    );
  });

  it("flags an unknown concept id in either list", () => {
    const modules = [
      mod("m1", 1, [
        {
          id: "l1",
          introducedConceptIds: ["not-a-concept" as CourseConceptId],
          requiredConceptIds: [],
        },
      ]),
    ];
    expect(validateConceptOrder(modules)).toContain(
      "concept-unknown:l1:not-a-concept",
    );
  });

  it("flags a synthesize-phase (capstone) lesson that introduces foundational grammar", () => {
    const modules = [
      mod("m1", 1, [
        { id: "l1", introducedConceptIds: ["object-o"], requiredConceptIds: [] },
      ]),
      mod(
        "cap",
        2,
        [
          {
            id: "capstone",
            introducedConceptIds: ["question-ka"],
            requiredConceptIds: ["object-o"],
          },
        ],
        "synthesize",
      ),
    ];
    expect(validateConceptOrder(modules)).toContain(
      "concept-capstone-introduces:capstone:question-ka",
    );
  });
});

describe("validateConceptOrder — real course data (design spec §2.6/§6.5)", () => {
  it("introduces every required concept before it is used, with no unknown/duplicate concepts", () => {
    expect(validateConceptOrder(courseModules)).toEqual([]);
  });

  it("declares concepts on every lesson and introduces nothing new in the capstone", () => {
    for (const courseModule of courseModules) {
      for (const lesson of courseModule.lessons) {
        expect(Array.isArray(lesson.introducedConceptIds)).toBe(true);
        expect(Array.isArray(lesson.requiredConceptIds)).toBe(true);
        if (courseModule.phase === "synthesize") {
          expect(lesson.introducedConceptIds).toEqual([]);
        }
      }
    }
  });
});
