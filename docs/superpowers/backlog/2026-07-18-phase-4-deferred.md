# Deferred and rejected after Phase 4 — 2026-07-18

Findings investigated during Phase 4. Each is recorded with its verdict, so the
next reviewer does not re-derive it and so nothing is quietly forgotten.

Two verdicts appear here and they are not the same:
- **Deferred** — real, worth doing, out of scope for this phase.
- **Rejected** — investigated and found not to be a defect. Do not "fix" these.

---

## Part 1 — Deferred

### D-1. Kanji inside realized practice sentences

All 809 realized A2 editorial rows are pure kana. Measured across every `jp`
field in `a2EditorialSurfaces.golden.json`: 11,773 kana characters (ranges
U+3040–309F hiragana, U+30A0–30FF katakana, U+31F0–31FF katakana phonetic
extensions, U+FF66–FF9D half-width katakana), plus 317 Japanese punctuation
characters (、。？！「」). Ideograph count (U+4E00–9FFF, U+3400–4DBF,
U+F900–FAFF): zero. Rows containing at least one ideograph: zero.

The 120 contextual kanji the course teaches therefore never appear in a sentence
a learner reads or practises. Phase 4 fixed the honesty gap — Task 26 now shows
each glyph inside its own word and removes the earlier claim that learners would
read kanji in context — but it did not put kanji into the sentences.

Deferred because it is a catalogue-wide authoring project with three coupled
parts: (1) every `SemanticValueTokenFragment` would need a kanji orthography
alongside its kana, but only for the glyphs taught so far, making the
orthography stage-dependent rather than fixed; (2) the tile-ordering and
completion token models split on fragments, so a script-aware renderer would
have to keep answer normalisation stable across script modes; (3) the change
must be reconciled with the hiragana-first writing policy and the existing
four-stage assistance policy. It would take a dedicated phase, with a
per-stage orthography resolver and a golden regenerated per stage.

### D-2. The general "no invented gloss content" invariant

Phase 4 shipped C7, a curated locative gate (see `a2ContentInvariants.test.ts`
lines 304–333). It checks two phrase-pairs: "in the sea / nel mare" against
うみ (5 rows engage it), and "here / qui" against ここ (3 rows engage it). The
gate is deliberately small and exact because the catalogue cannot support a
general gloss-alignment engine: `SemanticValueTokenFragment` carries `jp`,
`romaji`, `kind`, `boundaryBefore`, and optionally `reading`, but no
per-fragment gloss fields. The glosses are authored at variant level, not at
fragment level, so there is nothing to align a gloss fragment against.

Deferred because implementing the general rule would require extending
`SemanticValueTokenFragment` with `glossEn` and `glossIt`, authoring those
fields for every fragment in the catalogue, deriving each variant's gloss by
composition, and asserting that the authored gloss is a permutation of the
derived one. That is a catalogue-wide authoring and type-system change.

### D-3. A1 variant-by-variant linguistic review

A2's variants were reviewed individually in Phase 3; A1's were not. Task 32
ran three structural gates against A1's 572 realized rows and found no
offenders.

Honest caveat: of those three gates, two do not engage any current A1 row. Gate
1 (topic phrase before a clause-initial interjection) can never fire because the
A1 semantic catalogue contains no interjection values. Gate 2 (mixed polite/
plain register across clauses) can never fire because no A1 sentence family
produces a multi-clause surface; splitting on 。 always yields a single clause.
Gate 3 (both EN and IT glosses present) actively constrains all 572 rows. All
three gates can fail — fault injection confirms it — but two of them are forward
guards for future authoring, not constraints on today's data. Structural gates
of this kind cannot detect a wrong collocation, a wrong honorific, or a gloss
that overclaims.

Deferred because a linguistic review of A1 is the same size of undertaking as
the A2 Phase 3 review; it would require the same four-reviewer protocol plus
the adjudication step that separated genuine defects from inflated ones.

---

## Part 2 — Rejected — do not act on these

### R-1. The A2 variants carrying `interrogative: false`

42 A2 variants carry `interrogative: false` in the golden but their realized
Japanese ends in か. Two independent reviewers traced every consumer of the
`form.interrogative` flag. It is inert bookkeeping for these 42: they all
belong to rule-invariant sentence families, where the question particle is baked
into the family template rather than appended by the realization rule. The flag
is false because the question mark is not emitted by the flag; the glosses are
already correctly interrogative; exercises, TTS, and answer-checking all consume
realized tokens, not the flag.

Do not flip these 42 to `true`. The editorial gate at `editorial.test.ts`
line 287 enforces that for non-invariant families a sentence-final か requires
the flag to be true; it deliberately exempts invariant families precisely
because their か is not flag-controlled. Flipping these 42 would cause the
realization rule to append a second か to surfaces that already end in か,
actively breaking them. Phase 4 documented the field rather than touching it.

### R-2. Reading gaps in the kanji catalogue

The kanji catalogue has reading gaps — for example 何 lacks the reading なに.
Rejected as a present defect because no realized sentence contains any
ideograph at all (confirmed: zero, see D-1 figures). These gaps never reach a
learner. The finding is subsumed by D-1: if kanji ever enter realized sentences,
the readings must be completed at that time as part of the same authoring work.

### R-3. The "incompatible" size comparisons

Six size-comparison variants were reported as semantically incompatible.
Investigated via gate C6 (`a2ContentInvariants.test.ts` lines 252–301), which
checks adjective-dimension compatibility in three steps: it asserts that every
comparison adjective stem declares a `comparisonDimension`, that every object
used in a comparison slot declares `comparableDimensions`, and that no
comparison pairs an object with a dimension absent from its
`comparableDimensions`. All six pairs passed every step: each object carries a
`comparableDimensions` list that includes the predicate's `comparisonDimension`.
The pairings are grammatically sound. No change.

C6 was green from the first moment it was written — a forward guard, not a
defect detector on today's data. It exists so that a future comparison variant
cannot silently pair an object with a dimension it has no value on, and it has
been proven able to fail on deliberately broken input. A reader
should note the parallel with A1 gates 1 and 2: C6 engages today's 34
comparison and superlative rows and finds nothing wrong, but its value is in
catching tomorrow's bad authoring, not in confirming today's.

---

## Part 3 — Fragilities observed during execution

**A1 gate inertness.** Task 32's three gates behave differently at the data
level today. Gate 1 (topic before interjection) and gate 2 (multi-clause
register mixing) match zero current A1 rows — they are forward guards with no
present engagement. Gate 3 (both glosses present) constrains all 572 rows.
All three can fail on injected data, so none are tautologies; but a reviewer
should not read gate 1 or gate 2 passing as evidence that A1 is clean on those
dimensions. It means only that today's authoring never created the conditions
those gates were written to catch.

**Data-derived thresholds, one at zero margin.**
`src/course/foundations/exerciseKindVariety.test.ts` lines 85-86 gate A1 with:

```ts
expect(stats.distinct).toBeGreaterThanOrEqual(Math.ceil(stats.total / 2));
expect(stats.maxShared).toBeLessThanOrEqual(Math.ceil(stats.total / 4));
```

Both thresholds are derived from `stats.total` — the number of A1 lessons under
test (44, from `a1SemanticFoundationCatalogs`) — rather than authored as
independent constants. The threshold is not a tautology: `distinct` and `total`
are computed independently by `collect()`, so both assertions can genuinely
fail. But the thresholds move with the corpus, and the two assertions have very
different margins today. Line 85: `distinct = 22`, bound `= ceil(44/2) = 22`,
margin **zero** — one content edit that collapses a lesson onto an existing
sequence turns it red. Line 86: `maxShared = 8`, bound `= ceil(44/4) = 11`,
margin **3** — tighter than it looks but not zero. The in-code comment (lines
74-82) records the line 85 situation; it says nothing about maxShared.

By contrast, the A2 block immediately above (lines 60-65) uses hard-coded `60`,
`30`, `12` — the same suite gates A2 with fixed constants and A1 with
corpus-derived ratios on both lines.

**Transformation gate: zero margin.**
`src/course/a2/catalog/transformationCoverage.test.ts` line 35 asserts at
least one transformation exercise exists across the A2 catalogue. The in-code
comment records the current figure: exactly 1 transformation target
(`health-advice-1-t4`) of 600 total exercise targets (60 lessons × 10
exercises, per `reports.test.ts` line 51). Any content or seed change that
drops that one pair yields a level with no transformation exercises and
silently fails this gate, but nothing else in the suite would notice the
exercise kind had vanished. The comment also records the correct remediation:
author another tense twin, not weaken the gate.

**Bundle budget not wired to any pipeline.**
`package.json` defines `check:bundle: vite-node scripts/checkBundleBudget.ts`,
but `prebuild` invokes only the two release validators and the Japanese-literal
lint, `build` runs `tsc --noEmit && vite build`, and no `.github/` workflow
references it. The budget check runs only if a human types it explicitly.

**Existence guards (lower severity).** `editorial.test.ts` lines 321 and 385
check that superlative (13 variants) and synthesis (52 variants) categories are
non-empty. These constrain category presence, not row content, and their margins
are 12 and 51 respectively — not fragilities in the same sense as the above.
