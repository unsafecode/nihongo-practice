import { describe, expect, it } from "vitest";
import { courseModules } from "../data/course";
import { a1FoundationCatalogs } from "../a1/catalog/catalog";
import { buildA1LessonViewModel } from "../a1/a1LessonViewModel";
import { module1ItemsByLesson } from "../a1/catalog/module01Sounds";
import {
  exampleTokens,
  getLessonExercises,
  segmentToken,
} from "./lessonExerciseModel";

/**
 * The pure lesson-exercise model (Phase 2 Task 6; design spec §10.1). It
 * resolves the A1 release's 44 semantic lessons' authored practice targets
 * into deterministic engine prompts, and separately resolves each of the
 * four phonetic (`sounds-*`) lessons' 10 authored `A1PhoneticItem`s into
 * deterministic choice/tile-ordering prompts (I1) — exposing the derived
 * romaji + per-locale instruction/intent copy the UI needs without ever
 * reconstructing a canonical answer in the component layer.
 */

const allLessonIds = courseModules.flatMap((m) => m.lessons.map((l) => l.id));
const semanticLessonIds = new Set(
  a1FoundationCatalogs.lessons.map((lesson) => lesson.id),
);
const phoneticLessonIds = allLessonIds.filter(
  (id) => !semanticLessonIds.has(id),
);

describe("getLessonExercises — deterministic prompt generation for every semantic lesson", () => {
  it("generates the two-round practice set with no errors for every semantic lesson", () => {
    for (const lessonId of semanticLessonIds) {
      const model = getLessonExercises(lessonId);
      expect(model, `model for ${lessonId}`).toBeDefined();
      expect(model!.errors, `errors for ${lessonId}`).toEqual([]);
      expect(model!.exercises.length, `count for ${lessonId}`).toBeGreaterThan(0);
    }
  });

  it("matches the exact round-1 + round-2 target count from the release builder for a sample of lessons", () => {
    for (const lessonId of ["introductions-1", "past-negative-2", "capstones-4"]) {
      const built = buildA1LessonViewModel(lessonId, "en");
      if (!built.ok) throw new Error(`expected ok for ${lessonId}`);
      const expectedCount = built.model.rounds.reduce(
        (total, round) => total + round.targets.length,
        0,
      );
      const model = getLessonExercises(lessonId)!;
      expect(model.exercises.length, lessonId).toBe(expectedCount);
    }
  });

  it("generates exactly 10 error-free runtime exercises for every phonetic (sounds-*) lesson (I1)", () => {
    expect(phoneticLessonIds.length).toBe(4);
    for (const lessonId of phoneticLessonIds) {
      const model = getLessonExercises(lessonId);
      expect(model, `model for ${lessonId}`).toBeDefined();
      expect(model!.errors, `errors for ${lessonId}`).toEqual([]);
      expect(model!.exercises.length, `count for ${lessonId}`).toBe(10);
    }
  });

  it("names at least 5 unique visible targets per phonetic lesson, one exercise per authored item, from the module01Sounds catalog", () => {
    for (const lessonId of phoneticLessonIds) {
      const items = module1ItemsByLesson[lessonId]!;
      const model = getLessonExercises(lessonId)!;
      expect(model.exercises.map((e) => e.definitionId).sort()).toEqual(
        items.map((i) => i.exerciseRefId).sort(),
      );
      const targets = new Set(model.exercises.map((e) => e.prompt.assessedConceptIds[0]));
      expect(targets.size).toBeGreaterThanOrEqual(5);
    }
  });

  it("gives every phonetic exercise the guided-controlled practicePurpose and a null intent, never fabricated", () => {
    for (const lessonId of phoneticLessonIds) {
      const model = getLessonExercises(lessonId)!;
      for (const exercise of model.exercises) {
        expect(exercise.practicePurpose).toBe("guided-controlled");
        expect(exercise.intentText.en).toBeNull();
        expect(exercise.intentText.it).toBeNull();
      }
    }
  });

  it("carries the round's real practicePurpose (guided-controlled round 1, transfer round 2), never fabricated", () => {
    const lessonId = "introductions-1";
    const built = buildA1LessonViewModel(lessonId, "en");
    if (!built.ok) throw new Error(`expected ok for ${lessonId}`);
    const purposeByTargetId = new Map(
      built.model.rounds.flatMap((round) =>
        round.targets.map((target) => [target.targetId, round.purpose] as const),
      ),
    );
    const model = getLessonExercises(lessonId)!;
    expect(model.exercises.length).toBeGreaterThan(0);
    for (const exercise of model.exercises) {
      expect(exercise.practicePurpose).toBe(purposeByTargetId.get(exercise.definitionId));
    }
    expect(model.exercises.some((e) => e.practicePurpose === "guided-controlled")).toBe(true);
    expect(model.exercises.some((e) => e.practicePurpose === "transfer")).toBe(true);
  });

  it("preserves the release builder's authored target order and ids for a lesson", () => {
    const built = buildA1LessonViewModel("introductions-1", "en");
    if (!built.ok) throw new Error("expected ok");
    const expectedIds = built.model.rounds.flatMap((round) =>
      round.targets.map((target) => target.targetId),
    );
    const model = getLessonExercises("introductions-1")!;
    expect(model.exercises.map((e) => e.definitionId)).toEqual(expectedIds);
  });

  it("covers multiple exercise kinds across the course (tile-ordering, choice, completion, constrained-construction)", () => {
    const kinds = new Set<string>();
    for (const lessonId of semanticLessonIds) {
      for (const exercise of getLessonExercises(lessonId)!.exercises) {
        kinds.add(exercise.prompt.kind);
      }
    }
    expect(kinds.has("tile-ordering")).toBe(true);
    expect(kinds.has("choice")).toBe(true);
    expect(kinds.has("completion")).toBe(true);
    expect(kinds.has("constrained-construction")).toBe(true);
  });

  it("is deterministic: two builds of the same lesson are structurally equal", () => {
    const a = getLessonExercises("past-negative-1");
    const b = getLessonExercises("past-negative-1");
    expect(JSON.stringify(a)).toEqual(JSON.stringify(b));
  });

  it("returns undefined for an unknown lesson id (not one of the 48 published lessons)", () => {
    expect(getLessonExercises("not-a-real-lesson")).toBeUndefined();
  });

  it("never stores a raw answer array outside the engine's prompt shape", () => {
    // The model exposes engine prompts only; a tile-ordering prompt carries
    // shared tiles + a correct-order id list, never a duplicated jp answer.
    const model = getLessonExercises("introductions-1")!;
    const tile = model.exercises.find((e) => e.prompt.kind === "tile-ordering");
    expect(tile).toBeDefined();
    if (tile && tile.prompt.kind === "tile-ordering") {
      expect(tile.prompt.correctTileIds.length).toBeGreaterThan(0);
      for (const id of tile.prompt.correctTileIds) {
        expect(tile.prompt.tiles.some((t) => t.id === id)).toBe(true);
      }
    }
  });

  it("gives every exercise a non-empty localized instruction in both locales", () => {
    const model = getLessonExercises("introductions-1")!;
    for (const exercise of model.exercises) {
      expect(exercise.instruction.en.trim().length, exercise.definitionId).toBeGreaterThan(0);
      expect(exercise.instruction.it.trim().length, exercise.definitionId).toBeGreaterThan(0);
    }
  });

  it("gives a constrained-construction exercise a non-null localized intent in both locales, and every other kind null", () => {
    const model = getLessonExercises("introductions-1")!;
    for (const exercise of model.exercises) {
      if (exercise.prompt.kind === "constrained-construction") {
        expect(exercise.intentText.en?.trim().length, exercise.definitionId).toBeGreaterThan(0);
        expect(exercise.intentText.it?.trim().length, exercise.definitionId).toBeGreaterThan(0);
      } else {
        expect(exercise.intentText.en).toBeNull();
        expect(exercise.intentText.it).toBeNull();
      }
    }
  });
});

describe("segmentToken — derived AssembledToken for a tile/option id", () => {
  it("resolves the real assembled token (jp/romaji/kind/boundary) of a shared example segment by tile id", () => {
    const model = getLessonExercises("introductions-1")!;
    const tileExercise = model.exercises.find((e) => e.prompt.kind === "tile-ordering");
    expect(tileExercise).toBeDefined();
    if (tileExercise && tileExercise.prompt.kind === "tile-ordering") {
      for (const tile of tileExercise.prompt.tiles) {
        const token = segmentToken(tile.id);
        expect(token, `token for ${tile.id}`).toBeDefined();
        expect(token!.jp).toBe(tile.jp);
        expect(token!.romaji.trim().length).toBeGreaterThan(0);
        expect(token!.id.length).toBeGreaterThan(0);
        expect(token!.source.referenceId.length).toBeGreaterThan(0);
      }
    }
  });

  it("resolves every generated exercise's tile/option ids across every semantic lesson", () => {
    for (const lessonId of semanticLessonIds) {
      for (const exercise of getLessonExercises(lessonId)!.exercises) {
        const { prompt, targetExampleId } = exercise;
        if (prompt.kind === "tile-ordering") {
          for (const tile of prompt.tiles) {
            expect(segmentToken(tile.id), `${lessonId} ${tile.id}`).toBeDefined();
          }
        } else if (prompt.kind === "choice") {
          for (const option of prompt.options) {
            expect(segmentToken(option.id), `${lessonId} ${option.id}`).toBeDefined();
          }
          for (const segment of prompt.sentenceSegments) {
            expect(
              segmentToken(`${targetExampleId}#${segment.id}`),
              `${lessonId} ${targetExampleId}#${segment.id}`,
            ).toBeDefined();
          }
        } else if (prompt.kind === "completion") {
          for (const segment of prompt.sentenceSegments) {
            expect(
              segmentToken(`${targetExampleId}#${segment.id}`),
              `${lessonId} ${targetExampleId}#${segment.id}`,
            ).toBeDefined();
          }
        }
      }
    }
  });

  it("resolves every generated phonetic exercise's tile/option ids across every sounds-* lesson (I1)", () => {
    for (const lessonId of phoneticLessonIds) {
      for (const exercise of getLessonExercises(lessonId)!.exercises) {
        const { prompt, targetExampleId } = exercise;
        if (prompt.kind === "tile-ordering") {
          for (const tile of prompt.tiles) {
            expect(segmentToken(tile.id), `${lessonId} ${tile.id}`).toBeDefined();
          }
        } else if (prompt.kind === "choice") {
          for (const option of prompt.options) {
            expect(segmentToken(option.id), `${lessonId} ${option.id}`).toBeDefined();
          }
          for (const segment of prompt.sentenceSegments) {
            expect(
              segmentToken(`${targetExampleId}#${segment.id}`),
              `${lessonId} ${targetExampleId}#${segment.id}`,
            ).toBeDefined();
          }
        }
      }
    }
  });

  it("returns undefined for an unknown tile id", () => {
    expect(segmentToken("nope#zz9")).toBeUndefined();
  });
});

describe("exampleTokens — the full ordered token list for an example id", () => {
  it("resolves a real semantic lesson's target example's tokens in segment order", () => {
    const model = getLessonExercises("introductions-1")!;
    const exercise = model.exercises[0]!;
    const tokens = exampleTokens(exercise.targetExampleId);
    expect(tokens).toBeDefined();
    expect(tokens!.length).toBeGreaterThan(0);
    for (const token of tokens!) {
      expect(token.romaji.trim().length).toBeGreaterThan(0);
    }
  });

  it("resolves every phonetic lesson's exercise target tokens, keyed by the item's own id (I1)", () => {
    for (const lessonId of phoneticLessonIds) {
      const items = module1ItemsByLesson[lessonId]!;
      for (const item of items) {
        const tokens = exampleTokens(item.id);
        expect(tokens, `${lessonId} ${item.id}`).toBeDefined();
        expect(tokens!.length).toBeGreaterThan(0);
        for (const token of tokens!) {
          expect(token.romaji.trim().length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("returns undefined for an unknown example id", () => {
    expect(exampleTokens("nope-example")).toBeUndefined();
  });
});
