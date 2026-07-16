import { describe, expect, it, vi } from "vitest";
import {
  type SpeechRecognitionController,
  createSpeechRecognitionController,
  defaultTranscriptEvaluator,
  SpeechRecognitionProvider,
  useSpeechRecognition,
} from "./SpeechRecognitionContext";
import type { SpeechRecognizer } from "./SpeechRecognizer";
import type { RecognitionOutcome } from "./types";
import {
  resolveSpeechPrompt,
  type SpeechExampleInput,
} from "./evaluateTranscript";

/**
 * Speech recognition controller contract (design spec §12.2, Slice D plan Task
 * 2). The controller wires the replaceable recognizer, the pure state machine,
 * and the pure transcript evaluator behind a framework-agnostic surface the
 * React provider renders. It keeps consent — an app notice — in session memory
 * only, separate from OS mic permission, and never calls the recognizer until an
 * explicit start after consent. These tests use a fake recognizer and the real
 * pure evaluator; no microphone or network is touched.
 */

/** A hand-driven recognizer that mirrors the real adapter's settle semantics. */
class FakeRecognizer implements SpeechRecognizer {
  recognizeCalls = 0;
  abortCalls = 0;
  private resolvers: ((outcome: RecognitionOutcome) => void)[] = [];

  constructor(public readonly supported: boolean = true) {}

  recognize(request: { readonly lang: "ja-JP" }): Promise<RecognitionOutcome> {
    expect(request.lang).toBe("ja-JP");
    this.recognizeCalls += 1;
    return new Promise((resolve) => {
      this.resolvers.push(resolve);
    });
  }

  abort(): void {
    this.abortCalls += 1;
    // The production adapter settles any in-flight request as aborted.
    while (this.resolvers.length > 0) {
      this.resolvers.shift()?.({ kind: "failure", failure: "aborted" });
    }
  }

  settleNext(outcome: RecognitionOutcome): void {
    const resolve = this.resolvers.shift();
    if (!resolve) throw new Error("no pending recognize to settle");
    resolve(outcome);
  }

  get pending(): number {
    return this.resolvers.length;
  }
}

/** Flush the microtask/timer queue so awaited recognizer outcomes settle. */
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

const orderExamples = new Map<string, SpeechExampleInput>([
  [
    "order-say",
    {
      id: "order-say",
      jp: "みずをのみます",
      segments: [
        { id: "p1", jp: "みずを" },
        { id: "e1", jp: "のみます" },
      ],
    },
  ],
]);

const orderPrompt = resolveSpeechPrompt(
  {
    id: "speech-order",
    targetExampleId: "order-say",
    acceptedTranscriptVariantExampleIds: [],
    comparisonSegmentIds: ["p1", "e1"],
    criticalSegmentIds: ["p1"],
  },
  orderExamples,
);

function controllerWith(recognizer: SpeechRecognizer): SpeechRecognitionController {
  return createSpeechRecognitionController({
    recognizer,
    evaluator: defaultTranscriptEvaluator,
  });
}

async function acknowledgedController(
  recognizer: SpeechRecognizer,
): Promise<SpeechRecognitionController> {
  const controller = controllerWith(recognizer);
  controller.acknowledgeConsent();
  return controller;
}

describe("controller consent is an app notice, separate from mic permission", () => {
  it("starts idle with consent unacknowledged and no recognizer contact", () => {
    const recognizer = new FakeRecognizer();
    const controller = controllerWith(recognizer);
    const snapshot = controller.getSnapshot();
    expect(snapshot.state).toEqual({ status: "idle" });
    expect(snapshot.consentAcknowledged).toBe(false);
    expect(snapshot.supported).toBe(true);
    expect(recognizer.recognizeCalls).toBe(0);
  });

  it("requesting consent never calls the recognizer", () => {
    const recognizer = new FakeRecognizer();
    const controller = controllerWith(recognizer);
    controller.requestConsent();
    expect(controller.getSnapshot().state.status).toBe("requesting-consent");
    expect(recognizer.recognizeCalls).toBe(0);
  });

  it("dismissing consent returns to idle without acknowledging", () => {
    const recognizer = new FakeRecognizer();
    const controller = controllerWith(recognizer);
    controller.requestConsent();
    controller.dismissConsent();
    const snapshot = controller.getSnapshot();
    expect(snapshot.state.status).toBe("idle");
    expect(snapshot.consentAcknowledged).toBe(false);
  });

  it("does not start recognition before consent is acknowledged", () => {
    const recognizer = new FakeRecognizer();
    const controller = controllerWith(recognizer);
    controller.start({ prompt: orderPrompt });
    expect(recognizer.recognizeCalls).toBe(0);
    // Start without consent surfaces the consent notice instead of listening.
    expect(controller.getSnapshot().state.status).toBe("requesting-consent");
  });

  it("acknowledging consent is session state that clears the notice", () => {
    const recognizer = new FakeRecognizer();
    const controller = controllerWith(recognizer);
    controller.requestConsent();
    controller.acknowledgeConsent();
    const snapshot = controller.getSnapshot();
    expect(snapshot.consentAcknowledged).toBe(true);
    expect(snapshot.state.status).toBe("idle");
  });
});

describe("controller start after consent drives the recognizer and evaluator", () => {
  it("transitions listening then matched on an exact transcript", async () => {
    const recognizer = new FakeRecognizer();
    const controller = await acknowledgedController(recognizer);
    controller.start({ prompt: orderPrompt });
    expect(recognizer.recognizeCalls).toBe(1);
    expect(controller.getSnapshot().state.status).toBe("listening");

    recognizer.settleNext({ kind: "transcript", transcript: "みずをのみます" });
    await flush();
    expect(controller.getSnapshot().state.status).toBe("matched");
  });

  it("classifies a near miss as close via the real evaluator", async () => {
    const recognizer = new FakeRecognizer();
    const controller = await acknowledgedController(recognizer);
    controller.start({ prompt: orderPrompt });
    recognizer.settleNext({ kind: "transcript", transcript: "みずをのみま" });
    await flush();
    expect(controller.getSnapshot().state.status).toBe("close");
  });

  it("classifies an unrelated transcript as retry", async () => {
    const recognizer = new FakeRecognizer();
    const controller = await acknowledgedController(recognizer);
    controller.start({ prompt: orderPrompt });
    recognizer.settleNext({ kind: "transcript", transcript: "そらをとびます" });
    await flush();
    expect(controller.getSnapshot().state.status).toBe("retry");
  });

  it("surfaces a mapped failure without fabricating an evaluation", async () => {
    const recognizer = new FakeRecognizer();
    const controller = await acknowledgedController(recognizer);
    controller.start({ prompt: orderPrompt });
    recognizer.settleNext({ kind: "failure", failure: "denied" });
    await flush();
    const state = controller.getSnapshot().state;
    expect(state.status).toBe("denied");
    expect("evaluation" in state).toBe(false);
  });
});

describe("controller unsupported, abort, and reset", () => {
  it("enters unsupported without calling an unsupported recognizer", () => {
    const recognizer = new FakeRecognizer(false);
    const controller = controllerWith(recognizer);
    controller.acknowledgeConsent();
    controller.start({ prompt: orderPrompt });
    expect(recognizer.recognizeCalls).toBe(0);
    expect(controller.getSnapshot().state.status).toBe("unsupported");
  });

  it("abort is visible, aborts the engine, and is idempotent", async () => {
    const recognizer = new FakeRecognizer();
    const controller = await acknowledgedController(recognizer);
    controller.start({ prompt: orderPrompt });
    controller.abort();
    expect(recognizer.abortCalls).toBeGreaterThanOrEqual(1);
    expect(controller.getSnapshot().state.status).toBe("aborted");
    const abortsAfterFirst = recognizer.abortCalls;
    controller.abort();
    expect(controller.getSnapshot().state.status).toBe("aborted");
    // A late settled outcome from the aborted attempt is ignored.
    await flush();
    expect(controller.getSnapshot().state.status).toBe("aborted");
    expect(recognizer.abortCalls).toBeGreaterThanOrEqual(abortsAfterFirst);
  });

  it("ignores a stale outcome after a replacement attempt starts", async () => {
    const recognizer = new FakeRecognizer();
    const controller = await acknowledgedController(recognizer);
    controller.start({ prompt: orderPrompt });
    controller.abort();
    await flush();

    // A fresh attempt replaces the aborted one and settles on its own.
    controller.start({ prompt: orderPrompt });
    expect(controller.getSnapshot().state.status).toBe("listening");
    recognizer.settleNext({ kind: "transcript", transcript: "みずをのみます" });
    await flush();
    expect(controller.getSnapshot().state.status).toBe("matched");
  });

  it("resets a terminal state back to idle for an explicit retry", async () => {
    const recognizer = new FakeRecognizer();
    const controller = await acknowledgedController(recognizer);
    controller.start({ prompt: orderPrompt });
    recognizer.settleNext({ kind: "failure", failure: "no-speech" });
    await flush();
    expect(controller.getSnapshot().state.status).toBe("no-speech");
    controller.reset();
    expect(controller.getSnapshot().state.status).toBe("idle");
  });

  it("does not evaluate a processing attempt aborted by its subscriber", async () => {
    const recognizer = new FakeRecognizer();
    const evaluate = vi.fn(defaultTranscriptEvaluator.evaluate);
    const controller = createSpeechRecognitionController({
      recognizer,
      evaluator: {
        normalize: defaultTranscriptEvaluator.normalize,
        evaluate,
      },
    });
    controller.acknowledgeConsent();
    const statuses: string[] = [];
    controller.subscribe(() => {
      const status = controller.getSnapshot().state.status;
      statuses.push(status);
      if (status === "processing") controller.abort();
    });

    controller.start({ prompt: orderPrompt });
    recognizer.settleNext({ kind: "transcript", transcript: "みずをのみます" });
    await flush();

    expect(statuses).toEqual(["listening", "processing", "aborted"]);
    expect(evaluate).not.toHaveBeenCalled();
  });

  it("does not evaluate a processing attempt reset by its subscriber", async () => {
    const recognizer = new FakeRecognizer();
    const evaluate = vi.fn(defaultTranscriptEvaluator.evaluate);
    const controller = createSpeechRecognitionController({
      recognizer,
      evaluator: {
        normalize: defaultTranscriptEvaluator.normalize,
        evaluate,
      },
    });
    controller.acknowledgeConsent();
    const statuses: string[] = [];
    controller.subscribe(() => {
      const status = controller.getSnapshot().state.status;
      statuses.push(status);
      if (status === "processing") controller.reset();
    });

    controller.start({ prompt: orderPrompt });
    recognizer.settleNext({ kind: "transcript", transcript: "みずをのみます" });
    await flush();

    expect(statuses).toEqual(["listening", "processing", "idle"]);
    expect(evaluate).not.toHaveBeenCalled();
  });
});

describe("controller subscription surface", () => {
  it.each([
    ["matched", "みずをのみます"],
    ["close", "みずをのみま"],
    ["retry", "そらをとびます"],
  ] as const)(
    "publishes listening, processing, then %s to subscribers",
    async (terminalStatus, transcript) => {
      const recognizer = new FakeRecognizer();
      const controller = await acknowledgedController(recognizer);
      const statuses: string[] = [];
      controller.subscribe(() => {
        statuses.push(controller.getSnapshot().state.status);
      });

      controller.start({ prompt: orderPrompt });
      recognizer.settleNext({ kind: "transcript", transcript });
      await flush();

      expect(statuses).toEqual(["listening", "processing", terminalStatus]);
    },
  );

  it("notifies subscribers on change and returns a stable snapshot between changes", () => {
    const recognizer = new FakeRecognizer();
    const controller = controllerWith(recognizer);
    const listener = vi.fn();
    const unsubscribe = controller.subscribe(listener);

    const before = controller.getSnapshot();
    expect(controller.getSnapshot()).toBe(before);

    controller.requestConsent();
    expect(listener).toHaveBeenCalledTimes(1);
    expect(controller.getSnapshot()).not.toBe(before);

    unsubscribe();
    controller.dismissConsent();
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe("React provider wiring", () => {
  it("exports a provider component and a typed hook", () => {
    expect(typeof SpeechRecognitionProvider).toBe("function");
    expect(typeof useSpeechRecognition).toBe("function");
  });
});
