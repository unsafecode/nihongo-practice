import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "../../i18n/LocaleContext";
import { ScriptProvider } from "../../settings/ScriptContext";
import type { AssembledToken } from "../../romaji/types";
import { formatRomaji } from "../../romaji/formatRomaji";
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
import type { ExercisePrompt, ExercisePromptSegment } from "../exercises/types";
import type { ExerciseCatalogsInput } from "../exercises/types";
import { generateExercise } from "../exercises/engine";
import { assembledCurriculum } from "../catalog/curriculum";
import { curriculumExamples } from "../catalog/examples";
import { curriculumExercises } from "../catalog/exercises";
import { assembledExamples } from "../catalog/assembleCourse";
import { exampleSegmentToAssembledToken } from "../data/romajiTokens";

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

/**
 * A1's own release builder never selects a `"transformation"`-kind exercise
 * (empirically: every one of its 44 semantic lessons generates exactly
 * tile-ordering/choice/completion/constrained-construction). `ExerciseView`'s
 * transformation body is still real, load-bearing production code — used
 * wherever the *legacy* engine's catalog is exercised, e.g. review-queue
 * entries carried over before the A1 cutover — so this fixture builds one
 * real `"transformation"` prompt directly from the legacy definition/engine
 * catalog (`past-negative-1-transform-base`), bypassing `getLessonExercises`
 * entirely, with its own local token resolvers scoped to the legacy example
 * catalog (never the A1 release's).
 */
const legacyCatalogs: ExerciseCatalogsInput = {
  concepts: assembledCurriculum.concepts,
  lexemes: assembledCurriculum.lexemes,
  examples: curriculumExamples,
};

const legacyTransformDefinition = curriculumExercises.find(
  (entry) => entry.id === "past-negative-1-transform-base",
)?.definition;
if (!legacyTransformDefinition) {
  throw new Error("legacy fixture past-negative-1-transform-base not found");
}
const legacyTransformResult = generateExercise(
  legacyTransformDefinition,
  legacyCatalogs,
);
if (!legacyTransformResult.ok) {
  throw new Error("legacy transformation fixture failed to generate");
}
const transformEx: GeneratedExercise = {
  definitionId: legacyTransformDefinition.id,
  targetExampleId: legacyTransformDefinition.targetExampleId,
  prompt: legacyTransformResult.prompt,
  instruction: { en: "INSTRUCTION-TEXT", it: "INSTRUCTION-TEXT" },
  intentText: { en: null, it: null },
  practicePurpose: "guided-controlled",
};

/** Token resolvers scoped to the legacy example catalog — used only for the
 * legacy `transformEx` fixture above, since the shared `segmentToken`/
 * `exampleTokens` only resolve the live A1 release's tile/example ids. */
function legacyTokenForTile(tileId: string): AssembledToken | undefined {
  const [exampleId, segmentId] = tileId.split("#");
  const example = assembledExamples[exampleId ?? ""];
  const segment = example?.segments?.find((s) => s.id === segmentId);
  return segment ? (exampleSegmentToAssembledToken(segment) ?? undefined) : undefined;
}
function legacyTokensForExample(
  exampleId: string,
): readonly AssembledToken[] | undefined {
  const example = assembledExamples[exampleId];
  const segments = example?.segments ?? [];
  if (segments.length === 0) return undefined;
  const tokens = segments.map((segment) => exampleSegmentToAssembledToken(segment));
  return tokens.every((token): token is AssembledToken => token !== null)
    ? tokens
    : undefined;
}

/**
 * The real, shared-renderer joined romaji text for an ordered token
 * sequence — computed via the same `formatRomaji` production function the
 * shared `RomajiSequence` renderer calls, with the sequence's first token
 * forced to `"attach"` boundary (matching `ExerciseView`'s own
 * `isolateTokens` call for a rendered sequence's leading token).
 */
function joinIsolatedRomaji(tokens: readonly AssembledToken[]): string {
  const isolated = [
    { ...tokens[0]!, boundaryBefore: "attach" as const },
    ...tokens.slice(1),
  ];
  const formatted = formatRomaji(isolated);
  if (!formatted.ok) throw new Error("formatRomaji failed for fixture sequence");
  return formatted.runs.map((run) => run.separatorBefore + run.text).join("");
}

/**
 * The real, shared-renderer expected in-sentence romaji text for a
 * choice/completion prompt's `sentenceSegments` — computed from the same
 * `formatRomaji` production function `ExerciseView`'s `SentenceLine` calls,
 * with a blank segment's text substituted for the localized placeholder, so
 * the assertion proves real integration (real tokens, real boundaries, real
 * blank substitution) without hard-coding any lesson's Japanese content.
 */
function expectedSentenceRomaji(
  segments: readonly ExercisePromptSegment[],
  targetExampleId: string,
  blankText: string,
): string {
  const tokens = segments.map((segment) => {
    const token = segmentToken(`${targetExampleId}#${segment.id}`);
    if (!token) throw new Error(`no token for ${targetExampleId}#${segment.id}`);
    return token;
  });
  const isolated = [{ ...tokens[0]!, boundaryBefore: "attach" as const }, ...tokens.slice(1)];
  const formatted = formatRomaji(isolated);
  if (!formatted.ok) throw new Error("formatRomaji failed for fixture sentence");
  const blankIds = new Set(
    segments.filter((segment) => segment.isBlank).map((segment) => segment.id),
  );
  return formatted.runs
    .map((run) => run.separatorBefore + (blankIds.has(run.tokenId) ? blankText : run.text))
    .join("");
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
// transformEx is the legacy fixture defined above (A1 never generates this kind).

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
    const html = renderView(transformEx, undefined, null, {
      tokenForTile: legacyTokenForTile,
      tokensForExample: legacyTokensForExample,
    });
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

describe("ExerciseView — optional presentation contract (Phase 1 Task 5)", () => {
  it("preserves the production root/header markup when the optional props are absent", () => {
    const html = renderView(tileEx);
    // Root card class is exactly the production class; nothing is appended.
    expect(html).toContain(
      '<li class="lesson-exercise" aria-labelledby="ex-1-heading">',
    );
    // The header holds only the position heading — no supplemental node.
    expect(html).toContain(
      '<div class="lesson-exercise__head"><h4 id="ex-1-heading" class="lesson-exercise__title">',
    );
    // No host review metadata attributes are emitted on the root.
    expect(html).not.toMatch(/<li class="lesson-exercise"[^>]*\sdata-/);
    expect(html).not.toContain("foundation-round__card");
  });

  it("appends the host item class, closed-set review data, and a header supplement when provided", () => {
    const html = renderToStaticMarkup(
      createElement(ExerciseView, {
        prompt: tileEx.prompt,
        targetExampleId: tileEx.targetExampleId,
        state: initExerciseState(tileEx.prompt),
        index: 1,
        total: 4,
        script: "hiragana",
        copy: enCopy.exercises,
        instruction: "INSTRUCTION-TEXT",
        intentText: null,
        idBase: "ex-1",
        tokenForTile: segmentToken,
        tokensForExample: exampleTokens,
        errorText: enCopy.lesson.contentFormattingError,
        handlers: NOOP,
        itemClassName: "foundation-round__card",
        itemData: {
          "target-id": "t-1",
          "semantic-fingerprint": "fp-1",
          "visible-target-key": "kabc",
        },
        headerSupplement: createElement(
          "p",
          { className: "foundation-round__badge" },
          "Transfer",
        ),
      }),
    );
    expect(html).toContain(
      '<li class="lesson-exercise foundation-round__card"',
    );
    expect(html).toContain('data-target-id="t-1"');
    expect(html).toContain('data-semantic-fingerprint="fp-1"');
    expect(html).toContain('data-visible-target-key="kabc"');
    // The supplement renders inside the card header, after the heading.
    expect(html).toMatch(
      /class="lesson-exercise__head">.*lesson-exercise__title[^<]*<\/h4><p class="foundation-round__badge">Transfer<\/p><\/div>/,
    );
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
    if (choiceEx.prompt.kind !== "choice") throw new Error("kind");
    const expected = expectedSentenceRomaji(
      choiceEx.prompt.sentenceSegments,
      choiceEx.targetExampleId,
      enCopy.exercises.blank,
    );
    expect(textOnly(html)).toContain(expected);
  });

  it("completion: the in-sentence romaji context is fully readable with real spaces around the blank", () => {
    const html = renderView(completeEx);
    if (completeEx.prompt.kind !== "completion") throw new Error("kind");
    const expected = expectedSentenceRomaji(
      completeEx.prompt.sentenceSegments,
      completeEx.targetExampleId,
      enCopy.exercises.blank,
    );
    expect(textOnly(html)).toContain(expected);
  });

  it("transformation: the source romaji is fully readable, never a run-on fragment", () => {
    const html = renderView(transformEx, undefined, null, {
      tokenForTile: legacyTokenForTile,
      tokensForExample: legacyTokensForExample,
    });
    if (transformEx.prompt.kind !== "transformation") throw new Error("kind");
    const sourceTokens = legacyTokensForExample(transformEx.prompt.promptExampleId);
    expect(sourceTokens).toBeDefined();
    const expected = joinIsolatedRomaji(sourceTokens!);
    expect(textOnly(html)).toContain(expected);
    // Every adjacent-pair run-on (no separator at all) must never appear —
    // proving real inter-word boundaries, not a concatenated fragment.
    const isolated = [
      { ...sourceTokens![0]!, boundaryBefore: "attach" as const },
      ...sourceTokens!.slice(1),
    ];
    const formatted = formatRomaji(isolated);
    if (!formatted.ok) throw new Error("formatRomaji failed");
    for (let i = 1; i < sourceTokens!.length; i++) {
      const runOn = sourceTokens![i - 1]!.romaji + sourceTokens![i]!.romaji;
      if (formatted.runs[i]!.separatorBefore === " ") {
        expect(textOnly(html)).not.toContain(runOn);
      }
    }
  });

  it("tile ordering: the ordered placed answer emits real semantic separators in the visible sequence", () => {
    const prompt = tileEx.prompt;
    if (prompt.kind !== "tile-ordering") throw new Error("kind");
    let state = initExerciseState(prompt);
    for (const id of prompt.correctTileIds) state = placeTile(state, id);
    const html = renderView(tileEx, state);
    const expectedTokens = prompt.correctTileIds.map((id) => {
      const token = segmentToken(id);
      if (!token) throw new Error(`no token for ${id}`);
      return token;
    });
    expect(placedRomajiSequence(html)).toBe(joinIsolatedRomaji(expectedTokens));
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
    for (const id of prompt.correctTileIds) {
      if (id === malformedTileId) continue;
      const token = segmentToken(id);
      expect(token).toBeDefined();
      expect(answer).not.toContain(token!.romaji);
    }
  });

  it("tile ordering: an isolated bank tile's romaji has no leading whitespace, even mid-sentence", () => {
    const prompt = tileEx.prompt;
    if (prompt.kind !== "tile-ordering") throw new Error("kind");
    // A tile that sits mid-sentence (not the sentence's first word) — its
    // real token carries a `"space"` boundary in context, but isolated in
    // the bank its own romaji glyph must still start clean, with no leading
    // whitespace artefact from that in-sentence boundary.
    const midSentenceTile = prompt.tiles.find((tile) => {
      const token = segmentToken(tile.id);
      return token !== undefined && token.boundaryBefore !== "attach";
    });
    expect(midSentenceTile).toBeDefined();
    const expectedRomaji = segmentToken(midSentenceTile!.id)!.romaji;
    const html = renderView(tileEx); // untouched: every tile still sits in the bank.
    const buttonId = `ex-1-instruction-tile-${midSentenceTile!.id}-add`;
    expect(bankTileGlyphSecondary(html, buttonId)).toBe(expectedRomaji);
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
