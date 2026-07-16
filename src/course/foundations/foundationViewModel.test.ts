import { describe, expect, it } from "vitest";

import { buildFoundationLessonViewModel } from "./foundationViewModel";
import {
  FOUNDATION_FIXTURE_LESSON_IDS,
  foundationLessons,
} from "./fixtures";

const SEED = "phase1-foundation-preview-v1";

/** The two authored fixture lessons, exercised as a matrix over locales. */
const LESSON_IDS = FOUNDATION_FIXTURE_LESSON_IDS;

function lessonById(id: string) {
  const lesson = foundationLessons.find((l) => l.id === id);
  if (!lesson) throw new Error(`missing lesson ${id}`);
  return lesson;
}

describe("buildFoundationLessonViewModel", () => {
  it.each(LESSON_IDS)("returns a complete success model for %s", (lessonId) => {
    const result = buildFoundationLessonViewModel(lessonId, "en", SEED);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const { model } = result;
    expect(model.lessonId).toBe(lessonId);
    expect(model.canDoDescriptor.trim().length).toBeGreaterThan(0);
    expect(model.levelId).toBe(lessonById(lessonId).level);
  });

  it.each(LESSON_IDS)(
    "realizes all eight models in authored order for %s",
    (lessonId) => {
      const result = buildFoundationLessonViewModel(lessonId, "en", SEED);
      if (!result.ok) throw new Error("expected ok");
      const { matrix } = result.model;
      expect(matrix.rows).toHaveLength(8);
      expect(matrix.rows.map((r) => r.variantId)).toEqual(
        lessonById(lessonId).modelVariantIds,
      );
      // Each row carries adjacent Japanese tokens + a localized translation.
      for (const row of matrix.rows) {
        expect(row.tokens.length).toBeGreaterThan(0);
        expect(row.translation.trim().length).toBeGreaterThan(0);
        expect(row.speaker.trim().length).toBeGreaterThan(0);
        expect(row.context.trim().length).toBeGreaterThan(0);
      }
      expect(matrix.initialVariantIds).toEqual(
        lessonById(lessonId).modelVariantIds.slice(0, 3),
      );
    },
  );

  it.each(LESSON_IDS)("selects five targets per round for %s", (lessonId) => {
    const result = buildFoundationLessonViewModel(lessonId, "en", SEED);
    if (!result.ok) throw new Error("expected ok");
    const [roundOne, roundTwo] = result.model.rounds;
    expect(roundOne.purpose).toBe("guided-controlled");
    expect(roundTwo.purpose).toBe("transfer");
    expect(roundOne.targets).toHaveLength(5);
    expect(roundTwo.targets).toHaveLength(5);
  });

  it.each(LESSON_IDS)(
    "round two includes constrained construction plus another transfer kind for %s",
    (lessonId) => {
      const result = buildFoundationLessonViewModel(lessonId, "en", SEED);
      if (!result.ok) throw new Error("expected ok");
      const kinds = result.model.rounds[1].targets.map((t) => t.exerciseKind);
      const constrained = kinds.filter(
        (k) => k === "constrained-construction",
      );
      expect(constrained.length).toBeGreaterThanOrEqual(1);
      const otherTransfer = kinds.filter(
        (k) => k !== "constrained-construction",
      );
      expect(otherTransfer.length).toBeGreaterThanOrEqual(1);
    },
  );

  it.each(LESSON_IDS)(
    "generates a complete prompt for every selected target in %s",
    (lessonId) => {
      const result = buildFoundationLessonViewModel(lessonId, "en", SEED);
      if (!result.ok) throw new Error("expected ok");
      for (const round of result.model.rounds) {
        for (const target of round.targets) {
          expect(target.prompt).toBeDefined();
          expect(target.prompt.kind).toBe(target.exerciseKind);
          expect(target.instruction.trim().length).toBeGreaterThan(0);
        }
      }
    },
  );

  it.each(LESSON_IDS)(
    "honors the diversity/reuse contract across the ten selected targets for %s",
    (lessonId) => {
      const result = buildFoundationLessonViewModel(lessonId, "en", SEED);
      if (!result.ok) throw new Error("expected ok");
      const targets = result.model.rounds.flatMap((r) => r.targets);
      expect(targets).toHaveLength(10);
      const counts = new Map<string, number>();
      for (const target of targets) {
        counts.set(
          target.visibleTargetKey,
          (counts.get(target.visibleTargetKey) ?? 0) + 1,
        );
      }
      const d = lessonById(lessonId).diversityConstraints;
      expect(counts.size).toBeGreaterThanOrEqual(d.minUniqueTargets);
      expect(Math.max(...counts.values())).toBeLessThanOrEqual(
        d.maxTargetReuse,
      );
    },
  );

  it.each(LESSON_IDS)(
    "selects identical target ids and matrix order regardless of locale for %s",
    (lessonId) => {
      const en = buildFoundationLessonViewModel(lessonId, "en", SEED);
      const it = buildFoundationLessonViewModel(lessonId, "it", SEED);
      if (!en.ok || !it.ok) throw new Error("expected ok");
      const ids = (m: typeof en) =>
        m.ok
          ? m.model.rounds.flatMap((r) => r.targets.map((t) => t.targetId))
          : [];
      expect(ids(it)).toEqual(ids(en));
      expect(it.model.matrix.rows.map((r) => r.variantId)).toEqual(
        en.model.matrix.rows.map((r) => r.variantId),
      );
      // Localized copy actually changes between locales.
      expect(it.model.canDoDescriptor).not.toBe(en.model.canDoDescriptor);
    },
  );

  it.each(LESSON_IDS)("is deterministic across repeated builds for %s", (lessonId) => {
    const a = buildFoundationLessonViewModel(lessonId, "en", SEED);
    const b = buildFoundationLessonViewModel(lessonId, "en", SEED);
    if (!a.ok || !b.ok) throw new Error("expected ok");
    const ids = (m: typeof a) =>
      m.ok ? m.model.rounds.flatMap((r) => r.targets.map((t) => t.targetId)) : [];
    expect(ids(b)).toEqual(ids(a));
  });

  it.each(LESSON_IDS)(
    "builds an honest same-family guided construction for %s",
    (lessonId) => {
      const result = buildFoundationLessonViewModel(lessonId, "en", SEED);
      if (!result.ok) throw new Error("expected ok");
      const { guided } = result.model;
      expect(guided.initial.familyId).toBe(guided.target.familyId);
      expect(guided.familyId).toBe(guided.initial.familyId);
      expect(guided.activeAxes.length).toBeGreaterThanOrEqual(1);
      expect(guided.targetChangedTokenIds.length).toBeGreaterThanOrEqual(1);
      const targetTokenIds = new Set(guided.target.tokens.map((t) => t.id));
      for (const id of guided.targetChangedTokenIds) {
        expect(targetTokenIds.has(id)).toBe(true);
      }
      // Initial and target must actually differ semantically.
      expect(guided.target.semanticFingerprint).not.toBe(
        guided.initial.semanticFingerprint,
      );
    },
  );

  it("returns a typed error for an unknown fixture id", () => {
    const result = buildFoundationLessonViewModel("no-such-lesson", "en", SEED);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("unknown-lesson");
  });

  it("exposes token resolvers covering every realized example and tile", () => {
    const result = buildFoundationLessonViewModel(LESSON_IDS[0], "en", SEED);
    if (!result.ok) throw new Error("expected ok");
    const { model } = result;
    for (const round of model.rounds) {
      for (const target of round.targets) {
        const tokens = model.tokensForExample(target.targetExampleId);
        expect(tokens).toBeDefined();
        expect(tokens?.length ?? 0).toBeGreaterThan(0);
        const first = tokens?.[0];
        if (first) {
          expect(model.tokenForTile(`${target.targetExampleId}#${first.id}`)).toEqual(
            first,
          );
        }
      }
    }
  });
});
