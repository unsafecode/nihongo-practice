import { describe, expect, it } from "vitest";

import {
  A1_CANONICAL_POSITIONS,
  A1_CAPSTONE_LESSON_IDS,
  A1_EXPANDED_CANONICAL_POSITIONS,
  A1_EXPANDED_LESSON_IDS,
  A1_EXPANDED_LESSON_IDS_BY_MODULE,
  A1_EXPANDED_MANIFEST_SPEC,
  A1_EXPANDED_MODULE_IDS,
  A1_LEGACY_LESSON_ALIASES,
  A1_LEGACY_PUBLISHED_LESSON_IDS,
  A1_LESSON_IDS,
  A1_LESSON_IDS_BY_MODULE,
  A1_LESSON_MANIFEST,
  A1_MODULE_IDS,
  A1_MODULE_MANIFEST,
  A1_MANIFEST_SPEC,
  A1_NEW_LESSON_IDS,
  A1_RETAINED_PUBLISHED_LESSON_IDS,
  validateA1Manifest,
  validateA1ManifestSpec,
  type A1ManifestSpec,
} from "./manifest";
import {
  A1_INSTRUCTIONAL_MODEL_COUNT,
  A1_PHONETIC_CONTRASTIVE_MAX,
  A1_PHONETIC_CONTRASTIVE_MIN,
  A1_PHONETIC_PRACTICE_MAX,
  A1_PHONETIC_PRACTICE_MAX_REUSE,
  A1_PHONETIC_PRACTICE_MIN,
  A1_PHONETIC_PRACTICE_MIN_UNIQUE,
  A1_ROUND_TARGET_COUNTS,
  assembleA1Slice,
  AuthoringError,
  defineA1Lesson,
  defineA1Module,
  defineA1PhoneticLesson,
  defineA1SemanticValue,
  variantFromTuple,
} from "./authoring";
import type {
  A1LessonRecipe,
  A1ModuleRecipe,
  A1PhoneticLessonRecipe,
  A1VariantTuple,
} from "./types";
import type {
  DiscourseFrame,
  FormSelection,
  LessonPracticeDefinition,
  LessonDiversityConstraints,
  SemanticValue,
} from "../foundations/types";

// ---------------------------------------------------------------------------
// Published release manifest: exact deployed shape
// ---------------------------------------------------------------------------

describe("A1 manifest — published release 16×4 shape", () => {
  it("keeps exactly sixteen deployed modules in their published order", () => {
    expect(A1_MODULE_IDS).toEqual([
      "sounds",
      "sentence-foundations",
      "topic-questions",
      "polite-verbs",
      "time-movement",
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
      "capstones",
    ]);
    expect(A1_MODULE_IDS).toHaveLength(16);
  });

  it("keeps exactly 64 deployed lessons, four per module", () => {
    expect(A1_LESSON_IDS).toHaveLength(64);
    for (const moduleId of A1_MODULE_IDS) {
      expect(A1_LESSON_IDS_BY_MODULE[moduleId]).toHaveLength(4);
    }
    // Flattening the per-module lists reproduces the canonical order.
    const flattened = A1_MODULE_IDS.flatMap((m) => A1_LESSON_IDS_BY_MODULE[m]);
    expect(flattened).toEqual(A1_LESSON_IDS);
  });

  it("encodes the exact deployed lesson ids", () => {
    expect(A1_LESSON_IDS_BY_MODULE["sounds"]).toEqual([
      "sounds-1",
      "sounds-2",
      "sounds-3",
      "sounds-4",
    ]);
    expect(A1_LESSON_IDS_BY_MODULE["introductions"]).toEqual([
      "introductions-1",
      "introductions-2",
      "introductions-3",
      "introductions-4",
    ]);
    expect(A1_LESSON_IDS_BY_MODULE["essential-questions"]).toEqual([
      "essential-questions-1",
      "essential-questions-2",
      "essential-questions-3",
      "essential-questions-4",
    ]);
    expect(A1_LESSON_IDS_BY_MODULE["places"]).toEqual([
      "places-1",
      "places-2",
      "places-3",
      "places-4",
    ]);
    expect(A1_LESSON_IDS_BY_MODULE["existence-needs"]).toEqual([
      "existence-needs-1",
      "existence-needs-2",
      "existence-needs-3",
      "existence-needs-4",
    ]);
  });

  it("lists the four synthesis capstones last", () => {
    expect(A1_CAPSTONE_LESSON_IDS).toEqual([
      "capstones-1",
      "capstones-2",
      "capstones-3",
      "capstones-4",
    ]);
    expect(A1_LESSON_IDS_BY_MODULE["capstones"]).toEqual(A1_CAPSTONE_LESSON_IDS);
  });

  it("preserves canonical positions 1..64 in module-then-lesson order", () => {
    const positions = A1_LESSON_IDS.map((id) => A1_CANONICAL_POSITIONS[id]);
    expect(positions).toEqual(Array.from({ length: 64 }, (_, i) => i + 1));
    expect(A1_CANONICAL_POSITIONS["introductions-1"]).toBe(21);
    // Capstones occupy the final four positions.
    expect(A1_CAPSTONE_LESSON_IDS.map((id) => A1_CANONICAL_POSITIONS[id])).toEqual([
      61, 62, 63, 64,
    ]);
  });

  it("assigns the right contract to every lesson", () => {
    for (const id of A1_LESSON_IDS_BY_MODULE["sounds"]) {
      expect(A1_LESSON_MANIFEST[id].contract).toBe("phonetic");
    }
    for (const id of A1_CAPSTONE_LESSON_IDS) {
      expect(A1_LESSON_MANIFEST[id].contract).toBe("synthesis");
    }
    const instructionalModules = A1_MODULE_IDS.slice(1, -1);
    for (const moduleId of instructionalModules) {
      for (const id of A1_LESSON_IDS_BY_MODULE[moduleId]) {
        expect(A1_LESSON_MANIFEST[id].contract).toBe("instructional");
      }
    }
    const contractCounts = A1_LESSON_IDS.reduce<Record<string, number>>(
      (counts, lessonId) => {
        const contract = A1_LESSON_MANIFEST[lessonId].contract;
        counts[contract] = (counts[contract] ?? 0) + 1;
        return counts;
      },
      {},
    );
    expect(contractCounts).toEqual({
      phonetic: 4,
      instructional: 56,
      synthesis: 4,
    });
  });

  it("wires each lesson manifest entry to its module, order, and position", () => {
    for (const moduleId of A1_MODULE_IDS) {
      const lessonIds = A1_LESSON_IDS_BY_MODULE[moduleId];
      lessonIds.forEach((id, index) => {
        const entry = A1_LESSON_MANIFEST[id];
        expect(entry.lessonId).toBe(id);
        expect(entry.moduleId).toBe(moduleId);
        expect(entry.order).toBe(index + 1);
        expect(entry.position).toBe(A1_CANONICAL_POSITIONS[id]);
      });
    }
  });

  it("exposes a linear prerequisite chain over the module manifest", () => {
    A1_MODULE_IDS.forEach((moduleId, index) => {
      const entry = A1_MODULE_MANIFEST[moduleId];
      expect(entry.id).toBe(moduleId);
      expect(entry.order).toBe(index + 1);
      expect(entry.lessonIds).toEqual(A1_LESSON_IDS_BY_MODULE[moduleId]);
      expect(entry.prerequisiteIds).toEqual(
        index === 0 ? [] : [A1_MODULE_IDS[index - 1]],
      );
      expect(entry.outcomeCopyId.length).toBeGreaterThan(0);
      // Outcome copy ids are locale-independent (ASCII id, no Japanese).
      expect(entry.outcomeCopyId).not.toMatch(
        /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/,
      );
    });
  });
});

// ---------------------------------------------------------------------------
// Deprecated expanded aliases: identity views of the published manifest
// ---------------------------------------------------------------------------

describe("A1 expanded manifest aliases", () => {
  it("aliases the exact published sixteen-module order", () => {
    expect(A1_EXPANDED_MODULE_IDS).toEqual([
      "sounds",
      "sentence-foundations",
      "topic-questions",
      "polite-verbs",
      "time-movement",
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
      "capstones",
    ]);
    expect(A1_EXPANDED_MODULE_IDS).toHaveLength(16);
    expect(A1_EXPANDED_MANIFEST_SPEC.moduleIds).toEqual(
      A1_EXPANDED_MODULE_IDS,
    );
    expect(A1_EXPANDED_MODULE_IDS).toBe(A1_MODULE_IDS);
    expect(A1_EXPANDED_MANIFEST_SPEC).toBe(A1_MANIFEST_SPEC);
  });

  it("pins the planned 64 lesson ids in module-then-lesson order", () => {
    expect(A1_EXPANDED_LESSON_IDS).toHaveLength(64);
    for (const moduleId of A1_EXPANDED_MODULE_IDS) {
      expect(A1_EXPANDED_LESSON_IDS_BY_MODULE[moduleId]).toEqual(
        Array.from({ length: 4 }, (_, index) => `${moduleId}-${index + 1}`),
      );
    }
    expect(
      A1_EXPANDED_MODULE_IDS.flatMap(
        (moduleId) => A1_EXPANDED_LESSON_IDS_BY_MODULE[moduleId],
      ),
    ).toEqual(A1_EXPANDED_LESSON_IDS);
  });

  it("aliases canonical positions", () => {
    expect(
      A1_EXPANDED_LESSON_IDS.map(
        (lessonId) => A1_EXPANDED_CANONICAL_POSITIONS[lessonId],
      ),
    ).toEqual(Array.from({ length: 64 }, (_, index) => index + 1));
    expect(A1_EXPANDED_CANONICAL_POSITIONS["sentence-foundations-1"]).toBe(5);
    expect(A1_EXPANDED_CANONICAL_POSITIONS["introductions-1"]).toBe(21);
    expect(A1_EXPANDED_CANONICAL_POSITIONS["capstones-4"]).toBe(64);
    expect(A1_EXPANDED_CANONICAL_POSITIONS).toBe(A1_CANONICAL_POSITIONS);
    expect(A1_CANONICAL_POSITIONS["introductions-1"]).toBe(21);
  });

  it("deep-freezes the planned authoring structures", () => {
    expect(Object.isFrozen(A1_EXPANDED_MANIFEST_SPEC)).toBe(true);
    expect(Object.isFrozen(A1_EXPANDED_MANIFEST_SPEC.moduleIds)).toBe(true);
    expect(Object.isFrozen(A1_EXPANDED_MANIFEST_SPEC.lessonIdsByModule)).toBe(
      true,
    );
    expect(
      Object.isFrozen(
        A1_EXPANDED_MANIFEST_SPEC.lessonIdsByModule["sentence-foundations"],
      ),
    ).toBe(true);
    expect(Object.isFrozen(A1_EXPANDED_MODULE_IDS)).toBe(true);
    expect(Object.isFrozen(A1_EXPANDED_LESSON_IDS_BY_MODULE)).toBe(true);
    expect(
      Object.isFrozen(
        A1_EXPANDED_LESSON_IDS_BY_MODULE["sentence-foundations"],
      ),
    ).toBe(true);
    expect(Object.isFrozen(A1_EXPANDED_LESSON_IDS)).toBe(true);
    expect(Object.isFrozen(A1_EXPANDED_CANONICAL_POSITIONS)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Published release IDs: preservation, aliases, new IDs
// ---------------------------------------------------------------------------

describe("A1 manifest — published preservation and aliases", () => {
  it("aliases only the retired sounds-5 to sounds-4", () => {
    expect(A1_LEGACY_LESSON_ALIASES).toEqual({ "sounds-5": "sounds-4" });
  });

  it("keeps every current published non-capstone id directly, except sounds-5", () => {
    for (const id of A1_LEGACY_PUBLISHED_LESSON_IDS) {
      if (id === "sounds-5") {
        // The single retired id: not a canonical lesson, alias-only.
        expect(A1_LESSON_IDS).not.toContain(id);
        expect(A1_LEGACY_LESSON_ALIASES[id]).toBe("sounds-4");
      } else {
        expect(A1_LESSON_IDS).toContain(id);
      }
    }
  });

  it("includes the nine depth-gap lessons and sixteen Foundations lessons", () => {
    expect([...A1_NEW_LESSON_IDS].sort()).toEqual(
      [
        "actions-4",
        "descriptions-4",
        "essential-questions-4",
        "existence-needs-4",
        "introductions-4",
        "past-negative-4",
        "people-4",
        "routines-4",
        "shopping-4",
        "sentence-foundations-1",
        "sentence-foundations-2",
        "sentence-foundations-3",
        "sentence-foundations-4",
        "topic-questions-1",
        "topic-questions-2",
        "topic-questions-3",
        "topic-questions-4",
        "polite-verbs-1",
        "polite-verbs-2",
        "polite-verbs-3",
        "polite-verbs-4",
        "time-movement-1",
        "time-movement-2",
        "time-movement-3",
        "time-movement-4",
      ].sort(),
    );
    expect(A1_NEW_LESSON_IDS).toHaveLength(25);
    // None of the newly published ids was previously published.
    for (const id of A1_NEW_LESSON_IDS) {
      expect(A1_LEGACY_PUBLISHED_LESSON_IDS).not.toContain(id);
      expect(A1_LESSON_IDS).toContain(id);
    }
  });

  it("partitions the 64 deployed lessons into retained + new + renumbered capstones", () => {
    expect(A1_RETAINED_PUBLISHED_LESSON_IDS).toHaveLength(35);
    expect(
      A1_RETAINED_PUBLISHED_LESSON_IDS.length +
        A1_NEW_LESSON_IDS.length +
        A1_CAPSTONE_LESSON_IDS.length,
    ).toBe(64);
    // The three partitions are disjoint and cover every canonical lesson.
    const union = new Set([
      ...A1_RETAINED_PUBLISHED_LESSON_IDS,
      ...A1_NEW_LESSON_IDS,
      ...A1_CAPSTONE_LESSON_IDS,
    ]);
    expect(union.size).toBe(64);
    for (const id of A1_LESSON_IDS) expect(union.has(id)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Manifest: canonical validation passes; invalid mutations rejected
// ---------------------------------------------------------------------------

describe("validateA1Manifest — canonical passes", () => {
  it("accepts the canonical manifest spec", () => {
    const result = validateA1Manifest();
    expect(result.ok).toBe(true);
  });
});

function cloneSpec(spec: A1ManifestSpec): A1ManifestSpec {
  return {
    moduleIds: [...spec.moduleIds],
    lessonIdsByModule: Object.fromEntries(
      Object.entries(spec.lessonIdsByModule).map(([m, ids]) => [m, [...ids]]),
    ),
    modulePrerequisites: Object.fromEntries(
      Object.entries(spec.modulePrerequisites).map(([m, ids]) => [m, [...ids]]),
    ),
    moduleContracts: { ...spec.moduleContracts },
    capstoneModuleId: spec.capstoneModuleId,
    aliases: { ...spec.aliases },
  };
}

function codesOf(spec: A1ManifestSpec): readonly string[] {
  const result = validateA1ManifestSpec(spec);
  return result.ok ? [] : result.errors.map((e) => e.code);
}

describe("validateA1ManifestSpec — invalid mutations", () => {
  it("rejects a duplicate module id", () => {
    const spec = cloneSpec(A1_MANIFEST_SPEC);
    (spec.moduleIds as string[])[1] = "sounds";
    expect(codesOf(spec)).toContain("duplicate-module-id");
  });

  it("rejects a duplicate lesson id across modules", () => {
    const spec = cloneSpec(A1_MANIFEST_SPEC);
    (spec.lessonIdsByModule["introductions"] as string[])[0] = "sounds-1";
    expect(codesOf(spec)).toContain("duplicate-lesson-id");
  });

  it("rejects a module that does not have exactly four lessons", () => {
    const spec = cloneSpec(A1_MANIFEST_SPEC);
    (spec.lessonIdsByModule["sounds"] as string[]).push("sounds-5");
    expect(codesOf(spec)).toContain("module-lesson-count");
  });

  it("rejects a non-final capstone module", () => {
    const spec = cloneSpec(A1_MANIFEST_SPEC);
    // Move capstones out of the last position.
    spec.moduleIds = [
      "capstones",
      ...A1_MODULE_IDS.filter((m) => m !== "capstones"),
    ];
    expect(codesOf(spec)).toContain("capstone-not-final");
  });

  it("rejects an alias whose target does not exist", () => {
    const spec = cloneSpec(A1_MANIFEST_SPEC);
    spec.aliases = { "sounds-5": "sounds-9" };
    expect(codesOf(spec)).toContain("alias-target-missing");
  });

  it("rejects an alias source that is itself a canonical lesson", () => {
    const spec = cloneSpec(A1_MANIFEST_SPEC);
    spec.aliases = { "sounds-4": "sounds-3" };
    expect(codesOf(spec)).toContain("alias-source-published");
  });

  it("rejects a broken prerequisite chain (forward reference)", () => {
    const spec = cloneSpec(A1_MANIFEST_SPEC);
    spec.modulePrerequisites = {
      ...spec.modulePrerequisites,
      sounds: ["introductions"],
    };
    expect(codesOf(spec)).toContain("prerequisite-order");
  });

  it("rejects a wrong contract assignment", () => {
    const spec = cloneSpec(A1_MANIFEST_SPEC);
    spec.moduleContracts = { ...spec.moduleContracts, sounds: "instructional" };
    expect(codesOf(spec)).toContain("contract-assignment");
  });
});

// ---------------------------------------------------------------------------
// Authoring helpers: shared fixtures
// ---------------------------------------------------------------------------

const DISCOURSE: DiscourseFrame = {
  speakerRoleId: "a1-role-yuki",
  addresseeRoleId: null,
  subjectReferentId: "a1-ref-yuki",
  subjectRealization: "explicit",
  scenarioNoteCopyId: "a1-scenario-intro",
};

const FORM: FormSelection = {
  polarity: "affirmative",
  tense: "present",
  formality: "polite",
};

const DIVERSITY: LessonDiversityConstraints = {
  modelCountRange: [8, 8],
  exerciseCountRange: [4, 4],
  minFamilies: 1,
  minPredicates: 3,
  minRoles: 3,
  minContexts: 2,
  minUniqueTargets: 4,
  maxTargetReuse: 2,
  minTransferExercises: 2,
  requireControlledConstruction: true,
};

function models(prefix: string, count = 8): string[] {
  return Array.from({ length: count }, (_, i) => `${prefix}-model-${i + 1}`);
}

function practice(lessonId: string): LessonPracticeDefinition {
  return {
    lessonId,
    roundOne: {
      id: `${lessonId}-round-1`,
      purpose: "guided-controlled",
      candidateVariantIds: models(`${lessonId}-r1`, 6),
      selectionPolicyId: "a1-policy",
      exerciseKinds: ["completion", "choice"],
      targetCount: 2,
    },
    roundTwo: {
      id: `${lessonId}-round-2`,
      purpose: "transfer",
      candidateVariantIds: models(`${lessonId}-r2`, 6),
      selectionPolicyId: "a1-policy",
      exerciseKinds: ["constrained-construction", "transformation"],
      targetCount: 2,
    },
  };
}

function instructionalRecipe(
  overrides: Partial<A1LessonRecipe> = {},
): A1LessonRecipe {
  const id = overrides.id ?? "introductions-1";
  return {
    id,
    moduleId: "introductions",
    order: 1,
    contract: "instructional",
    primaryCanDoId: "a1-cando-introduce",
    supportingCanDoIds: ["a1-cando-name"],
    modelVariantIds: models(id, 8),
    guidedVariantIds: [`${id}-model-1`, `${id}-model-2`],
    spokenVariantId: `${id}-model-1`,
    practice: practice(id),
    diversityConstraints: DIVERSITY,
    introducedConceptIds: ["a1-concept-copula"],
    introducedSenseIds: ["a1-sense-be"],
    ...overrides,
  };
}

function phoneticRecipe(
  overrides: Partial<A1PhoneticLessonRecipe> = {},
): A1PhoneticLessonRecipe {
  const id = overrides.id ?? "sounds-1";
  return {
    id,
    moduleId: "sounds",
    order: 1,
    contract: "phonetic",
    primaryCanDoId: "a1-cando-read-kana",
    supportingCanDoIds: [],
    contrastiveItemIds: Array.from(
      { length: 10 },
      (_, i) => `${id}-contrast-${i + 1}`,
    ),
    practiceTargetRefs: Array.from(
      { length: 4 },
      (_, i) => `${id}-target-${i + 1}`,
    ),
    outcomeCopyId: `a1-outcome-${id}`,
    ...overrides,
  };
}

function moduleRecipe(overrides: Partial<A1ModuleRecipe> = {}): A1ModuleRecipe {
  return {
    id: "introductions",
    order: 2,
    prerequisiteIds: ["sounds"],
    lessonIds: [
      "introductions-1",
      "introductions-2",
      "introductions-3",
      "introductions-4",
    ],
    outcomeCopyId: "a1-module-outcome-introductions",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Authoring helpers: immutability & happy path
// ---------------------------------------------------------------------------

describe("defineA1Lesson — happy path and immutability", () => {
  it("freezes the same recipe object in place (not a copy)", () => {
    const recipe = instructionalRecipe();
    const defined = defineA1Lesson(recipe);
    // deepFreeze mutates and returns the very same object — there is no
    // clone. `recipe` itself is now deeply frozen too.
    expect(defined).toBe(recipe);
    expect(Object.isFrozen(defined)).toBe(true);
    expect(Object.isFrozen(recipe)).toBe(true);
    expect(Object.isFrozen(defined.modelVariantIds)).toBe(true);
    expect(Object.isFrozen(defined.practice.roundOne)).toBe(true);
    expect(() => {
      (defined.modelVariantIds as string[]).push("mutation");
    }).toThrow();
  });

  it("accepts a synthesis lesson that introduces no new concept/sense", () => {
    const defined = defineA1Lesson(
      instructionalRecipe({
        id: "capstones-1",
        moduleId: "capstones",
        contract: "synthesis",
        introducedConceptIds: [],
        introducedSenseIds: [],
      }),
    );
    expect(defined.contract).toBe("synthesis");
  });
});

describe("defineA1Lesson — gates", () => {
  it("rejects a model count other than eight", () => {
    expect(() =>
      defineA1Lesson(instructionalRecipe({ modelVariantIds: models("x", 7) })),
    ).toThrowError(AuthoringError);
    try {
      defineA1Lesson(instructionalRecipe({ modelVariantIds: models("x", 7) }));
    } catch (error) {
      expect((error as AuthoringError).code).toBe("model-count");
    }
    expect(A1_INSTRUCTIONAL_MODEL_COUNT).toBe(8);
  });

  it("rejects duplicate model variant ids", () => {
    const dup = models("dup", 8);
    dup[7] = dup[0];
    try {
      defineA1Lesson(instructionalRecipe({ modelVariantIds: dup }));
      throw new Error("expected throw");
    } catch (error) {
      expect(error).toBeInstanceOf(AuthoringError);
      expect((error as AuthoringError).code).toBe("duplicate-id");
    }
  });

  it("rejects a round whose target count does not match its configured round", () => {
    const p = practice("introductions-1");
    const broken: LessonPracticeDefinition = {
      ...p,
      roundTwo: { ...p.roundTwo, targetCount: 3 },
    };
    try {
      defineA1Lesson(instructionalRecipe({ practice: broken }));
      throw new Error("expected throw");
    } catch (error) {
      expect((error as AuthoringError).code).toBe("round-shape");
    }
    expect(A1_ROUND_TARGET_COUNTS).toEqual([2, 2]);
  });

  it("rejects duplicate candidate target refs within a round", () => {
    const p = practice("introductions-1");
    const dupCandidates = [...p.roundOne.candidateVariantIds];
    dupCandidates[1] = dupCandidates[0];
    const broken: LessonPracticeDefinition = {
      ...p,
      roundOne: { ...p.roundOne, candidateVariantIds: dupCandidates },
    };
    try {
      defineA1Lesson(instructionalRecipe({ practice: broken }));
      throw new Error("expected throw");
    } catch (error) {
      expect((error as AuthoringError).code).toBe("duplicate-target-ref");
    }
  });

  it("rejects a synthesis lesson that introduces new content", () => {
    try {
      defineA1Lesson(
        instructionalRecipe({
          id: "capstones-1",
          moduleId: "capstones",
          contract: "synthesis",
          introducedConceptIds: ["a1-concept-new"],
          introducedSenseIds: [],
        }),
      );
      throw new Error("expected throw");
    } catch (error) {
      expect((error as AuthoringError).code).toBe("synthesis-new-content");
    }
  });

  it("rejects a Japanese literal anywhere in the recipe", () => {
    const withJapanese = instructionalRecipe({
      primaryCanDoId: "わたしはがくせいです",
    });
    try {
      defineA1Lesson(withJapanese);
      throw new Error("expected throw");
    } catch (error) {
      expect((error as AuthoringError).code).toBe("japanese-literal");
    }
  });

  it("rejects an answer/canonical field smuggled into the recipe", () => {
    const smuggled = {
      ...instructionalRecipe(),
      canonicalAnswer: "gakusei",
    } as unknown as A1LessonRecipe;
    try {
      defineA1Lesson(smuggled);
      throw new Error("expected throw");
    } catch (error) {
      expect((error as AuthoringError).code).toBe("forbidden-field");
    }
  });
});

describe("defineA1PhoneticLesson — gates and thresholds", () => {
  it("accepts 8–12 contrastive items and freezes the result", () => {
    const defined = defineA1PhoneticLesson(phoneticRecipe());
    expect(Object.isFrozen(defined)).toBe(true);
    expect(Object.isFrozen(defined.contrastiveItemIds)).toBe(true);
    expect(A1_PHONETIC_CONTRASTIVE_MIN).toBe(8);
    expect(A1_PHONETIC_CONTRASTIVE_MAX).toBe(12);
  });

  it("rejects fewer than eight contrastive items", () => {
    const few = phoneticRecipe({
      contrastiveItemIds: ["a", "b", "c", "d", "e", "f", "g"],
    });
    try {
      defineA1PhoneticLesson(few);
      throw new Error("expected throw");
    } catch (error) {
      expect((error as AuthoringError).code).toBe("contrastive-count");
    }
  });

  it("rejects more than twelve contrastive items", () => {
    const many = phoneticRecipe({
      contrastiveItemIds: Array.from({ length: 13 }, (_, i) => `c-${i}`),
    });
    try {
      defineA1PhoneticLesson(many);
      throw new Error("expected throw");
    } catch (error) {
      expect((error as AuthoringError).code).toBe("contrastive-count");
    }
  });

  it("rejects duplicate contrastive item ids", () => {
    const dup = phoneticRecipe();
    const items = [...dup.contrastiveItemIds];
    items[1] = items[0];
    try {
      defineA1PhoneticLesson(phoneticRecipe({ contrastiveItemIds: items }));
      throw new Error("expected throw");
    } catch (error) {
      expect((error as AuthoringError).code).toBe("duplicate-id");
    }
  });

  it("exposes the exact four, unique generated-practice target contract", () => {
    expect(A1_PHONETIC_PRACTICE_MIN).toBe(4);
    expect(A1_PHONETIC_PRACTICE_MAX).toBe(4);
    expect(A1_PHONETIC_PRACTICE_MIN_UNIQUE).toBe(4);
    expect(A1_PHONETIC_PRACTICE_MAX_REUSE).toBe(1);
  });

  it("rejects fewer than four practice target refs", () => {
    const few = phoneticRecipe({
      practiceTargetRefs: Array.from({ length: 3 }, (_, i) => `t-${i}`),
    });
    try {
      defineA1PhoneticLesson(few);
      throw new Error("expected throw");
    } catch (error) {
      expect((error as AuthoringError).code).toBe("practice-ref-count");
    }
  });

  it("rejects more than four practice target refs", () => {
    const many = phoneticRecipe({
      practiceTargetRefs: Array.from({ length: 5 }, (_, i) => `t-${i}`),
    });
    try {
      defineA1PhoneticLesson(many);
      throw new Error("expected throw");
    } catch (error) {
      expect((error as AuthoringError).code).toBe("practice-ref-count");
    }
  });

  it("rejects repeated generated-practice target refs", () => {
    const refs = ["a", "a", "b", "c"];
    try {
      defineA1PhoneticLesson(phoneticRecipe({ practiceTargetRefs: refs }));
      throw new Error("expected throw");
    } catch (error) {
      expect((error as AuthoringError).code).toBe("practice-ref-unique");
    }
  });

  it("accepts exactly four unique generated-practice target refs", () => {
    const refs = ["a", "b", "c", "d"];
    const defined = defineA1PhoneticLesson(
      phoneticRecipe({ practiceTargetRefs: refs }),
    );
    expect(Object.isFrozen(defined)).toBe(true);
    expect(defined.practiceTargetRefs).toEqual(refs);
  });

  it("rejects Japanese literals in a phonetic recipe", () => {
    try {
      defineA1PhoneticLesson(phoneticRecipe({ outcomeCopyId: "ラジオ" }));
      throw new Error("expected throw");
    } catch (error) {
      expect((error as AuthoringError).code).toBe("japanese-literal");
    }
  });
});

describe("assertNoForbiddenContent — expanded Japanese/fullwidth scan", () => {
  it("rejects the ideographic iteration mark 々 (U+3005)", () => {
    try {
      defineA1PhoneticLesson(phoneticRecipe({ outcomeCopyId: "時々" }));
      throw new Error("expected throw");
    } catch (error) {
      expect((error as AuthoringError).code).toBe("japanese-literal");
    }
  });

  it("rejects ideographic punctuation in U+3000-303F (e.g. 。)", () => {
    try {
      defineA1PhoneticLesson(phoneticRecipe({ outcomeCopyId: "done。" }));
      throw new Error("expected throw");
    } catch (error) {
      expect((error as AuthoringError).code).toBe("japanese-literal");
    }
  });

  it("rejects fullwidth romaji in U+FF01-FF60 (e.g. fullwidth Ａ)", () => {
    try {
      defineA1PhoneticLesson(phoneticRecipe({ outcomeCopyId: "Ａ" }));
      throw new Error("expected throw");
    } catch (error) {
      expect((error as AuthoringError).code).toBe("japanese-literal");
    }
  });

  it("rejects a CJK compatibility ideograph in U+F900-FAFF (e.g. 豈)", () => {
    try {
      defineA1PhoneticLesson(phoneticRecipe({ outcomeCopyId: "豈" }));
      throw new Error("expected throw");
    } catch (error) {
      expect((error as AuthoringError).code).toBe("japanese-literal");
    }
  });

  it("still allows legitimate Japanese through the semantic-value helper", () => {
    const value: SemanticValue = {
      id: "a1-value-iteration-example",
      kind: "object",
      tokenFragments: [
        {
          jp: "時々",
          romaji: "tokidoki",
          kind: "lexical",
          boundaryBefore: "attach",
        },
      ],
    };
    const defined = defineA1SemanticValue(value);
    expect(defined.tokenFragments[0].jp).toBe("時々");
    expect(Object.isFrozen(defined)).toBe(true);
  });
});

describe("defineA1Module — gates", () => {
  it("freezes a valid module recipe", () => {
    const defined = defineA1Module(moduleRecipe());
    expect(Object.isFrozen(defined)).toBe(true);
    expect(Object.isFrozen(defined.lessonIds)).toBe(true);
  });

  it("rejects a module without exactly four lessons", () => {
    try {
      defineA1Module(moduleRecipe({ lessonIds: ["introductions-1"] }));
      throw new Error("expected throw");
    } catch (error) {
      expect((error as AuthoringError).code).toBe("module-lesson-count");
    }
  });

  it("rejects duplicate lesson ids in a module", () => {
    try {
      defineA1Module(
        moduleRecipe({
          lessonIds: [
            "introductions-1",
            "introductions-1",
            "introductions-3",
            "introductions-4",
          ],
        }),
      );
      throw new Error("expected throw");
    } catch (error) {
      expect((error as AuthoringError).code).toBe("duplicate-id");
    }
  });
});

// ---------------------------------------------------------------------------
// variantFromTuple & the sanctioned semantic-value helper
// ---------------------------------------------------------------------------

describe("variantFromTuple — semantic ids only", () => {
  const baseTuple = (): A1VariantTuple => ({
    id: "introductions-1-model-1",
    familyId: "a1-family-topic-copular",
    discourse: DISCOURSE,
    contextId: "a1-context-classroom",
    slotValues: {
      topic: "a1-value-yuki",
      predicate: "a1-value-student",
    },
    form: FORM,
    pedagogicalUse: "model",
  });

  it("maps a tuple to a frozen SentenceVariant", () => {
    const tuple = baseTuple();
    const variant = variantFromTuple(tuple);
    expect(variant.id).toBe(tuple.id);
    expect(variant.sentenceFamilyId).toBe(tuple.familyId);
    expect(variant.slotValues).toEqual(tuple.slotValues);
    expect(Object.isFrozen(variant)).toBe(true);
    expect(Object.isFrozen(variant.slotValues)).toBe(true);
    // slotValues is shallow-copied before freezing — mutating the source
    // tuple's slotValues reference does not leak into the returned variant.
    (tuple.slotValues as Record<string, string>).topic = "mutated";
    expect(variant.slotValues.topic).toBe("a1-value-yuki");
  });

  it("carries discourse and form over by reference, then freezes them in place", () => {
    const tuple = baseTuple();
    const variant = variantFromTuple(tuple);
    // Unlike slotValues, discourse/form are NOT copied: the variant's
    // discourse/form is the exact same object the tuple was authored with.
    expect(variant.discourse).toBe(tuple.discourse);
    expect(variant.form).toBe(tuple.form);
    // deepFreeze walks and freezes that shared object in place, so the
    // source tuple's discourse/form (same reference) is now frozen too.
    expect(Object.isFrozen(tuple.discourse)).toBe(true);
    expect(Object.isFrozen(tuple.form)).toBe(true);
    expect(() => {
      (tuple.discourse as { subjectRealization: string }).subjectRealization =
        "mutated";
    }).toThrow();
  });

  it("rejects a Japanese literal in a slot value", () => {
    const jp: A1VariantTuple = {
      ...baseTuple(),
      slotValues: { topic: "わたし", predicate: "a1-value-student" },
    };
    try {
      variantFromTuple(jp);
      throw new Error("expected throw");
    } catch (error) {
      expect((error as AuthoringError).code).toBe("japanese-literal");
    }
  });
});

describe("defineA1SemanticValue — the only sanctioned Japanese authoring path", () => {
  it("accepts Japanese token fragments and freezes the value", () => {
    const value: SemanticValue = {
      id: "a1-value-student",
      kind: "predicate-sense",
      senseId: "a1-sense-be-student",
      tokenFragments: [
        {
          jp: "がくせい",
          romaji: "gakusei",
          kind: "lexical",
          boundaryBefore: "attach",
        },
      ],
    };
    const defined = defineA1SemanticValue(value);
    expect(defined.tokenFragments[0].jp).toBe("がくせい");
    expect(Object.isFrozen(defined)).toBe(true);
    expect(Object.isFrozen(defined.tokenFragments)).toBe(true);
  });

  it("rejects a semantic value with no token fragments", () => {
    try {
      defineA1SemanticValue({
        id: "a1-value-empty",
        kind: "object",
        tokenFragments: [],
      });
      throw new Error("expected throw");
    } catch (error) {
      expect((error as AuthoringError).code).toBe("empty-fragments");
    }
  });
});

// ---------------------------------------------------------------------------
// Partial slice assembly (module-local, not full release)
// ---------------------------------------------------------------------------

describe("assembleA1Slice — module-local validity", () => {
  function fullModuleLessons(moduleId: string, _contract: "instructional") {
    return [1, 2, 3, 4].map((order) =>
      defineA1Lesson(
        instructionalRecipe({
          id: `${moduleId}-${order}`,
          moduleId,
          order: order as 1 | 2 | 3 | 4,
          contract: "instructional",
        }),
      ),
    );
  }

  it("assembles a single instructional module slice without requiring the full release", () => {
    const moduleId = "introductions";
    const lessons = fullModuleLessons(moduleId, "instructional");
    const module = defineA1Module(
      moduleRecipe({
        id: moduleId,
        lessonIds: lessons.map((l) => l.id),
      }),
    );
    const result = assembleA1Slice({ modules: [module], lessons });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.lessonById[`${moduleId}-1`].moduleId).toBe(moduleId);
    expect(Object.keys(result.moduleById)).toEqual([moduleId]);
  });

  it("assembles a phonetic module slice", () => {
    const lessons = [1, 2, 3, 4].map((order) =>
      defineA1PhoneticLesson(
        phoneticRecipe({ id: `sounds-${order}`, order: order as 1 | 2 | 3 | 4 }),
      ),
    );
    const module = defineA1Module(
      moduleRecipe({
        id: "sounds",
        order: 1,
        prerequisiteIds: [],
        lessonIds: lessons.map((l) => l.id),
      }),
    );
    const result = assembleA1Slice({ modules: [module], lessons });
    expect(result.ok).toBe(true);
  });

  it("rejects a slice whose module references a missing lesson", () => {
    const lessons = fullModuleLessons("introductions", "instructional").slice(0, 3);
    const module = defineA1Module(
      moduleRecipe({
        id: "introductions",
        lessonIds: [
          "introductions-1",
          "introductions-2",
          "introductions-3",
          "introductions-4",
        ],
      }),
    );
    const result = assembleA1Slice({ modules: [module], lessons });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.map((e) => e.code)).toContain("missing-lesson");
  });

  it("rejects a slice whose lesson contract disagrees with its module", () => {
    // A phonetic lesson placed under an instructional module.
    const instructional = fullModuleLessons("introductions", "instructional").slice(0, 3);
    const phonetic = defineA1PhoneticLesson(
      phoneticRecipe({ id: "introductions-4", moduleId: "introductions", order: 4 }),
    );
    const module = defineA1Module(
      moduleRecipe({
        id: "introductions",
        lessonIds: [
          "introductions-1",
          "introductions-2",
          "introductions-3",
          "introductions-4",
        ],
      }),
    );
    const result = assembleA1Slice({
      modules: [module],
      lessons: [...instructional, phonetic],
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.map((e) => e.code)).toContain("contract-mismatch");
  });

  it("rejects a duplicate lesson id across the slice", () => {
    const lessons = fullModuleLessons("introductions", "instructional");
    const dup = defineA1Lesson(
      instructionalRecipe({ id: "introductions-1", moduleId: "introductions" }),
    );
    const module = defineA1Module(
      moduleRecipe({ id: "introductions", lessonIds: lessons.map((l) => l.id) }),
    );
    const result = assembleA1Slice({
      modules: [module],
      lessons: [...lessons, dup],
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.map((e) => e.code)).toContain("duplicate-lesson-id");
  });

  it("rejects a lesson id that is not a canonical A1 lesson", () => {
    const lessons = [
      ...fullModuleLessons("introductions", "instructional").slice(0, 3),
      defineA1Lesson(
        instructionalRecipe({
          id: "introductions-5",
          moduleId: "introductions",
          order: 4,
        }),
      ),
    ];
    const module = defineA1Module(
      moduleRecipe({
        id: "introductions",
        lessonIds: [
          "introductions-1",
          "introductions-2",
          "introductions-3",
          "introductions-5",
        ],
      }),
    );
    const result = assembleA1Slice({ modules: [module], lessons });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.map((e) => e.code)).toContain("unknown-lesson-id");
    // An unknown lesson id has no manifest contract to compare against, so it
    // must not also be reported as a contract mismatch.
    expect(result.errors.map((e) => e.code)).not.toContain(
      "contract-mismatch",
    );
  });

  it("rejects a provided lesson that no provided module references", () => {
    const moduleId = "introductions";
    const lessons = fullModuleLessons(moduleId, "instructional");
    const module = defineA1Module(
      moduleRecipe({ id: moduleId, lessonIds: lessons.map((l) => l.id) }),
    );
    const orphan = defineA1Lesson(
      instructionalRecipe({
        id: "essential-questions-1",
        moduleId: "essential-questions",
      }),
    );
    const result = assembleA1Slice({
      modules: [module],
      lessons: [...lessons, orphan],
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.map((e) => e.code)).toContain("orphan-lesson-id");
  });

  it("rejects a duplicate module id without silently overwriting the first module", () => {
    const lessons = fullModuleLessons("introductions", "instructional");
    const first = defineA1Module(
      moduleRecipe({ id: "introductions", lessonIds: lessons.map((l) => l.id) }),
    );
    const second = defineA1Module(
      moduleRecipe({ id: "introductions", lessonIds: lessons.map((l) => l.id) }),
    );
    const result = assembleA1Slice({
      modules: [first, second],
      lessons,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.map((e) => e.code)).toContain("duplicate-module-id");
  });
});
