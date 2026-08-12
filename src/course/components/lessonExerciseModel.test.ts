import { describe, expect, it } from "vitest";
import { a1FoundationCatalogs } from "../a1/catalog/catalog";
import { buildA1LessonViewModel } from "../a1/a1LessonViewModel";
// These historical paths cover every published A1 route, including the
// twenty Base rehomed in Task 16.
import { legacyA1LessonContentById as a1LessonContentById } from "../a1/curriculum/catalog";
import {
  module1ItemsByLesson,
  module1Lessons,
} from "../a1/catalog/module01Sounds";
import { A2_LESSON_IDS } from "../a2/manifest";
import { A1_LESSON_IDS } from "../a1/manifest";
import { buildA2FoundationViewModel } from "../a2/view/buildA2LessonViewModel";
import { courseModulesByLevel, legacyA1CourseModules } from "../data/course";
import {
  exampleTokens,
  getLessonExercises,
  segmentToken,
} from "./lessonExerciseModel";

/**
 * The pure lesson-exercise model (Phase 2 Task 6; design spec §10.1). It
 * resolves the A1 release's 60 semantic lessons' authored practice targets
 * into deterministic engine prompts, and separately resolves each of the
 * four phonetic (`sounds-*`) lessons' four selected `A1PhoneticItem`s into
 * deterministic choice/tile-ordering prompts plus their separate spoken
 * blueprint activity — exposing the derived
 * romaji + per-locale instruction/intent copy the UI needs without ever
 * reconstructing a canonical answer in the component layer.
 */

const allLessonIds = legacyA1CourseModules.flatMap((module) =>
  module.lessons.map((lesson) => lesson.id),
);
const semanticLessonIds = new Set(
  a1FoundationCatalogs.lessons.map((lesson) => lesson.id),
);
// Only the four `sounds-*` routes are phonetic. Task 16 also moved the four
// Foundations modules out of A1's semantic catalog and into Base, so "not in
// the A1 semantic catalog" no longer implies "phonetic".
const phoneticLessonIds = allLessonIds.filter((id) => id.startsWith("sounds-"));
const rehomedSemanticLessonIds = allLessonIds.filter(
  (id) => !semanticLessonIds.has(id) && !id.startsWith("sounds-"),
);

describe("getLessonExercises — deterministic prompt generation for every semantic lesson", () => {
  it("generates the four blueprint-selected prompts with no errors for every semantic lesson", () => {
    for (const lessonId of semanticLessonIds) {
      const model = getLessonExercises(lessonId);
      expect(model, `model for ${lessonId}`).toBeDefined();
      expect(model!.errors, `errors for ${lessonId}`).toEqual([]);
      expect(model!.exercises, `count for ${lessonId}`).toHaveLength(4);
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

  it("generates exactly four error-free runtime exercises for every phonetic (sounds-*) lesson", () => {
    expect(phoneticLessonIds.length).toBe(4);
    for (const lessonId of phoneticLessonIds) {
      const model = getLessonExercises(lessonId);
      expect(model, `model for ${lessonId}`).toBeDefined();
      expect(model!.errors, `errors for ${lessonId}`).toEqual([]);
      expect(model!.exercises.length, `count for ${lessonId}`).toBe(4);
    }
  });

  it("uses the four ordered phonetic practice refs without reducing the 10-item roster", () => {
    for (const lessonId of phoneticLessonIds) {
      const items = module1ItemsByLesson[lessonId]!;
      const recipe = module1Lessons.find((lesson) => lesson.id === lessonId)!;
      const model = getLessonExercises(lessonId)!;
      expect(items).toHaveLength(10);
      expect(model.exercises.map((exercise) => exercise.definitionId)).toEqual(
        recipe.practiceTargetRefs,
      );
      const targets = new Set(model.exercises.map((e) => e.prompt.assessedConceptIds[0]));
      expect(targets.size).toBe(4);
    }
  });

  it("carries phonetic blueprint functions, round purposes, and null intents", () => {
    for (const lessonId of phoneticLessonIds) {
      const model = getLessonExercises(lessonId)!;
      expect(model.exercises.map((exercise) => exercise.practiceFunction)).toEqual([
        "meaning-comprehension",
        "form-discrimination",
        "controlled-production",
        "contextual-response",
      ]);
      expect(model.exercises.map((exercise) => exercise.practicePurpose)).toEqual([
        "guided-controlled",
        "guided-controlled",
        "guided-controlled",
        "transfer",
      ]);
      for (const exercise of model.exercises) {
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

  it("maps every semantic lesson's four generated exercises to its exact blueprint functions and target order", () => {
    for (const lessonId of semanticLessonIds) {
      const content = a1LessonContentById[lessonId]!;
      const built = buildA1LessonViewModel(lessonId, "en");
      if (!built.ok) throw new Error(`expected A1 foundation model for ${lessonId}`);
      const expected = content.practiceBlueprint.activities
        .filter((activity) => activity.interactionKind !== "spoken")
        .map((activity) => {
          if ("spokenVariantId" in activity.targetRef) throw new Error("unexpected spoken target");
          const round =
            activity.targetRef.round === "one"
              ? built.model.rounds[0]
              : built.model.rounds[1];
          const target = round.targets[activity.targetRef.index];
          if (!target) throw new Error(`missing target for ${lessonId}`);
          return {
            definitionId: target.targetId,
            function: activity.function,
            kind: activity.interactionKind,
          };
        });
      expect(
        getLessonExercises(lessonId)!.exercises.map((exercise) => ({
          definitionId: exercise.definitionId,
          function: exercise.practiceFunction,
          kind: exercise.prompt.kind,
        })),
        lessonId,
      ).toEqual(expected);
    }
  });

  it("orders A1 semantic exercises by the authored practice blueprint rather than raw round order", () => {
    const built = buildA1LessonViewModel("introductions-1", "en");
    if (!built.ok) throw new Error("expected ok");
    const content = a1LessonContentById["introductions-1"]!;
    const expectedIds = content.practiceBlueprint.activities
      .filter((activity) => activity.interactionKind !== "spoken")
      .map((activity) => {
        if ("spokenVariantId" in activity.targetRef) throw new Error("unexpected spoken target");
        const round =
          activity.targetRef.round === "one"
            ? built.model.rounds[0]
            : built.model.rounds[1];
        return round.targets[activity.targetRef.index]?.targetId;
      });
    const model = getLessonExercises("introductions-1")!;
    expect(model.exercises.map((e) => e.definitionId)).toEqual(expectedIds);
    expect(model.exercises.map((exercise) => exercise.practiceFunction)).toEqual(
      content.practiceBlueprint.activities
        .filter((activity) => activity.interactionKind !== "spoken")
        .map((activity) => activity.function),
    );
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

  it("returns undefined for an unknown lesson id (not one of the 64 published lessons)", () => {
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

  it("gives every A1 exercise localized explanatory feedback without embedding its canonical target", () => {
    for (const lessonId of allLessonIds) {
      const model = getLessonExercises(lessonId)!;
      for (const exercise of model.exercises) {
        expect(exercise.practiceFunction, `${lessonId} ${exercise.definitionId}`).not.toBeNull();
        for (const locale of ["en", "it"] as const) {
          expect(exercise.feedback[locale].accepted.trim()).not.toBe("");
          expect(exercise.feedback[locale].retry.trim()).not.toBe("");
          expect(exercise.feedback[locale].accepted).not.toContain(exercise.visibleTargetKey);
          expect(exercise.feedback[locale].retry).not.toContain(exercise.visibleTargetKey);
        }
      }
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
      const selectedRefs = module1Lessons.find(
        (lesson) => lesson.id === lessonId,
      )!.practiceTargetRefs;
      for (const item of items.filter((item) => selectedRefs.includes(item.exerciseRefId))) {
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

/**
 * Phase 3 Task 8: the same deterministic exercise model now also resolves the
 * 60 A2 lessons (from `buildA2FoundationViewModel`), so the shared
 * `LessonExercises` component renders A2 rounds without a fork. A1 and A2
 * lesson id namespaces are disjoint, so a single `getLessonExercises` lookup
 * serves both levels.
 */
describe("getLessonExercises — A2 lessons resolve through the same model", () => {
  it("generates exactly ten error-free exercise prompts for every A2 lesson", () => {
    for (const lessonId of A2_LESSON_IDS) {
      const model = getLessonExercises(lessonId);
      expect(model, `model for ${lessonId}`).toBeDefined();
      expect(model!.errors, `errors for ${lessonId}`).toEqual([]);
      expect(model!.exercises.length, `count for ${lessonId}`).toBe(10);
    }
  });

  it("matches the A2 release builder's exact round-1 + round-2 target count for a sample", () => {
    for (const lessonId of ["sequencing-ongoing-3", "plans-invitations-1", "a2-synthesis-4"]) {
      const built = buildA2FoundationViewModel(lessonId, "en");
      if (!built.ok) throw new Error(`expected ok for ${lessonId}`);
      const expectedCount = built.model.rounds.reduce(
        (total, round) => total + round.targets.length,
        0,
      );
      expect(getLessonExercises(lessonId)!.exercises).toHaveLength(expectedCount);
    }
  });

  it("keeps A2 target order, ids, prompts, instruction, and intent unchanged while leaving A1-only fields null", () => {
    for (const lessonId of ["sequencing-ongoing-3", "plans-invitations-1", "a2-synthesis-4"]) {
      const en = buildA2FoundationViewModel(lessonId, "en");
      const it = buildA2FoundationViewModel(lessonId, "it");
      if (!en.ok || !it.ok) throw new Error(`expected A2 foundation model for ${lessonId}`);
      const expected = en.model.rounds.flatMap((round, roundIndex) =>
        round.targets.map((target, targetIndex) => {
          const italian = it.model.rounds[roundIndex]!.targets[targetIndex]!;
          return {
            definitionId: target.targetId,
            targetExampleId: target.targetExampleId,
            prompt: target.prompt,
            instruction: { en: target.instruction, it: italian.instruction },
            intentText: { en: target.intentText, it: italian.intentText },
            practicePurpose: round.purpose,
            visibleTargetKey: target.visibleTargetKey,
          };
        }),
      );
      const actual = getLessonExercises(lessonId)!.exercises.map((exercise) => ({
        definitionId: exercise.definitionId,
        targetExampleId: exercise.targetExampleId,
        prompt: exercise.prompt,
        instruction: exercise.instruction,
        intentText: exercise.intentText,
        practicePurpose: exercise.practicePurpose,
        visibleTargetKey: exercise.visibleTargetKey,
      }));
      expect(actual).toEqual(expected);
      for (const exercise of getLessonExercises(lessonId)!.exercises) {
        expect(exercise.practiceFunction).toBeNull();
      }
    }
  });

  it("resolves in-sentence tokens for an A2 exercise so its romaji renders from real tokens", () => {
    const model = getLessonExercises("sequencing-ongoing-3");
    expect(model).toBeDefined();
    const withExample = model!.exercises.find(
      (exercise) => exampleTokens(exercise.targetExampleId) !== undefined,
    );
    expect(withExample, "at least one A2 exercise resolves its example tokens").toBeDefined();
  });
});

describe("getLessonExercises — complete release coverage", () => {
  it("returns error-free generated exercise models for every A1-owned and A2 route", () => {
    const a1RouteIds = legacyA1CourseModules.flatMap((module) =>
      module.lessons.map((lesson) => lesson.id),
    );
    const a2RouteIds = courseModulesByLevel.a2.flatMap((module) =>
      module.lessons.map((lesson) => lesson.id),
    );
    // Task 16: the sixteen Foundations routes are Base's, and Base's own
    // exercise model serves them; this A1 model must not. The four phonetic
    // routes stay resolvable here through the historical legacy path.
    const a1OwnedRouteIds = a1RouteIds.filter(
      (lessonId) => !rehomedSemanticLessonIds.includes(lessonId),
    );
    const allRouteIds = [...a1OwnedRouteIds, ...a2RouteIds];

    expect(a1RouteIds).toEqual(A1_LESSON_IDS);
    expect(a2RouteIds).toEqual(A2_LESSON_IDS);
    expect(allLessonIds).toEqual(A1_LESSON_IDS);
    expect(allLessonIds).toHaveLength(64);
    expect(rehomedSemanticLessonIds).toHaveLength(16);
    expect(a1OwnedRouteIds).toHaveLength(48);
    expect(a2RouteIds).toHaveLength(60);
    expect(allRouteIds).toHaveLength(108);
    for (const lessonId of allRouteIds) {
      const model = getLessonExercises(lessonId);
      expect(model, lessonId).toBeDefined();
      expect(model?.errors, lessonId).toEqual([]);
      expect(model?.exercises, lessonId).toHaveLength(
        A1_LESSON_IDS.includes(lessonId) ? 4 : 10,
      );
    }
  });
});
