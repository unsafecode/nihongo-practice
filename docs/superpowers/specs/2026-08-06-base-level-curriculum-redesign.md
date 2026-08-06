# Base level curriculum redesign

**Status:** Approved architecture; validated design input  
**Date:** 2026-08-06  
**Repository:** `unsafecode/nihongo-practice`  
**Baseline:** deployed `master` at `136fb9f0dc62a8c5284c98d8cbd44ad2de90ddbc`  
**Delivery boundary:** design only; implementation planning and product changes are explicitly deferred

## 1. Decision and authority

Add a distinct learner-facing **Base** level before A1. Its internal level ID is
`a0`; learner copy always says **Base**, not A0. Base contains **10 modules and
40 lessons**. It is the recommended starting point, but Base, A1, and A2 remain
open at all times. No prerequisite becomes a lock.

This design supersedes the following documents only where they define the
learner-facing foundations level, its ownership, and its lesson-depth contract:

- `2026-08-04-a1-foundations-curriculum-design.md`;
- `2026-08-05-a1-foundations-area-expansion-design.md`.

The stable-route, semantic-source, privacy, accessibility, browser-speech,
localization, static-deployment, and evidence-truthfulness requirements from
the earlier designs remain in force unless this document strengthens them.

The existing A1 situation modules remain practical scenario lessons. They are
not rewritten merely to make the new level look different. A2 editorial
content, its 60 lesson routes, its kanji schedule, and its golden editorial
surfaces remain unchanged.

## 2. Why the deployed design is still shallow

The deployed release has more structure, but its own contracts cap the visible
teaching depth:

- the 2026-08-05 design explicitly chose 4-6 new words, 2-3 worked examples,
  four generated activities, and one listening/speaking activity;
- the 16 current Foundations lessons introduce only 66 lexemes in total;
- `A1LessonContent` permits only two or three worked-example IDs and only two or
  three dialogue-turn IDs;
- the production tests require exactly five activities and accept four
  cognitive functions;
- each lesson resolves one compact `A1LearningNote`;
- those notes are generally only about 500-850 characters of learner-facing
  explanatory copy per locale;
- dialogue lessons may point `workedExampleVariantIds` and `turnVariantIds` at
  the same model IDs. `time-movement-4` does exactly that for all three turns;
- additional semantic model variants are not learner-visible and therefore do
  not add instructional depth.

The result is a sequence of isolated capsules. It does not give a new learner
an accumulated sentence model, particle system, verb-class model, conjugation
system, or durable reference surfaces. The validators prove that the compact
contract was filled, not that the learner received enough teaching.

This redesign treats visible learner evidence as the release unit. Hidden
variants, duplicated cards, character-count minima, and repeated exercise
widgets cannot satisfy a depth gate.

## 3. Product principles

1. Teach practical, non-business Japanese for ordinary conversation.
2. Build one cumulative mental model: sentence anatomy, particles, predicates,
   forms, and discourse choices must connect across lessons.
3. Keep Japanese hiragana-first. Romaji remains optional and independently
   controlled from the Italian or English interface locale.
4. Keep canonical Japanese and semantic IDs locale-independent. Italian and
   English copy must be structurally complete and independently natural.
5. Teach a word, form, or grammar function before examples, dialogue, or
   practice assess it.
6. Count only distinct visible teaching surfaces. Hidden source variants are
   useful authoring material, never evidence of learner-facing depth.
7. Preserve every published lesson URL and every stored evidence record.
8. Keep navigation open. Recommendations may guide; they may not punish,
   disable, or shame a learner who starts with A1 or A2.
9. Browser audio and speech are enhancements. Their failure must never make the
   instructional text or non-spoken practice unavailable.
10. Fail closed during authoring and prebuild. Do not render partial success for
    incomplete content.

## 4. Approaches considered

### 4.1 Selected: Base level with stable-route rehoming

Create a separate 10-module Base manifest. Rehome the existing `sounds`,
`sentence-foundations`, `topic-questions`, `polite-verbs`, and `time-movement`
modules from A1 to Base without changing any module ID, lesson ID, or lesson
URL. Deeply expand those 20 routes and add five missing four-lesson modules.
The A1 map becomes the 11 existing scenario/synthesis modules, and A2 remains
unchanged.

This is the selected approach because it gives foundations an honest product
identity, avoids duplicate first-teach ownership, retains 20 useful published
routes, leaves practical A1 scenarios recognizable, and provides a clean
migration boundary.

### 4.2 Rejected: keep Foundations inside A1 and add more cards

This would preserve the current two-level model, but it would repeat the failed
architecture. The level would still mix prerequisite teaching with scenario
performance, the level selector could not state the real learning progression,
and first-teach ownership would remain difficult to audit. Adding examples to
the same 16 lessons would also leave major systems such as adjective behavior,
existence, and the practical `て` form without enough space.

### 4.3 Rejected: replace all early A1 lessons with 40 new routes

A fully new Base catalog would make ownership simple, but would strand useful
published routes, duplicate content, create unnecessary aliases, and weaken
the connection between stored evidence and the lesson a learner actually
visited. A destructive full A1 rewrite would also put all accepted A1 evidence
at risk and needlessly disturb scenario lessons that still serve their purpose.

## 5. Three-level product architecture

### 5.1 Level identity

The runtime level union becomes:

```ts
type CourseLevelId = "a0" | "a1" | "a2";
```

Learner-facing labels and URL values are:

| Internal ID | Learner label | Course-map query |
|---|---|---|
| `a0` | Base | `?livello=base` |
| `a1` | A1 | `?livello=a1` |
| `a2` | A2 | `?livello=a2` |

`base` is deliberately used in the URL rather than exposing `a0`. Existing A1
and A2 query values remain valid.

The selector order is Base, A1, A2. All options are real links, keyboard and
touch operable, and always enabled. Copy says:

- Base is recommended for learners who want sentence and form foundations;
- A1 is available immediately and applies those foundations in situations;
- A2 is available immediately and builds broader connected conversation.

No copy uses certification, pass/fail, deficiency, or locked-course language.

### 5.2 Default and recommendation behavior

An explicit `livello` query always wins. Without one:

1. a valid stored level preference wins;
2. otherwise, existing A1 or A2 evidence selects A1 for compatibility with
   returning learners;
3. otherwise, a fresh learner sees Base.

Selecting a level updates the URL and the local preference. It does not mutate
lesson evidence. Completing or attempting a checkpoint may change a soft
recommendation, never the available routes.

The preference is stored separately as `nihongo.course.level`, following the
existing locale/script preference boundary rather than pretending that a
navigation choice is learning evidence. Missing or invalid values use the
rules above.

### 5.3 Route stability

The canonical lesson route remains:

```text
/percorso/:moduleId/:lessonId
```

All existing lesson routes remain byte-for-byte valid. Rehomed lessons resolve
to their new Base owner from the global route registry and render with Base
navigation. They do not redirect to a new lesson ID. Existing legacy aliases
continue to resolve to their current lesson IDs before level ownership is
looked up.

The A1 course map no longer lists rehomed modules, but direct links to those
routes remain valid because they now belong to Base. New reference routes are:

```text
/riferimenti/base/:referenceId
```

Reference links may add a validated `throughLessonId` query to show the
cumulative state at a particular point. No localized title is used as an ID.

## 6. Canonical course ownership

### 6.1 Base manifest: 10 modules, 40 lessons

```text
sounds
sentence-foundations
topic-questions
core-particles
polite-verbs
time-movement
copula-adjectives
existence-location
requests-connection
base-synthesis
```

Each module has exactly four lessons. The first five module IDs and their 20
lesson IDs already exist and retain their routes. The last five module IDs add
20 new routes.

### 6.2 A1 manifest after rehoming

A1 retains these existing modules and all 44 existing lesson routes:

```text
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

A1 becomes the practical situation level. Its Japanese, Can-do situations, and
lesson outcomes are not broadly rewritten. Required compatibility edits are
limited to:

- changing a foundational item from `introduced` to `reviewed/applied` when
  Base owns its first teaching;
- linking to the relevant Base reference snapshot;
- removing a duplicate first-teach claim;
- correcting content only when the stronger naturalness, ordering, or leakage
  validators find a real defect.

Existing scenario-specific vocabulary remains owned by its A1 lesson.

### 6.3 A2 boundary

A2 retains its existing manifest, lesson IDs, editorial Japanese, translations,
kanji schedule, references, practice, and progress. Shared type changes may add
Base compatibility, but A2 content snapshots must remain byte-for-byte equal.

### 6.4 Global first-teach registry

Lexemes, grammar concepts, forms, and reference entries use one cross-level
ownership registry:

```ts
interface FirstTeachOwner {
  readonly contentId: string;
  readonly levelId: CourseLevelId;
  readonly lessonId: string;
  readonly kind: "lexeme" | "concept" | "form" | "reference-entry";
}
```

Each teachable item has exactly one owner. A later lesson declares an item as
review, application, or recognition; it cannot declare it new again. Canonical
course order for prerequisite validation is Base, then A1, then A2 even though
navigation remains open.

## 7. Base curriculum map

### 7.1 Module 1: `sounds` - Sounds, rhythm, and scripts

| Stable lesson ID | Learner outcome |
|---|---|
| `sounds-1` | Hear and produce the five steady vowels and count morae rather than English-style syllables |
| `sounds-2` | Distinguish core consonant rows, voicing, and common minimal sound contrasts |
| `sounds-3` | Hear and read long vowels, small `っ`, and moraic `ん` without collapsing timing |
| `sounds-4` | Read contracted sounds and practical katakana while keeping hiragana as the primary course script |

Sound lessons teach listening and script foundations honestly. They do not
invent sentence predicates or inflate lexeme counts with isolated kana.

### 7.2 Module 2: `sentence-foundations` - Sentence anatomy and recoverable omission

| Stable lesson ID | Learner outcome |
|---|---|
| `sentence-foundations-1` | Read Japanese as ordered information chunks with the predicate at the end |
| `sentence-foundations-2` | Distinguish a stated topic or subject from information naturally omitted because context recovers it |
| `sentence-foundations-3` | Recognize noun, adjective, and verb predicates and know what can close a sentence |
| `sentence-foundations-4` | Put modifiers before nouns and assemble a complete short sentence without copying English word order |

This module progressively fills the sentence anatomy map. It explicitly
distinguishes grammatical role, discourse topic, and English translation
choices. It does not teach "Japanese has no subjects."

### 7.3 Module 3: `topic-questions` - Topic, focus, questions, and sentence endings

| Stable lesson ID | Learner outcome |
|---|---|
| `topic-questions-1` | Establish and maintain a topic with `は`, including natural omission after the topic is recoverable |
| `topic-questions-2` | Use `が` for focus or grammatical subject and contrast it with topic `は` |
| `topic-questions-3` | Ask content and yes/no questions with core question words and polite question `か` |
| `topic-questions-4` | Manage a four-to-eight-turn clarification exchange with `か`, `ね`, and `よ` where those endings are natural |

`ね` and `よ` are introduced as common interactional endings, not universal
English punctuation equivalents. The particle atlas begins with `は`, `が`,
and question `か`.

### 7.4 Module 4: `core-particles` - Core particle atlas

| New lesson ID | Learner outcome |
|---|---|
| `core-particles-1` | Mark a direct object with `を` and contrast object marking with topicalizing that object using `は` |
| `core-particles-2` | Contrast time/destination `に`, direction `へ`, and action-place/instrument `で` |
| `core-particles-3` | Use noun-linking `の`, companion/listing `と`, and additive `も` in practical phrases and sentences |
| `core-particles-4` | Express source and limit with `から` and `まで`, then choose among the complete Base particle set in context |

The atlas always states what role a particle marks, what it does not mark, and
its nearest useful contrast. `と` is limited here to companion and exhaustive
listing; quotation is not silently assessed.

### 7.5 Module 5: `polite-verbs` - Dictionary forms, classes, and polite stems

| Stable lesson ID | Learner outcome |
|---|---|
| `polite-verbs-1` | Treat dictionary form as the lookup form and recognize a verb predicate |
| `polite-verbs-2` | Distinguish godan and ichidan verbs using forms and reviewed exceptions rather than the final sound alone |
| `polite-verbs-3` | Form the polite stem for godan and ichidan verbs and handle `する` and `くる` explicitly |
| `polite-verbs-4` | Build practical polite nonpast sentences from dictionary form, stem, particles, and `ます` |

The verb-class grid names godan, ichidan, `する`, and `くる`. It shows the
godan final-kana-to-i-row transformation, ichidan `る` removal, and both
irregular polite stems `し` and `き`. It does not pretend every `-iru/-eru`
verb is ichidan.

### 7.6 Module 6: `time-movement` - Tense, time, and polarity

| Stable lesson ID | Learner outcome |
|---|---|
| `time-movement-1` | Interpret polite nonpast as current, habitual, or future from context |
| `time-movement-2` | Choose time `に` where appropriate and omit it with relative time expressions where appropriate |
| `time-movement-3` | Form and contrast `ます`, `ません`, `ました`, and `ませんでした` |
| `time-movement-4` | Use the four polite verb forms in a real schedule or movement dialogue with explicit time cues |

The tense/polarity grid separates grammatical nonpast from English present
tense. It explicitly contains `ます`, `ません`, `ました`, and
`ませんでした`. Time words and discourse context must disambiguate current,
habitual, and future readings in visible examples.

### 7.7 Module 7: `copula-adjectives` - Noun predicates, copula, and adjectives

| New lesson ID | Learner outcome |
|---|---|
| `copula-adjectives-1` | Build polite noun predicates with affirmative and negative nonpast copula forms |
| `copula-adjectives-2` | Contrast polite copula nonpast/past and affirmative/negative forms |
| `copula-adjectives-3` | Use `い` adjectives as predicates and noun modifiers across the Base tense/polarity scope |
| `copula-adjectives-4` | Use `な` adjectives as predicates and place `な` before a modified noun, contrasting them with `い` adjectives |

The canonical polite forms are explicit. Contractions such as `じゃ` may be
introduced as common recognition/application forms only when their relationship
to the canonical grid is shown. The grid includes noun/`な`-adjective predicate
`です`, `ではありません`, `でした`, and `ではありませんでした`; it also
shows the `い`-adjective patterns `おいしいです`, `おいしくないです`,
`おいしかったです`, and `おいしくなかったです` with substitutable
lexical stems. The adjective/copula grid never applies copula conjugation rules
to an `い` adjective stem.

### 7.8 Module 8: `existence-location` - Existence, people, things, and location

| New lesson ID | Learner outcome |
|---|---|
| `existence-location-1` | Choose `ある` for inanimate existence and `いる` for animate existence |
| `existence-location-2` | Build the location frame `place に entity が ある／いる` |
| `existence-location-3` | Contrast existence-location `に` with action-place `で` and topic `は` with existential `が` |
| `existence-location-4` | Ask where a person or thing is and resolve a practical four-to-eight-turn finding-place dialogue |

Location nouns and `の` phrases recur from the particle atlas. Possession-like
existence is taught only through natural beginner contexts, not as a universal
translation rule for English "have."

### 7.9 Module 9: `requests-connection` - Practical `て` form, requests, and connection

| New lesson ID | Learner outcome |
|---|---|
| `requests-connection-1` | Form a minimal practical `て` form for the taught godan groups, ichidan verbs, `する`, and `くる` |
| `requests-connection-2` | Make and understand practical requests with `てください` and appropriate softening |
| `requests-connection-3` | Connect two simple actions with the `て` form without implying every possible discourse relation |
| `requests-connection-4` | Handle a practical request-and-response dialogue using known particles, forms, and natural omission |

This is a bounded Base layer. It does not introduce the progressive,
permission, prohibition, or full informal conjugation systems by implication.
The practical `て` grid explicitly covers `う／つ／る -> って`,
`む／ぶ／ぬ -> んで`, `く -> いて`, `ぐ -> いで`, `す -> して`,
ichidan `る -> て`, `する -> して`, and `くる -> きて`, plus only reviewed
high-frequency exceptions such as `いく -> いって`.

### 7.10 Module 10: `base-synthesis` - Practical Base synthesis

| New lesson ID | Learner outcome |
|---|---|
| `base-synthesis-1` | Sustain an identity and description exchange using natural topic continuity |
| `base-synthesis-2` | Describe a routine or plan across time, tense, and polarity |
| `base-synthesis-3` | Locate a person or thing and make a practical request |
| `base-synthesis-4` | Complete a mixed Base checkpoint covering sentence anatomy, particles, predicates, and interaction |

These lessons introduce no new grammar and no new lexemes. They retrieve
previously taught material in new contexts and report observed evidence only.
The checkpoint is not a certification and does not unlock A1.

## 8. Lesson depth contracts

Depth is measured from the production learner view, not from source-file size,
token count, or hidden variants.

### 8.1 Semantic instructional lessons

Each lesson in modules 2-9 must contain:

- **8-12 genuinely new lexemes**;
- **6-10 unique visible worked examples**;
- a **4-8 turn dialogue** when the outcome is interactive;
- one main explanation, at least one explicit contrast, and a link to the
  cumulative reference state;
- **at least 8 non-spoken activities** covering eight distinct cognitive
  functions;
- **2 listening/speaking activities**, one listening-led and one spoken;
- a cumulative recap that retrieves current and earlier material.

The eight required non-spoken functions are:

1. meaning comprehension;
2. form or function discrimination;
3. sentence/chunk ordering;
4. controlled production;
5. transformation;
6. contrast or error diagnosis;
7. contextual response;
8. cumulative retrieval.

The two audio functions are:

9. listening comprehension or discrimination;
10. spoken production.

An interaction widget is not a cognitive function. Reusing a choice widget for
two genuinely different functions is allowed; relabeling the same prompt is
not.

### 8.2 Lexeme substance rules

A count of 8-12 is necessary but not sufficient:

- inflected forms of one verb are one lexeme, not separate words;
- particles, endings, punctuation, names used only as interchangeable slots,
  and spelling variants do not inflate the count;
- two senses count separately only when the lesson teaches their distinct
  meaning and context;
- every new lexeme appears in a visible worked example or dialogue and is
  retrieved by at least one activity in the same lesson;
- every new lexeme recurs in at least two later lessons, except late-module
  items that recur in at least two Base synthesis surfaces;
- a vocabulary list entry that is never used fails validation.

### 8.3 Worked examples and dialogues

A visible example includes Japanese, optional romaji, token roles/glosses, a
natural translation, an audio control, and a short teaching purpose. The 6-10
examples must collectively cover:

- at least two structural patterns;
- at least three contexts or discourse roles;
- the lesson's principal contrast;
- all newly taught grammar and forms.

Dialogue turns are additional visible surfaces. A dialogue may not repeat a
worked-example fingerprint, and two turns may not be cosmetic substitutions of
the same utterance. A valid dialogue has at least two speakers, coherent
adjacency pairs, recoverable omissions, and a practical outcome.

### 8.4 Main explanation and cumulative contrast

One compact note is no longer the whole grammar contract. A semantic lesson has:

- a main explanation of meaning/function;
- a construction or form procedure;
- constraints and a typical error;
- an explicit nearest contrast;
- a cumulative reference snapshot showing how this lesson changes an existing
  map or grid;
- links back to prerequisite teaching and forward only through labels, never
  through assessed future content.

Character minima are forbidden. Validators prove required semantic blocks,
references, concepts, and visible examples instead.

### 8.5 Sound lesson exception

Sound lessons use a phonetic contract:

- 10-16 genuinely distinct contrastive sound/kana items;
- 4-8 meaningful anchor words with EN/IT meanings, not claimed as a full
  sentence-ready vocabulary lesson;
- at least six unique visible audio exemplars;
- a main phonetic explanation plus an explicit contrast map;
- six non-spoken activities covering sound discrimination, mora segmentation,
  kana recognition, script mapping, sound-to-word matching, and controlled
  reading assembly;
- one listening identification activity and one spoken/read-aloud activity.

The semantic 8-12 lexeme and 6-10 sentence-example minima do not apply. A sound
lesson cannot pass by inventing sentence metadata.

### 8.6 Synthesis lesson exception

Base synthesis lessons introduce zero lexemes and zero grammar concepts. Each
must visibly retrieve at least 12 previously taught lexemes, at least four
grammar systems, 6-10 unique worked examples, and a 4-8 turn practical dialogue.
They use the full 8+2 activity contract. The zero-new-content exception is
explicit and valid only for `base-synthesis`.

### 8.7 Default-visible rule

Vocabulary, explanations, contrast, examples, and dialogue are present and
visible in the default lesson flow. Progressive exercise steps may appear after
the learner acts, but every required activity must be reachable and rendered
through the production interaction. Collapsed optional matrices, off-screen
model pools, test fixtures, metadata, and source-only variants do not count.

## 9. Persistent learner reference surfaces

Base adds five canonical reference surfaces derived from the same semantic and
form catalogs as lessons:

| Reference ID | First introduced | Progressive content |
|---|---|---|
| `sentence-anatomy` | `sentence-foundations-1` | chunks, topic/subject status, modifier order, predicate types, endings |
| `particle-atlas` | `topic-questions-1` | `は`, `が`, `を`, `に`, `で`, `へ`, `の`, `と`, `も`, `から`, `まで`, and question `か` |
| `verb-classes-conjugation` | `polite-verbs-1` | dictionary form, godan/ichidan/`する`/`くる`, polite stems, polite and practical `て` forms |
| `tense-polarity` | `time-movement-1` | nonpast semantics and the four polite verb forms |
| `adjective-copula` | `copula-adjectives-1` | noun predicate, polite copula, `い` adjective, and `な` adjective grids |

Every reference entry declares:

- its unique semantic ID;
- first-teach lesson;
- prerequisite entry IDs;
- localized label and explanation;
- canonical form cells sourced from the form engine;
- contrast IDs;
- example IDs already valid at that point in course order.

Within a lesson, the reference snapshot shows entries through that lesson only.
The reference hub defaults to the learner's furthest visited Base lesson. A
learner may explicitly choose the full overview; future entries are labelled
as previews, are not included in lesson depth counts, and are never assessed
before their owner lesson.

With no visited Base lesson, the hub shows the reference index and the first
sentence-anatomy introduction state; it does not pre-expand future grid cells.

Reference links appear in the Base course map, every Base lesson recap, and
later A1 lessons that apply the referenced system. References remain available
without completing a lesson.

Responsive reference tables use real captions, row/column headers, and a
stacked small-screen representation generated from the same data. They do not
maintain separate mobile copy.

## 10. Authoring boundaries and data flow

Base receives its own manifest, lesson-content catalog, copy registry, Can-do
registry, and release validator. It reuses the existing semantic values,
sentence families, realizer, exercise engine, romaji formatter, audio adapters,
and immutable-catalog patterns where they are correct.

```text
Base lesson route
  -> global route owner
  -> Base lesson content
     -> first-teach registry
     -> lexeme records
     -> grammar/form records
     -> worked-example and dialogue references
     -> reference-surface entries
     -> practice blueprint
  -> canonical semantic realization
  -> localized learner view
  -> visible-depth and leakage probes
  -> lesson sections and reference links
```

Canonical Japanese is authored once in semantic/form sources. Lesson copy
references IDs. Reference grids derive forms from the form engine; they do not
copy conjugation strings into a second source of truth.

Base may extend a sentence family or form rule only when the required Base
structure cannot be represented honestly. A shared change must preserve A1/A2
realization snapshots unless an explicitly reviewed correction is required.

The existing six section anchors stay stable:

1. `rule` - outcome, situation, prerequisites, and sentence-system orientation;
2. `vocabulary` - new or synthesis-review lexemes;
3. `grammar` - main explanation, construction, contrast, and reference snapshot;
4. `comparison` - worked examples and dialogue;
5. `explore` - the 8+2 practice sequence;
6. `recap` - retrieval cue and durable reference links.

No new anchor invalidates an existing deep link.

## 11. Safe progress and ownership migration

### 11.1 Schema

Progress advances from schema V4 to V5 because a third level and ownership
history are real shape changes:

```ts
interface CourseProgressV5 {
  readonly schemaVersion: 5;
  readonly catalogVersion: "base-a1-a2-v1";
  readonly levels: Readonly<Record<"a0" | "a1" | "a2", LevelProgressV5>>;
  readonly migrationNotice: BaseOwnershipMigrationNotice | null;
  readonly updatedAt: string;
}
```

Attempted and accepted exercise IDs are append-only evidence. Current lesson
completion is derived against the current required definition set; it is not
inferred merely from an old `consolidatedAt`.

### 11.2 Rehomed lessons

The exact 20 lesson IDs under `sounds`, `sentence-foundations`,
`topic-questions`, `polite-verbs`, and `time-movement` have a reviewed ownership
map from A1 to Base.

For each rehomed lesson, V4-to-V5 migration:

1. transfers the complete lesson evidence record from `levels.a1.lessons` to
   `levels.a0.lessons` without changing any timestamp or attempted/accepted ID;
2. does not duplicate the active record in both levels;
3. records the former level and destination in the migration notice;
4. treats the stable lesson ID as a safe identity, not an orphan;
5. preserves historical `practicedAt` and `consolidatedAt` as milestones;
6. derives current-revision completion separately from the expanded required
   activity IDs.

If a previously consolidated lesson lacks new required activities, the UI says
that the learner completed an earlier version and that expanded material is
available. It does not erase the milestone or falsely claim the expanded
revision is complete.

### 11.3 Exercise and review evidence

All attempted and accepted exercise IDs remain stored. Published definitions
that still represent the same target keep their IDs. A changed or removed
definition is retained as historical evidence but cannot satisfy a new required
activity.

Active review entries for rehomed lessons move to Base when their definition is
still valid. Removed definitions become full orphan records, not discarded
keys, retaining the original lesson ID, definition ID, target IDs, mistake
count, and timestamp. They are excluded from the active queue and explained in
localized migration help.

### 11.4 Can-do and checkpoint evidence

Can-do IDs remain stable. A Can-do wholly owned by a rehomed lesson transfers
its complete evidence to Base. A historical A1 checkpoint attempt remains
unchanged in A1. If transferred Can-do evidence references that attempt, V5
stores a typed historical checkpoint reference with `sourceLevel: "a1"` rather
than copying the checkpoint or dropping the relationship.

A1 Can-dos owned by scenario lessons and every A2 Can-do remain in place.
Checkpoint attempts, accepted exercise IDs, sampled Can-do IDs, and timestamps
are never fabricated or reset.

### 11.5 Continuation behavior

If V4 `levels.a1.lastVisitedLessonId` is rehomed, it becomes Base's last visited
lesson and the migration notice records its source. A1 continuation is then
derived from retained A1 evidence without inventing a visit. The first post-
migration course-map selection is Base so the learner resumes the same route.

If the last visited lesson remains in A1 or A2, it remains unchanged. Fresh
learners start at `sounds-1`. Returning learners are never forced back to the
beginning of Base.

### 11.6 Migration invariants

Migration must be pure, deterministic, idempotent, level-scoped, and free of
timestamp churn. It must:

- preserve every source evidence value either as active evidence or a typed
  historical/orphan record;
- leave A2 deeply equal;
- never map by localized title, position alone, or approximate content;
- reject corrupt, unversioned, and future-schema input rather than guessing;
- validate every source and target lesson, exercise, Can-do, checkpoint, and
  review reference;
- produce the same V5 value for repeated migration of the same source.

## 12. Validator and report contract

Validators operate on the production catalogs, realized learner views, and
render probes. Fixture-only or declaration-only success is insufficient.

### 12.1 Structure and ownership failures

The release fails on:

- any Base count other than 10 modules and 40 lessons;
- any A1 count other than the retained 11 modules and 44 lessons;
- duplicate or missing global module/lesson IDs;
- a route whose resolved owner differs from its manifest owner;
- an existing route or alias that no longer resolves;
- duplicate, missing, future, or cyclic prerequisites;
- duplicate first-teach ownership;
- a Base-owned item still declared new in A1;
- an item used or assessed before its first-teach lesson.

### 12.2 Visible-depth failures

The release fails when:

- a semantic instructional lesson has fewer than 8 or more than 12 genuine new
  lexemes;
- a declared new lexeme is absent from visible teaching or same-lesson
  retrieval;
- recurrence requirements are unmet;
- a semantic lesson has fewer than 6 or more than 10 unique visible worked
  examples;
- a required interaction lacks a 4-8 turn dialogue;
- worked examples or dialogue turns duplicate one another by normalized visible
  semantic fingerprint;
- a dialogue repeats the worked-example list under a new heading;
- a hidden-only variant, optional collapsed matrix, metadata record, or fixture
  is counted as visible depth;
- the main explanation, construction, explicit contrast, or cumulative
  reference snapshot is missing;
- a synthesis or sound exception violates its exact contract.

The visible fingerprint includes normalized Japanese tokens, form selection,
semantic roles, discourse frame, and assessed function. Cosmetic copy, IDs, or
widget kinds cannot make duplicates unique.

### 12.3 Practice-function failures

The release fails when:

- a semantic/synthesis lesson lacks eight non-spoken plus two audio activities;
- any required cognitive function is absent;
- two activities relabel the same target and operation as different functions;
- visible targets repeat within a lesson;
- a generated exercise duplicates a worked example instead of requiring
  transfer;
- an activity uses untaught vocabulary, grammar, or forms;
- review retrieval clones the failed function or visible target;
- sound practice claims semantic sentence functions it does not teach.

### 12.4 Cumulative-reference failures

The release fails when:

- any of the five required reference surfaces is missing;
- a required particle, verb class/form, tense/polarity cell, predicate type, or
  adjective/copula cell is absent;
- a reference entry has no first-teach owner or appears in a lesson snapshot
  before that owner;
- a grid cell disagrees with canonical form realization;
- a later lesson that applies a system cannot retrieve the relevant cumulative
  snapshot;
- a contrast points to missing or future-only teaching.

### 12.5 Natural Japanese failures

Automated structural checks fail on known beginner-content hazards, including:

- repeated explicit pronouns where the discourse model marks the referent as
  recoverable;
- omitted referents without a recoverable antecedent;
- particle roles inconsistent with the sentence family;
- impossible or mismatched predicate/form combinations;
- English-order modifier placement;
- dialogue turns without coherent speaker, referent, or adjacency continuity;
- translations that erase the contrast the example claims to teach.

Automation cannot prove naturalness by itself. Every visible Japanese example,
dialogue, prompt, accepted answer, and audio string therefore has a stable
content fingerprint in a naturalness review ledger. Prebuild fails if the
fingerprint lacks an accepted review by a Japanese-content reviewer independent
of the author, or if content changed after review. A machine-clean but
unreviewed sentence is not releasable.

### 12.6 Localization failures

The release fails on missing or structurally unequal EN/IT copy, empty
translations, locale fallback, copied sentence translations used as word
meanings, Japanese authored in locale copy, romaji authored independently from
canonical tokens, missing audio/error copy, or a reference table whose mobile
and desktop labels diverge.

### 12.7 Migration-safety failures

Migration validation uses reviewed V4 fixtures containing every evidence field,
rehomed and retained last-visited values, valid and removed reviews, Can-do and
checkpoint links, existing orphans, and A2 evidence. It fails on any dropped,
duplicated, reattributed, timestamp-mutated, non-idempotent, or guessed value.

### 12.8 Reports

Build reports expose, per lesson:

- contract and owner level;
- new, reviewed, used, and recurring lexeme IDs;
- visible example and dialogue fingerprints;
- explanation and contrast IDs;
- cumulative reference entries visible at that point;
- activity functions, widget kinds, target fingerprints, and assessed IDs;
- first-teach and prerequisite closure;
- naturalness-review fingerprint/status;
- production view and render-probe success.

Aggregate reports include distributions and explicit unresolved findings. A
total alone never passes the release.

## 13. No-answer-leakage requirements

Before an attempt, the exercise DOM and accessibility tree must not contain the
canonical answer, accepted alternatives, normalized answer, answer-bearing
Japanese in data attributes, or feedback that identifies the correct choice.
Opaque IDs must not encode answer text.

Worked examples teach the target system, but required exercises use different
visible fingerprints. A learner must transfer the rule rather than copy the
example immediately above it.

Answer derivation remains semantic and deterministic. Feedback appears only
after submission and reveals no unrelated future content. Speech activities do
not place the expected transcript in the DOM before recording. Unsupported
speech uses a truthful listen-and-self-check fallback, not a success result.

Leakage tests inspect:

- server/static markup and hydrated pre-attempt DOM;
- accessible names, descriptions, live regions, and hidden elements;
- `data-*` attributes and serialized component props;
- choice/distractor construction;
- retry and review states;
- listening and speech fallback states.

The client bundle necessarily contains application logic and catalogs; this
gate concerns learner-facing and trivially encoded pre-attempt disclosure, not
security-through-obscurity claims for a browser-only application.

## 14. Accessibility, responsive behavior, and zoom

Base lessons and references must provide:

- semantic heading order, lists, dialogues, table captions, row/column headers,
  and labelled regions;
- `lang="ja"` on Japanese and stable semantic token boundaries in both script
  modes;
- visible text labels for particle, ending, form, contrast, and progress states;
- keyboard/touch parity and visible focus for every control;
- minimum 44 by 44 CSS-pixel interactive targets;
- polite live regions for exercise, review, audio, and speech status;
- no color-only meaning;
- reduced-motion behavior;
- focus movement to real headings after level or reference changes;
- logical reading and tab order when content is visually rearranged.

At desktop, 390 px mobile, 320 CSS px, 200% zoom, and 400% reflow:

- the page has no horizontal overflow;
- text is not clipped or overlapped;
- lesson navigation and all activities remain operable;
- reference grids switch to the generated stacked representation before they
  would require two-dimensional page scrolling;
- any intentionally scrollable code/token row is a labelled local region, not
  whole-page overflow.

Hiragana-first content remains readable without romaji. Enabling romaji may
grow cards vertically but may not truncate Japanese, meanings, or controls.

## 15. Audio and speech error handling

Vocabulary, worked examples, dialogue turns, and listening activities use the
existing browser speech/audio boundary. Controls expose localized idle,
playing, stopped, unavailable, blocked, and failed states. A new play request
may stop the previous utterance, but the UI must report that transition.

On synthesis failure, the learner keeps the visible Japanese, romaji setting,
meaning, and retry control. On speech-recognition unavailability or denial, the
spoken activity becomes an explicit listen-and-self-check path. It cannot mark
an attempt accepted automatically.

Errors are scoped to the control or activity that failed. They do not collapse
the lesson, erase progress, or silently fall back to a success-shaped state.
All status changes are keyboard reachable and announced without stealing focus.

No audio recording is uploaded or retained by the application. Browser and
privacy copy remains truthful in Italian and English.

## 16. Localization and writing

Every learner-facing field has independently authored English and Italian copy:
level navigation, module/lesson outcomes, lexeme meanings, explanations,
contrasts, reference labels, example translations, dialogue purposes, activity
instructions, feedback, audio/speech errors, migration help, and progress
states.

Japanese and romaji do not vary by locale. Romaji is derived from canonical
tokens under the existing long-vowel policy. Neither locale may be used as a
fallback for the other.

Copy remains practical and non-business. Explanations avoid unsupported claims
such as "Japanese has no subjects," "nonpast means present," or "`です` is a
verb ending added to every adjective." Common forms are labelled by function
and register rather than presented as word-for-word English substitutions.

## 17. Test and acceptance gates

### 17.1 Unit and production-catalog tests

Required coverage includes:

- Base manifest, ownership registry, route registry, and global uniqueness;
- every lesson-depth and exception contract;
- lexeme first-teach/use/recurrence closure;
- grammar/form prerequisite order;
- reference progression and canonical grid derivation;
- visible fingerprint uniqueness across examples, dialogue, and exercises;
- all ten practice functions and sound exceptions;
- naturalness-ledger freshness;
- EN/IT and hiragana/romaji parity;
- no-answer-leakage helpers and pre-attempt render probes;
- V4-to-V5 migration, evidence preservation, idempotence, future/corrupt input,
  rehomed continuation, and A2 deep equality;
- every production Base learner view in both locales and both script modes;
- unchanged A1 scenario and A2 editorial snapshots.

### 17.2 Type, build, and bundle gates

The exact repository gates are:

```bash
npm test
npx tsc --noEmit
npm run build
npm run check:bundle
npm run test:e2e
git diff --check
```

`npm run build` must run Base, A1, and A2 prebuild validators. A separate
`GITHUB_PAGES=true` production build must use `/nihongo-practice/` and pass the
same release validators.

The bundle gate receives a reviewed budget change only for measured canonical
content growth. Duplicate locale structures, duplicate conjugation strings,
hidden variants counted as teaching, or test/review ledgers in the runtime
bundle are not acceptable reasons to raise the budget.

### 17.3 Playwright acceptance

Playwright covers:

- fresh default to Base and returning-learner compatibility;
- direct selection and browser back/forward for Base, A1, and A2;
- all 40 Base routes and every pre-existing A1/A2 route smoke;
- stable deep links for all 20 rehomed lessons and existing legacy aliases;
- representative full lessons from every Base module;
- all five reference routes and `throughLessonId` progression;
- EN/IT and hiragana/romaji switching without state loss;
- all ten semantic practice functions and the sound exception flow;
- pre-attempt leakage, retry, accepted, review, listening, speech-unavailable,
  speech-denied, and synthesis-error states;
- migration from evidence-rich V4 fixtures;
- keyboard-only operation, reduced motion, 320/390 px, 200% zoom, and 400%
  reflow;
- no unexpected runtime errors or non-local application network requests.

### 17.4 Visual acceptance

Reviewed baselines include:

- the three-level course selector and Base map at desktop and mobile;
- one early sentence-anatomy lesson;
- the complete particle atlas;
- the verb/conjugation and adjective/copula grids;
- one dialogue lesson;
- one synthesis lesson;
- one unchanged A1 scenario lesson;
- one unchanged A2 lesson;
- audio unavailable/failure and migration-notice states.

Each baseline is captured in Italian and English where text flow materially
differs, and in both script modes where the surface changes. PNGs are opened and
judged, not merely generated. The written verdict covers hierarchy, density,
readability, wrapping, clipping, overflow, table/card equivalence, focus,
status clarity, and whether the page visibly teaches the promised system.

### 17.5 Live GitHub Pages acceptance

After merge and deployment, live verification checks:

- the Pages base path and all built assets;
- `/percorso?livello=base`, A1, and A2 selection;
- one route from each Base module;
- all five reference surfaces;
- representative existing A1 and A2 deep links;
- a legacy alias;
- locale and script persistence;
- truthful audio/speech capability states;
- no console errors, failed static assets, or unexpected network dependency.

The deployed commit SHA must match the accepted release SHA. Local preview or a
successful workflow alone is not live acceptance.

## 18. Independent review gates

Release requires three fresh reviews performed by reviewers who did not author
the reviewed work:

1. **Pedagogy review:** checks the 40-lesson sequence, cognitive load,
   explanations, contrasts, recurrence, practice functions, synthesis, and
   whether Base genuinely prepares an optional transition into A1.
2. **Content review:** checks every visible Japanese surface and audio string
   for naturalness, discourse coherence, register, particle/form correctness,
   EN/IT meaning and translation accuracy, and hiragana/romaji alignment.
3. **Code-quality review:** checks catalog boundaries, global ownership,
   canonical-source reuse, migration safety, no-answer-leakage, error handling,
   accessibility implementation, test quality, bundle impact, and A1/A2 scope
   containment.

Each review produces an attributed finding ledger. All blocker and high-severity
findings must be fixed and re-reviewed. Medium findings require resolution or a
written product-owner acceptance tied to a concrete reason and follow-up issue;
pedagogical correctness, naturalness, evidence loss, answer leakage, and
accessibility blockers cannot be waived.

Automated green gates do not replace these reviews.

## 19. Completion criteria

The redesign is complete only when:

- Base is a visible, open, recommended 10-module/40-lesson level before A1;
- all existing lesson routes and aliases resolve;
- all existing A1/A2 evidence is active or explicitly preserved as typed
  historical/orphan evidence, with no silent reset;
- the 20 rehomed routes are deeply expanded and the 20 new routes are complete;
- every required grammar item in this design has an owned first-teach lesson,
  cumulative reference entry, visible examples, and practice;
- semantic, sound, and synthesis lessons pass their substantive depth contracts;
- duplicate visible surfaces and hidden-only depth cannot pass;
- the five persistent references are progressive and retrievable from later
  lessons;
- A1 scenario lessons remain practical and A2 editorial content is unchanged;
- unit, type, build, bundle, Playwright, visual, and live gates pass;
- independent pedagogy, content, and code-quality reviews satisfy Section 18.

## 20. Design risks and controls

| Risk | Control |
|---|---|
| Ten activities and 6-10 examples create long pages or cognitive overload | Keep stable section anchors, clear staged practice, resumable evidence, visible progress, and representative 320 px/400% visual review; do not hide required teaching to shorten screenshots |
| Rehoming published lessons misattributes or downgrades progress | Use schema V5, an explicit 20-ID ownership map, append-only evidence, current-revision status separate from historical milestones, and exhaustive evidence-rich migration fixtures |
| The content volume encourages templated or unnatural Japanese | Require visible fingerprints, context diversity, recurrence, a fresh naturalness ledger, and independent content review |
| Expanded canonical content exceeds the bundle budget | Derive grids and locales from shared structures, exclude review ledgers from runtime, measure the production bundle, and require a reviewed budget rationale |
| A learner skips recommended Base and encounters A1 assumptions | Keep A1 open, label Base references as helpful refreshers, link applied A1 concepts back to cumulative references, and never convert recommendations into locks |
| Browser speech differs by platform | Preserve complete textual instruction and non-spoken practice, expose truthful capability/error states, and provide a non-accepting self-check fallback |

These are implementation and release risks, not reasons to weaken the Base
curriculum or return it to A1.
