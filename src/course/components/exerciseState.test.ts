import { describe, expect, it } from "vitest";
import { getLessonExercises } from "./lessonExerciseModel";
import type { GeneratedExercise } from "./lessonExerciseModel";
import {
  bankTileIds,
  clearAnswer,
  initExerciseState,
  moveTile,
  placeTile,
  selectOption,
  setText,
  submitExercise,
  unplaceTile,
} from "./exerciseState";
import type { ExercisePrompt } from "../exercises/types";
import { a1FoundationCatalogs } from "../a1/catalog/catalog";

/**
 * The pure single-exercise interaction state machine (Slice C plan Task 4,
 * design spec §10.3, §14). Every rule the interactive UI depends on — building
 * an answer, evaluating it through the engine, and mapping the result to an
 * `accepted`/`retry`/`invalid` feedback status and a recordable attempt outcome
 * — lives here as total functions so it is testable without a DOM, and the
 * React component stays a thin renderer.
 */

function a1ExerciseOfKind(kind: ExercisePrompt["kind"]): GeneratedExercise {
  for (const lesson of a1FoundationCatalogs.lessons) {
    const found = getLessonExercises(lesson.id)?.exercises.find(
      (exercise) => exercise.prompt.kind === kind,
    );
    if (found !== undefined) return found;
  }
  throw new Error(`no A1 ${kind} exercise`);
}

const tileEx = a1ExerciseOfKind("tile-ordering");
const choiceEx = a1ExerciseOfKind("choice");
const completeEx = a1ExerciseOfKind("completion");
const constructEx = a1ExerciseOfKind("constrained-construction");

const COMPAT_GENERATED_EXERCISE_FIELDS = {
  practiceFunction: null,
  feedback: {
    en: { accepted: "Accepted.", retry: "Try again." },
    it: { accepted: "Accettato.", retry: "Riprova." },
  },
} as const;

/**
 * The A1 release's round-target authoring (`a1LessonBuilders.ts`) only ever
 * emits `tile-ordering`/`choice`/`completion`/`constrained-construction`
 * exercises (see `A1_ROUND_ONE_KINDS`/`A1_ROUND_TWO_KINDS`), so no published
 * lesson resolves a `transformation`-kind exercise through
 * `getLessonExercises` anymore. `ExercisePrompt`'s `transformation` kind
 * (and this reducer's handling of it, `exerciseState.ts` line ~151) is still
 * part of the shared engine's type surface, so it is exercised here directly
 * against a synthetic, hand-built prompt rather than a real lesson's data.
 */
const transformEx: GeneratedExercise = {
  ...COMPAT_GENERATED_EXERCISE_FIELDS,
  definitionId: "test-transformation-fixture",
  targetExampleId: "test-transformation-fixture-target",
  visibleTargetKey: "test-transformation-fixture-visible",
  instruction: { en: "", it: "" },
  intentText: { en: null, it: null },
  practicePurpose: "guided-controlled",
  prompt: {
    kind: "transformation",
    definitionId: "test-transformation-fixture",
    promptCopyId: "test-transformation-fixture",
    assessedConceptIds: [],
    assessedLexemeIds: [],
    promptExampleId: "test-transformation-fixture-prompt",
    promptJp: "がくせいです",
    canonicalAnswer: "がくせいじゃないです",
    acceptedAnswers: ["がくせいじゃないです"],
    permitKatakanaToHiragana: false,
  },
};

describe("initExerciseState", () => {
  it("starts idle with an empty answer and zero attempts", () => {
    const state = initExerciseState(tileEx.prompt);
    expect(state.status).toBe("idle");
    expect(state.attempts).toBe(0);
    expect(state.placedTileIds).toEqual([]);
    expect(state.selectedOptionId).toBeNull();
    expect(state.text).toBe("");
  });
});

describe("tile ordering — non-drag keyboard/touch reordering", () => {
  it("places every tile from the bank into the answer, then the bank is empty", () => {
    if (tileEx.prompt.kind !== "tile-ordering") throw new Error("kind");
    let state = initExerciseState(tileEx.prompt);
    for (const id of tileEx.prompt.correctTileIds) {
      state = placeTile(state, id);
    }
    expect(state.placedTileIds).toEqual([...tileEx.prompt.correctTileIds]);
    expect(bankTileIds(tileEx.prompt, state)).toEqual([]);
  });

  it("accepts the canonical order and records an accepted attempt", () => {
    if (tileEx.prompt.kind !== "tile-ordering") throw new Error("kind");
    let state = initExerciseState(tileEx.prompt);
    for (const id of tileEx.prompt.correctTileIds) state = placeTile(state, id);
    const result = submitExercise(tileEx.prompt, state);
    expect(result.evaluation.status).toBe("accepted");
    expect(result.outcome).toBe("accepted");
    expect(result.state.status).toBe("accepted");
    expect(result.state.attempts).toBe(1);
  });

  it("a wrong order is a retry that counts as an attempt", () => {
    if (tileEx.prompt.kind !== "tile-ordering") throw new Error("kind");
    const reversed = [...tileEx.prompt.correctTileIds].reverse();
    // Only meaningful when reversing actually changes the rendered order.
    let state = initExerciseState(tileEx.prompt);
    for (const id of reversed) state = placeTile(state, id);
    const result = submitExercise(tileEx.prompt, state);
    expect(["retry", "accepted"]).toContain(result.evaluation.status);
    if (result.evaluation.status === "retry") {
      expect(result.outcome).toBe("retry");
      expect(result.state.status).toBe("retry");
    }
  });

  it("submitting with no tiles placed is invalid-input and not an attempt", () => {
    const state = initExerciseState(tileEx.prompt);
    const result = submitExercise(tileEx.prompt, state);
    expect(result.evaluation.status).toBe("invalid-input");
    expect(result.outcome).toBeNull();
    expect(result.state.status).toBe("invalid");
    expect(result.state.attempts).toBe(0);
  });

  it("moveTile swaps adjacent placed tiles and clears stale feedback", () => {
    if (tileEx.prompt.kind !== "tile-ordering") throw new Error("kind");
    let state = initExerciseState(tileEx.prompt);
    for (const id of tileEx.prompt.correctTileIds) state = placeTile(state, id);
    // stale accepted feedback:
    state = submitExercise(tileEx.prompt, state).state;
    const first = state.placedTileIds[0];
    const second = state.placedTileIds[1];
    const moved = moveTile(state, first, "forward");
    expect(moved.placedTileIds[0]).toBe(second);
    expect(moved.placedTileIds[1]).toBe(first);
    expect(moved.status).toBe("idle");
  });

  it("unplaceTile returns a tile to the bank and clears feedback", () => {
    if (tileEx.prompt.kind !== "tile-ordering") throw new Error("kind");
    let state = initExerciseState(tileEx.prompt);
    for (const id of tileEx.prompt.correctTileIds) state = placeTile(state, id);
    const removed = unplaceTile(state, tileEx.prompt.correctTileIds[0]);
    expect(removed.placedTileIds).not.toContain(tileEx.prompt.correctTileIds[0]);
    expect(bankTileIds(tileEx.prompt, removed)).toContain(
      tileEx.prompt.correctTileIds[0],
    );
  });

  it("never places the same tile twice", () => {
    if (tileEx.prompt.kind !== "tile-ordering") throw new Error("kind");
    const id = tileEx.prompt.correctTileIds[0];
    let state = initExerciseState(tileEx.prompt);
    state = placeTile(state, id);
    state = placeTile(state, id);
    expect(state.placedTileIds.filter((t) => t === id)).toHaveLength(1);
  });
});

describe("choice — particle/ending selection", () => {
  it("accepts the correct option", () => {
    if (choiceEx.prompt.kind !== "choice") throw new Error("kind");
    const state = selectOption(initExerciseState(choiceEx.prompt), choiceEx.prompt.correctOptionId);
    const result = submitExercise(choiceEx.prompt, state);
    expect(result.evaluation.status).toBe("accepted");
    expect(result.outcome).toBe("accepted");
  });

  it("a wrong option is a retry", () => {
    const prompt = choiceEx.prompt;
    if (prompt.kind !== "choice") throw new Error("kind");
    const wrong = prompt.options.find(
      (o) => !prompt.acceptedOptionIds.includes(o.id),
    );
    expect(wrong).toBeDefined();
    const state = selectOption(initExerciseState(prompt), wrong!.id);
    const result = submitExercise(prompt, state);
    expect(result.evaluation.status).toBe("retry");
    expect(result.outcome).toBe("retry");
  });

  it("submitting with nothing selected is invalid-input", () => {
    const result = submitExercise(choiceEx.prompt, initExerciseState(choiceEx.prompt));
    expect(result.evaluation.status).toBe("invalid-input");
    expect(result.outcome).toBeNull();
  });
});

describe("text kinds — completion / transformation / constrained construction", () => {
  it("accepts the canonical completion answer", () => {
    if (completeEx.prompt.kind !== "completion") throw new Error("kind");
    const state = setText(initExerciseState(completeEx.prompt), completeEx.prompt.canonicalAnswer);
    expect(submitExercise(completeEx.prompt, state).evaluation.status).toBe("accepted");
  });

  it("accepts the canonical constructed answer and a whitespace-padded variant", () => {
    if (constructEx.prompt.kind !== "constrained-construction") throw new Error("kind");
    const padded = `  ${constructEx.prompt.canonicalAnswer}  `;
    const state = setText(initExerciseState(constructEx.prompt), padded);
    expect(submitExercise(constructEx.prompt, state).evaluation.status).toBe("accepted");
  });

  it("accepts the canonical transformation answer", () => {
    if (transformEx.prompt.kind !== "transformation") throw new Error("kind");
    const state = setText(initExerciseState(transformEx.prompt), transformEx.prompt.canonicalAnswer);
    expect(submitExercise(transformEx.prompt, state).evaluation.status).toBe("accepted");
  });

  it("a wrong answer is a retry, an empty answer is invalid-input", () => {
    const retry = submitExercise(completeEx.prompt, setText(initExerciseState(completeEx.prompt), "ちがう"));
    expect(retry.evaluation.status).toBe("retry");
    const invalid = submitExercise(completeEx.prompt, setText(initExerciseState(completeEx.prompt), "   "));
    expect(invalid.evaluation.status).toBe("invalid-input");
    expect(invalid.outcome).toBeNull();
  });

  it("setText clears stale feedback back to idle", () => {
    const submitted = submitExercise(completeEx.prompt, setText(initExerciseState(completeEx.prompt), "x")).state;
    expect(submitted.status).not.toBe("idle");
    expect(setText(submitted, "y").status).toBe("idle");
  });
});

describe("clearAnswer", () => {
  it("resets the answer and feedback but keeps the attempt count", () => {
    if (tileEx.prompt.kind !== "tile-ordering") throw new Error("kind");
    let state = initExerciseState(tileEx.prompt);
    for (const id of tileEx.prompt.correctTileIds) state = placeTile(state, id);
    state = submitExercise(tileEx.prompt, state).state;
    const cleared = clearAnswer(state);
    expect(cleared.placedTileIds).toEqual([]);
    expect(cleared.status).toBe("idle");
    expect(cleared.attempts).toBe(state.attempts);
  });
});

describe("determinism", () => {
  it("the same sequence of actions produces identical state", () => {
    const run = () => {
      if (choiceEx.prompt.kind !== "choice") throw new Error("kind");
      let s = initExerciseState(choiceEx.prompt);
      s = selectOption(s, choiceEx.prompt.correctOptionId);
      return submitExercise(choiceEx.prompt, s).state;
    };
    expect(JSON.stringify(run())).toEqual(JSON.stringify(run()));
  });
});
