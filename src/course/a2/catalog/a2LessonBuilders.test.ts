/**
 * `a2LessonBuilders.ts` tests (Phase 3 Task 4).
 *
 * Proves: `buildA2InstructionalLesson` delegates to the shared
 * `instructionalLessonKit` with A2's own 8-12 model/exercise range and
 * automatically wires `kanjiExposureIds` from the real
 * `A2_KANJI_EXPOSURES` schedule (never hand-invented); `defineA2Lesson`
 * enforces the A2 depth contract; `assembleA2FoundationCatalogs` builds a
 * real `FoundationCatalogs`; `computeAvailableContentByLesson` derives
 * cumulative introduced content in canonical position order;
 * `a2VerbUseRecord`/`withA2LaterUses` delegate to the shared kit's
 * level-agnostic `verbUseRecord`/`withLaterUses` (mirrors A1's
 * `a1VerbUseRecord`/`withA1LaterUses`).
 */
import { describe, expect, it } from "vitest";

import {
  a2KanjiExposureIdsForLesson,
  a2SubjectReferentValueId,
  a2VerbUseRecord,
  a2Variant,
  assembleA2FoundationCatalogs,
  buildA2InstructionalLesson,
  computeAvailableContentByLesson,
  defineA2Lesson,
  withA2LaterUses,
  type A2BuiltLesson,
} from "./a2LessonBuilders";
import { A2_KANJI_EXPOSURES } from "../kanji/a2KanjiCatalog";
import { a2Referents, a2SemanticValues } from "./a2SemanticCatalog";

describe("a2KanjiExposureIdsForLesson", () => {
  it("returns every real exposure id scheduled at connected-conversation-1 (first-supported 話言聞友)", () => {
    const ids = a2KanjiExposureIdsForLesson("connected-conversation-1");
    expect(ids.length).toBe(4);
    for (const id of ids) {
      expect(A2_KANJI_EXPOSURES.some((e) => e.id === id)).toBe(true);
    }
    // Every returned id must actually be scheduled at this lesson.
    for (const id of ids) {
      const exposure = A2_KANJI_EXPOSURES.find((e) => e.id === id);
      expect(exposure?.lessonId).toBe("connected-conversation-1");
    }
  });

  it("returns 8 exposures at connected-conversation-2 (4 supported-retrieval + 4 first-supported)", () => {
    const ids = a2KanjiExposureIdsForLesson("connected-conversation-2");
    expect(ids.length).toBe(8);
  });

  it("returns an empty array for a lesson id with no scheduled exposures", () => {
    expect(a2KanjiExposureIdsForLesson("no-such-lesson")).toEqual([]);
  });
});

describe("a2Variant — form vs. interrogative mutual-exclusion contract (mirrors a1Variant)", () => {
  const baseSpec = {
    id: "a2-variant-fixture",
    family: "a2-family-talk-companion",
    context: "a2-context-conversation",
    speakerRole: "a2-role-learner",
    addresseeRole: "a2-role-teacher",
    subjectReferent: null,
    subjectRealization: "omitted" as const,
    slots: { subject: "a2-value-friend-subject", predicate: "a2-value-hanasu", companion: "a2-value-companion-colleague" },
    use: "model" as const,
    translation: { en: "Talk with a colleague.", it: "Parla con un collega." },
    scenario: { en: "At work.", it: "Al lavoro." },
  };

  it("throws when both an explicit form and interrogative:true are supplied", () => {
    expect(() =>
      a2Variant({
        ...baseSpec,
        form: { polarity: "affirmative", tense: "past", formality: "polite" },
        interrogative: true,
      }),
    ).toThrow();
  });

  it("succeeds with only interrogative:true", () => {
    const built = a2Variant({ ...baseSpec, interrogative: true });
    expect(built.variant.form.interrogative).toBe(true);
  });

  it("succeeds with neither form nor interrogative (default present-polite-affirmative)", () => {
    const built = a2Variant({ ...baseSpec });
    expect(built.variant.form.interrogative).not.toBe(true);
  });
});

describe("buildA2InstructionalLesson", () => {
  const built: A2BuiltLesson = buildA2InstructionalLesson({
    id: "connected-conversation-1",
    moduleId: "connected-conversation",
    order: 1,
    primaryCanDoId: "a2-cando-backchannel-followup",
    supportingCanDoIds: [],
    introducedConceptIds: [],
    introducedSenseIds: ["a2-sense-hanasu"],
    models: Array.from({ length: 8 }, (_, i) =>
      a2LineFixture(`connected-conversation-1-m${i + 1}`),
    ),
    transfers: Array.from({ length: 5 }, (_, i) =>
      a2LineFixture(`connected-conversation-1-t${i + 1}`),
    ),
  });

  function a2LineFixture(id: string) {
    return {
      id,
      family: "a2-family-talk-companion",
      context: "a2-context-conversation",
      subjectReferent: "a2-referent-friend",
      subjectRealization: "explicit" as const,
      slots: { subject: "a2-value-friend-subject", predicate: "a2-value-hanasu", companion: "a2-value-companion-colleague" },
      translation: { en: `EN ${id}`, it: `IT ${id}` },
    };
  }

  it("builds a recipe honoring the 8-12 model/exercise range and wires real kanjiExposureIds", () => {
    expect(built.recipe.modelVariantIds).toHaveLength(8);
    expect(built.recipe.practice.roundOne.targetCount + built.recipe.practice.roundTwo.targetCount).toBe(10);
    expect(built.recipe.kanjiExposureIds).toEqual(a2KanjiExposureIdsForLesson("connected-conversation-1"));
    expect(built.recipe.kanjiExposureIds.length).toBeGreaterThan(0);
  });

  it("freezes the returned recipe", () => {
    expect(Object.isFrozen(built.recipe)).toBe(true);
  });

  it("defaults the speaker to the explicit voiceable subject's own role and the addressee to the teacher, mirroring the A1 discourse convention", () => {
    const model1 = built.variants.find((v) => v.id === "connected-conversation-1-m1");
    // subjectReferent is "a2-referent-friend" (a voiceable referent), so the
    // kit defaults the speaker to that referent's own role, not the learner.
    expect(model1?.discourse.speakerRoleId).toBe("a2-role-friend");
    expect(model1?.discourse.addresseeRoleId).toBe("a2-role-teacher");
  });
});

describe("defineA2Lesson — the A2 depth contract (8-12 models/exercises, not A1's exact 8/10)", () => {
  function candidate(modelCount: number, roundOneCount: number, roundTwoCount: number) {
    return {
      id: "fixture-lesson",
      moduleId: "fixture-module",
      order: 1 as const,
      contract: "instructional" as const,
      primaryCanDoId: "a2-cando-backchannel-followup",
      supportingCanDoIds: [],
      modelVariantIds: Array.from({ length: modelCount }, (_, i) => `m${i + 1}`),
      guidedVariantIds: ["m1", "m2"] as const,
      spokenVariantId: "m1",
      practice: {
        lessonId: "fixture-lesson",
        roundOne: {
          id: "fixture-lesson-round-1",
          purpose: "guided-controlled" as const,
          candidateVariantIds: Array.from({ length: modelCount }, (_, i) => `m${i + 1}`),
          selectionPolicyId: "a2-selection-default",
          exerciseKinds: ["tile-ordering" as const],
          targetCount: roundOneCount,
        },
        roundTwo: {
          id: "fixture-lesson-round-2",
          purpose: "transfer" as const,
          candidateVariantIds: Array.from({ length: 5 }, (_, i) => `t${i + 1}`),
          selectionPolicyId: "a2-selection-default",
          exerciseKinds: ["completion" as const],
          targetCount: roundTwoCount,
        },
      },
      diversityConstraints: {
        modelCountRange: [8, 12] as const,
        exerciseCountRange: [8, 12] as const,
        minFamilies: 1,
        minPredicates: 3,
        minRoles: 3,
        minContexts: 2,
        minUniqueTargets: 5,
        maxTargetReuse: 2,
        minTransferExercises: 5,
        requireControlledConstruction: true,
      },
      introducedConceptIds: [],
      introducedSenseIds: [],
    };
  }

  it("accepts exactly 8 models (the A1-equivalent floor)", () => {
    expect(() => defineA2Lesson(candidate(8, 5, 5))).not.toThrow();
  });

  it("accepts 12 models (the new A2 ceiling)", () => {
    expect(() => defineA2Lesson(candidate(12, 5, 5))).not.toThrow();
  });

  it("rejects fewer than 8 models", () => {
    expect(() => defineA2Lesson(candidate(7, 5, 5))).toThrow();
  });

  it("rejects more than 12 models", () => {
    expect(() => defineA2Lesson(candidate(13, 5, 5))).toThrow();
  });

  it("rejects a total exercise count below 8", () => {
    expect(() => defineA2Lesson(candidate(8, 3, 3))).toThrow();
  });

  it("accepts a total exercise count of exactly 10 (5+5, the authored target)", () => {
    expect(() => defineA2Lesson(candidate(8, 5, 5))).not.toThrow();
  });
});

describe("assembleA2FoundationCatalogs", () => {
  it("builds a FoundationCatalogs exposing the real A2 contexts/roles/referents/senses/values/families", () => {
    const catalogs = assembleA2FoundationCatalogs({ lessons: [], variants: [] });
    expect(catalogs.contexts.length).toBeGreaterThan(0);
    expect(catalogs.personRoles.length).toBeGreaterThan(0);
    expect(catalogs.referents.length).toBeGreaterThan(0);
    expect(catalogs.learningTargetSenses.length).toBeGreaterThan(0);
    expect(catalogs.semanticValues.length).toBeGreaterThan(0);
    expect(catalogs.sentenceFamilies.length).toBeGreaterThan(0);
  });

  it("accepts an optional canDos list (chicken-and-egg: canDos are enriched only after lessons are built)", () => {
    const fakeCanDo = {
      id: "a2-cando-fixture",
      level: "a2" as const,
      domain: "interaction" as const,
      descriptorCopyId: "x",
      contextIds: [],
      lessonIds: [],
      checkpointEvidenceRule: { evidenceKind: "checkpoint-sampled" as const, minAcceptedTransferTargets: 3 },
    };
    const catalogs = assembleA2FoundationCatalogs({ lessons: [], variants: [], canDos: [fakeCanDo] });
    expect(catalogs.canDos).toEqual([fakeCanDo]);
  });

  it("defaults modules/levels/checkpoints to [] when omitted (per-module unit tests need no registry)", () => {
    const catalogs = assembleA2FoundationCatalogs({ lessons: [], variants: [] });
    expect(catalogs.modules).toEqual([]);
    expect(catalogs.levels).toEqual([]);
    expect(catalogs.checkpoints).toEqual([]);
  });

  it("accepts optional modules/levels/checkpoints so validateFoundations's integrity stage can resolve lesson.moduleId, not just canDos", () => {
    const fakeModule = {
      id: "connected-conversation" as const,
      level: "a2" as const,
      order: 1,
      canDoIds: [],
      lessonIds: [],
    };
    const fakeLevel = {
      id: "a2" as const,
      alignmentCopyId: "x",
      moduleIds: [],
      canDoIds: [],
    };
    const fakeCheckpoint = {
      id: "a2-checkpoint-fixture",
      level: "a2" as const,
      sampledCanDoIds: [],
      minAcceptedTransferTargetsPerCanDo: 3,
    };
    const catalogs = assembleA2FoundationCatalogs({
      lessons: [],
      variants: [],
      modules: [fakeModule],
      levels: [fakeLevel],
      checkpoints: [fakeCheckpoint],
    });
    expect(catalogs.modules).toEqual([fakeModule]);
    expect(catalogs.levels).toEqual([fakeLevel]);
    expect(catalogs.checkpoints).toEqual([fakeCheckpoint]);
  });
});

describe("computeAvailableContentByLesson", () => {
  const catalogs = assembleA2FoundationCatalogs({ lessons: [], variants: [] });

  it("accumulates concept/sense/value/form availability strictly in canonical position order", () => {
    const lesson1 = buildA2InstructionalLesson({
      id: "connected-conversation-1",
      moduleId: "connected-conversation",
      order: 1,
      primaryCanDoId: "a2-cando-backchannel-followup",
      supportingCanDoIds: [],
      introducedConceptIds: [],
      introducedSenseIds: ["a2-sense-hanasu"],
      models: Array.from({ length: 8 }, (_, i) => ({
        id: `connected-conversation-1-m${i + 1}`,
        family: "a2-family-talk-companion",
        context: "a2-context-conversation",
        subjectReferent: "a2-referent-friend",
        subjectRealization: "explicit" as const,
        slots: { subject: "a2-value-friend-subject", predicate: "a2-value-hanasu", companion: "a2-value-companion-colleague" },
        translation: { en: `m${i + 1}`, it: `m${i + 1}` },
      })),
      transfers: Array.from({ length: 5 }, (_, i) => ({
        id: `connected-conversation-1-t${i + 1}`,
        family: "a2-family-talk-companion",
        context: "a2-context-conversation",
        subjectReferent: "a2-referent-friend",
        subjectRealization: "explicit" as const,
        slots: { subject: "a2-value-friend-subject", predicate: "a2-value-hanasu", companion: "a2-value-companion-colleague" },
        translation: { en: `t${i + 1}`, it: `t${i + 1}` },
      })),
    });
    const lesson2 = buildA2InstructionalLesson({
      id: "connected-conversation-2",
      moduleId: "connected-conversation",
      order: 2,
      primaryCanDoId: "a2-cando-connectors",
      supportingCanDoIds: [],
      introducedConceptIds: ["a2-concept-connectors"],
      introducedSenseIds: [],
      models: Array.from({ length: 8 }, (_, i) => ({
        id: `connected-conversation-2-m${i + 1}`,
        family: "a2-family-connector-utterance",
        context: "a2-context-conversation",
        subjectReferent: null,
        subjectRealization: "omitted" as const,
        slots: { predicate: "a2-value-connector-ame-demo-dekakeru" },
        translation: { en: `m${i + 1}`, it: `m${i + 1}` },
      })),
      transfers: Array.from({ length: 5 }, (_, i) => ({
        id: `connected-conversation-2-t${i + 1}`,
        family: "a2-family-connector-utterance",
        context: "a2-context-conversation",
        subjectReferent: null,
        subjectRealization: "omitted" as const,
        slots: { predicate: "a2-value-connector-ame-demo-dekakeru" },
        translation: { en: `t${i + 1}`, it: `t${i + 1}` },
      })),
    });

    const availability = computeAvailableContentByLesson([lesson1, lesson2], catalogs);

    // Lesson 1's own availability must include what its models actually use.
    expect(availability["connected-conversation-1"].semanticValueIds).toContain("a2-value-hanasu");
    // Lesson 2's cumulative availability must still include lesson 1's content
    // (cumulative, not a per-lesson reset) plus its own.
    expect(availability["connected-conversation-2"].semanticValueIds).toContain("a2-value-hanasu");
    expect(availability["connected-conversation-2"].semanticValueIds).toContain(
      "a2-value-connector-ame-demo-dekakeru",
    );
    // Lesson 1 must NOT yet see lesson 2's later-introduced content.
    expect(availability["connected-conversation-1"].semanticValueIds).not.toContain(
      "a2-value-connector-ame-demo-dekakeru",
    );
  });
});

describe("a2VerbUseRecord / withA2LaterUses — delegate to the shared kit's verbUseRecord/withLaterUses", () => {
  const baseInput = {
    senseId: "a2-sense-hanasu",
    introductionLessonId: "connected-conversation-1",
    introductionVariantIds: ["connected-conversation-1-m1", "connected-conversation-1-t3"],
    exerciseRoundId: "connected-conversation-1-round-1",
    exerciseKind: "tile-ordering" as const,
    exerciseTargetVariantId: "connected-conversation-1-m1",
  };

  it("prefixes the record id with a2- (the A2 counterpart of a1VerbUseRecord's a1- prefix)", () => {
    const record = a2VerbUseRecord(baseInput);
    expect(record.id).toBe("a2-verb-use-a2-sense-hanasu");
    expect(record.senseId).toBe("a2-sense-hanasu");
    expect(record.learningUse).toBe("productive");
    expect(record.introductionVariantIds).toEqual([
      "connected-conversation-1-m1",
      "connected-conversation-1-t3",
    ]);
    expect(record.laterUses).toEqual([]);
    expect(Object.isFrozen(record)).toBe(true);
  });

  it("withA2LaterUses appends later uses without mutating the original record", () => {
    const record = a2VerbUseRecord(baseInput);
    const augmented = withA2LaterUses(record, [
      { lessonId: "plans-invitations-1", variantId: "plans-invitations-1-m1" },
    ]);
    expect(augmented).not.toBe(record);
    expect(augmented.laterUses).toEqual([
      { lessonId: "plans-invitations-1", variantId: "plans-invitations-1-m1" },
    ]);
    expect(record.laterUses).toEqual([]);
    expect(Object.isFrozen(augmented)).toBe(true);
  });
});

// M5 spec-fix (Phase 3 Task 5 quality pass): every M1-M8 module content file
// (module01ConnectedConversation.ts .. module08RestaurantProblems.ts)
// authored its own byte-identical local `subjectReferentValueId` function +
// referent->subject-value table — eight duplicated copies of the same seven
// (now eight, with clerk added for I2's natural clerk-vocative fix) entries.
// `a2SubjectReferentValueId` is the single hoisted, deep-frozen, fail-closed
// source of truth every module now imports instead.
describe("a2SubjectReferentValueId — the single hoisted referent->subject-value map (M5 spec-fix)", () => {
  const EXPECTED_MAPPING: Readonly<Record<string, string>> = {
    "a2-referent-self": "a2-value-watashi",
    "a2-referent-emi": "a2-value-emi",
    "a2-referent-sora": "a2-value-sora",
    "a2-referent-friend": "a2-value-friend-subject",
    "a2-referent-colleague": "a2-value-colleague-subject",
    "a2-referent-teacher": "a2-value-teacher-subject",
    "a2-referent-clerk": "a2-value-clerk-subject",
  };

  it.each(Object.entries(EXPECTED_MAPPING))(
    "resolves %s to its exact subject-slot semantic value %s",
    (referentId, expectedValueId) => {
      expect(a2SubjectReferentValueId(referentId)).toBe(expectedValueId);
    },
  );

  it("maps every referent in the real a2Referents catalog (no fewer, no more) to a resolvable subject-slot value", () => {
    expect(Object.keys(EXPECTED_MAPPING).sort()).toEqual(a2Referents.map((r) => r.id).sort());
    for (const referent of a2Referents) {
      expect(() => a2SubjectReferentValueId(referent.id), referent.id).not.toThrow();
    }
  });

  it("fails closed (throws) on an unknown referent id, never returning undefined", () => {
    expect(() => a2SubjectReferentValueId("a2-referent-does-not-exist")).toThrow(
      /no subject value mapped for referent/,
    );
  });

  it("fails closed (throws) on an empty-string referent id", () => {
    expect(() => a2SubjectReferentValueId("")).toThrow();
  });

  it("every resolved subject-value id is a real, registered semantic value in a2SemanticValues", () => {
    const valueIds = new Set(a2SemanticValues.map((v) => v.id));
    for (const referentId of Object.keys(EXPECTED_MAPPING)) {
      const resolved = a2SubjectReferentValueId(referentId);
      expect(valueIds.has(resolved), `${referentId} -> ${resolved}`).toBe(true);
    }
  });
});
