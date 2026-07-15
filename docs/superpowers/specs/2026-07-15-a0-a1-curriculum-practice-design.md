# Practical A0→A1 Curriculum and Practice - Design Specification

**Status:** Approved on 2026-07-15  
**Target:** Next Nihongo Practice release  
**Baseline:** `03750d6b4a40e634adad86907e9a12fb4161fa40` (`master`)  
**Delivery type:** Documentation only; this specification does not implement application code  
**Implementation order:** Slice A, then B, then C, then D; each slice has a separate gate

## 1. Authority and continuity

This specification expands the corrected public v2.1 release into a practical
A0-to-A1 starter course. It is based on the public corrective baseline at
`03750d6` and preserves the repository conventions established by:

- [`2026-07-13-foundation-v2-1-design.md`](./2026-07-13-foundation-v2-1-design.md);
- [`2026-07-14-v2-1-corrective-redesign-design.md`](./2026-07-14-v2-1-corrective-redesign-design.md);
- [`2026-07-15-public-release-remediation-design.md`](./2026-07-15-public-release-remediation-design.md).

The following existing decisions remain authoritative unless this document
explicitly extends them:

- practical spoken Japanese is the product focus;
- hiragana is the primary learner-facing Japanese output;
- romaji is optional and controlled independently from source locale;
- Japanese and semantic IDs are locale-independent;
- Italian and English catalogs are complete, structurally equivalent, and
  validated;
- the application is a browser-only React and TypeScript SPA using
  `HashRouter`;
- GitHub Pages remains a static, manual-only deployment;
- preferences and progress remain local to the browser;
- the Lab, Syllabary, Phrasebook, and browser speech synthesis remain available;
- the visual direction remains **Editoriale mnemonico**;
- semantic icons retain one stable meaning across course map, lesson, practice,
  and recap surfaces;
- prerequisites guide the recommended order but never lock a route;
- every visible action has a minimum 44 by 44 px target, visible focus, and
  keyboard/touch parity.

This document supersedes the corrective specification where it defines the
12-module curriculum, lesson rhythm, exercise and review behavior, speech
recognition, progress schema v3, persona privacy rules, course-map lesson-row
repair, and next-release acceptance gates. It does not weaken any corrective
accessibility, routing, localization, static-deployment, or error-handling gate.

## 2. Purpose and outcomes

The release MUST turn the currently sparse path into a coherent practical
starter course that takes a new learner from no assumed Japanese knowledge to a
bounded A1-like practical repertoire. "A0-A1" describes the course's intended
beginner progression; it is not a certification or JLPT equivalence claim.

The release has four product outcomes:

1. A learner can follow the 40-lesson editorial target through four
   prerequisite-led phases and complete three practical synthesis capstones.
2. The course teaches a broad, reusable spoken repertoire instead of repeatedly
   centering the same small set of food and travel verbs.
3. Every lesson includes deterministic practice, lightweight review, and an
   optional spoken attempt without making a pronunciation-quality claim.
4. The visibly unstyled expanded course-map rows and the personal Microsoft
   alias in public application content are removed.

The release is accepted only as one complete release after all four sequential
implementation slices pass. A slice gate permits planning of the next slice; it
does not by itself justify a release-ready claim.

## 3. Explicit non-goals

The release MUST NOT add:

- accounts, login, cloud synchronization, a database, or an application backend;
- cloud secrets, provider API keys, or automatic deployment;
- required kanji recognition or output;
- a full katakana course;
- phoneme, accent, fluency, or pronunciation scoring;
- a claim that browser transcription measures pronunciation quality;
- adaptive or AI-generated lessons, examples, exercises, or feedback;
- certification, CEFR assessment, or JLPT equivalence claims;
- spaced-repetition scheduling beyond the lightweight `Da ripassare` queue;
- business Japanese, honorific-system depth, or workplace-specialist content;
- runtime analytics, telemetry, audio storage, or transcript storage;
- changes to the manual-only GitHub Pages deployment policy.

A future backend speech provider MAY implement the interfaces in Section 12, but
the backend, provider selection, credentials, and server-side audio processing
are out of scope.

## 4. Release decomposition and sequential gates

The master release is divided into four independently verifiable slices. Work
MUST proceed sequentially because each later slice depends on validated
contracts and data from the preceding slice.

| Slice | Scope | Depends on | Gate before next slice |
|---|---|---|---|
| A. UI/privacy repairs and curriculum foundations | Repair expanded lesson rows; centralize generic personas; remove the runtime alias; define catalog boundaries, stable IDs, 12-module skeleton, coverage validator, progress v3 types/migration, and static error contracts | Corrected public baseline | Course-map visual checks pass; alias validator passes; curriculum skeleton and migrations validate; no content or exercise implementation beyond fixtures needed to prove contracts |
| B. Complete A0-A1 content | Author all lessons, concepts, lexicon, examples, locale copy, katakana assistance, coverage matrix entries, and three capstones | Slice A accepted | IT/EN parity, lesson/dependency validity, 38-42 lessons with target 40, 250-300 words, at least 35 reused verbs, introduction-before-assessment, and script rules all pass |
| C. Exercise and review engine | Implement deterministic exercise generation/evaluation, accepted variants, answer normalization, lesson practice flow, progress transitions, and `Da ripassare` | Slice B accepted | Pure-engine tests pass; every exercise derives from shared data; practice/review flows and progress semantics pass without speech |
| D. Speech and end-to-end QA/release | Implement browser recognition adapter, transcript evaluation, consent/privacy/error UI, unsupported fallback, complete Playwright coverage, screenshots, Pages-base-path verification, and release QA | Slice C accepted | Speech state-machine and browser stubs pass; desktop/mobile/accessibility/locale/script/Pages checks pass; reviewed screenshots and full release verification pass |

The first implementation plan MUST cover Slice A only. Slice B receives its own
plan only after Slice A's gate is recorded; the same rule applies to C after B
and D after C. One integrated implementation plan is permitted only if the user
explicitly overrides this sequencing after reviewing this specification.

The applicable slice section in this master document is the specification gate
for that subsystem. If implementation discovery changes a slice's scope,
interfaces, metrics, or dependencies, the design MUST be amended and reviewed
before that slice's plan is written or updated. Each slice therefore retains an
explicit specification -> plan -> implementation -> verification sequence.

No slice MAY introduce placeholder production components, empty catalogs, or
success-shaped fallbacks for a later slice. The application MUST remain runnable
and statically deployable at every accepted slice boundary.

## 5. Curriculum architecture

### 5.1 Model and phase IDs

The course remains a non-blocking, prerequisite-led situational spiral:

- a new lesson introduces a small bounded concept set;
- later lessons reuse prior concepts in a new practical situation;
- exercises assess only concepts and lexemes already introduced;
- later modules deliberately retrieve verbs and words from earlier modules;
- skipped prerequisites are visible guidance, never access locks;
- capstones synthesize prior material and introduce no new grammar or verbs.

The existing locale-independent phase IDs remain stable and ordered:

```ts
type PhaseId = "orient" | "build" | "navigate" | "synthesize";
```

The target is exactly 40 micro-lessons. Editorial adjustment between 38 and 42
lessons is permitted only when every lesson remains 6-10 minutes and the module
outcomes, coverage gates, three capstones, and total practice rhythm remain
intact. A change outside 38-42 requires a design amendment, not an implementation
shortcut.

### 5.2 Modules and lesson budget

| Phase | Module | Learner outcome | Target lessons | Prerequisites |
|---|---|---|---:|---|
| Orient | 1. Sounds, hiragana, and katakana bridge | Read and reproduce the course's essential hiragana patterns and recognize assisted katakana loanwords | 5 | none |
| Orient | 2. Introducing oneself | Give a generic name, origin, languages, occupation, and age; understand equivalent introductions from the personas | 3 | 1 |
| Orient | 3. Essential questions | Ask and answer who, what, where, when, which, how, how much, and simple yes/no questions | 3 | 1-2 |
| Build | 4. Actions and objects | Build polite action sentences with objects and familiar participants | 3 | 1-3 |
| Build | 5. Routines, clock time, and frequency | Describe a day using clock time, days, frequency, and recurring actions | 3 | 1-4 |
| Build | 6. Past and negative | Transform familiar nominal and verbal frames across non-past/past and affirmative/negative | 3 | 1-5 |
| Navigate | 7. Places, movement, and transport | Move to/from places, act in places, board/alight, and ask practical route questions | 4 | 1-6 |
| Navigate | 8. People, family, and relationships | Identify people, describe basic relationships, and arrange simple meetings or shared actions | 3 | 1-7 |
| Navigate | 9. Descriptions, preferences, and weather | Describe familiar things and conditions and express simple likes, dislikes, and preferences | 3 | 1-8 |
| Navigate | 10. Shopping, quantities, and requests | Ask prices, choose quantities, compare simple options, and make bounded polite requests | 3 | 1-9 |
| Navigate | 11. Existence, position, and needs | Locate animate/inanimate referents, describe position, and state immediate practical needs | 3 | 1-10 |
| Synthesize | 12. Practical synthesis | Prepare for and complete three capstones: self-introduction, everyday outing, and travel day | 4 | 1-11 |

Module 12 contains one short capstone orientation lesson followed by exactly
three assessed synthesis lessons:

1. **Self-introduction** - introduce oneself, ask reciprocal questions, and
   respond using generic persona context.
2. **Everyday outing** - coordinate time, people, preferences, shopping, and a
   simple routine outside the home.
3. **Travel day** - move between places, use transport, request or locate needed
   items, and resolve a simple practical question.

The capstones MUST use curated bounded scenarios. They MUST NOT generate
open-ended free text, introduce new grammar/verbs, or require knowledge outside
the validated catalogs.

### 5.3 Lesson contract and rhythm

Every instructional lesson is one route and one scrolling page. It follows this
ordered rhythm:

1. **Rule** - one practical rule, purpose, and minimum terminology.
2. **Explicit visual comparison** - a genuine base/changed contrast with the
   declared semantic and surface delta.
3. **Guided construction** - a deterministic manipulation or construction that
   demonstrates the target.
4. **Practice** - 3-5 typed exercises drawn from the shared catalogs.
5. **Spoken attempt** - optional model playback and learner attempt; recognition
   is optional and never blocks the lesson.
6. **Recap** - target summary, changed gears, reviewed vocabulary, and next step.

The existing stable section IDs `rule`, `comparison`, `explore`, and `recap`
remain valid for route/scroll compatibility. Practice and speech are nested
within the expanded `explore` experience rather than creating new route anchors
in Slice A. If implementation evidence shows separate anchors are necessary, a
later design amendment MUST define migration and scroll behavior before IDs are
added.

Every lesson MUST:

- take 6-10 estimated minutes;
- contain 3-5 exercises;
- include at least one construction or transformation exercise;
- include one optional spoken attempt using a phrase already present in shared
  example or speech-prompt data;
- use only introduced grammar and lexicon in assessed targets;
- identify which concepts and lexemes it introduces, practices, and assesses;
- provide complete IT/EN copy and identical exercise semantics in both locales;
- remain fully usable when speech synthesis or recognition is unavailable.

## 6. Editorial coverage and invariants

### 6.1 Count definitions

Coverage is measured from stable semantic IDs, never by counting rendered
strings:

- A **vocabulary item** is one unique learner-facing `LexemeId`. Inflected forms,
  orthographic variants, locale translations, particles, endings, persona names,
  and duplicated script forms do not add to the vocabulary count.
- A **verb lexeme** is one `LexemeId` whose lexical category is `verb`.
  Distinct senses MAY use distinct semantic sense IDs when they require
  different teaching or argument structure; for example, "listen" and "ask"
  under `きく` are separately traceable senses but share orthography metadata.
- A verb is **introduced** only in the first lesson that explicitly teaches its
  meaning and usable frame.
- A verb is **genuinely reused** only when it appears in at least three distinct
  modules including its introduction module, appears in at least two later
  modules, and is the target or required building block of at least four authored
  examples/exercises across the course. Incidental appearance in prose,
  translations, option lists, or a validator fixture does not count.
- An item is **assessed** when correctness depends on selecting, ordering,
  transforming, completing, constructing, or speaking that item.

The release MUST contain 250-300 unique vocabulary items. The editorial target
is 270. It MUST introduce at least 40 verb lexemes, of which at least 35 satisfy
the genuine-reuse rule above.

Vocabulary MUST be taught through a practical sentence, comparison, guided
construction, or situational exercise. An isolated glossary/list appearance does
not count as introduction, practice, assessment, or reuse.

### 6.2 Coverage matrix

The curriculum catalog MUST expose a machine-validatable matrix. The following
budgets are targets and sum to the 40-lesson, 42-verb, 270-word editorial plan:

| Module | Lessons | New verb lexemes | New vocabulary | Required reuse focus |
|---|---:|---:|---:|---|
| 1. Sounds/hiragana/katakana bridge | 5 | 0 | 20 | greetings and assisted high-frequency loanwords recur from Module 2 onward |
| 2. Introducing oneself | 3 | 4 | 25 | identity frames recur in Modules 3, 8, and 12 |
| 3. Essential questions | 3 | 2 | 20 | question words and clarification frames recur in every situational phase |
| 4. Actions and objects | 3 | 8 | 25 | core transitive actions recur in routines, shopping, outings, and capstones |
| 5. Routines/time/frequency | 3 | 6 | 25 | daily actions recur under tense/polarity and in both outing capstones |
| 6. Past and negative | 3 | 3 | 20 | transformations apply to previously introduced verbs; no isolated tense-only list |
| 7. Places/movement/transport | 4 | 7 | 25 | movement frames recur in outings, position/needs, and travel capstone |
| 8. People/family/relationships | 3 | 3 | 25 | people-linked actions recur in preferences, outing, and self-introduction |
| 9. Descriptions/preferences/weather | 3 | 3 | 25 | descriptions and preferences recur in shopping and both outing capstones |
| 10. Shopping/quantities/requests | 3 | 3 | 30 | request and quantity frames recur in existence/needs and travel capstone |
| 11. Existence/position/needs | 3 | 3 | 30 | existence and need frames recur in travel-day problem solving |
| 12. Three capstones | 4 | 0 | 0 | no new grammar, verbs, or vocabulary; at least 20 reused verbs across the three capstones |
| **Target total** | **40** | **42** | **270** | **at least 35 verbs meet the genuine-reuse invariant** |

Each matrix row MUST be derived from catalog references and include:

```ts
interface ModuleCoverage {
  moduleId: ModuleId;
  lessonIds: readonly LessonId[];
  introducedConceptIds: readonly ConceptId[];
  introducedLexemeIds: readonly LexemeId[];
  introducedVerbIds: readonly VerbLexemeId[];
  practicedVerbIds: readonly VerbLexemeId[];
  assessedConceptIds: readonly ConceptId[];
  assessedLexemeIds: readonly LexemeId[];
  firstKatakanaExposureIds: readonly LexemeId[];
}
```

The validator MUST compute counts and reuse from lesson/example/exercise
references. Hand-entered summary numbers MAY be rendered in the course map but
MUST be checked against computed values.

### 6.3 Required verb breadth

The verb catalog MUST cover ordinary beginner actions across these semantic
domains:

- consumption: eat, drink;
- movement: go, come, return, walk, enter, leave, board, alight;
- perception/communication: watch/see, listen, ask, speak, read, write, call;
- transactions and objects: buy, use, carry/possess, take, receive, give, borrow;
- social action: wait, meet;
- general and routine action: do, sleep, wake, work, study, understand, live;
- existence and posture: exist for inanimate referents, exist for animate
  referents, stand, sit;
- instruction and environment: learn, teach/tell, open, close.

This list defines minimum semantic breadth, not the coverage count. Passing the
release gate requires the computed matrix and genuine-reuse invariant; merely
including these labels or isolated example sentences is insufficient.

### 6.4 Introduction and assessment invariants

Validation MUST fail when:

- a concept, lexeme, sense, inflection, particle use, counter, or script form is
  assessed before its first explicit introduction;
- an introduced target concept or verb is not practiced again in at least one
  later lesson;
- an exercise references a concept or lexeme absent from shared catalogs;
- a module prerequisite is missing, later in order, or cyclic;
- module/lesson/exercise/example/speech/persona IDs are duplicated or unstable;
- a capstone introduces a new grammar concept or verb;
- fewer than 35 verbs satisfy the genuine-reuse invariant;
- vocabulary is outside 250-300 or the lesson count is outside 38-42;
- a hand-authored coverage summary differs from computed coverage;
- an exercise answer cannot be derived from shared Japanese/semantic data;
- a required accepted answer variant is implicit rather than declared.

## 7. Script policy

Hiragana remains the primary learner output. No assessed exercise may require
kanji. Kanji MAY appear only as clearly optional reference material outside the
answer target; the learner MUST always be able to answer in hiragana.

Romaji remains optional. Turning romaji off MUST NOT hide meaning, instructions,
or required interaction labels. Turning it on MUST use the shared Japanese
catalog's reading, not a separate answer string.

Module 1 includes a short assisted katakana bridge rather than a full katakana
course. Authentic katakana MUST be used for normal loanword spelling. At first
course exposure, every katakana lexeme MUST provide:

- the authentic katakana spelling;
- hiragana reading assistance adjacent to or as ruby over the spelling;
- optional romaji controlled by the existing script preference;
- a localized note only when the spelling or sound requires explanation.

After the validated first exposure, later lessons MAY omit the hiragana aid when
the learner has already encountered the same `LexemeId`; the script preference
still controls romaji. Validation MUST fail if a katakana lexeme is used before
its assisted first exposure or if an assessed answer requires unassisted
katakana before that exposure.

## 8. Generic personas and alias removal

### 8.1 Central persona catalog

All people used in examples, exercises, capstones, screenshots, and speech
prompts MUST reference one centralized locale-independent persona catalog.
Initial personas are:

| Persona ID | Japanese display | Latin display | Purpose |
|---|---|---|---|
| `yuki` | `ゆき` | `Yuki` | primary self-introduction and routine persona |
| `ken` | `けん` | `Ken` | reciprocal questions, outings, and relationships |
| `mina` | `みな` | `Mina` | shopping, preferences, and travel situations |

Names MUST remain linguistically coherent across Japanese, Italian, and English.
Locale copy MAY change surrounding grammar or pronouns but MUST NOT translate,
respell, or assign conflicting facts to a persona.

```ts
interface Persona {
  id: PersonaId;
  japaneseName: string;
  latinName: string;
  profile: {
    originConceptId: ConceptId;
    languageConceptIds: readonly ConceptId[];
    occupationConceptId: ConceptId;
    age: number;
  };
}
```

Persona facts MUST be generic, fictional, age-appropriate for the practical
starter scenarios, and identical in semantic data for IT and EN. Localized
sentences derive from the profile and shared grammar data.

### 8.2 Removal contract

Every public application occurrence of the legacy `Ricchi`/`りっち` alias MUST
be replaced by a persona reference. This includes runtime catalogs, examples,
translations, phrase data, lesson copy, exercise prompts, speech prompts,
screenshots, snapshots, test fixtures that model runtime content, and current
user-facing documentation.

Treatment by artifact:

- **Runtime content:** forbidden aliases are release-blocking.
- **Translations:** IT and EN entries reference the same `PersonaId`; neither
  locale owns a copied Japanese or Latin name string.
- **Tests and fixtures:** normal fixtures use persona IDs. A focused validator
  test MAY construct a forbidden value from fragments so the validator can be
  tested without adding an accidental allowlisted runtime occurrence.
- **Snapshots/screenshots:** regenerated after persona migration and scanned.
- **Current user-facing docs:** examples use generic personas.
- **Historical design/review records:** Git history is not rewritten. A document
  MAY retain a legacy term only when it is necessary to record the migration or
  review finding and is outside runtime inputs. Such a reference does not permit
  the term in application bundles.

A validator MUST scan every runtime-reachable string after catalog assembly and
before release build acceptance. It MUST use a normalized, case-insensitive
denylist for Latin aliases and exact normalized kana matching for Japanese
aliases. The denylist itself MUST live outside runtime content. There is no
silent replacement at render time: authored content fails validation and is
fixed at its source.

## 9. Catalog and component boundaries

### 9.1 Separate typed catalogs

The release MUST maintain focused catalogs with stable semantic IDs:

| Catalog | Owns | Must not own |
|---|---|---|
| concepts | grammar/semantic concepts, prerequisites, surface gears | localized prose or duplicated examples |
| lexicon | Japanese forms, reading, lexical category, senses, script metadata | IT/EN sentence copy |
| examples | ordered references to lexemes/concepts and segment structure | duplicated answer strings |
| curriculum | phases, modules, lessons, order, prerequisites, coverage references | localized paragraphs or engine logic |
| exercises | typed prompt definitions, target references, explicit accepted variants | copied Japanese answer literals already represented by shared data |
| speech prompts | target example/utterance references and comparison segments | recognition implementation or persisted transcripts |
| personas | generic identity and semantic profile facts | localized sentences |
| IT/EN copy | UI text, instructions, explanations, intent text, natural translations | Japanese source-of-truth data |

Japanese text and semantic IDs are locale-independent. Italian and English copy
catalogs MUST have identical key structure. Missing copy is a validation failure;
there is no fallback from one locale to the other.

### 9.2 Stable identity and references

```ts
interface CurriculumCatalog {
  phases: readonly Phase[];
  modules: readonly CourseModule[];
  lessons: Readonly<Record<LessonId, Lesson>>;
}

interface Lesson {
  id: LessonId;
  moduleId: ModuleId;
  order: number;
  estimatedMinutes: number;
  introducedConceptIds: readonly ConceptId[];
  requiredConceptIds: readonly ConceptId[];
  introducedLexemeIds: readonly LexemeId[];
  practicedLexemeIds: readonly LexemeId[];
  exerciseIds: readonly ExerciseDefinitionId[];
  speechPromptId: SpeechPromptId;
}
```

Published module and lesson IDs MUST NOT be renamed. When a legacy v2 lesson
objective survives, its existing ID SHOULD be retained. If curriculum expansion
requires replacement, a tested explicit legacy-to-current alias map MUST
preserve routes and progress. IDs MUST never be inferred from localized titles.

### 9.3 Validation boundary

`validateCurriculum` is a pure release/build-time boundary. It receives all
assembled catalogs and returns structured errors; it does not mutate data or
silently drop invalid entries.

```ts
interface CurriculumValidationResult {
  valid: boolean;
  errors: readonly CurriculumValidationError[];
  coverage: ComputedCoverage;
}

interface CurriculumValidator {
  validate(input: AssembledCatalogs): CurriculumValidationResult;
}
```

Error codes MUST identify at least duplicate IDs, missing references, invalid
order, dependency cycles, assessment before introduction, missing locale copy,
coverage shortfall/excess, insufficient verb reuse, missing katakana assistance,
required kanji output, answer-source duplication, persona inconsistency, and
forbidden runtime aliases.

## 10. Deterministic exercises and review

### 10.1 Exercise types

Every lesson's 3-5 exercises use a purposeful mix of:

- tile ordering;
- particle or ending choice;
- tense/polarity transformation;
- sentence completion;
- constrained construction from an Italian or English intent.

Exercises MUST be typed, deterministic, and generated from shared
grammar/content data. They MUST NOT duplicate canonical Japanese answer strings.
Locale affects instructions and source intent, not the target semantics.

```ts
type ExerciseDefinition =
  | TileOrderingExercise
  | ChoiceExercise
  | TransformationExercise
  | CompletionExercise
  | ConstrainedConstructionExercise;

interface ExerciseInstance {
  instanceId: string;
  definitionId: ExerciseDefinitionId;
  seed: string;
  prompt: LocalizedExercisePrompt;
  target: ExerciseTarget;
  acceptedVariantIds: readonly AcceptedVariantId[];
}

interface ExerciseEngine {
  generate(definition: ExerciseDefinition, seed: string): ExerciseInstance;
  evaluate(instance: ExerciseInstance, response: LearnerResponse): ExerciseResult;
}
```

Generation and evaluation are pure: identical catalog version, definition, and
seed produce the same instance and result. Seeds are persisted only when needed
to reconstruct an in-progress attempt. Randomness, current time, locale ordering,
or browser-specific iteration order MUST NOT change the answer.

### 10.2 Answer derivation and variants

Canonical answers MUST be assembled from referenced examples, lexemes,
inflections, particles, and semantic slots. An exercise definition MAY declare
accepted variants only through explicit variant records:

```ts
interface AcceptedVariant {
  id: AcceptedVariantId;
  targetSegmentIds: readonly SegmentId[];
  reason: "orthography" | "topic-omission" | "particle-choice" | "word-order";
}
```

Accepted variants MUST:

- be pedagogically valid for the lesson target;
- be explicit and reviewable;
- resolve to shared segment data;
- preserve the assessed concept;
- exist in both IT and EN exercise semantics;
- never be inferred from fuzzy matching or a locale translation.

Answer normalization MAY apply Unicode normalization, trim surrounding
whitespace, normalize permitted Japanese spacing, and normalize explicitly
declared script equivalents. It MUST NOT erase a particle, tense, polarity, or
other assessed distinction.

### 10.3 Exercise states and error handling

Evaluation returns `accepted`, `retry`, or `invalid-input`. `retry` includes the
specific target concept or segment that needs review without revealing an
unrelated answer. `invalid-input` is reserved for structurally unusable input
and MUST produce a visible localized message.

An internal missing reference, impossible generated choice set, duplicate tile
identity, or absent canonical target is a catalog/engine error. It MUST be
reported visibly and fail tests; it MUST NOT be converted into an accepted
result or an empty exercise.

### 10.4 `Da ripassare` queue

A non-accepted, valid exercise attempt upserts a lightweight review entry:

```ts
interface ReviewQueueEntry {
  reviewKey: string;
  lessonId: LessonId;
  exerciseDefinitionId: ExerciseDefinitionId;
  targetConceptIds: readonly ConceptId[];
  targetLexemeIds: readonly LexemeId[];
  mistakeCount: number;
  lastMistakeAt: string;
}

interface ReviewQueue {
  list(): readonly ReviewQueueEntry[];
  recordMistake(input: ReviewMistake): void;
  resolve(reviewKey: string): void;
}
```

`reviewKey` is derived from the exercise definition and assessed target IDs so
repeated mistakes upsert rather than duplicate the same item. Queue order is
most recent mistake first, with stable ID tie-breaking.

An entry is resolved only by an accepted attempt generated in review mode after
the entry was created. Correcting the same immediate lesson attempt does not
silently remove the review item. There are no intervals, due dates, ease factors,
streak multipliers, or hidden mastery scores.

The queue title is localized as `Da ripassare` in Italian and an equivalent
plain beginner label in English. Empty, storage-unavailable, corrupt-entry, and
exercise-no-longer-present states are explicit. Obsolete entries are preserved
as orphaned metadata during migration and excluded from the active queue until
an explicit catalog alias resolves them.

## 11. Progress persistence and migration

### 11.1 Progress semantics

Progress distinguishes three evidence levels:

- **visited:** the lesson route rendered successfully;
- **practiced:** the learner submitted at least one valid attempt for every
  required exercise in the lesson, regardless of final correctness;
- **consolidated:** the lesson is practiced, every required exercise has at
  least one accepted result, and every review entry for that lesson's assessed
  targets has subsequently been resolved in review mode.

These states describe local interaction evidence, not proficiency,
certification, or guaranteed retention. A lesson can remain practiced while new
mistakes reopen review entries and remove its consolidated state.

### 11.2 Schema v3

The storage key remains:

```text
nihongo.course.progress
```

The next schema is:

```ts
interface LessonProgressV3 {
  visitedAt: string | null;
  practicedAt: string | null;
  consolidatedAt: string | null;
  attemptedExerciseIds: readonly ExerciseDefinitionId[];
  acceptedExerciseIds: readonly ExerciseDefinitionId[];
}

interface CourseProgressV3 {
  schemaVersion: 3;
  catalogVersion: string;
  lessons: Readonly<Record<LessonId, LessonProgressV3>>;
  lastVisitedLessonId: LessonId | null;
  reviewQueue: readonly ReviewQueueEntry[];
  orphanedLessonIds: readonly string[];
  orphanedReviewKeys: readonly string[];
  updatedAt: string;
}
```

Persistence is isolated behind a typed boundary:

```ts
interface ProgressStore {
  load(): ProgressLoadResult;
  save(progress: CourseProgressV3): ProgressSaveResult;
  clear(): ProgressClearResult;
}
```

`ProgressLoadResult` distinguishes absent, loaded, migrated, corrupt,
unsupported-version, and unavailable-storage outcomes. Save and clear results
distinguish success from quota, serialization, and storage-access failures.
Callers update in-memory state only through explicit transition functions and
never treat a failed persistence result as persisted success.

Timestamps are ISO strings written at the transition that they describe.
Repeated no-op actions MUST be idempotent and MUST NOT update `updatedAt`.
`consolidatedAt` is cleared when a new relevant mistake enters the review queue;
visited and practiced evidence is retained.

### 11.3 Migration from current progress

The parser MUST accept shipped v1, current v2, and current v3 records:

1. Validate the source record without mutating or deleting it.
2. Migrate v1 to the existing v2 visited semantics using the established
   `completedLessonIds` to `visitedLessonIds` rule.
3. Migrate v2 to v3 by creating one lesson state for every known visited lesson.
4. Set `visitedAt` to the source `updatedAt`; set `practicedAt` and
   `consolidatedAt` to `null`; create no accepted or attempted exercise evidence.
5. Preserve `lastVisitedLessonId` through stable IDs or an explicit tested alias.
6. Preserve unknown lesson IDs in `orphanedLessonIds`; exclude them from
   percentages and recommendations.
7. Start with an empty review queue because prior schemas stored no mistakes.
8. Validate the complete v3 result before writing it.
9. Write only after successful validation; a failed write leaves the original
   stored value untouched and uses an explicit in-memory session state.

Migration MUST be deterministic and idempotent. Parsing an already valid v3
record returns equivalent v3 data without timestamp churn. Running the same
v1/v2 migration repeatedly produces the same semantic v3 result. Corrupt,
unversioned, or future-version data is not guessed: the app isolates the key,
shows a visible recovery notice, keeps the session usable in memory, and does
not affect locale or script settings.

## 12. Browser speech recognition

### 12.1 Scope and truthful claim

Speech recognition uses the browser Web Speech API with `lang = "ja-JP"`. It
reports whether the browser recognized the target phrase. The UI MUST NOT call
the result pronunciation grading, pronunciation accuracy, accent quality,
fluency, phoneme analysis, or an equivalent claim.

Speech is optional. Every exercise and lesson remains usable without microphone
permission or recognition support.

### 12.2 Replaceable interfaces

```ts
type SpeechRecognitionState =
  | "idle"
  | "requesting-consent"
  | "listening"
  | "processing"
  | "matched"
  | "close"
  | "retry"
  | "unsupported"
  | "denied"
  | "no-speech"
  | "aborted"
  | "network-error"
  | "service-error";

interface SpeechRecognizer {
  readonly supported: boolean;
  recognize(request: SpeechRecognitionRequest): Promise<RecognitionOutcome>;
  abort(): void;
}

interface TranscriptEvaluator {
  normalize(input: string): NormalizedTranscript;
  evaluate(
    transcript: NormalizedTranscript,
    prompt: SpeechPrompt,
  ): TranscriptEvaluation;
}
```

The browser adapter owns feature detection, `ja-JP` configuration, recognition
events, abort behavior, and mapping vendor events to application states. It does
not own lesson copy or transcript scoring rules. A future backend MAY implement
`SpeechRecognizer`; consumers MUST NOT depend on browser-specific event objects.

### 12.3 Prompt and normalization contract

Speech prompts reference shared examples/segments:

```ts
interface SpeechPrompt {
  id: SpeechPromptId;
  targetExampleId: ExampleId;
  acceptedTranscriptVariantIds: readonly AcceptedVariantId[];
  comparisonSegmentIds: readonly SegmentId[];
  criticalSegmentIds: readonly SegmentId[];
}
```

Normalization is pure and applies, in order:

1. Unicode NFKC normalization.
2. Lowercasing of Latin letters used in exceptional recognition output.
3. Removal of surrounding and inter-token whitespace that is not semantically
   meaningful in Japanese.
4. Removal of declared sentence punctuation only.
5. Katakana-to-hiragana conversion for comparison while preserving the original
   transcript for display.
6. Application of only catalog-declared orthographic transcript variants.

Normalization MUST NOT remove particles, collapse long-vowel distinctions,
rewrite tense/polarity, or guess undeclared synonyms.

Segment comparison aligns normalized target segments in order and returns a
per-segment match record. The overall state is deterministic:

- `matched` when the normalized transcript exactly equals the canonical target
  or one explicit accepted transcript variant;
- `close` when all critical segments match exactly and the minimum normalized
  code-point edit distance to an accepted target is no more than
  `max(1, floor(targetLength * 0.15))`;
- `retry` otherwise.

Critical segments include every particle, tense/polarity ending, quantity, and
lesson-target gear. The `close` threshold is a recognition-similarity aid, not a
pronunciation score. The UI presents matched segments, the recognized
transcript, and a plain matched/close/try-again message without percentages.

### 12.4 Consent, privacy, and fallback

Before the first microphone request, the app MUST show a localized consent and
privacy notice stating:

- the activity is optional;
- the app stores no audio;
- the app does not persist the recognized transcript;
- the browser, operating system, or speech vendor may process audio to provide
  recognition;
- denying permission leaves all non-speech exercises available.

Consent is an explicit user action and is separate from browser permission.
Permission is requested only after consent. The app MAY remember that its own
notice was acknowledged locally, but MUST NOT infer or persist browser
permission state as guaranteed.

When recognition is unsupported, denied, unavailable, or fails, the fallback
preserves:

- model phrase playback through the existing speech-synthesis path when
  available;
- visible target text under the current script setting;
- a repeat-without-score action;
- completion of the lesson and all non-speech exercises.

No fallback creates a fake transcript, matched state, or accepted exercise.

### 12.5 Error states

The UI MUST distinguish and localize:

| State | Required behavior |
|---|---|
| unsupported | Explain that recognition is unavailable; show playback/repeat fallback |
| denied | Explain microphone permission was denied and how to continue without it |
| no-speech | State that no speech was detected; allow retry |
| aborted | State that listening stopped; do not present failure as a learner error |
| network-error | State that browser/vendor recognition service could not be reached; retain fallback |
| service-error | State that recognition failed for another mapped service reason; retain fallback |

Listening and processing state MUST be visible, announced through an appropriate
live region, and never conveyed only by color or animation. The microphone
control MUST expose its accessible name and status. Abort and retry remain
keyboard and touch operable. Reduced-motion users receive no pulsing-only status.

## 13. Course-map UI repair

### 13.1 Defect statement

The current expanded lesson rows appear raw because
`.module-card__lesson-link` has `border: 1px solid transparent` and no visible
default background. A border and background appear only on hover/current state,
so ordinary expanded rows blend into the parent card and look unfinished.

The fix MUST address the default rendered state rather than rely on hover,
screenshots, or a broader parent-card tint.

### 13.2 Nested lesson-row contract

Expanded lessons MUST render as visibly bounded nested rows/cards with:

- a visible default surface background;
- a visible border or dividers in the resting state;
- consistent corner and spacing tokens;
- distinct hover, active, current/recommended, visited, practiced, and
  consolidated states;
- visible `:focus-visible` treatment;
- minimum 44 by 44 px interactive bounds;
- lesson title, objective, estimated time, and textual state;
- state redundancy through text/icon/shape, never color alone;
- no hover-only information;
- no raw browser-default link appearance.

Adjacent nested rows MAY share dividers instead of separate borders if every row
remains visibly bounded. Mobile rows stack metadata without shrinking the target
or causing horizontal overflow.

### 13.3 Compact 12-module map

The four existing phase groups remain a vertical path. Twelve modules MUST NOT
be rendered as uniform giant cards. Each collapsed module is content-sized and
shows:

- semantic mnemonic icon;
- localized title and one concise outcome;
- prerequisite summary;
- coverage metadata in the exact visual order
  `lessons · verbs · words`, with localized labels;
- current/recommended/visited/practiced/consolidated state as applicable;
- one clear start/continue/review action.

The metadata values are module-scoped computed coverage counts. "Verbs" means
unique practiced verb lexemes in that module, including newly introduced verbs,
because this exposes spiral reuse. IT and EN MUST use the same computed value and
their localized labels MUST preserve that meaning.

Only the current/recommended module starts expanded. A user may expand any
module. Expansion MUST not introduce a fixed minimum height, equal-height grid,
or empty reserved region; the card grows only by the nested lesson content.

The existing route/scroll rules remain: an ordinary route opens at the top, an
explicit lesson-section return restores its validated anchor, and reduced-motion
users do not receive smooth scrolling.

### 13.4 Semantic icons and personas

Existing semantic icon IDs retain their meanings. New module concepts MAY add
typed IDs such as `identity`, `descriptions`, `shopping`, and `existence`; an
existing ID MUST NOT be repurposed merely to avoid adding an icon. Decorative
icons are hidden from assistive technology; standalone/action icons have
localized accessible names.

Persona names and facts shown on cards, examples, or capstones MUST come from
the centralized persona catalog and remain visually and linguistically coherent
in IT and EN.

## 14. Accessibility and interaction requirements

The complete release MUST provide:

- semantic buttons, links, lists, headings, forms, and disclosure relationships;
- accessible names and instructions for every exercise and microphone action;
- `aria-current` for route/step context and `aria-expanded`/`aria-controls` for
  course-map disclosure;
- polite live regions for exercise result, review-queue update, mic status, and
  recognition result;
- no color-only exercise, lesson, review, speech, or progress state;
- visible keyboard focus for every interactive element;
- keyboard/touch parity for ordering, choices, construction, review, disclosure,
  and speech controls;
- a non-drag keyboard alternative for tile ordering;
- minimum 44 by 44 px targets at representative desktop and mobile widths;
- reduced-motion behavior for scrolling, transitions, reordering, mic state, and
  result feedback;
- readable Japanese under browser zoom and narrow widths;
- no requirement to hear audio to understand or complete an exercise;
- no requirement to speak to complete a lesson.

Exercise errors MUST associate instructions with the affected control. Result
announcements MUST not steal focus. After submission, focus remains predictable;
when moving to the next exercise, focus moves to its heading or first control
according to one tested convention.

## 15. Deployment and runtime boundaries

The application remains a static Vite build deployed to GitHub Pages through the
existing manual `workflow_dispatch` workflow.

The release MUST preserve:

- `HashRouter` routes and hash deep links;
- `GITHUB_PAGES=true` base path `/nihongo-practice/`;
- no backend or runtime API dependency owned by the application;
- no secret or credential;
- no automatic `push` or `pull_request` deployment trigger;
- no external font request, analytics, tracker, or service worker.

Browser recognition MAY cause the browser/OS/vendor to contact its speech
service. This possibility MUST be disclosed and MUST not be described as an
application backend. Playwright uses stubbed recognition adapters and MUST NOT
contact a real speech service.

Catalog validation occurs in tests and release verification before deployment.
Runtime guards still handle unavailable browser capabilities and corrupt local
state; they do not replace release-time validation.

## 16. Error-handling contract

All expected failures have explicit typed states and localized notices:

- invalid route, module, lesson, section anchor, or legacy alias;
- invalid/missing catalog reference;
- exercise generation or evaluation invariant failure;
- invalid learner input;
- unavailable, corrupt, quota-exceeded, or write-failed local storage;
- obsolete review entry;
- unavailable speech synthesis or Japanese voice;
- unsupported/denied/no-speech/aborted/network/service recognition states;
- failed model playback;
- missing locale copy;
- Pages base-path or asset failure.

Invalid authored data MUST fail validation and tests. Runtime code MUST NOT catch
a catalog error broadly and render an empty/success state. A localized notice
MAY preserve unaffected navigation or practice, but it MUST state what failed.

Storage failures leave the current session usable in memory and state that
progress/review changes will not persist. Corrupt progress cleanup is isolated
to `nihongo.course.progress`; locale, reference translation, and script settings
are not reset.

Recognition event mapping MUST preserve meaningful distinctions. Unknown vendor
errors map to `service-error` with diagnostics available to development logs,
not to `retry` or `matched`.

## 17. Verification gates

### 17.1 Catalog and curriculum

Vitest MUST prove:

- complete IT/EN key parity across UI, curriculum, exercises, review, privacy,
  speech, errors, and persona references;
- no runtime-reachable personal alias after normalized scanning;
- unique stable IDs and valid references across all catalogs;
- ordered, existing, acyclic module prerequisites;
- 38-42 lessons, target 40, each estimated at 6-10 minutes;
- 250-300 unique vocabulary items, target 270;
- at least 40 verb lexemes and at least 35 genuinely reused verbs;
- computed coverage equals authored module metadata;
- every target concept, sense, verb, inflection, particle use, counter, and
  script form is introduced before assessment;
- every introduced target concept and verb is practiced again in a later lesson;
- capstones introduce no new grammar or verbs;
- no required kanji output;
- assisted first exposure for every katakana lexeme;
- persona facts and names are coherent across IT/EN;
- every lesson has 3-5 exercises and one optional speech prompt.

### 17.2 Pure engines and persistence

Unit tests MUST cover:

- curriculum validators and every release-blocking error code;
- deterministic exercise generation for every exercise type;
- exercise evaluation and explicit accepted variants;
- answer normalization without loss of assessed distinctions;
- duplicate/missing segment and impossible-choice failures;
- review-queue upsert, ordering, resolution, reopening, orphan handling, and
  storage failure;
- visited/practiced/consolidated transitions;
- direct v1-to-v3 and v2-to-v3 migration, valid v3 parsing, aliases, orphan
  preservation, corrupt/future data, failed writes, and idempotence;
- transcript normalization, katakana-to-hiragana comparison, explicit variants,
  critical segments, threshold boundaries, and matched/close/retry results;
- the complete speech state machine, abort behavior, and vendor-error mapping.

Exercise tests MUST show that canonical answers are derivable from shared data.
A source scan or validator MUST reject copied canonical answer strings in
exercise definitions where a shared reference exists.

### 17.3 Playwright desktop and mobile

Deterministic Chromium checks MUST cover representative desktop and mobile
widths, including at minimum `1440 x 1000` and `390 x 844`:

- compact four-phase course map with all 12 modules;
- resting expanded rows have visible bounds/background and do not look raw;
- no uniform giant/empty cards or large dead space;
- localized `lessons · verbs · words` metadata;
- nested-row hover, current, progress, and keyboard-focus states;
- every visible interactive target is at least 44 by 44 px;
- no horizontal overflow or overlapping header/course content;
- route entry, section links, back/forward, and guided return scroll behavior;
- all five exercise types, retry/accepted states, keyboard tile ordering, and
  review-queue flow;
- visited/practiced/consolidated presentation without color-only meaning;
- speech matched/close/retry using stubs;
- speech unsupported, denied, no-speech, aborted, network-error, and
  service-error stubs;
- privacy notice and explicit consent before microphone request;
- unsupported fallback retaining model playback/repeat-without-score;
- complete usability when speech is disabled;
- IT and EN locale switching without semantic or persona drift;
- hiragana-primary and romaji settings;
- first katakana assistance;
- GitHub Pages base path and representative hash deep links;
- zero unexpected console errors;
- zero unexpected external/backend requests.

Speech tests MUST inject a fake `SpeechRecognizer`; they MUST NOT depend on
Chromium's real microphone, permission UI, network service, or recognition
quality.

### 17.4 Visual screenshots and manual review

Reviewed screenshots are required for:

- course map with the recommended module expanded at `1440 x 1000`;
- the same map at `390 x 844`;
- a representative lesson practice flow at both widths;
- `Da ripassare` with entries at both widths;
- speech consent/listening/result or unsupported fallback at both widths;
- each locale at least once and each script setting at least once across the
  representative set.

The manual gate checks hierarchy, nested-row styling, dead space, reading
measure, state clarity without color, Japanese legibility, persona coherence,
focus visibility, mic status, and mobile touch ergonomics. Screenshots alone do
not replace computed-style, bounding-box, DOM, accessibility, and interaction
assertions.

### 17.5 Static release gate

Before a release-ready claim, fresh verification MUST include:

1. clean dependency installation;
2. complete Vitest suite;
3. TypeScript and standard Vite production build;
4. complete Playwright suite and reviewed screenshots;
5. `GITHUB_PAGES=true` production build;
6. local Pages-base-path smoke test for assets and representative hash routes;
7. production-only and complete dependency audit;
8. runtime-content alias scan against built output;
9. external-request, backend, secret, and workflow-trigger inspection;
10. final tracked-content and Git status review.

No subset is sufficient for the complete release claim.

## 18. Slice acceptance checklist

### 18.1 Slice A

Slice A is accepted when:

- the expanded lesson-row defect is fixed in resting, hover, focus, current, and
  progress states at desktop/mobile widths;
- the 12-module/four-phase skeleton and coverage metadata contract validate;
- generic personas are centralized and every runtime alias occurrence is gone;
- concept/lexicon/example/curriculum/exercise/speech/persona catalog interfaces
  and validator boundaries are established without placeholder production data;
- progress v3 and safe/idempotent migration are implemented and tested;
- existing route, locale, script, static deployment, and corrective
  accessibility behavior does not regress.

### 18.2 Slice B

Slice B is accepted when:

- all lessons contain complete approved content in IT and EN;
- lesson time, vocabulary, verbs, reuse, assessment order, script, katakana, and
  capstone gates pass;
- all examples and speech prompts reference shared catalogs;
- the complete course remains navigable without exercises or recognition being
  required for route access.

### 18.3 Slice C

Slice C is accepted when:

- all five deterministic exercise types are integrated;
- every lesson has 3-5 valid exercises;
- accepted variants are explicit and answers derive from shared data;
- `Da ripassare` and visited/practiced/consolidated transitions pass;
- exercises remain complete and equivalent in IT/EN and under script settings;
- no speech capability is required for exercise completion.

### 18.4 Slice D

Slice D is accepted when:

- speech consent, privacy, recognition, transcript evaluation, fallback, and all
  mapped error states pass unit and Playwright stubs;
- no pronunciation-quality claim appears in runtime copy;
- desktop/mobile, keyboard/touch, reduced-motion, locale, script, route/scroll,
  Pages base path, and screenshot gates pass;
- the full static release gate in Section 17.5 passes.

## 19. Completion criteria

This design is fully implemented only when:

- all four slices have separate approved plans and recorded acceptance evidence;
- 12 modules and three capstones form one coherent practical A0-A1 path;
- the validated course contains 38-42 lessons, 250-300 vocabulary items, at
  least 40 verbs, and at least 35 genuinely reused verbs;
- every assessed target is introduced first and derived from shared data;
- hiragana remains primary, romaji remains optional, katakana is authentic and
  assisted at first exposure, and no kanji output is required;
- no public runtime personal alias remains;
- expanded course-map lessons are visibly designed nested rows at rest;
- deterministic practice, lightweight review, and progress v3 behave as
  specified;
- browser speech reports recognition only, with consent, privacy disclosure,
  explicit errors, and a complete non-speech fallback;
- IT/EN, accessibility, static Pages deployment, and corrective release
  guarantees all pass their gates.

The next authorized artifact is a Slice A implementation plan. No application
implementation begins from this master specification alone.
