import { describe, expect, it } from "vitest";
import { courseModules } from "./course";
import { examples } from "./examples";
import { loanwords } from "./loanwords";
import { referencedExampleOrder } from "./validate";

/**
 * Runtime script-policy suite (design spec §7, §8.3). Every assertion inspects
 * the *real shipped* runtime examples so the hiragana-first / assisted-katakana
 * contract can never silently regress once the complete A0→A1 course is
 * assembled from the catalogs.
 *
 * Concept placement, capstone honesty, and reuse are proven on the shared
 * catalogs by `validateCurriculum` (spec §9.3); the runtime course carries no
 * concept ids, so those pedagogy gates live at the catalog layer, not here.
 */

describe("standard katakana with assisted reading (real data)", () => {
  const hiraganaForms = new Map<string, string>();
  const katakanaForms = new Map<string, string>();
  for (const loanword of Object.values(loanwords)) {
    hiraganaForms.set(loanword.hiragana, loanword.id);
    katakanaForms.set(loanword.katakana, loanword.hiragana);
  }

  it("no learner-visible referenced example spells a registered loanword in bare hiragana", () => {
    const violations: string[] = [];
    for (const exampleId of referencedExampleOrder(courseModules)) {
      const example = examples[exampleId];
      if (!example?.segments) continue;
      for (const segment of example.segments) {
        const jp = segment.jp.trim();
        if (hiraganaForms.has(jp)) violations.push(`${exampleId}:${jp}`);
      }
    }
    expect(violations).toEqual([]);
  });

  it("every referenced katakana loanword keeps its explicit hiragana reading", () => {
    const missing: string[] = [];
    for (const exampleId of referencedExampleOrder(courseModules)) {
      const example = examples[exampleId];
      if (!example?.segments) continue;
      for (const segment of example.segments) {
        const jp = segment.jp.trim();
        const expectedReading = katakanaForms.get(jp);
        if (expectedReading && segment.reading?.trim() !== expectedReading) {
          missing.push(`${exampleId}:${jp}`);
        }
      }
    }
    expect(missing).toEqual([]);
  });

  it("no assessed example requires kanji output: every segment is kana", () => {
    const kanaOrPunctuation = /^[\u3040-\u30ff\u30fc。、・\s]+$/;
    const violations: string[] = [];
    for (const example of Object.values(examples)) {
      for (const segment of example.segments ?? []) {
        if (!kanaOrPunctuation.test(segment.jp)) {
          violations.push(`${example.id}:${segment.jp}`);
        }
      }
    }
    expect(violations).toEqual([]);
  });
});
