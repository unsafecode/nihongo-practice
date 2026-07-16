import { describe, expect, it } from "vitest";
import { normalizeTranscript } from "./normalizeTranscript";

/**
 * Pure transcript normalization contract (design spec §12.3, Slice D plan Task 1
 * step 1). Normalization preserves the learner's `original` string for display
 * and derives only a `comparable` form, applying, in order: NFKC, Latin
 * lowercasing, Japanese whitespace removal, declared sentence-punctuation
 * removal, and katakana-to-hiragana folding. It never removes particles,
 * collapses long-vowel distinctions, or rewrites tense/polarity.
 */

describe("normalizeTranscript", () => {
  it("preserves the original transcript and folds the plan reference example", () => {
    const result = normalizeTranscript("  コーヒー、を　のみます。 ");
    expect(result).toEqual({
      original: "  コーヒー、を　のみます。 ",
      comparable: "こーひーをのみます",
    });
  });

  it("applies Unicode NFKC (half-width katakana and full-width forms)", () => {
    // Half-width katakana "ｺｰﾋｰ" composes to full-width then folds to hiragana.
    expect(normalizeTranscript("ｺｰﾋｰ").comparable).toBe("こーひー");
    // Full-width digits/letters compose to their canonical ASCII forms.
    expect(normalizeTranscript("１２３").comparable).toBe("123");
  });

  it("lowercases Latin recognition output", () => {
    expect(normalizeTranscript("Coffee").comparable).toBe("coffee");
    expect(normalizeTranscript("ＡＢＣ").comparable).toBe("abc");
  });

  it("removes surrounding and inter-token Japanese whitespace", () => {
    expect(normalizeTranscript("  わたし は がくせい です  ").comparable).toBe(
      "わたしはがくせいです",
    );
    // Full-width ideographic space (U+3000) and tabs are also removed.
    expect(normalizeTranscript("みず　を\tのみます").comparable).toBe(
      "みずをのみます",
    );
  });

  it("removes only declared sentence punctuation", () => {
    expect(normalizeTranscript("これは、コーヒーですか？").comparable).toBe(
      "これはこーひーですか",
    );
    expect(normalizeTranscript("はい。").comparable).toBe("はい");
  });

  it("preserves the long-vowel mark, which is not sentence punctuation", () => {
    // The prolonged-sound mark ー must survive so long vowels stay distinct.
    expect(normalizeTranscript("はし").comparable).not.toBe(
      normalizeTranscript("はーし").comparable,
    );
    expect(normalizeTranscript("バス").comparable).toBe("ばす");
    expect(normalizeTranscript("ミルク").comparable).toBe("みるく");
  });

  it("folds katakana to hiragana for comparison", () => {
    expect(normalizeTranscript("イタリア").comparable).toBe("いたりあ");
    expect(normalizeTranscript("タクシー").comparable).toBe("たくしー");
  });

  it("never removes particles", () => {
    const comparable = normalizeTranscript("わたしはにほんへいきます").comparable;
    expect(comparable).toContain("は");
    expect(comparable).toContain("へ");
  });

  it("never collapses tense or polarity distinctions", () => {
    expect(normalizeTranscript("いきます").comparable).not.toBe(
      normalizeTranscript("いきません").comparable,
    );
    expect(normalizeTranscript("しました").comparable).not.toBe(
      normalizeTranscript("します").comparable,
    );
  });

  it("is idempotent on an already-normalized string", () => {
    const once = normalizeTranscript("こーひーをのみます").comparable;
    expect(normalizeTranscript(once).comparable).toBe(once);
  });
});
