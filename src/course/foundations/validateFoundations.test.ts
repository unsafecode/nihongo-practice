import { describe, expect, it } from "vitest";

import { foundationCatalogs, foundationCopy } from "./fixtures";
import type {
  CanDo,
  FoundationCatalogs,
  LearningTargetSense,
  SentenceVariant,
  VerbUseRecord,
} from "./types";
import {
  validateFoundations,
  validateFoundationsWithDeps,
  senseConflationDimension,
  type ValidateFoundationsInput,
  type ValidationError,
  type ValidationErrorCode,
  type ValidateFoundationsResult,
  type ValidateFoundationsDeps,
} from "./validateFoundations";
import { selectVariants } from "./selectVariants";
import { generateFamilyExercise, type FamilyExerciseResult } from "./practiceEngine";

// ---------------------------------------------------------------------------
// Fixtures + harness
// ---------------------------------------------------------------------------

const CATALOG_VERSION = "cat-v1";
const SEED = "seed-x";
const A1 = "fixture-a1-personal-details";
const A2 = "fixture-a2-routine-plans";

function run(
  catalogs: FoundationCatalogs = foundationCatalogs,
  copy: ValidateFoundationsInput["foundationCopy"] = foundationCopy,
): ValidateFoundationsResult {
  return validateFoundations({ catalogs, foundationCopy: copy, catalogVersion: CATALOG_VERSION, seed: SEED });
}

const uniqueCodes = (result: ValidateFoundationsResult): ValidationErrorCode[] =>
  Array.from(new Set(result.errors.map((e) => e.code))).sort() as ValidationErrorCode[];

/** Assert that the mutation produced errors and that *every* one is `code`. */
function expectSoleCode(result: ValidateFoundationsResult, code: ValidationErrorCode): void {
  expect(result.valid).toBe(false);
  expect(result.errors.length).toBeGreaterThan(0);
  expect(uniqueCodes(result)).toEqual([code]);
}

/** Assert that the mutation produced `code` among its (possibly coupled) errors. */
function expectContainsCode(result: ValidateFoundationsResult, code: ValidationErrorCode): void {
  expect(result.valid).toBe(false);
  expect(result.errors.map((e) => e.code)).toContain(code);
}

// --- Non-mutating catalog override helpers (originals are deep-frozen) -------

function replaceById<T extends { id: string }>(items: readonly T[], id: string, patch: Partial<T>): T[] {
  return items.map((item) => (item.id === id ? { ...item, ...patch } : item));
}

function withCatalog(patch: Partial<FoundationCatalogs>): FoundationCatalogs {
  return { ...foundationCatalogs, ...patch };
}

function withVariant(id: string, patch: Partial<SentenceVariant>): FoundationCatalogs {
  return withCatalog({ sentenceVariants: replaceById(foundationCatalogs.sentenceVariants, id, patch) });
}

function withLesson(id: string, patch: Record<string, unknown>): FoundationCatalogs {
  return withCatalog({
    lessons: foundationCatalogs.lessons.map((l) => (l.id === id ? ({ ...l, ...patch }) : l)),
  });
}

function withDiversity(id: string, diversity: Record<string, unknown>): FoundationCatalogs {
  const lesson = foundationCatalogs.lessons.find((l) => l.id === id)!;
  return withLesson(id, { diversityConstraints: { ...lesson.diversityConstraints, ...diversity } });
}

function withVerb(id: string, patch: Partial<VerbUseRecord>): FoundationCatalogs {
  return withCatalog({ verbUseRecords: replaceById(foundationCatalogs.verbUseRecords, id, patch) });
}

function variant(id: string): SentenceVariant {
  return foundationCatalogs.sentenceVariants.find((v) => v.id === id)!;
}

function lessonPractice(id: string) {
  return foundationCatalogs.lessons.find((l) => l.id === id)!.practice;
}

// ---------------------------------------------------------------------------
// Happy path
// ---------------------------------------------------------------------------

describe("validateFoundations — valid foundation fixtures", () => {
  it("returns valid=true, zero errors and complete reports", () => {
    const result = run();
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.reports.byLesson[A1].complete).toBe(true);
    expect(result.reports.byLesson[A2].complete).toBe(true);
    for (const level of Object.values(result.reports.byLevel)) {
      expect(level.complete).toBe(true);
    }
  });

  it("produces the exact A1 lesson row with the expected selector target IDs", () => {
    const a1 = run().reports.byLesson[A1];
    expect(a1.modelCount).toBe(8);
    expect(a1.predicateSenseIds).toHaveLength(4);
    expect(a1.roleIds).toHaveLength(5);
    expect(a1.contextIds).toHaveLength(3);
    expect(a1.omittedSubjectCount).toBe(2);
    expect(a1.exerciseCount).toBe(10);
    expect(a1.uniqueVisibleTargetCount).toBe(10);
    expect(a1.maximumVisibleReuse).toBe(1);
    expect(a1.transferTargetIds).toEqual([
      "fixture-a1-transfer-classmate-live-rome",
      "fixture-a1-transfer-ken-study-japanese",
      "fixture-a1-transfer-omitted-study-english",
      "fixture-a1-transfer-teacher-do-work",
      "fixture-a1-transfer-yuki-work-company",
    ]);
    expect(a1.primaryCanDoId).toBe("fixture-a1-can-do-personal-details");
    expect(a1.validationErrorCodes).toEqual([]);
  });

  it("produces the exact A2 lesson row with the expected selector target IDs", () => {
    const a2 = run().reports.byLesson[A2];
    expect(a2.modelCount).toBe(8);
    expect(a2.predicateSenseIds).toHaveLength(6);
    expect(a2.roleIds).toHaveLength(6);
    expect(a2.omittedSubjectCount).toBe(1);
    expect(a2.exerciseCount).toBe(10);
    expect(a2.uniqueVisibleTargetCount).toBe(10);
    expect(a2.maximumVisibleReuse).toBe(1);
    expect(a2.transferTargetIds).toEqual([
      "fixture-a2-transfer-colleague-go-tomorrow",
      "fixture-a2-transfer-friend-eat-weekend",
      "fixture-a2-transfer-neighbor-meet-after-work",
      "fixture-a2-transfer-omitted-invite-lunch",
      "fixture-a2-transfer-traveler-work-morning",
    ]);
  });
});

// ---------------------------------------------------------------------------
// Input immutability
// ---------------------------------------------------------------------------

describe("validateFoundations — input immutability", () => {
  it("never mutates or omits input catalog / copy entries", () => {
    const catalogSnapshot = JSON.stringify(foundationCatalogs);
    const copySnapshot = JSON.stringify(foundationCopy);
    const result = run();
    expect(JSON.stringify(foundationCatalogs)).toBe(catalogSnapshot);
    expect(JSON.stringify(foundationCopy)).toBe(copySnapshot);
    // Reports never drop authored entries.
    expect(Object.keys(result.reports.byModule)).toHaveLength(foundationCatalogs.modules.length);
    expect(Object.keys(result.reports.byLevel)).toHaveLength(foundationCatalogs.levels.length);
  });

  it("tolerates deeply frozen input without throwing", () => {
    const deepFreeze = (value: unknown): void => {
      if (value && typeof value === "object") {
        Object.values(value as Record<string, unknown>).forEach(deepFreeze);
        Object.freeze(value);
      }
    };
    deepFreeze(foundationCatalogs);
    deepFreeze(foundationCopy);
    expect(() => run()).not.toThrow();
    expect(run().valid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Stage 1 — integrity / reference / copy / alias
// ---------------------------------------------------------------------------

describe("validateFoundations — stage 1 integrity mutations", () => {
  it("duplicate-entity-id", () => {
    const cats = withCatalog({ contexts: [...foundationCatalogs.contexts, { ...foundationCatalogs.contexts[0] }] });
    expectSoleCode(run(cats), "duplicate-entity-id");
  });

  it("missing-level-reference (cascades across a2 entities)", () => {
    const cats = withCatalog({ levels: foundationCatalogs.levels.filter((l) => l.id !== "a2") });
    expectContainsCode(run(cats), "missing-level-reference");
  });

  it("missing-module-reference", () => {
    const cats = withCatalog({
      levels: replaceById(foundationCatalogs.levels, "a1", {
        moduleIds: ["fixture-a1-module", "fixture-a1-module-2", "bogus-module"],
      }),
    });
    expectSoleCode(run(cats), "missing-module-reference");
  });

  it("missing-checkpoint-reference", () => {
    const cats = withCatalog({
      levels: replaceById(foundationCatalogs.levels, "a2", { recommendedPrerequisiteCheckpointId: "bogus-checkpoint" }),
    });
    expectSoleCode(run(cats), "missing-checkpoint-reference");
  });

  it("missing-lesson-reference", () => {
    const cats = withCatalog({
      modules: replaceById(foundationCatalogs.modules, "fixture-a1-module", {
        lessonIds: ["fixture-a1-personal-details", "fixture-a1-lesson-recur-1", "bogus-lesson"],
      }),
    });
    expectSoleCode(run(cats), "missing-lesson-reference");
  });

  it("missing-can-do-reference", () => {
    const cats = withCatalog({
      checkpoints: replaceById(foundationCatalogs.checkpoints, "fixture-a1-checkpoint", {
        sampledCanDoIds: ["bogus-can-do"],
      }),
    });
    expectSoleCode(run(cats), "missing-can-do-reference");
  });

  it("missing-family-reference", () => {
    expectSoleCode(run(withVariant("fixture-a1-yuki-student-meeting", { sentenceFamilyId: "bogus-family" })), "missing-family-reference");
  });

  it("missing-variant-reference", () => {
    const lesson = foundationCatalogs.lessons.find((l) => l.id === A1)!;
    expectSoleCode(run(withLesson(A1, { modelVariantIds: [...lesson.modelVariantIds, "bogus-variant"] })), "missing-variant-reference");
  });

  it("missing-role-reference", () => {
    const cats = withCatalog({ referents: replaceById(foundationCatalogs.referents, "fixture-referent-yuki", { personRoleId: "bogus-role" }) });
    expectSoleCode(run(cats), "missing-role-reference");
  });

  it("missing-referent-reference", () => {
    const v = variant("fixture-a1-yuki-student-meeting");
    expectSoleCode(run(withVariant(v.id, { discourse: { ...v.discourse, subjectReferentId: "bogus-referent" } })), "missing-referent-reference");
  });

  it("missing-context-reference", () => {
    expectSoleCode(run(withVariant("fixture-a1-yuki-student-meeting", { contextId: "bogus-context" })), "missing-context-reference");
  });

  it("missing-sense-reference", () => {
    const cats = withCatalog({ semanticValues: replaceById(foundationCatalogs.semanticValues, "fixture-a1-value-be", { senseId: "bogus-sense" }) });
    expectSoleCode(run(cats), "missing-sense-reference");
  });

  it("missing-value-reference", () => {
    expectSoleCode(
      run(withVariant("fixture-a1-yuki-student-meeting", { slotValues: { subject: "bogus-value", predicate: "fixture-a1-value-be", object: "fixture-a1-value-object-student" } })),
      "missing-value-reference",
    );
  });

  it("missing-lesson-position", () => {
    const cats = withCatalog({ lessonPositions: foundationCatalogs.lessonPositions.filter((p) => p.lessonId !== A1) });
    expectSoleCode(run(cats), "missing-lesson-position");
  });

  it("invalid-copy-parity", () => {
    const it = { ...foundationCopy.it };
    delete it["fixture-a1-context-first-meeting-label"];
    expectSoleCode(run(foundationCatalogs, { en: foundationCopy.en, it }), "invalid-copy-parity");
  });

  it("personal-alias-match", () => {
    const copy = { en: { ...foundationCopy.en, "fixture-a1-context-first-meeting-label": "Meeting with Ricchi" }, it: foundationCopy.it };
    expectSoleCode(run(foundationCatalogs, copy), "personal-alias-match");
  });
});

// ---------------------------------------------------------------------------
// Stage 2 — realization wrapping
// ---------------------------------------------------------------------------

describe("validateFoundations — stage 2 realization wrapping", () => {
  it("realization-failed wraps a typed lower-layer realizer failure and preserves the underlying code", () => {
    // A structurally-valid reference (the value exists) but the wrong *kind*
    // of value for the slot — only the realizer can detect this.
    const result = run(
      withVariant("fixture-a1-yuki-student-meeting", {
        slotValues: { subject: "fixture-value-yuki", predicate: "fixture-a1-value-be", object: "fixture-a1-value-location-rome" },
      }),
    );
    expectSoleCode(result, "realization-failed");
    expect(result.errors[0].underlyingCode).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Stage 3 — model diversity
// ---------------------------------------------------------------------------

describe("validateFoundations — stage 3 model diversity mutations", () => {
  it("invalid-model-count", () => {
    const drop = "fixture-a1-yuki-student-meeting";
    const lesson = foundationCatalogs.lessons.find((l) => l.id === A1)!;
    const cats = withLesson(A1, {
      modelVariantIds: lesson.modelVariantIds.filter((id) => id !== drop),
      practice: {
        ...lesson.practice,
        roundOne: { ...lesson.practice.roundOne, candidateVariantIds: lesson.practice.roundOne.candidateVariantIds.filter((id) => id !== drop) },
      },
    });
    expectSoleCode(run(cats), "invalid-model-count");
  });

  it("insufficient-predicate-diversity", () => {
    expectSoleCode(run(withDiversity(A1, { minPredicates: 5 })), "insufficient-predicate-diversity");
  });

  it("insufficient-role-diversity", () => {
    expectSoleCode(run(withDiversity(A1, { minRoles: 6 })), "insufficient-role-diversity");
  });

  it("insufficient-context-diversity", () => {
    expectSoleCode(run(withDiversity(A1, { minContexts: 4 })), "insufficient-context-diversity");
  });
});

// ---------------------------------------------------------------------------
// Stage 4 — selection / exercises (typed selection wrapping)
// ---------------------------------------------------------------------------

describe("validateFoundations — stage 4 selection / exercise mutations", () => {
  it("invalid-exercise-count", () => {
    expectSoleCode(run(withDiversity(A1, { exerciseCountRange: [8, 9] })), "invalid-exercise-count");
  });

  it("insufficient-unique-targets (wraps constraint-unsatisfied unique-visible-target)", () => {
    const result = run(withDiversity(A1, { minUniqueTargets: 11 }));
    expectSoleCode(result, "insufficient-unique-targets");
    expect(result.errors[0].underlyingCode).toBe("constraint-unsatisfied");
    expect(result.errors[0].dimension).toBe("unique-visible-target");
  });

  it("target-reuse-exceeded (wraps constraint-unsatisfied max-visible-reuse)", () => {
    const result = run(withDiversity(A1, { maxTargetReuse: 0 }));
    expectSoleCode(result, "target-reuse-exceeded");
    expect(result.errors[0].dimension).toBe("max-visible-reuse");
  });

  it("duplicate-semantic-target (two models share a semantic fingerprint)", () => {
    const yuki = variant("fixture-a1-yuki-student-meeting");
    const dup: SentenceVariant = { ...yuki, id: "fixture-a1-yuki-student-DUP" };
    const lesson = foundationCatalogs.lessons.find((l) => l.id === A1)!;
    const cats = withCatalog({
      sentenceVariants: [...foundationCatalogs.sentenceVariants, dup],
      lessons: foundationCatalogs.lessons.map((l) => (l.id === A1 ? { ...l, modelVariantIds: [...lesson.modelVariantIds, dup.id] } : l)),
    });
    expectSoleCode(run(cats), "duplicate-semantic-target");
  });

  it("insufficient-transfer (round two cannot meet the transfer minimum)", () => {
    expectSoleCode(run(withDiversity(A1, { minTransferExercises: 6 })), "insufficient-transfer");
  });

  it("missing-controlled-transfer (round two drops the constrained construction kind)", () => {
    const practice = lessonPractice(A1);
    const cats = withLesson(A1, {
      practice: { ...practice, roundTwo: { ...practice.roundTwo, exerciseKinds: ["transformation", "completion"] } },
    });
    expectSoleCode(run(cats), "missing-controlled-transfer");
  });

  it("selection-failed wraps an otherwise-unmapped typed selection failure", () => {
    const practice = lessonPractice(A1);
    const cats = withLesson(A1, {
      practice: {
        ...practice,
        roundOne: { ...practice.roundOne, candidateVariantIds: [...practice.roundOne.candidateVariantIds, practice.roundOne.candidateVariantIds[0]] },
      },
    });
    const result = run(cats);
    expectSoleCode(result, "selection-failed");
    expect(result.errors[0].underlyingCode).toBeDefined();
  });

  it("includes practice-generation-failed as a defensive lower-layer wrapper in the code union", () => {
    // The token IDs generated per selected variant are namespaced, so a clean
    // deterministic generation failure is not reproducible from authored data.
    // The wrapper nonetheless exists to surface any typed generator failure.
    const code: ValidationErrorCode = "practice-generation-failed";
    expect(code).toBe("practice-generation-failed");
  });
});

// ---------------------------------------------------------------------------
// Stage 5 — transfer tuple (duplicate + unintroduced, independently)
// ---------------------------------------------------------------------------

describe("validateFoundations — stage 5 transfer mutations", () => {
  it("transfer-duplicates-model (transfer fingerprint matches a model)", () => {
    const model = variant("fixture-a1-yuki-study-japanese");
    const cats = withVariant("fixture-a1-transfer-ken-study-japanese", {
      discourse: model.discourse,
      contextId: model.contextId,
      slotValues: model.slotValues,
      form: model.form,
    });
    expectSoleCode(run(cats), "transfer-duplicates-model");
  });

  it("transfer-uses-unintroduced-content (transfer introduces a new form)", () => {
    const result = run(
      withVariant("fixture-a1-transfer-ken-study-japanese", {
        form: { polarity: "negative", tense: "present", formality: "polite" },
      }),
    );
    expectSoleCode(result, "transfer-uses-unintroduced-content");
    expect(result.errors[0].dimension).toBe("form");
  });
});

// ---------------------------------------------------------------------------
// Stage 6 — learning use / verb recurrence / senses
// ---------------------------------------------------------------------------

describe("validateFoundations — stage 6 verb recurrence and sense mutations", () => {
  it("productive-verb-introduction-structure (both intro variants share one structure)", () => {
    const cats = withVerb("fixture-a1-verb-use-study", {
      introductionVariantIds: ["fixture-a1-yuki-study-japanese", "fixture-a1-recur1-study"],
    });
    expectContainsCode(run(cats), "productive-verb-introduction-structure");
  });

  it("productive-verb-structure-reuse (fewer than two structures across intro + reuse)", () => {
    const cats = withVerb("fixture-a1-verb-use-study", {
      introductionVariantIds: ["fixture-a1-yuki-study-japanese", "fixture-a1-recur1-study"],
    });
    expectContainsCode(run(cats), "productive-verb-structure-reuse");
  });

  it("productive-verb-introduction-exercise (intro exercise target is not an intro variant)", () => {
    const record = foundationCatalogs.verbUseRecords.find((r) => r.id === "fixture-a1-verb-use-study")!;
    const cats = withVerb("fixture-a1-verb-use-study", {
      introductionExercise: { ...record.introductionExercise, targetVariantId: "fixture-a1-recur1-study" },
    });
    expectSoleCode(run(cats), "productive-verb-introduction-exercise");
  });

  it("productive-verb-later-reuse (fewer than two later uses)", () => {
    const cats = withVerb("fixture-a1-verb-use-study", {
      laterUses: [{ lessonId: "fixture-a1-lesson-recur-2", variantId: "fixture-a1-recur2-study" }],
    });
    expectSoleCode(run(cats), "productive-verb-later-reuse");
  });

  it("productive-verb-spaced-reuse (all later uses within one lesson gap)", () => {
    const cats = withVerb("fixture-a1-verb-use-study", {
      laterUses: [
        { lessonId: "fixture-a1-lesson-recur-1", variantId: "fixture-a1-recur1-study" },
        { lessonId: "fixture-a1-lesson-recur-1", variantId: "fixture-a1-recur1-study" },
      ],
    });
    expectContainsCode(run(cats), "productive-verb-spaced-reuse");
  });

  it("productive-verb-later-module (no reuse in a later module)", () => {
    const cats = withVerb("fixture-a1-verb-use-study", {
      laterUses: [
        { lessonId: "fixture-a1-lesson-recur-1", variantId: "fixture-a1-recur1-study" },
        { lessonId: "fixture-a1-lesson-recur-1", variantId: "fixture-a1-recur1-study" },
      ],
    });
    expectContainsCode(run(cats), "productive-verb-later-module");
  });

  it("structure signatures count subject realization and ignore person identity", () => {
    // The valid study record introduces the same family/form with an explicit
    // and an omitted subject across two different people/contexts, yet the
    // structure signature registers exactly two structures.
    const study = run().reports.verbUse.find((r) => r.recordId === "fixture-a1-verb-use-study")!;
    expect(study.distinctStructureCount).toBe(2);
    expect(study.introductionStructureKeys).toEqual([
      "fixture-a1-object-action|explicit|affirmative:present:polite|object,predicate,subject",
      "fixture-a1-object-action|omitted|affirmative:present:polite|object,predicate,subject",
    ]);
  });

  it("receptive-use-insufficient-input (a receptive record with a single input instance)", () => {
    const record: VerbUseRecord = {
      id: "synthetic-receptive-thin",
      senseId: "fixture-a1-sense-be",
      learningUse: "receptive",
      introductionLessonId: A1,
      introductionVariantIds: ["fixture-a1-yuki-student-meeting"],
      introductionExercise: {
        lessonId: A1,
        roundId: "fixture-a1-personal-details-round-1",
        exerciseKind: "choice",
        targetVariantId: "fixture-a1-yuki-student-meeting",
      },
      laterUses: [],
    };
    const cats = withCatalog({ verbUseRecords: [...foundationCatalogs.verbUseRecords, record] });
    expectSoleCode(run(cats), "receptive-use-insufficient-input");
  });

  it("receptive-use-missing-comprehension (no correctness-bearing comprehension of an input)", () => {
    const record: VerbUseRecord = {
      id: "synthetic-receptive-nocomp",
      senseId: "fixture-a1-sense-be",
      learningUse: "receptive",
      introductionLessonId: A1,
      introductionVariantIds: ["fixture-a1-yuki-student-meeting", "fixture-a1-teacher-omitted-class"],
      introductionExercise: {
        lessonId: A1,
        roundId: "fixture-a1-personal-details-round-1",
        exerciseKind: "choice",
        targetVariantId: "fixture-a1-ken-doctor-meeting",
      },
      laterUses: [],
    };
    const cats = withCatalog({ verbUseRecords: [...foundationCatalogs.verbUseRecords, record] });
    expectSoleCode(run(cats), "receptive-use-missing-comprehension");
  });

  it("conflated-sense-context (two senses share lexeme + semantic frame)", () => {
    const sense: LearningTargetSense = {
      id: "synthetic-conflated-sense",
      lexemeId: "fixture-a1-lexeme-desu",
      learningUse: "productive",
      semanticFrameId: "fixture-frame-identity",
      predicate: "be",
      argumentRoles: ["topic"],
      argumentParticleByRole: {},
    };
    const cats = withCatalog({ learningTargetSenses: [...foundationCatalogs.learningTargetSenses, sense] });
    expectSoleCode(run(cats), "conflated-sense-context");
  });
});

// ---------------------------------------------------------------------------
// Stage 7 — Can-do coverage
// ---------------------------------------------------------------------------

describe("validateFoundations — stage 7 Can-do mutations", () => {
  it("can-do-primary-coverage (primary Can-do no longer covers its lesson)", () => {
    const cats = withCatalog({ canDos: replaceById(foundationCatalogs.canDos, "fixture-a1-can-do-personal-details", { lessonIds: [] }) });
    expectSoleCode(run(cats), "can-do-primary-coverage");
  });

  it("can-do-supporting-overflow (more than two supporting Can-dos)", () => {
    const cats = withLesson(A1, {
      supportingCanDoIds: [
        "fixture-a1-can-do-personal-details",
        "fixture-a2-can-do-routine-plans",
        "fixture-a1-can-do-personal-details",
      ],
    });
    expectSoleCode(run(cats), "can-do-supporting-overflow");
  });

  it("can-do-transfer-coverage (a Can-do has no transfer-bearing family)", () => {
    const dangling: CanDo = {
      id: "synthetic-dangling-can-do",
      level: "a1",
      domain: "interaction",
      descriptorCopyId: "fixture-a1-candos-personal-details-descriptor",
      contextIds: ["fixture-a1-context-first-meeting"],
      lessonIds: [],
      checkpointEvidenceRule: { evidenceKind: "checkpoint-sampled", minAcceptedTransferTargets: 2 },
      sourceNote: "product-authored-jf-cefr-aligned",
    };
    const cats = withCatalog({ canDos: [...foundationCatalogs.canDos, dangling] });
    expectSoleCode(run(cats), "can-do-transfer-coverage");
  });

  it("can-do-checkpoint-coverage (a taught primary Can-do is not sampled by any checkpoint)", () => {
    const cats = withCatalog({ checkpoints: replaceById(foundationCatalogs.checkpoints, "fixture-a1-checkpoint", { sampledCanDoIds: [] }) });
    expectSoleCode(run(cats), "can-do-checkpoint-coverage");
  });
});

// ---------------------------------------------------------------------------
// Visible-target semantics: Japanese key governs uniqueness / reuse
// ---------------------------------------------------------------------------

describe("validateFoundations — visible target keying", () => {
  it("keys reuse and uniqueness on Japanese orthography, so a hidden fingerprint cannot inflate uniqueness", () => {
    // A clone with an identical Japanese realization but a distinct hidden
    // discourse fingerprint (different addressee) offered as an extra candidate.
    const yuki = variant("fixture-a1-yuki-student-meeting");
    const hiddenDup: SentenceVariant = {
      ...yuki,
      id: "fixture-a1-yuki-student-hidden",
      discourse: { ...yuki.discourse, addresseeRoleId: "fixture-a1-role-ken" },
    };
    const practice = lessonPractice(A1);
    const cats = withCatalog({
      sentenceVariants: [...foundationCatalogs.sentenceVariants, hiddenDup],
      lessons: foundationCatalogs.lessons.map((l) =>
        l.id === A1
          ? { ...l, practice: { ...practice, roundOne: { ...practice.roundOne, candidateVariantIds: [...practice.roundOne.candidateVariantIds, hiddenDup.id] } } }
          : l,
      ),
    });
    const a1 = run(cats).reports.byLesson[A1];
    // Uniqueness is the number of distinct Japanese keys, not distinct fingerprints.
    expect(a1.uniqueVisibleTargetCount).toBe(Object.keys(a1.visibleTargetCounts).length);
    expect(a1.maximumVisibleReuse).toBeLessThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------------
// Deterministic error ordering with multiple faults
// ---------------------------------------------------------------------------

describe("validateFoundations — deterministic error ordering", () => {
  it("orders multiple faults by validation stage within a lesson", () => {
    // A stage-3 diversity fault and a stage-4 exercise-count fault in one lesson.
    const cats = withDiversity(A1, { minPredicates: 5, exerciseCountRange: [8, 9] });
    const codes = run(cats).errors.map((e) => e.code);
    expect(codes).toEqual(["insufficient-predicate-diversity", "invalid-exercise-count"]);
  });

  it("orders faults across lessons by canonical lesson position", () => {
    // The same stage-3 fault in both lessons — A1 (level a1) sorts before A2.
    const lessonA1 = foundationCatalogs.lessons.find((l) => l.id === A1)!;
    const lessonA2 = foundationCatalogs.lessons.find((l) => l.id === A2)!;
    const cats = withCatalog({
      lessons: foundationCatalogs.lessons.map((l) => {
        if (l.id === A1) return { ...l, diversityConstraints: { ...lessonA1.diversityConstraints, minContexts: 4 } };
        if (l.id === A2) return { ...l, diversityConstraints: { ...lessonA2.diversityConstraints, minContexts: 4 } };
        return l;
      }),
    });
    const lessonIds = run(cats).errors.map((e: ValidationError) => e.lessonId);
    expect(lessonIds).toEqual([A1, A2]);
  });
});

// ---------------------------------------------------------------------------
// Finding 1 + 4 — dedicated round-one candidates flow through the single live
// selection/generation path (models + round1 + round2, dedup by variant id)
// ---------------------------------------------------------------------------

/** Runs the validator while capturing which variant ids the *production*
 * generation path actually generated an exercise for, plus how many times the
 * selector was invoked per (lesson, round). Uses the real production deps for
 * everything else. */
function runCapturing(
  cats: FoundationCatalogs = foundationCatalogs,
): {
  readonly result: ValidateFoundationsResult;
  readonly generatedVariantIds: readonly string[];
  readonly selectorCalls: ReadonlyArray<{ readonly lessonId: string; readonly roundId: string }>;
} {
  const generatedVariantIds: string[] = [];
  const selectorCalls: { lessonId: string; roundId: string }[] = [];
  const deps: ValidateFoundationsDeps = {
    selectVariants: (input) => {
      selectorCalls.push({ lessonId: input.lessonId, roundId: input.round.id });
      return selectVariants(input);
    },
    generateExercise: (target, sentence, context) => {
      generatedVariantIds.push(target.variantId);
      return generateFamilyExercise(target, sentence, context);
    },
  };
  const result = validateFoundationsWithDeps(
    { catalogs: cats, foundationCopy, catalogVersion: CATALOG_VERSION, seed: SEED },
    deps,
  );
  return { result, generatedVariantIds, selectorCalls };
}

describe("validateFoundations — dedicated round-one candidates (single live path)", () => {
  it("selects and generates a controlled-practice-only round-one variant that is neither a model nor a round-two candidate", () => {
    const model = variant("fixture-a1-yuki-student-meeting");
    // A dedicated controlled-practice clone: outside modelVariantIds and outside
    // round two, present only as a round-one candidate.
    const practiceOnly: SentenceVariant = {
      ...model,
      id: "fixture-a1-yuki-student-practice",
      pedagogicalUse: "controlled-practice",
    };
    const practice = lessonPractice(A1);
    const cats = withCatalog({
      sentenceVariants: [...foundationCatalogs.sentenceVariants, practiceOnly],
      lessons: foundationCatalogs.lessons.map((l) =>
        l.id === A1
          ? {
              ...l,
              practice: {
                ...practice,
                roundOne: {
                  ...practice.roundOne,
                  // Force selection of all five candidates (targetCount === 5),
                  // one of which is the dedicated practice-only clone.
                  candidateVariantIds: [
                    practiceOnly.id,
                    "fixture-a1-ken-doctor-meeting",
                    "fixture-a1-teacher-omitted-class",
                    "fixture-a1-yuki-live-rome",
                    "fixture-a1-classmate-live-milan",
                  ],
                },
              },
            }
          : l,
      ),
    });
    const { result, generatedVariantIds } = runCapturing(cats);
    expect(result.valid).toBe(true);
    // The dedicated round-one candidate flowed through the single live path:
    // it was selected AND generated using a context that includes it.
    expect(generatedVariantIds).toContain("fixture-a1-yuki-student-practice");
  });

  it("builds the generation context as the deduped union of models + round1 + round2 candidates", () => {
    const { result, generatedVariantIds } = runCapturing();
    expect(result.valid).toBe(true);
    // Twenty exercises generated (5 per round, 2 rounds, 2 lessons), each
    // variant id distinct: the union context never double-generates a variant
    // shared across the model / round-one / round-two pools.
    expect(generatedVariantIds).toHaveLength(20);
    expect(new Set(generatedVariantIds).size).toBe(generatedVariantIds.length);
  });

  it("invokes the production selector exactly once per round per lesson (no duplicate selection pass)", () => {
    const { selectorCalls } = runCapturing();
    // Two lessons, two rounds each — never more (the dead duplicate pass is gone).
    expect(selectorCalls).toHaveLength(4);
    const keys = selectorCalls.map((c) => `${c.lessonId}|${c.roundId}`).sort();
    expect(keys).toEqual([
      "fixture-a1-personal-details|fixture-a1-personal-details-round-1",
      "fixture-a1-personal-details|fixture-a1-personal-details-round-2",
      "fixture-a2-routine-plans|fixture-a2-routine-plans-round-1",
      "fixture-a2-routine-plans|fixture-a2-routine-plans-round-2",
    ]);
  });
});

// ---------------------------------------------------------------------------
// Finding 6 — injectable generator boundary (behavioral wrapper test)
// ---------------------------------------------------------------------------

describe("validateFoundations — practice-generation-failed (injected generator)", () => {
  it("surfaces a forced generator Result error as practice-generation-failed and blocks report success", () => {
    const deps: ValidateFoundationsDeps = {
      selectVariants,
      generateExercise: (target): FamilyExerciseResult => ({
        ok: false,
        error: { code: "generation-failed", referenceId: target.variantId, underlyingCode: "missing-example" },
      }),
    };
    const result = validateFoundationsWithDeps(
      { catalogs: foundationCatalogs, foundationCopy, catalogVersion: CATALOG_VERSION, seed: SEED },
      deps,
    );
    expect(result.valid).toBe(false);
    const genErrors = result.errors.filter((e) => e.code === "practice-generation-failed");
    expect(genErrors.length).toBeGreaterThan(0);
    // The wrapper preserves the underlying generator code and reference, never
    // re-deriving them.
    expect(genErrors.every((e) => e.underlyingCode === "missing-example")).toBe(true);
    expect(genErrors.every((e) => e.referenceId !== undefined)).toBe(true);
    // No lesson may report success when its exercises could not be generated.
    expect(result.reports.byLesson[A1].complete).toBe(false);
    expect(result.reports.byLesson[A2].complete).toBe(false);
  });

  it("uses generateFamilyExercise as the production default (no injected deps needed)", () => {
    // The default production path still succeeds end-to-end.
    expect(run().valid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Finding 3 — model family diversity is enforced in stage 3
// ---------------------------------------------------------------------------

describe("validateFoundations — stage 3 family diversity", () => {
  it("insufficient-family-diversity when models collapse to a single family (dimension family)", () => {
    const result = run(withDiversity(A1, { minFamilies: 4 }));
    expectSoleCode(result, "insufficient-family-diversity");
    const err = result.errors.find((e) => e.code === "insufficient-family-diversity")!;
    expect(err.dimension).toBe("family");
    expect(err.expected).toBe(4);
    expect(err.actual).toBe(3);
  });

  it("attributes the family-diversity error to the offending lesson row", () => {
    const a1 = run(withDiversity(A1, { minFamilies: 4 })).reports.byLesson[A1];
    expect(a1.validationErrorCodes).toContain("insufficient-family-diversity");
    expect(a1.complete).toBe(false);
  });

  it("scopes a lesson-level error to only the offending lesson's report row (per-lesson attribution reads solely from allErrors, not a separate per-lesson error store)", () => {
    // Regression guard for the removal of the dead, write-only
    // `lessonErrorMap`: report attribution has always filtered the flat
    // `allErrors` list by `lessonId` (see `buildReports`), so a lesson-3
    // stage error must show up on A1's row and must NOT leak onto A2's,
    // which received no such mutation.
    const result = run(withDiversity(A1, { minFamilies: 4 }));
    expect(result.reports.byLesson[A1].validationErrorCodes).toContain("insufficient-family-diversity");
    expect(result.reports.byLesson[A2].validationErrorCodes).not.toContain("insufficient-family-diversity");
  });
});

// ---------------------------------------------------------------------------
// Finding 2 — same-orthography sense contextual distinction
// ---------------------------------------------------------------------------

describe("senseConflationDimension (pure rule)", () => {
  it("same semantic frame is a frame conflation", () => {
    expect(
      senseConflationDimension(
        { semanticFrameId: "f1", contexts: new Set(["c1"]) },
        { semanticFrameId: "f1", contexts: new Set(["c2"]) },
      ),
    ).toBe("frame");
  });

  it("different frame but identical context set is a context conflation", () => {
    expect(
      senseConflationDimension(
        { semanticFrameId: "f1", contexts: new Set(["c1"]) },
        { semanticFrameId: "f2", contexts: new Set(["c1"]) },
      ),
    ).toBe("context");
  });

  it("an empty practice-context set is a context conflation", () => {
    expect(
      senseConflationDimension(
        { semanticFrameId: "f1", contexts: new Set<string>() },
        { semanticFrameId: "f2", contexts: new Set(["c1"]) },
      ),
    ).toBe("context");
  });

  it("distinct frames with mutually-exclusive nonempty contexts is valid", () => {
    expect(
      senseConflationDimension(
        { semanticFrameId: "f1", contexts: new Set(["c1", "c2"]) },
        { semanticFrameId: "f2", contexts: new Set(["c3", "c4"]) },
      ),
    ).toBeNull();
  });
});

describe("validateFoundations — contextual sense distinction", () => {
  it("conflated-sense-context for two senses sharing lexeme + frame", () => {
    const sense: LearningTargetSense = {
      id: "synthetic-conflated-frame",
      lexemeId: "fixture-a1-lexeme-desu",
      learningUse: "productive",
      semanticFrameId: "fixture-frame-identity",
      predicate: "be",
      argumentRoles: ["topic"],
      argumentParticleByRole: {},
    };
    const cats = withCatalog({ learningTargetSenses: [...foundationCatalogs.learningTargetSenses, sense] });
    const result = run(cats);
    expectSoleCode(result, "conflated-sense-context");
    expect(result.errors[0].dimension).toBe("frame");
  });

  it("conflated-sense-context when a paired sense has an empty practice-context set", () => {
    // Distinct frame from `fixture-a1-sense-be`, but never realized by any
    // variant, so its practice-context set is empty.
    const sense: LearningTargetSense = {
      id: "synthetic-conflated-empty",
      lexemeId: "fixture-a1-lexeme-desu",
      learningUse: "productive",
      semanticFrameId: "fixture-frame-residence",
      predicate: "be",
      argumentRoles: ["topic"],
      argumentParticleByRole: {},
    };
    const cats = withCatalog({ learningTargetSenses: [...foundationCatalogs.learningTargetSenses, sense] });
    const result = run(cats);
    expectSoleCode(result, "conflated-sense-context");
    expect(result.errors[0].dimension).toBe("context");
  });

  it("valid distinct-frame / distinct-context pair sharing a lexeme is accepted", () => {
    // Give `work` the same lexeme as `live`; their frames differ
    // (work-location vs residence) and their realized practice contexts are
    // mutually exclusive (work => workplace; live => first-meeting/class), so
    // the pair is a legitimate same-orthography sense split.
    const cats = withCatalog({
      learningTargetSenses: replaceById(foundationCatalogs.learningTargetSenses, "fixture-a1-sense-work", {
        lexemeId: "fixture-a1-lexeme-sumu",
      }),
    });
    expect(run(cats).valid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Recurrence contexts (VerbUseRecord introductionVariantIds/laterUses) feed
// same-orthography sense conflation, not only depth-lesson model/practice
// pools — this is what lets a purely receptive timeline (never realized by
// any lesson's model/practice pool) still contribute real practice contexts.
// ---------------------------------------------------------------------------

describe("validateFoundations — recurrence contexts feed sense conflation", () => {
  // A productive record shaped exactly like the already-valid
  // `fixture-a1-verb-use-work` fixture (two structurally distinct intro
  // variants + two spaced later uses in a later module), so it independently
  // satisfies every productive-recurrence check on its own. Every referenced
  // variant is "workplace", so its only realized practice context is
  // "workplace" — contributed entirely by the VerbUseRecord, since this
  // sense is never realized by any lesson model/practice pool.
  function workplaceOnlyProductiveRecord(id: string, senseId: string): VerbUseRecord {
    return {
      id,
      senseId,
      learningUse: "productive",
      introductionLessonId: A1,
      introductionVariantIds: ["fixture-a1-omitted-work-company", "fixture-a1-transfer-yuki-work-company"],
      introductionExercise: {
        lessonId: A1,
        roundId: "fixture-a1-personal-details-round-2",
        exerciseKind: "completion",
        targetVariantId: "fixture-a1-transfer-yuki-work-company",
      },
      laterUses: [
        { lessonId: "fixture-a1-lesson-recur-1", variantId: "fixture-a1-recur1-work" },
        { lessonId: "fixture-a1-lesson-recur-2", variantId: "fixture-a1-recur2-work" },
      ],
    };
  }

  function productiveSense(id: string, lexemeId: string, semanticFrameId: string): LearningTargetSense {
    return {
      id,
      lexemeId,
      learningUse: "productive",
      semanticFrameId,
      predicate: "sample",
      argumentRoles: ["topic"],
      argumentParticleByRole: {},
    };
  }

  function receptiveSense(id: string, lexemeId: string, semanticFrameId: string): LearningTargetSense {
    return {
      id,
      lexemeId,
      learningUse: "receptive",
      semanticFrameId,
      predicate: "sample",
      argumentRoles: ["topic"],
      argumentParticleByRole: {},
    };
  }

  it("a receptive-only sense with exclusive verb-record contexts passes conflation against a different-frame productive sense sharing its lexeme", () => {
    // Neither synthetic sense is realized by any lesson's model/practice
    // pool (no semantic value or family/variant references either), so
    // before this fix both practice-context sets would be empty and
    // `senseConflationDimension` would flag every such pairing "context"
    // regardless of the truth. Here the receptive sense's two distinct
    // input contexts (first-meeting, language-class) come solely from its
    // own VerbUseRecord and never overlap the productive sense's
    // exclusively-workplace context.
    const productive = productiveSense(
      "synthetic-sense-recurrence-productive",
      "synthetic-lexeme-recurrence-shared",
      "synthetic-frame-recurrence-productive",
    );
    const receptive = receptiveSense(
      "synthetic-sense-recurrence-receptive",
      "synthetic-lexeme-recurrence-shared",
      "synthetic-frame-recurrence-receptive",
    );
    const productiveRecord = workplaceOnlyProductiveRecord("synthetic-verb-use-recurrence-productive", productive.id);
    const receptiveRecord: VerbUseRecord = {
      id: "synthetic-verb-use-recurrence-receptive",
      senseId: receptive.id,
      learningUse: "receptive",
      introductionLessonId: A1,
      introductionVariantIds: ["fixture-a1-yuki-student-meeting", "fixture-a1-recur2-study"],
      introductionExercise: {
        lessonId: A1,
        roundId: "fixture-a1-personal-details-round-1",
        exerciseKind: "choice",
        targetVariantId: "fixture-a1-yuki-student-meeting",
      },
      laterUses: [],
    };
    const cats = withCatalog({
      learningTargetSenses: [...foundationCatalogs.learningTargetSenses, productive, receptive],
      verbUseRecords: [...foundationCatalogs.verbUseRecords, productiveRecord, receptiveRecord],
    });
    const result = run(cats);
    expect(result.errors.map((e) => e.code)).not.toContain("conflated-sense-context");
    expect(result.valid).toBe(true);
  });

  it("a receptive-only sense whose verb-record contexts fully overlap a different-frame productive sense's fails conflation (dimension context)", () => {
    // Same shape as the passing case above, but the receptive sense's two
    // input contexts (workplace, language-class) are exactly the productive
    // sense's realized context set — no exclusive context on either side —
    // so the pair is correctly rejected as conflated on context, not frame.
    const productive = productiveSense(
      "synthetic-sense-overlap-productive",
      "synthetic-lexeme-overlap-shared",
      "synthetic-frame-overlap-productive",
    );
    const receptive = receptiveSense(
      "synthetic-sense-overlap-receptive",
      "synthetic-lexeme-overlap-shared",
      "synthetic-frame-overlap-receptive",
    );
    const productiveRecord: VerbUseRecord = {
      id: "synthetic-verb-use-overlap-productive",
      senseId: productive.id,
      learningUse: "productive",
      introductionLessonId: A1,
      introductionVariantIds: ["fixture-a1-omitted-work-company", "fixture-a1-transfer-omitted-study-english"],
      introductionExercise: {
        lessonId: A1,
        roundId: "fixture-a1-personal-details-round-2",
        exerciseKind: "completion",
        targetVariantId: "fixture-a1-omitted-work-company",
      },
      laterUses: [
        { lessonId: "fixture-a1-lesson-recur-1", variantId: "fixture-a1-recur1-work" },
        { lessonId: "fixture-a1-lesson-recur-2", variantId: "fixture-a1-recur2-work" },
      ],
    };
    const receptiveRecord: VerbUseRecord = {
      id: "synthetic-verb-use-overlap-receptive",
      senseId: receptive.id,
      learningUse: "receptive",
      introductionLessonId: A1,
      introductionVariantIds: ["fixture-a1-omitted-work-company", "fixture-a1-recur2-study"],
      introductionExercise: {
        lessonId: A1,
        roundId: "fixture-a1-personal-details-round-1",
        exerciseKind: "choice",
        targetVariantId: "fixture-a1-omitted-work-company",
      },
      laterUses: [],
    };
    const cats = withCatalog({
      learningTargetSenses: [...foundationCatalogs.learningTargetSenses, productive, receptive],
      verbUseRecords: [...foundationCatalogs.verbUseRecords, productiveRecord, receptiveRecord],
    });
    const result = run(cats);
    expectSoleCode(result, "conflated-sense-context");
    expect(result.errors[0].dimension).toBe("context");
  });

  it("recurrence-context merge is order-independent and dedups repeated contexts", () => {
    // The productive record repeats the "workplace" context four times
    // (both intro variants plus both later uses); the merge must collapse
    // that to a single context regardless of array order for it to remain
    // exclusive of the receptive sense's two contexts.
    const productive = productiveSense(
      "synthetic-sense-order-productive",
      "synthetic-lexeme-order-shared",
      "synthetic-frame-order-productive",
    );
    const receptive = receptiveSense(
      "synthetic-sense-order-receptive",
      "synthetic-lexeme-order-shared",
      "synthetic-frame-order-receptive",
    );
    const productiveRecord = workplaceOnlyProductiveRecord("synthetic-verb-use-order-productive", productive.id);
    const receptiveRecord: VerbUseRecord = {
      id: "synthetic-verb-use-order-receptive",
      senseId: receptive.id,
      learningUse: "receptive",
      introductionLessonId: A1,
      introductionVariantIds: ["fixture-a1-yuki-student-meeting", "fixture-a1-recur2-study"],
      introductionExercise: {
        lessonId: A1,
        roundId: "fixture-a1-personal-details-round-1",
        exerciseKind: "choice",
        targetVariantId: "fixture-a1-yuki-student-meeting",
      },
      laterUses: [],
    };

    const forward = withCatalog({
      learningTargetSenses: [...foundationCatalogs.learningTargetSenses, productive, receptive],
      verbUseRecords: [...foundationCatalogs.verbUseRecords, productiveRecord, receptiveRecord],
    });
    // Same entities, reversed insertion order on every affected array.
    const reversed = withCatalog({
      learningTargetSenses: [receptive, productive, ...foundationCatalogs.learningTargetSenses],
      verbUseRecords: [receptiveRecord, productiveRecord, ...foundationCatalogs.verbUseRecords],
    });

    const forwardResult = run(forward);
    const reversedResult = run(reversed);

    expect(forwardResult.valid).toBe(true);
    expect(forwardResult.errors.map((e) => e.code)).not.toContain("conflated-sense-context");
    expect(reversedResult.errors).toEqual(forwardResult.errors);
    expect(reversedResult.valid).toBe(true);
  });

  it("a verb-use record referencing a missing variant still fails validation, gated at stage 1 before recurrence contexts are merged", () => {
    const bogusRecord: VerbUseRecord = {
      id: "synthetic-verb-use-bogus-variant",
      senseId: "fixture-a1-sense-be",
      learningUse: "receptive",
      introductionLessonId: A1,
      introductionVariantIds: ["bogus-variant-id"],
      introductionExercise: {
        lessonId: A1,
        roundId: "fixture-a1-personal-details-round-1",
        exerciseKind: "choice",
        targetVariantId: "bogus-variant-id",
      },
      laterUses: [],
    };
    const cats = withCatalog({ verbUseRecords: [...foundationCatalogs.verbUseRecords, bogusRecord] });
    expectSoleCode(run(cats), "missing-variant-reference");
  });
});

// ---------------------------------------------------------------------------
// Finding 5 — receptive diagnostics distinguish input-count from context
// ---------------------------------------------------------------------------

describe("validateFoundations — receptive diagnostics dimension", () => {
  it("reports dimension input-count when fewer than two input instances exist", () => {
    const record: VerbUseRecord = {
      id: "synthetic-receptive-onecount",
      senseId: "fixture-a1-sense-be",
      learningUse: "receptive",
      introductionLessonId: A1,
      introductionVariantIds: ["fixture-a1-yuki-student-meeting"],
      introductionExercise: {
        lessonId: A1,
        roundId: "fixture-a1-personal-details-round-1",
        exerciseKind: "choice",
        targetVariantId: "fixture-a1-yuki-student-meeting",
      },
      laterUses: [],
    };
    const cats = withCatalog({ verbUseRecords: [...foundationCatalogs.verbUseRecords, record] });
    const result = run(cats);
    expectSoleCode(result, "receptive-use-insufficient-input");
    expect(result.errors[0].dimension).toBe("input-count");
    expect(result.errors[0].actual).toBe(1);
  });

  it("reports dimension context (expected 2, actual 1) when three inputs share a single context", () => {
    const record: VerbUseRecord = {
      id: "synthetic-receptive-onecontext",
      senseId: "fixture-a1-sense-be",
      learningUse: "receptive",
      introductionLessonId: A1,
      // Three copular inputs that all share the "first-meeting" context.
      introductionVariantIds: [
        "fixture-a1-yuki-student-meeting",
        "fixture-a1-ken-doctor-meeting",
        "fixture-a1-yuki-live-rome",
      ],
      introductionExercise: {
        lessonId: A1,
        roundId: "fixture-a1-personal-details-round-1",
        exerciseKind: "choice",
        targetVariantId: "fixture-a1-yuki-student-meeting",
      },
      laterUses: [],
    };
    const cats = withCatalog({ verbUseRecords: [...foundationCatalogs.verbUseRecords, record] });
    const result = run(cats);
    expectSoleCode(result, "receptive-use-insufficient-input");
    expect(result.errors[0].dimension).toBe("context");
    expect(result.errors[0].expected).toBe(2);
    expect(result.errors[0].actual).toBe(1);
  });
});
