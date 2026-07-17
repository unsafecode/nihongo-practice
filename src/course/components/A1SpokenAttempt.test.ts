import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LocaleProvider } from "../../i18n/LocaleContext";
import { ScriptProvider } from "../../settings/ScriptContext";
import { SpeechRecognitionProvider } from "../speech/SpeechRecognitionContext";
import { A1SpokenAttempt } from "./A1SpokenAttempt";

/**
 * The A1 spoken-attempt container's own focused contract (Phase 2 Task 6,
 * master task point 4). It is a thin resolve-then-delegate wrapper around
 * the already fully-tested `SpokenAttemptView`/`createSpokenAttemptHandlers`
 * (see `SpokenAttempt.test.ts` for that shared contract, including every
 * recognition state's static markup); this suite proves only what differs:
 * that it resolves the A1-native model for both a semantic and a phonetic
 * lesson, renders the shared truthful block for each, and never claims a
 * pronunciation grade.
 */
function renderContainer(lessonId: string): string {
  return renderToStaticMarkup(
    createElement(
      SpeechRecognitionProvider,
      null,
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
}

describe("A1SpokenAttempt container", () => {
  it("renders within the app providers for a semantic lesson without throwing", () => {
    const html = renderContainer("introductions-1");
    expect(html).toContain("spoken-attempt");
  });

  it("renders within the app providers for a phonetic sounds lesson without throwing", () => {
    const html = renderContainer("sounds-1");
    expect(html).toContain("spoken-attempt");
  });

  it("never states a pronunciation grade, score, or percentage", () => {
    const html = renderContainer("introductions-1");
    expect(html.toLowerCase()).not.toMatch(/pronunciation|accent|fluency|phoneme|score|grade|%/);
  });

  it("renders nothing for an unknown lesson id rather than throwing", () => {
    expect(() => renderContainer("no-such-lesson")).not.toThrow();
    const html = renderContainer("no-such-lesson");
    expect(html).toBe("");
  });
});
