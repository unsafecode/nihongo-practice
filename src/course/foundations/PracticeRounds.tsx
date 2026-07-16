import { useState } from "react";
import type { ReactElement } from "react";

import { Notice } from "../../components/Notice";
import type { AssembledToken } from "../../romaji/types";
import { useScript } from "../../settings/ScriptContext";
import type { CourseCopy } from "../i18n/types";
import { ExerciseView } from "../components/ExerciseView";
import {
  clearAnswer,
  initExerciseState,
  moveTile,
  placeTile,
  selectOption,
  setText,
  submitExercise,
  unplaceTile,
} from "../components/exerciseState";
import type { AttemptOutcome } from "../components/exerciseState";
import type {
  FoundationRoundModel,
  FoundationRoundTarget,
} from "./foundationViewModel";

export interface PracticeRoundsProps {
  readonly rounds: readonly [FoundationRoundModel, FoundationRoundModel];
  readonly tokenForTile: (tileId: string) => AssembledToken | undefined;
  readonly tokensForExample: (
    exampleId: string,
  ) => readonly AssembledToken[] | undefined;
  readonly copy: CourseCopy["foundation"];
  readonly exerciseCopy: CourseCopy["exercises"];
  readonly errorText: string;
  readonly idBase: string;
  readonly onAttempt?: (
    outcome: Exclude<AttemptOutcome, null>,
    target: FoundationRoundTarget,
  ) => void;
}

/**
 * A non-reversible opaque token for a target's visible answer key (the
 * canonical Japanese string). Emitting the raw key as review metadata would
 * leak the answer into the DOM, so a stable FNV-1a hash stands in: reviewers
 * can still tell targets apart and count reuse without any Japanese ever
 * appearing in a data attribute. Pure and deterministic.
 */
export function opaqueTargetKey(visibleTargetKey: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < visibleTargetKey.length; i++) {
    hash ^= visibleTargetKey.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return `k${(hash >>> 0).toString(36)}`;
}

interface FoundationExerciseCardProps {
  readonly target: FoundationRoundTarget;
  readonly index: number;
  readonly total: number;
  readonly script: ReturnType<typeof useScript>["script"];
  readonly exerciseCopy: CourseCopy["exercises"];
  readonly tokenForTile: PracticeRoundsProps["tokenForTile"];
  readonly tokensForExample: PracticeRoundsProps["tokensForExample"];
  readonly errorText: string;
  readonly idBase: string;
  readonly onAttempt?: PracticeRoundsProps["onAttempt"];
}

/**
 * A thin fixture-local stateful wrapper around the shared {@link ExerciseView}.
 * It reuses the exact same reducer and evaluation engine the lesson uses — it
 * never duplicates a control or reconstructs an answer — but resolves its
 * instruction/intent copy from the view model (the harness's foundation prompt
 * copy ids live outside the production curriculum copy).
 */
function FoundationExerciseCard({
  target,
  index,
  total,
  script,
  exerciseCopy,
  tokenForTile,
  tokensForExample,
  errorText,
  idBase,
  onAttempt,
}: FoundationExerciseCardProps): ReactElement {
  const { prompt } = target;
  const [state, setState] = useState(() => initExerciseState(prompt));

  return (
    <ExerciseView
      prompt={prompt}
      targetExampleId={target.targetExampleId}
      state={state}
      index={index}
      total={total}
      script={script}
      copy={exerciseCopy}
      instruction={target.instruction}
      intentText={target.intentText}
      idBase={idBase}
      tokenForTile={tokenForTile}
      tokensForExample={tokensForExample}
      errorText={errorText}
      handlers={{
        onPlaceTile: (tileId) => setState((s) => placeTile(s, tileId)),
        onUnplaceTile: (tileId) => setState((s) => unplaceTile(s, tileId)),
        onMoveTile: (tileId, direction) =>
          setState((s) => moveTile(s, tileId, direction)),
        onSelectOption: (optionId) => setState((s) => selectOption(s, optionId)),
        onSetText: (text) => setState((s) => setText(s, text)),
        onClear: () => setState((s) => clearAnswer(s)),
        onSubmit: () => {
          const result = submitExercise(prompt, state);
          setState(result.state);
          if (result.outcome) onAttempt?.(result.outcome, target);
        },
      }}
    />
  );
}

function roundIsValid(round: FoundationRoundModel | undefined): boolean {
  return Boolean(round && round.targets.length > 0);
}

/**
 * The two-round foundation practice surface (design spec §10.3, §12): a first
 * guided-controlled round that keeps every choice inside the current family,
 * then a transfer round that mixes constrained construction with other kinds.
 * Every card drives the shared exercise engine; a malformed view model yields a
 * single localized notice and no partial round.
 */
export function PracticeRounds({
  rounds,
  tokenForTile,
  tokensForExample,
  copy,
  exerciseCopy,
  errorText,
  idBase,
  onAttempt,
}: PracticeRoundsProps): ReactElement {
  const { script } = useScript();

  if (rounds.length !== 2 || !rounds.every(roundIsValid)) {
    return (
      <Notice
        tone="warning"
        title={copy.unavailableTitle}
        body={copy.unavailableBody}
      />
    );
  }

  const roundCopy = [
    { title: copy.roundOneTitle, intro: copy.roundOneIntro },
    { title: copy.roundTwoTitle, intro: copy.roundTwoIntro },
  ] as const;

  return (
    <div className="foundation-rounds">
      {rounds.map((round, roundIndex) => {
        const labels = roundCopy[roundIndex];
        const total = round.targets.length;
        return (
          <section
            key={round.roundId}
            className="foundation-round"
            data-round-id={round.roundId}
            data-round-purpose={round.purpose}
            aria-labelledby={`${idBase}-${round.roundId}-title`}
          >
            <h3
              className="foundation-round__title"
              id={`${idBase}-${round.roundId}-title`}
            >
              {labels.title}
            </h3>
            <p className="foundation-round__intro">{labels.intro}</p>
            <ol className="foundation-round__cards">
              {round.targets.map((target, cardIndex) => (
                <li
                  key={target.targetId}
                  className="foundation-round__card"
                  data-target-id={target.targetId}
                  data-variant-id={target.variantId}
                  data-family-id={target.familyId}
                  data-context-id={target.contextId}
                  data-speaker-role-id={target.speakerRoleId}
                  data-exercise-kind={target.exerciseKind}
                  data-practice-purpose={target.practicePurpose}
                  data-pedagogical-use={target.pedagogicalUse}
                  data-semantic-fingerprint={target.semanticFingerprint}
                  data-visible-target-key={opaqueTargetKey(
                    target.visibleTargetKey,
                  )}
                >
                  {target.practicePurpose === "transfer" ? (
                    <p className="foundation-round__badge">
                      {copy.transferLabel}
                    </p>
                  ) : null}
                  <FoundationExerciseCard
                    target={target}
                    index={cardIndex}
                    total={total}
                    script={script}
                    exerciseCopy={exerciseCopy}
                    tokenForTile={tokenForTile}
                    tokensForExample={tokensForExample}
                    errorText={errorText}
                    idBase={`${idBase}-${target.targetId}`}
                    onAttempt={onAttempt}
                  />
                </li>
              ))}
            </ol>
          </section>
        );
      })}
    </div>
  );
}
