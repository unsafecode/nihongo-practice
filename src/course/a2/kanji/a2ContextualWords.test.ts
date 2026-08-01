/**
 * C8 — contextual kanji reading correctness.
 *
 * Every kanji row declares the reading that glyph takes *inside its
 * contextual word*. That claim is only checkable once the word exists, so
 * this test is the reason A2_CONTEXTUAL_WORDS exists at all.
 *
 * Japanese compounds alter a component's reading predictably, so the check
 * tolerates exactly three documented alternations and nothing else:
 *   rendaku   the k/s/t/h rows voicing — かきくけこ→がぎぐげご, さしすせそ→ざじずぜぞ,
 *             たちつてと→だぢづでど, はひふへほ→ばびぶべぼ
 *   handakuon はひふへほ→ぱぴぷぺぽ
 *   sokuon    a final つ/ち/く/き becoming っ
 *
 * Never widen these tolerances to make a row pass. A word that needs a fourth
 * alternation is the wrong word for that glyph.
 */
import { describe, expect, it } from "vitest";

import { A2_KANJI_ROWS } from "./a2KanjiCatalog";
import { A2_CONTEXTUAL_WORDS } from "./a2ContextualWords";

const RENDAKU: Readonly<Record<string, readonly string[]>> = {
  か: ["が"], き: ["ぎ"], く: ["ぐ"], け: ["げ"], こ: ["ご"],
  さ: ["ざ"], し: ["じ"], す: ["ず"], せ: ["ぜ"], そ: ["ぞ"],
  た: ["だ"], ち: ["ぢ"], つ: ["づ"], て: ["で"], と: ["ど"],
  は: ["ば", "ぱ"], ひ: ["び", "ぴ"], ふ: ["ぶ", "ぷ"], へ: ["べ", "ぺ"], ほ: ["ぼ", "ぽ"],
};

/** Every reading `kana` may legitimately surface as inside a compound. */
function allowedSurfaces(kana: string): readonly string[] {
  const surfaces = new Set<string>([kana]);
  const head = kana[0];
  for (const voiced of RENDAKU[head] ?? []) surfaces.add(`${voiced}${kana.slice(1)}`);
  if (/[つちくき]$/.test(kana)) {
    for (const surface of [...surfaces]) surfaces.add(`${surface.slice(0, -1)}っ`);
  }
  return [...surfaces];
}

describe("C8 — contextual kanji readings", () => {
  it("gives every kanji sense a contextual word", () => {
    const missing = [...new Set(A2_KANJI_ROWS.map((row) => row.sense))]
      .filter((sense) => A2_CONTEXTUAL_WORDS[sense] === undefined)
      .sort();
    expect(missing).toEqual([]);
  });

  it("writes every word's kana with only kana", () => {
    const offenders = Object.entries(A2_CONTEXTUAL_WORDS)
      .filter(([, entry]) => /[\u4e00-\u9fff]/.test(entry.wordKana))
      .map(([sense]) => sense)
      .sort();
    expect(offenders).toEqual([]);
  });

  it("contains each glyph's declared reading inside its own contextual word", () => {
    const offenders = A2_KANJI_ROWS.filter((row) => {
      const entry = A2_CONTEXTUAL_WORDS[row.sense];
      if (!entry) return false;
      return !allowedSurfaces(row.kana).some((surface) => entry.wordKana.includes(surface));
    }).map((row) => `${row.glyph} (${row.sense}): reading ${row.kana} not in ${A2_CONTEXTUAL_WORDS[row.sense]!.wordKana}`);
    expect(offenders).toEqual([]);
  });

  it("writes the glyph itself into the word whenever the word is written in kanji", () => {
    const offenders = A2_KANJI_ROWS.filter((row) => {
      const entry = A2_CONTEXTUAL_WORDS[row.sense];
      if (!entry) return false;
      return /[\u4e00-\u9fff]/.test(entry.word) && !entry.word.includes(row.glyph);
    }).map((row) => `${row.glyph} (${row.sense}) missing from ${A2_CONTEXTUAL_WORDS[row.sense]!.word}`);
    expect(offenders).toEqual([]);
  });

  /**
   * The assessed stage renders the whole 交ぜ書き word, so every kana in it is
   * legible to the learner. That is safe only while a word's kana spells some
   * *other* glyph's reading — never the reading being assessed. The convention
   * delivers this today, but conventions are not gates: without this test a
   * future word could hand the learner the answer and leave every gate green.
   */
  it("never spells the assessed glyph's own reading in the kana around it", () => {
    const offenders = A2_KANJI_ROWS.filter((row) => {
      const entry = A2_CONTEXTUAL_WORDS[row.sense];
      if (!entry) return false;
      const kanaContext = entry.word.split(row.glyph).join("");
      return allowedSurfaces(row.kana).some((surface) => kanaContext.includes(surface));
    }).map((row) => `${row.glyph} (${row.sense}): reading ${row.kana} is legible in ${A2_CONTEXTUAL_WORDS[row.sense]!.word}`);
    expect(offenders).toEqual([]);
  });
});
