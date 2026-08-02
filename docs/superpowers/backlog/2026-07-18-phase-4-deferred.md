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

### D-4. Gloss-to-glyph programmatic association (WCAG 1.3.1)

`src/course/components/KanjiRubyText.tsx` renders a contextual word (e.g. 毎日)
with the taught glyph (毎) visually emphasised and a semantic gloss beside it
("ogni, ciascuno") that describes *only the taught glyph* — the contract stated
at `src/course/a2/kanji/kanjiMeanings.ts:22` ("Each gloss describes the glyph's
own meaning inside its taught lexeme"). Task 26c gave that
`.kanji-ruby__word-target` emphasis real visual weight, so a sighted learner can
see the gloss is glyph-scoped. Nothing conveys that scoping to assistive
technology. The
`.kanji-ruby__word-target` / `.kanji-ruby__word-ctx` spans carry no role and no
ARIA; the `<ruby>`'s accessible name is the whole word (visible path: `<rt
aria-hidden>`, no `aria-label`; revealable path once revealed:
`aria-label={displayBase}`), and the `.kanji-ruby__meaning` gloss is an
independent sibling span. A screen-reader or braille user therefore receives
"毎日" and then "ogni, ciascuno" with nothing relating the second to one
character of the first — a false pairing, since 毎日 is "every day", not "every".

Scope is *both* non-assessed render paths, not only the revealed states. The
visible/first-supported path renders the gloss on `meaning` alone with no reveal
gate (`KanjiRubyText.tsx:211`); `RevealableKanjiRuby` gates it on `revealed &&
meaning` (`:260`). Both are affected. The assessed stage is *not* affected — it
renders no gloss, and Task 26c put the glyph's identity into the caption text.

Design to implement (specified now, while the context is live): mark the visible
gloss `aria-hidden="true"` and add a visually-hidden sibling carrying the scoped
phrasing in words. That puts the text into the accessibility tree by ordinary
reading order — relying on no ARIA name computation and no screen-reader
verbosity setting — which is exactly what makes it verifiable by asserting DOM
text rather than by trusting announcement behaviour.

**Blocker, not a footnote.** `.sr-only` is defined in exactly one place,
`src/syllabary/syllabary.css:46`, and course pages do not load that stylesheet
(they import `course.css` / `foundation.css`; `syllabary.css` is imported only by
`Syllabary.tsx`). The utility must be promoted to shared scope before this item
can be built.

Traps — recorded by name, or the next implementer rediscovers them in thirty
seconds and they pass review:

- **Do not put `aria-label` on the meaning span.** It is a role-less `<span>`;
  ARIA name computation applies to elements with appropriate roles, so this is a
  legitimate no-op — it would look exactly like a fix in the diff while doing
  nothing.
- **Do not use `aria-describedby`.** It moves the text into the *description*,
  which screen readers may announce late, at reduced verbosity, or suppress
  entirely by user setting. Whether the learner hears it becomes a user
  preference, not a property of our code.
- Both are instances of the general hazard this phase exists to eliminate: a
  change indistinguishable from a working one in the diff.

Fold the `lang` handling in here too. Task 26c's assessed caption interpolates a
bare Japanese glyph into Italian/English prose in a container with no `lang="ja"`
(`src/course/i18n/it.ts:83` "Su 毎 sei in fase di verifica…";
`src/course/i18n/en.ts:83` "You are being assessed on 毎…"). Screen readers
generally auto-detect CJK and switch voice, but that is a behaviour of the
reader, not a property of our markup. This was a deliberate, owner-authorised
trade at the release boundary: keeping the copy a plain string avoided turning a
contained copy change into a markup change, and the benefit that mattered
survives regardless of voice switching — the glyph is *present in the text*, so
braille and character-by-character navigation resolve it. Availability was the
defect; pronunciation is a refinement. Do the `lang` handling properly here,
with the rest.

Verification is against a real screen reader and is not inferrable from the DOM
alone. That is precisely why it was not done at the release boundary — no screen
reader was available.

Status, because it is what makes this item survivable: Task 26c's disambiguation
is **presentational and is not conveyed to assistive technology**. It fixes the
gloss ambiguity **for sighted users only**. Anyone reading "fixed" and stopping
is the failure mode this item exists to prevent.

### D-5. react-router advisory GHSA-qwww-vcr4-c8h2 (RSC-Mode CSRF)

Installed `react-router@7.18.1`, declared `^7.18.1`. `npm audit --omit=dev`
reports one high-severity advisory — "React Router: RSC Mode CSRF Bypass Allows
Action Execution Before 400 Response" (GHSA-qwww-vcr4-c8h2), affecting
`7.12.0 – 8.2.0`. Released with an explicit, narrowly-scoped, owner-authorised
exception. Two remediation branches, both real.

**Branch A — `7.18.2` becomes resolvable.** Then the fix is a *no-op install*:
`^7.18.1` already admits `7.18.2`, so it arrives on a plain `npm install`. Do not
edit the version range — it was never wrong. Verify by installing, confirming
`npm audit --omit=dev` is clean, and re-running the full release gate set
including the Playwright acceptance suite and the twelve visual baselines.

**Branch B — the major-version migration is its own piece of work with its own
gates.** `react-router@8.3.0` *is* resolvable from this feed (it is the feed's
`latest`, and the advisory's own fix target), but its peer range is `react` /
`react-dom` `>= 19.2.7` against our `react@18.3.1`. That is two major upgrades at
once — react-router 7→8 and react 18→19, with react 19's own removals.
Considered and declined as the final commit before a public release, under a
twelve-image visual baseline and a 3,759-test suite. Deferred, not dismissed.

Three facts bound the exception, each independently checkable and each capable of
killing it when it stops holding:

1. The advisory is already live in `master` at `ab0c078` — the commit learners
   are using now, which itself declares `^7.18.1` — so deploying changes exposure
   by exactly zero and holding the release protects no one.
2. The vulnerable codepath is unreachable here: production routing is
   `HashRouter` only (`src/App.tsx`; `MemoryRouter` appears only in tests), there
   are zero RSC imports, and the declared production dependencies are just three
   — `react`, `react-dom`, `react-router`. The full transitive production
   closure (`npm ls --omit=dev --all`) is **eight**: those three plus `cookie`
   and `set-cookie-parser` under `react-router`, and `loose-envify`,
   `js-tokens` and `scheduler` under `react`/`react-dom`. None touch the RSC
   path. Quote the eight-package figure, not the three-package one — "three"
   is the *declared direct* count and describes a smaller surface than the one
   actually shipped.
3. `^7.18.1` already admits `7.18.2`.

The mechanism is **not** established, and two proposed explanations were
falsified — that matters more than the conclusion:

- "The feed is ~7 days stale" — withdrawn. Its supporting evidence (a
  typescript-nightly ingestion gap) measured the wrong thing.
- "The feed ingests only the `latest` dist-tag lineage" — falsified:
  `react-router@6.30.4` resolves from this feed, tagged `version-6`, published
  2026-05-29, and was never `latest`. The feed *does* carry non-`latest`
  backport lineage.
- The only defensible statement: `react-router@7.18.2` does not resolve from
  this feed (`npm view react-router@7.18.2` returns E404); the cause is not
  established. Do not assert any mechanism.

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
references it. The budget check runs only if a human types it explicitly. The
README's release set now documents `npm run check:bundle` as a manual
verification step, so it is at least discoverable at release time; it remains
wired to no automated pipeline, so this entry stands until it is.

**Existence guards (lower severity).** `editorial.test.ts` lines 321 and 385
check that superlative (13 variants) and synthesis (52 variants) categories are
non-empty. These constrain category presence, not row content, and their margins
are 12 and 51 respectively — not fragilities in the same sense as the above.

**A false clause is camouflaged by its true neighbours.** `KanjiRubyText.tsx`
carried *"Assessed: bare glyph only. No furigana, no romaji, and — deliberately —
no semantic gloss either."* One false clause among three true ones: the assessed
stage renders the whole contextual word (`displayBase = word ?? glyph`, then
`renderWordBase` emits all of it), not the glyph alone. A reader checking the
sentence finds three correct statements, takes the signal "this comment is
accurate", and stops. It survived every prior review of that file, including two
in this phase. **Rule: verify comments clause by clause, not sentence by
sentence.**

**A corrective pass corrects what it is pointed at, not the class of defect.**
After that comment was fixed by name, a repo sweep found nine further live
instances of the same falsehood across five other files — including a Playwright
test *name* that printed the falsehood in the passing output of the very commit
that fixed its sibling. Measured: at `connected-conversation-4` every assessed
base is multi-character (話す / 言う / 聞く / 友だち); corpus-wide 107 of 120
assessed bases are multi-character, so "bare glyph" was wrong for 89% of the
corpus. **Rule: when a false comment is found, sweep for its class before
closing — a named instance is a sample, not the population.**

**A sweep can itself be scoped by imagination rather than by meaning.** That
sweep used a regex enumerating the phrasings its author could think of (`bare
glyph`, `glyph alone`, `only the glyph`) and missed a tenth instance reading
"assessed glyph **bare**" — a different word order, caught only by an independent
reviewer. The correct method searches the *subject* — every whole-word use of
`bare` near the kanji renderer (108 hits, hand-classified) — and resolves each
clause by clause: one instance (`tests/e2e/course-visuals.spec.ts:1158`, where 薬
and 体 genuinely are 2 of the 13 single-glyph bases) is **true**, so a blanket
find-and-replace would have introduced a fresh falsehood while removing others.

**The mechanism is generative, not merely historical.** The commit whose stated
purpose was deleting comments that assert behaviour the code does not produce
introduced a new one of its own. Plausible-sounding prose about behaviour gets
written faster than it gets checked — including by a process built to remove
exactly that.

Two further instances landed while this very document was being written, which
is why it is recorded as a mechanism rather than an incident. A correction to a
factual claim in the brief for this document — "the production closure is three
packages" — was itself wrong: the corrected figure offered was five, and the
measured figure is **eight** (`npm ls --omit=dev --all`). Three is the declared
direct count; five omits the `react-dom` subtree. So a pass whose purpose was
replacing an unverified number produced a second unverified number, and it read
as more credible than the original precisely because it arrived labelled as a
correction. **Rule: a correction carries no more authority than the claim it
replaces, and needs the same measurement. Record the command that produced the
figure next to the figure.**

**A reviewed commit that is amended leaves the review pointing at nothing.**
Task 26c's final review verdicts were recorded against `dbc85ff`. Actioning one
Minor comment-only finding produced `828c734` by `git commit --amend`, so
`dbc85ff` and `828c734` share the same parent (`8538a93`) and the same subject
line, and `git merge-base --is-ancestor dbc85ff 828c734` is **false**:
`dbc85ff` is unreachable from the branch and will eventually be garbage
collected. The review would have survived as a document whose subject cannot be
retrieved — the same failure as an untracked verification record, or a comment
describing code that has moved: an artifact that reads as authoritative with a
referent nobody can reach. The reflog shows amend-in-place was the habit
throughout this phase, on at least eight distinct commits; every other instance
was *pre-review* and therefore harmless, which is exactly why the one
post-review instance was not noticed. **Rule: never amend a commit once a
review verdict has been recorded against it — add a follow-up commit instead.
The amend destroys the reviewed object; a follow-up leaves both in history and
makes the post-review delta permanently visible.** The pull toward amending is
strongest when the change is trivial, which is when the record's anchor is
cheapest to lose. Where a verdict must cite a superseded SHA, state in the same
sentence that it was amended away, and quote the delta inline so the record is
self-contained.

**A second authority is more dangerous than a missing one.** The four-command
"development gate set" used throughout Phase 4 execution was introduced by the
phase plan, which never referenced `README.md`'s canonical `## Verifica` list —
a list that already named `npm run test:e2e`. Nobody was working without a
spec; they were working from a spec that had been quietly forked, and the
narrower fork produced confident green output for an entire phase while
acceptance-test rot stayed invisible. An omission announces itself when someone
looks for the missing thing. A fork does not: both lists are internally
consistent, both report "green", and the outputs are indistinguishable.
**Rule: a subset gate that does not announce it is a subset reports the
coverage of the superset.**

**An inferred mechanism is worth nothing until someone probes a case it rules
out.** Three explanations in this phase were inferred from a consistent pattern
and each was destroyed by a single direct probe costing one command: a mora
histogram read as evidence of a generation rule; a package feed diagnosed as
"~7 days stale"; and its replacement, "the feed ingests only the `latest`
dist-tag lineage", killed by `react-router@6.30.4` resolving under the
`version-6` tag having never been `latest`. Each survived exactly as long as it
was only tested where it predicted. The operative distinction is not between
checked and unchecked assumptions but between confirming and falsifying probes:
querying another case a hypothesis predicts can only ever strengthen it.
**Where a mechanism cannot be established, record "cause not established"
rather than the most plausible candidate — the first is actionable, the second
stops the next reader.**


role-less span; `aria-describedby` landing in the description. Both look like
fixes and may do nothing — the same shape as a golden file that re-freezes
current output, or a gate that cannot fail. **Rule: prefer changes verifiable by
asserting DOM text over changes that depend on consumer behaviour.**

**Independent confirmation requires independent provenance.** `npm audit` and
`gh api /advisories/{ghsa}` agreeing looked like corroboration, but both consume
the same coarsened mirror, which flattens the advisory's affected ranges into one
(`7.12.0 – 8.2.0`) and erases exactly the backport distinction under
investigation. The primary record is `gh api
/repos/{owner}/{repo}/security-advisories`. Same tool, same auth, one call apart
— and nothing signals that a choice is being made.

**Plausibility certifies rather than checks.** A gloss audit declared all 120
entries clean by asking "is this plausible polysemy?" instead of "does this
satisfy the standard this file states?" (`src/course/a2/kanji/kanjiMeanings.ts:22`).
Plausibility is a test almost any wrong answer passes. **Rule: make the standard
explicit before judging against it.**
