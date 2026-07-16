import { describe, expect, it } from "vitest";
import { courseModules } from "../data/course";
import { exerciseIdsByLesson } from "../catalog/exercises";
import {
  exerciseInstructionCopy,
  getLessonExercises,
  segmentRomaji,
} from "./lessonExerciseModel";

/**
 * The pure lesson-exercise model (Slice C plan Task 4, design spec §10.1). It
 * resolves a lesson's authored exercise definitions into deterministic engine
 * prompts and exposes the derived romaji + localized instruction copy the UI
 * needs — never reconstructing a canonical answer in the component layer.
 */

const allLessonIds = courseModules.flatMap((m) => m.lessons.map((l) => l.id));

describe("getLessonExercises — deterministic prompt generation for every lesson", () => {
  it("generates 3-5 prompts with no generation errors for every published lesson", () => {
    for (const lessonId of allLessonIds) {
      const model = getLessonExercises(lessonId);
      expect(model, `model for ${lessonId}`).toBeDefined();
      expect(model!.errors, `errors for ${lessonId}`).toEqual([]);
      expect(model!.exercises.length, `count for ${lessonId}`).toBeGreaterThanOrEqual(3);
      expect(model!.exercises.length).toBeLessThanOrEqual(5);
    }
  });

  it("preserves the authored exercise order and definition ids for a lesson", () => {
    const model = getLessonExercises("introductions-1");
    expect(model!.exercises.map((e) => e.definitionId)).toEqual([
      ...(exerciseIdsByLesson.get("introductions-1") ?? []),
    ]);
  });

  it("covers all five exercise kinds across the course", () => {
    const kinds = new Set<string>();
    for (const lessonId of allLessonIds) {
      for (const exercise of getLessonExercises(lessonId)!.exercises) {
        kinds.add(exercise.prompt.kind);
      }
    }
    expect([...kinds].sort()).toEqual(
      [
        "choice",
        "completion",
        "constrained-construction",
        "tile-ordering",
        "transformation",
      ].sort(),
    );
  });

  it("is deterministic: two builds of the same lesson are structurally equal", () => {
    const a = getLessonExercises("past-negative-1");
    const b = getLessonExercises("past-negative-1");
    expect(JSON.stringify(a)).toEqual(JSON.stringify(b));
  });

  it("returns undefined for an unknown lesson id", () => {
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
});

describe("segmentRomaji — derived romaji for a tile/option id", () => {
  it("resolves the romaji of a shared example segment by tile id", () => {
    const model = getLessonExercises("introductions-1")!;
    const tileExercise = model.exercises.find((e) => e.prompt.kind === "tile-ordering");
    expect(tileExercise).toBeDefined();
    if (tileExercise && tileExercise.prompt.kind === "tile-ordering") {
      for (const tile of tileExercise.prompt.tiles) {
        expect(segmentRomaji(tile.id), `romaji for ${tile.id}`).toBeTruthy();
      }
    }
  });

  it("returns undefined for an unknown tile id", () => {
    expect(segmentRomaji("nope#zz9")).toBeUndefined();
  });
});

describe("exerciseInstructionCopy — localized instruction/intent resolution", () => {
  it("resolves the localized instruction for a prompt copy id in both locales", () => {
    const model = getLessonExercises("introductions-1")!;
    for (const exercise of model.exercises) {
      const en = exerciseInstructionCopy("en", exercise.prompt.promptCopyId);
      const it = exerciseInstructionCopy("it", exercise.prompt.promptCopyId);
      expect(en?.trim()).toBeTruthy();
      expect(it?.trim()).toBeTruthy();
    }
  });

  it("resolves a constrained-construction intent (an example translation) per locale", () => {
    const model = getLessonExercises("introductions-1")!;
    const construct = model.exercises.find(
      (e) => e.prompt.kind === "constrained-construction",
    );
    expect(construct).toBeDefined();
    if (construct && construct.prompt.kind === "constrained-construction") {
      expect(exerciseInstructionCopy("en", construct.prompt.intentCopyId)?.trim()).toBeTruthy();
      expect(exerciseInstructionCopy("it", construct.prompt.intentCopyId)?.trim()).toBeTruthy();
    }
  });

  it("returns undefined for an unknown copy id", () => {
    expect(exerciseInstructionCopy("en", "exercise.prompt.nope")).toBeUndefined();
  });
});
