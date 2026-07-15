# A0→A1 Exercise and Review Slice C Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 3-5 deterministic exercises to every lesson, evidence-based practiced/consolidated progress, and the lightweight `Da ripassare` review queue.

**Architecture:** Typed exercise definitions reference the shared concept, lexicon, and example catalogs; a pure engine generates prompts and evaluates normalized answers without locale-specific answer duplication. Progress mutations and review-queue operations remain pure v3 functions, while React components render engine state and persist only explicit evidence.

**Tech Stack:** React 18, TypeScript 5.6, Vitest 3, React Router 7, browser localStorage, Playwright

---

### Task 1: Implement the deterministic exercise engine

**Files:**
- Create: `src/course/exercises/types.ts`
- Create: `src/course/exercises/normalizeAnswer.ts`
- Create: `src/course/exercises/engine.ts`
- Create: `src/course/exercises/engine.test.ts`
- Modify: `src/course/catalog/types.ts`
- Modify: `src/course/catalog/validateCurriculum.ts`
- Modify: `src/course/catalog/validateCurriculum.test.ts`

- [ ] **Step 1: Write failing engine tests**

Test all five discriminated exercise types and malformed definitions:

```ts
type ExerciseKind =
  | "tile-ordering"
  | "choice"
  | "transformation"
  | "completion"
  | "constrained-construction";

expect(generateExercise(definition, catalogs)).toEqual(expectedPrompt);
expect(evaluateExercise(prompt, candidate)).toEqual({ status: "accepted" });
expect(evaluateExercise(prompt, wrong)).toEqual({ status: "retry" });
```

Cover kana normalization, Unicode NFKC, whitespace/punctuation normalization,
katakana-to-hiragana answer equivalence only where explicitly permitted,
explicit accepted variants, duplicate segments, missing references,
impossible choices, and deterministic output from the same definition.

- [ ] **Step 2: Run tests and confirm red**

Run: `npm test -- src/course/exercises/engine.test.ts`

Expected: FAIL because the engine files do not exist.

- [ ] **Step 3: Define typed prompts and pure generation**

Definitions store semantic/example references, prompt intent copy IDs, and
explicit variant references; they do not store duplicated canonical Japanese
answer strings. `generateExercise` resolves references or returns a structured
`ExerciseGenerationError`. No random ordering is allowed unless a stable seed is
part of the definition.

- [ ] **Step 4: Implement evaluation and normalization**

Evaluate tile sequence, selected option, transformed example, completion
segments, and constrained construction against canonical shared example data.
Return `accepted`, `retry`, or `invalid-input`; never silently accept an
unresolved target.

- [ ] **Step 5: Extend curriculum validation**

Reject missing exercise references, copied canonical answer strings, implicit
variants, assessment before introduction, duplicate IDs, impossible choices,
and lessons outside 3-5 exercises.

- [ ] **Step 6: Run focused tests and commit**

Run:

```bash
npm test -- src/course/exercises src/course/catalog/validateCurriculum.test.ts
npm run build
```

Commit: `feat: add deterministic exercise engine`

### Task 2: Author 3-5 shared exercises for every lesson

**Files:**
- Create: `src/course/catalog/exercises.ts`
- Create: `src/course/catalog/exercises.test.ts`
- Modify: `src/course/catalog/curriculum.ts`
- Modify: `src/course/catalog/copy/it.ts`
- Modify: `src/course/catalog/copy/en.ts`

- [ ] **Step 1: Write failing complete-course exercise tests**

Assert every one of 40 lessons references 3-5 definitions, every lesson has at
least one transformation or constrained-construction exercise, all five kinds
occur across the course, IT/EN intent keys have exact parity, every answer is
derivable from shared examples, and no exercise target is assessed before its
concepts/lexemes are introduced.

- [ ] **Step 2: Run tests and confirm red**

Run: `npm test -- src/course/catalog/exercises.test.ts`

Expected: FAIL because the catalog does not exist and lessons have no exercises.

- [ ] **Step 3: Author the definitions**

Add 120-200 bounded definitions distributed 3-5 per lesson. Use the lesson's
existing comparison, guided, and recap examples as targets. Variants must name
shared example IDs or segment-order variants explicitly; no answer literals.
Capstone exercises recombine earlier concepts and lexemes only.

- [ ] **Step 4: Author bilingual prompt intent**

Add IT/EN instruction and intent strings keyed by exercise copy ID. Both locale
catalogs must have identical keys and exercise semantics.

- [ ] **Step 5: Run acceptance tests and commit**

Run:

```bash
npm test -- src/course/catalog/exercises.test.ts src/course/catalog/curriculum.test.ts src/course/exercises
npm test
npm run build
```

Commit: `feat: author complete course exercises`

### Task 3: Implement review queue and evidence-based progress transitions

**Files:**
- Create: `src/course/progress/reviewQueue.ts`
- Create: `src/course/progress/reviewQueue.test.ts`
- Modify: `src/course/progress/progress.ts`
- Modify: `src/course/progress/progress.v3.test.ts`
- Modify: `src/course/progress/ProgressContext.tsx`

- [ ] **Step 1: Write failing progress/review tests**

Prove deterministic queue upsert, mistake-count increment, stable ordering,
resolution, reopening, orphan handling, and no duplicate review keys. Prove
visited → practiced only after exercise attempts and practiced → consolidated
only after the lesson's acceptance threshold, without timestamp churn.

```ts
const attempted = recordExerciseAttempt(progress, evidence);
expect(attempted.lessons[id].practicedAt).not.toBeNull();
const consolidated = recordExerciseAcceptance(attempted, evidence, lessonGate);
expect(consolidated.lessons[id].consolidatedAt).not.toBeNull();
```

- [ ] **Step 2: Run tests and confirm red**

Run: `npm test -- src/course/progress/reviewQueue.test.ts src/course/progress/progress.v3.test.ts`

Expected: FAIL because queue/evidence functions do not exist.

- [ ] **Step 3: Implement pure queue operations**

Use stable `lessonId:exerciseDefinitionId` review keys. Wrong attempts upsert and
increment; later acceptance resolves the entry; another mistake reopens it.
Unknown lesson/exercise references move to orphan arrays during catalog
reconciliation.

- [ ] **Step 4: Implement progress evidence mutations**

Record attempted/accepted exercise IDs idempotently. `practicedAt` is set on the
first valid attempt. `consolidatedAt` is set only when all required lesson
exercise IDs meet the authored gate; visits and migrations never invent either.

- [ ] **Step 5: Integrate persistence and commit**

`ProgressContext` exposes typed `recordAttempt` and `resolveReview` actions. A
failed storage write leaves the current in-memory state visible and reports the
existing persistence warning.

Run:

```bash
npm test -- src/course/progress
npm test
npm run build
```

Commit: `feat: add review queue progress evidence`

### Task 4: Integrate exercise and review UI and verify Slice C

**Files:**
- Create: `src/course/components/LessonExercises.tsx`
- Create: `src/course/components/LessonExercises.test.ts`
- Create: `src/course/components/ReviewQueue.tsx`
- Create: `src/course/components/ReviewQueue.test.ts`
- Modify: `src/course/components/LessonPage.tsx`
- Modify: `src/course/components/PracticeHome.tsx`
- Modify: `src/course/course.css`
- Modify: `src/course/i18n/types.ts`
- Modify: `src/course/i18n/it.ts`
- Modify: `src/course/i18n/en.ts`
- Modify: `README.md`
- Modify: `tests/e2e/course-visuals.spec.ts`
- Modify: `tests/e2e/navigation.spec.ts`

- [ ] **Step 1: Write failing component and E2E tests**

Test all five controls, keyboard/touch parity, retry/accepted live regions,
explicit answer feedback, 44px targets, no color-only state, lesson progression,
review queue empty/nonempty/resolved states, locale parity, romaji-off usability,
and completion without speech.

- [ ] **Step 2: Run tests and confirm red**

Run:

```bash
npm test -- src/course/components/LessonExercises.test.ts src/course/components/ReviewQueue.test.ts
npm run test:e2e -- tests/e2e/course-visuals.spec.ts tests/e2e/navigation.spec.ts
```

- [ ] **Step 3: Implement lesson exercises**

Render exercises inside the existing `explore` section. Use semantic buttons,
radio groups, text inputs, labels, and `aria-live` feedback. Generate/evaluate
through the pure engine; never reconstruct canonical answers in components.

- [ ] **Step 4: Implement `Da ripassare`**

Show queue count and ordered entries on Practice Home. Each entry links back to
its lesson/exercise. Empty, unavailable-storage, and orphan states have explicit
localized copy and never block other practice tools.

- [ ] **Step 5: Update documentation and run the Slice C gate**

README must describe deterministic exercises and lightweight review accurately,
while still stating speech recognition is unavailable until Slice D.

Run:

```bash
npm test
npm run build
GITHUB_PAGES=true npm run build
npm run test:e2e
git diff --check
```

- [ ] **Step 6: Commit**

Commit: `feat: integrate course exercises and review`
