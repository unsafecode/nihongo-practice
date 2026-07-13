import { describe, expect, it } from "vitest";
import { categories } from "./phrases";

describe("phrasebook translations", () => {
  it("has stable IDs and complete IT/EN text", () => {
    const ids = new Set<string>();
    const categoryIds = new Set<string>();
    for (const category of categories) {
      expect(categoryIds.has(category.id)).toBe(false);
      categoryIds.add(category.id);
      expect(category.labels.it.length).toBeGreaterThan(0);
      expect(category.labels.en.length).toBeGreaterThan(0);
      for (const phrase of category.phrases) {
        expect(ids.has(phrase.id)).toBe(false);
        ids.add(phrase.id);
        expect(phrase.translations.it.length).toBeGreaterThan(0);
        expect(phrase.translations.en.length).toBeGreaterThan(0);
        expect(
          Object.values(phrase.notes ?? {}).every(
            (note) => note.trim().length > 0,
          ),
        ).toBe(true);
      }
    }
    expect(categoryIds.size).toBe(8);
    expect(ids.size).toBe(57);
  });

  it("keeps reviewed Italian and English wording", () => {
    const phrases = categories.flatMap((category) => category.phrases);
    const phrase = (id: string) => {
      const match = phrases.find((item) => item.id === id);
      if (!match) throw new Error(`Missing phrase: ${id}`);
      return match.translations;
    };

    expect(phrase("base-04")).toEqual({ it: "Grazie mille", en: "Thank you very much" });
    expect(phrase("saluti-01")).toEqual({ it: "Buongiorno", en: "Good morning" });
    expect(phrase("saluti-07")).toEqual({ it: "Piacere", en: "Nice to meet you" });
    expect(phrase("presentarsi-05")).toEqual({ it: "Piacere di conoscerti", en: "I look forward to getting to know you" });
    expect(phrase("emergenze-03")).toEqual({ it: "Chiami la polizia, per favore", en: "Please call the police" });
  });
});
