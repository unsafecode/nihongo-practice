import { describe, it, expect } from "vitest";
import { assembleJP, type Segment } from "./assemble";

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
