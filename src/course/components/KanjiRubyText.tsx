import { createElement, useState, type ReactElement } from "react";
import { ActionButton } from "../../components/actions/Action";
import type { Script } from "../../settings/ScriptContext";
import { a2KanjiAssistancePolicy } from "../a2/kanji/kanjiAssistancePolicy";
import type { KanjiActivityMode, KanjiExposure } from "../a2/kanji/kanjiTypes";

/**
 * Renders the word base text, emphasizing the target glyph within it.
 * If displayBase === glyph (single character, no word context), returns it directly.
 */
function renderWordBase(displayBase: string, glyph: string): ReactElement | string {
  if (displayBase === glyph) return glyph;
  const idx = displayBase.indexOf(glyph);
  if (idx === -1) return displayBase;
  const before = displayBase.slice(0, idx);
  const after = displayBase.slice(idx + glyph.length);
  return createElement(
    "span",
    { className: "kanji-ruby__word" },
    before ? createElement("span", { className: "kanji-ruby__word-ctx" }, before) : null,
    createElement("span", { className: "kanji-ruby__word-target" }, glyph),
    after ? createElement("span", { className: "kanji-ruby__word-ctx" }, after) : null,
  );
}

/**
 * Renders one contextual-kanji exposure (design spec, Phase 3 Task 3, locked
 * decision L3), recognition-only. Rendering is driven entirely by the real
 * {@link a2KanjiAssistancePolicy}, keyed off `exposure.stage` — never by the
 * learner's global `script` preference — so an `assessed` exposure always
 * renders the bare glyph with no furigana or romaji, in every recognition
 * mode and even when the learner's script setting is `"romaji"`. `script`
 * only ever controls whether a *permitted* romaji hint is exposed alongside
 * (never instead of) the glyph, at the earlier, still-supported stages.
 *
 * - `first-supported` / `supported-retrieval` (furigana "visible"): a
 *   semantic `<ruby lang="ja">` with the glyph as its base text and an
 *   `aria-hidden` `<rt>` reading — the rt is supplementary furigana for
 *   sighted learners; hiding it from assistive tech avoids double-voicing
 *   the glyph's pronunciation, and leaves the glyph itself as the ruby's
 *   accessible name.
 * - `revealable` (furigana "revealable"): the `<rt>` is not rendered at all
 *   until the learner activates the reveal toggle — never present-but-hidden
 *   by CSS/aria, so the reading cannot leak through any DOM/aria/title
 *   inspection while collapsed. The toggle is a real `<button>` (via the
 *   shared `ActionButton`, whose `.action`/`.action--inline` classes already
 *   guarantee the `--action-target-min` (44px) touch target — see
 *   `src/styles.css`), carrying `aria-expanded` and a `.kanji-reveal` class
 *   hook. The toggle's *only* accessible name is the caller-supplied,
 *   localized `revealShowLabel`/`revealHideLabel` copy (there is no English
 *   fallback string baked into this component — every caller, including
 *   every test, must supply real copy) so the control is never silently
 *   English-only for a non-English learner. Once revealed, the `<rt>` is
 *   deliberately *not* aria-hidden (it is now the only visible reading), so
 *   the `<ruby>` gets an explicit `aria-label` pinned to just the glyph —
 *   otherwise the browser's default ruby accessible-name computation would
 *   concatenate base+rt into a duplicated "glyph+reading" string.
 * - `assessed` (furigana "hidden", romaji "not-shown"): a bare glyph, no
 *   `<ruby>`/`<rt>` element at all, and no romaji hint, unconditionally —
 *   plus a visible explanation caption sourced from the caller-supplied
 *   `assessedExplanation` copy (key `a2-kanji-why-visible`), tagged with a
 *   `data-copy-id` so its provenance is inspectable.
 */
export interface KanjiRubyTextProps {
  readonly glyph: string;
  /** This glyph's kana reading inside the exposure's contextual lexeme. */
  readonly reading: string;
  /** This glyph's romaji reading; only ever shown as a hint when the policy allows it. */
  readonly romaji?: string;
  readonly exposure: KanjiExposure;
  readonly script: Script;
  /** Recognition-only activity mode. Defaults to `"read"`. */
  readonly mode?: KanjiActivityMode;
  /**
   * The resolved, localized semantic gloss for this glyph in its lexeme
   * (Phase 3 Task 8 spec-fix, ISSUE 2) — already looked up from
   * `copy.kanjiMeanings[meaningCopyId]` at the page boundary, never the raw
   * copy id. Surfaced as accessible support text at the supported stages and,
   * gated with the reading, at `revealable`; deliberately withheld at
   * `assessed` so it can never leak the target of an assessed recognition.
   * Optional: when absent, no meaning element is rendered at all.
   */
  readonly meaning?: string;
  /** Localized copy for key `a2-kanji-why-visible`, shown at the assessed stage. */
  readonly assessedExplanation: string;
  /**
   * Localized copy for key `a2-kanji-reveal-show`: the reveal toggle's
   * accessible name (`aria-label`) while the reading is still hidden. There
   * is no hardcoded English fallback — every caller must supply real,
   * localized copy so the control's only accessible name is never silently
   * English-only for a non-English learner.
   */
  readonly revealShowLabel: string;
  /**
   * Localized copy for key `a2-kanji-reveal-hide`: the reveal toggle's
   * accessible name (`aria-label`) once the learner has revealed the
   * reading. Same no-hardcoded-fallback guarantee as {@link revealShowLabel}.
   */
  readonly revealHideLabel: string;
  /** The contextual word this glyph lives in (交ぜ書き). When set, the ruby base shows the word with the target glyph emphasized. */
  readonly word?: string;
  /** The whole-word kana reading (for the ruby annotation). */
  readonly wordKana?: string;
}

export function KanjiRubyText({
  glyph,
  reading,
  romaji,
  exposure,
  script,
  mode = "read",
  meaning,
  assessedExplanation,
  revealShowLabel,
  revealHideLabel,
  word,
  wordKana,
}: KanjiRubyTextProps): ReactElement {
  const support = a2KanjiAssistancePolicy.supportFor(exposure, mode);
  const displayBase = word ?? glyph;
  const displayReading = wordKana ?? reading;

  if (exposure.stage === "assessed") {
    // Assessed: bare glyph only. No furigana, no romaji, and — deliberately —
    // no semantic gloss either: if meaning is the recognition target, surfacing
    // it here would leak the answer, so the safest stage-aware behavior is to
    // withhold it entirely (spec-fix ISSUE 2).
    return (
      <span className="kanji-ruby kanji-ruby--assessed">
        <span lang="ja">{renderWordBase(displayBase, glyph)}</span>
        <span className="kanji-why" data-copy-id="a2-kanji-why-visible">
          {assessedExplanation}
        </span>
      </span>
    );
  }

  const showRomajiHint = script === "romaji" && support.romaji === "allowed" && Boolean(romaji);

  if (support.furigana === "revealable") {
    return (
      <RevealableKanjiRuby
        glyph={glyph}
        displayBase={displayBase}
        reading={displayReading}
        romaji={romaji}
        meaning={meaning}
        showRomajiHint={showRomajiHint}
        revealShowLabel={revealShowLabel}
        revealHideLabel={revealHideLabel}
      />
    );
  }

  return (
    <span className="kanji-ruby kanji-ruby--visible">
      <ruby lang="ja" className="kanji-ruby__ruby">
        {renderWordBase(displayBase, glyph)}
        <rt aria-hidden="true" className="kanji-ruby__reading">
          {displayReading}
        </rt>
      </ruby>
      {showRomajiHint ? <span className="kanji-ruby__romaji-hint">{romaji}</span> : null}
      {meaning ? <span className="kanji-ruby__meaning">{meaning}</span> : null}
    </span>
  );
}

function RevealableKanjiRuby({
  glyph,
  displayBase,
  reading,
  romaji,
  meaning,
  showRomajiHint,
  revealShowLabel,
  revealHideLabel,
}: {
  readonly glyph: string;
  readonly displayBase: string;
  readonly reading: string;
  readonly romaji?: string;
  readonly meaning?: string;
  readonly showRomajiHint: boolean;
  readonly revealShowLabel: string;
  readonly revealHideLabel: string;
}): ReactElement {
  const [revealed, setRevealed] = useState(false);

  return (
    <span className="kanji-ruby kanji-ruby--revealable">
      <ruby
        lang="ja"
        className="kanji-ruby__ruby"
        aria-label={revealed ? glyph : undefined}
      >
        {renderWordBase(displayBase, glyph)}
        {revealed ? <rt className="kanji-ruby__reading">{reading}</rt> : null}
      </ruby>
      <ActionButton
        type="button"
        variant="inline"
        className="kanji-reveal"
        aria-expanded={revealed}
        aria-label={revealed ? revealHideLabel : revealShowLabel}
        onClick={() => setRevealed((value) => !value)}
      >
        <span aria-hidden="true">{revealed ? "\u2212" : "+"}</span>
      </ActionButton>
      {showRomajiHint ? <span className="kanji-ruby__romaji-hint">{romaji}</span> : null}
      {/* The gloss is support, so at `revealable` it is gated with the reading:
          not rendered at all until the learner reveals, mirroring the `<rt>`. */}
      {revealed && meaning ? <span className="kanji-ruby__meaning">{meaning}</span> : null}
    </span>
  );
}
