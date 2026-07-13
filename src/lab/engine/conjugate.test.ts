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
