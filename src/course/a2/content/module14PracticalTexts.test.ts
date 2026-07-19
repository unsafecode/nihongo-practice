/**
 * A2 Module 14 (practical-texts) - module-local depth gate (Phase 3 Task 7).
 *
 * Four instructional lessons: pt1 (practical-texts-1) reads an actual
 * timetable/schedule text (no support); pt2 (practical-texts-2) reads an
 * actual notice/sign text, with a true TRANSFER into prohibition-tewaikenai
 * (the grammar spiral's own transfer role for this lesson); pt3
 * (practical-texts-3) reads an actual short message/invitation/reply, with
 * BOTH opinion-toomou and connectors true recurrence; pt4 (practical-texts-4)
 * fills a simple form with times/dates/numbers (no support). Mirrors Module
 * 1-13's rigor: assembles a real foundation catalog from the actual release
 * data, realizes every instructional variant through the shared realizer,
 * and asserts the exact depth contract - 8-12 models, 10 exercises (5+5),
 * >=3 predicate senses, >=3 discourse roles, >=2 contexts, >=5 unique
 * visible targets (reuse <=2).
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
import { module14Lessons, module14Recipe } from "./module14PracticalTexts";

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

describe("A2 Module 14 (practical-texts) — exactly 4 lessons, canonical order", () => {
  it("declares exactly practical-texts-1..4 in order 1..4", () => {
    expect(module14Lessons.map((b) => b.recipe.id)).toEqual([
      "practical-texts-1",
      "practical-texts-2",
      "practical-texts-3",
      "practical-texts-4",
    ]);
    expect(module14Lessons.map((b) => b.recipe.order)).toEqual([1, 2, 3, 4]);
    expect(module14Lessons.every((b) => b.recipe.moduleId === "practical-texts")).toBe(true);
  });

  it("declares the exact primary/support Can-do mapping for M14", () => {
    const expected: Readonly<Record<string, { primary: string; supports: readonly string[] }>> = {
      "practical-texts-1": { primary: "a2-cando-read-schedule", supports: [] },
      "practical-texts-2": {
        primary: "a2-cando-read-notice",
        supports: ["a2-cando-prohibition-tewaikenai"],
      },
      "practical-texts-3": {
        primary: "a2-cando-read-reply-message",
        supports: ["a2-cando-opinion-toomou", "a2-cando-connectors"],
      },
      "practical-texts-4": { primary: "a2-cando-fill-form", supports: [] },
    };
    for (const built of module14Lessons) {
      expect(built.recipe.primaryCanDoId).toBe(expected[built.recipe.id].primary);
      expect(built.recipe.supportingCanDoIds).toEqual(expected[built.recipe.id].supports);
      expect(built.recipe.supportingCanDoIds.length).toBeLessThanOrEqual(2);
    }
  });

  it("declares module14Recipe with the exact 4 lesson ids", () => {
    expect(module14Recipe.lessonIds).toEqual([...module14Lessons.map((b) => b.recipe.id)]);
  });
});

describe("A2 Module 14 — per-lesson depth contract", () => {
  it.each(module14Lessons.map((b) => [b.recipe.id, b] as const))(
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

describe("A2 Module 14 — kanji exposure wiring", () => {
  it.each(module14Lessons.map((b) => [b.recipe.id, b] as const))(
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

  it("pt1 includes exactly the 5 new first-supported glyphs (jikan/gofun/han/hon set)", () => {
    const pt1 = module14Lessons[0];
    const firstSupported = pt1.recipe.kanjiExposureIds.filter(
      (id) => A2_KANJI_EXPOSURES.find((e) => e.id === id)?.stage === "first-supported",
    );
    expect(firstSupported).toHaveLength(5);
  });

  it("pt2 includes exactly the 4 new first-supported glyphs (ryoukin/aku/shimaru set)", () => {
    const pt2 = module14Lessons[1];
    const firstSupported = pt2.recipe.kanjiExposureIds.filter(
      (id) => A2_KANJI_EXPOSURES.find((e) => e.id === id)?.stage === "first-supported",
    );
    expect(firstSupported).toHaveLength(4);
  });
});

describe("A2 Module 14 — pt2's genuine prohibition-tewaikenai TRANSFER evidence", () => {
  it("declares exactly the 1 supporting Can-do (prohibition-tewaikenai)", () => {
    const pt2 = module14Lessons[1];
    expect(pt2.recipe.supportingCanDoIds).toEqual(["a2-cando-prohibition-tewaikenai"]);
  });

  it("pt2 has at least one TRANSFER using a2-family-prohibition-tewaikenai", () => {
    const pt2 = module14Lessons[1];
    const transfers = pt2.variants.filter((v) => v.pedagogicalUse === "transfer");
    expect(transfers.some((v) => v.sentenceFamilyId === "a2-family-prohibition-tewaikenai")).toBe(true);
  });
});

describe("A2 Module 14 — pt3's genuine opinion-toomou + connectors true recurrence", () => {
  it("declares exactly the 2 supporting Can-dos (opinion-toomou, connectors)", () => {
    const pt3 = module14Lessons[2];
    expect(pt3.recipe.supportingCanDoIds).toEqual(["a2-cando-opinion-toomou", "a2-cando-connectors"]);
  });

  it("pt3 models at least one a2-family-opinion-toomou value AND at least one a2-family-connector-utterance value", () => {
    const pt3 = module14Lessons[2];
    const models = pt3.variants.filter((v) => v.pedagogicalUse === "model");
    expect(models.some((v) => v.sentenceFamilyId === "a2-family-opinion-toomou")).toBe(true);
    expect(models.some((v) => v.sentenceFamilyId === "a2-family-connector-utterance")).toBe(true);
  });
});

describe("A2 Module 14 — exact realized Japanese/rōmaji spot checks", () => {
  it("realizes every module-14 instructional variant through the shared formatter with no errors", () => {
    for (const built of module14Lessons) {
      for (const variant of built.variants) {
        const sentence = realize(variant);
        const romaji = formatRomaji(sentence.tokens);
        expect(romaji.ok, `${variant.id} romaji`).toBe(true);
      }
    }
  });
});

describe("A2 Module 14 — bilingual copy coverage", () => {
  it("every model+transfer variant has an EN and IT translation entry", () => {
    for (const built of module14Lessons) {
      for (const variant of built.variants) {
        const translationKey = `${variant.id}-translation`;
        expect(built.en[translationKey], `${variant.id} en`).toBeTruthy();
        expect(built.it[translationKey], `${variant.id} it`).toBeTruthy();
      }
    }
  });

  it("has no Japanese literal in any EN/IT copy value", () => {
    const JAPANESE_PATTERN = /[\u3040-\u30ff\u4e00-\u9fff]/;
    for (const built of module14Lessons) {
      for (const value of [...Object.values(built.en), ...Object.values(built.it)]) {
        expect(JAPANESE_PATTERN.test(value), value).toBe(false);
      }
    }
  });
});

describe("A2 Module 14 — birthday (たんじょうび) EN/IT parity (Task 7 M2 quality pass)", () => {
  const enById = new Map<string, string>();
  const itById = new Map<string, string>();
  for (const built of module14Lessons) {
    for (const variant of built.variants) {
      enById.set(variant.id, built.en[`${variant.id}-translation`] ?? "");
      itById.set(variant.id, built.it[`${variant.id}-translation`] ?? "");
    }
  }

  it("practical-texts-4-m3 (たんじょうびは…) reads 'Compleanno: 5 marzo.' in IT, matching the EN/JP birthday intent", () => {
    expect(enById.get("practical-texts-4-m3")).toBe("Birthday: March 5th.");
    expect(itById.get("practical-texts-4-m3")).toBe("Compleanno: 5 marzo.");
    expect(itById.get("practical-texts-4-m3"), "no 'date of birth' mismatch").not.toMatch(/data di nascita/i);
  });

  it("practical-texts-4-t3 confirmation question reads 'Il compleanno è il 5 marzo?' in IT", () => {
    expect(enById.get("practical-texts-4-t3")).toBe("Is the birthday March 5th?");
    expect(itById.get("practical-texts-4-t3")).toBe("Il compleanno è il 5 marzo?");
    expect(itById.get("practical-texts-4-t3"), "no 'date of birth' mismatch").not.toMatch(/data di nascita/i);
  });
});
