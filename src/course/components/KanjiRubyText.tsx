import { useState, type ReactElement } from "react";
import { ActionButton } from "../../components/actions/Action";
import type { Script } from "../../settings/ScriptContext";
import { a2KanjiAssistancePolicy } from "../a2/kanji/kanjiAssistancePolicy";
import type { KanjiActivityMode, KanjiExposure } from "../a2/kanji/kanjiTypes";

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
 *   hook. Once revealed, the `<rt>` is deliberately *not* aria-hidden (it is
 *   now the only visible reading), so the `<ruby>` gets an explicit
 *   `aria-label` pinned to just the glyph — otherwise the browser's default
 *   ruby accessible-name computation would concatenate base+rt into a
 *   duplicated "glyph+reading" string.
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
  /** Localized copy for key `a2-kanji-why-visible`, shown at the assessed stage. */
  readonly assessedExplanation: string;
}

const REVEAL_SHOW_LABEL = "Show reading";
const REVEAL_HIDE_LABEL = "Hide reading";

export function KanjiRubyText({
  glyph,
  reading,
  romaji,
  exposure,
  script,
  mode = "read",
  assessedExplanation,
}: KanjiRubyTextProps): ReactElement {
  const support = a2KanjiAssistancePolicy.supportFor(exposure, mode);

  if (exposure.stage === "assessed") {
    return (
      <span className="kanji-ruby kanji-ruby--assessed">
        <span lang="ja">{glyph}</span>
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
        reading={reading}
        romaji={romaji}
        showRomajiHint={showRomajiHint}
      />
    );
  }

  return (
    <span className="kanji-ruby kanji-ruby--visible">
      <ruby lang="ja" className="kanji-ruby__ruby">
        {glyph}
        <rt aria-hidden="true" className="kanji-ruby__reading">
          {reading}
        </rt>
      </ruby>
      {showRomajiHint ? <span className="kanji-ruby__romaji-hint">{romaji}</span> : null}
    </span>
  );
}

function RevealableKanjiRuby({
  glyph,
  reading,
  romaji,
  showRomajiHint,
}: {
  readonly glyph: string;
  readonly reading: string;
  readonly romaji?: string;
  readonly showRomajiHint: boolean;
}): ReactElement {
  const [revealed, setRevealed] = useState(false);

  return (
    <span className="kanji-ruby kanji-ruby--revealable">
      <ruby
        lang="ja"
        className="kanji-ruby__ruby"
        aria-label={revealed ? glyph : undefined}
      >
        {glyph}
        {revealed ? <rt className="kanji-ruby__reading">{reading}</rt> : null}
      </ruby>
      <ActionButton
        type="button"
        variant="inline"
        className="kanji-reveal"
        aria-expanded={revealed}
        aria-label={revealed ? REVEAL_HIDE_LABEL : REVEAL_SHOW_LABEL}
        onClick={() => setRevealed((value) => !value)}
      >
        <span aria-hidden="true">{revealed ? "\u2212" : "+"}</span>
      </ActionButton>
      {showRomajiHint ? <span className="kanji-ruby__romaji-hint">{romaji}</span> : null}
    </span>
  );
}
