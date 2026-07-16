import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  type MouseEvent as ReactMouseEvent,
  type ReactElement,
} from "react";
import type { Script } from "../../settings/ScriptContext";
import { formatRomaji } from "../../romaji/formatRomaji";
import { RomajiSequence } from "../../romaji/RomajiSequence";
import type { AssembledToken } from "../../romaji/types";
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
 *
 * Romaji rendering (romaji boundaries plan Task 4, master spec §13.2-13.3):
 * every learner-facing romaji surface here — the in-sentence choice/completion
 * context, the transformation source, and every tile/option glyph — renders a
 * real {@link AssembledToken} sequence through the shared {@link RomajiSequence}
 * renderer. A tile/option is always a *single* isolated token (its own boundary
 * force-attached, per requirement 8); the ordered placed answer additionally
 * derives its inter-tile separators once from the whole placed sequence, and
 * emits each as a sibling *outside* the tile's glyph/control wrapper — never a
 * local join, never a CSS-gap-only fix, never a Japanese/concatenated fallback
 * when a token cannot be resolved (the shared renderer's own localized error
 * path fires instead).
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
  /** Resolves a tile/option id to its real assembled token, or undefined. */
  readonly tokenForTile: (tileId: string) => AssembledToken | undefined;
  /** Resolves an example id to its whole ordered token sequence, or undefined. */
  readonly tokensForExample: (
    exampleId: string,
  ) => readonly AssembledToken[] | undefined;
  /** The exact localized `contentFormattingError` text for the shared renderer. */
  readonly errorText: string;
  readonly handlers: ExerciseViewHandlers;
}

/**
 * A deliberately invalid sentinel forcing `RomajiSequence`'s (and
 * `formatRomaji`'s) localized error path — never a silent Japanese/
 * concatenated fallback — when a tile/option/example token cannot be
 * resolved.
 */
const INVALID_TOKEN: AssembledToken = {
  id: "",
  jp: "",
  romaji: "",
  kind: "lexical",
  boundaryBefore: "attach",
  source: { domain: "exercise", referenceId: "" },
};

/** Force-attaches the first token of an isolated subset (a tile, an option, a
 * sentence run) so `formatRomaji`'s first-boundary validation never rejects a
 * subset purely because its first token originally sat mid-sentence. */
function isolateTokens(
  tokens: readonly AssembledToken[],
): readonly AssembledToken[] {
  if (tokens.length === 0) return tokens;
  const [first, ...rest] = tokens;
  return [{ ...first, boundaryBefore: "attach" }, ...rest];
}

/** One glyph rendered script-primary with the other script beneath it (spec
 * §7) — a single isolated token's romaji, through the shared renderer, so an
 * unresolved token surfaces the localized error rather than a raw jp
 * fallback. */
function GlyphPair({
  token,
  script,
  errorText,
}: {
  readonly token: AssembledToken | undefined;
  readonly script: Script;
  readonly errorText: string;
}): ReactElement {
  const tokens = isolateTokens([token ?? INVALID_TOKEN]);
  const formatted = formatRomaji(tokens);
  if (!formatted.ok) {
    return (
      <span className="lesson-exercise__glyph" role="alert">
        {errorText}
      </span>
    );
  }
  const resolved = tokens[0];
  const primaryIsJp = script === "hiragana";
  return (
    <span className="lesson-exercise__glyph">
      <span
        className="lesson-exercise__glyph-primary"
        lang={primaryIsJp ? "ja" : undefined}
      >
        {primaryIsJp ? (
          <JapaneseSegmentText jp={resolved.jp} reading={resolved.reading} />
        ) : (
          resolved.romaji
        )}
      </span>
      <span
        className="lesson-exercise__glyph-secondary"
        lang={primaryIsJp ? undefined : "ja"}
        aria-hidden="true"
      >
        {primaryIsJp ? resolved.romaji : resolved.jp}
      </span>
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
  tokenForTile,
  errorText,
  copy,
  secondary,
}: {
  readonly segments: readonly ExercisePromptSegment[];
  readonly script: Script;
  readonly targetExampleId: string;
  readonly tokenForTile: (tileId: string) => AssembledToken | undefined;
  readonly errorText: string;
  readonly copy: ExercisePromptCopy;
  readonly secondary: boolean;
}): ReactElement {
  const primaryIsJp = script === "hiragana";
  const showJp = secondary ? !primaryIsJp : primaryIsJp;
  const className = secondary
    ? "lesson-exercise__sentence lesson-exercise__sentence--secondary"
    : "lesson-exercise__sentence";

  // Japanese never carries inter-word separators (unchanged): a blank still
  // renders the localized slot placeholder, every other segment its own
  // JapaneseSegmentText, with no join between them.
  if (showJp) {
    return (
      <p className={className} lang="ja" aria-hidden={secondary ? "true" : undefined}>
        {segments.map((segment) =>
          segment.isBlank ? (
            <span key={segment.id} className="lesson-exercise__slot">
              {copy.blank}
            </span>
          ) : (
            <span key={segment.id}>
              <JapaneseSegmentText jp={segment.jp} reading={segment.reading} />
            </span>
          ),
        )}
      </p>
    );
  }

  // Romaji: the whole segment list — blanks included — renders through one
  // shared RomajiSequence call, so every run separator (including around a
  // blank) is the shared renderer's own, never a local join. A blank is a
  // real catalog segment (its boundary is honest), just rendered as the
  // localized placeholder instead of its own romaji.
  const blankIds = new Set(
    segments.filter((segment) => segment.isBlank).map((segment) => segment.id),
  );
  const tokens = isolateTokens(
    segments.map(
      (segment) =>
        tokenForTile(`${targetExampleId}#${segment.id}`) ?? INVALID_TOKEN,
    ),
  );
  return (
    <p className={className} aria-hidden={secondary ? "true" : undefined}>
      <RomajiSequence
        tokens={tokens}
        errorText={errorText}
        renderToken={(token) =>
          blankIds.has(token.id) ? (
            <span className="lesson-exercise__slot">{copy.blank}</span>
          ) : (
            token.romaji
          )
        }
      />
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
  tokenForTile,
  errorText,
  focus,
  handlers,
}: {
  readonly prompt: Extract<ExercisePrompt, { kind: "tile-ordering" }>;
  readonly state: ExerciseUiState;
  readonly script: Script;
  readonly copy: ExercisePromptCopy;
  readonly instructionId: string;
  readonly tokenForTile: (tileId: string) => AssembledToken | undefined;
  readonly errorText: string;
  readonly focus: TileFocusManager;
  readonly handlers: ExerciseViewHandlers;
}): ReactElement {
  const tilesById = new Map(prompt.tiles.map((tile) => [tile.id, tile]));
  const placed = state.placedTileIds;
  const placedSet = new Set(placed);
  const bank = prompt.tiles.filter((tile) => !placedSet.has(tile.id));
  const answerLabelId = `${instructionId}-answer`;
  const bankLabelId = `${instructionId}-bank`;

  // The ordered placed answer's inter-tile separators, derived once from the
  // whole placed token sequence (never per-tile CSS gap alone) — requirement
  // 8. Each tile still renders as its own single isolated glyph; the
  // separator is emitted as a sibling outside that glyph/control wrapper.
  //
  // formatRomaji's own duplicate-id check is keyed by each token's *raw* id —
  // for a real catalog token that's the within-example segment counter
  // (`w1`, `p1`, …), which restarts for every example and so is NOT globally
  // unique. Two legitimately different placed tiles (e.g. a target tile and a
  // distractor tile pulled from another example) can share that counter by
  // pure coincidence. Rekey each token's id to its own globally stable,
  // opaque tile id before validating the whole sequence — preserving every
  // other field (jp/romaji/kind/boundary/source) untouched — so that
  // coincidence never trips a spurious "duplicate-token-id" failure.
  const placedTokens = placed.map((tileId) => tokenForTile(tileId) ?? INVALID_TOKEN);
  const placedTokensForFormatting = placedTokens.map((token, index) => ({
    ...token,
    id: placed[index],
  }));
  const placedFormatted =
    placedTokens.length > 0
      ? formatRomaji(isolateTokens(placedTokensForFormatting))
      : null;
  // formatRomaji's runs are positional (one per input token, in order), so
  // separators are paired with placed tile ids by position, not by id.
  const placedSeparators = new Map(
    placedFormatted?.ok
      ? placed.map(
          (tileId, position) =>
            [tileId, placedFormatted.runs[position]?.separatorBefore ?? ""] as const,
        )
      : [],
  );
  // A genuinely malformed token (unresolved, blank romaji, an actual
  // duplicate placement, …) still fails formatRomaji's validation even after
  // the rekey above. Fail the whole placed answer closed to the one shared
  // localized alert — the same fail-closed contract `RomajiSequence` already
  // uses elsewhere on this page — never a partial run of resolved glyphs
  // rendered beside a broken one, and never tiles silently glued together
  // with no separator between them.
  const placedInvalid = placedFormatted !== null && !placedFormatted.ok;

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
        ) : placedInvalid ? (
          <li className="lesson-exercise__answer-error" role="alert">
            {errorText}
          </li>
        ) : (
          placed.map((tileId, position) => {
            const tile = tilesById.get(tileId);
            if (!tile) return null;
            const label = tileLabelText(tile);
            const separator = placedSeparators.get(tileId) ?? "";
            return (
              <li key={tileId} className="lesson-exercise__placed">
                {separator ? (
                  <span className="lesson-exercise__run-separator" aria-hidden="true">
                    {separator}
                  </span>
                ) : null}
                <GlyphPair
                  token={tokenForTile(tileId)}
                  script={script}
                  errorText={errorText}
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
                const nextBankTile = bank.find(
                  (candidate) => candidate.id !== tile.id,
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
                token={tokenForTile(tile.id)}
                script={script}
                errorText={errorText}
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
  tokenForTile,
  errorText,
  handlers,
}: {
  readonly prompt: Extract<ExercisePrompt, { kind: "choice" }>;
  readonly state: ExerciseUiState;
  readonly script: Script;
  readonly copy: ExercisePromptCopy;
  readonly idBase: string;
  readonly instructionId: string;
  readonly targetExampleId: string;
  readonly tokenForTile: (tileId: string) => AssembledToken | undefined;
  readonly errorText: string;
  readonly handlers: ExerciseViewHandlers;
}): ReactElement {
  return (
    <div className="lesson-exercise__choice-body">
      <SentenceLine
        segments={prompt.sentenceSegments}
        script={script}
        targetExampleId={targetExampleId}
        tokenForTile={tokenForTile}
        errorText={errorText}
        copy={copy}
        secondary={false}
      />
      <SentenceLine
        segments={prompt.sentenceSegments}
        script={script}
        targetExampleId={targetExampleId}
        tokenForTile={tokenForTile}
        errorText={errorText}
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
                token={tokenForTile(option.id)}
                script={script}
                errorText={errorText}
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
  tokenForTile,
  tokensForExample,
  errorText,
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
  readonly tokenForTile: (tileId: string) => AssembledToken | undefined;
  readonly tokensForExample: (
    exampleId: string,
  ) => readonly AssembledToken[] | undefined;
  readonly errorText: string;
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
            tokenForTile={tokenForTile}
            errorText={errorText}
            copy={copy}
            secondary={false}
          />
          <SentenceLine
            segments={prompt.sentenceSegments}
            script={script}
            targetExampleId={targetExampleId}
            tokenForTile={tokenForTile}
            errorText={errorText}
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
          <span className="lesson-exercise__source-romaji" aria-hidden="true">
            <RomajiSequence
              tokens={isolateTokens(
                tokensForExample(prompt.promptExampleId) ?? [INVALID_TOKEN],
              )}
              errorText={errorText}
            />
          </span>
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
    tokenForTile,
    tokensForExample,
    errorText,
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
            tokenForTile={tokenForTile}
            errorText={errorText}
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
            tokenForTile={tokenForTile}
            errorText={errorText}
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
            tokenForTile={tokenForTile}
            tokensForExample={tokensForExample}
            errorText={errorText}
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
