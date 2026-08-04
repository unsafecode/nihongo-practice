# A1 Foundations Curriculum Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild every A1 lesson around visible prerequisites, canonical vocabulary meanings, explicit grammar, audio worked examples, five-function practice, and varied review while preserving stable routes, progress, semantic realization, locale parity, and A2 content.

**Architecture:** Keep the current 12-module/48-lesson manifest and sentence realization engine, then add a small A1-only instructional catalog keyed by existing lesson, semantic-value, concept, and variant IDs. Build an A1 curriculum view model that joins that catalog to realized production sentences, validate first-use/order/function invariants at prebuild time, and render six ordered A1 sections while A2 retains its existing four-section path.

**Tech Stack:** React 18, TypeScript 5.6, Vitest 3, React Router 7, Vite 6, browser Speech Synthesis/Recognition adapters, localStorage V4 progress, Playwright 1.61

---

## Execution protocol

Implement in this worktree on `unsafecode-rebuild-a1-foundations`. Do not read,
merge, modify, or cherry-pick PR #3. Do not change A2 editorial catalogs.

Before Task 1, restore the already-declared dependencies because the initial
catalog probe proved the local install is absent:

```bash
npm ci
```

Expected: lockfile-resolved install succeeds without modifying
`package.json` or `package-lock.json`.

For every task:

1. dispatch one fresh implementer with only that task and the design spec;
2. require red-green-refactor and the task's focused commands;
3. dispatch a fresh spec-compliance reviewer;
4. send every finding back to the implementer, then re-run the spec review;
5. dispatch a fresh code-quality reviewer;
6. send every finding back to the implementer, then re-run the quality review;
7. run the focused command and `git diff --check`;
8. commit only after both reviewers return no findings;
9. include both required trailers:

```text
Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>
Copilot-Session: 00ce510c-997d-4930-bef7-b054a4faa489
```

## File structure

### New curriculum data

- `src/course/a1/curriculum/types.ts` — localized lexeme, learning-note,
  per-lesson content, practice-function, and validation contracts.
- `src/course/a1/curriculum/lexicon.ts` — canonical A1 meanings/forms connected
  to semantic value IDs.
- `src/course/a1/curriculum/grammar.ts` — reusable bilingual grammar and
  phonetic learning notes.
- `src/course/a1/curriculum/modules01to04.ts` — sound anchors and early
  foundations content.
- `src/course/a1/curriculum/modules05to08.ts` — routines, tense/polarity,
  places, and people content.
- `src/course/a1/curriculum/modules09to12.ts` — descriptions, shopping,
  existence/needs, and synthesis content.
- `src/course/a1/curriculum/catalog.ts` — immutable indexes and all-lesson
  assembly.
- `src/course/a1/curriculum/buildA1CurriculumViewModel.ts` — join instructional
  content to realized variants/tokens/copy.
- `src/course/a1/curriculum/validateA1Curriculum.ts` — exhaustive learner-order,
  gloss, prerequisite, practice, and dialogue gates.
- `src/course/a1/curriculum/reports.ts` — production distributions used by tests
  and release reporting.

### New A1 presentation components

- `src/course/components/a1/A1AudioButton.tsx`
- `src/course/components/a1/A1LessonOverview.tsx`
- `src/course/components/a1/A1VocabularySection.tsx`
- `src/course/components/a1/A1LearningNote.tsx`
- `src/course/components/a1/A1WorkedExamples.tsx`
- `src/course/components/a1/A1PracticeLadder.tsx`
- `src/course/components/a1/A1LessonRecap.tsx`

### Modified shared surfaces

- `src/course/foundations/instructionalLessonKit.ts` — separate round-one and
  round-two target counts with A2 defaults preserved by its caller.
- `src/course/a1/authoring.ts`, `src/course/a1/catalog/a1LessonBuilders.ts` —
  four generated A1 targets instead of ten.
- `src/course/components/lessonExerciseModel.ts` — A1 cognitive function,
  feedback, and blueprint order.
- `src/course/components/Exercise.tsx`,
  `src/course/components/ExerciseView.tsx` — explanatory post-submit feedback.
- `src/course/components/reviewQueueModel.ts` — deterministic alternate A1
  retrieval.
- `src/routing/lessonSections.ts`, `src/course/components/LessonPage.tsx`,
  `src/course/components/LessonRail.tsx` — six A1 sections, four A2 sections.
- `src/course/components/A1LessonPage.tsx` — ordered A1 dispatcher.
- `src/course/components/CourseHome.tsx`, `src/course/data/course.ts`,
  `src/course/i18n/types.ts`, `src/course/i18n/en.ts`,
  `src/course/i18n/it.ts`, `src/course/course.css` — foundations naming, copy,
  and responsive styling.
- `src/course/progress/progress.ts`,
  `src/course/progress/ProgressContext.tsx` — A1 curriculum catalog version and
  review reconciliation without discarding evidence.
- `scripts/validateA1Release.ts` — new validator in the existing prebuild gate.

### Tests

- focused unit tests beside each new catalog/helper;
- `src/course/a1/curriculum/a1CurriculumInvariants.test.ts` for all 48
  production lessons;
- component tests in `src/course/components/a1/A1CurriculumSections.test.tsx`
  and existing lesson/exercise tests;
- updated route/progress tests;
- `tests/e2e/a1-foundations-curriculum.spec.ts`;
- updated `tests/e2e/a1-depth.spec.ts`,
  `tests/e2e/zoom-a11y.spec.ts`, and `tests/e2e/course-visuals.spec.ts`;
- PNG baselines under Playwright's generated snapshot directory for
  `introductions-1` and `shopping-4`.

### Task 1: Define the A1 instructional contracts

**Files:**
- Create: `src/course/a1/curriculum/types.ts`
- Create: `src/course/a1/curriculum/types.test.ts`

- [ ] **Step 1: Write failing contract tests**

Create `src/course/a1/curriculum/types.test.ts`:

```ts
import { describe, expect, expectTypeOf, it } from "vitest";
import {
  A1_PRACTICE_FUNCTIONS,
  A1_SEMANTIC_SECTION_ORDER,
  defineA1LessonContent,
  type A1LessonContent,
} from "./types";

describe("A1 curriculum contracts", () => {
  it("fixes the six learner-visible sections in instructional order", () => {
    expect(A1_SEMANTIC_SECTION_ORDER).toEqual([
      "rule",
      "vocabulary",
      "grammar",
      "comparison",
      "explore",
      "recap",
    ]);
  });

  it("keeps cognitive function separate from widget kind", () => {
    expect(A1_PRACTICE_FUNCTIONS).toEqual([
      "meaning-comprehension",
      "form-discrimination",
      "controlled-production",
      "transformation",
      "contextual-response",
      "listening-speaking",
    ]);
  });

  it("rejects a lesson whose activity sequence repeats a function", () => {
    expect(() =>
      defineA1LessonContent({
        lessonId: "introductions-1",
        situation: { en: "Meeting a classmate.", it: "Conosci un compagno." },
        prerequisiteLessonIds: ["sounds-4"],
        prerequisiteConceptIds: [],
        newLexemeIds: ["watashi", "namae", "gakusei", "sensei"],
        learningNoteId: "sentence-shape",
        workedExampleVariantIds: ["introductions-1-m1", "introductions-1-m2"],
        practiceBlueprint: {
          activities: [
            { id: "a", function: "meaning-comprehension", interactionKind: "choice", targetRef: { round: "one", index: 0 } },
            { id: "b", function: "meaning-comprehension", interactionKind: "completion", targetRef: { round: "one", index: 1 } },
            { id: "c", function: "controlled-production", interactionKind: "tile-ordering", targetRef: { round: "two", index: 0 } },
            { id: "d", function: "contextual-response", interactionKind: "constrained-construction", targetRef: { round: "two", index: 1 } },
            { id: "e", function: "listening-speaking", interactionKind: "spoken", targetRef: { spokenVariantId: "introductions-1-m1" } },
          ],
        },
        retrievalCue: { en: "Say who you are.", it: "Di' chi sei." },
      }),
    ).toThrow(/consecutive practice function/i);
  });

  it("exposes a frozen lesson contract", () => {
    expectTypeOf<A1LessonContent["newLexemeIds"]>().toMatchTypeOf<readonly string[]>();
  });
});
```

- [ ] **Step 2: Run the contract test red**

Run:

```bash
npm test -- src/course/a1/curriculum/types.test.ts
```

Expected: FAIL because `./types` does not exist.

- [ ] **Step 3: Implement the immutable contracts**

In `types.ts`, define:

```ts
export const A1_SEMANTIC_SECTION_ORDER = [
  "rule",
  "vocabulary",
  "grammar",
  "comparison",
  "explore",
  "recap",
] as const;

export const A1_PRACTICE_FUNCTIONS = [
  "meaning-comprehension",
  "form-discrimination",
  "controlled-production",
  "transformation",
  "contextual-response",
  "listening-speaking",
] as const;

export type A1PracticeFunction = (typeof A1_PRACTICE_FUNCTIONS)[number];
export type Bilingual = Readonly<{ en: string; it: string }>;

export interface A1Lexeme {
  readonly id: string;
  readonly valueIds: readonly string[];
  readonly kana: string;
  readonly romaji: string;
  readonly category:
    | "pronoun" | "person" | "noun" | "verb" | "adjective"
    | "question-word" | "time" | "expression";
  readonly meaning: Bilingual;
  readonly verb?: Readonly<{
    dictionary: Readonly<{ kana: string; romaji: string }>;
    polite: Readonly<{ kana: string; romaji: string }>;
    class: "godan" | "ichidan" | "irregular";
  }>;
}

export interface A1PracticeActivity {
  readonly id: string;
  readonly function: A1PracticeFunction;
  readonly interactionKind:
    | "tile-ordering" | "choice" | "transformation"
    | "completion" | "constrained-construction" | "spoken";
  readonly targetRef:
    | Readonly<{ round: "one" | "two"; index: number }>
    | Readonly<{ spokenVariantId: string }>;
}

export interface A1PracticeBlueprint {
  readonly activities: readonly [
    A1PracticeActivity,
    A1PracticeActivity,
    A1PracticeActivity,
    A1PracticeActivity,
    A1PracticeActivity,
  ];
}

export interface A1LessonContent {
  readonly lessonId: string;
  readonly situation: Bilingual;
  readonly prerequisiteLessonIds: readonly string[];
  readonly prerequisiteConceptIds: readonly string[];
  readonly newLexemeIds: readonly string[];
  readonly vocabularyException?: Readonly<{
    kind: "synthesis";
    reason: Bilingual;
  }>;
  readonly learningNoteId: string;
  readonly workedExampleVariantIds: readonly [string, string] | readonly [string, string, string];
  readonly dialogue?: Readonly<{
    turnVariantIds: readonly [string, string] | readonly [string, string, string];
  }>;
  readonly practiceBlueprint: A1PracticeBlueprint;
  readonly retrievalCue: Bilingual;
}
```

`defineA1LessonContent` must reject empty localized copy, non-five activity
lists, duplicate IDs, consecutive duplicate functions, duplicate non-spoken
target refs, missing meaning/form/production/listening functions, and an
exception on a lesson that still introduces words. Return `deepFreeze(input)`.

- [ ] **Step 4: Run tests green**

Run:

```bash
npm test -- src/course/a1/curriculum/types.test.ts src/course/a1/authoring.test.ts
npx tsc --noEmit
git diff --check
```

Expected: all selected tests PASS and TypeScript reports no errors.

- [ ] **Step 5: Commit after both reviews**

```bash
git add src/course/a1/curriculum/types.ts \
  src/course/a1/curriculum/types.test.ts
git commit -m "feat: define A1 instructional curriculum contracts" \
  -m "Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>" \
  -m "Copilot-Session: 00ce510c-997d-4930-bef7-b054a4faa489"
```

### Task 2: Add the canonical A1 lexicon and token resolver

**Files:**
- Create: `src/course/a1/curriculum/lexicon.ts`
- Create: `src/course/a1/curriculum/lexicon.test.ts`
- Create: `src/course/a1/curriculum/resolveLexeme.ts`
- Create: `src/course/a1/curriculum/resolveLexeme.test.ts`
- Modify: `src/course/a1/catalog/a1SemanticCatalog.ts`

- [ ] **Step 1: Write failing lexicon tests**

Test canonical meanings, verb metadata, immutable indexes, and production
semantic-value closure:

```ts
import { describe, expect, it } from "vitest";
import { a1SemanticValues } from "../catalog/a1SemanticCatalog";
import {
  a1Lexemes,
  a1LexemeById,
  a1LexemeByValueId,
} from "./lexicon";

describe("canonical A1 lexicon", () => {
  it("has bilingual meanings and unique semantic value ownership", () => {
    const owned = a1Lexemes.flatMap((entry) => entry.valueIds);
    expect(new Set(owned).size).toBe(owned.length);
    for (const entry of a1Lexemes) {
      expect(entry.meaning.en.trim()).not.toBe("");
      expect(entry.meaning.it.trim()).not.toBe("");
      expect(a1LexemeById.get(entry.id)).toBe(entry);
      for (const valueId of entry.valueIds) {
        expect(a1LexemeByValueId.get(valueId)).toBe(entry);
      }
    }
  });

  it("gives every verb a lemma, polite form, and class", () => {
    for (const entry of a1Lexemes.filter((item) => item.category === "verb")) {
      expect(entry.verb?.dictionary.kana).toMatch(/\S/);
      expect(entry.verb?.dictionary.romaji).toMatch(/\S/);
      expect(entry.verb?.polite.kana).toMatch(/ます$/);
      expect(entry.verb?.polite.romaji).toMatch(/masu$/);
      expect(["godan", "ichidan", "irregular"]).toContain(entry.verb?.class);
    }
  });

  it("maps every learner-visible lexical semantic value", () => {
    const lexicalValueIds = a1SemanticValues
      .filter((value) => value.tokenFragments.some((token) => token.kind === "lexical"))
      .map((value) => value.id);
    expect(lexicalValueIds.filter((id) => !a1LexemeByValueId.has(id))).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the lexicon tests red**

Run:

```bash
npm test -- src/course/a1/curriculum/lexicon.test.ts \
  src/course/a1/curriculum/resolveLexeme.test.ts
```

Expected: FAIL because the lexicon and resolver do not exist.

- [ ] **Step 3: Author canonical entries**

Use `defineA1Lexeme` to reject duplicate/empty fields and freeze entries. The
opening foundations entries must be exactly:

```ts
defineA1Lexeme({
  id: "a1-lexeme-watashi",
  valueIds: ["a1-value-watashi"],
  kana: "わたし",
  romaji: "watashi",
  category: "pronoun",
  meaning: { en: "I; me", it: "io; me" },
}),
defineA1Lexeme({
  id: "a1-lexeme-gakusei",
  valueIds: ["a1-value-obj-student"],
  kana: "がくせい",
  romaji: "gakusei",
  category: "person",
  meaning: { en: "student", it: "studente; studentessa" },
}),
defineA1Lexeme({
  id: "a1-lexeme-taberu",
  valueIds: ["a1-value-eat"],
  kana: "たべる",
  romaji: "taberu",
  category: "verb",
  meaning: { en: "to eat", it: "mangiare" },
  verb: {
    dictionary: { kana: "たべる", romaji: "taberu" },
    polite: { kana: "たべます", romaji: "tabemasu" },
    class: "ichidan",
  },
}),
```

Complete the catalog for every lexical `SemanticValue`. Where two value IDs
are inflectional/contextual uses of one lexical item, put both in one entry.
Where a value contains a fixed multiword expression, expose it as one
`expression` entry. Add semantic values only when the 4-6 first-use allocation
in Tasks 4-6 cannot be met with practical existing content; any added value must
be used by a worked example or practice target in the same lesson.

- [ ] **Step 4: Implement structural token-to-lexeme resolution**

`resolveLexeme.ts` must parse token source references, use the referenced
variant's slot value, and resolve subject tokens through an explicit immutable
`subjectLexemeIdByReferentId` map. It must return a typed failure rather than
matching sentence translations:

```ts
export type ResolveLexemeResult =
  | { readonly ok: true; readonly lexeme: A1Lexeme }
  | {
      readonly ok: false;
      readonly code: "non-lexical-token" | "unmapped-token-source" | "missing-lexeme";
      readonly referenceId: string;
    };
```

Tests must cover a noun slot, a verb stem plus ending, an explicit `わたし`
subject, an omitted subject, and particle/ending rejection.

- [ ] **Step 5: Run focused tests green**

Run:

```bash
npm test -- src/course/a1/curriculum/lexicon.test.ts \
  src/course/a1/curriculum/resolveLexeme.test.ts \
  src/course/a1/catalog/a1ContentInvariants.test.ts
npx tsc --noEmit
git diff --check
```

Expected: all selected tests PASS.

- [ ] **Step 6: Commit after both reviews**

```bash
git add src/course/a1/curriculum/lexicon.ts \
  src/course/a1/curriculum/lexicon.test.ts \
  src/course/a1/curriculum/resolveLexeme.ts \
  src/course/a1/curriculum/resolveLexeme.test.ts \
  src/course/a1/catalog/a1SemanticCatalog.ts
git commit -m "feat: add canonical A1 word meanings and forms" \
  -m "Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>" \
  -m "Copilot-Session: 00ce510c-997d-4930-bef7-b054a4faa489"
```

### Task 3: Author learner-facing grammar and sound notes

**Files:**
- Create: `src/course/a1/curriculum/grammar.ts`
- Create: `src/course/a1/curriculum/grammar.test.ts`

- [ ] **Step 1: Write failing note-contract tests**

```ts
import { describe, expect, it } from "vitest";
import {
  a1LearningNotes,
  a1LearningNoteById,
  validateLearningNoteCopy,
} from "./grammar";

describe("A1 learner-facing notes", () => {
  it("has complete IT/EN teaching copy and text-labelled patterns", () => {
    for (const note of a1LearningNotes) {
      expect(validateLearningNoteCopy(note)).toEqual([]);
      expect(note.pattern.length).toBeGreaterThan(0);
      for (const token of note.pattern) {
        expect(token.label.en).toMatch(/\S/);
        expect(token.label.it).toMatch(/\S/);
      }
      expect(a1LearningNoteById.get(note.id)).toBe(note);
    }
  });

  it("teaches the required foundations explicitly", () => {
    expect([...a1LearningNoteById.keys()]).toEqual(
      expect.arrayContaining([
        "a1-note-sentence-shape-omission",
        "a1-note-personal-reference",
        "a1-note-topic-wa-copula-desu",
        "a1-note-question-ka-words",
        "a1-note-dictionary-masu-classes",
        "a1-note-particle-ga",
        "a1-note-particle-o",
        "a1-note-particle-de",
        "a1-note-particle-ni",
        "a1-note-particle-he",
        "a1-note-masu-masen",
        "a1-note-mashita-masen-deshita",
      ]),
    );
  });
});
```

- [ ] **Step 2: Run red**

Run:

```bash
npm test -- src/course/a1/curriculum/grammar.test.ts
```

Expected: FAIL because `grammar.ts` does not exist.

- [ ] **Step 3: Implement note types and required copy**

Define note tokens as `"slot" | "particle" | "ending" | "punctuation"` and
author every note with `title`, `meaning`, `use`, `construction`,
`typicalMistake`, optional `subjectOmissionNote`, prerequisites, nearest
contrast, and a visual pattern.

```ts
export interface A1LearningNote {
  readonly id: string;
  readonly kind: "grammar" | "phonetic" | "synthesis";
  readonly requiredConceptIds: readonly string[];
  readonly title: Bilingual;
  readonly meaning: Bilingual;
  readonly use: Bilingual;
  readonly construction: Bilingual;
  readonly typicalMistake: Bilingual;
  readonly subjectOmissionNote?: Bilingual;
  readonly pattern: readonly Readonly<{
    kind: "slot" | "particle" | "ending" | "punctuation";
    text: string;
    label: Bilingual;
  }>[];
  readonly nearestContrastId?: string;
}
```

The omission/personal-reference notes must include this meaning:

```ts
{
  id: "a1-note-personal-reference",
  requiredConceptIds: ["a1-concept-topic-wa"],
  kind: "grammar",
  title: { en: "Say the person once, then omit it", it: "Nomina la persona, poi omettila" },
  meaning: {
    en: "Japanese usually leaves out I, you, and other subjects when the context is clear.",
    it: "In giapponese di solito si omettono io, tu e gli altri soggetti quando il contesto è chiaro.",
  },
  use: {
    en: "Use わたし to establish yourself as the topic. Prefer a name or title to あなた; use あなた only when the person is not otherwise clear.",
    it: "Usa わたし per stabilire che parli di te. Preferisci nome o titolo ad あなた; usa あなた solo quando la persona non è chiara in altro modo.",
  },
  construction: {
    en: "[person] は [information] です → once the person is known: [information] です",
    it: "[persona] は [informazione] です → quando la persona è nota: [informazione] です",
  },
  typicalMistake: {
    en: "Do not repeat わたし or あなた in every sentence.",
    it: "Non ripetere わたし o あなた in ogni frase.",
  },
  subjectOmissionNote: {
    en: "Omission is natural only when listeners can recover the person from context.",
    it: "L'omissione è naturale solo quando chi ascolta può capire la persona dal contesto.",
  },
  pattern: [
    { kind: "slot", text: "わたし", label: { en: "person/topic", it: "persona/tema" } },
    { kind: "particle", text: "は", label: { en: "topic particle", it: "particella del tema" } },
    { kind: "slot", text: "がくせい", label: { en: "information", it: "informazione" } },
    { kind: "ending", text: "です", label: { en: "polite copula", it: "copula cortese" } },
  ],
  nearestContrastId: "a1-note-topic-wa-copula-desu",
}
```

Author separate notes for each required particle and tense/polarity form; do
not put all particles in one note. Add four phonetic notes and synthesis notes
so every lesson can resolve `learningNoteId` without inventing grammar.

- [ ] **Step 4: Run green**

Run:

```bash
npm test -- src/course/a1/curriculum/grammar.test.ts
npx tsc --noEmit
git diff --check
```

Expected: PASS.

- [ ] **Step 5: Commit after both reviews**

```bash
git add src/course/a1/curriculum/grammar.ts \
  src/course/a1/curriculum/grammar.test.ts
git commit -m "feat: teach A1 grammar and sound foundations" \
  -m "Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>" \
  -m "Copilot-Session: 00ce510c-997d-4930-bef7-b054a4faa489"
```

### Task 4: Author sound and early-foundations lesson content

**Files:**
- Create: `src/course/a1/curriculum/modules01to04.ts`
- Create: `src/course/a1/curriculum/modules01to04.test.ts`
- Modify: `src/course/a1/catalog/module01Sounds.ts`
- Modify: `src/course/a1/catalog/module02Introductions.ts`
- Modify: `src/course/a1/catalog/module03Questions.ts`
- Modify: `src/course/a1/catalog/module04Actions.ts`

- [ ] **Step 1: Write failing slice tests**

Assert all 16 IDs exist, each has five distinct-function activities, all
phonetic/instructional lessons introduce 4-6 unique lexemes, and the earliest
four semantic lessons use the approved progression:

```ts
expect(contents.map((lesson) => lesson.lessonId)).toEqual([
  "sounds-1", "sounds-2", "sounds-3", "sounds-4",
  "introductions-1", "introductions-2", "introductions-3", "introductions-4",
  "essential-questions-1", "essential-questions-2",
  "essential-questions-3", "essential-questions-4",
  "actions-1", "actions-2", "actions-3", "actions-4",
]);
expect(contentById.get("introductions-1")?.learningNoteId)
  .toBe("a1-note-sentence-shape-omission");
expect(contentById.get("introductions-2")?.learningNoteId)
  .toBe("a1-note-topic-wa-copula-desu");
expect(contentById.get("introductions-3")?.learningNoteId)
  .toBe("a1-note-dictionary-masu-classes");
expect(contentById.get("introductions-4")?.dialogue?.turnVariantIds)
  .toHaveLength(3);
```

- [ ] **Step 2: Run red**

Run:

```bash
npm test -- src/course/a1/curriculum/modules01to04.test.ts
```

Expected: FAIL because the slice does not exist.

- [ ] **Step 3: Add reusable blueprint helpers**

Inside the slice file, create two explicit helpers:

```ts
function semanticBlueprint(
  lessonId: string,
  spokenVariantId: string,
  fourth: "transformation" | "contextual-response",
): A1PracticeBlueprint

function phoneticBlueprint(
  lessonId: string,
  spokenTargetId: string,
): A1PracticeBlueprint
```

`semanticBlueprint` must order choice/meaning, completion/form,
tile-ordering/controlled-production, transformation-or-construction, and
spoken. `phoneticBlueprint` must order anchor-word meaning, sound
discrimination, kana/word production, contextual recognition, and spoken.
Both helpers return `defineA1LessonContent`-compatible five-tuples with unique
targets.

- [ ] **Step 4: Author all 16 lesson records**

Use existing stable variant IDs for worked examples/dialogues. Assign words by
first actual use; no worked example or selected target may reference an
unassigned future word. `introductions-1` begins with:

```ts
defineA1LessonContent({
  lessonId: "introductions-1",
  situation: {
    en: "You meet a classmate and say who you are.",
    it: "Conosci un compagno di classe e dici chi sei.",
  },
  prerequisiteLessonIds: ["sounds-4"],
  prerequisiteConceptIds: [],
  newLexemeIds: [
    "a1-lexeme-watashi",
    "a1-lexeme-gakusei",
    "a1-lexeme-sensei",
    "a1-lexeme-namae",
  ],
  learningNoteId: "a1-note-sentence-shape-omission",
  workedExampleVariantIds: ["introductions-1-m1", "introductions-1-m2"],
  dialogue: {
    turnVariantIds: [
      "introductions-1-m1",
      "introductions-1-m2",
      "introductions-1-m3",
    ],
  },
  practiceBlueprint: semanticBlueprint(
    "introductions-1",
    "introductions-1-m1",
    "contextual-response",
  ),
  retrievalCue: {
    en: "Without looking, say who you are; then say it again without repeating わたし.",
    it: "Senza guardare, di' chi sei; poi ripetilo senza ripetere わたし.",
  },
});
```

Adjust the four module catalogs only where existing variant order/content uses
a word before this sequence. Preserve practical Can-dos and no-answer-leak
authoring.

- [ ] **Step 5: Run the slice and catalog tests green**

Run:

```bash
npm test -- src/course/a1/curriculum/modules01to04.test.ts \
  src/course/a1/catalog/modules01to04.test.ts \
  src/course/a1/catalog/a1LessonBuilders.test.ts
npx tsc --noEmit
git diff --check
```

Expected: PASS.

- [ ] **Step 6: Commit after both reviews**

```bash
git add src/course/a1/curriculum/modules01to04.ts \
  src/course/a1/curriculum/modules01to04.test.ts \
  src/course/a1/catalog/module01Sounds.ts \
  src/course/a1/catalog/module02Introductions.ts \
  src/course/a1/catalog/module03Questions.ts \
  src/course/a1/catalog/module04Actions.ts
git commit -m "feat: author the navigable A1 foundations sequence" \
  -m "Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>" \
  -m "Copilot-Session: 00ce510c-997d-4930-bef7-b054a4faa489"
```

### Task 5: Author routines, tense, places, and people lesson content

**Files:**
- Create: `src/course/a1/curriculum/modules05to08.ts`
- Create: `src/course/a1/curriculum/modules05to08.test.ts`
- Modify: `src/course/a1/catalog/module05Routines.ts`
- Modify: `src/course/a1/catalog/module06TensePolarity.ts`
- Modify: `src/course/a1/catalog/module07Places.ts`
- Modify: `src/course/a1/catalog/module08People.ts`

- [ ] **Step 1: Write failing slice tests**

Assert the exact 16 lesson IDs, 4-6 first-use words, and incremental concept
order:

```ts
expect(contentById.get("past-negative-1")?.learningNoteId)
  .toBe("a1-note-mashita");
expect(contentById.get("past-negative-2")?.learningNoteId)
  .toBe("a1-note-masu-masen");
expect(contentById.get("past-negative-3")?.learningNoteId)
  .toBe("a1-note-mashita-masen-deshita");
expect(contentById.get("places-1")?.learningNoteId)
  .toBe("a1-note-particle-ni-destination");
expect(contentById.get("places-2")?.learningNoteId)
  .toBe("a1-note-particle-he-contrast");
expect(contentById.get("places-3")?.learningNoteId)
  .toBe("a1-note-particle-de-transport");
```

Also assert every lesson has two or three worked examples, every verb used by
those examples resolves lemma/polite metadata, and no `あなた` lexeme is placed
in repeated adjacent turns.

- [ ] **Step 2: Run red**

Run:

```bash
npm test -- src/course/a1/curriculum/modules05to08.test.ts
```

Expected: FAIL because the slice does not exist.

- [ ] **Step 3: Author all 16 records**

Use existing stable IDs:

```text
routines-1..4
past-negative-1..4
places-1..4
people-1..4
```

Alternate the fourth practice function by lesson position:

```ts
const fourthFunction = (lessonOrder: number) =>
  lessonOrder % 2 === 0 ? "transformation" : "contextual-response";
```

Tense lessons must contrast only the nearest known form. Place lessons introduce
`に`, then `へ`, then transport/action `で`; their notes and examples may contrast
known particles but may not introduce a later one early. People lessons must
prefer names, kin terms, and omission to repeated personal pronouns.

- [ ] **Step 4: Update variants only when closure requires it**

If an existing model uses more than six not-yet-known words, replace the
lowest-value repeated model with a semantically equivalent variant using known
words. Keep eight model rows for matrix exploration; do not add extra sentences
to hide the sequencing defect.

- [ ] **Step 5: Run green**

Run:

```bash
npm test -- src/course/a1/curriculum/modules05to08.test.ts \
  src/course/a1/catalog/modules05to08.test.ts \
  src/course/a1/catalog/recurrence.test.ts
npx tsc --noEmit
git diff --check
```

Expected: PASS.

- [ ] **Step 6: Commit after both reviews**

```bash
git add src/course/a1/curriculum/modules05to08.ts \
  src/course/a1/curriculum/modules05to08.test.ts \
  src/course/a1/catalog/module05Routines.ts \
  src/course/a1/catalog/module06TensePolarity.ts \
  src/course/a1/catalog/module07Places.ts \
  src/course/a1/catalog/module08People.ts
git commit -m "feat: sequence A1 forms places and personal reference" \
  -m "Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>" \
  -m "Copilot-Session: 00ce510c-997d-4930-bef7-b054a4faa489"
```

### Task 6: Author scenario and synthesis content, then assemble all A1 lessons

**Files:**
- Create: `src/course/a1/curriculum/modules09to12.ts`
- Create: `src/course/a1/curriculum/modules09to12.test.ts`
- Create: `src/course/a1/curriculum/catalog.ts`
- Create: `src/course/a1/curriculum/catalog.test.ts`
- Modify: `src/course/a1/catalog/module09Descriptions.ts`
- Modify: `src/course/a1/catalog/module10Shopping.ts`
- Modify: `src/course/a1/catalog/module11ExistenceNeeds.ts`
- Modify: `src/course/a1/catalog/module12Capstones.ts`
- Modify: `src/course/a1/authoring.ts`
- Modify: `src/course/a1/catalog/a1LessonBuilders.ts`
- Modify: `src/course/foundations/instructionalLessonKit.ts`
- Test: `src/course/foundations/instructionalLessonKit.test.ts`

- [ ] **Step 1: Write failing assembly and round-count tests**

```ts
expect(a1LessonContents).toHaveLength(48);
expect(new Set(a1LessonContents.map((lesson) => lesson.lessonId)).size).toBe(48);
expect(a1LessonContents.map((lesson) => lesson.lessonId))
  .toEqual(A1_LESSON_IDS);

for (const lessonId of A1_CAPSTONE_LESSON_IDS) {
  const content = a1LessonContentById.get(lessonId)!;
  expect(content.newLexemeIds).toEqual([]);
  expect(content.vocabularyException?.kind).toBe("synthesis");
}
```

In `instructionalLessonKit.test.ts`, prove a config with
`roundTargetCounts: [2, 2]` emits two targets in each round while the A2-style
`[5, 5]` config remains unchanged.

- [ ] **Step 2: Run red**

Run:

```bash
npm test -- src/course/a1/curriculum/modules09to12.test.ts \
  src/course/a1/curriculum/catalog.test.ts \
  src/course/foundations/instructionalLessonKit.test.ts
```

Expected: FAIL because the slice/catalog and per-round count contract do not
exist.

- [ ] **Step 3: Author the final 16 lesson records**

Cover:

```text
descriptions-1..4
shopping-1..4
existence-needs-1..4
capstones-1..4
```

Descriptions, shopping, and existence lessons each introduce 4-6 words.
Capstones introduce none, reference only earlier words/notes, and include
mini-dialogues that combine known content in their existing practical scenario.

- [ ] **Step 4: Generalize the shared kit without changing A2 output**

Replace `roundTargetCount` with:

```ts
readonly roundTargetCounts: readonly [roundOne: number, roundTwo: number];
```

Use index 0 for `roundOne.targetCount` and index 1 for `roundTwo.targetCount`.
Set A1 to `[2, 2]` and A2 to `[5, 5]`. Change A1's
`exerciseCountRange` to `[4, 4]`, `minUniqueTargets` to `4`, and the A1
authoring round assertions to the `[2, 2]` tuple. Keep A2 catalog snapshots and
selection IDs unchanged.

- [ ] **Step 5: Assemble and freeze all content**

`catalog.ts` exports:

```ts
export const a1LessonContents: readonly A1LessonContent[];
export const a1LessonContentById: ReadonlyMap<string, A1LessonContent>;
export const a1LexemeById: ReadonlyMap<string, A1Lexeme>;
export const a1LearningNoteById: ReadonlyMap<string, A1LearningNote>;
```

Fail at module initialization on duplicate or missing lesson IDs; do not export
a partial catalog.

- [ ] **Step 6: Run focused and A2 compatibility tests**

Run:

```bash
npm test -- src/course/a1/curriculum/modules09to12.test.ts \
  src/course/a1/curriculum/catalog.test.ts \
  src/course/a1/catalog/a1LessonBuilders.characterization.test.ts \
  src/course/a2/catalog/a2LessonBuilders.test.ts \
  src/course/foundations/instructionalLessonKit.test.ts
npx tsc --noEmit
git diff --check
```

Expected: PASS; A2 characterization remains unchanged.

- [ ] **Step 7: Commit after both reviews**

```bash
git add src/course/a1/curriculum/modules09to12.ts \
  src/course/a1/curriculum/modules09to12.test.ts \
  src/course/a1/curriculum/catalog.ts \
  src/course/a1/curriculum/catalog.test.ts \
  src/course/a1/catalog/module09Descriptions.ts \
  src/course/a1/catalog/module10Shopping.ts \
  src/course/a1/catalog/module11ExistenceNeeds.ts \
  src/course/a1/catalog/module12Capstones.ts \
  src/course/a1/authoring.ts src/course/a1/catalog/a1LessonBuilders.ts \
  src/course/foundations/instructionalLessonKit.ts \
  src/course/foundations/instructionalLessonKit.test.ts
git commit -m "feat: complete the authored A1 learning sequence" \
  -m "Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>" \
  -m "Copilot-Session: 00ce510c-997d-4930-bef7-b054a4faa489"
```

### Task 7: Build exhaustive curriculum validation and reports

**Files:**
- Create: `src/course/a1/curriculum/validateA1Curriculum.ts`
- Create: `src/course/a1/curriculum/validateA1Curriculum.test.ts`
- Create: `src/course/a1/curriculum/a1CurriculumInvariants.test.ts`
- Create: `src/course/a1/curriculum/reports.ts`
- Create: `src/course/a1/curriculum/reports.test.ts`
- Modify: `src/course/a1/types.ts`
- Modify: `src/course/a1/catalog/validateA1.ts`
- Modify: `src/course/a1/catalog/validateA1.test.ts`
- Modify: `scripts/validateA1Release.ts`
- Modify: `scripts/validateA1Release.test.ts`

- [ ] **Step 1: Write one failing fixture per new error code**

Add these exact codes to the A1 release vocabulary:

```ts
export const A1_CURRICULUM_ERROR_CODES = [
  "missing-instructional-content",
  "missing-locale-copy",
  "invalid-new-word-count",
  "invalid-vocabulary-exception",
  "duplicate-lexeme-introduction",
  "unintroduced-lexeme-use",
  "unglossed-lexeme-use",
  "verb-form-unexplained",
  "grammar-prerequisite-order",
  "grammar-explanation-missing",
  "future-content-in-example",
  "future-content-in-dialogue",
  "invalid-practice-count",
  "insufficient-practice-functions",
  "missing-practice-function",
  "consecutive-practice-function",
  "duplicate-practice-target",
  "practice-kind-mismatch",
  "invalid-worked-example-count",
  "worked-example-unresolvable",
  "invalid-section-order",
  "review-retrieval-clone",
] as const;
```

Tests construct one minimally broken copy of production data for every code and
assert the error identifies `lessonId`, `referenceId`, and expected/actual
where relevant.

- [ ] **Step 2: Run red**

Run:

```bash
npm test -- src/course/a1/curriculum/validateA1Curriculum.test.ts
```

Expected: FAIL because the validator does not exist.

- [ ] **Step 3: Implement staged production validation**

Stages:

1. catalog/reference/locale integrity;
2. cumulative first-use lexeme closure in `A1_LESSON_IDS` order;
3. note prerequisites and verb-form explanation;
4. realized worked examples/dialogues and token gloss closure;
5. practice count/function/kind/visible-target closure;
6. exact A1 section order;
7. alternate-review validity.

The validator must realize the actual production variants and use
`resolveLexemeForToken`; it may not infer words from sentence translations or
trust authored counts.

- [ ] **Step 4: Add production reports**

Expose:

```ts
interface A1LessonCurriculumReport {
  lessonId: string;
  newLexemeCount: number;
  introducedLexemeIds: readonly string[];
  usedLexemeIds: readonly string[];
  learningNoteId: string;
  prerequisiteConceptIds: readonly string[];
  practiceFunctions: readonly A1PracticeFunction[];
  interactionKinds: readonly string[];
  visibleTargetKeys: readonly string[];
}
```

Tests assert 48 ordered rows, 4-6 new words for non-synthesis lessons, zero
future-use failures, five activities, at least four functions, required
meaning/form/production/listening functions, no consecutive duplicate
functions, and no duplicate visible targets.

- [ ] **Step 5: Wire the prebuild gate**

`validateA1Release()` must append attributed curriculum errors.
`scripts/validateA1Release.ts` must print the exact new error code and exit
non-zero on a failure.

- [ ] **Step 6: Run green**

Run:

```bash
npm test -- src/course/a1/curriculum/validateA1Curriculum.test.ts \
  src/course/a1/curriculum/a1CurriculumInvariants.test.ts \
  src/course/a1/curriculum/reports.test.ts \
  src/course/a1/catalog/validateA1.test.ts \
  scripts/validateA1Release.test.ts
npx vite-node scripts/validateA1Release.ts
npx tsc --noEmit
git diff --check
```

Expected: PASS and the script prints the valid A1 release summary.

- [ ] **Step 7: Commit after both reviews**

```bash
git add src/course/a1/curriculum/validateA1Curriculum.ts \
  src/course/a1/curriculum/validateA1Curriculum.test.ts \
  src/course/a1/curriculum/a1CurriculumInvariants.test.ts \
  src/course/a1/curriculum/reports.ts \
  src/course/a1/curriculum/reports.test.ts \
  src/course/a1/types.ts src/course/a1/catalog/validateA1.ts \
  src/course/a1/catalog/validateA1.test.ts scripts/validateA1Release.ts
git commit -m "feat: gate A1 instructional order and practice quality" \
  -m "Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>" \
  -m "Copilot-Session: 00ce510c-997d-4930-bef7-b054a4faa489"
```

### Task 8: Build the curriculum and practice view models

**Files:**
- Create: `src/course/a1/curriculum/buildA1CurriculumViewModel.ts`
- Create: `src/course/a1/curriculum/buildA1CurriculumViewModel.test.ts`
- Create: `src/course/components/a1PracticeModel.ts`
- Create: `src/course/components/a1PracticeModel.test.ts`
- Modify: `src/course/a1/a1LessonViewModel.ts`
- Modify: `src/course/components/lessonExerciseModel.ts`
- Modify: `src/course/components/lessonExerciseModel.test.ts`
- Modify: `src/course/components/phoneticExerciseModel.ts`
- Modify: `src/course/components/phoneticExerciseModel.test.ts`

- [ ] **Step 1: Write failing view-model tests**

For `introductions-1` in each locale, assert:

```ts
expect(model.overview.situation).toMatch(/\S/);
expect(model.overview.prerequisites).toHaveLength(1);
expect(model.vocabulary).toHaveLength(4);
expect(model.vocabulary[0]).toMatchObject({
  kana: "わたし",
  romaji: "watashi",
});
expect(model.vocabulary[0].meaning).toBe(locale === "it" ? "io; me" : "I; me");
expect(model.note.typicalMistake).toMatch(/\S/);
expect(model.examples).toHaveLength(2);
expect(model.examples[0].tokens.every((token) =>
  token.kind !== "lexical" || token.gloss !== null,
)).toBe(true);
expect(model.practice.activities).toHaveLength(5);
expect(model.recap.retrievalCue).toMatch(/\S/);
```

Assert locale changes only localized text, never IDs, Japanese, romaji,
practice order, or targets.

- [ ] **Step 2: Run red**

Run:

```bash
npm test -- src/course/a1/curriculum/buildA1CurriculumViewModel.test.ts \
  src/course/components/a1PracticeModel.test.ts
```

Expected: FAIL because the builders do not exist.

- [ ] **Step 3: Join content to the existing production view model**

Export:

```ts
export interface A1CurriculumVocabularyItem {
  readonly id: string;
  readonly kana: string;
  readonly romaji: string;
  readonly meaning: string;
  readonly category: A1Lexeme["category"];
  readonly verb?: A1Lexeme["verb"];
}

export interface A1PracticeActivityModel {
  readonly id: string;
  readonly function: A1PracticeFunction;
  readonly interactionKind: A1PracticeActivity["interactionKind"];
  readonly targetRef: A1PracticeActivity["targetRef"];
}

export interface A1CurriculumViewModel {
  readonly lessonId: string;
  readonly overview: Readonly<{
    canDo: string;
    situation: string;
    prerequisites: readonly Readonly<{ lessonId: string; title: string }>[];
  }>;
  readonly vocabulary: readonly A1CurriculumVocabularyItem[];
  readonly note: Readonly<{
    id: string;
    kind: A1LearningNote["kind"];
    title: string;
    meaning: string;
    use: string;
    construction: string;
    typicalMistake: string;
    subjectOmissionNote?: string;
    pattern: A1LearningNote["pattern"];
    nearestContrastTitle?: string;
  }>;
  readonly examples: readonly Readonly<{
    variantId: string;
    tokens: readonly Readonly<{
      token: AssembledToken;
      gloss: string | null;
      role: "lexeme" | "particle" | "ending" | "punctuation";
    }>[];
    translation: string;
  }>[];
  readonly optionalPattern: FoundationMatrixModel | null;
  readonly practice: Readonly<{
    activities: readonly A1PracticeActivityModel[];
  }>;
  readonly recap: Readonly<{
    vocabulary: readonly A1CurriculumVocabularyItem[];
    retrievalCue: string;
  }>;
}

export type A1CurriculumViewModelResult =
  | { ok: true; model: A1CurriculumViewModel }
  | {
      ok: false;
      error: {
        code: "unknown-lesson" | "unresolved-content" | "unresolved-example" | "unresolved-gloss";
        referenceId: string;
      };
    };
```

Resolve examples from `buildA1LessonViewModel`, not a second realizer. Add
localized word glosses to lexical tokens, and label particle/ending tokens from
the learning-note pattern. Preserve the existing matrix model as
`optionalPattern`.

- [ ] **Step 4: Attach blueprint metadata and explanatory feedback**

Extend `GeneratedExercise`:

```ts
readonly practiceFunction: A1PracticeFunction | null;
readonly feedback: Readonly<Record<Locale, Readonly<{
  accepted: string;
  retry: string;
}>>>;
```

A1 uses `a1PracticeModel` to reorder the four generated prompts into blueprint
order and append a spoken activity model. A2 sets `practiceFunction: null` and
keeps its existing order/output. Feedback names the note title and the first
assessed lexeme meaning/form; it must not include the canonical answer.

- [ ] **Step 5: Reduce phonetic prompts to the four blueprint targets**

Update `buildPhoneticLessonModel` to produce four generated prompts with unique
visible targets; the spoken activity remains the fifth. Remove the old 8-12
practice-ref authoring thresholds while retaining the 8-12 contrastive-item
roster.

- [ ] **Step 6: Run green and characterize A2**

Run:

```bash
npm test -- src/course/a1/curriculum/buildA1CurriculumViewModel.test.ts \
  src/course/components/a1PracticeModel.test.ts \
  src/course/components/lessonExerciseModel.test.ts \
  src/course/components/phoneticExerciseModel.test.ts \
  src/course/a2/view/buildA2LessonViewModel.test.ts
npx tsc --noEmit
git diff --check
```

Expected: PASS; A1 has four generated prompts, A2 retains ten.

- [ ] **Step 7: Commit after both reviews**

```bash
git add src/course/a1/curriculum/buildA1CurriculumViewModel.ts \
  src/course/a1/curriculum/buildA1CurriculumViewModel.test.ts \
  src/course/components/a1PracticeModel.ts \
  src/course/components/a1PracticeModel.test.ts \
  src/course/a1/a1LessonViewModel.ts \
  src/course/components/lessonExerciseModel.ts \
  src/course/components/lessonExerciseModel.test.ts \
  src/course/components/phoneticExerciseModel.ts \
  src/course/components/phoneticExerciseModel.test.ts
git commit -m "feat: build A1 instructional and practice view models" \
  -m "Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>" \
  -m "Copilot-Session: 00ce510c-997d-4930-bef7-b054a4faa489"
```

### Task 9: Render the six-section A1 lesson experience

**Files:**
- Create: `src/course/components/a1/A1AudioButton.tsx`
- Create: `src/course/components/a1/A1LessonOverview.tsx`
- Create: `src/course/components/a1/A1VocabularySection.tsx`
- Create: `src/course/components/a1/A1LearningNote.tsx`
- Create: `src/course/components/a1/A1WorkedExamples.tsx`
- Create: `src/course/components/a1/A1PracticeLadder.tsx`
- Create: `src/course/components/a1/A1LessonRecap.tsx`
- Create: `src/course/components/a1/A1CurriculumSections.test.tsx`
- Modify: `src/course/components/A1LessonPage.tsx`
- Modify: `src/course/components/A1LessonPage.test.ts`
- Modify: `src/routing/lessonSections.ts`
- Modify: `src/routing/lessonSections.test.ts`
- Modify: `src/course/components/LessonPage.tsx`
- Modify: `src/course/components/LessonPage.render.test.ts`
- Modify: `src/course/components/LessonRail.tsx`
- Modify: `src/course/components/LessonRail.test.ts`
- Modify: `src/course/course.css`

- [ ] **Step 1: Write failing semantic-order component tests**

Render `introductions-1` and assert the six heading/region IDs appear in DOM
order, vocabulary meanings are visible by default, every vocabulary/example
has audio, the matrix is inside an optional pattern disclosure after examples,
and practice follows grammar/examples.

Also render an A2 lesson and assert it still uses:

```ts
["rule", "comparison", "explore", "recap"]
```

- [ ] **Step 2: Run red**

Run:

```bash
npm test -- src/course/components/a1/A1CurriculumSections.test.tsx \
  src/course/components/LessonPage.render.test.ts
```

Expected: FAIL because the new components/sections do not exist.

- [ ] **Step 3: Add level-specific section arrays**

In `lessonSections.ts`:

```ts
export const A1_LESSON_SECTION_IDS = [
  "rule", "vocabulary", "grammar", "comparison", "explore", "recap",
] as const;
export const A2_LESSON_SECTION_IDS = [
  "rule", "comparison", "explore", "recap",
] as const;
export const LESSON_SECTION_IDS = A1_LESSON_SECTION_IDS;
```

The union includes all six IDs. Existing four anchor IDs remain unchanged.
`LessonPage` selects the array by level for scrollspy, rail, headings, and
rendering.

- [ ] **Step 4: Implement accessible components**

Requirements:

- overview shows Can-do, situation, and linked prerequisite lesson titles;
- vocabulary is a semantic list with kana/katakana, romaji, localized meaning,
  category, verb lemma/polite form, and one audio button per item;
- meanings render before the hide/show control; the control defaults to shown;
- grammar uses text-labelled particle/ending chips and all note fields;
- examples/dialogue are tokenized lists with word-level gloss, natural
  translation, and audio;
- `SentenceMatrix` is under a disclosure labelled `Explore the pattern` /
  `Esplora il pattern`;
- practice uses four exercise cards and one spoken card in blueprint order;
- recap lists the same canonical meanings/forms and the authored retrieval cue.

`A1AudioButton` calls the existing `useSpeech().speak` and exposes
playing/unavailable/failure status through text and `role="status"`.

- [ ] **Step 5: Replace the old section dispatcher**

`A1LessonPage` calls `buildA1CurriculumViewModel` once per section render and
dispatches:

```ts
switch (sectionId) {
  case "rule": return <A1LessonOverview model={model.overview} />;
  case "vocabulary": return <A1VocabularySection items={model.vocabulary} />;
  case "grammar": return <A1LearningNote note={model.note} />;
  case "comparison": return <A1WorkedExamples model={model.examples} optionalPattern={model.optionalPattern} />;
  case "explore": return <A1PracticeLadder lessonId={lessonId} model={model.practice} />;
  case "recap": return <A1LessonRecap model={model.recap} />;
}
```

Phonetic lessons use the same visible order with their sound note and anchor
words; no separate old four-section branch remains.

- [ ] **Step 6: Add responsive styles**

Use grid/flex wrapping with `minmax(0, 1fr)`, `overflow-wrap: anywhere`, 44px
controls, visible `:focus-visible`, text labels on pattern tokens, and no
mandatory horizontal scroller. At `max-width: 680px`, collapse vocabulary and
example metadata to one column. Under reduced motion, remove new transitions.

- [ ] **Step 7: Run green**

Run:

```bash
npm test -- src/course/components/a1/A1CurriculumSections.test.tsx \
  src/course/components/A1LessonPage.test.ts \
  src/course/components/LessonPage.render.test.ts \
  src/course/components/LessonRail.test.ts \
  src/routing/lessonSections.test.ts \
  src/course/course.css.test.ts
npx tsc --noEmit
git diff --check
```

Expected: PASS.

- [ ] **Step 8: Commit after both reviews**

```bash
git add src/course/components/a1 src/course/components/A1LessonPage.tsx \
  src/course/components/A1LessonPage.test.ts \
  src/routing/lessonSections.ts src/routing/lessonSections.test.ts \
  src/course/components/LessonPage.tsx \
  src/course/components/LessonPage.render.test.ts \
  src/course/components/LessonRail.tsx \
  src/course/components/LessonRail.test.ts src/course/course.css
git commit -m "feat: render vocabulary first across every A1 lesson" \
  -m "Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>" \
  -m "Copilot-Session: 00ce510c-997d-4930-bef7-b054a4faa489"
```

### Task 10: Explain exercise feedback and vary review retrieval

**Files:**
- Modify: `src/course/components/Exercise.tsx`
- Modify: `src/course/components/ExerciseView.tsx`
- Modify: `src/course/components/exerciseState.test.ts`
- Modify: `src/course/components/LessonExercises.tsx`
- Modify: `src/course/components/LessonExercises.test.ts`
- Modify: `src/course/components/reviewQueueModel.ts`
- Modify: `src/course/components/reviewQueueModel.test.ts`
- Modify: `src/course/components/ReviewQueue.tsx`
- Modify: `src/course/components/ReviewQueue.test.ts`
- Modify: `src/course/progress/reviewQueue.ts`
- Modify: `src/course/progress/reviewQueue.test.ts`

- [ ] **Step 1: Write failing feedback tests**

After accepted and retry submissions, `ExerciseView` must render generic status
plus the localized explanatory detail in the same polite live region. Before
submission, neither feedback detail nor answer text appears.

Assert the card exposes:

```html
data-practice-function="form-discrimination"
```

for A1, while A2 omits that attribute.

- [ ] **Step 2: Write failing alternate-review tests**

Given a failed A1 choice/meaning exercise, assert the review item:

```ts
expect(item.sourceExerciseDefinitionId).toBe(failed.definitionId);
expect(item.exerciseDefinitionId).not.toBe(failed.definitionId);
expect(item.practiceFunction).not.toBe(failed.practiceFunction);
expect(item.visibleTargetKey).not.toBe(failed.visibleTargetKey);
expect(
  intersects(item.prompt.assessedConceptIds, entry.targetConceptIds) ||
  intersects(item.prompt.assessedLexemeIds, entry.targetLexemeIds),
).toBe(true);
```

Assert selection is deterministic for the same review key/catalog version.
Assert A2 continues resolving the exact stored definition. Assert no safe A1
alternate produces `unresolvableKeys`, never a clone.

- [ ] **Step 3: Run red**

Run:

```bash
npm test -- src/course/components/LessonExercises.test.ts \
  src/course/components/reviewQueueModel.test.ts \
  src/course/components/ReviewQueue.test.ts
```

Expected: FAIL because feedback detail and alternate selection do not exist.

- [ ] **Step 4: Implement post-submit explanatory feedback**

Add `feedbackDetail` to `ExerciseViewProps`. `Exercise` derives it from
`state.status` and `exercise.feedback[locale]`. Render after the existing
text+glyph status, inside `aria-live="polite"`. Never render it in `idle` or
`invalid`.

- [ ] **Step 5: Implement deterministic alternate retrieval**

For A1 only, rank lesson exercises by:

1. different `practiceFunction`;
2. overlapping assessed concept/lexeme;
3. different `visibleTargetKey`;
4. stable hash of `reviewKey + definitionId`.

Return the first candidate satisfying all three semantic constraints. Keep the
persisted entry and review key unchanged, so accepting the alternate resolves
the original queue item. Add `sourceExerciseDefinitionId` to the view item for
traceability, not persistence.

- [ ] **Step 6: Run green**

Run:

```bash
npm test -- src/course/components/exerciseState.test.ts \
  src/course/components/LessonExercises.test.ts \
  src/course/components/reviewQueueModel.test.ts \
  src/course/components/ReviewQueue.test.ts \
  src/course/progress/reviewQueue.test.ts
npx tsc --noEmit
git diff --check
```

Expected: PASS.

- [ ] **Step 7: Commit after both reviews**

```bash
git add src/course/components/Exercise.tsx \
  src/course/components/ExerciseView.tsx \
  src/course/components/exerciseState.test.ts \
  src/course/components/LessonExercises.tsx \
  src/course/components/LessonExercises.test.ts \
  src/course/components/reviewQueueModel.ts \
  src/course/components/reviewQueueModel.test.ts \
  src/course/components/ReviewQueue.tsx \
  src/course/components/ReviewQueue.test.ts \
  src/course/progress/reviewQueue.ts \
  src/course/progress/reviewQueue.test.ts
git commit -m "feat: explain A1 feedback and vary review retrieval" \
  -m "Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>" \
  -m "Copilot-Session: 00ce510c-997d-4930-bef7-b054a4faa489"
```

### Task 11: Localize foundations navigation and preserve progress

**Files:**
- Modify: `src/course/data/course.ts`
- Modify: `src/course/a1/runtimeCopy.ts`
- Modify: `src/course/a1/runtimeCopy.test.ts`
- Modify: `src/course/components/CourseHome.tsx`
- Modify: `src/course/components/CourseHome.test.ts`
- Modify: `src/course/i18n/types.ts`
- Modify: `src/course/i18n/en.ts`
- Modify: `src/course/i18n/it.ts`
- Modify: `src/course/i18n/validate.test.ts`
- Modify: `src/course/progress/progress.ts`
- Modify: `src/course/progress/progress.v4.test.ts`
- Modify: `src/course/progress/ProgressContext.tsx`
- Modify: `src/course/progress/ProgressContext.v4.test.ts`
- Modify: `src/course/routing/lessonRouteResolution.test.ts`

- [ ] **Step 1: Write failing localization/navigation tests**

Assert:

```ts
expect(it.modules.introductions.title).toMatch(/Fondamenta/);
expect(en.modules.introductions.title).toMatch(/Foundations/);
expect(it.lesson.sections).toMatchObject({
  rule: "Obiettivo",
  vocabulary: "Parole nuove",
  grammar: "Grammatica",
  comparison: "Esempi",
  explore: "Pratica",
  recap: "Ripasso",
});
```

Course Home must show `sounds` then the visible foundations module, and its
primary start/continue route must remain a valid stable lesson route.

- [ ] **Step 2: Write failing progress/review migration tests**

Advance `catalogVersion` to `"a1-a2-v2"` and assert a V4 `"a1-a2-v1"` payload:

- preserves all A1/A2 visit/practice/consolidation timestamps;
- preserves Can-do and checkpoint evidence;
- preserves known review entries for reconciliation;
- moves removed old exercise definitions to `orphanedReviewKeys`;
- never assigns A1 evidence to A2 or vice versa;
- remains idempotent.

- [ ] **Step 3: Run red**

Run:

```bash
npm test -- src/course/a1/runtimeCopy.test.ts \
  src/course/components/CourseHome.test.ts \
  src/course/progress/progress.v4.test.ts \
  src/course/progress/ProgressContext.v4.test.ts \
  src/course/routing/lessonRouteResolution.test.ts
```

Expected: FAIL on new labels/version.

- [ ] **Step 4: Add exact IT/EN copy**

Extend `CourseCopy["lesson"]["sections"]` to all six keys and add copy for:

- situation/prerequisite labels;
- show/hide meanings;
- word category and verb lemma/form/class labels;
- sound/grammar pattern labels;
- typical mistake, subject omission, nearest contrast;
- examples/dialogue and optional pattern disclosure;
- practice-function labels;
- audio play/playing/unavailable/failure;
- feedback explanations and retrieval cue.

Keep A2's rendered section list at four even though the copy record has six
keys.

- [ ] **Step 5: Preserve V4 evidence across the catalog revision**

Add a pure `migrateV4Catalog` that changes only the version and reconciles A1
review definitions. It must not reset lesson or Can-do evidence. Keep current
lesson IDs and all existing route aliases unchanged.

- [ ] **Step 6: Run green**

Run:

```bash
npm test -- src/course/a1/runtimeCopy.test.ts \
  src/course/components/CourseHome.test.ts \
  src/course/i18n/validate.test.ts \
  src/course/progress/progress.v4.test.ts \
  src/course/progress/ProgressContext.v4.test.ts \
  src/course/routing/lessonRouteResolution.test.ts
npx tsc --noEmit
git diff --check
```

Expected: PASS.

- [ ] **Step 7: Commit after both reviews**

```bash
git add src/course/data/course.ts src/course/a1/runtimeCopy.ts \
  src/course/a1/runtimeCopy.test.ts \
  src/course/components/CourseHome.tsx \
  src/course/components/CourseHome.test.ts \
  src/course/i18n/types.ts src/course/i18n/en.ts src/course/i18n/it.ts \
  src/course/i18n/validate.test.ts src/course/progress/progress.ts \
  src/course/progress/progress.v4.test.ts \
  src/course/progress/ProgressContext.tsx \
  src/course/progress/ProgressContext.v4.test.ts \
  src/course/routing/lessonRouteResolution.test.ts
git commit -m "feat: expose A1 foundations without losing progress" \
  -m "Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>" \
  -m "Copilot-Session: 00ce510c-997d-4930-bef7-b054a4faa489"
```

### Task 12: Add exhaustive browser, accessibility, zoom, and visual coverage

**Files:**
- Create: `tests/e2e/a1-foundations-curriculum.spec.ts`
- Modify: `tests/e2e/a1-depth.spec.ts`
- Modify: `tests/e2e/zoom-a11y.spec.ts`
- Modify: `tests/e2e/course-visuals.spec.ts`
- Modify: `tests/e2e/helpers.ts`
- Create/Update: `tests/e2e/course-visuals.spec.ts-snapshots/*introductions-1*.png`
- Create/Update: `tests/e2e/course-visuals.spec.ts-snapshots/*shopping-4*.png`

- [ ] **Step 1: Replace obsolete 8-12/10-exercise assertions**

For all 48 A1 routes, assert:

```ts
await expect(page.locator("#lesson-section-rule")).toBeVisible();
await expect(page.locator("#lesson-section-vocabulary")).toBeVisible();
await expect(page.locator("#lesson-section-grammar")).toBeVisible();
await expect(page.locator("#lesson-section-comparison")).toBeVisible();
await expect(page.locator("#lesson-section-explore")).toBeVisible();
await expect(page.locator("#lesson-section-recap")).toBeVisible();
await expect(page.locator(".lesson-exercise")).toHaveCount(4);
await expect(page.locator(".spoken-attempt")).toHaveCount(1);
```

For every non-capstone route, separately assert:

```ts
const vocabularyCount = await page.locator(".a1-vocabulary__item").count();
expect(vocabularyCount).toBeGreaterThanOrEqual(4);
expect(vocabularyCount).toBeLessThanOrEqual(6);
```

Capstones instead assert zero new-word items, an explicit synthesis/reuse
message, and at least four recap words drawn from earlier content.

- [ ] **Step 2: Add behavior and locale/script tests**

For `introductions-1` and `shopping-4`, in both configured projects:

- meanings are visible on first load;
- learner hide/show toggles only after initial display;
- each word and example audio control is keyboard and pointer operable under a
  speech fake;
- IT/EN switches all explanatory copy but not Japanese/romaji/IDs;
- hiragana/romaji switches preserve meanings and controls;
- pattern tokens expose text labels;
- practice functions are distinct and ordered;
- feedback detail is announced;
- a failed exercise produces a review item with a different function/target;
- no runtime error, external network, or horizontal overflow occurs.

- [ ] **Step 3: Update zoom/accessibility coverage**

At 200% desktop reflow and mobile pinch zoom, test:

- six-step rail remains reachable without trapping horizontal page overflow;
- vocabulary cards, verb forms, pattern tokens, glossed examples, four exercise
  cards, and spoken card remain visible;
- all visible actions are at least 44 by 44 px;
- focus outline is visible;
- `aria-live="polite"` announces feedback/audio state;
- reduced motion removes new transitions;
- 320px layout reflows without whole-page horizontal overflow.

- [ ] **Step 4: Add focused visual baselines**

In `course-visuals.spec.ts`, capture deterministic full-page snapshots for:

```ts
{ name: "a1-foundations-introductions-1", moduleId: "introductions", lessonId: "introductions-1" }
{ name: "a1-migrated-scenario-shopping-4", moduleId: "shopping", lessonId: "shopping-4" }
```

Run:

```bash
npm run test:e2e:update -- tests/e2e/course-visuals.spec.ts \
  --project=desktop-1440
```

Expected: the two PNG baselines are created/updated.

- [ ] **Step 5: Open and inspect both PNGs**

Use an image-capable tool, not file metadata. Record in the task result:

- `introductions-1`: objective → vocabulary → grammar → examples → practice
  hierarchy is obvious; no clipped kana/romaji/meaning; matrix is secondary;
- `shopping-4`: scenario content uses the same order; price/quantity copy wraps;
  no overlap, overflow, or hidden focus/control;
- both: Italian strings fit, five activities are distinguishable, and no
  meaning depends only on color.

If any verdict fails, change CSS/components, re-run the screenshots, reopen
both PNGs, and record the new verdict.

- [ ] **Step 6: Run focused E2E green**

Run:

```bash
npm run test:e2e -- tests/e2e/a1-foundations-curriculum.spec.ts \
  tests/e2e/a1-depth.spec.ts tests/e2e/zoom-a11y.spec.ts \
  tests/e2e/course-visuals.spec.ts
git diff --check
```

Expected: PASS in `desktop-1440` and `mobile-390`.

- [ ] **Step 7: Commit after both reviews**

```bash
git add tests/e2e/a1-foundations-curriculum.spec.ts \
  tests/e2e/a1-depth.spec.ts tests/e2e/zoom-a11y.spec.ts \
  tests/e2e/course-visuals.spec.ts tests/e2e/helpers.ts \
  tests/e2e/course-visuals.spec.ts-snapshots
git commit -m "test: cover the rebuilt A1 curriculum experience" \
  -m "Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>" \
  -m "Copilot-Session: 00ce510c-997d-4930-bef7-b054a4faa489"
```

### Task 13: Run full gates, whole-range review, and finish the branch

**Files:**
- Modify only files required to fix gate/review findings

- [ ] **Step 1: Run exact full gates**

Run sequentially and capture real exit results:

```bash
npm test
npx tsc --noEmit
npm run build
npm run check:bundle
npm run test:e2e
git diff --check
```

Expected:

- full Vitest PASS;
- TypeScript PASS;
- `npm run build` runs A1 validation, A2 validation, A2 no-Japanese lint,
  typecheck, and Vite build successfully;
- bundle budget PASS;
- full Playwright PASS in both projects;
- no whitespace errors.

- [ ] **Step 2: Dispatch a fresh final spec reviewer**

Review the complete range:

```bash
git diff master...HEAD
```

Require explicit findings for:

- every design-spec completion criterion;
- all 48 A1 lessons and first-use word closure;
- foundations pedagogy and natural pronoun/subject-omission guidance;
- particles and verb forms introduced in order;
- five cognitive activities and varied review;
- IT/EN parity and both script modes;
- no answer leak or sentence-translation-derived word meaning;
- accessibility/responsive/zoom/reduced-motion behavior;
- progress and route compatibility;
- A2 content freeze and PR #3 independence.

- [ ] **Step 3: Fix every spec finding and re-review**

For each finding, add a failing regression test, run it red, implement the
minimal fix, run it green, then send the revised range back to the same reviewer.
Repeat until it reports no findings.

- [ ] **Step 4: Dispatch a fresh final code-quality reviewer**

Review `master...HEAD` for correctness, type safety, data-boundary clarity,
duplication, error handling, performance, and test validity. Reject
success-shaped fallbacks, broad catches, derived-from-translation glosses,
tautological production-catalog tests, and A1 logic leaking into A2 content.

- [ ] **Step 5: Fix every quality finding and re-review**

Add regression tests and repeat until the reviewer reports no findings.

- [ ] **Step 6: Re-run all exact gates after final fixes**

Run the same six commands from Step 1. Expected: all PASS with no inferred or
skipped result.

- [ ] **Step 7: Commit final review fixes**

If review fixes exist:

```bash
git add -u
git add src/course/a1/curriculum src/course/components/a1 tests/e2e
git commit -m "fix: resolve final A1 curriculum review findings" \
  -m "Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>" \
  -m "Copilot-Session: 00ce510c-997d-4930-bef7-b054a4faa489"
```

Before committing, inspect `git status --short` and unstage any file unrelated
to the reviewed findings.

- [ ] **Step 8: Use `superpowers:finishing-a-development-branch`**

Verify:

```bash
git status --short
git --no-pager log --oneline master..HEAD
git diff --check master...HEAD
```

Then push `unsafecode-rebuild-a1-foundations` and open a pull request against
`master`. The PR must summarize the learner contract, validators, progress
compatibility, test gates, and visual verdicts. Do not merge or deploy.
