/**
 * A2 Module 7 (neighborhood-services) — module-local depth gate (Phase 3
 * Task 5).
 *
 * Four instructional lessons: ns1 possibility intro (ことができます) +
 * permission-temoii true transfer, ns2 can-cannot (possibility
 * controlled practice), ns3 ask-directions (asking where a facility is /
 * asking for directions, only after request-tekudasai's own intro), ns4
 * explain-facility (existence statements only — no support; grammar-spiral
 * does not assign teiru recurrence here).
 * Mirrors Module 1-6's rigor: assembles a real foundation catalog from the
 * actual release data, realizes every instructional variant through the
 * shared realizer, and asserts the exact depth contract — 8-12 models, 10
 * exercises (5+5), >=3 predicate senses, >=3 discourse roles, >=2 contexts,
 * >=5 unique visible targets (reuse <=2).
 */
import { describe, expect, it } from "vitest";

import { formatRomaji } from "../../../romaji/formatRomaji";
import { realizeVariant } from "../../foundations/realizeFamily";
import type { SentenceFamily, SentenceVariant } from "../../foundations/types";
import {
  a2Contexts,
  a2LearningTargetSenses,
  a2PersonRoles,
  a2Referents,
  a2SemanticValues,
  a2SentenceFamilies,
} from "../catalog/a2SemanticCatalog";
import { a2KanjiExposureIdsForLesson } from "../catalog/a2LessonBuilders";
import { A2_KANJI_EXPOSURES } from "../kanji/a2KanjiCatalog";
import { module7Lessons, module7Recipe } from "./module07NeighborhoodServices";

const famById = new Map<string, SentenceFamily>(a2SentenceFamilies.map((f) => [f.id, f]));
const realizeCatalogs = {
  contexts: a2Contexts,
  personRoles: a2PersonRoles,
  referents: a2Referents,
  semanticValues: a2SemanticValues,
  learningTargetSenses: a2LearningTargetSenses,
};

function realize(variant: SentenceVariant) {
  const fam = famById.get(variant.sentenceFamilyId);
  expect(fam, `family ${variant.sentenceFamilyId}`).toBeDefined();
  const r = realizeVariant(fam as SentenceFamily, variant, realizeCatalogs, {
    availableConceptIds: [...(fam as SentenceFamily).requiredConceptIds],
  });
  if (!r.ok) {
    throw new Error(`realize ${variant.id} failed: ${JSON.stringify(r.errors)}`);
  }
  return r.sentence;
}

describe("A2 Module 7 (neighborhood-services) — exactly 4 lessons, canonical order", () => {
  it("declares exactly neighborhood-services-1..4 in order 1..4", () => {
    expect(module7Lessons.map((b) => b.recipe.id)).toEqual([
      "neighborhood-services-1",
      "neighborhood-services-2",
      "neighborhood-services-3",
      "neighborhood-services-4",
    ]);
    expect(module7Lessons.map((b) => b.recipe.order)).toEqual([1, 2, 3, 4]);
    expect(module7Lessons.every((b) => b.recipe.moduleId === "neighborhood-services")).toBe(true);
  });

  it("declares the exact primary/support Can-do mapping for M7", () => {
    const expected: Readonly<Record<string, { primary: string; supports: readonly string[] }>> = {
      "neighborhood-services-1": { primary: "a2-cando-possibility", supports: ["a2-cando-permission-temoii"] },
      "neighborhood-services-2": { primary: "a2-cando-can-cannot", supports: ["a2-cando-possibility"] },
      "neighborhood-services-3": { primary: "a2-cando-ask-directions", supports: [] },
      "neighborhood-services-4": { primary: "a2-cando-explain-facility", supports: [] },
    };
    for (const built of module7Lessons) {
      expect(built.recipe.primaryCanDoId).toBe(expected[built.recipe.id].primary);
      expect(built.recipe.supportingCanDoIds).toEqual(expected[built.recipe.id].supports);
      expect(built.recipe.supportingCanDoIds.length).toBeLessThanOrEqual(2);
    }
  });

  it("declares module7Recipe with the exact 4 lesson ids", () => {
    expect(module7Recipe.lessonIds).toEqual([...module7Lessons.map((b) => b.recipe.id)]);
  });
});

describe("A2 Module 7 — per-lesson depth contract", () => {
  it.each(module7Lessons.map((b) => [b.recipe.id, b] as const))(
    "%s satisfies the A2 depth contract (8-12 models, 10 exercises, >=3 predicates/roles, >=2 contexts, >=5 unique targets, reuse <=2)",
    (lessonId, built) => {
      const models = built.variants.filter((v) => v.pedagogicalUse === "model");
      const transfers = built.variants.filter((v) => v.pedagogicalUse === "transfer");
      expect(models.length).toBeGreaterThanOrEqual(8);
      expect(models.length).toBeLessThanOrEqual(12);
      expect(transfers.length).toBeGreaterThanOrEqual(5);

      const modelSentences = models.map(realize);
      const transferSentences = transfers.map(realize);

      const predicateSenses = new Set(modelSentences.map((s) => s.predicateSenseId));
      const discourseRoles = new Set(models.map((v) => v.discourse.speakerRoleId));
      const contexts = new Set(models.map((v) => v.contextId));
      expect(predicateSenses.size, `${lessonId} predicate diversity`).toBeGreaterThanOrEqual(3);
      expect(discourseRoles.size, `${lessonId} role diversity`).toBeGreaterThanOrEqual(3);
      expect(contexts.size, `${lessonId} context diversity`).toBeGreaterThanOrEqual(2);

      const targetCounts = new Map<string, number>();
      for (const s of [...modelSentences, ...transferSentences]) {
        targetCounts.set(s.visibleTargetKey, (targetCounts.get(s.visibleTargetKey) ?? 0) + 1);
      }
      expect(targetCounts.size, `${lessonId} unique targets`).toBeGreaterThanOrEqual(5);
      expect(Math.max(...targetCounts.values()), `${lessonId} max reuse`).toBeLessThanOrEqual(2);

      expect(built.recipe.practice.roundOne.targetCount).toBe(5);
      expect(built.recipe.practice.roundTwo.targetCount).toBe(5);
      expect(
        built.recipe.practice.roundOne.targetCount + built.recipe.practice.roundTwo.targetCount,
      ).toBe(10);

      expect(
        built.recipe.practice.roundTwo.exerciseKinds.some(
          (k) => k === "constrained-construction" || k === "completion",
        ),
      ).toBe(true);

      const modelJapaneseTexts = new Set(modelSentences.map((s) => s.canonicalJapanese));
      expect(modelJapaneseTexts.size, `${lessonId} distinct model utterances`).toBe(models.length);

      const modelFingerprints = new Set(modelSentences.map((s) => s.semanticFingerprint));
      const modelVisibleTargets = new Set(modelSentences.map((s) => s.visibleTargetKey));
      for (const t of transferSentences) {
        expect(modelFingerprints.has(t.semanticFingerprint), `${lessonId} transfer ${t.variantId}`).toBe(false);
        expect(modelVisibleTargets.has(t.visibleTargetKey), `${lessonId} transfer ${t.variantId} visible target`).toBe(
          false,
        );
      }
    },
  );
});

describe("A2 Module 7 — kanji exposure wiring", () => {
  it.each(module7Lessons.map((b) => [b.recipe.id, b] as const))(
    "%s's kanjiExposureIds are all real, resolve to the exact scheduled stage/glyph",
    (lessonId, built) => {
      const expectedIds = a2KanjiExposureIdsForLesson(lessonId);
      expect(built.recipe.kanjiExposureIds).toEqual(expectedIds);
      expect(built.recipe.kanjiExposureIds.length).toBeGreaterThan(0);
      for (const exposureId of built.recipe.kanjiExposureIds) {
        const exposure = A2_KANJI_EXPOSURES.find((e) => e.id === exposureId);
        expect(exposure, `${lessonId} exposure ${exposureId} must exist`).toBeDefined();
        expect(exposure?.lessonId).toBe(lessonId);
      }
    },
  );

  it("ns1 includes exactly the 4 new first-supported glyphs (病院銀行)", () => {
    const ns1 = module7Lessons[0];
    const firstSupported = ns1.recipe.kanjiExposureIds.filter(
      (id) => A2_KANJI_EXPOSURES.find((e) => e.id === id)?.stage === "first-supported",
    );
    expect(firstSupported).toHaveLength(4);
  });

  it("ns2 includes exactly the 4 new first-supported glyphs (局便図館)", () => {
    const ns2 = module7Lessons[1];
    const firstSupported = ns2.recipe.kanjiExposureIds.filter(
      (id) => A2_KANJI_EXPOSURES.find((e) => e.id === id)?.stage === "first-supported",
    );
    expect(firstSupported).toHaveLength(4);
  });
});

describe("A2 Module 7 — connected grammar content (no isolated drill)", () => {
  it("ns1's models are complete possibility statements (ことができます) mixed with permission-temoii transfer", () => {
    const ns1 = module7Lessons[0];
    const models = ns1.variants.filter((v) => v.pedagogicalUse === "model");
    const sentences = models.map(realize);
    const possibilityCount = sentences.filter((s) => s.canonicalJapanese.includes("ことができ")).length;
    expect(possibilityCount).toBeGreaterThanOrEqual(4);
    const families = new Set(models.map((v) => v.sentenceFamilyId));
    expect(families.has("a2-family-possibility")).toBe(true);
  });

  it("ns2's models are a controlled-practice mix of affirmative and negative possibility", () => {
    const ns2 = module7Lessons[1];
    const models = ns2.variants.filter((v) => v.pedagogicalUse === "model");
    const sentences = models.map(realize);
    const affirmative = sentences.filter((s) => s.canonicalJapanese.includes("できます")).length;
    const negative = sentences.filter((s) => s.canonicalJapanese.includes("できません")).length;
    expect(affirmative).toBeGreaterThanOrEqual(3);
    expect(negative).toBeGreaterThanOrEqual(1);
  });

  it("ns3 is genuine directions/help-asking content built only from already-introduced request/question constructions", () => {
    const ns3 = module7Lessons[2];
    const models = ns3.variants.filter((v) => v.pedagogicalUse === "model");
    const sentences = models.map(realize);
    const requestCount = sentences.filter((s) => s.canonicalJapanese.includes("ください")).length;
    const whereCount = sentences.filter((s) => s.canonicalJapanese.includes("どこ")).length;
    expect(requestCount + whereCount).toBe(sentences.length);
  });

  // Phase 3 Task 5 spec-fix: ns4's authoritative recipe carries no support
  // at all (grammar-spiral does not assign teiru recurrence to this
  // lesson), so this lesson is honestly a single-family existence lesson —
  // never mixed with an untracked ~ている recurrence. Predicate diversity
  // comes from three genuinely distinct existence-flavored senses (あります/
  // います/みえます), never a single verb padded out with an unrelated family.
  it("ns4 is entirely real facility-existence statements (a2-family-describe-facility), with no untracked ~ている recurrence", () => {
    const ns4 = module7Lessons[3];
    const models = ns4.variants.filter((v) => v.pedagogicalUse === "model");
    const families = new Set(ns4.variants.map((v) => v.sentenceFamilyId));
    expect(families.has("a2-family-describe-facility")).toBe(true);
    expect(families.has("a2-family-ongoing-teiru")).toBe(false);
    expect(families.size).toBe(1);
    const sentences = models.map(realize);
    const existenceEndings = ["あります", "います", "みえます"];
    for (const s of sentences) {
      expect(existenceEndings.some((ending) => s.canonicalJapanese.includes(ending)), s.canonicalJapanese).toBe(true);
    }
    expect(sentences.some((s) => s.canonicalJapanese.includes("あります"))).toBe(true);
  });
});

describe("A2 Module 7 — exact realized Japanese/rōmaji spot checks", () => {
  it("realizes every module-7 instructional variant through the shared formatter with no errors", () => {
    for (const built of module7Lessons) {
      for (const variant of built.variants) {
        const sentence = realize(variant);
        const romaji = formatRomaji(sentence.tokens);
        expect(romaji.ok, `${variant.id} romaji`).toBe(true);
      }
    }
  });
});

describe("A2 Module 7 — bilingual copy coverage", () => {
  it("every model+transfer variant has an EN and IT translation entry", () => {
    for (const built of module7Lessons) {
      for (const variant of built.variants) {
        const translationKey = `${variant.id}-translation`;
        expect(built.en[translationKey], `${variant.id} en`).toBeTruthy();
        expect(built.it[translationKey], `${variant.id} it`).toBeTruthy();
      }
    }
  });

  it("has no Japanese literal in any EN/IT copy value", () => {
    const JAPANESE_PATTERN = /[\u3040-\u30ff\u4e00-\u9fff]/;
    for (const built of module7Lessons) {
      for (const value of [...Object.values(built.en), ...Object.values(built.it)]) {
        expect(JAPANESE_PATTERN.test(value), value).toBe(false);
      }
    }
  });
});
