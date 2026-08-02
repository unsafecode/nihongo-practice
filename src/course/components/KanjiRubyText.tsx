import { useState, type ReactElement } from "react";
import { ActionButton } from "../../components/actions/Action";
import type { Script } from "../../settings/ScriptContext";
import { a2KanjiAssistancePolicy } from "../a2/kanji/kanjiAssistancePolicy";
import type { KanjiActivityMode, KanjiExposure } from "../a2/kanji/kanjiTypes";

/**
 * Renders the word base text, wrapping the taught glyph in the
 * `.kanji-ruby__word-target` hook that course.css emphasises (heavier weight
 * plus a baseline rule) and any surrounding characters in
 * `.kanji-ruby__word-ctx` context spans. The taught glyph is always marked,
 * so the emphasis vocabulary is consistent: heavy + ruled means "this is the
 * glyph the gloss describes", light + unruled means "context". This holds
 * even when the whole word IS the single taught glyph (e.g. 何) — it flows
 * through the same wrapper with a target span and no context spans, rather
 * than rendering bare (which would read as an unemphasised context character).
 * If indexOf returns -1 (glyph absent — reachable only for all-kana words,
 * which the C8 validator in a2ContextualWords.test.ts asserts never contain
 * the target kanji), returns displayBase as a plain string: there is genuinely
 * no target glyph present, so nothing is marked.
 * If glyph appears more than once, only the first occurrence gets the target
 * hook; later occurrences render as context — not reachable with current
 * catalog data.
 */
function renderWordBase(displayBase: string, glyph: string): ReactElement | string {
  const idx = displayBase.indexOf(glyph);
  if (idx === -1) return displayBase;
  const before = displayBase.slice(0, idx);
  const after = displayBase.slice(idx + glyph.length);
  return (
    <span className="kanji-ruby__word">
      {before ? <span className="kanji-ruby__word-ctx">{before}</span> : null}
      <span className="kanji-ruby__word-target">{glyph}</span>
      {after ? <span className="kanji-ruby__word-ctx">{after}</span> : null}
    </span>
  );
}

/**
 * Renders one contextual-kanji exposure (design spec, Phase 3 Task 3, locked
 * decision L3), recognition-only. Rendering is driven entirely by the real
 * {@link a2KanjiAssistancePolicy}, keyed off `exposure.stage` — never by the
 * learner's global `script` preference — so an `assessed` exposure always
 * renders the contextual word with the taught glyph emphasised and with no
 * furigana or romaji, in every recognition
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
 *   the `<ruby>` gets an explicit `aria-label` pinned to the word base —
 *   otherwise the browser's default ruby accessible-name computation would
 *   concatenate base+rt into a duplicated "word+reading" string.
 * - `assessed` (furigana "hidden", romaji "not-shown"): the word base, no
 *   `<ruby>`/`<rt>` element at all, and no romaji hint, unconditionally —
 *   plus a visible explanation caption sourced from the caller-supplied
 *   `assessedExplanation` copy (key `a2-kanji-why-visible`), tagged with a
 *   `data-copy-id` so its provenance is inspectable.
 *
 * Limits of the taught-glyph disambiguation (read before touching the
 * `.kanji-ruby__word-target` rules in course.css):
 *  1. The glyph/context distinction carried by those CSS rules is
 *     presentational only — it is NOT conveyed to assistive technology; the
 *     accessibility tree exposes no glyph-vs-context relationship.
 *  2. It backs BOTH non-assessed render paths — the visible path here (gloss
 *     rendered on `meaning` alone, no reveal gate, `<rt>` aria-hidden, no
 *     `aria-label`) and `RevealableKanjiRuby` (gloss gated on
 *     `revealed && meaning`). In both, the gloss describes only the glyph, and
 *     only the visual emphasis says which glyph — for sighted users.
 *  3. At `assessed` there is no ruby and no gloss, so the emphasis is not
 *     scoping a gloss: it identifies the item under test. Weakening or removing
 *     those rules there does not merely reduce clarity — it removes the
 *     question. The non-visual equivalent is that `assessedExplanation` names
 *     the glyph in its text, so the caption must keep interpolating it.
 *  4. This does NOT fix the gloss ambiguity for assistive-tech users: at the
 *     supported/revealable stages the gloss still has no programmatic
 *     association with the glyph. The ambiguity is resolved for sighted users
 *     only; the AT gap is a separate, owner-tracked item.
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
  /**
   * Localized copy for key `a2-kanji-why-visible`, shown at the assessed stage.
   * A function of the taught glyph: the assessed stage shows no ruby and no
   * gloss, so the caption names the character under test in the text itself
   * (e.g. "Su 毎 …"). That is the one cue of *which* glyph is being assessed
   * that does not depend on perceiving weight/colour. See the docstring above
   * for the limits of the visual emphasis this backstops.
   */
  readonly assessedExplanation: (glyph: string) => string;
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
  /** The contextual word this glyph lives in. When set, the ruby base shows the whole word with the target glyph emphasised apart from its context characters. */
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
    // Assessed: the word base (not the glyph alone — displayBase is the whole
    // contextual word, and renderWordBase emits all of it, with the taught
    // glyph in its emphasis hook). No furigana, no romaji, and — deliberately —
    // no semantic gloss either: if meaning is the recognition target, surfacing
    // it here would leak the answer, so the safest stage-aware behavior is to
    // withhold it entirely (spec-fix ISSUE 2). Because there is no ruby and no
    // gloss at this stage, the emphasis is not scoping a gloss — it identifies
    // the item under test. The explanation caption names that glyph in its text
    // so the "which kanji?" question is answerable without perceiving emphasis.
    return (
      <span className="kanji-ruby kanji-ruby--assessed">
        <span lang="ja">{renderWordBase(displayBase, glyph)}</span>
        <span className="kanji-why" data-copy-id="a2-kanji-why-visible">
          {assessedExplanation(glyph)}
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
        aria-label={revealed ? displayBase : undefined}
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
