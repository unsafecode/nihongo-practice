# A1 Foundations Area Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a distinct four-module, sixteen-lesson Foundations area before Presentations, growing A1 to sixteen modules and sixty-four complete lessons while preserving every existing route and progress record.

**Architecture:** Extend the immutable A1 manifest and curriculum catalogs with four new instructional modules, group A1 modules into accessible course-map areas, and keep the existing six-section lesson renderer. New lessons use the canonical semantic/lexicon/grammar/practice pipeline; strict production validators prove first-use sequencing, practice quality, localization, progress migration, and A2 isolation.

**Tech Stack:** React 18, TypeScript 5.6, Vitest 3, React Router 7, Vite 6, localStorage V4 progress, browser speech APIs, Playwright 1.61, GitHub Pages

---

## Execution protocol

Use the existing isolated worktree and branch. Implement each task with a fresh
subagent, red-green-refactor TDD, a spec review, a code-quality/pedagogy review,
fix-and-re-review loops, and a focused commit.

Every commit must include:

```text
Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>
Copilot-Session: 00ce510c-997d-4930-bef7-b054a4faa489
```

Do not depend on PR #3, change A2 editorial content, merge before all gates pass,
or deploy before the final live verification task.

## Task 1: Expand the manifest and add A1 area contracts

**Files:**
- Modify: `src/course/a1/types.ts`
- Modify: `src/course/a1/manifest.ts`
- Modify: `src/course/a1/authoring.ts`
- Create: `src/course/a1/areas.ts`
- Create: `src/course/a1/areas.test.ts`
- Modify: `src/course/data/types.ts`
- Modify: `src/course/data/runtimeShapeAssertion.ts`
- Modify: `src/course/data/runtimeShapeAssertion.test.ts`
- Modify: `src/course/a1/authoring.test.ts`

- [ ] **Step 1: Write failing manifest and area tests**

Assert the exact module order and counts:

```ts
expect(A1_MODULE_IDS).toEqual([
  "sounds",
  "sentence-foundations",
  "topic-questions",
  "polite-verbs",
  "time-movement",
  "introductions",
  "essential-questions",
  "actions",
  "routines",
  "past-negative",
  "places",
  "people",
  "descriptions",
  "shopping",
  "existence-needs",
  "capstones",
]);
expect(A1_LESSON_IDS).toHaveLength(64);
expect(A1_CANONICAL_POSITIONS["sentence-foundations-1"]).toBe(5);
expect(A1_CANONICAL_POSITIONS["introductions-1"]).toBe(21);
expect(A1_CANONICAL_POSITIONS["capstones-4"]).toBe(64);
```

Assert four areas with exhaustive, unique module membership:

```ts
expect(A1_AREAS.map((area) => area.id)).toEqual([
  "sounds",
  "foundations",
  "situations",
  "synthesis",
]);
expect(A1_AREAS.flatMap((area) => area.moduleIds)).toEqual(A1_MODULE_IDS);
```

Reject duplicate/missing area membership, wrong area order, non-four-lesson
modules, and capstones that are not final.

- [ ] **Step 2: Run red**

```bash
npm test -- src/course/a1/areas.test.ts src/course/a1/authoring.test.ts \
  src/course/data/runtimeShapeAssertion.test.ts
```

Expected: failures on the old 12-module/48-lesson shape and missing area types.

- [ ] **Step 3: Implement area and manifest contracts**

Add:

```ts
export type A1AreaId = "sounds" | "foundations" | "situations" | "synthesis";

export interface A1CourseArea {
  readonly id: A1AreaId;
  readonly moduleIds: readonly ModuleId[];
  readonly titleCopyId: string;
  readonly descriptionCopyId: string;
}
```

Create `A1_AREAS` as a deeply frozen catalog. Add optional
`areaId?: string` to `CourseModule`, populated for A1 only. Update structural
assertions to 16 modules / 64 lessons without weakening A2's 15×4 contract.

- [ ] **Step 4: Run green and commit**

```bash
npm test -- src/course/a1/areas.test.ts src/course/a1/authoring.test.ts \
  src/course/data/runtimeShapeAssertion.test.ts
npx tsc --noEmit
git diff --check
git add src/course/a1/types.ts src/course/a1/manifest.ts \
  src/course/a1/authoring.ts src/course/a1/authoring.test.ts \
  src/course/a1/areas.ts src/course/a1/areas.test.ts \
  src/course/data/types.ts src/course/data/runtimeShapeAssertion.ts \
  src/course/data/runtimeShapeAssertion.test.ts
git commit -m "feat: expand A1 to a 16-module area model" \
  -m "Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>" \
  -m "Copilot-Session: 00ce510c-997d-4930-bef7-b054a4faa489"
```

## Task 2: Add Foundations Can-dos, semantic values, lexicon, and notes

**Files:**
- Modify: `src/course/a1/catalog/a1SemanticCatalog.ts`
- Modify: `src/course/a1/catalog/a1CopyGloss.ts`
- Modify: `src/course/a1/catalog/canDos.ts`
- Modify: `src/course/a1/catalog/checkpoint.ts`
- Modify: `src/course/a1/curriculum/lexicon.ts`
- Modify: `src/course/a1/curriculum/lexicon.test.ts`
- Modify: `src/course/a1/curriculum/grammar.ts`
- Modify: `src/course/a1/curriculum/grammar.test.ts`
- Create: `src/course/a1/catalog/foundationsShared.ts`
- Create: `src/course/a1/catalog/foundationsShared.test.ts`

- [ ] **Step 1: Write failing catalog tests**

Require four new Can-dos:

```ts
expect(a1CanDosAuthored.map((item) => item.id)).toEqual(
  expect.arrayContaining([
    "a1-can-do-sentence-foundations",
    "a1-can-do-topic-questions",
    "a1-can-do-polite-verbs",
    "a1-can-do-time-movement",
  ]),
);
```

Require a complete pool of at least 64 first-use lexemes available to the new
lessons, with bilingual meanings and canonical semantic values. Tests must
prove every new value has one lexeme owner and every new verb has a correct
lemma, polite form, and class.

Require learning notes for every new lesson focus, including:

```text
sentence chunks and predicate-final order
subject omission and recoverable context
personal reference and limited あなた
は + です reinforcement
は versus が
か and core question words
dictionary lemma and verb classes
ます / ません
ました / ませんでした
を object
で action place versus に destination
time に
に versus へ and transport で
```

- [ ] **Step 2: Run red**

```bash
npm test -- src/course/a1/catalog/foundationsShared.test.ts \
  src/course/a1/curriculum/lexicon.test.ts \
  src/course/a1/curriculum/grammar.test.ts
```

Expected: missing Can-dos, values, lexemes, and notes.

- [ ] **Step 3: Author canonical shared content**

Add practical, high-frequency semantic values that do not rely on unnatural
filler. The pool must include identities, familiar objects, everyday places,
times, and verbs sufficient to distribute 4–6 unique words across all sixteen
lessons.

Use existing builders:

```ts
defineA1SemanticValue({
  id: "a1-value-name",
  kind: "object",
  tokenFragments: [frag("なまえ", "namae")],
});

defineA1Lexeme({
  id: "a1-lexeme-namae",
  valueIds: ["a1-value-name"],
  kana: "なまえ",
  romaji: "namae",
  category: "noun",
  meaning: { en: "name", it: "nome" },
});
```

Do not duplicate Japanese in lesson records. Add four localized Can-do
descriptors and checkpoint coverage. Keep all existing A2 and A1 Can-do IDs.

- [ ] **Step 4: Run green and commit**

```bash
npm test -- src/course/a1/catalog/foundationsShared.test.ts \
  src/course/a1/curriculum/lexicon.test.ts \
  src/course/a1/curriculum/grammar.test.ts
npx tsc --noEmit
git diff --check
git add src/course/a1/catalog/a1SemanticCatalog.ts \
  src/course/a1/catalog/a1CopyGloss.ts src/course/a1/catalog/canDos.ts \
  src/course/a1/catalog/checkpoint.ts \
  src/course/a1/catalog/foundationsShared.ts \
  src/course/a1/catalog/foundationsShared.test.ts \
  src/course/a1/curriculum/lexicon.ts \
  src/course/a1/curriculum/lexicon.test.ts \
  src/course/a1/curriculum/grammar.ts \
  src/course/a1/curriculum/grammar.test.ts
git commit -m "feat: add Foundations language and Can-dos" \
  -m "Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>" \
  -m "Copilot-Session: 00ce510c-997d-4930-bef7-b054a4faa489"
```

## Task 3: Author sentence and topic-question modules

**Files:**
- Create: `src/course/a1/catalog/moduleSentenceFoundations.ts`
- Create: `src/course/a1/catalog/moduleTopicQuestions.ts`
- Create: `src/course/a1/catalog/foundationsModules01to02.test.ts`
- Create: `src/course/a1/curriculum/foundationsArea01to02.ts`
- Create: `src/course/a1/curriculum/foundationsArea01to02.test.ts`
- Modify: `src/course/a1/catalog/recurrence.ts`

- [ ] **Step 1: Write failing eight-lesson tests**

Assert exact IDs, note progression, 4–6 unique first-use lexemes, same-lesson
worked examples, three-turn dialogues in lessons 4 and 8, five activity
functions, and no use of `を`, `で`, `に`, `へ`, `ました`, or `ませんでした`
before their later Foundations lessons.

```ts
expect(contents.map((item) => item.lessonId)).toEqual([
  "sentence-foundations-1",
  "sentence-foundations-2",
  "sentence-foundations-3",
  "sentence-foundations-4",
  "topic-questions-1",
  "topic-questions-2",
  "topic-questions-3",
  "topic-questions-4",
]);
```

- [ ] **Step 2: Run red**

```bash
npm test -- src/course/a1/catalog/foundationsModules01to02.test.ts \
  src/course/a1/curriculum/foundationsArea01to02.test.ts
```

- [ ] **Step 3: Author 16 models + transfers per module**

Each lesson keeps eight model variants and five transfer candidates for the
existing deterministic selector. Use only grammar taught at or before the
lesson. Add explicit/omitted subject contrasts and natural bilingual
translations.

`sentence-foundations-3` must state the limited use of `あなた`; it may teach the
word in explanation and controlled examples, but later dialogue should prefer
names, titles, or omission.

- [ ] **Step 4: Run green and commit**

```bash
npm test -- src/course/a1/catalog/foundationsModules01to02.test.ts \
  src/course/a1/curriculum/foundationsArea01to02.test.ts \
  src/course/a1/catalog/recurrence.test.ts
npx tsc --noEmit
git diff --check
git add src/course/a1/catalog/moduleSentenceFoundations.ts \
  src/course/a1/catalog/moduleTopicQuestions.ts \
  src/course/a1/catalog/foundationsModules01to02.test.ts \
  src/course/a1/catalog/recurrence.ts \
  src/course/a1/curriculum/foundationsArea01to02.ts \
  src/course/a1/curriculum/foundationsArea01to02.test.ts
git commit -m "feat: add sentence and question Foundations modules" \
  -m "Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>" \
  -m "Copilot-Session: 00ce510c-997d-4930-bef7-b054a4faa489"
```

## Task 4: Author polite-verb and time-movement modules

**Files:**
- Create: `src/course/a1/catalog/modulePoliteVerbs.ts`
- Create: `src/course/a1/catalog/moduleTimeMovement.ts`
- Create: `src/course/a1/catalog/foundationsModules03to04.test.ts`
- Create: `src/course/a1/curriculum/foundationsArea03to04.ts`
- Create: `src/course/a1/curriculum/foundationsArea03to04.test.ts`
- Modify: `src/course/a1/catalog/recurrence.ts`

- [ ] **Step 1: Write failing eight-lesson tests**

Pin the exact form and particle sequence:

```ts
expect(noteIds).toEqual([
  "a1-note-dictionary-masu-classes",
  "a1-note-particle-o",
  "a1-note-masu-masen",
  "a1-note-location-ni-de-contrast",
  "a1-note-time-ni",
  "a1-note-mashita",
  "a1-note-mashita-masen-deshita",
  "a1-note-particle-he-contrast",
]);
```

Tests realize every model and assert the target form/particle appears in worked
examples, no future form appears early, and all dialogue sentences are natural.

- [ ] **Step 2: Run red**

```bash
npm test -- src/course/a1/catalog/foundationsModules03to04.test.ts \
  src/course/a1/curriculum/foundationsArea03to04.test.ts
```

- [ ] **Step 3: Author the final eight new lessons**

Use existing form selections and realization rules. The final lesson's dialogue
must combine `に／へ`, transport `で`, and known polite past forms without
introducing a new grammar concept.

Add complete productive-verb introduction/recurrence records. Do not weaken
recurrence spacing to accommodate the new positions.

- [ ] **Step 4: Run green and commit**

```bash
npm test -- src/course/a1/catalog/foundationsModules03to04.test.ts \
  src/course/a1/curriculum/foundationsArea03to04.test.ts \
  src/course/a1/catalog/recurrence.test.ts
npx tsc --noEmit
git diff --check
git add src/course/a1/catalog/modulePoliteVerbs.ts \
  src/course/a1/catalog/moduleTimeMovement.ts \
  src/course/a1/catalog/foundationsModules03to04.test.ts \
  src/course/a1/catalog/recurrence.ts \
  src/course/a1/curriculum/foundationsArea03to04.ts \
  src/course/a1/curriculum/foundationsArea03to04.test.ts
git commit -m "feat: add verb tense and movement Foundations modules" \
  -m "Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>" \
  -m "Copilot-Session: 00ce510c-997d-4930-bef7-b054a4faa489"
```

## Task 5: Assemble 64 lessons and migrate existing first-use content

**Files:**
- Modify: `src/course/a1/catalog/catalog.ts`
- Modify: `src/course/a1/curriculum/catalog.ts`
- Modify: `src/course/a1/curriculum/modules01to04.ts`
- Modify: `src/course/a1/curriculum/modules01to04.test.ts`
- Modify: `src/course/a1/curriculum/modules05to08.ts`
- Modify: `src/course/a1/curriculum/modules05to08.test.ts`
- Modify: `src/course/a1/curriculum/modules09to12.ts`
- Modify: `src/course/a1/curriculum/modules09to12.test.ts`
- Modify: `src/course/a1/catalog/module02Introductions.ts`
- Modify: `src/course/a1/catalog/module03Questions.ts`
- Modify: `src/course/a1/catalog/module04Actions.ts`
- Modify: `src/course/a1/catalog/module05Routines.ts`
- Modify: `src/course/a1/catalog/module06TensePolarity.ts`
- Modify: `src/course/a1/catalog/module07Places.ts`
- Modify: `src/course/a1/catalog/module08People.ts`
- Modify: `src/course/a1/catalog/module09Descriptions.ts`
- Modify: `src/course/a1/catalog/module10Shopping.ts`
- Modify: `src/course/a1/catalog/module11ExistenceNeeds.ts`
- Modify: `src/course/a1/catalog/module12Capstones.ts`
- Modify: `src/course/a1/catalog/a1LessonBuilders.characterization.test.ts`
- Modify: `src/course/a1/catalog/__snapshots__/a1LessonBuilders.characterization.test.ts.snap`

- [ ] **Step 1: Write the global failing 64-lesson invariant**

```ts
expect(a1LessonContents.map((item) => item.lessonId)).toEqual(A1_LESSON_IDS);
expect(a1LessonContents).toHaveLength(64);
```

Walk all 64 lessons in canonical order and assert every non-capstone introduces
4–6 lexemes exactly once, every declared word appears in its own models, and
all model/example/dialogue/practice/spoken lexical and grammar content is
available.

- [ ] **Step 2: Run red**

```bash
npm test -- src/course/a1/curriculum/a1CurriculumInvariants.test.ts \
  src/course/a1/curriculum/modules01to04.test.ts \
  src/course/a1/curriculum/modules05to08.test.ts \
  src/course/a1/curriculum/modules09to12.test.ts
```

- [ ] **Step 3: Reallocate existing first-use declarations**

Move core words into Foundations and replace later declarations with new,
scenario-appropriate words genuinely used by those later models. Restore
learner-facing Presentations content as applied scenario practice.

Do not weaken introduce-once, future-use, grammar-first-teach, or naturalness
checks. Update snapshots only for intentional realized-content changes.

- [ ] **Step 4: Assemble and run the A1 release gate**

```bash
npm test -- src/course/a1
npx vite-node scripts/validateA1Release.ts
npx tsc --noEmit
git diff --check
```

Expected: 16 modules, 64 lessons, 60 semantic curriculum report rows with no
errors.

- [ ] **Step 5: Commit**

```bash
git add src/course/a1/catalog src/course/a1/curriculum
git commit -m "feat: assemble the 64-lesson A1 course" \
  -m "Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>" \
  -m "Copilot-Session: 00ce510c-997d-4930-bef7-b054a4faa489"
```

## Task 6: Render the Foundations area and migrate progress to V3

**Files:**
- Modify: `src/course/data/course.ts`
- Modify: `src/course/components/courseMapModel.ts`
- Modify: `src/course/components/courseMapModel.test.ts`
- Modify: `src/course/components/CourseMap.tsx`
- Modify: `src/course/components/CourseMap.test.ts`
- Modify: `src/course/components/CourseHome.tsx`
- Modify: `src/course/components/CourseHome.test.ts`
- Modify: `src/course/components/ModuleCard.tsx`
- Modify: `src/course/course.css`
- Modify: `src/course/course.css.test.ts`
- Modify: `src/course/a1/runtimeCopy.ts`
- Modify: `src/course/a1/runtimeCopy.test.ts`
- Modify: `src/course/i18n/types.ts`
- Modify: `src/course/i18n/en.ts`
- Modify: `src/course/i18n/it.ts`
- Modify: `src/course/i18n/validate.test.ts`
- Modify: `src/course/progress/progress.ts`
- Modify: `src/course/progress/progress.v4.test.ts`
- Modify: `src/course/progress/ProgressContext.tsx`
- Modify: `src/course/progress/progress.store.test.ts`

- [ ] **Step 1: Write failing area-render tests**

Assert four labelled A1 area regions in order, with Foundations containing
exactly four modules and sixteen lesson links. A2 remains behaviorally
unchanged.

- [ ] **Step 2: Write failing V2→V3 progress tests**

Seed a realistic `a1-a2-v2` record and assert migration to `a1-a2-v3` preserves:

```text
all lesson evidence
attempted/accepted exercise IDs
Can-do evidence
checkpoint attempts
last visited lesson
review queue and orphans
A2 evidence
migration notice
updatedAt
```

The sixteen new lesson IDs must remain absent/unvisited. Migration is pure and
idempotent.

- [ ] **Step 3: Implement grouping, copy, and migration**

Render each A1 area as:

```tsx
<section className="course-area" aria-labelledby={`course-area-${area.id}`}>
  <h3 id={`course-area-${area.id}`}>{copy.courseAreas[area.id].title}</h3>
  <p>{copy.courseAreas[area.id].description}</p>
  <div className="course-area__modules">
    {area.modules.map((entry) => (
      <ModuleCard key={entry.module.id} entry={entry} />
    ))}
  </div>
</section>
```

Restore `introductions` to Presentations/Introductions. Add all new module and
lesson titles/outcomes in IT/EN. Advance progress catalog version to
`a1-a2-v3`; keep schema V4.

- [ ] **Step 4: Run green and commit**

```bash
npm test -- src/course/components/CourseMap.test.ts \
  src/course/components/CourseHome.test.ts \
  src/course/a1/runtimeCopy.test.ts src/course/i18n/validate.test.ts \
  src/course/progress/progress.v4.test.ts \
  src/course/progress/progress.store.test.ts
npx tsc --noEmit
git diff --check
git add src/course/data/course.ts src/course/components \
  src/course/course.css src/course/a1/runtimeCopy.ts \
  src/course/a1/runtimeCopy.test.ts src/course/i18n \
  src/course/progress
git commit -m "feat: expose the 16-lesson Foundations area" \
  -m "Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>" \
  -m "Copilot-Session: 00ce510c-997d-4930-bef7-b054a4faa489"
```

## Task 7: Expand validators, reports, and exhaustive unit coverage

**Files:**
- Modify: `src/course/a1/catalog/validateA1.ts`
- Modify: `src/course/a1/catalog/validateA1.test.ts`
- Modify: `src/course/a1/catalog/reports.ts`
- Modify: `src/course/a1/catalog/reports.test.ts`
- Modify: `src/course/a1/curriculum/validateA1Curriculum.ts`
- Modify: `src/course/a1/curriculum/validateA1Curriculum.test.ts`
- Modify: `src/course/a1/curriculum/a1CurriculumInvariants.test.ts`
- Modify: `src/course/a1/curriculum/reports.ts`
- Modify: `src/course/a1/curriculum/reports.test.ts`
- Modify: `scripts/validateA1Release.ts`
- Modify: `scripts/validateA1Release.test.ts`
- Modify all tests that truthfully encode the old 12/48 shape

- [ ] **Step 1: Update exact structural failures**

The gate must require 16 modules, 64 routes, 64 content records, four complete
areas, and 60 semantic lessons. Add area-specific codes:

```ts
"area-count"
"area-module-membership"
"area-order"
"area-copy-parity"
```

- [ ] **Step 2: Prove all production content**

Run the existing 22 curriculum failure fixtures plus area fixtures. Reports must
contain 64 ordered lesson rows and real five-activity distributions.

Add a loop that builds every curriculum and practice view model in both locales:

```ts
for (const lessonId of A1_LESSON_IDS) {
  expect(buildA1CurriculumViewModel(lessonId, "en").ok).toBe(true);
  expect(buildA1CurriculumViewModel(lessonId, "it").ok).toBe(true);
  expect(buildA1PracticeModel(lessonId).ok).toBe(true);
}
```

- [ ] **Step 3: Run full unit/build gates and commit**

```bash
npm test
npx tsc --noEmit
npm run build
npm run check:bundle
git diff --check
git add src/course/a1 scripts
git commit -m "test: gate the complete A1 Foundations area" \
  -m "Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>" \
  -m "Copilot-Session: 00ce510c-997d-4930-bef7-b054a4faa489"
```

## Task 8: Add full browser/visual coverage, review, PR, and deploy

**Files:**
- Modify: `tests/e2e/a1-foundations-curriculum.spec.ts`
- Modify: `tests/e2e/a1-depth.spec.ts`
- Modify: `tests/e2e/course-visuals.spec.ts`
- Modify: `tests/e2e/zoom-a11y.spec.ts`
- Modify: `tests/e2e/navigation.spec.ts`
- Modify: `tests/e2e/a2-level.spec.ts`
- Modify: `tests/e2e/foundation-ux.spec.ts`
- Modify: `tests/e2e/screenshots.spec.ts`
- Modify: `tests/e2e/speech.spec.ts`
- Add/update Playwright PNG snapshots for Course Map,
  `sentence-foundations-1`, and `time-movement-4`

- [ ] **Step 1: Expand exhaustive route coverage**

Run all 64 A1 routes on desktop and representative Foundations lessons on both
viewports/locales/scripts. Assert six sections, 4–6 vocabulary items, grammar,
examples/audio, four exercises plus speaking, recap, no warnings, and no
external requests.

- [ ] **Step 2: Add area/navigation/progress E2E**

Assert the Course Map visibly groups sixteen Foundations lessons before
Presentations, fresh learners start correctly, V2 localStorage migrates to V3
without evidence loss, existing deep links still work, and keyboard/touch/focus
behavior remains intact.

- [ ] **Step 3: Add zoom and visual baselines**

Run real 200%/pinch/320 px checks for Course Map and representative new lessons.
Generate:

```bash
npm run test:e2e:update -- tests/e2e/course-visuals.spec.ts \
  --project=desktop-1440
```

Open all three new PNGs with an image-capable tool. Reject clipping, overlap,
ambiguous area hierarchy, poor wrapping, or an area distinguishable only by
color.

- [ ] **Step 4: Run exact final gates**

```bash
npm test
npx tsc --noEmit
npm run build
npm run check:bundle
npm run test:e2e
git diff --check master...HEAD
```

- [ ] **Step 5: Fresh whole-range reviews**

Review `master...HEAD` for spec compliance, Japanese pedagogy/naturalness,
first-use closure, accessibility, IT/EN and script parity, progress migration,
review/answer leakage, A2 isolation, and code quality. Fix every finding with a
regression test and re-review until both reviewers approve.

- [ ] **Step 6: Commit, push, PR, merge, and deploy**

```bash
git add tests/e2e src/course/course.css
git commit -m "test: cover the expanded A1 Foundations area" \
  -m "Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>" \
  -m "Copilot-Session: 00ce510c-997d-4930-bef7-b054a4faa489"
git push origin unsafecode-rebuild-a1-foundations
```

Open a new PR against `master`. Merge only after all checks and reviews pass,
dispatch `deploy-pages.yml` from `master`, watch it succeed, then browser-verify
the live Course Map, `sentence-foundations-1`, and `time-movement-4`.
