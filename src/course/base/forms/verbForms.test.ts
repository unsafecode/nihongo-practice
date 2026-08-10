import { describe, expect, it } from "vitest";
import { formatRomaji } from "../../../romaji/formatRomaji";
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

function rawRomaji(tokens: readonly { readonly romaji: string }[]): string {
  return tokens.map((token) => token.romaji).join("");
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
        boundaryBefore: "attach",
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

  it.each([
    ["verb-kaku", "かき", "kaki", "かいて", "kaite"],
    ["verb-oyogu", "およぎ", "oyogi", "およいで", "oyoide"],
    ["verb-hanasu", "はなし", "hanashi", "はなして", "hanashite"],
    ["verb-matsu", "まち", "machi", "まって", "matte"],
    ["verb-shinu", "しに", "shini", "しんで", "shinde"],
    ["verb-asobu", "あそび", "asobi", "あそんで", "asonde"],
    ["verb-nomu", "のみ", "nomi", "のんで", "nonde"],
    ["verb-kau", "かい", "kai", "かって", "katte"],
    ["verb-kaeru", "かえり", "kaeri", "かえって", "kaette"],
    ["verb-taberu", "たべ", "tabe", "たべて", "tabete"],
  ])(
    "derives full romaji endings for %s",
    (lemmaId, expectedStem, expectedStemRomaji, expectedTe, expectedTeRomaji) => {
      const stem = realizePoliteStem(lemmaId);
      const te = realizeTeConstruction(lemmaId, "te");

      expect(stem.ok && japanese(stem.value)).toBe(expectedStem);
      expect(stem.ok && rawRomaji(stem.value)).toBe(expectedStemRomaji);
      expect(te.ok && japanese(te.value)).toBe(expectedTe);
      expect(te.ok && rawRomaji(te.value)).toBe(expectedTeRomaji);
    },
  );

  it("preserves a compound prefix when deriving suru and kuru forms", () => {
    const benkyouStem = realizePoliteStem("verb-benkyou-suru");
    const benkyouTe = realizeTeConstruction("verb-benkyou-suru", "te");
    const motteStem = realizePoliteStem("verb-motte-kuru");
    const motteTe = realizeTeConstruction("verb-motte-kuru", "te");

    expect(benkyouStem.ok && japanese(benkyouStem.value)).toBe("べんきょうし");
    expect(benkyouStem.ok && rawRomaji(benkyouStem.value)).toBe("benkyou shi");
    expect(benkyouTe.ok && japanese(benkyouTe.value)).toBe("べんきょうして");
    expect(benkyouTe.ok && rawRomaji(benkyouTe.value)).toBe("benkyou shite");
    expect(motteStem.ok && japanese(motteStem.value)).toBe("もってき");
    expect(motteStem.ok && rawRomaji(motteStem.value)).toBe("motte ki");
    expect(motteTe.ok && japanese(motteTe.value)).toBe("もってきて");
    expect(motteTe.ok && rawRomaji(motteTe.value)).toBe("motte kite");
  });

  it.each([
    ["verb-kaku", "かき", "kaki", "かいて", "kaite"],
    ["verb-oyogu", "およぎ", "oyogi", "およいで", "oyoide"],
    ["verb-hanasu", "はなし", "hanashi", "はなして", "hanashite"],
    ["verb-matsu", "まち", "machi", "まって", "matte"],
    ["verb-shinu", "しに", "shini", "しんで", "shinde"],
    ["verb-asobu", "あそび", "asobi", "あそんで", "asonde"],
    ["verb-nomu", "のみ", "nomi", "のんで", "nonde"],
    ["verb-kau", "かい", "kai", "かって", "katte"],
    ["verb-kaeru", "かえり", "kaeri", "かえって", "kaette"],
    ["verb-taberu", "たべ", "tabe", "たべて", "tabete"],
  ])(
    "formats every polite-grid, te, request, and te-imasu sequence for %s",
    (lemmaId, stemKana, stemRomaji, teKana, teRomaji) => {
      const grid = realizePoliteGrid(lemmaId);
      const te = realizeTeConstruction(lemmaId, "te");
      const request = realizeTeConstruction(lemmaId, "request");
      const ongoing = realizeTeConstruction(lemmaId, "te-imasu");

      expect(grid.ok).toBe(true);
      expect(te.ok).toBe(true);
      expect(request.ok).toBe(true);
      expect(ongoing.ok).toBe(true);
      if (!grid.ok || !te.ok || !request.ok || !ongoing.ok) return;

      for (const [tokens, expectedJapanese, expectedRomaji] of [
        [grid.value.affirmative, `${stemKana}ます`, `${stemRomaji}masu`],
        [grid.value.negative, `${stemKana}ません`, `${stemRomaji}masen`],
        [grid.value.pastAffirmative, `${stemKana}ました`, `${stemRomaji}mashita`],
        [
          grid.value.pastNegative,
          `${stemKana}ませんでした`,
          `${stemRomaji}masen deshita`,
        ],
        [te.value, teKana, teRomaji],
        [request.value, `${teKana}ください`, `${teRomaji} kudasai`],
        [ongoing.value, `${teKana}います`, `${teRomaji} imasu`],
      ] as const) {
        expect(japanese(tokens)).toBe(expectedJapanese);
        expect(formatRomaji(tokens)).toMatchObject({ ok: true, text: expectedRomaji });
      }
    },
  );

  it("passes every published verb realization through formatRomaji", () => {
    for (const lexeme of BASE_LEXICON) {
      if (lexeme.category !== "verb") continue;
      const dictionary = realizeVerbDictionary(lexeme.id);
      const stem = realizePoliteStem(lexeme.id);
      const polite = realizePoliteNonpast(lexeme.id);
      const grid = realizePoliteGrid(lexeme.id);
      const constructions = (["te", "request", "sequence", "te-imasu"] as const).map(
        (construction) => realizeTeConstruction(lexeme.id, construction),
      );

      expect(dictionary.ok).toBe(true);
      expect(stem.ok).toBe(true);
      expect(polite.ok).toBe(true);
      expect(grid.ok).toBe(true);
      for (const construction of constructions) expect(construction.ok).toBe(true);
      if (!dictionary.ok || !stem.ok || !polite.ok || !grid.ok) continue;

      const sequences = [
        dictionary.value,
        stem.value,
        polite.value,
        grid.value.affirmative,
        grid.value.negative,
        grid.value.pastAffirmative,
        grid.value.pastNegative,
        ...constructions.flatMap((construction) =>
          construction.ok ? [construction.value] : [],
        ),
      ];
      for (const tokens of sequences) {
        expect(formatRomaji(tokens)).toMatchObject({ ok: true });
      }
    }
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
