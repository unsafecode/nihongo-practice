import { describe, expect, it } from "vitest";
import type { LessonId } from "../../foundations/types";
import { A2_CANONICAL_POSITIONS } from "../manifest";
import { A2_GRAMMAR_SPIRAL, type A2GrammarForm } from "./grammarSpiral";
import { validateA2GrammarSpiral } from "./validateA2GrammarSpiral";

/**
 * Exact expected row data (task spec table). Pinning this independently of
 * `grammarSpiral.ts` proves the production data matches the spec literally,
 * not just structurally.
 */
const EXPECTED_SPIRAL: readonly A2GrammarForm[] = [
  {
    id: "recognize-plain-forms",
    canDoId: "a2-cando-recognize-plain-forms",
    introLessonId: "connected-conversation-4",
    controlledPracticeLessonId: "reasons-opinions-3",
    transferLessonId: "experiences-narratives-2",
    recurrenceLessonIds: ["a2-synthesis-1", "a2-synthesis-4"],
  },
  {
    id: "sequence-te",
    canDoId: "a2-cando-sequence-te",
    introLessonId: "sequencing-ongoing-1",
    controlledPracticeLessonId: "sequencing-ongoing-2",
    transferLessonId: "sequencing-ongoing-4",
    recurrenceLessonIds: ["restaurant-problems-4", "a2-synthesis-3"],
  },
  {
    id: "ongoing-teiru",
    canDoId: "a2-cando-ongoing-teiru",
    introLessonId: "sequencing-ongoing-3",
    controlledPracticeLessonId: "sequencing-ongoing-4",
    transferLessonId: "work-study-messages-3",
    recurrenceLessonIds: ["relationships-events-3", "a2-synthesis-2"],
  },
  {
    id: "request-tekudasai",
    canDoId: "a2-cando-request-tekudasai",
    introLessonId: "permission-requests-3",
    controlledPracticeLessonId: "restaurant-problems-2",
    transferLessonId: "work-study-messages-2",
    recurrenceLessonIds: ["travel-reservations-3", "a2-synthesis-3"],
  },
  {
    id: "permission-temoii",
    canDoId: "a2-cando-permission-temoii",
    introLessonId: "permission-requests-1",
    controlledPracticeLessonId: "permission-requests-3",
    transferLessonId: "neighborhood-services-1",
    recurrenceLessonIds: ["restaurant-problems-2", "a2-synthesis-2"],
  },
  {
    id: "prohibition-tewaikenai",
    canDoId: "a2-cando-prohibition-tewaikenai",
    introLessonId: "permission-requests-2",
    controlledPracticeLessonId: "permission-requests-4",
    transferLessonId: "practical-texts-2",
    recurrenceLessonIds: ["a2-synthesis-2"],
  },
  {
    id: "request-negative",
    canDoId: "a2-cando-negative-request",
    introLessonId: "permission-requests-4",
    controlledPracticeLessonId: "health-advice-3",
    transferLessonId: "travel-reservations-3",
    recurrenceLessonIds: ["a2-synthesis-3"],
  },
  {
    id: "experience-takoto",
    canDoId: "a2-cando-experience-takoto",
    introLessonId: "experiences-narratives-1",
    controlledPracticeLessonId: "experiences-narratives-3",
    transferLessonId: "travel-reservations-2",
    recurrenceLessonIds: ["relationships-events-3", "a2-synthesis-4"],
  },
  {
    id: "intentions-plans",
    canDoId: "a2-cando-intentions-plans",
    introLessonId: "plans-invitations-1",
    controlledPracticeLessonId: "plans-invitations-3",
    transferLessonId: "plans-invitations-4",
    recurrenceLessonIds: ["travel-reservations-1", "a2-synthesis-1"],
  },
  {
    id: "reason-kara",
    canDoId: "a2-cando-reason-kara",
    introLessonId: "reasons-opinions-1",
    controlledPracticeLessonId: "reasons-opinions-4",
    transferLessonId: "health-advice-2",
    recurrenceLessonIds: ["work-study-messages-1", "a2-synthesis-3"],
  },
  {
    id: "reason-node",
    canDoId: "a2-cando-reason-node",
    introLessonId: "reasons-opinions-2",
    controlledPracticeLessonId: "work-study-messages-1",
    transferLessonId: "travel-reservations-3",
    recurrenceLessonIds: ["a2-synthesis-3"],
  },
  {
    id: "opinion-toomou",
    canDoId: "a2-cando-opinion-toomou",
    introLessonId: "reasons-opinions-3",
    controlledPracticeLessonId: "reasons-opinions-4",
    transferLessonId: "shopping-returns-3",
    recurrenceLessonIds: ["practical-texts-3", "a2-synthesis-2"],
  },
  {
    id: "compare",
    canDoId: "a2-cando-compare",
    introLessonId: "shopping-returns-1",
    controlledPracticeLessonId: "shopping-returns-3",
    transferLessonId: "travel-reservations-2",
    recurrenceLessonIds: ["a2-synthesis-2"],
  },
  {
    id: "possibility",
    canDoId: "a2-cando-possibility",
    introLessonId: "neighborhood-services-1",
    controlledPracticeLessonId: "neighborhood-services-2",
    transferLessonId: "shopping-returns-3",
    recurrenceLessonIds: ["travel-reservations-1", "a2-synthesis-2"],
  },
  {
    id: "connectors",
    canDoId: "a2-cando-connectors",
    introLessonId: "connected-conversation-2",
    controlledPracticeLessonId: "reasons-opinions-4",
    transferLessonId: "experiences-narratives-2",
    recurrenceLessonIds: ["practical-texts-3", "a2-synthesis-1"],
  },
];

const UNKNOWN_LESSON: LessonId = "not-a-real-lesson-1";

/** Clone the real release spiral, replacing one row with a patched copy. */
function withRow(id: string, patch: Partial<A2GrammarForm>): readonly A2GrammarForm[] {
  return A2_GRAMMAR_SPIRAL.map((f) => (f.id === id ? { ...f, ...patch } : f));
}

describe("A2_GRAMMAR_SPIRAL data", () => {
  it("registers exactly 15 forms", () => {
    expect(A2_GRAMMAR_SPIRAL).toHaveLength(15);
  });

  it("matches the exact spec table row-for-row", () => {
    expect(A2_GRAMMAR_SPIRAL).toEqual(EXPECTED_SPIRAL);
  });

  it("uses a2-cando-<id> for every row except the request-negative exception", () => {
    for (const form of A2_GRAMMAR_SPIRAL) {
      if (form.id === "request-negative") {
        expect(form.canDoId).toBe("a2-cando-negative-request");
      } else {
        expect(form.canDoId).toBe(`a2-cando-${form.id}`);
      }
    }
  });

  it("gives every row a truthy Can-do, intro, practice, transfer, and >=1 recurrence lesson", () => {
    for (const form of A2_GRAMMAR_SPIRAL) {
      expect(form.canDoId).toBeTruthy();
      expect(form.introLessonId).toBeTruthy();
      expect(form.controlledPracticeLessonId).toBeTruthy();
      expect(form.transferLessonId).toBeTruthy();
      expect(form.recurrenceLessonIds.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("references only real lesson ids from the frozen A2 release", () => {
    for (const form of A2_GRAMMAR_SPIRAL) {
      expect(A2_CANONICAL_POSITIONS[form.introLessonId]).toBeDefined();
      expect(A2_CANONICAL_POSITIONS[form.controlledPracticeLessonId]).toBeDefined();
      expect(A2_CANONICAL_POSITIONS[form.transferLessonId]).toBeDefined();
      for (const lessonId of form.recurrenceLessonIds) {
        expect(A2_CANONICAL_POSITIONS[lessonId]).toBeDefined();
      }
    }
  });
});

describe("validateA2GrammarSpiral against the real release", () => {
  it("reports zero errors for the frozen A2 grammar spiral", () => {
    expect(validateA2GrammarSpiral(A2_GRAMMAR_SPIRAL, A2_CANONICAL_POSITIONS)).toEqual({
      valid: true,
      errors: [],
    });
  });
});

describe("validateA2GrammarSpiral missing-field codes", () => {
  it("flags grammar-form-missing-cando for an empty canDoId", () => {
    const broken = withRow("ongoing-teiru", { canDoId: "" });
    expect(validateA2GrammarSpiral(broken, A2_CANONICAL_POSITIONS).errors).toEqual([
      { code: "grammar-form-missing-cando", id: "ongoing-teiru" },
    ]);
  });

  it("flags grammar-form-missing-intro for an empty introLessonId", () => {
    const broken = withRow("ongoing-teiru", { introLessonId: "" });
    expect(validateA2GrammarSpiral(broken, A2_CANONICAL_POSITIONS).errors).toEqual([
      { code: "grammar-form-missing-intro", id: "ongoing-teiru" },
    ]);
  });

  it("flags grammar-form-missing-practice for an empty controlledPracticeLessonId", () => {
    const broken = withRow("ongoing-teiru", { controlledPracticeLessonId: "" });
    expect(validateA2GrammarSpiral(broken, A2_CANONICAL_POSITIONS).errors).toEqual([
      { code: "grammar-form-missing-practice", id: "ongoing-teiru" },
    ]);
  });

  it("flags grammar-form-missing-transfer for an empty transferLessonId", () => {
    const broken = withRow("ongoing-teiru", { transferLessonId: "" });
    expect(validateA2GrammarSpiral(broken, A2_CANONICAL_POSITIONS).errors).toEqual([
      { code: "grammar-form-missing-transfer", id: "ongoing-teiru" },
    ]);
  });

  it("flags grammar-form-missing-recurrence for an empty recurrenceLessonIds array", () => {
    const broken = withRow("ongoing-teiru", { recurrenceLessonIds: [] });
    expect(validateA2GrammarSpiral(broken, A2_CANONICAL_POSITIONS).errors).toEqual([
      { code: "grammar-form-missing-recurrence", id: "ongoing-teiru" },
    ]);
  });
});

describe("validateA2GrammarSpiral role-before-intro", () => {
  it("flags a transfer lesson that canonically precedes its own intro", () => {
    const broken = withRow("ongoing-teiru", { transferLessonId: "connected-conversation-1" });
    const codes = validateA2GrammarSpiral(broken, A2_CANONICAL_POSITIONS).errors.map((e) => e.code);
    expect(codes).toContain("grammar-role-before-intro");
    expect(validateA2GrammarSpiral(broken, A2_CANONICAL_POSITIONS).errors).toEqual([
      { code: "grammar-role-before-intro", id: "ongoing-teiru:connected-conversation-1" },
    ]);
  });

  it("flags a controlled-practice lesson that canonically precedes its own intro", () => {
    const broken = withRow("ongoing-teiru", { controlledPracticeLessonId: "connected-conversation-1" });
    expect(validateA2GrammarSpiral(broken, A2_CANONICAL_POSITIONS).errors).toEqual([
      { code: "grammar-role-before-intro", id: "ongoing-teiru:connected-conversation-1" },
    ]);
  });

  it("flags a recurrence lesson that canonically precedes its own intro", () => {
    const broken = withRow("ongoing-teiru", {
      recurrenceLessonIds: ["connected-conversation-1", "a2-synthesis-2"],
    });
    const codes = validateA2GrammarSpiral(broken, A2_CANONICAL_POSITIONS).errors.map((e) => e.code);
    expect(codes).toEqual(["grammar-role-before-intro"]);
    expect(validateA2GrammarSpiral(broken, A2_CANONICAL_POSITIONS).errors).toEqual([
      { code: "grammar-role-before-intro", id: "ongoing-teiru:connected-conversation-1" },
    ]);
  });

  it("allows a role lesson exactly equal in canonical position to its intro", () => {
    // "equal would be allowed by the plan wording 'precedes'" — reusing the intro lesson
    // itself as the transfer lesson must not raise grammar-role-before-intro.
    const broken = withRow("ongoing-teiru", { transferLessonId: "sequencing-ongoing-3" });
    expect(validateA2GrammarSpiral(broken, A2_CANONICAL_POSITIONS).errors).toEqual([]);
  });
});

describe("validateA2GrammarSpiral unknown lesson ids", () => {
  it("rejects an unknown introLessonId using grammar-form-missing-intro rather than skipping it", () => {
    const broken = withRow("ongoing-teiru", { introLessonId: UNKNOWN_LESSON });
    expect(validateA2GrammarSpiral(broken, A2_CANONICAL_POSITIONS).errors).toEqual([
      { code: "grammar-form-missing-intro", id: "ongoing-teiru" },
    ]);
  });

  it("rejects an unknown controlledPracticeLessonId using grammar-form-missing-practice rather than skipping it", () => {
    const broken = withRow("ongoing-teiru", { controlledPracticeLessonId: UNKNOWN_LESSON });
    expect(validateA2GrammarSpiral(broken, A2_CANONICAL_POSITIONS).errors).toEqual([
      { code: "grammar-form-missing-practice", id: "ongoing-teiru" },
    ]);
  });

  it("rejects an unknown transferLessonId using grammar-form-missing-transfer rather than skipping it", () => {
    const broken = withRow("ongoing-teiru", { transferLessonId: UNKNOWN_LESSON });
    expect(validateA2GrammarSpiral(broken, A2_CANONICAL_POSITIONS).errors).toEqual([
      { code: "grammar-form-missing-transfer", id: "ongoing-teiru" },
    ]);
  });

  it("rejects an unknown lesson inside recurrenceLessonIds using grammar-form-missing-recurrence rather than skipping it", () => {
    const broken = withRow("ongoing-teiru", { recurrenceLessonIds: [UNKNOWN_LESSON] });
    expect(validateA2GrammarSpiral(broken, A2_CANONICAL_POSITIONS).errors).toEqual([
      { code: "grammar-form-missing-recurrence", id: `ongoing-teiru:${UNKNOWN_LESSON}` },
    ]);
  });

  it("does not silently pass a form whose every role is an unknown lesson id", () => {
    const broken = withRow("ongoing-teiru", {
      introLessonId: UNKNOWN_LESSON,
      controlledPracticeLessonId: UNKNOWN_LESSON,
      transferLessonId: UNKNOWN_LESSON,
      recurrenceLessonIds: [UNKNOWN_LESSON],
    });
    const result = validateA2GrammarSpiral(broken, A2_CANONICAL_POSITIONS);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(4);
  });
});
