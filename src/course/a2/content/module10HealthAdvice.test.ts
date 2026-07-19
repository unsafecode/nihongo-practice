/**
 * A2 Module 10 (health-advice) — module-local depth gate (Phase 3 Task 6).
 *
 * Four instructional lessons: ha1 describe-symptoms (compositional itai/
 * genki + reused rule-existence), ha2 advice-tahouga (supporting form +
 * reason-kara true transfer), ha3 get-better (negative-request true
 * transfer), ha4 clinic-appointment. Mirrors Module 1-9's rigor: assembles a
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
import { module10Lessons, module10Recipe } from "./module10HealthAdvice";

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

describe("A2 Module 10 (health-advice) — exactly 4 lessons, canonical order", () => {
  it("declares exactly health-advice-1..4 in order 1..4", () => {
    expect(module10Lessons.map((b) => b.recipe.id)).toEqual([
      "health-advice-1",
      "health-advice-2",
      "health-advice-3",
      "health-advice-4",
    ]);
    expect(module10Lessons.map((b) => b.recipe.order)).toEqual([1, 2, 3, 4]);
    expect(module10Lessons.every((b) => b.recipe.moduleId === "health-advice")).toBe(true);
  });

  it("declares the exact primary/support Can-do mapping for M10", () => {
    const expected: Readonly<Record<string, { primary: string; supports: readonly string[] }>> = {
      "health-advice-1": { primary: "a2-cando-describe-symptoms", supports: [] },
      "health-advice-2": { primary: "a2-cando-advice-tahouga", supports: ["a2-cando-reason-kara"] },
      "health-advice-3": { primary: "a2-cando-get-better", supports: ["a2-cando-negative-request"] },
      "health-advice-4": { primary: "a2-cando-clinic-appointment", supports: [] },
    };
    for (const built of module10Lessons) {
      expect(built.recipe.primaryCanDoId).toBe(expected[built.recipe.id].primary);
      expect(built.recipe.supportingCanDoIds).toEqual(expected[built.recipe.id].supports);
      expect(built.recipe.supportingCanDoIds.length).toBeLessThanOrEqual(2);
    }
  });

  it("declares module10Recipe with the exact 4 lesson ids", () => {
    expect(module10Recipe.lessonIds).toEqual([...module10Lessons.map((b) => b.recipe.id)]);
  });
});

describe("A2 Module 10 — per-lesson depth contract", () => {
  it.each(module10Lessons.map((b) => [b.recipe.id, b] as const))(
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

describe("A2 Module 10 — kanji exposure wiring", () => {
  it.each(module10Lessons.map((b) => [b.recipe.id, b] as const))(
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

  it("ha1 includes exactly the 4 new first-supported glyphs (医者薬体)", () => {
    const ha1 = module10Lessons[0];
    const firstSupported = ha1.recipe.kanjiExposureIds.filter(
      (id) => A2_KANJI_EXPOSURES.find((e) => e.id === id)?.stage === "first-supported",
    );
    expect(firstSupported).toHaveLength(4);
  });

  it("ha2 includes exactly the 4 new first-supported glyphs (頭痛元休)", () => {
    const ha2 = module10Lessons[1];
    const firstSupported = ha2.recipe.kanjiExposureIds.filter(
      (id) => A2_KANJI_EXPOSURES.find((e) => e.id === id)?.stage === "first-supported",
    );
    expect(firstSupported).toHaveLength(4);
  });
});

describe("A2 Module 10 — exact realized Japanese/rōmaji for the reused/compositional families", () => {
  it("health-advice-1-m1 realizes to natural compositional symptom あたまがいたいです (rule-preference reuse)", () => {
    const ha1 = module10Lessons[0];
    const m1 = ha1.variants.find((v) => v.id === "health-advice-1-m1");
    expect(m1, "health-advice-1-m1").toBeDefined();
    const sentence = realize(m1 as SentenceVariant);
    expect(sentence.canonicalJapanese).toBe("あたまがいたいです");
    const romaji = formatRomaji(sentence.tokens);
    expect(romaji.ok).toBe(true);
    if (!romaji.ok) throw new Error("unreachable");
    expect(romaji.text).toBe("atama ga itai desu");
  });

  it("health-advice-1-m8 realizes ねつがあります through the reused rule-existence rule (mirrors describe-facility exactly)", () => {
    const ha1 = module10Lessons[0];
    const m8 = ha1.variants.find((v) => v.id === "health-advice-1-m8");
    expect(m8, "health-advice-1-m8").toBeDefined();
    const sentence = realize(m8 as SentenceVariant);
    expect(sentence.canonicalJapanese).toBe("ねつがあります");
  });

  it("health-advice-2-m1 realizes the tahouga-advice whole-clause bake やすんだほうがいいです", () => {
    const ha2 = module10Lessons[1];
    const m1 = ha2.variants.find((v) => v.id === "health-advice-2-m1");
    expect(m1, "health-advice-2-m1").toBeDefined();
    const sentence = realize(m1 as SentenceVariant);
    expect(sentence.canonicalJapanese).toBe("やすんだほうがいいです");
    const romaji = formatRomaji(sentence.tokens);
    expect(romaji.ok).toBe(true);
    if (!romaji.ok) throw new Error("unreachable");
    expect(romaji.text).toBe("yasunda hou ga ii desu");
  });
});

describe("A2 Module 10 — connected health dialogue (no isolated drill)", () => {
  it("ha2 mixes genuine tahouga-advice with reason-kara recurrence", () => {
    const ha2 = module10Lessons[1];
    const models = ha2.variants.filter((v) => v.pedagogicalUse === "model");
    const families = new Set(models.map((v) => v.sentenceFamilyId));
    expect(families.has("a2-family-tahouga-advice")).toBe(true);
    expect(families.has("a2-family-reason-kara")).toBe(true);
  });

  it("ha3 mixes genuine get-better content with negative-request recurrence", () => {
    const ha3 = module10Lessons[2];
    const models = ha3.variants.filter((v) => v.pedagogicalUse === "model");
    const families = new Set(models.map((v) => v.sentenceFamilyId));
    expect(families.has("a2-family-get-better")).toBe(true);
    expect(families.has("a2-family-negative-request")).toBe(true);
  });
});

describe("A2 Module 10 — exact realized Japanese/rōmaji spot checks", () => {
  it("realizes every module-10 instructional variant through the shared formatter with no errors", () => {
    for (const built of module10Lessons) {
      for (const variant of built.variants) {
        const sentence = realize(variant);
        const romaji = formatRomaji(sentence.tokens);
        expect(romaji.ok, `${variant.id} romaji`).toBe(true);
      }
    }
  });
});

// Phase 3 Task 6 spec-fix: ha2's reason-kara models m7/m8 (and their t3/t4
// transfers) carry NO explicit subjectReferent — the omitted subject on a
// "since ___, you should rest/go to the hospital" advice utterance is
// naturally read as the ADDRESSEE's own symptom (the person being advised),
// never the speaker's — so the EN/IT copy must say "your head hurts"/"you
// have a fever" (IT "ti fa male"/"hai la febbre"), never the first-person
// "my head hurts"/"I have a fever" (IT "mi fa male"/"ho la febbre") a
// stale draft had mis-copied.
describe("A2 Module 10 — health-advice-2 reason-kara second-person addressee copy fidelity (Phase 3 Task 6 spec-fix)", () => {
  const ha2 = module10Lessons[1];

  it("health-advice-2-m7 says 'your head hurts' (EN)/'ti fa male' (IT), never the first-person 'my head hurts'/'mi fa male'", () => {
    expect(ha2.en["health-advice-2-m7-translation"]).toBe("Since your head hurts, you should rest.");
    expect(ha2.it["health-advice-2-m7-translation"]).toBe("Siccome ti fa male la testa, dovresti riposare.");
  });

  it("health-advice-2-m8 says 'you have a fever' (EN)/'hai la febbre' (IT), never the first-person 'I have a fever'/'ho la febbre'", () => {
    expect(ha2.en["health-advice-2-m8-translation"]).toBe("Since you have a fever, you should go to the hospital.");
    expect(ha2.it["health-advice-2-m8-translation"]).toBe("Siccome hai la febbre, dovresti andare in ospedale.");
  });

  it("health-advice-2-t3 (Sora vocative) says 'your head hurts' (EN)/'ti fa male' (IT), never the first-person 'my head hurts'/'mi fa male'", () => {
    expect(ha2.en["health-advice-2-t3-translation"]).toBe("Sora, since your head hurts, you should rest.");
    expect(ha2.it["health-advice-2-t3-translation"]).toBe("Sora, siccome ti fa male la testa, dovresti riposare.");
  });

  it("health-advice-2-t4 (Emi vocative) says 'you have a fever' (EN)/'hai la febbre' (IT), never the first-person 'I have a fever'/'ho la febbre'", () => {
    expect(ha2.en["health-advice-2-t4-translation"]).toBe("Emi, since you have a fever, you should go to the hospital.");
    expect(ha2.it["health-advice-2-t4-translation"]).toBe("Emi, siccome hai la febbre, dovresti andare in ospedale.");
  });

  it("never uses the mis-copied first-person EN/IT possessive+verb pairs in m7/m8/t3/t4", () => {
    for (const id of ["health-advice-2-m7", "health-advice-2-m8", "health-advice-2-t3", "health-advice-2-t4"]) {
      const en = ha2.en[`${id}-translation`];
      const it = ha2.it[`${id}-translation`];
      expect(en, id).not.toMatch(/\bmy head hurts\b/i);
      expect(en, id).not.toMatch(/\bI have a fever\b/i);
      expect(it, id).not.toMatch(/mi fa male/i);
      expect(it, id).not.toMatch(/\bho la febbre\b/i);
    }
  });
});

describe("A2 Module 10 — bilingual copy coverage", () => {
  it("every model+transfer variant has an EN and IT translation entry", () => {
    for (const built of module10Lessons) {
      for (const variant of built.variants) {
        const translationKey = `${variant.id}-translation`;
        expect(built.en[translationKey], `${variant.id} en`).toBeTruthy();
        expect(built.it[translationKey], `${variant.id} it`).toBeTruthy();
      }
    }
  });

  it("has no Japanese literal in any EN/IT copy value", () => {
    const JAPANESE_PATTERN = /[\u3040-\u30ff\u4e00-\u9fff]/;
    for (const built of module10Lessons) {
      for (const value of [...Object.values(built.en), ...Object.values(built.it)]) {
        expect(JAPANESE_PATTERN.test(value), value).toBe(false);
      }
    }
  });
});
