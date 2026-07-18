/**
 * `instructionalLessonKit` — shared, level-agnostic instructional lesson
 * assembly (Phase 3 Task 4).
 *
 * Extracted from the proven A1 builder (`a1/catalog/a1LessonBuilders.ts`):
 * compact line spec → variant/copy, speaker/addressee defaults, the
 * model+transfer assembly, two practice rounds, diversity constraints,
 * recipe construction, and the foundation-catalog lesson/position helpers.
 * The kit imports nothing from `a1/` or `a2/` — every level-specific choice
 * (roles, referent mapping, round kinds, selection policy, scenario copy,
 * variant builder, `defineLesson`) is supplied through a typed config, so
 * this suite exercises the kit with a small, self-contained fake level
 * (never A1/A2 catalogs) to prove it is genuinely level-agnostic.
 */
import { describe, expect, it } from "vitest";

import {
  buildInstructionalLesson,
  buildLessonPositionRecords,
  defaultSpeakerRoleId,
  KIT_AFFIRMATIVE_PRESENT_POLITE,
  KIT_AFFIRMATIVE_PRESENT_POLITE_QUESTION,
  scenarioCopyId,
  structureKey,
  toFoundationLessonDefinition,
  verbUseRecord,
  withLaterUses,
  type InstructionalLessonKitConfig,
  type KitBuiltVariant,
  type KitLessonRecipeCandidate,
  type KitLineSpec,
  type KitResolvedVariantSpec,
} from "./instructionalLessonKit";
import type { SentenceVariant, VerbLaterUse } from "./types";
import { deepFreeze } from "./deepFreeze";

// ---------------------------------------------------------------------------
// A minimal fake "level" config — deliberately NOT a1/a2 data, to prove the
// kit has no upward dependency on either level's catalogs.
// ---------------------------------------------------------------------------

interface FakeRecipe extends KitLessonRecipeCandidate {
  readonly frozenMarker: true;
}

function fakeDefineLesson(candidate: KitLessonRecipeCandidate): FakeRecipe {
  return deepFreeze({ ...candidate, frozenMarker: true });
}

function fakeBuildVariant(spec: KitResolvedVariantSpec): KitBuiltVariant {
  const variant: SentenceVariant = deepFreeze({
    id: spec.id,
    sentenceFamilyId: spec.family,
    discourse: {
      speakerRoleId: spec.speakerRole,
      addresseeRoleId: spec.addresseeRole,
      subjectReferentId: spec.subjectReferent,
      subjectRealization: spec.subjectRealization,
      scenarioNoteCopyId: scenarioCopyId(spec.id),
    },
    contextId: spec.context,
    slotValues: { ...spec.slots },
    form: spec.form,
    pedagogicalUse: spec.use,
  });
  return {
    variant,
    en: { [`${spec.id}-translation`]: spec.translation.en, [`${spec.id}-scenario`]: spec.scenario.en },
    it: { [`${spec.id}-translation`]: spec.translation.it, [`${spec.id}-scenario`]: spec.scenario.it },
  };
}

const FAKE_SCENARIOS: Readonly<Record<string, { en: string; it: string }>> = {
  "fake-context-a": { en: "Context A scenario.", it: "Scenario contesto A." },
  "fake-context-b": { en: "Context B scenario.", it: "Scenario contesto B." },
};

function fakeScenarioCopy(contextId: string): { en: string; it: string } {
  const s = FAKE_SCENARIOS[contextId];
  if (!s) throw new Error(`no fake scenario for ${contextId}`);
  return s;
}

const FAKE_CONFIG: InstructionalLessonKitConfig<FakeRecipe> = {
  defaultSpeakerRoleId: "fake-role-learner",
  defaultAddresseeRoleId: "fake-role-teacher",
  referentPersonRoleById: { "fake-referent-alex": "fake-role-alex" },
  voiceableReferentIds: new Set(["fake-referent-alex"]),
  scenarioCopy: fakeScenarioCopy,
  buildVariant: fakeBuildVariant,
  modelCountRange: [8, 12],
  exerciseCountRange: [8, 12],
  roundTargetCount: 5,
  roundOneExerciseKinds: ["tile-ordering", "choice", "completion"],
  roundTwoExerciseKinds: ["constrained-construction", "completion", "tile-ordering"],
  selectionPolicyId: "fake-selection-default",
  defineLesson: fakeDefineLesson,
};

function line(id: string, overrides: Partial<KitLineSpec> = {}): KitLineSpec {
  return {
    id,
    family: "fake-family-one",
    context: "fake-context-a",
    subjectReferent: null,
    subjectRealization: "omitted",
    slots: { object: "fake-value-thing" },
    translation: { en: `EN ${id}`, it: `IT ${id}` },
    ...overrides,
  };
}

function eightModels(prefix: string): KitLineSpec[] {
  return Array.from({ length: 8 }, (_, i) => line(`${prefix}-m${i + 1}`));
}
function fiveTransfers(prefix: string): KitLineSpec[] {
  return Array.from({ length: 5 }, (_, i) => line(`${prefix}-t${i + 1}`));
}

// ---------------------------------------------------------------------------
// Copy-id conventions
// ---------------------------------------------------------------------------

describe("copy id conventions", () => {
  it("scenarioCopyId follows the `${variantId}-scenario` convention", () => {
    expect(scenarioCopyId("cc1-m1")).toBe("cc1-m1-scenario");
  });
});

// ---------------------------------------------------------------------------
// structureKey
// ---------------------------------------------------------------------------

describe("structureKey", () => {
  it("combines family, subject realization, form, and sorted slot keys", () => {
    const variant: SentenceVariant = {
      id: "v1",
      sentenceFamilyId: "fam-a",
      discourse: {
        speakerRoleId: "role-x",
        addresseeRoleId: null,
        subjectReferentId: null,
        subjectRealization: "explicit",
        scenarioNoteCopyId: "v1-scenario",
      },
      contextId: "ctx-a",
      slotValues: { object: "v-1", subject: "v-2" },
      form: { polarity: "affirmative", tense: "present", formality: "polite" },
      pedagogicalUse: "model",
    };
    expect(structureKey(variant)).toBe("fam-a|explicit|affirmative:present:polite|object,subject");
  });

  it("ignores person/context/value ids — two variants differing only in those share one key", () => {
    const base = {
      sentenceFamilyId: "fam-a",
      contextId: "ctx-a",
      slotValues: { object: "v-1" },
      form: { polarity: "affirmative", tense: "present", formality: "polite" } as const,
      pedagogicalUse: "model" as const,
    };
    const v1: SentenceVariant = {
      ...base,
      id: "v1",
      discourse: {
        speakerRoleId: "role-x",
        addresseeRoleId: null,
        subjectReferentId: "ref-a",
        subjectRealization: "explicit",
        scenarioNoteCopyId: "v1-scenario",
      },
    };
    const v2: SentenceVariant = {
      ...base,
      id: "v2",
      contextId: "ctx-b",
      slotValues: { object: "v-9" },
      discourse: {
        speakerRoleId: "role-y",
        addresseeRoleId: "role-z",
        subjectReferentId: "ref-b",
        subjectRealization: "explicit",
        scenarioNoteCopyId: "v2-scenario",
      },
    };
    expect(structureKey(v1)).toBe(structureKey(v2));
  });
});

// ---------------------------------------------------------------------------
// defaultSpeakerRoleId
// ---------------------------------------------------------------------------

describe("defaultSpeakerRoleId", () => {
  it("uses an explicit speakerRole override when provided", () => {
    const spec = line("x", { speakerRole: "fake-role-explicit" });
    expect(defaultSpeakerRoleId(spec, FAKE_CONFIG)).toBe("fake-role-explicit");
  });

  it("uses the subject referent's own role when the referent is voiceable", () => {
    const spec = line("x", { subjectReferent: "fake-referent-alex", subjectRealization: "explicit" });
    expect(defaultSpeakerRoleId(spec, FAKE_CONFIG)).toBe("fake-role-alex");
  });

  it("falls back to the configured default learner role for a non-voiceable subject", () => {
    const spec = line("x", { subjectReferent: "fake-referent-unlisted", subjectRealization: "explicit" });
    expect(defaultSpeakerRoleId(spec, FAKE_CONFIG)).toBe("fake-role-learner");
  });

  it("falls back to the configured default learner role when the subject is null", () => {
    const spec = line("x", { subjectReferent: null });
    expect(defaultSpeakerRoleId(spec, FAKE_CONFIG)).toBe("fake-role-learner");
  });
});

// ---------------------------------------------------------------------------
// buildInstructionalLesson — full assembly
// ---------------------------------------------------------------------------

describe("buildInstructionalLesson", () => {
  const built = buildInstructionalLesson(FAKE_CONFIG, {
    id: "fake-lesson-1",
    moduleId: "fake-module",
    order: 1,
    primaryCanDoId: "fake-can-do-one",
    supportingCanDoIds: ["fake-can-do-two"],
    introducedConceptIds: ["fake-concept-one"],
    introducedSenseIds: ["fake-sense-one"],
    models: eightModels("fake-lesson-1"),
    transfers: fiveTransfers("fake-lesson-1"),
  });

  it("builds exactly 8 model + 5 transfer variants with the right pedagogicalUse", () => {
    const models = built.variants.filter((v) => v.pedagogicalUse === "model");
    const transfers = built.variants.filter((v) => v.pedagogicalUse === "transfer");
    expect(models).toHaveLength(8);
    expect(transfers).toHaveLength(5);
  });

  it("derives guidedVariantIds from the first two model ids and spokenVariantId from the first", () => {
    expect(built.recipe.guidedVariantIds).toEqual(["fake-lesson-1-m1", "fake-lesson-1-m2"]);
    expect(built.recipe.spokenVariantId).toBe("fake-lesson-1-m1");
  });

  it("builds two practice rounds from the config's exercise kinds/target count", () => {
    expect(built.recipe.practice.roundOne).toMatchObject({
      id: "fake-lesson-1-round-1",
      purpose: "guided-controlled",
      candidateVariantIds: eightModels("fake-lesson-1").map((m) => m.id),
      selectionPolicyId: "fake-selection-default",
      exerciseKinds: ["tile-ordering", "choice", "completion"],
      targetCount: 5,
    });
    expect(built.recipe.practice.roundTwo).toMatchObject({
      id: "fake-lesson-1-round-2",
      purpose: "transfer",
      candidateVariantIds: fiveTransfers("fake-lesson-1").map((t) => t.id),
      selectionPolicyId: "fake-selection-default",
      exerciseKinds: ["constrained-construction", "completion", "tile-ordering"],
      targetCount: 5,
    });
  });

  it("derives minFamilies from the distinct model families and applies the config's fixed floors", () => {
    expect(built.recipe.diversityConstraints).toEqual({
      modelCountRange: [8, 12],
      exerciseCountRange: [8, 12],
      minFamilies: 1,
      minPredicates: 3,
      minRoles: 3,
      minContexts: 2,
      minUniqueTargets: 5,
      maxTargetReuse: 2,
      minTransferExercises: 5,
      requireControlledConstruction: true,
    });
  });

  it("passes the level's own defineLesson the exact candidate shape and returns its result as `recipe`", () => {
    expect(built.recipe.frozenMarker).toBe(true);
    expect(built.recipe.id).toBe("fake-lesson-1");
    expect(built.recipe.moduleId).toBe("fake-module");
    expect(built.recipe.contract).toBe("instructional");
    expect(built.recipe.primaryCanDoId).toBe("fake-can-do-one");
    expect(built.recipe.supportingCanDoIds).toEqual(["fake-can-do-two"]);
    expect(built.recipe.introducedConceptIds).toEqual(["fake-concept-one"]);
    expect(built.recipe.introducedSenseIds).toEqual(["fake-sense-one"]);
    expect(Object.isFrozen(built.recipe)).toBe(true);
  });

  it("respects an explicit synthesis contract", () => {
    const synthesis = buildInstructionalLesson(FAKE_CONFIG, {
      id: "fake-lesson-2",
      moduleId: "fake-module",
      order: 2,
      contract: "synthesis",
      primaryCanDoId: "fake-can-do-one",
      supportingCanDoIds: [],
      introducedConceptIds: [],
      introducedSenseIds: [],
      models: eightModels("fake-lesson-2"),
      transfers: fiveTransfers("fake-lesson-2"),
    });
    expect(synthesis.recipe.contract).toBe("synthesis");
  });

  it("merges every model+transfer's EN/IT translation and scenario copy", () => {
    expect(built.en["fake-lesson-1-m1-translation"]).toBe("EN fake-lesson-1-m1");
    expect(built.it["fake-lesson-1-m1-translation"]).toBe("IT fake-lesson-1-m1");
    expect(built.en["fake-lesson-1-m1-scenario"]).toBe("Context A scenario.");
    expect(built.en["fake-lesson-1-t5-translation"]).toBe("EN fake-lesson-1-t5");
  });

  it("defaults the speaker to the learner and the addressee to the config default when unspecified", () => {
    const model1 = built.variants.find((v) => v.id === "fake-lesson-1-m1");
    expect(model1?.discourse.speakerRoleId).toBe("fake-role-learner");
    expect(model1?.discourse.addresseeRoleId).toBe("fake-role-teacher");
  });

  it("honors an explicit addresseeRole override, including null", () => {
    const withOverride = buildInstructionalLesson(FAKE_CONFIG, {
      id: "fake-lesson-3",
      moduleId: "fake-module",
      order: 1,
      primaryCanDoId: "fake-can-do-one",
      supportingCanDoIds: [],
      introducedConceptIds: [],
      introducedSenseIds: [],
      models: [
        line("fake-lesson-3-m1", { addresseeRole: null }),
        ...eightModels("fake-lesson-3").slice(1),
      ],
      transfers: fiveTransfers("fake-lesson-3"),
    });
    const m1 = withOverride.variants.find((v) => v.id === "fake-lesson-3-m1");
    expect(m1?.discourse.addresseeRoleId).toBeNull();
  });

  it("defaults the form to affirmative-present-polite, or its question form when interrogative:true", () => {
    const withQuestion = buildInstructionalLesson(FAKE_CONFIG, {
      id: "fake-lesson-4",
      moduleId: "fake-module",
      order: 1,
      primaryCanDoId: "fake-can-do-one",
      supportingCanDoIds: [],
      introducedConceptIds: [],
      introducedSenseIds: [],
      models: [
        line("fake-lesson-4-m1", { interrogative: true }),
        ...eightModels("fake-lesson-4").slice(1),
      ],
      transfers: fiveTransfers("fake-lesson-4"),
    });
    const plain = withQuestion.variants.find((v) => v.id === "fake-lesson-4-m2");
    const question = withQuestion.variants.find((v) => v.id === "fake-lesson-4-m1");
    expect(plain?.form).toEqual(KIT_AFFIRMATIVE_PRESENT_POLITE);
    expect(question?.form).toEqual(KIT_AFFIRMATIVE_PRESENT_POLITE_QUESTION);
  });

  it("throws when a line spec supplies both an explicit form and interrogative:true", () => {
    expect(() =>
      buildInstructionalLesson(FAKE_CONFIG, {
        id: "fake-lesson-5",
        moduleId: "fake-module",
        order: 1,
        primaryCanDoId: "fake-can-do-one",
        supportingCanDoIds: [],
        introducedConceptIds: [],
        introducedSenseIds: [],
        models: [
          line("fake-lesson-5-m1", {
            interrogative: true,
            form: { polarity: "negative", tense: "past", formality: "polite" },
          }),
          ...eightModels("fake-lesson-5").slice(1),
        ],
        transfers: fiveTransfers("fake-lesson-5"),
      }),
    ).toThrow();
  });
});

// ---------------------------------------------------------------------------
// toFoundationLessonDefinition / buildLessonPositionRecords
// ---------------------------------------------------------------------------

describe("toFoundationLessonDefinition", () => {
  it("derives familyIds from the model variants' families, deduplicated, in first-seen order", () => {
    const built = buildInstructionalLesson(FAKE_CONFIG, {
      id: "fake-lesson-6",
      moduleId: "fake-module",
      order: 1,
      primaryCanDoId: "fake-can-do-one",
      supportingCanDoIds: [],
      introducedConceptIds: [],
      introducedSenseIds: [],
      models: [
        line("fake-lesson-6-m1", { family: "fam-a" }),
        line("fake-lesson-6-m2", { family: "fam-b" }),
        line("fake-lesson-6-m3", { family: "fam-a" }),
        ...eightModels("fake-lesson-6").slice(3),
      ],
      transfers: fiveTransfers("fake-lesson-6"),
    });
    const variantById = new Map(built.variants.map((v) => [v.id, v]));
    const def = toFoundationLessonDefinition(built.recipe, "a2", variantById);
    expect(def.familyIds).toEqual(["fam-a", "fam-b", "fake-family-one"]);
    expect(def.level).toBe("a2");
    expect(def.id).toBe("fake-lesson-6");
    expect(def.modelVariantIds).toEqual(built.recipe.modelVariantIds);
  });
});

describe("buildLessonPositionRecords", () => {
  it("maps each recipe to its canonical position, defaulting missing entries to 0", () => {
    const records = buildLessonPositionRecords(
      [
        { id: "lesson-a", moduleId: "mod-1" },
        { id: "lesson-b", moduleId: "mod-1" },
        { id: "lesson-unknown", moduleId: "mod-2" },
      ],
      "a2",
      { "lesson-a": 1, "lesson-b": 2 },
    );
    expect(records).toEqual([
      { lessonId: "lesson-a", level: "a2", moduleId: "mod-1", position: 1 },
      { lessonId: "lesson-b", level: "a2", moduleId: "mod-1", position: 2 },
      { lessonId: "lesson-unknown", level: "a2", moduleId: "mod-2", position: 0 },
    ]);
  });
});

// ---------------------------------------------------------------------------
// verbUseRecord / withLaterUses — the generic, level-agnostic verb-use-record
// builders (Phase 3 Task 4 spec-fix). Extracted from A1's own
// `a1VerbUseRecord`/`withA1LaterUses` (which now delegate here with an
// identical, byte-for-byte-unchanged signature/output); A2 gets its own
// `a2VerbUseRecord`/`withA2LaterUses` wrappers over these same two functions.
// ---------------------------------------------------------------------------

describe("verbUseRecord", () => {
  const baseInput = {
    senseId: "fake-sense-greet",
    introductionLessonId: "fake-lesson-1",
    introductionVariantIds: ["fake-lesson-1-m1", "fake-lesson-1-m2"],
    exerciseRoundId: "fake-lesson-1-round-1",
    exerciseKind: "tile-ordering" as const,
    exerciseTargetVariantId: "fake-lesson-1-m1",
  };

  it("prefixes the record id with the given level (a1)", () => {
    const record = verbUseRecord("a1", baseInput);
    expect(record.id).toBe("a1-verb-use-fake-sense-greet");
  });

  it("prefixes the record id with the given level (a2)", () => {
    const record = verbUseRecord("a2", baseInput);
    expect(record.id).toBe("a2-verb-use-fake-sense-greet");
  });

  it("copies every input field onto the record and always starts with an empty laterUses", () => {
    const record = verbUseRecord("a1", baseInput);
    expect(record.senseId).toBe("fake-sense-greet");
    expect(record.learningUse).toBe("productive");
    expect(record.introductionLessonId).toBe("fake-lesson-1");
    expect(record.introductionVariantIds).toEqual(["fake-lesson-1-m1", "fake-lesson-1-m2"]);
    expect(record.introductionExercise).toEqual({
      lessonId: "fake-lesson-1",
      roundId: "fake-lesson-1-round-1",
      exerciseKind: "tile-ordering",
      targetVariantId: "fake-lesson-1-m1",
    });
    expect(record.laterUses).toEqual([]);
  });

  it("returns a deeply frozen record", () => {
    const record = verbUseRecord("a1", baseInput);
    expect(Object.isFrozen(record)).toBe(true);
    expect(Object.isFrozen(record.introductionVariantIds)).toBe(true);
    expect(Object.isFrozen(record.introductionExercise)).toBe(true);
    expect(Object.isFrozen(record.laterUses)).toBe(true);
  });

  it("copies the introductionVariantIds array rather than aliasing the caller's own array", () => {
    const mutableIds = ["fake-lesson-1-m1", "fake-lesson-1-m2"];
    const record = verbUseRecord("a1", { ...baseInput, introductionVariantIds: mutableIds });
    mutableIds.push("fake-lesson-1-m3");
    expect(record.introductionVariantIds).toEqual(["fake-lesson-1-m1", "fake-lesson-1-m2"]);
  });
});

describe("withLaterUses", () => {
  const baseInput = {
    senseId: "fake-sense-greet",
    introductionLessonId: "fake-lesson-1",
    introductionVariantIds: ["fake-lesson-1-m1", "fake-lesson-1-m2"],
    exerciseRoundId: "fake-lesson-1-round-1",
    exerciseKind: "tile-ordering" as const,
    exerciseTargetVariantId: "fake-lesson-1-m1",
  };

  it("appends the given later uses to the record's laterUses", () => {
    const record = verbUseRecord("a1", baseInput);
    const additions: readonly VerbLaterUse[] = [
      { lessonId: "fake-lesson-5", variantId: "fake-lesson-5-m3" },
      { lessonId: "fake-lesson-7", variantId: "fake-lesson-7-m1" },
    ];
    const augmented = withLaterUses(record, additions);
    expect(augmented.laterUses).toEqual(additions);
  });

  it("returns a NEW frozen record without mutating the original (still laterUses: [])", () => {
    const record = verbUseRecord("a1", baseInput);
    const augmented = withLaterUses(record, [
      { lessonId: "fake-lesson-5", variantId: "fake-lesson-5-m3" },
    ]);
    expect(augmented).not.toBe(record);
    expect(record.laterUses).toEqual([]);
    expect(Object.isFrozen(augmented)).toBe(true);
    expect(Object.isFrozen(augmented.laterUses)).toBe(true);
  });

  it("preserves every other field unchanged", () => {
    const record = verbUseRecord("a2", baseInput);
    const augmented = withLaterUses(record, [
      { lessonId: "fake-lesson-5", variantId: "fake-lesson-5-m3" },
    ]);
    expect(augmented.id).toBe(record.id);
    expect(augmented.senseId).toBe(record.senseId);
    expect(augmented.learningUse).toBe(record.learningUse);
    expect(augmented.introductionLessonId).toBe(record.introductionLessonId);
    expect(augmented.introductionVariantIds).toEqual(record.introductionVariantIds);
    expect(augmented.introductionExercise).toEqual(record.introductionExercise);
  });

  it("copies each addition object rather than aliasing the caller's own objects", () => {
    const record = verbUseRecord("a1", baseInput);
    const mutableAddition = { lessonId: "fake-lesson-5", variantId: "fake-lesson-5-m3" };
    const augmented = withLaterUses(record, [mutableAddition]);
    mutableAddition.variantId = "mutated-after-the-fact";
    expect(augmented.laterUses).toEqual([
      { lessonId: "fake-lesson-5", variantId: "fake-lesson-5-m3" },
    ]);
  });

  it("is a no-op copy (still a fresh frozen record) when additions is empty", () => {
    const record = verbUseRecord("a1", baseInput);
    const augmented = withLaterUses(record, []);
    expect(augmented).not.toBe(record);
    expect(augmented.laterUses).toEqual([]);
    expect(Object.isFrozen(augmented)).toBe(true);
  });

  it("supports chaining multiple withLaterUses calls, accumulating rather than replacing", () => {
    const record = verbUseRecord("a1", baseInput);
    const once = withLaterUses(record, [{ lessonId: "fake-lesson-5", variantId: "fake-lesson-5-m3" }]);
    const twice = withLaterUses(once, [{ lessonId: "fake-lesson-9", variantId: "fake-lesson-9-m2" }]);
    expect(twice.laterUses).toEqual([
      { lessonId: "fake-lesson-5", variantId: "fake-lesson-5-m3" },
      { lessonId: "fake-lesson-9", variantId: "fake-lesson-9-m2" },
    ]);
  });
});
