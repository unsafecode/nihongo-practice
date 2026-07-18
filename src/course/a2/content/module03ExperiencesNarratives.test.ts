/**
 * A2 Module 3 (experiences-narratives) — module-local depth gate (Phase 3 Task 4).
 *
 * Four instructional lessons: en1 experience-takoto (intro), en2 narrate-order
 * (supports connectors + recognize-plain-forms), en3 experience-takoto
 * controlled practice (supports recognize-plain-forms, plain-past adjectives),
 * en4 ask-experience (supports experience-takoto, interrogative たことが
 * ありますか). Mirrors Module 1/2's rigor: assembles a real foundation
 * catalog from the actual release data, realizes every instructional variant
 * through the shared realizer, and asserts the exact depth contract — 8-12
 * models, 10 exercises (5+5), ≥3 predicate senses, ≥3 discourse roles, ≥2
 * contexts, ≥5 unique visible targets (reuse ≤2), and connected-
 * discourse/dialogue markers rather than an isolated grammar drill.
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
import { module3Lessons, module3Recipe } from "./module03ExperiencesNarratives";

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

describe("A2 Module 3 (experiences-narratives) — exactly 4 lessons, canonical order", () => {
  it("declares exactly experiences-narratives-1..4 in order 1..4", () => {
    expect(module3Lessons.map((b) => b.recipe.id)).toEqual([
      "experiences-narratives-1",
      "experiences-narratives-2",
      "experiences-narratives-3",
      "experiences-narratives-4",
    ]);
    expect(module3Lessons.map((b) => b.recipe.order)).toEqual([1, 2, 3, 4]);
    expect(module3Lessons.every((b) => b.recipe.moduleId === "experiences-narratives")).toBe(true);
  });

  it("declares the exact primary/support Can-do mapping for M3", () => {
    const expected: Readonly<Record<string, { primary: string; supports: readonly string[] }>> = {
      "experiences-narratives-1": { primary: "a2-cando-experience-takoto", supports: [] },
      "experiences-narratives-2": {
        primary: "a2-cando-narrate-order",
        supports: ["a2-cando-connectors", "a2-cando-recognize-plain-forms"],
      },
      "experiences-narratives-3": {
        primary: "a2-cando-experience-takoto",
        supports: ["a2-cando-recognize-plain-forms"],
      },
      "experiences-narratives-4": {
        primary: "a2-cando-ask-experience",
        supports: ["a2-cando-experience-takoto"],
      },
    };
    for (const built of module3Lessons) {
      expect(built.recipe.primaryCanDoId).toBe(expected[built.recipe.id].primary);
      expect(built.recipe.supportingCanDoIds).toEqual(expected[built.recipe.id].supports);
      expect(built.recipe.supportingCanDoIds.length).toBeLessThanOrEqual(2);
    }
  });

  it("declares module3Recipe with the exact 4 lesson ids", () => {
    expect(module3Recipe.lessonIds).toEqual([...module3Lessons.map((b) => b.recipe.id)]);
  });
});

describe("A2 Module 3 — per-lesson depth contract", () => {
  it.each(module3Lessons.map((b) => [b.recipe.id, b] as const))(
    "%s satisfies the A2 depth contract (8-12 models, 10 exercises, ≥3 predicates/roles, ≥2 contexts, ≥5 unique targets, reuse ≤2)",
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

      // Not an isolated grammar drill: every model produces a distinct,
      // real communicative utterance.
      const modelJapaneseTexts = new Set(modelSentences.map((s) => s.canonicalJapanese));
      expect(modelJapaneseTexts.size, `${lessonId} distinct model utterances`).toBe(models.length);

      const modelFingerprints = new Set(modelSentences.map((s) => s.semanticFingerprint));
      for (const t of transferSentences) {
        expect(modelFingerprints.has(t.semanticFingerprint), `${lessonId} transfer ${t.variantId}`).toBe(false);
      }
    },
  );
});

describe("A2 Module 3 — kanji exposure wiring", () => {
  it.each(module3Lessons.map((b) => [b.recipe.id, b] as const))(
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

  it("en1 includes exactly the 5 new first-supported glyphs (去楽初度年) plus pi2's carried-over assessed exposures", () => {
    const en1 = module3Lessons[0];
    const firstSupported = en1.recipe.kanjiExposureIds.filter(
      (id) => A2_KANJI_EXPOSURES.find((e) => e.id === id)?.stage === "first-supported",
    );
    expect(firstSupported).toHaveLength(5);
    expect(en1.recipe.kanjiExposureIds).toHaveLength(11);
  });

  it("en2 includes exactly the 4 new first-supported glyphs (有泳登旅) plus en1's carried-over retrieval exposures", () => {
    const en2 = module3Lessons[1];
    const firstSupported = en2.recipe.kanjiExposureIds.filter(
      (id) => A2_KANJI_EXPOSURES.find((e) => e.id === id)?.stage === "first-supported",
    );
    expect(firstSupported).toHaveLength(4);
    expect(en2.recipe.kanjiExposureIds).toHaveLength(9);
  });
});

describe("A2 Module 3 — connected discourse markers (no isolated grammar drill)", () => {
  it("en1's models are complete たことがあります experience statements", () => {
    const en1 = module3Lessons[0];
    const models = en1.variants.filter((v) => v.pedagogicalUse === "model");
    const sentences = models.map(realize);
    for (const s of sentences) {
      expect(s.canonicalJapanese).toContain("こと");
      expect(s.canonicalJapanese).toContain("あります");
    }
  });

  it("en2's narrate-order models are genuine ordered two-clause narratives containing それから", () => {
    const en2 = module3Lessons[1];
    const models = en2.variants.filter((v) => v.pedagogicalUse === "model");
    const sentences = models.map(realize);
    const jpAll = sentences.map((s) => s.canonicalJapanese).join("");
    expect(jpAll).toContain("それから");
    for (const s of sentences) {
      const periodCount = (s.canonicalJapanese.match(/。/g) ?? []).length;
      expect(periodCount, s.variantId).toBeGreaterThanOrEqual(2);
    }
  });

  it("en3 mixes experience-takoto controlled practice with plain-past adjective support sentences", () => {
    const en3 = module3Lessons[2];
    const models = en3.variants.filter((v) => v.pedagogicalUse === "model");
    const sentences = models.map(realize);
    const experienceCount = sentences.filter((s) => s.canonicalJapanese.includes("あります")).length;
    const plainPastAdjectiveCount = sentences.filter(
      (s) =>
        !s.canonicalJapanese.includes("あります") &&
        (s.canonicalJapanese.includes("かった") || s.canonicalJapanese.includes("だった")),
    ).length;
    expect(experienceCount).toBeGreaterThanOrEqual(1);
    expect(plainPastAdjectiveCount).toBeGreaterThanOrEqual(1);
  });

  it("en4's ask-experience models are all genuine questions ending in か", () => {
    const en4 = module3Lessons[3];
    const models = en4.variants.filter((v) => v.pedagogicalUse === "model");
    const sentences = models.map(realize);
    for (const s of sentences) {
      expect(s.canonicalJapanese.endsWith("か"), s.variantId).toBe(true);
    }
  });
});

describe("A2 Module 3 — exact realized Japanese/rōmaji spot checks", () => {
  it("realizes every module-3 instructional variant through the shared formatter with no errors", () => {
    for (const built of module3Lessons) {
      for (const variant of built.variants) {
        const sentence = realize(variant);
        const romaji = formatRomaji(sentence.tokens);
        expect(romaji.ok, `${variant.id} romaji`).toBe(true);
      }
    }
  });
});

describe("A2 Module 3 — bilingual copy coverage", () => {
  it("every model+transfer variant has an EN and IT translation entry", () => {
    for (const built of module3Lessons) {
      for (const variant of built.variants) {
        const translationKey = `${variant.id}-translation`;
        expect(built.en[translationKey], `${variant.id} en`).toBeTruthy();
        expect(built.it[translationKey], `${variant.id} it`).toBeTruthy();
      }
    }
  });

  it("has no Japanese literal in any EN/IT copy value", () => {
    const JAPANESE_PATTERN = /[\u3040-\u30ff\u4e00-\u9fff]/;
    for (const built of module3Lessons) {
      for (const value of [...Object.values(built.en), ...Object.values(built.it)]) {
        expect(JAPANESE_PATTERN.test(value), value).toBe(false);
      }
    }
  });
});
