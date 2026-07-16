import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  type MouseEvent as ReactMouseEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import type { Script } from "../../settings/ScriptContext";
import type { CourseCopy } from "../i18n/types";
import { JapaneseSegmentText } from "./JapaneseSegmentText";
import type { ExerciseUiState } from "./exerciseState";
import type {
  ExerciseChoiceOption,
  ExercisePrompt,
  ExercisePromptSegment,
  ExerciseTile,
} from "../exercises/types";

/**
 * The pure, props-driven renderer for one deterministic exercise (Slice C plan
 * Task 4 step 3; design spec §10.1-§10.3, §14). It owns no state and no context:
 * the stateful {@link Exercise} container passes the current
 * {@link ExerciseUiState}, resolved localized instruction/intent copy, the
 * script setting, and the interaction handlers. Keeping the view a pure function
 * of its props makes every kind and every feedback state (accepted / retry /
 * invalid) statically renderable and testable without a DOM, and keeps the
 * container thin.
 *
 * Accessibility contract encoded here (spec §14): each control has an accessible
 * name; the instruction is associated with the controls via `aria-describedby`;
 * the result is announced in a polite live region that never steals focus; tile
 * ordering has a full non-drag keyboard/touch path (add from the bank, move, and
 * remove buttons); and every state is conveyed by text, never colour alone.
 */

type ExercisePromptCopy = CourseCopy["exercises"];

type TileAction = "add" | "back" | "forward" | "remove";

interface TileFocusManager {
  readonly ref: (
    tileId: string,
    action: TileAction,
  ) => (element: HTMLButtonElement | null) => void;
  readonly request: (
    targetTileId: string,
    targetAction: TileAction,
    event: ReactMouseEvent<HTMLButtonElement>,
  ) => void;
}

function shouldManageTileFocus(
  event: ReactMouseEvent<HTMLButtonElement>,
): boolean {
  return (
    event.detail === 0 ||
    (typeof document !== "undefined" && event.currentTarget === document.activeElement)
  );
}

export interface ExerciseViewHandlers {
  readonly onPlaceTile: (tileId: string) => void;
  readonly onUnplaceTile: (tileId: string) => void;
  readonly onMoveTile: (tileId: string, direction: "back" | "forward") => void;
  readonly onSelectOption: (optionId: string) => void;
  readonly onSetText: (text: string) => void;
  readonly onSubmit: () => void;
  readonly onClear: () => void;
}

export interface ExerciseViewProps {
  readonly prompt: ExercisePrompt;
  readonly targetExampleId: string;
  readonly state: ExerciseUiState;
  readonly index: number;
  readonly total: number;
  readonly script: Script;
  readonly copy: ExercisePromptCopy;
  /** The localized instruction resolved from the prompt copy id. */
  readonly instruction: string;
  /** The localized IT/EN intent (constrained construction) or null otherwise. */
  readonly intentText: string | null;
  /** A stable id prefix for this card's heading/instruction/feedback ids. */
  readonly idBase: string;
  readonly romajiForTile: (tileId: string) => string | undefined;
  readonly romajiForExample: (exampleId: string) => string | undefined;
  readonly handlers: ExerciseViewHandlers;
}

/** One glyph rendered script-primary with the other script beneath it (spec §7). */
function GlyphPair({
  jp,
  reading,
  romaji,
  script,
}: {
  readonly jp: string;
  readonly reading?: string;
  readonly romaji?: string;
  readonly script: Script;
}): ReactElement {
  const primaryIsJp = script === "hiragana";
  return (
    <span className="lesson-exercise__glyph">
      <span
        className="lesson-exercise__glyph-primary"
        lang={primaryIsJp ? "ja" : undefined}
      >
        {primaryIsJp ? <JapaneseSegmentText jp={jp} reading={reading} /> : (romaji ?? jp)}
      </span>
      {romaji ? (
        <span
          className="lesson-exercise__glyph-secondary"
          lang={primaryIsJp ? undefined : "ja"}
          aria-hidden="true"
        >
          {primaryIsJp ? romaji : jp}
        </span>
      ) : null}
    </span>
  );
}

function tileLabelText(tile: ExerciseTile | ExerciseChoiceOption): string {
  return tile.jp;
}

// ── Sentence context (choice / completion) ────────────────────────────────────

function SentenceLine({
  segments,
  script,
  targetExampleId,
  romajiForTile,
  copy,
  secondary,
}: {
  readonly segments: readonly ExercisePromptSegment[];
  readonly script: Script;
  readonly targetExampleId: string;
  readonly romajiForTile: (tileId: string) => string | undefined;
  readonly copy: ExercisePromptCopy;
  readonly secondary: boolean;
}): ReactElement {
  const primaryIsJp = script === "hiragana";
  const showJp = secondary ? !primaryIsJp : primaryIsJp;
  return (
    <p
      className={
        secondary
          ? "lesson-exercise__sentence lesson-exercise__sentence--secondary"
          : "lesson-exercise__sentence"
      }
      lang={showJp ? "ja" : undefined}
      aria-hidden={secondary ? "true" : undefined}
    >
      {segments.map((segment) => {
        if (segment.isBlank) {
          return (
            <span key={segment.id} className="lesson-exercise__slot">
              {copy.blank}
            </span>
          );
        }
        const romaji = romajiForTile(`${targetExampleId}#${segment.id}`);
        const content: ReactNode = showJp ? (
          <JapaneseSegmentText jp={segment.jp} reading={segment.reading} />
        ) : (
          romaji ?? segment.jp
        );
        return <span key={segment.id}>{content}</span>;
      })}
    </p>
  );
}

// ── Kind-specific bodies ──────────────────────────────────────────────────────

function TileOrderingBody({
  prompt,
  state,
  script,
  copy,
  instructionId,
  romajiForTile,
  focus,
  handlers,
}: {
  readonly prompt: Extract<ExercisePrompt, { kind: "tile-ordering" }>;
  readonly state: ExerciseUiState;
  readonly script: Script;
  readonly copy: ExercisePromptCopy;
  readonly instructionId: string;
  readonly romajiForTile: (tileId: string) => string | undefined;
  readonly focus: TileFocusManager;
  readonly handlers: ExerciseViewHandlers;
}): ReactElement {
  const tilesById = new Map(prompt.tiles.map((tile) => [tile.id, tile]));
  const placed = state.placedTileIds;
  const placedSet = new Set(placed);
  const bank = prompt.tiles.filter((tile) => !placedSet.has(tile.id));
  const answerLabelId = `${instructionId}-answer`;
  const bankLabelId = `${instructionId}-bank`;

  return (
    <div className="lesson-exercise__tiles">
      <p className="lesson-exercise__region-label" id={answerLabelId}>
        {copy.answerAreaLabel}
      </p>
      <ol
        className="lesson-exercise__answer"
        aria-labelledby={answerLabelId}
        aria-describedby={instructionId}
      >
        {placed.length === 0 ? (
          <li className="lesson-exercise__answer-empty">{copy.answerEmpty}</li>
        ) : (
          placed.map((tileId, position) => {
            const tile = tilesById.get(tileId);
            if (!tile) return null;
            const label = tileLabelText(tile);
            return (
              <li key={tileId} className="lesson-exercise__placed">
                <GlyphPair
                  jp={tile.jp}
                  reading={tile.reading}
                  romaji={romajiForTile(tile.id)}
                  script={script}
                />
                <span className="lesson-exercise__tile-actions">
                  <button
                    type="button"
                    className="action action--icon lesson-exercise__tile-btn lesson-exercise__move-back"
                    id={`${instructionId}-tile-${tileId}-move-back`}
                    ref={focus.ref(tileId, "back")}
                    aria-label={copy.moveTileBack(label)}
                    disabled={position === 0}
                    onClick={(event) => {
                      focus.request(tileId, "forward", event);
                      handlers.onMoveTile(tileId, "back");
                    }}
                  >
                    <span aria-hidden="true">←</span>
                  </button>
                  <button
                    type="button"
                    className="action action--icon lesson-exercise__tile-btn lesson-exercise__move-forward"
                    id={`${instructionId}-tile-${tileId}-move-forward`}
                    ref={focus.ref(tileId, "forward")}
                    aria-label={copy.moveTileForward(label)}
                    disabled={position === placed.length - 1}
                    onClick={(event) => {
                      focus.request(tileId, "back", event);
                      handlers.onMoveTile(tileId, "forward");
                    }}
                  >
                    <span aria-hidden="true">→</span>
                  </button>
                  <button
                    type="button"
                    className="action action--icon lesson-exercise__tile-btn"
                    id={`${instructionId}-tile-${tileId}-remove`}
                    ref={focus.ref(tileId, "remove")}
                    aria-label={copy.removeTile(label)}
                    onClick={(event) => {
                      focus.request(tileId, "add", event);
                      handlers.onUnplaceTile(tileId);
                    }}
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                </span>
              </li>
            );
          })
        )}
      </ol>

      <p className="lesson-exercise__region-label" id={bankLabelId}>
        {copy.bankLabel}
      </p>
      <ul className="lesson-exercise__bank" aria-labelledby={bankLabelId}>
        {bank.map((tile) => (
          <li key={tile.id}>
            <button
              type="button"
              className="action action--secondary lesson-exercise__tile"
              id={`${instructionId}-tile-${tile.id}-add`}
              ref={focus.ref(tile.id, "add")}
              aria-label={copy.addTile(tileLabelText(tile))}
              onClick={(event) => {
                const nextBankTile = prompt.correctTileIds
                  .map((candidateId) => prompt.tiles.find((candidate) => candidate.id === candidateId))
                  .find(
                    (candidate) =>
                      candidate !== undefined &&
                      candidate.id !== tile.id &&
                      !placedSet.has(candidate.id),
                  );
                focus.request(
                  nextBankTile?.id ?? tile.id,
                  nextBankTile ? "add" : "remove",
                  event,
                );
                handlers.onPlaceTile(tile.id);
              }}
            >
              <GlyphPair
                jp={tile.jp}
                reading={tile.reading}
                romaji={romajiForTile(tile.id)}
                script={script}
              />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ChoiceBody({
  prompt,
  state,
  script,
  copy,
  idBase,
  instructionId,
  targetExampleId,
  romajiForTile,
  handlers,
}: {
  readonly prompt: Extract<ExercisePrompt, { kind: "choice" }>;
  readonly state: ExerciseUiState;
  readonly script: Script;
  readonly copy: ExercisePromptCopy;
  readonly idBase: string;
  readonly instructionId: string;
  readonly targetExampleId: string;
  readonly romajiForTile: (tileId: string) => string | undefined;
  readonly handlers: ExerciseViewHandlers;
}): ReactElement {
  return (
    <div className="lesson-exercise__choice-body">
      <SentenceLine
        segments={prompt.sentenceSegments}
        script={script}
        targetExampleId={targetExampleId}
        romajiForTile={romajiForTile}
        copy={copy}
        secondary={false}
      />
      <SentenceLine
        segments={prompt.sentenceSegments}
        script={script}
        targetExampleId={targetExampleId}
        romajiForTile={romajiForTile}
        copy={copy}
        secondary
      />
      <fieldset className="lesson-exercise__choice" aria-describedby={instructionId}>
        <legend className="lesson-exercise__legend">{copy.optionsLabel}</legend>
        {prompt.options.map((option) => {
          const optionId = `${idBase}-opt-${option.id}`;
          return (
            <label key={option.id} className="lesson-exercise__option" htmlFor={optionId}>
              <input
                id={optionId}
                className="lesson-exercise__radio"
                type="radio"
                name={`${idBase}-choice`}
                value={option.id}
                checked={state.selectedOptionId === option.id}
                onChange={() => handlers.onSelectOption(option.id)}
              />
              <GlyphPair
                jp={option.jp}
                reading={option.reading}
                romaji={romajiForTile(option.id)}
                script={script}
              />
            </label>
          );
        })}
      </fieldset>
    </div>
  );
}

function TextBody({
  prompt,
  state,
  script,
  copy,
  idBase,
  instructionId,
  intentText,
  targetExampleId,
  romajiForTile,
  romajiForExample,
  handlers,
}: {
  readonly prompt: Extract<
    ExercisePrompt,
    { kind: "completion" | "transformation" | "constrained-construction" }
  >;
  readonly state: ExerciseUiState;
  readonly script: Script;
  readonly copy: ExercisePromptCopy;
  readonly idBase: string;
  readonly instructionId: string;
  readonly intentText: string | null;
  readonly targetExampleId: string;
  readonly romajiForTile: (tileId: string) => string | undefined;
  readonly romajiForExample: (exampleId: string) => string | undefined;
  readonly handlers: ExerciseViewHandlers;
}): ReactElement {
  const inputId = `${idBase}-input`;
  return (
    <div className="lesson-exercise__text">
      {prompt.kind === "completion" ? (
        <>
          <SentenceLine
            segments={prompt.sentenceSegments}
            script={script}
            targetExampleId={targetExampleId}
            romajiForTile={romajiForTile}
            copy={copy}
            secondary={false}
          />
          <SentenceLine
            segments={prompt.sentenceSegments}
            script={script}
            targetExampleId={targetExampleId}
            romajiForTile={romajiForTile}
            copy={copy}
            secondary
          />
        </>
      ) : null}

      {prompt.kind === "transformation" ? (
        <p className="lesson-exercise__source">
          <span className="lesson-exercise__source-label">{copy.sourceLabel}</span>
          <span className="lesson-exercise__source-jp" lang="ja">
            {prompt.promptJp}
          </span>
          {romajiForExample(prompt.promptExampleId) ? (
            <span className="lesson-exercise__source-romaji" aria-hidden="true">
              {romajiForExample(prompt.promptExampleId)}
            </span>
          ) : null}
        </p>
      ) : null}

      {prompt.kind === "constrained-construction" && intentText ? (
        <p className="lesson-exercise__intent">
          <span className="lesson-exercise__intent-label">{copy.intentLabel}</span>
          <span className="lesson-exercise__intent-text">{intentText}</span>
        </p>
      ) : null}

      <label className="lesson-exercise__field" htmlFor={inputId}>
        <span className="lesson-exercise__field-label">{copy.answerLabel}</span>
        <input
          id={inputId}
          className="lesson-exercise__input"
          type="text"
          lang="ja"
          inputMode="text"
          autoComplete="off"
          spellCheck={false}
          placeholder={copy.answerPlaceholder}
          aria-describedby={instructionId}
          value={state.text}
          onChange={(event) => handlers.onSetText(event.target.value)}
        />
      </label>
    </div>
  );
}

// ── Feedback (spec §10.3, §14: text, never colour alone; polite live region) ──

function feedbackContent(
  state: ExerciseUiState,
  copy: ExercisePromptCopy,
): { readonly modifier: string; readonly glyph: string; readonly text: string } | null {
  switch (state.status) {
    case "accepted":
      return { modifier: "accepted", glyph: "✓", text: copy.accepted };
    case "retry":
      return { modifier: "retry", glyph: "↻", text: copy.retry };
    case "invalid":
      return { modifier: "invalid", glyph: "!", text: copy.invalid };
    case "idle":
      return null;
  }
}

export function ExerciseView(props: ExerciseViewProps): ReactElement {
  const {
    prompt,
    state,
    index,
    total,
    script,
    copy,
    instruction,
    intentText,
    idBase,
    targetExampleId,
    romajiForTile,
    romajiForExample,
    handlers,
  } = props;

  const headingId = `${idBase}-heading`;
  const instructionId = `${idBase}-instruction`;
  const feedbackId = `${idBase}-feedback`;
  const feedback = feedbackContent(state, copy);
  const accepted = state.status === "accepted";
  const tileButtonRefs = useRef(new Map<string, HTMLButtonElement>());
  const tileFocusRequest = useRef<{
    readonly tileId: string;
    readonly action: TileAction;
    readonly shouldFocus: boolean;
  } | null>(null);
  const tileRefCallbacks = useMemo(() => {
    const callbacks = new Map<
      string,
      (element: HTMLButtonElement | null) => void
    >();
    if (prompt.kind === "tile-ordering") {
      for (const tile of prompt.tiles) {
        for (const action of ["add", "back", "forward", "remove"] as const) {
          const key = `${tile.id}:${action}`;
          callbacks.set(key, (element) => {
            if (element) tileButtonRefs.current.set(key, element);
            else tileButtonRefs.current.delete(key);
          });
        }
      }
    }
    return callbacks;
  }, [prompt]);
  const focus = useMemo<TileFocusManager>(
    () => ({
      ref: (tileId, action) =>
        tileRefCallbacks.get(`${tileId}:${action}`) ?? (() => undefined),
      request: (tileId, action, event) => {
        tileFocusRequest.current = {
          tileId,
          action,
          shouldFocus: shouldManageTileFocus(event),
        };
      },
    }),
    [tileRefCallbacks],
  );
  const useClientLayoutEffect =
    typeof window === "undefined" ? useEffect : useLayoutEffect;

  useClientLayoutEffect(() => {
    const request = tileFocusRequest.current;
    if (!request) return;
    tileFocusRequest.current = null;
    if (!request.shouldFocus) return;

    const target = tileButtonRefs.current.get(
      `${request.tileId}:${request.action}`,
    );
    if (target && !target.disabled) target.focus();
  }, [state.placedTileIds]);

  return (
    <li className="lesson-exercise" aria-labelledby={headingId}>
      <div className="lesson-exercise__head">
        <h4 id={headingId} className="lesson-exercise__title">
          {copy.position(index, total)}
        </h4>
      </div>

      <p id={instructionId} className="lesson-exercise__instruction">
        {instruction}
      </p>

      <form
        className="lesson-exercise__form"
        onSubmit={(event) => {
          event.preventDefault();
          handlers.onSubmit();
        }}
      >
        {prompt.kind === "tile-ordering" ? (
          <TileOrderingBody
            prompt={prompt}
            state={state}
            script={script}
            copy={copy}
            instructionId={instructionId}
            romajiForTile={romajiForTile}
            focus={focus}
            handlers={handlers}
          />
        ) : null}

        {prompt.kind === "choice" ? (
          <ChoiceBody
            prompt={prompt}
            state={state}
            script={script}
            copy={copy}
            idBase={idBase}
            instructionId={instructionId}
            targetExampleId={targetExampleId}
            romajiForTile={romajiForTile}
            handlers={handlers}
          />
        ) : null}

        {prompt.kind === "completion" ||
        prompt.kind === "transformation" ||
        prompt.kind === "constrained-construction" ? (
          <TextBody
            prompt={prompt}
            state={state}
            script={script}
            copy={copy}
            idBase={idBase}
            instructionId={instructionId}
            intentText={intentText}
            targetExampleId={targetExampleId}
            romajiForTile={romajiForTile}
            romajiForExample={romajiForExample}
            handlers={handlers}
          />
        ) : null}

        <div className="lesson-exercise__actions">
          <button
            type="submit"
            className="action action--primary lesson-exercise__submit"
            aria-describedby={feedbackId}
          >
            {copy.submit}
          </button>
          <button
            type="button"
            className="action action--inline lesson-exercise__clear"
            onClick={handlers.onClear}
          >
            {copy.clear}
          </button>
        </div>
      </form>

      <p
        id={feedbackId}
        className={
          feedback
            ? `lesson-exercise__feedback lesson-exercise__feedback--${feedback.modifier}`
            : "lesson-exercise__feedback"
        }
        role="status"
        aria-live="polite"
        data-accepted={accepted ? "true" : undefined}
      >
        {feedback ? (
          <>
            <span className="lesson-exercise__feedback-glyph" aria-hidden="true">
              {feedback.glyph}
            </span>
            <span className="lesson-exercise__feedback-text">{feedback.text}</span>
          </>
        ) : null}
      </p>
    </li>
  );
}
