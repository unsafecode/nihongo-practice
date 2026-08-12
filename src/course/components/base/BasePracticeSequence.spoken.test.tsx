/** @vitest-environment jsdom */
import { act } from "react";
import { describe, expect, it } from "vitest";
import { getCourseCopy } from "../../i18n/catalog";
import type { SpeechRecognizer } from "../../speech/SpeechRecognizer";
import { renderBaseActivity } from "../../base/view/testHarness";
import { buildBasePracticeModel } from "../../base/view/buildBasePracticeModel";

/**
 * The Base spoken practice activity's microphone-consent flow (re-review
 * finding 5): it must reuse the same authored `copy.spokenAttempt` consent
 * disclosure and mic-start labels the standalone spoken-attempt feature
 * already shows, never a generic self-check control standing in for a
 * privacy disclosure. A stub recognizer with `supported: true` reaches the
 * real consent flow (the default browser adapter is always unsupported
 * under jsdom, which instead exercises the separate no-mic fallback).
 */

const supportedRecognizer: SpeechRecognizer = {
  supported: true,
  recognize: () => new Promise(() => {}),
  abort: () => {},
};

function findSpokenIndex(lessonId: string): number {
  const result = buildBasePracticeModel(lessonId, "en");
  if (!result.ok) throw new Error("practice model unavailable");
  const index = result.model.activities.findIndex((activity) => activity.mode === "spoken");
  if (index < 0) throw new Error("no spoken activity found");
  return index;
}

describe("Base spoken practice activity microphone consent", () => {
  it("shows the authored consentTitle/consentBody and consentAcknowledge/consentDismiss labels, never generic self-check text", () => {
    const lessonId = "sentence-foundations-1";
    const index = findSpokenIndex(lessonId);
    const copy = getCourseCopy("en").spokenAttempt;
    const { container, unmount } = renderBaseActivity(
      lessonId,
      index,
      "en",
      supportedRecognizer,
    );

    const requestButton = [...container.querySelectorAll("button")].find(
      (button) => button.textContent === copy.tryButton,
    );
    expect(requestButton).toBeDefined();
    act(() => requestButton?.click());

    expect(container.textContent).toContain(copy.consentTitle);
    expect(container.textContent).toContain(copy.consentBody);
    const acknowledgeButton = [...container.querySelectorAll("button")].find(
      (button) => button.textContent === copy.consentAcknowledge,
    );
    const dismissButton = [...container.querySelectorAll("button")].find(
      (button) => button.textContent === copy.consentDismiss,
    );
    expect(acknowledgeButton).toBeDefined();
    expect(dismissButton).toBeDefined();
    // Never the generic self-check labels standing in for consent controls.
    expect(container.textContent).not.toContain(
      getCourseCopy("en").baseLesson.practice.selfCheckCorrect,
    );
    expect(container.textContent).not.toContain(
      getCourseCopy("en").baseLesson.practice.selfCheckRetry,
    );

    unmount();
  });

  it("labels the post-consent microphone control with the authored micStart text, not a generic submit label", () => {
    const lessonId = "sentence-foundations-1";
    const index = findSpokenIndex(lessonId);
    const copy = getCourseCopy("en").spokenAttempt;
    const { container, unmount } = renderBaseActivity(
      lessonId,
      index,
      "en",
      supportedRecognizer,
    );

    const requestButton = [...container.querySelectorAll("button")].find(
      (button) => button.textContent === copy.tryButton,
    );
    act(() => requestButton?.click());
    const acknowledgeButton = [...container.querySelectorAll("button")].find(
      (button) => button.textContent === copy.consentAcknowledge,
    );
    act(() => acknowledgeButton?.click());

    expect(container.textContent).toContain(copy.micStart);
    expect(container.textContent).not.toContain(
      getCourseCopy("en").baseLesson.practice.submit,
    );

    unmount();
  });
});
