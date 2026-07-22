import { describe, expect, it } from "vitest";
import { A2_LESSON_IDS } from "../manifest";
import {
  buildA2LessonViewModel,
  resolveA2KanjiExposureViews,
} from "./buildA2LessonViewModel";
import type {
  KanjiEntry,
  KanjiExposure,
  KanjiReading,
} from "../kanji/kanjiTypes";

/**
 * The single fail-closed source the A2 lesson page renders from (Phase 3
 * Task 8): the ordered models/exercises from the frozen A2 catalog plus the
 * lesson's resolved contextual-kanji exposures (glyph, stage-at-this-lesson,
 * reading, semantic gloss). Unknown/missing references surface an explicit
 * error — never a success-shaped empty model.
 */
describe("buildA2LessonViewModel — required probe sequencing-ongoing-3 (ている)", () => {
  const result = buildA2LessonViewModel("sequencing-ongoing-3", "en");

  it("resolves the lesson with at least 8 models and two practice rounds", () => {
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.model.foundation.matrix.rows.length).toBeGreaterThanOrEqual(8);
    expect(result.model.foundation.rounds).toHaveLength(2);
    const totalTargets = result.model.foundation.rounds.reduce(
      (sum, round) => sum + round.targets.length,
      0,
    );
    expect(totalTargets).toBeGreaterThanOrEqual(8);
  });

  it("resolves the lesson's て/いる-relevant kanji exposures at their catalog stages", () => {
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const byGlyph = new Map(
      result.model.kanjiExposures.map((exposure) => [exposure.glyph, exposure]),
    );
    // The routine verbs re-encountered at ています land as `revealable` here.
    for (const glyph of ["起", "寝", "使", "作", "毎"]) {
      expect(byGlyph.get(glyph)?.stage).toBe("revealable");
    }
    // The routine verbs first introduced here are at `supported-retrieval`.
    for (const glyph of ["洗", "終", "始", "働"]) {
      expect(byGlyph.get(glyph)?.stage).toBe("supported-retrieval");
    }
    expect(result.model.kanjiExposures).toHaveLength(9);
  });

  it("carries each exposure's glyph, reading, romaji, and semantic-gloss reference", () => {
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const okiru = result.model.kanjiExposures.find((e) => e.glyph === "起");
    expect(okiru).toMatchObject({
      glyph: "起",
      stage: "revealable",
      reading: "お",
      romaji: "o",
      meaningCopyId: "a2-kanji-okiru-meaning",
      contextId: "a2-context-routines",
    });
  });
});

describe("buildA2LessonViewModel — every A2 lesson resolves fail-closed", () => {
  it("resolves all 60 A2 lessons with no unresolved reference", () => {
    for (const lessonId of A2_LESSON_IDS) {
      const result = buildA2LessonViewModel(lessonId, "en");
      expect(result.ok, `lesson ${lessonId} failed: ${result.ok ? "" : result.error.code}`).toBe(
        true,
      );
    }
  });

  it("returns an explicit unknown-lesson error, never a success-shaped empty model", () => {
    const result = buildA2LessonViewModel("not-a-real-lesson", "en");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("unknown-lesson");
  });
});

describe("resolveA2KanjiExposureViews — fail-closed reference resolution", () => {
  const entry: KanjiEntry = {
    id: "k1",
    glyph: "話",
    meaningCopyId: "a2-kanji-hanasu-meaning",
    readingIds: ["k1-reading"],
  };
  const reading: KanjiReading = {
    id: "k1-reading",
    kanjiId: "k1",
    kana: "はな",
    romaji: "hana",
  };
  const exposure: KanjiExposure = {
    id: "k1-first-supported",
    kanjiId: "k1",
    lexemeSenseId: "a2-sense-hanasu",
    lessonId: "connected-conversation-1",
    stage: "first-supported",
    readingId: "k1-reading",
    contextId: "a2-context-conversation",
  };
  const deps = {
    entriesById: new Map([[entry.id, entry]]),
    readingsById: new Map([[reading.id, reading]]),
    exposuresById: new Map([[exposure.id, exposure]]),
  };

  it("resolves a known exposure id into a full exposure view", () => {
    const result = resolveA2KanjiExposureViews(
      "connected-conversation-1",
      ["k1-first-supported"],
      deps,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.views).toEqual([
      {
        exposureId: "k1-first-supported",
        kanjiId: "k1",
        glyph: "話",
        stage: "first-supported",
        reading: "はな",
        romaji: "hana",
        readingId: "k1-reading",
        meaningCopyId: "a2-kanji-hanasu-meaning",
        lexemeSenseId: "a2-sense-hanasu",
        contextId: "a2-context-conversation",
      },
    ]);
  });

  it("fails closed on an unknown exposure id", () => {
    const result = resolveA2KanjiExposureViews("connected-conversation-1", ["nope"], deps);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("unknown-kanji-exposure");
  });

  it("fails closed on an exposure whose kanji entry is missing", () => {
    const orphan: KanjiExposure = { ...exposure, id: "orphan", kanjiId: "missing" };
    const result = resolveA2KanjiExposureViews("connected-conversation-1", ["orphan"], {
      ...deps,
      exposuresById: new Map([[orphan.id, orphan]]),
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("unknown-kanji-entry");
  });

  it("fails closed on an exposure whose reading is missing", () => {
    const orphan: KanjiExposure = { ...exposure, id: "orphan-reading", readingId: "missing" };
    const result = resolveA2KanjiExposureViews("connected-conversation-1", ["orphan-reading"], {
      ...deps,
      exposuresById: new Map([[orphan.id, orphan]]),
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("unknown-kanji-reading");
  });
});
