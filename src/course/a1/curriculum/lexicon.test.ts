import { describe, expect, it } from "vitest";

import { a1SemanticValues } from "../catalog/a1SemanticCatalog";
import {
  a1LexemeById,
  a1LexemeByValueId,
  a1Lexemes,
  defineA1Lexeme,
} from "./lexicon";

function lexicalSurface(valueId: string): { readonly kana: string; readonly romaji: string } {
  const value = a1SemanticValues.find((candidate) => candidate.id === valueId);
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
      valueIds: ["a1-value-obj-student"],
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

  it("maps every learner-visible lexical semantic value and no missing value id", () => {
    const semanticValueIds = new Set(a1SemanticValues.map((value) => value.id));
    const lexicalValueIds = a1SemanticValues
      .filter((value) => value.tokenFragments.some((fragment) => fragment.kind === "lexical"))
      .map((value) => value.id);

    expect(lexicalValueIds.filter((valueId) => !a1LexemeByValueId[valueId])).toEqual([]);
    expect(
      a1Lexemes.flatMap((lexeme) => lexeme.valueIds).filter((valueId) => !semanticValueIds.has(valueId)),
    ).toEqual([]);
  });

  it("keeps each lexeme form structurally aligned with its semantic fragments", () => {
    for (const lexeme of a1Lexemes) {
      for (const valueId of lexeme.valueIds) {
        const surface = lexicalSurface(valueId);
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
