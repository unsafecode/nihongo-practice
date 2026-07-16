import { evaluateExercise } from "../exercises/engine";
import type {
  ExerciseCandidate,
  ExerciseEvaluation,
  ExercisePrompt,
} from "../exercises/types";

/**
 * The pure single-exercise interaction state machine (Slice C plan Task 4 step
 * 3; design spec §10.3, §14). It owns every interactive rule the lesson/review
 * UI depends on so the React component can stay a thin, deterministic renderer:
 *
 *   - building an answer for each of the five kinds (tile order, choice,
 *     completion, transformation, constrained construction);
 *   - a non-drag keyboard/touch reordering model for tiles (place, unplace,
 *     move) — no pointer drag is ever required (spec §14);
 *   - evaluating the answer through the shared pure engine and mapping the
 *     result to a visible `accepted`/`retry`/`invalid` status plus the
 *     `accepted`/`retry`/null attempt outcome the caller records
 *     (`invalid-input` is structurally unusable input, never a recorded
 *     attempt — spec §10.3, §11.1).
 *
 * Every editing action clears stale feedback back to `idle`, so a result never
 * lingers over a changed answer. All functions are total and deterministic:
 * no `Date`, randomness, or locale/iteration-order dependence.
 */

export type ExerciseStatus = "idle" | "accepted" | "retry" | "invalid";

export interface ExerciseUiState {
  /** Tile-ordering answer sequence (ids in the learner's chosen order). */
  readonly placedTileIds: readonly string[];
  /** Choice selection. */
  readonly selectedOptionId: string | null;
  /** Free-text answer for the three text kinds. */
  readonly text: string;
  readonly status: ExerciseStatus;
  /** Count of valid (accepted or retry) attempts; invalid input never counts. */
  readonly attempts: number;
  /** The engine's invalid-input reason code, for a localized message. */
  readonly invalidReason: string | null;
}

/** The recordable outcome of a submission, or null for structurally invalid input. */
export type AttemptOutcome = "accepted" | "retry" | null;

export interface SubmitResult {
  readonly state: ExerciseUiState;
  readonly evaluation: ExerciseEvaluation;
  readonly outcome: AttemptOutcome;
}

export function initExerciseState(_prompt: ExercisePrompt): ExerciseUiState {
  return {
    placedTileIds: [],
    selectedOptionId: null,
    text: "",
    status: "idle",
    attempts: 0,
    invalidReason: null,
  };
}

/** Editing clears any prior feedback so a stale result never sits over a changed answer. */
function editing(state: ExerciseUiState): ExerciseUiState {
  return state.status === "idle" && state.invalidReason === null
    ? state
    : { ...state, status: "idle", invalidReason: null };
}

// ── Tile ordering ─────────────────────────────────────────────────────────────

/** Tiles still in the bank (prompt presentation order minus placed tiles). */
export function bankTileIds(
  prompt: ExercisePrompt,
  state: ExerciseUiState,
): readonly string[] {
  if (prompt.kind !== "tile-ordering") return [];
  const placed = new Set(state.placedTileIds);
  return prompt.tiles.map((tile) => tile.id).filter((id) => !placed.has(id));
}

/** Append a bank tile to the end of the answer (idempotent per tile). */
export function placeTile(state: ExerciseUiState, tileId: string): ExerciseUiState {
  if (state.placedTileIds.includes(tileId)) return state;
  return {
    ...editing(state),
    placedTileIds: [...state.placedTileIds, tileId],
  };
}

/** Return a placed tile to the bank. */
export function unplaceTile(state: ExerciseUiState, tileId: string): ExerciseUiState {
  if (!state.placedTileIds.includes(tileId)) return state;
  return {
    ...editing(state),
    placedTileIds: state.placedTileIds.filter((id) => id !== tileId),
  };
}

/** Swap a placed tile with its neighbour (the non-drag keyboard reorder, spec §14). */
export function moveTile(
  state: ExerciseUiState,
  tileId: string,
  direction: "back" | "forward",
): ExerciseUiState {
  const index = state.placedTileIds.indexOf(tileId);
  if (index === -1) return state;
  const target = direction === "forward" ? index + 1 : index - 1;
  if (target < 0 || target >= state.placedTileIds.length) return state;
  const next = [...state.placedTileIds];
  next[index] = next[target];
  next[target] = tileId;
  return { ...editing(state), placedTileIds: next };
}

// ── Choice / text ─────────────────────────────────────────────────────────────

export function selectOption(state: ExerciseUiState, optionId: string): ExerciseUiState {
  return { ...editing(state), selectedOptionId: optionId };
}

export function setText(state: ExerciseUiState, text: string): ExerciseUiState {
  return { ...editing(state), text };
}

/** Reset the current answer and feedback while preserving the attempt count. */
export function clearAnswer(state: ExerciseUiState): ExerciseUiState {
  return {
    ...state,
    placedTileIds: [],
    selectedOptionId: null,
    text: "",
    status: "idle",
    invalidReason: null,
  };
}

// ── Candidate + submission ────────────────────────────────────────────────────

/** Build the engine candidate for the current answer. */
export function buildCandidate(
  prompt: ExercisePrompt,
  state: ExerciseUiState,
): ExerciseCandidate {
  switch (prompt.kind) {
    case "tile-ordering":
      return { kind: "tile-ordering", tileIds: state.placedTileIds };
    case "choice":
      return { kind: "choice", optionId: state.selectedOptionId ?? "" };
    case "transformation":
      return { kind: "transformation", text: state.text };
    case "completion":
      return { kind: "completion", text: state.text };
    case "constrained-construction":
      return { kind: "constrained-construction", text: state.text };
  }
}

function statusFor(evaluation: ExerciseEvaluation): ExerciseStatus {
  switch (evaluation.status) {
    case "accepted":
      return "accepted";
    case "retry":
      return "retry";
    case "invalid-input":
      return "invalid";
  }
}

/**
 * Evaluate the current answer and fold the result into the state. Accepted and
 * retry results are valid attempts (they advance `attempts` and are recordable);
 * invalid-input is structurally unusable and is never a recorded attempt.
 */
export function submitExercise(
  prompt: ExercisePrompt,
  state: ExerciseUiState,
): SubmitResult {
  const evaluation = evaluateExercise(prompt, buildCandidate(prompt, state));
  const isAttempt = evaluation.status !== "invalid-input";
  const outcome: AttemptOutcome =
    evaluation.status === "accepted"
      ? "accepted"
      : evaluation.status === "retry"
        ? "retry"
        : null;
  return {
    evaluation,
    outcome,
    state: {
      ...state,
      status: statusFor(evaluation),
      attempts: state.attempts + (isAttempt ? 1 : 0),
      invalidReason:
        evaluation.status === "invalid-input" ? evaluation.reason : null,
    },
  };
}
