import type { RecognitionOutcome } from "./types";

/**
 * The browser-independent speech recognition boundary (design spec §12.2, Slice
 * D plan Task 2). Consumers depend only on this contract and the Task 1
 * {@link RecognitionOutcome} shapes; they never see a `SpeechRecognition`
 * instance, a `SpeechRecognitionEvent`, or a `SpeechRecognitionErrorEvent`. The
 * production browser adapter, an injected unit-test fake, and a later E2E stub
 * all satisfy exactly this interface, so nothing above it can couple to a
 * vendor engine.
 */

/**
 * The single recognition request shape. The application only ever recognizes
 * Japanese, so `lang` is pinned to the BCP-47 tag `ja-JP` rather than left open.
 */
export interface RecognizeRequest {
  readonly lang: "ja-JP";
}

/**
 * A replaceable speech recognizer. `recognize` settles exactly one outcome per
 * call and never rejects with a vendor error — every failure is mapped to a
 * typed {@link RecognitionOutcome}. `abort` stops any in-flight request and is a
 * safe, idempotent no-op when nothing is active.
 */
export interface SpeechRecognizer {
  /** Whether a usable recognition engine was feature-detected. */
  readonly supported: boolean;
  recognize(request: RecognizeRequest): Promise<RecognitionOutcome>;
  abort(): void;
}
