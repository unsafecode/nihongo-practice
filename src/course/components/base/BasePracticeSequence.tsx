import { useEffect, useRef, useState, type ReactElement } from "react";
import { useSpeech } from "../../../hooks/useSpeech";
import { RomajiSequence } from "../../../romaji/RomajiSequence";
import type {
  BaseChoicePracticeActivity,
  BasePracticeActivity,
  BaseRevealPracticeActivity,
  BaseSpokenPracticeActivity,
  BaseTileOrderingPracticeActivity,
} from "../../base/view/buildBasePracticeModel";
import {
  resolvePromptFromTokens,
  segmentsFromTokens,
} from "../a1SpokenAttemptModel";
import type { SpokenAttemptModel } from "../spokenAttemptModel";
import { createSpokenAttemptHandlers } from "../SpokenAttempt";
import { useSpeechRecognition } from "../../speech/SpeechRecognitionContext";
import type { CourseCopy } from "../../i18n/types";
import { JapaneseSegmentText } from "../JapaneseSegmentText";
import { BaseAudioButton } from "./BaseAudioButton";
import { BaseListeningActivity } from "./BaseListeningActivity";

export type BaseAttemptOutcome = "accepted" | "retry";

export interface BasePracticeSequenceProps {
  readonly lessonId: string;
  readonly activities: readonly BasePracticeActivity[];
  readonly copy: CourseCopy;
  readonly onAttempt?: (activityId: string, outcome: BaseAttemptOutcome) => void;
}

function StatusLine({
  status,
  copy,
}: {
  readonly status: "idle" | BaseAttemptOutcome;
  readonly copy: CourseCopy["baseLesson"];
}): ReactElement | null {
  if (status === "idle") return null;
  return (
    <p className="base-practice-activity__status" role="status" aria-live="polite">
      {status === "accepted" ? copy.practice.accepted : copy.practice.retry}
    </p>
  );
}

function ChoiceCard({
  activity,
  idBase,
  copy,
  onAttempt,
}: {
  readonly activity: BaseChoicePracticeActivity;
  readonly idBase: string;
  readonly copy: CourseCopy["baseLesson"];
  readonly onAttempt: (outcome: BaseAttemptOutcome) => void;
}): ReactElement {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | BaseAttemptOutcome>("idle");

  function submit(): void {
    if (!selectedId) return;
    const outcome: BaseAttemptOutcome =
      selectedId === activity.correctOptionId ? "accepted" : "retry";
    setStatus(outcome);
    onAttempt(outcome);
  }

  return (
    <div
      className="base-practice-activity base-practice-activity--choice"
      data-activity-id={activity.id}
      data-category={activity.category}
    >
      <fieldset className="base-practice-activity__options">
        <legend>{copy.practice.optionsLabel}</legend>
        {activity.options.map((option) => (
          <label key={option.id} className="base-practice-activity__option">
            <input
              type="radio"
              name={`${idBase}-options`}
              value={option.id}
              checked={selectedId === option.id}
              onChange={() => {
                setSelectedId(option.id);
                setStatus("idle");
              }}
            />
            <span lang="ja">
              {option.tokens.map((token) => (
                <JapaneseSegmentText key={token.id} jp={token.jp} reading={token.reading} />
              ))}
            </span>
          </label>
        ))}
      </fieldset>
      <button type="button" className="action action--primary" onClick={submit}>
        {copy.practice.submit}
      </button>
      <StatusLine status={status} copy={copy} />
    </div>
  );
}

function TileOrderingCard({
  activity,
  idBase,
  copy,
  onAttempt,
}: {
  readonly activity: BaseTileOrderingPracticeActivity;
  readonly idBase: string;
  readonly copy: CourseCopy["baseLesson"];
  readonly onAttempt: (outcome: BaseAttemptOutcome) => void;
}): ReactElement {
  // The bank order is sorted by each tile's own opaque id — deterministic,
  // but uncorrelated with the canonical (answer) order, so the bank is never
  // pre-shuffled into the right answer.
  const bank = [...activity.tiles].sort((left, right) =>
    left.id < right.id ? -1 : left.id > right.id ? 1 : 0,
  );
  const [placedIds, setPlacedIds] = useState<readonly string[]>([]);
  const [status, setStatus] = useState<"idle" | BaseAttemptOutcome>("idle");
  const tileById = new Map(activity.tiles.map((tile) => [tile.id, tile]));
  const placedSet = new Set(placedIds);

  function submit(): void {
    const matches =
      placedIds.length === activity.correctTileIds.length &&
      placedIds.every((id, index) => id === activity.correctTileIds[index]);
    const outcome: BaseAttemptOutcome = matches ? "accepted" : "retry";
    setStatus(outcome);
    onAttempt(outcome);
  }

  return (
    <div
      className="base-practice-activity base-practice-activity--tile-ordering"
      data-activity-id={activity.id}
      data-category={activity.category}
    >
      <div
        className="base-practice-activity__bank"
        id={`${idBase}-bank`}
        aria-label={copy.practice.tileBankLabel}
      >
        {bank
          .filter((tile) => !placedSet.has(tile.id))
          .map((tile) => (
            <button
              key={tile.id}
              type="button"
              data-tile-id={tile.id}
              onClick={() => {
                setPlacedIds((current) => [...current, tile.id]);
                setStatus("idle");
              }}
            >
              <span lang="ja">
                <JapaneseSegmentText jp={tile.token.jp} reading={tile.token.reading} />
              </span>
            </button>
          ))}
      </div>
      <div className="base-practice-activity__answer" aria-label={copy.practice.tileAnswerLabel}>
        {placedIds.map((id) => {
          const tile = tileById.get(id);
          if (!tile) return null;
          return (
            <button
              key={id}
              type="button"
              data-tile-id={tile.id}
              onClick={() => {
                setPlacedIds((current) => current.filter((placed) => placed !== id));
                setStatus("idle");
              }}
            >
              <span lang="ja">
                <JapaneseSegmentText jp={tile.token.jp} reading={tile.token.reading} />
              </span>
            </button>
          );
        })}
      </div>
      <button type="button" className="action action--primary" onClick={submit}>
        {copy.practice.submit}
      </button>
      <StatusLine status={status} copy={copy} />
    </div>
  );
}

function RevealCard({
  activity,
  copy,
  onAttempt,
}: {
  readonly activity: BaseRevealPracticeActivity;
  readonly copy: CourseCopy["baseLesson"];
  readonly onAttempt: (outcome: BaseAttemptOutcome) => void;
}): ReactElement {
  const [revealed, setRevealed] = useState(false);
  const [status, setStatus] = useState<"idle" | BaseAttemptOutcome>("idle");

  return (
    <div
      className="base-practice-activity base-practice-activity--reveal"
      data-activity-id={activity.id}
      data-category={activity.category}
    >
      {activity.promptTokens ? (
        <p className="base-practice-activity__prompt" lang="ja">
          {activity.promptTokens.map((token) => (
            <JapaneseSegmentText key={token.id} jp={token.jp} reading={token.reading} />
          ))}
        </p>
      ) : null}
      {!revealed ? (
        <button
          type="button"
          className="action action--secondary"
          onClick={() => setRevealed(true)}
        >
          {copy.practice.revealAnswer}
        </button>
      ) : (
        <>
          <p className="base-practice-activity__answer" lang="ja">
            {activity.answerTokens.map((token) => (
              <JapaneseSegmentText key={token.id} jp={token.jp} reading={token.reading} />
            ))}
          </p>
          <p className="base-practice-activity__self-check-prompt">
            {copy.practice.selfCheckPrompt}
          </p>
          <button
            type="button"
            className="action action--primary"
            onClick={() => {
              setStatus("accepted");
              onAttempt("accepted");
            }}
          >
            {copy.practice.selfCheckCorrect}
          </button>
          <button
            type="button"
            className="action action--secondary"
            onClick={() => {
              setStatus("retry");
              onAttempt("retry");
            }}
          >
            {copy.practice.selfCheckRetry}
          </button>
        </>
      )}
      <StatusLine status={status} copy={copy} />
    </div>
  );
}

/**
 * The Base lesson's single spoken practice activity (Task 14). It reuses the
 * existing privacy/recognition state machine
 * (`useSpeechRecognition`/`createSpeechRecognitionController`) unmodified: an
 * attempt is recorded only when the recognizer reaches a settled, evaluated
 * result (`matched`/`close`/`retry`) — never on `listening`/`processing`.
 * When recognition is unsupported or the mic is denied, a listen-and-
 * self-check fallback is the only way to complete this step, and it never
 * auto-accepts: `onAttempt` fires only from an explicit self-check click.
 */
function SpokenCard({
  activity,
  idBase,
  copy,
  onAttempt,
}: {
  readonly activity: BaseSpokenPracticeActivity;
  readonly idBase: string;
  readonly copy: CourseCopy["baseLesson"];
  readonly onAttempt: (outcome: BaseAttemptOutcome) => void;
}): ReactElement {
  const speech = useSpeech();
  const recognition = useSpeechRecognition();
  const recordedAttemptId = useRef<number | null>(null);
  const [selfCheckStatus, setSelfCheckStatus] = useState<"idle" | BaseAttemptOutcome>("idle");

  const segments = segmentsFromTokens(activity.tokens);
  const model: SpokenAttemptModel = {
    lessonId: idBase,
    speechPromptId: `${idBase}-prompt`,
    targetExampleId: activity.id,
    prompt: resolvePromptFromTokens(`${idBase}-prompt`, activity.id, activity.tokens),
    segments,
    targetJp: segments.map((segment) => segment.jp).join(""),
    targetRomaji: segments.map((segment) => segment.romaji).join(" "),
    lessonTitle: "",
    meaning: "",
    variants: [],
  };
  const handlers = createSpokenAttemptHandlers(recognition, speech, model, `${idBase}-model`);
  const state = recognition.state;
  const isResult =
    state.status === "matched" || state.status === "close" || state.status === "retry";

  useEffect(() => {
    if (!isResult || !("attemptId" in state)) return;
    if (recordedAttemptId.current === state.attemptId) return;
    recordedAttemptId.current = state.attemptId;
    onAttempt(state.status === "retry" ? "retry" : "accepted");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const unsupported = !recognition.supported || state.status === "unsupported";
  const denied = state.status === "denied";
  const modelKey = `${idBase}-model-model`;
  const audioStatus = !speech.supported
    ? ("unavailable" as const)
    : speech.playbackFailed
      ? ("failed" as const)
      : speech.speakingKey === modelKey
        ? ("playing" as const)
        : ("idle" as const);

  return (
    <div className="base-spoken-activity" data-activity-id={activity.id}>
      <p className="base-spoken-activity__target" lang="ja">
        <RomajiSequence
          tokens={activity.tokens}
          errorText={copy.recap.canDoLabel}
          renderToken={(token) => (
            <JapaneseSegmentText jp={token.jp} reading={token.reading} />
          )}
        />
      </p>
      <BaseAudioButton
        idBase={`${idBase}-model`}
        status={audioStatus}
        onPlay={handlers.onPlayModel}
        onRetry={handlers.onPlayModel}
      />
      {unsupported || denied ? (
        <div className="base-spoken-activity__self-check">
          <p>{copy.practice.selfCheckPrompt}</p>
          <button
            type="button"
            className="action action--primary"
            onClick={() => {
              setSelfCheckStatus("accepted");
              onAttempt("accepted");
            }}
          >
            {copy.practice.selfCheckCorrect}
          </button>
          <button
            type="button"
            className="action action--secondary"
            onClick={() => {
              setSelfCheckStatus("retry");
              onAttempt("retry");
            }}
          >
            {copy.practice.selfCheckRetry}
          </button>
        </div>
      ) : !recognition.consentAcknowledged ? (
        state.status === "requesting-consent" ? (
          <div className="base-spoken-activity__consent">
            <button type="button" onClick={handlers.onAcknowledgeConsent}>
              {copy.practice.selfCheckCorrect}
            </button>
            <button type="button" onClick={handlers.onDismissConsent}>
              {copy.practice.selfCheckRetry}
            </button>
          </div>
        ) : (
          <button type="button" onClick={handlers.onRequestConsent}>
            {copy.practice.submit}
          </button>
        )
      ) : (
        <button
          type="button"
          className="action action--primary"
          onClick={state.status === "listening" ? handlers.onAbort : handlers.onStart}
        >
          {copy.practice.submit}
        </button>
      )}
      <StatusLine status={selfCheckStatus} copy={copy} />
      {isResult ? (
        <p role="status" aria-live="polite">
          {state.status === "matched" || state.status === "close"
            ? copy.practice.accepted
            : copy.practice.retry}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Renders one practice activity's interaction card, dispatching on its
 * `interactionKind`. Exported so `testHarness.tsx`'s `renderBaseActivity`
 * can mount exactly one activity, and so `BasePracticeSequence` renders its
 * whole staged list from the same code path.
 */
export function BasePracticeActivityCard({
  activity,
  idBase,
  copy,
  onAttempt,
}: {
  readonly activity: BasePracticeActivity;
  readonly idBase: string;
  readonly copy: CourseCopy;
  readonly onAttempt: (activityId: string, outcome: BaseAttemptOutcome) => void;
}): ReactElement {
  const baseLessonCopy = copy.baseLesson;
  const handleAttempt = (outcome: BaseAttemptOutcome) => onAttempt(activity.id, outcome);
  switch (activity.interactionKind) {
    case "choice":
      return (
        <ChoiceCard
          activity={activity}
          idBase={idBase}
          copy={baseLessonCopy}
          onAttempt={handleAttempt}
        />
      );
    case "tile-ordering":
      return (
        <TileOrderingCard
          activity={activity}
          idBase={idBase}
          copy={baseLessonCopy}
          onAttempt={handleAttempt}
        />
      );
    case "reveal":
      return (
        <RevealCard activity={activity} copy={baseLessonCopy} onAttempt={handleAttempt} />
      );
    case "listening":
      return (
        <BaseListeningActivity
          activity={activity}
          idBase={idBase}
          copy={baseLessonCopy}
          onAttempt={handleAttempt}
        />
      );
    case "spoken":
      return (
        <SpokenCard
          activity={activity}
          idBase={idBase}
          copy={baseLessonCopy}
          onAttempt={handleAttempt}
        />
      );
  }
}

/**
 * The Base lesson's complete staged 8+2/6+2 practice sequence (Task 14):
 * every non-spoken activity first ("build and recognize"), then the single
 * listening activity, then the single spoken activity. `onAttempt` (when
 * supplied) is the seam a future task wires into progress tracking; Task 14
 * itself keeps every attempt's state local to each activity's own card.
 */
export function BasePracticeSequence({
  lessonId,
  activities,
  copy,
  onAttempt,
}: BasePracticeSequenceProps): ReactElement {
  const practiceCopy = copy.baseLesson.practice;
  const nonSpoken = activities.filter((activity) => activity.mode === "non-spoken");
  const listening = activities.filter((activity) => activity.mode === "listening");
  const spoken = activities.filter((activity) => activity.mode === "spoken");
  const handle = (activityId: string, outcome: BaseAttemptOutcome) =>
    onAttempt?.(activityId, outcome);

  return (
    <div className="base-practice-sequence">
      <p className="base-practice-sequence__intro">{practiceCopy.intro}</p>

      <section aria-label={practiceCopy.stageNonSpokenHeading}>
        <h4>{practiceCopy.stageNonSpokenHeading}</h4>
        <ol>
          {nonSpoken.map((activity) => (
            <li key={activity.id}>
              <BasePracticeActivityCard
                activity={activity}
                idBase={`${lessonId}-${activity.id}`}
                copy={copy}
                onAttempt={handle}
              />
            </li>
          ))}
        </ol>
      </section>

      <section aria-label={practiceCopy.stageListeningHeading}>
        <h4>{practiceCopy.stageListeningHeading}</h4>
        <ol>
          {listening.map((activity) => (
            <li key={activity.id}>
              <BasePracticeActivityCard
                activity={activity}
                idBase={`${lessonId}-${activity.id}`}
                copy={copy}
                onAttempt={handle}
              />
            </li>
          ))}
        </ol>
      </section>

      <section aria-label={practiceCopy.stageSpokenHeading}>
        <h4>{practiceCopy.stageSpokenHeading}</h4>
        <ol>
          {spoken.map((activity) => (
            <li key={activity.id}>
              <BasePracticeActivityCard
                activity={activity}
                idBase={`${lessonId}-${activity.id}`}
                copy={copy}
                onAttempt={handle}
              />
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
