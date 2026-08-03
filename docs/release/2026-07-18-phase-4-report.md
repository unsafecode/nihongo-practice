# Phase 4 — what shipped, and what it taught

**Date:** 2026-08-03 · **Baseline:** `ab0c078` · **Live:** `0230db0` · **Repository tip:** `abb6b11`

This is the report for someone returning with no context. It is not a task log. It says what
changed for learners, what it costs, and what the phase found out about how wrong things survive
review.

The product is a browser-based Japanese course covering CEFR levels A1 and A2. Learners read
practice sentences written in *kana* — the two phonetic scripts, which spell words out sound by
sound — and separately study *kanji*, the several-thousand Chinese-derived characters that literate
Japanese also uses. Kanji are logographic: a single character stands for a whole meaning and can be
read several different ways depending on the word it sits in. Which of those two scripts a sentence
is written in is therefore a substantive teaching decision, and it is the subject of the main defect
below.

Every project figure below carries the thing it counts and, where the number is load-bearing, the
command that produced it. Figures taken from a committed document rather than re-measured today are
marked **[recorded]** with their source. Common-knowledge definitions — such as the paragraph above —
are not project claims and carry no command.

---

## 1. What shipped

The site is live and serving `0230db0`. It is better than the state it replaced, and the
improvement is specific rather than general.

### The defect the phase existed to remove

At the baseline `ab0c078`, the course told every learner this, in both languages, on the kanji
panel of each lesson:

> "These kanji appear in this lesson's sentences. Recognize them in context — there is no writing
> to do."

That was false. Not misleading, not imprecise — **false**. Not one practice sentence in the course
contains a single ideograph; every realized sentence is pure kana. The learner was told to look for
something that was not there, and when they did not find it, the most natural conclusion available
to them was that they had failed to recognise it.

It is now:

> "Each kanji is shown inside the word it belongs to. Recognize them there — the practice sentences
> stay in kana, and there is no writing to do."

```
grep -n -A3 'sectionHeading' src/course/i18n/en.ts   # → line 80-81, current text
git --no-pager show ab0c078:src/course/i18n/en.ts    # → line 84-85, the false text
```

Both languages. `it.ts` carries the matching correction.

**Why this matters more than its size suggests.** Every automated gate was green at `ab0c078`, and
the phase's formal spec requirements were all recorded as met. The claim was false anyway, because no
gate was looking at whether the words matched the world. That is the shape of the whole phase: the
failures were not in the checks, they were in the space the checks did not cover, and each one looked
correct from inside.

### What else changed

`git --no-pager diff --shortstat ab0c078..master` → **103 files changed, 10,181 insertions,
796 deletions**, across **103 commits** (`git --no-pager log --oneline ab0c078..master | wc -l` —
the two 103s are a coincidence, not a transcription error).

By commit type — 35 docs, 28 fix, 23 test, 3 feat, 2 style, 2 refactor, 2 chore, and 8 without a
conventional prefix:

```
git --no-pager log ab0c078..master --oneline | sed 's/^[a-f0-9]* //' \
  | sed 's/(.*//' | awk -F: '{print $1}' | sort | uniq -c | sort -rn
```

Grouped by what a learner would notice:

- **Truthful copy.** The kanji-panel claim above, plus a sweep of every comparable learner-facing
  statement for the same defect class.
- **Exercise variety.** Practice kinds no longer arrive in a predictable order; the sequence is
  decorrelated by stride-based rotation rather than repeating per lesson.
- **The synthesis lessons**, rewritten.
- **Accessibility.** The revealed reading now announces the whole word rather than the bare glyph;
  the assessed stage no longer hands over the answer it is assessing; the evidence control has a
  visible focus ring and moves focus, not just the viewport.
- **New validators.** Checks that assert an independent property, rather than re-freezing whatever
  the code currently emits. This distinction is the subject of §2.

### Verification

- `npx vitest run` → **199 test files, 3,759 tests, all passing** (measured today on `abb6b11`).
- `npm run prebuild` → A1 catalog valid, A2 catalog valid, **0 Japanese-literal violations**.
- Two deployments, both `success` (`gh run list --workflow=deploy-pages.yml`):
  `426cee8` (run `30751862964`) and `0230db0` (run `30761711285`).
- Deployed JavaScript verified by hashing the served bytes and comparing against the gated build.
  All chunks byte-identical. Not "returns 200" — **the same bytes we tested**.

---

## 2. What it costs you

Three things are true and not fixed. They are listed here rather than discovered later.

### The disclosed residual

The checkpoint evidence control used to be a link to `#can-do-summary`. Under this app's hash
router the fragment *is* the route, so that address resolves to no route and the router answers it
with a warning banner — while the section it names sits roughly 4,000–4,200px down the same page.
Measured live as `window.scrollY` after activating the control on the deployed site: 0 → **4059** in
English, 0 → **4171** in Italian, against a 720px viewport.

The exact banner strings, from `src/course/i18n/en.ts:30` and `it.ts:30` (the curly quotation marks
are in the source):

> **EN** — “/can-do-summary” does not exist. You are back at the course.
>
> **IT** — La pagina “/can-do-summary” non esiste. Sei tornato al percorso.

The control is now a `<button>`, so nothing in the interface offers that address any more. But the
address itself is **unreachable, not valid**: typed by hand, or restored from a link someone copied
during the roughly four-hour window between the two deployments, it still produces the banner.
Nobody holds such a link. The full fix is teaching the router to resolve the fragment, which is
real router work and was declined twice for the same reason. It is filed as **D-7**.

This limitation is written into the code that has it (`src/course/components/CheckpointState.tsx`,
under `DISCLOSED RESIDUAL`) so the next person to read that file learns it from the file.

### The backlog

Nine deferred items (**D-1** … **D-9**) and three explicitly rejected ones (**R-1** … **R-3**) in
`docs/superpowers/backlog/2026-07-18-phase-4-deferred.md`. The two attached to what shipped this
phase:

- **D-7 — router fragment resolution.** The residual above. Cost of deferring: a hand-typed or
  historically-shared fragment shows a wrong banner. Cost of doing it: router changes touching
  every route, in a corrective task that had no business widening.
- **D-8 — `RouteScrollManager` moves the viewport without moving focus.** Pre-existing and
  **deliberately** documented as such, not an oversight. A keyboard or screen-reader user following
  a guided return has the page move beneath them while their reading position does not. Reported
  rather than fixed inside a corrective task, on purpose.

Of the rest, the one worth knowing about is **D-5**: a high-severity `react-router` advisory
(GHSA-qwww-vcr4-c8h2, RSC-Mode CSRF) that `npm audit` reports. This app does not use RSC mode. It
shipped under an explicit, narrowly-scoped, owner-authorised exception, and **D-6** exists solely to
ratify that exception in a tracked artifact — because an undocumented exception and a missed
vulnerability are indistinguishable six months later.

The three rejected items are rejected on evidence, not on effort. Do not reopen them without
reading why: **R-1** (42 variants carrying `interrogative: false`) would actively break the strings
it appears to fix.

### One quality finding, accepted

The final whole-implementation review over all 103 commits found no Critical and no Important
issues, and one Minor: two of the new validators pin allowlists of identifiers instead of deriving
membership from an independent signal. That is the very "re-freeze rather than assert" pattern §2
warns about, appearing inside the phase that named it. It is independently compensated by a
fail-closed gate, has no learner impact, and is filed as **D-9** rather than fixed at the end of a
long phase.

---

## 3. The central finding

**Every serious defect this phase came from reasoning about a derived artifact instead of reading
the primary source.**

A derived artifact is anything produced *from* the thing you actually care about: a summary, a
mirror API, a cached count, a comment describing code, a golden file recording output. Derived
artifacts are convenient precisely because they have thrown information away, and the information
they throw away is sometimes the information the question needed.

Three worked examples, in increasing order of how convincing the wrong answer looked.

**The security advisory.** `gh api /advisories/{ghsa}` and
`gh api /repos/{owner}/{repo}/security-advisories` are one call apart, take the same authentication,
and return the same advisory. The first is a coarsened mirror that flattens two affected version
ranges into one — erasing exactly the backport distinction being used as evidence. Nothing in the
tooling signals that a choice is being made. Worse: `npm audit` consumes the same mirror, so
"audit and the GHSA record agree" is **one source counted twice**. Independent confirmation requires
independent provenance, not two readings of the same derivation.

**The gloss review.** A pass over the kanji glosses declared them all clean. It had asked "is this a
plausible sense of this character?" The file itself states a stricter standard, in a comment at the
top. **Plausibility is a test almost any wrong answer passes.** The contract existed, was committed,
and went unread — and the same substitution explains the false kanji-panel claim, a mistranslated
reading, an ungrammatical sentence, and a golden file that re-freezes output instead of checking it.

There are **120** glosses:

```
python3 -c "import re; print(len(re.findall(r'^\s+\"(a2-kanji-[a-z0-9-]+-meaning)\":', \
  open('src/course/a2/kanji/kanjiMeanings.ts').read(), re.M)))"
```

That figure was corrected from 119 to 120 during the phase — and the draft of *this document*
reintroduced 119, inside the section explaining why stale derived figures survive. Caught by review,
not by the author. See §5.

**The golden file.** The plan describes an "806-row editorial golden". Measured, it is **809**:

```
python3 -c "import json; print(len(json.load(open( \
  'src/course/a2/catalog/a2EditorialSurfaces.golden.json'))))"
```

The figure had been carried in context for an entire phase, was cited repeatedly, and was never once
compared against the file. It was wrong by three the whole time.

That last one generalises into the structural warning worth carrying forward: **a golden file is a
drift lock, not an oracle.** It proves output has not changed since someone wrote the baseline down.
It cannot prove the baseline was ever right. That is precisely how the false claim survived — it was
frozen, faithfully, in both languages. When adding a check, prefer one that asserts an independent
property over one that re-records current output.

---

## 4. Four mechanisms

These are the recurring shapes. Each is stated with the instances that earned it.

### 4.1 Camouflage — a wrong thing survives by standing next to true things

The same mechanism at four increasing scopes.

**Scale 1 — within a sentence.** A code comment read: *"Assessed: bare glyph only. No furigana, no
romaji, and — deliberately — no semantic gloss either."* Three of those clauses are true. One is
false: the assessed stage renders **the word base**, not a bare glyph (`KanjiRubyText.tsx:72`, and
the copy at `:120-122` interpolates the taught glyph precisely *because* the rendered word cannot
identify which character is under test — "e.g. `Su 毎 …`"). **[recorded]** at the time of the
finding: 107 of 120 assessed bases are multi-character; that ratio is not re-measured here, the
word-versus-glyph fact is. A reader checking the sentence hits three correct statements, takes the
signal *this comment is accurate*, and stops. It survived every prior review of that file, including
two in this phase. → Verify comments **clause by clause**, not sentence by sentence.

**Scale 2 — within a list.** A subagent returned two corrections together: a count of gloss entries
(true, verified) and a dependency-closure figure (false — it had missed an entire subtree). The true
correction lent its credibility to the false one travelling beside it.

**Scale 3 — within a role.** The false figure was nearly accepted on trust *because it arrived
labelled as a correction*. A claim and its correction are epistemically identical — both are
assertions someone made — but they do not feel identical, because a correction arrives having
apparently just demonstrated superior attention. **That asymmetry is unearned, and it makes a wrong
correction more dangerous than a wrong claim: it comes pre-endorsed.**

**Scale 4 — within a referent: the number is true, the thing it counts is not the thing you meant.**
This is the variant most likely to recur. `npm run prebuild` prints
*"60 lessons, 15 modules, 59 Can-dos, 120 kanji"*. Every one of those numbers is correct. They are
also **A2 only** — the line begins `validateA2Release:`, so the scope is printed right there. The
learner-facing corpus is 108 lessons across 27 modules; A1 contributes the other 48 and 12
**[recorded — `docs/release/2026-07-18-standards-language-review.md:42`, derived and confirmed
during the phase]**. The phase misread it as corpus-wide anyway, and it produced a factual error in
a document.

This variant bites hardest **because both numbers are true**. A wrong number gets challenged. A
right number attached to the wrong referent reads as verified, and survives precisely because
someone can check it and find it correct. Numbers are the thing people spot-check, which is what
makes this the most durable form.

→ **Write the referent next to the number, not just the number.** And record the command beside the
figure, which turns a citation into a check.

One further instance of scale 4 deserves its own line — not a fifth scale, but the trap closing on
the person who set it. Mid-phase, a check of the 108-lesson figure returned 44, not 48 — and a
"correction" to 104 was
one edit away from a committed release document. What stopped it was a zero: the per-module
breakdown showed one module with **zero** lessons, and a module with no lessons is not a fact, it is
a symptom. A1's phonetic lessons come from a separate pipeline and are absent from the semantic
catalog. 44 + 4 = 48. The committed figure was right all along. **The check run to verify a referent
was itself scoped to the wrong referent** — and a correction derived that way is more dangerous
than the original error, because it arrives with a measurement attached.

→ **An anomaly inside an aggregate invalidates the aggregate.** Do not report a sum containing a
zero you cannot explain.

### 4.2 An inferred mechanism is worthless until probed where it forbids

Three explanations were inferred from consistent patterns this phase. Each died to one direct probe
costing one command:

1. **The mora histogram** — an inferred distribution rule.
2. **The "package feed is ~7 days stale" theory** — inferred from several consistent observations.
3. **Its replacement, "the feed only carries latest-dist-tag lineage"** — killed by
   `react-router@6.30.4` resolving under version 6, having never been `latest`.

Each survived exactly as long as it was tested only where it predicted. The distinction that
matters is not *checked* versus *unchecked* assumptions — all three were checked. It is
**confirming versus falsifying probes**. Querying a case your hypothesis predicts can only ever
strengthen it. Only a case it forbids can kill it.

→ Where no mechanism is established, write **"cause not established"**. That is actionable. The most
plausible candidate is not — it stops the next reader from looking.

### 4.3 A prefix explanation is more dangerous than a partial one

The phase's sharpest sentence: **I stopped when I had an explanation, not when I had the mechanism.**

An explanation is anything that accounts for the symptom you already noticed. A mechanism is what
the system actually does next. They diverge exactly when the symptom you noticed is a **prefix** of
the real behaviour.

Concretely: the broken evidence control was traced to a scroll reset, which fully explained the
observed symptom — the learner gets bounced to the top of the page. That was **true**. It was also
two hops short. The chain continues: the catch-all route passes the invalid path in navigation
state, and a notice component renders it as a warning banner. Those two hops are the entire
difference between *a broken convenience link* and *a false learner-facing claim in two languages*.

A prefix explanation is more convincing than a partial one **because nothing in it is false**. There
is no loose end to notice. It is the same failure as the unprobed mechanism in §4.2, arrived at from
the other direction: it fits everything you have looked at, and the reason it fits is that you
stopped looking at the point where it started fitting.

### 4.4 A second authority created without reconciling to the first

The `README` carried the canonical release gate list. The phase plan invented a four-gate
"development set" and **never referenced it**. Nobody worked without a spec; they worked from a spec
that had been quietly forked.

An omission announces itself — someone eventually looks for the missing thing. **A fork does not.**
Both lists are internally consistent, both report green, and their outputs are indistinguishable.
The development set omits the Playwright acceptance tests, the Pages-prefixed build, and **both**
dependency audits; and it collapses to fewer than four real checks, since `npm run build` subsumes
`npx tsc --noEmit` and `prebuild` runs automatically as a pre-script rather than as a gate.

The remediation is in the README itself, which now opens its verification section by stating — in
Italian, the language that file is written in — *"Esistono **due insiemi di gate** e non
coincidono"*: there are two sets of gates and they do not coincide. It prints both, states the
subset relation explicitly, and names the reduction. Read `README.md`, section *Verifica*, before
trusting a green run. It also records a seventh check that appears in **neither** set:
`npm run check:bundle` exists in `package.json`, works, and is wired into no script and no
workflow — it runs only if someone types it. A check nobody runs and a check that cannot fail are
the same artifact from different directions.

The same shape appeared in the deployment check. A marker verified three chunks by hash and passed.
It passed because of **which artifacts it selected** — those three do not embed the base path, so
they hash identically whether or not the deployment flag is set. The only artifact that could have
caught a base-path misconfiguration was the one the marker had demoted. The check did not work; it
was pointed somewhere the property happened to hold.

→ Before adding a check, name what it would have to see to fail. If nothing, it is decoration.

---

## 5. This is generative, not historical

The four mechanisms are not a retrospective on old mistakes. They were operating **during the
corrective work**, inside the commits whose stated purpose was to stop them.

**A commit that removed false comments introduced a false comment.** Its entire purpose was deleting
comments asserting behaviour the code did not produce. It added a new one — a test comment claiming
a lesson stages single-glyph words at the assessed stage. Measured from the catalog, that glyph is
revealable there and assessed somewhere else. The test passed anyway, because its locator matches
any target without context. Plausible-sounding prose about behaviour gets written faster than it
gets checked, **including by a process whose stated purpose is deleting exactly that**.

**An edit damaged the paragraph next to the words describing such damage.** While inserting three
entries into the backlog, the edit deleted the bold lead-in of the following entry, leaving it
headless and beginning mid-sentence — immediately adjacent to the text explaining how corrective
passes introduce defects. Caught by review, not by the author, and that is **structural rather than
careless**: proofreading what you wrote never finds it, because the broken text is the text you did
not write. → **An edit's damage lands on its neighbours.** After an insertion, read the paragraph on
each side of the seam. The response was to sweep all 21 paragraphs, not fix the one reported.

**And the strongest instance, because it reached learners.** This phase existed to remove a false
learner-facing claim present in both languages. The commit titled **"fix(ui): describe how the
checkpoint is actually met"** introduced a *new* false learner-facing claim in both languages: the
warning banner telling the learner that a section does not exist while it sits some 4,000px down the
same page (the measurement is in §2). Confirmed live, in Italian and English, after deployment.

The fix for a false claim shipped a false claim, in the same class, in the same two languages, in
the commit whose subject line announced the repair.

**And once more, in this document.** The draft of the report you are reading stated "a pass over 119
kanji glosses". The file holds 120. That figure had been corrected from 119 to 120 earlier in the
phase; the draft reintroduced the pre-correction value — **inside §3, the section explaining that
stale derived figures survive because nobody compares them to the source.** It was caught by the
review of this document, not by its author, and the correction is now measured with the command
beside it.

That is the fourth instance, and it is the one that should settle the question of whether these
mechanisms are historical. A document cannot be written *about* this failure mode carefully enough
to be immune to it. The only thing that reliably catches it is a second reader who runs the command.

---

## 6. What caught it

**Not a gate. A browser pointed at the deployed site.**

The automated checks were not merely silent — they were **pointed the wrong way**:

- `src/course/components/CourseHome.test.ts:503` asserted `toContain('href="#can-do-summary"')`.
  It asserted the **presence of the exact attribute that constituted the bug.** A test can be
  green, meaningful, well-written, and guarding the defect.
- Three end-to-end specs asserted the target section is visible — **without ever clicking the link**.

The defect was found by post-deployment live verification: opening the deployed page and using it.
That check existed because someone judged verifying the deployed artifact worth the trouble, and it
repaid its own cost on its first run.

Two things follow.

**A test asserting the presence of an attribute is not the same as a test asserting behaviour.**
When the fix landed, that assertion had to be **deleted, not adapted** — its replacement
(`CourseHome.test.ts:518`) is `expect(html).not.toMatch(/href="#[^/]/)`: no anchor's `href` is a
bare fragment. That is a property of the whole component which the next caller cannot violate
silently, and the precision is deliberate. Under a hash router every legitimate route link renders
`href="#/percorso"` — a `#` followed by `/` — so the laxer "no `href="#"` at all" would have been an
artifact of the test harness (whose `MemoryRouter` emits neither) rather than a statement about the
danger. And the behavioural test asserts three things in order of what
the learner experiences: **the banner is absent**, focus lands on the section, the section is in
view. Any one alone passes while another is broken.

**Verifying the deployed artifact is a distinct activity from verifying the build.** Every gate was
green on the commit that shipped this. The gap between "the tests pass" and "the thing works for a
person" is exactly where every defect in this report lived.

---

## 7. Process notes worth keeping

**The dispatcher's own words became unchallenged fact.** Four of seven quality defects in one
document originated in the *prompt* — an unearned universal ("no gate could have caught it", which
the same document refutes), a wrong chunk count, a file path laundered from a reviewer's own
inconsistency. The specification reviewer passed all four, **correctly**: they were faithfully
implemented. **Specification compliance cannot catch a defective specification.**

The mitigation was three sentences added to the next dispatch — *this wording is a draft, not a
specification; challenge it and report every divergence.* It caught two further errors on first
use. Cheap, and it works.

**The record contained the fact that would have prevented the error.** A document that had been
through five review rounds stated, correctly, that a build flag changes the hashes of 12 of 23
assets. Days later a deployment marker was captured without that flag and disagreed with the live
site. The fact was written down, correct, reviewed four times — and not read at the one moment it
was load-bearing. **A written procedure is a control only if something makes you read it at the
point of use.**

**An empty result is a statement about your instrument** until you have shown the instrument works.
A probe returning nothing arrives wearing the same authority as a probe returning something, and it
should not.

**Two deployments, and the rollback path was never touched.** Nothing needed rolling back. The
second deployment fixed a defect the first one introduced — which is the system working, not
failing, provided the live check that found it keeps running.

---

## 8. Where things are

| | |
|---|---|
| Live site | `0230db0` — deploy run `30761711285`, `success` |
| Repository tip (`master`, pushed) | `abb6b11` — four documentation commits ahead of live |
| Difference | Documentation only. Bundle verified byte-identical to the deployed build. |
| Baseline replaced | `ab0c078` |
| Tests | 199 files, 3,759 tests, green |
| Deferred | D-1 … D-9 · Rejected: R-1 … R-3 |
| Detailed record | `docs/release/2026-07-18-phase-4-release-verification.md` |
| Backlog | `docs/superpowers/backlog/2026-07-18-phase-4-deferred.md` |

Deployment is `workflow_dispatch` only and refuses any ref other than `master`, so pushing does not
deploy. The documentation commits above are on the repository and **not** on the live site, by
design.

---

## One paragraph, if you read nothing else

The site is live, the false claim is gone from both languages, and it is guarded by checks that
assert properties rather than re-freeze output. It cost one disclosed residual nobody can reach by
accident, nine backlog items with their trade-offs written down, and one accepted Minor. The thing
worth carrying forward is that every serious defect this phase came from trusting a derived artifact
over the primary source, that wrong things survive by standing next to true ones — most durably when
the number is right and the referent is wrong — and that the last and worst defect was found not by
any gate but by opening the deployed site in a browser and clicking the thing.
