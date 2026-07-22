/**
 * A2 exhaustive editorial / linguistic gate (Phase 3 Task 9 exit gate).
 *
 * The whole-level editorial regression surface. It inspects EVERY authored A2
 * sentence variant (all 806) EXACTLY ONCE — the count and unique-id gate below
 * fail closed the moment a variant is added, removed, or duplicated so none
 * can escape review — and holds each one to two independent standards:
 *
 *  1. A reviewed, frozen golden surface table
 *     (`a2EditorialSurfaces.golden.json`, produced by
 *     `scripts/generateA2EditorialGolden.ts` in a prior run and checked in
 *     after human review). This test reads it read-only and NEVER regenerates
 *     it, so the expected exact Japanese, exact rōmaji, register/form
 *     metadata, and the 1,612 EN/IT gloss cells come from a frozen artifact a
 *     reviewer signed off on — never from the actual realization in the same
 *     run. That is what makes the surface gate incapable of self-confirming.
 *
 *  2. An independent linguistic oracle that derives its expectations from the
 *     authored *metadata* (the variant's `form`, its family's realization
 *     rule and case frame), never from the realized string, and checks the
 *     actual `realizeVariant` output against them: register/form honesty,
 *     interrogative honesty, per-rule case-frame particles, rōmaji boundary
 *     hygiene, no terminal duplicate か, no double topic, no new synthesis
 *     vocabulary, and genuinely novel (non-copied) transfers.
 *
 * The golden is a drift-lock and a review surface; the oracle is the automated
 * correctness proof. Neither weakens the Task 7 `a2RealizedIntegrity` or
 * `modules01to15` regressions — those still run independently.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { realizeVariant } from "../../foundations/realizeFamily";
import type { RealizedSentence, SemanticValue, SentenceFamily, SentenceVariant } from "../../foundations/types";
import { formatRomaji } from "../../../romaji/formatRomaji";
import { a2AllVariants, a2SemanticBuiltLessons } from "./catalog";
import {
  a2Contexts,
  a2LearningTargetSenses,
  a2PersonRoles,
  a2Referents,
  a2SemanticValues,
  a2SentenceFamilies,
} from "./a2SemanticCatalog";
import { A2_SYNTHESIS_LESSON_IDS } from "../manifest";

const EXPECTED_VARIANT_COUNT = 806;

// ---------------------------------------------------------------------------
// Shared realization harness (identical catalogs/options to every other A2
// realized-content test, so this gate sees exactly what learners see).
// ---------------------------------------------------------------------------
const familyById = new Map<string, SentenceFamily>(a2SentenceFamilies.map((family) => [family.id, family]));
const valueById = new Map<string, SemanticValue>(a2SemanticValues.map((value) => [value.id, value]));
const realizeCatalogs = {
  contexts: a2Contexts,
  personRoles: a2PersonRoles,
  referents: a2Referents,
  semanticValues: a2SemanticValues,
  learningTargetSenses: a2LearningTargetSenses,
};

function ruleOf(variant: SentenceVariant): string {
  const family = familyById.get(variant.sentenceFamilyId);
  if (!family) throw new Error(`editorial: unknown family ${variant.sentenceFamilyId} for ${variant.id}`);
  return family.realizationRuleId;
}

interface Realized {
  readonly sentence: RealizedSentence;
  readonly romaji: string;
  readonly romajiRuns: readonly { readonly separatorBefore: string; readonly text: string }[];
}
function realize(variant: SentenceVariant): Realized {
  const family = familyById.get(variant.sentenceFamilyId);
  if (!family) throw new Error(`editorial: unknown family ${variant.sentenceFamilyId} for ${variant.id}`);
  const result = realizeVariant(family, variant, realizeCatalogs, {
    availableConceptIds: [...family.requiredConceptIds],
  });
  if (!result.ok) {
    throw new Error(`editorial: realize ${variant.id} failed: ${JSON.stringify(result.errors)}`);
  }
  const romaji = formatRomaji(result.sentence.tokens);
  if (!romaji.ok) {
    throw new Error(`editorial: formatRomaji ${variant.id} failed: ${JSON.stringify(romaji.errors)}`);
  }
  return { sentence: result.sentence, romaji: romaji.text, romajiRuns: romaji.runs };
}

/** EN/IT translation gloss per variant, keyed the way every built lesson
 * authors it (`${variantId}-translation`). */
const glossByVariant = new Map<string, { readonly lessonId: string; readonly en: string; readonly it: string }>();
for (const built of a2SemanticBuiltLessons) {
  for (const variant of built.variants) {
    glossByVariant.set(variant.id, {
      lessonId: built.recipe.id,
      en: built.en[`${variant.id}-translation`] ?? "",
      it: built.it[`${variant.id}-translation`] ?? "",
    });
  }
}

// ---------------------------------------------------------------------------
// The frozen, reviewed golden surface table (read-only; never regenerated).
// ---------------------------------------------------------------------------
interface GoldenRow {
  readonly id: string;
  readonly position: number;
  readonly lessonId: string;
  readonly use: string;
  readonly family: string;
  readonly rule: string;
  readonly formality: string;
  readonly polarity: string;
  readonly tense: string;
  readonly interrogative: boolean;
  readonly jp: string;
  readonly romaji: string;
  readonly en: string;
  readonly it: string;
}
const goldenPath = fileURLToPath(new URL("./a2EditorialSurfaces.golden.json", import.meta.url));
const golden: readonly GoldenRow[] = JSON.parse(readFileSync(goldenPath, "utf8")) as GoldenRow[];
const goldenById = new Map<string, GoldenRow>(golden.map((row) => [row.id, row]));

// ---------------------------------------------------------------------------
// Authored case-frame table (the "case-frame / object particle" metadata
// table): for each realization rule, the fixed argument particle every FILLED
// slot must surface. Authored here from the grammar of each rule — never read
// back from the realized output — so it is an independent oracle and a
// reviewable one-line-per-argument table. Rules whose only content is a bare
// adverbial (time), a copular complement (no particle), or a whole baked
// invariant utterance carry no entry. `のほうが` is the favor-marker sequence
// the comparison-favor rule fixes for its favored item.
// ---------------------------------------------------------------------------
interface CaseFrameArgument {
  readonly slotId: string;
  /** The particle text that must appear in the realized surface. */
  readonly particle: string;
}
const CASE_FRAME_BY_RULE: Readonly<Record<string, readonly CaseFrameArgument[]>> = {
  "rule-object-action": [{ slotId: "object", particle: "を" }],
  "rule-recipient-action": [{ slotId: "object", particle: "に" }],
  "rule-companion-action": [{ slotId: "companion", particle: "と" }],
  "rule-preference": [{ slotId: "object", particle: "が" }],
  "rule-comparison-favor": [
    { slotId: "favored", particle: "のほうが" },
    { slotId: "standard", particle: "より" },
  ],
  "rule-superlative": [{ slotId: "favored", particle: "が" }],
  "rule-recipient-object-action": [
    { slotId: "recipient", particle: "に" },
    { slotId: "object", particle: "を" },
  ],
  "rule-transport-action": [
    { slotId: "transport", particle: "で" },
    { slotId: "location", particle: "に" },
  ],
  "rule-invariant-object": [{ slotId: "object", particle: "を" }],
  "rule-invariant-location": [{ slotId: "location", particle: "で" }],
  "rule-existence": [{ slotId: "location", particle: "に" }],
};

const POLITE_TERMINAL =
  /(ます|ません|ました|ませんでした|です|でした|ではありません|ではありませんでした|でしょう)(か)?$/u;
const stripTerminalPunctuation = (japanese: string): string => japanese.replace(/[。、？！\s]+$/u, "");
const endsWithFinalKa = (japanese: string): boolean => /か$/u.test(stripTerminalPunctuation(japanese));

// A numeral (ASCII/fullwidth/kanji) immediately followed by a common Japanese
// counter suffix. A2 authors no productive numeral+counter construction; this
// pattern exists so that if one is ever introduced it fails this gate and is
// forced through explicit counter review.
const NUMERAL_COUNTER =
  /[0-9０-９一二三四五六七八九十百]+(まい|こ|さつ|ほん|ぼん|ぽん|にん|めい|だい|はい|ばい|ぱい|かい|ど|じかん|ばん|つ)/u;

// ---------------------------------------------------------------------------

describe("A2 editorial gate — frozen scope (every one of the 806 variants inspected exactly once)", () => {
  it("the frozen catalog holds exactly 806 uniquely-identified variants", () => {
    expect(a2AllVariants).toHaveLength(EXPECTED_VARIANT_COUNT);
    const ids = a2AllVariants.map((variant) => variant.id);
    expect(new Set(ids).size, "unique variant ids").toBe(EXPECTED_VARIANT_COUNT);
  });

  it("the reviewed golden covers exactly those 806 ids — none added, removed, or duplicated", () => {
    expect(golden).toHaveLength(EXPECTED_VARIANT_COUNT);
    expect(new Set(golden.map((row) => row.id)).size, "unique golden ids").toBe(EXPECTED_VARIANT_COUNT);
    const variantIds = [...a2AllVariants.map((variant) => variant.id)].sort();
    const goldenIds = [...goldenById.keys()].sort();
    expect(goldenIds).toEqual(variantIds);
  });

  it("the golden is position-ordered (1..60) so a human reviewer reads it in teaching order", () => {
    const positions = golden.map((row) => row.position);
    for (let index = 1; index < positions.length; index += 1) {
      expect(positions[index], `golden row ${index}`).toBeGreaterThanOrEqual(positions[index - 1]);
    }
    expect(Math.min(...positions)).toBe(1);
    expect(Math.max(...positions)).toBe(60);
  });
});

describe("A2 editorial gate — exact realized surface vs. reviewed golden (JP, rōmaji, form, EN/IT gloss)", () => {
  it("realizes every variant exactly once and matches the frozen golden surface + gloss for all 806", () => {
    const seen = new Set<string>();
    for (const variant of a2AllVariants) {
      expect(seen.has(variant.id), `${variant.id} inspected twice`).toBe(false);
      seen.add(variant.id);

      const row = goldenById.get(variant.id);
      expect(row, `golden row for ${variant.id}`).toBeDefined();
      if (!row) continue;

      const { sentence, romaji } = realize(variant);
      expect(sentence.canonicalJapanese, `${variant.id} JP`).toBe(row.jp);
      expect(romaji, `${variant.id} rōmaji`).toBe(row.romaji);

      // Register/form metadata is honest against the frozen record.
      expect(variant.form.formality, `${variant.id} formality`).toBe(row.formality);
      expect(variant.form.polarity, `${variant.id} polarity`).toBe(row.polarity);
      expect(variant.form.tense, `${variant.id} tense`).toBe(row.tense);
      expect(variant.form.interrogative === true, `${variant.id} interrogative`).toBe(row.interrogative);
      expect(variant.pedagogicalUse, `${variant.id} use`).toBe(row.use);
      expect(variant.sentenceFamilyId, `${variant.id} family`).toBe(row.family);
      expect(ruleOf(variant), `${variant.id} rule`).toBe(row.rule);

      // Both gloss cells are present and match the reviewed copy.
      const gloss = glossByVariant.get(variant.id);
      expect(gloss?.en, `${variant.id} EN gloss present`).toBeTruthy();
      expect(gloss?.it, `${variant.id} IT gloss present`).toBeTruthy();
      expect(gloss?.en, `${variant.id} EN gloss`).toBe(row.en);
      expect(gloss?.it, `${variant.id} IT gloss`).toBe(row.it);
    }
    expect(seen.size, "distinct variants inspected").toBe(EXPECTED_VARIANT_COUNT);
  });

  it("exposes all 1,612 EN/IT gloss cells in the reviewed golden (none blank)", () => {
    let cells = 0;
    for (const row of golden) {
      expect(row.en.trim().length, `${row.id} EN gloss non-empty`).toBeGreaterThan(0);
      expect(row.it.trim().length, `${row.id} IT gloss non-empty`).toBeGreaterThan(0);
      cells += 2;
    }
    expect(cells).toBe(EXPECTED_VARIANT_COUNT * 2);
  });
});

describe("A2 editorial gate — rōmaji boundary hygiene (independent of the golden)", () => {
  it("every realized rōmaji string is well-bounded: no leading/trailing/doubled space, no space before punctuation, attached first token", () => {
    for (const variant of a2AllVariants) {
      const { romaji, romajiRuns } = realize(variant);
      expect(romaji.length, `${variant.id} non-empty`).toBeGreaterThan(0);
      expect(/^\s/u.test(romaji), `${variant.id} leading space`).toBe(false);
      expect(/\s$/u.test(romaji), `${variant.id} trailing space`).toBe(false);
      expect(/\s{2,}/u.test(romaji), `${variant.id} doubled space`).toBe(false);
      expect(/\s[,.?!]/u.test(romaji), `${variant.id} space before punctuation`).toBe(false);
      expect(romajiRuns[0]?.separatorBefore, `${variant.id} first token attached`).toBe("");
    }
  });
});

describe("A2 editorial gate — register / form honesty", () => {
  it("every non-invariant family realizes a polite predicate terminal (ます/です family, optional か)", () => {
    let checked = 0;
    for (const variant of a2AllVariants) {
      if (ruleOf(variant).startsWith("rule-invariant")) continue;
      const stripped = stripTerminalPunctuation(realize(variant).sentence.canonicalJapanese);
      expect(POLITE_TERMINAL.test(stripped), `${variant.id} :: ${stripped}`).toBe(true);
      checked += 1;
    }
    expect(checked, "non-invariant variants checked").toBeGreaterThan(100);
  });

  it("a declared interrogative always surfaces a sentence-final か, and no non-invariant statement smuggles one in", () => {
    for (const variant of a2AllVariants) {
      const japanese = realize(variant).sentence.canonicalJapanese;
      const finalKa = endsWithFinalKa(japanese);
      // Universal: form.interrogative ⇒ an actual sentence-final か.
      if (variant.form.interrogative === true) {
        expect(finalKa, `${variant.id} declared interrogative but no final か :: ${japanese}`).toBe(true);
      }
      // Non-invariant families append か ONLY from the interrogative flag, so a
      // final か there without the flag is a dishonest statement/question.
      if (!ruleOf(variant).startsWith("rule-invariant") && finalKa) {
        expect(variant.form.interrogative === true, `${variant.id} final か without interrogative flag :: ${japanese}`).toBe(true);
      }
    }
  });
});

describe("A2 editorial gate — case frame (authored per-rule particle table over every filled argument)", () => {
  it("every filled argument slot surfaces its rule's fixed case particle, and every table rule is exercised", () => {
    const exercisedRules = new Set<string>();
    let checks = 0;
    for (const variant of a2AllVariants) {
      const rule = ruleOf(variant);
      const frame = CASE_FRAME_BY_RULE[rule];
      if (!frame) continue;
      const japanese = realize(variant).sentence.canonicalJapanese;
      for (const argument of frame) {
        if (variant.slotValues[argument.slotId] === undefined) continue; // optional slot not filled
        exercisedRules.add(rule);
        checks += 1;
        expect(
          japanese.includes(argument.particle),
          `${variant.id} (${rule}) missing ${argument.slotId} particle ${argument.particle} :: ${japanese}`,
        ).toBe(true);
      }
    }
    // Non-vacuous: the table is genuinely applied, and no listed rule is dead.
    expect(checks, "case-frame checks performed").toBeGreaterThan(150);
    for (const rule of Object.keys(CASE_FRAME_BY_RULE)) {
      expect(exercisedRules.has(rule), `case-frame rule ${rule} exercised by ≥1 variant`).toBe(true);
    }
  });

  it("the superlative rule fixes its いちばん adverb in every superlative surface", () => {
    const superlatives = a2AllVariants.filter((variant) => ruleOf(variant) === "rule-superlative");
    expect(superlatives.length, "superlative variants present").toBeGreaterThan(0);
    for (const variant of superlatives) {
      expect(realize(variant).sentence.canonicalJapanese).toContain("いちばん");
    }
  });
});

describe("A2 editorial gate — defect detectors preserved exhaustively over all 806", () => {
  it("no realized answer key ends in a duplicated question particle (…かか)", () => {
    for (const variant of a2AllVariants) {
      const japanese = realize(variant).sentence.canonicalJapanese;
      expect(/かか$/u.test(japanese), `${variant.id} :: ${japanese}`).toBe(false);
    }
  });

  it("no explicit-subject variant stacks a second top-level topic over a self-topical (carriesOwnTopic) value", () => {
    for (const variant of a2AllVariants) {
      if (variant.discourse.subjectRealization !== "explicit") continue;
      const predicateId = variant.slotValues.predicate;
      if (!predicateId) continue;
      const value = valueById.get(predicateId);
      expect(
        value?.carriesOwnTopic === true,
        `${variant.id} explicit subject over self-topical ${predicateId}`,
      ).toBe(false);
    }
  });

  it("A2 authors no productive numeral+counter construction (any future one must be reviewed as a counter)", () => {
    const withCounter = a2AllVariants
      .map((variant) => ({ id: variant.id, jp: realize(variant).sentence.canonicalJapanese }))
      .filter((entry) => NUMERAL_COUNTER.test(entry.jp));
    expect(withCounter.map((entry) => `${entry.id}: ${entry.jp}`)).toEqual([]);
  });
});

describe("A2 editorial gate — synthesis introduces no new vocabulary", () => {
  it("every lexeme sense and concept a synthesis (M15) variant uses was already introduced by an earlier lesson", () => {
    const synthesisLessonIds = new Set<string>(A2_SYNTHESIS_LESSON_IDS);
    const earlierSenses = new Set<string>();
    const earlierConcepts = new Set<string>();
    for (const built of a2SemanticBuiltLessons) {
      if (synthesisLessonIds.has(built.recipe.id)) continue;
      for (const variant of built.variants) {
        const sentence = realize(variant).sentence;
        for (const sense of sentence.usedLexemeSenseIds) earlierSenses.add(sense);
        for (const concept of sentence.usedConceptIds) earlierConcepts.add(concept);
      }
    }
    const newInSynthesis: string[] = [];
    let synthesisVariants = 0;
    for (const built of a2SemanticBuiltLessons) {
      if (!synthesisLessonIds.has(built.recipe.id)) continue;
      for (const variant of built.variants) {
        synthesisVariants += 1;
        const sentence = realize(variant).sentence;
        for (const sense of sentence.usedLexemeSenseIds) {
          if (!earlierSenses.has(sense)) newInSynthesis.push(`${variant.id} new sense ${sense}`);
        }
        for (const concept of sentence.usedConceptIds) {
          if (!earlierConcepts.has(concept)) newInSynthesis.push(`${variant.id} new concept ${concept}`);
        }
      }
    }
    expect(synthesisVariants, "synthesis variants present").toBeGreaterThan(0);
    expect(newInSynthesis, newInSynthesis.join("\n")).toEqual([]);
  });
});

describe("A2 editorial gate — genuine transfers (no within-lesson semantic copies)", () => {
  it("in every lesson the models are semantically distinct and no transfer copies a model's fingerprint", () => {
    let transfersChecked = 0;
    for (const built of a2SemanticBuiltLessons) {
      const models = built.variants.filter((variant) => variant.pedagogicalUse === "model");
      const transfers = built.variants.filter((variant) => variant.pedagogicalUse === "transfer");
      const modelFingerprints = models.map((variant) => realize(variant).sentence.semanticFingerprint);
      expect(new Set(modelFingerprints).size, `${built.recipe.id} distinct model fingerprints`).toBe(models.length);
      const modelSet = new Set(modelFingerprints);
      for (const transfer of transfers) {
        transfersChecked += 1;
        const fingerprint = realize(transfer).sentence.semanticFingerprint;
        expect(modelSet.has(fingerprint), `${transfer.id} copies a model fingerprint`).toBe(false);
      }
    }
    expect(transfersChecked, "transfers checked").toBe(300);
  });
});
