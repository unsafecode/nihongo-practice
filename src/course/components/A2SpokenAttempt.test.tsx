import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LocaleProvider } from "../../i18n/LocaleContext";
import { ScriptProvider } from "../../settings/ScriptContext";
import { SpeechRecognitionProvider } from "../speech/SpeechRecognitionContext";
import { A2_LESSON_IDS } from "../a2/manifest";
import { it as itCopy } from "../i18n/it";
import { A2SpokenAttempt } from "./A2SpokenAttempt";
import { getA2SpokenAttemptModel } from "./a2SpokenAttemptModel";

/**
 * The A2 spoken-attempt container + model's focused contract (Phase 3 Task 8,
 * design spec §20 speech truthfulness). Like `A1SpokenAttempt`, it is a thin
 * resolve-then-delegate wrapper around the already fully-tested
 * `SpokenAttemptView`/`createSpokenAttemptHandlers` (see `SpokenAttempt.test.ts`
 * for every recognition state, including the unsupported/no-API/error/success
 * markup); this suite proves only what differs: the A2-native model resolves,
 * the always-available listen/repeat fallback is present, the target's meaning
 * is real IT/EN copy (never Japanese, never a duplicated Japanese literal), and
 * nothing claims a pronunciation grade/score. No real microphone or network is
 * ever touched.
 */

const JAPANESE = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uff66-\uff9f]/;

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
          createElement(A2SpokenAttempt, { lessonId }),
        ),
      ),
    ),
  );
}

describe("A2SpokenAttempt container", () => {
  it("renders the shared spoken-attempt block for a real A2 lesson without throwing", () => {
    const html = renderContainer("sequencing-ongoing-3");
    expect(html).toContain("spoken-attempt");
  });

  it("always offers the score-free listen/repeat fallback (never a false audio claim)", () => {
    const html = renderContainer("sequencing-ongoing-3");
    // The listen-and-repeat fallback is always available regardless of whether
    // the browser supports speech recognition — the truthful fallback path.
    expect(html).toContain(itCopy.spokenAttempt.repeatTitle);
  });

  it("never states a pronunciation grade, score, accent, fluency, or percentage", () => {
    const html = renderContainer("sequencing-ongoing-3");
    expect(html.toLowerCase()).not.toMatch(
      /pronunciation|accent|fluency|phoneme|score|grade|%|pronuncia|accento|fluidità|punteggio/,
    );
  });

  it("renders nothing for an unknown lesson id rather than throwing", () => {
    expect(() => renderContainer("no-such-a2-lesson")).not.toThrow();
    expect(renderContainer("no-such-a2-lesson")).toBe("");
  });
});

describe("getA2SpokenAttemptModel", () => {
  it("resolves every A2 lesson to a target with a real, Japanese-free meaning", () => {
    for (const lessonId of A2_LESSON_IDS) {
      const result = getA2SpokenAttemptModel(lessonId, "en");
      expect(result.ok, `model for ${lessonId}`).toBe(true);
      if (!result.ok) continue;
      expect(result.model.targetJp.length).toBeGreaterThan(0);
      expect(result.model.meaning.trim().length).toBeGreaterThan(0);
      // The meaning is the natural EN/IT translation — never a Japanese literal.
      expect(JAPANESE.test(result.model.meaning)).toBe(false);
    }
  });

  it("fails closed for an unknown lesson id", () => {
    const result = getA2SpokenAttemptModel("no-such-a2-lesson", "en");
    expect(result.ok).toBe(false);
  });
});
