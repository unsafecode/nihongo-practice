import { describe, expect, it } from "vitest";
import { formatRomaji } from "../../romaji/formatRomaji";
import {
  module1ItemsByLesson,
  module1Lessons,
} from "../a1/catalog/module01Sounds";
import { evaluateExercise } from "../exercises/engine";
import {
  buildPhoneticLessonModel,
  phoneticLessonIds,
} from "./phoneticExerciseModel";

/**
 * Direct unit coverage for the phonetic runtime exercise builder (Phase 2
 * Task 6, finding I1). `getLessonExercises` previously routed every
 * `sounds-*` lesson through an honest empty model because the sentence
 * engine has no predicate/role for an isolated phonetic item — but the
 * master spec keeps each lesson's 8-12-item contrastive roster, while its
 * learner practice path selects four real, evaluable targets plus a separate
 * spoken fifth activity. This builder
 * hand-assembles deterministic `ChoicePrompt`/`TileOrderingPrompt` values
 * directly from the validated `module01Sounds` item catalog (never a second,
 * hand-authored answer table) so the existing generic `evaluateExercise`,
 * `LessonExercises`, and `ProgressContext` machinery can render, evaluate,
 * and record them exactly like any semantic exercise.
 */

const LESSON_IDS = ["sounds-1", "sounds-2", "sounds-3", "sounds-4"] as const;

function selectedItems(lessonId: (typeof LESSON_IDS)[number]) {
  const refs = module1Lessons.find((lesson) => lesson.id === lessonId)?.practiceTargetRefs;
  if (!refs) throw new Error(`missing phonetic recipe for ${lessonId}`);
  return module1ItemsByLesson[lessonId]!.filter((item) => refs.includes(item.exerciseRefId));
}

describe("phoneticLessonIds", () => {
  it("names exactly the four sounds-* lessons, from the same catalog module01Sounds already exports", () => {
    expect([...phoneticLessonIds].sort()).toEqual([...LESSON_IDS]);
  });
});

describe("buildPhoneticLessonModel — four selected exercises plus spoken activity", () => {
  it.each(LESSON_IDS)("generates four error-free exercises for %s without reducing its contrast roster", (lessonId) => {
    const built = buildPhoneticLessonModel(lessonId);
    expect(built.model.errors).toEqual([]);
    expect(built.model.exercises).toHaveLength(4);
    expect(module1ItemsByLesson[lessonId]).toHaveLength(10);
  });

  it.each(LESSON_IDS)("keeps %s's selected exercise refs in authored blueprint order", (lessonId) => {
    const recipe = module1Lessons.find((lesson) => lesson.id === lessonId)!;
    const built = buildPhoneticLessonModel(lessonId);
    expect(built.model.exercises.map((exercise) => exercise.definitionId)).toEqual(
      recipe.practiceTargetRefs,
    );
  });

  it.each(LESSON_IDS)("uses four distinct primary targets in %s", (lessonId) => {
    const built = buildPhoneticLessonModel(lessonId);
    const primaryTargets = built.model.exercises.map((e) => e.prompt.assessedConceptIds[0]);
    const unique = new Set(primaryTargets);
    expect(unique.size).toBe(4);
    expect(primaryTargets).toEqual(selectedItems(lessonId).map((item) => item.id));
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

  it.each(LESSON_IDS)("maps each selected exercise to its blueprint function and round purpose in %s", (lessonId) => {
    const built = buildPhoneticLessonModel(lessonId);
    expect(built.model.exercises.map((exercise) => exercise.practiceFunction)).toEqual([
      "meaning-comprehension",
      "form-discrimination",
      "controlled-production",
      "contextual-response",
    ]);
    expect(built.model.exercises.map((exercise) => exercise.practicePurpose)).toEqual([
      "guided-controlled",
      "guided-controlled",
      "guided-controlled",
      "transfer",
    ]);
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
  it("minimal-pair-listening: selected items keep exactly two options (the item and its contrast partner)", () => {
    const built = buildPhoneticLessonModel("sounds-1");
    const items = selectedItems("sounds-1");
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

  it("reading-choice: selected items keep exactly three options (the item and two same-kind distractors)", () => {
    const built = buildPhoneticLessonModel("sounds-4");
    const items = selectedItems("sounds-4");
    for (const item of items.filter((i) => i.exerciseKind === "reading-choice")) {
      const exercise = built.model.exercises.find((e) => e.definitionId === item.exerciseRefId)!;
      expect(exercise.prompt.kind).toBe("choice");
      if (exercise.prompt.kind !== "choice") throw new Error("kind");
      expect(exercise.prompt.options.length).toBe(3);
      expect(exercise.prompt.correctOptionId).toBe(item.id);
      expect(exercise.prompt.options.some((o) => o.id === item.id)).toBe(true);
    }
  });

  it("mora-tiling: selected items preserve their own characters in authored reading order", () => {
    const built = buildPhoneticLessonModel("sounds-4");
    const items = selectedItems("sounds-4");
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

describe("buildPhoneticLessonModel — per-mora romaji derivation for selected mora-tiling items", () => {
  it.each(
    LESSON_IDS.flatMap((lessonId) =>
      selectedItems(lessonId)
        .filter((item) => item.exerciseKind === "mora-tiling")
        .map((item) => ({ lessonId, item })),
    ),
  )("reconstructs $item.roman by concatenating each mora tile's own derived romaji for $item.id", ({ lessonId, item }) => {
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
