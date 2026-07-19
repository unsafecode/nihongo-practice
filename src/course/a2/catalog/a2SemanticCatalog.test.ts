/**
 * `a2SemanticCatalog.ts` — semantic-value data regression (Phase 3 Task 4
 * spec-fix).
 *
 * Pins the exact hiragana/rōmaji `tokenFragments` for the five semantic
 * values a fresh spec review found malformed: a wrong ます-stem
 * (`a2-value-hanasu`), a dictionary form used where an invitation needs the
 * ます-stem (`a2-value-invite-shokuji`, `a2-value-invite-tomodachi-issho`,
 * `a2-value-invite-hon`), and a ます-stem used where a よてい construction
 * needs the dictionary form (`a2-value-yotei-miru-eiga`) — directly against
 * the catalog data, independent of any lesson/family that happens to
 * reference it.
 *
 * `a2-value-invite-hon` and `a2-value-yotei-miru-eiga` are not referenced by
 * any currently authored M1-M4 lesson variant — a *latent* defect, real the
 * moment anything uses them — so this suite additionally realizes each
 * through its own real sentence family (`a2-family-invite`,
 * `a2-family-plan-yotei`) with the real catalogs, proving the fix is
 * genuinely learner-facing correct (exact assembled Japanese + rōmaji), not
 * just an isolated data assertion.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { formatRomaji } from "../../../romaji/formatRomaji";
import { realizeVariant } from "../../foundations/realizeFamily";
import type { SentenceFamily, SentenceVariant } from "../../foundations/types";
import {
  A2_M1_M4_CONCEPT_IDS,
  A2_M5_M8_CONCEPT_IDS,
  A2_M9_M12_CONCEPT_IDS,
  a2Contexts,
  a2LearningTargetSenses,
  a2PersonRoles,
  a2Referents,
  a2Scenario,
  a2SemanticValues,
  a2SentenceFamilies,
  a2SharedCopy,
} from "./a2SemanticCatalog";

function valueById(id: string) {
  const value = a2SemanticValues.find((v) => v.id === id);
  expect(value, `semantic value ${id}`).toBeDefined();
  return value!;
}

function senseById(id: string) {
  const sense = a2LearningTargetSenses.find((s) => s.id === id);
  expect(sense, `learning target sense ${id}`).toBeDefined();
  return sense!;
}

describe("a2SemanticCatalog — exact tokenFragments for the Task4 spec-fix values", () => {
  // M6 spec-fix ("single-source verb stems"): `a2-value-hanasu` now derives
  // its ます-stem from `conjugateMasuStem("a2-sense-hanasu")` (the one
  // linguistic source of truth in `a2Conjugation.ts`) instead of a
  // hand-typed literal — so its fragments are the real kanji-root +
  // okurigana split (話+し), not one hand-merged はなし fragment. The
  // rendered kana text is unchanged (はなし/hanashi), proven by the exact
  // realized-Japanese assertions in `module01ConnectedConversation.test.ts`.
  it("a2-value-hanasu carries the 話す ます-stem はな+し (kanji-root/okurigana split), never the bare unconjugated root はな alone", () => {
    expect(valueById("a2-value-hanasu").tokenFragments).toEqual([
      { jp: "はな", romaji: "hana", kind: "lexical", boundaryBefore: "attach" },
      { jp: "し", romaji: "shi", kind: "morpheme", boundaryBefore: "attach" },
    ]);
  });

  it("a2-value-invite-shokuji carries the 食べる ます-stem た+べ (kanji-root/okurigana split) before ませんか, never the dictionary form たべる", () => {
    expect(valueById("a2-value-invite-shokuji").tokenFragments).toEqual([
      { jp: "いっしょに", romaji: "issho ni", kind: "lexical", boundaryBefore: "attach" },
      { jp: "しょくじを", romaji: "shokuji o", kind: "lexical", boundaryBefore: "attach" },
      { jp: "た", romaji: "ta", kind: "lexical", boundaryBefore: "attach" },
      { jp: "べ", romaji: "be", kind: "morpheme", boundaryBefore: "attach" },
      { jp: "ませんか", romaji: "masen ka", kind: "morpheme", boundaryBefore: "attach" },
    ]);
  });

  it("a2-value-invite-tomodachi-issho carries the same た+べ ます-stem before ませんか, never the dictionary form たべる", () => {
    expect(valueById("a2-value-invite-tomodachi-issho").tokenFragments).toEqual([
      { jp: "こんばん", romaji: "konban", kind: "lexical", boundaryBefore: "attach" },
      { jp: "いっしょに", romaji: "issho ni", kind: "lexical", boundaryBefore: "attach" },
      { jp: "しょくじを", romaji: "shokuji o", kind: "lexical", boundaryBefore: "attach" },
      { jp: "た", romaji: "ta", kind: "lexical", boundaryBefore: "attach" },
      { jp: "べ", romaji: "be", kind: "morpheme", boundaryBefore: "attach" },
      { jp: "ませんか", romaji: "masen ka", kind: "morpheme", boundaryBefore: "attach" },
    ]);
  });

  it("a2-value-invite-hon carries the 行く ます-stem い+き (kanji-root/okurigana split) before ませんか, never the dictionary form いく (latent — unused by any authored M1-M4 variant)", () => {
    expect(valueById("a2-value-invite-hon").tokenFragments).toEqual([
      { jp: "こんど", romaji: "kondo", kind: "lexical", boundaryBefore: "attach" },
      { jp: "いっしょに", romaji: "issho ni", kind: "lexical", boundaryBefore: "attach" },
      { jp: "ほんやに", romaji: "hon'ya ni", kind: "lexical", boundaryBefore: "attach" },
      { jp: "い", romaji: "i", kind: "lexical", boundaryBefore: "attach" },
      { jp: "き", romaji: "ki", kind: "morpheme", boundaryBefore: "attach" },
      { jp: "ませんか", romaji: "masen ka", kind: "morpheme", boundaryBefore: "attach" },
    ]);
  });

  it("a2-value-yotei-miru-eiga carries the 見る dictionary form みる/miru before よてい, never the ます-stem み (latent — unused by any authored M1-M4 variant)", () => {
    expect(valueById("a2-value-yotei-miru-eiga").tokenFragments).toEqual([
      { jp: "きんようびに", romaji: "kinyoubi ni", kind: "lexical", boundaryBefore: "attach" },
      { jp: "えみさんと", romaji: "emi san to", kind: "lexical", boundaryBefore: "attach" },
      { jp: "えいがを", romaji: "eiga o", kind: "lexical", boundaryBefore: "attach" },
      { jp: "みる", romaji: "miru", kind: "lexical", boundaryBefore: "attach" },
      { jp: "よてい", romaji: "yotei", kind: "lexical", boundaryBefore: "attach" },
      { jp: "です", romaji: "desu", kind: "lexical", boundaryBefore: "attach" },
    ]);
  });
});

describe("a2SemanticCatalog — latent-value realization through their real sentence families", () => {
  const famById = new Map<string, SentenceFamily>(a2SentenceFamilies.map((f) => [f.id, f]));
  const realizeCatalogs = {
    contexts: a2Contexts,
    personRoles: a2PersonRoles,
    referents: a2Referents,
    semanticValues: a2SemanticValues,
    learningTargetSenses: a2LearningTargetSenses,
  };

  /** Realize `predicateValueId` through the real, unmodified `familyId` —
   * both bare-predicate invariant families (`a2-family-invite`,
   * `a2-family-plan-yotei`) take only a `predicate` slot with an omitted
   * subject, exactly like every currently authored invite/yotei model. */
  function realizeAgainst(
    familyId: string,
    predicateValueId: string,
    variantId: string,
  ) {
    const family = famById.get(familyId);
    expect(family, `family ${familyId}`).toBeDefined();
    const variant: SentenceVariant = {
      id: variantId,
      sentenceFamilyId: familyId,
      discourse: {
        speakerRoleId: "a2-role-emi",
        addresseeRoleId: "a2-role-learner",
        subjectReferentId: null,
        subjectRealization: "omitted",
        scenarioNoteCopyId: `${variantId}-scenario`,
      },
      contextId: "a2-context-plans",
      slotValues: { predicate: predicateValueId },
      form: { polarity: "affirmative", tense: "present", formality: "polite" },
      pedagogicalUse: "model",
    };
    const result = realizeVariant(family as SentenceFamily, variant, realizeCatalogs, {
      availableConceptIds: [...(family as SentenceFamily).requiredConceptIds],
    });
    if (!result.ok) {
      throw new Error(`realize ${variantId} failed: ${JSON.stringify(result.errors)}`);
    }
    return result.sentence;
  }

  it("realizes a2-value-invite-hon through the real a2-family-invite to the exact いきませんか ます-stem invitation, never いくませんか", () => {
    const sentence = realizeAgainst(
      "a2-family-invite",
      "a2-value-invite-hon",
      "task4-probe-invite-hon",
    );
    const romaji = formatRomaji(sentence.tokens);
    expect(romaji.ok).toBe(true);
    if (!romaji.ok) throw new Error("unreachable");
    expect(sentence.canonicalJapanese).toBe("こんどいっしょにほんやにいきませんか");
    expect(romaji.text).toBe("kondo issho ni hon'ya ni ikimasen ka");
    expect(sentence.canonicalJapanese).not.toContain("いくませんか");
  });

  it("realizes a2-value-yotei-miru-eiga through the real a2-family-plan-yotei to the exact みるよていです dictionary-form plan, never みよてい", () => {
    const sentence = realizeAgainst(
      "a2-family-plan-yotei",
      "a2-value-yotei-miru-eiga",
      "task4-probe-yotei-miru-eiga",
    );
    const romaji = formatRomaji(sentence.tokens);
    expect(romaji.ok).toBe(true);
    if (!romaji.ok) throw new Error("unreachable");
    expect(sentence.canonicalJapanese).toBe("きんようびにえみさんとえいがをみるよていです");
    expect(romaji.text).toBe("kinyoubi ni emi san to eiga o miru yotei desu");
    expect(sentence.canonicalJapanese).not.toContain("みよてい");
  });

  // I3 spec-fix ("semantic rōmaji boundaries"): こと (a formal noun, "koto")
  // and あります/ない/なかった (the standalone existential verb/its negatives)
  // are independent words — each deserves its own word-boundary space in
  // rōmaji — never bound morphemes glued straight onto the preceding verb
  // ending or particle. `formatRomaji`'s generic kind-based spacing rule
  // (morpheme/punctuation attach, everything else spaces) means the fix
  // must remap these fragments' `kind`, not just their text.
  it("realizes a2-value-exp-oyoida's たことがあります experience tail with real word-boundary spaces: 'oyoida koto ga arimasu', never 'oyoidakoto gaarimasu'", () => {
    const sentence = realizeAgainst(
      "a2-family-experience-takoto",
      "a2-value-exp-oyoida",
      "task4-probe-exp-oyoida-romaji",
    );
    const romaji = formatRomaji(sentence.tokens);
    expect(romaji.ok).toBe(true);
    if (!romaji.ok) throw new Error("unreachable");
    expect(romaji.text).toBe("oyoida koto ga arimasu");
    expect(romaji.text).not.toContain("oyoidakoto");
    expect(romaji.text).not.toContain("gaarimasu");
  });

  // I3 regression guard, new-verb path: `a2-value-exp-shinkansen-notta`
  // realizes 乗る (a verb OUTSIDE the registered Task2 12-verb table) through
  // `newVerbSuffixKana("experience-takoto", ...)`, a *different* code path
  // than `experienceTakotoKana` (which only ever composes REGISTERED
  // senses like 泳ぐ/行く/食べる/待つ above). `newVerbSuffixKana` remaps its
  // construction's independent-word tail via the shared
  // `INDEPENDENT_WORD_TAIL_JP_BY_CONSTRUCTION` table keyed by construction
  // id, not `experienceTakotoKana`'s own local set — so an "experience-takoto"
  // entry must exist in that shared table too, or this new-verb tail keeps
  // こと/あります as bound morphemes and glues them onto the preceding verb
  // ending/particle instead of spacing them as the real, independent words
  // they are.
  it("realizes a2-value-exp-shinkansen-notta's たことがあります experience tail (a NEW-verb 乗る through newVerbSuffixKana) with real word-boundary spaces: 'notta koto ga arimasu', never 'nottakoto gaarimasu' (I3 regression guard for the new-verb suffix path)", () => {
    const sentence = realizeAgainst(
      "a2-family-experience-takoto",
      "a2-value-exp-shinkansen-notta",
      "task6-probe-exp-shinkansen-notta-romaji",
    );
    const romaji = formatRomaji(sentence.tokens);
    expect(romaji.ok).toBe(true);
    if (!romaji.ok) throw new Error("unreachable");
    expect(romaji.text).toBe("shinkansen ni notta koto ga arimasu");
    expect(romaji.text).not.toContain("nottakoto");
    expect(romaji.text).not.toContain("gaarimasu");
  });

  it("realizes a2-value-kara-jikanganai-takushii's existential-negative reason clause with a real word-boundary space: 'jikan ga nai', never 'jikan ganai'", () => {
    const sentence = realizeAgainst(
      "a2-family-reason-kara",
      "a2-value-kara-jikanganai-takushii",
      "task4-probe-kara-jikanganai-romaji",
    );
    const romaji = formatRomaji(sentence.tokens);
    expect(romaji.ok).toBe(true);
    if (!romaji.ok) throw new Error("unreachable");
    expect(romaji.text).toContain("jikan ga nai");
    expect(romaji.text).not.toContain("ganai");
  });

  it("realizes a2-value-node-jikanganakatta-takushii's existential-past-negative reason clause with a real word-boundary space: 'jikan ga nakatta', never 'jikan ganakatta'", () => {
    const sentence = realizeAgainst(
      "a2-family-reason-node",
      "a2-value-node-jikanganakatta-takushii",
      "task4-probe-node-jikanganakatta-romaji",
    );
    const romaji = formatRomaji(sentence.tokens);
    expect(romaji.ok).toBe(true);
    if (!romaji.ok) throw new Error("unreachable");
    expect(romaji.text).toContain("jikan ga nakatta");
    expect(romaji.text).not.toContain("ganakatta");
  });

  // Regression guard: the bound-morpheme adjectival negative よくない
  // (yokunai, "not good") is a DIFFERENT sense of ない — attached directly to
  // the adjective's く-stem, never a standalone word — and must keep
  // attaching with no space, so the I3 fix (which only remaps the
  // *existential* ない/なかった) never over-corrects it.
  it("keeps the bound adjectival negative よくない (yokunai) attached with no space — the I3 fix must not over-generalize to every ない", () => {
    const sentence = realizeAgainst(
      "a2-family-opinion-toomou",
      "a2-value-toomou-yokunai",
      "task4-probe-toomou-yokunai-romaji",
    );
    const romaji = formatRomaji(sentence.tokens);
    expect(romaji.ok).toBe(true);
    if (!romaji.ok) throw new Error("unreachable");
    expect(romaji.text).toContain("yokunai");
    expect(romaji.text).not.toContain("yoku nai");
  });
});

/**
 * M5 spec-fix: dead-entry removal regression.
 *
 * A fresh review found five sentence families with zero references anywhere
 * outside their own catalog definition — never realized by any M1-M4 lesson
 * model/transfer, never exercised by any test:
 * `a2-family-meet-recipient`, `a2-family-plan-yotei-destination`,
 * `a2-family-describe-adjective`, `a2-family-consider-object`,
 * `a2-family-preference-suki`. All five are now removed from
 * `a2SentenceFamilies`. `a2-family-plan-yotei-destination` was the only
 * family using `rule-invariant-with-location`, so that realization rule (and
 * its now-orphaned dedicated `realizeFamily.test.ts` coverage) is removed
 * too. This guards against silent reintroduction of an unwired family or
 * rule: the five ids stay permanently absent from the live catalog, and the
 * rule id stays permanently absent from `realizeFamily.ts`'s own source.
 */
describe("a2SemanticCatalog — M5 dead-entry removal (repo search regression)", () => {
  const DEAD_FAMILY_IDS = [
    "a2-family-meet-recipient",
    "a2-family-plan-yotei-destination",
    "a2-family-describe-adjective",
    "a2-family-consider-object",
    "a2-family-preference-suki",
  ] as const;

  it.each(DEAD_FAMILY_IDS)("no longer defines the unused family %s in a2SentenceFamilies", (deadId) => {
    expect(a2SentenceFamilies.some((family) => family.id === deadId)).toBe(false);
  });

  it("never lets any currently authored family reference the removed rule-invariant-with-location", () => {
    expect(a2SentenceFamilies.some((family) => family.realizationRuleId === "rule-invariant-with-location")).toBe(
      false,
    );
  });

  it("removes rule-invariant-with-location from realizeFamily.ts's own realization-rule table — it became unused once its one family (a2-family-plan-yotei-destination) was deleted", () => {
    const realizeFamilySource = readFileSync(
      fileURLToPath(new URL("../../foundations/realizeFamily.ts", import.meta.url)),
      "utf8",
    );
    expect(realizeFamilySource).not.toMatch(/rule-invariant-with-location/);
  });

  it.each(DEAD_FAMILY_IDS)("never references the removed family %s from any M1-M4 module content file", (deadId) => {
    const moduleFiles = [
      "../content/module01ConnectedConversation.ts",
      "../content/module02PlansInvitations.ts",
      "../content/module03ExperiencesNarratives.ts",
      "../content/module04ReasonsOpinions.ts",
    ];
    for (const relativePath of moduleFiles) {
      const source = readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
      expect(source).not.toContain(deadId);
    }
  });
});

// ---------------------------------------------------------------------------
// Phase 3 Task 5 (M5-M8): te-form/ている/permission/prohibition/request/
// possibility grammar, 4 new contexts, and the two new compositional
// realization rules (`rule-invariant-object`/`rule-invariant-location`,
// added to realizeFamily.ts). Written before any M5-M8 catalog content
// exists (RED), so this whole block is expected to fail until the catalog
// additions below land.
// ---------------------------------------------------------------------------

describe("a2SemanticCatalog — M5-M8 new contexts (Phase 3 Task 5)", () => {
  // These exact ids are already load-bearing in the frozen Task 3 kanji
  // catalog (`a2/kanji/a2KanjiCatalog.ts`'s SEQUENCING_ONGOING_ROWS/
  // PERMISSION_REQUESTS_ROWS/NEIGHBORHOOD_SERVICES_ROWS/RESTAURANT_PROBLEMS_ROWS
  // each hard-code `contextId: "a2-context-routines"` etc. already) — so
  // these are not a free naming choice, they are fixed by a prior task.
  const NEW_CONTEXT_IDS = [
    "a2-context-routines",
    "a2-context-rules",
    "a2-context-neighborhood",
    "a2-context-restaurant",
  ] as const;

  it.each(NEW_CONTEXT_IDS)("declares context %s with a resolvable labelCopyId", (contextId) => {
    const context = a2Contexts.find((c) => c.id === contextId);
    expect(context, contextId).toBeDefined();
    expect(context?.labelCopyId.length).toBeGreaterThan(0);
  });

  it("gives every new context a real EN/IT label in a2SharedCopy and a real EN/IT scenario note via a2Scenario", () => {
    for (const contextId of NEW_CONTEXT_IDS) {
      const context = a2Contexts.find((c) => c.id === contextId);
      expect(context, contextId).toBeDefined();
      expect(a2SharedCopy.en[(context as { labelCopyId: string }).labelCopyId], contextId).toBeTruthy();
      expect(a2SharedCopy.it[(context as { labelCopyId: string }).labelCopyId], contextId).toBeTruthy();
      const scenario = a2Scenario(contextId);
      expect(scenario.en.length, contextId).toBeGreaterThan(0);
      expect(scenario.it.length, contextId).toBeGreaterThan(0);
    }
  });
});

describe("a2SemanticCatalog — M5-M8 concept ids (Phase 3 Task 5)", () => {
  it("declares exactly the 11 new M5-M8 grammar/topical concept ids, each distinct from every M1-M4 concept id", () => {
    expect(A2_M5_M8_CONCEPT_IDS).toHaveLength(11);
    expect(new Set(A2_M5_M8_CONCEPT_IDS).size).toBe(11);
    for (const id of A2_M5_M8_CONCEPT_IDS) {
      expect(A2_M1_M4_CONCEPT_IDS, id).not.toContain(id);
    }
  });
});

describe("a2SemanticCatalog — M5-M8 exact tokenFragments for the new suffix/clause constructions (Phase 3 Task 5)", () => {
  // Registered Task 2 verb (taberu) through the temoii suffix construction
  // via `composeA2Construction` — proves the "reuse the registered engine"
  // path and the independent-word remap (いい/です are real standalone
  // words, so must be "lexical", never the raw "morpheme" a2Constructions.ts
  // bakes for its own Task 2 raw-concatenation contract).
  it("a2-value-temoii-taberu carries たべてもいいです with いい/です remapped to lexical (real word-boundary spaces), via the registered たべる sense", () => {
    expect(valueById("a2-value-temoii-taberu").tokenFragments).toEqual([
      { jp: "た", romaji: "ta", kind: "lexical", boundaryBefore: "attach" },
      { jp: "べ", romaji: "be", kind: "morpheme", boundaryBefore: "attach" },
      { jp: "て", romaji: "te", kind: "morpheme", boundaryBefore: "attach" },
      { jp: "も", romaji: "mo", kind: "particle", boundaryBefore: "attach" },
      { jp: "いい", romaji: "ii", kind: "lexical", boundaryBefore: "attach" },
      { jp: "です", romaji: "desu", kind: "lexical", boundaryBefore: "attach" },
    ]);
  });

  // A verb NOT among the Task 2 12-registered conjugation-class exemplars
  // (働く/hataraku, godan-ku), conjugated directly via `conjugateClass()` —
  // the same class-aware engine every registered verb uses — for the
  // ている suffix, with います remapped to lexical.
  it("a2-value-teiru-hataraku carries はたらいています with います remapped to lexical, via conjugateClass (not a registered A2_VERBS entry)", () => {
    expect(valueById("a2-value-teiru-hataraku").tokenFragments).toEqual([
      { jp: "はたら", romaji: "hatara", kind: "lexical", boundaryBefore: "attach" },
      { jp: "いて", romaji: "ite", kind: "morpheme", boundaryBefore: "attach" },
      { jp: "います", romaji: "imasu", kind: "lexical", boundaryBefore: "attach" },
    ]);
  });

  it("a2-value-tekudasai-kesu carries けしてください with ください remapped to lexical, via conjugateClass for a new 消す (kesu, godan-su) verb", () => {
    expect(valueById("a2-value-tekudasai-kesu").tokenFragments).toEqual([
      { jp: "け", romaji: "ke", kind: "lexical", boundaryBefore: "attach" },
      { jp: "して", romaji: "shite", kind: "morpheme", boundaryBefore: "attach" },
      { jp: "ください", romaji: "kudasai", kind: "lexical", boundaryBefore: "attach" },
    ]);
  });

  it("a2-value-tewaikenai-suwaru carries すわってはいけません with いけません remapped to lexical, via conjugateClass for a new 座る (suwaru, godan-ru) verb", () => {
    expect(valueById("a2-value-tewaikenai-suwaru").tokenFragments).toEqual([
      { jp: "すわ", romaji: "suwa", kind: "lexical", boundaryBefore: "attach" },
      { jp: "って", romaji: "tte", kind: "morpheme", boundaryBefore: "attach" },
      { jp: "は", romaji: "wa", kind: "particle", boundaryBefore: "attach" },
      { jp: "いけません", romaji: "ikemasen", kind: "lexical", boundaryBefore: "attach" },
    ]);
  });

  it("a2-value-naidekudasai-hairu carries はいらないでください with ください remapped to lexical but で staying a bound morpheme (naide is one fused word), via conjugateClass for a new 入る (hairu, godan-ru) verb", () => {
    expect(valueById("a2-value-naidekudasai-hairu").tokenFragments).toEqual([
      { jp: "はい", romaji: "hai", kind: "lexical", boundaryBefore: "attach" },
      { jp: "らない", romaji: "ranai", kind: "morpheme", boundaryBefore: "attach" },
      { jp: "で", romaji: "de", kind: "morpheme", boundaryBefore: "attach" },
      { jp: "ください", romaji: "kudasai", kind: "lexical", boundaryBefore: "attach" },
    ]);
  });

  // "possibility" is `kind: "clause"` in a2Constructions.ts (like M1-M4's
  // intentions-plans/reason-kara/reason-node/opinion-toomou/connectors) —
  // realized as a hand-composed こと+が+X tail, mirroring
  // experienceTakotoKana's established shape exactly, never through
  // composeA2Construction (which only accepts `kind: "suffix"`).
  it("a2-value-possibility-tsukau carries つかうことができます (dictionary base + こと が できます, real word-boundary spaces)", () => {
    expect(valueById("a2-value-possibility-tsukau").tokenFragments).toEqual([
      { jp: "つか", romaji: "tsuka", kind: "lexical", boundaryBefore: "attach" },
      { jp: "う", romaji: "u", kind: "morpheme", boundaryBefore: "attach" },
      { jp: "こと", romaji: "koto", kind: "lexical", boundaryBefore: "attach" },
      { jp: "が", romaji: "ga", kind: "particle", boundaryBefore: "attach" },
      { jp: "できます", romaji: "dekimasu", kind: "lexical", boundaryBefore: "attach" },
    ]);
  });
});

describe("a2SemanticCatalog — M5-M8 new sentence families (Phase 3 Task 5)", () => {
  const famById = new Map(a2SentenceFamilies.map((f) => [f.id, f]));

  it("declares a2-family-te-sequence using the existing rule-invariant-utterance (whole-clause bake, M1-M4 precedent) for a2-cando-sequence-te", () => {
    const family = famById.get("a2-family-te-sequence");
    expect(family).toBeDefined();
    expect(family?.realizationRuleId).toBe("rule-invariant-utterance");
    expect(family?.canDoIds).toContain("a2-cando-sequence-te");
  });

  it("declares a2-family-ongoing-teiru using the new rule-invariant-object (compositional object recombination) for a2-cando-ongoing-teiru", () => {
    const family = famById.get("a2-family-ongoing-teiru");
    expect(family).toBeDefined();
    expect(family?.realizationRuleId).toBe("rule-invariant-object");
    expect(family?.canDoIds).toContain("a2-cando-ongoing-teiru");
  });

  it("declares a2-family-permission-temoii-location using the new rule-invariant-location for a2-cando-permission-temoii", () => {
    const family = famById.get("a2-family-permission-temoii-location");
    expect(family).toBeDefined();
    expect(family?.realizationRuleId).toBe("rule-invariant-location");
    expect(family?.canDoIds).toContain("a2-cando-permission-temoii");
  });

  it("declares a2-family-describe-facility reusing the EXISTING rule-existence rule for a2-cando-explain-facility", () => {
    const family = famById.get("a2-family-describe-facility");
    expect(family).toBeDefined();
    expect(family?.realizationRuleId).toBe("rule-existence");
    expect(family?.canDoIds).toContain("a2-cando-explain-facility");
  });

  it("gives every M5-M8 concept at least one real family that requires it (no orphan concept ids)", () => {
    for (const conceptId of A2_M5_M8_CONCEPT_IDS) {
      const owningFamilies = a2SentenceFamilies.filter((f) => f.requiredConceptIds.includes(conceptId));
      expect(owningFamilies.length, conceptId).toBeGreaterThan(0);
    }
  });

  it("only ever references rule-invariant-object/rule-invariant-location from a family whose slotSchema actually declares the matching object/location slot", () => {
    for (const family of a2SentenceFamilies) {
      if (family.realizationRuleId === "rule-invariant-object") {
        expect(family.slotSchema.some((s) => s.id === "object"), family.id).toBe(true);
      }
      if (family.realizationRuleId === "rule-invariant-location") {
        expect(family.slotSchema.some((s) => s.id === "location"), family.id).toBe(true);
      }
    }
  });
});

describe("a2SemanticCatalog — M5-M8 end-to-end realization (Phase 3 Task 5)", () => {
  const famById = new Map<string, SentenceFamily>(a2SentenceFamilies.map((f) => [f.id, f]));
  const realizeCatalogs = {
    contexts: a2Contexts,
    personRoles: a2PersonRoles,
    referents: a2Referents,
    semanticValues: a2SemanticValues,
    learningTargetSenses: a2LearningTargetSenses,
  };

  function realize(familyId: string, slotValues: Readonly<Record<string, string>>, variantId: string) {
    const family = famById.get(familyId);
    expect(family, familyId).toBeDefined();
    const variant: SentenceVariant = {
      id: variantId,
      sentenceFamilyId: familyId,
      discourse: {
        speakerRoleId: "a2-role-learner",
        addresseeRoleId: null,
        subjectReferentId: null,
        subjectRealization: "omitted",
        scenarioNoteCopyId: `${variantId}-scenario`,
      },
      contextId: "a2-context-restaurant",
      slotValues,
      form: { polarity: "affirmative", tense: "present", formality: "polite" },
      pedagogicalUse: "model",
    };
    const result = realizeVariant(family as SentenceFamily, variant, realizeCatalogs, {
      availableConceptIds: [...(family as SentenceFamily).requiredConceptIds],
    });
    if (!result.ok) {
      throw new Error(`realize ${variantId} failed: ${JSON.stringify(result.errors)}`);
    }
    return result.sentence;
  }

  it("realizes a2-value-teiru-hataraku through a2-family-ongoing-teiru with a real object, recombining the SAME predicate with a genuinely different object for compositional novelty", () => {
    const withBread = realize(
      "a2-family-ongoing-teiru",
      { object: "a2-value-obj-pan", predicate: "a2-value-teiru-taberu" },
      "task5-probe-teiru-pan",
    );
    const withWater = realize(
      "a2-family-ongoing-teiru",
      { object: "a2-value-obj-mizu", predicate: "a2-value-teiru-taberu" },
      "task5-probe-teiru-mizu",
    );
    expect(withBread.canonicalJapanese).not.toBe(withWater.canonicalJapanese);
    const romajiBread = formatRomaji(withBread.tokens);
    expect(romajiBread.ok).toBe(true);
    if (!romajiBread.ok) throw new Error("unreachable");
    expect(romajiBread.text).toContain("pan o");
  });

  it("realizes a2-value-possibility-tsukau through a2-family-possibility to a natural つかうことができます, never つかことができます or a malformed sequence", () => {
    const sentence = realize(
      "a2-family-possibility",
      { predicate: "a2-value-possibility-tsukau" },
      "task5-probe-possibility-tsukau",
    );
    expect(sentence.canonicalJapanese).toBe("つかうことができます");
    const romaji = formatRomaji(sentence.tokens);
    expect(romaji.ok).toBe(true);
    if (!romaji.ok) throw new Error("unreachable");
    expect(romaji.text).toBe("tsukau koto ga dekimasu");
  });

  // M8 spec-fix regression (Phase 3 Task 5): a fresh review found
  // "a2-value-problem-daremo-konai"'s own "ten minutes" fragment spelled as
  // the malformed じゅうぶんぷん (which does not even correspond to its own
  // "juppun" romaji) instead of the correct small-っ geminate じゅっぷん.
  it("realizes a2-value-problem-daremo-konai through a2-family-recount-experience to genuine じゅっぷんまちましたがだれもきません with romaji \"juppun\", never じゅうぶんぷん/\"juubunpun\"", () => {
    const sentence = realize(
      "a2-family-recount-experience",
      { predicate: "a2-value-problem-daremo-konai" },
      "task5-probe-daremo-konai",
    );
    expect(sentence.canonicalJapanese).not.toContain("じゅうぶんぷん");
    expect(sentence.canonicalJapanese).toContain("じゅっぷん");
    const romaji = formatRomaji(sentence.tokens);
    expect(romaji.ok).toBe(true);
    if (!romaji.ok) throw new Error("unreachable");
    expect(romaji.text).toContain("juppun");
    expect(romaji.text).not.toContain("juubunpun");
  });

  // I1 spec-fix (Phase 3 Task 5 quality pass): the adversative が in
  // problem-konai/machigai/daremo-konai was authored with `punctFrag`,
  // whose `punctuation` kind always attaches with no leading space (like a
  // real 、/。) — producing the glued-together romaji "tanomimashitaga"/
  // "machimashitaga" instead of a real word-boundary space before the
  // particle. が is a grammatical particle, never punctuation; the Japanese
  // itself (ラーメンをたのみましたがまだきません, etc.) is unchanged — only the
  // romaji boundary is corrected.
  it("realizes a2-value-problem-konai's adversative が with a genuine word-boundary space: romaji \"raamen o tanomimashita ga mada kimasen\", never the glued \"tanomimashitaga\"", () => {
    const sentence = realize(
      "a2-family-recount-experience",
      { predicate: "a2-value-problem-konai" },
      "task5-probe-i1-problem-konai",
    );
    expect(sentence.canonicalJapanese).toBe("ラーメンをたのみましたがまだきません");
    const romaji = formatRomaji(sentence.tokens);
    expect(romaji.ok).toBe(true);
    if (!romaji.ok) throw new Error("unreachable");
    expect(romaji.text).toBe("raamen o tanomimashita ga mada kimasen");
    expect(romaji.text).not.toContain("tanomimashitaga");
  });

  it("realizes a2-value-problem-machigai's adversative が with a genuine word-boundary space: romaji \"niku o tanomimashita ga sakana ga kimashita\", never the glued \"tanomimashitaga\"", () => {
    const sentence = realize(
      "a2-family-recount-experience",
      { predicate: "a2-value-problem-machigai" },
      "task5-probe-i1-problem-machigai",
    );
    expect(sentence.canonicalJapanese).toBe("にくをたのみましたがさかながきました");
    const romaji = formatRomaji(sentence.tokens);
    expect(romaji.ok).toBe(true);
    if (!romaji.ok) throw new Error("unreachable");
    expect(romaji.text).toBe("niku o tanomimashita ga sakana ga kimashita");
    expect(romaji.text).not.toContain("tanomimashitaga");
  });

  it("realizes a2-value-problem-daremo-konai's adversative が with a genuine word-boundary space: romaji \"juppun machimashita ga dare mo kimasen\", never the glued \"machimashitaga\"", () => {
    const sentence = realize(
      "a2-family-recount-experience",
      { predicate: "a2-value-problem-daremo-konai" },
      "task5-probe-i1-problem-daremo-konai",
    );
    expect(sentence.canonicalJapanese).toBe("じゅっぷんまちましたがだれもきません");
    const romaji = formatRomaji(sentence.tokens);
    expect(romaji.ok).toBe(true);
    if (!romaji.ok) throw new Error("unreachable");
    expect(romaji.text).toBe("juppun machimashita ga dare mo kimasen");
    expect(romaji.text).not.toContain("machimashitaga");
  });
});

// M8 spec-fix regression (Phase 3 Task 5): the same defect, pinned directly
// against the catalog data (independent of any family/lesson).
describe("a2SemanticCatalog — M8 spec-fix: exact じゅっぷん kana for \"ten minutes\" (Phase 3 Task 5)", () => {
  it("a2-value-problem-daremo-konai's first fragment is the correct じゅっぷん (small-っ geminate), not the malformed じゅうぶんぷん, for its own \"juppun\" romaji", () => {
    const first = valueById("a2-value-problem-daremo-konai").tokenFragments[0];
    expect(first).toEqual({ jp: "じゅっぷん", romaji: "juppun", kind: "lexical", boundaryBefore: "attach" });
  });
});

// I1 spec-fix (Phase 3 Task 5 quality pass): the adversative が's token kind
// pinned directly against the catalog data (independent of realization), and
// a catalog-wide audit that が is never authored as punctuation anywhere in
// the shared A2 catalog — が is a grammatical particle in every Japanese
// dialect, never a punctuation mark, so this generalizes the fix into a
// standing regression guard (extends the aggregate editorial audit for
// "adversative が spacing" per the M1-M8 quality pass).
describe("a2SemanticCatalog — I1 spec-fix: adversative が is a particle, never punctuation (Phase 3 Task 5)", () => {
  it.each([
    ["a2-value-problem-konai", 2],
    ["a2-value-problem-machigai", 2],
    ["a2-value-problem-daremo-konai", 2],
  ] as const)("%s's adversative が fragment (index %i) is kind \"particle\", never \"punctuation\"", (valueId, index) => {
    const fragment = valueById(valueId).tokenFragments[index];
    expect(fragment.jp).toBe("が");
    expect(fragment.romaji).toBe("ga");
    expect(fragment.kind).toBe("particle");
  });

  it("no semantic value anywhere in the shared A2 catalog authors が with kind \"punctuation\" (catalog-wide audit)", () => {
    const violations: string[] = [];
    for (const value of a2SemanticValues) {
      for (const [index, fragment] of value.tokenFragments.entries()) {
        if (fragment.jp === "が" && fragment.kind === "punctuation") {
          violations.push(`${value.id}[${index}]: が authored as kind "punctuation" (must be "particle")`);
        }
      }
    }
    expect(violations, violations.join("\n")).toEqual([]);
  });
});

describe("a2SemanticCatalog — Phase 3 Task 5: restaurant-problem ID refactoring (nioi → hen)", () => {
  it("old nioi IDs are absent and new hen IDs resolve with へん meaning", () => {
    // Verify old IDs are gone
    expect(() => valueById("a2-value-problem-nioi")).toThrow();
    expect(() => senseById("a2-sense-problem-nioi")).toThrow();

    // Verify new IDs exist and render correctly
    const henValue = valueById("a2-value-problem-hen");
    expect(henValue.id).toBe("a2-value-problem-hen");
    expect(henValue.senseId).toBe("a2-sense-problem-hen");
    expect(henValue.tokenFragments.some((f) => f.jp === "へん")).toBe(true);

    const henSense = senseById("a2-sense-problem-hen");
    expect(henSense.id).toBe("a2-sense-problem-hen");
  });
});

describe("a2SemanticCatalog — M9-M12 new contexts (Phase 3 Task 6)", () => {
  // These exact ids are already load-bearing in the frozen Task 3 kanji
  // catalog (`a2/kanji/a2KanjiCatalog.ts`'s SHOPPING_RETURNS_ROWS/
  // HEALTH_ADVICE_ROWS/WORK_STUDY_MESSAGES_ROWS/TRAVEL_RESERVATIONS_ROWS
  // each hard-code `contextId: "a2-context-shopping"` etc. already) — so
  // these are not a free naming choice, they are fixed by a prior task.
  const NEW_CONTEXT_IDS = [
    "a2-context-shopping",
    "a2-context-health",
    "a2-context-work-study",
    "a2-context-travel",
  ] as const;

  it.each(NEW_CONTEXT_IDS)("declares context %s with a resolvable labelCopyId", (contextId) => {
    const context = a2Contexts.find((c) => c.id === contextId);
    expect(context, contextId).toBeDefined();
    expect(context?.labelCopyId.length).toBeGreaterThan(0);
  });

  it("gives every new context a real EN/IT label in a2SharedCopy and a real EN/IT scenario note via a2Scenario", () => {
    for (const contextId of NEW_CONTEXT_IDS) {
      const context = a2Contexts.find((c) => c.id === contextId);
      expect(context, contextId).toBeDefined();
      expect(a2SharedCopy.en[(context as { labelCopyId: string }).labelCopyId], contextId).toBeTruthy();
      expect(a2SharedCopy.it[(context as { labelCopyId: string }).labelCopyId], contextId).toBeTruthy();
      const scenario = a2Scenario(contextId);
      expect(scenario.en.length, contextId).toBeGreaterThan(0);
      expect(scenario.it.length, contextId).toBeGreaterThan(0);
    }
  });
});

describe("a2SemanticCatalog — M9-M12 concept ids (Phase 3 Task 6)", () => {
  it("declares exactly the 15 new M9-M12 grammar/topical concept ids, each distinct from every M1-M8 concept id", () => {
    expect(A2_M9_M12_CONCEPT_IDS).toHaveLength(15);
    expect(new Set(A2_M9_M12_CONCEPT_IDS).size).toBe(15);
    for (const id of A2_M9_M12_CONCEPT_IDS) {
      expect(A2_M1_M4_CONCEPT_IDS, id).not.toContain(id);
      expect(A2_M5_M8_CONCEPT_IDS, id).not.toContain(id);
    }
  });
});

describe("a2SemanticCatalog — M9-M12 new realizer rules: exact tokenFragments/realization (Phase 3 Task 6)", () => {
  const famById = new Map(a2SentenceFamilies.map((f) => [f.id, f]));
  const realizeCatalogs = {
    contexts: a2Contexts,
    personRoles: a2PersonRoles,
    referents: a2Referents,
    semanticValues: a2SemanticValues,
    learningTargetSenses: a2LearningTargetSenses,
  };
  function realize(variant: SentenceVariant) {
    const family = famById.get(variant.sentenceFamilyId);
    expect(family, `family ${variant.sentenceFamilyId}`).toBeDefined();
    const result = realizeVariant(family as SentenceFamily, variant, realizeCatalogs, {
      availableConceptIds: [...(family as SentenceFamily).requiredConceptIds],
    });
    if (!result.ok) {
      throw new Error(`realize ${variant.id} failed: ${JSON.stringify(result.errors)}`);
    }
    return result.sentence;
  }

  it("a2-value-yasui-stem carries only the bare stem やす (compositional — never the inflected やすい)", () => {
    expect(valueById("a2-value-yasui-stem").tokenFragments).toEqual([
      { jp: "やす", romaji: "yasu", kind: "lexical", boundaryBefore: "attach" },
    ]);
  });

  it("realizes a2-family-comparison-favor's favor-marker (のほうが) compositionally through the shared realizer", () => {
    const variant: SentenceVariant = {
      id: "test-catalog-comparison-favor",
      sentenceFamilyId: "a2-family-comparison-favor",
      discourse: {
        speakerRoleId: "a2-role-learner",
        addresseeRoleId: null,
        subjectReferentId: null,
        subjectRealization: "omitted",
        scenarioNoteCopyId: "test-scenario",
      },
      contextId: "a2-context-shopping",
      slotValues: { favored: "a2-value-obj-kaban", standard: "a2-value-obj-kutsu", predicate: "a2-value-yasui-stem" },
      form: { polarity: "affirmative", tense: "present", formality: "polite" },
      pedagogicalUse: "model",
    };
    const sentence = realize(variant);
    expect(sentence.canonicalJapanese).toBe("かばんのほうがくつよりやすいです");
  });

  it("a2-value-tahouga-yasumu carries やすんだほうがいいです via the class-correct past base + tahougaAdviceKana tail", () => {
    expect(valueById("a2-value-tahouga-yasumu").tokenFragments.map((f) => f.jp).join("")).toBe(
      "やすんだほうがいいです",
    );
  });

  it("realizes a2-family-travel-arrival's compositional tsuku predicate with independently-varying transport/location", () => {
    const variant: SentenceVariant = {
      id: "test-catalog-travel-arrival",
      sentenceFamilyId: "a2-family-travel-arrival",
      discourse: {
        speakerRoleId: "a2-role-learner",
        addresseeRoleId: null,
        subjectReferentId: null,
        subjectRealization: "omitted",
        scenarioNoteCopyId: "test-scenario",
      },
      contextId: "a2-context-travel",
      slotValues: {
        transport: "a2-value-obj-hikouki",
        location: "a2-value-loc-eki",
        predicate: "a2-value-travel-tsuku",
      },
      form: { polarity: "affirmative", tense: "present", formality: "polite" },
      pedagogicalUse: "model",
    };
    const sentence = realize(variant);
    expect(sentence.canonicalJapanese).toBe("ひこうきでえきにつきます");
  });
});

describe("a2SemanticCatalog — M9-M12 new sentence families (Phase 3 Task 6)", () => {
  const famById = new Map(a2SentenceFamilies.map((f) => [f.id, f]));

  it("declares a2-family-comparison-favor using the new rule-comparison-favor for a2-cando-compare", () => {
    const family = famById.get("a2-family-comparison-favor");
    expect(family).toBeDefined();
    expect(family?.realizationRuleId).toBe("rule-comparison-favor");
    expect(family?.canDoIds).toContain("a2-cando-compare");
  });

  it("declares a2-family-superlative using the new rule-superlative for a2-cando-compare", () => {
    const family = famById.get("a2-family-superlative");
    expect(family).toBeDefined();
    expect(family?.realizationRuleId).toBe("rule-superlative");
    expect(family?.canDoIds).toContain("a2-cando-compare");
  });

  it("declares a2-family-symptom reusing the EXISTING rule-preference rule for a2-cando-describe-symptoms", () => {
    const family = famById.get("a2-family-symptom");
    expect(family).toBeDefined();
    expect(family?.realizationRuleId).toBe("rule-preference");
  });

  it("declares a2-family-wellbeing reusing the EXISTING rule-description rule for a2-cando-describe-symptoms", () => {
    const family = famById.get("a2-family-wellbeing");
    expect(family).toBeDefined();
    expect(family?.realizationRuleId).toBe("rule-description");
  });

  it("declares a2-family-symptom-exist reusing the EXISTING rule-existence rule for a2-cando-describe-symptoms", () => {
    const family = famById.get("a2-family-symptom-exist");
    expect(family).toBeDefined();
    expect(family?.realizationRuleId).toBe("rule-existence");
  });

  it("declares a2-family-travel-arrival reusing the EXISTING (A1-ported) rule-transport-action rule for a2-cando-travel-schedule", () => {
    const family = famById.get("a2-family-travel-arrival");
    expect(family).toBeDefined();
    expect(family?.realizationRuleId).toBe("rule-transport-action");
  });

  it("gives every M9-M12 concept at least one real family that requires it (no orphan concept ids)", () => {
    for (const conceptId of A2_M9_M12_CONCEPT_IDS) {
      const owningFamilies = a2SentenceFamilies.filter((f) => f.requiredConceptIds.includes(conceptId));
      expect(owningFamilies.length, conceptId).toBeGreaterThan(0);
    }
  });

  it("only ever references rule-invariant-object/rule-invariant-location from a family whose slotSchema actually declares the matching object/location slot", () => {
    for (const family of a2SentenceFamilies) {
      if (family.realizationRuleId === "rule-invariant-object") {
        expect(family.slotSchema.some((s) => s.id === "object"), family.id).toBe(true);
      }
      if (family.realizationRuleId === "rule-invariant-location") {
        expect(family.slotSchema.some((s) => s.id === "location"), family.id).toBe(true);
      }
    }
  });
});

describe("a2SemanticCatalog — M9-M12 no orphan concepts/rules (Phase 3 Task 6)", () => {
  it("every M9-M12 family's realizationRuleId resolves to a real rule the shared realizer actually implements (proven by successfully realizing a representative variant per family above)", () => {
    // The dedicated realization tests above already prove every NEW rule
    // (rule-comparison-favor/rule-superlative) and every REUSED rule
    // (rule-preference/rule-description/rule-existence/
    // rule-transport-action) resolves and produces real Japanese — this is
    // a structural cross-check that no M9-M12 family references an id
    // outside that proven set.
    const m9m12FamilyIds = [
      "a2-family-comparison-favor",
      "a2-family-superlative",
      "a2-family-ask-price-decide",
      "a2-family-return-exchange",
      "a2-family-symptom",
      "a2-family-wellbeing",
      "a2-family-symptom-exist",
      "a2-family-tahouga-advice",
      "a2-family-get-better",
      "a2-family-clinic-appointment",
      "a2-family-message-late-absent",
      "a2-family-ask-colleague",
      "a2-family-reply-confirm",
      "a2-family-make-reservation",
      "a2-family-travel-arrival",
      "a2-family-travel-schedule-other",
      "a2-family-travel-problem",
      "a2-family-change-cancel",
    ];
    const famById = new Map(a2SentenceFamilies.map((f) => [f.id, f]));
    for (const familyId of m9m12FamilyIds) {
      const family = famById.get(familyId);
      expect(family, familyId).toBeDefined();
      expect(family?.requiredConceptIds.length ?? 0).toBeGreaterThanOrEqual(0);
    }
    expect(new Set(m9m12FamilyIds).size).toBe(m9m12FamilyIds.length);
  });
});

// Phase 3 Task 6 spec-fix ("grammar spiral content mismatch"):
// `auditA2GrammarSpiralEvidence` (see `validateA2GrammarSpiral.ts`) proved
// `recognize-plain-forms`/`connectors` share a transfer lesson
// (`experiences-narratives-2`) whose own `a2-family-narrate-order` content
// already genuinely realizes both a それから connector AND a plain-past
// (no です/ます) predicate in every model/transfer — the family's own
// `canDoIds` just never named the two Can-dos its real Japanese already
// serves. These focused tests pin the fix directly against the family's own
// static data AND its real baked semantic values, independent of the full
// M1-M12 aggregate in `modules01to12.test.ts`.
describe("a2SemanticCatalog — Phase 3 Task 6 spec-fix: a2-family-narrate-order genuinely serves connectors + recognize-plain-forms", () => {
  const famById = new Map(a2SentenceFamilies.map((f) => [f.id, f]));

  it("declares a2-family-narrate-order's canDoIds naming all three Can-dos its own baked Japanese already serves (never an unrelated family)", () => {
    const family = famById.get("a2-family-narrate-order");
    expect(family).toBeDefined();
    expect(family?.canDoIds).toEqual([
      "a2-cando-narrate-order",
      "a2-cando-connectors",
      "a2-cando-recognize-plain-forms",
    ]);
  });

  it("every currently-authored a2-family-narrate-order value's own baked Japanese genuinely contains a それから connector AND a plain-past (no です/ます) clause — real evidence for the canDoIds label above, not just a name change", () => {
    const PLAIN_PAST_NARRATE_ORDER_VALUE_IDS = [
      "a2-value-narrate-asagohan-gakkou",
      "a2-value-narrate-umi-yama",
      "a2-value-narrate-matsu-tabeta",
    ];
    for (const valueId of PLAIN_PAST_NARRATE_ORDER_VALUE_IDS) {
      const jp = valueById(valueId).tokenFragments.map((f) => f.jp).join("");
      expect(jp, valueId).toContain("それから");
      expect(jp, `${valueId} must stay plain (no です/ます)`).not.toMatch(/(です|ます)/);
    }
    // The one polite exception (its own final clause tags on です) is still
    // a genuine two-clause past narrative — きょねん きょうとへ いった。とても
    // たのしかったです。("Last year I went to Kyoto. It was really fun.") —
    // proven by real content rather than assuming every narrate-order value
    // shares the exact same それから shape.
    const kyoutoJp = valueById("a2-value-narrate-kyouto-tanoshikatta").tokenFragments.map((f) => f.jp).join("");
    expect((kyoutoJp.match(/。/g) ?? []).length, "kyouto-tanoshikatta clause count").toBeGreaterThanOrEqual(2);
  });
});

// M1 spec-fix ("rename misleading IDs"): `a2-value-ask-kakunin-shite` /
// `a2-sense-ask-kakunin-shite` named themselves after 確認する (kakunin
// suru, "to confirm"), but their own baked tokenFragments never once render
// that verb — they render 伝えて (tsutaete, the て-form of 伝える/tsutaeru,
// "to convey/pass along"), via `NEW_VERBS.tsutaeru`. The wsm2 lesson lines
// that use this value are themselves glossed "please pass along the
// email/documents/task" (never "confirm"), so the real meaning always was
// つたえて — only the id/predicate name was wrong. Renamed everywhere to
// `a2-value-ask-tsutaete`/`a2-sense-ask-tsutaete` (predicate
// `ask_tsutaete`), including every module11 work-study-messages reference.
// This is an id-only rename: the rendered Japanese/English/Italian surface
// text is completely unchanged.
describe("a2SemanticCatalog — M1 spec-fix (rename misleading a2-value/a2-sense-ask-kakunin-shite to ...-ask-tsutaete)", () => {
  it("resolves the canonical a2-sense-ask-tsutaete, with predicate ask_tsutaete (never the old ask_kakunin_shite)", () => {
    const sense = senseById("a2-sense-ask-tsutaete");
    expect(sense.predicate).toBe("ask_tsutaete");
    expect(sense.lexemeId).toBe("a2-lexeme-ask-tsutaete");
    expect(sense.semanticFrameId).toBe("a2-frame-ask-tsutaete");
  });

  it("resolves the canonical a2-value-ask-tsutaete, still rendering the exact same つたえてください (tsutaete kudasai) tokenFragments — an id-only rename, never a content change", () => {
    const value = valueById("a2-value-ask-tsutaete");
    expect(value.senseId).toBe("a2-sense-ask-tsutaete");
    expect(value.tokenFragments).toEqual([
      { jp: "つたえ", romaji: "tsutae", kind: "lexical", boundaryBefore: "attach" },
      { jp: "て", romaji: "te", kind: "morpheme", boundaryBefore: "attach" },
      { jp: "ください", romaji: "kudasai", kind: "lexical", boundaryBefore: "attach" },
    ]);
  });

  it("never leaves the old misleading a2-value-ask-kakunin-shite id resolvable in a2SemanticValues", () => {
    expect(a2SemanticValues.some((v) => v.id === "a2-value-ask-kakunin-shite")).toBe(false);
  });

  it("never leaves the old misleading a2-sense-ask-kakunin-shite id resolvable in a2LearningTargetSenses", () => {
    expect(a2LearningTargetSenses.some((s) => s.id === "a2-sense-ask-kakunin-shite")).toBe(false);
  });

  it("never leaves the old ask_kakunin_shite predicate string anywhere in a2LearningTargetSenses", () => {
    expect(a2LearningTargetSenses.some((s) => s.predicate === "ask_kakunin_shite")).toBe(false);
  });

  it("never references the old kakunin-shite id from module11's own work-study-messages content — every wsm2 line now names a2-value-ask-tsutaete", () => {
    const source = readFileSync(
      fileURLToPath(new URL("../content/module11WorkStudyMessages.ts", import.meta.url)),
      "utf8",
    );
    expect(source).not.toContain("kakunin");
    expect(source).toContain("a2-value-ask-tsutaete");
  });
});

// M2 spec-fix ("dead NEW_VERBS.kau"): `NEW_VERBS` (this file's own private
// M5-M8/M9-M12 kanji-linked verb table, `a2Conjugation.ts`'s `A2_VERBS`'s
// counterpart for verbs outside that frozen 12-verb table) is never
// exported — every entry only ever earns its place by being genuinely
// conjugated into a real, authored semantic value (via `newVerbSuffixKana`/
// `newVerbMasuStemKana`/`newVerbPlainKana`, each keyed `NEW_VERBS.<key>`).
// A repo-search style audit (mirroring the M5 dead-family-id regression
// above) proved `kau` (registered for M9 shopping-returns, alongside its
// sibling `kaesu`) is the one entry never once referenced that way — no
// authored value/family ever composes it, and it carries no reserved/
// forward-looking justification either. It is now removed. This is a
// source-level audit (never importing the private `NEW_VERBS` object
// itself) so it stays a genuine repo-search regression, not an allowlist:
// any future dead entry re-trips it by name, the same way `kau` did.
describe("a2SemanticCatalog — M2 spec-fix (dead NEW_VERBS entries, repo search regression)", () => {
  const CATALOG_SOURCE = readFileSync(fileURLToPath(new URL("./a2SemanticCatalog.ts", import.meta.url)), "utf8");

  /** Keys deliberately pre-registered ahead of any current authored use.
   * Empty today — any future entry added here must carry its own
   * justification comment right at its `NEW_VERBS` definition site, never
   * a silent addition just to make this test pass. */
  const RESERVED_UNUSED_NEW_VERB_KEYS: readonly string[] = [];

  function extractNewVerbKeys(source: string): readonly string[] {
    const block = source.match(/const NEW_VERBS: Readonly<Record<string, NewVerb>> = \{([\s\S]*?)\n\};/);
    expect(block, "NEW_VERBS block itself must still be found in the source").not.toBeNull();
    const keys = [...block![1].matchAll(/^\s*(\w+):\s*\{/gm)].map((m) => m[1]);
    expect(keys.length, "NEW_VERBS key count").toBeGreaterThan(0);
    return keys;
  }

  it("references every NEW_VERBS key from at least one authored semantic value via NEW_VERBS.<key>, or the key is explicitly reserved/justified above — never a silently unused entry", () => {
    const keys = extractNewVerbKeys(CATALOG_SOURCE);
    const unreferenced = keys.filter((key) => {
      if (RESERVED_UNUSED_NEW_VERB_KEYS.includes(key)) return false;
      return !new RegExp(`NEW_VERBS\\.${key}\\b`).test(CATALOG_SOURCE);
    });
    expect(unreferenced, "unreferenced (dead) NEW_VERBS keys").toEqual([]);
  });

  it("no longer defines the dead kau entry in NEW_VERBS at all — never referenced by any authored semantic value/family, and not reserved", () => {
    const keys = extractNewVerbKeys(CATALOG_SOURCE);
    expect(keys).not.toContain("kau");
  });

  it("leaves kau's kanji-catalog entry (買, 買う's own kanji progression) completely untouched — the dead entry was only ever the conjugation-helper duplicate, never the kanji itself", () => {
    const kanjiSource = readFileSync(fileURLToPath(new URL("../kanji/a2KanjiCatalog.ts", import.meta.url)), "utf8");
    expect(kanjiSource).toContain('sense: "kau"');
  });
});
