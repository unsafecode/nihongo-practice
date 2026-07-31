# A1/A2 Phase 4 — Integrated QA, Claims Review, and Public Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close every adjudicated defect from the Phase 3 double-check review — two structurally un-failable release gates, ~70 content errors, the untouched exercise monotony, the four non-connected synthesis lessons, and the contextual-kanji claim that is literally false — then re-verify the Section 21.4 release checklist and redeploy A1+A2 from an exact commit SHA.

**Architecture:** Gates first, content second. Every content correction lands *after* the deterministic validator that catches it, so the correction is proven by a red-to-green transition rather than by inspection. The 806-row editorial golden (`src/course/a2/catalog/a2EditorialSurfaces.golden.json`) is currently a drift lock that *freezes* the defects; it is deliberately and visibly regenerated once, in its own commit, after all content fixes land. Exercise variety is fixed in the shared selector (`selectVariants.ts`) so A1 and A2 both benefit from one change, plus authored "transformation twin" variants that the transformation axis actually accepts.

**Tech Stack:** TypeScript 5.6 (strict), React 18.3, react-router 7, Vite 6, Vitest 3, Playwright, GitHub Pages (static, no backend). Node >= 22. No new runtime dependencies are introduced by this plan.

---

## How to work this plan

1. Work tasks in order. Later tasks assume earlier ones landed — in particular every content task assumes its validator already exists and is green on corrected data.
2. Each task is TDD: write the failing test, run it and *see* it fail for the stated reason, write the minimal implementation, run it and see it pass, commit.
3. Never weaken a gate to make a test pass. If a gate fails on data you did not touch, stop and report — that is a real finding.
4. `npx tsc --noEmit` must pass before every commit. `npm test` must be green before every commit except where a task explicitly says a test is expected red at that step.
5. Commands assume the repository root as the working directory.
6. `git log` needs `git --no-pager log` in this environment; `git log --no-pager` errors.

---

## Locked decisions

These were decided before this plan was written. Do not re-litigate them while executing.

### D1 — Scope is the amended scope

`docs/superpowers/specs/2026-07-16-a1-depth-a2-path-design.md` Section 22 Phase 4 restricts Phase 4 to QA, claims review and cross-level regression fixes. The product owner explicitly widened it. **Amendment 1 is Section 24 of that spec** and is committed together with this plan. Exercise variety (A4.1) and synthesis-lesson discourse (A4.2) are in scope. Section 24.3 lists what is still forbidden — read it before adding anything.

### D2 — Severities are the adjudicated ones, not the first-pass register

The first linguistic pass over-reported. After adjudication the real counts are:

| Class | Count | Severity |
| --- | --- | --- |
| Explicit subject over an invariant/complete-clause value | 4 | Critical |
| Learner-facing copy asserting kanji appear in sentences that contain none | 1 | Critical |
| Wrong honorific title for the addressee's actual role | 12 | Important |
| Gloss asserts a third-person subject over a subjectless Japanese sentence | 8 | Important |
| Register mixing (plain past + polite past inside one two-clause model) | 3 | Important |
| `伝える` used with an object it does not collocate with | 3 | Important |
| Weather clause given a first-person topic | 3 | Important |
| Gloss invents a locative the Japanese does not contain ("in the sea") | 9 | Minor |
| Gloss invents a locative the Japanese does not contain ("here") | 31 | Minor |

**Explicitly rejected — do NOT plan or do work for these:**

- The 42 `interrogative: false` variants are inert bookkeeping, not a defect. Flipping the flag would emit a doubled `かか`. The only defensible remedy is documenting the field, which Task 22 does.
- Kanji catalog reading gaps that never reach a learner.
- The "six incompatible size comparisons" — they are grammatically sound.

### D3 — Verified structural baselines

Independently re-measured at `ab0c0789236c53b754c591fa1c2cc43c86e4ad0e` before this plan was written. Any task asserting a number asserts one of these.

| Fact | Verified value |
| --- | --- |
| Realized A2 editorial surfaces | 806 |
| Japanese characters across those 806 surfaces | 12,003 |
| Surfaces containing any CJK ideograph | **0** |
| Distinct full exercise-kind sequences (60 A2 lessons) | 21 |
| Lessons sharing the single most common sequence | **34** |
| Distinct round-two sequences | 8 |
| Lessons sharing the most common round-two sequence | 50 |
| Exercise kinds over 600 A2 exercises | completion 287, tile-ordering 172, choice 81, constrained-construction 60, transformation **0** |
| Transformation-eligible ordered variant pairs in A2 | **0 of 60 lessons** |
| Minimum distinct model families per lesson | **1** (A2 distribution `{1:26, 2:14, 3:12, 4:6, 5:1, 6:1}`; A1 `{1:10, 2:11, 3:14, 4:6, 5:1, 6:2}`) |
| Kanji exposures whose contextual lexeme is used by a sentence in their own lesson | **10 of 480** (method recorded in the D5 measurement note; 0 of 120 at the `assessed` stage) |
| Distinct contextual lexeme senses across the 120 glyphs | 98 |

### D4 — The golden is regenerated exactly once, deliberately

`src/course/a2/catalog/a2EditorialSurfaces.golden.json` is read by `src/course/a2/catalog/editorial.test.ts` via `readFileSync` and is never auto-regenerated. It currently locks the defects in place. All content corrections (Tasks 14-20) land first; **Task 21** regenerates it in a single dedicated commit whose diff is reviewed line by line against a per-task row budget. Exercise-kind changes (Task 23) do **not** require regeneration — the golden records per-variant surfaces, not per-exercise assignments. Two later tasks do change surfaces and therefore regenerate again in their own commits: Task 24 adds three transformation-twin rows, and Task 25 rewrites the synthesis lessons. Each regeneration states the exact rows it may touch; any other row that moves is a real finding.

### D5 — Kanji-in-context: contextual **word**, not kanji in practice sentences

**Decision: give every glyph the word it lives in, rendered kanji-in-kana-context inside the kanji panel; do NOT put kanji into the 806 realized practice sentences during Phase 4.**

Reasoning, in the order it was established:

1. **The claim is false today.** `src/course/i18n/en.ts:84-85` tells the learner "These kanji appear in this lesson's sentences." Zero of 806 realized sentences contain a single ideograph. This is the Critical claims defect in D2 and must be fixed regardless of which option is chosen.
2. **The panel is the flashcard its own type contract forbids.** `src/course/a2/kanji/kanjiTypes.ts:1-14` states "nothing here permits a standalone glyph-meaning flashcard divorced from that context", yet `resolveA2KanjiExposureViews` (`src/course/a2/view/buildA2LessonViewModel.ts:103-145`) emits only `glyph`, `reading`, `romaji`, `meaningCopyId` — no word, no sentence. The learner sees a bare glyph.
3. **Rendering the lesson's own sentences in kanji cannot fix it.** Only **10 of 480** exposures have their contextual lexeme actually used by a sentence in their own lesson (D3). For 98% of exposures there is no sentence to render in kanji, so the expensive option does not even buy the claim. The measurement method is spelled out immediately below, because this figure is load-bearing here.
4. **The expensive option's blast radius is Phase-5-scale.** Kanji in realized sentences would change the romaji formatter contract, tile-ordering token splits, the answer checker's normalization, every Playwright snapshot, the golden, and the shared A1/A2 foundation renderer — and it collides with the hiragana-first writing policy A1 established.
5. **The cheap option is a one-column extension of an existing authoring table.** `KanjiRow` in `src/course/a2/kanji/a2KanjiCatalog.ts:35-52` already carries `glyph`, `kana`, `romaji`, `sense`. A `sense`-keyed word table (98 entries for 120 rows, since `名` and `前` share `namae`) makes the glyph appear inside its real lexeme, keeps each row legible on its own (the file's stated house rule), and is validated mechanically by validator C8 in Task 26.

**Authoring rule for `word` (mechanical, so it is checkable):** only the glyphs that share this row's `sense` are written as kanji; every other mora of the lexeme is written in kana. So `名前`, `予定`, `病院`, `銀行` are fully kanji (both glyphs share one sense), while `郵便局` is `ゆうびん局`, `週末` is `しゅう末`, and `図書館` is `図しょ館`. This is ordinary 交ぜ書き (mixed writing), it is what graded Japanese readers do, and it guarantees the learner is never shown an ideograph the course has not introduced.

**Rendering rule:** the word carries its *whole* kana reading as ruby (subject to the exposure's stage — visible, revealable, or hidden), with the target glyph visually emphasized. Ruby over only the target glyph would leave the rest of the word unreadable.

**Recorded as future work, not Phase 4:** kanji inside realized practice sentences, which would require authoring kanji orthography for the semantic value catalog and a script-aware renderer. Task 33 records it in the backlog.

#### D5 measurement note — how the "10 of 480" figure was derived

This figure is load-bearing in reasoning point 3, so the method is recorded here in full and was re-derived independently after the plan was first written. Both the strict figure and the looser proxy below were reproduced exactly.

**What was counted.** `KanjiExposure.lexemeSenseId` (`src/course/a2/kanji/kanjiTypes.ts:59`) is built as `a2-sense-${row.sense}` by `buildCatalog` (`src/course/a2/kanji/a2KanjiCatalog.ts:311`). That is the *same identifier namespace* the semantic catalog uses for `LearningTargetSense.id`, and `SemanticValue.senseId` (`src/course/foundations/types.ts:296`) points into it. So a kanji's contextual lexeme is "present in a sentence" exactly when some variant of that sentence has a slot value whose `senseId` equals the exposure's `lexemeSenseId`.

The measure is therefore:

```text
for each exposure e in A2_KANJI_EXPOSURES (480):
  owned = { valueById[v].senseId : v in variant.slotValues, variant in lesson e.lessonId }
  hit(e) = e.lexemeSenseId ∈ owned
```

with `valueById` built from `a2SemanticValues` and lessons taken from `a2SemanticBuiltLessons` keyed by `built.recipe.id`.

**Decisions this measure makes, stated explicitly:**

- **Matched on sense identity, not on surface text.** No substring or kana matching is involved.
- **Counted per exposure, not per glyph.** All 480 exposures are counted, so a glyph contributes up to four times.
- **"Own lesson" means the exposure's own `lessonId` only.** No neighbouring lesson, no module, no level-wide pool.
- **All four stages treated alike.** No stage is excluded or weighted.
- **Every exposure lesson exists.** Zero exposure `lessonId`s are missing from the built lessons, so no exposure is silently dropped by the lookup — the denominator really is 480.

**Result, with the breakdown the single number hides:**

| Measure | Value |
| --- | --- |
| Exposures whose lexeme is used in their own lesson | **10 of 480** |
| … by stage | first-supported 5/120, supported-retrieval 3/120, revealable 2/120, **assessed 0/120** |
| Distinct glyphs with at least one own-lesson hit | **8 of 120** |
| Distinct contextual lexeme senses used *anywhere* in the 806 sentences | **10 of 98** |
| Glyphs whose lexeme is used *anywhere* in the 806 sentences | **10 of 120** |
| Distinct senses reachable from all A2 variants (the pool being matched against) | 312 |

The ten hits are: 話/言/聞 (`hanasu`/`iu`/`kiku`) in `connected-conversation-1`; 泳 (`oyogu`) in `experiences-narratives-3` and again in `-4`; 登 (`noboru`) in `experiences-narratives-4`; 安 (`yasui`) in `shopping-returns-2` and again in `-3`; 高 (`takai`) in `shopping-returns-2`; 送 (`okuru`) in `relationships-events-3`.

**Why a substring proxy reports 231 instead, and why it is the wrong measure.** Testing whether the glyph's own kana reading occurs anywhere in the lesson's concatenated Japanese returns **231 of 480** — reproduced exactly. That measure is an inflated upper bound, and the inflation is measurable. A reading like `な` or `こ` matches somewhere in almost any lesson by coincidence, with no lexeme of the kanji present.

*Mora convention used below, stated so the counts are reproducible:* a mora is one kana character, **excluding** the small kana `ゃゅょぁぃぅぇぉ` (and their katakana forms), which combine with the preceding kana rather than forming a mora of their own — so `きょ` and `しゃ` are one mora each. `ん` and the sokuon `っ` **do** each count as their own mora, which is the standard convention; 24 of the 120 readings contain `ん` and one contains `っ`. No long-vowel mark `ー` occurs in any reading, so vowel length never arises. Counting kana characters naively instead — JavaScript `String.length` over the same rows — gives 31/79/10 and is *not* a mora count; the earlier draft of this note quoted those numbers without saying so, which is why they are called out here.

The counts below describe **three different populations**, named explicitly, because the same histogram over a different population looks like a contradiction:

| Population | 1 mora | 2 morae | 3 morae | Total |
| --- | --- | --- | --- | --- |
| A — rows in `A2_KANJI_READINGS`, one per glyph | **37** | 77 | 6 | 120 |
| B — *distinct* kana reading strings among those rows | 25 | 67 | 6 | 98 |
| C — the 231 proxy hits, weighted by exposure | **114** | 110 | 7 | 231 |

Stated unambiguously: **37 of the 120 glyph readings are a single mora, and those short readings alone account for 114 of the 231 proxy hits** — out of a theoretical maximum of 148 (37 readings × 4 exposure stages), meaning a one-mora reading "hits" in 77% of its own exposures purely by coincidence. Roughly a third of the readings thus produce half the proxy's total. Population B is given because rows outnumber distinct strings (120 rows, 98 distinct strings — glyphs sharing a lexeme such as `名`/`前` contribute separate rows), so a reader counting distinct strings will legitimately get 25 rather than 37 and should know which is which.

The proxy answers "do these kana appear", the strict measure answers "does this kanji's word appear" — and only the second bears on whether a sentence could be rendered with that kanji in it.

**Does the decision still follow?** Yes, and it does not rest on this figure alone. Reasoning points 1, 4 and 5 stand independently: the claim is false regardless of the number, the blast radius argument is about the renderer/formatter/golden contracts and the hiragana-first writing policy, and the cheap option's cost is a 98-row authoring table either way. The figure's role is narrower — it rules out the tempting middle option of "just render the lesson's existing sentences in kanji", and the stage breakdown strengthens that: **0 of 120 assessed exposures** have their lexeme in their own lesson, so the middle option would leave exactly the stage that withholds all support with nothing contextual to show.

### D6 — Checkpoint: reword and link, do not build a test

`src/course/components/CourseHome.tsx:305-312` renders a heading ("A2 checkpoint" / "Verifica A2") plus a `role="status"` paragraph and nothing else — a titled no-op that implies a test exists. It does not. `withCheckpointAttempt` (`src/course/progress/ProgressContext.tsx:188-192`) records the attempt **automatically** once every checkpoint scenario lesson (`A2_SYNTHESIS_LESSON_IDS` for A2, `A1_CHECKPOINT_SCENARIO_LESSON_IDS` for A1) has reached `consolidatedAt`.

A per-Can-do evidence breakdown **already exists** immediately above, in the `can-do-summary` section. So the honest fix is to reword the checkpoint copy to state how evidence actually accrues and to link to that breakdown. Building a launchable checkpoint would be a new assessment surface, which Section 24.3 forbids. Task 27 implements this.

### D7 — `revealable` kanji stop leaking their reading in romaji mode

`src/course/a2/kanji/kanjiAssistancePolicy.ts:22` returns `{ furigana: "revealable", romaji: "allowed" }`. A romaji-script learner therefore sees the reading *before* touching the reveal control, while a hiragana-script learner does not. That makes the stage a no-op for half the audience and lets the learner's cosmetic script preference change the retrieval difficulty. **Decision: `revealable` becomes `{ furigana: "revealable", romaji: "not-shown" }`.** The reveal control is present, labelled and accessible, so nothing becomes unreachable. This is not a spec violation either way (Section 12's no-bypass rule is scoped to `assessed`), which is why it needs a recorded decision.

### D8 — `minFamilies` becomes a declared floor of 1, not a derived value

`src/course/foundations/instructionalLessonKit.ts:327` sets `minFamilies: modelFamilies.size` from the very models being checked, so `validateFoundations.ts:744-755` can never fire. The honest floor is **1**, because 26 of 60 A2 lessons and 10 of 44 A1 lessons genuinely have a single model family (D3) — family diversity is not this course's diversity lever; predicate/role/context/unique-target diversity is, and those gates are real. So `minFamilies` becomes a hand-declared field on `InstructionalLessonKitConfig`, set to `1` in both level configs, with the rationale in the doc comment. Task 4 proves it can now reject a real violation using a fixture that declares `minFamilies: 2`.

---

## File structure

Files this plan creates:

| File | Responsibility |
| --- | --- |
| `src/course/a2/catalog/a2ContentInvariants.test.ts` | The seven new deterministic content validators C1a-C7 (Tasks 6-13), each a `describe` block over all 806 realized A2 surfaces. Kept in one file because they share one expensive realization pass. |
| `src/course/a2/kanji/a2ContextualWords.ts` | The 98 contextual-word surfaces (交ぜ書き orthography + whole-word kana) that make the kanji panel contextual (Task 26). |
| `src/course/a2/kanji/a2ContextualWords.test.ts` | Validator C8 — proves every glyph occurs in its own word, that the declared reading really surfaces there (tolerating rendaku, handakuon, sokuon), and that no word's kana carries an ideograph (Task 26). |
| `src/course/foundations/exerciseKindVariety.test.ts` | Bounds on distinct exercise sequences, dominant-sequence share and per-kind usage, at both levels (Task 23). |
| `src/course/a2/catalog/transformationCoverage.test.ts` | Keeps at least one `transformation` exercise in the catalogue, each with a real source variant (Task 24). |
| `src/course/a2/content/synthesisDiscourse.test.ts` | Proves each synthesis lesson is a two-speaker scene with its casual-speech recognition items grouped and labelled (Task 25). |
| `src/course/components/CheckpointState.tsx` | The reworded, linked checkpoint section extracted out of `CourseHome.tsx` (Task 27). |
| `src/course/components/CheckpointState.test.tsx` | Proves the section explains how evidence accrues, links to the Can-do breakdown, and keeps its live region (Task 27). |
| `src/course/a1/catalog/a1ContentInvariants.test.ts` | The three level-agnostic content gates, run against A1 (Task 32). |
| `scripts/checkBundleBudget.ts` | Fails the build when any emitted JS chunk exceeds 500 kB (Task 30). |
| `scripts/generateContentReports.ts` | Writes the A1 and A2 per-lesson/module/level QA reports to disk so Section 21.4 item 8 has a real artifact (Task 35). |
| `docs/release/content-reports/a1-content-report.md`, `a2-content-report.md` | The generated reports themselves (Task 35). |
| `docs/release/2026-07-18-playwright-skip-audit.md` | Item-by-item verdict and action for all 58 Playwright skips (Task 31). |
| `docs/superpowers/backlog/2026-07-18-phase-4-deferred.md` | The three findings Phase 4 deliberately did not resolve (Task 33). |
| `docs/release/2026-07-18-standards-language-review.md` | The Section 3.2 claims review against the four cited sources (Task 34). |
| `docs/release/2026-07-18-phase-4-release-verification.md` | The completed Section 21.4 eleven-item verification record, plus the deployment record (Tasks 35 and 36). |

Files this plan modifies (principal ones):

| File | Change |
| --- | --- |
| `docs/superpowers/specs/2026-07-16-a1-depth-a2-path-design.md` | Section 24 Amendment 1 (already applied in this plan's own commit; Task 1 verifies it). |
| `src/course/a2/catalog/validateA2.ts` | Import + re-export release identity instead of redeclaring it (Task 2). |
| `src/course/a2/catalog/reports.ts` | Same — the third divergent identity removed (Task 2). |
| `src/course/a2/releaseIdentity.test.ts` | Becomes a real three-way parity gate with end-to-end selection comparison (Task 2). |
| `src/course/foundations/instructionalLessonKit.ts` | `minFamilies` becomes a declared config field, not one derived from the data it validates (Task 4). |
| `src/course/a1/catalog/a1LessonBuilders.ts`, `src/course/a2/catalog/a2LessonBuilders.ts` | Declare `minFamilies: 1`; round-two kinds gain `choice` at both levels, and `transformation` at A2 (Tasks 4, 23, 24). |
| `src/course/foundations/selectVariants.ts` | Kind rotation in the controlled-transfer branch plus a per-(lesson, round) seed-derived offset (Task 23). |
| `src/course/foundations/types.ts` | `predicateSemanticType`, `serviceTitleContexts`, `comparableDimensions`, `comparisonDimension`; corrected `interrogative` doc comment (Tasks 7, 9, 12, 22). |
| `src/course/components/KanjiRubyText.test.tsx` | The missing kana-reading assertions (Task 5). |
| `src/course/a2/kanji/kanjiAssistancePolicy.ts` | `revealable` stops allowing romaji (Task 28). |
| `src/course/a2/kanji/a2KanjiCatalog.ts` | Exports its row array and carries each entry's sense slug (Task 26). |
| `src/course/a2/view/buildA2LessonViewModel.ts` | Kanji exposure views gain `word` and `wordKana` (Task 26). |
| `src/course/a2/catalog/a2SemanticCatalog.ts` | New service-role referents, comparison dimensions, message-like objects, and the register fix (Tasks 9, 12, 15, 17, 18). |
| `src/course/a2/content/module01ConnectedConversation.ts`, `module03ExperiencesNarratives.ts`, `module05SequencingOngoing.ts`, `module06PermissionRequests.ts`, `module10HealthAdvice.ts`, `module11WorkStudyMessages.ts`, `module12TravelReservations.ts`, `module15Synthesis.ts` | Content corrections, transformation twins and the synthesis rewrite (Tasks 14-20, 24, 25). |
| `src/course/components/CourseHome.tsx`, `src/course/components/A2LessonPage.tsx` | Checkpoint section, level selector, kanji word rendering (Tasks 26, 27, 29). |
| `src/course/i18n/en.ts`, `src/course/i18n/it.ts`, `src/course/i18n/types.ts` | Kanji intro copy, checkpoint copy, level-selector label, new referent labels (Tasks 15, 26, 27, 29, 34). |
| `src/course/a2/catalog/a2EditorialSurfaces.golden.json` | Regenerated deliberately after the content fixes (Task 21), then after the twins (Task 24) and the synthesis rewrite (Task 25). |
| `vite.config.ts`, `package.json` | Manual chunk splitting and the `check:bundle` script (Task 30). |

---

## Task 1: Verify the recorded scope amendment

The amendment is committed together with this plan, so this task confirms it landed intact before any code changes rely on it.

**Files:**
- Verify: `docs/superpowers/specs/2026-07-16-a1-depth-a2-path-design.md`

- [ ] **Step 1: Confirm Section 24 exists and states the decision**

Run:

```bash
grep -n "^## 24. Amendment 1" docs/superpowers/specs/2026-07-16-a1-depth-a2-path-design.md
grep -c "A4.1\|A4.2\|A4.3\|A4.4\|A4.5" docs/superpowers/specs/2026-07-16-a1-depth-a2-path-design.md
```

Expected: the first command prints one line ending in `Phase 4 expanded scope (curriculum quality)`; the second prints `5` or more.

- [ ] **Step 2: Confirm the out-of-scope list is present**

Run:

```bash
grep -n "24.3 What remains out of scope" -A 2 docs/superpowers/specs/2026-07-16-a1-depth-a2-path-design.md
```

Expected: prints the heading followed by "This amendment does not authorize, and Phase 4 must not introduce:".

- [ ] **Step 3: Confirm the working tree is clean and typechecks**

Run:

```bash
git status --short && npx tsc --noEmit && echo TYPECHECK_OK
```

Expected: no file lines from `git status`, then `TYPECHECK_OK`.

---

## Task 2: I-1 — one release identity for A2, proven end to end

`src/course/a2/releaseIdentity.ts:14-17` states "Every future A2 caller must import these two constants from here — never redeclare its own same-named literal". Two callers violate it:

- `src/course/a2/catalog/validateA2.ts:75-76` declares `"a2-validate-release"` / `"a2-validate-release-seed"` and hands them to `validateFoundations` at `:279-280`. The CI gate therefore certifies a selection that is never shipped.
- `src/course/a2/catalog/reports.ts:49-50` declares a *third* pair, `"a2-release"` / `"a2-release-seed"`, used at `:296-297`. The published coverage reports describe yet another selection.

The runtime (`src/course/a2/view/buildA2LessonViewModel.ts:19,168-169`) correctly imports the shared pair. A1 already does this right (`src/course/a1/catalog/validateA1.ts:70-73` imports and `:86` re-exports).

**Files:**
- Modify: `src/course/a2/catalog/validateA2.ts:74-77`
- Modify: `src/course/a2/catalog/reports.ts:49-50`
- Modify: `src/course/a2/releaseIdentity.test.ts`

- [ ] **Step 1: Replace the placeholder identity test with a real three-way parity gate**

Replace the entire contents of `src/course/a2/releaseIdentity.test.ts` with:

```ts
import { describe, expect, it } from "vitest";
import { validateFoundations } from "../foundations/validateFoundations";
import {
  a2FoundationCatalogs,
  a2FoundationCopy,
  A2_AVAILABLE_CONTENT_BY_LESSON,
} from "./catalog/catalog";
import {
  A2_RELEASE_CATALOG_VERSION as VALIDATOR_CATALOG_VERSION,
  A2_RELEASE_SEED as VALIDATOR_SEED,
} from "./catalog/validateA2";
import {
  A2_RELEASE_CATALOG_VERSION as REPORTS_CATALOG_VERSION,
  A2_RELEASE_SEED as REPORTS_SEED,
} from "./catalog/reports";
import {
  A2_RELEASE_CATALOG_VERSION as SHARED_CATALOG_VERSION,
  A2_RELEASE_SEED as SHARED_SEED,
} from "./releaseIdentity";
import { buildA2LessonViewModel } from "./view/buildA2LessonViewModel";

/**
 * Release/report/runtime selection-identity parity gate (Phase 4 Task 2).
 *
 * `selectVariants` ranks every practice candidate by
 * `fnv1a32(catalogVersion|lessonId|roundId|seed|variantId)`, so the release
 * validator, the published coverage reports and the runtime lesson-view
 * builder select the same exercises only if all three are handed the exact
 * same `catalogVersion`/`seed`. Before this task they were handed three
 * different pairs: `"a2-validate-release"`, `"a2-release"` and
 * `"a2-release-v1"`. This suite fails if they ever diverge again, and proves
 * the parity end to end rather than only at the literal level.
 */

const LESSON_IDS = a2FoundationCatalogs.lessons.map((lesson) => lesson.id);

describe("A2 release identity", () => {
  it("exports the exact stable catalog version literal", () => {
    expect(SHARED_CATALOG_VERSION).toBe("a2-release-v1");
  });

  it("exports the exact stable seed literal", () => {
    expect(SHARED_SEED).toBe("a2-release-seed-v1");
  });

  it("keeps both identifiers distinct from each other", () => {
    expect(SHARED_CATALOG_VERSION).not.toBe(SHARED_SEED);
  });

  it("re-exports the one shared module from the validator, never a redeclared literal", () => {
    expect(VALIDATOR_CATALOG_VERSION).toBe(SHARED_CATALOG_VERSION);
    expect(VALIDATOR_SEED).toBe(SHARED_SEED);
  });

  it("re-exports the one shared module from the reports builder, never a redeclared literal", () => {
    expect(REPORTS_CATALOG_VERSION).toBe(SHARED_CATALOG_VERSION);
    expect(REPORTS_SEED).toBe(SHARED_SEED);
  });

  it("selects the exact same transfer-round target ids for every one of the 60 lessons", () => {
    const report = validateFoundations({
      catalogs: a2FoundationCatalogs,
      foundationCopy: a2FoundationCopy,
      catalogVersion: SHARED_CATALOG_VERSION,
      seed: SHARED_SEED,
      availableContentByLesson: A2_AVAILABLE_CONTENT_BY_LESSON,
    });
    expect(report.valid).toBe(true);

    const mismatches: string[] = [];
    for (const lessonId of LESSON_IDS) {
      const runtime = buildA2LessonViewModel(lessonId, "en");
      expect(runtime.ok, lessonId).toBe(true);
      if (!runtime.ok) continue;

      const runtimeIds = [
        ...new Set(
          runtime.model.foundation.rounds
            .filter((round) => round.purpose === "transfer")
            .flatMap((round) =>
              round.targets.map((target) => target.sourceVariantId ?? target.variantId),
            ),
        ),
      ].sort();
      const validatedIds = [
        ...(report.reports.byLesson[lessonId]?.transferTargetIds ?? []),
      ].sort();

      if (
        runtimeIds.length !== validatedIds.length ||
        runtimeIds.some((id, index) => id !== validatedIds[index])
      ) {
        mismatches.push(
          `${lessonId}: runtime=[${runtimeIds.join(",")}] validated=[${validatedIds.join(",")}]`,
        );
      }
    }

    expect(mismatches).toEqual([]);
  });

  it("selects the exact same visible-target distribution for every one of the 60 lessons", () => {
    const report = validateFoundations({
      catalogs: a2FoundationCatalogs,
      foundationCopy: a2FoundationCopy,
      catalogVersion: SHARED_CATALOG_VERSION,
      seed: SHARED_SEED,
      availableContentByLesson: A2_AVAILABLE_CONTENT_BY_LESSON,
    });
    expect(report.valid).toBe(true);

    const mismatches: string[] = [];
    for (const lessonId of LESSON_IDS) {
      const runtime = buildA2LessonViewModel(lessonId, "en");
      expect(runtime.ok, lessonId).toBe(true);
      if (!runtime.ok) continue;

      const runtimeCounts: Record<string, number> = {};
      for (const round of runtime.model.foundation.rounds) {
        for (const target of round.targets) {
          runtimeCounts[target.visibleTargetKey] =
            (runtimeCounts[target.visibleTargetKey] ?? 0) + 1;
        }
      }
      const validatedCounts =
        report.reports.byLesson[lessonId]?.visibleTargetCounts ?? {};

      const runtimeKeys = Object.keys(runtimeCounts).sort();
      const validatedKeys = Object.keys(validatedCounts).sort();
      const sameKeys =
        runtimeKeys.length === validatedKeys.length &&
        runtimeKeys.every((key, index) => key === validatedKeys[index]);
      const sameCounts = runtimeKeys.every(
        (key) => runtimeCounts[key] === validatedCounts[key],
      );

      if (!sameKeys || !sameCounts) {
        mismatches.push(
          `${lessonId}: runtime=${JSON.stringify(runtimeCounts)} validated=${JSON.stringify(validatedCounts)}`,
        );
      }
    }

    expect(mismatches).toEqual([]);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run src/course/a2/releaseIdentity.test.ts`

Expected: FAIL. TypeScript/Vitest reports that `./catalog/validateA2` and `./catalog/reports` do not export `A2_RELEASE_CATALOG_VERSION` / `A2_RELEASE_SEED` (they are module-private `const`s today).

- [ ] **Step 3: Make the validator import and re-export the shared identity**

In `src/course/a2/catalog/validateA2.ts`, delete lines 74-76:

```ts
const A2_RELEASE_CATALOG_VERSION = "a2-validate-release" as const;
const A2_RELEASE_SEED = "a2-validate-release-seed" as const;
const A2_SYNTHESIS_MODULE_ID = "a2-synthesis" as const;
```

and replace them with:

```ts
// Re-exported (not redeclared) from `../releaseIdentity`, the one shared
// source of truth also imported directly by `../view/buildA2LessonViewModel.ts`
// and by `./reports.ts`. `selectVariants` ranks candidates by a hash keyed on
// `catalogVersion`/`seed`, so the wrapped `validateFoundations` call below,
// the published coverage reports and the runtime builder must use the
// identical pair or the certified release and the shipped release silently
// diverge, exercise for exercise. `releaseIdentity.test.ts` fails if they do.
export { A2_RELEASE_CATALOG_VERSION, A2_RELEASE_SEED };

const A2_SYNTHESIS_MODULE_ID = "a2-synthesis" as const;
```

Then add the import next to the existing `../releaseIdentity`-adjacent imports, immediately after line 48's `./catalog` import:

```ts
import { A2_RELEASE_CATALOG_VERSION, A2_RELEASE_SEED } from "../releaseIdentity";
```

- [ ] **Step 4: Make the reports builder import and re-export the shared identity**

In `src/course/a2/catalog/reports.ts`, delete lines 49-50:

```ts
const A2_RELEASE_CATALOG_VERSION = "a2-release" as const;
const A2_RELEASE_SEED = "a2-release-seed" as const;
```

and replace them with:

```ts
// Re-exported (not redeclared) from `../releaseIdentity`. Coverage reports
// describe the selection a learner is actually served, so they must be built
// from the same `catalogVersion`/`seed` the validator and runtime use.
export { A2_RELEASE_CATALOG_VERSION, A2_RELEASE_SEED };
```

and add, immediately after the `../kanji/kanjiTypes` import on line 47:

```ts
import { A2_RELEASE_CATALOG_VERSION, A2_RELEASE_SEED } from "../releaseIdentity";
```

- [ ] **Step 5: Run the parity gate and the full A2 release validator**

Run:

```bash
npx vitest run src/course/a2/releaseIdentity.test.ts
npx vite-node scripts/validateA2Release.ts
```

Expected: the vitest run reports `7 passed`; `validateA2Release.ts` exits 0 and prints its usual "60 lessons / 15 modules / 59 Can-dos / 120 kanji" summary with no errors.

> If `validateA2Release.ts` now fails, that is the real finding this task exists to surface: the shipped selection violates a gate that was previously validating a different selection. Stop and report the exact error codes rather than reverting the constants.

- [ ] **Step 6: Prove the gate catches a re-divergence**

Temporarily change `src/course/a2/releaseIdentity.ts:31` to `export const A2_RELEASE_SEED = "a2-release-seed-v2" as const;` and edit `src/course/a2/catalog/reports.ts` to declare its own `const A2_RELEASE_SEED = "a2-release-seed-v1" as const;` again (removing it from the re-export list).

Run: `npx vitest run src/course/a2/releaseIdentity.test.ts`

Expected: FAIL on "re-exports the one shared module from the reports builder" with `expected 'a2-release-seed-v1' to be 'a2-release-seed-v2'`.

Then revert both temporary edits with `git checkout -- src/course/a2/releaseIdentity.ts src/course/a2/catalog/reports.ts` and re-apply Step 4 (or `git stash pop` if you stashed). Re-run the suite and confirm `7 passed`.

- [ ] **Step 7: Commit**

```bash
git add src/course/a2/catalog/validateA2.ts src/course/a2/catalog/reports.ts src/course/a2/releaseIdentity.test.ts
git commit -m "fix(a2): validate and report the release identity that actually ships

validateA2.ts and reports.ts each redeclared their own catalogVersion/seed
pair, so the CI gate certified one selection, the coverage reports described
a second, and learners were served a third. Both now re-export the shared
releaseIdentity module, and releaseIdentity.test.ts proves the three agree
end to end across all 60 lessons."
```

---

## Task 3: Extend the same parity gate to A1's reports

A1's validator is correct, but confirm no third identity crept into A1's report builder while Task 2 was fresh.

**Files:**
- Verify: `src/course/a1/catalog/*.ts`

- [ ] **Step 1: Search for any redeclared A1 identity literal**

Run:

```bash
grep -rn 'a1-release\|a1-validate-release\|seed-a1' src/course/a1 --include=*.ts | grep -v releaseIdentity.ts | grep -v '\.test\.'
```

Expected: no output. If any line prints, it is a redeclared literal — replace it with an import from `src/course/a1/releaseIdentity.ts` exactly as Task 2 Step 3 does for A2, and extend `src/course/a1/releaseIdentity.test.ts` with an aliased-import equality assertion for that module.

- [ ] **Step 2: Commit only if Step 1 produced changes**

```bash
git add -A src/course/a1 && git commit -m "fix(a1): remove redeclared release identity literal"
```

If Step 1 printed nothing, skip this commit.

---

## Task 4: I-2 — `minFamilies` becomes a real, declarable floor

`src/course/foundations/instructionalLessonKit.ts:322-327` computes `modelFamilies` from the models being validated and then sets `minFamilies: modelFamilies.size`. `validateFoundations.ts:744-755` compares `families.length < d.minFamilies`, which is `n < n` — always false. The gate has never been able to fire on any lesson.

Per D8 the honest floor is `1`.

**Files:**
- Modify: `src/course/foundations/instructionalLessonKit.ts:177-201, 303-330`
- Modify: `src/course/a1/catalog/a1LessonBuilders.ts:356-369`
- Modify: `src/course/a2/catalog/a2LessonBuilders.ts:482-496`
- Modify: `src/course/foundations/instructionalLessonKit.test.ts`

- [ ] **Step 1: Write the failing red-green test**

Append to `src/course/foundations/instructionalLessonKit.test.ts`:

```ts
describe("declared model-family floor (Phase 4 Task 4)", () => {
  it("rejects a lesson whose models fall below the kit's declared minFamilies", () => {
    const kit = buildInstructionalLessonKit({
      ...TEST_KIT_CONFIG,
      minFamilies: 2,
    });
    const singleFamilyLesson = kit.lessons.find(
      (lesson) =>
        new Set(
          lesson.modelVariantIds.map(
            (id) => variantById.get(id)?.sentenceFamilyId ?? "",
          ),
        ).size < 2,
    );
    expect(singleFamilyLesson, "fixture must contain a single-family lesson").toBeDefined();

    const result = validateFoundations({
      catalogs: kit.catalogs,
      foundationCopy: kit.copy,
      catalogVersion: "test-catalog",
      seed: "test-seed",
    });

    expect(result.valid).toBe(false);
    expect(
      result.errors.map((error) => error.code),
    ).toContain("insufficient-family-diversity");
  });

  it("accepts the same fixture at the declared floor of 1", () => {
    const kit = buildInstructionalLessonKit({
      ...TEST_KIT_CONFIG,
      minFamilies: 1,
    });
    const result = validateFoundations({
      catalogs: kit.catalogs,
      foundationCopy: kit.copy,
      catalogVersion: "test-catalog",
      seed: "test-seed",
    });
    expect(
      result.errors.filter((error) => error.code === "insufficient-family-diversity"),
    ).toEqual([]);
  });
});
```

> `TEST_KIT_CONFIG`, `buildInstructionalLessonKit` and `variantById` already exist in that file; if the local names differ, use the file's own existing fixture names rather than inventing new ones.

- [ ] **Step 2: Run and watch it fail**

Run: `npx vitest run src/course/foundations/instructionalLessonKit.test.ts -t "declared model-family floor"`

Expected: FAIL — TypeScript rejects the unknown property `minFamilies` on the config object literal.

- [ ] **Step 3: Declare `minFamilies` on the kit config**

In `src/course/foundations/instructionalLessonKit.ts`, add to `InstructionalLessonKitConfig<TRecipe>` (the interface at lines 177-201), directly after `modelCountRange`:

```ts
  /**
   * The hand-declared minimum number of distinct sentence families a lesson's
   * models must span. Hand-declared, never derived from the models being
   * validated — deriving it made `checkModelDiversity` compare `n < n`, so the
   * gate could not fire on any lesson in either level.
   *
   * Both shipped levels declare `1`: 26 of 60 A2 lessons and 10 of 44 A1
   * lessons genuinely teach a single family, because family count is not this
   * course's diversity lever. Predicate, role, context and unique-visible-
   * target diversity are, and those gates carry real margin.
   */
  readonly minFamilies: number;
```

- [ ] **Step 4: Use the declared value instead of the derived one**

In the same file, replace line 327's `minFamilies: modelFamilies.size,` with:

```ts
      minFamilies: config.minFamilies,
```

and update the doc comment at lines 303-312 by replacing the sentence "derived from the models' distinct families (never hand-declared)" with:

```ts
 * hand-declared by the kit config (never derived from the models being
 * validated — a derived floor can only ever compare `n < n`)
```

If `modelFamilies` (line 322) is now unused, delete its declaration; if it is still used by another field, leave it.

- [ ] **Step 5: Declare the floor in both level configs**

In `src/course/a1/catalog/a1LessonBuilders.ts`, inside the kit config object at lines 356-369, add after the `modelCountRange` entry:

```ts
  minFamilies: 1,
```

In `src/course/a2/catalog/a2LessonBuilders.ts`, inside the kit config object at lines 482-496, add after the `modelCountRange` entry:

```ts
  minFamilies: 1,
```

- [ ] **Step 6: Run the red-green pair and the full suite**

Run:

```bash
npx vitest run src/course/foundations/instructionalLessonKit.test.ts
npx vite-node scripts/validateA1Release.ts && npx vite-node scripts/validateA2Release.ts
```

Expected: vitest reports all tests in that file passing, including both new ones; both release validators exit 0.

- [ ] **Step 7: Commit**

```bash
git add src/course/foundations/instructionalLessonKit.ts src/course/foundations/instructionalLessonKit.test.ts src/course/a1/catalog/a1LessonBuilders.ts src/course/a2/catalog/a2LessonBuilders.ts
git commit -m "fix(foundations): make minFamilies a declared floor, not a derived tautology

instructionalLessonKit derived minFamilies from the very models it was
validating, so checkModelDiversity compared n < n and could never fire.
Both levels now declare a floor of 1, and the kit test proves the gate
rejects a fixture that declares 2 with single-family models."
```

---

## Task 5: M-1 — assert the kana reading is withheld at the assessed stage

`src/course/components/KanjiRubyText.test.tsx:178-184` asserts an assessed render has no `<ruby`, no `<rt`, no `"hana"` and does contain `話` — but never asserts the kana reading `はな` is absent. A regression that swapped the ruby element for a plain kana caption would pass.

**Files:**
- Modify: `src/course/components/KanjiRubyText.test.tsx:178-184, 194-200`

- [ ] **Step 1: Add the missing assertions**

In the assessed-stage test at lines 178-184, immediately after the existing `expect(html).not.toContain("hana");` line, add:

```ts
    expect(html).not.toContain("はな");
```

In the all-script-modes test at lines 194-200, inside the loop body and immediately after its own `expect(html).not.toContain("hana");`, add:

```ts
      expect(html).not.toContain("はな");
```

- [ ] **Step 2: Run and confirm still green**

Run: `npx vitest run src/course/components/KanjiRubyText.test.tsx`

Expected: PASS — the production renderer already withholds the kana; the assertion was simply missing.

- [ ] **Step 3: Prove the assertion has teeth**

Temporarily edit `src/course/components/KanjiRubyText.tsx` so the assessed branch renders `{reading}` in a `<span className="kanji__reading">` next to the glyph.

Run: `npx vitest run src/course/components/KanjiRubyText.test.tsx`

Expected: FAIL on both the assessed test and the all-modes test with `expected '…はな…' not to contain 'はな'`.

Revert with `git checkout -- src/course/components/KanjiRubyText.tsx` and re-run to confirm green.

- [ ] **Step 4: Commit**

```bash
git add src/course/components/KanjiRubyText.test.tsx
git commit -m "test(kanji): assert the assessed stage withholds the kana reading too

The assessed-stage tests checked for the absence of ruby markup and romaji
but not the kana itself, so a plain-kana caption regression would pass."
```

---

## Task 6: The content-invariant harness and validator C1a — interjection-initial clauses reject a topic

Section 4.1 of the findings dossier lists seven ungated defect classes. Tasks 6-13 add one deterministic validator per class. They share one expensive realization pass, so they live in one file.

C1a is the first, and it is *derived from the realized surface*, not from an id allow-list: Japanese does not allow a topic phrase `Xは` to precede a discourse interjection (すみません / ありがとうございます / ごめんなさい). The interjection opens the utterance; a topic must attach to the clause that follows it. Three shipped variants violate this — `connected-conversation-3-t3`, `connected-conversation-3-t5`, `work-study-messages-4-t3` — and they are three of the four Critical findings.

**Files:**
- Create: `src/course/a2/catalog/a2ContentInvariants.test.ts`

- [ ] **Step 1: Create the file with the shared harness and C1a**

```ts
/**
 * A2 content invariants (Phase 4 Tasks 6-13).
 *
 * Seven deterministic validators for the defect classes the Phase 3
 * double-check review found ungated. Every one of them is derived either from
 * the realized surface or from typed catalog data — never from an allow-list
 * of the specific ids that happened to be wrong, so a *new* offender authored
 * next year is caught too.
 *
 * These complement `a2RealizedIntegrity.test.ts` (duplicate terminal か,
 * `carriesOwnTopic` double topics, proper-name subject/copy agreement) rather
 * than replacing it.
 */
import { describe, expect, it } from "vitest";

import { realizeVariant } from "../../foundations/realizeFamily";
import type { SemanticValue, SentenceFamily, SentenceVariant } from "../../foundations/types";
import { a2SemanticBuiltLessons } from "./catalog";
import {
  a2Contexts,
  a2LearningTargetSenses,
  a2PersonRoles,
  a2Referents,
  a2SemanticValues,
  a2SentenceFamilies,
} from "./a2SemanticCatalog";

const famById = new Map<string, SentenceFamily>(a2SentenceFamilies.map((f) => [f.id, f]));
const valueById = new Map<string, SemanticValue>(a2SemanticValues.map((v) => [v.id, v]));
const realizeCatalogs = {
  contexts: a2Contexts,
  personRoles: a2PersonRoles,
  referents: a2Referents,
  semanticValues: a2SemanticValues,
  learningTargetSenses: a2LearningTargetSenses,
};

/** One realized A2 surface plus everything the validators below need. */
interface RealizedRow {
  readonly id: string;
  readonly lessonId: string;
  readonly jp: string;
  readonly en: string;
  readonly it: string;
  readonly variant: SentenceVariant;
  readonly contextId: string;
  readonly predicateValueId: string | undefined;
  readonly subjectValueId: string | undefined;
}

/** Realizes every authored A2 model + transfer exactly once. */
const ROWS: readonly RealizedRow[] = a2SemanticBuiltLessons.flatMap((built) =>
  built.variants.map((variant) => {
    const family = famById.get(variant.sentenceFamilyId);
    if (!family) throw new Error(`unknown family for ${variant.id}`);
    const realized = realizeVariant(family, variant, realizeCatalogs, {
      availableConceptIds: [...family.requiredConceptIds],
    });
    if (!realized.ok) {
      throw new Error(`realize ${variant.id} failed: ${JSON.stringify(realized.errors)}`);
    }
    return {
      id: variant.id,
      lessonId: built.recipe.id,
      jp: realized.sentence.canonicalJapanese,
      en: built.en[`${variant.id}-translation`] ?? "",
      it: built.it[`${variant.id}-translation`] ?? "",
      variant,
      contextId: variant.contextId,
      predicateValueId: variant.slotValues.predicate,
      subjectValueId: variant.slotValues.subject,
    };
  }),
);

/**
 * The closed class of clause-initial discourse interjections A2 teaches. This
 * is a grammatical class, not a list of offending ids: any future value that
 * opens with one of these is covered automatically.
 */
const CLAUSE_INITIAL_INTERJECTIONS = [
  "すみません",
  "ありがとうございます",
  "ごめんなさい",
] as const;

/** `Xは` immediately followed by a clause-initial interjection. */
const TOPIC_BEFORE_INTERJECTION = new RegExp(
  `^[^、。]{1,10}は(${CLAUSE_INITIAL_INTERJECTIONS.join("|")})`,
);

describe("C1a — no topic phrase before a clause-initial interjection", () => {
  it("never emits `Xは` immediately before すみません / ありがとうございます / ごめんなさい", () => {
    const offenders = ROWS.filter((row) => TOPIC_BEFORE_INTERJECTION.test(row.jp)).map(
      (row) => `${row.id}: ${row.jp}`,
    );
    expect(offenders).toEqual([]);
  });
});
```

- [ ] **Step 2: Run it and watch it fail with the three known offenders**

Run: `npx vitest run src/course/a2/catalog/a2ContentInvariants.test.ts -t "C1a"`

Expected: FAIL, with the received array containing exactly these three entries:

```
connected-conversation-3-t3: わたしはすみません、わかりません
connected-conversation-3-t5: わたしはすみません、きこえませんでした
work-study-messages-4-t3: ともだちはありがとうございます
```

Leave it red — Task 14 fixes the content. Do not weaken the regex.

- [ ] **Step 3: Commit the red validator**

```bash
git add src/course/a2/catalog/a2ContentInvariants.test.ts
git commit -m "test(a2): add content-invariant harness + C1a topic-before-interjection gate

Currently red on the three shipped variants that place a topic phrase in
front of a clause-initial interjection. Task 14 corrects the content."
```

> Committing a deliberately red test is unusual. It is correct here because the gate must be provably red *before* the fix, and because the next task fixes it. Do not push this commit to a protected branch on its own; the branch is only released after Task 35.

---

## Task 7: Validator C1b — typed predicate semantics reject an animate topic

`そらはひとりです` ("It's one person for Sora") is the fourth Critical finding, and `わたしはあめだったので、いえにいました` ("I was rain, so…") is the weather-clause class. Both are the same error: an animate topic placed over a predicate that does not predicate a property of a person. `carriesOwnTopic` cannot catch either, because neither value opens with its own topic は.

The fix is a typed field on `SemanticValue`, so the rule is derived from data rather than from ids.

**Files:**
- Modify: `src/course/foundations/types.ts` (immediately after the `carriesOwnTopic` declaration at 299-314)
- Modify: `src/course/a2/catalog/a2ContentInvariants.test.ts`

- [ ] **Step 1: Add the typed field**

In `src/course/foundations/types.ts`, immediately after the `carriesOwnTopic` field, add:

```ts
  /**
   * What kind of thing this predicate value predicates. Declared only on
   * `kind: "predicate-sense"` values, and only where the distinction is
   * load-bearing.
   *
   *  - `"quantity"` — a measure or headcount (`ひとりです`). Predicates over
   *    the situation, never over a person, so an animate topic is a type
   *    error: `そらはひとりです` says "Sora is one person".
   *  - `"weather"` — a meteorological event (`あめだった`, `あめがふる`).
   *    Japanese weather clauses are impersonal; an animate topic says "I was
   *    rain".
   *  - `"formula"` — a fixed social formula (`ありがとうございます`) with no
   *    propositional subject at all.
   *
   * Absent means "an ordinary action/state/property predicate", which takes an
   * animate topic normally. `a2ContentInvariants.test.ts` C1b rejects any
   * animate explicit topic over a `quantity` / `weather` / `formula` value.
   */
  readonly predicateSemanticType?: "quantity" | "weather" | "formula";
```

- [ ] **Step 2: Write the failing validator**

Append to `src/course/a2/catalog/a2ContentInvariants.test.ts`:

```ts
/** Predicate semantic types that never accept an animate grammatical topic. */
const IMPERSONAL_PREDICATE_TYPES = new Set(["quantity", "weather", "formula"]);

describe("C1b — no animate topic over an impersonal predicate", () => {
  it("declares a predicateSemanticType on at least the four known impersonal values", () => {
    const typed = a2SemanticValues.filter((value) => value.predicateSemanticType !== undefined);
    expect(typed.map((value) => value.id).sort()).toEqual([
      "a2-value-reason-ame-datta",
      "a2-value-reason-ame-ga-furu",
      "a2-value-reply-arigatougozaimasu",
      "a2-value-resv-hitori-desu",
    ]);
  });

  it("only ever declares predicateSemanticType on predicate-sense values", () => {
    const misplaced = a2SemanticValues
      .filter((value) => value.predicateSemanticType !== undefined && value.kind !== "predicate-sense")
      .map((value) => `${value.id}: kind=${value.kind}`);
    expect(misplaced).toEqual([]);
  });

  it("never gives an impersonal predicate an explicit animate topic", () => {
    const offenders = ROWS.filter((row) => {
      if (row.variant.discourse.subjectRealization !== "explicit") return false;
      const predicate = row.predicateValueId ? valueById.get(row.predicateValueId) : undefined;
      if (!predicate?.predicateSemanticType) return false;
      if (!IMPERSONAL_PREDICATE_TYPES.has(predicate.predicateSemanticType)) return false;
      const subject = row.subjectValueId ? valueById.get(row.subjectValueId) : undefined;
      return subject?.animacy === "animate";
    }).map((row) => `${row.id}: ${row.jp} [${valueById.get(row.predicateValueId ?? "")?.predicateSemanticType}]`);
    expect(offenders).toEqual([]);
  });
});
```

- [ ] **Step 3: Run and watch the first test fail**

Run: `npx vitest run src/course/a2/catalog/a2ContentInvariants.test.ts -t "C1b"`

Expected: FAIL on "declares a predicateSemanticType on at least the four known impersonal values" with received `[]` — no value declares the new field yet.

- [ ] **Step 4: Declare the field on the four values**

In `src/course/a2/catalog/a2SemanticCatalog.ts`, add `predicateSemanticType` to exactly these four value literals:

```ts
  // a2-value-resv-hitori-desu — a headcount for the booking, never a property
  // of a person. An animate topic would read "Sora is one person".
  predicateSemanticType: "quantity",
```

```ts
  // a2-value-reply-arigatougozaimasu — a fixed social formula with no
  // propositional subject.
  predicateSemanticType: "formula",
```

```ts
  // a2-value-reason-ame-datta — impersonal weather clause.
  predicateSemanticType: "weather",
```

```ts
  // a2-value-reason-ame-ga-furu — impersonal weather clause.
  predicateSemanticType: "weather",
```

Locate each value by its id with:

```bash
grep -n 'a2-value-resv-hitori-desu\|a2-value-reply-arigatougozaimasu\|a2-value-reason-ame-datta\|a2-value-reason-ame-ga-furu' src/course/a2/catalog/a2SemanticCatalog.ts
```

If the reason-value ids differ from those above, use the actual ids printed by that grep and update the expected array in Step 2's first test to match — but do not drop a value from it.

- [ ] **Step 5: Run again**

Run: `npx vitest run src/course/a2/catalog/a2ContentInvariants.test.ts -t "C1b"`

Expected: the first two tests PASS; the third FAILS listing exactly these offenders:

```
travel-reservations-1-m6: そらはひとりです [quantity]
work-study-messages-4-t3: ともだちはありがとうございます [formula]
reasons-opinions-1-t4: わたしはあめがふるから、かさをもっていきます [weather]
reasons-opinions-2-t1: わたしはあめだったので、いえにいました [weather]
reasons-opinions-2-t4: わたしはあめがふったので、うちにいました [weather]
```

Leave red — Tasks 14 and 19 fix the content.

> If `reasons-opinions-2-t4` uses a fifth value id (`あめがふった` may be a distinct past-tense value), add `predicateSemanticType: "weather"` to that value too and extend the Step 2 expected array accordingly. The rule is: every weather-event predicate value gets the type.

- [ ] **Step 6: Commit**

```bash
git add src/course/foundations/types.ts src/course/a2/catalog/a2SemanticCatalog.ts src/course/a2/catalog/a2ContentInvariants.test.ts
git commit -m "test(a2): type impersonal predicates and gate animate topics over them

Adds SemanticValue.predicateSemanticType (quantity/weather/formula) and C1b,
which rejects an explicit animate topic over any of them. Currently red on
the five shipped offenders; Tasks 14 and 19 correct them."
```

---

## Task 8: Validator C2 — one register per sentence

Three shipped models mix a plain-past first sentence with a polite-past second sentence inside a single two-sentence model, which teaches an inconsistency A2 learners are explicitly being trained out of.

The rule is derived from the surface and is sentence-final only, so subordinate clauses joined by て-form, から or ので are untouched.

**Files:**
- Modify: `src/course/a2/catalog/a2ContentInvariants.test.ts`

- [ ] **Step 1: Write the failing validator**

Append:

```ts
/**
 * Polite sentence-final endings A2 teaches, with the optional sentence-final
 * particles か/ね/よ. Anything else that ends a `。`-delimited sentence is
 * plain register. Only sentence-final position is inspected, so subordinate
 * clauses joined by て-form, から or ので never register as a second predicate.
 */
const POLITE_SENTENCE_END =
  /(です|ます|ません|でした|ました|ませんでした|ましょう)[かねよ]?$/;

describe("C2 — one register per realized sentence", () => {
  it("never mixes plain and polite sentence-final predicates inside one surface", () => {
    const offenders = ROWS.filter((row) => {
      const sentences = row.jp.split("。").filter((part) => part.trim().length > 0);
      if (sentences.length < 2) return false;
      const registers = new Set(sentences.map((s) => POLITE_SENTENCE_END.test(s)));
      return registers.size > 1;
    }).map((row) => `${row.id}: ${row.jp}`);
    expect(offenders).toEqual([]);
  });
});
```

- [ ] **Step 2: Run and watch it fail with exactly three offenders**

Run: `npx vitest run src/course/a2/catalog/a2ContentInvariants.test.ts -t "C2"`

Expected: FAIL with received:

```
experiences-narratives-2-m4: そらはきょねんきょうとへいった。とてもたのしかったです。
experiences-narratives-2-m8: ともだちはきょねんきょうとへいった。とてもたのしかったです。
experiences-narratives-2-t4: せんせいはきょねんきょうとへいった。とてもたのしかったです。
```

- [ ] **Step 3: Commit the red validator**

```bash
git add src/course/a2/catalog/a2ContentInvariants.test.ts
git commit -m "test(a2): add C2 single-register gate

Red on the three narrative models that pair a plain-past clause with a
polite-past clause. Task 17 corrects the shared value."
```

---

## Task 9: Validator C3 — service titles must fit the addressee's context

`てんいんさん` ("shop clerk") is used to address a clinic receptionist and hotel staff in 12 shipped variants. The course has exactly one service-role noun, so it gets reused everywhere.

Rather than an id allow-list, service-role subject values declare the contexts in which their title is correct, and the validator enforces the declaration.

**Files:**
- Modify: `src/course/foundations/types.ts` (next to `predicateSemanticType`)
- Modify: `src/course/a2/catalog/a2SemanticCatalog.ts:1244`
- Modify: `src/course/a2/catalog/a2ContentInvariants.test.ts`

- [ ] **Step 1: Add the typed field**

In `src/course/foundations/types.ts`, immediately after `predicateSemanticType`, add:

```ts
  /**
   * For a service-role referent value used as a vocative address term (店員さん,
   * 受付さん, フロントさん …), the exact contexts in which that title is the
   * correct way to address the person. Japanese service titles are not
   * interchangeable: a shop clerk is 店員, a clinic desk is 受付, a hotel desk
   * is フロント, and using the wrong one is a real social error rather than a
   * stylistic preference.
   *
   * Absent means "not a service-role address term" and imposes no constraint.
   * `a2ContentInvariants.test.ts` C3 rejects any variant that addresses such a
   * value from a context it does not declare.
   */
  readonly serviceTitleContexts?: readonly string[];
```

- [ ] **Step 2: Write the failing validator**

Append to `src/course/a2/catalog/a2ContentInvariants.test.ts`:

```ts
describe("C3 — service titles fit the addressee's context", () => {
  it("declares serviceTitleContexts on every service-role address value", () => {
    const declared = a2SemanticValues
      .filter((value) => value.serviceTitleContexts !== undefined)
      .map((value) => value.id)
      .sort();
    expect(declared).toEqual([
      "a2-value-clerk-subject",
      "a2-value-frontdesk-subject",
      "a2-value-reception-subject",
    ]);
  });

  it("never addresses a service role by a title its context does not license", () => {
    const offenders = ROWS.filter((row) => {
      if (row.variant.discourse.subjectRealization !== "vocative") return false;
      const subject = row.subjectValueId ? valueById.get(row.subjectValueId) : undefined;
      const allowed = subject?.serviceTitleContexts;
      if (!allowed) return false;
      return !allowed.includes(row.contextId);
    }).map((row) => `${row.id}: ${row.jp} [${row.contextId}]`);
    expect(offenders).toEqual([]);
  });
});
```

- [ ] **Step 3: Run and watch the first test fail**

Run: `npx vitest run src/course/a2/catalog/a2ContentInvariants.test.ts -t "C3"`

Expected: FAIL on "declares serviceTitleContexts on every service-role address value" with received `[]`.

- [ ] **Step 4: Declare the contexts on the existing clerk value**

In `src/course/a2/catalog/a2SemanticCatalog.ts`, replace the `a2-value-clerk-subject` literal at line 1244:

```ts
  { id: "a2-value-clerk-subject", kind: "referent", animacy: "animate", tokenFragments: [frag("てんいん", "ten'in")] },
```

with:

```ts
  {
    id: "a2-value-clerk-subject",
    kind: "referent",
    animacy: "animate",
    tokenFragments: [frag("てんいん", "ten'in")],
    // 店員 is specifically a shop/restaurant floor employee. It is wrong for a
    // clinic desk (受付) and wrong for a hotel desk (フロント), so the contexts
    // are declared and C3 enforces them.
    serviceTitleContexts: ["a2-context-restaurant", "a2-context-cafe", "a2-context-shopping"],
  },
```

- [ ] **Step 5: Run again**

Run: `npx vitest run src/course/a2/catalog/a2ContentInvariants.test.ts -t "C3"`

Expected: the first test still FAILS (the two new values do not exist yet) and the second FAILS listing 12 offenders — the four `health-advice-4-*` rows and the eight `travel-reservations-*` rows. Task 15 adds the two new values and repoints those 12 variants.

- [ ] **Step 6: Commit the red validator**

```bash
git add src/course/foundations/types.ts src/course/a2/catalog/a2SemanticCatalog.ts src/course/a2/catalog/a2ContentInvariants.test.ts
git commit -m "test(a2): add C3 service-title/context compatibility gate

Declares 店員's licensed contexts and rejects the 12 shipped variants that
address a clinic desk or a hotel desk as a shop clerk. Task 15 adds 受付 and
フロント and repoints those variants."
```

---

## Task 10: Validator C4 — a subjectless sentence may not be glossed with a third-person subject

Eight shipped models realize a Japanese sentence with no subject at all and then gloss it as if a specific third person were doing it, e.g. `みずをのんでいます` glossed "Emi is drinking water." A learner reading the pair concludes that `みずをのんでいます` *means* "Emi is drinking", which is exactly the misunderstanding the omitted-subject lesson exists to prevent.

Impersonal "you" glosses (`たべてはいけません` = "You must not eat") are *not* offenders: they render an impersonal prohibition, not a specific individual.

**Files:**
- Modify: `src/course/a2/catalog/a2ContentInvariants.test.ts`

- [ ] **Step 1: Write the failing validator**

Append:

```ts
/**
 * English subject phrases that name a *specific* third party. Impersonal
 * "you"/"we"/"one" are deliberately absent: an impersonal gloss over a
 * subjectless Japanese sentence is correct, a specific one is not.
 */
const SPECIFIC_THIRD_PERSON_SUBJECT =
  /^(Sora|Emi|The teacher|My teacher|A friend|My friend|The friend|Your friend|A colleague|My colleague|The colleague|The clerk)\b/;

describe("C4 — gloss subject perspective matches the Japanese", () => {
  it("never glosses a subjectless Japanese sentence with a specific third-person subject", () => {
    const offenders = ROWS.filter(
      (row) =>
        row.variant.discourse.subjectRealization === "omitted" &&
        SPECIFIC_THIRD_PERSON_SUBJECT.test(row.en),
    ).map((row) => `${row.id}: ${row.jp} | ${row.en}`);
    expect(offenders).toEqual([]);
  });
});
```

- [ ] **Step 2: Run and watch it fail with exactly eight offenders**

Run: `npx vitest run src/course/a2/catalog/a2ContentInvariants.test.ts -t "C4"`

Expected: FAIL with received:

```
sequencing-ongoing-3-m2: みずをのんでいます | Emi is drinking water.
sequencing-ongoing-3-m3: ほんをよんでいます | Sora is reading a book.
sequencing-ongoing-3-m4: てがみをかいています | A friend is writing a letter.
sequencing-ongoing-3-m5: にほんごをはなしています | A colleague is speaking Japanese.
sequencing-ongoing-3-m6: あそんでいます | The teacher is playing.
sequencing-ongoing-3-m8: バスをまっています | Emi is waiting for a bus.
sequencing-ongoing-4-m2: ともだちとあそんで、いえにかえります | A friend plays with a friend, then goes home.
sequencing-ongoing-4-m5: てがみをよんでいます | The teacher is reading a letter.
```

- [ ] **Step 3: Commit the red validator**

```bash
git add src/course/a2/catalog/a2ContentInvariants.test.ts
git commit -m "test(a2): add C4 gloss-subject-perspective gate

Red on the eight subjectless models glossed with a specific third-person
subject. Task 16 corrects the glosses."
```

---

## Task 11: Validator C5 — reported speech must be structurally reported

`ともだちはありがとうございます` is glossed "The friend says thank you." Japanese reported speech needs the quotative `と` plus a speech verb; without it the sentence says the friend *is* the thanks. Direct-object uses of 言う (`なまえをいいます`, "says his name") and 教える (`みちをおしえてください`, "please tell me the way") are not reported speech and must not be flagged.

The rule is therefore scoped precisely: a gloss that attributes a *quotable formula* to someone requires quotative structure, and conversely any Japanese carrying quotation marks requires a gloss that reports speech.

**Files:**
- Modify: `src/course/a2/catalog/a2ContentInvariants.test.ts`

- [ ] **Step 1: Write the failing validator**

Append:

```ts
/** "…says thank you" / "…said sorry" — attributing a fixed formula to someone. */
const GLOSS_REPORTS_A_FORMULA =
  /\b(says?|said)\s+(thank you|thanks|sorry|hello|goodbye|excuse me)\b/i;
/** Quotative と plus one of the speech verbs A2 teaches. */
const HAS_QUOTATIVE_STRUCTURE = /と(いいました|いいます|いった|いう|はなしました|はなします)/;

describe("C5 — reported speech is structurally reported", () => {
  it("requires quotative と + a speech verb whenever the gloss attributes a formula", () => {
    const offenders = ROWS.filter(
      (row) => GLOSS_REPORTS_A_FORMULA.test(row.en) && !HAS_QUOTATIVE_STRUCTURE.test(row.jp),
    ).map((row) => `${row.id}: ${row.jp} | ${row.en}`);
    expect(offenders).toEqual([]);
  });

  it("requires a reporting gloss whenever the Japanese carries quotation marks", () => {
    const offenders = ROWS.filter(
      (row) =>
        row.jp.includes("「") &&
        !(/\b(says?|said)\b/i.test(row.en) && /\b(dice|ha detto|dicono)\b/i.test(row.it)),
    ).map((row) => `${row.id}: ${row.jp} | ${row.en} | ${row.it}`);
    expect(offenders).toEqual([]);
  });
});
```

- [ ] **Step 2: Run and watch the first test fail with exactly one offender**

Run: `npx vitest run src/course/a2/catalog/a2ContentInvariants.test.ts -t "C5"`

Expected: the second test PASSES (no shipped surface contains `「`), the first FAILS with received:

```
work-study-messages-4-t3: ともだちはありがとうございます | The friend says thank you.
```

- [ ] **Step 3: Commit the red validator**

```bash
git add src/course/a2/catalog/a2ContentInvariants.test.ts
git commit -m "test(a2): add C5 reported-speech structure gate

Red on the one model glossed as reported speech without quotative structure.
Task 14 fixes it by restoring the vocative reading; C5 then stands as a
forward gate against any future gloss that reports speech the Japanese
never marks with a quotative."
```

---

## Task 12: Validator C6 — comparisons compare comparable things

The adjudication found the six size comparisons grammatically sound, so this gate is green from the start. It exists so that a *future* comparison cannot pair an object with a dimension it has no value on. It is proven to have teeth by a deliberate mutation.

`a2-family-comparison-favor` (slots `favored`, `standard`, `predicate`) and `a2-family-superlative` (slots `favored`, `predicate`) use exactly four adjective stems and nine objects.

**Files:**
- Modify: `src/course/foundations/types.ts`
- Modify: `src/course/a2/catalog/a2SemanticCatalog.ts`
- Modify: `src/course/a2/catalog/a2ContentInvariants.test.ts`

- [ ] **Step 1: Add the two typed fields**

In `src/course/foundations/types.ts`, immediately after `serviceTitleContexts`, add:

```ts
  /**
   * For an object value, the comparison dimensions this thing actually has a
   * value on (`"physical-size"`, `"priced"`). Used only by comparison and
   * superlative families.
   */
  readonly comparableDimensions?: readonly string[];

  /**
   * For a comparison/superlative adjective stem, the single dimension it
   * compares along. Every object placed in the `favored`/`standard` slot of a
   * comparison must declare that dimension in `comparableDimensions`, or the
   * sentence compares two things along an axis one of them does not have.
   */
  readonly comparisonDimension?: string;
```

- [ ] **Step 2: Write the validator**

Append to `src/course/a2/catalog/a2ContentInvariants.test.ts`:

```ts
const COMPARISON_FAMILY_IDS = new Set(["a2-family-comparison-favor", "a2-family-superlative"]);
const COMPARISON_OBJECT_SLOTS = ["favored", "standard"] as const;

describe("C6 — comparisons compare comparable things", () => {
  it("declares a comparisonDimension on every comparison adjective stem", () => {
    const stems = new Set<string>();
    for (const row of ROWS) {
      if (!COMPARISON_FAMILY_IDS.has(row.variant.sentenceFamilyId)) continue;
      if (row.predicateValueId) stems.add(row.predicateValueId);
    }
    const undeclared = [...stems]
      .filter((id) => valueById.get(id)?.comparisonDimension === undefined)
      .sort();
    expect(undeclared).toEqual([]);
  });

  it("declares comparableDimensions on every object used in a comparison slot", () => {
    const objects = new Set<string>();
    for (const row of ROWS) {
      if (!COMPARISON_FAMILY_IDS.has(row.variant.sentenceFamilyId)) continue;
      for (const slot of COMPARISON_OBJECT_SLOTS) {
        const id = row.variant.slotValues[slot];
        if (id) objects.add(id);
      }
    }
    const undeclared = [...objects]
      .filter((id) => valueById.get(id)?.comparableDimensions === undefined)
      .sort();
    expect(undeclared).toEqual([]);
  });

  it("never compares two things along a dimension one of them lacks", () => {
    const offenders: string[] = [];
    for (const row of ROWS) {
      if (!COMPARISON_FAMILY_IDS.has(row.variant.sentenceFamilyId)) continue;
      const dimension = row.predicateValueId
        ? valueById.get(row.predicateValueId)?.comparisonDimension
        : undefined;
      if (!dimension) continue;
      for (const slot of COMPARISON_OBJECT_SLOTS) {
        const id = row.variant.slotValues[slot];
        if (!id) continue;
        const dimensions = valueById.get(id)?.comparableDimensions ?? [];
        if (!dimensions.includes(dimension)) {
          offenders.push(`${row.id}: ${slot}=${id} lacks "${dimension}" (${row.jp})`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
```

- [ ] **Step 3: Run and watch the first two tests fail**

Run: `npx vitest run src/course/a2/catalog/a2ContentInvariants.test.ts -t "C6"`

Expected: FAIL. The first test's received array is:

```
["a2-value-chiisai-stem", "a2-value-ookii-stem", "a2-value-takai-stem", "a2-value-yasui-stem"]
```

The second test's received array is:

```
["a2-value-obj-ano-mise", "a2-value-obj-basu", "a2-value-obj-densha-m12", "a2-value-obj-fuku", "a2-value-obj-hikouki", "a2-value-obj-kaban", "a2-value-obj-kono-mise", "a2-value-obj-kutsu", "a2-value-obj-tokei"]
```

- [ ] **Step 4: Declare the dimensions**

In `src/course/a2/catalog/a2SemanticCatalog.ts`, add `comparisonDimension: "physical-size",` to the `a2-value-chiisai-stem` and `a2-value-ookii-stem` literals, and `comparisonDimension: "priced",` to `a2-value-takai-stem` and `a2-value-yasui-stem`.

> `たかい` is used in these families as "expensive", not "tall" — the shipped glosses read "more expensive". `"priced"` is therefore correct.

Then add to each of the nine object values:

```ts
    comparableDimensions: ["physical-size", "priced"],
```

All nine (`あのみせ`, `バス`, `でんしゃ`, `ふく`, `ひこうき`, `かばん`, `このみせ`, `くつ`, `とけい`) are physical things with a price or a fare, so both dimensions apply to all of them.

- [ ] **Step 5: Run again — all three green**

Run: `npx vitest run src/course/a2/catalog/a2ContentInvariants.test.ts -t "C6"`

Expected: `3 passed`.

- [ ] **Step 6: Prove the gate has teeth**

Temporarily change `a2-value-obj-tokei`'s declaration to `comparableDimensions: ["physical-size"],`.

Run: `npx vitest run src/course/a2/catalog/a2ContentInvariants.test.ts -t "C6"`

Expected: FAIL on "never compares two things along a dimension one of them lacks", with at least one offender naming `a2-value-obj-tokei` and `"priced"`.

Revert with `git checkout -- src/course/a2/catalog/a2SemanticCatalog.ts` if nothing else in that file is uncommitted; otherwise restore the two words by hand. Re-run and confirm `3 passed`.

- [ ] **Step 7: Commit**

```bash
git add src/course/foundations/types.ts src/course/a2/catalog/a2SemanticCatalog.ts src/course/a2/catalog/a2ContentInvariants.test.ts
git commit -m "test(a2): add C6 comparison semantic-type gate

Declares comparison dimensions on the four adjective stems and nine objects
and rejects any future comparison along a dimension one side lacks."
```

---

## Task 13: Validator C7 — a gloss may not invent a place the Japanese never names

Forty shipped glosses add a location the Japanese does not contain: nine say "in the sea" / "nel mare" with no `うみ`, and thirty-one say "here" / "qui" with no `ここ`. A learner mapping gloss to sentence learns that `およぐ` means "swim in the sea" and that `…ことができます` means "can … here".

Per the findings dossier, the *general* invariant ("no gloss fragment without a Japanese source") is a content-authoring project, not a test — it needs a per-fragment alignment the catalog does not carry. This task ships the cheap, curated, high-value subset instead, and Task 33 records the general invariant as future work.

**Files:**
- Modify: `src/course/a2/catalog/a2ContentInvariants.test.ts`

- [ ] **Step 1: Write the failing validator**

Append:

```ts
/**
 * Curated locative-gloss gate. Each entry pairs a locative phrase that must
 * not appear in a gloss unless the Japanese contains the corresponding word.
 * Deliberately small and exact rather than a general gloss-alignment engine,
 * which the catalog cannot support without per-fragment gloss authoring
 * (recorded as future work in the Phase 4 backlog).
 */
const LOCATIVE_GLOSS_RULES: readonly {
  readonly label: string;
  readonly en: RegExp;
  readonly it: RegExp;
  readonly requiredJapanese: string;
}[] = [
  { label: "sea", en: /\bin the sea\b/i, it: /\bnel mare\b/i, requiredJapanese: "うみ" },
  { label: "here", en: /\bhere\b/i, it: /\bqui\b/i, requiredJapanese: "ここ" },
];

describe("C7 — glosses do not invent a place the Japanese never names", () => {
  it.each(LOCATIVE_GLOSS_RULES)(
    "never claims $label unless the Japanese contains $requiredJapanese",
    (rule) => {
      const offenders = ROWS.filter(
        (row) =>
          (rule.en.test(row.en) || rule.it.test(row.it)) &&
          !row.jp.includes(rule.requiredJapanese),
      ).map((row) => `${row.id}: ${row.jp} | ${row.en} | ${row.it}`);
      expect(offenders).toEqual([]);
    },
  );
});
```

- [ ] **Step 2: Run and watch both cases fail with the known counts**

Run: `npx vitest run src/course/a2/catalog/a2ContentInvariants.test.ts -t "C7"`

Expected: FAIL twice. The "sea" case lists 9 offenders, all in `experiences-narratives-1`, `-3` and `-4` (the five `experiences-narratives-2` rows and both `plans-invitations-4` rows do contain `うみ` and must NOT appear). The "here" case lists 31 offenders across `permission-requests-2/4`, `neighborhood-services-1/2`, `shopping-returns-3`, `travel-reservations-1`, `practical-texts-2` and `a2-synthesis-2`.

- [ ] **Step 3: Commit the red validator**

```bash
git add src/course/a2/catalog/a2ContentInvariants.test.ts
git commit -m "test(a2): add C7 curated locative-gloss gate

Red on the 9 'in the sea' and 31 'here' glosses whose Japanese names no
place at all. Task 20 corrects the glosses."
```

---

## Task 14: Content — the four Critical variants

All four place a grammatical topic where Japanese does not permit one. Each fix turns the topic into a vocative address, which is the convention this very lesson already uses for its other transfers (`connected-conversation-3-t1` is `そらさん、すみません、もういちどおねがいします`), so no new grammar is introduced.

> **Why not reported speech for `work-study-messages-4-t3`?** Authoring `ともだちは「ありがとうございます」といいました` was considered and rejected. `frag()` sets every fragment's romaji boundary from its `kind`, and the romaji formatter attaches punctuation with no leading space, so a quoted clause has to be baked as a single fragment (`frag("「ありがとうございます」", "\"arigatou gozaimasu\"")`) to avoid emitting `tomodachi wa" arigatou gozaimasu" to iimashita`. That works, but it introduces the first `「」` in the catalog and therefore touches tile-ordering token splits, answer normalization and the speech surface — regression risk out of proportion to the defect. The vocative fix is natural Japanese, matches the lesson's own convention, and is one line. C5 remains as a forward gate proven by mutation in Step 6.

**Files:**
- Modify: `src/course/a2/content/module01ConnectedConversation.ts:217, 219`
- Modify: `src/course/a2/content/module11WorkStudyMessages.ts:231`
- Modify: `src/course/a2/content/module12TravelReservations.ts:116`

- [ ] **Step 1: Fix `connected-conversation-3-t3`**

Replace line 217 of `src/course/a2/content/module01ConnectedConversation.ts`:

```ts
    clarifyLine("connected-conversation-3-t3", "a2-value-clarify-wakarimasen", "a2-context-among-friends", L("Sorry, I don't understand.", "Scusa, non capisco."), "a2-role-colleague", "a2-referent-self", A2_NEGATIVE_PRESENT_POLITE),
```

with:

```ts
    clarifyLine("connected-conversation-3-t3", "a2-value-clarify-wakarimasen", "a2-context-among-friends", L("Emi, sorry, I don't understand.", "Emi, scusa, non capisco."), "a2-role-colleague", "a2-referent-emi", A2_NEGATIVE_PRESENT_POLITE, "vocative"),
```

- [ ] **Step 2: Fix `connected-conversation-3-t5`**

Replace line 219 of the same file:

```ts
    clarifyLine("connected-conversation-3-t5", "a2-value-clarify-kikoemasen", "a2-context-conversation", L("Sorry, I couldn't hear.", "Scusa, non ho sentito."), "a2-role-teacher", "a2-referent-self", A2_NEGATIVE_PAST_POLITE),
```

with:

```ts
    clarifyLine("connected-conversation-3-t5", "a2-value-clarify-kikoemasen", "a2-context-conversation", L("Sora, sorry, I couldn't hear.", "Sora, scusa, non ho sentito."), "a2-role-teacher", "a2-referent-sora", A2_NEGATIVE_PAST_POLITE, "vocative"),
```

> `connected-conversation-3-t1` already uses `a2-referent-sora` with `a2-value-clarify-mouichido` and `t2` uses `a2-referent-emi` with `a2-value-clarify-yukkuri`, so neither new pairing duplicates an existing one.

- [ ] **Step 3: Fix `work-study-messages-4-t3`**

Replace line 231 of `src/course/a2/content/module11WorkStudyMessages.ts`:

```ts
    line("work-study-messages-4-t3", "a2-family-reply-confirm", "a2-value-reply-arigatougozaimasu", WORK_STUDY, L("The friend says thank you.", "L'amico dice grazie."), { subjectReferent: "a2-referent-friend", subjectRealization: "explicit", speakerRole: "a2-role-colleague" }),
```

with:

```ts
    line("work-study-messages-4-t3", "a2-family-reply-confirm", "a2-value-reply-arigatougozaimasu", WORK_STUDY, L("Emi, thank you.", "Emi, grazie."), { subjectReferent: "a2-referent-emi", subjectRealization: "vocative", speakerRole: "a2-role-colleague" }),
```

- [ ] **Step 4: Fix `travel-reservations-1-m6`**

Replace line 116 of `src/course/a2/content/module12TravelReservations.ts`:

```ts
    line("travel-reservations-1-m6", "a2-family-make-reservation", "a2-value-resv-hitori-desu", OUTING, L("It's one person for Sora.", "È una persona per Sora."), { subjectReferent: "a2-referent-sora", subjectRealization: "explicit", speakerRole: "a2-role-teacher" }),
```

with:

```ts
    line("travel-reservations-1-m6", "a2-family-make-reservation", "a2-value-resv-hitori-desu", OUTING, L("Sora, it's for one person.", "Sora, è per una persona."), { subjectReferent: "a2-referent-sora", subjectRealization: "vocative", speakerRole: "a2-role-teacher" }),
```

- [ ] **Step 5: Run the three validators that covered these**

Run: `npx vitest run src/course/a2/catalog/a2ContentInvariants.test.ts -t "C1a"` then `-t "C1b"` then `-t "C5"`

Expected:
- C1a: PASS (all three topic-before-interjection offenders gone).
- C1b: still FAILS, now listing only the three `reasons-opinions-*` weather rows — `travel-reservations-1-m6` and `work-study-messages-4-t3` are gone. Task 19 clears the rest.
- C5: PASS.

- [ ] **Step 6: Prove C5 still has teeth**

Temporarily restore the old `work-study-messages-4-t3` line (the "The friend says thank you." version) and run `npx vitest run src/course/a2/catalog/a2ContentInvariants.test.ts -t "C5"`.

Expected: FAIL with `work-study-messages-4-t3: ともだちはありがとうございます | The friend says thank you.`

Restore the corrected line and re-run: PASS.

- [ ] **Step 7: Run the release validator and the full suite**

Run:

```bash
npx vite-node scripts/validateA2Release.ts
npx vitest run
```

Expected: the release validator exits 0. `npx vitest run` fails **only** in `a2ContentInvariants.test.ts` (C1b, C2, C3, C4, C7 are still deliberately red) and in `editorial.test.ts`, which compares against the not-yet-regenerated golden. No other file may fail. If any other file fails, stop and report.

- [ ] **Step 8: Commit**

```bash
git add src/course/a2/content/module01ConnectedConversation.ts src/course/a2/content/module11WorkStudyMessages.ts src/course/a2/content/module12TravelReservations.ts
git commit -m "fix(a2): correct the four ungrammatical topic-over-invariant variants

わたしはすみません…, ともだちはありがとうございます and そらはひとりです all put a
grammatical topic where Japanese permits none. Each becomes a vocative
address, the convention these lessons already use."
```

---

## Task 15: Content — correct the 12 wrong service titles

`てんいんさん` (shop clerk) addresses a clinic reception desk in four `health-advice-4` variants and hotel staff in eight `travel-reservations-*` variants. The course has exactly one service-role noun, so this task adds the two that are missing.

**Files:**
- Modify: `src/course/a2/catalog/a2SemanticCatalog.ts:547, 561, 1244, and the copy tables at ~4173/4207`
- Modify: `src/course/a2/content/module10HealthAdvice.ts`
- Modify: `src/course/a2/content/module12TravelReservations.ts`

- [ ] **Step 1: Add the two person roles**

In `src/course/a2/catalog/a2SemanticCatalog.ts`, immediately after the `a2-role-clerk` entry on line 547, add:

```ts
  { id: "a2-role-reception", kind: "unnamed", labelCopyId: "a2-role-reception-label" },
  { id: "a2-role-frontdesk", kind: "unnamed", labelCopyId: "a2-role-frontdesk-label" },
```

- [ ] **Step 2: Add the two referents**

Immediately after the `a2-referent-clerk` entry on line 561, add:

```ts
  { id: "a2-referent-reception", personRoleId: "a2-role-reception", animacy: "animate", labelCopyId: "a2-referent-reception-label" },
  { id: "a2-referent-frontdesk", personRoleId: "a2-role-frontdesk", animacy: "animate", labelCopyId: "a2-referent-frontdesk-label" },
```

- [ ] **Step 3: Add the two subject values with their licensed contexts**

Immediately after the `a2-value-clerk-subject` entry (line 1244, as edited by Task 9 Step 4), add:

```ts
  // 受付 is the desk you address at a clinic, surgery or office reception —
  // never 店員, which is specifically a shop/restaurant floor employee.
  {
    id: "a2-value-reception-subject",
    kind: "referent",
    animacy: "animate",
    tokenFragments: [frag("うけつけ", "uketsuke")],
    serviceTitleContexts: ["a2-context-health"],
  },
  // フロント is the hotel front desk. Also correct for the travel/outing
  // reservation contexts, where the addressee is hotel or booking staff.
  {
    id: "a2-value-frontdesk-subject",
    kind: "referent",
    animacy: "animate",
    tokenFragments: [frag("フロント", "furonto")],
    serviceTitleContexts: ["a2-context-travel", "a2-context-outing"],
  },
```

- [ ] **Step 4: Add the four copy labels**

In the English copy table (around line 4173, next to `"a2-role-clerk-label": "The shop clerk",`) add:

```ts
    "a2-role-reception-label": "The reception desk",
    "a2-role-frontdesk-label": "The hotel front desk",
    "a2-referent-reception-label": "The receptionist",
    "a2-referent-frontdesk-label": "The front desk",
```

In the Italian copy table (around line 4207, next to `"a2-role-clerk-label": "Il commesso",`) add:

```ts
    "a2-role-reception-label": "L'accettazione",
    "a2-role-frontdesk-label": "La reception dell'hotel",
    "a2-referent-reception-label": "L'addetto all'accettazione",
    "a2-referent-frontdesk-label": "La reception",
```

- [ ] **Step 5: Repoint the four `health-advice-4` variants**

In `src/course/a2/content/module10HealthAdvice.ts`, in the four lines whose ids are `health-advice-4-m5`, `health-advice-4-m6`, `health-advice-4-m7` and `health-advice-4-t1`, change every `subjectReferent: "a2-referent-clerk"` to `subjectReferent: "a2-referent-reception"`. Leave `subjectRealization: "vocative"` and every other argument untouched.

Locate them with:

```bash
grep -n 'health-advice-4-\(m5\|m6\|m7\|t1\)' src/course/a2/content/module10HealthAdvice.ts
```

- [ ] **Step 6: Repoint the eight `travel-reservations-*` variants**

In `src/course/a2/content/module12TravelReservations.ts`, change `subjectReferent: "a2-referent-clerk"` to `subjectReferent: "a2-referent-frontdesk"` in the lines whose ids are `travel-reservations-1-m4`, `travel-reservations-1-m5`, `travel-reservations-1-t5`, `travel-reservations-3-m7`, `travel-reservations-4-m5`, `travel-reservations-4-m6`, `travel-reservations-4-m8` and `travel-reservations-4-t5`.

Locate them with:

```bash
grep -n 'a2-referent-clerk' src/course/a2/content/module12TravelReservations.ts
```

Expected: exactly eight lines, all with the ids above. If the grep prints a different count, reconcile before editing — do not blanket-replace.

- [ ] **Step 7: Run C3 and the release validator**

Run:

```bash
npx vitest run src/course/a2/catalog/a2ContentInvariants.test.ts -t "C3"
npx vite-node scripts/validateA2Release.ts
```

Expected: C3 reports `2 passed`; `validateA2Release.ts` exits 0.

- [ ] **Step 8: Prove C3 has teeth**

Temporarily change `travel-reservations-1-m4` back to `subjectReferent: "a2-referent-clerk"` and run `npx vitest run src/course/a2/catalog/a2ContentInvariants.test.ts -t "C3"`.

Expected: FAIL with `travel-reservations-1-m4: てんいんさん、へやのよやくをおねがいします [a2-context-travel]`.

Restore and re-run: `2 passed`.

- [ ] **Step 9: Commit**

```bash
git add src/course/a2/catalog/a2SemanticCatalog.ts src/course/a2/content/module10HealthAdvice.ts src/course/a2/content/module12TravelReservations.ts
git commit -m "fix(a2): address clinic and hotel staff by their real titles

Adds 受付 and フロント as service-role referents and repoints the 12 variants
that addressed a clinic desk or a hotel desk as 店員さん."
```

---

## Task 16: Content — stop glossing subjectless sentences with a named third person

Six `sequencing-ongoing-3` models and two `sequencing-ongoing-4` models realize no subject at all in Japanese but gloss a specific person. The lesson's intended teaching point *is* person diversity, so the honest fix realizes the subject in Japanese rather than deleting it from the gloss — otherwise all six models collapse into "someone is doing X" and the lesson loses its axis.

**Files:**
- Modify: `src/course/a2/content/module05SequencingOngoing.ts` (or the module file that authors `sequencing-ongoing-*`; confirm with the grep in Step 1)

- [ ] **Step 1: Locate the eight variants**

Run:

```bash
grep -rn 'sequencing-ongoing-3-m2\|sequencing-ongoing-3-m3\|sequencing-ongoing-3-m4\|sequencing-ongoing-3-m5\|sequencing-ongoing-3-m6\|sequencing-ongoing-3-m8\|sequencing-ongoing-4-m2\|sequencing-ongoing-4-m5' src/course/a2/content/
```

Expected: eight lines in a single module file.

- [ ] **Step 2: Realize each subject explicitly**

For each of the eight lines, set the options object's `subjectRealization` to `"explicit"` and make sure `subjectReferent` names the person the gloss already claims:

| Variant | `subjectReferent` | Resulting Japanese | Gloss (unchanged) |
| --- | --- | --- | --- |
| `sequencing-ongoing-3-m2` | `a2-referent-emi` | `えみはみずをのんでいます` | Emi is drinking water. |
| `sequencing-ongoing-3-m3` | `a2-referent-sora` | `そらはほんをよんでいます` | Sora is reading a book. |
| `sequencing-ongoing-3-m4` | `a2-referent-friend` | `ともだちはてがみをかいています` | A friend is writing a letter. |
| `sequencing-ongoing-3-m5` | `a2-referent-colleague` | `どうりょうはにほんごをはなしています` | A colleague is speaking Japanese. |
| `sequencing-ongoing-3-m6` | `a2-referent-teacher` | `せんせいはあそんでいます` | The teacher is playing. |
| `sequencing-ongoing-3-m8` | `a2-referent-emi` | `えみはバスをまっています` | Emi is waiting for a bus. |
| `sequencing-ongoing-4-m5` | `a2-referent-teacher` | `せんせいはてがみをよんでいます` | The teacher is reading a letter. |

`sequencing-ongoing-4-m2` is different: its Japanese is `ともだちとあそんで、いえにかえります`, where `ともだち` is already the *companion*, so making the friend the subject would produce "a friend plays with a friend". Fix its gloss instead — change the English to `"I play with a friend, then go home."` and the Italian to `"Gioco con un amico, poi torno a casa."`, which is exactly what `sequencing-ongoing-2-m2` already says for the identical Japanese.

- [ ] **Step 3: Run C4 and the release validator**

Run:

```bash
npx vitest run src/course/a2/catalog/a2ContentInvariants.test.ts -t "C4"
npx vite-node scripts/validateA2Release.ts
```

Expected: C4 reports `1 passed`; the release validator exits 0.

> If the release validator now reports `transfer-duplicates-model` or a visible-target reuse error for `sequencing-ongoing-3` or `-4`, the newly explicit subject has collided with another variant in the same lesson. Resolve it by giving the colliding variant a *different* referent from the same lesson's cast, never by reverting to an omitted subject.

- [ ] **Step 4: Commit**

```bash
git add src/course/a2/content/
git commit -m "fix(a2): realize the subject the gloss claims

Eight sequencing-ongoing models glossed a specific person over a subjectless
Japanese sentence. Seven now realize that subject; the eighth's gloss is
corrected to first person, matching the identical sentence in lesson 2."
```

---

## Task 17: Content — one register per narrative model

Three `experiences-narratives-2` models pair a plain-past first sentence (`きょうとへいった。`) with a polite-past second sentence (`とてもたのしかったです。`). The shared value is `a2-value-narrate-kyouto-tanoshikatta`; correcting it fixes all three at once.

**Files:**
- Modify: `src/course/a2/catalog/a2SemanticCatalog.ts`

- [ ] **Step 1: Locate the value**

Run:

```bash
grep -n 'たのしかったです' src/course/a2/catalog/a2SemanticCatalog.ts
```

Expected: one or more value literals whose fragments end `frag("たのしかったです", "tanoshikatta desu")`.

- [ ] **Step 2: Make the second clause plain, matching the first**

Change the fragment `frag("たのしかったです", "tanoshikatta desu")` to:

```ts
frag("たのしかった", "tanoshikatta")
```

The first clause is plain past (`いった`), so the whole model is now consistently plain — which is what a narrative recount is, and what `experiences-narratives-2-m2`/`-m6`/`-t2` already do (`およいだ。それから、やまにのぼった。`).

- [ ] **Step 3: Run C2 and the release validator**

Run:

```bash
npx vitest run src/course/a2/catalog/a2ContentInvariants.test.ts -t "C2"
npx vite-node scripts/validateA2Release.ts
```

Expected: C2 reports `1 passed`; the release validator exits 0.

- [ ] **Step 4: Prove C2 has teeth**

Temporarily restore `frag("たのしかったです", "tanoshikatta desu")` and run `npx vitest run src/course/a2/catalog/a2ContentInvariants.test.ts -t "C2"`.

Expected: FAIL listing the three `experiences-narratives-2` rows.

Restore the corrected fragment and re-run: `1 passed`.

- [ ] **Step 5: Commit**

```bash
git add src/course/a2/catalog/a2SemanticCatalog.ts
git commit -m "fix(a2): keep one register inside the Kyoto narrative models

The value paired a plain-past clause with a polite-past clause, teaching the
register inconsistency the level trains learners out of."
```

---

## Task 18: Content — `つたえる` only with things you can convey

Three variants ask someone to `つたえる` an email, a document or a task. `伝える` conveys a *message*; you forward an email, hand over documents and pass on a task. The lower-risk correction keeps the taught verb and changes the objects to things `伝える` genuinely takes.

**Files:**
- Modify: `src/course/a2/catalog/a2SemanticCatalog.ts`
- Modify: `src/course/a2/content/module11WorkStudyMessages.ts`

- [ ] **Step 1: Add the two message-like object values**

In `src/course/a2/catalog/a2SemanticCatalog.ts`, next to the existing `a2-value-obj-meeru` / `a2-value-obj-shorui` object values, add:

```ts
  { id: "a2-value-obj-dengon", kind: "object", tokenFragments: [frag("でんごん", "dengon")] },
  { id: "a2-value-obj-yotei-obj", kind: "object", tokenFragments: [frag("よてい", "yotei")] },
```

- [ ] **Step 2: Repoint the three variants and their glosses**

In `src/course/a2/content/module11WorkStudyMessages.ts`:

- `work-study-messages-2-m3`: change `object: "a2-value-obj-meeru"` to `object: "a2-value-obj-dengon"`, and its translation to `L("Please pass along the message.", "Per favore, riferisci il messaggio.")`.
- `work-study-messages-2-m6`: change `object: "a2-value-obj-shorui"` to `object: "a2-value-obj-yotei-obj"`, and its translation to `L("Please pass along the schedule.", "Per favore, riferisci il programma.")`.
- `work-study-messages-2-t1`: change `object: "a2-value-obj-shigoto"` to `object: "a2-value-obj-dengon"`, and its translation to `L("Please pass along the message.", "Per favore, riferisci il messaggio.")`.

> `t1` must stay distinct from `m3`. If the release validator reports `transfer-duplicates-model` for `work-study-messages-2-t1`, change its context or its speaker role rather than its object — those are the axes the lesson already varies.

Locate all three with:

```bash
grep -n 'work-study-messages-2-\(m3\|m6\|t1\)' src/course/a2/content/module11WorkStudyMessages.ts
```

- [ ] **Step 3: Verify no `つたえて` remains with a non-message object**

Run:

```bash
npx vite-node scripts/validateA2Release.ts && npx vitest run src/course/a2/catalog/a2ContentInvariants.test.ts
```

Expected: the release validator exits 0. The invariants file still shows C1b and C7 red (Tasks 19 and 20 clear those); nothing new goes red.

- [ ] **Step 4: Commit**

```bash
git add src/course/a2/catalog/a2SemanticCatalog.ts src/course/a2/content/module11WorkStudyMessages.ts
git commit -m "fix(a2): give つたえる objects it actually collocates with

メールをつたえる / しょるいをつたえる / しごとをつたえる are not Japanese
collocations. The three requests now convey a message or a schedule."
```

---

## Task 19: Content — weather clauses are impersonal

Three `reasons-opinions-*` transfers put a first-person topic in front of a weather clause, so `わたしはあめだったので、いえにいました` literally reads "I was rain, so I stayed home."

**Files:**
- Modify: `src/course/a2/content/module06ReasonsOpinions.ts` (confirm the filename with the grep in Step 1)

- [ ] **Step 1: Locate the three variants**

Run:

```bash
grep -rn 'reasons-opinions-1-t4\|reasons-opinions-2-t1\|reasons-opinions-2-t4' src/course/a2/content/
```

- [ ] **Step 2: Omit the subject on all three**

For each of the three lines, change the options object's `subjectRealization` to `"omitted"`, leaving `subjectReferent` as it is so the discourse referent stays tracked. The realized Japanese becomes:

| Variant | Corrected Japanese | Gloss (unchanged, already correct) |
| --- | --- | --- |
| `reasons-opinions-1-t4` | `あめがふるから、かさをもっていきます` | It's going to rain, so I'll bring an umbrella. |
| `reasons-opinions-2-t1` | `あめだったので、いえにいました` | It rained, so I stayed home. |
| `reasons-opinions-2-t4` | `あめがふったので、うちにいました` | It rained, so I was at home. |

The existing English and Italian glosses already describe exactly these sentences — they never claimed a personal topic — so no copy changes are needed.

- [ ] **Step 3: Run C1b and the release validator**

Run:

```bash
npx vitest run src/course/a2/catalog/a2ContentInvariants.test.ts -t "C1b"
npx vite-node scripts/validateA2Release.ts
```

Expected: C1b reports `3 passed` (all three of its tests green — the offender list is now empty); the release validator exits 0.

> If omitting the subject makes a transfer identical to a model in the same lesson, vary the transfer's context or speaker role. Do not restore the topic.

- [ ] **Step 4: Commit**

```bash
git add src/course/a2/content/
git commit -m "fix(a2): make weather clauses impersonal

わたしはあめだったので… reads 'I was rain, so…'. Japanese weather clauses take
no topic; the three transfers now omit it."
```

---

## Task 20: Content — glosses stop inventing places

Forty glosses name a location the Japanese never contains. The Japanese is correct in every case; only the gloss is wrong.

**Files:**
- Modify: `src/course/a2/content/module04ExperiencesNarratives.ts` and the other content modules identified in Step 1

- [ ] **Step 1: List every offending gloss with its file**

Run:

```bash
npx vitest run src/course/a2/catalog/a2ContentInvariants.test.ts -t "C7" 2>&1 | grep -E '^\s+"[a-z0-9-]+:' | sed 's/^ *"//; s/:.*//' | sort -u > /tmp/c7-ids.txt
wc -l /tmp/c7-ids.txt
grep -rn -f /tmp/c7-ids.txt src/course/a2/content/ | cut -d: -f1 | sort -u
```

Expected: `/tmp/c7-ids.txt` holds 40 ids; the last command prints the handful of module files that author them.

- [ ] **Step 2: Remove "in the sea" from the nine swim glosses**

For `experiences-narratives-1-m1`, `-1-m7`, `-3-m1`, `-3-m2`, `-3-m3`, `-3-m4`, `-4-m1`, `-4-m6` and `-4-t2`, drop the locative from both languages. The pattern is:

| Before | After |
| --- | --- |
| `L("I have swum in the sea before.", "Ho già nuotato nel mare.")` | `L("I have swum before.", "Ho già nuotato.")` |
| `L("The teacher has swum in the sea before.", "L'insegnante ha già nuotato nel mare.")` | `L("The teacher has swum before.", "L'insegnante ha già nuotato.")` |
| `L("Emi has swum in the sea before.", "Emi ha già nuotato nel mare.")` | `L("Emi has swum before.", "Emi ha già nuotato.")` |
| `L("Sora has swum in the sea before.", "Sora ha già nuotato nel mare.")` | `L("Sora has swum before.", "Sora ha già nuotato.")` |
| `L("My friend has swum in the sea before.", "Il mio amico ha già nuotato nel mare.")` | `L("My friend has swum before.", "Il mio amico ha già nuotato.")` |
| `L("My colleague has swum in the sea before.", "Il mio collega ha già nuotato nel mare.")` | `L("My colleague has swum before.", "Il mio collega ha già nuotato.")` |
| `L("Have you ever swum in the sea?", "Hai mai nuotato nel mare?")` | `L("Have you ever swum?", "Hai mai nuotato?")` |
| `L("Has your friend ever swum in the sea?", "Il tuo amico ha mai nuotato nel mare?")` | `L("Has your friend ever swum?", "Il tuo amico ha mai nuotato?")` |
| `L("Has Sora ever swum in the sea?", "Sora ha mai nuotato nel mare?")` | `L("Has Sora ever swum?", "Sora ha mai nuotato?")` |

Do **not** touch `plans-invitations-4-m9`, `plans-invitations-4-t3`, `experiences-narratives-2-m2`, `-2-m6` or `-2-t2` — their Japanese does contain `うみで`, so their glosses are correct.

- [ ] **Step 3: Remove "here" from the 31 possibility/prohibition glosses**

For every id in `/tmp/c7-ids.txt` that is not one of the nine above, delete the standalone locative word from both languages, keeping everything else identical:

- English: remove a trailing ` here` (e.g. `"I can swim here."` becomes `"I can swim."`; `"Can I use the card here?"` becomes `"Can I use the card?"`; `"You can speak Japanese here."` becomes `"You can speak Japanese."`).
- Italian: remove a trailing ` qui` and, where the Italian fronts it, the leading `Qui ` (e.g. `"Posso nuotare qui."` becomes `"Posso nuotare."`; `"Qui si può parlare giapponese."` becomes `"Si può parlare giapponese."`; `"Non devi bere l'acqua qui."` becomes `"Non devi bere l'acqua."`).

- [ ] **Step 4: Run C7 and the bilingual-parity suite**

Run:

```bash
npx vitest run src/course/a2/catalog/a2ContentInvariants.test.ts -t "C7"
npx vite-node scripts/validateA2Release.ts
```

Expected: C7 reports `2 passed`; the release validator exits 0 (its bilingual-parity gate confirms every id still has both locales).

- [ ] **Step 5: Commit**

```bash
git add src/course/a2/content/
git commit -m "fix(a2): stop glossing places the Japanese never names

Nine glosses claimed 'in the sea' with no うみ and 31 claimed 'here' with no
ここ, teaching learners that およぐ means 'swim in the sea'."
```

---

## Task 21: Deliberately regenerate the editorial golden

`src/course/a2/catalog/a2EditorialSurfaces.golden.json` is a drift lock. It has been locking the defects Tasks 14-20 just removed, so `editorial.test.ts` has been red since Task 14. This task regenerates it — once, on purpose, with the diff reviewed.

**Files:**
- Modify: `src/course/a2/catalog/a2EditorialSurfaces.golden.json`

- [ ] **Step 1: Confirm the golden is the only thing still failing**

Run: `npx vitest run`

Expected: every file green except `src/course/a2/catalog/editorial.test.ts`. If `a2ContentInvariants.test.ts` is still red, a content task was left incomplete — go back and finish it before regenerating.

- [ ] **Step 2: Regenerate**

Run: `npx vite-node scripts/generateA2EditorialGolden.ts`

Expected: the script writes the file and exits 0.

- [ ] **Step 3: Review the diff line by line**

Run:

```bash
git --no-pager diff --stat src/course/a2/catalog/a2EditorialSurfaces.golden.json
git --no-pager diff src/course/a2/catalog/a2EditorialSurfaces.golden.json | grep -c '^[+-] '
```

Then read the full diff with `git --no-pager diff src/course/a2/catalog/a2EditorialSurfaces.golden.json`.

Expected: the row count stays at 806. Every changed row must be traceable to Tasks 14-20:

| Source task | Rows expected to change |
| --- | --- |
| Task 14 | 4 (`connected-conversation-3-t3`, `-t5`, `work-study-messages-4-t3`, `travel-reservations-1-m6`) |
| Task 15 | 12 (`health-advice-4-*` ×4, `travel-reservations-*` ×8) |
| Task 16 | 8 (`sequencing-ongoing-3/4-*`) |
| Task 17 | 3 (`experiences-narratives-2-m4`, `-m8`, `-t4`) |
| Task 18 | 3 (`work-study-messages-2-m3`, `-m6`, `-t1`) |
| Task 19 | 3 (`reasons-opinions-1-t4`, `-2-t1`, `-2-t4`) |
| Task 20 | 40 (gloss-only: `en`/`it` change, `jp` and `romaji` identical) |

That is 73 rows. **Any row that changed for none of these reasons is a real finding — stop and report it rather than accepting the regenerated file.**

- [ ] **Step 4: Confirm the suite is fully green**

Run: `npx vitest run && npx tsc --noEmit && npm run prebuild`

Expected: all tests pass, the typecheck is clean, and the prebuild prints its 60-lesson / 15-module / 59-Can-do / 120-kanji summary with `0` Japanese-literal violations.

- [ ] **Step 5: Commit the regeneration on its own**

```bash
git add src/course/a2/catalog/a2EditorialSurfaces.golden.json
git commit -m "chore(a2): regenerate the editorial golden after the Phase 4 content fixes

73 of 806 rows change: 33 corrected Japanese surfaces and 40 corrected
glosses. The golden had been locking these defects in place."
```

---

## Task 22: Document the inert `interrogative: false` field

The review flagged 42 variants carrying `interrogative: false`. Adjudication established this is inert bookkeeping, not a defect: flipping any of them would emit a doubled sentence-final `かか`, because the value already bakes its own `か`. The remedy is documentation, so a future reviewer does not re-raise it.

**Files:**
- Modify: `src/course/foundations/types.ts` (the `interrogative` field on the form/discourse type)

- [ ] **Step 1: Find the declaration**

Run: `grep -n 'interrogative' src/course/foundations/types.ts`

- [ ] **Step 2: Replace its doc comment**

Replace the existing comment above `readonly interrogative` with:

```ts
  /**
   * Whether the *realization rule* should append a sentence-final question
   * particle. This is NOT "is this sentence a question": 42 A2 variants are
   * genuine questions whose predicate value already bakes its own か
   * (`ありますか`, `いいですか`), and they correctly carry `interrogative:
   * false` so the rule does not append a second one and emit `…ですかか`.
   *
   * Reviewers periodically flag those 42 as a data defect. They are not.
   * Verify by flipping one and realizing it: the surface gains a duplicate
   * terminal か, which `a2RealizedIntegrity.test.ts` finding A rejects.
   */
```

- [ ] **Step 3: Typecheck and commit**

```bash
npx tsc --noEmit && git add src/course/foundations/types.ts
git commit -m "docs(foundations): explain why interrogative:false is correct on baked-か values"
```

---

## Task 23: Break the exercise monotony at its root

34 of 60 A2 lessons ship the **identical** ten-exercise sequence, and only 21 distinct sequences exist across the whole level. The cause is code, not content: `assignExerciseKinds` rotates kinds in the non-controlled branch but not in the controlled-construction branch, where `otherKinds[0]` hands `completion` to every remaining transfer. `choice` is also absent from both levels' round-two kind lists.

**Files:**
- Modify: `src/course/foundations/selectVariants.ts:479-486, 694-753, 843`
- Modify: `src/course/a2/catalog/a2LessonBuilders.ts:431`
- Modify: `src/course/a1/catalog/a1LessonBuilders.ts:315-322`
- Create: `src/course/foundations/exerciseKindVariety.test.ts`

- [ ] **Step 1: Write the failing variety regression test**

Create `src/course/foundations/exerciseKindVariety.test.ts`:

```ts
/**
 * Exercise-kind variety across the whole catalogue.
 *
 * Before Phase 4, 34 of 60 A2 lessons shipped one identical ten-exercise
 * sequence and only 21 distinct sequences existed, because the
 * controlled-construction branch of `assignExerciseKinds` handed
 * `otherKinds[0]` (always `completion`) to every non-controlled transfer.
 * These bounds are deliberately looser than the measured post-fix figures so
 * that ordinary content edits do not break the build, while any regression
 * back towards the old monotony does.
 */
import { describe, expect, it } from "vitest";

import { a1Runtime } from "../a1/catalog/catalog";
import { a2Runtime } from "../a2/catalog/catalog";

type Sequence = string;

function sequencesOf(rounds: readonly { readonly targets: readonly { readonly exerciseKind: string }[] }[]): Sequence {
  return rounds.flatMap((round) => round.targets.map((target) => target.exerciseKind)).join(",");
}

const a2Lessons = a2Runtime.model.foundation.rounds;
const a1Lessons = a1Runtime.model.rounds;

function collect(byLesson: ReadonlyMap<string, readonly { readonly targets: readonly { readonly exerciseKind: string }[] }[]>) {
  const sequences = [...byLesson.values()].map(sequencesOf);
  const counts = new Map<Sequence, number>();
  for (const sequence of sequences) counts.set(sequence, (counts.get(sequence) ?? 0) + 1);
  const kinds = new Map<string, number>();
  for (const sequence of sequences) {
    for (const kind of sequence.split(",")) kinds.set(kind, (kinds.get(kind) ?? 0) + 1);
  }
  return { total: sequences.length, distinct: counts.size, maxShared: Math.max(...counts.values()), kinds };
}

describe("exercise-kind variety", () => {
  it("gives A2 many distinct sequences and no dominant one", () => {
    const stats = collect(a2Lessons);
    expect(stats.total).toBe(60);
    expect(stats.distinct).toBeGreaterThanOrEqual(30);
    expect(stats.maxShared).toBeLessThanOrEqual(12);
  });

  it("uses all four non-transformation kinds at A2, none of them marginal", () => {
    const stats = collect(a2Lessons);
    for (const kind of ["tile-ordering", "completion", "choice", "constrained-construction"]) {
      expect(stats.kinds.get(kind) ?? 0).toBeGreaterThanOrEqual(60);
    }
  });

  it("gives A1 many distinct sequences and no dominant one", () => {
    const stats = collect(a1Lessons);
    expect(stats.distinct).toBeGreaterThanOrEqual(Math.ceil(stats.total / 2));
    expect(stats.maxShared).toBeLessThanOrEqual(Math.ceil(stats.total / 4));
  });
});
```

> `a2Runtime.model.foundation.rounds` and `a1Runtime.model.rounds` are the shapes those two runtimes actually expose — A2 nests its foundation model one level deeper. If either import name differs, run `grep -n "export const a2Runtime" src/course/a2/catalog/catalog.ts` and adjust the accessor, not the assertions.

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run src/course/foundations/exerciseKindVariety.test.ts`

Expected: FAIL. The first test reports `distinct` = 21 (below 30) and `maxShared` = 34 (above 12); the second reports `choice` far below 60.

- [ ] **Step 3: Add `choice` to both levels' round-two kinds**

In `src/course/a2/catalog/a2LessonBuilders.ts` replace line 431:

```ts
const A2_ROUND_TWO_KINDS = ["constrained-construction", "completion", "tile-ordering"] as const;
```

with:

```ts
const A2_ROUND_TWO_KINDS = ["constrained-construction", "completion", "tile-ordering", "choice"] as const;
```

In `src/course/a1/catalog/a1LessonBuilders.ts` replace lines 315-322:

```ts
const A1_ROUND_TWO_KINDS = [
  "constrained-construction",
  "completion",
  "tile-ordering",
] as const;
```

with:

```ts
const A1_ROUND_TWO_KINDS = [
  "constrained-construction",
  "completion",
  "tile-ordering",
  "choice",
] as const;
```

- [ ] **Step 4: Add the rotation helper**

In `src/course/foundations/selectVariants.ts`, immediately above `function assignExerciseKinds` (line 675), add:

```ts
/**
 * `kinds` rotated left by `offset`, so the element at `offset` becomes the
 * first preference. Used to give each (lesson, round) a different starting
 * kind instead of every lesson starting from the same one.
 */
function rotateKinds(
  kinds: readonly ExerciseKind[],
  offset: number,
): readonly ExerciseKind[] {
  if (kinds.length === 0) return kinds;
  const start = ((offset % kinds.length) + kinds.length) % kinds.length;
  return kinds.map((_unused, index) => kinds[(start + index) % kinds.length]);
}
```

- [ ] **Step 5: Thread the seed and lesson id down to the assignment**

Change the `backtrackSelect` signature (line 479) to:

```ts
function backtrackSelect(
  ranked: readonly RankedCandidate[],
  round: SelectVariantsRoundInput,
  baseline: BaselineCounts,
  constraints: SelectVariantsRoundConstraints,
  alreadySelected: readonly SelectedPracticeTarget[],
  backtrackCallLimit: number,
  kindOffset: number,
): BacktrackOutcome {
```

Change its `assignExerciseKinds` call (line 518) to:

```ts
    const assignment = assignExerciseKinds(chosen, round, constraints, alreadySelected, kindOffset);
```

Change the `backtrackSelect` call site (line 843) to:

```ts
  const kindOffset = fnv1a32(`${catalogVersion}|${lessonId}|${round.id}|${seed}|kind-offset`);
  const outcome = backtrackSelect(ranked, round, baseline, constraints, alreadySelected, backtrackCallLimit, kindOffset);
```

Change the `assignExerciseKinds` signature (line 675) to:

```ts
function assignExerciseKinds(
  ranked: readonly RankedCandidate[],
  round: SelectVariantsRoundInput,
  constraints: SelectVariantsRoundConstraints,
  alreadySelected: readonly SelectedPracticeTarget[],
  kindOffset: number,
): { readonly ok: true; readonly targets: readonly SelectedPracticeTarget[] } | { readonly ok: false; readonly error: SelectVariantsError } {
```

- [ ] **Step 6: Rotate in the controlled-construction branch**

Replace the `assignedOther` loop (lines 703-716) with:

```ts
    let assignedOther = false;
    let otherIndex = 0;
    for (const entry of ordered) {
      if (entry === ccEntry) continue;
      const otherKinds = eligibility.get(entry)!.filter((kind) => kind !== "constrained-construction");
      if (otherKinds.length > 0) {
        // Rotate through the round's declared kind order instead of always
        // taking otherKinds[0]. Taking [0] collapsed every non-controlled
        // transfer onto `completion`, which is why 34 of 60 lessons once
        // shipped one identical exercise sequence.
        const preferred = rotateKinds(round.exerciseKinds, kindOffset + otherIndex).find(
          (kind) => kind !== "constrained-construction" && otherKinds.includes(kind),
        );
        assigned.set(entry, preferred ?? otherKinds[0]);
        assignedOther = true;
        otherIndex += 1;
      }
    }
```

- [ ] **Step 7: Offset the non-controlled branch**

Replace line 741:

```ts
      const preferredIndex = index % round.exerciseKinds.length;
```

with:

```ts
      const preferredIndex = (index + kindOffset) % round.exerciseKinds.length;
```

- [ ] **Step 8: Run the variety test and the whole suite**

Run:

```bash
npx vitest run src/course/foundations/exerciseKindVariety.test.ts
npx vitest run
npx vite-node scripts/validateA1Release.ts && npx vite-node scripts/validateA2Release.ts
```

Expected: the variety test reports `3 passed`. Both release validators exit 0. Exercise kinds are not part of the editorial golden, so `editorial.test.ts` stays green.

> If a release validator now reports `missing-controlled-transfer` or `no-eligible-kind` for a lesson, that lesson has a transfer whose only eligible kind was the one the rotation moved past. `eligibleKindsFor` never invents a kind, so the fix is to widen that lesson's variant pool, never to revert the rotation.

- [ ] **Step 9: Record the achieved numbers**

Run:

```bash
npx vitest run src/course/foundations/exerciseKindVariety.test.ts --reporter=verbose
```

Write the achieved `distinct`, `maxShared` and per-kind counts into the commit message so the next reviewer can see the movement.

- [ ] **Step 10: Commit**

```bash
git add src/course/foundations/selectVariants.ts src/course/foundations/exerciseKindVariety.test.ts src/course/a1/catalog/a1LessonBuilders.ts src/course/a2/catalog/a2LessonBuilders.ts
git commit -m "fix(foundations): rotate exercise kinds in the controlled-transfer branch

The branch handed otherKinds[0] (always completion) to every non-controlled
transfer, so 34 of 60 A2 lessons shipped one identical sequence. Kinds now
rotate from a per-(lesson,round) seed-derived offset, and choice joins
round two at both levels."
```

---

## Task 24: Put `transformation` into service

`transformation` is a fully implemented exercise kind with localized IT/EN instruction copy at `buildLessonViewModel.ts:207-210` and it has never once been generated. The reason is data, not code: `findTransformationSource` requires a source and target that share family, predicate sense and every fingerprint field except `form`, differing in exactly one of polarity or tense — and **no A2 lesson contains a single eligible ordered pair**.

**Files:**
- Modify: `src/course/a2/catalog/a2LessonBuilders.ts:431`
- Modify: `src/course/a2/content/module06PermissionRequests.ts`
- Modify: `src/course/a2/content/module03ExperiencesNarratives.ts`
- Modify: `src/course/a2/content/module05SequencingOngoing.ts`
- Create: `src/course/a2/catalog/transformationCoverage.test.ts`

- [ ] **Step 1: Write the failing coverage test**

Create `src/course/a2/catalog/transformationCoverage.test.ts`:

```ts
/**
 * `transformation` shipped as dead code for all of Phases 0-3: implemented,
 * localized (buildLessonViewModel.ts:207-210), and generated zero times,
 * because no lesson contained an eligible source/target pair. This test
 * keeps at least one in the catalogue.
 */
import { describe, expect, it } from "vitest";

import { a2Runtime } from "./catalog";

describe("transformation coverage", () => {
  it("generates at least one transformation exercise somewhere at A2", () => {
    const kinds = [...a2Runtime.model.foundation.rounds.values()]
      .flat()
      .flatMap((round) => round.targets.map((target) => target.exerciseKind));
    expect(kinds.filter((kind) => kind === "transformation").length).toBeGreaterThanOrEqual(1);
  });

  it("gives every transformation exercise a real source variant", () => {
    const orphans = [...a2Runtime.model.foundation.rounds.entries()].flatMap(([lessonId, rounds]) =>
      rounds.flatMap((round) =>
        round.targets
          .filter((target) => target.exerciseKind === "transformation" && !target.sourceVariantId)
          .map((target) => `${lessonId}::${target.variantId}`),
      ),
    );
    expect(orphans).toEqual([]);
  });
});
```

- [ ] **Step 2: Run it and watch the first test fail**

Run: `npx vitest run src/course/a2/catalog/transformationCoverage.test.ts`

Expected: FAIL — `expected +0 to be greater than or equal to 1`. The second test passes vacuously.

- [ ] **Step 3: Add `transformation` to the A2 round-two kinds**

In `src/course/a2/catalog/a2LessonBuilders.ts`, replace the line Task 23 Step 3 produced with:

```ts
const A2_ROUND_TWO_KINDS = ["constrained-construction", "completion", "tile-ordering", "choice", "transformation"] as const;
```

- [ ] **Step 4: Author three transformation twins**

A twin is the *same* line with one form field flipped. Add these three lines next to their existing siblings, keeping every other argument byte-identical so the pair differs only in `form`:

In `src/course/a2/content/module06PermissionRequests.ts`, find the line whose id is `permission-requests-2-m3` and add immediately after it a copy with:
- id `permission-requests-2-m9`
- `form: A2_NEGATIVE_PRESENT_POLITE`
- English gloss: the existing gloss with the verb negated (e.g. `"May I eat this?"` → `"May I not eat this?"` becomes unnatural, so use `"Is it all right if I don't eat this?"`), Italian: `"Va bene se non mangio questo?"`

In `src/course/a2/content/module03ExperiencesNarratives.ts`, find `experiences-narratives-1-m3` and add after it a copy with:
- id `experiences-narratives-1-m9`
- `form: A2_NEGATIVE_PAST_POLITE`
- English: the existing gloss turned negative, e.g. `"I have never done that."`, Italian: `"Non l'ho mai fatto."`

In `src/course/a2/content/module05SequencingOngoing.ts`, find `sequencing-ongoing-1-m3` and add after it a copy with:
- id `sequencing-ongoing-1-m9`
- `form: A2_AFFIRMATIVE_PAST_POLITE`
- English: the existing gloss in the past, Italian: the same in the passato prossimo.

Import whichever of `A2_NEGATIVE_PRESENT_POLITE`, `A2_NEGATIVE_PAST_POLITE` and `A2_AFFIRMATIVE_PAST_POLITE` each file does not already import, from `../catalog/a2LessonBuilders`.

> Each of these lessons declares `A2_INSTRUCTIONAL_MODEL_COUNT_RANGE = [8, 12]` (`a2LessonBuilders.ts:250`), so a ninth model is inside the allowed range. `semanticFingerprint` includes `form`, so a twin is never a duplicate.

- [ ] **Step 5: Run the coverage test**

Run: `npx vitest run src/course/a2/catalog/transformationCoverage.test.ts`

Expected: `2 passed`.

> If the first test still reports 0, selection chose only one member of a twin pair for round two. Add a fourth twin using the same recipe to the next lesson in this list, re-running after each: `permission-requests-4`, `experiences-narratives-3`, `sequencing-ongoing-2`, `sequencing-ongoing-3`. Selection is fully seeded and deterministic, so once the count is ≥ 1 it stays ≥ 1 for this seed and catalog version.

- [ ] **Step 6: Verify the generated exercise renders**

Run:

```bash
npx vitest run
npx vite-node scripts/validateA2Release.ts
npx tsc --noEmit
```

Expected: everything green and exit 0. `editorial.test.ts` will fail because three new variants add three golden rows — regenerate with `npx vite-node scripts/generateA2EditorialGolden.ts`, confirm the diff adds exactly three rows (`permission-requests-2-m9`, `experiences-narratives-1-m9`, `sequencing-ongoing-1-m9`) and changes nothing else, then re-run `npx vitest run`.

- [ ] **Step 7: Commit**

```bash
git add src/course/a2/catalog/a2LessonBuilders.ts src/course/a2/catalog/transformationCoverage.test.ts src/course/a2/catalog/a2EditorialSurfaces.golden.json src/course/a2/content/
git commit -m "feat(a2): put the transformation exercise kind into service

transformation had localized copy and zero generated instances because no
lesson held an eligible source/target pair. Three authored twins and a
round-two kind entry make it real, with a coverage test to keep it real."
```

---

## Task 25: Rewrite the four synthesis lessons as genuine connected discourse

**Decision, with reasoning.** The four synthesis Can-do descriptors promise exchanges and recounts ("I can make weekend plans **with a friend**", "handle a short shopping or service exchange", "let someone know I'll be absent", "recount a past trip"). The lessons currently deliver eight unrelated utterances, each assigned mechanically to a different one of four speaker roles, in alternating contexts. So the descriptors are ahead of the content.

**The content is authored, not the Can-dos reworded**, because the gap is fixable without violating Phase 3's frozen constraint. `validateA2` gate #6 forbids the synthesis module from introducing any new family, sense, value or kanji — but a scene needs no new material, only a fixed cast, a coherent order and glosses that carry the thread. Every line below reuses a value the lesson already ships.

The `plain-recognition` items are the one genuine exception: they are metalinguistic recognition drills, not utterances in a scene. They stay, they move to the end of their lesson, and their glosses say plainly that they are casual-speech recognition. They serve `a2-cando-recognize-plain-forms`, whose descriptor is about recognition, so no descriptor is left overclaiming.

Glosses must contain no Japanese characters — `lintA2NoJapanese` fails the prebuild on Japanese literals outside `a2SemanticCatalog.ts`.

**Files:**
- Modify: `src/course/a2/content/module15Synthesis.ts:125-132, 160-167, 198-205, 237-244`
- Create: `src/course/a2/content/synthesisDiscourse.test.ts`

- [ ] **Step 1: Write the failing discourse-coherence test**

Create `src/course/a2/content/synthesisDiscourse.test.ts`:

```ts
/**
 * The four synthesis lessons must read as scenes, not as eight unrelated
 * utterances. Before Phase 4 each lesson cycled four speaker roles
 * mechanically (learner, friend, colleague, teacher, repeat) across
 * alternating contexts, which is why no lesson read as an exchange.
 */
import { describe, expect, it } from "vitest";

import { module15Lessons } from "./module15Synthesis";

const SYNTHESIS_IDS = ["a2-synthesis-1", "a2-synthesis-2", "a2-synthesis-3", "a2-synthesis-4"] as const;

describe("synthesis lessons are scenes", () => {
  it.each(SYNTHESIS_IDS)("%s has at most two speakers across its models", (lessonId) => {
    const lesson = module15Lessons.find((entry) => entry.id === lessonId);
    expect(lesson, `lesson ${lessonId} not found`).toBeDefined();
    const roles = new Set(lesson!.models.map((model) => model.speakerRole));
    expect([...roles].sort()).toHaveLength(2);
  });

  it.each(SYNTHESIS_IDS)("%s never labels a scene line as casual-speech recognition", (lessonId) => {
    const lesson = module15Lessons.find((entry) => entry.id === lessonId);
    const misplaced = lesson!.models
      .filter((model) => model.family !== "a2-family-plain-recognition")
      .filter((model) => /casual speech|discorso informale|parlato informale/i.test(`${model.translation.en} ${model.translation.it}`))
      .map((model) => model.id);
    expect(misplaced).toEqual([]);
  });

  it.each(SYNTHESIS_IDS)("%s groups every casual-speech recognition item at the end", (lessonId) => {
    const lesson = module15Lessons.find((entry) => entry.id === lessonId);
    const flags = lesson!.models.map((model) => model.family === "a2-family-plain-recognition");
    const firstRecognition = flags.indexOf(true);
    if (firstRecognition === -1) return;
    expect(flags.slice(firstRecognition).every(Boolean)).toBe(true);
  });
});
```

> `module15Lessons` is already exported and consumed by `module15Synthesis.test.ts`, so the import path and the `models` / `speakerRole` / `translation` shapes are the ones that file already relies on. If a lesson's model list is nested under a different property, run `grep -n "models:" src/course/a2/content/module15Synthesis.ts` and use that accessor.

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run src/course/a2/content/synthesisDiscourse.test.ts`

Expected: FAIL. The "at most two speakers" case fails for all four lessons with length 4. The "groups recognition items at the end" case fails for `a2-synthesis-1` (recognition at indices 4 and 5, scene lines after) and `a2-synthesis-4` (recognition at index 2 with experience lines after).

- [ ] **Step 3: Rewrite `a2-synthesis-1` — weekend planning, learner ⇄ friend**

Replace lines 125-132 with:

```ts
    line("a2-synthesis-1-m1", "a2-family-plan-yotei", "a2-value-yotei-iku-kyouto", OUTING, L("I'm planning to go to Kyoto this weekend.", "Questo weekend ho in programma di andare a Kyoto."), { speakerRole: "a2-role-learner" }),
    line("a2-synthesis-1-m2", "a2-family-plan-tsumori", "a2-value-tsumori-au-tomodachi", OUTING, L("Nice. I intend to meet a friend this weekend.", "Bello. Io ho intenzione di incontrare un amico questo weekend."), { speakerRole: "a2-role-friend" }),
    line("a2-synthesis-1-m3", "a2-family-plan-yotei", "a2-value-yotei-oyogu-shuumatsu", OUTING, L("Sora is planning to swim at the sea this weekend.", "Sora ha in programma di nuotare al mare questo weekend."), { subjectValueId: "a2-value-sora", speakerRole: "a2-role-friend" }),
    line("a2-synthesis-1-m4", "a2-family-connector-utterance", "a2-value-connector-ame-demo-dekakeru", PLANS, L("Today it's raining, but I'll still go out.", "Oggi piove, ma esco lo stesso."), { speakerRole: "a2-role-learner" }),
    line("a2-synthesis-1-m5", "a2-family-connector-utterance", "a2-value-connector-ame-sorekara-hare", PLANS, L("In the morning it rained. Then, it cleared up.", "Al mattino ha piovuto. Poi si è schiarito."), { speakerRole: "a2-role-friend", form: A2_AFFIRMATIVE_PAST_POLITE }),
    line("a2-synthesis-1-m6", "a2-family-connector-utterance", "a2-value-connector-shigoto-sorekara-kaeru", PLANS, L("My work finished. Then, I went home.", "Il lavoro è finito. Poi sono tornato a casa."), { speakerRole: "a2-role-learner", form: A2_AFFIRMATIVE_PAST_POLITE }),
    line("a2-synthesis-1-m7", "a2-family-plain-recognition", "a2-value-plain-iku-dict", OUTING, L("Casual-speech recognition: 'go'.", "Riconoscimento del parlato informale: 'andare'."), { speakerRole: "a2-role-learner", form: A2_AFFIRMATIVE_PRESENT_PLAIN }),
    line("a2-synthesis-1-m8", "a2-family-plain-recognition", "a2-value-plain-taberu-past", OUTING, L("Casual-speech recognition: 'ate'.", "Riconoscimento del parlato informale: 'ho mangiato'."), { speakerRole: "a2-role-friend", form: A2_AFFIRMATIVE_PAST_PLAIN }),
```

- [ ] **Step 4: Rewrite `a2-synthesis-2` — a shopping exchange, learner ⇄ clerk**

Replace lines 160-167 with:

```ts
    line("a2-synthesis-2-m1", "a2-family-ongoing-teiru", "a2-value-teiru-paatii-shiteimasu", SHOPPING, L("I'm having a party.", "Sto facendo una festa."), { object: "a2-value-obj-paatii", speakerRole: "a2-role-learner" }),
    line("a2-synthesis-2-m2", "a2-family-comparison-favor", "a2-value-yasui-stem", SHOPPING, L("This shop is cheaper than that one.", "Questo negozio è più economico di quello."), { favored: "a2-value-obj-kono-mise", standard: "a2-value-obj-ano-mise", speakerRole: "a2-role-learner" }),
    line("a2-synthesis-2-m3", "a2-family-comparison-favor", "a2-value-yasui-stem", SHOPPING, L("The bag is cheaper than the shoes.", "La borsa è più economica delle scarpe."), { favored: "a2-value-obj-kaban", standard: "a2-value-obj-kutsu", speakerRole: "a2-role-learner" }),
    line("a2-synthesis-2-m4", "a2-family-opinion-toomou", "a2-value-opinion-kaban-ii", SHOPPING, L("I think this bag is better.", "Penso che questa borsa sia migliore."), { speakerRole: "a2-role-learner" }),
    line("a2-synthesis-2-m5", "a2-family-permission-temoii", "a2-value-temoii-taberu", SHOPPING, L("May I eat this?", "Posso mangiare questo?"), { object: "a2-value-obj-kore-m6", interrogative: true, speakerRole: "a2-role-learner" }),
    line("a2-synthesis-2-m6", "a2-family-prohibition-tewaikenai", "a2-value-tewaikenai-shashin", SHOPPING, L("You must not take photos.", "Non si possono scattare foto."), { object: "a2-value-obj-shashin", speakerRole: "a2-role-clerk" }),
    line("a2-synthesis-2-m7", "a2-family-possibility", "a2-value-possibility-tsukau", NEIGHBORHOOD, L("You can use a card.", "Si può usare la carta."), { object: "a2-value-obj-kaado", speakerRole: "a2-role-clerk" }),
    line("a2-synthesis-2-m8", "a2-family-possibility", "a2-value-possibility-yomu", NEIGHBORHOOD, L("You can read the menu.", "Si può leggere il menu."), { object: "a2-value-obj-menyuu", speakerRole: "a2-role-clerk" }),
```

> `m2` repoints the train/bus comparison onto two shops. Both `a2-value-obj-kono-mise` and `a2-value-obj-ano-mise` already exist and already carry `comparableDimensions` from Task 12, so no new value is introduced and gate #6 still holds. The `here` locatives are already gone from `m7`/`m8` via Task 20.

- [ ] **Step 5: Rewrite `a2-synthesis-3` — a health absence, learner ⇄ colleague**

Replace lines 198-205 with:

```ts
    line("a2-synthesis-3-m1", "a2-family-te-sequence", "a2-value-seq-hataraite-tsukareta", HEALTH, L("I worked, and got tired.", "Ho lavorato e mi sono stancato."), { speakerRole: "a2-role-learner", form: A2_AFFIRMATIVE_PAST_POLITE }),
    line("a2-synthesis-3-m2", "a2-family-reason-kara", "a2-value-kara-atama-yasumu", HEALTH, L("My head hurts, so I should rest.", "Mi fa male la testa, quindi dovrei riposare."), { speakerRole: "a2-role-learner" }),
    line("a2-synthesis-3-m3", "a2-family-reason-node", "a2-value-node-netsu-yasumu", HEALTH, L("I have a fever, so I'll rest today.", "Ho la febbre, quindi oggi riposo."), { speakerRole: "a2-role-learner" }),
    line("a2-synthesis-3-m4", "a2-family-request-tekudasai", "a2-value-tekudasai-tasukete", WORKPLACE, L("Please help.", "Per favore, aiutami."), { speakerRole: "a2-role-learner" }),
    line("a2-synthesis-3-m5", "a2-family-reason-kara", "a2-value-kara-densha-okureru", WORKPLACE, L("A friend will be a bit late because the train is delayed.", "Un amico farà un po' tardi perché il treno è in ritardo."), { subjectValueId: "a2-value-friend-subject", speakerRole: "a2-role-colleague" }),
    line("a2-synthesis-3-m6", "a2-family-request-tekudasai", "a2-value-tekudasai-matsu", WORKPLACE, L("Please wait.", "Per favore, aspetta."), { speakerRole: "a2-role-colleague" }),
    line("a2-synthesis-3-m7", "a2-family-negative-request", "a2-value-naidekudasai-muri", HEALTH, L("Please don't overdo it.", "Per favore, non strafare."), { speakerRole: "a2-role-colleague" }),
    line("a2-synthesis-3-m8", "a2-family-te-sequence", "a2-value-seq-owatte-kaeru", WORKPLACE, L("Work finishes, then I go home.", "Il lavoro finisce, poi torno a casa."), { speakerRole: "a2-role-learner" }),
```

- [ ] **Step 6: Rewrite `a2-synthesis-4` — a trip recount, learner ⇄ friend**

Replace lines 237-244 with:

```ts
    line("a2-synthesis-4-m1", "a2-family-experience-takoto", "a2-value-exp-itta-tokyo", EXPERIENCES, L("I have been to Tokyo.", "Sono stato a Tokyo."), { speakerRole: "a2-role-learner" }),
    line("a2-synthesis-4-m2", "a2-family-experience-takoto", "a2-value-exp-shinkansen-notta", TRAVEL, L("Sora has ridden the shinkansen, too.", "Anche Sora ha preso lo shinkansen."), { subjectValueId: "a2-value-sora", speakerRole: "a2-role-learner" }),
    line("a2-synthesis-4-m3", "a2-family-experience-takoto", "a2-value-exp-nobotta-fuji", EXPERIENCES, L("I have climbed Mt. Fuji.", "Ho scalato il Monte Fuji."), { speakerRole: "a2-role-friend" }),
    line("a2-synthesis-4-m4", "a2-family-experience-takoto", "a2-value-exp-tabeta-sushi", EXPERIENCES, L("My friend has eaten sushi.", "Il mio amico ha mangiato sushi."), { subjectValueId: "a2-value-friend-subject", speakerRole: "a2-role-friend" }),
    line("a2-synthesis-4-m5", "a2-family-plain-recognition", "a2-value-plain-oyogu-dict", TRAVEL, L("Casual-speech recognition: 'swim'.", "Riconoscimento del parlato informale: 'nuotare'."), { speakerRole: "a2-role-learner", form: A2_AFFIRMATIVE_PRESENT_PLAIN }),
    line("a2-synthesis-4-m6", "a2-family-plain-recognition", "a2-value-plain-asobu-dict", TRAVEL, L("Casual-speech recognition: 'play, hang out'.", "Riconoscimento del parlato informale: 'divertirsi'."), { speakerRole: "a2-role-learner", form: A2_AFFIRMATIVE_PRESENT_PLAIN }),
    line("a2-synthesis-4-m7", "a2-family-plain-recognition", "a2-value-plain-yomu-neg", EXPERIENCES, L("Casual-speech recognition: 'doesn't read'.", "Riconoscimento del parlato informale: 'non legge'."), { speakerRole: "a2-role-friend", form: A2_NEGATIVE_PRESENT_PLAIN }),
    line("a2-synthesis-4-m8", "a2-family-plain-recognition", "a2-value-plain-matsu-past-neg", TRAVEL, L("Casual-speech recognition: 'didn't wait'.", "Riconoscimento del parlato informale: 'non ha aspettato'."), { speakerRole: "a2-role-friend", form: A2_NEGATIVE_PAST_PLAIN }),
```

- [ ] **Step 7: Run the discourse test, the release validator and the module's own suite**

Run:

```bash
npx vitest run src/course/a2/content/synthesisDiscourse.test.ts
npx vitest run src/course/a2/content/module15Synthesis.test.ts
npx vite-node scripts/validateA2Release.ts
```

Expected: the discourse test reports `12 passed`; `module15Synthesis.test.ts` passes (it asserts the module introduces no new concepts, senses or kanji — none of the edits above adds any); the release validator exits 0.

> If the release validator reports a role-diversity error, the two-speaker models list no longer supplies the round's `minRoles`. The transfers `t1`-`t5` in each synthesis lesson keep their original roles, so the fix is to widen a *transfer's* role, never to reintroduce a third speaker into the scene.

- [ ] **Step 8: Regenerate the golden and confirm the scope of the diff**

Run:

```bash
npx vite-node scripts/generateA2EditorialGolden.ts
git --no-pager diff --stat src/course/a2/catalog/a2EditorialSurfaces.golden.json
```

Expected: only rows whose id starts `a2-synthesis-` change, at most 32 of them, and the row count is unchanged apart from Task 24's three additions. `a2-synthesis-2-m2`'s `jp` changes (the shops comparison); every other change is a gloss or an ordering swap.

- [ ] **Step 9: Full verification**

Run: `npx vitest run && npx tsc --noEmit && npm run prebuild`

Expected: all green; the prebuild reports `0` Japanese-literal violations, confirming the new glosses introduced no Japanese into a content module.

- [ ] **Step 10: Commit**

```bash
git add src/course/a2/content/module15Synthesis.ts src/course/a2/content/synthesisDiscourse.test.ts src/course/a2/catalog/a2EditorialSurfaces.golden.json
git commit -m "feat(a2): make the four synthesis lessons genuine connected discourse

Each capstone lesson cycled four speakers through eight unrelated utterances
while its Can-do promised an exchange. Each is now a two-speaker scene built
only from already-taught values, with the casual-speech recognition items
grouped at the end and labelled as recognition."
```

---

## Task 26: Give every kanji its contextual word, and stop claiming it appears in the sentences

Three verified facts converge here:

1. All 806 realized sentences contain **zero** ideographs — 12,003 Japanese characters, all kana.
2. Only **10 of 480** kanji exposures have their contextual lexeme used by a sentence in their own lesson — and **0 of the 120 `assessed`-stage exposures** do. The measurement method is recorded in the D5 measurement note near the top of this plan; do not re-derive it with a substring test, which returns an inflated 231.
3. The learner-facing copy at `src/course/i18n/en.ts:84-85` says *"These kanji appear in this lesson's sentences."* — which is false, in both languages.

`kanjiTypes.ts:1-14` states the contract this violates: a kanji must never be "a standalone glyph-meaning flashcard divorced from that context". `resolveA2KanjiExposureViews` emits glyph, reading, romaji and meaning — a flashcard.

**Decision (locked as D5), with reasoning.** Kanji stays out of the 806 practice sentences. Putting it in would mean authoring kanji orthography for every value in the semantic catalog, making the tile-ordering and completion token model script-aware, and reconciling it with the hiragana-first writing policy and the rōmaji script mode — a Phase 5 project, recorded in Task 33. What Phase 4 fixes is the honesty gap: each glyph gains the **contextual word** it lives in, rendered 交ぜ書き (only the glyphs sharing this row's sense are written in kanji; everything else stays kana) with whole-word ruby. The copy then describes what the panel actually shows.

**Files:**
- Create: `src/course/a2/kanji/a2ContextualWords.ts`
- Create: `src/course/a2/kanji/a2ContextualWords.test.ts`
- Modify: `src/course/a2/kanji/a2KanjiCatalog.ts:35-52`
- Modify: `src/course/a2/view/buildA2LessonViewModel.ts:103-145`
- Modify: `src/course/i18n/en.ts:82-90`, `src/course/i18n/it.ts:82-90`, `src/course/i18n/types.ts`

- [ ] **Step 1: Write the failing C8 contextual-reading validator**

Create `src/course/a2/kanji/a2ContextualWords.test.ts`:

```ts
/**
 * C8 — contextual kanji reading correctness.
 *
 * Every kanji row declares the reading that glyph takes *inside its
 * contextual word*. That claim is only checkable once the word exists, so
 * this test is the reason A2_CONTEXTUAL_WORDS exists at all.
 *
 * Japanese compounds alter a component's reading predictably, so the check
 * tolerates exactly three documented alternations and nothing else:
 *   rendaku   か→が, く→ぐ, ち→ぢ, つ→づ, は→ば, ひ→び, ふ→ぶ, へ→べ, ほ→ぼ, さ→ざ, し→じ, す→ず, せ→ぜ, そ→ぞ, た→だ, て→で, と→ど
 *   handakuon は→ぱ, ひ→ぴ, ふ→ぷ, へ→ぺ, ほ→ぽ
 *   sokuon    a final つ/ち/く/き becoming っ
 */
import { describe, expect, it } from "vitest";

import { A2_KANJI_ROWS } from "./a2KanjiCatalog";
import { A2_CONTEXTUAL_WORDS } from "./a2ContextualWords";

const RENDAKU: Readonly<Record<string, readonly string[]>> = {
  か: ["が"], き: ["ぎ"], く: ["ぐ"], け: ["げ"], こ: ["ご"],
  さ: ["ざ"], し: ["じ"], す: ["ず"], せ: ["ぜ"], そ: ["ぞ"],
  た: ["だ"], ち: ["ぢ"], つ: ["づ"], て: ["で"], と: ["ど"],
  は: ["ば", "ぱ"], ひ: ["び", "ぴ"], ふ: ["ぶ", "ぷ"], へ: ["べ", "ぺ"], ほ: ["ぼ", "ぽ"],
};

/** Every reading `kana` may legitimately surface as inside a compound. */
function allowedSurfaces(kana: string): readonly string[] {
  const surfaces = new Set<string>([kana]);
  const head = kana[0];
  for (const voiced of RENDAKU[head] ?? []) surfaces.add(`${voiced}${kana.slice(1)}`);
  if (/[つちくき]$/.test(kana)) {
    for (const surface of [...surfaces]) surfaces.add(`${surface.slice(0, -1)}っ`);
  }
  return [...surfaces];
}

describe("C8 — contextual kanji readings", () => {
  it("gives every kanji sense a contextual word", () => {
    const missing = [...new Set(A2_KANJI_ROWS.map((row) => row.sense))]
      .filter((sense) => A2_CONTEXTUAL_WORDS[sense] === undefined)
      .sort();
    expect(missing).toEqual([]);
  });

  it("writes every word's kana with only kana", () => {
    const offenders = Object.entries(A2_CONTEXTUAL_WORDS)
      .filter(([, entry]) => /[\u4e00-\u9fff]/.test(entry.wordKana))
      .map(([sense]) => sense)
      .sort();
    expect(offenders).toEqual([]);
  });

  it("contains each glyph's declared reading inside its own contextual word", () => {
    const offenders = A2_KANJI_ROWS.filter((row) => {
      const entry = A2_CONTEXTUAL_WORDS[row.sense];
      if (!entry) return false;
      return !allowedSurfaces(row.kana).some((surface) => entry.wordKana.includes(surface));
    }).map((row) => `${row.glyph} (${row.sense}): reading ${row.kana} not in ${A2_CONTEXTUAL_WORDS[row.sense]!.wordKana}`);
    expect(offenders).toEqual([]);
  });

  it("writes the glyph itself into the word whenever the word is written in kanji", () => {
    const offenders = A2_KANJI_ROWS.filter((row) => {
      const entry = A2_CONTEXTUAL_WORDS[row.sense];
      if (!entry) return false;
      return /[\u4e00-\u9fff]/.test(entry.word) && !entry.word.includes(row.glyph);
    }).map((row) => `${row.glyph} (${row.sense}) missing from ${A2_CONTEXTUAL_WORDS[row.sense]!.word}`);
    expect(offenders).toEqual([]);
  });
});
```

- [ ] **Step 2: Run it and watch it fail to even import**

Run: `npx vitest run src/course/a2/kanji/a2ContextualWords.test.ts`

Expected: FAIL — `Failed to resolve import "./a2ContextualWords"`.

If `A2_KANJI_ROWS` is not exported from `a2KanjiCatalog.ts`, add `export` to its declaration; the whole-catalog array is the concatenation of the per-module row arrays.

- [ ] **Step 3: Create the contextual-word table**

Create `src/course/a2/kanji/a2ContextualWords.ts`:

```ts
/**
 * The word each contextual kanji actually lives in.
 *
 * Keyed by `KanjiRow.sense`, so the 120 rows share 98 words (名 and 前 both
 * belong to `namae`). Written 交ぜ書き: only the glyphs this course teaches
 * for *this* sense are in kanji, everything else stays kana, so a learner
 * never meets an untaught glyph. `wordKana` is the whole word's reading and
 * is what the ruby renders above it.
 */
export interface A2ContextualWord {
  /** Mixed kanji/kana orthography, e.g. 友だち. */
  readonly word: string;
  /** The whole word in kana, e.g. ともだち. */
  readonly wordKana: string;
}

export const A2_CONTEXTUAL_WORDS: Readonly<Record<string, A2ContextualWord>> = Object.freeze({
  hanasu: { word: "話す", wordKana: "はなす" },
  iu: { word: "言う", wordKana: "いう" },
  kiku: { word: "聞く", wordKana: "きく" },
  tomodachi: { word: "友だち", wordKana: "ともだち" },
  omou: { word: "思う", wordKana: "おもう" },
  namae: { word: "名前", wordKana: "なまえ" },
  nani: { word: "何", wordKana: "なに" },
  yotei: { word: "予定", wordKana: "よてい" },
  youbi: { word: "曜日", wordKana: "ようび" },
  au: { word: "会う", wordKana: "あう" },
  konshuu: { word: "今週", wordKana: "こんしゅう" },
  shuumatsu: { word: "しゅう末", wordKana: "しゅうまつ" },
  machimasu: { word: "待つ", wordKana: "まつ" },
  yakusoku: { word: "約そく", wordKana: "やくそく" },
  raigetsu: { word: "来月", wordKana: "らいげつ" },
  kyonen: { word: "去年", wordKana: "きょねん" },
  tanoshii: { word: "楽しい", wordKana: "たのしい" },
  hajimete: { word: "初めて", wordKana: "はじめて" },
  ichido: { word: "いち度", wordKana: "いちど" },
  yuumei: { word: "有めい", wordKana: "ゆうめい" },
  oyogu: { word: "泳ぐ", wordKana: "およぐ" },
  noboru: { word: "登る", wordKana: "のぼる" },
  ryokou: { word: "旅こう", wordKana: "りょこう" },
  riyuu: { word: "理由", wordKana: "りゆう" },
  kangaeru: { word: "考える", wordKana: "かんがえる" },
  iken: { word: "意見", wordKana: "いけん" },
  kimochi: { word: "気持ち", wordKana: "きもち" },
  warui: { word: "悪い", wordKana: "わるい" },
  okiru: { word: "起きる", wordKana: "おきる" },
  neru: { word: "寝る", wordKana: "ねる" },
  tsukau: { word: "使う", wordKana: "つかう" },
  tsukuru: { word: "作る", wordKana: "つくる" },
  mainichi: { word: "毎にち", wordKana: "まいにち" },
  arau: { word: "洗う", wordKana: "あらう" },
  owaru: { word: "終わる", wordKana: "おわる" },
  hajimaru: { word: "始まる", wordKana: "はじまる" },
  hataraku: { word: "働く", wordKana: "はたらく" },
  hairu: { word: "入る", wordKana: "はいる" },
  iriguchi: { word: "いり口", wordKana: "いりぐち" },
  deguchi: { word: "出ぐち", wordKana: "でぐち" },
  "tomaru-stop": { word: "止まる", wordKana: "とまる" },
  kinshi: { word: "禁し", wordKana: "きんし" },
  kesu: { word: "消す", wordKana: "けす" },
  suwaru: { word: "座る", wordKana: "すわる" },
  tatsu: { word: "立つ", wordKana: "たつ" },
  byouin: { word: "病院", wordKana: "びょういん" },
  ginkou: { word: "銀行", wordKana: "ぎんこう" },
  yuubinkyoku: { word: "ゆうびん局", wordKana: "ゆうびんきょく" },
  benri: { word: "便り", wordKana: "べんり" },
  toshokan: { word: "図しょ館", wordKana: "としょかん" },
  taberu: { word: "食べる", wordKana: "たべる" },
  nomu: { word: "飲む", wordKana: "のむ" },
  gohan: { word: "ご飯", wordKana: "ごはん" },
  ocha: { word: "お茶", wordKana: "おちゃ" },
  niku: { word: "肉", wordKana: "にく" },
  sakana: { word: "魚", wordKana: "さかな" },
  atsui: { word: "熱い", wordKana: "あつい" },
  tsumetai: { word: "冷たい", wordKana: "つめたい" },
  kau: { word: "買う", wordKana: "かう" },
  mise: { word: "店", wordKana: "みせ" },
  senen: { word: "千円", wordKana: "せんえん" },
  ichiban: { word: "いち番", wordKana: "いちばん" },
  ichiman: { word: "いち万", wordKana: "いちまん" },
  yasui: { word: "安い", wordKana: "やすい" },
  takai: { word: "高い", wordKana: "たかい" },
  isha: { word: "医者", wordKana: "いしゃ" },
  kusuri: { word: "薬", wordKana: "くすり" },
  karada: { word: "体", wordKana: "からだ" },
  atama: { word: "頭", wordKana: "あたま" },
  itai: { word: "痛い", wordKana: "いたい" },
  genki: { word: "元き", wordKana: "げんき" },
  yasumu: { word: "休む", wordKana: "やすむ" },
  kaisha: { word: "かい社", wordKana: "かいしゃ" },
  shigoto: { word: "仕事", wordKana: "しごと" },
  oshieru: { word: "教える", wordKana: "おしえる" },
  gakkou: { word: "学校", wordKana: "がっこう" },
  sensei: { word: "先せい", wordKana: "せんせい" },
  gakusei: { word: "がく生", wordKana: "がくせい" },
  kuukou: { word: "空港", wordKana: "くうこう" },
  eki: { word: "駅", wordKana: "えき" },
  densha: { word: "電車", wordKana: "でんしゃ" },
  yama: { word: "山", wordKana: "やま" },
  "tsuku-arrive": { word: "着く", wordKana: "つく" },
  shuppatsu: { word: "しゅっ発", wordKana: "しゅっぱつ" },
  "tomaru-stay": { word: "泊まる", wordKana: "とまる" },
  haha: { word: "母", wordKana: "はは" },
  chichi: { word: "父", wordKana: "ちち" },
  kazoku: { word: "家族", wordKana: "かぞく" },
  kekkon: { word: "結婚", wordKana: "けっこん" },
  tanjoubi: { word: "誕じょうび", wordKana: "たんじょうび" },
  okuru: { word: "送る", wordKana: "おくる" },
  jikan: { word: "時間", wordKana: "じかん" },
  gofun: { word: "ご分", wordKana: "ごふん" },
  han: { word: "半", wordKana: "はん" },
  hon: { word: "本", wordKana: "ほん" },
  ryoukin: { word: "料金", wordKana: "りょうきん" },
  aku: { word: "開く", wordKana: "あく" },
  shimaru: { word: "閉まる", wordKana: "しまる" },
});
```

- [ ] **Step 4: Run the validator and reconcile**

Run: `npx vitest run src/course/a2/kanji/a2ContextualWords.test.ts`

Expected: `4 passed`.

> If "gives every kanji sense a contextual word" fails, the catalog carries a sense slug this table does not. Read the printed slugs, look up their rows with `grep -n 'sense: "<slug>"' src/course/a2/kanji/a2KanjiCatalog.ts`, and add the word the glyph genuinely lives in, following the 交ぜ書き rule: kanji only for glyphs whose row shares that sense.
>
> If "contains each glyph's declared reading" fails, either the word is wrong or the row's `kana` is. `学` reads がく but surfaces as がっ in がっこう, `発` reads はつ but surfaces as ぱつ in しゅっぱつ, `口` reads くち but surfaces as ぐち in いりぐち, and `結` reads けつ but surfaces as けっ in けっこん — all four are covered by the documented alternations, so a failure here is a real error, not a tolerance gap.

- [ ] **Step 5: Commit the table and its gate**

```bash
git add src/course/a2/kanji/a2ContextualWords.ts src/course/a2/kanji/a2ContextualWords.test.ts src/course/a2/kanji/a2KanjiCatalog.ts
git commit -m "feat(a2): give every contextual kanji the word it lives in

98 words for 120 glyphs, written 交ぜ書き so no untaught glyph ever appears,
with a validator that proves each glyph's declared reading really occurs in
its own word (tolerating rendaku, handakuon and sokuon)."
```

- [ ] **Step 6: Surface the word in the exposure view**

In `src/course/a2/view/buildA2LessonViewModel.ts`, add the import:

```ts
import { A2_CONTEXTUAL_WORDS } from "../kanji/a2ContextualWords";
```

and extend the `views.push({...})` call (lines 133-144) with two fields, immediately after `romaji: reading.romaji,`:

```ts
      word: A2_CONTEXTUAL_WORDS[entry.senseSlug]?.word ?? entry.glyph,
      wordKana: A2_CONTEXTUAL_WORDS[entry.senseSlug]?.wordKana ?? reading.kana,
```

If the entry does not carry `senseSlug`, thread it: add `readonly senseSlug: string;` to the kanji entry type and populate it from `KanjiRow.sense` where entries are built (`grep -n "meaningCopyId:" src/course/a2/kanji/a2KanjiCatalog.ts` locates the builder). Add the same two fields to `A2KanjiExposureView`.

- [ ] **Step 7: Correct the false learner-facing copy**

In `src/course/i18n/en.ts`, replace lines 84-85:

```ts
    sectionIntro:
      "These kanji appear in this lesson's sentences. Recognize them in context — there is no writing to do.",
```

with:

```ts
    sectionIntro:
      "Each kanji is shown inside the word it belongs to. Recognize them there — the practice sentences stay in kana, and there is no writing to do.",
```

In `src/course/i18n/it.ts`, replace the matching lines with:

```ts
    sectionIntro:
      "Ogni kanji è mostrato dentro la parola a cui appartiene. Riconoscilo lì: le frasi di pratica restano in kana e non c'è nulla da scrivere.",
```

- [ ] **Step 8: Render the word instead of a bare glyph**

In `src/course/components/A2LessonPage.tsx`, inside `A2KanjiSection` (lines 138-190), pass the word and its kana to `KanjiRubyText` so the ruby sits over the whole word with the target glyph emphasized, replacing the bare-glyph render. Keep every existing assistance-policy prop untouched — only the text being rendered changes.

- [ ] **Step 9: Full verification**

Run: `npx vitest run && npx tsc --noEmit && npm run prebuild && npm run build`

Expected: all green, prebuild reports 120 kanji, build succeeds.

- [ ] **Step 10: Commit**

```bash
git add src/course/a2/view/buildA2LessonViewModel.ts src/course/components/A2LessonPage.tsx src/course/i18n/en.ts src/course/i18n/it.ts src/course/i18n/types.ts
git commit -m "fix(a2): show each kanji in its word and stop claiming it is in the sentences

The panel rendered a bare glyph, which kanjiTypes.ts explicitly forbids, under
copy asserting the glyph appears in the lesson's sentences. Zero of 806
sentences contain any ideograph. Both are now true."
```

---

## Task 27: Give the checkpoint a real surface

`CourseHome.tsx:305-312` renders a heading and a `role="status"` paragraph titled "Verifica A2" / "A2 checkpoint" with nothing to launch. Nothing in the app starts a checkpoint: `withCheckpointAttempt` (`ProgressContext.tsx:188-192`) records an attempt **automatically** once every checkpoint scenario lesson reaches `consolidatedAt`.

**Decision (locked as D6), with reasoning.** The honest fix is the cheap one: the evidence-driven design is correct, only the copy misdescribes it. A per-Can-do evidence breakdown **already exists** immediately above, in the `can-do-summary` section at `CourseHome.tsx:295-303`. So the checkpoint block is reworded to say how evidence accrues and to link to that breakdown, rather than inventing a launchable test the design deliberately does not have.

**Files:**
- Create: `src/course/components/CheckpointState.tsx`
- Create: `src/course/components/CheckpointState.test.tsx`
- Modify: `src/course/components/CourseHome.tsx:137-149, 305-312`
- Modify: `src/course/i18n/en.ts:55-61, 73-76`, `src/course/i18n/it.ts:73-77`, `src/course/i18n/types.ts:108-110`

- [ ] **Step 1: Write the failing component test**

Create `src/course/components/CheckpointState.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CheckpointState } from "./CheckpointState";

describe("CheckpointState", () => {
  it("explains how evidence accrues and links to the breakdown", () => {
    render(
      <CheckpointState
        heading="A2 checkpoint"
        body="Your checkpoint is met automatically once every scenario lesson is consolidated."
        linkLabel="See your Can-do evidence"
        linkHref="#can-do-summary"
        met={false}
      />,
    );
    expect(screen.getByRole("heading", { name: "A2 checkpoint" })).toBeInTheDocument();
    const link = screen.getByRole("link", { name: "See your Can-do evidence" });
    expect(link).toHaveAttribute("href", "#can-do-summary");
  });

  it("keeps the live region so the state change is announced", () => {
    render(
      <CheckpointState heading="A2 checkpoint" body="Met." linkLabel="See your Can-do evidence" linkHref="#can-do-summary" met />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Met.");
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run src/course/components/CheckpointState.test.tsx`

Expected: FAIL — `Failed to resolve import "./CheckpointState"`.

- [ ] **Step 3: Write the component**

Create `src/course/components/CheckpointState.tsx`:

```tsx
export interface CheckpointStateProps {
  readonly heading: string;
  readonly body: string;
  readonly linkLabel: string;
  readonly linkHref: string;
  readonly met: boolean;
}

/**
 * The checkpoint section of the course home.
 *
 * There is deliberately nothing to launch: a checkpoint is *evidence*, met
 * automatically once every scenario lesson is consolidated
 * (`ProgressContext.withCheckpointAttempt`). Before Phase 4 this section was
 * titled like a test the learner could sit, with no way to sit it. It now
 * says how the evidence accrues and links to the per-Can-do breakdown that
 * already renders above it.
 */
export function CheckpointState({ heading, body, linkLabel, linkHref, met }: CheckpointStateProps): JSX.Element {
  return (
    <section className="checkpoint-state" data-met={met ? "true" : "false"}>
      <h2>{heading}</h2>
      <p role="status">{body}</p>
      <a href={linkHref}>{linkLabel}</a>
    </section>
  );
}
```

- [ ] **Step 4: Run it and watch it pass**

Run: `npx vitest run src/course/components/CheckpointState.test.tsx`

Expected: `2 passed`.

- [ ] **Step 5: Rewrite the copy**

In `src/course/i18n/en.ts`, replace the `checkpoint` body strings so they describe accrual, and add the link label:

```ts
    notMet:
      "Your checkpoint is met automatically once every scenario lesson below is consolidated. There is no separate test to sit.",
    met: "Checkpoint met — every scenario lesson is consolidated.",
    evidenceLink: "See your Can-do evidence",
```

In `src/course/i18n/it.ts`, the same three:

```ts
    notMet:
      "La verifica si completa automaticamente quando ogni lezione scenario qui sotto è consolidata. Non c'è un test separato da sostenere.",
    met: "Verifica completata: tutte le lezioni scenario sono consolidate.",
    evidenceLink: "Vedi le prove dei tuoi Can-do",
```

Add `readonly evidenceLink: string;` to the checkpoint copy interface in `src/course/i18n/types.ts:108-110`.

- [ ] **Step 6: Use the component**

In `src/course/components/CourseHome.tsx`, give the existing Can-do summary section `id="can-do-summary"` (line 295), then replace the checkpoint markup at lines 305-312 with:

```tsx
      <CheckpointState
        heading={checkpointHeading}
        body={checkpointBody}
        linkLabel={copy.checkpoint.evidenceLink}
        linkHref="#can-do-summary"
        met={checkpointMet}
      />
```

using the existing heading/body selection at lines 137-149 unchanged, and import `CheckpointState` from `./CheckpointState`.

- [ ] **Step 7: Verify and commit**

Run: `npx vitest run && npx tsc --noEmit`

Expected: all green.

```bash
git add src/course/components/CheckpointState.tsx src/course/components/CheckpointState.test.tsx src/course/components/CourseHome.tsx src/course/i18n/en.ts src/course/i18n/it.ts src/course/i18n/types.ts
git commit -m "fix(ui): describe how the checkpoint is actually met

'Verifica A2' was a titled no-op with nothing to launch. It now states that
the checkpoint is met automatically when every scenario lesson consolidates,
and links to the per-Can-do evidence breakdown rendered directly above it."
```

---

## Task 28: Stop revealable kanji leaking their reading in rōmaji mode

`kanjiAssistancePolicy.ts:16-25` returns `{ furigana: "revealable", romaji: "allowed" }` for the revealable stage. A learner in rōmaji script mode therefore reads the answer next to the glyph, so the reveal-on-demand stage does nothing for them and the staged progression collapses from four stages to three.

**Decision (locked as D7), with reasoning.** Withhold the rōmaji at the revealable stage. The staging exists to make retrieval effortful; a script-mode preference must not silently opt a learner out of it. The reveal control still shows the reading on demand, so nothing becomes unreachable — it becomes *deliberate*, which is the point.

**Files:**
- Modify: `src/course/a2/kanji/kanjiAssistancePolicy.ts:22`
- Modify: `src/course/a2/kanji/kanjiAssistancePolicy.test.ts`

- [ ] **Step 1: Write the failing policy test**

Append to `src/course/a2/kanji/kanjiAssistancePolicy.test.ts`:

```ts
describe("revealable stage in romaji mode", () => {
  it("does not hand the reading over in romaji", () => {
    expect(kanjiAssistanceFor("revealable")).toEqual({ furigana: "revealable", romaji: "not-shown" });
  });

  it("still shows romaji at the two supported stages", () => {
    expect(kanjiAssistanceFor("first-supported").romaji).toBe("allowed");
    expect(kanjiAssistanceFor("supported-retrieval").romaji).toBe("allowed");
  });

  it("still withholds everything at the assessed stage", () => {
    expect(kanjiAssistanceFor("assessed")).toEqual({ furigana: "not-shown", romaji: "not-shown" });
  });
});
```

> Use whatever the module actually exports as its lookup — `grep -n "^export" src/course/a2/kanji/kanjiAssistancePolicy.ts` — and match the existing test file's stage-name spelling.

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run src/course/a2/kanji/kanjiAssistancePolicy.test.ts`

Expected: FAIL on the first case — received `romaji: "allowed"`.

- [ ] **Step 3: Change the policy**

At `src/course/a2/kanji/kanjiAssistancePolicy.ts:22`, change `romaji: "allowed"` to `romaji: "not-shown"` in the `revealable` branch, and update the branch's comment to:

```ts
    // Reveal-on-demand must be effortful in every script mode. Leaving romaji
    // on here handed the answer to any learner in romaji mode and collapsed
    // the four-stage progression to three for them.
```

- [ ] **Step 4: Run the whole kanji suite**

Run: `npx vitest run src/course/a2/kanji && npx vitest run src/course/components/KanjiRubyText.test.tsx`

Expected: all green. If a rendering test asserted romaji was present at the revealable stage, that assertion encoded the leak — update it to assert absence, exactly as Task 5 did for the assessed stage.

- [ ] **Step 5: Commit**

```bash
git add src/course/a2/kanji/kanjiAssistancePolicy.ts src/course/a2/kanji/kanjiAssistancePolicy.test.ts
git commit -m "fix(a2): withhold romaji at the revealable kanji stage

Romaji mode leaked the reading the reveal control exists to withhold,
collapsing the four-stage progression to three for those learners."
```

---

## Task 29: Make the level selector visible

The A1/A2 level selector at `CourseHome.tsx:246-250` is reachable but not discoverable — a learner who lands on the wrong level has no obvious way across.

**Files:**
- Modify: `src/course/components/CourseHome.tsx:246-250`
- Modify: `src/course/components/CourseHome.test.tsx`
- Modify: the stylesheet that `CourseHome.tsx` imports

- [ ] **Step 1: Write the failing visibility test**

Append to `src/course/components/CourseHome.test.tsx`:

```ts
it("puts the level selector in a labelled landmark before the lesson list", () => {
  renderCourseHome();
  const selector = screen.getByRole("group", { name: /level|livello/i });
  expect(selector).toBeInTheDocument();
  const list = screen.getByRole("list", { name: /lesson|lezion/i });
  expect(selector.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});
```

> `renderCourseHome()` is this file's existing helper. If it is named differently, reuse whatever the neighbouring tests call.

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run src/course/components/CourseHome.test.tsx -t "level selector"`

Expected: FAIL — no accessible `group` named "level".

- [ ] **Step 3: Wrap the selector in a labelled fieldset**

At `CourseHome.tsx:246-250`, wrap the two level buttons in:

```tsx
        <fieldset className="level-selector" aria-label={copy.home.levelSelectorLabel}>
          <legend>{copy.home.levelSelectorLabel}</legend>
          {/* existing level buttons, unchanged */}
        </fieldset>
```

Add `levelSelectorLabel: "Course level"` to `src/course/i18n/en.ts`, `levelSelectorLabel: "Livello del corso"` to `src/course/i18n/it.ts`, and `readonly levelSelectorLabel: string;` to the home copy interface in `src/course/i18n/types.ts`.

- [ ] **Step 4: Give it visual weight**

In the stylesheet `CourseHome.tsx` imports, add:

```css
.level-selector {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin: 0 0 1.5rem;
  padding: 0.75rem 1rem;
  border: 1px solid var(--surface-border, #d0d7de);
  border-radius: 8px;
}

.level-selector legend {
  padding: 0 0.35rem;
  font-weight: 600;
}
```

- [ ] **Step 5: Verify and commit**

Run: `npx vitest run src/course/components/CourseHome.test.tsx && npx tsc --noEmit`

Expected: all green.

```bash
git add src/course/components/CourseHome.tsx src/course/components/CourseHome.test.tsx src/course/i18n/ src/course/
git commit -m "fix(ui): make the A1/A2 level selector discoverable

It was reachable but visually unmarked, so a learner on the wrong level had
no obvious way across. Now a labelled fieldset above the lesson list."
```

---

## Task 30: Code-split the 1,027 kB main bundle

The production build emits a single ~1,027 kB main chunk with no code splitting, so a learner downloads both levels' entire catalogues before the home screen paints. Both level catalogues are pure data reachable from one entry point each, which makes them the natural split.

**Files:**
- Modify: `vite.config.ts`
- Create: `scripts/checkBundleBudget.ts`
- Modify: `package.json` (add the `check:bundle` script)

- [ ] **Step 1: Record the baseline**

Run: `npm run build 2>&1 | grep -E 'dist/assets/.*\.js'`

Expected: one dominant chunk near 1,027 kB. Write the exact number down; Step 5 compares against it.

- [ ] **Step 2: Write the failing budget check**

Create `scripts/checkBundleBudget.ts`:

```ts
/**
 * Fails the build when any single emitted JS chunk exceeds the budget.
 *
 * Phase 4 baseline was a single ~1,027 kB main chunk containing both level
 * catalogues, so the whole course downloaded before the home screen painted.
 */
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const MAX_CHUNK_BYTES = 500 * 1024;
const assetsDir = join(process.cwd(), "dist", "assets");

const oversized = readdirSync(assetsDir)
  .filter((name) => name.endsWith(".js"))
  .map((name) => ({ name, bytes: statSync(join(assetsDir, name)).size }))
  .filter((chunk) => chunk.bytes > MAX_CHUNK_BYTES)
  .sort((left, right) => right.bytes - left.bytes);

if (oversized.length > 0) {
  for (const chunk of oversized) {
    console.error(`chunk too large: ${chunk.name} = ${(chunk.bytes / 1024).toFixed(0)} kB (budget ${MAX_CHUNK_BYTES / 1024} kB)`);
  }
  process.exit(1);
}

console.log(`bundle budget OK — every chunk is under ${MAX_CHUNK_BYTES / 1024} kB`);
```

Add to `package.json` scripts:

```json
    "check:bundle": "vite-node scripts/checkBundleBudget.ts",
```

- [ ] **Step 3: Run it and watch it fail**

Run: `npm run build && npm run check:bundle`

Expected: exit code 1 with `chunk too large: index-<hash>.js = 1027 kB (budget 500 kB)`.

- [ ] **Step 4: Split the two level catalogues into their own chunks**

In `vite.config.ts`, add to the `build` options:

```ts
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes("/src/course/a1/")) return "course-a1";
          if (id.includes("/src/course/a2/")) return "course-a2";
          if (id.includes("/node_modules/react")) return "react";
          return undefined;
        },
      },
    },
```

- [ ] **Step 5: Run the build and the budget check**

Run: `npm run build && npm run check:bundle`

Expected: `bundle budget OK`. The output lists at least `course-a1`, `course-a2`, `react` and an entry chunk, each under 500 kB, with a combined size close to the Step 1 baseline.

> If `course-a2` alone is still over budget, split it again by adding `if (id.includes("/src/course/a2/content/")) return "course-a2-content";` above the existing A2 rule.

- [ ] **Step 6: Confirm nothing regressed at runtime**

Run: `npx playwright test`

Expected: the same pass/skip counts as before this task. Chunk splitting must not change behaviour; if any spec now fails, a module was split across a circular import boundary — narrow the `manualChunks` rules rather than accepting the failure.

- [ ] **Step 7: Commit**

```bash
git add vite.config.ts scripts/checkBundleBudget.ts package.json
git commit -m "perf: code-split the level catalogues and add a 500 kB chunk budget

The build shipped a single ~1,027 kB chunk containing both levels, so every
learner downloaded the whole course before the home screen painted."
```

---

## Task 31: Audit the 58 Playwright skips, one by one

58 Playwright tests are skipped. A skip is either a genuine environment constraint that should say so, or a disabled assertion that silently reduces coverage. Nobody can tell which without reading each one.

**Files:**
- Create: `docs/release/2026-07-18-playwright-skip-audit.md`
- Modify: the spec files identified in Step 1

- [ ] **Step 1: Enumerate every skip with its file and line**

Run:

```bash
grep -rn 'test\.skip\|test\.fixme\|describe\.skip\|it\.skip\|\.skip(' e2e tests 2>/dev/null | tee /tmp/skips.txt
wc -l /tmp/skips.txt
npx playwright test --list 2>&1 | tail -5
```

Expected: the skip sites, and a list total confirming 58 skipped.

- [ ] **Step 2: Create the audit record**

Create `docs/release/2026-07-18-playwright-skip-audit.md` with this exact structure and one row per skip:

```markdown
# Playwright skip audit — 2026-07-18

58 skipped tests, audited individually for the Phase 4 release.

| # | File:line | Test name | Verdict | Action |
| --- | --- | --- | --- | --- |
| 1 | `e2e/example.spec.ts:12` | example test name | environment / redundant / lost-coverage | kept with reason / deleted / re-enabled |
```

Each row's **Verdict** must be exactly one of:
- `environment` — the test cannot run here (browser/platform/network constraint). Action: keep, and make the skip carry the reason.
- `redundant` — another test covers the same behaviour. Action: delete the skipped test and name its replacement in the Action column.
- `lost-coverage` — the test asserts something real and nothing else does. Action: re-enable it and fix whatever it catches.

- [ ] **Step 3: Make every `environment` skip state its reason**

Every skip whose verdict is `environment` must carry a reason argument, so the runner prints why:

```ts
test.skip(({ browserName }) => browserName === "webkit", "Speech synthesis is unavailable in headless WebKit");
```

A bare `test.skip()` with no condition and no reason is not acceptable — replace it with either a conditional skip carrying a reason, or a deletion.

- [ ] **Step 4: Re-enable every `lost-coverage` skip and fix what it finds**

Remove the `.skip` and run the spec. If it fails, the skip was hiding a real defect: fix the defect. If it passes, it was skipped by inertia.

- [ ] **Step 5: Verify the final counts**

Run: `npx playwright test 2>&1 | tail -20`

Expected: the total skipped count is lower than 58, every remaining skip prints a reason, and no test fails.

- [ ] **Step 6: Commit**

```bash
git add docs/release/2026-07-18-playwright-skip-audit.md e2e
git commit -m "test(e2e): audit all 58 Playwright skips

Every remaining skip is conditional and states its reason; redundant skips
are deleted and skips that were hiding real coverage are re-enabled."
```

---

## Task 32: Cross-level regression sweep at A1

Section 22's original Phase 4 scope requires cross-level regression fixes, and Tasks 2, 3, 4, 23 and 30 all touched shared foundation code that A1 uses. This task proves A1 did not move except where intended.

**Files:**
- Create: `src/course/a1/catalog/a1ContentInvariants.test.ts`

- [ ] **Step 1: Port the content invariants to A1**

Create `src/course/a1/catalog/a1ContentInvariants.test.ts` with the same three cheap, level-agnostic gates the A2 harness runs, pointed at A1's realized surfaces:

```ts
/**
 * The level-agnostic content invariants, run against A1.
 *
 * A1 was never reviewed variant-by-variant the way A2 was in Phase 3, and
 * Phase 4 changed shared foundation code (release identity, the diversity
 * floor, exercise-kind rotation) that A1 consumes. These are the three A2
 * gates whose rules are purely structural, so they apply unchanged.
 */
import { describe, expect, it } from "vitest";

import { a1SemanticBuiltLessons } from "./a1LessonBuilders";

interface Row {
  readonly id: string;
  readonly jp: string;
  readonly en: string;
  readonly it: string;
}

const ROWS: readonly Row[] = a1SemanticBuiltLessons.flatMap((built) =>
  built.variants.map((variant) => ({
    id: variant.id,
    jp: variant.canonicalJapanese ?? "",
    en: built.en[`${variant.id}-translation`] ?? "",
    it: built.it[`${variant.id}-translation`] ?? "",
  })),
);

const TOPIC_BEFORE_INTERJECTION = /^[^、。]{1,10}は(すみません|ありがとうございます|ごめんなさい)/;
const POLITE_TAIL = /(です|ます|ません|でした|ました|ませんでした|ましょう)[かねよ]?$/;

describe("A1 content invariants", () => {
  it("never puts a topic in front of an interjection", () => {
    const offenders = ROWS.filter((row) => TOPIC_BEFORE_INTERJECTION.test(row.jp)).map((row) => `${row.id}: ${row.jp}`);
    expect(offenders).toEqual([]);
  });

  it("keeps one register per sentence", () => {
    const offenders = ROWS.filter((row) => {
      const clauses = row.jp.split("。").filter((clause) => clause.length > 0);
      if (clauses.length < 2) return false;
      const polite = clauses.map((clause) => POLITE_TAIL.test(clause));
      return polite.some(Boolean) && !polite.every(Boolean);
    }).map((row) => `${row.id}: ${row.jp}`);
    expect(offenders).toEqual([]);
  });

  it("gives every variant both glosses", () => {
    const offenders = ROWS.filter((row) => row.en.length === 0 || row.it.length === 0).map((row) => row.id);
    expect(offenders).toEqual([]);
  });
});
```

> If `a1SemanticBuiltLessons` is exported under a different name, mirror whatever `src/course/a1/catalog/a1RealizedIntegrity.test.ts` imports — that file already walks A1's realized surfaces and is the authority on the shape.

- [ ] **Step 2: Run it**

Run: `npx vitest run src/course/a1/catalog/a1ContentInvariants.test.ts`

Expected: `3 passed`. If any gate is red, A1 has the same class of defect A2 had; fix the offending variants exactly as Tasks 14 and 17 did before proceeding.

- [ ] **Step 3: Confirm A1's shipped surfaces did not drift**

Run:

```bash
npx vitest run src/course/a1
npx vite-node scripts/validateA1Release.ts
git --no-pager diff --stat origin/master -- src/course/a1/
```

Expected: all A1 tests green; the release validator exits 0; the diff against `origin/master` touches only `a1LessonBuilders.ts` (the round-two `choice` addition from Task 23) and `releaseIdentity` files (Task 3) — no content module.

- [ ] **Step 4: Commit**

```bash
git add src/course/a1/catalog/a1ContentInvariants.test.ts
git commit -m "test(a1): run the level-agnostic content invariants against A1

Phase 4 changed shared foundation code A1 consumes; these three structural
gates prove A1 carries none of the defect classes found at A2."
```

---

## Task 33: Record what Phase 4 deliberately did not do

Three findings were investigated, understood, and deliberately deferred. Recording them prevents the next reviewer from re-deriving them from scratch and prevents them from being quietly forgotten.

**Files:**
- Create: `docs/superpowers/backlog/2026-07-18-phase-4-deferred.md`

- [ ] **Step 1: Write the backlog record**

Create `docs/superpowers/backlog/2026-07-18-phase-4-deferred.md`:

```markdown
# Deferred after Phase 4 — 2026-07-18

Investigated during Phase 4, understood, and deliberately not done. Each entry
states what it is, why it was deferred, and what doing it would take.

## D-1. Kanji inside realized practice sentences

**Finding.** All 806 realized sentences are pure kana: 12,003 Japanese
characters, zero ideographs. The 120 contextual kanji therefore never appear
in a sentence the learner reads or practises. Phase 4 fixed the honesty gap
(Task 26: each glyph is now shown inside its own word, and the copy no longer
claims otherwise) but did not put kanji into the sentences.

**Why deferred.** It is not a test or a copy change, it is a catalogue-wide
authoring project with three coupled parts:
1. Every `SemanticValueTokenFragment` in `a2SemanticCatalog.ts` would need a
   kanji orthography alongside its kana, for the glyphs taught so far and only
   those — so the orthography is *stage-dependent*, not fixed.
2. The tile-ordering and completion token models split on fragments; a
   script-aware renderer would have to keep answer normalization stable across
   script modes so the same answer is correct in kana, kanji and rōmaji.
3. It must be reconciled with the hiragana-first writing policy and the
   existing four-stage assistance policy.

**What it would take.** A phase of its own, with a per-stage orthography
resolver and a golden regenerated per stage.

## D-2. The general "no invented gloss content" invariant

**Finding.** Phase 4 shipped C7, a curated locative gate covering the two
high-value cases (`in the sea` without うみ, `here` without ここ). The general
rule — no gloss fragment without a corresponding Japanese source — is not
implemented.

**Why deferred.** The catalogue carries glosses per *variant*, not per
*fragment*, so there is nothing to align a gloss fragment against. A general
invariant needs per-fragment gloss authoring across the whole value catalogue,
which is a content project, not a test.

**What it would take.** Extend `SemanticValueTokenFragment` with `glossEn` and
`glossIt`, author them for every fragment, then derive the variant gloss by
composition and assert that the authored gloss is a permutation of the derived
one.

## D-3. A1 variant-by-variant linguistic review

**Finding.** A2's 806 variants were reviewed individually in Phase 3. A1's were
not. Phase 4 Task 32 ran the three level-agnostic structural gates against A1
and found nothing, but structural gates cannot find a wrong collocation, a
wrong honorific or a gloss that overclaims.

**Why deferred.** It is a review of the same size as the A2 review that
produced this dossier, and Phase 4's scope was already amended once.

**What it would take.** The same four-reviewer protocol used for A2, plus the
adjudication step that separated genuine defects from inflated ones.
```

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/backlog/2026-07-18-phase-4-deferred.md
git commit -m "docs: record the three findings Phase 4 deliberately deferred"
```

---

## Task 34: Standards-language review against the four cited sources

Section 21.4 item 10 and Section 3.2 require every learner-facing claim to be checked against four named sources. Section 3.2 also states the design "does not copy Irodori's curriculum, texts, or assessment and does not claim Japan Foundation approval" — that is the specific claim this review has to falsify or confirm.

The four sources:

1. https://www.irodori.jpf.go.jp/en/about.html
2. https://www.jpf.go.jp/e/project/japanese/teach/tsushin/news/202105.html
3. https://www.coe.int/en/web/common-european-framework-reference-languages/level-descriptions
4. https://www.coe.int/en/web/common-european-framework-reference-languages/table-1-cefr-3.3-common-reference-levels-global-scale

**Files:**
- Create: `docs/release/2026-07-18-standards-language-review.md`

- [ ] **Step 1: Extract every learner-facing standards claim**

Run:

```bash
grep -rn 'A1\|A2\|CEFR\|Irodori\|Japan Foundation\|JF Standard\|Can-do\|can-do' src/course/i18n/en.ts src/course/i18n/it.ts | tee /tmp/claims-copy.txt
grep -rn 'aligned with\|in linea con' src/course/a1/catalog/canDos.ts src/course/a2/catalog/canDos.ts | wc -l
```

Expected: the i18n grep lists every string a learner can read that mentions a level or a standard; the second command counts the Can-do descriptors carrying the "aligned with A2-level outcomes" tail.

- [ ] **Step 2: Read all four sources**

Open each of the four URLs and read the level definitions and any usage/attribution statements. Record, for each source, the exact sentence that supports or contradicts a claim in `/tmp/claims-copy.txt`.

- [ ] **Step 3: Write the review record**

Create `docs/release/2026-07-18-standards-language-review.md`:

```markdown
# Standards-language review — 2026-07-18

Required by Section 21.4 item 10 and Section 3.2 of the master design
specification. Every learner-facing claim that mentions a level, a framework
or a curriculum, checked against the four cited sources.

## Sources consulted

| # | Source | Read on |
| --- | --- | --- |
| 1 | Irodori: What is "Japanese for Life in Japan"? — https://www.irodori.jpf.go.jp/en/about.html | 2026-07-18 |
| 2 | Japan Foundation: Irodori overview, level mapping, Can-dos, contextual kanji — https://www.jpf.go.jp/e/project/japanese/teach/tsushin/news/202105.html | 2026-07-18 |
| 3 | Council of Europe: CEFR level descriptions — https://www.coe.int/en/web/common-european-framework-reference-languages/level-descriptions | 2026-07-18 |
| 4 | Council of Europe: CEFR global scale — https://www.coe.int/en/web/common-european-framework-reference-languages/table-1-cefr-3.3-common-reference-levels-global-scale | 2026-07-18 |

## Claim-by-claim findings

| Claim (verbatim) | Where | Source checked | Verdict | Action |
| --- | --- | --- | --- | --- |

Verdicts are exactly one of `supported`, `overclaims`, `understates`,
`unattributed`. Every `overclaims` and every `unattributed` row must have a
concrete action, and that action must be applied in this task, not deferred.

## Attribution check

Section 3.2 requires that the product does not copy Irodori's curriculum,
texts or assessment, and does not claim Japan Foundation approval.

- Curriculum: [finding]
- Texts: [finding]
- Assessment: [finding]
- Approval/endorsement language: [finding]

## Outcome

[One paragraph: whether the shipped learner-facing language is defensible
against all four sources, and what changed as a result of this review.]
```

Fill every bracketed section from the reading in Step 2. A bracketed placeholder left in the committed file is a failed review.

- [ ] **Step 4: Apply every corrective action**

For each row whose verdict is `overclaims` or `unattributed`, change the copy in `src/course/i18n/en.ts` and `src/course/i18n/it.ts` (or `canDos.ts`) in the same commit as the review, and add the corrected wording to the Action column.

- [ ] **Step 5: Verify and commit**

Run: `npx vitest run && npx tsc --noEmit`

Expected: green. Copy changes may break i18n parity tests; those tests are correct — fix the copy, not the test.

```bash
git add docs/release/2026-07-18-standards-language-review.md src/course/i18n/
git commit -m "docs: standards-language review against the four Section 3.2 sources"
```

---

## Task 35: The Section 21.4 eleven-item release verification

Every one of the eleven items has to be executed and its output recorded. This is the gate the release passes through.

**Files:**
- Create: `docs/release/2026-07-18-phase-4-release-verification.md`

- [ ] **Step 1: Item 1 — clean dependency installation**

Run:

```bash
rm -rf node_modules
npm ci
```

Expected: completes with no `ERR!`, and reports the number of packages added.

- [ ] **Step 2: Item 2 — the complete unit and property test suite**

Run: `npx vitest run 2>&1 | tail -20`

Expected: every test file passes. Record the file and test totals; they must be at least the 190 files / 3684 tests baseline plus the tests this plan added.

- [ ] **Step 3: Item 3 — TypeScript and the standard production build**

Run: `npx tsc --noEmit && npm run build`

Expected: no output from `tsc`; the build prints its chunk list and succeeds.

- [ ] **Step 4: Item 4 — the complete Playwright suite and reviewed screenshots**

Run:

```bash
npx playwright test 2>&1 | tail -20
ls -la test-results 2>/dev/null || true
```

Expected: zero failures. Open every screenshot the run produced and confirm each shows the surface it claims to. Record the pass/skip counts and confirm the skip count matches Task 31's audited total.

- [ ] **Step 5: Item 5 — the `GITHUB_PAGES=true` production build**

Run: `GITHUB_PAGES=true npm run build`

Expected: succeeds. Then confirm the base path is applied:

```bash
grep -o 'src="[^"]*"' dist/index.html
```

Expected: every asset src is prefixed with the Pages base path, not a bare `/assets/...`.

- [ ] **Step 6: Item 6 — local Pages-base-path smoke test**

Run:

```bash
npx vite preview --port 4173 &
sleep 3
curl -sS -o /dev/null -w '%{http_code}\n' http://localhost:4173/nihongo-practice/
```

Expected: `200`. Open the URL, load an A1 lesson and an A2 lesson, complete one exercise in each, and confirm no 404 appears in the browser console. Stop the preview with `kill <pid>` using the PID the shell printed.

- [ ] **Step 7: Item 7 — production and full dependency audits**

Run:

```bash
npm audit --omit=dev
npm audit
```

Expected: record both results verbatim. Any `high` or `critical` in the production audit blocks the release and must be resolved before Task 36.

- [ ] **Step 8: Item 8 — generated per-lesson, per-module and per-level content QA reports**

Section 21.4 item 8 requires *generated reports*, not validator exit codes. `a1ReportMarkdown()` (`src/course/a1/catalog/reports.ts:321`) and `a2ReportMarkdown()` (`src/course/a2/catalog/reports.ts:421`) already render exactly those tables, but nothing writes them to disk — they are reachable only from `reports.test.ts`. So this item has never actually produced an artifact. Create the generator.

Create `scripts/generateContentReports.ts`:

```ts
/**
 * Generator for the per-lesson / per-module / per-level content QA reports
 * required by Section 21.4 item 8 of the master design specification.
 *
 * `a1ReportMarkdown` and `a2ReportMarkdown` already render the tables; before
 * Phase 4 nothing wrote them anywhere, so item 8 of the release checklist had
 * no artifact to point at. This script writes both, deterministically, so the
 * release record can cite a committed file instead of a test run.
 *
 * Run: `npx vite-node scripts/generateContentReports.ts`
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { a1ReportMarkdown } from "../src/course/a1/catalog/reports";
import { a2ReportMarkdown } from "../src/course/a2/catalog/reports";

const outputDir = fileURLToPath(new URL("../docs/release/content-reports/", import.meta.url));
mkdirSync(outputDir, { recursive: true });

const artifacts: readonly (readonly [string, string])[] = [
  ["a1-content-report.md", a1ReportMarkdown()],
  ["a2-content-report.md", a2ReportMarkdown()],
];

for (const [name, markdown] of artifacts) {
  const path = `${outputDir}${name}`;
  writeFileSync(path, markdown.endsWith("\n") ? markdown : `${markdown}\n`, "utf8");
  console.log(`generateContentReports: wrote ${markdown.split("\n").length} lines to ${path}`);
}
```

Run:

```bash
npx vite-node scripts/generateContentReports.ts
npx vite-node scripts/validateA1Release.ts
npx vite-node scripts/validateA2Release.ts
npx vite-node scripts/lintA2NoJapanese.ts
```

Expected: the generator prints two `wrote N lines to …` lines and the three validators exit 0. Open both generated reports and confirm each contains a per-lesson table, a per-module table and a per-level row. Record the per-level rows verbatim in the verification document, and commit the generator together with its two artifacts:

```bash
git add scripts/generateContentReports.ts docs/release/content-reports/
git commit -m "chore(release): generate per-lesson/module/level content QA reports

Section 21.4 item 8 asked for generated reports; the renderers existed but
nothing wrote them to disk. This script does, so the release record cites a
committed artifact rather than a test run."
```

- [ ] **Step 9: Item 9 — alias, secret, workflow-trigger and external-request inspection**

Run:

```bash
grep -n 'alias' vite.config.ts tsconfig.json
grep -rniE 'api[_-]?key|secret|token|password|bearer ' src scripts --include='*.ts' --include='*.tsx' | grep -v '\.test\.' || echo "no secret-like literals"
grep -n 'on:' -A 4 .github/workflows/deploy-pages.yml
grep -rnE 'fetch\(|XMLHttpRequest|new WebSocket|navigator\.sendBeacon|https?://' src --include='*.ts' --include='*.tsx' | grep -v '\.test\.' || echo "no external requests"
```

Expected, and each is a Section 20 privacy requirement:
- aliases resolve only inside the repository;
- no secret-like literal outside test fixtures;
- `deploy-pages.yml` triggers on `workflow_dispatch` only, with the `Require master` guard intact;
- **no** `fetch`, `XMLHttpRequest`, `WebSocket`, `sendBeacon` or absolute `http(s)://` request in shipped source. Documentation URLs inside comments are fine; a runtime request is a release blocker.

- [ ] **Step 10: Item 11 — final tracked-content and Git status review**

Run:

```bash
git status --short
git --no-pager log --oneline origin/master..HEAD
git --no-pager diff --stat origin/master...HEAD
```

Expected: `git status --short` prints nothing. The log lists exactly the commits this plan created. Read the whole `--stat` and confirm no file outside the plan's file-structure map was touched.

- [ ] **Step 11: Record every result**

Create `docs/release/2026-07-18-phase-4-release-verification.md`. Every item gets the same four fields, written out in full — no item may be elided or cross-referenced to another item. A section left with an empty `Command:` or `Output:` is a failed verification, not a shortcut.

```markdown
# Phase 4 release verification — 2026-07-18

Section 21.4 of the master design specification, all eleven items.

Verified at commit: <exact 40-character SHA of HEAD>

## 1. Clean dependency installation
Command: npm ci
Output: <verbatim final lines, including the package count>
Verdict: pass / fail

## 2. Complete unit and property test suite
Command: npx vitest run
Output: <verbatim "Test Files ... Tests ..." summary lines>
Verdict: pass / fail

## 3. TypeScript and standard Vite production build
Command: npm run build
Output: <verbatim tsc result and the vite build chunk table>
Verdict: pass / fail

## 4. Complete Playwright suite and reviewed screenshots
Command: npx playwright test
Output: <verbatim pass/skip counts>
Screenshots reviewed: <list each screenshot file and what it shows>
Verdict: pass / fail

## 5. GITHUB_PAGES=true production build
Command: GITHUB_PAGES=true npm run build
Output: <verbatim vite output; confirm asset URLs carry the /nihongo-practice/ base>
Verdict: pass / fail

## 6. Local Pages-base-path smoke tests
Command: npx vite preview --base /nihongo-practice/ then curl the base path
Output: <verbatim HTTP status and the asset paths found in the served HTML>
Verdict: pass / fail

## 7. Production and full dependency audits
Command: npm audit --omit=dev ; npm audit
Output: <verbatim severity table from each>
Verdict: pass / fail

## 8. Generated per-lesson/module/level content QA reports
Command: npx vite-node scripts/generateContentReports.ts ; npx vite-node scripts/validateA1Release.ts ; npx vite-node scripts/validateA2Release.ts ; npx vite-node scripts/lintA2NoJapanese.ts
Output: <verbatim generator output plus the per-level row from each generated report>
Verdict: pass / fail

## 9. Alias, secret, workflow-trigger and external-request inspection
Command: <the exact grep/inspection commands run>
Output: <verbatim results; confirm no secrets, no non-dispatch triggers, no runtime external requests>
Verdict: pass / fail

## 10. Standards-language review against Section 3 sources
Command: manual review, recorded separately
Output: see `docs/release/2026-07-18-standards-language-review.md` (Task 34)
Verdict: pass / fail

## 11. Final tracked-content and Git status review
Command: git status --short ; git --no-pager diff --stat origin/master
Output: <verbatim; the working tree must be clean and every tracked change accounted for>
Verdict: pass / fail

## Overall verdict
<Release or do not release, and the reasoning, referencing the item numbers above.>
```

> Section 21.4 closes with "No aggregate word, verb, lesson, or exercise count is sufficient by itself." Do not substitute a count for any item's evidence.

- [ ] **Step 12: Commit**

```bash
git add docs/release/2026-07-18-phase-4-release-verification.md
git commit -m "docs: Section 21.4 eleven-item release verification for Phase 4"
```

---

## Task 36: Merge, deploy at an exact SHA, and verify the live site

The deployment workflow is `workflow_dispatch`-only and refuses any ref other than `master` (`deploy-pages.yml:19-23`), so the release is: merge to `master`, capture the exact SHA, dispatch, then verify that the SHA is what is live.

**Files:**
- Modify: `docs/release/2026-07-18-phase-4-release-verification.md`

- [ ] **Step 1: Merge to master**

```bash
git checkout master
git pull --ff-only
git merge --no-ff <this-branch> -m "Phase 4: release hardening, content correctness and curriculum expansion"
```

Expected: a clean merge. If it conflicts, resolve on the feature branch, re-run Task 35, and merge again — never resolve a content conflict directly on `master`.

- [ ] **Step 2: Re-verify on master before pushing**

Run: `npm ci && npx vitest run && npx tsc --noEmit && npm run prebuild && npm run build`

Expected: all green. The merge commit is a new tree; it has not been verified until it is verified.

- [ ] **Step 3: Push and capture the exact SHA**

```bash
git push origin master
git --no-pager rev-parse HEAD
```

Record the full 40-character SHA. Every step below refers to it as the release SHA.

- [ ] **Step 4: Dispatch the deployment at that SHA**

```bash
gh workflow run "Deploy GitHub Pages" --ref master
gh run list --workflow "Deploy GitHub Pages" --limit 1
```

Expected: a run appears. Watch it:

```bash
gh run watch $(gh run list --workflow "Deploy GitHub Pages" --limit 1 --json databaseId --jq '.[0].databaseId')
```

Expected: `validate-ref`, `build` and `deploy` all succeed.

- [ ] **Step 5: Confirm the deployed SHA is the release SHA**

```bash
gh run list --workflow "Deploy GitHub Pages" --limit 1 --json headSha,conclusion,url
```

Expected: `headSha` equals the release SHA from Step 3 exactly, and `conclusion` is `success`. A mismatch means something else was deployed — stop and investigate before verifying anything on the live site.

- [ ] **Step 6: Verify the live site**

```bash
curl -sS -o /dev/null -w '%{http_code}\n' https://unsafecode.github.io/nihongo-practice/
```

Expected: `200`. Then, in a browser on the live URL:

1. Load the home screen and confirm the level selector is a visible, labelled control (Task 29).
2. Switch to A1, open a lesson, complete one exercise.
3. Switch to A2, open `connected-conversation-3`, and confirm the corrected clarify lines read as vocative address, not as a topic before an interjection (Task 14).
4. Open `travel-reservations-4` and confirm the front desk is addressed as フロント, not 店員さん (Task 15).
5. Open any A2 lesson with a kanji panel and confirm each glyph is shown inside its word, and that the intro copy no longer claims the kanji appear in the sentences (Task 26).
6. Switch to rōmaji script mode on a lesson at the revealable kanji stage and confirm no reading is shown until revealed (Task 28).
7. Open the course home and confirm the checkpoint section describes how evidence accrues and its link scrolls to the Can-do breakdown (Task 27).
8. Open the browser network panel, reload, and confirm every request is to the Pages origin — no third-party request of any kind (Section 20).
9. Open one of the four synthesis lessons and confirm it reads as a two-speaker scene (Task 25).

- [ ] **Step 7: Record the deployment**

Append to `docs/release/2026-07-18-phase-4-release-verification.md`:

```markdown
## Deployment

- Release SHA: <40-character SHA>
- Workflow run: <URL from `gh run list --json url`>
- Deployed headSha matches release SHA: yes
- Live URL: https://unsafecode.github.io/nihongo-practice/
- Live verification (nine checks above): all pass / list of failures
- Verified on: 2026-07-18
```

- [ ] **Step 8: Commit the deployment record**

```bash
git add docs/release/2026-07-18-phase-4-release-verification.md
git commit -m "docs: record the Phase 4 Pages deployment and live verification"
git push origin master
```

- [ ] **Step 9: Final state check**

Run:

```bash
git status --short
git --no-pager log --oneline -3
```

Expected: `git status --short` prints nothing, and `HEAD` is the deployment-record commit on `master`.

---

## Self-review

Run this against the master specification with fresh eyes before handing the plan over.

### Spec coverage

| Spec requirement | Task |
| --- | --- |
| §3.1 alignment bounds — learner-facing level claims | 34 |
| §3.2 four reference sources, claim-by-claim | 34 |
| §3.2 no Irodori copying, no Japan Foundation approval claim | 34 (attribution check) |
| §20 privacy — no external requests, no analytics | 35 item 9, 36 step 6.8 |
| §20 deployment — `workflow_dispatch` only, master-only | 35 item 9, 36 steps 4-5 |
| §21.4 item 1 clean dependency installation | 35 step 1 |
| §21.4 item 2 complete unit/property suite | 35 step 2 |
| §21.4 item 3 TypeScript and Vite production build | 35 step 3 |
| §21.4 item 4 Playwright suite and reviewed screenshots | 35 step 4, 31 |
| §21.4 item 5 `GITHUB_PAGES=true` build | 35 step 5 |
| §21.4 item 6 local Pages-base-path smoke tests | 35 step 6 |
| §21.4 item 7 production and full dependency audits | 35 step 7 |
| §21.4 item 8 per-lesson/module/level QA reports | 35 step 8 |
| §21.4 item 9 alias/secret/workflow/external-request inspection | 35 step 9 |
| §21.4 item 10 standards-language review | 34, referenced from 35 |
| §21.4 item 11 tracked-content and Git status review | 35 step 10, 36 step 9 |
| §22 Phase 4 — QA and claims review | 34, 35 |
| §22 Phase 4 — cross-level regression fixes | 3, 32 |
| §24.2 A4.1 exercise variety | 23, 24 |
| §24.2 A4.2 synthesis connected discourse | 25 |
| §24.2 A4.3 content correctness | 14, 15, 16, 17, 18, 19, 20, 21 |
| §24.2 A4.4 new deterministic validators | 6, 7, 8, 9, 10, 11, 12, 13, 26 (C8) |
| §24.2 A4.5 kanji honesty | 26, 28, 33 (D-1) |
| §24.3 out of scope — recorded, not silently skipped | 33 |
| §24.4 amended exit criteria | 21, 23, 25, 26, 35 |
| Dossier I-1 single release identity | 2, 3 |
| Dossier I-2 non-tautological diversity floor | 4 |
| Dossier M-1 kana-reading assertion | 5 |
| Dossier §4.1 ungated defect classes | 6-13, 26 |
| Backlog: bundle size | 30 |
| Backlog: 58 Playwright skips | 31 |

Every requirement maps to a task. The three findings this plan deliberately does not resolve — kanji inside realized sentences, the general gloss-alignment invariant, and a variant-by-variant A1 linguistic review — are recorded in Task 33 rather than left unstated.

### Placeholder scan

Run:

```bash
grep -nEi 'TBD|to be determined|implement later|similar to task|add appropriate|fill in the|as needed|and so on|etc\.\.\.|\.\.\.$' docs/superpowers/plans/2026-07-18-a1-a2-phase-4-release.md
```

Result when run against this plan: a single match, on the line above, which is the scan pattern itself. There are no placeholders in the plan. The two template documents (Tasks 34 and 35) were rewritten during this self-review so that every field is spelled out per item rather than elided with `...`, and each carries an explicit rule that a field left empty is a failed verification, not a shortcut.

Two things this scan cannot catch were checked by hand:

- **Stale cross-task references.** Every `Task N` reference in the prose was re-read against the final numbering. Four were stale after the task list settled (the `interrogative` documentation task, the golden-regeneration note, the kanji validator, and the reported-speech commit message, which described a fix Task 14 had explicitly rejected) and all four were corrected.
- **The file-structure map.** It listed seven created files when the tasks actually create sixteen, and named two files (`kanjiWords.ts`, `module14Synthesis.ts`) that no task touches. It was rewritten to match the tasks exactly.

### Type consistency

These names are introduced in one task and used in others. They must match exactly.

| Name | Introduced | Used by |
| --- | --- | --- |
| `A2_RELEASE_CATALOG_VERSION`, `A2_RELEASE_SEED` | 2 (imported from `releaseIdentity.ts`) | 2, 3 |
| `minFamilies` | 4 (declared floor of 1) | 4 |
| `predicateSemanticType` | 7 | 7, 9 |
| `serviceTitleContexts` | 9 | 9, 15 |
| `comparableDimensions`, `comparisonDimension` | 12 | 12, 25 (step 4 note) |
| `ROWS`, `valueById` (harness) | 6 | 7, 8, 9, 10, 11, 12, 13 |
| `A2_CONTEXTUAL_WORDS`, `A2ContextualWord`, `word`, `wordKana` | 26 | 26 |
| `rotateKinds`, `kindOffset` | 23 | 23 |
| `CheckpointState`, `evidenceLink` | 27 | 27 |
| `levelSelectorLabel` | 29 | 29 |
| `A2_ROUND_TWO_KINDS` | 23 (adds `choice`) | 24 (adds `transformation`) |

`A2_ROUND_TWO_KINDS` is edited twice, by Task 23 and again by Task 24; Task 24 Step 3 states this explicitly and quotes the post-Task-23 line it replaces, so the tasks compose in order.

The comparison fields are named `comparableDimensions` / `comparisonDimension` in Task 12 and everywhere they are referenced. This sentence is the only other place the earlier drafting names `comparableClasses` / `requiredComparableClass` appear; they are named here purely so a reader who saw an earlier draft knows they were renamed, and they must not be used in any code.

`ROWS` is defined twice, once in Task 6 for the A2 harness and once in Task 32 for the separate A1 harness. They are different files with different row shapes — Task 32's `Row` carries only `id`, `jp`, `en`, `it`, because the three level-agnostic gates need nothing more.

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-18-a1-a2-phase-4-release.md`. Two execution options:

1. **Subagent-Driven (recommended)** — a fresh subagent per task, review between tasks, fast iteration. Use `superpowers:subagent-driven-development`.
2. **Inline Execution** — execute tasks in one session with checkpoints for review. Use `superpowers:executing-plans`.

Tasks 1-13 must run in order: the gates land before the content they protect, so every content fix in Tasks 14-21 is guarded the moment it is made. Task 21 must not run until Tasks 14-20 are all complete, because it regenerates the drift lock. Tasks 34-36 must run last, in order.
