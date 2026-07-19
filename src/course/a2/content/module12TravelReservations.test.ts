/**
 * A2 Module 12 (travel-reservations) — module-local depth gate (Phase 3
 * Task 6).
 *
 * Four instructional lessons: tr1 make-reservation (intentions-plans/
 * possibility true transfer), tr2 travel-schedule (a genuinely
 * compositional arrival family reusing the EXISTING A1-ported
 * rule-transport-action rule, transferring into BOTH experience-takoto and
 * comparison — compare's corrected true-transfer lesson), tr3
 * travel-problem (request-tekudasai/negative-request true recurrence), tr4
 * change-cancel. Mirrors Module 1-11's rigor: assembles a real foundation
 * catalog from the actual release data, realizes every instructional
 * variant through the shared realizer, and asserts the exact depth contract
 * — 8-12 models, 10 exercises (5+5), >=3 predicate senses, >=3 discourse
 * roles, >=2 contexts, >=5 unique visible targets (reuse <=2).
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
import { module12Lessons, module12Recipe } from "./module12TravelReservations";

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

describe("A2 Module 12 (travel-reservations) — exactly 4 lessons, canonical order", () => {
  it("declares exactly travel-reservations-1..4 in order 1..4", () => {
    expect(module12Lessons.map((b) => b.recipe.id)).toEqual([
      "travel-reservations-1",
      "travel-reservations-2",
      "travel-reservations-3",
      "travel-reservations-4",
    ]);
    expect(module12Lessons.map((b) => b.recipe.order)).toEqual([1, 2, 3, 4]);
    expect(module12Lessons.every((b) => b.recipe.moduleId === "travel-reservations")).toBe(true);
  });

  it("declares the exact primary/support Can-do mapping for M12", () => {
    const expected: Readonly<Record<string, { primary: string; supports: readonly string[] }>> = {
      "travel-reservations-1": {
        primary: "a2-cando-make-reservation",
        supports: ["a2-cando-intentions-plans", "a2-cando-possibility"],
      },
      "travel-reservations-2": {
        primary: "a2-cando-travel-schedule",
        supports: ["a2-cando-experience-takoto", "a2-cando-compare"],
      },
      "travel-reservations-3": {
        primary: "a2-cando-travel-problem",
        supports: ["a2-cando-request-tekudasai", "a2-cando-negative-request"],
      },
      "travel-reservations-4": { primary: "a2-cando-change-cancel", supports: [] },
    };
    for (const built of module12Lessons) {
      expect(built.recipe.primaryCanDoId).toBe(expected[built.recipe.id].primary);
      expect(built.recipe.supportingCanDoIds).toEqual(expected[built.recipe.id].supports);
      expect(built.recipe.supportingCanDoIds.length).toBeLessThanOrEqual(2);
    }
  });

  it("declares module12Recipe with the exact 4 lesson ids", () => {
    expect(module12Recipe.lessonIds).toEqual([...module12Lessons.map((b) => b.recipe.id)]);
  });
});

describe("A2 Module 12 — per-lesson depth contract", () => {
  it.each(module12Lessons.map((b) => [b.recipe.id, b] as const))(
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

describe("A2 Module 12 — kanji exposure wiring", () => {
  it.each(module12Lessons.map((b) => [b.recipe.id, b] as const))(
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

  it("tr1 includes exactly the 5 new first-supported glyphs (空港駅電山)", () => {
    const tr1 = module12Lessons[0];
    const firstSupported = tr1.recipe.kanjiExposureIds.filter(
      (id) => A2_KANJI_EXPOSURES.find((e) => e.id === id)?.stage === "first-supported",
    );
    expect(firstSupported).toHaveLength(5);
  });

  it("tr2 includes exactly the 4 new first-supported glyphs (車着発泊)", () => {
    const tr2 = module12Lessons[1];
    const firstSupported = tr2.recipe.kanjiExposureIds.filter(
      (id) => A2_KANJI_EXPOSURES.find((e) => e.id === id)?.stage === "first-supported",
    );
    expect(firstSupported).toHaveLength(4);
  });
});

describe("A2 Module 12 — tr2's compositional travel-arrival family (genuine transport x location recombination)", () => {
  it("realizes the SAME tsuku predicate with independently-varying transport/location values into genuinely distinct sentences", () => {
    const tr2 = module12Lessons[1];
    const arrivalModels = tr2.variants.filter((v) => v.sentenceFamilyId === "a2-family-travel-arrival");
    expect(arrivalModels.length).toBeGreaterThanOrEqual(3);
    const sentences = new Set(arrivalModels.map((v) => realize(v).canonicalJapanese));
    expect(sentences.size).toBe(arrivalModels.length);
    for (const v of arrivalModels) {
      expect(v.slotValues.predicate).toBe("a2-value-travel-tsuku");
    }
  });

  it("tr2 transfers reuse the EXISTING a2-family-experience-takoto (M3) and a2-family-comparison-favor (M9) verbatim — BOTH exact true transfers", () => {
    const tr2 = module12Lessons[1];
    const transfers = tr2.variants.filter((v) => v.pedagogicalUse === "transfer");
    const families = new Set(transfers.map((v) => v.sentenceFamilyId));
    expect(families.has("a2-family-experience-takoto")).toBe(true);
    expect(families.has("a2-family-comparison-favor")).toBe(true);
  });
});

describe("A2 Module 12 — tr3's supports cap: reason-node TRANSFER evidence without a mislabeled third support (Phase 3 Task 6 spec-fix)", () => {
  it("declares exactly 2 supporting Can-dos (request-tekudasai, negative-request), never reason-node — the grammar spiral's reason-node TRANSFER role points here too, but that is content evidence, never a recipe label", () => {
    const tr3 = module12Lessons[2];
    expect(tr3.recipe.supportingCanDoIds).toEqual(["a2-cando-request-tekudasai", "a2-cando-negative-request"]);
    expect(tr3.recipe.supportingCanDoIds).not.toContain("a2-cando-reason-node");
    expect(tr3.recipe.primaryCanDoId).not.toBe("a2-cando-reason-node");
  });

  it("tr3 models at least one a2-family-reason-node value — the construction is genuinely available here, not merely referenced by the grammar spiral", () => {
    const tr3 = module12Lessons[2];
    const models = tr3.variants.filter((v) => v.pedagogicalUse === "model");
    expect(models.some((v) => v.sentenceFamilyId === "a2-family-reason-node")).toBe(true);
  });

  it("tr3 has at least one visibly-novel TRANSFER using a2-family-reason-node — the grammar spiral's real transfer evidence, decoupled from the (unchanged, still exactly 2) recipe support cap", () => {
    const tr3 = module12Lessons[2];
    const models = tr3.variants.filter((v) => v.pedagogicalUse === "model");
    const transfers = tr3.variants.filter((v) => v.pedagogicalUse === "transfer");
    const nodeTransfers = transfers.filter((v) => v.sentenceFamilyId === "a2-family-reason-node");
    expect(nodeTransfers.length).toBeGreaterThanOrEqual(1);

    // "visibly novel" (I2, the same standard every other transfer in this
    // file is held to): a node transfer may never repeat a model's own
    // semantic fingerprint/visible target.
    const modelSentences = models.map(realize);
    const modelFingerprints = new Set(modelSentences.map((s) => s.semanticFingerprint));
    const modelVisibleTargets = new Set(modelSentences.map((s) => s.visibleTargetKey));
    for (const t of nodeTransfers) {
      const sentence = realize(t);
      expect(modelFingerprints.has(sentence.semanticFingerprint), t.id).toBe(false);
      expect(modelVisibleTargets.has(sentence.visibleTargetKey), t.id).toBe(false);
    }
  });

  it("tr3's node model/transfer realize the exact natural ので travel-problem explanation + polite request/help clause", () => {
    const tr3 = module12Lessons[2];
    const nodeModel = tr3.variants.find(
      (v) => v.pedagogicalUse === "model" && v.sentenceFamilyId === "a2-family-reason-node",
    );
    const nodeTransfer = tr3.variants.find(
      (v) => v.pedagogicalUse === "transfer" && v.sentenceFamilyId === "a2-family-reason-node",
    );
    expect(nodeModel, "tr3 node model").toBeDefined();
    expect(nodeTransfer, "tr3 node transfer").toBeDefined();

    const modelSentence = realize(nodeModel as SentenceVariant);
    expect(modelSentence.canonicalJapanese).toBe("パスポートをなくしたので、たすけてください");
    const modelRomaji = formatRomaji(modelSentence.tokens);
    expect(modelRomaji.ok).toBe(true);
    if (!modelRomaji.ok) throw new Error("unreachable");
    expect(modelRomaji.text).toBe("pasupooto o nakushita node, tasukete kudasai");
    expect(modelRomaji.text).not.toContain("nakushitanode");
    expect(modelRomaji.text).not.toContain("nodetasukete");

    const transferSentence = realize(nodeTransfer as SentenceVariant);
    expect(transferSentence.canonicalJapanese).toBe("そらさん、パスポートをなくしたので、たすけてください");
    const transferRomaji = formatRomaji(transferSentence.tokens);
    expect(transferRomaji.ok).toBe(true);
    if (!transferRomaji.ok) throw new Error("unreachable");
    expect(transferRomaji.text).toBe("sora san, pasupooto o nakushita node, tasukete kudasai");
  });

  it("still keeps request-tekudasai/negative-request/travel-problem transfer coverage intact after the node rebalance", () => {
    const tr3 = module12Lessons[2];
    const transfers = tr3.variants.filter((v) => v.pedagogicalUse === "transfer");
    const families = new Set(transfers.map((v) => v.sentenceFamilyId));
    expect(families.has("a2-family-travel-problem")).toBe(true);
    expect(families.has("a2-family-request-tekudasai")).toBe(true);
    expect(families.has("a2-family-negative-request")).toBe(true);
    expect(transfers.length).toBe(5);
  });
});

describe("A2 Module 12 — exact realized Japanese/rōmaji spot checks", () => {
  it("realizes every module-12 instructional variant through the shared formatter with no errors", () => {
    for (const built of module12Lessons) {
      for (const variant of built.variants) {
        const sentence = realize(variant);
        const romaji = formatRomaji(sentence.tokens);
        expect(romaji.ok, `${variant.id} romaji`).toBe(true);
      }
    }
  });

  it("travel-reservations-2-m1 realizes でんしゃでくうこうにつきます", () => {
    const tr2 = module12Lessons[1];
    const m1 = tr2.variants.find((v) => v.id === "travel-reservations-2-m1");
    expect(m1, "travel-reservations-2-m1").toBeDefined();
    const sentence = realize(m1 as SentenceVariant);
    expect(sentence.canonicalJapanese).toBe("でんしゃでくうこうにつきます");
    const romaji = formatRomaji(sentence.tokens);
    expect(romaji.ok).toBe(true);
    if (!romaji.ok) throw new Error("unreachable");
    expect(romaji.text).toBe("densha de kuukou ni tsukimasu");
  });
});

describe("A2 Module 12 — bilingual copy coverage", () => {
  it("every model+transfer variant has an EN and IT translation entry", () => {
    for (const built of module12Lessons) {
      for (const variant of built.variants) {
        const translationKey = `${variant.id}-translation`;
        expect(built.en[translationKey], `${variant.id} en`).toBeTruthy();
        expect(built.it[translationKey], `${variant.id} it`).toBeTruthy();
      }
    }
  });

  it("has no Japanese literal in any EN/IT copy value", () => {
    const JAPANESE_PATTERN = /[\u3040-\u30ff\u4e00-\u9fff]/;
    for (const built of module12Lessons) {
      for (const value of [...Object.values(built.en), ...Object.values(built.it)]) {
        expect(JAPANESE_PATTERN.test(value), value).toBe(false);
      }
    }
  });
});
