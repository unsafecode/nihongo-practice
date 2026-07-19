import { describe, expect, it } from "vitest";
import type { LessonId } from "../../foundations/types";
import { A2_CANONICAL_POSITIONS } from "../manifest";
import { A2_GRAMMAR_SPIRAL, type A2GrammarForm } from "./grammarSpiral";
import {
  auditA2GrammarSpiralEvidence,
  validateA2GrammarSpiral,
  type GrammarEvidenceLesson,
} from "./validateA2GrammarSpiral";

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

// Phase 3 Task 6 spec-fix ("grammar spiral content mismatch"): a reusable,
// generic content-evidence audit layered ON TOP of validateA2GrammarSpiral's
// purely structural checks above — proven here against small synthetic
// forms/lessons first (this describe block), then against the complete real
// M1-M12 catalog in `modules01to12.test.ts` (the cumulative aggregate).
describe("auditA2GrammarSpiralEvidence — synthetic forms/lessons", () => {
  const oneForm: readonly A2GrammarForm[] = [
    {
      id: "widget-form",
      canDoId: "a2-cando-widget",
      introLessonId: "intro-lesson",
      controlledPracticeLessonId: "practice-lesson",
      transferLessonId: "transfer-lesson",
      recurrenceLessonIds: ["a2-synthesis-1"],
    },
  ];
  const servingFamilies = new Map<string, ReadonlySet<string>>([
    ["a2-cando-widget", new Set(["a2-family-widget"])],
  ]);

  function lessonEvidence(
    variants: readonly GrammarEvidenceLesson["variants"][number][],
  ): GrammarEvidenceLesson {
    return { variants };
  }

  it("reports zero errors when intro/practice/transfer lessons each carry a genuine model AND the transfer lesson also carries a genuine transfer", () => {
    const evidence = new Map<LessonId, GrammarEvidenceLesson>([
      ["intro-lesson", lessonEvidence([{ sentenceFamilyId: "a2-family-widget", pedagogicalUse: "model" }])],
      ["practice-lesson", lessonEvidence([{ sentenceFamilyId: "a2-family-widget", pedagogicalUse: "model" }])],
      [
        "transfer-lesson",
        lessonEvidence([
          { sentenceFamilyId: "a2-family-widget", pedagogicalUse: "model" },
          { sentenceFamilyId: "a2-family-widget", pedagogicalUse: "transfer" },
        ]),
      ],
    ]);
    expect(auditA2GrammarSpiralEvidence(oneForm, servingFamilies, evidence)).toEqual({
      valid: true,
      errors: [],
    });
  });

  it("flags grammar-form-no-role-evidence when a role's own lesson has real content but none of it belongs to a family serving the form's Can-do", () => {
    const evidence = new Map<LessonId, GrammarEvidenceLesson>([
      ["intro-lesson", lessonEvidence([{ sentenceFamilyId: "a2-family-widget", pedagogicalUse: "model" }])],
      ["practice-lesson", lessonEvidence([{ sentenceFamilyId: "a2-family-widget", pedagogicalUse: "model" }])],
      [
        "transfer-lesson",
        lessonEvidence([
          { sentenceFamilyId: "a2-family-unrelated", pedagogicalUse: "model" },
          { sentenceFamilyId: "a2-family-unrelated", pedagogicalUse: "transfer" },
        ]),
      ],
    ]);
    expect(auditA2GrammarSpiralEvidence(oneForm, servingFamilies, evidence)).toEqual({
      valid: false,
      errors: [{ code: "grammar-form-no-role-evidence", id: "widget-form:transfer:transfer-lesson" }],
    });
  });

  it("flags grammar-form-no-transfer-pedagogical-evidence when the transfer lesson uses the right family only as a MODEL, never as an actual transfer (a walk-on cameo, never the real transfer the spiral promises)", () => {
    const evidence = new Map<LessonId, GrammarEvidenceLesson>([
      ["intro-lesson", lessonEvidence([{ sentenceFamilyId: "a2-family-widget", pedagogicalUse: "model" }])],
      ["practice-lesson", lessonEvidence([{ sentenceFamilyId: "a2-family-widget", pedagogicalUse: "model" }])],
      [
        "transfer-lesson",
        lessonEvidence([
          { sentenceFamilyId: "a2-family-widget", pedagogicalUse: "model" },
          { sentenceFamilyId: "a2-family-unrelated", pedagogicalUse: "transfer" },
        ]),
      ],
    ]);
    expect(auditA2GrammarSpiralEvidence(oneForm, servingFamilies, evidence)).toEqual({
      valid: false,
      errors: [{ code: "grammar-form-no-transfer-pedagogical-evidence", id: "widget-form:transfer-lesson" }],
    });
  });

  it("never counts recipe/support metadata alone — the audit only ever inspects real variants, so an empty-variants lesson always fails even if the caller believes it 'supports' the Can-do", () => {
    const evidence = new Map<LessonId, GrammarEvidenceLesson>([
      ["intro-lesson", lessonEvidence([{ sentenceFamilyId: "a2-family-widget", pedagogicalUse: "model" }])],
      ["practice-lesson", lessonEvidence([{ sentenceFamilyId: "a2-family-widget", pedagogicalUse: "model" }])],
      ["transfer-lesson", lessonEvidence([])],
    ]);
    expect(auditA2GrammarSpiralEvidence(oneForm, servingFamilies, evidence)).toEqual({
      valid: false,
      errors: [{ code: "grammar-form-no-role-evidence", id: "widget-form:transfer:transfer-lesson" }],
    });
  });

  it("silently skips (never fails) a role lesson the caller has no evidence for — not yet judgeable, exactly like validateA2GrammarSpiral's own unresolved-lesson handling", () => {
    const evidence = new Map<LessonId, GrammarEvidenceLesson>([
      ["intro-lesson", lessonEvidence([{ sentenceFamilyId: "a2-family-widget", pedagogicalUse: "model" }])],
      ["practice-lesson", lessonEvidence([{ sentenceFamilyId: "a2-family-widget", pedagogicalUse: "model" }])],
      // "transfer-lesson" intentionally has no entry at all (e.g. a future
      // M13+ lesson not yet built).
    ]);
    expect(auditA2GrammarSpiralEvidence(oneForm, servingFamilies, evidence)).toEqual({
      valid: true,
      errors: [],
    });
  });

  it("never double-reports the same role: zero role-evidence yields exactly one error, never also the transfer-pedagogical one", () => {
    const evidence = new Map<LessonId, GrammarEvidenceLesson>([
      ["intro-lesson", lessonEvidence([{ sentenceFamilyId: "a2-family-widget", pedagogicalUse: "model" }])],
      ["practice-lesson", lessonEvidence([{ sentenceFamilyId: "a2-family-widget", pedagogicalUse: "model" }])],
      ["transfer-lesson", lessonEvidence([{ sentenceFamilyId: "a2-family-unrelated", pedagogicalUse: "model" }])],
    ]);
    const result = auditA2GrammarSpiralEvidence(oneForm, servingFamilies, evidence);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].code).toBe("grammar-form-no-role-evidence");
  });

  // Phase 3 Task 6 spec-fix ("grammar spiral content mismatch"): the real
  // fix wired ONE family (`a2-family-narrate-order`) to genuinely serve
  // THREE Can-dos, with two different grammar-spiral forms
  // (`recognize-plain-forms`/`connectors`) sharing that same family's own
  // transfer lesson (`experiences-narratives-2`). This proves the generic
  // audit needs no per-form special-casing for that shape: a single
  // multi-Can-do-serving family, shared by two independent forms whose
  // transfer role lands on the very same lesson, resolves with zero errors
  // for both — exactly mirroring the real fix, never hand-tuned to it.
  it("resolves TWO different forms that share the same transfer lesson and the same multi-Can-do-serving family with zero errors for either — the audit needs no per-form special-casing (mirrors the real recognize-plain-forms/connectors/experiences-narratives-2 fix)", () => {
    const twoForms: readonly A2GrammarForm[] = [
      {
        id: "widget-form-a",
        canDoId: "a2-cando-widget-a",
        introLessonId: "intro-lesson",
        controlledPracticeLessonId: "practice-lesson",
        transferLessonId: "shared-transfer-lesson",
        recurrenceLessonIds: ["a2-synthesis-1"],
      },
      {
        id: "widget-form-b",
        canDoId: "a2-cando-widget-b",
        introLessonId: "intro-lesson",
        controlledPracticeLessonId: "practice-lesson",
        transferLessonId: "shared-transfer-lesson",
        recurrenceLessonIds: ["a2-synthesis-1"],
      },
    ];
    const multiServingFamilies = new Map<string, ReadonlySet<string>>([
      ["a2-cando-widget-a", new Set(["a2-family-multi-widget"])],
      ["a2-cando-widget-b", new Set(["a2-family-multi-widget"])],
    ]);
    const evidence = new Map<LessonId, GrammarEvidenceLesson>([
      ["intro-lesson", lessonEvidence([{ sentenceFamilyId: "a2-family-multi-widget", pedagogicalUse: "model" }])],
      ["practice-lesson", lessonEvidence([{ sentenceFamilyId: "a2-family-multi-widget", pedagogicalUse: "model" }])],
      [
        "shared-transfer-lesson",
        lessonEvidence([
          { sentenceFamilyId: "a2-family-multi-widget", pedagogicalUse: "model" },
          { sentenceFamilyId: "a2-family-multi-widget", pedagogicalUse: "transfer" },
        ]),
      ],
    ]);
    expect(auditA2GrammarSpiralEvidence(twoForms, multiServingFamilies, evidence)).toEqual({
      valid: true,
      errors: [],
    });
  });
});

// I1 spec-fix ("grammar evidence audit recurrence gap"): the audit above
// only ever fanned out over intro/practice/transfer — a form's own
// `recurrenceLessonIds` (plural; a form can recur in more than one later
// lesson) were never opened at all, so a grammar-spiral row could claim a
// construction "recurs" in a lesson whose own authored content never once
// used a family serving that Can-do, and the audit would stay silently
// green. `recurrence` now joins the role model exactly like the other
// three roles: for every recurrenceLessonId the caller supplies real
// evidence for, at least one of that lesson's own variants must belong to
// a family genuinely serving the form's Can-do — using the SAME
// `grammar-form-no-role-evidence` code, with an id of
// `<form.id>:recurrence:<lessonId>`, one entry per recurrence lesson (never
// collapsed into a single form-level error). A recurrence lesson outside
// the caller's currently-built scope (e.g. a future M13-M15 lesson not yet
// authored) is silently skipped — not yet judgeable — exactly like every
// other role's own unbuilt-lesson handling.
describe("auditA2GrammarSpiralEvidence — recurrence role (I1 spec-fix, synthetic forms/lessons)", () => {
  const oneForm: readonly A2GrammarForm[] = [
    {
      id: "widget-form",
      canDoId: "a2-cando-widget",
      introLessonId: "intro-lesson",
      controlledPracticeLessonId: "practice-lesson",
      transferLessonId: "transfer-lesson",
      recurrenceLessonIds: ["recurrence-lesson-bad", "recurrence-lesson-good"],
    },
  ];
  const servingFamilies = new Map<string, ReadonlySet<string>>([
    ["a2-cando-widget", new Set(["a2-family-widget"])],
  ]);

  function lessonEvidence(
    variants: readonly GrammarEvidenceLesson["variants"][number][],
  ): GrammarEvidenceLesson {
    return { variants };
  }

  // Every test below gives intro/practice/transfer genuine evidence so the
  // ONLY errors possible are the new recurrence ones — isolating the
  // recurrence fan-out from the three already-covered roles.
  const soundIntroPracticeTransfer = [
    ["intro-lesson", lessonEvidence([{ sentenceFamilyId: "a2-family-widget", pedagogicalUse: "model" as const }])],
    ["practice-lesson", lessonEvidence([{ sentenceFamilyId: "a2-family-widget", pedagogicalUse: "model" as const }])],
    [
      "transfer-lesson",
      lessonEvidence([
        { sentenceFamilyId: "a2-family-widget", pedagogicalUse: "model" as const },
        { sentenceFamilyId: "a2-family-widget", pedagogicalUse: "transfer" as const },
      ]),
    ],
  ] as const;

  it("flags grammar-form-no-role-evidence for each built recurrenceLessonId lacking content evidence, using <form.id>:recurrence:<lesson> ids", () => {
    const evidence = new Map<LessonId, GrammarEvidenceLesson>([
      ...soundIntroPracticeTransfer,
      ["recurrence-lesson-bad", lessonEvidence([{ sentenceFamilyId: "a2-family-unrelated", pedagogicalUse: "model" }])],
      ["recurrence-lesson-good", lessonEvidence([{ sentenceFamilyId: "a2-family-widget", pedagogicalUse: "model" }])],
    ]);
    expect(auditA2GrammarSpiralEvidence(oneForm, servingFamilies, evidence)).toEqual({
      valid: false,
      errors: [{ code: "grammar-form-no-role-evidence", id: "widget-form:recurrence:recurrence-lesson-bad" }],
    });
  });

  it("flags every bad recurrenceLessonId independently — two built-but-unevidenced recurrence lessons yield two distinct errors, never collapsed into one", () => {
    const evidence = new Map<LessonId, GrammarEvidenceLesson>([
      ...soundIntroPracticeTransfer,
      ["recurrence-lesson-bad", lessonEvidence([{ sentenceFamilyId: "a2-family-unrelated", pedagogicalUse: "model" }])],
      ["recurrence-lesson-good", lessonEvidence([])],
    ]);
    const result = auditA2GrammarSpiralEvidence(oneForm, servingFamilies, evidence);
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        { code: "grammar-form-no-role-evidence", id: "widget-form:recurrence:recurrence-lesson-bad" },
        { code: "grammar-form-no-role-evidence", id: "widget-form:recurrence:recurrence-lesson-good" },
      ]),
    );
    expect(result.errors).toHaveLength(2);
  });

  it("silently skips (never fails) a recurrence lesson the caller has no evidence for — not yet judgeable, exactly like a future M13-M15 lesson not yet built", () => {
    const evidence = new Map<LessonId, GrammarEvidenceLesson>([
      ...soundIntroPracticeTransfer,
      ["recurrence-lesson-good", lessonEvidence([{ sentenceFamilyId: "a2-family-widget", pedagogicalUse: "model" }])],
      // "recurrence-lesson-bad" intentionally has no entry at all here (e.g.
      // a future M13-M15 lesson not yet built) — must be skipped, not
      // flagged, even though its id is unresolved evidence-wise.
    ]);
    expect(auditA2GrammarSpiralEvidence(oneForm, servingFamilies, evidence)).toEqual({
      valid: true,
      errors: [],
    });
  });

  it("never requires a recurrence lesson's matching evidence to itself be a pedagogical transfer — a MODEL-only recurrence use still resolves with zero errors, unlike the transfer role", () => {
    const modelOnlyForm: readonly A2GrammarForm[] = [
      {
        id: "widget-form",
        canDoId: "a2-cando-widget",
        introLessonId: "intro-lesson",
        controlledPracticeLessonId: "practice-lesson",
        transferLessonId: "transfer-lesson",
        recurrenceLessonIds: ["recurrence-lesson-good"],
      },
    ];
    const evidence = new Map<LessonId, GrammarEvidenceLesson>([
      ...soundIntroPracticeTransfer,
      ["recurrence-lesson-good", lessonEvidence([{ sentenceFamilyId: "a2-family-widget", pedagogicalUse: "model" }])],
    ]);
    expect(auditA2GrammarSpiralEvidence(modelOnlyForm, servingFamilies, evidence)).toEqual({
      valid: true,
      errors: [],
    });
  });

  it("reports zero errors when every recurrenceLessonId (as well as intro/practice/transfer) carries genuine matching-family evidence", () => {
    const evidence = new Map<LessonId, GrammarEvidenceLesson>([
      ...soundIntroPracticeTransfer,
      ["recurrence-lesson-bad", lessonEvidence([{ sentenceFamilyId: "a2-family-widget", pedagogicalUse: "model" }])],
      ["recurrence-lesson-good", lessonEvidence([{ sentenceFamilyId: "a2-family-widget", pedagogicalUse: "model" }])],
    ]);
    expect(auditA2GrammarSpiralEvidence(oneForm, servingFamilies, evidence)).toEqual({
      valid: true,
      errors: [],
    });
  });
});
