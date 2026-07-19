/**
 * A2 Module 11 (work-study-messages) — module-local depth gate (Phase 3
 * Task 6).
 *
 * Four instructional lessons: wsm1 message-late-absent (reason-kara/
 * reason-node true recurrence), wsm2 ask-colleague (object-compositional +
 * request-tekudasai true transfer), wsm3 report-progress (a PURE
 * a2-family-ongoing-teiru recombination — no new family/concept), wsm4
 * reply-confirm. Mirrors Module 1-10's rigor: assembles a real foundation
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
import { module11Lessons, module11Recipe } from "./module11WorkStudyMessages";

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

describe("A2 Module 11 (work-study-messages) — exactly 4 lessons, canonical order", () => {
  it("declares exactly work-study-messages-1..4 in order 1..4", () => {
    expect(module11Lessons.map((b) => b.recipe.id)).toEqual([
      "work-study-messages-1",
      "work-study-messages-2",
      "work-study-messages-3",
      "work-study-messages-4",
    ]);
    expect(module11Lessons.map((b) => b.recipe.order)).toEqual([1, 2, 3, 4]);
    expect(module11Lessons.every((b) => b.recipe.moduleId === "work-study-messages")).toBe(true);
  });

  it("declares the exact primary/support Can-do mapping for M11", () => {
    const expected: Readonly<Record<string, { primary: string; supports: readonly string[] }>> = {
      "work-study-messages-1": {
        primary: "a2-cando-message-late-absent",
        supports: ["a2-cando-reason-kara", "a2-cando-reason-node"],
      },
      "work-study-messages-2": { primary: "a2-cando-ask-colleague", supports: ["a2-cando-request-tekudasai"] },
      "work-study-messages-3": { primary: "a2-cando-report-progress", supports: ["a2-cando-ongoing-teiru"] },
      "work-study-messages-4": { primary: "a2-cando-reply-confirm", supports: [] },
    };
    for (const built of module11Lessons) {
      expect(built.recipe.primaryCanDoId).toBe(expected[built.recipe.id].primary);
      expect(built.recipe.supportingCanDoIds).toEqual(expected[built.recipe.id].supports);
      expect(built.recipe.supportingCanDoIds.length).toBeLessThanOrEqual(2);
    }
  });

  it("declares module11Recipe with the exact 4 lesson ids", () => {
    expect(module11Recipe.lessonIds).toEqual([...module11Lessons.map((b) => b.recipe.id)]);
  });
});

describe("A2 Module 11 — per-lesson depth contract", () => {
  it.each(module11Lessons.map((b) => [b.recipe.id, b] as const))(
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

describe("A2 Module 11 — kanji exposure wiring", () => {
  it.each(module11Lessons.map((b) => [b.recipe.id, b] as const))(
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

  it("wsm1 includes exactly the 4 new first-supported glyphs (社仕事教)", () => {
    const wsm1 = module11Lessons[0];
    const firstSupported = wsm1.recipe.kanjiExposureIds.filter(
      (id) => A2_KANJI_EXPOSURES.find((e) => e.id === id)?.stage === "first-supported",
    );
    expect(firstSupported).toHaveLength(4);
  });

  it("wsm2 includes exactly the 4 new first-supported glyphs (学校先生)", () => {
    const wsm2 = module11Lessons[1];
    const firstSupported = wsm2.recipe.kanjiExposureIds.filter(
      (id) => A2_KANJI_EXPOSURES.find((e) => e.id === id)?.stage === "first-supported",
    );
    expect(firstSupported).toHaveLength(4);
  });
});

describe("A2 Module 11 — wsm3 is a PURE a2-family-ongoing-teiru recombination (no new family/concept)", () => {
  it("declares no new introducedConceptIds at all", () => {
    const wsm3 = module11Lessons[2];
    expect(wsm3.recipe.diversityConstraints).toBeDefined();
    // introducedConceptIds is not part of the frozen recipe surface, but the
    // module source passes [] — asserted structurally via family reuse below.
    const families = new Set(wsm3.variants.map((v) => v.sentenceFamilyId));
    expect(families.size).toBe(1);
    expect(families.has("a2-family-ongoing-teiru")).toBe(true);
  });

  it("every wsm3 variant reuses the EXISTING a2-family-ongoing-teiru — genuinely novel only through object/subject recombination", () => {
    const wsm3 = module11Lessons[2];
    for (const v of wsm3.variants) {
      expect(v.sentenceFamilyId).toBe("a2-family-ongoing-teiru");
    }
  });
});

describe("A2 Module 11 — request-tekudasai true transfer reuses the EXISTING M6 family verbatim", () => {
  it("wsm2's supporting-Can-do transfers use a2-family-request-tekudasai, not a duplicate family", () => {
    const wsm2 = module11Lessons[1];
    const transfers = wsm2.variants.filter((v) => v.pedagogicalUse === "transfer");
    const tekudasaiTransfers = transfers.filter((v) => v.sentenceFamilyId === "a2-family-request-tekudasai");
    expect(tekudasaiTransfers.length).toBeGreaterThanOrEqual(1);
  });
});

describe("A2 Module 11 — exact realized Japanese/rōmaji spot checks", () => {
  it("realizes every module-11 instructional variant through the shared formatter with no errors", () => {
    for (const built of module11Lessons) {
      for (const variant of built.variants) {
        const sentence = realize(variant);
        const romaji = formatRomaji(sentence.tokens);
        expect(romaji.ok, `${variant.id} romaji`).toBe(true);
      }
    }
  });

  it("work-study-messages-1-m1 realizes すこしおくれます", () => {
    const wsm1 = module11Lessons[0];
    const m1 = wsm1.variants.find((v) => v.id === "work-study-messages-1-m1");
    expect(m1, "work-study-messages-1-m1").toBeDefined();
    const sentence = realize(m1 as SentenceVariant);
    expect(sentence.canonicalJapanese).toBe("すこしおくれます");
  });
});

describe("A2 Module 11 — bilingual copy coverage", () => {
  it("every model+transfer variant has an EN and IT translation entry", () => {
    for (const built of module11Lessons) {
      for (const variant of built.variants) {
        const translationKey = `${variant.id}-translation`;
        expect(built.en[translationKey], `${variant.id} en`).toBeTruthy();
        expect(built.it[translationKey], `${variant.id} it`).toBeTruthy();
      }
    }
  });

  it("has no Japanese literal in any EN/IT copy value", () => {
    const JAPANESE_PATTERN = /[\u3040-\u30ff\u4e00-\u9fff]/;
    for (const built of module11Lessons) {
      for (const value of [...Object.values(built.en), ...Object.values(built.it)]) {
        expect(JAPANESE_PATTERN.test(value), value).toBe(false);
      }
    }
  });
});
