/**
 * Answer normalization for the deterministic exercise engine (design spec
 * §10.2, §12.3 and Slice C plan Task 1). Normalization may only remove
 * differences that are *not* assessed — surrounding/among-kana whitespace,
 * compatibility code points, and permitted Japanese punctuation variants. It
 * MUST NOT erase a particle, tense, polarity, or script distinction the lesson
 * assesses, and it never performs fuzzy or pronunciation-based scoring.
 *
 * Katakana→hiragana folding is opt-in per definition: script identity is a real
 * assessed distinction, so it is only collapsed when a definition explicitly
 * permits it (e.g. accepting a hiragana rendering of an assisted loanword).
 */

export interface NormalizeAnswerOptions {
  /** Fold katakana to hiragana. Only set when the definition permits it. */
  readonly katakanaToHiragana?: boolean;
}

const KATAKANA_START = 0x30a1;
const KATAKANA_END = 0x30f6;
const KANA_OFFSET = 0x60;

function foldKatakanaToHiragana(text: string): string {
  let out = "";
  for (const char of text) {
    const code = char.codePointAt(0) ?? 0;
    if (code >= KATAKANA_START && code <= KATAKANA_END) {
      out += String.fromCodePoint(code - KANA_OFFSET);
    } else {
      out += char;
    }
  }
  return out;
}

/**
 * Normalize a candidate or canonical answer for exact comparison. Deterministic
 * and pure: the same input and options always produce the same output.
 */
export function normalizeAnswer(
  input: string,
  options: NormalizeAnswerOptions = {},
): string {
  // 1. Unicode NFKC: fold half-width kana, full-width ASCII, compatibility forms.
  let text = input.normalize("NFKC");
  // 2. Trim and collapse whitespace. Japanese answers carry no spaces, so any
  //    whitespace (including the ideographic space NFKC turns into U+0020) is
  //    non-assessed noise and is removed rather than left to cause a mismatch.
  text = text.replace(/\s+/g, "");
  // 3. Normalize permitted Japanese punctuation variants to their canonical
  //    kana-block forms (after NFKC, full-width stops are already ASCII).
  text = text.replace(/[.]/g, "。").replace(/[,]/g, "、");
  // 4. Optional, explicitly-permitted katakana→hiragana folding.
  if (options.katakanaToHiragana) {
    text = foldKatakanaToHiragana(text);
  }
  return text;
}
