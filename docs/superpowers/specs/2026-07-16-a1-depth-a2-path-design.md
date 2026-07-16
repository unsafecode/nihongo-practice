# A1 depth and A2 path master design specification

**Status:** Approved design input, written 2026-07-16  
**Target repository:** `unsafecode/nihongo-practice`  
**Baseline:** `5467676d9eeca8783527376faf113dd63f64c309` (`master`)  
**Delivery type:** Documentation only; this specification does not implement application code  
**Implementation order:** Phase 0, then 1, 2, 3, and 4; every phase gets its own plan and exit gate

## 1. Authority and continuity

This specification defines the next curriculum architecture for Nihongo
Practice. It corrects the depth claims of
[`2026-07-15-a0-a1-curriculum-practice-design.md`](./2026-07-15-a0-a1-curriculum-practice-design.md)
and extends the product through A2.

The current public release is an A1 scaffold and inventory. It is not yet a
credible completed A1 outcome. Its 40 lessons, 42 verb lexemes, and 270 lexemes
are real catalog totals, but those totals do not prove that a learner sees,
retrieves, or transfers enough varied language within each lesson.

This specification supersedes the earlier design's:

- 38-42 lesson A1 completion range and target of 40;
- 3-5 exercise lesson-depth contract;
- claim that aggregate lexeme and verb reuse totals establish practical A1
  breadth;
- treatment of the A0-to-A1 release as a completed A1 course.

It retains the compatible architecture already shipped:

- browser-only React and TypeScript application;
- `HashRouter` routes and static GitHub Pages deployment;
- locale-independent Japanese and semantic IDs;
- structurally equivalent Italian and English catalogs;
- local browser preferences and progress;
- deterministic shared-data exercise generation;
- optional browser speech synthesis and recognition with no pronunciation
  grade;
- prerequisite-led recommendations without unnecessary route locking;
- stable published route IDs where content can be safely mapped;
- generic personas and the normalized no-personal-alias validator;
- visible focus, keyboard/touch parity, and minimum 44 by 44 px targets.

Where this specification and the 2026-07-15 design disagree about course
density, completion, level architecture, kanji, progress migration, validators,
or release gates, this specification is authoritative. Existing accessibility,
privacy, localization, routing, speech-truthfulness, and static-deployment
requirements remain in force unless this document strengthens them.

## 2. Problem statement and evidence

### 2.1 Inventory is not exposure

The published course contains exactly 40 lessons, 42 introduced verb lexemes,
and 270 vocabulary lexemes. Current release validation proves totals,
introduction order, reference integrity, and an aggregate verb-reuse rule. The
main thresholds in `validateCurriculum` are:

- 38-42 lessons;
- 250-300 vocabulary items;
- at least 40 introduced verbs;
- at least 35 reused verbs;
- 3-5 exercises per lesson.

Those checks count declarations and catalog references. They do not measure
how many different sentences, predicates, speaker roles, or situations a
learner encounters in one lesson. Lexicon and lesson-plan counts likewise do
not prove that rendered examples or assessment broadly use actions, people,
pronouns, and social roles.

### 2.2 Exercise counts overstate practice diversity

The exercise catalog can legally use several interaction types against the same
answer. `introductions-1` is the concrete failure:

```text
tile ordering       -> introductions-1-base
particle choice     -> introductions-1-base
sentence completion -> introductions-1-base
construction        -> introductions-1-say
```

The first three interactions all manipulate `わたしはがくせいです`.
`introductions-2` and `introductions-3` also use only two target examples across
four exercises. Their lesson plans contain extra `r1`, `r2`, and later examples,
but lesson scope alone does not make exercise authoring use them. As a result,
three to five exercises can amount to four treatments of essentially one
sentence.

The corrective contract must validate transfer and diversity, not only numeric
budgets, unique IDs, aggregate release totals, and introduction order.

### 2.3 Romaji loses semantic boundaries

`toRuntimeExample` correctly derives each segment's reading, including the
spoken readings of particles `は` and `へ`. It then builds the sentence with:

```text
segments.map(segment => segment.romaji).join("")
```

`TransformComparison`, `GuidedTransformation`, spoken attempts, and exercise
models also render individual fragments without a shared semantic separator.
The visible result includes strings such as `korewakoohiidesuka`.

Changing the join to `join(" ")` would introduce a different error. Inflectional
pieces such as `tabe` + `masu` must render as `tabemasu`, while lexical words,
particles, the copula, and question particles need readable boundaries.
Punctuation must attach without an extra space. This is a data and rendering
contract defect, not a CSS defect.

Phase 0 changes boundaries only. It preserves the current long-vowel policy,
including forms such as `koohii`; macrons or another romanization policy require
a separate design.

## 3. Standards positioning and claims

### 3.1 Product language

The product may describe the future paths as:

- **A1, aligned with JF/CEFR Can-do**
- **A2, aligned with JF/CEFR Can-do**

It must never say certified, accredited, officially assessed, or equivalent to
passing an external examination. Word counts are editorial diagnostics, not
proficiency claims. Learner-facing summaries lead with things a learner can do.

The Japan Foundation describes Irodori as a course for basic communication in
daily life and work in Japan. It maps Starter to A1 and Elementary 1 plus
Elementary 2 to A2, and calls its learning goals "Can-dos." The Council of
Europe organizes CEFR levels through Can-do descriptors.

For this product:

- A1 means the learner can use learned, very simple expressions, exchange basic
  personal details, and handle immediate familiar needs when an interlocutor
  speaks slowly, clearly, and is prepared to help.
- A2 means the learner can understand frequent expressions and conduct short,
  basic exchanges in familiar everyday situations, including simple routine
  tasks, personal background, and immediate surroundings.

These are alignment bounds, not a claim that finishing browser exercises alone
certifies the full listening, speaking, reading, and interaction profile.

### 3.2 Reference sources

The standards-language review in Phase 4 must check learner-facing claims
against:

- [Irodori: What is "Japanese for Life in Japan"?](https://www.irodori.jpf.go.jp/en/about.html)
- [Japan Foundation: Irodori overview, level mapping, Can-dos, activities, and contextual kanji](https://www.jpf.go.jp/e/project/japanese/teach/tsushin/news/202105.html)
- [Council of Europe: CEFR level descriptions and Can-do basis](https://www.coe.int/en/web/common-european-framework-reference-languages/level-descriptions)
- [Council of Europe: CEFR global scale](https://www.coe.int/en/web/common-european-framework-reference-languages/table-1-cefr-3.3-common-reference-levels-global-scale)

The design uses these sources as orientation. It does not copy Irodori's
curriculum, texts, or assessment and does not claim Japan Foundation approval.

## 4. Goals and non-goals

### 4.1 Goals

The master cycle must:

1. repair romaji word boundaries on every learner-facing course surface;
2. replace inventory-only confidence with per-lesson depth, diversity, spacing,
   and transfer invariants;
3. deepen A1 to 12 modules and 48 lessons with four synthesis lessons;
4. add a separate 15-module, 60-lesson A2 path;
5. introduce contextual A2 recognition of roughly 100-150 kanji without
   handwriting requirements;
6. give A1 and A2 separate Can-do summaries and progress evidence;
7. preserve browser-only operation, privacy, bilingual parity, accessibility,
   and Pages deployment.

### 4.2 Non-goals

This master cycle does not add:

- formal CEFR or Japan Foundation certification;
- JLPT examination preparation or equivalence claims;
- handwriting recognition, stroke-order teaching, or stroke-production scoring;
- cloud accounts, synchronization, databases, backends, credentials, or
  secrets;
- AI-generated or adaptive lessons, exercises, grading, or feedback;
- business-Japanese specialization;
- a claim that browser speech recognition grades pronunciation, accent,
  fluency, or phonemes;
- a new long-vowel romanization policy;
- automatic GitHub Pages deployment.

## 5. Two-level product architecture

### 5.1 Level identity

The course becomes two explicit levels in one product:

```ts
type CourseLevelId = "a1" | "a2";

interface CourseLevel {
  id: CourseLevelId;
  alignmentLabelCopyId: CopyId;
  moduleIds: readonly ModuleId[];
  canDoIds: readonly CanDoId[];
  recommendedPrerequisiteCheckpointId: CheckpointId | null;
}
```

Modules, lessons, Can-dos, progress, recommendations, reports, and catalog
versions carry a level ID. A level is never inferred from route order,
localized copy, or a numeric module prefix.

Published A1 lesson IDs must remain stable when the redesigned lesson has the
same practical objective and a safe progress mapping. A replacement uses an
explicit alias/migration map and documents why direct preservation would be
false. A2 IDs are new and must be stable once published.

### 5.2 Home and navigation

The course home presents an explicit A1/A2 selector before the module map. Each
level view has:

- its own title and honest alignment label;
- a compact Can-do summary;
- level-specific visited, practiced, and demonstrated evidence;
- a recommended continuation;
- module prerequisites and the next checkpoint.

A2 remains inspectable and directly navigable. Before the A1 checkpoint, the
A2 selector and A2 home show a recommendation to complete A1 first, but routes
are not hard locked. A prerequisite notice must not trap focus, block a
bookmark, or imply that stored progress is a proficiency certification.

Changing level preserves the locale and script settings, updates the route
deterministically, and moves focus to the selected level heading. Back/forward
navigation restores the URL-selected level without stale recommendation state.

## 6. A1 architecture: 12 modules and 48 lessons

A1 has exactly 12 modules with four lessons each. The first 11 modules teach and
spiral content. Module 12 contains four capstone/synthesis lessons and
introduces no productive grammar or verbs.

| A1 module | Four-lesson outcome |
|---|---|
| 1. Sounds, hiragana, and katakana bridge | Distinguish core sounds, read essential hiragana patterns, handle long/consonant contrasts, and recognize supported high-frequency katakana in familiar phrases |
| 2. Identity and self-introduction | Give and understand name, origin, language, occupation/role, and a small amount of reciprocal personal detail |
| 3. Questions and deixis | Ask/answer basic who/what/where/which/when/how-much questions and use familiar demonstratives in immediate contexts |
| 4. Actions and objects | Build polite present action sentences with common objects and recover omitted subjects from discourse |
| 5. Routines, time, and frequency | Describe a simple day using clock time, days, frequency, and recurring actions |
| 6. Tense and polarity | Reuse familiar nominal and verbal predicates across non-past/past and affirmative/negative contrasts |
| 7. Places, movement, and transport | Ask and state destinations, routes, transport, departure/arrival, and actions at places |
| 8. People, family, and relationships | Identify people and relationships, exchange limited family/social information, and arrange simple shared actions |
| 9. Descriptions, preferences, and weather | Describe familiar people/things/conditions and express simple likes, dislikes, choices, and weather observations |
| 10. Shopping, counting, and requests | Ask prices, handle basic counters/quantities, choose an item, and make bounded polite requests |
| 11. Existence, location, and needs | Locate animate/inanimate referents, understand simple position relations, and state immediate practical needs |
| 12. A1 synthesis | Complete four bounded Can-do scenarios without new productive grammar or verbs |

The four Module 12 lessons are:

1. **Self-introduction:** introduce oneself, understand another short
   introduction, and ask reciprocal questions.
2. **Daily outing:** coordinate a familiar routine, time, person, place,
   preference, and small purchase/request.
3. **Travel day:** move between places, use transport, ask a route question, and
   resolve one immediate need.
4. **Mixed dialogue:** sustain a short, supported exchange that changes topic
   once and combines identity, action, description, and clarification.

Capstones use curated scenarios and deterministic variants. They do not require
open-ended generative evaluation or knowledge outside validated A1 catalogs.

## 7. A2 architecture: 15 modules and 60 lessons

A2 has exactly 15 modules with four lessons each. Grammar is introduced only to
serve module Can-dos and then recurs across later situations.

| A2 module | Four-lesson outcome |
|---|---|
| 1. Connected conversation and backchannels | Follow and sustain short exchanges with reactions, clarification, topic continuity, and simple turn management |
| 2. Plans, schedules, and invitations | Discuss availability, invite, accept/decline, and state plans or intentions |
| 3. Experiences and short narratives | Say what one has experienced and give a short ordered account of a familiar event |
| 4. Reasons and opinions | State a simple opinion, preference, or decision and give a brief reason |
| 5. Sequencing and ongoing actions | Describe what is happening, sequence familiar actions, and connect short clauses |
| 6. Permissions, prohibitions, and requests | Ask permission, understand rules, make/answer requests, and formulate a negative request |
| 7. Home, neighborhood, and services | Describe housing/neighborhood needs and handle common local services |
| 8. Restaurant and problem handling | Order with detail, confirm requests, and handle a simple mistake, shortage, or dietary issue |
| 9. Shopping, comparison, and returns | Compare options, explain a bounded problem, and request an exchange or return |
| 10. Health and advice | Describe common symptoms, understand simple instructions, and give or receive basic advice |
| 11. Work/study messages and absences | Read/write a short practical message and explain lateness, absence, or a schedule change |
| 12. Travel, reservations, and disruptions | Make/confirm a reservation and handle a simple delay, cancellation, or route change |
| 13. Relationships, events, and gifts | Discuss invitations, celebrations, relationships, and simple gift choices or exchanges |
| 14. Practical texts and communications | Read and act on signs, notices, menus, schedules, reviews, forms, and short messages |
| 15. A2 synthesis | Complete connected everyday scenarios spanning conversation, practical text, problem handling, and a short account |

### 7.1 A2 grammar spiral

The A2 catalog includes, where needed for a Can-do:

- plain forms;
- `て`-form;
- `〜ている`;
- `〜てください`;
- `〜てもいい` and `〜てはいけない`;
- negative requests;
- `〜たことがある`;
- `予定` and `つもり`;
- `から` and `ので`;
- `と思う`;
- comparisons;
- possibility;
- only the additional connectors/forms needed for an approved A2 Can-do.

No module is a grammar dump. A grammar form must have a named Can-do, a first
supported use, controlled practice, transfer, and spaced recurrence. A
decontextualized conjugation inventory does not satisfy introduction or reuse.

## 8. Can-do model and outcome evidence

```ts
interface CanDo {
  id: CanDoId;
  level: CourseLevelId;
  domain:
    | "interaction"
    | "spoken-production"
    | "listening"
    | "reading"
    | "writing";
  descriptorCopyId: CopyId;
  contextIds: readonly ContextId[];
  lessonIds: readonly LessonId[];
  checkpointEvidenceRule: CanDoEvidenceRule;
  sourceNote?: "product-authored-jf-cefr-aligned";
}

interface CanDoEvidence {
  canDoId: CanDoId;
  visitedLessonIds: readonly LessonId[];
  practicedLessonIds: readonly LessonId[];
  acceptedTransferExerciseIds: readonly ExerciseDefinitionId[];
  checkpointAttemptIds: readonly CheckpointAttemptId[];
  lastUpdatedAt: string;
}
```

Can-do evidence records local interaction only. The UI may say "practiced" or
"shown in this checkpoint." It must not say mastered, certified, fluent, or
passed A1/A2.

Every instructional lesson serves one primary Can-do and at most two supporting
Can-dos. Every Can-do has at least one transfer exercise. A level checkpoint
samples multiple Can-dos through bounded scenarios and must not be inferred
from lesson visits alone.

## 9. Per-lesson depth and transfer contract

### 9.1 Numeric contract

Every non-phonetic instructional lesson must contain:

| Measure | Required threshold |
|---|---:|
| Model sentences | 8-12 |
| Distinct productive verbs/actions or predicates | at least 3 |
| Distinct speaker/person/subject roles | at least 3 |
| Distinct contexts | at least 2 |
| Exercises | 8-12 |
| Unique exercise target sentences | at least 5 |
| Reuse of one target sentence | at most 2 exercises |
| Transfer exercises | at least 2, including one controlled-production item |

Phonetic lessons use a separate explicit contract because "three predicates" is
not meaningful. Each phonetic lesson must still have 8-12 contrastive items or
short expressions, 8-12 exercises, at least five unique assessed targets, and
no target used more than twice.

Target accounting uses two keys:

- the **visible target key** is the normalized Japanese segment sequence;
- the **semantic fingerprint** adds sense, discourse, family, and context data.

The at-least-five unique-target and at-most-two reuse rules use the visible
target key. Identical Japanese cannot be counted twice merely by assigning
different hidden semantics. Semantic fingerprints separately prove sense,
role, context, and transfer diversity. Changing UI kind, hiding a different
segment, changing locale instructions, or declaring an accepted orthographic
variant does not create a new visible target.

### 9.2 Natural Japanese and discourse roles

Person-role diversity must not produce unnatural pronoun-heavy Japanese.
Lessons explicitly teach `わたし`, `あなた`, `かれ`, and `かのじょ` where
appropriate, but Japanese subject omission is also taught as discourse.

Every example carries speaker, addressee, and referent metadata. Diversity can
come from:

- Yuki, Ken, and Mina;
- generic named or unnamed personas;
- family roles such as mother, older brother, or partner;
- social roles such as customer, clerk, colleague, classmate, neighbor, or
  traveler;
- an omitted subject whose identity is recoverable from the scenario.

Italian and English copy must describe the same discourse facts without forcing
English-style explicit subjects into Japanese. Persona facts remain coherent
across examples, exercises, locales, and capstones.

### 9.3 Productive verb introduction and recurrence

Vocabulary entries distinguish:

```ts
type LearningUse = "productive" | "receptive";
```

A newly introduced productive verb must:

1. appear in at least two structurally distinct sentence realizations in its
   introduction lesson;
2. be a correctness-bearing target in at least one introduction-lesson
   exercise;
3. recur as a meaningful target or required building block in at least two
   later lessons;
4. have one recurrence at least two canonical lesson positions after the
   introduction;
5. have one recurrence in a later module;
6. recur through at least two distinct structures across introduction and reuse.

Adjacent duplicate examples therefore cannot satisfy the rule. A receptive
item counts only when it appears in at least two contextual input/model
instances and is correctness-bearing in at least one comprehension exercise.
It has no productive-recurrence credit. If a later lesson requires the learner
to produce it, that lesson becomes its productive introduction and all six
productive rules apply from that point. Reports keep receptive and productive
totals separate.

Two lexeme IDs with identical orthography count as different senses only when
their semantic frames differ and each sense receives contextually distinct
practice. For example, separate senses under `きく` cannot pass by pointing to
the same context-free sentence.

### 9.4 Transfer

A transfer target combines taught elements in a semantic tuple not shown as a
model sentence in the same lesson:

```text
(sentenceFamilyId, speakerRoleId, predicateSenseId, objectId?,
 locationId?, timeId?, polarityTenseForm, contextId)
```

All tuple elements and the required form must already be introduced. Transfer
does not mean surprising the learner with a new word, sense, counter, or
grammar form. A validator compares the target tuple with lesson model tuples
and rejects a "transfer" label when the tuple is identical to a model.

## 10. Sentence families and variation axes

### 10.1 Shared source of truth

Every comparison, sentence matrix entry, guided construction, spoken target,
and exercise resolves from shared sentence-family and example data. Production
components must not carry duplicated Japanese answer strings.

```ts
type VariationAxis =
  | "speaker-person"
  | "predicate-verb"
  | "object"
  | "location"
  | "time"
  | "polarity-tense-form"
  | "context";

interface SentenceFamily {
  id: SentenceFamilyId;
  level: CourseLevelId;
  canDoIds: readonly CanDoId[];
  slotSchema: readonly SentenceSlotDefinition[];
  permittedAxes: readonly VariationAxis[];
  realizationRuleId: RealizationRuleId;
  requiredConceptIds: readonly ConceptId[];
}

interface SentenceVariant {
  id: SentenceVariantId;
  sentenceFamilyId: SentenceFamilyId;
  discourse: DiscourseFrame;
  contextId: ContextId;
  slotValues: Readonly<Record<SentenceSlotId, SemanticValueId>>;
  form: FormSelection;
  pedagogicalUse:
    | "model"
    | "guided"
    | "controlled-practice"
    | "transfer"
    | "spoken";
}

interface DiscourseFrame {
  speakerRoleId: PersonRoleId;
  addresseeRoleId: PersonRoleId | null;
  subjectReferentId: ReferentId | null;
  subjectRealization: "explicit" | "omitted";
  scenarioNoteCopyId: CopyId;
}
```

The authored variant stores semantic choices, not a canonical answer literal.
The family realizer produces ordered Japanese tokens and traceable source IDs.

### 10.2 Family realization

```ts
interface RealizedSentence {
  familyId: SentenceFamilyId;
  variantId: SentenceVariantId;
  tokens: readonly AssembledToken[];
  canonicalJapanese: string;
  semanticFingerprint: string;
  usedConceptIds: readonly ConceptId[];
  usedLexemeSenseIds: readonly LexemeSenseId[];
}

interface SentenceFamilyRealizer {
  realize(
    family: SentenceFamily,
    variant: SentenceVariant,
    catalogs: FamilyRealizationCatalogs,
  ): FamilyRealizationResult;
}

type FamilyRealizationResult =
  | { ok: true; sentence: RealizedSentence }
  | { ok: false; errors: readonly FamilyRealizationError[] };
```

Realization errors include missing slots, illegal axis values, unmet concept
requirements, incompatible animacy/argument structure, invalid conjugation,
unknown sense, and a discourse reference that cannot be resolved. Invalid
authored data fails validation. Runtime callers show a localized unavailable
content notice and preserve navigation; they do not render an empty sentence or
substitute a different variant.

### 10.3 Compact sentence matrix

Each lesson exposes a compact scenario/person matrix, not a wall of 8-12 full
cards. The initial view shows a small curated subset and the active variation
axes. Learners can reveal the remaining examples by scenario or role.

The matrix must:

- keep the Japanese sentence and translation adjacent;
- expose speaker/context labels without inserting unnecessary pronouns;
- remain a semantic table/list for assistive technology;
- use disclosure controls with `aria-expanded` and `aria-controls`;
- preserve reading order and visible focus at desktop and mobile widths;
- avoid horizontal scrolling as the only way to reach an example;
- never load a different random variant after locale or script changes.

## 11. Exercise selection, generation, and evaluation

### 11.1 Deterministic selection

```ts
interface LessonPracticeDefinition {
  lessonId: LessonId;
  roundOne: PracticeRoundDefinition;
  roundTwo: PracticeRoundDefinition;
}

interface PracticeRoundDefinition {
  id: PracticeRoundId;
  purpose: "guided-controlled" | "transfer";
  candidateVariantIds: readonly SentenceVariantId[];
  selectionPolicyId: VariantSelectionPolicyId;
  exerciseKinds: readonly ExerciseKind[];
  targetCount: number;
}

interface VariantSelector {
  select(input: {
    catalogVersion: string;
    lessonId: LessonId;
    roundId: PracticeRoundId;
    seed: string;
    candidates: readonly SentenceVariant[];
    constraints: LessonDiversityConstraints;
  }): VariantSelectionResult;
}
```

The same catalog version, lesson, round, and seed must produce the same ordered
targets. Selection is deterministic across locale, browser, and JS object
iteration order. It must satisfy unique-target, family, role, predicate,
context, and transfer constraints before assigning exercise kinds.

The selector may use an answer twice only when the two interactions assess
meaningfully different skills and the lesson remains within the maximum reuse
rule. It may not present the same answer as several kinds merely to fill the
budget.

### 11.2 Two rounds

Round 1 contains guided recognition and controlled production. It may reuse
model combinations but must span several families or variants.

Round 2 uses new combinations of already taught elements. It contains at least
one controlled-construction target and at least one other transfer item. The UI
labels the shift clearly and does not expose all answers in the immediately
preceding matrix state.

### 11.3 Answer derivation

```ts
interface ExerciseEngine {
  generate(
    definition: ExerciseDefinition,
    realizedTarget: RealizedSentence,
    seed: string,
  ): ExerciseGenerationResult;

  evaluate(
    instance: ExerciseInstance,
    response: LearnerResponse,
  ): ExerciseEvaluationResult;
}
```

Canonical Japanese, tiles, blanks, choices, spoken targets, and accepted
variants derive from realized tokens. Definitions reference family, variant,
slot, and token IDs. They do not copy a Japanese answer.

Evaluation returns accepted, retry, or invalid input. A missing family/variant,
impossible choice set, duplicated token identity, failed realization, or absent
canonical target is a typed content error, not learner failure. It blocks
release validation and produces a visible localized runtime notice if somehow
reached.

Canonical answer normalization may ignore optional learner-entered whitespace.
That tolerance does not permit the visible romaji renderer to remove semantic
spaces, and normalization must not erase an assessed particle, form, sense, or
kanji distinction.

## 12. Lesson experience

Every non-phonetic lesson uses this progressive sequence:

1. **Rule and comparison:** one practical focus with an honest contrast.
2. **Scenario/person sentence matrix:** 8-12 models behind compact progressive
   disclosure.
3. **Guided construction:** one family and its controlled variation axes.
4. **Practice round 1:** guided recognition and controlled production.
5. **Practice round 2:** transfer to unseen combinations of taught elements.
6. **Spoken attempt:** optional model playback and browser-recognition attempt
   against a shared target.
7. **Recap:** the Can-do, variation used, productive/receptive vocabulary, and
   next retrieval point.

The existing stable anchors `rule`, `comparison`, `explore`, and `recap` remain
valid unless a phase-specific design proves new anchors are required. If the
two rounds need deep links, Phase 1 must define route, focus, scroll, and legacy
anchor behavior before adding IDs.

Completing a lesson never requires sound or microphone access. Spoken
recognition reports whether the browser transcript matched the expected
utterance. It does not score pronunciation.

## 13. Romaji semantic-boundary architecture

### 13.1 Token contract

Every assembled token carries an explicit display boundary:

```ts
type RomajiBoundaryBefore = "space" | "attach";

interface AssembledToken {
  id: SegmentId;
  jp: string;
  romaji: string;
  kind: "lexical" | "particle" | "morpheme" | "punctuation";
  boundaryBefore: RomajiBoundaryBefore;
  source: TokenSourceRef;
  reading?: string;
}
```

`boundaryBefore` is authored or derived by a semantic realization rule and then
validated. It must not be inferred only in CSS or from the current broad
`word | particle | ending` kind. Exceptions remain expressible.

Required examples:

```text
これ + は + コーヒー + です + か
kore wa koohii desu ka

たべ + ます
tabemasu

ゆき + は + いき + ます + 。
yuki wa ikimasu.
```

The contract is:

- the first token attaches to the empty sequence;
- lexical words normally have `space`;
- particles normally have `space`;
- inflectional morphology has `attach`;
- punctuation has `attach`;
- particle readings remain pronunciation-aware: `は` -> `wa`, `へ` -> `e`;
- semantic rules may override defaults, but every override is explicit and
  testable.

### 13.2 Shared formatter and renderer

```ts
interface RomajiSequenceFormatter {
  format(tokens: readonly AssembledToken[]): RomajiFormatResult;
}

interface RomajiRun {
  tokenId: SegmentId;
  separatorBefore: "" | " ";
  text: string;
}

type RomajiFormatResult =
  | { ok: true; text: string; runs: readonly RomajiRun[] }
  | { ok: false; errors: readonly RomajiFormatError[] };
```

One shared sequence formatter and renderer serves:

- before/after comparison cards;
- guided construction boards;
- sentence matrices;
- exercise source and target sequences;
- assembled exercise tiles when they form a sentence;
- spoken targets and highlighted recognition records;
- recaps or other course surfaces that show a full romaji sequence.

The renderer emits each run's separator outside its highlight or `mark`
wrapper. A highlighted delta therefore cannot swallow the boundary before it.
Isolated tiles do not render a meaningless leading space; the formatter applies
boundaries only when composing a sequence.

The formatter fails on an empty reading, invalid first-token boundary,
unresolved token, or illegal punctuation spacing. Runtime code must show the
localized content-error state instead of silently reverting to concatenation.

### 13.3 Regression matrix

Phase 0 unit and component tests cover:

- `は` pronounced `wa` with spaces on both sides as appropriate;
- `へ` pronounced `e`;
- lexical word, copula, and question-particle spacing;
- verb stem plus ending attachment;
- punctuation attachment;
- katakana readings and the existing long-vowel output;
- highlighted/marked deltas at the beginning, middle, and end;
- mixed highlighted and unhighlighted runs;
- comparison, guided board, sentence/exercise rendering, and spoken target
  surfaces.

The immediate fix must not change `koohii` to `kōhī` or otherwise revise
romanization beyond boundaries.

## 14. A2 kanji system

### 14.1 Scope

A2 introduces 100-150 unique kanji. The Phase 3 plan assigns the exact count and
per-module distribution within that release-blocking range. They are
distributed across the 15 modules and tied to module Can-dos. No standalone
"all kanji" chapter may carry the requirement.

The required outcomes are:

- recognize a practiced kanji word in context;
- read it with available staged assistance;
- choose the correct kanji word for a familiar context.

Handwriting, stroke order, and free production from memory are not required.

### 14.2 Catalog and exposure

```ts
interface KanjiEntry {
  id: KanjiId;
  glyph: string;
  meaningCopyId: CopyId;
  readingIds: readonly KanjiReadingId[];
}

interface KanjiExposure {
  id: KanjiExposureId;
  kanjiId: KanjiId;
  lexemeSenseId: LexemeSenseId;
  lessonId: LessonId;
  stage: "first-supported" | "supported-retrieval" | "revealable" | "assessed";
  readingId: KanjiReadingId;
  contextId: ContextId;
}

interface KanjiAssistancePolicy {
  supportFor(exposure: KanjiExposure, mode: KanjiActivityMode): {
    furigana: "visible" | "revealable" | "hidden";
    romaji: "allowed" | "not-shown";
  };
}
```

First exposure displays furigana/reading support. Later support becomes
revealable after explicit practice. Assessment may hide furigana only after a
validated earlier supported exposure and retrieval opportunity.

### 14.3 Script-setting interaction

Hiragana and romaji remain global display preferences for ordinary course
content. They cannot bypass a named A2 kanji-recognition objective:

- instructions and translations still honor locale settings;
- pronunciation support may be revealed where the assistance policy permits;
- the assessed prompt or choices retain the required kanji;
- romaji mode must not replace all assessed kanji with romaji;
- the UI explains why kanji remains visible in that activity;
- no answer requires handwriting or IME production.

Validation fails when an assessed kanji has no prior supported exposure, hides
furigana too early, uses an undeclared reading, or allows romaji-only completion
of a kanji-recognition target.

## 15. Catalog extensions and boundaries

The existing catalogs remain focused, with these additions:

| Catalog | New owned data |
|---|---|
| levels/curriculum | level IDs, Can-do IDs, checkpoints, module/lesson membership |
| sentence families | slot schemas, realization rules, permitted variation axes |
| variants/examples | discourse frame, context, semantic slot values, pedagogical use |
| people/personas | speaker, addressee, referent, generic social/family roles |
| lexicon | sense IDs and productive/receptive learning use |
| exercises | family/variant targets, rounds, deterministic selection constraints |
| romaji | assembled token boundaries and shared formatting rules |
| kanji | glyphs, readings, word senses, exposure stages, assistance policy |
| progress | level records, Can-do evidence, checkpoint attempts, migration version |
| IT/EN copy | matching learner-facing text for every new semantic key |

Japanese, semantic IDs, boundary rules, Can-do mappings, and exercise semantics
remain locale-independent. IT and EN copy catalogs must have identical key
structure. Missing copy is a validation error; one locale never silently falls
back to the other.

No catalog may own:

- duplicated Japanese answers already realizable from shared data;
- locale-specific semantic decisions;
- random runtime content generation;
- personal aliases;
- an aggregate count entered without a check against computed data.

## 16. Validators and reviewable reports

### 16.1 Release validators

The release boundary must add structured errors for:

- invalid or missing level and Can-do references;
- wrong module/lesson count per level;
- per-lesson model-sentence shortfall/excess;
- predicate/action diversity below three;
- person-role diversity below three;
- context diversity below two;
- exercise count outside 8-12;
- fewer than five unique target sentences;
- one target used by more than two exercises;
- duplicate semantic targets disguised as different exercise kinds;
- unresolved family, slot, axis, variant, discourse, or context references;
- a transfer target that duplicates a model tuple;
- a transfer target containing unintroduced content;
- productive verb lacking two introduction structures;
- productive verb lacking spaced later reuse;
- incompatible or conflated lexeme senses;
- incomplete Can-do lesson/checkpoint coverage;
- invalid kanji count, reading, exposure order, furigana stage, or assessment;
- romaji boundary/formatting errors;
- IT/EN key or semantic parity errors;
- normalized personal-alias matches.

The existing uniqueness, dependency, introduction-before-assessment,
capstone-no-new-content, answer-derivation, speech-prompt, route, and computed
coverage validators remain.

### 16.2 Validator interface

```ts
interface CurriculumValidator {
  validate(input: AssembledCatalogs): CurriculumValidationResult;
}

interface CurriculumValidationResult {
  valid: boolean;
  errors: readonly CurriculumValidationError[];
  reports: CurriculumCoverageReports;
}

interface CurriculumCoverageReports {
  byLesson: Readonly<Record<LessonId, LessonCoverageReport>>;
  byModule: Readonly<Record<ModuleId, ModuleCoverageReport>>;
  byLevel: Readonly<Record<CourseLevelId, LevelCoverageReport>>;
}
```

Validators are pure and return every deterministic error in stable order. They
do not mutate catalogs, omit invalid entries, or turn content failures into
successful empty results.

### 16.3 Content QA reports

The build/test toolchain must produce reviewable lesson and module tables with:

- model count and model semantic fingerprints;
- sentence-family and axis distribution;
- productive and receptive lexeme senses;
- predicate/action IDs;
- speaker/person/subject roles, including omitted subjects;
- context IDs;
- exercise count, unique targets, and reuse count per target;
- model versus transfer tuple status;
- verb introduction structures and later recurrence positions;
- Can-do coverage and checkpoint evidence rules;
- kanji first exposure, assistance stage, and assessment position;
- IT/EN parity status.

Reports show actual coverage, not only aggregate totals. A reviewer must be able
to inspect why `introductions-1` passes without reading the entire source
catalog. Reports are build artifacts unless a phase plan explicitly selects a
small stable summary for source control.

## 17. Progress and migration

### 17.1 Separate level progress

```ts
interface CourseProgressV4 {
  schemaVersion: 4;
  catalogVersion: "a1-a2-v1";
  levels: Readonly<Record<CourseLevelId, LevelProgress>>;
  migrationNotice: ProgressMigrationNotice | null;
  updatedAt: string;
}

interface LevelProgress {
  lessons: Readonly<Record<LessonId, LessonProgress>>;
  canDos: Readonly<Record<CanDoId, CanDoEvidence>>;
  checkpointAttempts: readonly CheckpointAttempt[];
  lastVisitedLessonId: LessonId | null;
  reviewQueue: readonly ReviewQueueEntry[];
  orphanedLessonIds: readonly string[];
  orphanedReviewKeys: readonly string[];
}

interface ProgressMigrationNotice {
  fromSchemaVersion: 3;
  preservedVisitedLessonIds: readonly LessonId[];
  resetEvidenceLessonIds: readonly LessonId[];
  acknowledgedAt: string | null;
}
```

A1 and A2 percentages, recommendations, review entries, Can-do evidence, and
checkpoints are computed independently. A2 starts empty.

### 17.2 V3-to-V4 migration

The migration is versioned, deterministic, and idempotent:

1. parse and validate the shipped v3 record without mutating it;
2. map old A1 lesson IDs through an explicit reviewed ID map;
3. preserve `visitedAt` for safely mapped lessons;
4. clear `practicedAt`, `consolidatedAt`, attempted exercise IDs, accepted
   exercise IDs, and review entries whenever redesigned content or assessment
   changes;
5. because the A1 depth rewrite changes lesson practice contracts, the default
   is visited-only preservation; a phase may preserve stronger evidence only
   for an explicitly proven unchanged assessment identity;
6. preserve unknown IDs as A1 orphans rather than assigning them to A2;
7. create empty A1 Can-do/checkpoint evidence unless a deterministic mapping is
   proven from unchanged assessment;
8. create a completely empty A2 record;
9. validate V4 before writing;
10. write only after successful validation and retain the source value on write
    failure.

The user-facing notice says that visited lessons were preserved but redesigned
practice/checkpoint evidence must be completed again. It must not imply data
loss beyond the named evidence reset. It is prominent while
`acknowledgedAt === null`; acknowledgement records a timestamp without deleting
the migration record. The same explanation remains available in progress help.

Re-reading valid V4 data does not rewrite timestamps or show the migration
notice again. Re-running the same V3 migration produces equivalent V4 data.

### 17.3 Persistence interface

```ts
interface ProgressStore {
  load(): ProgressLoadResult;
  save(progress: CourseProgressV4): ProgressSaveResult;
  clearLevel(level: CourseLevelId): ProgressClearResult;
  clearAll(): ProgressClearResult;
}

interface ProgressReporter {
  summarizeLevel(
    progress: CourseProgressV4,
    level: CourseLevelId,
    catalogs: ProgressCatalogs,
  ): LevelProgressSummary;
}
```

Storage remains under the existing browser-only course-progress key unless the
Phase 2 migration plan proves a separate atomic key safer. Locale and script
preferences are never cleared by course-progress recovery.

## 18. Error handling

Expected failures have explicit typed states and localized IT/EN notices:

- invalid level, module, lesson, section, Can-do, or legacy alias;
- missing family, variant, slot, discourse role, context, or realization rule;
- incompatible semantic slot or verb-sense frame;
- variant selection that cannot satisfy diversity constraints;
- exercise generation/evaluation invariant failure;
- invalid learner input;
- invalid romaji token boundary or formatting sequence;
- invalid kanji exposure, reading, or assistance state;
- unavailable, corrupt, unsupported-version, quota-exceeded, or write-failed
  local storage;
- obsolete progress/review/Can-do evidence;
- unavailable speech synthesis or Japanese voice;
- unsupported, denied, no-speech, aborted, network, or service recognition
  state;
- missing locale copy;
- Pages base-path or asset failure.

Authored-data failures block tests and release. Runtime code must not catch a
family, exercise, kanji, or formatter error broadly and return an empty or
success-shaped lesson. The affected region shows an error with a retry or safe
navigation action where one is meaningful.

If deterministic selection cannot meet the authored lesson constraints, the
lesson is invalid; it does not relax the target count at runtime. Storage
failures keep the current session usable in memory and state clearly that
progress will not persist.

Speech error mapping preserves distinctions and never maps a vendor error to a
learner retry or success. Development diagnostics must not include stored audio
or transcripts.

## 19. Accessibility and interaction

All new surfaces must provide:

- semantic level tabs/radios or links with an unambiguous selected state;
- level and module headings in a valid hierarchy;
- accessible sentence-matrix disclosure and scenario/person labels;
- no color-only distinction for family axes, transfer, progress, kanji support,
  or exercise state;
- visible keyboard focus for every control;
- keyboard/touch parity for level selection, disclosure, exercises, furigana
  reveal, review, and speech;
- a non-drag keyboard alternative for tile ordering;
- minimum 44 by 44 px interactive targets;
- predictable focus after reveal, submission, round transition, level change,
  and route navigation;
- polite live regions for exercise, migration, persistence, and speech status
  that do not steal focus;
- reduced-motion behavior for scroll, matrix disclosure, reordering, progress,
  and speech state;
- readable Japanese, furigana, and romaji at 200% zoom and narrow widths;
- no requirement to hear audio or speak;
- no horizontal matrix interaction as the only access path;
- labels that expose omitted-subject discourse without forcing visual clutter.

The shared romaji renderer must preserve spaces in the accessibility tree.
Highlight wrappers must not cause screen readers to concatenate adjacent
tokens. Furigana uses semantic `ruby`/`rt`; reveal controls identify the word
whose reading they expose.

## 20. Privacy, browser boundaries, and deployment

The product remains a static Vite application deployed to GitHub Pages through
the existing manual workflow. It keeps:

- `HashRouter` routes and deep links;
- `GITHUB_PAGES=true` base path `/nihongo-practice/`;
- no owned backend or runtime application API;
- no accounts, secrets, analytics, trackers, or transcript storage;
- local-only progress and settings;
- no external font request or service worker;
- no automatic deployment trigger.

Browser speech recognition may use a browser, OS, or vendor service. The
existing disclosure and explicit acknowledgement-before-microphone contract
remain. Playwright uses injected recognizers and must not contact a real speech
service.

Sentence selections, answer text, Can-do evidence, and kanji attempts remain
local. No new report sends learner data anywhere; content QA reports are
computed from authored catalogs, not user progress.

The public repository and Pages build may include the catalogs, alignment
language, and design documents. They must not include private aliases, learner
records, generated transcripts, credentials, or claims of external
certification.

## 21. Testing and release gates

### 21.1 Unit and property tests

Vitest must cover:

- every new validator and its structured error code;
- sentence-family realization across valid and invalid slot combinations;
- deterministic variant selection independent of locale and iteration order;
- semantic fingerprints and unique-target/max-reuse rules;
- model-versus-transfer tuple detection;
- productive/receptive vocabulary separation;
- productive verb introduction structures and spaced recurrence;
- no conflation of same-orthography senses without distinct contexts;
- Can-do lesson/checkpoint coverage;
- romaji boundaries, formatting runs, highlighting, punctuation, particles,
  morphology, katakana, and existing long vowels;
- answer derivation from shared realized tokens;
- kanji exposure order, reading, furigana policy, assessment, and romaji bypass
  prevention;
- direct V3-to-V4 migration, visited-only preservation, A2 clean start,
  orphans, corrupt/future data, failed writes, notice behavior, and idempotence;
- IT/EN structural and semantic parity;
- normalized no-personal-alias scanning.

Property tests use bounded generated family/axis fixtures, not random production
content. A failing generated case records a deterministic seed.

### 21.2 Playwright desktop and mobile

Deterministic Chromium tests at representative desktop and mobile sizes,
including `1440 x 1000` and `390 x 844`, cover:

- A1/A2 selector, direct routes, back/forward, recommendation, and separate
  progress summaries;
- compact sentence matrix disclosure, speaker/context labels, and natural
  subject omission;
- guided construction and both exercise rounds;
- at least five unique rendered targets in a representative lesson and no
  target used more than twice, verified through stable target metadata rather
  than brittle translated-text inference;
- transfer targets whose semantic tuple is absent from the lesson's model set;
- readable romaji spacing on comparison, guided board, matrix, exercises,
  spoken target, and highlighted deltas;
- keyboard operation, focus order, reduced motion, and 44 px targets;
- IT/EN and hiragana/romaji settings without semantic drift;
- A2 first-exposure furigana, revealable later assistance, hidden-assessment
  behavior, and no romaji-only bypass;
- speech consent, injected recognition states, and always-available fallback;
- route/section scrolling and guided return;
- GitHub Pages base path and representative hash deep links;
- zero unexpected console errors and unexpected application-owned external
  requests.

Tests must not depend on a real microphone, speech vendor, network recognition
quality, or visual OCR. Content invariants come from validated metadata and DOM
annotations; screenshots support visual review but do not pretend to prove
semantic coverage.

### 21.3 Visual and editorial review

Reviewed screenshots include:

- level selector and separate progress at desktop/mobile;
- representative A1 and A2 module maps;
- sentence matrix collapsed and expanded;
- each practice round and a transfer result;
- romaji comparison with highlighted delta;
- A2 furigana visible, revealable, and assessment states;
- speech fallback or consent/result state;
- each locale and script setting across the set.

Editorial review samples every lesson QA row and reads every model/transfer
sentence in context. It checks natural Japanese, omitted-subject clarity,
persona continuity, sense distinctions, translation parity, Can-do fit, and
whether variation is pedagogically meaningful rather than mechanical slot
substitution.

### 21.4 Static release verification

The public release requires:

1. clean dependency installation;
2. complete unit/property test suite;
3. TypeScript and standard Vite production build;
4. complete Playwright suite and reviewed screenshots;
5. `GITHUB_PAGES=true` production build;
6. local Pages-base-path smoke tests;
7. production and full dependency audits;
8. generated per-lesson/module/level content QA reports;
9. alias, secret, workflow-trigger, and external-request inspection;
10. standards-language review against Section 3 sources;
11. final tracked-content and Git status review.

No aggregate word, verb, lesson, or exercise count is sufficient by itself.

## 22. Sequential delivery

This master specification defines five phases. Each implementation phase gets a
separate design check, plan, branch/work session, verification record, and
exit gate. Later plans must not be written as if an earlier gate has passed
before it has.

### Phase 0: romaji boundary hotfix

**Scope**

- add the semantic boundary contract to assembled/render tokens;
- implement one shared formatter/renderer;
- migrate comparison, guided board, exercise, matrix-compatible shared
  primitives, and spoken surfaces that exist in the current release;
- preserve current long-vowel output.

**Dependencies:** current public baseline only.

**Exit criteria**

- required examples render `kore wa koohii desu ka` and `tabemasu`;
- particles `は`/`へ`, punctuation, katakana, highlights, and every current
  course surface pass unit/component/Playwright regressions;
- no current visible romaji sentence relies on fragment concatenation;
- standard and Pages builds pass.

Phase 0 is intentionally small and releaseable before curriculum restructuring.
Its implementation plan should be written first after this master spec is
approved.

### Phase 1: sentence-family model, validators, and lesson UX foundations

**Scope**

- introduce levels, Can-dos, sentence families/variants, discourse roles,
  contexts, learning-use metadata, and realization interfaces;
- implement deterministic selection and diversity/transfer validators;
- build the compact matrix, guided construction boundary, and two-round lesson
  UX against representative fixtures;
- add content QA report generation.

**Dependencies:** Phase 0 formatter and renderer.

**Exit criteria**

- representative A1 and A2 fixture lessons satisfy every depth invariant;
- invalid fixtures fail each new validator;
- no new surface duplicates Japanese answer strings;
- desktop/mobile accessibility and deterministic-selection tests pass;
- report tables make target/family/role/context coverage inspectable.

This phase does not rewrite all A1 content or ship A2 content.

### Phase 2: deep A1 rewrite and migration

**Scope**

- author 12 A1 modules and exactly 48 lessons;
- satisfy all model, predicate, role, context, exercise, transfer, verb-spacing,
  Can-do, locale, and persona contracts;
- implement V3-to-V4 visited-only-safe migration and notice;
- add the four A1 synthesis lessons and checkpoint.

**Dependencies:** Phase 1 contracts, UX, validators, and reports.

**Exit criteria**

- every A1 lesson passes the per-lesson report and editorial naturalness review;
- all 48 routes, IT/EN copy, script modes, two rounds, speech fallback, and
  capstones pass;
- migration preserves safe visits, resets changed evidence truthfully, starts
  A2 clean, and is idempotent;
- A1 is described as aligned, not certified;
- A1 checkpoint evidence is separate from lesson visits.

### Phase 3: A2 content, forms, kanji, and level UX

**Scope**

- author 15 A2 modules and exactly 60 lessons;
- implement the Can-do-tied grammar spiral;
- introduce and validate 100-150 contextual kanji;
- complete level selector, separate summaries, A1-first recommendation, and A2
  checkpoint behavior.

**Dependencies:** accepted deep A1 path and V4 progress architecture.

**Exit criteria**

- every A2 lesson passes depth, transfer, spacing, Can-do, locale, and
  naturalness review;
- all grammar forms serve named Can-dos and recur after introduction;
- every assessed kanji has valid supported exposure and no romaji bypass;
- A2 remains inspectable without an unnecessary hard lock;
- A1 and A2 progress/recommendations cannot contaminate each other.

### Phase 4: integrated QA, claims review, and public release

**Scope**

- run integrated content, accessibility, visual, browser, privacy, dependency,
  Pages, and public-documentation QA;
- review every standards claim and course-completion phrase;
- fix cross-level regressions only; new curriculum scope requires an amendment.

**Dependencies:** Phases 0-3 accepted.

**Exit criteria**

- Section 21 verification passes from a clean installation;
- content reports and sampled editorial review show actual per-lesson diversity;
- all public language uses "aligned with JF/CEFR Can-do" and avoids
  certification claims;
- Pages smoke tests and privacy/network checks pass;
- the release candidate has no unresolved critical QA finding.

## 23. Completion criteria

The master cycle is complete only when:

- Phase 0 readable romaji is live across every course surface;
- A1 contains 48 validated lessons and four synthesis lessons;
- A2 contains 60 validated lessons and 100-150 contextually taught kanji;
- every non-phonetic lesson meets the exact depth and transfer contract;
- every productive verb meets the introduction and spaced-reuse contract;
- all examples and exercises resolve through shared family/variant data;
- Can-do evidence and progress are separate by level;
- migration preserves only defensible evidence and communicates the reset;
- accessibility, privacy, bilingual parity, speech truthfulness, and static
  deployment gates pass;
- the public product makes alignment claims, never certification claims.

The next artifact after approval of this specification is the Phase 0
implementation plan only. Phases 1-4 receive their own plans after the preceding
exit gate passes.
