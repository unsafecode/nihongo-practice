/**
 * A2 Module 13 (relationships-events) — module-local depth gate (Phase 3
 * Task 7).
 *
 * Four instructional lessons: re1 family-relations (natural family/friend
 * description + existence — no support), re2 give-receive (あげる/もらう/くれる,
 * correct giver/receiver particles and perspective — no support), re3
 * events-celebrations (celebrating an event, with BOTH ongoing-teiru and
 * experience-takoto true recurrence), re4 choose-gift (deciding on a gift,
 * with reason-kara true transfer). Mirrors Module 1-12's rigor: assembles a
 * real foundation catalog from the actual release data, realizes every
 * instructional variant through the shared realizer, and asserts the exact
 * depth contract — 8-12 models, 10 exercises (5+5), >=3 predicate senses,
 * >=3 discourse roles, >=2 contexts, >=5 unique visible targets (reuse <=2).
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
import { module13Lessons, module13Recipe } from "./module13RelationshipsEvents";

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

describe("A2 Module 13 (relationships-events) — exactly 4 lessons, canonical order", () => {
  it("declares exactly relationships-events-1..4 in order 1..4", () => {
    expect(module13Lessons.map((b) => b.recipe.id)).toEqual([
      "relationships-events-1",
      "relationships-events-2",
      "relationships-events-3",
      "relationships-events-4",
    ]);
    expect(module13Lessons.map((b) => b.recipe.order)).toEqual([1, 2, 3, 4]);
    expect(module13Lessons.every((b) => b.recipe.moduleId === "relationships-events")).toBe(true);
  });

  it("declares the exact primary/support Can-do mapping for M13", () => {
    const expected: Readonly<Record<string, { primary: string; supports: readonly string[] }>> = {
      "relationships-events-1": { primary: "a2-cando-family-relations", supports: [] },
      "relationships-events-2": { primary: "a2-cando-give-receive", supports: [] },
      "relationships-events-3": {
        primary: "a2-cando-events-celebrations",
        supports: ["a2-cando-ongoing-teiru", "a2-cando-experience-takoto"],
      },
      "relationships-events-4": {
        primary: "a2-cando-choose-gift",
        supports: ["a2-cando-reason-kara"],
      },
    };
    for (const built of module13Lessons) {
      expect(built.recipe.primaryCanDoId).toBe(expected[built.recipe.id].primary);
      expect(built.recipe.supportingCanDoIds).toEqual(expected[built.recipe.id].supports);
      expect(built.recipe.supportingCanDoIds.length).toBeLessThanOrEqual(2);
    }
  });

  it("declares module13Recipe with the exact 4 lesson ids", () => {
    expect(module13Recipe.lessonIds).toEqual([...module13Lessons.map((b) => b.recipe.id)]);
  });
});

describe("A2 Module 13 — per-lesson depth contract", () => {
  it.each(module13Lessons.map((b) => [b.recipe.id, b] as const))(
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

describe("A2 Module 13 — kanji exposure wiring", () => {
  it.each(module13Lessons.map((b) => [b.recipe.id, b] as const))(
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

  it("re1 includes exactly the 4 new first-supported glyphs (母父家族)", () => {
    const re1 = module13Lessons[0];
    const firstSupported = re1.recipe.kanjiExposureIds.filter(
      (id) => A2_KANJI_EXPOSURES.find((e) => e.id === id)?.stage === "first-supported",
    );
    expect(firstSupported).toHaveLength(4);
  });

  it("re2 includes exactly the 4 new first-supported glyphs (結婚誕送)", () => {
    const re2 = module13Lessons[1];
    const firstSupported = re2.recipe.kanjiExposureIds.filter(
      (id) => A2_KANJI_EXPOSURES.find((e) => e.id === id)?.stage === "first-supported",
    );
    expect(firstSupported).toHaveLength(4);
  });
});

describe("A2 Module 13 — re3's genuine ongoing-teiru + experience-takoto true recurrence", () => {
  it("declares exactly the 2 supporting Can-dos (ongoing-teiru, experience-takoto)", () => {
    const re3 = module13Lessons[2];
    expect(re3.recipe.supportingCanDoIds).toEqual(["a2-cando-ongoing-teiru", "a2-cando-experience-takoto"]);
  });

  it("re3 models at least one a2-family-ongoing-teiru value AND at least one a2-family-experience-takoto value", () => {
    const re3 = module13Lessons[2];
    const models = re3.variants.filter((v) => v.pedagogicalUse === "model");
    expect(models.some((v) => v.sentenceFamilyId === "a2-family-ongoing-teiru")).toBe(true);
    expect(models.some((v) => v.sentenceFamilyId === "a2-family-experience-takoto")).toBe(true);
  });
});

describe("A2 Module 13 — re4's reason-kara true transfer (choose-gift)", () => {
  it("declares exactly the 1 supporting Can-do (reason-kara)", () => {
    const re4 = module13Lessons[3];
    expect(re4.recipe.supportingCanDoIds).toEqual(["a2-cando-reason-kara"]);
  });

  it("re4 has at least one TRANSFER using a2-family-reason-kara", () => {
    const re4 = module13Lessons[3];
    const transfers = re4.variants.filter((v) => v.pedagogicalUse === "transfer");
    expect(transfers.some((v) => v.sentenceFamilyId === "a2-family-reason-kara")).toBe(true);
  });
});

describe("A2 Module 13 — re2's give-receive: correct giver/receiver particles and perspective", () => {
  it("every give-receive model/transfer marks the recipient with に and the gift with を, in that order", () => {
    const re2 = module13Lessons[1];
    const giveReceiveVariants = re2.variants.filter((v) => v.sentenceFamilyId === "a2-family-give-receive");
    expect(giveReceiveVariants.length).toBeGreaterThan(0);
    for (const variant of giveReceiveVariants) {
      const sentence = realize(variant);
      const romaji = formatRomaji(sentence.tokens);
      expect(romaji.ok, variant.id).toBe(true);
      if (!romaji.ok) continue;
      expect(romaji.text, variant.id).toMatch(/ ni .* o (agemasu|moraimasu|kuremasu)/);
    }
  });

  it("uses all three give-receive predicates (ageru, morau, kureru) across its models", () => {
    const re2 = module13Lessons[1];
    const models = re2.variants.filter((v) => v.pedagogicalUse === "model");
    const sentences = models.map(realize);
    const predicates = new Set(sentences.map((s) => s.predicateSenseId));
    expect(predicates.has("a2-sense-ageru")).toBe(true);
    expect(predicates.has("a2-sense-morau")).toBe(true);
    expect(predicates.has("a2-sense-kureru")).toBe(true);
  });
});

describe("A2 Module 13 — re3's ている party rōmaji uses a semantic verb-head boundary (パーティーをしています → 'paatii o shite imasu')", () => {
  // Regression (Phase 3 Task 7 review finding): the する te-form head し(て)
  // is a verb head — a new word after the を particle — so its rōmaji must
  // carry a word boundary (`... o shite imasu`), never glue onto the particle
  // as `... oshite imasu`. Uses the ACTUAL realizer + formatRomaji output.
  const partyVariantIds = ["relationships-events-3-m7", "relationships-events-3-t1"] as const;

  it.each(partyVariantIds)("%s realizes パーティーをしています with 'o shite imasu' (never 'oshite')", (variantId) => {
    const re3 = module13Lessons[2];
    const variant = re3.variants.find((v) => v.id === variantId);
    expect(variant, `${variantId} exists`).toBeDefined();
    const sentence = realize(variant as SentenceVariant);
    expect(sentence.canonicalJapanese).toContain("パーティーをしています");
    const romaji = formatRomaji(sentence.tokens);
    expect(romaji.ok, `${variantId} romaji`).toBe(true);
    if (!romaji.ok) return;
    expect(romaji.text, variantId).toContain("paatii o shite imasu");
    expect(romaji.text, variantId).not.toMatch(/oshite/);
  });
});

describe("A2 Module 13 — exact realized Japanese/rōmaji spot checks", () => {
  it("realizes every module-13 instructional variant through the shared formatter with no errors", () => {
    for (const built of module13Lessons) {
      for (const variant of built.variants) {
        const sentence = realize(variant);
        const romaji = formatRomaji(sentence.tokens);
        expect(romaji.ok, `${variant.id} romaji`).toBe(true);
      }
    }
  });
});

describe("A2 Module 13 — bilingual copy coverage", () => {
  it("every model+transfer variant has an EN and IT translation entry", () => {
    for (const built of module13Lessons) {
      for (const variant of built.variants) {
        const translationKey = `${variant.id}-translation`;
        expect(built.en[translationKey], `${variant.id} en`).toBeTruthy();
        expect(built.it[translationKey], `${variant.id} it`).toBeTruthy();
      }
    }
  });

  it("has no Japanese literal in any EN/IT copy value", () => {
    const JAPANESE_PATTERN = /[\u3040-\u30ff\u4e00-\u9fff]/;
    for (const built of module13Lessons) {
      for (const value of [...Object.values(built.en), ...Object.values(built.it)]) {
        expect(JAPANESE_PATTERN.test(value), value).toBe(false);
      }
    }
  });
});
