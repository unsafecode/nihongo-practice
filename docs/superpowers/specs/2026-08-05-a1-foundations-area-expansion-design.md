# A1 Foundations Area Expansion Design

**Status:** Approved for implementation
**Date:** 2026-08-05
**Repository:** `unsafecode/nihongo-practice`
**Baseline:** deployed `master` at `5c864b8`
**Delivery:** follow-up branch and pull request; do not depend on PR #3

## 1. Correction

The deployed rebuild improved the instructional structure of every A1 lesson,
but it did not satisfy the request for a substantial Foundations area. It
renamed and deepened four existing introduction lessons instead of extending
the course.

This change adds a real **Fondamentali / Foundations** area containing **16 new
lessons in four new modules** before the existing Presentations module. The A1
course grows from 12 modules / 48 lessons to **16 modules / 64 lessons**.
Existing lesson IDs remain stable.

## 2. Course structure

The A1 map gains visible area groupings:

1. **Suoni / Sounds** — the existing four phonetic lessons.
2. **Fondamentali / Foundations** — four new modules, sixteen new lessons.
3. **Situazioni quotidiane / Everyday situations** — the existing
   Presentations through Existence/Needs modules.
4. **Sintesi / Synthesis** — the existing four capstones.

The existing `introductions` module returns to the learner-facing title
**Presentazioni / Introductions**. It remains after Foundations and becomes
scenario practice that applies known foundations while adding new vocabulary.

## 3. Foundations modules and lessons

### 3.1 `sentence-foundations` — How a Japanese sentence works

| Lesson ID | Outcome |
|---|---|
| `sentence-foundations-1` | Put the predicate at the end and read a sentence as information chunks |
| `sentence-foundations-2` | Establish a topic, then omit the known subject naturally |
| `sentence-foundations-3` | Use `わたし`, names, and titles; understand why `あなた` is limited |
| `sentence-foundations-4` | Build a short identity exchange with explicit and omitted reference |

### 3.2 `topic-questions` — Topic, identity, and questions

| Lesson ID | Outcome |
|---|---|
| `topic-questions-1` | Use `は` + `です` for identity and role |
| `topic-questions-2` | Contrast topic `は` with focus/grammatical subject `が` |
| `topic-questions-3` | Form questions with `か` and use `だれ`, `なに／なん`, and `どこ` |
| `topic-questions-4` | Ask for and give clarification in a short dialogue |

### 3.3 `polite-verbs` — Verbs and polite non-past

| Lesson ID | Outcome |
|---|---|
| `polite-verbs-1` | Treat dictionary form as the lookup lemma and recognize godan, ichidan, `する`, and `くる` only as needed |
| `polite-verbs-2` | Use polite non-past affirmative `ます` with object `を` |
| `polite-verbs-3` | Use polite non-past negative `ません` and contrast it with `ます` |
| `polite-verbs-4` | Contrast action-place `で` with destination `に` in practical actions |

### 3.4 `time-movement` — Time, past forms, and movement

| Lesson ID | Outcome |
|---|---|
| `time-movement-1` | Use time `に` in a simple schedule |
| `time-movement-2` | Use polite past affirmative `ました` |
| `time-movement-3` | Use polite past negative `ませんでした` |
| `time-movement-4` | Contrast destination `に／へ` and transport `で` in a short travel dialogue |

Every lesson uses the deployed six-part contract:

1. Goal and situation
2. 4–6 genuinely new words
3. Explicit grammar or sound note
4. 2–3 worked examples or a mini-dialogue with audio
5. Four generated activities plus speaking/listening
6. Recap with meanings/forms and retrieval cue

## 4. Content boundaries

### 4.1 New content, not duplicated declarations

The sixteen lessons are new catalog entries with new stable IDs, routes,
Can-do mappings, models, transfers, practice blueprints, and localized copy.
They are not aliases or alternate views over the existing introduction lessons.

Core words that must first appear in Foundations, such as `わたし`, are moved
to their actual first Foundations lesson. Any existing lesson that previously
declared those words as new receives different practical vocabulary used by its
own models. The global introduce-once validator remains strict.

### 4.2 Semantic source discipline

New Japanese and romaji are authored only as canonical semantic values. Lesson
records reference value, family, variant, lexeme, and note IDs. Localized word
meanings remain independent from sentence translations.

The new lessons reuse proven families where correct. A new family or rule is
added only when the required beginner structure cannot be represented honestly
with an existing family.

### 4.3 Spiral into existing modules

Later modules no longer pretend to introduce foundations already taught:

- Presentations applies sentence shape, reference, `は／です`, questions, and
  polite verbs in first-meeting situations.
- Essential Questions expands question functions and clarification.
- Actions broadens object, place, recipient, and companion patterns.
- Routines and Past/Negative deepen time and tense/polarity.
- Places expands movement particles and routes.

Later lessons still introduce 4–6 new scenario words and retain their practical
Can-dos.

## 5. Course-map area model

A1 modules gain a locale-independent area ID:

```ts
type A1AreaId = "sounds" | "foundations" | "situations" | "synthesis";

interface A1CourseArea {
  readonly id: A1AreaId;
  readonly moduleIds: readonly string[];
  readonly titleCopyId: string;
  readonly descriptionCopyId: string;
}
```

The A1 Course Map renders accessible area sections in canonical order. Each
area has one localized heading and concise description, followed by its module
cards. A2 remains on its current course-map presentation unless shared typing
requires a behavior-preserving compatibility change.

The Foundations area must be visually unmistakable as an area, not merely four
adjacent cards. It uses semantic headings and grouping, not color alone.

## 6. Manifest and validator changes

The canonical A1 manifest becomes:

```text
sounds
sentence-foundations
topic-questions
polite-verbs
time-movement
introductions
essential-questions
actions
routines
past-negative
places
people
descriptions
shopping
existence-needs
capstones
```

All sixteen modules keep exactly four lessons. The release gate changes from
12×4/48 to **16×4/64**, with 60 semantic lessons and four phonetic lessons.

The existing curriculum validator continues to fail on:

- duplicate or missing module/lesson IDs;
- non-canonical order;
- missing area membership or a module appearing in multiple areas;
- vocabulary outside 4–6 for non-capstones;
- duplicate introduction or future lexical/grammar use;
- unresolved bilingual copy;
- invalid worked examples/dialogues;
- invalid five-activity practice blueprints;
- repeated visible targets or cloned review retrieval;
- progress aliases/migrations targeting missing lessons.

Reports expand to 64 canonical rows and measure the production activity
distribution.

## 7. Progress and route migration

Existing lesson and module IDs do not change. Existing visits, attempts,
accepted exercises, Can-do evidence, checkpoint attempts, review entries,
orphans, timestamps, and A2 progress are preserved.

The progress schema remains V4 and the catalog revision advances from
`a1-a2-v2` to `a1-a2-v3`. Migration:

- preserves every existing evidence field;
- recognizes the sixteen new lessons as initially unvisited;
- keeps a valid existing `lastVisitedLessonId`, so returning learners resume
  where they were instead of being forced backward;
- recommends the first unvisited Foundations lesson for a fresh learner or a
  learner without a recognized continuation;
- reconciles active reviews against current definitions and preserves removed
  keys as explicit orphans;
- remains pure, deterministic, idempotent, level-scoped, and fail-closed on
  future versions.

Existing lesson deep links and legacy aliases remain valid. The sixteen new
routes use `/percorso/:moduleId/:lessonId`.

## 8. Can-dos and checkpoint

Add four product-authored A1 Can-dos:

1. build a short predicate-final sentence and omit known information;
2. identify people and ask simple identity/location questions;
3. use basic polite present affirmative/negative actions;
4. say when/where an action happens and distinguish present/past polarity.

Each new lesson has one primary Can-do and at most the existing allowed number
of supporting Can-dos. The A1 checkpoint samples the new foundations Can-dos
without claiming certification or requiring the learner to repeat all sixteen
lessons.

## 9. Accessibility and visual acceptance

The area and all sixteen lessons must pass:

- semantic area/module/lesson headings and lists;
- keyboard, touch, and visible-focus parity;
- truthful audio statuses;
- 44×44 px controls;
- text labels for particles/endings/functions;
- reduced motion;
- no whole-page horizontal overflow at desktop, mobile, 200% zoom, and 320 px;
- IT/EN and hiragana/romaji coverage.

Add visual baselines for:

- the A1 Course Map showing the complete Foundations area;
- `sentence-foundations-1`;
- `time-movement-4`.

All PNGs must be opened and judged for hierarchy, clipping, wrapping,
distinguishable areas, lesson density, and controls.

## 10. Completion criteria

The expansion is complete only when:

- the live A1 map shows a distinct 16-lesson Foundations area before
  Presentations;
- all sixteen new routes render complete authored lessons;
- every production A1 lesson passes first-use, grammar, practice, locale, and
  review validators;
- progress V2→V3 migration preserves all existing evidence;
- full Vitest, TypeScript, build/prebuild, bundle budget, and full Playwright
  pass;
- visual baselines have been opened and accepted;
- fresh whole-range spec, pedagogy, accessibility, progress, leakage, A2-scope,
  and code-quality reviews have no findings;
- a new pull request is opened, merged only after gates pass, and Pages is
  deployed and live-verified.
