import { describe, expect, it } from "vitest";

import {
  a1CanonicalLearningTargetSenses,
  a1CanonicalSemanticValues,
  a1SemanticValues,
} from "../catalog/a1SemanticCatalog";
import {
  a1LexemeById,
  a1LexemeByValueId,
  a1Lexemes,
  defineA1Lexeme,
} from "./lexicon";

function lexicalSurface(valueId: string): { readonly kana: string; readonly romaji: string } {
  const value = a1CanonicalSemanticValues.find((candidate) => candidate.id === valueId);
  if (!value) {
    throw new Error(`Missing semantic value "${valueId}".`);
  }

  return {
    kana: value.tokenFragments.map((fragment) => fragment.jp).join(""),
    romaji: value.tokenFragments.map((fragment) => fragment.romaji).join(" "),
  };
}

describe("A1 canonical lexicon", () => {
  it("opens with the required learner-facing entries", () => {
    expect(a1LexemeById["a1-lexeme-watashi"]).toMatchObject({
      id: "a1-lexeme-watashi",
      valueIds: ["a1-value-watashi"],
      kana: "わたし",
      romaji: "watashi",
      category: "pronoun",
      meaning: { en: "I; me", it: "io; me" },
    });
    expect(a1LexemeById["a1-lexeme-gakusei"]).toMatchObject({
      id: "a1-lexeme-gakusei",
      valueIds: ["a1-value-obj-student", "a1-value-student-subject"],
      kana: "がくせい",
      romaji: "gakusei",
      category: "person",
      meaning: { en: "student", it: "studente; studentessa" },
    });
    expect(a1LexemeById["a1-lexeme-taberu"]).toMatchObject({
      id: "a1-lexeme-taberu",
      valueIds: expect.arrayContaining(["a1-value-eat"]),
      kana: "たべる",
      romaji: "taberu",
      category: "verb",
      meaning: { en: "to eat", it: "mangiare" },
      verb: {
        dictionary: { kana: "たべる", romaji: "taberu" },
        polite: { kana: "たべます", romaji: "tabemasu" },
        class: "ichidan",
      },
    });
  });

  it("provides canonical hotel and photo lexemes that own their semantic values", () => {
    expect(a1LexemeById["a1-lexeme-hoteru"]).toMatchObject({
      id: "a1-lexeme-hoteru",
      valueIds: ["a1-value-loc-hotel"],
      kana: "ホテル",
      romaji: "hoteru",
      category: "noun",
      meaning: { en: "hotel", it: "hotel; albergo" },
    });

    expect(a1LexemeById["a1-lexeme-shashin"]).toMatchObject({
      id: "a1-lexeme-shashin",
      valueIds: ["a1-value-obj-photo"],
      kana: "しゃしん",
      romaji: "shashin",
      category: "noun",
      meaning: { en: "photo; photograph", it: "foto; fotografia" },
    });
    expect(a1LexemeByValueId["a1-value-loc-hotel"]).toBe(
      a1LexemeById["a1-lexeme-hoteru"],
    );
    expect(a1LexemeByValueId["a1-value-obj-photo"]).toBe(
      a1LexemeById["a1-lexeme-shashin"],
    );
  });

  it("includes the published Foundations lexemes with accurate forms and ownership", () => {
    expect(a1LexemeById["a1-lexeme-namae"]).toMatchObject({
      valueIds: ["a1-value-obj-name", "a1-value-name-subject"],
      kana: "なまえ",
      romaji: "namae",
      category: "noun",
      meaning: { en: "name", it: "nome" },
    });
    expect(a1LexemeById["a1-lexeme-anata"]).toMatchObject({
      valueIds: ["a1-value-anata"],
      kana: "あなた",
      romaji: "anata",
      category: "pronoun",
      meaning: { en: "you", it: "tu; lei" },
    });
    expect(a1LexemeById["a1-lexeme-doukyuusei"]).toMatchObject({
      valueIds: ["a1-value-obj-classmate-peer"],
      kana: "どうきゅうせい",
      romaji: "doukyuusei",
      category: "person",
      meaning: { en: "classmate; peer", it: "compagno/a di corso" },
    });
    expect(a1LexemeById["a1-lexeme-furansujin"]).toMatchObject({
      valueIds: ["a1-value-obj-french-person"],
      kana: "フランスじん",
      romaji: "furansujin",
      category: "person",
      meaning: { en: "French person", it: "francese" },
    });
    expect(a1LexemeById["a1-lexeme-yasumu"]).toMatchObject({
      valueIds: ["a1-value-rest-bare", "a1-value-rest-routine"],
      kana: "やすむ",
      romaji: "yasumu",
      category: "verb",
      meaning: { en: "to rest; take a break", it: "riposarsi; fare una pausa" },
      verb: {
        dictionary: { kana: "やすむ", romaji: "yasumu" },
        polite: { kana: "やすみます", romaji: "yasumimasu" },
        class: "godan",
      },
    });
    expect(a1LexemeById["a1-lexeme-kinou"]).toMatchObject({
      valueIds: ["a1-value-time-yesterday"],
      kana: "きのう",
      romaji: "kinou",
      category: "time",
      meaning: { en: "yesterday", it: "ieri" },
    });
    expect(a1LexemeById["a1-lexeme-ashita"]).toMatchObject({
      valueIds: ["a1-value-time-tomorrow"],
      kana: "あした",
      romaji: "ashita",
      category: "time",
      meaning: { en: "tomorrow", it: "domani" },
    });
  });

  it("keeps the new rest values tied to distinct bare and time-anchored frames", () => {
    const sensesById = Object.fromEntries(
      a1CanonicalLearningTargetSenses.map((sense) => [sense.id, sense]),
    );

    expect(sensesById["a1-sense-rest-bare"]).toMatchObject({
      lexemeId: "a1-lexeme-yasumu",
      semanticFrameId: "a1-frame-rest-bare",
      argumentRoles: ["agent"],
      argumentParticleByRole: {},
    });
    expect(sensesById["a1-sense-rest-routine"]).toMatchObject({
      lexemeId: "a1-lexeme-yasumu",
      semanticFrameId: "a1-frame-rest-routine",
      argumentRoles: ["agent", "time"],
      argumentParticleByRole: {},
    });
  });

  it("keeps the expanded bare and routine senses on their shared published lexemes", () => {
    const sensesById = Object.fromEntries(
      a1CanonicalLearningTargetSenses.map((sense) => [sense.id, sense]),
    );

    expect(sensesById["a1-sense-study-bare"]?.lexemeId).toBe(
      "a1-lexeme-benkyou-suru",
    );
    expect(sensesById["a1-sense-study-routine"]?.lexemeId).toBe(
      "a1-lexeme-benkyou-suru",
    );
    expect(sensesById["a1-sense-rest-routine"]?.lexemeId).toBe(
      "a1-lexeme-yasumu",
    );
    expect(sensesById["a1-sense-return-bare"]?.lexemeId).toBe(
      "a1-lexeme-kaeru",
    );
  });

  it("gives every entry nonempty learner-facing fields and a unique id", () => {
    const ids = new Set<string>();

    for (const lexeme of a1Lexemes) {
      expect(lexeme.id.length).toBeGreaterThan(0);
      expect(ids.has(lexeme.id)).toBe(false);
      ids.add(lexeme.id);
      expect(lexeme.kana.length).toBeGreaterThan(0);
      expect(lexeme.romaji.length).toBeGreaterThan(0);
      expect(lexeme.category.length).toBeGreaterThan(0);
      expect(lexeme.meaning.en.length).toBeGreaterThan(0);
      expect(lexeme.meaning.it.length).toBeGreaterThan(0);
      expect(lexeme.valueIds.length).toBeGreaterThan(0);
    }
  });

  it("owns each semantic value once and exposes frozen identity-preserving indexes", () => {
    const ownerByValueId = new Map<string, (typeof a1Lexemes)[number]>();

    for (const lexeme of a1Lexemes) {
      for (const valueId of lexeme.valueIds) {
        expect(ownerByValueId.has(valueId)).toBe(false);
        ownerByValueId.set(valueId, lexeme);
        expect(a1LexemeByValueId[valueId]).toBe(lexeme);
      }
      expect(a1LexemeById[lexeme.id]).toBe(lexeme);
      expect(Object.isFrozen(lexeme)).toBe(true);
      expect(Object.isFrozen(lexeme.valueIds)).toBe(true);
      expect(Object.isFrozen(lexeme.meaning)).toBe(true);
      if (lexeme.verb) {
        expect(Object.isFrozen(lexeme.verb)).toBe(true);
        expect(Object.isFrozen(lexeme.verb.dictionary)).toBe(true);
        expect(Object.isFrozen(lexeme.verb.polite)).toBe(true);
      }
    }

    expect(Object.isFrozen(a1Lexemes)).toBe(true);
    expect(Object.isFrozen(a1LexemeById)).toBe(true);
    expect(Object.isFrozen(a1LexemeByValueId)).toBe(true);
    expect(() => {
      // @ts-expect-error The public index is readonly.
      a1LexemeById["a1-lexeme-other"] = a1Lexemes[0];
    }).toThrow();
  });

  it("maps every published lexical semantic value", () => {
    const semanticValueIds = new Set(a1SemanticValues.map((value) => value.id));
    const lexicalValueIds = a1SemanticValues
      .filter((value) => value.tokenFragments.some((fragment) => fragment.kind === "lexical"))
      .map((value) => value.id);

    expect(lexicalValueIds.filter((valueId) => !a1LexemeByValueId[valueId])).toEqual([]);
    expect(
      a1Lexemes.flatMap((lexeme) => lexeme.valueIds).filter((valueId) => !semanticValueIds.has(valueId)),
    ).toEqual([]);
    expect(a1LexemeByValueId["a1-value-rest-routine"]).toBe(
      a1LexemeById["a1-lexeme-yasumu"],
    );
  });

  it("keeps each lexeme form structurally aligned with its semantic fragments", () => {
    for (const lexeme of a1Lexemes) {
      for (const valueId of lexeme.valueIds) {
        const surface = lexicalSurface(valueId);
        if (surface.kana === "" && surface.romaji === "") {
          expect(lexeme.id).toBe("a1-lexeme-desu");
          continue;
        }
        if (lexeme.category === "verb") {
          expect(lexeme.verb?.polite.kana.slice(0, -"ます".length)).toBe(surface.kana);
          expect(lexeme.verb?.polite.romaji.replace(/ /g, "").slice(0, -"masu".length)).toBe(
            surface.romaji.replace(/ /g, ""),
          );
        } else if (lexeme.category === "adjective") {
          expect([surface.kana, `${surface.kana}い`]).toContain(lexeme.kana);
          expect([surface.romaji, `${surface.romaji}i`]).toContain(lexeme.romaji);
        } else {
          expect(lexeme.kana).toBe(surface.kana);
          expect(lexeme.romaji).toBe(surface.romaji);
        }
      }
    }
  });

  it.each([
    [
      "a1-value-obj-brazilian-person",
      "a1-lexeme-burazirujin",
      "ブラジルじん",
      "burajirujin",
    ],
    ["a1-value-q-pass", "a1-lexeme-passu", "パス", "pasu"],
    [
      "a1-value-transport-scooter",
      "a1-lexeme-sukutaa",
      "スクーター",
      "sukuutaa",
    ],
  ] as const)(
    "uses the established Hepburn doubled-vowel romaji for %s",
    (valueId, lexemeId, kana, romaji) => {
      expect(lexicalSurface(valueId)).toEqual({ kana, romaji });
      expect(a1LexemeById[lexemeId]).toMatchObject({ kana, romaji });
    },
  );

  it("gives every verb dictionary and polite forms with a valid class", () => {
    for (const lexeme of a1Lexemes.filter(({ category }) => category === "verb")) {
      expect(lexeme.verb?.dictionary.kana.length).toBeGreaterThan(0);
      expect(lexeme.verb?.dictionary.romaji.length).toBeGreaterThan(0);
      expect(lexeme.verb?.polite.kana.endsWith("ます")).toBe(true);
      expect(lexeme.verb?.polite.romaji.endsWith("masu")).toBe(true);
      expect(["godan", "ichidan", "irregular"]).toContain(lexeme.verb?.class);
    }
  });

  it("rejects invalid entries rather than normalizing them", () => {
    expect(() =>
      defineA1Lexeme({
        id: "invalid",
        valueIds: ["a1-value-watashi", "a1-value-watashi"],
        kana: "わたし",
        romaji: "watashi",
        category: "noun",
        meaning: { en: "I", it: "io" },
      }),
    ).toThrow(/duplicate/i);
    expect(() =>
      defineA1Lexeme({
        id: "invalid-verb",
        valueIds: ["a1-value-eat"],
        kana: "たべる",
        romaji: "taberu",
        category: "verb",
        meaning: { en: "to eat", it: "mangiare" },
      }),
    ).toThrow(/verb/i);
    expect(() =>
      defineA1Lexeme({
        id: "invalid-noun",
        valueIds: ["a1-value-watashi"],
        kana: "わたし",
        romaji: "watashi",
        category: "noun",
        meaning: { en: "I", it: "io" },
        verb: {
          dictionary: { kana: "わたし", romaji: "watashi" },
          polite: { kana: "わたします", romaji: "watashimasu" },
          class: "ichidan",
        },
      }),
    ).toThrow(/non-verb/i);
  });
});
