import { useEffect, useRef, type ReactElement } from "react";
import { useLocale } from "../../i18n/LocaleContext";
import { useScript } from "../../settings/ScriptContext";
import { useSpeech } from "../../hooks/useSpeech";
import { getCourseCopy } from "../i18n/catalog";
import { initialSpeechState } from "../speech/speechStateMachine";
import { useSpeechRecognition } from "../speech/SpeechRecognitionContext";
import {
  createSpokenAttemptHandlers,
  SpokenAttemptView,
} from "./SpokenAttempt";
import { getA1SpokenAttemptModel } from "./a1SpokenAttemptModel";

/**
 * The A1 release's lesson-embedded spoken attempt container (Phase 2 Task 6,
 * master task point 4). It is a near-exact mirror of the legacy
 * `SpokenAttempt` container in `./SpokenAttempt.tsx` — same lesson-transition
 * reset effect, same `idBase` convention, same handler wiring — differing
 * only in resolving `getA1SpokenAttemptModel` (the A1-native model, built
 * directly from the release catalog's realized tokens) instead of the
 * legacy, pre-A1 example-catalog-bound `getSpokenAttemptModel`. Reusing
 * `SpokenAttemptView`/`createSpokenAttemptHandlers` unmodified means every
 * existing consent/recognizer/evaluator/truthful-copy/synthesis/listen-repeat
 * fallback contract in `SpokenAttempt.tsx` applies unchanged here: no
 * pronunciation grade, no transcript persistence, no required microphone, no
 * network access.
 *
 * When the model cannot resolve (a defensive branch the validated release
 * catalog never hits for any of the 64 live lesson ids), it renders nothing
 * so the rest of the lesson stays complete without a spoken attempt.
 */
export function A1SpokenAttempt({
  lessonId,
}: {
  readonly lessonId: string;
}): ReactElement | null {
  const { locale } = useLocale();
  const { script } = useScript();
  const speech = useSpeech();
  const recognition = useSpeechRecognition();
  const previousLessonId = useRef(lessonId);
  const lessonChanged = previousLessonId.current !== lessonId;

  useEffect(() => {
    const mountedLessonId = lessonId;
    if (previousLessonId.current !== lessonId) {
      previousLessonId.current = lessonId;
      // A lesson transition owns a fresh attempt state, but consent remains a
      // session-level acknowledgement in the persistent provider.
      recognition.reset();
    }
    return () => {
      if (previousLessonId.current === mountedLessonId) recognition.abort();
    };
  }, [lessonId, recognition.abort, recognition.reset]);

  const result = getA1SpokenAttemptModel(lessonId, locale);
  if (!result.ok) return null;

  const model = result.model;
  const copy = getCourseCopy(locale).spokenAttempt;
  const errorText = getCourseCopy(locale).lesson.contentFormattingError;
  const idBase = `spoken-${lessonId}`;
  const handlers = createSpokenAttemptHandlers(
    recognition,
    speech,
    model,
    `${idBase}-model`,
  );

  return (
    <SpokenAttemptView
      model={model}
      copy={copy}
      script={script}
      // Hide the previous lesson's result during the render before the reset
      // effect commits, avoiding a one-frame stale transcript/segment flash.
      state={lessonChanged ? initialSpeechState : recognition.state}
      supported={recognition.supported}
      consentAcknowledged={recognition.consentAcknowledged}
      synthesisSupported={speech.supported}
      speakingKey={speech.speakingKey}
      idBase={idBase}
      errorText={errorText}
      handlers={handlers}
    />
  );
}
