import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "../../i18n/LocaleContext";
import { ScriptProvider } from "../../settings/ScriptContext";
import { ProgressProvider } from "../progress/ProgressContext";
import { SpeechRecognitionProvider } from "../speech/SpeechRecognitionContext";
import { defaultTranscriptEvaluator } from "../speech/SpeechRecognitionContext";
import type { SpeechRecognitionState } from "../speech/speechStateMachine";
import type { TranscriptEvaluation } from "../speech/types";
import { en as enCopy } from "../i18n/en";
import { it as itCopy } from "../i18n/it";
import type { Script } from "../../settings/ScriptContext";
import { getSpokenAttemptModel } from "./spokenAttemptModel";
import type { SpokenAttemptModel } from "./spokenAttemptModel";
import {
  SpokenAttempt,
  SpokenAttemptView,
  createSpokenAttemptHandlers,
  type SpokenAttemptHandlers,
} from "./SpokenAttempt";
import { LessonPage } from "./LessonPage";

/**
 * Static accessible-markup contract for the optional spoken-attempt block
 * (Slice D plan Task 3; design spec §5.3, §12.2-§12.3). `renderToStaticMarkup`
 * runs no effects, so these assert the deterministic markup of every visible
 * recognition state without a microphone; the async lifecycle itself is proven
 * by the pure controller/state-machine tests. Copy is truthful: it says only
 * whether the browser recognized the target, never a pronunciation claim.
 */

function modelFor(lessonId: string): SpokenAttemptModel {
  const result = getSpokenAttemptModel(lessonId, "en");
  if (!result.ok) throw new Error(`no model for ${lessonId}`);
  return result.model;
}

const model = modelFor("introductions-1");

const NOOP: SpokenAttemptHandlers = {
  onPlayModel: vi.fn(),
  onRequestConsent: vi.fn(),
  onAcknowledgeConsent: vi.fn(),
  onDismissConsent: vi.fn(),
  onStart: vi.fn(),
  onAbort: vi.fn(),
  onReset: vi.fn(),
};

interface ViewOptions {
  readonly state: SpeechRecognitionState;
  readonly script?: Script;
  readonly supported?: boolean;
  readonly consentAcknowledged?: boolean;
  readonly synthesisSupported?: boolean;
  readonly speakingKey?: string | null;
  readonly viewModel?: SpokenAttemptModel;
  readonly copy?: typeof enCopy.spokenAttempt;
}

function renderView(options: ViewOptions): string {
  return renderToStaticMarkup(
    createElement(SpokenAttemptView, {
      model: options.viewModel ?? model,
      copy: options.copy ?? enCopy.spokenAttempt,
      script: options.script ?? "hiragana",
      state: options.state,
      supported: options.supported ?? true,
      consentAcknowledged: options.consentAcknowledged ?? false,
      synthesisSupported: options.synthesisSupported ?? true,
      speakingKey: options.speakingKey ?? null,
      idBase: "sa-1",
      handlers: NOOP,
    }),
  );
}

function evalFor(transcript: string): TranscriptEvaluation {
  return defaultTranscriptEvaluator.evaluate(
    defaultTranscriptEvaluator.normalize(transcript),
    model.prompt,
  );
}

const IDLE: SpeechRecognitionState = { status: "idle" };

// ── Always-present affordances ────────────────────────────────────────────────

describe("SpokenAttemptView — target, meaning, and a polite live region", () => {
  it("labels the block and shows the localized heading and intro", () => {
    const html = renderView({ state: IDLE });
    expect(html).toContain("spoken-attempt");
    expect(html).toContain(enCopy.spokenAttempt.heading);
    expect(html).toContain(enCopy.spokenAttempt.intro);
  });

  it("shows the visible Japanese target and its localized meaning", () => {
    const html = renderView({ state: IDLE });
    expect(html).toContain('lang="ja"');
    expect(html).toContain("watashi"); // derived romaji, shown alongside
    expect(html).toContain(model.meaning);
  });

  it("always renders a polite status live region that does not steal focus", () => {
    const html = renderView({ state: IDLE });
    expect(html).toMatch(
      /role="status"[^>]*aria-live="polite"|aria-live="polite"[^>]*role="status"/,
    );
    expect(html.toLowerCase()).not.toContain("autofocus");
  });
});

// ── Script + katakana ruby ────────────────────────────────────────────────────

describe("SpokenAttemptView — respects the script setting and ruby conventions", () => {
  it("renders Japanese primary under the hiragana setting", () => {
    const html = renderView({ state: IDLE, script: "hiragana" });
    // Japanese primary carries lang=ja; romaji is present as the secondary line.
    expect(html).toContain('lang="ja"');
    expect(html).toContain("watashi");
  });

  it("renders romaji primary and Japanese secondary under the romaji setting", () => {
    const html = renderView({ state: IDLE, script: "romaji" });
    expect(html).toContain("watashi");
    expect(html).toContain('lang="ja"');
  });

  it("shows a katakana loanword with its hiragana ruby reading (sounds-4)", () => {
    const html = renderView({
      state: IDLE,
      script: "hiragana",
      viewModel: modelFor("sounds-4"),
    });
    expect(html).toMatch(/<ruby[^>]*>ミルク<rt[^>]*>みるく<\/rt><\/ruby>/);
  });
});

// ── Consent is separate from the microphone ───────────────────────────────────

describe("SpokenAttemptView — consent notice is separate from the mic", () => {
  it.each([
    [enCopy.spokenAttempt, "I understand, continue", "Speak now"],
    [itCopy.spokenAttempt, "Ho capito, continua", "Parla ora"],
  ] as const)(
    "uses a neutral acknowledgement and a separate microphone action (%s)",
    (copy, acknowledgement, micStart) => {
      expect(copy.consentAcknowledge).toBe(acknowledgement);
      expect(copy.consentAcknowledge.toLowerCase()).not.toMatch(
        /\b(activate|enable|start|use|microphone|attiva|avvia|inizia|usa|microfono)\b/,
      );

      const consentHtml = renderView({
        state: { status: "requesting-consent" },
        consentAcknowledged: false,
        copy,
      });
      expect(consentHtml).toContain(acknowledgement);
      expect(consentHtml).not.toContain(micStart);

      const acknowledgedHtml = renderView({
        state: IDLE,
        consentAcknowledged: true,
        copy,
      });
      expect(copy.micStart).toBe(micStart);
      expect(acknowledgedHtml).toContain(micStart);
    },
  );

  it("before consent, offers a try-speaking control and no mic-start control", () => {
    const html = renderView({ state: IDLE, consentAcknowledged: false });
    expect(html).toContain(enCopy.spokenAttempt.tryButton);
    expect(html).not.toContain(enCopy.spokenAttempt.micStart);
  });

  it("the requesting-consent state shows the full localized privacy disclosure", () => {
    const html = renderView({
      state: { status: "requesting-consent" },
      consentAcknowledged: false,
    });
    const body = enCopy.spokenAttempt.consentBody.toLowerCase();
    // Required disclosures (design spec §12.1, Slice D Task 3 req 4).
    expect(body).toContain("optional");
    expect(body).toContain("no audio");
    expect(body).toContain("recognized text");
    expect(body).toMatch(/browser|operating system|voice/);
    expect(body).toContain("every other exercise");
    expect(html).toContain(enCopy.spokenAttempt.consentTitle);
    expect(html).toContain(enCopy.spokenAttempt.consentAcknowledge);
    expect(html).toContain(enCopy.spokenAttempt.consentDismiss);
  });

  it("after consent, offers the separate mic-start control", () => {
    const html = renderView({ state: IDLE, consentAcknowledged: true });
    expect(html).toContain(enCopy.spokenAttempt.micStart);
    expect(html).not.toContain(enCopy.spokenAttempt.tryButton);
  });
});

// ── Every recognition state is distinct and localized ─────────────────────────

const STATE_COPY: ReadonlyArray<
  readonly [SpeechRecognitionState, string, Partial<ViewOptions>]
> = [
  [{ status: "listening", attemptId: 1 }, enCopy.spokenAttempt.statusListening, { consentAcknowledged: true }],
  [
    {
      status: "processing",
      attemptId: 1,
      transcript: defaultTranscriptEvaluator.normalize("わたしのなまえはゆきです"),
    },
    enCopy.spokenAttempt.statusProcessing,
    { consentAcknowledged: true },
  ],
  [{ status: "denied", attemptId: 1 }, enCopy.spokenAttempt.errorDenied, { consentAcknowledged: true }],
  [{ status: "no-speech", attemptId: 1 }, enCopy.spokenAttempt.errorNoSpeech, { consentAcknowledged: true }],
  [{ status: "aborted", attemptId: 1 }, enCopy.spokenAttempt.errorAborted, { consentAcknowledged: true }],
  [{ status: "network-error", attemptId: 1 }, enCopy.spokenAttempt.errorNetwork, { consentAcknowledged: true }],
  [{ status: "service-error", attemptId: 1 }, enCopy.spokenAttempt.errorService, { consentAcknowledged: true }],
  [{ status: "unsupported" }, enCopy.spokenAttempt.errorUnsupported, { supported: false }],
];

describe("SpokenAttemptView — each state shows its own distinct localized copy", () => {
  it.each(STATE_COPY)("state %o shows its status/error copy", (state, expected, opts) => {
    const html = renderView({ state, ...opts });
    expect(html).toContain(expected);
  });

  it("shows the matched result copy for a matched evaluation", () => {
    const html = renderView({
      state: { status: "matched", attemptId: 1, evaluation: evalFor(model.targetJp) },
      consentAcknowledged: true,
    });
    expect(html).toContain(enCopy.spokenAttempt.resultMatched);
  });

  it("shows the close result copy for a close status", () => {
    const html = renderView({
      state: { status: "close", attemptId: 1, evaluation: evalFor(model.targetJp) },
      consentAcknowledged: true,
    });
    expect(html).toContain(enCopy.spokenAttempt.resultClose);
    expect(html).not.toContain(enCopy.spokenAttempt.resultMatched);
    expect(html).not.toContain(enCopy.spokenAttempt.resultRetry);
  });

  it("shows the retry result copy for an unrecognized transcript", () => {
    const html = renderView({
      state: { status: "retry", attemptId: 1, evaluation: evalFor("そらをとびます") },
      consentAcknowledged: true,
    });
    expect(html).toContain(enCopy.spokenAttempt.resultRetry);
    expect(html).not.toContain(enCopy.spokenAttempt.resultMatched);
  });
});

// ── Segment records ───────────────────────────────────────────────────────────

describe("SpokenAttemptView — ordered per-segment records for results", () => {
  it("lists every segment with a matched/unmatched word conveyed by text", () => {
    const html = renderView({
      state: { status: "matched", attemptId: 1, evaluation: evalFor(model.targetJp) },
      consentAcknowledged: true,
    });
    // A matched attempt marks every segment recognized (coherent records).
    expect(html).toContain(enCopy.spokenAttempt.segmentMatched);
    expect(html).not.toContain(enCopy.spokenAttempt.segmentMissing);
    // Critical segments are labelled without relying on colour.
    expect(html).toContain(enCopy.spokenAttempt.criticalLabel);
  });

  it("marks unmatched segments with text for a retry attempt", () => {
    const html = renderView({
      state: { status: "retry", attemptId: 1, evaluation: evalFor("そらをとびます") },
      consentAcknowledged: true,
    });
    expect(html).toContain(enCopy.spokenAttempt.segmentMissing);
  });

  it("does not expose an unresolved internal segment ID as Japanese", () => {
    const rawSegmentId = "internal-segment-id";
    const evaluation = evalFor(model.targetJp);
    const html = renderView({
      state: {
        status: "matched",
        attemptId: 1,
        evaluation: {
          ...evaluation,
          segmentMatches: [{ segmentId: rawSegmentId, matched: false }],
        },
      },
      consentAcknowledged: true,
    });
    expect(html).not.toContain(rawSegmentId);
    expect(html).toContain("Segment unavailable");
  });
});

// ── Transcript shown only in current state ────────────────────────────────────

describe("SpokenAttemptView — transcript display and honest claims", () => {
  it("shows the recognized transcript for a result and labels it as heard", () => {
    const html = renderView({
      state: { status: "matched", attemptId: 1, evaluation: evalFor(model.targetJp) },
      consentAcknowledged: true,
    });
    expect(html).toContain(enCopy.spokenAttempt.heardLabel);
    expect(html).toContain(model.targetJp);
  });

  it("shows no transcript label at idle (nothing recognized yet)", () => {
    const html = renderView({ state: IDLE, consentAcknowledged: true });
    expect(html).not.toContain(enCopy.spokenAttempt.heardLabel);
  });
});

// ── Fallbacks ─────────────────────────────────────────────────────────────────

describe("SpokenAttemptView — unsupported/error fallbacks preserve playback", () => {
  it("keeps the model playback control and a repeat fallback when unsupported", () => {
    const html = renderView({
      state: { status: "unsupported" },
      supported: false,
      synthesisSupported: true,
    });
    expect(html).toContain(enCopy.spokenAttempt.listen);
    expect(html).toContain(enCopy.spokenAttempt.repeatBody);
    expect(html).not.toContain(enCopy.spokenAttempt.micStart);
  });

  it("offers a repeat fallback after a recognition failure", () => {
    const html = renderView({
      state: { status: "denied", attemptId: 1 },
      consentAcknowledged: true,
    });
    expect(html).toContain(enCopy.spokenAttempt.repeatBody);
    expect(html).toContain(enCopy.spokenAttempt.tryAgain);
  });

  it("omits the model playback control when synthesis is unavailable", () => {
    const html = renderView({
      state: IDLE,
      consentAcknowledged: true,
      synthesisSupported: false,
    });
    expect(html).not.toContain(enCopy.spokenAttempt.listen);
    // The visible target still renders so the lesson stays usable.
    expect(html).toContain(model.meaning);
  });
});

// ── Semantic, accessible controls ─────────────────────────────────────────────

describe("SpokenAttemptView — semantic, 44px, focus-visible controls", () => {
  it("renders real buttons using the shared >=44px action styling", () => {
    const html = renderView({ state: IDLE, consentAcknowledged: true });
    expect(html).toMatch(/<button[^>]*class="[^"]*action/);
  });

  it("gives the mic a stop control while listening", () => {
    const html = renderView({
      state: { status: "listening", attemptId: 1 },
      consentAcknowledged: true,
    });
    expect(html).toContain(enCopy.spokenAttempt.micStop);
  });
});

// ── Handler wiring: consent separation ────────────────────────────────────────

describe("createSpokenAttemptHandlers — consent never touches the recognizer", () => {
  function spies() {
    return {
      requestConsent: vi.fn(),
      acknowledgeConsent: vi.fn(),
      dismissConsent: vi.fn(),
      start: vi.fn(),
      abort: vi.fn(),
      reset: vi.fn(),
    };
  }

  it("acknowledging consent calls acknowledgeConsent and never start", () => {
    const recognition = spies();
    const speech = { speak: vi.fn() };
    const handlers = createSpokenAttemptHandlers(recognition, speech, model, "k");
    handlers.onAcknowledgeConsent();
    expect(recognition.acknowledgeConsent).toHaveBeenCalledTimes(1);
    expect(recognition.start).not.toHaveBeenCalled();
  });

  it("requesting consent calls requestConsent and never start", () => {
    const recognition = spies();
    const handlers = createSpokenAttemptHandlers(recognition, { speak: vi.fn() }, model, "k");
    handlers.onRequestConsent();
    expect(recognition.requestConsent).toHaveBeenCalledTimes(1);
    expect(recognition.start).not.toHaveBeenCalled();
  });

  it("the separate mic start passes the resolved prompt to the recognizer", () => {
    const recognition = spies();
    const handlers = createSpokenAttemptHandlers(recognition, { speak: vi.fn() }, model, "k");
    handlers.onStart();
    expect(recognition.start).toHaveBeenCalledWith({ prompt: model.prompt });
  });

  it("playing the model speaks the derived Japanese target only", () => {
    const speech = { speak: vi.fn() };
    const handlers = createSpokenAttemptHandlers(spies(), speech, model, "play-key");
    handlers.onPlayModel();
    expect(speech.speak).toHaveBeenCalledTimes(1);
    expect(speech.speak.mock.calls[0][0]).toBe(model.targetJp);
  });
});

// ── Copy parity + no forbidden claims ─────────────────────────────────────────

const FORBIDDEN = [
  "pronunciation",
  "pronounce",
  "accuracy",
  "accurate",
  "accent",
  "fluency",
  "fluent",
  "phoneme",
  "score",
  "grade",
  "percentage",
  "percent",
  "pronunc",
  "accuratezz",
  "accurat",
  "accento",
  "fluidit",
  "fonema",
  "punteggio",
  "voto",
  "percentual",
  "percento",
];

function collectStrings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(collectStrings);
  if (typeof value === "object" && value !== null) {
    return Object.values(value).flatMap(collectStrings);
  }
  return [];
}

describe("spokenAttempt copy — parity and truthful, claim-free wording", () => {
  it("shares an identical key set between it and en", () => {
    expect(Object.keys(itCopy.spokenAttempt).sort()).toEqual(
      Object.keys(enCopy.spokenAttempt).sort(),
    );
  });

  it("has no blank strings", () => {
    for (const copy of [itCopy.spokenAttempt, enCopy.spokenAttempt]) {
      for (const value of collectStrings(copy)) {
        expect(value.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("makes no pronunciation-quality claim in either locale", () => {
    for (const copy of [itCopy.spokenAttempt, enCopy.spokenAttempt]) {
      const haystack = collectStrings(copy).join(" \n ").toLowerCase();
      for (const term of FORBIDDEN) {
        expect(haystack, `forbidden term: ${term}`).not.toContain(term);
      }
    }
  });

  it("makes no forbidden claim in any rendered recognition state", () => {
    const states: SpeechRecognitionState[] = [
      IDLE,
      { status: "requesting-consent" },
      { status: "listening", attemptId: 1 },
      { status: "matched", attemptId: 1, evaluation: evalFor(model.targetJp) },
      { status: "close", attemptId: 1, evaluation: evalFor(model.targetJp) },
      { status: "retry", attemptId: 1, evaluation: evalFor("そらをとびます") },
      { status: "denied", attemptId: 1 },
      { status: "unsupported" },
    ];
    for (const state of states) {
      const html = renderView({ state, consentAcknowledged: true }).toLowerCase();
      for (const term of FORBIDDEN) {
        expect(html, `forbidden term "${term}" in ${state.status}`).not.toContain(
          term,
        );
      }
    }
  });
});

// ── Integration: exactly one optional block per lesson ────────────────────────

function renderLesson(path: string): string {
  return renderToStaticMarkup(
    createElement(
      SpeechRecognitionProvider,
      null,
      createElement(
        MemoryRouter,
        { initialEntries: [path] },
        createElement(
          LocaleProvider,
          null,
          createElement(
            ScriptProvider,
            null,
            createElement(
              ProgressProvider,
              null,
              createElement(
                Routes,
                null,
                createElement(Route, {
                  path: "/percorso/:moduleId/:lessonId",
                  element: createElement(LessonPage),
                }),
              ),
            ),
          ),
        ),
      ),
    ),
  );
}

describe("SpokenAttempt — integrated once per lesson, after exercises, before recap", () => {
  it.each([
    ["/percorso/sounds/sounds-1", "tool exploration"],
    ["/percorso/actions/actions-1", "transformation exploration"],
    ["/percorso/introductions/introductions-1", "journey/other"],
  ])("renders exactly one spoken-attempt block for %s", (path) => {
    const html = renderLesson(path);
    const blocks = html.match(/class="spoken-attempt[ "]/g) ?? [];
    expect(blocks.length).toBe(1);
  });

  it("places the block after the exercises and before the recap section", () => {
    const html = renderLesson("/percorso/actions/actions-1");
    const spoken = html.indexOf("spoken-attempt");
    const exercises = html.indexOf("lesson-exercises");
    const recap = html.indexOf('id="lesson-section-recap"');
    expect(exercises).toBeGreaterThan(-1);
    expect(spoken).toBeGreaterThan(exercises);
    expect(recap).toBeGreaterThan(spoken);
  });

  it("keeps exactly four lesson section anchors (no new route anchor)", () => {
    const html = renderLesson("/percorso/actions/actions-1");
    const sections = html.match(
      /class="lesson-section lesson-section-anchor"/g,
    );
    expect(sections).toHaveLength(4);
  });
});

// ── Container smoke test ──────────────────────────────────────────────────────

describe("SpokenAttempt container", () => {
  it("renders within the app providers without throwing", () => {
    const html = renderToStaticMarkup(
      createElement(
        SpeechRecognitionProvider,
        null,
        createElement(
          LocaleProvider,
          null,
          createElement(
            ScriptProvider,
            null,
            createElement(SpokenAttempt, { lessonId: "introductions-1" }),
          ),
        ),
      ),
    );
    expect(html).toContain("spoken-attempt");
  });
});
