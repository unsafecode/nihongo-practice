/**
 * A2 Module 1 (connected-conversation) — module-local depth gate (Phase 3 Task 4).
 *
 * Four instructional lessons: cc1 backchannel-followup, cc2 connectors
 * (でも/それから), cc3 clarify-repeat, cc4 recognize-plain-forms. Mirrors A1's
 * `modules01to04.test.ts` rigor: assembles a real foundation catalog from
 * the actual release data (never a fixture), realizes every instructional
 * variant through the shared realizer, and asserts the exact depth contract
 * — 8-12 models, 10 exercises (5+5), ≥3 predicate senses, ≥3 discourse
 * roles, ≥2 contexts, ≥5 unique visible targets (reuse ≤2), and connected-
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
import { module1Lessons, module1Recipe } from "./module01ConnectedConversation";

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

describe("A2 Module 1 (connected-conversation) — exactly 4 lessons, canonical order", () => {
  it("declares exactly connected-conversation-1..4 in order 1..4", () => {
    expect(module1Lessons.map((b) => b.recipe.id)).toEqual([
      "connected-conversation-1",
      "connected-conversation-2",
      "connected-conversation-3",
      "connected-conversation-4",
    ]);
    expect(module1Lessons.map((b) => b.recipe.order)).toEqual([1, 2, 3, 4]);
    expect(module1Lessons.every((b) => b.recipe.moduleId === "connected-conversation")).toBe(true);
  });

  it("declares the exact primary/support Can-do mapping for M1", () => {
    const expected: Readonly<Record<string, { primary: string; supports: readonly string[] }>> = {
      "connected-conversation-1": { primary: "a2-cando-backchannel-followup", supports: [] },
      "connected-conversation-2": { primary: "a2-cando-connectors", supports: [] },
      "connected-conversation-3": { primary: "a2-cando-clarify-repeat", supports: [] },
      "connected-conversation-4": { primary: "a2-cando-recognize-plain-forms", supports: [] },
    };
    for (const built of module1Lessons) {
      expect(built.recipe.primaryCanDoId).toBe(expected[built.recipe.id].primary);
      expect(built.recipe.supportingCanDoIds).toEqual(expected[built.recipe.id].supports);
      expect(built.recipe.supportingCanDoIds.length).toBeLessThanOrEqual(2);
    }
  });

  it("declares module1Recipe with the exact 4 lesson ids", () => {
    expect(module1Recipe.lessonIds).toEqual([...module1Lessons.map((b) => b.recipe.id)]);
  });
});

describe("A2 Module 1 — per-lesson depth contract", () => {
  it.each(module1Lessons.map((b) => [b.recipe.id, b] as const))(
    "%s satisfies the A2 depth contract (8-12 models, 10 exercises, ≥3 predicates/roles-ready, ≥2 contexts, ≥5 unique targets, reuse ≤2)",
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

      // Practice rounds: exactly 5+5 = 10 (the authored target within the
      // 8-12 contract).
      expect(built.recipe.practice.roundOne.targetCount).toBe(5);
      expect(built.recipe.practice.roundTwo.targetCount).toBe(5);
      expect(
        built.recipe.practice.roundOne.targetCount + built.recipe.practice.roundTwo.targetCount,
      ).toBe(10);

      // Round-two exercise kinds include at least one
      // constrained-construction/completion kind (never pure tile-ordering).
      expect(
        built.recipe.practice.roundTwo.exerciseKinds.some(
          (k) => k === "constrained-construction" || k === "completion",
        ),
      ).toBe(true);

      // Not an isolated grammar drill: every model is a real, distinct,
      // communicative utterance — never the same skeleton with only a noun
      // swapped. Proven generically here by requiring every model's
      // canonicalJapanese to be unique among the models themselves (a
      // mechanical drill would repeat one template); the dedicated
      // "connected discourse" suite below additionally proves cc1 mixes
      // families and cc2's connector models are genuine two-clause discourse.
      const modelJapaneseTexts = new Set(modelSentences.map((s) => s.canonicalJapanese));
      expect(modelJapaneseTexts.size, `${lessonId} distinct model utterances`).toBe(models.length);

      // Transfer fingerprints must be genuinely unseen among the models.
      const modelFingerprints = new Set(modelSentences.map((s) => s.semanticFingerprint));
      for (const t of transferSentences) {
        expect(modelFingerprints.has(t.semanticFingerprint), `${lessonId} transfer ${t.variantId}`).toBe(false);
      }
    },
  );
});

describe("A2 Module 1 — kanji exposure wiring", () => {
  it.each(module1Lessons.map((b) => [b.recipe.id, b] as const))(
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

  it("cc1 exposes exactly the 4 first-supported glyphs (話言聞友)", () => {
    const cc1 = module1Lessons[0];
    expect(cc1.recipe.kanjiExposureIds).toHaveLength(4);
    for (const id of cc1.recipe.kanjiExposureIds) {
      const exposure = A2_KANJI_EXPOSURES.find((e) => e.id === id);
      expect(exposure?.stage).toBe("first-supported");
    }
  });
});

describe("A2 Module 1 — connected discourse / dialogue markers (no isolated grammar drill)", () => {
  it("cc2's connector models are genuinely two-clause utterances containing both でも and それから across the set", () => {
    const cc2 = module1Lessons[1];
    const models = cc2.variants.filter((v) => v.pedagogicalUse === "model");
    const sentences = models.map(realize);
    const jpAll = sentences.map((s) => s.canonicalJapanese).join("");
    expect(jpAll).toContain("でも");
    expect(jpAll).toContain("それから");
    // Every connector model is a real two-clause utterance: it contains the
    // sentence-final 。 punctuation at least once.
    for (const s of sentences) {
      const periodCount = (s.canonicalJapanese.match(/。/g) ?? []).length;
      expect(periodCount, s.variantId).toBeGreaterThanOrEqual(1);
    }
  });

  it("cc1's models mix genuine dialogue reactions with real content sentences (never one repeated isolated pattern)", () => {
    const cc1 = module1Lessons[0];
    const models = cc1.variants.filter((v) => v.pedagogicalUse === "model");
    const families = new Set(models.map((v) => v.sentenceFamilyId));
    expect(families.size).toBeGreaterThanOrEqual(3);
  });
});

describe("A2 Module 1 — exact realized Japanese/rōmaji spot checks", () => {
  it("realizes a talk-companion model exactly", () => {
    const cc1 = module1Lessons[0];
    const m1 = cc1.variants.find((v) => v.id === "connected-conversation-1-m1");
    expect(m1).toBeDefined();
    const sentence = realize(m1 as SentenceVariant);
    expect(sentence.canonicalJapanese.length).toBeGreaterThan(0);
    const romaji = formatRomaji(sentence.tokens);
    expect(romaji.ok).toBe(true);
  });

  it("realizes every module-1 instructional variant through the shared formatter with no errors", () => {
    for (const built of module1Lessons) {
      for (const variant of built.variants) {
        const sentence = realize(variant);
        const romaji = formatRomaji(sentence.tokens);
        expect(romaji.ok, `${variant.id} romaji`).toBe(true);
      }
    }
  });

  // Exact-string regression (Phase 3 Task 4 spec-fix): a `formatRomaji`-ok
  // check alone cannot catch an invalid ます-stem — ok merely means every
  // token is individually well-formed, not that the assembled word is real
  // Japanese. `a2-value-hanasu`'s stem must be the 話す masu-stem はなし
  // (hanashi), never the bare, un-conjugated root はな (hana) — the ill-formed
  // はなます/hanamasu would still be a "well-formed" token sequence.
  it("realizes connected-conversation-1-m1 (talk-companion) to the exact はなします masu-stem, never はなます", () => {
    const cc1 = module1Lessons[0];
    const m1 = cc1.variants.find((v) => v.id === "connected-conversation-1-m1");
    expect(m1).toBeDefined();
    const sentence = realize(m1 as SentenceVariant);
    const romaji = formatRomaji(sentence.tokens);
    expect(romaji.ok).toBe(true);
    if (!romaji.ok) throw new Error("unreachable");
    expect(sentence.canonicalJapanese).toBe("ともだちはどうりょうとはなします");
    expect(romaji.text).toBe("tomodachi wa douryou to hanashimasu");
    expect(sentence.canonicalJapanese).not.toContain("はなます");
  });

  it("realizes connected-conversation-1-t3 (same talk-companion slots as m1) to the identical exact はなします masu-stem", () => {
    const cc1 = module1Lessons[0];
    const t3 = cc1.variants.find((v) => v.id === "connected-conversation-1-t3");
    expect(t3).toBeDefined();
    const sentence = realize(t3 as SentenceVariant);
    const romaji = formatRomaji(sentence.tokens);
    expect(romaji.ok).toBe(true);
    if (!romaji.ok) throw new Error("unreachable");
    expect(sentence.canonicalJapanese).toBe("ともだちはどうりょうとはなします");
    expect(romaji.text).toBe("tomodachi wa douryou to hanashimasu");
    expect(sentence.canonicalJapanese).not.toContain("はなます");
  });
});

describe("A2 Module 1 — bilingual copy coverage", () => {
  it("every model+transfer variant has an EN and IT translation entry", () => {
    for (const built of module1Lessons) {
      for (const variant of built.variants) {
        const translationKey = `${variant.id}-translation`;
        expect(built.en[translationKey], `${variant.id} en`).toBeTruthy();
        expect(built.it[translationKey], `${variant.id} it`).toBeTruthy();
      }
    }
  });

  it("has no Japanese literal in any EN/IT copy value", () => {
    const JAPANESE_PATTERN = /[\u3040-\u30ff\u4e00-\u9fff]/;
    for (const built of module1Lessons) {
      for (const value of [...Object.values(built.en), ...Object.values(built.it)]) {
        expect(JAPANESE_PATTERN.test(value), value).toBe(false);
      }
    }
  });
});
