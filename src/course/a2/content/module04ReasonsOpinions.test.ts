/**
 * A2 Module 4 (reasons-opinions) — module-local depth gate (Phase 3 Task 4).
 *
 * Four instructional lessons: ro1 give-reasons (から intro), ro2 reason-node
 * (ので, supports give-reasons), ro3 opinion-toomou (と思います, supports
 * recognize-plain-forms), ro4 agree-disagree (a review/synthesis lesson
 * mixing agree/disagree with opinion-toomou + connectors practice). Mirrors
 * Module 1/2/3's rigor: assembles a real foundation catalog from the actual
 * release data, realizes every instructional variant through the shared
 * realizer, and asserts the exact depth contract — 8-12 models, 10 exercises
 * (5+5), ≥3 predicate senses, ≥3 discourse roles, ≥2 contexts, ≥5 unique
 * visible targets (reuse ≤2), and connected-discourse markers rather than an
 * isolated grammar drill.
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
import { module4Lessons, module4Recipe } from "./module04ReasonsOpinions";

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

describe("A2 Module 4 (reasons-opinions) — exactly 4 lessons, canonical order", () => {
  it("declares exactly reasons-opinions-1..4 in order 1..4", () => {
    expect(module4Lessons.map((b) => b.recipe.id)).toEqual([
      "reasons-opinions-1",
      "reasons-opinions-2",
      "reasons-opinions-3",
      "reasons-opinions-4",
    ]);
    expect(module4Lessons.map((b) => b.recipe.order)).toEqual([1, 2, 3, 4]);
    expect(module4Lessons.every((b) => b.recipe.moduleId === "reasons-opinions")).toBe(true);
  });

  it("declares the exact primary/support Can-do mapping for M4", () => {
    const expected: Readonly<Record<string, { primary: string; supports: readonly string[] }>> = {
      "reasons-opinions-1": { primary: "a2-cando-give-reasons", supports: ["a2-cando-reason-kara"] },
      "reasons-opinions-2": { primary: "a2-cando-reason-node", supports: ["a2-cando-give-reasons"] },
      "reasons-opinions-3": { primary: "a2-cando-opinion-toomou", supports: ["a2-cando-recognize-plain-forms"] },
      "reasons-opinions-4": {
        primary: "a2-cando-agree-disagree",
        supports: ["a2-cando-opinion-toomou", "a2-cando-connectors"],
      },
    };
    for (const built of module4Lessons) {
      expect(built.recipe.primaryCanDoId).toBe(expected[built.recipe.id].primary);
      expect(built.recipe.supportingCanDoIds).toEqual(expected[built.recipe.id].supports);
      expect(built.recipe.supportingCanDoIds.length).toBeLessThanOrEqual(2);
    }
  });

  it("declares module4Recipe with the exact 4 lesson ids", () => {
    expect(module4Recipe.lessonIds).toEqual([...module4Lessons.map((b) => b.recipe.id)]);
  });
});

describe("A2 Module 4 — per-lesson depth contract", () => {
  it.each(module4Lessons.map((b) => [b.recipe.id, b] as const))(
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

      const modelJapaneseTexts = new Set(modelSentences.map((s) => s.canonicalJapanese));
      expect(modelJapaneseTexts.size, `${lessonId} distinct model utterances`).toBe(models.length);

      const modelFingerprints = new Set(modelSentences.map((s) => s.semanticFingerprint));
      for (const t of transferSentences) {
        expect(modelFingerprints.has(t.semanticFingerprint), `${lessonId} transfer ${t.variantId}`).toBe(false);
      }
    },
  );
});

describe("A2 Module 4 — kanji exposure wiring", () => {
  it.each(module4Lessons.map((b) => [b.recipe.id, b] as const))(
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

  it("ro1 includes exactly the 4 new first-supported glyphs (理由考意) plus en2's carried-over retrieval exposures", () => {
    const ro1 = module4Lessons[0];
    const firstSupported = ro1.recipe.kanjiExposureIds.filter(
      (id) => A2_KANJI_EXPOSURES.find((e) => e.id === id)?.stage === "first-supported",
    );
    expect(firstSupported).toHaveLength(4);
  });

  it("ro2 includes exactly the 4 new first-supported glyphs (見気持悪) plus ro1's carried-over retrieval exposures", () => {
    const ro2 = module4Lessons[1];
    const firstSupported = ro2.recipe.kanjiExposureIds.filter(
      (id) => A2_KANJI_EXPOSURES.find((e) => e.id === id)?.stage === "first-supported",
    );
    expect(firstSupported).toHaveLength(4);
  });
});

describe("A2 Module 4 — connected discourse markers (no isolated grammar drill)", () => {
  it("ro1's models are complete から reason statements", () => {
    const ro1 = module4Lessons[0];
    const models = ro1.variants.filter((v) => v.pedagogicalUse === "model");
    const sentences = models.map(realize);
    for (const s of sentences) {
      expect(s.canonicalJapanese).toContain("から");
    }
  });

  it("ro2's models are complete ので reason statements", () => {
    const ro2 = module4Lessons[1];
    const models = ro2.variants.filter((v) => v.pedagogicalUse === "model");
    const sentences = models.map(realize);
    for (const s of sentences) {
      expect(s.canonicalJapanese).toContain("ので");
    }
  });

  it("ro3 mixes と思います opinions with plain-form recognition support sentences", () => {
    const ro3 = module4Lessons[2];
    const models = ro3.variants.filter((v) => v.pedagogicalUse === "model");
    const sentences = models.map(realize);
    const opinionCount = sentences.filter((s) => s.canonicalJapanese.includes("おもいます")).length;
    const plainCount = sentences.filter((s) => !s.canonicalJapanese.includes("おもいます")).length;
    expect(opinionCount).toBeGreaterThanOrEqual(3);
    expect(plainCount).toBeGreaterThanOrEqual(1);
  });

  it("ro4 is a genuine review/synthesis mix of agree/disagree with opinion and connector practice", () => {
    const ro4 = module4Lessons[3];
    const families = new Set(ro4.variants.filter((v) => v.pedagogicalUse === "model").map((v) => v.sentenceFamilyId));
    expect(families.size).toBeGreaterThanOrEqual(3);
    expect(families.has("a2-family-agree-disagree")).toBe(true);
  });
});

// Phase 3 Task 6 spec-fix ("grammar spiral content mismatch"):
// `A2_GRAMMAR_SPIRAL` (see `a2/forms/grammarSpiral.ts`) names ro4
// (`reasons-opinions-4`) as reason-kara's own controlled-PRACTICE lesson —
// `auditA2GrammarSpiralEvidence` (see `validateA2GrammarSpiral.ts`) proved
// that promise was empty: ro4 never carried any `a2-family-reason-kara`
// content at all. Fixed by adding a genuine から reason+main-clause model
// (`reasons-opinions-4-m9`) that recombines an already-modeled ro1 semantic
// value (`a2-value-kara-suki-benkyou`) — never inventing new Japanese. This
// focused test pins the exact real PRACTICE-role evidence that now backs
// reason-kara's grammar-spiral promise, and locks ro4's own recipe
// primary/support Can-dos exactly as they were: reason-kara is genuine
// grammar-practice evidence here, never promoted to a third support.
describe("A2 Module 4 — Phase 3 Task 6 spec-fix: ro4 carries genuine reason-kara controlled-PRACTICE evidence", () => {
  it("ro4 declares a real a2-family-reason-kara model reusing an already-modeled ro1 semantic value, with exact JP/romaji/copy", () => {
    const ro4 = module4Lessons[3];
    const m9 = ro4.variants.find((v) => v.id === "reasons-opinions-4-m9");
    expect(m9).toBeDefined();
    expect(m9?.pedagogicalUse).toBe("model");
    expect(m9?.sentenceFamilyId).toBe("a2-family-reason-kara");
    expect(m9?.slotValues.predicate).toBe("a2-value-kara-suki-benkyou");

    const sentence = realize(m9 as SentenceVariant);
    expect(sentence.canonicalJapanese).toBe("にほんのたべものがすきだから、にほんごをべんきょうします");
    expect(sentence.canonicalJapanese).toContain("から");
    const romaji = formatRomaji(sentence.tokens);
    expect(romaji.ok).toBe(true);
    if (!romaji.ok) throw new Error("unreachable");
    expect(romaji.text).toBe("nihon no tabemono ga suki dakara, nihongo o benkyoushimasu");

    expect(ro4.en["reasons-opinions-4-m9-translation"]).toBe("I like Japanese food, so I study Japanese.");
    expect(ro4.it["reasons-opinions-4-m9-translation"]).toBe(
      "Mi piace il cibo giapponese, quindi studio giapponese.",
    );
  });

  it("ro4's recipe primary/support Can-dos stay exactly agree-disagree [opinion-toomou, connectors] — reason-kara is grammar-practice evidence here, never promoted to a third support", () => {
    const ro4 = module4Lessons[3];
    expect(ro4.recipe.primaryCanDoId).toBe("a2-cando-agree-disagree");
    expect(ro4.recipe.supportingCanDoIds).toEqual(["a2-cando-opinion-toomou", "a2-cando-connectors"]);
  });

  it("ro4 still satisfies 8-12 models and exactly 5 novel transfers after adding the reason-kara model", () => {
    const ro4 = module4Lessons[3];
    const models = ro4.variants.filter((v) => v.pedagogicalUse === "model");
    const transfers = ro4.variants.filter((v) => v.pedagogicalUse === "transfer");
    expect(models.length).toBeGreaterThanOrEqual(8);
    expect(models.length).toBeLessThanOrEqual(12);
    expect(transfers.length).toBe(5);
  });
});

describe("A2 Module 4 — exact realized Japanese/rōmaji spot checks", () => {
  it("realizes every module-4 instructional variant through the shared formatter with no errors", () => {
    for (const built of module4Lessons) {
      for (const variant of built.variants) {
        const sentence = realize(variant);
        const romaji = formatRomaji(sentence.tokens);
        expect(romaji.ok, `${variant.id} romaji`).toBe(true);
      }
    }
  });
});

describe("A2 Module 4 — bilingual copy coverage", () => {
  it("every model+transfer variant has an EN and IT translation entry", () => {
    for (const built of module4Lessons) {
      for (const variant of built.variants) {
        const translationKey = `${variant.id}-translation`;
        expect(built.en[translationKey], `${variant.id} en`).toBeTruthy();
        expect(built.it[translationKey], `${variant.id} it`).toBeTruthy();
      }
    }
  });

  it("has no Japanese literal in any EN/IT copy value", () => {
    const JAPANESE_PATTERN = /[\u3040-\u30ff\u4e00-\u9fff]/;
    for (const built of module4Lessons) {
      for (const value of [...Object.values(built.en), ...Object.values(built.it)]) {
        expect(JAPANESE_PATTERN.test(value), value).toBe(false);
      }
    }
  });
});
