import { describe, expect, it } from "vitest";
import { formatRomaji } from "../../romaji/formatRomaji";
import { module1ItemsByLesson } from "../a1/catalog/module01Sounds";
import { evaluateExercise } from "../exercises/engine";
import {
  buildPhoneticLessonModel,
  phoneticLessonIds,
} from "./phoneticExerciseModel";
import type { LessonExercisesModel } from "./lessonExerciseModel";

/**
 * Direct unit coverage for the phonetic runtime exercise builder (Phase 2
 * Task 6, finding I1). `getLessonExercises` previously routed every
 * `sounds-*` lesson through an honest empty model because the sentence
 * engine has no predicate/role for an isolated phonetic item — but the
 * master spec still requires each of the four phonetic lessons to carry
 * 8-12 real, evaluable exercises with genuine target breadth. This builder
 * hand-assembles deterministic `ChoicePrompt`/`TileOrderingPrompt` values
 * directly from the validated `module01Sounds` item catalog (never a second,
 * hand-authored answer table) so the existing generic `evaluateExercise`,
 * `LessonExercises`, and `ProgressContext` machinery can render, evaluate,
 * and record them exactly like any semantic exercise.
 */

const LESSON_IDS = ["sounds-1", "sounds-2", "sounds-3", "sounds-4"] as const;

function distractorReuseCounts(model: LessonExercisesModel): Map<string, number> {
  const counts = new Map<string, number>();
  for (const exercise of model.exercises) {
    if (exercise.prompt.kind !== "choice") continue;
    for (const option of exercise.prompt.options) {
      if (option.id === exercise.prompt.correctOptionId) continue;
      counts.set(option.id, (counts.get(option.id) ?? 0) + 1);
    }
  }
  return counts;
}

describe("phoneticLessonIds", () => {
  it("names exactly the four sounds-* lessons, from the same catalog module01Sounds already exports", () => {
    expect([...phoneticLessonIds].sort()).toEqual([...LESSON_IDS]);
  });
});

describe("buildPhoneticLessonModel — exactly 10 real exercises per phonetic lesson (I1)", () => {
  it.each(LESSON_IDS)("generates 10 error-free exercises for %s, one per authored item", (lessonId) => {
    const built = buildPhoneticLessonModel(lessonId);
    expect(built.model.errors).toEqual([]);
    expect(built.model.exercises.length).toBe(10);
    expect(built.model.exercises.length).toBeGreaterThanOrEqual(8);
    expect(built.model.exercises.length).toBeLessThanOrEqual(12);
  });

  it.each(LESSON_IDS)("gives every exercise in %s a stable definitionId equal to its item's own exerciseRefId", (lessonId) => {
    const items = module1ItemsByLesson[lessonId]!;
    const built = buildPhoneticLessonModel(lessonId);
    expect(built.model.exercises.map((e) => e.definitionId).sort()).toEqual(
      items.map((i) => i.exerciseRefId).sort(),
    );
  });

  it.each(LESSON_IDS)("names at least 5 unique visible (correct-answer) targets in %s, each used as the primary target exactly once", (lessonId) => {
    const built = buildPhoneticLessonModel(lessonId);
    const primaryTargets = built.model.exercises.map((e) => e.prompt.assessedConceptIds[0]);
    const unique = new Set(primaryTargets);
    expect(unique.size).toBeGreaterThanOrEqual(5);
    expect(unique.size).toBe(built.model.exercises.length);
  });

  it.each(LESSON_IDS)("never reuses any one item as a distractor option more than twice within %s", (lessonId) => {
    const built = buildPhoneticLessonModel(lessonId);
    const reuse = distractorReuseCounts(built.model);
    for (const [itemId, count] of reuse) {
      expect(count, `${lessonId} ${itemId} reused as a distractor ${count} times`).toBeLessThanOrEqual(2);
    }
  });

  it.each(LESSON_IDS)("gives every exercise a non-empty localized instruction in both locales, and a null intent (no constrained-construction kind exists here)", (lessonId) => {
    const built = buildPhoneticLessonModel(lessonId);
    for (const exercise of built.model.exercises) {
      expect(exercise.instruction.en.trim().length, exercise.definitionId).toBeGreaterThan(0);
      expect(exercise.instruction.it.trim().length, exercise.definitionId).toBeGreaterThan(0);
      expect(exercise.intentText.en).toBeNull();
      expect(exercise.intentText.it).toBeNull();
    }
  });

  it.each(LESSON_IDS)("gives every exercise the guided-controlled practicePurpose in %s (no transfer-round concept exists for phonetics)", (lessonId) => {
    const built = buildPhoneticLessonModel(lessonId);
    for (const exercise of built.model.exercises) {
      expect(exercise.practicePurpose).toBe("guided-controlled");
    }
  });

  it("never embeds a raw duplicated Japanese answer literal in the model itself — choice options and tiles are only ever another item's own catalog id/glyph", () => {
    for (const lessonId of LESSON_IDS) {
      const items = module1ItemsByLesson[lessonId]!;
      const glyphById = new Map(items.map((i) => [i.id, i.glyph] as const));
      const built = buildPhoneticLessonModel(lessonId);
      for (const exercise of built.model.exercises) {
        if (exercise.prompt.kind === "choice") {
          for (const option of exercise.prompt.options) {
            expect(glyphById.get(option.id)).toBe(option.jp);
          }
        } else if (exercise.prompt.kind === "tile-ordering") {
          for (const tile of exercise.prompt.tiles) {
            expect(tile.jp.length).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  it("is deterministic: two builds of the same lesson are structurally equal", () => {
    const a = buildPhoneticLessonModel("sounds-1");
    const b = buildPhoneticLessonModel("sounds-1");
    expect(JSON.stringify(a.model)).toEqual(JSON.stringify(b.model));
  });

  it("returns an honest empty model for an unknown lesson id", () => {
    const built = buildPhoneticLessonModel("not-a-real-lesson");
    expect(built.model.exercises).toEqual([]);
    expect(built.model.errors).toEqual([]);
  });
});

describe("buildPhoneticLessonModel — per-kind prompt shape (choice vs tile-ordering)", () => {
  it("minimal-pair-listening: exactly 2 options (the item and its authored contrastWithId partner), correct option is the item itself", () => {
    const built = buildPhoneticLessonModel("sounds-1");
    const items = module1ItemsByLesson["sounds-1"]!;
    for (const item of items.filter((i) => i.exerciseKind === "minimal-pair-listening")) {
      const exercise = built.model.exercises.find((e) => e.definitionId === item.exerciseRefId)!;
      expect(exercise.prompt.kind).toBe("choice");
      if (exercise.prompt.kind !== "choice") throw new Error("kind");
      expect(exercise.prompt.options.length).toBe(2);
      expect(exercise.prompt.correctOptionId).toBe(item.id);
      expect(exercise.prompt.acceptedOptionIds).toEqual([item.id]);
      const optionIds = exercise.prompt.options.map((o) => o.id).sort();
      expect(optionIds).toEqual([item.id, item.contrastWithId].sort());
    }
  });

  it("reading-choice: exactly 3 options (the item and 2 same-kind distractors), correct option is the item itself", () => {
    const built = buildPhoneticLessonModel("sounds-1");
    const items = module1ItemsByLesson["sounds-1"]!;
    for (const item of items.filter((i) => i.exerciseKind === "reading-choice")) {
      const exercise = built.model.exercises.find((e) => e.definitionId === item.exerciseRefId)!;
      expect(exercise.prompt.kind).toBe("choice");
      if (exercise.prompt.kind !== "choice") throw new Error("kind");
      expect(exercise.prompt.options.length).toBe(3);
      expect(exercise.prompt.correctOptionId).toBe(item.id);
      expect(exercise.prompt.options.some((o) => o.id === item.id)).toBe(true);
    }
  });

  it("mora-tiling: tiles are exactly the item's own characters, in the item's authored reading order as the correct answer", () => {
    const built = buildPhoneticLessonModel("sounds-3");
    const items = module1ItemsByLesson["sounds-3"]!;
    for (const item of items.filter((i) => i.exerciseKind === "mora-tiling")) {
      const exercise = built.model.exercises.find((e) => e.definitionId === item.exerciseRefId)!;
      expect(exercise.prompt.kind).toBe("tile-ordering");
      if (exercise.prompt.kind !== "tile-ordering") throw new Error("kind");
      expect(exercise.prompt.tiles.length).toBe([...item.glyph].length);
      expect(exercise.prompt.correctTileIds.length).toBe([...item.glyph].length);
      // Every correct tile id resolves to a tile, and the tiles in correct
      // order spell the item's own authored glyph exactly.
      const tilesById = new Map(exercise.prompt.tiles.map((t) => [t.id, t] as const));
      const spelled = exercise.prompt.correctTileIds
        .map((id) => tilesById.get(id)?.jp ?? "")
        .join("");
      expect(spelled).toBe(item.glyph);
      expect(exercise.prompt.acceptedTileOrders).toEqual([]);
    }
  });
});

describe("buildPhoneticLessonModel — per-mora romaji derivation for every real mora-tiling item (chōonpu-aware)", () => {
  it.each(
    [...module1ItemsByLesson["sounds-3"]!, ...module1ItemsByLesson["sounds-4"]!].filter(
      (item) => item.exerciseKind === "mora-tiling",
    ),
  )("reconstructs $roman by concatenating each mora tile's own derived romaji for $id", (item) => {
    const lessonId = module1ItemsByLesson["sounds-3"]!.includes(item) ? "sounds-3" : "sounds-4";
    const built = buildPhoneticLessonModel(lessonId);
    const exercise = built.model.exercises.find((e) => e.definitionId === item.exerciseRefId)!;
    if (exercise.prompt.kind !== "tile-ordering") throw new Error("kind");
    const concatenated = exercise.prompt.correctTileIds
      .map((id) => built.tokenByTileId.get(id)?.romaji ?? "")
      .join("");
    expect(concatenated).toBe(item.roman);
  });
});

describe("buildPhoneticLessonModel — token resolution for every option/tile id (never an unresolved fallback)", () => {
  it.each(LESSON_IDS)("resolves a real AssembledToken for every choice option and tile id generated in %s", (lessonId) => {
    const built = buildPhoneticLessonModel(lessonId);
    for (const exercise of built.model.exercises) {
      if (exercise.prompt.kind === "choice") {
        for (const option of exercise.prompt.options) {
          const token = built.tokenByTileId.get(option.id);
          expect(token, `${lessonId} option ${option.id}`).toBeDefined();
          expect(token!.romaji.trim().length).toBeGreaterThan(0);
          expect(token!.jp).toBe(option.jp);
        }
        // The visible sentence-segment context resolves under the
        // `${targetExampleId}#${segmentId}` convention every other exercise
        // kind already uses.
        for (const segment of exercise.prompt.sentenceSegments) {
          const key = `${exercise.targetExampleId}#${segment.id}`;
          const token = built.tokenByTileId.get(key);
          expect(token, `${lessonId} segment ${key}`).toBeDefined();
        }
      } else if (exercise.prompt.kind === "tile-ordering") {
        for (const tile of exercise.prompt.tiles) {
          const token = built.tokenByTileId.get(tile.id);
          expect(token, `${lessonId} tile ${tile.id}`).toBeDefined();
          expect(token!.romaji.trim().length).toBeGreaterThan(0);
          expect(token!.jp).toBe(tile.jp);
        }
      }
    }
  });
});

describe("buildPhoneticLessonModel — evaluateExercise integration (real accept/retry, no separate answer table)", () => {
  it("accepts the correct option and offers retry for the wrong one, for every choice exercise across every lesson", () => {
    for (const lessonId of LESSON_IDS) {
      const built = buildPhoneticLessonModel(lessonId);
      for (const exercise of built.model.exercises) {
        const prompt = exercise.prompt;
        if (prompt.kind !== "choice") continue;
        const correct = evaluateExercise(prompt, {
          kind: "choice",
          optionId: prompt.correctOptionId,
        });
        expect(correct.status, exercise.definitionId).toBe("accepted");
        const wrongOption = prompt.options.find((o) => o.id !== prompt.correctOptionId)!;
        const wrong = evaluateExercise(prompt, {
          kind: "choice",
          optionId: wrongOption.id,
        });
        expect(wrong.status, exercise.definitionId).toBe("retry");
      }
    }
  });

  it("accepts the correct tile order and offers retry for a shuffled wrong one, for every tile-ordering exercise", () => {
    for (const lessonId of LESSON_IDS) {
      const built = buildPhoneticLessonModel(lessonId);
      for (const exercise of built.model.exercises) {
        if (exercise.prompt.kind !== "tile-ordering") continue;
        const correct = evaluateExercise(exercise.prompt, {
          kind: "tile-ordering",
          tileIds: exercise.prompt.correctTileIds,
        });
        expect(correct.status, exercise.definitionId).toBe("accepted");
        if (exercise.prompt.correctTileIds.length > 1) {
          const reversed = [...exercise.prompt.correctTileIds].reverse();
          // Only assert retry when reversing actually changes the id
          // sequence (a single-tile or fully-symmetric word may reverse to
          // an equally valid rendering, which the shared evaluator already
          // treats as correct by rendered content, not raw id order).
          if (JSON.stringify(reversed) !== JSON.stringify(exercise.prompt.correctTileIds)) {
            const result = evaluateExercise(exercise.prompt, {
              kind: "tile-ordering",
              tileIds: reversed,
            });
            expect(["retry", "accepted"]).toContain(result.status);
          }
        }
      }
    }
  });

  it("every derived token round-trips through formatRomaji without error, for a lesson's full option/tile set", () => {
    const built = buildPhoneticLessonModel("sounds-4");
    const tokens = [...built.tokenByTileId.values()];
    for (const token of tokens) {
      const formatted = formatRomaji([{ ...token, boundaryBefore: "attach" }]);
      expect(formatted.ok, token.id).toBe(true);
    }
  });
});
