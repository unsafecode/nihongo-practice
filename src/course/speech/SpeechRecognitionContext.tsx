import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  createBrowserSpeechRecognizer,
} from "./browserSpeechRecognizer";
import { evaluateTranscript } from "./evaluateTranscript";
import { normalizeTranscript } from "./normalizeTranscript";
import type { SpeechRecognizer } from "./SpeechRecognizer";
import {
  type AttemptId,
  type SpeechRecognitionState,
  initialSpeechState,
  reduceSpeechState,
} from "./speechStateMachine";
import type {
  RecognitionOutcome,
  ResolvedSpeechPrompt,
  TranscriptEvaluator,
} from "./types";

/**
 * The React speech recognition boundary (design spec §12.2, Slice D plan Task
 * 2). A framework-agnostic controller wires the replaceable
 * {@link SpeechRecognizer}, the pure {@link reduceSpeechState} machine, and the
 * pure {@link TranscriptEvaluator}; the provider renders it through
 * `useSyncExternalStore`. Extracting the controller keeps every transition,
 * attempt-ID fence, and consent rule testable without a DOM and free of the
 * stale-closure and unmount races a hook-only implementation would risk.
 *
 * Consent here is an app notice held in React session memory only. The
 * controller never reads, infers, or persists the OS microphone permission, and
 * never writes to `localStorage`.
 */

/** The default evaluator: the Task 1 pure normalizer and comparator. */
export const defaultTranscriptEvaluator: TranscriptEvaluator = {
  normalize: normalizeTranscript,
  evaluate: evaluateTranscript,
};

/** The input an explicit spoken attempt needs: the prompt to judge against. */
export interface SpeechStartInput {
  readonly prompt: ResolvedSpeechPrompt;
}

/** The reactive snapshot the provider exposes to consumers. */
export interface SpeechRecognitionSnapshot {
  readonly state: SpeechRecognitionState;
  /** App-notice consent acknowledgement — session memory only. */
  readonly consentAcknowledged: boolean;
  /** Whether a recognition engine was feature-detected. */
  readonly supported: boolean;
}

/** The typed action surface, stable for the lifetime of a controller. */
export interface SpeechRecognitionActions {
  requestConsent(): void;
  acknowledgeConsent(): void;
  dismissConsent(): void;
  start(input: SpeechStartInput): void;
  abort(): void;
  reset(): void;
}

/** The framework-agnostic controller the provider renders. */
export interface SpeechRecognitionController extends SpeechRecognitionActions {
  getSnapshot(): SpeechRecognitionSnapshot;
  subscribe(listener: () => void): () => void;
}

export interface SpeechRecognitionControllerDeps {
  readonly recognizer: SpeechRecognizer;
  readonly evaluator: TranscriptEvaluator;
}

/**
 * Create the speech recognition controller. It owns the recognizer promise, the
 * reducer state, the current attempt ID, and the app-notice consent flag. All
 * updates flow through the pure reducer, and a cached snapshot keeps
 * `getSnapshot` referentially stable between changes for `useSyncExternalStore`.
 */
export function createSpeechRecognitionController(
  deps: SpeechRecognitionControllerDeps,
): SpeechRecognitionController {
  const { recognizer, evaluator } = deps;
  const listeners = new Set<() => void>();

  let state: SpeechRecognitionState = initialSpeechState;
  let consentAcknowledged = false;
  let attemptCounter = 0;
  let activeAttemptId: AttemptId | null = null;
  let snapshot: SpeechRecognitionSnapshot = {
    state,
    consentAcknowledged,
    supported: recognizer.supported,
  };

  function emit(): void {
    snapshot = { state, consentAcknowledged, supported: recognizer.supported };
    for (const listener of listeners) listener();
  }

  /** Apply an event through the pure reducer; report whether state changed. */
  function apply(
    event: Parameters<typeof reduceSpeechState>[1],
  ): boolean {
    const next = reduceSpeechState(state, event);
    if (next === state) return false;
    state = next;
    return true;
  }

  async function runRecognition(
    attemptId: AttemptId,
    input: SpeechStartInput,
  ): Promise<void> {
    let outcome: RecognitionOutcome;
    try {
      outcome = await recognizer.recognize({ lang: "ja-JP" });
    } catch {
      outcome = { kind: "failure", failure: "service-error" };
    }
    // Stale-attempt fence: a replaced or aborted attempt no longer owns state.
    if (activeAttemptId !== attemptId) return;

    if (outcome.kind === "failure") {
      activeAttemptId = null;
      if (apply({ type: "failed", attemptId, failure: outcome.failure })) emit();
      return;
    }

    const normalized = evaluator.normalize(outcome.transcript);
    const transcriptChanged = apply({
      type: "transcript",
      attemptId,
      transcript: normalized,
    });
    if (!transcriptChanged) return;
    // Let subscribers (and React's external-store bridge) observe processing
    // before evaluation can publish a terminal result.
    emit();
    await Promise.resolve();
    // A subscriber may abort/reset or start a replacement attempt while the
    // processing snapshot is visible. Never evaluate for that stale attempt.
    if (
      activeAttemptId !== attemptId ||
      state.status !== "processing" ||
      state.attemptId !== attemptId
    ) {
      return;
    }
    const evaluation = evaluator.evaluate(normalized, input.prompt);
    activeAttemptId = null;
    if (apply({ type: "evaluated", attemptId, evaluation })) emit();
  }

  function requestConsent(): void {
    if (apply({ type: "consent-requested" })) emit();
  }

  function acknowledgeConsent(): void {
    let changed = false;
    if (!consentAcknowledged) {
      consentAcknowledged = true;
      changed = true;
    }
    // Acknowledging also clears the consent notice if it is showing.
    if (apply({ type: "consent-dismissed" })) changed = true;
    if (changed) emit();
  }

  function dismissConsent(): void {
    if (apply({ type: "consent-dismissed" })) emit();
  }

  function start(input: SpeechStartInput): void {
    // Only an explicit start after consent may call the recognizer. Without
    // consent, surface the app notice instead of contacting the engine.
    if (!consentAcknowledged) {
      if (apply({ type: "consent-requested" })) emit();
      return;
    }
    if (!recognizer.supported) {
      if (apply({ type: "unsupported" })) emit();
      return;
    }
    if (state.status === "listening" || state.status === "processing") return;

    const attemptId = (attemptCounter += 1);
    activeAttemptId = attemptId;
    if (apply({ type: "started", attemptId })) emit();
    void runRecognition(attemptId, input);
  }

  function abort(): void {
    // Abort is visible and idempotent. Stop any engine instance regardless.
    recognizer.abort();
    if (activeAttemptId === null) return;
    const attemptId = activeAttemptId;
    activeAttemptId = null;
    if (apply({ type: "aborted", attemptId })) emit();
  }

  function reset(): void {
    recognizer.abort();
    activeAttemptId = null;
    if (apply({ type: "reset" })) emit();
  }

  return {
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    requestConsent,
    acknowledgeConsent,
    dismissConsent,
    start,
    abort,
    reset,
  };
}

/** The context value: the reactive snapshot plus the stable action surface. */
export interface SpeechRecognitionContextValue
  extends SpeechRecognitionSnapshot,
    SpeechRecognitionActions {}

const SpeechRecognitionContext = createContext<
  SpeechRecognitionContextValue | undefined
>(undefined);

export interface SpeechRecognitionProviderProps {
  readonly children: ReactNode;
  /** Inject a recognizer for unit/E2E stubs; defaults to the browser adapter. */
  readonly recognizer?: SpeechRecognizer;
  /** Inject an evaluator; defaults to the Task 1 pure evaluator. */
  readonly evaluator?: TranscriptEvaluator;
}

/**
 * Provide the speech recognition controller. By default it creates the
 * production browser adapter; unit and E2E callers inject a stub recognizer (and
 * optionally an evaluator). The controller is created once per provider instance
 * and aborted on unmount so a route change never leaves a request in flight.
 */
export function SpeechRecognitionProvider({
  children,
  recognizer,
  evaluator,
}: SpeechRecognitionProviderProps) {
  const controllerRef = useRef<SpeechRecognitionController>();
  if (!controllerRef.current) {
    controllerRef.current = createSpeechRecognitionController({
      recognizer: recognizer ?? createBrowserSpeechRecognizer(),
      evaluator: evaluator ?? defaultTranscriptEvaluator,
    });
  }
  const controller = controllerRef.current;

  const snapshot = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  );

  useEffect(() => () => controller.abort(), [controller]);

  const value = useMemo<SpeechRecognitionContextValue>(
    () => ({
      state: snapshot.state,
      consentAcknowledged: snapshot.consentAcknowledged,
      supported: snapshot.supported,
      requestConsent: controller.requestConsent,
      acknowledgeConsent: controller.acknowledgeConsent,
      dismissConsent: controller.dismissConsent,
      start: controller.start,
      abort: controller.abort,
      reset: controller.reset,
    }),
    [snapshot, controller],
  );

  return (
    <SpeechRecognitionContext.Provider value={value}>
      {children}
    </SpeechRecognitionContext.Provider>
  );
}

export function useSpeechRecognition(): SpeechRecognitionContextValue {
  const value = useContext(SpeechRecognitionContext);
  if (!value) {
    throw new Error(
      "useSpeechRecognition must be used within a SpeechRecognitionProvider",
    );
  }
  return value;
}
