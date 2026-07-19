/**
 * A2 Module 9 (shopping-returns) — module-local depth gate (Phase 3 Task 6).
 *
 * Four instructional lessons: sr1 comparison intro のほうが/より (nothing
 * before this lesson ever uses comparison grammar — the corrected
 * authoritative spiral), sr2 superlative いちばん, sr3 ask-price-decide
 * (comparison controlled practice + opinion/possibility transfer), sr4
 * return-exchange (reason-kara/reason-node recurrence). Mirrors Module 1-8's
 * rigor: assembles a real foundation catalog from the actual release data,
 * realizes every instructional variant through the shared realizer, and
 * asserts the exact depth contract — 8-12 models, 10 exercises (5+5), >=3
 * predicate senses, >=3 discourse roles, >=2 contexts, >=5 unique visible
 * targets (reuse <=2).
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
import { module9Lessons, module9Recipe } from "./module09ShoppingReturns";

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

describe("A2 Module 9 (shopping-returns) — exactly 4 lessons, canonical order", () => {
  it("declares exactly shopping-returns-1..4 in order 1..4", () => {
    expect(module9Lessons.map((b) => b.recipe.id)).toEqual([
      "shopping-returns-1",
      "shopping-returns-2",
      "shopping-returns-3",
      "shopping-returns-4",
    ]);
    expect(module9Lessons.map((b) => b.recipe.order)).toEqual([1, 2, 3, 4]);
    expect(module9Lessons.every((b) => b.recipe.moduleId === "shopping-returns")).toBe(true);
  });

  it("declares the exact primary/support Can-do mapping for M9", () => {
    const expected: Readonly<Record<string, { primary: string; supports: readonly string[] }>> = {
      "shopping-returns-1": { primary: "a2-cando-compare", supports: [] },
      "shopping-returns-2": { primary: "a2-cando-compare", supports: [] },
      "shopping-returns-3": {
        primary: "a2-cando-ask-price-decide",
        supports: ["a2-cando-opinion-toomou", "a2-cando-possibility"],
      },
      "shopping-returns-4": { primary: "a2-cando-return-exchange", supports: [] },
    };
    for (const built of module9Lessons) {
      expect(built.recipe.primaryCanDoId).toBe(expected[built.recipe.id].primary);
      expect(built.recipe.supportingCanDoIds).toEqual(expected[built.recipe.id].supports);
      expect(built.recipe.supportingCanDoIds.length).toBeLessThanOrEqual(2);
    }
  });

  it("declares module9Recipe with the exact 4 lesson ids", () => {
    expect(module9Recipe.lessonIds).toEqual([...module9Lessons.map((b) => b.recipe.id)]);
  });
});

describe("A2 Module 9 — per-lesson depth contract", () => {
  it.each(module9Lessons.map((b) => [b.recipe.id, b] as const))(
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

describe("A2 Module 9 — kanji exposure wiring", () => {
  it.each(module9Lessons.map((b) => [b.recipe.id, b] as const))(
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

  it("sr1 includes exactly the 4 new first-supported glyphs (買店円番)", () => {
    const sr1 = module9Lessons[0];
    const firstSupported = sr1.recipe.kanjiExposureIds.filter(
      (id) => A2_KANJI_EXPOSURES.find((e) => e.id === id)?.stage === "first-supported",
    );
    expect(firstSupported).toHaveLength(4);
  });

  it("sr2 includes exactly the 4 new first-supported glyphs (千万安高)", () => {
    const sr2 = module9Lessons[1];
    const firstSupported = sr2.recipe.kanjiExposureIds.filter(
      (id) => A2_KANJI_EXPOSURES.find((e) => e.id === id)?.stage === "first-supported",
    );
    expect(firstSupported).toHaveLength(4);
  });
});

describe("A2 Module 9 — comparison/superlative spiral: nothing before sr1 uses のほうが/より/いちばん", () => {
  it("sr1 introduces comparison — no prior module content is reachable from this file, so this pins sr1's own exact realized forms instead", () => {
    const sr1 = module9Lessons[0];
    for (const v of sr1.variants) {
      const sentence = realize(v);
      expect(sentence.canonicalJapanese).toContain("より");
      expect(sentence.canonicalJapanese).toContain("のほうが");
      expect(sentence.canonicalJapanese).not.toContain("いちばん");
    }
  });

  it("sr2 uses いちばん (superlative) and never より/のほうが (comparison is a distinct, earlier-introduced construction)", () => {
    const sr2 = module9Lessons[1];
    for (const v of sr2.variants) {
      const sentence = realize(v);
      expect(sentence.canonicalJapanese).toContain("いちばん");
      expect(sentence.canonicalJapanese).not.toContain("より");
      expect(sentence.canonicalJapanese).not.toContain("のほうが");
    }
  });
});

describe("A2 Module 9 — exact realized Japanese/rōmaji for the new comparison/superlative families", () => {
  it("shopping-returns-1-m1 realizes to natural favor-marked comparison かばんのほうがくつよりやすいです", () => {
    const sr1 = module9Lessons[0];
    const m1 = sr1.variants.find((v) => v.id === "shopping-returns-1-m1");
    expect(m1, "shopping-returns-1-m1").toBeDefined();
    const sentence = realize(m1 as SentenceVariant);
    expect(sentence.canonicalJapanese).toBe("かばんのほうがくつよりやすいです");
    const romaji = formatRomaji(sentence.tokens);
    expect(romaji.ok).toBe(true);
    if (!romaji.ok) throw new Error("unreachable");
    expect(romaji.text).toBe("kaban no hou ga kutsu yori yasui desu");
  });

  it("shopping-returns-2-m1 realizes to natural superlative かばんがいちばんやすいです", () => {
    const sr2 = module9Lessons[1];
    const m1 = sr2.variants.find((v) => v.id === "shopping-returns-2-m1");
    expect(m1, "shopping-returns-2-m1").toBeDefined();
    const sentence = realize(m1 as SentenceVariant);
    expect(sentence.canonicalJapanese).toBe("かばんがいちばんやすいです");
    const romaji = formatRomaji(sentence.tokens);
    expect(romaji.ok).toBe(true);
    if (!romaji.ok) throw new Error("unreachable");
    expect(romaji.text).toBe("kaban ga ichiban yasui desu");
  });
});

describe("A2 Module 9 — connected shopping dialogue (no isolated drill)", () => {
  it("sr3 mixes genuine price/decision phrases with comparison controlled practice", () => {
    const sr3 = module9Lessons[2];
    const models = sr3.variants.filter((v) => v.pedagogicalUse === "model");
    const families = new Set(models.map((v) => v.sentenceFamilyId));
    expect(families.has("a2-family-ask-price-decide")).toBe(true);
    expect(families.has("a2-family-comparison-favor")).toBe(true);
  });

  it("sr4 recurs reason-kara/reason-node alongside its own return-exchange content", () => {
    const sr4 = module9Lessons[3];
    const models = sr4.variants.filter((v) => v.pedagogicalUse === "model");
    const families = new Set(models.map((v) => v.sentenceFamilyId));
    expect(families.has("a2-family-return-exchange")).toBe(true);
    expect(families.has("a2-family-reason-kara")).toBe(true);
    expect(families.has("a2-family-reason-node")).toBe(true);
  });
});

describe("A2 Module 9 — exact realized Japanese/rōmaji spot checks", () => {
  it("realizes every module-9 instructional variant through the shared formatter with no errors", () => {
    for (const built of module9Lessons) {
      for (const variant of built.variants) {
        const sentence = realize(variant);
        const romaji = formatRomaji(sentence.tokens);
        expect(romaji.ok, `${variant.id} romaji`).toBe(true);
      }
    }
  });
});

describe("A2 Module 9 — bilingual copy coverage", () => {
  it("every model+transfer variant has an EN and IT translation entry", () => {
    for (const built of module9Lessons) {
      for (const variant of built.variants) {
        const translationKey = `${variant.id}-translation`;
        expect(built.en[translationKey], `${variant.id} en`).toBeTruthy();
        expect(built.it[translationKey], `${variant.id} it`).toBeTruthy();
      }
    }
  });

  it("has no Japanese literal in any EN/IT copy value", () => {
    const JAPANESE_PATTERN = /[\u3040-\u30ff\u4e00-\u9fff]/;
    for (const built of module9Lessons) {
      for (const value of [...Object.values(built.en), ...Object.values(built.it)]) {
        expect(JAPANESE_PATTERN.test(value), value).toBe(false);
      }
    }
  });
});
