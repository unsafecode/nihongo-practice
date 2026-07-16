import type { NormalizedTranscript } from "./types";

/**
 * Pure transcript normalization (design spec §12.3, Slice D plan Task 1). The
 * learner's `original` string is preserved for display; only the `comparable`
 * form is transformed, applying, in this exact order:
 *
 *   1. Unicode NFKC normalization;
 *   2. lowercasing of Latin letters (exceptional recognition output);
 *   3. removal of surrounding and inter-token whitespace (never semantically
 *      meaningful in Japanese);
 *   4. removal of declared sentence punctuation only;
 *   5. katakana-to-hiragana folding for comparison.
 *
 * It MUST NOT remove particles, collapse long-vowel distinctions (the prolonged
 * sound mark ー is preserved, not stripped), rewrite tense/polarity, or guess
 * undeclared synonyms. Catalog-declared orthographic variants are applied later,
 * during evaluation, never here.
 */

/**
 * The only punctuation normalization removes: sentence delimiters and paired
 * brackets that carry no lexical content in a spoken beginner target. The
 * prolonged sound mark ー, the middle dot as a lexical separator, particles, and
 * every kana are intentionally absent so they are never stripped.
 */
const SENTENCE_PUNCTUATION = new Set([
  // Japanese sentence punctuation.
  "\u3002", // 。 ideographic full stop
  "\u3001", // 、 ideographic comma
  "\uFF0C", // ， full-width comma
  "\uFF0E", // ． full-width full stop
  "\uFF01", // ！ full-width exclamation mark
  "\uFF1F", // ？ full-width question mark
  "\u2026", // … horizontal ellipsis
  "\u300C", // 「 left corner bracket
  "\u300D", // 」 right corner bracket
  "\u300E", // 『 left white corner bracket
  "\u300F", // 』 right white corner bracket
  "\uFF08", // （ full-width left parenthesis
  "\uFF09", // ） full-width right parenthesis
  // ASCII sentence punctuation that exceptional recognition output may include.
  ".",
  ",",
  "!",
  "?",
  ";",
  ":",
  "(",
  ")",
]);

const KATAKANA_START = 0x30a1;
const KATAKANA_END = 0x30f6;
const KANA_OFFSET = 0x60;

/** Fold every full katakana code point to its hiragana counterpart. */
function foldKatakanaToHiragana(input: string): string {
  let folded = "";
  for (const character of input) {
    const codePoint = character.codePointAt(0) ?? 0;
    folded +=
      codePoint >= KATAKANA_START && codePoint <= KATAKANA_END
        ? String.fromCodePoint(codePoint - KANA_OFFSET)
        : character;
  }
  return folded;
}

function removeSentencePunctuation(input: string): string {
  let stripped = "";
  for (const character of input) {
    if (!SENTENCE_PUNCTUATION.has(character)) stripped += character;
  }
  return stripped;
}

/**
 * Normalize a raw recognized transcript into `{ original, comparable }`. The
 * function is pure and deterministic.
 */
export function normalizeTranscript(input: string): NormalizedTranscript {
  const nfkc = input.normalize("NFKC");
  const lowercased = nfkc.toLowerCase();
  const withoutWhitespace = lowercased.replace(/\s+/gu, "");
  const withoutPunctuation = removeSentencePunctuation(withoutWhitespace);
  const comparable = foldKatakanaToHiragana(withoutPunctuation);
  return { original: input, comparable };
}
