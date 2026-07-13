import { describe, it, expect } from "vitest";
import { assembleJP, type Segment } from "./assemble";
import { assembleIT, italianVerb, type ITParts } from "./assemble";

describe("assembleJP", () => {
  it("time + object + verb", () => {
    const segs: Segment[] = [
      { kind: "time", jp: "きょう", romaji: "kyō" },
      { kind: "object", jp: "らーめん", romaji: "rāmen", particle: { jp: "を", romaji: "o" } },
      { kind: "verb", jp: "たべます", romaji: "tabemasu" },
    ];
    const r = assembleJP(segs);
    expect(r.jp).toBe("きょうらーめんをたべます");
    expect(r.romaji).toBe("kyō rāmen o tabemasu");
  });

  it("omette i segmenti vuoti", () => {
    const segs: Segment[] = [
      { kind: "object", jp: "みず", romaji: "mizu", particle: { jp: "を", romaji: "o" } },
      { kind: "verb", jp: "のみます", romaji: "nomimasu" },
    ];
    const r = assembleJP(segs);
    expect(r.jp).toBe("みずをのみます");
    expect(r.romaji).toBe("mizu o nomimasu");
  });
});

describe("italianVerb — regola tempo/verbo", () => {
  const v = { pres: "mangio", past: "ho mangiato", future: "mangerò", neg: "non mangio", negFuture: "non mangerò", pastneg: "non ho mangiato", vol: "mangiamo", des: "voglio mangiare" };
  it("presente + oggi -> mangio", () => {
    expect(italianVerb(v, "pres", false)).toBe("mangio");
  });
  it("presente + domani -> mangerò", () => {
    expect(italianVerb(v, "pres", true)).toBe("mangerò");
  });
  it("negativo + stasera -> non mangerò", () => {
    expect(italianVerb(v, "neg", true)).toBe("non mangerò");
  });
  it("passato ignora il tempo futuro", () => {
    expect(italianVerb(v, "past", true)).toBe("ho mangiato");
  });
});

describe("assembleIT", () => {
  const v = { pres: "mangio", past: "ho mangiato", future: "mangerò", neg: "non mangio", negFuture: "non mangerò", pastneg: "non ho mangiato", vol: "mangiamo", des: "voglio mangiare" };
  it("oggi mangio il ramen al ristorante", () => {
    const parts: ITParts = { verb: v, form: "pres", timeIt: "oggi", timeFuture: false, args: ["il ramen", "al ristorante"] };
    expect(assembleIT(parts)).toBe("Oggi mangio il ramen al ristorante");
  });
  it("ieri ho mangiato il ramen", () => {
    const parts: ITParts = { verb: v, form: "past", timeIt: "ieri", timeFuture: false, args: ["il ramen"] };
    expect(assembleIT(parts)).toBe("Ieri ho mangiato il ramen");
  });
  it("stasera mangerò il ramen (presente+tempo futuro)", () => {
    const parts: ITParts = { verb: v, form: "pres", timeIt: "stasera", timeFuture: true, args: ["il ramen"] };
    expect(assembleIT(parts)).toBe("Stasera mangerò il ramen");
  });
  it("senza tempo: Mangio il ramen", () => {
    const parts: ITParts = { verb: v, form: "pres", timeIt: "", timeFuture: false, args: ["il ramen"] };
    expect(assembleIT(parts)).toBe("Mangio il ramen");
  });
});
