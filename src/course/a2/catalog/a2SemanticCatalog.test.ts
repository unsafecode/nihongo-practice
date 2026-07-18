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
  it("a2-value-hanasu carries the 話す ます-stem はなし/hanashi, never the bare unconjugated root はな/hana", () => {
    expect(valueById("a2-value-hanasu").tokenFragments).toEqual([
      { jp: "はなし", romaji: "hanashi", kind: "lexical", boundaryBefore: "attach" },
    ]);
  });

  it("a2-value-invite-shokuji carries the 食べる ます-stem たべ/tabe before ませんか, never the dictionary form たべる", () => {
    expect(valueById("a2-value-invite-shokuji").tokenFragments).toEqual([
      { jp: "いっしょに", romaji: "issho ni", kind: "lexical", boundaryBefore: "attach" },
      { jp: "しょくじを", romaji: "shokuji o", kind: "lexical", boundaryBefore: "attach" },
      { jp: "たべ", romaji: "tabe", kind: "lexical", boundaryBefore: "attach" },
      { jp: "ませんか", romaji: "masen ka", kind: "morpheme", boundaryBefore: "attach" },
    ]);
  });

  it("a2-value-invite-tomodachi-issho carries the same たべ/tabe ます-stem before ませんか, never the dictionary form たべる", () => {
    expect(valueById("a2-value-invite-tomodachi-issho").tokenFragments).toEqual([
      { jp: "こんばん", romaji: "konban", kind: "lexical", boundaryBefore: "attach" },
      { jp: "いっしょに", romaji: "issho ni", kind: "lexical", boundaryBefore: "attach" },
      { jp: "しょくじを", romaji: "shokuji o", kind: "lexical", boundaryBefore: "attach" },
      { jp: "たべ", romaji: "tabe", kind: "lexical", boundaryBefore: "attach" },
      { jp: "ませんか", romaji: "masen ka", kind: "morpheme", boundaryBefore: "attach" },
    ]);
  });

  it("a2-value-invite-hon carries the 行く ます-stem いき/iki before ませんか, never the dictionary form いく (latent — unused by any authored M1-M4 variant)", () => {
    expect(valueById("a2-value-invite-hon").tokenFragments).toEqual([
      { jp: "こんど", romaji: "kondo", kind: "lexical", boundaryBefore: "attach" },
      { jp: "いっしょに", romaji: "issho ni", kind: "lexical", boundaryBefore: "attach" },
      { jp: "ほんやに", romaji: "hon'ya ni", kind: "lexical", boundaryBefore: "attach" },
      { jp: "いき", romaji: "iki", kind: "lexical", boundaryBefore: "attach" },
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
});
