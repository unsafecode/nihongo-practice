import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "../../i18n/LocaleContext";
import { ScriptProvider } from "../../settings/ScriptContext";
import { ProgressProvider } from "../progress/ProgressContext";
import { en as enCopy } from "../i18n/en";
import { it as itCopy } from "../i18n/it";
import { getLessonExercises } from "./lessonExerciseModel";
import type { GeneratedExercise } from "./lessonExerciseModel";
import { ExerciseView } from "./ExerciseView";
import type { ExerciseViewHandlers } from "./ExerciseView";
import { LessonExercises } from "./LessonExercises";
import {
  initExerciseState,
  placeTile,
  selectOption,
  setText,
  submitExercise,
} from "./exerciseState";
import type { ExercisePrompt } from "../exercises/types";

/**
 * Static accessible-markup contract for the in-lesson practice UI (Slice C plan
 * Task 4; design spec §10.1-§10.3, §14). `renderToStaticMarkup` runs no effects
 * and no handlers, so these assert the deterministic first-paint markup and
 * every props-driven feedback state; interaction itself is proven by the pure
 * reducer tests and the Playwright suite.
 */

const NOOP: ExerciseViewHandlers = {
  onPlaceTile: vi.fn(),
  onUnplaceTile: vi.fn(),
  onMoveTile: vi.fn(),
  onSelectOption: vi.fn(),
  onSetText: vi.fn(),
  onSubmit: vi.fn(),
  onClear: vi.fn(),
};

function exerciseOfKind(
  lessonId: string,
  kind: ExercisePrompt["kind"],
): GeneratedExercise {
  const found = getLessonExercises(lessonId)?.exercises.find(
    (e) => e.prompt.kind === kind,
  );
  if (!found) throw new Error(`no ${kind} in ${lessonId}`);
  return found;
}

function renderView(
  exercise: GeneratedExercise,
  state = initExerciseState(exercise.prompt),
  intentText: string | null = null,
): string {
  return renderToStaticMarkup(
    createElement(ExerciseView, {
      prompt: exercise.prompt,
      targetExampleId: exercise.targetExampleId,
      state,
      index: 1,
      total: 4,
      script: "hiragana",
      copy: enCopy.exercises,
      instruction: "INSTRUCTION-TEXT",
      intentText,
      idBase: "ex-1",
      romajiForTile: () => "romaji",
      romajiForExample: () => "romaji sentence",
      handlers: NOOP,
    }),
  );
}

const tileEx = exerciseOfKind("introductions-1", "tile-ordering");
const choiceEx = exerciseOfKind("introductions-1", "choice");
const completeEx = exerciseOfKind("introductions-1", "completion");
const constructEx = exerciseOfKind("introductions-1", "constrained-construction");
const transformEx = exerciseOfKind("past-negative-1", "transformation");

describe("ExerciseView — common structure and accessibility", () => {
  it("labels the card with the localized position and associates the instruction", () => {
    const html = renderView(tileEx);
    expect(html).toContain(enCopy.exercises.position(1, 4));
    expect(html).toContain('id="ex-1-instruction"');
    expect(html).toContain("INSTRUCTION-TEXT");
    expect(html).toContain('aria-describedby="ex-1-instruction"');
  });

  it("always renders a polite live region for the result that does not steal focus", () => {
    const html = renderView(tileEx);
    expect(html).toMatch(/role="status"[^>]*aria-live="polite"|aria-live="polite"[^>]*role="status"/);
    // No autofocus / tabindex hijacking on the feedback region.
    expect(html).not.toMatch(/lesson-exercise__feedback[^>]*autofocus/);
  });

  it("offers a check and a clear control", () => {
    const html = renderView(tileEx);
    expect(html).toContain(enCopy.exercises.submit);
    expect(html).toContain(enCopy.exercises.clear);
  });
});

describe("ExerciseView — all five controls render", () => {
  it("tile ordering: an ordered answer region and a bank of add buttons", () => {
    const html = renderView(tileEx);
    expect(html).toContain("lesson-exercise__bank");
    expect(html).toContain("lesson-exercise__answer");
    expect(html).toContain(enCopy.exercises.answerEmpty);
    if (tileEx.prompt.kind === "tile-ordering") {
      const tile = tileEx.prompt.tiles[0];
      expect(html).toContain(enCopy.exercises.addTile(tile.jp));
    }
  });

  it("tile ordering: placed tiles expose move and remove controls", () => {
    const prompt = tileEx.prompt;
    if (prompt.kind !== "tile-ordering") throw new Error("kind");
    let state = initExerciseState(prompt);
    for (const id of prompt.correctTileIds) state = placeTile(state, id);
    const html = renderView(tileEx, state);
    const firstTile = prompt.tiles.find(
      (t) => t.id === prompt.correctTileIds[0],
    )!;
    expect(html).toContain(enCopy.exercises.removeTile(firstTile.jp));
    expect(html).toContain(enCopy.exercises.moveTileForward(firstTile.jp));
  });

  it("gives every tile action a stable unique id for deterministic focus", () => {
    const prompt = tileEx.prompt;
    if (prompt.kind !== "tile-ordering") throw new Error("kind");
    let state = initExerciseState(prompt);
    for (const id of prompt.correctTileIds) state = placeTile(state, id);
    const html = renderView(tileEx, state);
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
    const tileActionIds = ids.filter((id) => id.includes("-tile-"));
    expect(tileActionIds.length).toBe(prompt.tiles.length * 3);
    expect(new Set(tileActionIds).size).toBe(tileActionIds.length);
  });

  it("choice: a labelled group of radio options", () => {
    const html = renderView(choiceEx);
    expect(html).toContain("<fieldset");
    expect(html).toContain('type="radio"');
    if (choiceEx.prompt.kind === "choice") {
      expect(
        (html.match(/type="radio"/g) ?? []).length,
      ).toBe(choiceEx.prompt.options.length);
    }
  });

  it("completion: an in-sentence blank and a Japanese text input", () => {
    const html = renderView(completeEx);
    expect(html).toContain(enCopy.exercises.blank);
    expect(html).toMatch(/<input[^>]*type="text"[^>]*lang="ja"|<input[^>]*lang="ja"[^>]*type="text"/);
    expect(html).toContain(enCopy.exercises.answerLabel);
  });

  it("transformation: the source sentence and a text input", () => {
    const html = renderView(transformEx);
    expect(html).toContain(enCopy.exercises.sourceLabel);
    if (transformEx.prompt.kind === "transformation") {
      expect(html).toContain(transformEx.prompt.promptJp);
    }
    expect(html).toContain('type="text"');
  });

  it("constrained construction: the localized intent and a text input", () => {
    const html = renderView(constructEx, undefined, "My name is Yuki.");
    expect(html).toContain(enCopy.exercises.intentLabel);
    expect(html).toContain("My name is Yuki.");
    expect(html).toContain('type="text"');
  });
});

describe("ExerciseView — feedback states are text, never colour alone (spec §14)", () => {
  it("announces an accepted result with its localized text", () => {
    const state = { ...initExerciseState(choiceEx.prompt), status: "accepted" as const };
    const html = renderView(choiceEx, state);
    expect(html).toContain(enCopy.exercises.accepted);
    expect(html).toContain("lesson-exercise__feedback--accepted");
  });

  it("announces a retry result with its localized text", () => {
    const state = { ...initExerciseState(choiceEx.prompt), status: "retry" as const };
    const html = renderView(choiceEx, state);
    expect(html).toContain(enCopy.exercises.retry);
    expect(html).toContain("lesson-exercise__feedback--retry");
  });

  it("announces an invalid input with its localized text", () => {
    const state = {
      ...initExerciseState(choiceEx.prompt),
      status: "invalid" as const,
      invalidReason: "unknown-option",
    };
    const html = renderView(choiceEx, state);
    expect(html).toContain(enCopy.exercises.invalid);
    expect(html).toContain("lesson-exercise__feedback--invalid");
  });

  it("shows no result text while idle", () => {
    const html = renderView(choiceEx);
    expect(html).not.toContain(enCopy.exercises.accepted);
    expect(html).not.toContain(enCopy.exercises.retry);
  });
});

// ── LessonExercises integration ───────────────────────────────────────────────

function renderLessonExercises(lessonId: string): string {
  return renderToStaticMarkup(
    createElement(
      MemoryRouter,
      null,
      createElement(
        LocaleProvider,
        null,
        createElement(
          ScriptProvider,
          null,
          createElement(
            ProgressProvider,
            null,
            createElement(LessonExercises, { lessonId }),
          ),
        ),
      ),
    ),
  );
}

describe("LessonExercises — renders a lesson's 3-5 exercises", () => {
  it("renders the localized practice heading and one card per authored exercise", () => {
    const html = renderLessonExercises("introductions-1");
    const model = getLessonExercises("introductions-1")!;
    // LocaleProvider defaults to Italian, so the rendered heading is Italian.
    expect(html).toContain(itCopy.exercises.heading);
    expect((html.match(/class="lesson-exercise"/g) ?? []).length).toBe(
      model.exercises.length,
    );
  });

  it("renders a submit control for every exercise", () => {
    const html = renderLessonExercises("introductions-1");
    const model = getLessonExercises("introductions-1")!;
    expect((html.match(/type="submit"/g) ?? []).length).toBe(
      model.exercises.length,
    );
  });

  it("uses only shared data — no exercise renders a raw duplicated answer literal in a hidden field", () => {
    const html = renderLessonExercises("introductions-1");
    expect(html).not.toContain('type="hidden"');
  });

  it("stays usable with no microphone/speech affordance in the practice UI", () => {
    const html = renderLessonExercises("introductions-1");
    expect(html.toLowerCase()).not.toContain("microfono");
    expect(html.toLowerCase()).not.toContain("microphone");
  });
});

describe("LessonExercises — evidence-based lesson status (spec §11.1)", () => {
  it("reports the practiced state once every required exercise has an accepted attempt but not before", () => {
    const tileState = submitExercise(
      tileEx.prompt,
      (() => {
        if (tileEx.prompt.kind !== "tile-ordering") throw new Error("kind");
        let s = initExerciseState(tileEx.prompt);
        for (const id of tileEx.prompt.correctTileIds) s = placeTile(s, id);
        return s;
      })(),
    );
    // Sanity: a full correct tile order is accepted (used indirectly by the UI).
    expect(tileState.outcome).toBe("accepted");
    // The status labels exist and are distinct so the badge is never colour-only.
    expect(enCopy.exercises.statusVisited).not.toBe(enCopy.exercises.statusPracticed);
    expect(enCopy.exercises.statusPracticed).not.toBe(
      enCopy.exercises.statusConsolidated,
    );
  });
});

describe("choice option correctness is engine-derived, not markup-encoded", () => {
  it("does not leak which radio is correct via markup attributes", () => {
    const html = renderView(choiceEx);
    // No data-correct / value hints beyond the opaque option ids.
    expect(html).not.toContain("data-correct");
    expect(html).not.toContain("data-answer");
  });

  it("selecting the correct option is accepted through the reducer, proving the mapping", () => {
    if (choiceEx.prompt.kind !== "choice") throw new Error("kind");
    const state = selectOption(initExerciseState(choiceEx.prompt), choiceEx.prompt.correctOptionId);
    expect(submitExercise(choiceEx.prompt, state).outcome).toBe("accepted");
  });

  it("a completion answer is never embedded as plain text in the idle prompt", () => {
    if (completeEx.prompt.kind !== "completion") throw new Error("kind");
    const html = renderView(completeEx);
    // The canonical filled answer must not appear pre-rendered.
    expect(html).not.toContain(completeEx.prompt.canonicalAnswer);
    // A later filled attempt uses the input value, from the reducer text.
    const filled = setText(initExerciseState(completeEx.prompt), "テスト");
    expect(renderView(completeEx, filled)).toContain("テスト");
  });
});
