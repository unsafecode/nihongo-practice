import { describe, it, expect } from "vitest";
import { stem } from "./conjugate";

describe("stem", () => {
  const cases: Array<[string, "ichidan" | "godan" | "irregular", string]> = [
    ["たべる", "ichidan", "たべ"],
    ["みる", "ichidan", "み"],
    ["のむ", "godan", "のみ"],
    ["かう", "godan", "かい"],
    ["いく", "godan", "いき"],
    ["かえる", "godan", "かえり"], // godan nonostante sembri ichidan
    ["のる", "godan", "のり"],
    ["まつ", "godan", "まち"],
    ["あう", "godan", "あい"],
    ["はなす", "godan", "はなし"],
    ["する", "irregular", "し"],
    ["くる", "irregular", "き"],
  ];
  it.each(cases)("%s (%s) -> %s", (dict, group, expected) => {
    expect(stem(dict, group)).toBe(expected);
  });
});

import { conjugate, type Form, type Verb } from "./conjugate";

const VERBS: Verb[] = [
  { dict: "たべる", group: "ichidan", stemRomaji: "tabe" },
  { dict: "のむ", group: "godan", stemRomaji: "nomi" },
  { dict: "かう", group: "godan", stemRomaji: "kai" },
  { dict: "みる", group: "ichidan", stemRomaji: "mi" },
  { dict: "いく", group: "godan", stemRomaji: "iki" },
  { dict: "かえる", group: "godan", stemRomaji: "kaeri" },
  { dict: "のる", group: "godan", stemRomaji: "nori" },
  { dict: "まつ", group: "godan", stemRomaji: "machi" },
  { dict: "あう", group: "godan", stemRomaji: "ai" },
  { dict: "する", group: "irregular", stemRomaji: "shi" },
  { dict: "くる", group: "irregular", stemRomaji: "ki" },
  { dict: "はなす", group: "godan", stemRomaji: "hanashi" },
];

// verità di riferimento per たべる (le altre seguono la stessa struttura)
describe("conjugate たべる", () => {
  const v = VERBS[0];
  const expect_: Record<Form, [string, string]> = {
    pres: ["たべます", "tabemasu"],
    past: ["たべました", "tabemashita"],
    neg: ["たべません", "tabemasen"],
    pastneg: ["たべませんでした", "tabemasen deshita"],
    vol: ["たべましょう", "tabemashō"],
    des: ["たべたいです", "tabetai desu"],
  };
  (Object.keys(expect_) as Form[]).forEach((f) => {
    it(f, () => {
      const r = conjugate(v, f);
      expect([r.jp, r.romaji]).toEqual(expect_[f]);
    });
  });
});

describe("conjugate — stem giapponese per tutti i verbi (forma pres)", () => {
  const expected: Record<string, string> = {
    たべる: "たべます", のむ: "のみます", かう: "かいます", みる: "みます",
    いく: "いきます", かえる: "かえります", のる: "のります", まつ: "まちます",
    あう: "あいます", する: "します", くる: "きます", はなす: "はなします",
  };
  VERBS.forEach((v) => {
    it(v.dict, () => {
      expect(conjugate(v, "pres").jp).toBe(expected[v.dict]);
    });
  });
});
