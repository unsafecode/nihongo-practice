# A0→A1 Curriculum Slice B Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the runnable eight-module course with the complete approved 12-module, 40-lesson A0→A1 curriculum while satisfying the 42-verb, 270-word, reuse, script, locale, and capstone gates.

**Architecture:** Extend the Slice A catalogs into the Japanese source of truth, then assemble the existing `CourseModule` runtime shape from those catalogs so routes and UI components stay stable. Japanese examples and semantic references remain locale-independent; IT/EN catalogs own only learner-facing explanations and intent copy. Pure validation computes coverage and blocks invalid content before the assembled course is exported.

**Tech Stack:** React 18, TypeScript 5.6, Vite 6, Vitest 3, React Router 7, static catalog data

---

### Task 1: Define complete curriculum catalog contracts

**Files:**
- Modify: `src/course/catalog/types.ts`
- Create: `src/course/catalog/validateCurriculum.ts`
- Create: `src/course/catalog/validateCurriculum.test.ts`

- [ ] **Step 1: Write failing contract and validator tests**

Add tests proving that the assembled curriculum reports structured errors for duplicate IDs, missing references, lesson durations outside 6-10 minutes, assessment before introduction, capstone introductions, required kanji output, missing katakana assistance, locale-key mismatch, authored/computed coverage mismatch, and insufficient verb reuse.

```ts
const result = validateCurriculum(invalidCatalogs);
expect(result.errors.map(({ code }) => code)).toEqual(
  expect.arrayContaining([
    "duplicate-id",
    "missing-reference",
    "invalid-lesson-duration",
    "assessment-before-introduction",
    "capstone-introduction",
    "required-kanji-output",
    "missing-katakana-assistance",
    "locale-key-mismatch",
    "coverage-mismatch",
    "insufficient-verb-reuse",
  ]),
);
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `npm test -- src/course/catalog/validateCurriculum.test.ts`

Expected: FAIL because the complete curriculum types and validator do not exist.

- [ ] **Step 3: Add typed lesson, coverage, script, and locale boundaries**

Extend the catalog types with immutable `CurriculumLessonEntry`, `ModuleCoverage`, `CurriculumCopyCatalog`, `AssembledCurriculumCatalogs`, `ComputedCoverage`, and structured validation errors. A lesson must carry introduced/practiced/assessed concept and lexeme IDs, example IDs, a speech prompt ID, duration, and a capstone flag.

```ts
export interface CurriculumLessonEntry {
  readonly id: string;
  readonly moduleId: string;
  readonly order: number;
  readonly estimatedMinutes: number;
  readonly introducedConceptIds: readonly ConceptId[];
  readonly practicedConceptIds: readonly ConceptId[];
  readonly assessedConceptIds: readonly ConceptId[];
  readonly introducedLexemeIds: readonly LexemeId[];
  readonly practicedLexemeIds: readonly LexemeId[];
  readonly assessedLexemeIds: readonly LexemeId[];
  readonly exampleIds: readonly ExampleId[];
  readonly speechPromptId: SpeechPromptId;
  readonly capstone: boolean;
}
```

- [ ] **Step 4: Implement pure computed validation**

Walk modules and lessons in stable order. Compute unique vocabulary, introduced verbs, per-module coverage, later reuse modules, and authored example counts from references. Return every deterministic error; never mutate or silently omit content.

- [ ] **Step 5: Run focused tests**

Run: `npm test -- src/course/catalog/validateCurriculum.test.ts src/course/catalog/validate.test.ts src/course/curriculum`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/course/catalog/types.ts src/course/catalog/validateCurriculum.ts src/course/catalog/validateCurriculum.test.ts
git commit -m "feat: add complete curriculum validation"
```

### Task 2: Author the shared concept and 270-item lexicon catalogs

**Files:**
- Create: `src/course/catalog/concepts.ts`
- Create: `src/course/catalog/lexicon.ts`
- Create: `src/course/catalog/lexicon.test.ts`

- [ ] **Step 1: Write failing lexicon coverage tests**

Assert exactly 270 stable lexeme IDs, exactly 42 verb lexemes, unique IDs, hiragana readings for every item, no required kanji output, and coverage of every required semantic verb domain.

```ts
expect(lexicon).toHaveLength(270);
expect(lexicon.filter(({ category }) => category === "verb")).toHaveLength(42);
expect(new Set(lexicon.map(({ id }) => id)).toHaveSize(270);
expect(requiredVerbSenseIds.every((id) => lexiconById.has(id))).toBe(true);
```

The 42 verb sense IDs must include:

```ts
[
  "eat", "drink", "go", "come", "return", "walk", "enter", "leave",
  "board", "alight", "watch", "listen", "ask", "speak", "read", "write",
  "call", "buy", "use", "carry", "take", "receive", "give", "borrow",
  "wait", "meet", "do", "sleep", "wake", "work", "study", "understand",
  "live", "exist-inanimate", "exist-animate", "stand", "sit", "learn",
  "teach-tell", "open", "close", "need",
]
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `npm test -- src/course/catalog/lexicon.test.ts`

Expected: FAIL because the catalogs do not exist.

- [ ] **Step 3: Author grammar concepts**

Define stable concepts for sentence order, topic/object/destination/location/source/companion particles, copula/question frames, demonstratives, polite verb endings, time/frequency, tense/polarity, adjective types, comparison, counters/quantities, requests, existence/position, and needs. Every concept declares earlier concept prerequisites and surface gears.

- [ ] **Step 4: Author the lexicon**

Create 270 contextual beginner lexemes grouped by the module where they are first introduced. Store Japanese kana, hiragana reading, category, script, optional assisted-first-exposure metadata, and semantic sense. Use authentic katakana for Module 1 loanwords and adjacent hiragana assistance on first exposure. Do not use kanji as the answer source.

- [ ] **Step 5: Run focused tests**

Run: `npm test -- src/course/catalog/lexicon.test.ts`

Expected: PASS with 270 lexemes and 42 verbs.

- [ ] **Step 6: Commit**

```bash
git add src/course/catalog/concepts.ts src/course/catalog/lexicon.ts src/course/catalog/lexicon.test.ts
git commit -m "feat: author A0 A1 shared lexicon"
```

### Task 3: Author 40 lessons, examples, speech prompts, and bilingual copy

**Files:**
- Create: `src/course/catalog/examples.ts`
- Create: `src/course/catalog/curriculum.ts`
- Create: `src/course/catalog/speechPrompts.ts`
- Create: `src/course/catalog/copy/it.ts`
- Create: `src/course/catalog/copy/en.ts`
- Create: `src/course/catalog/curriculum.test.ts`

- [ ] **Step 1: Write failing curriculum acceptance tests**

Assert the exact module budgets `[5,3,3,3,3,3,4,3,3,3,3,4]`, exactly 40 lessons, durations 6-10 minutes, IT/EN key parity, one speech prompt per lesson, no new capstone concepts/verbs/vocabulary, exactly three assessed capstones after one orientation lesson, and computed 42/270 coverage matching the Slice A foundation.

Also assert that at least 35 verbs appear in three modules including introduction, two later modules, and at least four authored examples.

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `npm test -- src/course/catalog/curriculum.test.ts`

Expected: FAIL because lesson/example/copy catalogs do not exist.

- [ ] **Step 3: Author the 40-lesson manifest**

Use these stable module IDs and lesson counts:

```ts
[
  ["sounds", 5],
  ["introductions", 3],
  ["essential-questions", 3],
  ["actions", 3],
  ["routines", 3],
  ["past-negative", 3],
  ["places", 4],
  ["people", 3],
  ["descriptions", 3],
  ["shopping", 3],
  ["existence-needs", 3],
  ["capstones", 4],
]
```

Each lesson declares concepts and lexemes introduced, practiced, and assessed. Module 12 consists of orientation, self-introduction, everyday outing, and travel day; it introduces nothing.

- [ ] **Step 4: Author shared Japanese examples and speech prompts**

Every lesson must reference at least one base/changed comparison pair, one guided construction example, and one speech target. Examples own ordered Japanese segments and semantic references; speech prompts point to example IDs and critical segment IDs. Reuse at least 35 verbs according to the computed invariant, not prose mentions.

- [ ] **Step 5: Author complete IT/EN curriculum copy**

For every module and lesson, provide title, outcome/objective, rule, comparison explanation, guided-construction instruction, spoken-attempt instruction, recap, and natural translation/intent text. IT and EN keys must be identical and persona facts must remain coherent.

- [ ] **Step 6: Run focused acceptance tests**

Run: `npm test -- src/course/catalog/curriculum.test.ts src/course/catalog/validateCurriculum.test.ts src/course/data/personas.test.ts`

Expected: PASS, including 40 lessons, 42 verbs, 270 vocabulary items, 35 reused verbs, script policy, and locale parity.

- [ ] **Step 7: Commit**

```bash
git add src/course/catalog/examples.ts src/course/catalog/curriculum.ts src/course/catalog/speechPrompts.ts src/course/catalog/copy src/course/catalog/curriculum.test.ts
git commit -m "feat: author complete A0 A1 curriculum"
```

### Task 4: Assemble the complete catalogs into the runnable course

**Files:**
- Create: `src/course/catalog/assembleCourse.ts`
- Create: `src/course/catalog/assembleCourse.test.ts`
- Modify: `src/course/data/course.ts`
- Modify: `src/course/data/examples.ts`
- Modify: `src/course/i18n/types.ts`
- Modify: `src/course/i18n/it.ts`
- Modify: `src/course/i18n/en.ts`
- Modify: `src/course/routing/lessonRouteResolution.ts`
- Modify: `src/course/routing/lessonRouteResolution.test.ts`

- [ ] **Step 1: Write failing runtime assembly tests**

Assert that `courseModules` exposes 12 modules and 40 navigable lesson routes, module coverage metadata equals computed catalog coverage, every lesson renders the four stable route sections, every catalog example resolves, and every previous v2 lesson URL resolves through an explicit legacy alias when its ID is no longer published.

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `npm test -- src/course/catalog/assembleCourse.test.ts src/course/routing/lessonRouteResolution.test.ts`

Expected: FAIL because runtime assembly still exports the v2.1 course.

- [ ] **Step 3: Implement catalog-to-runtime assembly**

Build `CourseModule[]` from validated catalogs. Convert shared example segments into existing comparison and guided-construction section data, preserve `rule`, `comparison`, `explore`, and `recap` IDs, and set `coverage` from computed module values. Throw a deterministic startup/build error when validation fails; do not export partial content.

- [ ] **Step 4: Integrate bilingual copy**

Merge catalog curriculum copy into the existing IT/EN `CourseCopy` shape with identical key sets. Japanese stays in the shared catalog and must not be duplicated in locale files.

- [ ] **Step 5: Preserve published routes explicitly**

Add a typed legacy lesson alias map from each removed v2 lesson ID to the closest current lesson ID. Resolve aliases before declaring a valid module/lesson route invalid; keep progress migration orphan-safe.

- [ ] **Step 6: Run runtime tests**

Run: `npm test -- src/course/catalog/assembleCourse.test.ts src/course/routing src/course/components/CourseHome.test.ts src/course/components/ModuleCard.test.ts src/course/components/LessonPage.test.ts`

Expected: PASS with 12 modules and 40 reachable lessons.

- [ ] **Step 7: Commit**

```bash
git add src/course/catalog/assembleCourse.ts src/course/catalog/assembleCourse.test.ts src/course/data/course.ts src/course/data/examples.ts src/course/i18n src/course/routing
git commit -m "feat: publish complete A0 A1 course"
```

### Task 5: Verify and document Slice B

**Files:**
- Modify: `README.md`
- Modify: `tests/e2e/course-visuals.spec.ts`
- Modify: `tests/e2e/navigation.spec.ts`
- Modify: `tests/e2e/screenshots.spec.ts-snapshots/course-home-desktop-1440-darwin.png`
- Modify: `tests/e2e/screenshots.spec.ts-snapshots/course-home-mobile-390-darwin.png`

- [ ] **Step 1: Add failing end-to-end coverage**

Add desktop/mobile checks for all 12 module headings, 40 lesson links, compact content-sized cards, representative Module 1 katakana assistance, each capstone route, IT/EN parity, script settings, keyboard focus, route/scroll behavior, and the GitHub Pages base path.

- [ ] **Step 2: Run focused end-to-end tests**

Run: `npm run test:e2e -- tests/e2e/course-visuals.spec.ts tests/e2e/navigation.spec.ts`

Expected before final integration: FAIL on missing 12-module/40-lesson content; PASS after Tasks 1-4.

- [ ] **Step 3: Update current product documentation**

Document the complete 12-module/40-lesson course, 42 verbs, 270 contextual vocabulary items, hiragana-first/assisted-katakana policy, and three capstones. State explicitly that Slice C exercises/review and Slice D recognition are not yet available.

- [ ] **Step 4: Run the complete Slice B gate**

Run:

```bash
npm test
npm run build
GITHUB_PAGES=true npm run build
npm run test:e2e
git diff --check
```

Expected: all unit, build, Pages, end-to-end, and screenshot gates pass.

- [ ] **Step 5: Commit**

```bash
git add README.md tests/e2e
git commit -m "docs: record complete A0 A1 curriculum"
```
