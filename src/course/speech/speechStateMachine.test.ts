import { describe, expect, it } from "vitest";
import {
  type AttemptId,
  type SpeechRecognitionEvent,
  type SpeechRecognitionState,
  initialSpeechState,
  reduceSpeechState,
} from "./speechStateMachine";
import type {
  NormalizedTranscript,
  RecognitionFailure,
  TranscriptEvaluation,
} from "./types";

/**
 * Pure speech state machine contract (design spec §12.2, Slice D plan Task 2).
 * The reducer is a total function of `(state, event)` with no side effects. It
 * models consent (an app notice, distinct from OS mic permission), the visible
 * listening/processing lifecycle, and the terminal outcomes. Attempt IDs fence
 * off stale outcomes from an aborted or replaced attempt, and no failure event
 * may ever fabricate a transcript or evaluation.
 */

const transcript: NormalizedTranscript = { original: "わたし", comparable: "わたし" };

function evaluationOf(
  state: TranscriptEvaluation["state"],
): TranscriptEvaluation {
  return { state, transcript, segmentMatches: [] };
}

function listening(attemptId: AttemptId): SpeechRecognitionState {
  return reduceSpeechState(initialSpeechState, { type: "started", attemptId });
}

function processing(attemptId: AttemptId): SpeechRecognitionState {
  return reduceSpeechState(listening(attemptId), {
    type: "transcript",
    attemptId,
    transcript,
  });
}

describe("initial speech state", () => {
  it("starts idle", () => {
    expect(initialSpeechState).toEqual({ status: "idle" });
  });
});

describe("consent transitions (app notice, not mic permission)", () => {
  it("moves idle to requesting-consent", () => {
    expect(
      reduceSpeechState(initialSpeechState, { type: "consent-requested" })
        .status,
    ).toBe("requesting-consent");
  });

  it("dismisses consent back to idle", () => {
    const requesting = reduceSpeechState(initialSpeechState, {
      type: "consent-requested",
    });
    expect(
      reduceSpeechState(requesting, { type: "consent-dismissed" }).status,
    ).toBe("idle");
  });

  it("allows requesting consent again from a terminal state", () => {
    const retry = reduceSpeechState(processing(1), {
      type: "evaluated",
      attemptId: 1,
      evaluation: evaluationOf("retry"),
    });
    expect(
      reduceSpeechState(retry, { type: "consent-requested" }).status,
    ).toBe("requesting-consent");
  });

  it("does not interrupt an active attempt with a consent request", () => {
    const state = listening(1);
    expect(reduceSpeechState(state, { type: "consent-requested" })).toBe(state);
  });
});

describe("start transitions", () => {
  it("begins listening from idle", () => {
    expect(listening(1)).toEqual({ status: "listening", attemptId: 1 });
  });

  it("begins listening from requesting-consent", () => {
    const requesting = reduceSpeechState(initialSpeechState, {
      type: "consent-requested",
    });
    expect(
      reduceSpeechState(requesting, { type: "started", attemptId: 7 }),
    ).toEqual({ status: "listening", attemptId: 7 });
  });

  it("restarts listening from a terminal state only on explicit activation", () => {
    const retry = reduceSpeechState(processing(1), {
      type: "evaluated",
      attemptId: 1,
      evaluation: evaluationOf("retry"),
    });
    // Retry stays terminal until an explicit start.
    expect(
      reduceSpeechState(retry, { type: "transcript", attemptId: 1, transcript }),
    ).toBe(retry);
    expect(
      reduceSpeechState(retry, { type: "started", attemptId: 2 }),
    ).toEqual({ status: "listening", attemptId: 2 });
  });

  it("does not start over an already active attempt", () => {
    const state = listening(1);
    expect(reduceSpeechState(state, { type: "started", attemptId: 2 })).toBe(
      state,
    );
    const busy = processing(1);
    expect(reduceSpeechState(busy, { type: "started", attemptId: 2 })).toBe(
      busy,
    );
  });
});

describe("unsupported transition", () => {
  it("enters unsupported from idle without an attempt", () => {
    expect(
      reduceSpeechState(initialSpeechState, { type: "unsupported" }),
    ).toEqual({ status: "unsupported" });
  });

  it("does not override an active attempt", () => {
    const state = listening(1);
    expect(reduceSpeechState(state, { type: "unsupported" })).toBe(state);
  });
});

describe("transcript and evaluation transitions", () => {
  it("moves listening to processing on a matching transcript", () => {
    expect(processing(1)).toEqual({
      status: "processing",
      attemptId: 1,
      transcript,
    });
  });

  it("classifies an evaluated processing state by the evaluator result", () => {
    for (const state of ["matched", "close", "retry"] as const) {
      const result = reduceSpeechState(processing(3), {
        type: "evaluated",
        attemptId: 3,
        evaluation: evaluationOf(state),
      });
      expect(result).toEqual({
        status: state,
        attemptId: 3,
        evaluation: evaluationOf(state),
      });
    }
  });

  it("ignores an evaluation that is not preceded by a transcript", () => {
    const state = listening(1);
    expect(
      reduceSpeechState(state, {
        type: "evaluated",
        attemptId: 1,
        evaluation: evaluationOf("matched"),
      }),
    ).toBe(state);
  });
});

describe("failure transitions never fabricate a transcript or evaluation", () => {
  const failures: readonly RecognitionFailure[] = [
    "denied",
    "no-speech",
    "aborted",
    "network-error",
    "service-error",
  ];

  for (const failure of failures) {
    it(`maps a ${failure} failure to its terminal state with no result payload`, () => {
      const result = reduceSpeechState(listening(1), {
        type: "failed",
        attemptId: 1,
        failure,
      });
      expect(result.status).toBe(failure);
      expect("transcript" in result).toBe(false);
      expect("evaluation" in result).toBe(false);
    });
  }

  it("maps an unsupported failure to the unsupported state", () => {
    expect(
      reduceSpeechState(listening(1), {
        type: "failed",
        attemptId: 1,
        failure: "unsupported",
      }),
    ).toEqual({ status: "unsupported" });
  });

  it("can fail during processing", () => {
    expect(
      reduceSpeechState(processing(1), {
        type: "failed",
        attemptId: 1,
        failure: "service-error",
      }).status,
    ).toBe("service-error");
  });
});

describe("abort transitions", () => {
  it("aborts an active listening attempt", () => {
    expect(
      reduceSpeechState(listening(1), { type: "aborted", attemptId: 1 }),
    ).toEqual({ status: "aborted", attemptId: 1 });
  });

  it("aborts an active processing attempt", () => {
    expect(
      reduceSpeechState(processing(1), { type: "aborted", attemptId: 1 }).status,
    ).toBe("aborted");
  });

  it("is idempotent once aborted", () => {
    const aborted = reduceSpeechState(listening(1), {
      type: "aborted",
      attemptId: 1,
    });
    expect(reduceSpeechState(aborted, { type: "aborted", attemptId: 1 })).toBe(
      aborted,
    );
  });
});

describe("attempt IDs fence off stale outcomes", () => {
  it("ignores transcript, evaluation, failure, and abort from a stale attempt", () => {
    const active = listening(2);
    const staleEvents: SpeechRecognitionEvent[] = [
      { type: "transcript", attemptId: 1, transcript },
      { type: "evaluated", attemptId: 1, evaluation: evaluationOf("matched") },
      { type: "failed", attemptId: 1, failure: "service-error" },
      { type: "aborted", attemptId: 1 },
    ];
    for (const event of staleEvents) {
      expect(reduceSpeechState(active, event)).toBe(active);
    }
  });

  it("ignores a late outcome from an aborted attempt after a replacement starts", () => {
    const aborted = reduceSpeechState(listening(1), {
      type: "aborted",
      attemptId: 1,
    });
    // A late transcript from attempt 1 must not resurrect it.
    expect(
      reduceSpeechState(aborted, { type: "transcript", attemptId: 1, transcript }),
    ).toBe(aborted);
    // A replacement attempt starts cleanly.
    const replacement = reduceSpeechState(aborted, {
      type: "started",
      attemptId: 2,
    });
    expect(replacement).toEqual({ status: "listening", attemptId: 2 });
    // The stale failure from attempt 1 cannot mutate attempt 2.
    expect(
      reduceSpeechState(replacement, {
        type: "failed",
        attemptId: 1,
        failure: "denied",
      }),
    ).toBe(replacement);
    // Attempt 2's own transcript still advances it.
    expect(
      reduceSpeechState(replacement, {
        type: "transcript",
        attemptId: 2,
        transcript,
      }).status,
    ).toBe("processing");
  });
});

describe("reset returns to idle from anywhere", () => {
  it("resets terminal and active states to idle", () => {
    const states: SpeechRecognitionState[] = [
      listening(1),
      processing(1),
      reduceSpeechState(processing(1), {
        type: "evaluated",
        attemptId: 1,
        evaluation: evaluationOf("matched"),
      }),
      reduceSpeechState(listening(1), {
        type: "failed",
        attemptId: 1,
        failure: "denied",
      }),
    ];
    for (const state of states) {
      expect(reduceSpeechState(state, { type: "reset" })).toEqual({
        status: "idle",
      });
    }
  });
});
