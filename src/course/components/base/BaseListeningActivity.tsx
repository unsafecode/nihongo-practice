import type { ReactElement } from "react";
import { useState } from "react";
import type { BaseListeningPracticeActivity } from "../../base/view/buildBasePracticeModel";
import type { CourseCopy } from "../../i18n/types";
import { JapaneseSegmentText } from "../JapaneseSegmentText";
import { BaseAudioButton, useBaseAudioPlayback } from "./BaseAudioButton";

export interface BaseListeningActivityProps {
  readonly activity: BaseListeningPracticeActivity;
  readonly idBase: string;
  readonly copy: CourseCopy["baseLesson"];
  readonly onAttempt: (outcome: "accepted" | "retry") => void;
}

/**
 * The Base lesson's single listening practice activity (Task 14): a
 * canonical playback control ({@link BaseAudioButton}) plus a meaning/form
 * discrimination choice. Options render only opaque option ids in DOM
 * metadata; which option is correct is never marked in the DOM before
 * submit — only the event handler closure below (and, once submitted, the
 * plain-text accepted/retry feedback) ever compares against it.
 */
export function BaseListeningActivity({
  activity,
  idBase,
  copy,
  onAttempt,
}: BaseListeningActivityProps): ReactElement {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "accepted" | "retry">("idle");
  const playback = useBaseAudioPlayback(
    activity.playback.kind === "asset"
      ? { kind: "asset", assetId: activity.playback.assetId }
      : { kind: "synthesis", tokens: activity.playback.tokens },
    idBase,
  );

  function submit(): void {
    if (!selectedId) return;
    const outcome = selectedId === activity.correctOptionId ? "accepted" : "retry";
    setStatus(outcome);
    onAttempt(outcome);
  }

  return (
    <div className="base-listening-activity" data-activity-id={activity.id}>
      <p className="base-listening-activity__instruction">
        {copy.listening.instruction}
      </p>
      <BaseAudioButton
        idBase={idBase}
        status={playback.status}
        onPlay={playback.play}
        onRetry={playback.play}
      />
      <fieldset className="base-listening-activity__options">
        <legend>{copy.practice.optionsLabel}</legend>
        {activity.options.map((option) => (
          <label key={option.id} className="base-listening-activity__option">
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
      {status !== "idle" ? (
        <p className="base-listening-activity__status" role="status" aria-live="polite">
          {status === "accepted" ? copy.practice.accepted : copy.practice.retry}
        </p>
      ) : null}
    </div>
  );
}
