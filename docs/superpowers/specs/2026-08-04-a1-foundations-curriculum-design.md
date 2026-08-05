# A1 foundations curriculum rebuild design

**Status:** Approved for implementation
**Date:** 2026-08-04
**Repository:** `unsafecode/nihongo-practice`
**Baseline:** `master` at `f3c7de7`
**Delivery:** Independent curriculum branch; do not merge, deploy, or depend on PR #3

## 1. Decision

Rebuild the A1 learner contract around explicit vocabulary, grammar, worked
examples, and varied retrieval while preserving the current semantic
realization engine, stable lesson IDs, practical Can-do situations, browser
speech, bilingual copy, and hiragana-first presentation.

The integrated A1 course remains one sequence. Grammar and vocabulary are not
separate tracks: they are explicit prerequisites inside each practical lesson.
A2 content is frozen. Shared code may receive compatibility changes, but no A2
lesson content is migrated in this work.

## 2. Problem and evidence

The release catalog currently proves semantic references, prerequisite IDs,
sentence realization, transfer, and recurrence, but those facts are not a
learner-facing explanation:

- `A1LessonPage` labels a section as a rule but renders only a Can-do sentence
  and `SentenceMatrix`.
- A1 concept records are identifiers required by realization rules, not
  localized explanations of meaning, use, construction, or common mistakes.
- sentence translations exist, but lexical tokens have no canonical localized
  meaning surface; recap therefore shows kana and romaji without meanings.
- the shared instructional kit deterministically creates two five-target
  rounds, so different widgets still produce a narrow, repetitive path.
- review stores and replays the failed exercise definition rather than varying
  the retrieval operation.

Catalog correctness is necessary, but it does not establish instructional
sequencing. The new release gate must validate what a learner sees and in what
order.

## 3. Product principles

1. Teach practical, non-business Japanese for real conversation.
2. Keep speech and model audio prominent without claiming pronunciation
   grading.
3. Keep Japanese source data locale-independent, hiragana-first, and compatible
   with the existing romaji setting.
4. Keep Italian and English structurally complete and equivalent.
5. Introduce words and grammar before any sentence, dialogue, or exercise that
   uses them.
6. Explain a small amount, model it, then retrieve it in several genuinely
   different ways.
7. Preserve stable lesson routes and progress whenever the learning objective
   remains a safe match.
8. Fail closed at authoring/prebuild time; never hide incomplete content behind
   a successful UI state.

## 4. Scope

### 4.1 Included

- all 44 semantic A1 lessons and the four phonetic lessons under the same visible
  instructional order;
- a learner-visible foundations sequence across the earliest existing A1
  modules;
- canonical localized word meanings and verb forms;
- localized learner-facing grammar concepts;
- worked examples and mini-dialogues with audio;
- a five-activity practice ladder per semantic lesson;
- varied review retrieval;
- exhaustive production-catalog validation;
- progress/deep-link compatibility;
- responsive, accessible A1 lesson UI;
- focused visual baselines for an early foundations lesson and a migrated
  scenario lesson.

### 4.2 Excluded

- new A2 curriculum or A2 editorial migration;
- PR #3's Sentence Matrix visual restyle;
- cloud accounts, adaptive generation, AI grading, or a backend;
- pronunciation, accent, or fluency scoring;
- changing the existing long-vowel romanization policy;
- merging to `master` or deploying the site.

## 5. Alternatives considered

### 5.1 Selected: enrich the existing A1 semantic catalog

Keep the 12-module, 48-lesson manifest and stable IDs. Add small, explicit
instructional catalogs keyed by those IDs, reduce the A1 learner-facing
practice selection to four generated exercises plus one spoken/listening
activity, and validate the new layer against realized production sentences.

This approach preserves routes, progress, Can-dos, and the no-answer-leak
architecture while correcting the learner experience across the whole level.

### 5.2 Rejected: add a separate grammar course

A second track would make grammar optional, duplicate progress/navigation, and
disconnect forms from the situations in which learners need them.

### 5.3 Rejected: add a new module and rename most early lessons

A thirteenth module would force avoidable route/progress migration and still
leave later lessons without canonical glosses or practice-function validation.
The current early modules can carry the required progression safely.

## 6. A1 sequence

The sound module remains first because learners need kana and audio support.
The next modules become a visible `Fondamenta` progression without changing
their stable IDs.

| Existing module | Learner-facing role in the rebuilt sequence |
|---|---|
| `sounds` | Sound/kana foundations with 4-6 familiar anchor words, meanings, audio, and contrastive practice |
| `introductions` | Learner-facing `Fondamenta: frasi e presentazioni`: sentence shape, predicate-final order, subject omission, `わたし`, limited/natural `あなた`, `は` + `です`, then dictionary lemma versus polite `ます` |
| `essential-questions` | `か`, `だれ`, `なに／なん`, `どこ`, reciprocal questions, and an initial `は`/`が` contrast |
| `actions` | Polite non-past affirmative, object `を`, action-place `で`, recipient/goal `に`, and practical subject omission |
| `routines` | Time `に`, schedule language, frequency, and connected routine turns |
| `past-negative` | `ます`/`ません`, `ました`/`ませんでした`, including nearest-form contrasts |
| `places` | destination `に`/`へ`, transport/action-place `で`, source/limit, and route questions |
| `people` | names, natural reference without repeated pronouns, family/social roles, and shared actions |
| `descriptions` | predicate descriptions, preferences, comparison, and immediate conditions |
| `shopping` | prices, quantities, choices, and polite requests |
| `existence-needs` | `が` with existence, location relations, needs, and practical resolution |
| `capstones` | no new words or grammar; recombination in four real situations |

The first four semantic lessons have the following minimum progression:

1. `introductions-1`: Japanese predicate-final shape; topic + identity;
   `わたし`; subject/topic omission after context; why repeated pronouns sound
   unnatural; `あなた` only when a name/title or omission is not available.
2. `introductions-2`: `は` + `です` for origin/role and a first contrast between
   an explicit topic and an omitted known topic.
3. `introductions-3`: dictionary form as the learner's lookup lemma, polite
   `ます` in context, and only the verb-class/irregular information needed to
   understand the taught forms.
4. `introductions-4`: a short reciprocal mini-dialogue combining identity,
   question `か`, and natural omission before the dedicated question module.

Later concepts are introduced incrementally. No lesson presents `は`, `が`,
`を`, `で`, `に`, and `へ` as one unexplained list.

## 7. Authored data boundaries

### 7.1 Canonical lexeme surface

Create `src/course/a1/curriculum/lexicon.ts` with immutable entries:

```ts
interface A1Lexeme {
  readonly id: string;
  readonly valueIds: readonly SemanticValueId[];
  readonly kana: string;
  readonly romaji: string;
  readonly category:
    | "pronoun"
    | "person"
    | "noun"
    | "verb"
    | "adjective"
    | "question-word"
    | "time"
    | "expression";
  readonly meaning: { readonly en: string; readonly it: string };
  readonly verb?: {
    readonly dictionary: { readonly kana: string; readonly romaji: string };
    readonly polite: { readonly kana: string; readonly romaji: string };
    readonly class: "godan" | "ichidan" | "irregular";
  };
}
```

`valueIds` connects the learner-facing entry to the existing semantic source of
truth. Japanese and romaji are checked against the referenced semantic values;
they are not independently accepted as a second realizable answer source.

Every A1 lesson owns an ordered `newLexemeIds` list. Phonetic and instructional
lessons introduce 4-6 genuinely new lexemes; phonetic lexemes are familiar
anchor words used to make sound/reading contrasts meaningful. Synthesis lessons
encode a reviewed zero-new-lexeme exception with a reason. No other exception
is valid without an explicit reason and validator coverage. A lexeme may be
introduced only once.

Every referenced lexeme has non-empty Italian and English meanings. Verbs also
have a dictionary lemma, the polite form used in context, and a class. The
lesson UI shows meanings by default; only a learner control may hide them.

### 7.2 Learner-facing grammar concepts

Create `src/course/a1/curriculum/grammar.ts` with reusable concepts:

```ts
interface A1GrammarConcept {
  readonly id: string;
  readonly requiredConceptIds: readonly string[];
  readonly title: Bilingual;
  readonly meaning: Bilingual;
  readonly use: Bilingual;
  readonly construction: Bilingual;
  readonly typicalMistake: Bilingual;
  readonly subjectOmissionNote?: Bilingual;
  readonly pattern: readonly GrammarPatternToken[];
  readonly nearestContrastId?: string;
}
```

Pattern tokens identify lexical slots, particles, and endings structurally.
Particle and ending tokens have visible text labels as well as styling, so
meaning never depends on color.

The catalog covers, at minimum:

- predicate-final sentence shape and omission;
- natural personal reference (`わたし`, names/titles, limited `あなた`);
- topic `は` and polite copula `です`;
- questions with `か` and core question words;
- dictionary versus polite verb form;
- godan, ichidan, and `する`/`くる` only to the depth needed for the forms shown;
- `は`, `が`, `を`, `で`, `に`, and `へ`, each introduced separately and later
  contrasted;
- `ます`, `ません`, `ました`, and `ませんでした`;
- the later A1 adjective, preference, quantity, request, existence, and location
  constructions already present in the semantic catalog.

### 7.3 Per-lesson instructional content

Create `src/course/a1/curriculum/lessons.ts`, using small helpers and module
tables rather than one component or one object per screen:

```ts
interface A1LessonContent {
  readonly lessonId: LessonId;
  readonly situation: Bilingual;
  readonly prerequisiteLessonIds: readonly LessonId[];
  readonly prerequisiteConceptIds: readonly string[];
  readonly newLexemeIds: readonly string[];
  readonly vocabularyException?: {
    readonly kind: "phonetic" | "synthesis";
    readonly reason: Bilingual;
  };
  readonly learningNoteId: string;
  readonly workedExampleVariantIds: readonly [string, string] | readonly [
    string,
    string,
    string,
  ];
  readonly dialogue?: {
    readonly turnVariantIds: readonly [string, string] | readonly [
      string,
      string,
      string,
    ];
  };
  readonly practiceBlueprint: A1PracticeBlueprint;
  readonly retrievalCue: Bilingual;
}
```

For semantic lessons, `learningNoteId` resolves an `A1GrammarConcept`. For
phonetic lessons it resolves a localized sound/reading note with the same
title, explanation, pattern, typical-mistake, and prerequisite shape but no
invented grammar claim. Synthesis lessons resolve a recap/contrast note over
already-taught concepts. The UI therefore keeps one stable ordered section
contract without pretending kana practice or synthesis introduces new grammar.

Worked examples and dialogues reference existing semantic variants. Their
Japanese, romaji, tokens, and natural translations are resolved through the
production view-model pipeline. They never duplicate a canonical answer.

### 7.4 Practice function versus widget kind

Add a cognitive-function classification independent from the interaction
widget:

```ts
type A1PracticeFunction =
  | "meaning-comprehension"
  | "form-discrimination"
  | "controlled-production"
  | "transformation"
  | "contextual-response"
  | "listening-speaking";

interface A1PracticeActivity {
  readonly id: string;
  readonly function: A1PracticeFunction;
  readonly interactionKind: ExerciseKind | "spoken";
  readonly targetRef: { readonly round: "one" | "two"; readonly index: number }
    | { readonly spokenVariantId: string };
}

interface A1PracticeBlueprint {
  readonly activities: readonly [
    A1PracticeActivity,
    A1PracticeActivity,
    A1PracticeActivity,
    A1PracticeActivity,
    A1PracticeActivity,
  ];
}
```

Each A1 lesson exposes exactly five activities:

1. meaning comprehension;
2. form discrimination;
3. controlled production (sentence construction in semantic lessons; sound or
   word construction in phonetic lessons);
4. transformation or contextual response;
5. listening/speaking.

This gives every lesson meaning, form, production, and audio/speech while
allowing the fourth operation to vary across the course. Phonetic blueprints
use their existing contrastive engine behind the same function contract;
semantic blueprints use the sentence exercise engine. Function and visible
target may not repeat consecutively, and no visible target may repeat within a
lesson.

The A1 shared-kit configuration selects two targets in each generated round
instead of five, and the phonetic authoring contract likewise exposes four
generated targets plus its spoken/listening target instead of 8-12 repeated
refs. A2 retains its existing selection counts. The blueprint orders the four
generated exercises and the spoken activity for presentation.

### 7.5 Feedback and review

Generated A1 exercise models carry the blueprint function plus localized
accepted/retry explanations. Feedback is shown only after submission and names
the relevant grammar concept and one assessed lexeme/form; it never exposes an
answer before an attempt.

A review entry continues to store semantic IDs and the original definition ID,
but review resolution must choose a deterministic activity with:

- a different cognitive function from the failed activity;
- overlapping assessed concept or lexeme IDs;
- a different visible target key;
- stable output for the catalog version and review key.

If no safe alternate exists, the review item is explicitly unresolvable; the
system never silently clones the failed exercise.

## 8. Learner-visible lesson order

A1 gets six section anchors while A2 keeps its current four:

1. `rule` — concrete Can-do, real situation, and visible prerequisites;
2. `vocabulary` — 4-6 new words, all meanings/forms visible, audio per item;
3. `grammar` — localized grammar capsule and visual pattern;
4. `comparison` — 2-3 tokenized worked examples or a mini-dialogue with audio,
   word-level gloss, natural translation, and optional `Esplora il pattern`
   Sentence Matrix;
5. `explore` — the five-activity practice ladder;
6. `recap` — meanings/forms and a retrieval cue.

The old `rule`, `comparison`, `explore`, and `recap` anchor IDs remain valid.
`vocabulary` and `grammar` are additions, so existing deep links do not break.
The A1 lesson rail uses localized learner labels; no section containing only a
matrix is called `Regola`.

First exposure never hides translation or gloss. A local learner-controlled
toggle may hide/show meanings after they have rendered. Audio controls use the
existing browser speech hook and report unavailable/failure states truthfully.

## 9. Validation

Extend the A1 release gate with attributed error codes. It must fail when:

1. a phonetic or instructional lesson has fewer than four or more than six new
   lexemes;
2. a zero-new-lexeme lesson lacks the exact synthesis exception;
3. a lexeme is introduced twice or used before its introduction;
4. a used semantic value has no canonical lexeme or either locale meaning;
5. a verb lacks dictionary form, contextual polite form, class, or a form
   explanation;
6. a grammar concept is used before all prerequisites or has missing IT/EN
   title, meaning, use, construction, or typical-mistake copy;
7. a grammar example references future lexical or grammar content;
8. a dialogue turn references future content;
9. a lesson has fewer than four cognitive functions or lacks meaning, form,
   production, or listening/speaking;
10. consecutive functions duplicate, a visible target repeats, or an interaction
    kind does not match its blueprint reference;
11. worked examples are not 2-3 resolvable variants with token glosses and
    natural IT/EN translations;
12. the declared UI section order differs from overview, vocabulary, grammar,
    examples, practice, recap;
13. a review alternate clones the failed function or visible target;
14. A1 route aliases or progress mappings point to missing lessons.

Validation analyzes the realized production catalogs, not fixtures or declared
totals alone. Reports include per-lesson new-word count, first-use closure,
grammar prerequisites, practice-function distribution, interaction-kind
distribution, and repeated-target findings.

## 10. Progress and route compatibility

No current A1 lesson ID changes. Existing visited/practiced/consolidated
evidence therefore remains attached to the same practical lesson.

The progress catalog version advances to an A1 curriculum revision while the
schema remains V4 unless stored shape changes. Existing review items are
re-resolved through the new varied-review algorithm. Items whose old exercise
definition no longer exists remain explicit orphans and are never silently
discarded.

The existing v2.1 route aliases and V3-to-V4 lesson mappings remain tested.
Adding the two section anchors does not invalidate old hashes.

## 11. Components and data flow

```text
A1 lesson ID
  -> A1LessonContent
     -> lexicon entries
     -> grammar concept
     -> worked-example variant IDs
     -> practice blueprint
  -> existing FoundationCatalogs realization
     -> localized tokenized examples
     -> four generated exercise prompts
     -> spoken target
  -> A1 lesson view model
  -> ordered semantic sections
```

UI components remain small:

- `A1LessonOverview`
- `A1VocabularySection`
- `A1GrammarCapsule`
- `A1WorkedExamples`
- existing `SentenceMatrix` behind an optional pattern disclosure
- `A1PracticeLadder`
- `A1LessonRecap`
- a shared A1 audio button using `useSpeech`

Catalog modules own data; components own presentation only. The existing
realizer remains the only source of sentence Japanese and romaji.

## 12. Accessibility and responsive behavior

- sections use semantic headings and labelled regions;
- vocabulary, pattern tokens, examples, dialogue turns, and activities use
  semantic lists where appropriate;
- audio, translation toggles, exercise controls, and disclosures have keyboard
  and touch parity with at least 44 by 44 px targets;
- focus is visible and section navigation moves to a real heading;
- exercise and audio states are announced in polite status/live regions;
- particle/ending identity uses text plus shape/style, never color alone;
- Japanese carries `lang="ja"` and readable token boundaries remain available
  in romaji mode;
- layouts have no horizontal overflow at 200% zoom or mobile widths;
- optional motion honors `prefers-reduced-motion`;
- all component and E2E assertions run in Italian and English and in both script
  modes where the surface changes.

## 13. Testing and release gates

Implementation follows red-green-refactor TDD.

Required coverage:

- focused unit tests for lexicon, grammar, content-order, practice-blueprint,
  feedback, and review-variation helpers;
- exhaustive tests over every production A1 lesson;
- component tests proving semantic order, default-visible meanings, audio
  affordances, localized copy, pattern labels, and announced feedback;
- route/progress migration tests;
- Playwright behavior tests for an early foundations lesson and a migrated
  scenario lesson in both locales, both script modes, desktop/mobile, keyboard,
  touch-equivalent controls, reduced motion, and 200% zoom;
- visual snapshots for `introductions-1` and `shopping-4` (or the nearest
  migrated scenario lesson if its stable ID changes during implementation).

Before delivery, run the exact repository gates:

```bash
npm test
npx tsc --noEmit
npm run build
npm run check:bundle
npm run test:e2e
git diff --check
```

`npm run build` must execute the A1/A2 prebuild validators. Visual PNGs must be
opened with an image-capable tool and receive a written concrete verdict about
hierarchy, clipping, overflow, focus, locale, and script rendering.

## 14. Completion criteria

The work is complete only when:

- every A1 lesson renders the new visible order;
- every A1 lesson has canonical word meanings and passes first-use closure
  (capstones use only previously introduced words);
- the foundations progression is visible and navigable from Course Home;
- the production practice report proves the per-lesson cognitive contract;
- review varies retrieval instead of replaying the failed exercise;
- all validators, focused tests, full Vitest, typecheck, build, bundle check,
  and full Playwright pass;
- both visual baselines have been viewed and accepted;
- a fresh whole-range review finds no unresolved spec, pedagogy, localization,
  accessibility, leakage, progress, or scope issue;
- the branch is pushed and a pull request is opened without merge or deploy.
