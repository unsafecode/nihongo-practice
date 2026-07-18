import type { ReactElement, ReactNode } from "react";
import type { Script } from "../../settings/ScriptContext";
import type { CourseCopy } from "../i18n/types";
import type { SpeechRecognitionState } from "../speech/speechStateMachine";
import type { ResolvedSpeechPrompt, SegmentMatch } from "../speech/types";
import { JapaneseSegmentText } from "./JapaneseSegmentText";
import { RomajiSequence } from "../../romaji/RomajiSequence";
import type { AssembledToken } from "../../romaji/types";
import type { SpokenAttemptModel } from "./spokenAttemptModel";

/**
 * The optional in-lesson spoken attempt's shared presentational view and pure
 * handler wiring (Slice D plan Task 3; design spec §5.3, §12.1-§12.3), reused
 * unmodified by the live {@link A1SpokenAttempt} container in
 * `./A1SpokenAttempt.tsx`. Nested after the practice exercises inside the
 * explore section — never a new route anchor, never a lesson gate: every
 * lesson stays complete without speaking.
 *
 * What it does and does NOT do, by contract:
 *   - It reuses the existing `useSpeech` synthesis for honest model playback
 *     and the existing lesson-level {@link SpeechNotice} for degraded audio;
 *     it adds no second audio notice.
 *   - Before the first microphone use it shows an explicit, localized privacy
 *     disclosure. The acknowledge control only records app-notice consent (held
 *     in provider session memory) — it never calls the recognizer. A separate
 *     microphone control, shown only after consent, starts recognition.
 *   - Its copy is truthful: it states only whether the browser recognized the
 *     target sentence (matched / close / retry) or which mapped recognition
 *     state occurred. It makes no pronunciation, accuracy, accent, fluency,
 *     phoneme, score, grade, or percentage claim.
 *   - It never records an exercise attempt, resolves a review entry, or touches
 *     progress: a spoken attempt is practice only, with no scoring.
 *
 * The presentational {@link SpokenAttemptView} and the pure
 * {@link createSpokenAttemptHandlers} are exported so every visible state and the
 * consent/recognizer separation are unit-testable without a microphone.
 */

type SpokenAttemptCopy = CourseCopy["spokenAttempt"];

/** The recognizer/consent action surface the handlers drive. */
export interface SpokenAttemptRecognition {
  requestConsent(): void;
  acknowledgeConsent(): void;
  dismissConsent(): void;
  start(input: { readonly prompt: ResolvedSpeechPrompt }): void;
  abort(): void;
  reset(): void;
}

/** The synthesis playback surface the handlers drive. */
export interface SpokenAttemptSpeech {
  speak(text: string, opts?: { readonly key?: string; readonly rate?: number }): void;
}

/** The stable interaction surface the view invokes. */
export interface SpokenAttemptHandlers {
  onPlayModel(): void;
  onRequestConsent(): void;
  onAcknowledgeConsent(): void;
  onDismissConsent(): void;
  onStart(): void;
  onAbort(): void;
  onReset(): void;
}

/**
 * Map the view's intents onto the recognizer and synthesis. The acknowledge
 * intent is deliberately wired to `acknowledgeConsent` alone — it never starts
 * the recognizer — and only the explicit `onStart` (the separate mic control)
 * ever contacts the engine, with the resolved prompt to judge against.
 */
export function createSpokenAttemptHandlers(
  recognition: SpokenAttemptRecognition,
  speech: SpokenAttemptSpeech,
  model: SpokenAttemptModel,
  playbackKey: string,
): SpokenAttemptHandlers {
  return {
    onPlayModel: () =>
      speech.speak(model.targetJp, { key: playbackKey, rate: 0.9 }),
    onRequestConsent: () => recognition.requestConsent(),
    onAcknowledgeConsent: () => recognition.acknowledgeConsent(),
    onDismissConsent: () => recognition.dismissConsent(),
    onStart: () => recognition.start({ prompt: model.prompt }),
    onAbort: () => recognition.abort(),
    onReset: () => recognition.reset(),
  };
}

/** Whether a status is an in-flight attempt (only these carry an attempt id). */
function isActiveStatus(status: SpeechRecognitionState["status"]): boolean {
  return status === "listening" || status === "processing";
}

function isResultStatus(status: SpeechRecognitionState["status"]): boolean {
  return status === "matched" || status === "close" || status === "retry";
}

function isFailureStatus(status: SpeechRecognitionState["status"]): boolean {
  return (
    status === "denied" ||
    status === "no-speech" ||
    status === "aborted" ||
    status === "network-error" ||
    status === "service-error"
  );
}

/** The status/result/error announcement (text + shape) for the live region. */
function liveAnnouncement(
  state: SpeechRecognitionState,
  copy: SpokenAttemptCopy,
): { readonly glyph: string; readonly text: string } | null {
  switch (state.status) {
    case "listening":
      return { glyph: "●", text: copy.statusListening };
    case "processing":
      return { glyph: "…", text: copy.statusProcessing };
    case "matched":
      return { glyph: "✓", text: copy.resultMatched };
    case "close":
      return { glyph: "≈", text: copy.resultClose };
    case "retry":
      return { glyph: "↺", text: copy.resultRetry };
    case "denied":
      return { glyph: "!", text: copy.errorDenied };
    case "no-speech":
      return { glyph: "!", text: copy.errorNoSpeech };
    case "aborted":
      return { glyph: "■", text: copy.errorAborted };
    case "network-error":
      return { glyph: "!", text: copy.errorNetwork };
    case "service-error":
      return { glyph: "!", text: copy.errorService };
    default:
      return null;
  }
}

/** One target token rendered script-primary with the other script beneath. */
function SegmentGlyph({
  token,
  script,
}: {
  readonly token: AssembledToken;
  readonly script: Script;
}): ReactElement {
  const primaryIsJp = script === "hiragana";
  return (
    <span className="spoken-attempt__glyph">
      <span
        className="spoken-attempt__glyph-primary"
        lang={primaryIsJp ? "ja" : undefined}
      >
        {primaryIsJp ? (
          <JapaneseSegmentText jp={token.jp} reading={token.reading} />
        ) : (
          token.romaji
        )}
      </span>
      <span
        className="spoken-attempt__glyph-secondary"
        lang={primaryIsJp ? undefined : "ja"}
        aria-hidden="true"
      >
        {primaryIsJp ? token.romaji : token.jp}
      </span>
    </span>
  );
}

/** The always-available listen-and-repeat fallback (no scoring). */
function RepeatFallback({ copy }: { readonly copy: SpokenAttemptCopy }): ReactElement {
  return (
    <div className="spoken-attempt__repeat">
      <p className="spoken-attempt__repeat-title">{copy.repeatTitle}</p>
      <p className="spoken-attempt__repeat-body">{copy.repeatBody}</p>
    </div>
  );
}

/** The recognized transcript, shown only in the current state and never saved. */
function HeardTranscript({
  copy,
  transcript,
}: {
  readonly copy: SpokenAttemptCopy;
  readonly transcript: string;
}): ReactElement {
  return (
    <p className="spoken-attempt__heard">
      <span className="spoken-attempt__heard-label">{copy.heardLabel}</span>{" "}
      <span className="spoken-attempt__heard-text" lang="ja">
        {transcript}
      </span>
    </p>
  );
}

/** Ordered per-segment match records, distinguished by text + shape. */
function SegmentRecords({
  copy,
  model,
  matches,
}: {
  readonly copy: SpokenAttemptCopy;
  readonly model: SpokenAttemptModel;
  readonly matches: readonly SegmentMatch[];
}): ReactElement {
  const byId = new Map(model.segments.map((segment) => [segment.id, segment]));
  return (
    <ol className="spoken-attempt__segments" aria-label={copy.segmentsLabel}>
      {matches.map((match) => {
        const segment = byId.get(match.segmentId);
        return (
          <li
            key={match.segmentId}
            className={`spoken-attempt__segment ${
              match.matched
                ? "spoken-attempt__segment--matched"
                : "spoken-attempt__segment--missing"
            }`}
          >
            <span className="spoken-attempt__segment-glyph" aria-hidden="true">
              {match.matched ? "✓" : "✗"}
            </span>
            <span
              className="spoken-attempt__segment-jp"
              lang={segment ? "ja" : undefined}
            >
              {segment?.jp ?? copy.segmentUnavailable}
            </span>
            <span className="spoken-attempt__segment-state">
              {match.matched ? copy.segmentMatched : copy.segmentMissing}
            </span>
            {segment?.critical ? (
              <span className="spoken-attempt__segment-critical">
                {copy.criticalLabel}
              </span>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

export interface SpokenAttemptViewProps {
  readonly model: SpokenAttemptModel;
  readonly copy: SpokenAttemptCopy;
  readonly script: Script;
  readonly state: SpeechRecognitionState;
  /** Whether a recognition engine was feature-detected. */
  readonly supported: boolean;
  /** App-notice consent acknowledgement — provider session memory only. */
  readonly consentAcknowledged: boolean;
  /** Whether synthesis playback is available (existing SpeechNotice covers gaps). */
  readonly synthesisSupported: boolean;
  /** The currently-speaking playback key, if any (from useSpeech). */
  readonly speakingKey: string | null;
  readonly idBase: string;
  /** Localized copy shown instead of a raw/concatenated fallback when a
   * target token cannot be resolved into a real semantic romaji sequence
   * (romaji boundaries plan Task 4; master spec §13.2-13.3). */
  readonly errorText: string;
  readonly handlers: SpokenAttemptHandlers;
}

/**
 * The pure spoken-attempt view. Every recognition state maps to a distinct,
 * localized region conveyed by text plus a shape glyph (never colour alone); the
 * status/result/error text lives in a single polite live region that never
 * steals focus. Playback and the listen-and-repeat fallback stay available on
 * every unsupported/error path.
 */
export function SpokenAttemptView({
  model,
  copy,
  script,
  state,
  supported,
  consentAcknowledged,
  synthesisSupported,
  speakingKey,
  idBase,
  errorText,
  handlers,
}: SpokenAttemptViewProps): ReactElement {
  const headingId = `${idBase}-heading`;
  const statusRegionId = `${idBase}-status`;
  const playKey = `${idBase}-model`;
  const isPlaying = speakingKey === playKey;
  const status = state.status;
  const unsupported = !supported || status === "unsupported";
  const announcement = liveAnnouncement(state, copy);

  let recognitionRegion: ReactNode;
  if (unsupported) {
    recognitionRegion = (
      <div className="spoken-attempt__fallback">
        <p className="spoken-attempt__notice">
          <span className="spoken-attempt__notice-glyph" aria-hidden="true">
            !
          </span>{" "}
          {copy.errorUnsupported}
        </p>
        <RepeatFallback copy={copy} />
      </div>
    );
  } else if (!consentAcknowledged) {
    recognitionRegion =
      status === "requesting-consent" ? (
        <div
          className="spoken-attempt__consent"
          role="group"
          aria-labelledby={`${idBase}-consent-title`}
        >
          <h4
            id={`${idBase}-consent-title`}
            className="spoken-attempt__consent-title"
          >
            {copy.consentTitle}
          </h4>
          <p className="spoken-attempt__consent-body">{copy.consentBody}</p>
          <div className="spoken-attempt__actions">
            <button
              type="button"
              className="action action--primary spoken-attempt__button"
              onClick={handlers.onAcknowledgeConsent}
            >
              {copy.consentAcknowledge}
            </button>
            <button
              type="button"
              className="action action--inline spoken-attempt__button"
              onClick={handlers.onDismissConsent}
            >
              {copy.consentDismiss}
            </button>
          </div>
        </div>
      ) : (
        <div className="spoken-attempt__actions">
          <button
            type="button"
            className="action action--primary spoken-attempt__button"
            onClick={handlers.onRequestConsent}
          >
            {copy.tryButton}
          </button>
        </div>
      );
  } else {
    const active = isActiveStatus(status);
    const result = isResultStatus(status);
    const failure = isFailureStatus(status);
    const showRepeat = status === "close" || status === "retry" || failure;

    const transcript =
      state.status === "processing"
        ? state.transcript.original
        : result && "evaluation" in state
          ? state.evaluation.transcript.original
          : null;

    recognitionRegion = (
      <div className="spoken-attempt__mic">
        <div className="spoken-attempt__actions">
          {active ? (
            <button
              type="button"
              className="action action--secondary spoken-attempt__button"
              onClick={handlers.onAbort}
              aria-describedby={statusRegionId}
            >
              {copy.micStop}
            </button>
          ) : result || failure ? (
            <button
              type="button"
              className="action action--primary spoken-attempt__button"
              onClick={handlers.onStart}
              aria-describedby={statusRegionId}
            >
              {copy.tryAgain}
            </button>
          ) : (
            <button
              type="button"
              className="action action--primary spoken-attempt__button"
              onClick={handlers.onStart}
              aria-describedby={statusRegionId}
            >
              {copy.micStart}
            </button>
          )}
        </div>

        {transcript !== null ? (
          <HeardTranscript copy={copy} transcript={transcript} />
        ) : null}

        {result && "evaluation" in state ? (
          <SegmentRecords
            copy={copy}
            model={model}
            matches={state.evaluation.segmentMatches}
          />
        ) : null}

        {showRepeat ? <RepeatFallback copy={copy} /> : null}
      </div>
    );
  }

  return (
    <div
      className="spoken-attempt"
      role="group"
      aria-labelledby={headingId}
    >
      <h3 id={headingId} className="spoken-attempt__heading">
        {copy.heading}
      </h3>
      <p className="spoken-attempt__intro">{copy.intro}</p>

      <div className="spoken-attempt__target">
        <p className="spoken-attempt__region-label">{copy.targetLabel}</p>
        <p className="spoken-attempt__sentence">
          <RomajiSequence
            tokens={model.segments.map((segment) => segment.token)}
            errorText={errorText}
            renderToken={(token) => (
              <SegmentGlyph token={token} script={script} />
            )}
          />
        </p>
        <p className="spoken-attempt__meaning">
          <span className="spoken-attempt__meaning-label">
            {copy.meaningLabel}:
          </span>{" "}
          {model.meaning}
        </p>
      </div>

      <div className="spoken-attempt__controls">
        {synthesisSupported ? (
          <button
            type="button"
            className="action action--secondary spoken-attempt__button spoken-attempt__play"
            onClick={handlers.onPlayModel}
          >
            {isPlaying ? copy.playing : copy.listen}
          </button>
        ) : null}
        {recognitionRegion}
      </div>

      <p
        className="spoken-attempt__status"
        id={statusRegionId}
        role="status"
        aria-live="polite"
        aria-label={copy.statusRegionLabel}
      >
        {announcement ? (
          <>
            <span className="spoken-attempt__status-glyph" aria-hidden="true">
              {announcement.glyph}
            </span>{" "}
            <span className="spoken-attempt__status-text">
              {announcement.text}
            </span>
          </>
        ) : null}
      </p>
    </div>
  );
}
