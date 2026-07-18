/**
 * A2 Module 8 (restaurant-problems) — module-local depth gate (Phase 3 Task 5).
 *
 * Four instructional lessons: rp1 order-food (menu
 * ordering; no comparison — that grammar is not introduced until
 * shopping-returns-1), rp2 special-request (tekudasai
 * controlled practice + temoii recurrence), rp3 report-problem (plain
 * description/reason content), rp4 pay-handle-problem (sequence-te
 * recurrence). Mirrors Module 1-7's rigor:
 * assembles a real foundation catalog from the actual release data,
 * realizes every instructional variant through the shared realizer, and
 * asserts the exact depth contract — 8-12 models, 10 exercises (5+5), >=3
 * predicate senses, >=3 discourse roles, >=2 contexts, >=5 unique visible
 * targets (reuse <=2), and connected restaurant dialogue.
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
import { module8Lessons, module8Recipe } from "./module08RestaurantProblems";

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

describe("A2 Module 8 (restaurant-problems) — exactly 4 lessons, canonical order", () => {
  it("declares exactly restaurant-problems-1..4 in order 1..4", () => {
    expect(module8Lessons.map((b) => b.recipe.id)).toEqual([
      "restaurant-problems-1",
      "restaurant-problems-2",
      "restaurant-problems-3",
      "restaurant-problems-4",
    ]);
    expect(module8Lessons.map((b) => b.recipe.order)).toEqual([1, 2, 3, 4]);
    expect(module8Lessons.every((b) => b.recipe.moduleId === "restaurant-problems")).toBe(true);
  });

  it("declares the exact primary/support Can-do mapping for M8", () => {
    const expected: Readonly<Record<string, { primary: string; supports: readonly string[] }>> = {
      "restaurant-problems-1": { primary: "a2-cando-order-food", supports: [] },
      "restaurant-problems-2": {
        primary: "a2-cando-special-request",
        supports: ["a2-cando-request-tekudasai", "a2-cando-permission-temoii"],
      },
      "restaurant-problems-3": { primary: "a2-cando-report-problem", supports: [] },
      "restaurant-problems-4": { primary: "a2-cando-pay-handle-problem", supports: ["a2-cando-sequence-te"] },
    };
    for (const built of module8Lessons) {
      expect(built.recipe.primaryCanDoId).toBe(expected[built.recipe.id].primary);
      expect(built.recipe.supportingCanDoIds).toEqual(expected[built.recipe.id].supports);
      expect(built.recipe.supportingCanDoIds.length).toBeLessThanOrEqual(2);
    }
  });

  it("declares module8Recipe with the exact 4 lesson ids", () => {
    expect(module8Recipe.lessonIds).toEqual([...module8Lessons.map((b) => b.recipe.id)]);
  });
});

describe("A2 Module 8 — per-lesson depth contract", () => {
  it.each(module8Lessons.map((b) => [b.recipe.id, b] as const))(
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

describe("A2 Module 8 — kanji exposure wiring", () => {
  it.each(module8Lessons.map((b) => [b.recipe.id, b] as const))(
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

  it("rp1 includes exactly the 4 new first-supported glyphs (食飲飯茶)", () => {
    const rp1 = module8Lessons[0];
    const firstSupported = rp1.recipe.kanjiExposureIds.filter(
      (id) => A2_KANJI_EXPOSURES.find((e) => e.id === id)?.stage === "first-supported",
    );
    expect(firstSupported).toHaveLength(4);
  });

  it("rp2 includes exactly the 4 new first-supported glyphs (肉魚熱冷)", () => {
    const rp2 = module8Lessons[1];
    const firstSupported = rp2.recipe.kanjiExposureIds.filter(
      (id) => A2_KANJI_EXPOSURES.find((e) => e.id === id)?.stage === "first-supported",
    );
    expect(firstSupported).toHaveLength(4);
  });
});

describe("A2 Module 8 — no unintroduced comparison grammar (corrected authoritative spiral)", () => {
  it("rp1 never uses a comparison construction (compare grammar is not introduced until shopping-returns-1)", () => {
    const rp1 = module8Lessons[0];
    const families = new Set(rp1.variants.map((v) => v.sentenceFamilyId));
    expect(families.has("a2-family-comparison")).toBe(false);
    for (const v of rp1.variants) {
      const sentence = realize(v);
      expect(sentence.canonicalJapanese).not.toContain("より");
      expect(sentence.canonicalJapanese).not.toContain("いちばん");
    }
  });

  it("rp3 never uses a comparison construction either", () => {
    const rp3 = module8Lessons[2];
    for (const v of rp3.variants) {
      const sentence = realize(v);
      expect(sentence.canonicalJapanese).not.toContain("より");
      expect(sentence.canonicalJapanese).not.toContain("いちばん");
    }
  });
});

describe("A2 Module 8 — connected restaurant dialogue (no isolated drill)", () => {
  it("rp2 mixes genuine tekudasai practice with temoii recurrence", () => {
    const rp2 = module8Lessons[1];
    const models = rp2.variants.filter((v) => v.pedagogicalUse === "model");
    const sentences = models.map(realize);
    const requestCount = sentences.filter((s) => s.canonicalJapanese.includes("ください")).length;
    const permissionCount = sentences.filter((s) => s.canonicalJapanese.includes("もいい")).length;
    expect(requestCount).toBeGreaterThanOrEqual(3);
    expect(permissionCount).toBeGreaterThanOrEqual(1);
  });

  it("rp4 recurs sequence-te (a comma joining two clauses in every model)", () => {
    const rp4 = module8Lessons[3];
    const models = rp4.variants.filter((v) => v.pedagogicalUse === "model");
    const sentences = models.map(realize);
    for (const s of sentences) {
      expect(s.canonicalJapanese).toContain("、");
    }
    const families = new Set(models.map((v) => v.sentenceFamilyId));
    expect(families.has("a2-family-te-sequence")).toBe(true);
  });
});

// M8 spec-fix regression (Phase 3 Task 5): a fresh review found two
// explicit-third-party-subject transfers recombined with a predicate that
// cannot naturally take one. rp1-t3 paired an explicit "a2-referent-colleague"
// with "a2-value-order-sorede-ii" — a first-person confirmation interjection
// (はい、それでいいです, "Yes, that's fine") — producing an unnatural
// interjection-plus-topic sentence. rp3-t4 paired an explicit
// "a2-referent-teacher" with "a2-value-problem-nioi", whose own clause
// already bakes its own topic (さかなは, "as for the fish") — producing a
// double-topic sentence. Both are fixed by recombining with a predicate this
// family already establishes is safe for an explicit third-party subject
// (kore-kudasai/a "asks for X" request, exactly like t4/t5's own
// issho-ni/onegai; atsui, が-marked with no baked topic, exactly like
// t2/t3/t5's own tsumetai/tarinai/daremo-konai).
describe("A2 Module 8 — spec-fix: no interjection-topic/double-topic on an explicit third-party subject", () => {
  const UNSAFE_EXPLICIT_SUBJECT_PREDICATES: ReadonlySet<string> = new Set([
    // First-person confirmation interjection (はい、...) — cannot be
    // naturally attributed to an explicit third party.
    "a2-value-order-sorede-ii",
    // Bakes its own topic (さかなは) — stacking an explicit subject creates
    // a double-topic sentence.
    "a2-value-problem-nioi",
  ]);

  it("restaurant-problems-1-t3 recombines the natural kore-kudasai request (\"asks for this one\"), never the sorede-ii confirmation interjection, with its explicit colleague subject", () => {
    const rp1 = module8Lessons[0];
    const t3 = rp1.variants.find((v) => v.id === "restaurant-problems-1-t3");
    expect(t3, "restaurant-problems-1-t3").toBeDefined();
    expect(t3?.slotValues.predicate).toBe("a2-value-order-kore-kudasai");
    expect(rp1.en["restaurant-problems-1-t3-translation"]).toBe("A colleague asks for this one.");
    expect(rp1.it["restaurant-problems-1-t3-translation"]).toBe("Un collega chiede questo.");
  });

  it("restaurant-problems-3-t4 recombines the natural が-marked atsui problem (\"the tea is too hot\"), never the topic-baked nioi problem, with its explicit teacher subject", () => {
    const rp3 = module8Lessons[2];
    const t4 = rp3.variants.find((v) => v.id === "restaurant-problems-3-t4");
    expect(t4, "restaurant-problems-3-t4").toBeDefined();
    expect(t4?.slotValues.predicate).toBe("a2-value-problem-atsui");
    expect(rp3.en["restaurant-problems-3-t4-translation"]).toBe("The teacher says the tea is too hot.");
    expect(rp3.it["restaurant-problems-3-t4-translation"]).toBe("L'insegnante dice che il tè è troppo caldo.");
  });

  it("never combines an explicit third-party subject with an unsafe interjection/topic-baked predicate anywhere in M8", () => {
    const violations: string[] = [];
    for (const built of module8Lessons) {
      for (const variant of built.variants) {
        if (
          variant.discourse.subjectRealization === "explicit" &&
          variant.slotValues.predicate &&
          UNSAFE_EXPLICIT_SUBJECT_PREDICATES.has(variant.slotValues.predicate)
        ) {
          violations.push(`${variant.id}: explicit subject combined with unsafe predicate "${variant.slotValues.predicate}"`);
        }
      }
    }
    expect(violations, violations.join("\n")).toEqual([]);
  });
});

describe("A2 Module 8 — exact realized Japanese/rōmaji spot checks", () => {
  it("realizes every module-8 instructional variant through the shared formatter with no errors", () => {
    for (const built of module8Lessons) {
      for (const variant of built.variants) {
        const sentence = realize(variant);
        const romaji = formatRomaji(sentence.tokens);
        expect(romaji.ok, `${variant.id} romaji`).toBe(true);
      }
    }
  });
});

describe("A2 Module 8 — bilingual copy coverage", () => {
  it("every model+transfer variant has an EN and IT translation entry", () => {
    for (const built of module8Lessons) {
      for (const variant of built.variants) {
        const translationKey = `${variant.id}-translation`;
        expect(built.en[translationKey], `${variant.id} en`).toBeTruthy();
        expect(built.it[translationKey], `${variant.id} it`).toBeTruthy();
      }
    }
  });

  it("has no Japanese literal in any EN/IT copy value", () => {
    const JAPANESE_PATTERN = /[\u3040-\u30ff\u4e00-\u9fff]/;
    for (const built of module8Lessons) {
      for (const value of [...Object.values(built.en), ...Object.values(built.it)]) {
        expect(JAPANESE_PATTERN.test(value), value).toBe(false);
      }
    }
  });
});
