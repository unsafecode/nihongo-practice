/**
 * Exercise-kind variety across the whole catalogue.
 *
 * Before Phase 4, 34 of 60 A2 lessons shipped one identical ten-exercise
 * sequence and only 21 distinct sequences existed, because the
 * controlled-construction branch of `assignExerciseKinds` handed
 * `otherKinds[0]` (always `completion`) to every non-controlled transfer.
 * These bounds are deliberately looser than the measured post-fix figures so
 * that ordinary content edits do not break the build, while any regression
 * back towards the old monotony does.
 */
import { describe, expect, it } from "vitest";

import { a2FoundationCatalogs } from "../a2/catalog/catalog";
import { a1SemanticFoundationCatalogs } from "../a1/catalog/catalog";
import { buildA2FoundationViewModel } from "../a2/view/buildA2LessonViewModel";
import { buildA1LessonViewModel } from "../a1/a1LessonViewModel";
import type { FoundationRoundModel } from "./buildLessonViewModel";

type Sequence = string;

function sequencesOf(rounds: readonly FoundationRoundModel[]): Sequence {
  return rounds.flatMap((round) => round.targets.map((target) => target.exerciseKind)).join(",");
}

// Build every A2 lesson view model and collect per-lesson rounds.
const a2Lessons: ReadonlyMap<string, readonly FoundationRoundModel[]> = (() => {
  const map = new Map<string, readonly FoundationRoundModel[]>();
  for (const lesson of a2FoundationCatalogs.lessons) {
    const result = buildA2FoundationViewModel(lesson.id, "en");
    if (!result.ok) throw new Error(`A2 lesson ${lesson.id} failed: ${result.error.code}`);
    map.set(lesson.id, [...result.model.rounds]);
  }
  return map;
})();

// Build every A1 semantic lesson view model and collect per-lesson rounds.
const a1Lessons: ReadonlyMap<string, readonly FoundationRoundModel[]> = (() => {
  const map = new Map<string, readonly FoundationRoundModel[]>();
  for (const lesson of a1SemanticFoundationCatalogs.lessons) {
    const result = buildA1LessonViewModel(lesson.id, "en");
    if (!result.ok) throw new Error(`A1 lesson ${lesson.id} failed: ${result.error.code}`);
    map.set(lesson.id, [...result.model.rounds]);
  }
  return map;
})();

function collect(byLesson: ReadonlyMap<string, readonly FoundationRoundModel[]>) {
  const sequences = [...byLesson.values()].map(sequencesOf);
  const counts = new Map<Sequence, number>();
  for (const sequence of sequences) counts.set(sequence, (counts.get(sequence) ?? 0) + 1);
  const kinds = new Map<string, number>();
  for (const sequence of sequences) {
    for (const kind of sequence.split(",")) kinds.set(kind, (kinds.get(kind) ?? 0) + 1);
  }
  return { total: sequences.length, distinct: counts.size, maxShared: Math.max(...counts.values()), kinds };
}

describe("exercise-kind variety", () => {
  it("gives A2 many distinct sequences and no dominant one", () => {
    const stats = collect(a2Lessons);
    expect(stats.total).toBe(60);
    expect(stats.distinct).toBeGreaterThanOrEqual(30);
    expect(stats.maxShared).toBeLessThanOrEqual(12);
  });

  it("uses all four non-transformation kinds at A2, none of them marginal", () => {
    const stats = collect(a2Lessons);
    for (const kind of ["tile-ordering", "completion", "choice", "constrained-construction"]) {
      expect(stats.kinds.get(kind) ?? 0).toBeGreaterThanOrEqual(60);
    }
  });

  it("gives A1 many distinct sequences and no dominant one", () => {
    const stats = collect(a1Lessons);
    expect(stats.distinct).toBeGreaterThanOrEqual(Math.ceil(stats.total / 2));
    expect(stats.maxShared).toBeLessThanOrEqual(Math.ceil(stats.total / 4));
  });
});
