/**
 * The single shared renderer for one segment's on-page Japanese text (design
 * spec §7, §8.3; Slice B acceptance). Both {@link TransformComparison}'s
 * comparison cards and {@link GuidedTransformation}'s guided-board endpoints
 * render every authored segment through this component, so the katakana-first
 * assisted-exposure rule lives in exactly one place instead of being
 * duplicated (or, as before, silently dropped) at each call site.
 *
 * Whenever the catalog marks a segment with a `reading` — the hiragana
 * reading `assembleCourse` (and the catalog's `k()` helper) attach to a
 * katakana loanword's assisted exposure — the authentic katakana renders with
 * a semantic `<ruby><rt>` hiragana annotation directly above it, satisfying
 * the hiragana-primary policy without duplicating the Japanese source or
 * ever showing hiragana pretending to be the standard katakana spelling.
 * Segments without a `reading` (every non-loanword word, and any later
 * lexeme reuse the catalog does not mark) render their plain text completely
 * unchanged — this component never invents an aid the data does not carry,
 * so a later unassisted exposure of the same lexeme stays plain.
 *
 * Romaji is unaffected: it is derived once, from the shared reading, by
 * `assembleCourse`'s `segmentRomaji` (spec §7) and rendered as ordinary text
 * by the caller — this component only ever adds the ruby annotation to the
 * katakana/hiragana ("jp") line.
 */
export function JapaneseSegmentText({
  jp,
  reading,
}: {
  readonly jp: string;
  readonly reading?: string;
}) {
  if (!reading) return <>{jp}</>;
  return (
    <ruby className="katakana-assist">
      {jp}
      <rt className="katakana-assist__reading">{reading}</rt>
    </ruby>
  );
}
