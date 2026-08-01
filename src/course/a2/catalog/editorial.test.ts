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

const EXPECTED_VARIANT_COUNT = 809;

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
    expect(transfersChecked, "transfers checked").toBe(301);
  });
});

// ---------------------------------------------------------------------------
// A2 editorial gate — te-sequence sequential-gloss policy (Phase 3 Task 9
// linguistic fix). Every て-form sequence sentence ("X-te, Y") narrates two
// events in TEMPORAL ORDER ("first X, then Y"), never one as the manner or
// simultaneous circumstance of the other. Its EN/IT gloss must therefore mark
// the sequence explicitly with two finite clauses ("X, then Y" / "X, poi Y")
// and must NEVER front the first event as an English present participle
// ("Asking…, I paid") or an Italian gerund ("Chiedendo…, ho pagato") — those
// read as manner/simultaneity ("by/while asking") and mistranslate the
// と-less te-sequence. "and"/"e" is tolerated ONLY for the single
// inherently-consequential pairing already reviewed as unambiguously
// sequential (worked → got tired); every other row must use then/poi. Scope is
// frozen by count + id membership so no newly-authored te-sequence variant can
// escape this gate.
// ---------------------------------------------------------------------------
const TE_SEQUENCE_FAMILY_IDS = new Set(["a2-family-te-sequence", "a2-family-te-sequence-object"]);
const EXPECTED_TE_SEQUENCE_COUNT = 49;
// The only te-sequence rows allowed to mark the sequence with "and"/"e"
// instead of "then"/"poi": an inherently consequential worked→got-tired
// pairing whose conjunction is unambiguously sequential in context.
const TE_SEQUENCE_AND_EXCEPTIONS = new Set(["a2-synthesis-3-m1"]);
// An English present participle heading the (optionally vocative-prefixed)
// first clause — i.e. "Asking …," or "Sora, asking …," — the manner-drift
// mistranslation this gate forbids.
const EN_GERUND_FRONT = /^(?:[A-Z][A-Za-z]+,\s+)?[A-Za-z]+ing\b/;
// An Italian gerund (-ando/-endo) heading the (optionally vocative-prefixed)
// first clause — "Chiedendo …," or "Sora, chiedendo …,".
const IT_GERUND_FRONT = /^(?:[A-Z\u00C0-\u00DD][A-Za-z\u00C0-\u00FF\u2019']+,\s+)?[A-Za-z\u00E0-\u00FF]+(?:ando|endo)\b/;

describe("A2 editorial gate — te-sequence sequential gloss (no gerund-front / manner drift)", () => {
  const teSequence = a2AllVariants.filter((variant) => TE_SEQUENCE_FAMILY_IDS.has(variant.sentenceFamilyId));

  it("covers every te-sequence variant exactly once (frozen scope, fail-closed count + membership)", () => {
    expect(teSequence.length, "te-sequence variant count").toBe(EXPECTED_TE_SEQUENCE_COUNT);
    const ids = teSequence.map((variant) => variant.id);
    expect(new Set(ids).size, "unique te-sequence ids").toBe(EXPECTED_TE_SEQUENCE_COUNT);
    // Every declared and/e exception is a real te-sequence variant (no dead pins).
    const idSet = new Set(ids);
    for (const exceptionId of TE_SEQUENCE_AND_EXCEPTIONS) {
      expect(idSet.has(exceptionId), `and/e exception ${exceptionId} is a te-sequence variant`).toBe(true);
    }
  });

  it("marks the sequence explicitly in EN and IT and never fronts a participle/gerund (manner drift)", () => {
    let checked = 0;
    for (const variant of teSequence) {
      const gloss = glossByVariant.get(variant.id);
      expect(gloss?.en, `${variant.id} EN gloss present`).toBeTruthy();
      expect(gloss?.it, `${variant.id} IT gloss present`).toBeTruthy();
      const en = gloss?.en ?? "";
      const it = gloss?.it ?? "";

      // (1) No gerund/participle heading the first clause (reads as manner).
      expect(EN_GERUND_FRONT.test(en), `${variant.id} EN fronts a present participle :: ${en}`).toBe(false);
      expect(IT_GERUND_FRONT.test(it), `${variant.id} IT fronts a gerund :: ${it}`).toBe(false);

      // (2) An explicit sequence connective is present.
      const enThen = /\bthen\b/iu.test(en);
      const enAnd = /\band\b/iu.test(en);
      const itPoi = /\bpoi\b/iu.test(it);
      const itE = /\be\b/iu.test(it);
      expect(enThen || enAnd, `${variant.id} EN lacks a sequence connective (then/and) :: ${en}`).toBe(true);
      expect(itPoi || itE, `${variant.id} IT lacks a sequence connective (poi/e) :: ${it}`).toBe(true);

      // (3) Prefer then/poi: only the reviewed exception may rely on and/e alone.
      if (!TE_SEQUENCE_AND_EXCEPTIONS.has(variant.id)) {
        expect(enThen, `${variant.id} EN must sequence with "then", not bare "and" :: ${en}`).toBe(true);
        expect(itPoi, `${variant.id} IT must sequence with "poi", not bare "e" :: ${it}`).toBe(true);
      }
      checked += 1;
    }
    expect(checked, "te-sequence variants checked").toBe(EXPECTED_TE_SEQUENCE_COUNT);
  });
});

// ---------------------------------------------------------------------------
// A2 editorial gate — Italian register for polite requests (てください)
// [Phase 3 Task 9 linguistic fix]. `speakerRole` records WHO speaks, never
// WHOM they address, and nothing in the authored metadata encodes the
// addressee's social status; the identical speakerRole (teacher / colleague /
// friend / clerk / learner) was consequently realized as both informal `tu`
// AND formal `Lei` (and even plural `voi`) across modules — a direct
// contradiction for equivalent role/context.
//
// Policy (grounded in actual speaker + copy semantics, per Task 9): てください
// is a neutral-polite request, and this beginner app addresses its single
// learner directly, so the DEFAULT gloss is Italian `tu` (informal SINGULAR)
// imperative — never `Lei` (formal 3sg) and never `voi` (plural). `tu`
// singular also repairs the NUMBER of たすけてください (the old `aiutatemi` voi
// forms were wrong in number, not only register). Clerk-VOICED generic
// requests are `tu` too: the app frames them as learner-facing examples, not
// real clerk↔customer dialogue, and `speakerRole` (the clerk) is not the
// addressee. The SINGLE formal exception is a learner's deferential request to
// a service clerk explicitly marked by "Scusi" (subjectReferent = clerk,
// vocative): `travel-reservations-3-m7` ("Scusi, mi aiuti!") stays `Lei`,
// because that is the natural Italian service register AND because it keeps the
// line consistent with the sibling `a2-family-ask-for-help` construction
// (neighborhood-services-3-m6/m7/m8), which deliberately teaches the same
// deferential "Scusi + Lei" stranger-request register. Mechanically
// informalizing that one line would both read unnaturally and contradict that
// parallel family — exactly what Task 9 warns against.
//
// The table pins, per tu variant, the exact `tu` imperative head that MUST
// appear in that line's Italian copy; the Lei exception is pinned separately
// and positively verified. A closed denylist of the Lei/voi forms of the same
// verbs must NEVER appear in a tu line. Scope is frozen by count + id
// membership (tu table ∪ Lei exceptions == catalog ids) so a newly-authored
// request cannot escape the register gate.
// ---------------------------------------------------------------------------
const TEKUDASAI_FAMILY_ID = "a2-family-request-tekudasai";
// tu variant id → required Italian `tu` (informal singular) imperative head.
const TEKUDASAI_TU_HEAD: Readonly<Record<string, string>> = {
  "permission-requests-3-m1": "spegni",
  "permission-requests-3-m2": "aspetta",
  "permission-requests-3-m3": "scrivi",
  "permission-requests-3-m4": "siediti",
  "permission-requests-3-m5": "alzati",
  "permission-requests-3-m6": "mangia",
  "permission-requests-3-m7": "parla",
  "permission-requests-3-t1": "spegni",
  "permission-requests-3-t2": "mangia",
  "permission-requests-3-t3": "siediti",
  "permission-requests-3-t4": "parla",
  "neighborhood-services-3-m9": "mangia",
  "neighborhood-services-3-t1": "scrivi",
  "neighborhood-services-3-t2": "aspetta",
  "neighborhood-services-3-t3": "siediti",
  "neighborhood-services-3-t4": "parla",
  "neighborhood-services-3-t5": "alzati",
  "restaurant-problems-2-m1": "aspetta",
  "restaurant-problems-2-m2": "siediti",
  "restaurant-problems-2-m3": "scrivi",
  "restaurant-problems-2-m4": "prova",
  "restaurant-problems-2-m5": "parla",
  "restaurant-problems-2-t1": "alzati",
  "restaurant-problems-2-t2": "prova",
  "restaurant-problems-2-t3": "spegni",
  "work-study-messages-2-m9": "manda",
  "work-study-messages-2-t3": "manda",
  "work-study-messages-2-t4": "manda",
  "work-study-messages-2-t5": "parla",
  "travel-reservations-3-m6": "aiutami",
  "travel-reservations-3-t3": "aiutami",
  "a2-synthesis-3-m4": "aiutami",
  "a2-synthesis-3-m6": "aspetta",
  "a2-synthesis-3-t2": "siediti",
};
// The sole formal exception: a learner's "Scusi …" deferential request to a
// service clerk, kept `Lei` to match the natural service register and the
// parallel `a2-family-ask-for-help` construction. Its Italian copy must
// positively carry these Lei service markers.
const TEKUDASAI_LEI_EXCEPTIONS: Readonly<Record<string, readonly string[]>> = {
  "travel-reservations-3-m7": ["Scusi", "mi aiuti"],
};
// Lei (formal 3sg) and voi (plural) imperatives — plus the formal possessive
// suo/sua — of every verb used above. None may appear in any `tu` てください gloss.
const TEKUDASAI_FORBIDDEN_REGISTER: readonly string[] = [
  // Lei formal singular imperatives
  "spenga",
  "aspetti",
  "scriva",
  "mangi",
  "provi",
  "parli",
  "mandi",
  "aiuti",
  "sieda",
  "alzi",
  // formal possessive (tu uses tuo/tua)
  "suo",
  "sua",
  // voi plural imperatives (wrong number for a singular てください)
  "spegnete",
  "aspettate",
  "scrivete",
  "mangiate",
  "provate",
  "parlate",
  "mandate",
  "aiutatemi",
  "aiutateci",
  "sedetevi",
  "alzatevi",
];

describe("A2 editorial gate — Italian てください register (learner-facing tu; one Scusi/Lei service exception)", () => {
  const tekudasai = a2AllVariants.filter((variant) => variant.sentenceFamilyId === TEKUDASAI_FAMILY_ID);

  it("covers every てください variant exactly once (tu table ∪ Lei exceptions == catalog scope, fail-closed)", () => {
    const catalogIds = tekudasai.map((variant) => variant.id);
    const tuIds = Object.keys(TEKUDASAI_TU_HEAD);
    const leiIds = Object.keys(TEKUDASAI_LEI_EXCEPTIONS);
    expect(new Set(catalogIds).size, "unique catalog tekudasai ids").toBe(catalogIds.length);
    // tu and Lei partitions are disjoint (no id double-classified).
    for (const id of leiIds) {
      expect(tuIds.includes(id), `${id} is double-listed in tu table and Lei exceptions`).toBe(false);
    }
    const covered = [...tuIds, ...leiIds];
    expect(new Set(covered).size, "unique covered ids").toBe(covered.length);
    expect([...covered].sort(), "register scope exactly covers the catalog てください ids").toEqual(
      [...catalogIds].sort(),
    );
  });

  it("every tu request is tu (head present, no Lei/voi form); the one Scusi service request stays Lei", () => {
    let tuChecked = 0;
    let leiChecked = 0;
    for (const variant of tekudasai) {
      const it = glossByVariant.get(variant.id)?.it ?? "";
      expect(it, `${variant.id} IT gloss present`).toBeTruthy();

      const leiMarkers = TEKUDASAI_LEI_EXCEPTIONS[variant.id];
      if (leiMarkers) {
        for (const marker of leiMarkers) {
          expect(it.includes(marker), `${variant.id} Lei service exception missing "${marker}" :: ${it}`).toBe(true);
        }
        leiChecked += 1;
        continue;
      }

      const head = TEKUDASAI_TU_HEAD[variant.id];
      expect(head, `${variant.id} has a pinned tu head`).toBeTruthy();
      expect(new RegExp(`\\b${head}\\b`, "iu").test(it), `${variant.id} IT missing tu head "${head}" :: ${it}`).toBe(
        true,
      );
      for (const forbidden of TEKUDASAI_FORBIDDEN_REGISTER) {
        expect(
          new RegExp(`\\b${forbidden}\\b`, "iu").test(it),
          `${variant.id} IT uses non-tu (Lei/voi) form "${forbidden}" :: ${it}`,
        ).toBe(false);
      }
      tuChecked += 1;
    }
    expect(tuChecked, "tu てください variants checked").toBe(Object.keys(TEKUDASAI_TU_HEAD).length);
    expect(leiChecked, "Lei-exception variants checked").toBe(Object.keys(TEKUDASAI_LEI_EXCEPTIONS).length);
  });

  it("no A2 gloss uses the wrong-number voi help form (aiutatemi/aiutateci) — たすけて is singular", () => {
    const offenders: string[] = [];
    for (const variant of a2AllVariants) {
      const it = glossByVariant.get(variant.id)?.it ?? "";
      if (/\baiutatemi\b/iu.test(it) || /\baiutateci\b/iu.test(it)) {
        offenders.push(`${variant.id} :: ${it}`);
      }
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });
});
