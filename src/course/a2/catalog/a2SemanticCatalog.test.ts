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
  a2Contexts,
  a2LearningTargetSenses,
  a2PersonRoles,
  a2Referents,
  a2SemanticValues,
  a2SentenceFamilies,
} from "./a2SemanticCatalog";

function valueById(id: string) {
  const value = a2SemanticValues.find((v) => v.id === id);
  expect(value, `semantic value ${id}`).toBeDefined();
  return value!;
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
