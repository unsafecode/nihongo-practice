import { describe, expect, it } from "vitest";
import { BASE_LEXEME_BY_ID, BASE_LEXICON } from "../catalog/lexicon";
import {
  realizePoliteGrid,
  realizePoliteNonpast,
  realizePoliteStem,
  realizeTeConstruction,
  realizeVerbDictionary,
} from "./verbForms";

function japanese(tokens: readonly { readonly jp: string }[]): string {
  return tokens.map((token) => token.jp).join("");
}

function expectForm(
  result: ReturnType<typeof realizePoliteStem>,
  expected: string,
): void {
  expect(result.ok).toBe(true);
  if (result.ok) expect(japanese(result.value)).toBe(expected);
}

describe("Base verb forms", () => {
  it("publishes deep-frozen lexemes through a mutation-proof lookup", () => {
    const mutable = BASE_LEXEME_BY_ID as unknown as {
      clear?: () => void;
      set?: (id: string, value: unknown) => void;
    };
    mutable.clear?.();
    mutable.set?.("invented", {});

    expect(Object.isFrozen(BASE_LEXICON)).toBe(true);
    const kaku = BASE_LEXEME_BY_ID.get("verb-kaku");
    expect(kaku?.category).toBe("verb");
    if (!kaku || kaku.category !== "verb") throw new Error("missing verb-kaku");
    expect(Object.isFrozen(kaku)).toBe(true);
    expect(Object.isFrozen(kaku.dictionaryTokens)).toBe(true);
    expect("clear" in BASE_LEXEME_BY_ID).toBe(false);
    expect(BASE_LEXEME_BY_ID.get("verb-kaku")).toBe(BASE_LEXICON[0]);
  });

  it.each([
    ["verb-kaku", "かき"],
    ["verb-oyogu", "およぎ"],
    ["verb-hanasu", "はなし"],
    ["verb-matsu", "まち"],
    ["verb-shinu", "しに"],
    ["verb-asobu", "あそび"],
    ["verb-nomu", "のみ"],
    ["verb-kau", "かい"],
    ["verb-kaeru", "かえり"],
    ["verb-taberu", "たべ"],
    ["verb-miru", "み"],
    ["verb-suru", "し"],
    ["verb-kuru", "き"],
  ])("realizes the polite stem for %s", (lemmaId, expected) => {
    expectForm(realizePoliteStem(lemmaId), expected);
  });

  it("uses explicit classes rather than an -eru spelling guess", () => {
    expectForm(realizePoliteStem("verb-kaeru"), "かえり");
    expectForm(realizePoliteStem("verb-taberu"), "たべ");
  });

  it("returns the dictionary and polite nonpast from canonical form sources", () => {
    const dictionary = realizeVerbDictionary("verb-kaku");
    const polite = realizePoliteNonpast("verb-kaku");

    expect(dictionary.ok && japanese(dictionary.value)).toBe("かく");
    expect(polite.ok && japanese(polite.value)).toBe("かきます");
    if (polite.ok) {
      expect(polite.value[0]).toMatchObject({
        kind: "lexical",
        boundaryBefore: "space",
        source: { domain: "catalog", referenceId: "verb-kaku" },
      });
      expect(polite.value[1]).toMatchObject({
        kind: "morpheme",
        boundaryBefore: "attach",
      });
    }
  });

  it("realizes all four polite tense and polarity cells", () => {
    const result = realizePoliteGrid("verb-taberu");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(japanese(result.value.affirmative)).toBe("たべます");
      expect(japanese(result.value.negative)).toBe("たべません");
      expect(japanese(result.value.pastAffirmative)).toBe("たべました");
      expect(japanese(result.value.pastNegative)).toBe("たべませんでした");
      expect(Object.isFrozen(result.value)).toBe(true);
      expect(Object.isFrozen(result.value.affirmative)).toBe(true);
    }
  });

  it.each([
    ["verb-kau", "かって"],
    ["verb-matsu", "まって"],
    ["verb-kaeru", "かえって"],
    ["verb-nomu", "のんで"],
    ["verb-asobu", "あそんで"],
    ["verb-shinu", "しんで"],
    ["verb-kaku", "かいて"],
    ["verb-oyogu", "およいで"],
    ["verb-hanasu", "はなして"],
    ["verb-taberu", "たべて"],
    ["verb-suru", "して"],
    ["verb-kuru", "きて"],
    ["verb-iku", "いって"],
  ])("realizes te allomorphy for %s", (lemmaId, expected) => {
    const result = realizeTeConstruction(lemmaId, "te");
    expect(result.ok && japanese(result.value)).toBe(expected);
  });

  it("builds requests and ongoing constructions from the same te form", () => {
    const request = realizeTeConstruction("verb-kaku", "request");
    const ongoing = realizeTeConstruction("verb-miru", "te-imasu");
    const sequence = realizeTeConstruction("verb-kau", "sequence");

    expect(request.ok && japanese(request.value)).toBe("かいてください");
    expect(ongoing.ok && japanese(ongoing.value)).toBe("みています");
    expect(sequence.ok && japanese(sequence.value)).toBe("かって");
    if (sequence.ok) {
      expect(sequence.value).toHaveLength(2);
      expect(sequence.value[1]).toMatchObject({
        source: { referenceId: "te-sequence" },
      });
    }
  });

  it("returns structured errors for unknown IDs and non-verbs", () => {
    expect(realizePoliteStem("missing-verb")).toMatchObject({
      ok: false,
      error: { code: "unknown-lexeme", lemmaId: "missing-verb" },
    });
    expect(realizePoliteStem("adjective-takai")).toMatchObject({
      ok: false,
      error: { code: "not-a-verb", lemmaId: "adjective-takai" },
    });
  });
});
