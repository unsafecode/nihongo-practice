import { describe, it, expect } from "vitest";
import { assembleJP, type Segment } from "./assemble";
import { buildJapaneseSentence } from "./japanese";
import { formatRomaji } from "../../romaji/formatRomaji";

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

  it("formats exposed lab tokens with semantic separators", () => {
    const model = buildJapaneseSentence({
      scenarioId: "eat",
      form: "pres",
      timeId: "today",
      options: { object: "ramen", place: null },
    });

    expect(model.sentence.romaji).toBe("kyō rāmen o tabemasu");
    const formatted = formatRomaji(model.tokens);
    expect(formatted).toMatchObject({ ok: true });
    if (!formatted.ok) return;

    expect(formatted.text).toBe("kyō rāmen o tabemasu");
    expect(formatted.runs.find((run) => run.text === "o")?.separatorBefore).toBe(
      " ",
    );
    const stemIndex = formatted.runs.findIndex((run) => run.text === "tabe");
    expect(stemIndex).toBeGreaterThanOrEqual(0);
    expect(formatted.runs[stemIndex + 1]).toMatchObject({
      separatorBefore: "",
      text: "masu",
    });
  });
});
