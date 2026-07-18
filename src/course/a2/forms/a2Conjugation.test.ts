import { describe, expect, it } from "vitest";
import {
  A2_CONJUGATION_CLASSES,
  A2_VERBS,
  conjugate,
  conjugateClass,
  conjugateClassMasuStem,
  conjugateMasuStem,
  type A2ConjugationClass,
  type A2Fragment,
  type A2PlainForm,
} from "./a2Conjugation";

/**
 * The class-aware A2 plain-form conjugation engine (Phase 3 Task 2). This is
 * deliberately not the A1 `src/lab/engine/conjugate.ts` (polite-only, macron
 * romaji) — every assertion here proves plain dictionary/negative/past/
 * past-negative/te forms, fully concatenated and macron-free, with the
 * kanji root preserved and its kana reading correct, across every
 * conjugation class the 12 registered verbs require.
 */

type Row = Readonly<
  Record<A2PlainForm, readonly [jp: string, reading: string, romaji: string]>
>;

// Full expected paradigm for every required verb (dictionary/negative/past/past-negative/te).
const EXPECTED: Readonly<Record<string, Row>> = {
  "a2-sense-taberu": {
    // 食べる — ichidan
    dictionary: ["食べる", "たべる", "taberu"],
    negative: ["食べない", "たべない", "tabenai"],
    past: ["食べた", "たべた", "tabeta"],
    "past-negative": ["食べなかった", "たべなかった", "tabenakatta"],
    te: ["食べて", "たべて", "tabete"],
  },
  "a2-sense-hanasu": {
    // 話す — godan-su
    dictionary: ["話す", "はなす", "hanasu"],
    negative: ["話さない", "はなさない", "hanasanai"],
    past: ["話した", "はなした", "hanashita"],
    "past-negative": ["話さなかった", "はなさなかった", "hanasanakatta"],
    te: ["話して", "はなして", "hanashite"],
  },
  "a2-sense-kaku": {
    // 書く — godan-ku (i-onbin te/past いた/いて)
    dictionary: ["書く", "かく", "kaku"],
    negative: ["書かない", "かかない", "kakanai"],
    past: ["書いた", "かいた", "kaita"],
    "past-negative": ["書かなかった", "かかなかった", "kakanakatta"],
    te: ["書いて", "かいて", "kaite"],
  },
  "a2-sense-oyogu": {
    // 泳ぐ — godan-gu (voiced onbin いだ/いで)
    dictionary: ["泳ぐ", "およぐ", "oyogu"],
    negative: ["泳がない", "およがない", "oyoganai"],
    past: ["泳いだ", "およいだ", "oyoida"],
    "past-negative": ["泳がなかった", "およがなかった", "oyoganakatta"],
    te: ["泳いで", "およいで", "oyoide"],
  },
  "a2-sense-matsu": {
    // 待つ — godan-tsu (促音便 った/って)
    dictionary: ["待つ", "まつ", "matsu"],
    negative: ["待たない", "またない", "matanai"],
    past: ["待った", "まった", "matta"],
    "past-negative": ["待たなかった", "またなかった", "matanakatta"],
    te: ["待って", "まって", "matte"],
  },
  "a2-sense-shinu": {
    // 死ぬ — godan-nu (撥音便 んだ/んで)
    dictionary: ["死ぬ", "しぬ", "shinu"],
    negative: ["死なない", "しなない", "shinanai"],
    past: ["死んだ", "しんだ", "shinda"],
    "past-negative": ["死ななかった", "しななかった", "shinanakatta"],
    te: ["死んで", "しんで", "shinde"],
  },
  "a2-sense-asobu": {
    // 遊ぶ — godan-bu (撥音便 んだ/んで)
    dictionary: ["遊ぶ", "あそぶ", "asobu"],
    negative: ["遊ばない", "あそばない", "asobanai"],
    past: ["遊んだ", "あそんだ", "asonda"],
    "past-negative": ["遊ばなかった", "あそばなかった", "asobanakatta"],
    te: ["遊んで", "あそんで", "asonde"],
  },
  "a2-sense-yomu": {
    // 読む — godan-mu (撥音便 んだ/んで)
    dictionary: ["読む", "よむ", "yomu"],
    negative: ["読まない", "よまない", "yomanai"],
    past: ["読んだ", "よんだ", "yonda"],
    "past-negative": ["読まなかった", "よまなかった", "yomanakatta"],
    te: ["読んで", "よんで", "yonde"],
  },
  "a2-sense-kaeru": {
    // 帰る — godan-ru (促音便 った/って; NOT ichidan despite -eru)
    dictionary: ["帰る", "かえる", "kaeru"],
    negative: ["帰らない", "かえらない", "kaeranai"],
    past: ["帰った", "かえった", "kaetta"],
    "past-negative": ["帰らなかった", "かえらなかった", "kaeranakatta"],
    te: ["帰って", "かえって", "kaette"],
  },
  "a2-sense-iku": {
    // 行く — godan-ku with 行った/行って exception (NOT 行いた/行いて)
    dictionary: ["行く", "いく", "iku"],
    negative: ["行かない", "いかない", "ikanai"],
    past: ["行った", "いった", "itta"],
    "past-negative": ["行かなかった", "いかなかった", "ikanakatta"],
    te: ["行って", "いって", "itte"],
  },
  "a2-sense-suru": {
    // する — irregular
    dictionary: ["する", "する", "suru"],
    negative: ["しない", "しない", "shinai"],
    past: ["した", "した", "shita"],
    "past-negative": ["しなかった", "しなかった", "shinakatta"],
    te: ["して", "して", "shite"],
  },
  "a2-sense-kuru": {
    // 来る — irregular (root reading shifts く/こ/き)
    dictionary: ["来る", "くる", "kuru"],
    negative: ["来ない", "こない", "konai"],
    past: ["来た", "きた", "kita"],
    "past-negative": ["来なかった", "こなかった", "konakatta"],
    te: ["来て", "きて", "kite"],
  },
};

const FORMS: readonly A2PlainForm[] = [
  "dictionary",
  "negative",
  "past",
  "past-negative",
  "te",
];

const EXPECTED_CLASSES: Readonly<Record<string, A2ConjugationClass>> = {
  "a2-sense-taberu": "ichidan",
  "a2-sense-hanasu": "godan-su",
  "a2-sense-kaku": "godan-ku",
  "a2-sense-oyogu": "godan-gu",
  "a2-sense-matsu": "godan-tsu",
  "a2-sense-shinu": "godan-nu",
  "a2-sense-asobu": "godan-bu",
  "a2-sense-yomu": "godan-mu",
  "a2-sense-kaeru": "godan-ru",
  "a2-sense-iku": "godan-ku",
  "a2-sense-suru": "irregular-suru",
  "a2-sense-kuru": "irregular-kuru",
};

describe("a2 conjugation engine", () => {
  it("registers exactly the 12 required verbs", () => {
    expect(Object.keys(A2_VERBS).sort()).toEqual(Object.keys(EXPECTED).sort());
    expect(Object.keys(A2_VERBS)).toHaveLength(12);
  });

  it("assigns each verb its documented conjugation class", () => {
    for (const [senseId, expectedClass] of Object.entries(EXPECTED_CLASSES)) {
      expect(A2_VERBS[senseId].conjClass).toBe(expectedClass);
    }
  });

  for (const senseId of Object.keys(EXPECTED)) {
    for (const form of FORMS) {
      const [jp, reading, romaji] = EXPECTED[senseId][form];
      it(`${senseId} ${form} → ${jp} / ${reading} / ${romaji}`, () => {
        const r = conjugate(senseId, form);
        expect(r.ok).toBe(true);
        if (r.ok) {
          expect(r.result.jp).toBe(jp);
          expect(r.result.reading).toBe(reading);
          expect(r.result.romaji).toBe(romaji);
          expect(r.result.form).toBe(form);
        }
      });
    }
  }

  it("keeps the kanji glyph as the visible root while the reading carries kana (来る, irregular)", () => {
    const r = conjugate("a2-sense-kuru", "past"); // 来た, reading きた
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.result.fragments[0].jp).toBe("来");
      expect(r.result.fragments[0].reading).toBe("き");
      expect(r.result.fragments[0].kind).toBe("lexical");
    }
  });

  it("keeps the kanji glyph as the visible root while the reading carries kana (食べる, ichidan)", () => {
    const r = conjugate("a2-sense-taberu", "dictionary"); // 食べる, reading たべる
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.result.fragments[0].jp).toBe("食");
      expect(r.result.fragments[0].reading).toBe("た");
      expect(r.result.fragments[0].kind).toBe("lexical");
    }
  });

  it("scopes the 行く i-onbin exception to 行く only, not 書く (same godan-ku class)", () => {
    expect(A2_VERBS["a2-sense-iku"].conjClass).toBe("godan-ku");
    expect(A2_VERBS["a2-sense-iku"].tePastException).toBe("iku");
    expect(A2_VERBS["a2-sense-kaku"].tePastException).toBeUndefined();
  });

  it("rejects an unknown verb/sense id", () => {
    expect(conjugate("a2-sense-nope", "te")).toEqual({
      ok: false,
      error: "unknown-verb",
    });
    expect(conjugate("a2-sense-nope", "dictionary")).toEqual({
      ok: false,
      error: "unknown-verb",
    });
  });

  it("produces fully concatenated, macron-free romaji with no embedded spaces", () => {
    for (const senseId of Object.keys(EXPECTED)) {
      for (const form of FORMS) {
        const r = conjugate(senseId, form);
        expect(r.ok).toBe(true);
        if (r.ok) {
          expect(r.result.romaji).not.toMatch(/\s/);
          expect(r.result.romaji).not.toMatch(/[āīūēō]/);
        }
      }
    }
  });

  it("exposes every conjugation-class identity at runtime, including godan-u (unused by any registered verb)", () => {
    const expectedClassSet: readonly A2ConjugationClass[] = [
      "ichidan",
      "godan-u",
      "godan-ku",
      "godan-gu",
      "godan-su",
      "godan-tsu",
      "godan-nu",
      "godan-bu",
      "godan-mu",
      "godan-ru",
      "irregular-suru",
      "irregular-kuru",
    ];
    expect([...A2_CONJUGATION_CLASSES].sort()).toEqual([...expectedClassSet].sort());
    // No registered verb actually uses godan-u.
    expect(Object.values(A2_VERBS).some((v) => v.conjClass === "godan-u")).toBe(false);
    expect(A2_CONJUGATION_CLASSES).toContain("godan-u");
  });

  it("proves the godan-u okurigana table is correct via the pure per-class helper, without expanding A2_VERBS (買う kau, a synthetic stem)", () => {
    const kauStem: readonly A2Fragment[] = [
      { jp: "買", romaji: "ka", reading: "か", kind: "lexical", boundaryBefore: "attach" },
    ];
    const expectedKau: Row = {
      dictionary: ["買う", "かう", "kau"],
      negative: ["買わない", "かわない", "kawanai"],
      past: ["買った", "かった", "katta"],
      "past-negative": ["買わなかった", "かわなかった", "kawanakatta"],
      te: ["買って", "かって", "katte"],
    };
    for (const form of FORMS) {
      const [jp, reading, romaji] = expectedKau[form];
      const result = conjugateClass("godan-u", kauStem, form);
      expect(result.jp).toBe(jp);
      expect(result.reading).toBe(reading);
      expect(result.romaji).toBe(romaji);
    }
  });

  it("the pure per-class helper also reproduces every registered non-irregular verb's paradigm identically to conjugate()", () => {
    for (const senseId of Object.keys(EXPECTED)) {
      const verb = A2_VERBS[senseId];
      if (verb.conjClass === "irregular-suru" || verb.conjClass === "irregular-kuru") {
        continue;
      }
      for (const form of FORMS) {
        const viaConjugate = conjugate(senseId, form);
        const viaHelper = conjugateClass(verb.conjClass, verb.stem, form, verb.tePastException);
        expect(viaConjugate.ok).toBe(true);
        if (viaConjugate.ok) {
          expect(viaHelper).toEqual(viaConjugate.result);
        }
      }
    }
  });
});

/**
 * `conjugateMasuStem` (Phase 3/M6 spec-fix, finding "single-source verb
 * stems"). A separately named, pure operation — it does NOT extend the
 * five-value `A2PlainForm` union (ます-stem/renyoukei is not a plain form the
 * grammar-spiral suffix constructions attach to) — that derives the polite
 * ます-stem for all 12 registered verb senses, and — via the pure per-class
 * `conjugateMasuStem`'s helper, `conjugateClassMasuStem` — for every one of
 * the 12 conjugation classes (including `godan-u`, unused by any registered
 * sense). This is the single linguistic source of truth
 * `a2SemanticCatalog.ts` must derive 食べ/話し/行き (and every other
 * registered verb's ます-stem) from, instead of hand-typing a duplicate.
 */
type MasuStemRow = readonly [jp: string, reading: string, romaji: string];

// The exact ます-stem (renyoukei) for each of the 12 registered verb senses.
const EXPECTED_MASU_STEM: Readonly<Record<string, MasuStemRow>> = {
  "a2-sense-taberu": ["食べ", "たべ", "tabe"], // ichidan: stem IS the ます-stem, no extra okurigana
  "a2-sense-hanasu": ["話し", "はなし", "hanashi"], // godan-su: す→し
  "a2-sense-kaku": ["書き", "かき", "kaki"], // godan-ku: く→き
  "a2-sense-oyogu": ["泳ぎ", "およぎ", "oyogi"], // godan-gu: ぐ→ぎ
  "a2-sense-matsu": ["待ち", "まち", "machi"], // godan-tsu: つ→ち
  "a2-sense-shinu": ["死に", "しに", "shini"], // godan-nu: ぬ→に
  "a2-sense-asobu": ["遊び", "あそび", "asobi"], // godan-bu: ぶ→び
  "a2-sense-yomu": ["読み", "よみ", "yomi"], // godan-mu: む→み
  "a2-sense-kaeru": ["帰り", "かえり", "kaeri"], // godan-ru: る→り
  // 行く: the い-onbin exception is past/て only — the ます-stem is the
  // regular godan-ku formation 行き/iki, never an irregular い-onbin variant.
  "a2-sense-iku": ["行き", "いき", "iki"],
  "a2-sense-suru": ["し", "し", "shi"], // irregular: full word, no kanji root
  "a2-sense-kuru": ["来", "き", "ki"], // irregular: kanji root only, reading shifts to き
};

describe("conjugateMasuStem() — single-source ます-stem derivation", () => {
  it("registers a masu-stem for exactly the 12 registered verb senses (no more, no fewer)", () => {
    expect(Object.keys(EXPECTED_MASU_STEM).sort()).toEqual(Object.keys(A2_VERBS).sort());
  });

  for (const [senseId, [jp, reading, romaji]] of Object.entries(EXPECTED_MASU_STEM)) {
    it(`${senseId} ます-stem → ${jp} / ${reading} / ${romaji}`, () => {
      const r = conjugateMasuStem(senseId);
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.result.jp).toBe(jp);
        expect(r.result.reading).toBe(reading);
        expect(r.result.romaji).toBe(romaji);
      }
    });
  }

  it("keeps the kanji glyph as the visible root while the reading carries kana (来る, irregular ます-stem)", () => {
    const r = conjugateMasuStem("a2-sense-kuru");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.result.fragments[0].jp).toBe("来");
      expect(r.result.fragments[0].reading).toBe("き");
      expect(r.result.fragments[0].kind).toBe("lexical");
      expect(r.result.fragments).toHaveLength(1);
    }
  });

  it("keeps the kanji glyph as the visible root while the reading carries kana (食べる, ichidan ます-stem)", () => {
    const r = conjugateMasuStem("a2-sense-taberu");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.result.fragments[0].jp).toBe("食");
      expect(r.result.fragments[0].reading).toBe("た");
      expect(r.result.fragments[0].kind).toBe("lexical");
      // ichidan's masu-stem is the stem alone — no extra okurigana fragment.
      expect(r.result.fragments).toHaveLength(2);
    }
  });

  it("splits 話す/hanasu's ます-stem into its kanji-root and okurigana fragments (話+し), not one merged はなし fragment", () => {
    const r = conjugateMasuStem("a2-sense-hanasu");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.result.fragments).toEqual([
        { jp: "話", reading: "はな", romaji: "hana", kind: "lexical", boundaryBefore: "attach" },
        { jp: "し", romaji: "shi", kind: "morpheme", boundaryBefore: "attach" },
      ]);
    }
  });

  it("行く's ます-stem is unaffected by the い-onbin te/past exception (行き, not an irregular form)", () => {
    const r = conjugateMasuStem("a2-sense-iku");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.result.jp).toBe("行き");
      expect(r.result.romaji).toBe("iki");
    }
  });

  it("rejects an unknown verb/sense id", () => {
    expect(conjugateMasuStem("a2-sense-nope")).toEqual({
      ok: false,
      error: "unknown-verb",
    });
  });

  it("produces fully concatenated, macron-free romaji with no embedded spaces for every registered sense", () => {
    for (const senseId of Object.keys(EXPECTED_MASU_STEM)) {
      const r = conjugateMasuStem(senseId);
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.result.romaji).not.toMatch(/\s/);
        expect(r.result.romaji).not.toMatch(/[āīūēō]/);
      }
    }
  });

  it("proves the godan-u ます-stem okurigana is correct via the pure per-class helper, without expanding A2_VERBS (買う kau, a synthetic stem)", () => {
    const kauStem: readonly A2Fragment[] = [
      { jp: "買", romaji: "ka", reading: "か", kind: "lexical", boundaryBefore: "attach" },
    ];
    const result = conjugateClassMasuStem("godan-u", kauStem);
    expect(result.jp).toBe("買い");
    expect(result.reading).toBe("かい");
    expect(result.romaji).toBe("kai");
  });

  it("the pure per-class helper reproduces every registered non-irregular verb's ます-stem identically to conjugateMasuStem()", () => {
    for (const senseId of Object.keys(EXPECTED_MASU_STEM)) {
      const verb = A2_VERBS[senseId];
      if (verb.conjClass === "irregular-suru" || verb.conjClass === "irregular-kuru") {
        continue;
      }
      const viaFn = conjugateMasuStem(senseId);
      const viaHelper = conjugateClassMasuStem(verb.conjClass, verb.stem);
      expect(viaFn.ok).toBe(true);
      if (viaFn.ok) {
        expect(viaHelper).toEqual(viaFn.result);
      }
    }
  });

  it("two calls for the same sense are deep-equal but not identical, with no shared fragment objects (frozen, independently-owned outputs)", () => {
    const first = conjugateMasuStem("a2-sense-hanasu");
    const second = conjugateMasuStem("a2-sense-hanasu");
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (first.ok && second.ok) {
      expect(first.result).toEqual(second.result);
      expect(first.result).not.toBe(second.result);
      expect(first.result.fragments).not.toBe(second.result.fragments);
      expect(first.result.fragments.length).toBe(second.result.fragments.length);
      for (let i = 0; i < first.result.fragments.length; i += 1) {
        expect(first.result.fragments[i]).not.toBe(second.result.fragments[i]);
      }
      expect(Object.isFrozen(first.result)).toBe(true);
      expect(Object.isFrozen(first.result.fragments)).toBe(true);
      for (const fragment of first.result.fragments) {
        expect(Object.isFrozen(fragment)).toBe(true);
      }
    }
  });

  it("a mutation attempt on one masu-stem result cannot alter a later call or corrupt the shared A2_VERBS stem", () => {
    const first = conjugateMasuStem("a2-sense-taberu");
    expect(first.ok).toBe(true);
    if (first.ok) {
      const target = first.result.fragments[0] as unknown as Record<string, unknown>;
      const mutated = Reflect.set(target, "jp", "HACKED");
      expect(mutated).toBe(false);
      expect(first.result.fragments[0].jp).toBe("食");
    }
    expect(A2_VERBS["a2-sense-taberu"].stem[0].jp).toBe("食");

    const second = conjugateMasuStem("a2-sense-taberu");
    expect(second.ok).toBe(true);
    if (second.ok) {
      expect(second.result.jp).toBe("食べ");
    }
  });
});
