# Sentence Matrix Restyle - Design Specification

**Status:** Approved design; implementation deferred

**Date:** 2026-08-03

**Repository:** `unsafecode/nihongo-practice`

**Base:** `master` at `f3c7de7`

**Implementation status:** Design only; no application code is authorized by this document.

## 1. Problem

The current "Matrice delle frasi" is visually flat. Its rows contain the right
information, but every detail has nearly equal visual weight, so learners must
work too hard to compare phrases and identify the reusable content positions.

The primary task is comparison: learners should be able to scan down the
authored examples, notice the content slots, and understand that the phrases
are related variations. The matrix must not imply that the rows are numbered
steps, a timeline, or an obligatory progression.

## 2. Goals

1. Turn the existing single-column list into an unnumbered vertical
   transformation rail that makes related variations easier to scan.
2. Preserve authored row order and the existing collapsed/expanded behavior:
   exactly three curated rows when collapsed and all eight rows when expanded.
3. Make the Japanese/romaji phrase the primary row content, the translation
   secondary, speaker and situation compact supporting badges, and the
   omitted-subject note tertiary.
4. Emphasize semantic content-slot tokens from authored slot metadata, not from
   surface-string differences between rows.
5. Reuse the existing Japanese `mark` pattern from
   `FamilyGuidedConstruction.tsx` and the
   `RomajiSequence` `highlightedTokenIds`/`highlightClassName` API.
6. Use the site's existing visual tokens and accessibility contracts.
7. Keep the matrix usable in IT and EN, in hiragana and romaji modes, on narrow
   screens, and at 200% zoom without horizontal overflow.
8. Add behavior-focused unit, component, Playwright, and visual-regression
   coverage before changing production behavior.

## 3. Non-goals

This work does not:

- redesign the rest of the course or the lesson page;
- reorder, add, remove, or rewrite authored sentence content;
- introduce a new learning mode, progression model, timeline, or numbered step
  sequence;
- change the three-row curated subset or eight-row expanded set;
- change locale or script behavior;
- change `FamilyGuidedConstruction` behavior or presentation;
- change `RomajiSequence` formatting behavior;
- infer semantic changes from Japanese, romaji, translation, or DOM text;
- add canonical Japanese, romaji answers, or token IDs to DOM metadata;
- add new design tokens, dependencies, persistence, analytics, or deployment
  infrastructure.

## 4. Chosen direction and rejected alternatives

### 4.1 Chosen: unnumbered vertical transformation rail

The matrix remains a semantic unordered list in authored order. A coral rail
and repeated geometric markers visually connect the rows. There are no
numbers, arrows, timestamps, "step" labels, or ordered-list semantics.

This direction provides enough personality and grouping to improve comparison
without falsely describing the examples as sequential tasks.

### 4.2 Rejected: two-column study cards

Separating rows into two columns would create more card personality, but it
would make vertical phrase-to-phrase comparison harder and would collapse back
to one column at the widths where many learners use the app. The layout would
also add a horizontal reading pattern that is not needed.

### 4.3 Rejected: anonymous table-like bands

Full-width table bands would be efficient and align repeated fields, but they
would feel anonymous and overly utilitarian. They also encourage column
scanning over phrase reading and do not fit the site's warm editorial visual
language as well as the rail.

## 5. Experience design

### 5.1 Matrix structure

The existing semantic structure is retained:

```text
section
  heading
  introduction
  ul
    li x 3 or x 8
      phrase
      translation
      dl
        speaker dt/dd
        situation dt/dd
      optional omitted-subject note
  disclosure button
```

The `ul` is the transformation rail. Each `li` is a related variation, not a
step. The rail is decorative and is implemented with CSS pseudo-elements so it
adds no redundant accessibility-tree content.

### 5.2 Row hierarchy

Each row uses this fixed visual hierarchy:

1. **Phrase:** the largest and strongest content. The phrase block is a vertical
   stack, never a side-by-side phrase grid. In hiragana mode, Japanese is first
   and romaji sits directly below as pronunciation support. In romaji mode,
   romaji is the only phrase line and receives the primary phrase treatment
   instead of inheriting the muted support treatment.
2. **Translation:** directly below the phrase, readable but less prominent.
3. **Speaker and situation:** the existing `dl` remains semantic, while each
   `dt`/`dd` pair is styled as a compact badge. The labels remain visible; icons
   or color never replace "Speaker" or "Situation."
4. **Omitted subject:** the existing localized note remains conditional and is
   rendered as small muted tertiary text after the metadata.

The row surface uses `background: var(--course-surface)`,
`border: 2px solid var(--course-line)`, `border-radius: var(--radius)`,
`padding: var(--space-5)`, and `box-shadow: var(--shadow-sm)`. These values make
the border, radius, and spacing stronger than the current `1px`/`0.75rem`/
`0.85rem` row treatment without introducing tokens. Each metadata pair is an
`inline-flex` pill with a `1px` `var(--course-line)` border, `999px` radius, and
`var(--space-1) var(--space-3)` padding. The rail and marker use
`var(--course-coral)`; slot emphasis uses `var(--course-coral-soft)`.

### 5.3 Rail and markers

`.foundation-matrix__rows` gets relative positioning and
`padding-inline-start: var(--space-6)`. Its `::before` pseudo-element draws one
continuous `3px` vertical coral rail. Each
`.foundation-matrix__row::before` draws a `0.75rem` circular marker aligned with
the first phrase line.

The marker has a visible outline and filled/clear center contrast in addition
to coral color. The rail is a grouping cue only. It does not carry state, row
identity, completion, correctness, or order.

### 5.4 Content-slot emphasis

Every rendered token that comes directly from an authored
`SentenceFamily.slotSchema` slot is a comparison token. These marks identify
the semantic substitution positions in each phrase; they do not claim that a
token differs from the preceding row.

Comparison tokens use all of the following:

- soft coral background;
- `font-weight: 800`;
- an underline with `0.15em` thickness and `0.12em` offset.

The mark therefore remains distinguishable without color. Particles,
punctuation, fixed honorifics, fixed adverbs, interrogative markers, copula
pieces, and inflectional endings emitted by realization rules are not marked.

## 6. Architecture and data flow

The feature keeps the existing catalog-to-view-model-to-component flow:

```text
SentenceFamily.slotSchema + SentenceVariant.slotValues
                           |
                           v
                 realizeVariant(...)
                           |
                           v
        AssembledToken.source.referenceId
                           |
                           v
   buildLessonViewModel rowFor(...) derives comparisonTokenIds
                           |
                           v
             FoundationLocalizedRow
                  |                    |
                  v                    v
     JapaneseSegmentText          RomajiSequence
       inside <mark>       highlightedTokenIds + class
```

`buildLessonViewModel.ts` remains the only layer that combines authored family,
variant, and realized-token information. `SentenceMatrix.tsx` receives explicit
token IDs and does not inspect strings or catalog internals.

### 6.1 `FoundationLocalizedRow` contract

`FoundationLocalizedRow`, defined in `buildLessonViewModel.ts` and re-exported
by `foundationViewModel.ts`, gains exactly one field:

```ts
export interface FoundationLocalizedRow {
  // Existing fields remain unchanged.
  readonly comparisonTokenIds: readonly string[];
}
```

`comparisonTokenIds` is:

- locale-independent;
- ordered in the same order as `row.tokens`;
- a subset of `row.tokens.map((token) => token.id)`;
- derived once by the view model;
- never serialized into a `data-*`, `aria-*`, title, or other DOM attribute.

The field name describes its pedagogical purpose. It deliberately does not use
`changedTokenIds`, because the matrix has no previous/next row relationship.

### 6.2 Strict token-ID derivation

The derivation is an exported pure helper so its contract can be tested without
rendering or reconstructing a whole lesson:

```ts
export function foundationComparisonTokenIds(
  family: SentenceFamily,
  variant: SentenceVariant,
  tokens: readonly AssembledToken[],
): readonly string[];
```

`foundationViewModel.ts` re-exports it beside `foundationGuidedDelta`.

The implementation uses one strict source-reference parser in
`buildLessonViewModel.ts`. It should strengthen/rename the existing private
`slotIdOfToken` helper so the matrix and guided-delta derivations do not create
two parsers. Valid guided-construction output remains unchanged.

For a given `family`, `variant`, and realized `tokens`, a token is included only
when all of these conditions hold:

1. `token.source.domain === "family"`;
2. `token.source.referenceId` has exactly two slash-separated segments;
3. the first segment equals `variant.id`;
4. the second segment is an ID in `family.slotSchema`;
5. `variant.slotValues` owns that slot ID.

The current realizer emits slot content as
`${variantId}/${slotId}` and rule content as
`${variantId}/rule/${name}`. Requiring exactly two segments excludes rule
content without checking token text or token kind. Multiple fragments from one
semantic value remain separate IDs and are all included in realized order.

The derivation must not read or compare:

- `token.jp`;
- `token.romaji`;
- `row.translation`;
- neighboring rows;
- rendered DOM text;
- edit distance, prefixes, suffixes, or other string-diff heuristics.

### 6.3 Component rendering

`SentenceMatrix.tsx` keeps its current state and disclosure reducer.
The section receives a presentation-only
`foundation-matrix--romaji` modifier when `script === "romaji"` so CSS can
promote the lone romaji line without adding a data attribute.

For Japanese, its existing `JapaneseRow` follows the established
`FamilyGuidedConstruction` pattern: create the normal
`JapaneseSegmentText`, wrap it in `<mark>` only when the token ID is in the
row's comparison set, and otherwise return the existing keyed fragment. This
does not introduce a second Japanese text formatter.

For romaji, `SentenceMatrix` passes:

```tsx
<RomajiSequence
  tokens={row.tokens}
  highlightedTokenIds={row.comparisonTokenIds}
  highlightClassName="foundation-matrix__comparison-token"
  errorText={errorText}
/>
```

`RomajiSequence.tsx` itself is not changed. Its formatter remains responsible
for separators so mark wrappers cannot collapse romaji word spacing.

## 7. Component responsibilities

### `buildLessonViewModel.ts`

- Resolve the family and variant already required to build each localized row.
- Strictly derive ordered comparison token IDs from slot/source metadata.
- Add the IDs to every `FoundationLocalizedRow`.
- Preserve locale-independent row identity and authored order.
- Preserve the existing guided-delta result for valid authored data.

### `SentenceMatrix.tsx`

- Preserve collapsed/expanded state, semantic structure, authored order, and
  current DOM metadata.
- Apply the explicit comparison IDs to Japanese and romaji render paths.
- Keep phrase, translation, badges, and omission note in the approved hierarchy.
- Avoid catalog lookup, surface comparison, and new answer metadata.

### `foundation.css`

- Create the rail, markers, row surface, hierarchy, badge treatment, and
  comparison mark treatment with the exact existing-token values in Section 5.
- Keep all sizing fluid and wrapping-safe.
- Preserve visible focus and reduced-motion rules.
- Add no horizontal rail variant.

### Referenced shared components

- `FamilyGuidedConstruction.tsx` is reference behavior for Japanese `<mark>`
  placement only; its props, output, styles, and guided behavior do not change.
- `RomajiSequence.tsx` is consumed through its existing highlighting API and is
  not modified.

## 8. Responsive behavior

The matrix is a single vertical rail at every width. It never becomes a
horizontal scroller, two-column card grid, or table.

- Rows and all descendants retain `min-width: 0`.
- Phrase, translation, badge values, and omission copy use safe wrapping.
- No row, badge, or mark receives a fixed content width or `white-space: nowrap`.
- On wider screens, speaker and situation badges may wrap on one metadata row.
- At the existing narrow breakpoint, the metadata pairs stack vertically and
  stretch only as needed; the phrase and translation remain above them.
- Rail inset and row padding reduce at narrow widths but the marker remains
  aligned with the phrase.
- At 200% desktop zoom, the existing test helper's real reflow viewport must
  show all eight expanded rows without document overflow.
- At 200% mobile pinch zoom, the unchanged layout remains visually reachable
  without introducing layout overflow.

## 9. Accessibility and interaction

1. Preserve `section`, labelled heading, `ul`/`li`, `dl`/`dt`/`dd`, native
   `button`, `aria-expanded`, and `aria-controls`.
2. Keep the list unordered. Do not add numeric labels, ordered-list semantics,
   `aria-posinset`, "step" language, or timeline terminology.
3. Keep the disclosure button's existing minimum 44 by 44 CSS-pixel target and
   visible `:focus-visible` outline.
4. Use `<mark>` for pedagogical emphasis, with background, weight, and underline
   so color is not the only cue.
5. Keep separators outside romaji marks through `RomajiSequence`; highlighted
   wrappers must not concatenate words in visible text or the accessibility
   tree.
6. Preserve `lang="ja"` and `JapaneseSegmentText` ruby/reading behavior.
7. Keep speaker and situation labels as text inside the semantic definition
   list; badge shape is decorative.
8. The rail and markers are pseudo-elements and remain absent from the
   accessibility tree.
9. Add no motion. Retain the existing `prefers-reduced-motion: reduce` contract
   for the disclosure control.
10. Preserve the localized omitted-subject text; position and color alone do
    not communicate subject omission.

## 10. Error and fallback behavior

- Existing lesson-building failures remain typed and return no partial lesson.
  Missing family, variant, or realized sentence continues to use the existing
  `realization-failed` path.
- Rule-backed tokens are expected and are rendered normally without marks.
- A token with a non-matching domain, variant reference, malformed reference,
  unknown slot, or absent authored slot value is not marked. The implementation
  must never compensate with a string diff.
- If `comparisonTokenIds` is empty, the complete phrase still renders without
  emphasis; translation, metadata, omission note, order, and disclosure remain
  available.
- Unit coverage across authored model rows makes missing expected slot-backed
  IDs a release failure, so the safe unmarked runtime fallback does not hide a
  production catalog regression.
- `RomajiSequence` formatting failures keep the existing localized
  `role="alert"` output. Japanese and surrounding row content remain available.

## 11. Test strategy

Implementation follows test-driven development. Each behavior starts as a
failing focused test, production code is added only to make it pass, and
refactoring happens after the focused suite is green.

Tests assert rendered structure, token correspondence, computed styles,
ordering, dimensions, and overflow. They do not pass merely because a class
name exists.

### 11.1 View-model unit tests

Extend `src/course/foundations/foundationViewModel.test.ts` with:

1. A pure derivation test proving that returned IDs are exactly the realized
   tokens whose strict family source reference maps to an authored slot.
2. An order/subset test proving IDs remain in token order and all resolve to
   tokens in the same row.
3. Coverage for multi-fragment semantic values.
4. Exclusion tests for particles, endings, punctuation, fixed rule content,
   malformed references, a different variant ID, an unknown slot, and a
   non-family source domain.
5. A no-surface-heuristic test that changes Japanese and romaji strings while
   leaving source metadata fixed and observes identical IDs, then changes only
   source metadata and observes different IDs.
6. Fixture and production-model coverage proving every expected matrix row
   receives at least one comparison ID without changing the authored row order,
   locale parity, or the existing guided delta.

### 11.2 Component DOM tests

Extend `src/course/foundations/SentenceMatrix.test.ts`. Render static markup and
parse it with the repository's existing `DOMParser` test pattern.

For hiragana mode:

- compare Japanese mark text, count, and order with the JP fragments selected
  by `row.comparisonTokenIds`;
- compare romaji mark text, count, and order with the formatted runs for those
  same IDs;
- prove rule tokens remain outside marks.

For romaji mode:

- prove the Japanese line is absent;
- prove the same comparison IDs are marked in the romaji phrase;
- prove formatted word spacing remains present.

Across both modes:

- preserve section/list/list-item, definition-list, and disclosure-button
  semantics;
- preserve the three-row collapsed order and eight-row expanded reducer order;
- preserve IT/EN and script-invariant variant order;
- preserve translation, speaker, situation, and conditional omission text;
- assert that no answer, canonical Japanese, JP, romaji, or comparison-token ID
  is exposed through DOM metadata.

### 11.3 CSS and Playwright behavior

Keep the existing source-contract checks in
`src/course/foundations/foundation.css.test.ts`, but use Playwright for actual
visual behavior.

Extend `tests/e2e/foundation-ux.spec.ts` to:

- expand from three to eight rows and preserve authored order;
- in hiragana mode, verify both Japanese and romaji comparison marks correspond
  to the view-model oracle;
- in romaji mode, verify Japanese is absent and romaji comparison marks still
  correspond to the same oracle;
- inspect computed style for representative marks and require a nontransparent
  background, stronger numeric font weight than neighboring text, and
  `text-decoration-line` containing `underline`;
- verify speaker/situation remain semantic `dt`/`dd` pairs;
- call the existing `assertNoHorizontalOverflow` after expansion in both
  scripts on both configured projects (`1440 x 1000` and `390 x 844`);
- retain runtime-error, local-network, focus, touch-target, reduced-motion, and
  forbidden-data-attribute gates.

Extend `tests/e2e/zoom-a11y.spec.ts` using the existing
`applyBrowserZoom`/`assertZoomApplied` helpers. The representative semantic
lesson must expand to eight rows and pass `assertNoHorizontalOverflow` in
hiragana and romaji at 200% under both the desktop reflow and mobile pinch-zoom
mechanisms.

### 11.4 Visual regression

Extend `tests/e2e/screenshots.spec.ts` with one deterministic expanded-matrix
element screenshot on the foundation fixture route. The existing desktop and
mobile Playwright projects produce the two reviewed baselines:

- `foundation-matrix-expanded-desktop-1440-darwin.png`;
- `foundation-matrix-expanded-mobile-390-darwin.png`.

The test expands the matrix before capture and screenshots
`.foundation-matrix`, not the unrelated rest of the fixture page. Baselines are
updated only after functional, computed-style, zoom, and overflow assertions
pass, then reviewed for hierarchy, marker alignment, mark legibility, wrapping,
and absence of clipping.

## 12. Rollout

1. Add the failing view-model and component tests.
2. Add strict comparison-ID derivation and the row field.
3. Wire the existing Japanese and romaji mark mechanisms.
4. Apply the rail and hierarchy CSS with existing tokens.
5. Add/extend Playwright behavior and 200% zoom checks.
6. Generate and review the two expanded-matrix baselines last.
7. Run the focused Vitest files, production build, relevant Playwright specs,
   then the complete existing suites before merge.

No feature flag, data migration, copy migration, or staged content rollout is
required. Because the shared `SentenceMatrix` is used by production semantic A1
lessons and the compile-time fixture harness, the change rolls out consistently
to both. Existing URLs, storage, settings, authored catalogs, and deployment
configuration remain unchanged.

## 13. Implementation scope

Expected production files:

- `src/course/foundations/buildLessonViewModel.ts`;
- `src/course/foundations/SentenceMatrix.tsx`;
- `src/course/foundations/foundation.css`.

Expected directly related tests and baselines:

- `src/course/foundations/foundationViewModel.test.ts`;
- `src/course/foundations/SentenceMatrix.test.ts`;
- `src/course/foundations/foundation.css.test.ts` only for relevant retained CSS
  contracts;
- `tests/e2e/foundation-ux.spec.ts`;
- `tests/e2e/zoom-a11y.spec.ts`;
- `tests/e2e/screenshots.spec.ts`;
- the two generated expanded-matrix snapshots.

`FamilyGuidedConstruction.tsx` and `RomajiSequence.tsx` are reference/reuse
points, not expected implementation targets. Any change outside this list
requires a direct dependency on the approved behavior and separate review.

## 14. Acceptance criteria

The restyle is complete only when:

1. The matrix is visibly one unnumbered vertical rail at desktop, mobile, and
   200% zoom.
2. Collapsed state shows the exact curated three rows; expanded state shows all
   eight in authored order.
3. The phrase is visually primary, translation secondary, metadata badge-like
   and secondary, and omission note tertiary.
4. Every marked Japanese/romaji token is selected from strict authored
   slot/source metadata, with no surface-string inference.
5. Slot marks use soft background, stronger weight, and underline; rule tokens
   remain unmarked.
6. IT/EN and hiragana/romaji behavior and row identity are unchanged.
7. Section, unordered-list, definition-list, disclosure, focus, touch-target,
   reduced-motion, and non-color-only contracts pass.
8. Expanded matrices have no horizontal overflow at both configured viewports
   and at 200% zoom in both scripts.
9. No canonical Japanese, romaji answer, or comparison-token ID is added to DOM
   metadata.
10. The desktop and mobile expanded-matrix baselines are reviewed and committed.
11. No guided-construction behavior, course content, ordering, learning mode, or
    unrelated course surface changes.
