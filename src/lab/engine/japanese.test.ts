import { describe, expect, it } from "vitest";
import type { LabSelection } from "../../content/types";
import { buildJapaneseSentence } from "./japanese";

const golden: Array<{ name: string; selection: LabSelection; jp: string }> = [
  {
    name: "eat",
    selection: { scenarioId: "eat", form: "pres", timeId: "today", options: { object: "ramen", place: "restaurant" } },
    jp: "きょうれすとらんでらーめんをたべます",
  },
  {
    name: "drink",
    selection: { scenarioId: "drink", form: "pres", timeId: "today", options: { object: "water", place: "bar" } },
    jp: "きょうばーでみずをのみます",
  },
  {
    name: "buy",
    selection: { scenarioId: "buy", form: "pres", timeId: "today", options: { object: "ticket", place: "shop" } },
    jp: "きょうみせできっぷをかいます",
  },
  {
    name: "watch",
    selection: { scenarioId: "watch", form: "pres", timeId: "today", options: { object: "movie" } },
    jp: "きょうえいがをみます",
  },
  {
    name: "go",
    selection: { scenarioId: "go", form: "pres", timeId: "today", options: { destination: "station", transport: "train" } },
    jp: "きょうでんしゃでえきにいきます",
  },
  {
    name: "return",
    selection: { scenarioId: "return", form: "pres", timeId: "today", options: { destination: "home" } },
    jp: "きょういえにかえります",
  },
  {
    name: "board",
    selection: { scenarioId: "board", form: "pres", timeId: "today", options: { vehicle: "train" } },
    jp: "きょうでんしゃにのります",
  },
  {
    name: "wait",
    selection: { scenarioId: "wait", form: "pres", timeId: "today", options: { target: "friend" } },
    jp: "きょうともだちをまちます",
  },
  {
    name: "meet",
    selection: { scenarioId: "meet", form: "pres", timeId: "today", options: { person: "friend" } },
    jp: "きょうともだちにあいます",
  },
  {
    name: "do",
    selection: { scenarioId: "do", form: "pres", timeId: "today", options: { activity: "reservation" } },
    jp: "きょうよやくをします",
  },
  {
    name: "come",
    selection: { scenarioId: "come", form: "pres", timeId: "today", options: { destination: "japan" } },
    jp: "きょうにほんにきます",
  },
  {
    name: "speak",
    selection: { scenarioId: "speak", form: "pres", timeId: "today", options: { language: "japaneseLanguage" } },
    jp: "きょうにほんごをはなします",
  },
];

describe("buildJapaneseSentence", () => {
  it.each(golden)("preserves v2 output for $name", ({ selection, jp }) => {
    expect(buildJapaneseSentence(selection).sentence.jp).toBe(jp);
  });

  it("preserves the v2 Japanese order and highlighted gears", () => {
    const model = buildJapaneseSentence({
      scenarioId: "eat",
      form: "pres",
      timeId: "today",
      options: { object: "ramen", place: "restaurant" },
    });

    expect(model.parts.map((part) => part.id)).toEqual([
      "time",
      "place",
      "object",
      "verb",
    ]);
    expect(model.sentence).toEqual({
      jp: "きょうれすとらんでらーめんをたべます",
      romaji: "kyō resutoran de rāmen o tabemasu",
    });
    expect(model.parts[model.parts.length - 1]).toMatchObject({
      kind: "verb",
      jp: "たべ",
      suffix: { jp: "ます", romaji: "masu", kind: "ending" },
    });
  });

  it("omits an optional slot selected as null", () => {
    const model = buildJapaneseSentence({
      scenarioId: "eat",
      form: "pres",
      timeId: "tomorrow",
      options: { object: "sushi", place: null },
    });
    expect(model.sentence.jp).toBe("あしたすしをたべます");
    expect(model.parts.map((part) => part.id)).toEqual([
      "time",
      "object",
      "verb",
    ]);
  });
});
