import { describe, expect, it } from "vitest";
import { A2_KANJI_ENTRIES } from "./a2KanjiCatalog";
import { A2_KANJI_MEANINGS } from "./kanjiMeanings";

/**
 * The authored bilingual semantic gloss for every contextual kanji (Phase 3
 * Task 8 spec-fix, ISSUE 2). Each of the 120 catalog entries carries a
 * `meaningCopyId`; this data must provide a real, non-empty EN + IT gloss for
 * every one of them — with exact key parity, no Japanese in any value, and
 * shared-lexeme glyphs kept independently meaningful — so the A2 lesson page
 * can render a real meaning next to each glyph instead of a dangling copy id.
 */

// Any CJK / kana character — gloss values are EN/IT UI text only, never
// Japanese (mirrors the prebuild no-Japanese gate).
const JAPANESE = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uff66-\uff9f]/;

describe("A2 kanji semantic meanings (Phase 3 Task 8 spec-fix, ISSUE 2)", () => {
  it("provides a bilingual gloss for every one of the 120 kanji entries' meaningCopyId", () => {
    expect(A2_KANJI_ENTRIES).toHaveLength(120);
    for (const entry of A2_KANJI_ENTRIES) {
      const gloss = A2_KANJI_MEANINGS[entry.meaningCopyId];
      expect(gloss, `missing gloss for ${entry.glyph} (${entry.meaningCopyId})`).toBeDefined();
      expect(gloss.en.trim().length).toBeGreaterThan(0);
      expect(gloss.it.trim().length).toBeGreaterThan(0);
    }
  });

  it("has no meanings beyond the catalog's own meaningCopyIds (exact parity, no orphans)", () => {
    const known = new Set(A2_KANJI_ENTRIES.map((e) => e.meaningCopyId));
    expect(Object.keys(A2_KANJI_MEANINGS).sort()).toEqual([...known].sort());
  });

  it("declares exactly 120 unique meaningCopyId keys (1:1 with the entries)", () => {
    expect(Object.keys(A2_KANJI_MEANINGS)).toHaveLength(120);
  });

  it("contains no Japanese characters in any gloss value (EN/IT UI copy only)", () => {
    for (const gloss of Object.values(A2_KANJI_MEANINGS)) {
      expect(JAPANESE.test(gloss.en), `Japanese in EN: ${gloss.en}`).toBe(false);
      expect(JAPANESE.test(gloss.it), `Japanese in IT: ${gloss.it}`).toBe(false);
    }
  });

  it("gives shared-lexeme glyphs (名/前, both in 名前) independent, distinct glosses", () => {
    const na = A2_KANJI_ENTRIES.find((e) => e.glyph === "名")!;
    const mae = A2_KANJI_ENTRIES.find((e) => e.glyph === "前")!;
    const naGloss = A2_KANJI_MEANINGS[na.meaningCopyId];
    const maeGloss = A2_KANJI_MEANINGS[mae.meaningCopyId];
    expect(naGloss.en).not.toBe(maeGloss.en);
    expect(naGloss.it).not.toBe(maeGloss.it);
  });

  it("gives homophone glyphs sharing a reading (止/泊, both と) distinct glosses too", () => {
    const stop = A2_KANJI_ENTRIES.find((e) => e.glyph === "止")!;
    const stay = A2_KANJI_ENTRIES.find((e) => e.glyph === "泊")!;
    expect(A2_KANJI_MEANINGS[stop.meaningCopyId].en).not.toBe(
      A2_KANJI_MEANINGS[stay.meaningCopyId].en,
    );
  });
});
