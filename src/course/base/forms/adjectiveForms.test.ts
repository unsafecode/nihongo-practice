import { describe, expect, it } from "vitest";
import {
  realizeIAdjectivePredicate,
  realizeNaAdjectiveAttributive,
  realizeNaAdjectivePredicate,
  realizeNounPredicate,
  validateBasePredicate,
} from "./adjectiveForms";
import { BASE_LEXEME_BY_ID } from "../catalog/lexicon";

function japanese(tokens: readonly { readonly jp: string }[]): string {
  return tokens.map((token) => token.jp).join("");
}

describe("Base adjective and copula forms", () => {
  it("realizes noun predicates through the polite copula grid", () => {
    const result = realizeNounPredicate({
      id: "noun-student",
      kana: "がくせい",
      romaji: "gakusei",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(japanese(result.value.affirmative.tokens)).toBe("がくせいです");
      expect(japanese(result.value.negative.tokens)).toBe("がくせいではありません");
      expect(japanese(result.value.pastAffirmative.tokens)).toBe("がくせいでした");
      expect(japanese(result.value.pastNegative.tokens)).toBe("がくせいではありませんでした");
      expect(result.value.affirmative.desuFunction).toBe("copula");
      expect(Object.isFrozen(result.value)).toBe(true);
    }
  });

  it("realizes an i adjective's own four cells with a politeness marker", () => {
    const result = realizeIAdjectivePredicate("adjective-takai");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(japanese(result.value.affirmative.tokens)).toBe("たかいです");
      expect(japanese(result.value.negative.tokens)).toBe("たかくないです");
      expect(japanese(result.value.pastAffirmative.tokens)).toBe("たかかったです");
      expect(japanese(result.value.pastNegative.tokens)).toBe("たかくなかったです");
      expect(result.value.affirmative.desuFunction).toBe("politeness-marker");
    }
  });

  it("uses the irregular いい form source for every non-affirmative cell", () => {
    const result = realizeIAdjectivePredicate("adjective-ii");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(japanese(result.value.affirmative.tokens)).toBe("いいです");
      expect(japanese(result.value.negative.tokens)).toBe("よくないです");
      expect(japanese(result.value.pastAffirmative.tokens)).toBe("よかったです");
      expect(japanese(result.value.pastNegative.tokens)).toBe("よくなかったです");
    }
  });

  it("separates na-adjective attribution from its predicate copula cells", () => {
    const modifier = realizeNaAdjectiveAttributive("adjective-shizuka");
    const predicate = realizeNaAdjectivePredicate("adjective-shizuka");

    expect(modifier.ok && japanese(modifier.value)).toBe("しずかな");
    expect(predicate.ok).toBe(true);
    if (predicate.ok) {
      expect(japanese(predicate.value.affirmative.tokens)).toBe("しずかです");
      expect(predicate.value.affirmative.desuFunction).toBe("copula");
    }
  });

  it("rejects i-adjective plus da from its canonical lexeme class, not spelling", () => {
    expect(
      validateBasePredicate({
        predicateKind: "i-adjective",
        lexemeId: "adjective-takai",
        ending: "da",
        surface: "たかいだ",
      }),
    ).toEqual({
      ok: false,
      error: { code: "i-adjective-copula-da", lexemeId: "adjective-takai" },
    });
    expect(
      validateBasePredicate({
        predicateKind: "i-adjective",
        lexemeId: "adjective-takai",
        ending: "da",
        surface: "高いだ",
      }),
    ).toEqual({
      ok: false,
      error: { code: "i-adjective-copula-da", lexemeId: "adjective-takai" },
    });
    expect(BASE_LEXEME_BY_ID.get("adjective-kirei")).toMatchObject({
      category: "adjective",
      adjectiveClass: "na",
      firstTeachLessonId: "copula-adjectives-4",
    });
    for (const [lexemeId, surface] of [
      ["adjective-kirei", "きれいだ"],
      ["adjective-yuumei", "ゆうめいだ"],
      ["adjective-kirai", "きらいだ"],
    ] as const) {
      expect(
        validateBasePredicate({
          predicateKind: "na-adjective",
          lexemeId,
          position: "predicate",
          copula: "da",
          surface,
        }),
      ).toEqual({ ok: true });
    }
  });

  it("rejects a na modifier without な and a na predicate without its copula", () => {
    expect(
      validateBasePredicate({
        predicateKind: "na-adjective",
        lexemeId: "adjective-shizuka",
        position: "attributive",
        hasNa: false,
      }),
    ).toMatchObject({ ok: false, error: { code: "na-adjective-missing-na" } });
    expect(
      validateBasePredicate({
        predicateKind: "na-adjective",
        lexemeId: "adjective-shizuka",
        position: "predicate",
        copula: "none",
      }),
    ).toMatchObject({ ok: false, error: { code: "na-adjective-missing-copula" } });
  });

  it("returns structured errors when an adjective API receives a non-adjective", () => {
    expect(realizeIAdjectivePredicate("verb-kaku")).toMatchObject({
      ok: false,
      error: { code: "not-an-i-adjective", lexemeId: "verb-kaku" },
    });
    expect(
      validateBasePredicate({
        predicateKind: "i-adjective",
        lexemeId: "verb-kaku",
        ending: "none",
        surface: "かく",
      }),
    ).toEqual({
      ok: false,
      error: { code: "not-an-adjective", lexemeId: "verb-kaku" },
    });
    expect(
      validateBasePredicate({
        predicateKind: "i-adjective",
        lexemeId: "missing-adjective",
        ending: "none",
      }),
    ).toEqual({
      ok: false,
      error: { code: "unknown-lexeme", lexemeId: "missing-adjective" },
    });
  });

  it("does not expose a string overload that guesses an adjective class", () => {
    // @ts-expect-error surfaces alone cannot classify adjective morphology
    validateBasePredicate("たかいだ");
  });
});
