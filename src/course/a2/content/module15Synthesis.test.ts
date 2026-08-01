/**
 * A2 Module 15 (a2-synthesis) - the capstone contract-synthesis module
 * (Phase 3 Task 7).
 *
 * Four synthesis lessons, each a bounded, lived scenario that recombines
 * ONLY families/senses/values already taught in M1-M14 - `contract:
 * "synthesis"`, `introducedConceptIds: []`, `introducedSenseIds: []` on
 * every lesson, enforced by `defineA2Lesson` itself. as1 (scenario-weekend-
 * outing) supports intentions-plans/connectors; as2 (scenario-service-
 * shopping) supports compare/permission-temoii; as3 (scenario-health-
 * absence) supports reason-kara/request-tekudasai; as4 (scenario-trip-
 * recount, the checkpoint scenario) supports experience-takoto/recognize-
 * plain-forms. Every one of the 15 grammar-spiral forms recurs across these
 * four lessons (see `forms/grammarSpiral.ts`) - some as a labeled recipe
 * support, the rest as genuine, unlabeled content evidence (mirroring the
 * established "recipe caps supports at two" precedent). `a2-synthesis`
 * introduces no new kanji glyph (only lesson 4 carries the 4 assessed-stage
 * exposures for 料/金/開/閉, scheduled by the frozen Task 3 kanji catalog).
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
import { A2_GRAMMAR_SPIRAL } from "../forms/grammarSpiral";
import { module15Lessons, module15Recipe } from "./module15Synthesis";

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

describe("A2 Module 15 (a2-synthesis) — exactly 4 lessons, canonical order", () => {
  it("declares exactly a2-synthesis-1..4 in order 1..4", () => {
    expect(module15Lessons.map((b) => b.recipe.id)).toEqual([
      "a2-synthesis-1",
      "a2-synthesis-2",
      "a2-synthesis-3",
      "a2-synthesis-4",
    ]);
    expect(module15Lessons.map((b) => b.recipe.order)).toEqual([1, 2, 3, 4]);
    expect(module15Lessons.every((b) => b.recipe.moduleId === "a2-synthesis")).toBe(true);
  });

  it("declares every lesson with contract 'synthesis' and NO introduced concept/sense", () => {
    for (const built of module15Lessons) {
      expect(built.recipe.contract, built.recipe.id).toBe("synthesis");
    }
  });

  it("declares the exact primary/support Can-do mapping for M15", () => {
    const expected: Readonly<Record<string, { primary: string; supports: readonly string[] }>> = {
      "a2-synthesis-1": {
        primary: "a2-cando-scenario-weekend-outing",
        supports: ["a2-cando-intentions-plans", "a2-cando-connectors"],
      },
      "a2-synthesis-2": {
        primary: "a2-cando-scenario-service-shopping",
        supports: ["a2-cando-compare", "a2-cando-permission-temoii"],
      },
      "a2-synthesis-3": {
        primary: "a2-cando-scenario-health-absence",
        supports: ["a2-cando-reason-kara", "a2-cando-request-tekudasai"],
      },
      "a2-synthesis-4": {
        primary: "a2-cando-scenario-trip-recount",
        supports: ["a2-cando-experience-takoto", "a2-cando-recognize-plain-forms"],
      },
    };
    for (const built of module15Lessons) {
      expect(built.recipe.primaryCanDoId).toBe(expected[built.recipe.id].primary);
      expect(built.recipe.supportingCanDoIds).toEqual(expected[built.recipe.id].supports);
      expect(built.recipe.supportingCanDoIds.length).toBeLessThanOrEqual(2);
    }
  });

  it("declares module15Recipe with the exact 4 lesson ids", () => {
    expect(module15Recipe.lessonIds).toEqual([...module15Lessons.map((b) => b.recipe.id)]);
  });
});

describe("A2 Module 15 — per-lesson depth contract", () => {
  it.each(module15Lessons.map((b) => [b.recipe.id, b] as const))(
    "%s satisfies the A2 depth contract (8-12 models, 10 exercises, >=3 predicates/>=2 roles, >=2 contexts, >=5 unique targets, reuse <=2)",
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
      // Every module 15 lesson is a synthesis (capstone) lesson, and a
      // capstone is deliberately a two-speaker scene, so minRoles is 2 here.
      const expectedMinRoles = 2;
      expect(predicateSenses.size, `${lessonId} predicate diversity`).toBeGreaterThanOrEqual(3);
      expect(discourseRoles.size, `${lessonId} role diversity`).toBeGreaterThanOrEqual(expectedMinRoles);
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

describe("A2 Module 15 — kanji exposure wiring (introduces NO new glyph)", () => {
  it("a2-synthesis-1..3 have NO kanji exposures scheduled at all", () => {
    for (const lessonId of ["a2-synthesis-1", "a2-synthesis-2", "a2-synthesis-3"]) {
      expect(a2KanjiExposureIdsForLesson(lessonId), lessonId).toEqual([]);
    }
  });

  it("a2-synthesis-4 carries exactly the 4 assessed-stage exposures for 料/金/開/閉 (M14-B), all resolving to lessonId a2-synthesis-4 and stage 'assessed'", () => {
    const as4 = module15Lessons[3];
    const expectedIds = a2KanjiExposureIdsForLesson("a2-synthesis-4");
    expect(as4.recipe.kanjiExposureIds).toEqual(expectedIds);
    expect(as4.recipe.kanjiExposureIds).toHaveLength(4);
    for (const exposureId of as4.recipe.kanjiExposureIds) {
      const exposure = A2_KANJI_EXPOSURES.find((e) => e.id === exposureId);
      expect(exposure, exposureId).toBeDefined();
      expect(exposure?.lessonId).toBe("a2-synthesis-4");
      expect(exposure?.stage).toBe("assessed");
    }
  });

  it("no lesson's kanjiExposureIds includes a first-supported stage (a2-synthesis introduces no new glyph)", () => {
    for (const built of module15Lessons) {
      for (const exposureId of built.recipe.kanjiExposureIds) {
        const exposure = A2_KANJI_EXPOSURES.find((e) => e.id === exposureId);
        expect(exposure?.stage, exposureId).not.toBe("first-supported");
      }
    }
  });
});

describe("A2 Module 15 — every grammar-spiral form recurring at a2-synthesis-1..4 has genuine content evidence", () => {
  const A2_SYNTHESIS_LESSON_IDS = ["a2-synthesis-1", "a2-synthesis-2", "a2-synthesis-3", "a2-synthesis-4"];
  const variantsByLesson = new Map(module15Lessons.map((b) => [b.recipe.id, b.variants]));
  const familyCanDoIds = new Map(a2SentenceFamilies.map((f) => [f.id, f.canDoIds]));

  it.each(A2_GRAMMAR_SPIRAL.flatMap((row) => row.recurrenceLessonIds.map((lessonId) => [row.id, row.canDoId, lessonId] as const)).filter(([, , lessonId]) => A2_SYNTHESIS_LESSON_IDS.includes(lessonId)))(
    "grammar form %s (%s) has real content evidence at its recurrence lesson %s",
    (_formId, canDoId, lessonId) => {
      const variants = variantsByLesson.get(lessonId) ?? [];
      const matching = variants.filter((v) => (familyCanDoIds.get(v.sentenceFamilyId) ?? []).includes(canDoId));
      expect(matching.length, `${lessonId}:${canDoId}`).toBeGreaterThan(0);
    },
  );
});

describe("A2 Module 15 — the 4 scenario Can-dos each have genuine TRANSFER evidence (extended, never new, families)", () => {
  it("a2-synthesis-1 has a TRANSFER using a2-family-plan-yotei (extended to also serve scenario-weekend-outing)", () => {
    const as1 = module15Lessons[0];
    const transfers = as1.variants.filter((v) => v.pedagogicalUse === "transfer");
    expect(transfers.some((v) => v.sentenceFamilyId === "a2-family-plan-yotei")).toBe(true);
  });

  it("a2-synthesis-2 has a TRANSFER using a2-family-comparison-favor (extended to also serve scenario-service-shopping)", () => {
    const as2 = module15Lessons[1];
    const transfers = as2.variants.filter((v) => v.pedagogicalUse === "transfer");
    expect(transfers.some((v) => v.sentenceFamilyId === "a2-family-comparison-favor")).toBe(true);
  });

  it("a2-synthesis-3 has a TRANSFER using a2-family-reason-kara (extended to also serve scenario-health-absence)", () => {
    const as3 = module15Lessons[2];
    const transfers = as3.variants.filter((v) => v.pedagogicalUse === "transfer");
    expect(transfers.some((v) => v.sentenceFamilyId === "a2-family-reason-kara")).toBe(true);
  });

  it("a2-synthesis-4 has a TRANSFER using a2-family-experience-takoto (extended to also serve scenario-trip-recount)", () => {
    const as4 = module15Lessons[3];
    const transfers = as4.variants.filter((v) => v.pedagogicalUse === "transfer");
    expect(transfers.some((v) => v.sentenceFamilyId === "a2-family-experience-takoto")).toBe(true);
  });
});

describe("A2 Module 15 — exact realized Japanese/rōmaji spot checks", () => {
  it("realizes every module-15 synthesis variant through the shared formatter with no errors", () => {
    for (const built of module15Lessons) {
      for (const variant of built.variants) {
        const sentence = realize(variant);
        const romaji = formatRomaji(sentence.tokens);
        expect(romaji.ok, `${variant.id} romaji`).toBe(true);
      }
    }
  });
});

describe("A2 Module 15 — bilingual copy coverage", () => {
  it("every model+transfer variant has an EN and IT translation entry", () => {
    for (const built of module15Lessons) {
      for (const variant of built.variants) {
        const translationKey = `${variant.id}-translation`;
        expect(built.en[translationKey], `${variant.id} en`).toBeTruthy();
        expect(built.it[translationKey], `${variant.id} it`).toBeTruthy();
      }
    }
  });

  it("has no Japanese literal in any EN/IT copy value", () => {
    const JAPANESE_PATTERN = /[\u3040-\u30ff\u4e00-\u9fff]/;
    for (const built of module15Lessons) {
      for (const value of [...Object.values(built.en), ...Object.values(built.it)]) {
        expect(JAPANESE_PATTERN.test(value), value).toBe(false);
      }
    }
  });
});

describe("A2 Module 15 — linguistic-fidelity regressions (Task 7 quality pass)", () => {
  const byId = new Map<string, SentenceVariant>();
  const enById = new Map<string, string>();
  const itById = new Map<string, string>();
  for (const built of module15Lessons) {
    for (const variant of built.variants) {
      byId.set(variant.id, variant);
      enById.set(variant.id, built.en[`${variant.id}-translation`] ?? "");
      itById.set(variant.id, built.it[`${variant.id}-translation`] ?? "");
    }
  }
  const realizedJp = (id: string) => realize(byId.get(id) as SentenceVariant).canonicalJapanese;
  const terminalKaCount = (jp: string) => (jp.match(/か+$/)?.[0].length ?? 0);

  describe("I1 — M15 permission-temoii lines are real permission QUESTIONS, not permission-granted statements", () => {
    it("a2-synthesis-2-m5 realizes as これをたべてもいいですか (interrogative, single terminal か, object これ present)", () => {
      const variant = byId.get("a2-synthesis-2-m5") as SentenceVariant;
      expect(variant.slotValues.object, "object slot").toBe("a2-value-obj-kore-m6");
      const jp = realizedJp("a2-synthesis-2-m5");
      expect(jp).toBe("これをたべてもいいですか");
      expect(jp.startsWith("これを"), "object leads the clause").toBe(true);
      expect(jp.endsWith("か"), "terminal question particle").toBe(true);
      expect(terminalKaCount(jp), "no duplicated terminal か").toBe(1);
      expect(enById.get("a2-synthesis-2-m5")).toMatch(/^May I eat this\?$/);
      expect(itById.get("a2-synthesis-2-m5")).toMatch(/^Posso mangiare questo\?$/);
    });

    it("a2-synthesis-2-t2 realizes as みずをのんでもいいですか (interrogative, single terminal か, object みず present)", () => {
      const variant = byId.get("a2-synthesis-2-t2") as SentenceVariant;
      expect(variant.slotValues.object, "object slot").toBe("a2-value-obj-mizu");
      const jp = realizedJp("a2-synthesis-2-t2");
      expect(jp).toBe("みずをのんでもいいですか");
      expect(jp.startsWith("みずを"), "object leads the clause").toBe(true);
      expect(jp.endsWith("か"), "terminal question particle").toBe(true);
      expect(terminalKaCount(jp), "no duplicated terminal か").toBe(1);
      expect(enById.get("a2-synthesis-2-t2")).toMatch(/^May I drink water\?$/);
      expect(itById.get("a2-synthesis-2-t2")).toMatch(/^Posso bere l'acqua\?$/);
    });

    it("neither permission-temoii gloss still uses the awkward 'try (eat/drink)' / 'assaggiar' phrasing", () => {
      for (const id of ["a2-synthesis-2-m5", "a2-synthesis-2-t2"]) {
        expect(enById.get(id), `${id} en`).not.toMatch(/try/i);
        expect(itById.get(id), `${id} it`).not.toMatch(/assaggi/i);
      }
    });
  });

  describe("M3 — M15 s1 glosses carry every content word the Japanese realizes", () => {
    it("a2-synthesis-1-m2 gloss includes 'this weekend' (こんしゅうのしゅうまつ) in EN and IT", () => {
      expect(realizedJp("a2-synthesis-1-m2")).toContain("こんしゅうのしゅうまつ");
      expect(enById.get("a2-synthesis-1-m2")).toMatch(/this weekend/i);
      expect(itById.get("a2-synthesis-1-m2")).toMatch(/questo weekend|questo fine settimana/i);
    });

    it("a2-synthesis-1-m3 gloss includes 'at the sea' (うみで) in EN and IT", () => {
      expect(realizedJp("a2-synthesis-1-m3")).toContain("うみで");
      expect(enById.get("a2-synthesis-1-m3")).toMatch(/at the sea|in the sea/i);
      expect(itById.get("a2-synthesis-1-m3")).toMatch(/al mare|nel mare/i);
    });

    it("a2-synthesis-1-t1 gloss includes 'weekend' (しゅうまつ) in EN and IT", () => {
      expect(realizedJp("a2-synthesis-1-t1")).toContain("しゅうまつ");
      expect(enById.get("a2-synthesis-1-t1")).toMatch(/weekend/i);
      expect(itById.get("a2-synthesis-1-t1")).toMatch(/weekend|fine settimana/i);
    });
  });

  describe("M4 — M15 s3 m5 makes no say/report claim the Japanese never states", () => {
    it("a2-synthesis-3-m5 gloss has no reporting verb (says/dice che) and matches the delayed-train proposition", () => {
      expect(realizedJp("a2-synthesis-3-m5")).toBe("ともだちはでんしゃがおくれていますから、すこしおくれます");
      const en = enById.get("a2-synthesis-3-m5") ?? "";
      const it = itById.get("a2-synthesis-3-m5") ?? "";
      expect(en, "no reporting verb in EN").not.toMatch(/\bsays?\b|\btells?\b|\bsaid\b/i);
      expect(it, "no reporting verb in IT").not.toMatch(/\bdice\b|\bdicono\b|\bdetto\b/i);
      expect(en).toMatch(/friend/i);
      expect(en).toMatch(/late/i);
      expect(en).toMatch(/train/i);
      expect(en).toMatch(/delay/i);
      expect(it).toMatch(/amico/i);
      expect(it).toMatch(/treno/i);
      expect(it).toMatch(/ritardo|tardi/i);
    });
  });

  describe("M3b — a2-synthesis-1-m4 gloss reflects the きょうは time-topic present in the Japanese, consistent with sibling t2", () => {
    it("a2-synthesis-1-m4 JP contains きょうは, EN contains 'Today', IT contains 'Oggi'", () => {
      const jp = realizedJp("a2-synthesis-1-m4");
      expect(jp, "JP must open with the time-topic きょうは").toContain("きょうは");
      expect(enById.get("a2-synthesis-1-m4"), "EN gloss must include Today").toMatch(/Today/);
      expect(itById.get("a2-synthesis-1-m4"), "IT gloss must include Oggi").toMatch(/Oggi/);
    });
  });

  describe("M5 — M15 s1-t4 gloss preserves the baked ともだちに friend argument", () => {
    it("a2-synthesis-1-t4 JP realizes with ともだちに, EN includes 'a friend', IT includes 'amico'", () => {
      const jp = realizedJp("a2-synthesis-1-t4");
      expect(jp, "JP must contain the baked ともだちに argument").toContain("ともだちに");
      expect(enById.get("a2-synthesis-1-t4"), "EN gloss must mention 'a friend'").toMatch(/a friend/i);
      expect(itById.get("a2-synthesis-1-t4"), "IT gloss must mention 'amico'").toMatch(/amico/i);
    });
  });

  describe("M15-3 — non-past て-sequence lines must not be glossed in past tense", () => {
    it("a2-synthesis-3-m8 JP ends in non-past かえります; EN/IT use present-tense, not past", () => {
      const jp = realizedJp("a2-synthesis-3-m8");
      expect(jp, "JP is しごとがおわって、いえにかえります").toBe("しごとがおわって、いえにかえります");
      expect(jp.endsWith("かえります"), "final verb is non-past かえります").toBe(true);
      const en = enById.get("a2-synthesis-3-m8") ?? "";
      const it = itById.get("a2-synthesis-3-m8") ?? "";
      expect(en, "EN must not use past 'went home'").not.toMatch(/went home/i);
      expect(en, "EN must not use past 'finished' as final predicate").not.toMatch(/^Work finished/i);
      expect(en, "EN present: finishes / go home").toMatch(/finish(?:es)?.*go\s+home|go\s+home/i);
      expect(it, "IT must not use past 'sono tornato a casa'").not.toMatch(/sono tornato a casa/i);
      expect(it, "IT present: finisce / torno").toMatch(/torno a casa/i);
    });

    it("a2-synthesis-3-t3 JP ends in non-past ねます; EN/IT use present-tense, not past", () => {
      const jp = realizedJp("a2-synthesis-3-t3");
      expect(jp, "JP is かおをあらって、ねます").toBe("かおをあらって、ねます");
      expect(jp.endsWith("ねます"), "final verb is non-past ねます").toBe(true);
      const en = enById.get("a2-synthesis-3-t3") ?? "";
      const it = itById.get("a2-synthesis-3-t3") ?? "";
      expect(en, "EN must not use past 'washed'").not.toMatch(/\bwashed\b/i);
      expect(en, "EN must not use past 'went to sleep'").not.toMatch(/went to sleep/i);
      expect(en, "EN present: wash / go to sleep").toMatch(/wash.*face/i);
      expect(en, "EN present: go to sleep").toMatch(/go to sleep/i);
      expect(it, "IT must not use past 'mi sono lavato'").not.toMatch(/mi sono lavato/i);
      expect(it, "IT must not use past 'sono andato a dormire'").not.toMatch(/sono andato a dormire/i);
      expect(it, "IT present: mi lavo / vado a dormire").toMatch(/mi lavo la faccia/i);
      expect(it, "IT present: vado a dormire").toMatch(/vado a dormire/i);
    });
  });

  describe("M15-5 — びょうきだったので、がっこうをやすみました must convey school absence, not generic rest", () => {
    it("a2-synthesis-3-t5 JP contains がっこうを (explicit school object); EN/IT reference school absence", () => {
      const jp = realizedJp("a2-synthesis-3-t5");
      expect(jp, "JP is びょうきだったので、がっこうをやすみました").toBe(
        "びょうきだったので、がっこうをやすみました",
      );
      expect(jp, "JP must include explicit がっこうを").toContain("がっこうを");
      const en = enById.get("a2-synthesis-3-t5") ?? "";
      const it = itById.get("a2-synthesis-3-t5") ?? "";
      expect(en, "EN must mention school").toMatch(/school/i);
      expect(en, "EN must convey absence from school, not merely rested").toMatch(
        /stayed home from school|absent from school|missed school|home from school/i,
      );
      expect(it, "IT must mention scuola").toMatch(/scuola/i);
      expect(it, "IT must not be merely generic 'ho riposato' without school").not.toMatch(
        /^Ero malato, quindi ho riposato\.$/,
      );
    });
  });
});
