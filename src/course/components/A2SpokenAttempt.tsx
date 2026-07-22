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
import { getA2SpokenAttemptModel } from "./a2SpokenAttemptModel";

/**
 * The A2 release's lesson-embedded spoken attempt container (Phase 3 Task 8),
 * a near-exact mirror of `A1SpokenAttempt` — same lesson-transition reset
 * effect, same `idBase` convention, same handler wiring — differing only in
 * resolving `getA2SpokenAttemptModel` (the A2-native model built from the A2
 * release catalog's realized guided-target tokens). Reusing
 * `SpokenAttemptView`/`createSpokenAttemptHandlers` unmodified means every
 * consent/recognizer/evaluator/truthful-copy/synthesis/listen-repeat fallback
 * contract applies unchanged: no pronunciation grade, no transcript
 * persistence, no required microphone, no network access, and honest
 * unsupported/error/no-speech states (design spec §20).
 *
 * When the model cannot resolve (a defensive branch the validated release
 * catalog never hits for a real A2 lesson id), it renders nothing so the rest
 * of the lesson stays complete without a spoken attempt.
 */
export function A2SpokenAttempt({
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
      recognition.reset();
    }
    return () => {
      if (previousLessonId.current === mountedLessonId) recognition.abort();
    };
  }, [lessonId, recognition.abort, recognition.reset]);

  const result = getA2SpokenAttemptModel(lessonId, locale);
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
