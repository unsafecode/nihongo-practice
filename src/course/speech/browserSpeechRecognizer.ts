import type { RecognizeRequest, SpeechRecognizer } from "./SpeechRecognizer";
import type { RecognitionFailure, RecognitionOutcome } from "./types";

/**
 * The production Web Speech adapter (design spec §12.2, Slice D plan Task 2). It
 * maps a vendor `SpeechRecognition` engine onto the browser-independent
 * {@link SpeechRecognizer} contract. Consumers never receive a
 * `SpeechRecognition` instance or any vendor event: every result and error is
 * mapped to a typed {@link RecognitionOutcome}.
 *
 * The adapter keeps deliberately minimal, local browser-event types instead of
 * widening the global DOM lib, so the rest of the app depends on nothing
 * vendor-specific. It guarantees exactly one active request, settles each
 * request exactly once, and detaches all handlers on every terminal path so a
 * late vendor event can never resurface after settlement.
 */

/** One recognition alternative — the adapter only reads its transcript text. */
export interface MinimalSpeechRecognitionAlternative {
  readonly transcript: string;
}

/** One recognition result: an ordered list of alternatives. */
export interface MinimalSpeechRecognitionResult {
  readonly length: number;
  readonly [index: number]: MinimalSpeechRecognitionAlternative;
  item?(index: number): MinimalSpeechRecognitionAlternative;
}

/** The ordered list of results a recognition event carries. */
export interface MinimalSpeechRecognitionResultList {
  readonly length: number;
  readonly [index: number]: MinimalSpeechRecognitionResult;
  item?(index: number): MinimalSpeechRecognitionResult;
}

/** The `result` event shape — only its `results` list is read. */
export interface MinimalSpeechRecognitionResultEvent {
  readonly results: MinimalSpeechRecognitionResultList;
}

/** The `error` event shape — only its vendor error code string is read. */
export interface MinimalSpeechRecognitionErrorEvent {
  readonly error: string;
}

/**
 * The minimal surface of a vendor `SpeechRecognition` the adapter uses. Only the
 * configuration flags, lifecycle handlers, and `start`/`abort` are modelled.
 */
export interface MinimalSpeechRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: MinimalSpeechRecognitionResultEvent) => void) | null;
  onerror: ((event: MinimalSpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  abort(): void;
}

/** Constructs a fresh recognition instance; injected in tests, resolved in prod. */
export type SpeechRecognitionFactory = () => MinimalSpeechRecognition;

/** A development-only diagnostic sink. It MUST NOT reach a consumer outcome. */
export type SpeechDiagnostic = (message: string, detail?: unknown) => void;

/** Log a development diagnostic without ever surfacing it to consumers. */
function defaultDiagnostic(message: string, detail?: unknown): void {
  if (import.meta.env?.DEV) {
    // eslint-disable-next-line no-console
    console.error(`[speech] ${message}`, detail);
  }
}

/**
 * Feature-detect a vendor recognition constructor. Returns `null` outside a
 * browser or when neither `SpeechRecognition` nor `webkitSpeechRecognition`
 * exists, so the recognizer reports itself unsupported rather than throwing.
 */
function resolveBrowserFactory(): SpeechRecognitionFactory | null {
  if (typeof window === "undefined") return null;
  const candidate = window as unknown as {
    SpeechRecognition?: new () => MinimalSpeechRecognition;
    webkitSpeechRecognition?: new () => MinimalSpeechRecognition;
  };
  const Recognition = candidate.SpeechRecognition ?? candidate.webkitSpeechRecognition;
  if (!Recognition) return null;
  return () => new Recognition();
}

/** Map a vendor error code onto the browser-independent failure taxonomy. */
function mapErrorCode(error: string): RecognitionFailure {
  switch (error) {
    case "not-allowed":
    case "service-not-allowed":
      return "denied";
    case "no-speech":
      return "no-speech";
    case "aborted":
      return "aborted";
    case "network":
      return "network-error";
    default:
      return "service-error";
  }
}

/** Extract the top transcript, or `null` when the result carries none. */
function readTranscript(event: MinimalSpeechRecognitionResultEvent): string | null {
  const results = event.results;
  if (!results || results.length === 0) return null;
  const firstResult = results[0] ?? results.item?.(0);
  if (!firstResult || firstResult.length === 0) return null;
  const alternative = firstResult[0] ?? firstResult.item?.(0);
  const transcript = alternative?.transcript;
  return typeof transcript === "string" ? transcript : null;
}

interface ActiveRequest {
  readonly instance: MinimalSpeechRecognition;
  settle(outcome: RecognitionOutcome): void;
}

/**
 * Create a browser speech recognizer. Pass a `createRecognition` factory to
 * inject a fake in tests; omit it to feature-detect the production engine, or
 * pass `null` to force an unsupported recognizer. The optional `diagnostic`
 * receives development-only messages for unexpected engine failures.
 */
export function createBrowserSpeechRecognizer(
  createRecognition: SpeechRecognitionFactory | null | undefined = resolveBrowserFactory(),
  diagnostic: SpeechDiagnostic = defaultDiagnostic,
): SpeechRecognizer {
  const factory = createRecognition ?? null;
  let active: ActiveRequest | null = null;

  function detach(instance: MinimalSpeechRecognition): void {
    instance.onresult = null;
    instance.onerror = null;
    instance.onend = null;
  }

  function recognize(request: RecognizeRequest): Promise<RecognitionOutcome> {
    if (!factory) {
      return Promise.resolve({ kind: "failure", failure: "unsupported" });
    }
    if (active) {
      // Exactly one active request: a concurrent call is a typed service error
      // and never overwrites or disturbs the pending request.
      return Promise.resolve({ kind: "failure", failure: "service-error" });
    }

    return new Promise<RecognitionOutcome>((resolve) => {
      let instance: MinimalSpeechRecognition;
      try {
        instance = factory();
        instance.lang = request.lang;
        instance.continuous = false;
        instance.interimResults = false;
        instance.maxAlternatives = 1;
      } catch (error) {
        diagnostic("recognition engine construction failed", error);
        active = null;
        resolve({ kind: "failure", failure: "service-error" });
        return;
      }

      const current: ActiveRequest = {
        instance,
        settle(outcome) {
          // Settle exactly once: ignore every later event for this request.
          if (active !== current) return;
          active = null;
          detach(instance);
          resolve(outcome);
        },
      };
      active = current;

      instance.onresult = (event) => {
        const transcript = readTranscript(event);
        current.settle(
          transcript === null
            ? { kind: "failure", failure: "service-error" }
            : { kind: "transcript", transcript },
        );
      };
      instance.onerror = (event) => {
        const failure = mapErrorCode(event.error);
        if (failure === "service-error") {
          diagnostic("recognition engine reported an unmapped error", event.error);
        }
        current.settle({ kind: "failure", failure });
      };
      instance.onend = () => {
        // A terminal end with no prior result or error is unexpected. The safe,
        // non-fabricating mapping is the service-error catch-all — never a
        // transcript and never a specific failure the engine did not report.
        current.settle({ kind: "failure", failure: "service-error" });
      };

      try {
        instance.start();
      } catch (error) {
        diagnostic("recognition engine start failed", error);
        current.settle({ kind: "failure", failure: "service-error" });
      }
    });
  }

  function abort(): void {
    const current = active;
    if (!current) return; // No active request is a safe, idempotent no-op.
    current.settle({ kind: "failure", failure: "aborted" });
    try {
      current.instance.abort();
    } catch (error) {
      diagnostic("recognition engine abort failed", error);
    }
  }

  return { supported: factory !== null, recognize, abort };
}
