# v2.1 Corrective Redesign — Design Specification

**Status:** Approved on 2026-07-14
**Scope:** Corrective design for the locally merged v2.1 release candidate
**Visual direction:** **Editoriale mnemonico**
**Delivery type:** Documentation only; this specification does not implement the redesign

## 1. Authority and relationship to v2.1

This specification corrects the release-candidate implementation described by
[`2026-07-13-foundation-v2-1-design.md`](./2026-07-13-foundation-v2-1-design.md)
and visually framed by
[`2026-07-13-foundation-v2-1-mockup.html`](./2026-07-13-foundation-v2-1-mockup.html).
It does not replace unrelated valid v2.1 decisions.

The following foundation decisions remain authoritative unless this document
explicitly changes them:

- the application is a static `HashRouter` SPA;
- Italian and English catalogs are complete and structurally equivalent;
- Japanese concepts and sentence construction remain locale-independent;
- the existing Japanese engine remains the source of generated Japanese;
- hiragana/rōmaji is independent from the source-language setting;
- the Lab, Syllabary, and Phrasebook remain directly accessible;
- browser speech synthesis remains optional and non-blocking;
- preferences and course state remain local to the browser;
- naturalness feedback remains pedagogical rather than a universal grammar rule;
- GitHub Pages deployment remains manual-only.

This document supersedes the prior design only where it defines:

- the learning architecture and content order;
- the meaning and storage of course progress;
- the course home and lesson information architecture;
- the shell, typography, controls, icons, and responsive behavior;
- guided comparison and return-flow contracts;
- visual, navigation, accessibility, and regression acceptance gates.

The current repository has no configured Git remote. No remote creation,
publication, deployment run, or other publish action is in scope for this
corrective cycle. The existing static/manual GitHub Pages workflow remains
unchanged.

## 2. Problem statement and adverse-review evidence

The v2.1 release candidate passed its logic and production-build checks, but the
adverse review showed that it is not visually or pedagogically release-ready.
Passing the existing suite is therefore necessary but no longer sufficient for
a release-ready claim.

### 2.1 Styling coverage failures

The rendered course uses these classes without matching CSS selectors:

- `course-primary-action`
- `course-hero__progress`
- `course-lead`
- `course-eyebrow`
- `course-reset`
- `chapter-card__meta`
- `chapter-card__footer`
- `chapter-card__check`
- `course-progress--small`
- `route-notice`

`course-secondary-action` is effectively unstyled. As a result, primary
course links, lesson footer links, reset/dismiss controls, and completion
controls can appear as browser-default actions despite the approved editorial
direction.

### 2.2 Desktop geometry failures

At the 1440 px review width:

- primary navigation overlaps the locale/settings controls;
- the global `.app { max-width: 1120px; }` constrains the header, course, Lab,
  Syllabary, and Phrasebook as though they shared one content width;
- the lesson grid leaves approximately 762 px for the main column;
- `86.4px` of responsive padding on each side reduces the real reading width to
  approximately 589 px;
- two-column example cards are approximately 288 px wide;
- Japanese example text reached approximately `40.8px` and wrapped even when
  the sentence should fit comfortably at the desktop reference viewport.

The shell width, lesson frame, and reading measure are separate design concerns
and must no longer be controlled by one global wrapper.

### 2.3 Typography and native-control failures

At 1440 px, the course-home hero title computed to approximately:

- `84.8px` font size;
- `81.4px` line height;
- `-4.664px` letter spacing;
- `326px` rendered block height.

The review observed zero loaded font faces in `document.fonts`. Body text used
the `system-ui` fallback, while native buttons rendered as Arial at
approximately `13.333px`. Primary links and buttons appeared as browser
defaults. These results contradict the intended editorial hierarchy and make
the interface vary materially by operating system.

### 2.4 Mobile shell and target-size failures

At the 390 x 844 reference viewport:

- the closed header is approximately 146 px high;
- opening settings expands it to approximately 240 px;
- the brand region can collapse to a computed width of `0`;
- important controls measure only approximately 21–36 px high.

Settings therefore displace content and consume a large part of the viewport,
while several controls do not provide an adequate touch target.

### 2.5 Navigation and sticky-position failures

Route navigation retains the previous document scroll position. The review
recorded route-entry positions of `scrollY = 723`, `527`, and `399`. Consequences
include:

- a newly opened lesson can begin mid-page;
- a guided-tool return link can be above the visible viewport;
- the user can lose both route and lesson-section context.

The Lab board uses `position: sticky; top: 18px`, while the sticky application
header is approximately 88 px high at the reviewed desktop state. The board can
therefore sit behind the header.

### 2.6 Learning-path and component failures

The current course home is an eight-card catalog rather than a guided path.
Every chapter has the same visual weight, and the home does not expose lesson
objectives, prerequisites, estimated time, or a meaningful phase structure.

The lesson implementation also fails its stated pedagogy:

- `ComparisonBlock` renders a collection of examples but does not define or
  visualize a before/after contrast;
- `GuidedLabPreview` renders one endpoint even when the copy promises a
  transformation;
- three lessons contain no guided exploration;
- the current Chapter 7 question/request lesson opens an unrelated affirmative
  movement sentence;
- loanwords are first presented in hiragana, while their normal katakana
  spelling is deferred to the final chapter;
- Chapter 2 examples use `を` and `ます` before Chapter 3 teaches them;
- completion is a learner self-report, not evidence of mastery;
- Chapter 8 repeats earlier material instead of synthesizing it.

### 2.7 Linguistic failures to correct

The corrective content pass must include:

- replacing the unnatural Italian translation `Questa è dell'acqua`;
- rendering `これはみずです` correctly and consistently;
- distinguishing `ましょう` from `ましょうか`;
- describing the Japanese non-past precisely rather than presenting a
  morphological future tense;
- correcting associated Italian and English explanations and translations.

## 3. Approved scope and non-goals

### 3.1 In scope

This cycle is a complete structural correction of both the user interface and
the learning path. It includes:

- a responsive shell and control system;
- a prerequisite-led course map;
- a variable-size module data model;
- one-page lessons with section context;
- true before/after comparisons;
- honest guided transformations;
- deterministic route scroll and exact guided-tool return;
- visited-state migration and copy;
- content reordering and the approved linguistic corrections;
- visual, navigation, accessibility, and regression automation.

### 3.2 Explicit non-goals

This cycle does **not** add:

- exercises, scoring, quizzes, or mastery checks;
- speech recognition or pronunciation assessment;
- audio recording;
- a backend, database, account, or cloud synchronization;
- API keys or external AI/content services;
- a full katakana course;
- publishing or repository/Pages activation;
- GitHub Pages trigger changes;
- automatic deployment.

Progress is renamed and reframed as **lessons visited**. It must never imply
completion, proficiency, mastery, or assessment.

Guided exploration is instructional manipulation, not an exercise or mastery
check: it has no score, pass/fail state, or progression gate.

The previous fixed constraint of exactly eight chapters with exactly two
lessons each is removed. Module and lesson size follow prerequisites, learner
cognitive load, and the amount of practice needed to demonstrate the stated
outcome.

## 4. Learning architecture

### 4.1 Model

The course is a non-blocking, prerequisite-led situational spiral:

- prerequisites establish the recommended order;
- all modules remain directly accessible;
- later modules recombine earlier gears in travel situations;
- a prerequisite is guidance, not a lock;
- the home makes skipped prerequisites visible without shaming or blocking the
  learner;
- each new module introduces a bounded set of gears and then reuses them.

The course has seven instructional modules followed by one capstone:

| Module | Learner outcome | Core gears/content | Prerequisites |
|---|---|---|---|
| 1. Essential sounds | Read and reproduce the essential hiragana sound patterns used in the course | core sounds, rhythm, small `っ`, long vowels, `ん`, dakuten/handakuten, yōon | none |
| 2. Say what something is | Identify something and establish a topic | `は`, `です`, topic omission, `これはみずです` | Module 1 |
| 3. Order and request | Put an object before an action and make a simple request | sentence order, `を`, polite `ます`, `ください` | Modules 1–2 |
| 4. Transform time and polarity | Change a familiar action across today/yesterday/tomorrow and affirmative/negative | `ます`, `ました`, `ません`, `ませんでした`, time adverbs, non-past interpretation | Modules 1–3 |
| 5. Move and act in places | Distinguish destination, direction, action place, and transport | `に`, `へ`, `で`, movement and place scenarios | Modules 1–4 |
| 6. People, desires, and invitations | Connect actions to people, express desire, and propose shared action | `と`, person-linked `に`, `たい`, `ましょう` | Modules 1–5 |
| 7. Questions and existence | Ask a polite question and say that a thing or animate being exists | `か`, `あります`, `います` | Modules 1–6 |
| 8. A day in travel | Recombine the prior gears across a coherent day-in-travel scenario | sounds, identification, requests, time, movement, people, questions, existence; only common exceptions are new | Modules 1–7 |

Module 8 is synthesis, not a miscellaneous “traps” chapter. It introduces only
common exceptions needed to complete the scenario, and every exception is
attached to a previously learned pattern.

### 4.2 Meaningful phases on course home

The course home groups the modules into four phases:

1. **Orient** — Modules 1–2
2. **Build** — Modules 3–4
3. **Navigate** — Modules 5–7
4. **Synthesize** — Module 8

The phases form a vertical path rather than a uniform card grid. Each module
shows:

- semantic icon;
- module name and outcome;
- prerequisite module names;
- total estimated time;
- lesson names and individual objectives;
- lesson estimated minutes;
- visited state;
- the recommended next lesson.

The current/recommended module may expand its lesson list in place. Other
modules remain concise but expose their outcome and prerequisites. Visited
state changes emphasis but never locks content.

### 4.3 Lesson contract

Every lesson is one route and one scrolling page with exactly four ordered
sections:

1. **Rule** — one practical rule, its purpose, and the minimum terminology.
2. **Before / after** — an explicit transformation with the declared delta.
3. **Guided exploration** — an interaction or authored transformation that
   demonstrates the lesson objective.
4. **Recap** — the learner outcome, the changed gears, and a relevant next
   action.

The stable section IDs are:

```text
rule
comparison
explore
recap
```

Desktop uses a four-step lesson rail with scrollspy. Mobile uses a compact
sticky context bar showing module, lesson, current section, and a control that
opens the same four-section navigation. Neither surface creates four lesson
routes or a wizard.

Scrollspy updates `aria-current="step"` without changing the route. The current
section changes when its heading crosses the shared content offset beneath the
header. Reduced-motion users receive immediate, non-animated section
navigation.

## 5. Visual direction: Editoriale mnemonico

### 5.1 Character and palette

The redesign preserves the warm paper/coral/teal/dark-board character:

| Role | Direction |
|---|---|
| Page and reading surfaces | warm paper and cream |
| Changed endings, primary actions, and transformations | coral |
| Navigation, context, and visited state | teal |
| Particles | amber |
| Guided transformation board | dark charcoal |
| Destructive action | a dedicated high-contrast red derived independently from coral |

Color is never the only signal. Labels, icons, borders, text, or shape must
also communicate particle, ending, current, visited, warning, and destructive
states.

### 5.2 Fonts and type scale

Manrope is self-hosted as local WOFF2 assets for Latin text and UI. The
application makes no font request to an external origin. Japanese uses this
explicit system stack:

```css
"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic",
"Noto Sans JP", Meiryo, sans-serif
```

Every `button`, `input`, `select`, `textarea`, and interactive summary uses
`font: inherit`.

The finite Latin/UI scale is:

| Token | Size |
|---|---:|
| small/meta | 14 px |
| body/control | 16 px |
| lead/card heading | 20 px |
| section heading | 28 px |
| large title minimum | 42 px |
| course-home title maximum | 54 px |
| lesson title maximum | 50 px |

No course title may compute to an 84 px-scale display face. Japanese sizes are
based on their containing component, not the viewport. At the desktop
reference width, comparison Japanese remains on one line and does not exceed
the component’s authored maximum.

### 5.3 Spacing, widths, and shared geometry

The finite spacing scale is:

```text
4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 px
```

New layout spacing must use this scale. The primary geometry tokens are:

| Token | Contract |
|---|---|
| shell maximum | approximately 1320 px |
| reading measure | 760–860 px |
| minimum action target | 44 x 44 px |
| mobile closed-header maximum | 112 px |
| sticky content offset | computed from shared header height plus spacing token |

The header/shell width and reading width are separate. No global wrapper may
constrain every application mode. Course home may use the shell width; lesson
prose uses the reading measure; Lab, Syllabary, and Phrasebook retain layouts
appropriate to their content.

### 5.4 Action system

All application-owned actions use a shared styled primitive or an equivalent
typed link primitive with these variants:

- primary;
- secondary;
- destructive;
- inline;
- icon.

Every variant has visible hover, active, disabled, and keyboard-focus states.
Every visible interactive target is at least 44 x 44 px. There are no raw
browser-default buttons or links in application content.

### 5.5 Header and settings

Desktop header geometry has three stable regions:

1. brand;
2. primary navigation;
3. compact settings.

The regions reserve their own width and do not overlap. The brand cannot
collapse to zero.

On mobile:

- the closed header remains at or below 112 px;
- settings open in an overlay drawer;
- the drawer does not change header flow or push page content;
- focus moves into the drawer, is trapped while open, and returns to the
  settings trigger on close;
- Escape and the explicit close action dismiss it;
- the page behind the drawer is not keyboard- or pointer-interactive.

### 5.6 Semantic icon vocabulary

Icons are typed inline SVG, not emoji decoration. The allowed semantic IDs are:

```ts
type SemanticIconId =
  | "sounds"
  | "sentence"
  | "ordering"
  | "time"
  | "places"
  | "people"
  | "questions"
  | "capstone";
```

The same icon follows a concept from course home to lesson rail, callout, and
Lab context. A semantic icon may change size but not meaning between surfaces.

### 5.7 Normative composition

The approved corrective visual composition is:

- a vertical phase path on course home;
- a lesson with a four-step rail;
- lesson headings capped at a moderate 50 px;
- explicit before and after cards;
- a delta strip naming the gear that changed;
- a compact dark guided board;
- fully styled previous/next and lesson actions;
- a responsive single-column comparison on mobile.

The prior v2.1 mockup remains a palette and editorial-tone reference. Where its
fixed sizing or layout conflicts with this specification, this specification
wins.

## 6. Component and data boundaries

### 6.1 Focused UI contracts

| Component | Responsibility |
|---|---|
| `Icon` | Render one typed inline-SVG semantic icon with correct accessible behavior |
| visual tokens | Provide one finite source for color, type, spacing, widths, targets, and header offsets |
| `AppHeader` | Own stable brand/navigation/settings regions and expose the mobile drawer trigger |
| `SettingsDrawer` | Own overlay, focus management, dismissal, and mobile settings controls |
| `CourseMap` | Group modules by phase and identify the recommended/current module |
| `ModuleCard` | Present outcome, prerequisites, time, lesson list, and visited state |
| `LessonRail` | Render the four lesson sections and subscribe to scrollspy state |
| `TransformComparison` | Render declared base/changed examples and only their declared delta |
| `GuidedTransformation` | Demonstrate the declared initial-to-target change and changed gears |
| `RouteScrollManager` | Reset ordinary route navigation and restore explicit return anchors |
| styled actions | Render primary, secondary, destructive, inline, and icon action variants |
| styled notices | Render route, preset, storage, speech, warning, and error states visibly |

Normative interface shapes:

```ts
type ModuleId = string;
type LessonId = string;
type ColorToken =
  | "paper"
  | "surface"
  | "ink"
  | "muted"
  | "coral"
  | "teal"
  | "amber"
  | "board"
  | "danger";

type IconProps = {
  id: SemanticIconId;
  size?: "small" | "medium" | "large";
} & (
  | { decorative: true; label?: never }
  | { decorative?: false; label: string }
);

interface VisualTokens {
  colors: Readonly<Record<ColorToken, string>>;
  spacingPx: readonly [4, 8, 12, 16, 24, 32, 48, 64];
  typePx: readonly [14, 16, 20, 28, 42, 50, 54];
  layout: {
    shellMaxPx: 1320;
    readingMinPx: 760;
    readingMaxPx: 860;
    actionTargetMinPx: 44;
    mobileHeaderMaxPx: 112;
  };
}

interface LessonRailProps {
  moduleId: ModuleId;
  lessonId: LessonId;
  sections: readonly LessonSectionId[];
  activeSectionId: LessonSectionId;
}

interface RouteReturnTarget {
  pathname: string;
  sectionId: LessonSectionId;
}

interface SettingsDrawerProps {
  open: boolean;
  triggerId: string;
  onClose: () => void;
}

interface NoticeProps {
  tone: "info" | "warning" | "error";
  title: string;
  body: string;
  dismissLabel?: string;
}
```

`Icon` requires exactly one of these accessible modes:

- `decorative: true`, which renders `aria-hidden="true"`; or
- a non-empty `label`, which gives a standalone/actionable icon an accessible
  name.

### 6.2 Course data

The rigid chapter model evolves to a module model:

```ts
type PhaseId = "orient" | "build" | "navigate" | "synthesize";
type LessonSectionId = "rule" | "comparison" | "explore" | "recap";

interface CourseModule {
  id: ModuleId;
  phase: PhaseId;
  order: number;
  prerequisiteIds: ModuleId[];
  outcomeCopyIds: string[];
  estimatedMinutes: number;
  iconId: SemanticIconId;
  lessons: Lesson[];
}

interface Lesson {
  id: LessonId;
  moduleId: ModuleId;
  order: number;
  titleCopyId: string;
  objectiveCopyIds: string[];
  estimatedMinutes: number;
  sections: readonly [
    RuleSection,
    ComparisonSection,
    ExplorationSection,
    RecapSection,
  ];
}
```

Rules:

- module and lesson IDs are stable semantic IDs;
- prerequisites reference existing earlier modules and contain no cycles;
- `estimatedMinutes` is a positive integer;
- a module’s `estimatedMinutes` equals the sum of its lesson estimates;
- every lesson has all four sections in the declared order;
- semantic data contains copy IDs, not Italian or English strings;
- IT and EN catalogs remain complete and build-validated;
- all modules remain non-blocking.

### 6.3 Comparison data

A comparison is not an arbitrary example list:

```ts
type ContrastDimension =
  | "particle"
  | "ending"
  | "time"
  | "polarity"
  | "topic"
  | "request"
  | "question"
  | "existence"
  | "word-order";

interface TransformComparisonData {
  id: string;
  baseExampleId: string;
  changedExampleId: string;
  contrastDimension: ContrastDimension;
  changedGearIds: string[];
  changedSegmentIds: string[];
}
```

The renderer:

- labels base and changed states explicitly;
- shows a delta strip naming the contrast;
- visually marks only `changedGearIds` and `changedSegmentIds`;
- does not infer a delta by string position;
- preserves unchanged segments with neutral styling;
- stacks to one column on narrow viewports without losing the before/after
  labels.

Validation fails when:

- base and changed IDs are equal;
- a referenced example, gear, or segment does not exist;
- no delta is declared;
- a declared delta does not differ between examples;
- an undeclared segment is marked as changed.

### 6.4 Guided transformation data

```ts
interface GuidedTransformationData {
  id: string;
  objectiveId: string;
  initialSelection: LabSelection | AuthoredSelection;
  targetSelection: LabSelection | AuthoredSelection;
  changedGearIds: string[];
  returnTarget: RouteReturnTarget;
}

interface AuthoredSelection {
  exampleId: string;
  segmentIds: string[];
}
```

A guided component must show both initial and target states, or provide an
interaction that deterministically moves between them. It must not use
before/after copy while rendering only one endpoint.

The target must exercise the lesson objective. If the Japanese Lab engine
cannot represent the authored pattern, `AuthoredSelection` supplies a curated
static transformation rather than opening an unrelated Lab preset.

### 6.5 Engine and locale boundary

The corrective redesign preserves:

- the Japanese conjugation and assembly engine;
- locale-independent concepts, scenarios, times, and semantic selections;
- the typed IT/EN catalog boundary;
- current Japanese outputs for existing valid engine selections.

Copy corrections and new authored examples are declared content changes, not
reasons to move localized strings into the Japanese core or to rewrite the
engine.

## 7. Navigation, guided tools, progress, and errors

### 7.1 Route scroll

`RouteScrollManager` applies these deterministic rules:

1. An ordinary pathname/search change resets `window.scrollY` to `0`.
2. A lesson-section link scrolls to its stable section anchor below the shared
   header offset.
3. A guided-tool return waits until the lesson and target section exist, then
   scrolls to that exact section.
4. Browser back/forward route changes also reset to the top unless they carry a
   validated lesson-section return target.
5. Reduced-motion preference disables smooth scrolling.

No new route may inherit an unrelated page’s `scrollY`.

### 7.2 Lab and Syllabary deep links

Lab and Syllabary guided links include:

- the internal return pathname;
- the lesson section ID;
- the valid Lab preset or Syllabary group target.

Return paths accept only recognized internal course routes and section IDs.
Invalid or external return values are rejected and produce a visible styled
notice.

Syllabary targets the relevant group (`gojuon`, `dakuten`, `yoon`, or
`special-notes`) rather than always opening the generic page top. Its return
action lands at the originating lesson’s `explore` section.

The Lab sticky board offset derives from the same shared header-height token as
the shell. At every supported viewport, the board’s top edge remains below the
header’s bottom edge plus the configured spacing token.

### 7.3 Progress semantics and schema migration

The storage key remains:

```text
nihongo.course.progress
```

The new schema is:

```ts
interface CourseProgressV2 {
  schemaVersion: 2;
  visitedLessonIds: string[];
  lastVisitedLessonId: string | null;
  updatedAt: string;
}
```

Migration from v1 is automatic and lossless:

1. Parse the v1 record without mutating it.
2. Copy every unique `completedLessonIds` value into `visitedLessonIds`.
3. Apply an explicit legacy lesson-ID alias only where a lesson ID changes.
4. Retain unmapped legacy IDs as opaque entries so migration does not discard
   data; current progress calculations ignore IDs absent from current course
   data.
5. Preserve `lastVisitedLessonId`, applying the same explicit alias when
   required.
6. Write v2 only after successful validation.

Existing “completed” lessons therefore become visited lessons; they do not
become mastered lessons. The explicit complete/uncomplete control is removed.
A lesson becomes visited when its route renders successfully. The UI reports
counts such as “5 lessons visited” and never uses “complete,” “mastered,” or an
equivalent proficiency claim.

The recommended continuation is:

1. the preserved current `lastVisitedLessonId`, when it maps to a current
   lesson;
2. otherwise the first unvisited lesson whose prerequisites are visited;
3. otherwise the first lesson in course order.

### 7.4 Visible failure states

These states use styled, visible notices:

- invalid application route;
- invalid lesson/module ID;
- invalid Lab preset;
- invalid return path or section anchor;
- unavailable or corrupt local storage;
- unavailable speech synthesis;
- missing Japanese voice;
- speech playback failure.

No failure may be converted into a success-shaped fallback. A malformed guided
preset may offer a clearly labeled direct Lab entry, but it must first state
that the guided state was not loaded. Storage failure leaves the session usable
and explicitly states that changes will not persist.

## 8. Content correction contract

### 8.1 Prerequisite order

No example may rely on a grammar concept as assumed knowledge before its first
explicit introduction.

In particular:

- Module 2 uses `は`/`です` identification examples and does not require `を`
  or `ます`;
- `を`, `ます`, and `ください` are introduced together in Module 3 before
  later action/request examples rely on them;
- time and polarity transformations reuse the familiar Module 3 action frame;
- `に`, `へ`, and `で` follow the action frame;
- people/desire/invitation patterns follow movement and action;
- `か`, `あります`, and `います` follow the identification and action
  foundations.

### 8.2 Loanwords

At first exposure, every loanword displays:

- standard katakana spelling as the orthographic reference;
- hiragana-first reading support where useful for the current learner;
- rōmaji according to the existing script preference.

For example, the first exposure to `らーめん`, `れすとらん`, `ほてる`,
`めにゅー`, or `といれ` also exposes `ラーメン`, `レストラン`, `ホテル`,
`メニュー`, or `トイレ`. The course does not defer the existence of standard
katakana spelling to the capstone, and it does not add a full katakana course
in this cycle.

### 8.3 Questions and requests

The mismatched Chapter 7 guided movement preset is removed.

Requests belong to Module 3 and use an authored transformation such as:

```text
みず → みずをください
```

Questions belong to Module 7 and use an authored transformation such as:

```text
えきはどこです → えきはどこですか
```

Each transformation declares the changed segments and practices the stated
lesson objective. It is preferable to use a curated authorial component than
to claim that the Lab can demonstrate a pattern it cannot represent.

### 8.4 Real comparisons and capstone

Every comparison supplies a true base state, changed state, contrast dimension,
and declared delta. Two unrelated example sentences are not a comparison.

The capstone follows one coherent day-in-travel sequence and asks the learner
to recognize how earlier gears combine:

- identify a place or object;
- request an item;
- state or change time/polarity;
- move to and act in a place;
- interact with a person;
- ask a question;
- locate a thing or person.

Only common exceptions required by that sequence are introduced there.

### 8.5 Required linguistic corrections

The content pass must:

- replace `Questa è dell'acqua` with natural Italian for
  `これはみずです`, such as `Questa è acqua`;
- render the Japanese continuously as `これはみずです`, while allowing
  semantic segment styling without inserting misleading visible spaces;
- explain `ましょう` as a proposal/invitation (“let’s …” / “facciamo …”);
- explain `ましょうか` separately as an offer or consultative suggestion
  (“shall I/we …?” / “vuoi che …?” according to context);
- describe `ます`/`ません` as non-past forms that can refer to present,
  habitual, scheduled, or future situations;
- state that a time expression or context supplies future interpretation, not
  a dedicated future inflection;
- correct all affected Italian and English headings, notes, translations, and
  summaries consistently.

## 9. Accessibility and quality strategy

### 9.1 Accessibility

The redesign requires:

- decorative SVGs with `aria-hidden="true"`;
- actionable or standalone icons with accessible names;
- visible keyboard focus on every action;
- full keyboard operation of navigation, settings, lesson rail, comparisons,
  guided tools, and notices;
- reduced-motion handling for scrolling and transitions;
- sufficient text, icon, control, and focus contrast;
- icon/text or icon/shape redundancy so color is not the only cue;
- `aria-current` for route and lesson-section context;
- `aria-pressed` only for actual toggles;
- focus-managed mobile settings drawer behavior;
- no hover-only instruction or state.

### 9.2 Playwright justification and scope

Add `@playwright/test` as a dev-only dependency during implementation. This is
a justified visual/navigation regression tool because the previous
logic-oriented and manual suite passed while severe layout, font, default
control, scroll, overlap, and responsive failures remained.

Use deterministic Chromium tests and reviewed screenshots for:

- course home at `1440 x 1000`;
- a representative lesson at `1440 x 1000`;
- course home at `390 x 844`;
- the same representative lesson at `390 x 844`.

Animations and non-deterministic times are disabled or fixed for snapshots.
Tests use local deterministic data and do not contact external services.

### 9.3 Playwright acceptance

The browser suite must prove:

1. zero browser console errors;
2. zero requests to external origins or application backends;
3. `document.documentElement.scrollWidth <=
   document.documentElement.clientWidth` at both reference viewports;
4. no header region overlaps another header region;
5. no header, drawer, notice, or lesson context overlaps its adjacent content;
6. the closed mobile header is at most 112 px high;
7. every visible interactive target is at least 44 x 44 px;
8. every application action uses a declared visual variant and no naked
   browser-default link/button style remains;
9. self-hosted Manrope is loaded and `document.fonts.check()` succeeds;
10. all form controls inherit the intended UI font;
11. ordinary route navigation resets scroll to the top;
12. Lab return restores the exact originating lesson section;
13. Syllabary return restores the exact originating lesson section and a
    targeted group opens at the correct Syllabary section;
14. the sticky Lab board remains below the header;
15. the representative Japanese comparison stays on one line at `1440 x 1000`;
16. course-home and lesson screenshots at both viewports receive a human visual
    review before any release-ready claim.

Computed-style and bounding-box assertions are required for criteria 3–10 and
14–15; screenshots alone are not sufficient.

### 9.4 Vitest acceptance

Vitest covers:

- module order, prerequisite existence, and acyclic prerequisites;
- required four-section lesson order;
- comparison base/changed/delta integrity;
- guided objective-to-target matching;
- first-exposure katakana references for loanwords;
- v1 `completedLessonIds` to v2 `visitedLessonIds` migration;
- preservation/aliasing of `lastVisitedLessonId`;
- route, return-target, anchor, and preset parsing helpers;
- invalid route/preset behavior;
- locale catalog completeness.

All existing tests remain. Existing Japanese engine outputs remain unchanged
unless an approved copy/content correction explicitly declares a changed
authored example. Such a change must update its focused expectation rather
than broadly replacing snapshots.

### 9.5 Final manual visual gate

Before any release-ready claim, a reviewer inspects the four Playwright
screenshots and the computed-style/bounding-box report. The gate explicitly
checks:

- hierarchy and reading measure;
- header stability;
- lesson orientation;
- real before/after clarity;
- delta visibility without color dependence;
- compact guided board;
- styled footer actions;
- mobile drawer and single-column comparison;
- Japanese legibility and non-wrapping at the desktop reference width.

Logic/build success without this gate is not release readiness.

## 10. Migration and compatibility

### 10.1 Course and route compatibility

- Keep existing semantic lesson IDs when the learning objective survives.
- Where an ID changes, define a tested legacy-to-current alias map.
- Legacy `#/percorso/:chapterId/:lessonId` links resolve through that map to the
  corresponding module/lesson route.
- A recognized legacy route redirects visibly and preserves the intended
  lesson; an unrecognized route uses the styled invalid-route notice.
- Free-practice and Phrasebook routes remain available.
- Hash routing remains compatible with static GitHub Pages refresh behavior.

### 10.2 Progress compatibility

- Keep the `nihongo.course.progress` storage key.
- Migrate schema v1 to v2 exactly as specified in Section 7.3.
- Never delete a valid v1 record before a valid v2 record is produced.
- Treat legacy completed IDs as visited, not mastered.
- Preserve the last visited lesson through stable IDs or explicit aliases.
- Keep corrupt-progress cleanup isolated from locale, script, and reference
  settings.

### 10.3 Content and engine compatibility

- Preserve locale-independent Japanese semantic data.
- Preserve IT/EN structural parity.
- Preserve the existing Lab engine and valid generated Japanese.
- Add authored static patterns when a lesson objective is outside current Lab
  capabilities.
- Do not introduce localized fragments into engine data.
- Keep browser speech synthesis optional and content readable without it.

### 10.4 Deployment compatibility

- Keep the application static.
- Keep the existing manual `workflow_dispatch` Pages workflow unchanged.
- Add no `push` or `pull_request` deployment trigger.
- Add no backend, secret, API key, service worker, or external font request.
- Do not configure a Git remote, enable Pages, or run a publication workflow as
  part of the corrective redesign.

## 11. Measurable release acceptance

The corrective redesign is accepted only when all of the following are true:

| ID | Acceptance criterion | Evidence |
|---|---|---|
| A1 | Course data contains seven instructional modules and one capstone, grouped into the four approved phases | Vitest data assertion |
| A2 | Prerequisites are valid, acyclic, visible, and non-blocking | Vitest plus course-home browser check |
| A3 | Every lesson contains rule, comparison, explore, and recap in order on one route | Vitest plus lesson DOM assertion |
| A4 | Home shows module outcome, prerequisites, time, lesson names/objectives, and visited state | Playwright DOM and screenshot |
| A5 | Every comparison has a valid declared delta and marks only that delta | Vitest plus screenshot |
| A6 | Every guided transformation demonstrates its objective and exposes initial and target states | Vitest plus browser interaction |
| A7 | No application action is raw or smaller than 44 x 44 px | Playwright computed-style/bounds report |
| A8 | Header regions do not overlap; mobile closed header is no taller than 112 px; settings use an overlay drawer | Playwright bounds and interaction |
| A9 | Manrope is self-hosted and loaded; controls inherit it; Japanese uses the explicit system stack | Network and computed-font assertions |
| A10 | Course home and lesson have no horizontal overflow at 1440 x 1000 or 390 x 844 | Playwright geometry assertion |
| A11 | Ordinary route changes reset to the top; Lab/Syllabary return to the exact originating section | Playwright navigation assertion |
| A12 | Lab sticky board always starts below the current header | Playwright bounds assertion |
| A13 | Representative desktop Japanese comparison does not wrap | Playwright line-box assertion |
| A14 | v1 progress migrates without loss to visited semantics and preserves last visited | Vitest migration cases |
| A15 | Progress copy never implies completion or mastery | Catalog assertion and manual copy review |
| A16 | Loanwords expose standard katakana at first use while retaining hiragana-first support | Vitest content-order assertion |
| A17 | `これはみずです`, `ましょう`/`ましょうか`, non-past/future, and IT/EN copy are corrected | Focused content tests and bilingual review |
| A18 | Invalid route/preset and unavailable storage/speech states are styled and visible | Vitest helper checks plus Playwright |
| A19 | Chromium reports zero console errors and no external/backend requests | Playwright listeners |
| A20 | Existing tests and approved Japanese engine outputs remain valid | Full Vitest suite |
| A21 | Course-home and lesson screenshots at both required viewports are reviewed | Recorded manual visual gate |
| A22 | Static/manual Pages behavior and workflow triggers are unchanged | Workflow diff and trigger inspection |

No subset of these criteria is sufficient for a release-ready claim.

## 12. Rollout sequence

Implementation proceeds in coherent, independently verifiable stages:

1. visual foundation and shell;
2. route-scroll and settings-drawer behavior;
3. course data and visited-progress migration;
4. phase-based course home;
5. lesson rail, true comparison, and guided transformation components;
6. prerequisite and linguistic content corrections;
7. exact Lab/Syllabary deep-link and return flow;
8. visual, accessibility, navigation, and regression QA.

Each stage preserves a runnable static application and the existing Japanese
engine. Static deployment configuration and the manual workflow remain
unchanged throughout.
