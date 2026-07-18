/** @vitest-environment jsdom */

import { act } from "react";
import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { describe, expect, it } from "vitest";
import { LocaleProvider } from "../../i18n/LocaleContext";
import { ScriptProvider } from "../../settings/ScriptContext";
import { en as enCopy } from "../i18n/en";
import { it as itCopy } from "../i18n/it";
import {
  defaultTranscriptEvaluator,
  SpeechRecognitionProvider,
} from "../speech/SpeechRecognitionContext";
import type { SpeechRecognizer } from "../speech/SpeechRecognizer";
import type {
  RecognitionOutcome,
  TranscriptEvaluator,
} from "../speech/types";
import { getA1SpokenAttemptModel } from "./a1SpokenAttemptModel";
import { A1SpokenAttempt } from "./A1SpokenAttempt";
import type { SpokenAttemptModel } from "./spokenAttemptModel";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

/**
 * Client-side regression coverage for the lesson lifecycle, on the live A1
 * container (Phase 2 Task 6 replaced the legacy `SpokenAttempt` container with
 * `A1SpokenAttempt`; this suite was ported onto it so the regression it guards
 * — a lesson-transition state leak — stays covered on the code path users
 * actually hit). This deliberately keeps one provider mounted while only the
 * lesson consumer rerenders, matching the route transition that exposed the
 * state leak.
 */
class LateOutcomeRecognizer implements SpeechRecognizer {
  readonly supported = true;
  readonly pending: Array<(outcome: RecognitionOutcome) => void> = [];
  abortCalls = 0;

  recognize(): Promise<RecognitionOutcome> {
    return new Promise((resolve) => this.pending.push(resolve));
  }

  abort(): void {
    this.abortCalls += 1;
  }

  settle(index: number, outcome: RecognitionOutcome): void {
    const resolve = this.pending[index];
    if (!resolve) throw new Error(`no pending recognition at index ${index}`);
    resolve(outcome);
  }
}

function modelFor(lessonId: string): SpokenAttemptModel {
  const result = getA1SpokenAttemptModel(lessonId, "en");
  if (!result.ok) throw new Error(`no model for ${lessonId}`);
  return result.model;
}

function transcriptFor(
  status: "matched" | "close" | "retry",
  target: SpokenAttemptModel,
): string {
  const candidates = [
    target.prompt.canonical.original,
    target.prompt.canonical.original.slice(0, -1),
    `${target.prompt.canonical.original}ね`,
    "そらをとびます",
    "こんにちは",
  ];
  const transcript = candidates.find(
    (candidate) =>
      defaultTranscriptEvaluator.evaluate(
        defaultTranscriptEvaluator.normalize(candidate),
        target.prompt,
      ).state === status,
  );
  if (!transcript) throw new Error(`no ${status} transcript candidate`);
  return transcript;
}

function buttonWithText(
  container: HTMLElement,
  text: string | readonly string[],
): HTMLButtonElement {
  const labels = typeof text === "string" ? [text] : text;
  const button = Array.from(container.querySelectorAll("button")).find(
    (candidate) => labels.some((label) => candidate.textContent?.includes(label)),
  );
  if (!(button instanceof HTMLButtonElement)) {
    throw new Error(`button not found: ${labels.join(" / ")}`);
  }
  return button;
}

async function renderClientAttempt(
  root: Root,
  recognizer: LateOutcomeRecognizer,
  lessonId: string,
  evaluator: TranscriptEvaluator = defaultTranscriptEvaluator,
): Promise<void> {
  await act(async () => {
    root.render(
      createElement(
        SpeechRecognitionProvider,
        { recognizer, evaluator, children: null },
        createElement(
          LocaleProvider,
          null,
          createElement(
            ScriptProvider,
            null,
            createElement(A1SpokenAttempt, { lessonId }),
          ),
        ),
      ),
    );
  });
}

async function acknowledgeAndStart(
  container: HTMLElement,
  recognizer: LateOutcomeRecognizer,
): Promise<void> {
  await act(async () => {
    buttonWithText(container, [
      enCopy.spokenAttempt.tryButton,
      itCopy.spokenAttempt.tryButton,
    ]).click();
  });
  await act(async () => {
    buttonWithText(container, [
      enCopy.spokenAttempt.consentAcknowledge,
      itCopy.spokenAttempt.consentAcknowledge,
    ]).click();
  });
  await act(async () => {
    buttonWithText(container, [
      enCopy.spokenAttempt.micStart,
      itCopy.spokenAttempt.micStart,
    ]).click();
  });
  expect(recognizer.pending).toHaveLength(1);
}

function expectIdleAttempt(
  container: HTMLElement,
  lessonB: SpokenAttemptModel,
): void {
  expect(container.querySelector(".spoken-attempt__status")?.textContent).toBe("");
  expect(container.querySelector(".spoken-attempt__heard")).toBeNull();
  expect(container.querySelector(".spoken-attempt__segments")).toBeNull();
  for (const copy of [enCopy.spokenAttempt, itCopy.spokenAttempt]) {
    expect(container.textContent).not.toContain(copy.resultMatched);
    expect(container.textContent).not.toContain(copy.resultClose);
    expect(container.textContent).not.toContain(copy.resultRetry);
  }
  expect(
    [enCopy.spokenAttempt, itCopy.spokenAttempt].some((copy) =>
      container.textContent?.includes(copy.micStart),
    ),
  ).toBe(true);
  expect(
    [enCopy.spokenAttempt, itCopy.spokenAttempt].every(
      (copy) => !container.textContent?.includes(copy.tryButton),
    ),
  ).toBe(true);
  expect(container.textContent).toContain(lessonB.targetJp);
}

describe("A1SpokenAttempt client lifecycle across lessons", () => {
  it.each(["matched", "close", "retry"] as const)(
    "resets A's %s transcript and segment records before B renders",
    async (status) => {
      const recognizer = new LateOutcomeRecognizer();
      const container = document.createElement("div");
      document.body.append(container);
      const root = createRoot(container);
      const lessonA = modelFor("introductions-1");
      const lessonB = modelFor("sounds-1");

      try {
        await renderClientAttempt(root, recognizer, "introductions-1");
        await acknowledgeAndStart(container, recognizer);
        const transcript = transcriptFor(status, lessonA);
        await act(async () => {
          recognizer.settle(0, { kind: "transcript", transcript });
          await new Promise((resolve) => setTimeout(resolve, 0));
        });

        expect(container.querySelector(".spoken-attempt__heard")).not.toBeNull();
        expect(container.querySelector(".spoken-attempt__segments")).not.toBeNull();
        expect(container.textContent).toContain(
          {
            matched: itCopy.spokenAttempt.resultMatched,
            close: itCopy.spokenAttempt.resultClose,
            retry: itCopy.spokenAttempt.resultRetry,
          }[status],
        );

        await renderClientAttempt(root, recognizer, "sounds-1");
        expectIdleAttempt(container, lessonB);
      } finally {
        await act(async () => root.unmount());
        container.remove();
      }
    },
  );

  it("aborts listening and fences a late A outcome when navigation renders B", async () => {
    const recognizer = new LateOutcomeRecognizer();
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    const lessonB = modelFor("sounds-1");

    try {
      await renderClientAttempt(root, recognizer, "introductions-1");
      await acknowledgeAndStart(container, recognizer);
      await renderClientAttempt(root, recognizer, "sounds-1");

      expect(recognizer.abortCalls).toBeGreaterThan(0);
      expectIdleAttempt(container, lessonB);

      await act(async () => {
        recognizer.settle(0, {
          kind: "transcript",
          transcript: modelFor("introductions-1").targetJp,
        });
        await new Promise((resolve) => setTimeout(resolve, 0));
      });
      expectIdleAttempt(container, lessonB);
    } finally {
      await act(async () => root.unmount());
      container.remove();
    }
  });

  it("aborts active recognition when the spoken attempt unmounts", async () => {
    const recognizer = new LateOutcomeRecognizer();
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    try {
      await renderClientAttempt(root, recognizer, "introductions-1");
      await acknowledgeAndStart(container, recognizer);
      await act(async () => {
        root.render(
          createElement(
            SpeechRecognitionProvider,
            { recognizer, children: null },
          ),
        );
      });

      expect(recognizer.abortCalls).toBeGreaterThan(0);
    } finally {
      await act(async () => root.unmount());
      container.remove();
    }
  });

  it("resets processing before an evaluator outcome can publish A into B", async () => {
    const recognizer = new LateOutcomeRecognizer();
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    const lessonA = modelFor("introductions-1");
    const lessonB = modelFor("sounds-1");
    let navigatedDuringEvaluation = false;
    const evaluator: TranscriptEvaluator = {
      normalize: defaultTranscriptEvaluator.normalize,
      evaluate: (transcript, prompt) => {
        navigatedDuringEvaluation = true;
        root.render(
          createElement(
            SpeechRecognitionProvider,
            { recognizer, evaluator, children: null },
            createElement(
              LocaleProvider,
              null,
              createElement(
                ScriptProvider,
                null,
                createElement(A1SpokenAttempt, { lessonId: "sounds-1" }),
              ),
            ),
          ),
        );
        return defaultTranscriptEvaluator.evaluate(transcript, prompt);
      },
    };

    try {
      await renderClientAttempt(root, recognizer, "introductions-1", evaluator);
      await acknowledgeAndStart(container, recognizer);
      await act(async () => {
        recognizer.settle(0, {
          kind: "transcript",
          transcript: lessonA.targetJp,
        });
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(navigatedDuringEvaluation).toBe(true);
      expect(recognizer.abortCalls).toBeGreaterThan(0);
      expectIdleAttempt(container, lessonB);
    } finally {
      await act(async () => root.unmount());
      container.remove();
    }
  });
});
