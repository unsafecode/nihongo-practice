/**
 * Release-gate contract for {@link validateA1}. Every A1-specific error code is
 * driven by exactly one deterministic mutation fed through `ValidateA1Input`
 * overrides; the wrapped foundation diagnostics are asserted to survive intact.
 *
 * No fixture imports: every input is derived from the frozen release catalogs
 * and cloned with `structuredClone` before mutation.
 */
import { describe, expect, it } from "vitest";
import type { FoundationCatalogs, VerbUseRecord, CanDo } from "../../foundations/types";
import {
  validateA1,
  validateA1Release,
  type A1ValidationErrorCode,
  type ValidateA1Input,
} from "./validateA1";
import {
  a1FoundationCatalogs,
  a1SemanticFoundationCatalogs,
  a1FoundationCopy,
} from "./catalog";
import { a1CanDosAuthored } from "./canDos";
import { a1Checkpoint } from "./checkpoint";
import { a1ReleaseVerbUseRecords } from "./recurrence";
import {
  module1ItemsByLesson,
  module1Lessons,
  type A1PhoneticItem,
} from "./module01Sounds";
import {
  A1_CAPSTONE_LESSON_IDS,
  A1_LESSON_IDS,
  A1_MANIFEST_SPEC,
  A1_MODULE_IDS,
} from "../manifest";
import { A1_AREAS } from "../areas";
import type { A1CourseArea } from "../types";
import { A1_RELEASE_ERROR_CODES, type A1ReleaseErrorCode } from "../types";
import { a1LearningTargetSenses } from "./a1SemanticCatalog";
import { a1LexemeById } from "../curriculum/lexicon";
import { legacyA1CourseModules as courseModules } from "../../data/course";
import { en as enCourseCopy } from "../../i18n/en";
import { it as itCourseCopy } from "../../i18n/it";

type Clonable = <T>(value: T) => T;
const clone: Clonable = (value) => structuredClone(value);

function codesOf(result: { errors: readonly { code: A1ValidationErrorCode }[] }): Set<string> {
  return new Set(result.errors.map((error) => error.code));
}

/** Clone the full catalogs so a test can mutate module / lesson / position shape. */
function fullClone(): FoundationCatalogs {
  return clone(a1FoundationCatalogs);
}
/** Clone the semantic (60-lesson) catalogs so a test can mutate variants. */
function semanticClone(): FoundationCatalogs {
  return clone(a1SemanticFoundationCatalogs);
}
function copyClone(): { en: Record<string, string>; it: Record<string, string> } {
  return { en: { ...a1FoundationCopy.en }, it: { ...a1FoundationCopy.it } };
}
function verbClone(): VerbUseRecord[] {
  return clone(a1ReleaseVerbUseRecords) as VerbUseRecord[];
}
function phoneticItemsClone(): Record<string, A1PhoneticItem[]> {
  return clone(module1ItemsByLesson) as Record<string, A1PhoneticItem[]>;
}
function areasClone(): A1CourseArea[] {
  return clone(A1_AREAS) as A1CourseArea[];
}
function runtimeModulesClone() {
  return clone(courseModules);
}
function areaCopyClone() {
  return {
    en: clone(enCourseCopy.courseAreas),
    it: clone(itCourseCopy.courseAreas),
  };
}
function validateWithAreaInputs(
  input: Pick<ValidateA1Input, "areas" | "runtimeModules" | "areaCopy">,
) {
  return validateA1(input);
}

// ---------------------------------------------------------------------------
// Baseline
// ---------------------------------------------------------------------------

describe("validateA1 – baseline release", () => {
  it("passes with zero A1 errors and is deterministic", () => {
    const a = validateA1();
    const b = validateA1Release();
    expect(a.valid).toBe(true);
    expect(a.errors).toEqual([]);
    // Determinism: identical ordering / content across independent calls.
    expect(b.errors).toEqual(a.errors);
    expect(b.valid).toBe(true);
  });

  it("gates release on foundation validity — no silent dropping of foundation errors", () => {
    const result = validateA1();
    // After Phase 2 Task 4, the assembled level is internally consistent: the
    // cumulative availability gate accepts legitimate prior-lesson reuse and the
    // six real future-use transfers plus three routine conflations are fixed, so
    // the wrapped foundation report is clean and gates the release.
    expect(result.foundationReport.errors).toEqual([]);
    expect(result.foundationReport.valid).toBe(true);
    expect(result.valid).toBe(true);
  });

  it("cannot report valid=true while the foundation report is invalid", () => {
    // Drop a model from a real lesson: the foundation oracle fails model-count,
    // and the release gate must surface it as blocking (no selective drop).
    const semantic = semanticClone();
    const lesson = semantic.lessons.find((l) => l.id === "introductions-1")!;
    (lesson.modelVariantIds as unknown as string[]).pop();
    const result = validateA1({ semanticCatalogs: semantic });
    expect(result.foundationReport.valid).toBe(false);
    expect(result.valid).toBe(false);
    expect(codesOf(result)).toContain("foundation-invalid");
  });

  it("keeps the three same-orthography routine senses free of context conflation", () => {
    const result = validateA1();
    const conflations = result.foundationReport.errors.filter(
      (error) => error.code === "conflated-sense-context",
    );
    expect(conflations).toEqual([]);
  });

  it("keeps real shared lexeme senses contextually distinct and resolvable", () => {
    const realLexemeIdBySense = {
      "a1-sense-study-bare": "a1-lexeme-benkyou-suru",
      "a1-sense-study-routine": "a1-lexeme-benkyou-suru",
      "a1-sense-rest-routine": "a1-lexeme-yasumu",
      "a1-sense-return-bare": "a1-lexeme-kaeru",
    } as const;
    const semantic = semanticClone();

    for (const [senseId, lexemeId] of Object.entries(realLexemeIdBySense)) {
      const sense = semantic.learningTargetSenses.find(
        (candidate) => candidate.id === senseId,
      );
      expect(sense, senseId).toBeDefined();
      (sense as { lexemeId: string }).lexemeId = lexemeId;
    }

    const groupedByRealLexeme = validateA1({ semanticCatalogs: semantic });
    expect(
      groupedByRealLexeme.foundationReport.errors.filter(
        (error) => error.code === "conflated-sense-context",
      ),
    ).toEqual([]);
    expect(
      validateA1().foundationReport.errors.filter(
        (error) => error.code === "conflated-sense-context",
      ),
    ).toEqual([]);
    for (const sense of a1LearningTargetSenses) {
      expect(a1LexemeById[sense.lexemeId], sense.id).toBeDefined();
    }
  });

  it("wraps validateFoundations at the fixed release version and seed", () => {
    const result = validateA1();
    // The foundation report exists and carries per-lesson coverage rows.
    expect(Object.keys(result.foundationReport.reports.byLesson).length).toBe(60);
  });

  it("guards the canonical 16-module / 64-route release split into 60 semantic, 4 phonetic, and 4 capstone lessons", () => {
    const result = validateA1Release();

    expect(A1_MODULE_IDS).toHaveLength(16);
    expect(A1_LESSON_IDS).toHaveLength(64);
    expect(Object.keys(result.foundationReport.reports.byLesson)).toHaveLength(60);
    expect(module1Lessons).toHaveLength(4);
    expect(A1_CAPSTONE_LESSON_IDS).toHaveLength(4);
  });

  it("preserves attributed curriculum failures as exact canonical release codes", () => {
    const result = validateA1({
      curriculumInput: {
        semanticSectionOrder: [
          "rule",
          "grammar",
          "vocabulary",
          "comparison",
          "explore",
          "recap",
        ],
      },
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "invalid-section-order",
          stage: "sections",
        }),
      ]),
    );
  });
});

// ---------------------------------------------------------------------------
// Structural shape
// ---------------------------------------------------------------------------

describe("validateA1 – structural mutations", () => {
  it("module-count: fewer than 16 modules", () => {
    const full = fullClone();
    // Drop a middle (non-capstone, non-final) module.
    (full.modules as unknown as unknown[]).splice(1, 1);
    const result = validateA1({ fullCatalogs: full });
    expect(result.valid).toBe(false);
    expect(codesOf(result)).toContain("module-count");
  });

  it("reports semantic, phonetic, and capstone count drift from the canonical release split", () => {
    const semantic = semanticClone();
    (semantic as unknown as { lessons: FoundationCatalogs["lessons"] }).lessons =
      semantic.lessons.filter((lesson) => lesson.id !== "capstones-4");
    const phoneticLessons = clone(module1Lessons).slice(0, 3);

    const result = validateA1({
      semanticCatalogs: semantic,
      phoneticLessons,
    });

    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "manifest-mismatch",
          dimension: "semantic-lesson-count",
          expected: 60,
          actual: 59,
        }),
        expect.objectContaining({
          code: "phonetic-lesson-mismatch",
          dimension: "lesson-count",
          expected: 4,
          actual: 3,
        }),
        expect.objectContaining({
          code: "capstone-structure",
          dimension: "semantic-count",
          expected: 4,
          actual: 3,
        }),
      ]),
    );
  });

  it("lessons-per-module: a module with the wrong lesson count", () => {
    const full = fullClone();
    (full.modules[1].lessonIds as unknown as string[]).push("descriptions-1");
    const result = validateA1({ fullCatalogs: full });
    expect(codesOf(result)).toContain("lessons-per-module");
  });

  it("route-count: a missing lesson position", () => {
    const full = fullClone();
    (full.lessonPositions as unknown as unknown[]).pop();
    const result = validateA1({ fullCatalogs: full });
    expect(codesOf(result)).toContain("route-count");
  });

  it("unknown-lesson-id: a position pointing at a non-manifest lesson", () => {
    const full = fullClone();
    const first = clone(full.lessonPositions[0]);
    (full.lessonPositions as unknown as Record<string, unknown>[]).push({
      ...first,
      lessonId: "totally-unknown-lesson",
      position: 999,
    });
    const result = validateA1({ fullCatalogs: full });
    expect(codesOf(result)).toContain("unknown-lesson-id");
  });

  it("duplicate-lesson-id: a lesson routed twice", () => {
    const full = fullClone();
    (full.lessonPositions as unknown as unknown[]).push(clone(full.lessonPositions[0]));
    const result = validateA1({ fullCatalogs: full });
    expect(codesOf(result)).toContain("duplicate-lesson-id");
  });

  it("manifest-mismatch: a position that disagrees with the canonical order", () => {
    const full = fullClone();
    (full.lessonPositions[0] as unknown as { position: number }).position += 100;
    const result = validateA1({ fullCatalogs: full });
    expect(codesOf(result)).toContain("manifest-mismatch");
  });

  it("manifest-invalid: a self-inconsistent manifest spec", () => {
    const spec = clone(A1_MANIFEST_SPEC);
    (spec.aliases as Record<string, string>)["ghost-source"] = "no-such-lesson";
    const result = validateA1({ manifestSpec: spec });
    expect(codesOf(result)).toContain("manifest-invalid");
  });

  it("capstone-structure: capstones not the final module", () => {
    const full = fullClone();
    const last = full.modules.length - 1;
    const tmp = full.modules[last];
    (full.modules as unknown as unknown[])[last] = full.modules[last - 1];
    (full.modules as unknown as unknown[])[last - 1] = tmp;
    const result = validateA1({ fullCatalogs: full });
    expect(codesOf(result)).toContain("capstone-structure");
  });
});

// ---------------------------------------------------------------------------
// Content ordering / closure
// ---------------------------------------------------------------------------

describe("validateA1 – content ordering & closure", () => {
  it("unknown-content: a model slot filled with a non-existent value", () => {
    const semantic = semanticClone();
    const model = semantic.sentenceVariants.find(
      (v) => v.pedagogicalUse === "model" && !v.id.startsWith("capstones-"),
    );
    expect(model).toBeDefined();
    const slotKey = Object.keys(model!.slotValues)[0];
    (model!.slotValues as Record<string, string>)[slotKey] = "a1-value-does-not-exist";
    const result = validateA1({ semanticCatalogs: semantic });
    expect(codesOf(result)).toContain("unknown-content");
  });

  it("foundation-invalid: a transfer recombines a value taught by no model", () => {
    const semantic = semanticClone();
    // A known-but-untaught value: append it to the catalog, then use it only in
    // a transfer. It is a valid value id (no unknown-content) yet never a model
    // filler, so the canonical-order cumulative gate rejects it — surfaced as a
    // blocking foundation error.
    const synthetic = { ...clone(semantic.semanticValues[0]), id: "a1-value-synthetic-transfer" };
    (semantic.semanticValues as unknown as unknown[]).push(synthetic);
    const transfer = semantic.sentenceVariants.find(
      (v) => v.pedagogicalUse === "transfer" && !v.id.startsWith("capstones-"),
    );
    expect(transfer).toBeDefined();
    const slotKey = Object.keys(transfer!.slotValues)[0];
    (transfer!.slotValues as Record<string, string>)[slotKey] = "a1-value-synthetic-transfer";
    const result = validateA1({ semanticCatalogs: semantic });
    expect(codesOf(result)).toContain("foundation-invalid");
    expect(codesOf(result)).not.toContain("unknown-content");
    expect(result.valid).toBe(false);
  });

  it("capstone baseline: introduced-content sets are empty", () => {
    const result = validateA1();
    expect(result.errors.filter((e) => e.code === "capstone-introduces-new")).toEqual([]);
  });

  it("capstone-introduces-new: a capstone model invents fresh content", () => {
    const semantic = semanticClone();
    const synthetic = { ...clone(semantic.semanticValues[0]), id: "a1-value-synthetic-capstone" };
    (semantic.semanticValues as unknown as unknown[]).push(synthetic);
    const capstoneModel = semantic.sentenceVariants.find(
      (v) => v.id.startsWith("capstones-") && v.pedagogicalUse === "model",
    );
    expect(capstoneModel).toBeDefined();
    const slotKey = Object.keys(capstoneModel!.slotValues)[0];
    (capstoneModel!.slotValues as Record<string, string>)[slotKey] = "a1-value-synthetic-capstone";
    const result = validateA1({ semanticCatalogs: semantic });
    expect(codesOf(result)).toContain("capstone-introduces-new");
    // Inventing fresh capstone content must block the release.
    expect(result.valid).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Capstone required-scenario coverage (Phase 2 Task 4 spec-review fix)
// ---------------------------------------------------------------------------

describe("validateA1 – capstone required-scenario coverage", () => {
  it("baseline: every capstone exercises its required scenario, and the topic changes exactly once", () => {
    const result = validateA1();
    expect(result.errors.filter((e) => e.code === "capstone-scenario-incomplete")).toEqual([]);
    expect(result.errors.filter((e) => e.code === "capstone-topic-change-count")).toEqual([]);
  });

  it("capstone-scenario-incomplete: capstones-1 loses its identity (topic-copular) coverage", () => {
    const semantic = semanticClone();
    for (const variant of semantic.sentenceVariants) {
      if (variant.id.startsWith("capstones-1-") && variant.sentenceFamilyId === "a1-family-topic-copular") {
        (variant as { sentenceFamilyId: string }).sentenceFamilyId = "a1-family-object-action";
      }
    }
    const result = validateA1({ semanticCatalogs: semantic });
    expect(codesOf(result)).toContain("capstone-scenario-incomplete");
    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: "capstone-scenario-incomplete", id: "capstones-1", dimension: "identity" }),
    );
  });

  it("capstone-scenario-incomplete: capstones-1 loses its reciprocal question", () => {
    const semantic = semanticClone();
    for (const variant of semantic.sentenceVariants) {
      if (variant.id.startsWith("capstones-1-") && variant.form.interrogative) {
        (variant.discourse as { speakerRoleId: string }).speakerRoleId = "a1-role-learner";
      }
    }
    const result = validateA1({ semanticCatalogs: semantic });
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        code: "capstone-scenario-incomplete",
        id: "capstones-1",
        dimension: "reciprocal-question",
      }),
    );
  });

  it("capstone-scenario-incomplete: capstones-1 loses the learner-asks-back direction of its reciprocal question (quality-review M1)", () => {
    // The gate must not only require *someone else* to ask the learner about
    // themselves (already covered above); a genuine reciprocal exchange also
    // requires the learner to ask *back* about the other party. Flipping
    // every learner-initiated interrogative's speaker to the addressee
    // removes the "asks back" direction while leaving the "other asks
    // learner" direction (m7/m8/t1/t3) fully intact, isolating the new check.
    const semantic = semanticClone();
    for (const variant of semantic.sentenceVariants) {
      if (
        variant.id.startsWith("capstones-1-") &&
        variant.form.interrogative &&
        variant.discourse.speakerRoleId === "a1-role-learner"
      ) {
        (variant.discourse as { speakerRoleId: string }).speakerRoleId = variant.discourse.addresseeRoleId!;
      }
    }
    const result = validateA1({ semanticCatalogs: semantic });
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        code: "capstone-scenario-incomplete",
        id: "capstones-1",
        dimension: "reciprocal-question-back",
      }),
    );
    // The original direction must still be intact and NOT also flagged —
    // this mutation only removes the reverse direction.
    expect(result.errors).not.toContainEqual(
      expect.objectContaining({
        code: "capstone-scenario-incomplete",
        id: "capstones-1",
        dimension: "reciprocal-question",
      }),
    );
  });

  it("capstone-scenario-incomplete: capstones-2 loses its place (location-action) coverage", () => {
    const semantic = semanticClone();
    for (const variant of semantic.sentenceVariants) {
      if (variant.id.startsWith("capstones-2-") && variant.sentenceFamilyId === "a1-family-location-action") {
        (variant as { sentenceFamilyId: string }).sentenceFamilyId = "a1-family-schedule-action";
      }
    }
    const result = validateA1({ semanticCatalogs: semantic });
    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: "capstone-scenario-incomplete", id: "capstones-2", dimension: "place" }),
    );
  });

  it("capstone-scenario-incomplete: capstones-3 loses its route question", () => {
    const semantic = semanticClone();
    for (const variant of semantic.sentenceVariants) {
      if (
        variant.id.startsWith("capstones-3-") &&
        variant.sentenceFamilyId === "a1-family-topic-copular" &&
        variant.form.interrogative &&
        Object.values(variant.slotValues).includes("a1-value-q-doko")
      ) {
        (variant.form as { interrogative: boolean }).interrogative = false;
      }
    }
    const result = validateA1({ semanticCatalogs: semantic });
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        code: "capstone-scenario-incomplete",
        id: "capstones-3",
        dimension: "route-question",
      }),
    );
  });

  it("capstone-scenario-incomplete: capstones-3 loses its immediate need (want) coverage", () => {
    const semantic = semanticClone();
    for (const variant of semantic.sentenceVariants) {
      if (variant.id.startsWith("capstones-3-") && variant.sentenceFamilyId === "a1-family-preference") {
        for (const key of Object.keys(variant.slotValues)) {
          if ((variant.slotValues as Record<string, string>)[key] === "a1-value-want") {
            (variant.slotValues as Record<string, string>)[key] = "a1-value-like";
          }
        }
      }
    }
    const result = validateA1({ semanticCatalogs: semantic });
    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: "capstone-scenario-incomplete", id: "capstones-3", dimension: "want-need" }),
    );
  });

  it("capstone-scenario-incomplete: capstones-4 loses its clarification question", () => {
    const semantic = semanticClone();
    for (const variant of semantic.sentenceVariants) {
      if (
        variant.id.startsWith("capstones-4-") &&
        variant.sentenceFamilyId === "a1-family-topic-copular" &&
        variant.form.interrogative &&
        Object.values(variant.slotValues).includes("a1-value-q-nan")
      ) {
        (variant.form as { interrogative: boolean }).interrogative = false;
      }
    }
    const result = validateA1({ semanticCatalogs: semantic });
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        code: "capstone-scenario-incomplete",
        id: "capstones-4",
        dimension: "clarification-question",
      }),
    );
  });

  it("capstone-topic-change-count: capstones-4 gains a second subject-referent transition", () => {
    const semantic = semanticClone();
    const m3 = semantic.sentenceVariants.find((v) => v.id === "capstones-4-m3");
    expect(m3, "capstones-4-m3 must exist").toBeDefined();
    const currentReferent = m3!.discourse.subjectReferentId;
    const otherReferent = currentReferent === "a1-referent-self" ? "a1-referent-thing" : "a1-referent-self";
    (m3!.discourse as { subjectReferentId: string }).subjectReferentId = otherReferent;
    const result = validateA1({ semanticCatalogs: semantic });
    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: "capstone-topic-change-count", id: "capstones-4" }),
    );
  });

  it("capstone-topic-change-count derives its check order from lesson.modelVariantIds, not a hardcoded m1..m8 id scheme (quality-review M3)", () => {
    // The gate must read the *authored* model order from
    // `lesson.modelVariantIds` rather than assuming ids are literally named
    // `capstones-4-m1` through `capstones-4-m8` in that exact sequence. Prove
    // it by reordering `modelVariantIds` (interleaving the SELF-subject and
    // THING-subject models) while leaving every variant's own id and content
    // untouched. The interleaved authored order visits SELF -> THING -> SELF
    // -> THING (three transitions), which must be flagged; a validator that
    // still assumes the m1..m8 lexical order would keep seeing the original
    // SELF,SELF,SELF,SELF,THING,THING,THING,THING sequence (one transition)
    // and wrongly report no error.
    const semantic = semanticClone();
    const lesson = semantic.lessons.find((l) => l.id === "capstones-4");
    expect(lesson, "capstones-4 lesson must exist").toBeDefined();
    const original = lesson!.modelVariantIds;
    expect(original).toEqual([
      "capstones-4-m1",
      "capstones-4-m2",
      "capstones-4-m3",
      "capstones-4-m4",
      "capstones-4-m5",
      "capstones-4-m6",
      "capstones-4-m7",
      "capstones-4-m8",
    ]);
    const interleaved = [
      "capstones-4-m1", // SELF
      "capstones-4-m5", // THING
      "capstones-4-m2", // SELF
      "capstones-4-m6", // THING
      "capstones-4-m3", // SELF
      "capstones-4-m7", // THING
      "capstones-4-m4", // SELF
      "capstones-4-m8", // THING
    ];
    (lesson as unknown as { modelVariantIds: string[] }).modelVariantIds = interleaved;
    const result = validateA1({ semanticCatalogs: semantic });
    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: "capstone-topic-change-count", id: "capstones-4" }),
    );
  });

  it("cando-no-transfer-evidence (capstone-scoped): a module's own transfer no longer counts as capstone evidence", () => {
    // Quality-review M4: `a1-can-do-existence` must be evidenced *only* by the
    // existence family's own genuine あります/います capstone transfer(s)
    // (capstones-3-t2/t3), never by an arbitrary like/dislike/want variant
    // from an unrelated preference-family transfer. Strip the existence
    // family's own tag and confirm no other family resurrects evidence for
    // it under the capstone-scoped Can-do evidence rule.
    const semantic = semanticClone();
    const existence = semantic.sentenceFamilies.find((f) => f.id === "a1-family-existence");
    expect(existence, "a1-family-existence must exist").toBeDefined();
    (existence as unknown as { canDoIds: string[] }).canDoIds = existence!.canDoIds.filter(
      (id) => id !== "a1-can-do-existence",
    );
    const result = validateA1({ semanticCatalogs: semantic });
    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: "cando-no-transfer-evidence", id: "a1-can-do-existence" }),
    );
  });

  it("existence Can-do evidence is owned exclusively by the existence family, never an arbitrary preference-family want/like/dislike variant (quality-review M4)", () => {
    // Direct authoring-contract regression: `a1-can-do-existence` must be
    // tagged on `a1-family-existence` (whose capstone transfers are genuine
    // あります/います statements) and NEVER on `a1-family-preference` (whose
    // capstone transfers are want/like/dislike — a different Can-do entirely).
    // This is the exact production mapping the M4 fix asserts in shared.ts.
    const existence = a1SemanticFoundationCatalogs.sentenceFamilies.find(
      (f) => f.id === "a1-family-existence",
    );
    const preference = a1SemanticFoundationCatalogs.sentenceFamilies.find(
      (f) => f.id === "a1-family-preference",
    );
    expect(existence?.canDoIds).toContain("a1-can-do-existence");
    expect(preference?.canDoIds).not.toContain("a1-can-do-existence");
  });
});

// ---------------------------------------------------------------------------
// Recurrence
// ---------------------------------------------------------------------------

describe("validateA1 – recurrence completeness", () => {
  it("baseline: all 44 release verb-use records carry >= 2 later uses", () => {
    expect(a1ReleaseVerbUseRecords.length).toBe(44);
    for (const record of a1ReleaseVerbUseRecords) {
      expect(record.laterUses.length).toBeGreaterThanOrEqual(2);
    }
    expect(codesOf(validateA1())).not.toContain("recurrence-incomplete");
  });

  it("recurrence-incomplete: a productive sense loses a later use", () => {
    const records = verbClone();
    (records[0].laterUses as unknown as unknown[]).pop();
    const result = validateA1({ releaseVerbUseRecords: records });
    expect(codesOf(result)).toContain("recurrence-incomplete");
  });
});

// ---------------------------------------------------------------------------
// Can-do / checkpoint
// ---------------------------------------------------------------------------

describe("validateA1 – Can-do & checkpoint alignment", () => {
  it("baseline: every authored non-sounds Can-do has transfer evidence and is sampled", () => {
    const sampled = new Set(a1Checkpoint.sampledCanDoIds);
    for (const canDo of a1CanDosAuthored) {
      expect(sampled.has(canDo.id)).toBe(true);
    }
    // Every real lesson's primary Can-do is sampled by the checkpoint.
    for (const lesson of a1FoundationCatalogs.lessons) {
      expect(sampled.has(lesson.primaryCanDoId)).toBe(true);
    }
    expect(a1Checkpoint.minAcceptedTransferTargetsPerCanDo).toBeGreaterThanOrEqual(8);
    const codes = codesOf(validateA1());
    for (const code of [
      "cando-not-sampled",
      "cando-no-transfer-evidence",
      "cando-primary-mismatch",
      "cando-supporting-overflow",
      "checkpoint-min-transfer",
    ]) {
      expect(codes).not.toContain(code);
    }
  });

  it("cando-not-sampled: the checkpoint drops a taught primary Can-do", () => {
    const checkpoint = clone(a1Checkpoint);
    const dropped = a1FoundationCatalogs.lessons[0].primaryCanDoId;
    (checkpoint as unknown as { sampledCanDoIds: string[] }).sampledCanDoIds =
      checkpoint.sampledCanDoIds.filter((id) => id !== dropped);
    const result = validateA1({ checkpoint });
    expect(codesOf(result)).toContain("cando-not-sampled");
  });

  it("cando-primary-mismatch: a lesson claims a Can-do that does not list it", () => {
    const full = fullClone();
    const lesson = full.lessons[0];
    const foreign = full.canDos.find(
      (canDo) =>
        canDo.id !== lesson.primaryCanDoId &&
        !canDo.lessonIds.includes(lesson.id) &&
        a1Checkpoint.sampledCanDoIds.includes(canDo.id),
    );
    expect(foreign).toBeDefined();
    (lesson as { primaryCanDoId: string }).primaryCanDoId = foreign!.id;
    const result = validateA1({ fullCatalogs: full });
    expect(codesOf(result)).toContain("cando-primary-mismatch");
  });

  it("cando-supporting-overflow: a lesson carries more than two support Can-dos", () => {
    const full = fullClone();
    const lesson = full.lessons[0];
    const pool = full.canDos.map((c) => c.id).slice(0, 3);
    (lesson as unknown as { supportingCanDoIds: string[] }).supportingCanDoIds = pool;
    const result = validateA1({ fullCatalogs: full });
    expect(codesOf(result)).toContain("cando-supporting-overflow");
  });

  it("cando-no-transfer-evidence: an authored Can-do that no family references", () => {
    const authored: CanDo[] = [
      ...a1CanDosAuthored,
      { ...clone(a1CanDosAuthored[0]), id: "a1-can-do-unreferenced" },
    ];
    const result = validateA1({ authoredCanDos: authored });
    expect(codesOf(result)).toContain("cando-no-transfer-evidence");
  });

  it("checkpoint-min-transfer: the checkpoint accepts too few transfer targets", () => {
    const checkpoint = clone(a1Checkpoint);
    (checkpoint as { minAcceptedTransferTargetsPerCanDo: number }).minAcceptedTransferTargetsPerCanDo = 5;
    const result = validateA1({ checkpoint });
    expect(codesOf(result)).toContain("checkpoint-min-transfer");
  });
});

// ---------------------------------------------------------------------------
// A1 course-area release gate
// ---------------------------------------------------------------------------

function areaReleaseErrors(result: ReturnType<typeof validateA1>) {
  return result.errors.filter((error) => error.code.startsWith("area-"));
}

function expectOnlyAreaReleaseCode(
  result: ReturnType<typeof validateA1>,
  code: string,
  underlyingCode: string,
  id?: string,
): void {
  expect(result.valid).toBe(false);
  const errors = areaReleaseErrors(result);
  expect([...new Set(errors.map((error) => error.code))]).toEqual([code]);
  expect(errors).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        code,
        underlyingCode,
        ...(id === undefined ? {} : { id }),
      }),
    ]),
  );
}

describe("validateA1Release – A1 area integration", () => {
  it("accepts the independently sourced production areas, runtime modules, and bilingual area copy", () => {
    const result = validateWithAreaInputs({
      areas: areasClone(),
      runtimeModules: runtimeModulesClone(),
      areaCopy: areaCopyClone(),
    });

    expect(result.valid).toBe(true);
    expect(areaReleaseErrors(result)).toEqual([]);
  });

  it("reports area-count with missing-area attribution without a different area-code collision", () => {
    const areas = areasClone();
    const removed = areas.pop()!;
    areas[2] = {
      ...areas[2]!,
      moduleIds: [...areas[2]!.moduleIds, ...removed.moduleIds],
    };

    expectOnlyAreaReleaseCode(
      validateWithAreaInputs({ areas }),
      "area-count",
      "missing-area-id",
      "synthesis",
    );
  });

  it.each([
    ["duplicate", (areas: A1CourseArea[]) => {
      areas[1] = {
        ...areas[1]!,
        moduleIds: [...areas[1]!.moduleIds, "sounds"],
      };
    }, "duplicate-module-membership", "sounds"],
    ["unknown", (areas: A1CourseArea[]) => {
      areas[1] = {
        ...areas[1]!,
        moduleIds: [
          "not-an-a1-module",
          ...areas[1]!.moduleIds.slice(1),
        ] as A1CourseArea["moduleIds"],
      };
    }, "unknown-module-membership", "not-an-a1-module"],
    ["omitted", (areas: A1CourseArea[]) => {
      areas[1] = {
        ...areas[1]!,
        moduleIds: areas[1]!.moduleIds.filter(
          (moduleId) => moduleId !== "polite-verbs",
        ),
      };
    }, "missing-module-membership", "polite-verbs"],
  ])(
    "reports area-module-membership for %s membership with no different area-code collision",
    (_label, mutate, underlyingCode, id) => {
      const areas = areasClone();
      mutate(areas);

      expectOnlyAreaReleaseCode(
        validateWithAreaInputs({ areas }),
        "area-module-membership",
        underlyingCode,
        id,
      );
    },
  );

  it("reports area-order for reordered membership with real order attribution", () => {
    const areas = areasClone();
    const moduleIds = [...areas[1]!.moduleIds];
    [moduleIds[0], moduleIds[1]] = [moduleIds[1]!, moduleIds[0]!];
    areas[1] = { ...areas[1]!, moduleIds };

    expectOnlyAreaReleaseCode(
      validateWithAreaInputs({ areas }),
      "area-order",
      "module-union-order",
    );
  });

  it("checks the real runtime module area assignment rather than trusting the area declaration alone", () => {
    const runtimeModules = runtimeModulesClone();
    runtimeModules[1] = { ...runtimeModules[1]!, areaId: "sounds" };

    expectOnlyAreaReleaseCode(
      validateWithAreaInputs({ runtimeModules }),
      "area-module-membership",
      "runtime-area-mismatch",
      "sentence-foundations",
    );
  });

  it.each([
    ["duplicate", (runtimeModules: ReturnType<typeof runtimeModulesClone>) => {
      runtimeModules[1] = { ...runtimeModules[0]! };
    }, "runtime-duplicate-module", "sounds"],
    ["unknown", (runtimeModules: ReturnType<typeof runtimeModulesClone>) => {
      runtimeModules[1] = {
        ...runtimeModules[1]!,
        id: "unknown-runtime-module",
      };
    }, "runtime-unknown-module", "unknown-runtime-module"],
    ["omitted", (runtimeModules: ReturnType<typeof runtimeModulesClone>) => {
      runtimeModules.splice(1, 1);
    }, "runtime-missing-module", "sentence-foundations"],
  ])(
    "reports area-module-membership for a %s runtime module without a different area-code collision",
    (_label, mutate, underlyingCode, id) => {
      const runtimeModules = runtimeModulesClone();
      mutate(runtimeModules);

      expectOnlyAreaReleaseCode(
        validateWithAreaInputs({ runtimeModules }),
        "area-module-membership",
        underlyingCode,
        id,
      );
    },
  );

  it("checks the runtime module sequence against the ordered area membership", () => {
    const runtimeModules = runtimeModulesClone();
    [runtimeModules[1], runtimeModules[2]] = [
      runtimeModules[2]!,
      runtimeModules[1]!,
    ];

    expectOnlyAreaReleaseCode(
      validateWithAreaInputs({ runtimeModules }),
      "area-order",
      "runtime-module-order",
    );
  });

  it.each([
    ["en", "sounds", "title", "a1-area-sounds-title"],
    ["it", "foundations", "description", "a1-area-foundations-description"],
  ] as const)(
    "reports area-copy-parity for a missing %s %s",
    (locale, areaId, field, copyId) => {
      const areaCopy = areaCopyClone();
      areaCopy[locale][areaId] = {
        ...areaCopy[locale][areaId],
        [field]: "",
      };

      const result = validateWithAreaInputs({ areaCopy });
      expectOnlyAreaReleaseCode(
        result,
        "area-copy-parity",
        `missing-${locale}-area-${field}`,
        areaId,
      );
      expect(
        areaReleaseErrors(result).some((error) => error.referenceId === copyId),
      ).toBe(true);
    },
  );
});

// ---------------------------------------------------------------------------
// Copy hygiene / aliases / claims
// ---------------------------------------------------------------------------

describe("validateA1 – copy hygiene, aliases & claims", () => {
  it("copy-parity: an English key with no Italian counterpart", () => {
    const copy = copyClone();
    copy.en["a1.copy.orphan"] = "orphan text";
    const result = validateA1({ foundationCopy: copy });
    expect(codesOf(result)).toContain("copy-parity");
  });

  it("copy-contains-japanese: a rendered copy string leaking kana/kanji", () => {
    const copy = copyClone();
    const key = Object.keys(copy.en)[0];
    copy.en[key] = "practice こんにちは now";
    const result = validateA1({ foundationCopy: copy });
    expect(codesOf(result)).toContain("copy-contains-japanese");
  });

  it("checkpoint-claims-certification: copy promising certification", () => {
    const copy = copyClone();
    const key = Object.keys(copy.en)[0];
    copy.en[key] = "You are now certified at A1.";
    const result = validateA1({ foundationCopy: copy });
    expect(codesOf(result)).toContain("checkpoint-claims-certification");
  });

  it("personal-alias-match: the author's personal handle leaking into copy", () => {
    const copy = copyClone();
    const key = Object.keys(copy.en)[0];
    // Build the forbidden latin alias without embedding the literal token.
    copy.en[key] = `hello ${"ric" + "chi"} sensei`;
    const result = validateA1({ foundationCopy: copy });
    expect(codesOf(result)).toContain("personal-alias-match");
  });
});

// ---------------------------------------------------------------------------
// Phonetic contracts
// ---------------------------------------------------------------------------

describe("validateA1 – phonetic contracts", () => {
  it("phonetic-missing-items: a sounds lesson with no items", () => {
    const items = phoneticItemsClone();
    const lessonId = module1Lessons[0].id;
    items[lessonId] = [];
    const result = validateA1({ phoneticItemsByLesson: items });
    expect(codesOf(result)).toContain("phonetic-missing-items");
  });

  it("phonetic-dangling-contrast: an item contrasting with a non-existent item", () => {
    const items = phoneticItemsClone();
    const lessonId = module1Lessons[0].id;
    (items[lessonId][0] as { contrastWithId: string }).contrastWithId = "no-such-item";
    const result = validateA1({ phoneticItemsByLesson: items });
    expect(codesOf(result)).toContain("phonetic-dangling-contrast");
  });

  it("phonetic-contrast-cross-lesson: an item contrasting with a real item from a *different* lesson is not silently accepted (I2 fix) — the UI only ever resolves a contrast partner within the same lesson's roster, so a globally-resolvable-but-cross-lesson id must be its own distinct, reported error, not conflated with a fully dangling one", () => {
    const items = phoneticItemsClone();
    const lessonAId = module1Lessons[0].id;
    const lessonBId = module1Lessons[1].id;
    const realItemFromAnotherLesson = items[lessonBId][0].id;
    (items[lessonAId][0] as { contrastWithId: string }).contrastWithId = realItemFromAnotherLesson;
    const result = validateA1({ phoneticItemsByLesson: items });
    const codes = codesOf(result);
    expect(codes).toContain("phonetic-contrast-cross-lesson");
    expect(codes).not.toContain("phonetic-dangling-contrast");
  });

  it("phonetic-duplicate-exercise: two items sharing an exercise ref", () => {
    const items = phoneticItemsClone();
    const lessonId = module1Lessons[0].id;
    const ref = items[lessonId][0].exerciseRefId;
    (items[lessonId][1] as { exerciseRefId: string }).exerciseRefId = ref;
    const result = validateA1({ phoneticItemsByLesson: items });
    expect(codesOf(result)).toContain("phonetic-duplicate-exercise");
  });

  it("phonetic-item-incomplete: an item missing a required field", () => {
    const items = phoneticItemsClone();
    const lessonId = module1Lessons[0].id;
    (items[lessonId][0] as { roman: string }).roman = "";
    const result = validateA1({ phoneticItemsByLesson: items });
    expect(codesOf(result)).toContain("phonetic-item-incomplete");
  });

  it("phonetic-lesson-mismatch: a recipe practice-ref list out of sync", () => {
    const lessons = clone(module1Lessons);
    (lessons[0] as unknown as { practiceTargetRefs: string[] }).practiceTargetRefs = [
      ...lessons[0].practiceTargetRefs,
    ].reverse();
    const result = validateA1({ phoneticLessons: lessons });
    expect(codesOf(result)).toContain("phonetic-lesson-mismatch");
  });
});

// ---------------------------------------------------------------------------
// Determinism of the error channel
// ---------------------------------------------------------------------------

describe("validateA1 – deterministic error ordering", () => {
  it("emits errors sorted by (code, id, dimension, referenceId)", () => {
    // A mutation that raises several errors at once must return them sorted.
    const full = fullClone();
    (full.lessonPositions as unknown as unknown[]).pop();
    (full.lessonPositions[0] as unknown as { position: number }).position += 100;
    const result = validateA1({ fullCatalogs: full });
    const keys = result.errors.map(
      (e) => `${e.code}\u0000${e.id ?? ""}\u0000${e.dimension ?? ""}\u0000${e.referenceId ?? ""}`,
    );
    const sorted = [...keys].sort();
    expect(keys).toEqual(sorted);
    // And repeated evaluation is byte-identical.
    const again = validateA1({ fullCatalogs: fullClone() });
    const againAfterPop = (() => {
      const f = fullClone();
      (f.lessonPositions as unknown as unknown[]).pop();
      (f.lessonPositions[0] as unknown as { position: number }).position += 100;
      return validateA1({ fullCatalogs: f });
    })();
    expect(againAfterPop.errors).toEqual(result.errors);
    expect(again.valid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Canonical release error vocabulary (Task 1 Step 3 / Task 4 integration)
// ---------------------------------------------------------------------------

describe("validateA1 – canonical release error vocabulary lives in types.ts", () => {
  it("is a runtime-checkable list, and A1ValidationErrorCode is exactly that list", () => {
    // Not a compile-only alias check: the emitted `A1ValidationErrorCode` union
    // must be backed by the same runtime array types.ts exposes, so every code
    // below is provably a member rather than an independently-declared literal.
    expect(A1_RELEASE_ERROR_CODES.length).toBeGreaterThan(0);
    expect(new Set(A1_RELEASE_ERROR_CODES).size).toBe(A1_RELEASE_ERROR_CODES.length);
    expect(A1_RELEASE_ERROR_CODES).toEqual(
      expect.arrayContaining([
        "area-count",
        "area-module-membership",
        "area-order",
        "area-copy-parity",
      ]),
    );
  });

  it("emits an introduction-order violation (unknown-content) that is a member of the canonical vocabulary", () => {
    const semantic = semanticClone();
    const model = semantic.sentenceVariants.find(
      (v) => v.pedagogicalUse === "model" && !v.id.startsWith("capstones-"),
    );
    expect(model).toBeDefined();
    const slotKey = Object.keys(model!.slotValues)[0];
    (model!.slotValues as Record<string, string>)[slotKey] = "a1-value-does-not-exist";
    const result = validateA1({ semanticCatalogs: semantic });
    expect(codesOf(result)).toContain("unknown-content");
    for (const code of codesOf(result)) {
      expect(A1_RELEASE_ERROR_CODES).toContain(code as A1ReleaseErrorCode);
    }
  });

  it("emits an unresolved-route violation (unknown-lesson-id) that is a member of the canonical vocabulary", () => {
    const full = fullClone();
    const first = clone(full.lessonPositions[0]);
    (full.lessonPositions as unknown as Record<string, unknown>[]).push({
      ...first,
      lessonId: "totally-unresolved-route",
      position: 999,
    });
    const result = validateA1({ fullCatalogs: full });
    expect(codesOf(result)).toContain("unknown-lesson-id");
    for (const code of codesOf(result)) {
      expect(A1_RELEASE_ERROR_CODES).toContain(code as A1ReleaseErrorCode);
    }
  });

  it("emits an unresolved-copy violation (copy-parity) that is a member of the canonical vocabulary", () => {
    const copy = copyClone();
    copy.en["a1.copy.unresolved"] = "unresolved text";
    const result = validateA1({ foundationCopy: copy });
    expect(codesOf(result)).toContain("copy-parity");
    for (const code of codesOf(result)) {
      expect(A1_RELEASE_ERROR_CODES).toContain(code as A1ReleaseErrorCode);
    }
  });

  it("emits full-release-count violations (module-count, lessons-per-module, route-count) that are members of the canonical vocabulary", () => {
    const full = fullClone();
    (full.modules as unknown as unknown[]).splice(1, 1);
    (full.modules[1].lessonIds as unknown as string[]).push("descriptions-1");
    (full.lessonPositions as unknown as unknown[]).pop();
    const result = validateA1({ fullCatalogs: full });
    expect(codesOf(result)).toContain("module-count");
    expect(codesOf(result)).toContain("lessons-per-module");
    expect(codesOf(result)).toContain("route-count");
    for (const code of codesOf(result)) {
      expect(A1_RELEASE_ERROR_CODES).toContain(code as A1ReleaseErrorCode);
    }
  });
});
