import { describe, expect, it } from "vitest";
import { formatRomaji } from "../../../romaji/formatRomaji";
import {
  realizeIAdjectivePredicate,
  realizeNaAdjectiveAttributive,
  realizeNaAdjectivePredicate,
  realizeNounPredicate,
  validateBasePredicate,
} from "./adjectiveForms";
import { BASE_LEXEME_BY_ID, BASE_LEXICON } from "../catalog/lexicon";

function japanese(tokens: readonly { readonly jp: string }[]): string {
  return tokens.map((token) => token.jp).join("");
}

function expectFormatted(
  tokens: readonly import("../../../romaji/types").AssembledToken[],
  expected: string,
): void {
  expect(formatRomaji(tokens)).toMatchObject({ ok: true, text: expected });
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
      expectFormatted(result.value.affirmative.tokens, "gakusei desu");
      expectFormatted(result.value.negative.tokens, "gakusei dewa arimasen");
      expectFormatted(result.value.pastAffirmative.tokens, "gakusei deshita");
      expectFormatted(
        result.value.pastNegative.tokens,
        "gakusei dewa arimasen deshita",
      );
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
      expectFormatted(result.value.affirmative.tokens, "takai desu");
      expectFormatted(result.value.negative.tokens, "takakunai desu");
      expectFormatted(result.value.pastAffirmative.tokens, "takakatta desu");
      expectFormatted(result.value.pastNegative.tokens, "takakunakatta desu");
    }
  });

  it("deep-freezes generated adjective token sources without leaking across grid cells", () => {
    const result = realizeIAdjectivePredicate("adjective-takai");

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const token = result.value.negative.tokens[0];
    const sharedToken = result.value.pastAffirmative.tokens[0];
    expect(Object.isFrozen(result.value)).toBe(true);
    expect(Object.isFrozen(result.value.negative)).toBe(true);
    expect(Object.isFrozen(result.value.negative.tokens)).toBe(true);
    expect(Object.isFrozen(token)).toBe(true);
    expect(Object.isFrozen(token.source)).toBe(true);
    expect(() => {
      (token.source as { referenceId: string }).referenceId = "mutated-source";
    }).toThrow(TypeError);
    expect(token.source.referenceId).toBe("adjective-takai");
    expect(sharedToken.source.referenceId).toBe("adjective-takai");
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
    if (modifier.ok && predicate.ok) {
      expect(japanese(predicate.value.affirmative.tokens)).toBe("しずかです");
      expect(predicate.value.affirmative.desuFunction).toBe("copula");
      expectFormatted(modifier.value, "shizuka na");
      expectFormatted(predicate.value.affirmative.tokens, "shizuka desu");
    }
  });

  it("passes every adjective and copula cell through formatRomaji", () => {
    const noun = realizeNounPredicate({
      id: "noun-student",
      kana: "がくせい",
      romaji: "gakusei",
    });
    expect(noun.ok).toBe(true);
    if (noun.ok) {
      for (const cell of Object.values(noun.value)) {
        expect(formatRomaji(cell.tokens)).toMatchObject({ ok: true });
      }
    }

    for (const lexeme of BASE_LEXICON) {
      if (lexeme.category !== "adjective") continue;
      if (lexeme.adjectiveClass === "i") {
        const grid = realizeIAdjectivePredicate(lexeme.id);
        expect(grid.ok).toBe(true);
        if (grid.ok) {
          for (const cell of Object.values(grid.value)) {
            expect(formatRomaji(cell.tokens)).toMatchObject({ ok: true });
          }
        }
      } else {
        const grid = realizeNaAdjectivePredicate(lexeme.id);
        const modifier = realizeNaAdjectiveAttributive(lexeme.id);
        expect(grid.ok).toBe(true);
        expect(modifier.ok).toBe(true);
        if (grid.ok) {
          for (const cell of Object.values(grid.value)) {
            expect(formatRomaji(cell.tokens)).toMatchObject({ ok: true });
          }
        }
        if (modifier.ok) expect(formatRomaji(modifier.value)).toMatchObject({ ok: true });
      }
    }
  });

  it("rejects i-adjective plus da from its canonical lexeme class, not spelling", () => {
    expect(
      validateBasePredicate({
        predicateKind: "i-adjective",
        lexemeId: "adjective-takai",
        form: "affirmative",
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
        form: "affirmative",
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
      ["adjective-genki", "げんきだ"],
    ] as const) {
      expect(
        validateBasePredicate({
          predicateKind: "na-adjective",
          lexemeId,
          position: "predicate",
          form: "plainAffirmative",
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
        surface: "しずか",
      }),
    ).toMatchObject({ ok: false, error: { code: "na-adjective-missing-na" } });
    expect(
      validateBasePredicate({
        predicateKind: "na-adjective",
        lexemeId: "adjective-shizuka",
        position: "predicate",
        form: "affirmative",
        copula: "none",
        surface: "しずか",
      }),
    ).toMatchObject({ ok: false, error: { code: "na-adjective-missing-copula" } });
  });

  it("binds adjective metadata to the canonical selected form and visible surface", () => {
    expect(
      validateBasePredicate({
        predicateKind: "i-adjective",
        lexemeId: "adjective-takai",
        form: "affirmative",
        ending: "desu",
        surface: "たかいです",
      } as never),
    ).toEqual({ ok: true });
    expect(
      validateBasePredicate({
        predicateKind: "i-adjective",
        lexemeId: "adjective-takai",
        form: "affirmative",
        ending: "desu",
        surface: "たかいだ",
      } as never),
    ).toEqual({
      ok: false,
      error: { code: "i-adjective-copula-da", lexemeId: "adjective-takai" },
    });
    expect(
      validateBasePredicate({
        predicateKind: "i-adjective",
        lexemeId: "adjective-takai",
        form: "affirmative",
        ending: "desu",
        surface: "高いだ",
      } as never),
    ).toEqual({
      ok: false,
      error: { code: "i-adjective-copula-da", lexemeId: "adjective-takai" },
    });
    expect(
      validateBasePredicate({
        predicateKind: "i-adjective",
        lexemeId: "adjective-takai",
        form: "negative",
        ending: "desu",
        surface: "たかいです",
      } as never),
    ).toEqual({
      ok: false,
      error: { code: "surface-form-mismatch", lexemeId: "adjective-takai" },
    });
    expect(
      validateBasePredicate({
        predicateKind: "na-adjective",
        lexemeId: "adjective-shizuka",
        position: "attributive",
        hasNa: true,
        surface: "しずか",
      } as never),
    ).toEqual({
      ok: false,
      error: { code: "na-adjective-missing-na", lexemeId: "adjective-shizuka" },
    });
    expect(
      validateBasePredicate({
        predicateKind: "na-adjective",
        lexemeId: "adjective-shizuka",
        position: "attributive",
        hasNa: true,
        surface: "しずかな",
      } as never),
    ).toEqual({ ok: true });
    expect(
      validateBasePredicate({
        predicateKind: "na-adjective",
        lexemeId: "adjective-shizuka",
        position: "predicate",
        form: "affirmative",
        copula: "desu",
        surface: "しずか",
      } as never),
    ).toEqual({
      ok: false,
      error: {
        code: "na-adjective-missing-copula",
        lexemeId: "adjective-shizuka",
      },
    });
    expect(
      validateBasePredicate({
        predicateKind: "na-adjective",
        lexemeId: "adjective-kirei",
        position: "predicate",
        form: "plainAffirmative",
        copula: "da",
        surface: "きれいだ",
      } as never),
    ).toEqual({ ok: true });
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
        form: "affirmative",
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
        form: "affirmative",
        ending: "none",
        surface: "missing",
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
