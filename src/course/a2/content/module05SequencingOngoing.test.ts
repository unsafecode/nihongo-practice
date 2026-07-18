/**
 * A2 Module 5 (sequencing-ongoing) — module-local depth gate (Phase 3 Task 5).
 *
 * Four instructional lessons: so1 sequence-te intro (て-form action
 * sequencing), so2 describe-now (sequence-te controlled practice, no
 * premature ongoing intro), so3 describe-ongoing (ている intro), so4
 * morning-routine (sequence-te true transfer + ている controlled practice).
 * Mirrors Module 1-4's rigor: assembles a real foundation catalog from the
 * actual release data, realizes every instructional variant through the
 * shared realizer, and asserts the exact depth contract — 8-12 models, 10
 * exercises (5+5), >=3 predicate senses, >=3 discourse roles, >=2 contexts,
 * >=5 unique visible targets (reuse <=2), and connected morning-routine
 * discourse rather than an isolated grammar drill.
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
import { module5Lessons, module5Recipe } from "./module05SequencingOngoing";

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

describe("A2 Module 5 (sequencing-ongoing) — exactly 4 lessons, canonical order", () => {
  it("declares exactly sequencing-ongoing-1..4 in order 1..4", () => {
    expect(module5Lessons.map((b) => b.recipe.id)).toEqual([
      "sequencing-ongoing-1",
      "sequencing-ongoing-2",
      "sequencing-ongoing-3",
      "sequencing-ongoing-4",
    ]);
    expect(module5Lessons.map((b) => b.recipe.order)).toEqual([1, 2, 3, 4]);
    expect(module5Lessons.every((b) => b.recipe.moduleId === "sequencing-ongoing")).toBe(true);
  });

  it("declares the exact primary/support Can-do mapping for M5", () => {
    const expected: Readonly<Record<string, { primary: string; supports: readonly string[] }>> = {
      "sequencing-ongoing-1": { primary: "a2-cando-sequence-te", supports: [] },
      "sequencing-ongoing-2": { primary: "a2-cando-describe-now", supports: ["a2-cando-sequence-te"] },
      "sequencing-ongoing-3": { primary: "a2-cando-describe-ongoing", supports: ["a2-cando-ongoing-teiru"] },
      "sequencing-ongoing-4": {
        primary: "a2-cando-morning-routine",
        supports: ["a2-cando-sequence-te", "a2-cando-ongoing-teiru"],
      },
    };
    for (const built of module5Lessons) {
      expect(built.recipe.primaryCanDoId).toBe(expected[built.recipe.id].primary);
      expect(built.recipe.supportingCanDoIds).toEqual(expected[built.recipe.id].supports);
      expect(built.recipe.supportingCanDoIds.length).toBeLessThanOrEqual(2);
    }
  });

  it("declares module5Recipe with the exact 4 lesson ids", () => {
    expect(module5Recipe.lessonIds).toEqual([...module5Lessons.map((b) => b.recipe.id)]);
  });
});

describe("A2 Module 5 — per-lesson depth contract", () => {
  it.each(module5Lessons.map((b) => [b.recipe.id, b] as const))(
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
      for (const t of transferSentences) {
        expect(modelFingerprints.has(t.semanticFingerprint), `${lessonId} transfer ${t.variantId}`).toBe(false);
      }

      // I2 spec-fix precedent: transfers must be visibly novel, not just
      // semantically distinct — the same guard modules01to04 enforce.
      const modelVisibleTargets = new Set(modelSentences.map((s) => s.visibleTargetKey));
      for (const t of transferSentences) {
        expect(modelVisibleTargets.has(t.visibleTargetKey), `${lessonId} transfer ${t.variantId} visible target`).toBe(
          false,
        );
      }
    },
  );
});

describe("A2 Module 5 — kanji exposure wiring", () => {
  it.each(module5Lessons.map((b) => [b.recipe.id, b] as const))(
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

  it("so1 includes exactly the 5 new first-supported glyphs (起寝使作毎)", () => {
    const so1 = module5Lessons[0];
    const firstSupported = so1.recipe.kanjiExposureIds.filter(
      (id) => A2_KANJI_EXPOSURES.find((e) => e.id === id)?.stage === "first-supported",
    );
    expect(firstSupported).toHaveLength(5);
  });

  it("so2 includes exactly the 4 new first-supported glyphs (洗終始働)", () => {
    const so2 = module5Lessons[1];
    const firstSupported = so2.recipe.kanjiExposureIds.filter(
      (id) => A2_KANJI_EXPOSURES.find((e) => e.id === id)?.stage === "first-supported",
    );
    expect(firstSupported).toHaveLength(4);
  });

  it("so1 also assesses M4's own final-lesson glyphs (見気持悪), per the exact recipe spiral mapping", () => {
    const so1 = module5Lessons[0];
    const assessed = so1.recipe.kanjiExposureIds.filter(
      (id) => A2_KANJI_EXPOSURES.find((e) => e.id === id)?.stage === "assessed",
    );
    expect(assessed.length).toBeGreaterThanOrEqual(4);
  });
});

describe("A2 Module 5 — connected grammar content (no isolated drill)", () => {
  it("so1's models are complete te-form sequences (contain a comma joining two clauses)", () => {
    const so1 = module5Lessons[0];
    const models = so1.variants.filter((v) => v.pedagogicalUse === "model");
    const sentences = models.map(realize);
    for (const s of sentences) {
      expect(s.canonicalJapanese).toContain("、");
    }
  });

  it("so3's models are complete ~ている ongoing-action statements", () => {
    const so3 = module5Lessons[2];
    const models = so3.variants.filter((v) => v.pedagogicalUse === "model");
    const sentences = models.map(realize);
    for (const s of sentences) {
      expect(s.canonicalJapanese).toContain("います");
    }
  });

  it("so4 is a genuine transfer/practice mix of sequence-te and ongoing-teiru families", () => {
    const so4 = module5Lessons[3];
    const families = new Set(so4.variants.filter((v) => v.pedagogicalUse === "model").map((v) => v.sentenceFamilyId));
    expect(families.size).toBeGreaterThanOrEqual(2);
    expect(families.has("a2-family-ongoing-teiru")).toBe(true);
  });

  it("so2 never realizes ~ている (no premature ongoing intro before so3)", () => {
    const so2 = module5Lessons[1];
    const sentences = so2.variants.map(realize);
    for (const s of sentences) {
      expect(s.canonicalJapanese).not.toContain("ています");
    }
  });
});

describe("A2 Module 5 — exact realized Japanese/rōmaji spot checks", () => {
  it("realizes every module-5 instructional variant through the shared formatter with no errors", () => {
    for (const built of module5Lessons) {
      for (const variant of built.variants) {
        const sentence = realize(variant);
        const romaji = formatRomaji(sentence.tokens);
        expect(romaji.ok, `${variant.id} romaji`).toBe(true);
      }
    }
  });
});

describe("A2 Module 5 — bilingual copy coverage", () => {
  it("every model+transfer variant has an EN and IT translation entry", () => {
    for (const built of module5Lessons) {
      for (const variant of built.variants) {
        const translationKey = `${variant.id}-translation`;
        expect(built.en[translationKey], `${variant.id} en`).toBeTruthy();
        expect(built.it[translationKey], `${variant.id} it`).toBeTruthy();
      }
    }
  });

  it("has no Japanese literal in any EN/IT copy value", () => {
    const JAPANESE_PATTERN = /[\u3040-\u30ff\u4e00-\u9fff]/;
    for (const built of module5Lessons) {
      for (const value of [...Object.values(built.en), ...Object.values(built.it)]) {
        expect(JAPANESE_PATTERN.test(value), value).toBe(false);
      }
    }
  });

  // M5 spec-fix regression (Phase 3 Task 5): a fresh review found both
  // Italian "si e stancato" copy occurrences missing the grave accent on
  // "è" (essere, 3rd person singular) — "si e stancato" reads as "si e
  // stancato" (a dangling "and", ungrammatical), not "si è stancato" ("got
  // tired"). Pins both so1-m6 and so4-m1's exact IT copy.
  it('so1-m6 and so4-m1\'s IT copy say "si è stancato" (with the grave accent), never the malformed "si e stancato"', () => {
    const so1 = module5Lessons[0];
    const so4 = module5Lessons[3];
    expect(so1.it["sequencing-ongoing-1-m6-translation"]).toContain("si è stancato");
    expect(so1.it["sequencing-ongoing-1-m6-translation"]).not.toContain("si e stancato");
    expect(so4.it["sequencing-ongoing-4-m1-translation"]).toContain("si è stancato");
    expect(so4.it["sequencing-ongoing-4-m1-translation"]).not.toContain("si e stancato");
  });
});
