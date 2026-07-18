import { describe, expect, it } from "vitest";
import {
  A2_KANJI_DISTRIBUTION,
  A2_KANJI_ENTRIES,
  A2_KANJI_EXPOSURES,
  A2_KANJI_READINGS,
  a2KanjiCountByModule,
} from "./a2KanjiCatalog";
import type { KanjiExposureStage } from "./kanjiTypes";
import { A2_CANONICAL_POSITIONS, A2_SYNTHESIS_LESSON_IDS } from "../manifest";
import type { ModuleId } from "../../foundations/types";

/**
 * The exact, authoritative 120-glyph contextual kanji inventory (Phase 3
 * Task 3, locked decision L3). No synthesis-only new glyphs; four explicit
 * stages per entry in strict canonical order; recognition-only.
 */

const EXPECTED_DISTRIBUTION: Readonly<Record<ModuleId, number>> = {
  "connected-conversation": 8,
  "plans-invitations": 12,
  "experiences-narratives": 9,
  "reasons-opinions": 8,
  "sequencing-ongoing": 9,
  "permission-requests": 8,
  "neighborhood-services": 8,
  "restaurant-problems": 8,
  "shopping-returns": 8,
  "health-advice": 8,
  "work-study-messages": 8,
  "travel-reservations": 9,
  "relationships-events": 8,
  "practical-texts": 9,
  "a2-synthesis": 0,
};

const STAGE_ORDER: readonly KanjiExposureStage[] = [
  "first-supported",
  "supported-retrieval",
  "revealable",
  "assessed",
];

function isDeepFrozen(value: unknown, seen: Set<unknown> = new Set()): boolean {
  if (value === null || typeof value !== "object") return true;
  if (seen.has(value)) return true;
  seen.add(value);
  if (!Object.isFrozen(value)) return false;
  return Object.values(value as Record<string, unknown>).every((v) => isDeepFrozen(v, seen));
}

describe("A2 kanji catalog", () => {
  it("declares exactly 120 unique kanji entries with unique glyphs", () => {
    expect(A2_KANJI_ENTRIES).toHaveLength(120);
    expect(new Set(A2_KANJI_ENTRIES.map((e) => e.id)).size).toBe(120);
    expect(new Set(A2_KANJI_ENTRIES.map((e) => e.glyph)).size).toBe(120);
  });

  it("declares exactly 120 readings, one per entry, each declared in its entry's readingIds", () => {
    expect(A2_KANJI_READINGS).toHaveLength(120);
    expect(new Set(A2_KANJI_READINGS.map((r) => r.id)).size).toBe(120);
    const readingsById = new Map(A2_KANJI_READINGS.map((r) => [r.id, r]));
    for (const entry of A2_KANJI_ENTRIES) {
      expect(entry.readingIds).toHaveLength(1);
      const reading = readingsById.get(entry.readingIds[0]);
      expect(reading).toBeDefined();
      expect(reading?.kanjiId).toBe(entry.id);
    }
  });

  it("declares exactly 480 exposures, exactly four per entry", () => {
    expect(A2_KANJI_EXPOSURES).toHaveLength(480);
    const byKanji = new Map<string, number>();
    for (const exposure of A2_KANJI_EXPOSURES) {
      byKanji.set(exposure.kanjiId, (byKanji.get(exposure.kanjiId) ?? 0) + 1);
    }
    expect(byKanji.size).toBe(120);
    for (const count of byKanji.values()) {
      expect(count).toBe(4);
    }
  });

  it("matches the exact authoritative module distribution and sums to 120", () => {
    expect(A2_KANJI_DISTRIBUTION).toEqual(EXPECTED_DISTRIBUTION);
    expect(a2KanjiCountByModule()).toEqual(EXPECTED_DISTRIBUTION);
    const sum = Object.values(A2_KANJI_DISTRIBUTION).reduce((a, b) => a + b, 0);
    expect(sum).toBe(120);
  });

  it("gives every entry exactly one of each of the four stages in strict canonical order", () => {
    const byKanji = new Map<string, typeof A2_KANJI_EXPOSURES[number][]>();
    for (const exposure of A2_KANJI_EXPOSURES) {
      const list = byKanji.get(exposure.kanjiId) ?? [];
      list.push(exposure);
      byKanji.set(exposure.kanjiId, list);
    }
    for (const [kanjiId, exposures] of byKanji) {
      expect(new Set(exposures.map((e) => e.stage)).size).toBe(4);
      const positionsInStageOrder = STAGE_ORDER.map((stage) => {
        const exposure = exposures.find((e) => e.stage === stage);
        expect(exposure, `${kanjiId} missing stage ${stage}`).toBeDefined();
        const position = A2_CANONICAL_POSITIONS[exposure!.lessonId];
        expect(position, `${kanjiId} stage ${stage} has unresolvable lesson ${exposure!.lessonId}`).toBeDefined();
        return position;
      });
      for (let i = 1; i < positionsInStageOrder.length; i++) {
        expect(positionsInStageOrder[i]).toBeGreaterThan(positionsInStageOrder[i - 1]);
      }
    }
  });

  it("never introduces (first-supported) a glyph inside an a2-synthesis lesson", () => {
    const synthesisLessons = new Set(A2_SYNTHESIS_LESSON_IDS);
    const firstSupportedInSynthesis = A2_KANJI_EXPOSURES.filter(
      (e) => e.stage === "first-supported" && synthesisLessons.has(e.lessonId),
    );
    expect(firstSupportedInSynthesis).toEqual([]);
  });

  it("every exposure's readingId resolves to a reading declared by its own entry", () => {
    const readingsById = new Map(A2_KANJI_READINGS.map((r) => [r.id, r]));
    const entriesById = new Map(A2_KANJI_ENTRIES.map((e) => [e.id, e]));
    for (const exposure of A2_KANJI_EXPOSURES) {
      const reading = readingsById.get(exposure.readingId);
      expect(reading).toBeDefined();
      expect(reading?.kanjiId).toBe(exposure.kanjiId);
      const entry = entriesById.get(exposure.kanjiId);
      expect(entry).toBeDefined();
      expect(entry?.readingIds).toContain(exposure.readingId);
      expect(exposure.lexemeSenseId).toBeTruthy();
      expect(exposure.contextId).toBeTruthy();
    }
  });

  it("declares the exact M1 glyph set and 話's first-supported row", () => {
    const m1Glyphs = A2_KANJI_EXPOSURES.filter(
      (e) => e.stage === "first-supported" && e.lessonId.startsWith("connected-conversation-"),
    )
      .map((e) => A2_KANJI_ENTRIES.find((entry) => entry.id === e.kanjiId)?.glyph)
      .sort();
    expect(new Set(m1Glyphs)).toEqual(new Set(["話", "言", "聞", "友", "思", "名", "前", "何"]));

    const hanashiEntry = A2_KANJI_ENTRIES.find((e) => e.glyph === "話");
    expect(hanashiEntry).toBeDefined();
    const reading = A2_KANJI_READINGS.find((r) => r.kanjiId === hanashiEntry!.id);
    expect(reading).toMatchObject({ kana: "はな", romaji: "hana" });
    const firstSupported = A2_KANJI_EXPOSURES.find(
      (e) => e.kanjiId === hanashiEntry!.id && e.stage === "first-supported",
    );
    expect(firstSupported?.lessonId).toBe("connected-conversation-1");
  });

  it("gives shared-lexeme glyphs (名/前) distinct meaningCopyIds despite the same lexemeSenseId", () => {
    const na = A2_KANJI_ENTRIES.find((e) => e.glyph === "名")!;
    const mae = A2_KANJI_ENTRIES.find((e) => e.glyph === "前")!;
    expect(na.meaningCopyId).not.toBe(mae.meaningCopyId);
    const naExposure = A2_KANJI_EXPOSURES.find((e) => e.kanjiId === na.id)!;
    const maeExposure = A2_KANJI_EXPOSURES.find((e) => e.kanjiId === mae.id)!;
    expect(naExposure.lexemeSenseId).toBe(maeExposure.lexemeSenseId);
  });

  it("gives homophone glyphs (止/泊, both read 'と') distinct lexemeSenseIds", () => {
    const tomaru = A2_KANJI_ENTRIES.find((e) => e.glyph === "止")!;
    const hakuTomaru = A2_KANJI_ENTRIES.find((e) => e.glyph === "泊")!;
    const tomaruExposure = A2_KANJI_EXPOSURES.find((e) => e.kanjiId === tomaru.id)!;
    const hakuExposure = A2_KANJI_EXPOSURES.find((e) => e.kanjiId === hakuTomaru.id)!;
    expect(tomaruExposure.lexemeSenseId).not.toBe(hakuExposure.lexemeSenseId);
  });

  it("teaches 泊 as 泊まります／tomarimasu ('to stay'), lexemeSenseId a2-sense-tomaru-stay — distinct from 止's a2-sense-tomaru-stop ('to stop') — with its と/to reading intact", () => {
    const tome = A2_KANJI_ENTRIES.find((e) => e.glyph === "止")!;
    const haku = A2_KANJI_ENTRIES.find((e) => e.glyph === "泊")!;
    const tomeExposure = A2_KANJI_EXPOSURES.find((e) => e.kanjiId === tome.id)!;
    const hakuExposure = A2_KANJI_EXPOSURES.find((e) => e.kanjiId === haku.id)!;

    // The taught lexeme for 泊 is the verb 泊まります (tomarimasu, "to stay" /
    // "to lodge"), not the unrelated noun 宿泊 — the sense slug must reflect
    // the actual verb being taught, and must stay distinct from 止's "to
    // stop" sense despite both glyphs sharing the と/to reading and "tomaru"
    // stem.
    expect(hakuExposure.lexemeSenseId).toBe("a2-sense-tomaru-stay");
    expect(tomeExposure.lexemeSenseId).toBe("a2-sense-tomaru-stop");

    const hakuReading = A2_KANJI_READINGS.find((r) => r.kanjiId === haku.id);
    expect(hakuReading).toMatchObject({ kana: "と", romaji: "to" });
  });

  it("assesses practical-texts' second cohort (料/金/開/閉) at a2-synthesis-4, not the naive next-module-1", () => {
    for (const glyph of ["料", "金", "開", "閉"]) {
      const entry = A2_KANJI_ENTRIES.find((e) => e.glyph === glyph)!;
      const assessed = A2_KANJI_EXPOSURES.find((e) => e.kanjiId === entry.id && e.stage === "assessed")!;
      expect(assessed.lessonId).toBe("a2-synthesis-4");
    }
  });

  it("deep-freezes all exported kanji catalog data", () => {
    expect(isDeepFrozen(A2_KANJI_ENTRIES)).toBe(true);
    expect(isDeepFrozen(A2_KANJI_READINGS)).toBe(true);
    expect(isDeepFrozen(A2_KANJI_EXPOSURES)).toBe(true);
    expect(isDeepFrozen(A2_KANJI_DISTRIBUTION)).toBe(true);
  });
});
