import { describe, expect, it } from "vitest";
import { concepts, conceptsById } from "./concepts";
import {
  lexicon,
  lexiconById,
  lexemesByIntroModule,
  verbLexemes,
} from "./lexicon";
import { genericPersonas, validateRuntimeAliases } from "../data/personas";
import type { LexemeCatalogEntry } from "./types";

/**
 * Design spec §6.1-§6.4 and §7 plus Slice B plan Task 2. The lexicon is the
 * Japanese source of truth. Coverage is proven from stable semantic IDs, never
 * by counting rendered strings, so these tests derive every count from data.
 */

const RELEASE_VOCABULARY_TARGET = 270;
const RELEASE_VERB_TARGET = 42;

/** First-introduction budget per module (spec §6.2 editorial plan). */
const INTRODUCTION_VOCABULARY_BUDGET = [
  20, 25, 20, 25, 25, 20, 25, 25, 25, 30, 30, 0,
] as const;

/** New verb lexemes per module (spec §6.2 editorial plan). */
const INTRODUCTION_VERB_BUDGET = [
  0, 4, 2, 8, 6, 3, 7, 3, 3, 3, 3, 0,
] as const;

/** The exact 42 semantic verb sense IDs (Slice B plan Task 2, spec §6.3). */
const REQUIRED_VERB_SENSE_IDS = [
  "eat",
  "drink",
  "go",
  "come",
  "return",
  "walk",
  "enter",
  "leave",
  "board",
  "alight",
  "watch",
  "listen",
  "ask",
  "speak",
  "read",
  "write",
  "call",
  "buy",
  "use",
  "carry",
  "take",
  "receive",
  "give",
  "borrow",
  "wait",
  "meet",
  "do",
  "sleep",
  "wake",
  "work",
  "study",
  "understand",
  "live",
  "exist-inanimate",
  "exist-animate",
  "stand",
  "sit",
  "learn",
  "teach-tell",
  "open",
  "close",
  "need",
] as const;

const ALLOWED_CATEGORIES = new Set([
  "verb",
  "noun",
  "adjective",
  "expression",
  "other",
]);
const ALLOWED_SCRIPTS = new Set(["hiragana", "katakana"]);

// Hiragana block, including small kana and voiced marks, plus the prolonged
// sound mark used in loanword readings.
const HIRAGANA = /^[\u3041-\u3096\u309d\u309e\u30fc]+$/;
const KATAKANA = /^[\u30a1-\u30fa\u30fc\u30fd\u30fe]+$/;
// CJK unified ideographs (kanji) must never appear in an answer source.
const KANJI = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/;

function moduleBudget<T>(
  groups: readonly (readonly T[])[],
  predicate: (item: T) => boolean,
): number[] {
  return groups.map((group) => group.filter(predicate).length);
}

describe("lexicon catalog counts", () => {
  it("declares exactly 270 unique learner-facing lexeme IDs", () => {
    expect(lexicon).toHaveLength(RELEASE_VOCABULARY_TARGET);
    expect(new Set(lexicon.map((entry) => entry.id)).size).toBe(
      RELEASE_VOCABULARY_TARGET,
    );
  });

  it("declares exactly 42 verb lexemes", () => {
    const verbs = lexicon.filter((entry) => entry.category === "verb");
    expect(verbs).toHaveLength(RELEASE_VERB_TARGET);
    expect(verbLexemes).toHaveLength(RELEASE_VERB_TARGET);
    expect(verbLexemes.every((entry) => entry.category === "verb")).toBe(true);
  });

  it("indexes every lexeme by its stable ID", () => {
    expect(lexiconById.size).toBe(RELEASE_VOCABULARY_TARGET);
    for (const entry of lexicon) {
      expect(lexiconById.get(entry.id)).toBe(entry);
    }
  });
});

describe("lexicon orthography and script policy", () => {
  it("gives every item nonempty kana Japanese and a hiragana reading", () => {
    for (const entry of lexicon) {
      expect(entry.japanese.length).toBeGreaterThan(0);
      expect(entry.reading.length).toBeGreaterThan(0);
      expect(entry.reading).toMatch(HIRAGANA);
    }
  });

  it("uses only allowed categories and scripts", () => {
    for (const entry of lexicon) {
      expect(ALLOWED_CATEGORIES.has(entry.category)).toBe(true);
      expect(ALLOWED_SCRIPTS.has(entry.script)).toBe(true);
    }
  });

  it("matches each item's Japanese form to its declared script", () => {
    for (const entry of lexicon) {
      if (entry.script === "hiragana") {
        expect(entry.japanese).toMatch(HIRAGANA);
      } else {
        expect(entry.japanese).toMatch(KATAKANA);
      }
    }
  });

  it("never uses kanji as the required Japanese answer source (spec §7)", () => {
    for (const entry of lexicon) {
      expect(entry.japanese).not.toMatch(KANJI);
      expect(entry.reading).not.toMatch(KANJI);
    }
  });

  it("assists every katakana loanword with a hiragana reading", () => {
    const katakana = lexicon.filter((entry) => entry.script === "katakana");
    expect(katakana.length).toBeGreaterThan(0);
    for (const entry of katakana) {
      expect(entry.reading).toMatch(HIRAGANA);
      expect(entry.reading).not.toBe(entry.japanese);
    }
  });
});

describe("required verb breadth (spec §6.3)", () => {
  it("includes exactly the required 42 verb sense IDs", () => {
    const verbIds = new Set(
      lexicon
        .filter((entry) => entry.category === "verb")
        .map((entry) => entry.id),
    );
    expect(verbIds.size).toBe(REQUIRED_VERB_SENSE_IDS.length);
    for (const id of REQUIRED_VERB_SENSE_IDS) {
      expect(lexiconById.has(id)).toBe(true);
      expect(lexiconById.get(id)?.category).toBe("verb");
      expect(verbIds.has(id)).toBe(true);
    }
  });
});

describe("machine-derived module introduction budget (spec §6.2)", () => {
  it("groups all 270 lexemes across exactly 12 first-introduction modules", () => {
    expect(lexemesByIntroModule).toHaveLength(12);
    const flattened = lexemesByIntroModule.flat();
    expect(flattened).toHaveLength(RELEASE_VOCABULARY_TARGET);
    expect(new Set(flattened.map((entry) => entry.id)).size).toBe(
      RELEASE_VOCABULARY_TARGET,
    );
    // The flattened grouping is exactly the exported flat lexicon.
    expect(flattened.map((entry) => entry.id)).toEqual(
      lexicon.map((entry) => entry.id),
    );
  });

  it("derives the vocabulary budget from group sizes", () => {
    const derived = lexemesByIntroModule.map((group) => group.length);
    expect(derived).toEqual([...INTRODUCTION_VOCABULARY_BUDGET]);
    const total = derived.reduce((sum, count) => sum + count, 0);
    expect(total).toBe(RELEASE_VOCABULARY_TARGET);
  });

  it("derives the verb budget from each group", () => {
    const derived = moduleBudget(
      lexemesByIntroModule,
      (entry: LexemeCatalogEntry) => entry.category === "verb",
    );
    expect(derived).toEqual([...INTRODUCTION_VERB_BUDGET]);
    const total = derived.reduce((sum, count) => sum + count, 0);
    expect(total).toBe(RELEASE_VERB_TARGET);
  });
});

describe("lexicon hygiene", () => {
  it("contains no forbidden personal aliases (spec §8.2)", () => {
    expect(validateRuntimeAliases(lexicon)).toEqual([]);
  });

  it("does not treat persona names as vocabulary (spec §6.1)", () => {
    const personaIds = new Set<string>(
      genericPersonas.map((persona) => persona.id),
    );
    const personaKana = new Set<string>(
      genericPersonas.map((persona) => persona.japaneseName),
    );
    for (const entry of lexicon) {
      expect(personaIds.has(entry.id)).toBe(false);
      expect(personaKana.has(entry.japanese)).toBe(false);
    }
  });
});

describe("concept catalog (spec §5.1/§6.4)", () => {
  it("declares unique concept IDs indexed for reference", () => {
    expect(new Set(concepts.map((entry) => entry.id)).size).toBe(
      concepts.length,
    );
    expect(conceptsById.size).toBe(concepts.length);
    for (const entry of concepts) {
      expect(conceptsById.get(entry.id)).toBe(entry);
    }
  });

  it("freezes each concept and both nested arrays", () => {
    for (const entry of concepts) {
      expect(Object.isFrozen(entry)).toBe(true);
      expect(Object.isFrozen(entry.prerequisiteIds)).toBe(true);
      expect(Object.isFrozen(entry.surfaceGears)).toBe(true);
    }
  });

  it("declares surface gears free of kanji", () => {
    for (const entry of concepts) {
      expect(Array.isArray(entry.surfaceGears)).toBe(true);
      for (const gear of entry.surfaceGears) {
        expect(gear).not.toMatch(KANJI);
      }
    }
  });

  it("references only prerequisites introduced earlier (acyclic order)", () => {
    const seen = new Set<string>();
    for (const entry of concepts) {
      for (const prerequisiteId of entry.prerequisiteIds) {
        // Prerequisite must already exist...
        expect(conceptsById.has(prerequisiteId)).toBe(true);
        // ...and must be introduced strictly earlier in stable order, which
        // guarantees the prerequisite graph is acyclic.
        expect(seen.has(prerequisiteId)).toBe(true);
        expect(prerequisiteId).not.toBe(entry.id);
      }
      seen.add(entry.id);
    }
  });

  it("rejects nested mutation so shared catalog state stays unchanged", () => {
    const concept = conceptsById.get("demonstratives");
    expect(concept).toBeDefined();
    if (!concept) return;

    const prerequisiteSnapshot = [...concept.prerequisiteIds];
    const surfaceGearSnapshot = [...concept.surfaceGears];

    expect(() => {
      (concept.prerequisiteIds as string[]).push("sentence-order");
    }).toThrow();
    expect(() => {
      (concept.surfaceGears as string[]).push("⚠️");
    }).toThrow();

    expect(conceptsById.get("demonstratives")?.prerequisiteIds).toEqual(
      prerequisiteSnapshot,
    );
    expect(conceptsById.get("demonstratives")?.surfaceGears).toEqual(
      surfaceGearSnapshot,
    );
  });

  it("covers the grammar families required by Slice B Task 2", () => {
    const required = [
      "sentence-order",
      "topic-wa",
      "object-o",
      "destination-ni",
      "location-de",
      "source-kara",
      "companion-to",
      "copula-desu",
      "question-ka",
      "demonstratives",
      "polite-masu",
      "time-expressions",
      "frequency-adverbs",
      "past-mashita",
      "negative-masen",
      "i-adjective",
      "na-adjective",
      "comparison",
      "counters",
      "request-kudasai",
      "existence-arimasu",
      "existence-imasu",
      "position-words",
      "needs",
    ];
    for (const id of required) {
      expect(conceptsById.has(id)).toBe(true);
    }
  });
});
