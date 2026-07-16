import type { SpeechRecognizer } from "./SpeechRecognizer";

/**
 * The E2E recognizer injection seam (Slice D plan Task 4). An acceptance harness
 * installs a fake that satisfies exactly the public {@link SpeechRecognizer}
 * contract on `window[SPEECH_RECOGNIZER_INJECTION_KEY]` *before the app boots*
 * (via `page.addInitScript`); the composition root reads it here and hands it to
 * the {@link SpeechRecognitionProvider}.
 *
 * Production never sets the global, so this resolves to `undefined` and the
 * provider falls back to the real browser adapter — there is no behaviour change
 * when the seam is unused. The seam only *reads* a recognizer that already
 * satisfies the public contract; it never patches component internals, never
 * relaxes a recognizer guarantee, and takes no responsibility for network
 * behaviour, which the injected recognizer alone owns (the E2E fake makes none).
 */
export const SPEECH_RECOGNIZER_INJECTION_KEY = "__nihongoSpeechRecognizer__";

/** A minimal structural check that a candidate satisfies the public contract. */
function isSpeechRecognizer(value: unknown): value is SpeechRecognizer {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.supported === "boolean" &&
    typeof candidate.recognize === "function" &&
    typeof candidate.abort === "function"
  );
}

/**
 * Resolve an externally-injected recognizer, or `undefined` when none is present
 * (the production default). Reading the global is side-effect free and safe in a
 * non-browser environment.
 */
export function resolveInjectedSpeechRecognizer(): SpeechRecognizer | undefined {
  if (typeof window === "undefined") return undefined;
  const candidate = (window as unknown as Record<string, unknown>)[
    SPEECH_RECOGNIZER_INJECTION_KEY
  ];
  return isSpeechRecognizer(candidate) ? candidate : undefined;
}
