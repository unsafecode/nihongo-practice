import { describe, expect, it } from "vitest";
import { A2_KANJI_ENTRIES } from "../a2/kanji/a2KanjiCatalog";
import { A2_KANJI_MEANINGS } from "../a2/kanji/kanjiMeanings";
import { en as enCopy } from "./en";
import { it as itCopy } from "./it";

/**
 * The A2 contextual-kanji semantic gloss must be reachable through the real
 * runtime i18n copy (Phase 3 Task 8 spec-fix, ISSUE 2): `copy.kanjiMeanings`
 * resolves each catalog `meaningCopyId` to a localized, non-empty,
 * Japanese-free string in both locales, with exact key parity and no orphan
 * keys — so the lesson page renders a real meaning, not a dangling id.
 */

const JAPANESE = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uff66-\uff9f]/;

describe("A2 kanji gloss runtime copy (ISSUE 2)", () => {
  it("resolves a non-empty, Japanese-free gloss for every catalog meaningCopyId in EN and IT", () => {
    for (const entry of A2_KANJI_ENTRIES) {
      for (const [label, copy] of [["en", enCopy], ["it", itCopy]] as const) {
        const gloss = copy.kanjiMeanings[entry.meaningCopyId];
        expect(gloss, `missing ${label} gloss for ${entry.glyph} (${entry.meaningCopyId})`).toBeTruthy();
        expect(gloss.trim().length).toBeGreaterThan(0);
        expect(JAPANESE.test(gloss), `Japanese in ${label} gloss: ${gloss}`).toBe(false);
      }
    }
  });

  it("declares identical kanjiMeanings keys in both locales, all 120", () => {
    expect(Object.keys(itCopy.kanjiMeanings).sort()).toEqual(
      Object.keys(enCopy.kanjiMeanings).sort(),
    );
    expect(Object.keys(enCopy.kanjiMeanings)).toHaveLength(120);
  });

  it("has no gloss keys beyond the catalog's own meaningCopyIds (no orphans)", () => {
    const known = new Set(A2_KANJI_ENTRIES.map((e) => e.meaningCopyId));
    for (const key of Object.keys(enCopy.kanjiMeanings)) {
      expect(known.has(key), `orphan gloss key ${key}`).toBe(true);
    }
  });

  it("carries the exact authored EN/IT gloss values through to runtime copy", () => {
    // A spot check that the runtime copy is the authored data, not a stub.
    expect(enCopy.kanjiMeanings["a2-kanji-hanasu-meaning"]).toBe(
      A2_KANJI_MEANINGS["a2-kanji-hanasu-meaning"].en,
    );
    expect(itCopy.kanjiMeanings["a2-kanji-hanasu-meaning"]).toBe(
      A2_KANJI_MEANINGS["a2-kanji-hanasu-meaning"].it,
    );
  });
});
