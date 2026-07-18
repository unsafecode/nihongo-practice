import { describe, expect, it } from "vitest";
import {
  A2_CONJUGATION_CLASSES,
  A2_VERBS,
  conjugate,
  conjugateClass,
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
