import { describe, it, expect } from "vitest";
import { scenarios } from "./scenarios";
import { conjugate } from "../engine/conjugate";

describe("scenarios data", () => {
  it("almeno 10 scenari", () => {
    expect(scenarios.length).toBeGreaterThanOrEqual(10);
  });
  it("id univoci", () => {
    const ids = scenarios.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  scenarios.forEach((s) => {
    it(`${s.id}: il verbo si coniuga`, () => {
      expect(conjugate(s.verb, "pres").jp.length).toBeGreaterThan(1);
    });
    it(`${s.id}: ogni slot ha un default valido e opzioni complete`, () => {
      s.slots.forEach((slot) => {
        expect(slot.options[slot.defaultIndex]).toBeTruthy();
        slot.options.forEach((o) => {
          // Le opzioni "nessuno" (none) sono sentinelle vuote: l'assembler le
          // omette tramite filter(jp.length > 0). Solo le opzioni reali devono
          // avere jp/romaji non vuoti.
          if (!o.none) {
            expect(o.jp.length).toBeGreaterThan(0);
            expect(o.romaji.length).toBeGreaterThan(0);
          }
          expect(typeof o.it).toBe("string");
        });
      });
    });
  });
});
