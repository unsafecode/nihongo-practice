import { describe, expect, it } from "vitest";
import {
  assembledCurriculum,
  curriculumCopy,
  curriculumLessons,
  curriculumModules,
  derivePracticedIdsByLesson,
  lessonPlans,
  orderedCurriculumLessons,
} from "./curriculum";
import { curriculumExamples, curriculumExamplesById } from "./examples";
import { speechPrompts } from "./speechPrompts";
import { validateCurriculum } from "./validateCurriculum";
import { concepts } from "./concepts";
import { lexemesByIntroModule, lexiconById, verbLexemes } from "./lexicon";
import { curriculumFoundation } from "../curriculum/foundation";
import { genericPersonas, validateRuntimeAliases } from "../data/personas";

/**
 * Slice B Task 3 acceptance. Everything is proven from stable semantic data and
 * the pure release validator — never by counting rendered strings (spec §6.1,
 * §17.1). These tests independently re-derive each gate so a passing validator
 * cannot mask an authoring mistake.
 */

const MODULE_ORDER = [
  "sounds",
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
] as const;

const LESSON_BUDGET = [5, 3, 3, 3, 3, 3, 4, 3, 3, 3, 3, 4] as const;
const CAPSTONE_LESSON_IDS = [
  "capstones-self-introduction",
  "capstones-everyday-outing",
  "capstones-travel-day",
] as const;

// Hiragana/katakana/kanji ranges (mirrors lexicon.test.ts policy).
const KANJI = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/;
const KANA = /[\u3041-\u3096\u30a1-\u30fa]/;

const verbIds = new Set(verbLexemes.map((entry) => entry.id));

function isVerb(id: string): boolean {
  return verbIds.has(id);
}

describe("curriculum module skeleton (spec §5.2, §6.2)", () => {
  it("declares exactly twelve modules in the foundation order and phases", () => {
    expect(curriculumModules.map((module) => module.id)).toEqual([
      ...MODULE_ORDER,
    ]);
    for (const foundationModule of curriculumFoundation.modules) {
      const authored = curriculumModules.find(
        (module) => module.id === foundationModule.id,
      );
      expect(authored).toBeDefined();
      expect(authored?.phase).toBe(foundationModule.phase);
      expect(authored?.order).toBe(foundationModule.order);
      expect([...(authored?.prerequisiteIds ?? [])]).toEqual([
        ...foundationModule.prerequisiteIds,
      ]);
    }
  });

  it("uses sequential single-module prerequisites", () => {
    curriculumModules.forEach((module, index) => {
      if (index === 0) {
        expect(module.prerequisiteIds).toEqual([]);
      } else {
        expect([...module.prerequisiteIds]).toEqual([
          MODULE_ORDER[index - 1],
        ]);
      }
    });
  });
});

describe("lesson budgets and rhythm (spec §5.2, §5.3)", () => {
  it("matches the exact per-module lesson budget and totals 40", () => {
    MODULE_ORDER.forEach((moduleId, index) => {
      const lessons = curriculumLessons.filter(
        (lesson) => lesson.moduleId === moduleId,
      );
      expect(lessons).toHaveLength(LESSON_BUDGET[index]);
    });
    expect(curriculumLessons).toHaveLength(40);
    expect(LESSON_BUDGET.reduce((sum, count) => sum + count, 0)).toBe(40);
  });

  it("gives every lesson an integer 6-10 minute estimate and a stable id", () => {
    const ids = new Set<string>();
    for (const lesson of curriculumLessons) {
      expect(Number.isInteger(lesson.estimatedMinutes)).toBe(true);
      expect(lesson.estimatedMinutes).toBeGreaterThanOrEqual(6);
      expect(lesson.estimatedMinutes).toBeLessThanOrEqual(10);
      expect(ids.has(lesson.id)).toBe(false);
      ids.add(lesson.id);
      expect(lesson.id.startsWith(lesson.moduleId)).toBe(true);
    }
  });

  it("orders lessons 1..n within every module", () => {
    for (const moduleId of MODULE_ORDER) {
      const orders = curriculumLessons
        .filter((lesson) => lesson.moduleId === moduleId)
        .map((lesson) => lesson.order)
        .sort((a, b) => a - b);
      expect(orders).toEqual(orders.map((_, index) => index + 1));
    }
  });
});

describe("computed coverage equals the Slice A foundation (spec §6.2)", () => {
  const result = validateCurriculum(assembledCurriculum, {
    enforceReleaseTargets: true,
  });

  it("validates clean with release targets enforced", () => {
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it("matches every module lesson/verb/vocabulary budget", () => {
    for (const foundationModule of curriculumFoundation.modules) {
      const coverage = result.coverage.moduleCoverage[foundationModule.id];
      expect(coverage).toBeDefined();
      expect(coverage.lessonIds).toHaveLength(
        foundationModule.coverage.lessons,
      );
      expect(coverage.introducedVerbIds).toHaveLength(
        foundationModule.coverage.introducedVerbs,
      );
      expect(coverage.introducedLexemeIds).toHaveLength(
        foundationModule.coverage.vocabulary,
      );
    }
  });

  it("introduces exactly the Task 2 lexeme set per module", () => {
    curriculumFoundation.modules.forEach((foundationModule, index) => {
      const coverage = result.coverage.moduleCoverage[foundationModule.id];
      const authoredGroup = lexemesByIntroModule[index].map(
        (entry) => entry.id,
      );
      expect([...coverage.introducedLexemeIds].sort()).toEqual(
        [...authoredGroup].sort(),
      );
    });
  });

  it("computes the 270-word, 42-verb totals", () => {
    expect(result.coverage.vocabularyCount).toBe(270);
    expect(result.coverage.introducedVerbCount).toBe(42);
  });
});

describe("introduction and assessment invariants (spec §6.4)", () => {
  it("never assesses a concept or lexeme before it is introduced", () => {
    const introducedConcepts = new Set<string>();
    const introducedLexemes = new Set<string>();
    for (const lesson of orderedCurriculumLessons) {
      for (const id of lesson.introducedConceptIds) introducedConcepts.add(id);
      for (const id of lesson.introducedLexemeIds) introducedLexemes.add(id);
      for (const id of lesson.assessedConceptIds) {
        expect(introducedConcepts.has(id)).toBe(true);
      }
      for (const id of lesson.assessedLexemeIds) {
        expect(introducedLexemes.has(id)).toBe(true);
      }
    }
  });

  it("practices every introduced concept and verb in a later lesson", () => {
    orderedCurriculumLessons.forEach((lesson, index) => {
      const later = orderedCurriculumLessons.slice(index + 1);
      for (const conceptId of lesson.introducedConceptIds) {
        expect(
          later.some((entry) =>
            entry.practicedConceptIds.includes(conceptId),
          ),
        ).toBe(true);
      }
      for (const lexemeId of lesson.introducedLexemeIds) {
        if (!isVerb(lexemeId)) continue;
        expect(
          later.some((entry) =>
            entry.practicedLexemeIds.includes(lexemeId),
          ),
        ).toBe(true);
      }
    });
  });

  it("introduces every one of the 34 concepts exactly once, prerequisites first", () => {
    const introducedAt = new Map<string, number>();
    orderedCurriculumLessons.forEach((lesson, index) => {
      for (const conceptId of lesson.introducedConceptIds) {
        expect(introducedAt.has(conceptId)).toBe(false);
        introducedAt.set(conceptId, index);
      }
    });
    expect(introducedAt.size).toBe(concepts.length);
    for (const concept of concepts) {
      const at = introducedAt.get(concept.id);
      expect(at).toBeDefined();
      for (const prerequisiteId of concept.prerequisiteIds) {
        expect(introducedAt.get(prerequisiteId)).toBeLessThanOrEqual(
          at as number,
        );
      }
    }
  });
});

describe("practiced ids derive from canonical (module order, lesson order), not source-array position (regression finding 2)", () => {
  // A tiny two-module fixture. `canonicalOrder` is the true teaching order
  // (module order, then lesson order); the plans arrays below are fed to the
  // helper in several different physical array orders to prove the derived
  // practiced sets never depend on that array position.
  const moduleOrderById = new Map<string, number>([
    ["mod-a", 1],
    ["mod-b", 2],
  ]);
  const examplesById = new Map<
    string,
    { conceptIds: readonly string[]; lexemeIds: readonly string[] }
  >([
    ["ex-intro-a", { conceptIds: [], lexemeIds: [] }],
    ["ex-reuse-topic", { conceptIds: ["topic-wa"], lexemeIds: ["iku"] }],
    ["ex-reuse-later", { conceptIds: ["later-concept"], lexemeIds: ["later-verb"] }],
  ]);

  type Fixture = Parameters<typeof derivePracticedIdsByLesson>[0][number];

  const planA1: Fixture = {
    id: "a-1",
    moduleId: "mod-a",
    order: 1,
    exampleIds: ["ex-intro-a"],
    introducedConceptIds: ["topic-wa"],
    introducedLexemeIds: ["iku"],
  };
  const planA2: Fixture = {
    id: "a-2",
    moduleId: "mod-a",
    order: 2,
    exampleIds: ["ex-reuse-topic"],
    introducedConceptIds: [],
    introducedLexemeIds: [],
  };
  const planB1: Fixture = {
    id: "b-1",
    moduleId: "mod-b",
    order: 1,
    exampleIds: ["ex-reuse-later"],
    introducedConceptIds: ["later-concept"],
    introducedLexemeIds: ["later-verb"],
  };

  it("derives identical practiced sets no matter how the plans array is ordered", () => {
    const canonicalOrder = [planA1, planA2, planB1];
    const reversed = [planB1, planA2, planA1];
    const shuffled = [planA2, planB1, planA1];

    const fromCanonical = derivePracticedIdsByLesson(
      canonicalOrder,
      moduleOrderById,
      examplesById,
    );
    const fromReversed = derivePracticedIdsByLesson(
      reversed,
      moduleOrderById,
      examplesById,
    );
    const fromShuffled = derivePracticedIdsByLesson(
      shuffled,
      moduleOrderById,
      examplesById,
    );

    for (const plan of canonicalOrder) {
      expect(fromReversed.get(plan.id)).toEqual(fromCanonical.get(plan.id));
      expect(fromShuffled.get(plan.id)).toEqual(fromCanonical.get(plan.id));
    }

    // a-2 practices topic-wa/iku because module-a lesson 1 introduced them
    // earlier in canonical (module, order) terms — true regardless of the
    // plans array's own iteration order.
    expect(fromCanonical.get("a-2")).toEqual({
      concepts: ["topic-wa"],
      lexemes: ["iku"],
    });
    // b-1 does NOT practice later-concept/later-verb from its own example —
    // it introduces them itself this lesson, so same-lesson doesn't count.
    expect(fromCanonical.get("b-1")).toEqual({ concepts: [], lexemes: [] });
  });

  it("filters an explicit review id that has not been canonically introduced yet", () => {
    const planWithPrematureReview: Fixture = {
      ...planA2,
      exampleIds: [],
      reviewConceptIds: ["topic-wa", "later-concept"],
      reviewLexemeIds: ["iku", "later-verb"],
    };
    const result = derivePracticedIdsByLesson(
      [planA1, planWithPrematureReview, planB1],
      moduleOrderById,
      examplesById,
    );
    // topic-wa/iku were introduced earlier (a-1) so the review claim is honored;
    // later-concept/later-verb are introduced later (b-1) so the review claim
    // is rejected even though it was explicitly authored.
    expect(result.get("a-2")).toEqual({
      concepts: ["topic-wa"],
      lexemes: ["iku"],
    });
  });

  it("wires the real curriculum through the same canonical helper (no drift between production and the pure deriver)", () => {
    const moduleOrders = new Map(
      curriculumFoundation.modules.map((module) => [module.id, module.order]),
    );
    const rederived = derivePracticedIdsByLesson(
      lessonPlans.map((plan) => ({
        id: plan.id,
        moduleId: plan.moduleId,
        order: plan.order,
        exampleIds: [
          plan.baseExampleId,
          plan.changedExampleId,
          plan.guidedExampleId,
          ...plan.extraExampleIds,
        ],
        introducedConceptIds: plan.introducedConceptIds,
        introducedLexemeIds: plan.introducedLexemeIds,
        reviewConceptIds: plan.reviewConceptIds,
        reviewLexemeIds: plan.reviewLexemeIds,
      })),
      moduleOrders,
      curriculumExamplesById,
    );
    for (const lesson of curriculumLessons) {
      const derived = rederived.get(lesson.id);
      expect(derived).toBeDefined();
      expect([...(derived?.concepts ?? [])].sort()).toEqual(
        [...lesson.practicedConceptIds].sort(),
      );
      expect([...(derived?.lexemes ?? [])].sort()).toEqual(
        [...lesson.practicedLexemeIds].sort(),
      );
    }
  });
});

describe("genuine verb reuse (spec §6.1, §6.3)", () => {
  const result = validateCurriculum(assembledCurriculum, {
    enforceReleaseTargets: true,
  });

  it("has at least 35 genuinely reused verbs", () => {
    expect(result.coverage.reusedVerbIds.length).toBeGreaterThanOrEqual(35);
  });

  it("gives each reused verb four authored examples across three modules", () => {
    for (const verbId of result.coverage.reusedVerbIds) {
      expect(result.coverage.authoredExampleCounts[verbId]).toBeGreaterThanOrEqual(
        4,
      );
      expect(result.coverage.laterReuseModules[verbId].length).toBeGreaterThanOrEqual(
        2,
      );
    }
  });
});

describe("capstones synthesize without introducing (spec §5.2, §6.2)", () => {
  const capstones = curriculumLessons.filter((lesson) => lesson.capstone);

  it("declares exactly the three named assessed capstones", () => {
    expect(capstones.map((lesson) => lesson.id).sort()).toEqual(
      [...CAPSTONE_LESSON_IDS].sort(),
    );
  });

  it("introduces no concept, lexeme, or verb in any capstone", () => {
    for (const lesson of capstones) {
      expect(lesson.introducedConceptIds).toEqual([]);
      expect(lesson.introducedLexemeIds).toEqual([]);
    }
  });

  it("reuses at least twenty distinct verbs across the three capstones", () => {
    const reused = new Set<string>();
    for (const lesson of capstones) {
      for (const lexemeId of lesson.practicedLexemeIds) {
        if (isVerb(lexemeId)) reused.add(lexemeId);
      }
      for (const exampleId of lesson.exampleIds) {
        const example = curriculumExamplesById.get(exampleId);
        for (const lexemeId of example?.lexemeIds ?? []) {
          if (isVerb(lexemeId)) reused.add(lexemeId);
        }
      }
    }
    expect(reused.size).toBeGreaterThanOrEqual(20);
  });
});

describe("script policy (spec §7)", () => {
  it("never requires kanji output in a lesson or example", () => {
    for (const lesson of curriculumLessons) {
      expect(lesson.requiredAnswerScript).not.toBe("kanji");
      expect(lesson.requiresKanjiOutput).not.toBe(true);
    }
    for (const example of curriculumExamples) {
      expect(example.jp).not.toMatch(KANJI);
    }
  });

  it("assists every katakana lexeme at its first appearance", () => {
    const exposed = new Set<string>();
    for (const lesson of orderedCurriculumLessons) {
      const used = [
        ...lesson.introducedLexemeIds,
        ...lesson.practicedLexemeIds,
        ...lesson.assessedLexemeIds,
      ];
      const assisted = new Set(lesson.assistedKatakanaLexemeIds ?? []);
      for (const id of used) {
        const lexeme = lexiconById.get(id);
        if (lexeme?.script !== "katakana") continue;
        if (exposed.has(id)) continue;
        expect(lesson.introducedLexemeIds.includes(id)).toBe(true);
        expect(assisted.has(id)).toBe(true);
        expect((lexeme.reading ?? "").length).toBeGreaterThan(0);
        exposed.add(id);
      }
    }
    // Every katakana lexeme is reached and assisted somewhere.
    const katakana = [...lexiconById.values()].filter(
      (entry) => entry.script === "katakana",
    );
    for (const entry of katakana) {
      expect(exposed.has(entry.id)).toBe(true);
    }
  });

  it("opens the katakana bridge in Module 1", () => {
    const module1 = curriculumModules.find((module) => module.id === "sounds");
    const bridge = module1?.coverage.firstKatakanaExposureIds ?? [];
    const module1Katakana = lexemesByIntroModule[0]
      .filter((entry) => entry.script === "katakana")
      .map((entry) => entry.id);
    expect([...bridge].sort()).toEqual([...module1Katakana].sort());
    expect(bridge.length).toBe(10);
  });
});

describe("shared examples and speech prompts (spec §5.3, §9.1)", () => {
  it("resolves every lesson example to the shared catalog", () => {
    for (const lesson of curriculumLessons) {
      expect(lesson.exampleIds.length).toBeGreaterThan(0);
      for (const exampleId of lesson.exampleIds) {
        expect(curriculumExamplesById.has(exampleId)).toBe(true);
      }
    }
  });

  it("references only catalog lexemes and concepts from examples", () => {
    const conceptIds = new Set(concepts.map((concept) => concept.id));
    for (const example of curriculumExamples) {
      for (const lexemeId of example.lexemeIds) {
        expect(lexiconById.has(lexemeId)).toBe(true);
      }
      for (const conceptId of example.conceptIds) {
        expect(conceptIds.has(conceptId)).toBe(true);
      }
    }
  });

  it("keeps every example a unique kana-only Japanese literal", () => {
    const seenJp = new Set<string>();
    for (const example of curriculumExamples) {
      expect(example.jp.length).toBeGreaterThan(0);
      expect(example.jp).toMatch(KANA);
      expect(seenJp.has(example.jp)).toBe(false);
      seenJp.add(example.jp);
    }
  });

  it("gives every lesson a base/changed comparison, a guided build, and a spoken target", () => {
    for (const plan of lessonPlans) {
      expect(plan.baseExampleId).not.toBe(plan.changedExampleId);
      expect(curriculumExamplesById.has(plan.baseExampleId)).toBe(true);
      expect(curriculumExamplesById.has(plan.changedExampleId)).toBe(true);
      expect(curriculumExamplesById.has(plan.guidedExampleId)).toBe(true);
      const lesson = curriculumLessons.find((entry) => entry.id === plan.id);
      expect(lesson?.exampleIds).toEqual(
        expect.arrayContaining([
          plan.baseExampleId,
          plan.changedExampleId,
          plan.guidedExampleId,
        ]),
      );
    }
  });

  it("provides exactly one valid speech prompt per lesson", () => {
    expect(speechPrompts).toHaveLength(curriculumLessons.length);
    const promptIds = new Set(speechPrompts.map((prompt) => prompt.id));
    expect(promptIds.size).toBe(speechPrompts.length);
    for (const lesson of curriculumLessons) {
      const prompt = speechPrompts.find(
        (entry) => entry.id === lesson.speechPromptId,
      );
      expect(prompt).toBeDefined();
      if (!prompt) continue;
      expect(lesson.exampleIds).toContain(prompt.targetExampleId);
      const example = curriculumExamplesById.get(prompt.targetExampleId);
      expect(example).toBeDefined();
      const segmentIds = new Set(
        (example?.segments ?? []).map((segment) => segment.id),
      );
      expect(prompt.criticalSegmentIds?.length).toBeGreaterThan(0);
      for (const segmentId of prompt.criticalSegmentIds ?? []) {
        expect(segmentIds.has(segmentId)).toBe(true);
      }
    }
  });
});

describe("mechanically-checkable concept tags never claim an absent marker (regression: false concept tags)", () => {
  // Nouns that can plausibly be a companion "with" (never a mere list item)
  // when joined by と — curated, not inferred, so the check stays safe against
  // the many legitimate noun-and-noun listing uses of と in this catalog.
  const ANIMATE_COMPANION_LEXEME_IDS = new Set([
    "student",
    "teacher",
    "friend",
    "family",
    "father",
    "mother",
    "child",
    "son",
    "daughter",
    "husband",
    "wife",
    "grandfather",
    "grandmother",
    "person",
  ]);

  function hasParticle(
    example: (typeof curriculumExamples)[number],
    jp: string,
  ): boolean {
    return example.segments.some(
      (segment) => segment.kind === "particle" && segment.jp === jp,
    );
  }

  it("only tags object-o when a segment actually carries を", () => {
    for (const example of curriculumExamples) {
      if (!example.conceptIds.includes("object-o")) continue;
      expect(hasParticle(example, "を")).toBe(true);
    }
  });

  it("only tags question-ka when a segment actually carries か", () => {
    for (const example of curriculumExamples) {
      if (!example.conceptIds.includes("question-ka")) continue;
      expect(hasParticle(example, "か")).toBe(true);
    }
  });

  it("only tags subject-ga when a segment actually carries が", () => {
    for (const example of curriculumExamples) {
      if (!example.conceptIds.includes("subject-ga")) continue;
      expect(hasParticle(example, "が")).toBe(true);
    }
  });

  it("only tags companion-to when と joins a real animate companion, not a noun list", () => {
    for (const example of curriculumExamples) {
      if (!example.conceptIds.includes("companion-to")) continue;
      expect(hasParticle(example, "と")).toBe(true);
      expect(
        example.lexemeIds.some((id) => ANIMATE_COMPANION_LEXEME_IDS.has(id)),
      ).toBe(true);
    }
  });

  it("no longer mistags the four flagged examples (places-2-say, places-3-r1, shopping-3-r6, existence-needs-2-r5)", () => {
    const corrected: readonly [id: string, forbidden: string][] = [
      ["places-2-say", "companion-to"],
      ["places-3-r1", "companion-to"],
      ["shopping-3-r6", "object-o"],
      ["existence-needs-2-r5", "object-o"],
    ];
    for (const [id, forbidden] of corrected) {
      const example = curriculumExamplesById.get(id);
      expect(example).toBeDefined();
      expect(example?.conceptIds).not.toContain(forbidden);
    }
  });
});

describe("bilingual copy parity (spec §9.1, §17.1)", () => {
  it("keeps identical IT and EN key sets", () => {
    const itKeys = Object.keys(curriculumCopy.it).sort();
    const enKeys = Object.keys(curriculumCopy.en).sort();
    expect(itKeys).toEqual(enKeys);
  });

  it("provides title and outcome copy for every module", () => {
    for (const module of curriculumModules) {
      for (const suffix of ["title", "outcome"]) {
        const key = `module.${module.id}.${suffix}`;
        expect(curriculumCopy.it[key]?.length).toBeGreaterThan(0);
        expect(curriculumCopy.en[key]?.length).toBeGreaterThan(0);
      }
    }
  });

  it("provides the full learner-facing key family for every lesson", () => {
    const suffixes = [
      "title",
      "objective",
      "rule",
      "comparison",
      "guided",
      "spoken",
      "recap",
    ];
    for (const lesson of curriculumLessons) {
      for (const suffix of suffixes) {
        const key = `lesson.${lesson.id}.${suffix}`;
        expect(curriculumCopy.it[key]?.length).toBeGreaterThan(0);
        expect(curriculumCopy.en[key]?.length).toBeGreaterThan(0);
      }
    }
  });

  it("provides an intent translation for every example and keeps Japanese out of copy", () => {
    for (const example of curriculumExamples) {
      const key = `example.${example.id}.translation`;
      expect(curriculumCopy.it[key]?.length).toBeGreaterThan(0);
      expect(curriculumCopy.en[key]?.length).toBeGreaterThan(0);
    }
    for (const value of [
      ...Object.values(curriculumCopy.it),
      ...Object.values(curriculumCopy.en),
    ]) {
      expect(value).not.toMatch(KANA);
    }
  });
});

describe("persona and alias hygiene (spec §8)", () => {
  it("finds no forbidden alias in assembled Task 3 content", () => {
    expect(
      validateRuntimeAliases([
        curriculumExamples,
        speechPrompts,
        curriculumModules,
        curriculumLessons,
        curriculumCopy,
      ]),
    ).toEqual([]);
  });

  it("only names Yuki, Ken, and Mina as personas", () => {
    expect(assembledCurriculum.personas.map((persona) => persona.id)).toEqual(
      genericPersonas.map((persona) => persona.id),
    );
  });
});

/**
 * Slice B Task 3 review remediation. These three suites encode the review
 * findings so a passing release validator cannot mask a bare-list introduction,
 * a blanket "reviews everything" capstone claim, or an unfocused comparison.
 * Reuse and teaching are re-derived from example concept/lexeme references, not
 * from lesson review metadata (spec §6.1, §6.4, §5.3).
 */

/** The lexemes proven to be taught through a real predicate (nonempty concepts). */
const practicallyTaughtLexemes = (() => {
  const taught = new Set<string>();
  for (const example of curriculumExamples) {
    if (example.conceptIds.length === 0) continue;
    for (const lexemeId of example.lexemeIds) taught.add(lexemeId);
  }
  return taught;
})();

describe("every introduced lexeme is practically taught (spec §6.1, review finding 1)", () => {
  // Module 1 is the phonetic/loanword bridge: its greetings and assisted
  // katakana are taught as sound units in the comparison/guided slots without a
  // grammar gear (spec §5.2, §7), so they carry no concept and are exempt.
  const bridgeLexemes = new Set(
    lexemesByIntroModule[0].map((entry) => entry.id),
  );

  it("teaches every non-bridge introduced lexeme through a predicated example", () => {
    const introduced = new Set<string>();
    for (const lesson of curriculumLessons) {
      for (const id of lesson.introducedLexemeIds) introduced.add(id);
    }
    const listOnly = [...introduced].filter(
      (id) => !bridgeLexemes.has(id) && !practicallyTaughtLexemes.has(id),
    );
    expect(listOnly.sort()).toEqual([]);
  });

  it("gives the eleven review-flagged list-only lexemes a real taught concept", () => {
    const flagged = [
      "next-month",
      "this-week",
      "this-month",
      "this-year",
      "mother",
      "older-sister",
      "younger-sister",
      "man",
      "woman",
      "price",
      "clothes",
    ];
    for (const id of flagged) {
      expect(practicallyTaughtLexemes.has(id)).toBe(true);
    }
  });
});

describe("practical gears earn later example reuse (spec §6.4, review finding 2)", () => {
  const PRACTICAL_GEARS = [
    "negative-masen",
    "past-negative-masendeshita",
    "comparison",
    "adjective-past",
    "request-kudasai",
    "desire-tai",
    "offer-mashouka",
  ] as const;

  function introductionIndex(conceptId: string): number {
    return orderedCurriculumLessons.findIndex((lesson) =>
      lesson.introducedConceptIds.includes(conceptId),
    );
  }

  function hasLaterRealExample(conceptId: string, introIndex: number): boolean {
    return orderedCurriculumLessons
      .slice(introIndex + 1)
      .some((lesson) =>
        lesson.exampleIds.some((exampleId) =>
          curriculumExamplesById.get(exampleId)?.conceptIds.includes(conceptId),
        ),
      );
  }

  it("reuses each practical gear in a later real example, not just review metadata", () => {
    for (const gear of PRACTICAL_GEARS) {
      const introIndex = introductionIndex(gear);
      expect(introIndex).toBeGreaterThanOrEqual(0);
      expect(hasLaterRealExample(gear, introIndex)).toBe(true);
    }
  });

  it("does not blanket-claim every concept in the capstone orientation metadata", () => {
    const orientation = lessonPlans.find(
      (plan) => plan.id === "capstones-orientation",
    );
    expect(orientation).toBeDefined();
    const reviewed = new Set(orientation?.reviewConceptIds ?? []);
    // The blanket set claimed all 34 concepts; an honest review names only the
    // structural gears it truly retrieves beyond its examples.
    expect(reviewed.size).toBeLessThan(concepts.length);
    for (const gear of PRACTICAL_GEARS) {
      expect(reviewed.has(gear)).toBe(false);
    }
  });
});

describe("explicit comparisons declare a focused delta (spec §5.3, review finding 3)", () => {
  const FOCUSED_LESSONS = [
    "introductions-1",
    "shopping-3",
    "descriptions-3",
  ] as const;

  function planFor(id: string) {
    const plan = lessonPlans.find((entry) => entry.id === id);
    expect(plan).toBeDefined();
    return plan!;
  }

  it("keeps each flagged base/changed pair a single focused contrast", () => {
    for (const lessonId of FOCUSED_LESSONS) {
      const plan = planFor(lessonId);
      const base = curriculumExamplesById.get(plan.baseExampleId);
      const changed = curriculumExamplesById.get(plan.changedExampleId);
      expect(base).toBeDefined();
      expect(changed).toBeDefined();
      const baseLex = new Set(base?.lexemeIds ?? []);
      const changedLex = new Set(changed?.lexemeIds ?? []);
      const shared = [...baseLex].filter((id) => changedLex.has(id));
      const onlyBase = [...baseLex].filter((id) => !changedLex.has(id));
      const onlyChanged = [...changedLex].filter((id) => !baseLex.has(id));
      // A focused comparison keeps a stable frame (a shared content word)…
      expect(shared.length).toBeGreaterThanOrEqual(1);
      // …and swaps a bounded delta (at most one content word on each side).
      expect(onlyBase.length).toBeLessThanOrEqual(1);
      expect(onlyChanged.length).toBeLessThanOrEqual(1);
    }
  });

  it("aligns each pair with its declared delta and shared frame", () => {
    // introductions-1: only the topic changes (I → you); the predicate stays.
    const intro = planFor("introductions-1");
    const introBase = curriculumExamplesById.get(intro.baseExampleId);
    const introChanged = curriculumExamplesById.get(intro.changedExampleId);
    expect(introBase?.lexemeIds).toContain("student");
    expect(introChanged?.lexemeIds).toContain("student");
    expect(introBase?.lexemeIds).toContain("i");
    expect(introChanged?.lexemeIds).toContain("you");

    // shopping-3: only the verb changes (open → close); the place stays.
    const shop = planFor("shopping-3");
    const shopBase = curriculumExamplesById.get(shop.baseExampleId);
    const shopChanged = curriculumExamplesById.get(shop.changedExampleId);
    expect(shopBase?.lexemeIds).toContain("open");
    expect(shopChanged?.lexemeIds).toContain("close");
    const shopShared = (shopBase?.lexemeIds ?? []).filter((id) =>
      (shopChanged?.lexemeIds ?? []).includes(id),
    );
    expect(shopShared.length).toBeGreaterThanOrEqual(1);

    // descriptions-3: both halves compare the same pair; only the adjective flips.
    const desc = planFor("descriptions-3");
    const descBase = curriculumExamplesById.get(desc.baseExampleId);
    const descChanged = curriculumExamplesById.get(desc.changedExampleId);
    expect(descBase?.conceptIds).toContain("comparison");
    expect(descChanged?.conceptIds).toContain("comparison");
    const descShared = (descBase?.lexemeIds ?? []).filter((id) =>
      (descChanged?.lexemeIds ?? []).includes(id),
    );
    expect(descShared.length).toBeGreaterThanOrEqual(1);
  });
});
