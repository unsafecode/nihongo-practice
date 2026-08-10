import { describe, expect, it } from "vitest";
import { formatRomaji } from "../../../romaji/formatRomaji";
import type { AssembledToken } from "../../../romaji/types";
import {
  composeBasePredicateTokens,
  composeBaseTokenSequences,
} from "./composeFormTokens";
import {
  realizeIAdjectivePredicate,
  realizeNaAdjectivePredicate,
  realizeNounPredicate,
} from "./adjectiveForms";
import { realizePoliteNonpast } from "./verbForms";

function token(
  id: string,
  jp: string,
  romaji: string,
  kind: AssembledToken["kind"],
  boundaryBefore: AssembledToken["boundaryBefore"],
): AssembledToken {
  return {
    id,
    jp,
    romaji,
    kind,
    boundaryBefore,
    source: { domain: "test", referenceId: id },
  };
}

function japanese(tokens: readonly Pick<AssembledToken, "jp">[]): string {
  return tokens.map((item) => item.jp).join("");
}

const watashiWa = Object.freeze([
  token("subject-watashi", "わたし", "watashi", "lexical", "attach"),
  token("particle-wa", "は", "wa", "particle", "space"),
]);

const konoMiseWa = Object.freeze([
  token("determiner-kono", "この", "kono", "lexical", "attach"),
  token("subject-mise", "みせ", "mise", "lexical", "space"),
  token("particle-wa-mise", "は", "wa", "particle", "space"),
]);

const soraWa = Object.freeze([
  token("subject-sora", "そら", "sora", "lexical", "attach"),
  token("particle-wa-sora", "は", "wa", "particle", "space"),
]);

const miseWa = Object.freeze([
  token("topic-mise", "みせ", "mise", "lexical", "attach"),
  token("particle-wa-na", "は", "wa", "particle", "space"),
]);

describe("composeBaseTokenSequences", () => {
  it("rebases a standalone verb form after a formatted prefix", () => {
    const form = realizePoliteNonpast("verb-kaku");
    expect(form.ok).toBe(true);
    if (!form.ok) return;
    expect(formatRomaji(form.value)).toMatchObject({ ok: true, text: "kakimasu" });

    const composed = composeBasePredicateTokens(watashiWa, form.value);

    expect(composed.ok).toBe(true);
    if (!composed.ok) return;
    expect(formatRomaji(composed.value)).toMatchObject({
      ok: true,
      text: "watashi wa kakimasu",
    });
    expect(japanese(composed.value)).toBe("わたしはかきます");
    expect(form.value[0].boundaryBefore).toBe("attach");
    expect(watashiWa[0].boundaryBefore).toBe("attach");
  });

  it("composes i-adjective, noun, and na-adjective predicate forms after prefixes", () => {
    const iAdjective = realizeIAdjectivePredicate("adjective-takai");
    const noun = realizeNounPredicate({
      id: "noun-gakusei-composed",
      kana: "がくせい",
      romaji: "gakusei",
    });
    const naAdjective = realizeNaAdjectivePredicate("adjective-shizuka");

    expect(iAdjective.ok).toBe(true);
    expect(noun.ok).toBe(true);
    expect(naAdjective.ok).toBe(true);
    if (!iAdjective.ok || !noun.ok || !naAdjective.ok) return;
    expect(formatRomaji(iAdjective.value.affirmative.tokens)).toMatchObject({
      ok: true,
      text: "takai desu",
    });

    const iComposed = composeBasePredicateTokens(
      konoMiseWa,
      iAdjective.value.affirmative.tokens,
    );
    const nounComposed = composeBasePredicateTokens(
      soraWa,
      noun.value.affirmative.tokens,
    );
    const naComposed = composeBasePredicateTokens(
      miseWa,
      naAdjective.value.affirmative.tokens,
    );

    expect(iComposed.ok && formatRomaji(iComposed.value)).toMatchObject({
      ok: true,
      text: "kono mise wa takai desu",
    });
    expect(nounComposed.ok && formatRomaji(nounComposed.value)).toMatchObject({
      ok: true,
      text: "sora wa gakusei desu",
    });
    expect(naComposed.ok && formatRomaji(naComposed.value)).toMatchObject({
      ok: true,
      text: "mise wa shizuka desu",
    });
  });

  it("deep-freezes cloned composed tokens and leaves source arrays unchanged", () => {
    const form = realizePoliteNonpast("verb-kaku");
    expect(form.ok).toBe(true);
    if (!form.ok) return;
    const originalFormFirst = form.value[0];
    const originalPrefixFirst = watashiWa[0];

    const composed = composeBasePredicateTokens(watashiWa, form.value);

    expect(composed.ok).toBe(true);
    if (!composed.ok) return;
    expect(Object.isFrozen(composed.value)).toBe(true);
    expect(Object.isFrozen(composed.value[0])).toBe(true);
    expect(Object.isFrozen(composed.value[0].source)).toBe(true);
    expect(composed.value[0]).not.toBe(originalPrefixFirst);
    expect(composed.value[2]).not.toBe(originalFormFirst);
    expect(composed.value[2].source).not.toBe(originalFormFirst.source);
    expect(composed.value[2].boundaryBefore).toBe("space");
    expect(originalFormFirst.boundaryBefore).toBe("attach");
    expect(watashiWa[0]).toBe(originalPrefixFirst);
    expect(form.value[0]).toBe(originalFormFirst);
    expect(() => {
      (composed.value[2].source as { referenceId: string }).referenceId = "mutated";
    }).toThrow(TypeError);
  });

  it("fails closed for empty and invalid segments", () => {
    expect(composeBaseTokenSequences([])).toEqual({
      ok: false,
      error: { code: "empty-sequence" },
    });
    expect(composeBaseTokenSequences([{ tokens: [] }])).toEqual({
      ok: false,
      error: { code: "empty-sequence", partIndex: 0 },
    });
    expect(
      composeBaseTokenSequences([
        {
          tokens: [
            token("bad-start", "だめ", "dame", "lexical", "space"),
          ],
        },
      ]),
    ).toMatchObject({
      ok: false,
      error: { code: "invalid-segment", partIndex: 0 },
    });
  });

  it("fails closed when the composed sequence is not formatRomaji-valid", () => {
    const duplicatePrefix = [
      token("shared-id", "それ", "sore", "lexical", "attach"),
    ];
    const duplicatePredicate = [
      token("shared-id", "です", "desu", "morpheme", "attach"),
    ];

    expect(
      composeBasePredicateTokens(duplicatePrefix, duplicatePredicate),
    ).toMatchObject({
      ok: false,
      error: { code: "invalid-composed-sequence" },
    });
  });
});
