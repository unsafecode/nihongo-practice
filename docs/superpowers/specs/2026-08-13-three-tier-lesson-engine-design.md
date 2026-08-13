# Three-tier lesson engine and experience redesign

**Status:** Approved design
**Date:** 2026-08-13
**Repository:** `unsafecode/nihongo-practice`
**Baseline:** deployed `master` at `7dc24c7b0b8e5e7cfed8a2b4beeaa7c6cb164f39`
**Supersedes:** `2026-08-06-base-level-curriculum-redesign.md` and
`2026-08-04-a1-foundations-curriculum-design.md` where they define lesson
structure, level naming, lesson granularity, and the naturalness review process.
Their content inventories remain authoritative as **source material**.

---

## 1. Problem

The deployed product teaches correct material, but it presents it as a printed
workbook rendered in HTML.

Observed on the live lesson `#/percorso/polite-verbs/polite-verbs-4`:

- One uninterrupted vertical scroll with no pacing.
- Vocabulary rendered as ~25 visually identical rows.
- Practice collected into ~10 visually identical boxes at the very bottom, after
  all teaching.
- All 144 lessons across Base, A1, and A2 use the same six sections in the same
  order: Rule, Vocabulary, Grammar, Examples, Practice, Recap.
- Each lesson covers 1-2 concepts and takes roughly five minutes.

Three consequences follow:

1. **No rhythm.** The learner reads everything, then practises everything. There
   is no alternation, no focus, no sense of moving through a session.
2. **No differentiation.** Nothing distinguishes a lesson about sounds from a
   lesson about requests. The container flattens the subject.
3. **Trivial units.** A five-minute, two-concept lesson reads as elementary
   school material to an adult learner, regardless of the quality of its content.

Structurally, the codebase solves the same problem three times: `src/course/base`,
`src/course/a1`, and `src/course/a2` each carry their own catalog, forms, view
model, and components. Introducing differentiated lesson formats on top of that
duplication would multiply it further.

## 2. Goals

- A lesson is a **session**, not a page: 15-25 minutes, a coherent thematic block
  covering several connected concepts.
- Lessons **differ structurally** from one another according to what they teach.
- The path feels **gradual and pleasant**, without ever feeling remedial.
- The interface looks **contemporary and appropriate to the subject**, not like a
  photocopied handout.
- One lesson engine, not one per level.

## 3. Non-goals

- The Advanced tier. Out of scope; the architecture must not preclude it.
- Full CEFR B1/B2 coverage, JLPT preparation, or academic reading.
- Active kanji production. Kanji stays recognition-only with furigana, as today.
- Rewriting content from scratch. Existing verified material is reused.
- Any change to the deployment model. Static GitHub Pages, hash routing, no
  server, no learner accounts.

## 4. Information architecture

### 4.1 Tiers

The product exposes three learner-facing tiers with plain names. CEFR labels
disappear from the interface entirely.

| Tier | Composition | Status |
|---|---|---|
| **Base** | current Base (10 modules / 40 lessons) fused with A1 (11 / 44) | rebuilt in this work |
| **Intermedio** | current A2 (15 / 60), migrated and extended | phase 2 |
| **Avanzato** | — | out of scope |

Internal level identifiers remain stable to avoid breaking stored progress:
`base` absorbs `a0` and `a1`; `intermedio` absorbs `a2`. A migration shim maps
legacy progress keys and legacy routes to their new destinations.

### 4.2 Content hierarchy

```
Tier
 └── Unit            thematic, 4-6 lessons, one narrative arc
      └── Lesson     15-25 min, one archetype, several connected concepts
           └── Step  1-3 min, one typed interaction or presentation
```

`Unit` replaces the current `Module`. Route shape is unchanged in form —
`#/percorso/<unitId>/<lessonId>` — so the router, deep links, and the static
deployment model need no rework; only the identifiers change, and every legacy
identifier gains a redirect (§6.1).

The 84 fused Base lessons collapse into
**28-32 lessons across 7-8 units**. Total study time increases from roughly seven
hours to roughly ten, while the number of navigation targets falls by two thirds.

## 5. Engine architecture

New package `src/course/engine/`, neutral with respect to tier.

### 5.1 Three layout modes

The runner provides three chrome treatments. Everything else is shared.

| Mode | Chrome | Used by |
|---|---|---|
| `stage` | centred single focus, large Japanese, progress rail, no distractions | immersion, listening, checkpoint |
| `editorial` | two columns: section rail on the left, richly typeset content on the right | new-block teaching |
| `workbench` | content left, persistent right panel with microphone, hints, pronunciation feedback | sentence workshop, spoken roleplay |

### 5.2 Step kinds

A bounded, closed set of typed steps. Each is one component plus one payload
shape.

| Kind | Purpose |
|---|---|
| `hook` | opens the lesson with a concrete situation and the can-do |
| `rule` | states one rule, with its boundary and a counter-example |
| `lexBatch` | introduces 4-6 lexemes with audio, never a long flat list |
| `guidedBuild` | assembles a sentence part by part with scaffolding that fades |
| `examples` | worked examples with literal and natural translation |
| `dialogueScene` | plays a scene; the learner listens before analysing |
| `comprehension` | checks meaning captured from the scene |
| `breakdown` | dismantles a line from the scene into its parts |
| `transform` | applies a form change to a given sentence |
| `listen` | audio-only recognition |
| `shadow` | repeat-after-audio with pronunciation feedback |
| `dictation` | writes what was heard, in kana |
| `roleplayTurn` | one spoken turn in a scripted conversation |
| `debrief` | reviews what the learner produced |
| `quiz` | mixed retrieval across the lesson |
| `recap` | closes with what was learned and what comes next |
| `reference` | links to persistent reference material |

Adding a step kind is a deliberate act: it requires a component, a payload type,
a validator, and a test. The set is expected to stay near this size.

### 5.3 Archetypes

An archetype is **a recipe of step kinds plus a layout mode**. It carries no
rendering logic of its own.

```ts
interface Archetype {
  id: ArchetypeId;
  layout: LayoutMode;
  phases: readonly PhaseSpec[];   // ordered; each admits certain step kinds
  minSteps: number;
  maxSteps: number;
}
```

| Archetype | Layout | Shape |
|---|---|---|
| `new-block` | editorial | hook → rule → lexBatch × n → guidedBuild → examples → quiz → recap |
| `immersion` | stage | dialogueScene → comprehension → breakdown → guidedBuild → recap |
| `workshop` | workbench | hook → transform × n → guidedBuild → quiz |
| `listening` | stage | listen → shadow → dictation → listen → recap |
| `roleplay` | workbench | hook → roleplayTurn × n → debrief → recap |
| `checkpoint` | stage | quiz × n drawn from prior units, spaced by first-teach distance |

A lesson that does not conform to its archetype's phase specification fails
validation at build time.

### 5.4 Lesson model

```ts
interface Lesson {
  id: LessonId;
  unitId: UnitId;
  archetype: ArchetypeId;
  title: LocalizedText;
  canDo: LocalizedText;
  steps: readonly Step[];
  teaches: readonly ConceptId[];   // first taught here
  requires: readonly ConceptId[];  // must already be taught
  lexemes: readonly LexemeId[];
  estimateMinutes: number;         // derived from steps; asserted within 12..28
}
```

`estimateMinutes` is computed from step estimates, never hand-written. The
**design target is 15-25 minutes**; the **enforced bound is 12-28**, which leaves
authoring room at the edges without permitting a five-minute stub. A lesson
outside the enforced bound fails validation — this is the mechanical guarantee
that no lesson regresses to a two-concept stub.

### 5.5 Runner

`LessonRunner` owns: step sequencing, the progress rail, keyboard navigation,
resume-where-you-left-off, per-step persistence, and the transition animation.
It is the only component that knows about step ordering. Step components receive
their payload and a completion callback, and know nothing about their position.

## 6. Content strategy

Content is **reused and recomposed**, not rewritten. The existing corpus — 186
Base lexemes, 414 examples, 62 dialogue turns, the A1 inventories, the form
engines (`verbForms`, `adjectiveForms`, `particleLicensing`) — is the source
material for the new lessons.

New writing is limited to three categories:

1. **Bridges** between concepts that were previously taught in separate lessons
   and are now fused into one block.
2. **Long dialogues** for the immersion archetype, which needs scenes longer than
   the current 3-6 turn exchanges.
3. **Roleplay scenarios**, which do not exist today.

### 6.1 Coverage guarantee

`src/course/engine/migration/baseFusion.ts` holds an explicit mapping from every
legacy Base and A1 lesson to its destination lesson. A test asserts:

- every legacy `ConceptId` is taught in exactly one new lesson;
- every legacy `LexemeId` appears in at least one new lesson;
- no new lesson requires a concept taught later than itself;
- every legacy route resolves, via redirect, to a live destination.

Failure of any assertion fails the build. This is the safeguard against silently
losing material during fusion.

## 7. Visual design

The current palette reads as photocopied paper. It is replaced by a system
derived from the subject matter.

| Token | Value | Role |
|---|---|---|
| `--ink` | `#14181f` | primary text, stage chrome |
| `--ink-soft` | `#3d4654` | secondary text |
| `--paper` | `#faf8f4` | page ground |
| `--surface` | `#ffffff` | cards |
| `--accent` | `#c8382f` | 朱色 vermilion: actions, current position |
| `--accent-cool` | `#1d6d6a` | secondary signals, correctness |
| `--gold` | `#b8894a` | pull-quotes, rules |

Typography: Noto Sans JP for Japanese, system sans for interface, a genuine
modular type scale. Japanese is set large enough to read comfortably — it is the
subject, not an annotation.

Motion: step transitions carry direction so progress is felt. All motion respects
`prefers-reduced-motion`.

Accessibility: existing commitments are retained without exception — keyboard
operability, visible focus, live regions for audio state, no colour-only
signalling.

Note on furigana: the engine does **not** use `KanjiRubyText`. That component is
coupled to the A2 kanji *assessment* model (it requires a `KanjiExposure` plus
assessment copy), not a general ruby renderer. Base and the Phase 0 pilot are
hiragana-only, so no furigana renderer is needed. Kanji presentation is an
Intermedio question and is deferred to Phase 2.

## 8. Review process change

The per-entry naturalness ledger is **retired**. This removes:

- `src/course/base/review/naturalnessLedger.ts` and its test;
- the aggregate approval record `BASE_NATURALNESS_REVIEW_APPROVAL`;
- corpus fingerprint pinning and fail-closed staleness detection;
- the external-acceptance reporting path in `scripts/validateBaseRelease.ts`.

**Rationale.** Review found real defects and is retained. The *ceremony* around
it — a 4,946-entry cryptographic acceptance ledger, fingerprint pinning, and a
release gate that could fail on a stale hash — cost weeks, gated releases on
procedure rather than on quality, and twice caused CI failures unrelated to any
learner-visible defect.

**Replacement.** Two mechanisms:

1. **Automated invariants**, which are ordinary tests and run on every commit:
   schema conformance, particle licensing, verb and adjective form correctness,
   dictionary consistency between Japanese and both translations, absence of
   orphan references, archetype conformance, lesson duration bounds, and the
   coverage guarantee of §6.1.
2. **A human spot-check per unit**, recorded as a dated note in
   `docs/reviews/`. Prose, not a data structure. It does not gate the build.

Audio follows the same principle: the 86 pending canonical items stop being a
release-blocking ledger and become a spot-check item. The honest statement that
audio has not received systematic human-ear verification stays visible in the
release notes.

## 9. Testing

Existing infrastructure is kept: Vitest for unit and integration, Playwright for
end-to-end and visual regression.

Additions:

- **Archetype conformance** — every lesson matches its recipe.
- **Duration bounds** — every lesson lands within 12-28 minutes.
- **Coverage** — §6.1 assertions.
- **Step contract tests** — each step kind renders, completes, and reports.
- **Runner tests** — sequencing, resume, keyboard, reduced motion.
- **Visual regression** — one baseline per layout mode, desktop and mobile.

Playwright baselines for A2 remain frozen until phase 2 touches that tier.

## 10. Phasing

Each phase ends in a deployable state.

### Phase 0 — Foundations

Design tokens, application shell, `LessonRunner`, the step-kind kit, and two
archetypes (`new-block`, `immersion`) exercised on **one real pilot lesson**
built from existing Base material. Reachable behind a route alongside the current
experience. The pilot is judged on appearance and feel before anything is
migrated.

### Phase 1 — Base

Fusion of Base and A1 into 28-32 lessons across 7-8 units, all six archetypes,
unit checkpoints, the rebuilt path screen, legacy route redirects, progress
migration. A2 untouched and reachable throughout. The naturalness ledger is
removed in this phase.

### Phase 2 — Intermedio

A2 migrated onto the engine and extended: longer scenes, more roleplay, richer
connective grammar. Old `base`/`a1`/`a2` engines deleted once nothing references
them.

### Phase 3 — Finishing

Audio pass, accessibility audit, bundle budget tightening, performance.

## 11. Risks

| Risk | Mitigation |
|---|---|
| Bundle growth; largest chunk is already 462 kB against a 500 kB budget | per-lesson dynamic import and route-level splitting from phase 0; budget check stays in CI |
| Content lost during fusion | coverage test of §6.1 fails the build |
| Two engines coexisting during phases 0-1 | legacy routes stay live and tested; redirects added, never removed early |
| Archetype variety becomes visual chaos | three layout modes only; a closed step-kind set; shared tokens |
| Scope creep back toward multi-week review loops | review is prose and does not gate the build |
| Progress loss for the existing learner | progress key migration with a test over legacy keys |

## 12. Open questions

None blocking. Two deferred to phase 2:

- Whether Intermedio introduces active kanji production or keeps recognition-only.
- Whether the Advanced tier is defined by CEFR or by scenario coverage.
