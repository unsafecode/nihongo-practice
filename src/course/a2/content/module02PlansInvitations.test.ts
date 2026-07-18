/**
 * A2 Module 2 (plans-invitations) — module-local depth gate (Phase 3 Task 4).
 *
 * Four instructional lessons: pi1/pi2 intentions-plans (yotei/tsumori), pi3
 * invite-accept-decline, pi4 arrange-meeting. Mirrors A1's
 * `modules01to04.test.ts` rigor: assembles a real foundation catalog from
 * the actual release data (never a fixture), realizes every instructional
 * variant through the shared realizer, and asserts the exact depth contract.
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
import { module2Lessons, module2Recipe } from "./module02PlansInvitations";

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

describe("A2 Module 2 (plans-invitations) — exactly 4 lessons, canonical order", () => {
  it("declares exactly plans-invitations-1..4 in order 1..4", () => {
    expect(module2Lessons.map((b) => b.recipe.id)).toEqual([
      "plans-invitations-1",
      "plans-invitations-2",
      "plans-invitations-3",
      "plans-invitations-4",
    ]);
    expect(module2Lessons.map((b) => b.recipe.order)).toEqual([1, 2, 3, 4]);
    expect(module2Lessons.every((b) => b.recipe.moduleId === "plans-invitations")).toBe(true);
  });

  it("declares the exact primary/support Can-do mapping for M2", () => {
    const expected: Readonly<Record<string, { primary: string; supports: readonly string[] }>> = {
      "plans-invitations-1": { primary: "a2-cando-intentions-plans", supports: [] },
      "plans-invitations-2": { primary: "a2-cando-intentions-plans", supports: ["a2-cando-recognize-plain-forms"] },
      "plans-invitations-3": { primary: "a2-cando-invite-accept-decline", supports: ["a2-cando-intentions-plans"] },
      "plans-invitations-4": { primary: "a2-cando-arrange-meeting", supports: ["a2-cando-intentions-plans"] },
    };
    for (const built of module2Lessons) {
      expect(built.recipe.primaryCanDoId).toBe(expected[built.recipe.id].primary);
      expect(built.recipe.supportingCanDoIds).toEqual(expected[built.recipe.id].supports);
      expect(built.recipe.supportingCanDoIds.length).toBeLessThanOrEqual(2);
    }
  });

  it("declares module2Recipe with the exact 4 lesson ids", () => {
    expect(module2Recipe.lessonIds).toEqual([...module2Lessons.map((b) => b.recipe.id)]);
  });
});

describe("A2 Module 2 — per-lesson depth contract", () => {
  it.each(module2Lessons.map((b) => [b.recipe.id, b] as const))(
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

describe("A2 Module 2 — kanji exposure wiring", () => {
  it.each(module2Lessons.map((b) => [b.recipe.id, b] as const))(
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

  it("pi1 includes exactly 6 newly first-supported glyphs (予定曜会今日) plus cc's carried-over assessed exposures", () => {
    const pi1 = module2Lessons[0];
    // pi1 is the 6 new first-supported glyphs (予定曜会今日) PLUS the 4
    // assessed-stage exposures carried over from cc2's 思名前何 (scheduled to
    // reach "assessed" here per the real Task 3 schedule) — 10 total.
    const firstSupported = pi1.recipe.kanjiExposureIds.filter(
      (id) => A2_KANJI_EXPOSURES.find((e) => e.id === id)?.stage === "first-supported",
    );
    expect(firstSupported).toHaveLength(6);
    expect(pi1.recipe.kanjiExposureIds).toHaveLength(10);
  });
});

describe("A2 Module 2 — connected discourse markers (no isolated grammar drill)", () => {
  it("pi1's yotei models are complete よてい statements naming a real plan", () => {
    const pi1 = module2Lessons[0];
    const models = pi1.variants.filter((v) => v.pedagogicalUse === "model");
    const sentences = models.map(realize);
    for (const s of sentences) {
      expect(s.canonicalJapanese).toContain("よてい");
      expect(s.canonicalJapanese).toContain("です");
    }
  });

  it("pi3's invite/respond models form a genuine exchange (some invite ませんか/ましょうか, some accept/decline)", () => {
    const pi3 = module2Lessons[2];
    const models = pi3.variants.filter((v) => v.pedagogicalUse === "model");
    const sentences = models.map(realize);
    const hasInvite = sentences.some((s) => s.canonicalJapanese.includes("か"));
    const hasResponse = sentences.some(
      (s) => s.canonicalJapanese.includes("いいですね") || s.canonicalJapanese.includes("すみません"),
    );
    expect(hasInvite).toBe(true);
    expect(hasResponse).toBe(true);
  });
});

// C1 spec-fix ("translation/Japanese fact mismatch"): pi1-m1/pi1-t1's EN/IT
// copy both explicitly assert "I plan to go to **Kyoto**" — the realized
// Japanese must actually name Kyoto (with a direction/goal particle), never
// realize only the bare "いくよていです" (I plan to go — go where?), which
// silently drops the one fact the copy promises.
describe("A2 Module 2 — JP/copy fidelity (C1 spec-fix: Kyoto fact must appear in the Japanese)", () => {
  it("pi1-m1 and pi1-t1 (a2-value-yotei-iku-kyouto) realize a Kyoto destination, matching their own copy's Kyoto claim", () => {
    const pi1 = module2Lessons[0];
    for (const id of ["plans-invitations-1-m1", "plans-invitations-1-t1"]) {
      const variant = pi1.variants.find((v) => v.id === id);
      expect(variant, id).toBeDefined();
      const sentence = realize(variant as SentenceVariant);
      expect(sentence.canonicalJapanese, `${id} must name Kyoto`).toContain("きょうと");
      // Still a plan statement, not merely a location — the grammar point
      // (よてい) must survive the fix intact.
      expect(sentence.canonicalJapanese).toContain("よてい");
      expect(sentence.canonicalJapanese).toContain("です");
    }
  });
});

describe("A2 Module 2 — exact realized Japanese/rōmaji spot checks", () => {
  it("realizes every module-2 instructional variant through the shared formatter with no errors", () => {
    for (const built of module2Lessons) {
      for (const variant of built.variants) {
        const sentence = realize(variant);
        const romaji = formatRomaji(sentence.tokens);
        expect(romaji.ok, `${variant.id} romaji`).toBe(true);
      }
    }
  });

  // Exact-string regression (Phase 3 Task 4 spec-fix): `romaji.ok === true`
  // only proves every token is individually well-formed — it does not catch
  // an invitation predicate built from the plain DICTIONARY form (たべる)
  // instead of the required ます-stem (たべ) before ませんか. たべるませんか is a
  // "well-formed" token sequence but not real Japanese; only an exact string
  // assertion catches it.
  it("realizes plans-invitations-3-m3 (invite-shokuji) to the exact たべませんか ます-stem invitation, never たべるませんか", () => {
    const pi3 = module2Lessons[2];
    const m3 = pi3.variants.find((v) => v.id === "plans-invitations-3-m3");
    expect(m3).toBeDefined();
    const sentence = realize(m3 as SentenceVariant);
    const romaji = formatRomaji(sentence.tokens);
    expect(romaji.ok).toBe(true);
    if (!romaji.ok) throw new Error("unreachable");
    expect(sentence.canonicalJapanese).toBe("いっしょにしょくじをたべませんか");
    expect(romaji.text).toBe("issho ni shokuji o tabemasen ka");
    expect(sentence.canonicalJapanese).not.toContain("たべるませんか");
  });

  // I2 spec-fix ("true transfer failure"): t2 used to mirror m3's exact
  // slots (same bare no-subject predicate), realizing byte-identical
  // Japanese. It now recombines the same predicate with an already-modeled
  // named addressee (emi), proving the ます-stem fix (たべませんか, never
  // たべるませんか) still holds for this new, genuinely novel combination.
  it("realizes plans-invitations-3-t2 (invite-shokuji, emi recombined as addressee) to the exact たべませんか ます-stem, distinct from m3", () => {
    const pi3 = module2Lessons[2];
    const t2 = pi3.variants.find((v) => v.id === "plans-invitations-3-t2");
    expect(t2).toBeDefined();
    const sentence = realize(t2 as SentenceVariant);
    const romaji = formatRomaji(sentence.tokens);
    expect(romaji.ok).toBe(true);
    if (!romaji.ok) throw new Error("unreachable");
    expect(sentence.canonicalJapanese).toBe("えみはいっしょにしょくじをたべませんか");
    expect(romaji.text).toBe("emi wa issho ni shokuji o tabemasen ka");
    expect(sentence.canonicalJapanese).not.toContain("たべるませんか");
    expect(sentence.canonicalJapanese).not.toBe("いっしょにしょくじをたべませんか");
  });

  it("realizes plans-invitations-3-m7 (invite-tomodachi-issho) to the exact こんばん...たべませんか invitation, never たべるませんか", () => {
    const pi3 = module2Lessons[2];
    const m7 = pi3.variants.find((v) => v.id === "plans-invitations-3-m7");
    expect(m7).toBeDefined();
    const sentence = realize(m7 as SentenceVariant);
    const romaji = formatRomaji(sentence.tokens);
    expect(romaji.ok).toBe(true);
    if (!romaji.ok) throw new Error("unreachable");
    expect(sentence.canonicalJapanese).toBe("こんばんいっしょにしょくじをたべませんか");
    expect(romaji.text).toBe("konban issho ni shokuji o tabemasen ka");
    expect(sentence.canonicalJapanese).not.toContain("たべるませんか");
  });
});

describe("A2 Module 2 — bilingual copy coverage", () => {
  it("every model+transfer variant has an EN and IT translation entry", () => {
    for (const built of module2Lessons) {
      for (const variant of built.variants) {
        const translationKey = `${variant.id}-translation`;
        expect(built.en[translationKey], `${variant.id} en`).toBeTruthy();
        expect(built.it[translationKey], `${variant.id} it`).toBeTruthy();
      }
    }
  });

  it("has no Japanese literal in any EN/IT copy value", () => {
    const JAPANESE_PATTERN = /[\u3040-\u30ff\u4e00-\u9fff]/;
    for (const built of module2Lessons) {
      for (const value of [...Object.values(built.en), ...Object.values(built.it)]) {
        expect(JAPANESE_PATTERN.test(value), value).toBe(false);
      }
    }
  });
});
