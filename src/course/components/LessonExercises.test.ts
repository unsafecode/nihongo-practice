import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "../../i18n/LocaleContext";
import { ScriptProvider } from "../../settings/ScriptContext";
import type { AssembledToken } from "../../romaji/types";
import { ProgressProvider } from "../progress/ProgressContext";
import { en as enCopy } from "../i18n/en";
import { it as itCopy } from "../i18n/it";
import {
  exampleTokens,
  getLessonExercises,
  segmentToken,
} from "./lessonExerciseModel";
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

/** Strip HTML tags so assertions read the actual visible/announced text
 * content in document order, independent of internal gear/mark wrappers. */
function textOnly(html: string): string {
  return html.replace(/<[^>]+>/g, "");
}

/**
 * The placed-tile answer's romaji sequence read in document order: every run
 * separator (rendered outside each tile's glyph/control wrapper) plus every
 * tile's own isolated secondary-romaji glyph text, concatenated — proving the
 * ordered placed answer reads as one real semantic sequence, not per-tile
 * fragments with no boundary information.
 */
function placedRomajiSequence(html: string): string {
  const answer = html.match(/<ol class="lesson-exercise__answer"[\s\S]*?<\/ol>/)?.[0] ?? "";
  return [
    ...answer.matchAll(
      /class="lesson-exercise__(?:run-separator|glyph-secondary)"[^>]*>([^<]*)</g,
    ),
  ]
    .map((match) => match[1])
    .join("");
}

/** The glyph-secondary text immediately following a given button id — used to
 * check an isolated bank tile's own romaji, independent of its neighbours. */
function bankTileGlyphSecondary(html: string, buttonId: string): string {
  const index = html.indexOf(`id="${buttonId}"`);
  if (index === -1) throw new Error(`button not found: ${buttonId}`);
  const after = html.slice(index);
  const match = after.match(/class="lesson-exercise__glyph-secondary"[^>]*>([^<]*)</);
  if (!match) throw new Error(`no secondary glyph after ${buttonId}`);
  return match[1];
}

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

interface RenderViewOverrides {
  readonly tokenForTile?: (tileId: string) => AssembledToken | undefined;
  readonly tokensForExample?: (
    exampleId: string,
  ) => readonly AssembledToken[] | undefined;
  readonly script?: "hiragana" | "romaji";
}

function renderView(
  exercise: GeneratedExercise,
  state = initExerciseState(exercise.prompt),
  intentText: string | null = null,
  overrides: RenderViewOverrides = {},
): string {
  return renderToStaticMarkup(
    createElement(ExerciseView, {
      prompt: exercise.prompt,
      targetExampleId: exercise.targetExampleId,
      state,
      index: 1,
      total: 4,
      script: overrides.script ?? "hiragana",
      copy: enCopy.exercises,
      instruction: "INSTRUCTION-TEXT",
      intentText,
      idBase: "ex-1",
      tokenForTile: overrides.tokenForTile ?? segmentToken,
      tokensForExample: overrides.tokensForExample ?? exampleTokens,
      errorText: enCopy.lesson.contentFormattingError,
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

// ── Semantic romaji rendering (romaji boundaries plan Task 4) ────────────────
//
// Every learner-facing romaji surface in this file renders real runtime
// AssembledTokens through the shared RomajiSequence renderer (master spec
// §13.2-13.3) — never a hard-coded fragment callback, never a local
// join/concatenation, never a silent fallback to Japanese when a token
// cannot be resolved.

describe("ExerciseView — semantic romaji rendering (romaji boundaries plan Task 4)", () => {
  it("choice: the in-sentence romaji context is fully readable with real spaces around the blank", () => {
    const html = renderView(choiceEx);
    expect(textOnly(html)).toContain("watashi ____ gakusei desu");
  });

  it("completion: the in-sentence romaji context is fully readable with real spaces around the blank", () => {
    const html = renderView(completeEx);
    expect(textOnly(html)).toContain("watashi wa gakusei ____");
  });

  it("transformation: the source romaji is fully readable, never a run-on fragment like tomodachito", () => {
    const html = renderView(transformEx);
    expect(textOnly(html)).toContain("kyou tomodachi to eiga o mimasu");
    expect(textOnly(html)).not.toContain("tomodachito");
    expect(textOnly(html)).not.toContain("eigao");
  });

  it("tile ordering: the ordered placed answer emits real semantic separators in the visible sequence", () => {
    const prompt = tileEx.prompt;
    if (prompt.kind !== "tile-ordering") throw new Error("kind");
    let state = initExerciseState(prompt);
    for (const id of prompt.correctTileIds) state = placeTile(state, id);
    const html = renderView(tileEx, state);
    expect(placedRomajiSequence(html)).toBe("watashi wa gakusei desu");
  });

  it("tile ordering: two placed tiles from different examples never collide merely because their within-example segment ids repeat", () => {
    // Real catalog segment ids (`w1`, `p1`, …) are only unique *within* one
    // example — every example's counter restarts. Two legitimately distinct
    // placed tiles, each carrying a real token whose raw `id` happens to be
    // the same reused counter (as if drawn from two different examples' first
    // "word" segment), must never be treated as a duplicate by the shared
    // whole-sequence formatter: that would previously make the whole placed
    // formatting fail and silently fall back to no separator between tiles
    // (a run-on glyph sequence) while each tile still rendered fine on its
    // own in isolation.
    const prompt = tileEx.prompt;
    if (prompt.kind !== "tile-ordering") throw new Error("kind");
    const [firstTileId, secondTileId] = prompt.correctTileIds;
    let state = initExerciseState(prompt);
    state = placeTile(state, firstTileId);
    state = placeTile(state, secondTileId);

    const crossExampleTokens: Record<string, AssembledToken> = {
      [firstTileId]: {
        id: "w1", // same within-example counter as `secondTileId`'s token
        jp: "アリス",
        romaji: "arisu",
        kind: "lexical",
        boundaryBefore: "attach",
        source: { domain: "exercise", referenceId: "cross-example-a#w1" },
      },
      [secondTileId]: {
        id: "w1", // colliding raw id — a different example's own first word
        jp: "ボブ",
        romaji: "bobu",
        kind: "lexical",
        boundaryBefore: "space",
        source: { domain: "exercise", referenceId: "cross-example-b#w1" },
      },
    };
    const html = renderView(tileEx, state, null, {
      tokenForTile: (tileId) => crossExampleTokens[tileId] ?? segmentToken(tileId),
    });

    // The whole-sequence formatter must not fail (no fail-closed alert)...
    const answer = html.match(/<ol class="lesson-exercise__answer"[\s\S]*?<\/ol>/)?.[0] ?? "";
    expect(answer).not.toContain('role="alert"');
    expect(answer).not.toContain(enCopy.lesson.contentFormattingError);
    // ...and the real inter-tile separator must still be present — never a
    // run-on concatenation of the two tiles' romaji.
    expect(placedRomajiSequence(html)).toBe("arisu bobu");
    expect(textOnly(answer)).not.toContain("arisubobu");
  });

  it("tile ordering: a genuinely malformed placed token fails closed with the shared localized alert, never a partial romaji sequence", () => {
    // Unlike the cross-example case above, this token is actually malformed
    // (blank jp/romaji/source reference) — formatRomaji's own validation must
    // still reject it. The fix must not silently render the other, validly
    // resolved tiles' glyphs next to a broken one with no separator; it must
    // fail the *whole* placed answer closed to the one shared localized
    // alert, exactly like the shared RomajiSequence renderer already does
    // elsewhere on this page.
    const prompt = tileEx.prompt;
    if (prompt.kind !== "tile-ordering") throw new Error("kind");
    let state = initExerciseState(prompt);
    for (const id of prompt.correctTileIds) state = placeTile(state, id);
    const malformedTileId = prompt.correctTileIds[1];
    const html = renderView(tileEx, state, null, {
      tokenForTile: (tileId) =>
        tileId === malformedTileId
          ? {
              id: tileId,
              jp: "",
              romaji: "",
              kind: "particle",
              boundaryBefore: "attach",
              source: { domain: "exercise", referenceId: "" },
            }
          : segmentToken(tileId),
    });
    const answer = html.match(/<ol class="lesson-exercise__answer"[\s\S]*?<\/ol>/)?.[0] ?? "";
    expect(answer).toContain('role="alert"');
    expect(answer).toContain(enCopy.lesson.contentFormattingError);
    // No partial romaji glyph sequence: none of the other, validly-resolved
    // placed tiles' romaji leak into the answer region alongside the alert.
    expect(answer).not.toContain("watashi");
    expect(answer).not.toContain("gakusei");
    expect(answer).not.toContain("desu");
  });

  it("tile ordering: an isolated bank tile's romaji has no leading whitespace, even mid-sentence", () => {
    const prompt = tileEx.prompt;
    if (prompt.kind !== "tile-ordering") throw new Error("kind");
    const w2 = prompt.tiles.find((t) => t.id.endsWith("#w2"));
    expect(w2).toBeDefined();
    const html = renderView(tileEx); // untouched: every tile still sits in the bank.
    const buttonId = `ex-1-instruction-tile-${w2!.id}-add`;
    expect(bankTileGlyphSecondary(html, buttonId)).toBe("gakusei");
  });

  it("choice: no isolated option tile's romaji carries leading whitespace", () => {
    const html = renderView(choiceEx);
    const secondaries = [
      ...html.matchAll(/class="lesson-exercise__glyph-secondary"[^>]*>([^<]*)</g),
    ].map((match) => match[1]);
    expect(secondaries.length).toBeGreaterThan(0);
    for (const secondary of secondaries) {
      expect(secondary).not.toMatch(/^\s/);
    }
  });

  it("invalid token resolution shows the localized formatting error, never a raw/concatenated fallback", () => {
    const html = renderView(transformEx, undefined, null, {
      script: "romaji",
      tokenForTile: () => undefined,
      tokensForExample: () => undefined,
    });
    expect(html).toContain(enCopy.lesson.contentFormattingError);
    expect(html).toContain('role="alert"');
  });
});
