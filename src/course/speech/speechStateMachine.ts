import type {
  NormalizedTranscript,
  RecognitionFailure,
  TranscriptEvaluation,
} from "./types";

/**
 * The pure speech recognition state machine (design spec §12.2, Slice D plan
 * Task 2). It is a total, side-effect-free function of `(state, event)`. The
 * React controller owns the recognizer promise and the evaluator; this module
 * owns only the visible lifecycle.
 *
 * Two invariants are enforced structurally here rather than left to callers:
 *
 *   1. Attempt IDs fence off stale outcomes. Every in-flight event carries the
 *      `attemptId` it belongs to; a `transcript`, `evaluated`, `failed`, or
 *      `aborted` event is honoured only while its attempt is the current active
 *      one, so a late result from an aborted or replaced attempt can never
 *      mutate the state.
 *   2. No failure fabricates a result. The `matched`/`close`/`retry` states are
 *      reachable only through `evaluated` from `processing`; a `failed` event
 *      always lands on a failure state that carries no transcript or evaluation.
 */

/** A monotonically increasing attempt discriminator minted by the controller. */
export type AttemptId = number;

/**
 * The complete, discriminated recognition state. Consent is modelled here as an
 * app notice (`requesting-consent`); it is distinct from OS microphone
 * permission, which this app never reads or persists. `listening` and
 * `processing` are the only active states and are the only ones that carry the
 * current attempt ID.
 */
export type SpeechRecognitionState =
  | { readonly status: "idle" }
  | { readonly status: "requesting-consent" }
  | { readonly status: "listening"; readonly attemptId: AttemptId }
  | {
      readonly status: "processing";
      readonly attemptId: AttemptId;
      readonly transcript: NormalizedTranscript;
    }
  | {
      readonly status: "matched";
      readonly attemptId: AttemptId;
      readonly evaluation: TranscriptEvaluation;
    }
  | {
      readonly status: "close";
      readonly attemptId: AttemptId;
      readonly evaluation: TranscriptEvaluation;
    }
  | {
      readonly status: "retry";
      readonly attemptId: AttemptId;
      readonly evaluation: TranscriptEvaluation;
    }
  | { readonly status: "unsupported" }
  | { readonly status: "denied"; readonly attemptId: AttemptId }
  | { readonly status: "no-speech"; readonly attemptId: AttemptId }
  | { readonly status: "aborted"; readonly attemptId: AttemptId }
  | { readonly status: "network-error"; readonly attemptId: AttemptId }
  | { readonly status: "service-error"; readonly attemptId: AttemptId };

/** The events the controller dispatches into {@link reduceSpeechState}. */
export type SpeechRecognitionEvent =
  | { readonly type: "consent-requested" }
  | { readonly type: "consent-dismissed" }
  | { readonly type: "started"; readonly attemptId: AttemptId }
  | { readonly type: "unsupported" }
  | {
      readonly type: "transcript";
      readonly attemptId: AttemptId;
      readonly transcript: NormalizedTranscript;
    }
  | {
      readonly type: "evaluated";
      readonly attemptId: AttemptId;
      readonly evaluation: TranscriptEvaluation;
    }
  | {
      readonly type: "failed";
      readonly attemptId: AttemptId;
      readonly failure: RecognitionFailure;
    }
  | { readonly type: "aborted"; readonly attemptId: AttemptId }
  | { readonly type: "reset" };

export const initialSpeechState: SpeechRecognitionState = { status: "idle" };

/** Whether the state is an active attempt eligible to receive its outcomes. */
function isActive(
  state: SpeechRecognitionState,
): state is Extract<
  SpeechRecognitionState,
  { status: "listening" | "processing" }
> {
  return state.status === "listening" || state.status === "processing";
}

/** Whether `event` belongs to the currently active attempt (stale-outcome fence). */
function belongsToActiveAttempt(
  state: SpeechRecognitionState,
  attemptId: AttemptId,
): boolean {
  return isActive(state) && state.attemptId === attemptId;
}

/**
 * Reduce one event against the current state. Unrecognised transitions return
 * the same state reference so callers can cheaply detect "no change".
 */
export function reduceSpeechState(
  state: SpeechRecognitionState,
  event: SpeechRecognitionEvent,
): SpeechRecognitionState {
  switch (event.type) {
    case "consent-requested":
      // Never interrupt an in-flight attempt to show the consent notice.
      return isActive(state) ? state : { status: "requesting-consent" };

    case "consent-dismissed":
      return state.status === "requesting-consent" ? { status: "idle" } : state;

    case "started":
      // An explicit activation begins a new attempt from any settled state.
      return isActive(state)
        ? state
        : { status: "listening", attemptId: event.attemptId };

    case "unsupported":
      return isActive(state) ? state : { status: "unsupported" };

    case "transcript":
      if (state.status !== "listening" || state.attemptId !== event.attemptId) {
        return state;
      }
      return {
        status: "processing",
        attemptId: event.attemptId,
        transcript: event.transcript,
      };

    case "evaluated":
      if (state.status !== "processing" || state.attemptId !== event.attemptId) {
        return state;
      }
      return {
        status: event.evaluation.state,
        attemptId: event.attemptId,
        evaluation: event.evaluation,
      };

    case "failed":
      if (!belongsToActiveAttempt(state, event.attemptId)) return state;
      return event.failure === "unsupported"
        ? { status: "unsupported" }
        : { status: event.failure, attemptId: event.attemptId };

    case "aborted":
      if (!belongsToActiveAttempt(state, event.attemptId)) return state;
      return { status: "aborted", attemptId: event.attemptId };

    case "reset":
      return { status: "idle" };
  }
}
