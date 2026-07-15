# A0→A1 Curriculum Slice A Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver Slice A of the approved A0→A1 release: visible course-map row repair, generic-persona privacy migration, typed curriculum/catalog foundations, and safe progress schema v3 migration.

**Architecture:** Preserve the current runnable eight-module course while adding release foundations as focused pure modules. Runtime examples reference a centralized persona catalog; curriculum foundations define and validate the approved 12-module manifest without pretending Slice B content exists yet. Progress moves to v3 through pure migrations and a typed storage boundary, while existing course-map consumers receive a compatibility projection of visited state.

**Tech Stack:** React 18, TypeScript 5.6, Vite 6, Vitest 3, React Router 7, CSS, browser `localStorage`

---

### Task 1: Centralize generic personas and block runtime aliases

**Files:**
- Create: `src/course/data/personas.ts`
- Create: `src/course/data/personas.test.ts`
- Modify: `src/course/data/examples.ts`
- Modify: `src/course/i18n/it.ts`
- Modify: `src/course/i18n/en.ts`

- [ ] **Step 1: Write failing persona and alias tests**

```ts
import { describe, expect, it } from "vitest";
import { examples } from "./examples";
import { genericPersonas, validateRuntimeAliases } from "./personas";
import { it as itCopy } from "../i18n/it";
import { en as enCopy } from "../i18n/en";

describe("generic personas", () => {
  it("provides stable Yuki, Ken, and Mina identities", () => {
    expect(genericPersonas.map(({ id }) => id)).toEqual(["yuki", "ken", "mina"]);
  });

  it("rejects normalized legacy aliases", () => {
    expect(validateRuntimeAliases(["Ric" + "chi", "り" + "っち"])).toHaveLength(2);
  });

  it("finds no legacy alias in assembled runtime content", () => {
    expect(validateRuntimeAliases([examples, itCopy, enCopy])).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/course/data/personas.test.ts`

Expected: FAIL because `./personas` does not exist.

- [ ] **Step 3: Implement the persona catalog and validator**

```ts
export type PersonaId = "yuki" | "ken" | "mina";

export interface Persona {
  readonly id: PersonaId;
  readonly japaneseName: string;
  readonly latinName: string;
}

export const genericPersonas: readonly Persona[] = [
  { id: "yuki", japaneseName: "ゆき", latinName: "Yuki" },
  { id: "ken", japaneseName: "けん", latinName: "Ken" },
  { id: "mina", japaneseName: "みな", latinName: "Mina" },
];

export const personasById = Object.fromEntries(
  genericPersonas.map((persona) => [persona.id, persona]),
) as Readonly<Record<PersonaId, Persona>>;

export function validateRuntimeAliases(input: unknown): string[] {
  const serialized = JSON.stringify(input).normalize("NFKC");
  const latinAlias = ["ric", "chi"].join("");
  const kanaAlias = ["り", "っち"].join("");
  const errors: string[] = [];
  if (serialized.toLocaleLowerCase("en").includes(latinAlias)) errors.push("forbidden-latin-alias");
  if (serialized.includes(kanaAlias)) errors.push("forbidden-kana-alias");
  return errors;
}
```

Replace the two example segments with `personasById.yuki` values and update IT/EN copy to Yuki/ゆき. No render-time replacement is permitted.

- [ ] **Step 4: Run focused tests**

Run: `npm test -- src/course/data/personas.test.ts src/course/i18n/validate.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/course/data/personas.ts src/course/data/personas.test.ts src/course/data/examples.ts src/course/i18n/it.ts src/course/i18n/en.ts
git commit -m "feat: centralize generic course personas"
```

### Task 2: Define the approved 12-module curriculum foundation

**Files:**
- Create: `src/course/curriculum/foundation.ts`
- Create: `src/course/curriculum/foundation.test.ts`
- Create: `src/course/curriculum/types.ts`
- Create: `src/course/curriculum/validateFoundation.ts`
- Create: `src/course/curriculum/validateFoundation.test.ts`

- [ ] **Step 1: Write failing manifest tests**

```ts
import { describe, expect, it } from "vitest";
import { curriculumFoundation } from "./foundation";
import { validateCurriculumFoundation } from "./validateFoundation";

describe("A0→A1 curriculum foundation", () => {
  it("declares 12 modules across the four stable phases", () => {
    expect(curriculumFoundation.modules).toHaveLength(12);
    expect(new Set(curriculumFoundation.modules.map(({ phase }) => phase))).toEqual(
      new Set(["orient", "build", "navigate", "synthesize"]),
    );
  });

  it("matches the approved coverage budget", () => {
    expect(validateCurriculumFoundation(curriculumFoundation)).toEqual({
      valid: true,
      errors: [],
      totals: { lessons: 40, introducedVerbs: 42, vocabulary: 270 },
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/course/curriculum/foundation.test.ts`

Expected: FAIL because the curriculum foundation files do not exist.

- [ ] **Step 3: Define focused types**

```ts
import type { PhaseId } from "../data/types";

export interface ModuleCoverageBudget {
  readonly lessons: number;
  readonly introducedVerbs: number;
  readonly vocabulary: number;
}

export interface CurriculumModuleFoundation {
  readonly id: string;
  readonly order: number;
  readonly phase: PhaseId;
  readonly prerequisiteIds: readonly string[];
  readonly coverage: ModuleCoverageBudget;
}

export interface CurriculumFoundation {
  readonly version: "a0-a1-v1";
  readonly modules: readonly CurriculumModuleFoundation[];
}
```

- [ ] **Step 4: Add the 12-module manifest**

Use stable IDs in this order:

```ts
[
  ["sounds", "orient", 5, 0, 20],
  ["introductions", "orient", 3, 4, 25],
  ["essential-questions", "orient", 3, 2, 20],
  ["actions", "build", 3, 8, 25],
  ["routines", "build", 3, 6, 25],
  ["past-negative", "build", 3, 3, 20],
  ["places", "navigate", 4, 7, 25],
  ["people", "navigate", 3, 3, 25],
  ["descriptions", "navigate", 3, 3, 25],
  ["shopping", "navigate", 3, 3, 30],
  ["existence-needs", "navigate", 3, 3, 30],
  ["capstones", "synthesize", 4, 0, 0],
]
```

Each module after the first references the immediately preceding module as its prerequisite. This foundation is release planning/validation data; the current course remains the rendered content until Slice B replaces it with complete lessons.

- [ ] **Step 5: Implement pure foundation validation**

Validation returns structured errors for duplicate IDs/orders, unknown/later prerequisites, cycles, invalid positive lesson counts, negative coverage, wrong module count, wrong phase order, and totals other than 40/42/270.

- [ ] **Step 6: Run focused tests**

Run: `npm test -- src/course/curriculum/foundation.test.ts src/course/curriculum/validateFoundation.test.ts`

Expected: PASS, including one focused failure case per error code.

- [ ] **Step 7: Commit**

```bash
git add src/course/curriculum
git commit -m "feat: define A0-A1 curriculum foundation"
```

### Task 3: Add typed shared catalog boundaries

**Files:**
- Create: `src/course/catalog/types.ts`
- Create: `src/course/catalog/validate.ts`
- Create: `src/course/catalog/validate.test.ts`

- [ ] **Step 1: Write failing catalog-boundary tests**

```ts
import { describe, expect, it } from "vitest";
import { validateCatalogReferences } from "./validate";

describe("catalog boundaries", () => {
  it("reports a missing lexeme reference without dropping it", () => {
    expect(validateCatalogReferences({
      conceptIds: ["topic-wa"],
      lexemeIds: [],
      exampleLexemeIds: ["water"],
      personaIds: ["yuki"],
    })).toContainEqual({
      code: "missing-lexeme-reference",
      id: "water",
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/course/catalog/validate.test.ts`

Expected: FAIL because the catalog validator does not exist.

- [ ] **Step 3: Define stable catalog interfaces**

Define branded string aliases for `ConceptId`, `LexemeId`, `ExampleId`,
`ExerciseDefinitionId`, and `SpeechPromptId`; define minimal read-only interfaces
for concept, lexicon, example, curriculum, exercise, speech prompt, and persona
catalogs. These types hold IDs and references only; they do not add placeholder
runtime content.

- [ ] **Step 4: Implement structured reference validation**

`validateCatalogReferences` compares declared ID sets with referenced IDs and
returns all missing-reference and duplicate-ID errors in deterministic
code-then-ID order. It never mutates or filters input.

- [ ] **Step 5: Run focused tests**

Run: `npm test -- src/course/catalog/validate.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/course/catalog
git commit -m "feat: add typed course catalog boundaries"
```

### Task 4: Migrate progress from v1/v2 to v3 safely

**Files:**
- Modify: `src/course/progress/progress.ts`
- Modify: `src/course/progress/progress.test.ts`
- Modify: `src/course/progress/ProgressContext.tsx`

- [ ] **Step 1: Replace v2 expectations with failing v3 migration tests**

Add tests proving:

```ts
expect(parseProgress(JSON.stringify({
  schemaVersion: 2,
  visitedLessonIds: ["sounds-core", "removed-id"],
  lastVisitedLessonId: "sounds-core",
  updatedAt: "2026-07-13T10:00:00.000Z",
}), new Set(["sounds-core"]))).toEqual({
  progress: {
    schemaVersion: 3,
    catalogVersion: "a0-a1-v1",
    lessons: {
      "sounds-core": {
        visitedAt: "2026-07-13T10:00:00.000Z",
        practicedAt: null,
        consolidatedAt: null,
        attemptedExerciseIds: [],
        acceptedExerciseIds: [],
      },
    },
    lastVisitedLessonId: "sounds-core",
    reviewQueue: [],
    orphanedLessonIds: ["removed-id"],
    orphanedReviewKeys: [],
    updatedAt: "2026-07-13T10:00:00.000Z",
  },
  corrupted: false,
  migrated: true,
});
```

Also test v1 direct migration, valid v3 pass-through, repeated no-op visit
reference equality, corrupt/future payloads, and failed storage write behavior.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/course/progress/progress.test.ts`

Expected: FAIL because progress still returns schema v2.

- [ ] **Step 3: Implement v3 types and pure migration**

Add `LessonProgressV3`, `CourseProgressV3`, `ProgressParseResult`,
`migrateV2ToV3`, and update `parseProgress(raw, knownLessonIds)` to parse v1,
v2, and v3. Preserve unknown visited IDs in `orphanedLessonIds`; never invent
practice or consolidation evidence.

- [ ] **Step 4: Preserve current course-map compatibility**

Export:

```ts
export function visitedLessonIds(progress: CourseProgressV3): string[] {
  return Object.entries(progress.lessons)
    .filter(([, state]) => state.visitedAt !== null)
    .map(([lessonId]) => lessonId);
}
```

Update `ProgressContextValue` to expose `CourseProgressV3`. `CourseHome` and map
model callers consume `visitedLessonIds(progress)` rather than a removed v2
property.

- [ ] **Step 5: Add explicit storage results**

`loadProgress`, `persistProgress`, and `resetStoredProgress` return typed status
objects distinguishing loaded/migrated/corrupt/unavailable and
saved/quota-or-access-failed. The provider keeps in-memory state on failure and
sets `persistenceAvailable` false.

- [ ] **Step 6: Run focused tests**

Run: `npm test -- src/course/progress/progress.test.ts src/course/components/CourseHome.test.ts src/course/components/courseMapModel.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/course/progress src/course/components/CourseHome.tsx src/course/components/CourseHome.test.ts
git commit -m "feat: migrate course progress to schema v3"
```

### Task 5: Repair expanded lesson rows and add computed coverage metadata

**Files:**
- Modify: `src/course/course.css`
- Modify: `src/course/course.css.test.ts`
- Modify: `src/course/components/ModuleCard.tsx`
- Modify: `src/course/components/ModuleCard.test.ts`
- Modify: `src/course/i18n/types.ts`
- Modify: `src/course/i18n/it.ts`
- Modify: `src/course/i18n/en.ts`

- [ ] **Step 1: Write failing resting-row CSS tests**

```ts
it("gives resting lesson rows a visible border and background", () => {
  const rule = findRule(readCourseCss(), ".module-card__lesson-link");
  expect(rule).toMatch(/border:\s*1px solid var\(--course-line\)/);
  expect(rule).toMatch(/background:\s*var\(--course-surface\)/);
});

it("does not reserve a fixed or minimum module-card height", () => {
  const rule = findRule(readCourseCss(), ".module-card");
  expect(rule).not.toMatch(/min-height|height:/);
});
```

- [ ] **Step 2: Write failing metadata render test**

Add `courseMap.coverageMetadata(lessons, verbs, words)` to `CourseCopy` and
assert `ModuleCard` renders one metadata span with the exact localized middle-dot
order. Until Slice B supplies computed lexical catalogs, current modules use
explicit zero verb/word counts and their real lesson count; the UI never invents
coverage.

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test -- src/course/course.css.test.ts src/course/components/ModuleCard.test.ts`

Expected: FAIL because resting rows are transparent and metadata copy is absent.

- [ ] **Step 4: Implement bounded nested rows**

Change the resting rule to:

```css
.module-card__lesson-link {
  min-height: var(--action-target-min);
  border: 1px solid var(--course-line);
  border-radius: 0.65rem;
  background: var(--course-surface);
}
```

Hover uses a stronger surface/border, focus-visible retains the three-pixel
outline, and current state retains border plus text weight. Keep content-sized
cards and mobile stacking.

- [ ] **Step 5: Add truthful coverage metadata**

Extend `CourseModule` with:

```ts
readonly coverage: {
  readonly practicedVerbCount: number;
  readonly vocabularyCount: number;
};
```

Current course modules receive `{ practicedVerbCount: 0, vocabularyCount: 0 }`
until Slice B wires computed catalogs. `ModuleCard` renders
`coverageMetadata(courseModule.lessons.length, ..., ...)`; IT and EN use
localized labels and ` · ` separators.

- [ ] **Step 6: Run focused tests**

Run: `npm test -- src/course/course.css.test.ts src/course/components/ModuleCard.test.ts src/course/i18n/validate.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/course/course.css src/course/course.css.test.ts src/course/components/ModuleCard.tsx src/course/components/ModuleCard.test.ts src/course/data/types.ts src/course/data/course.ts src/course/data/validate.test.ts src/course/i18n
git commit -m "fix: style expanded course lesson rows"
```

### Task 6: Verify Slice A and update public documentation

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update README privacy/progress wording**

Document generic personas, progress schema v3's visited/practiced/consolidated
semantics, and that no audio or transcript is stored. Do not claim the complete
40-lesson course or recognition UI exists before Slices B-D.

- [ ] **Step 2: Run complete unit suite**

Run: `npm test`

Expected: all Vitest tests pass.

- [ ] **Step 3: Run production builds**

Run: `npm run build && GITHUB_PAGES=true npm run build`

Expected: both TypeScript/Vite builds exit 0.

- [ ] **Step 4: Run existing Playwright suite**

Run: `npm run test:e2e`

Expected: all existing desktop/mobile/navigation/visual checks pass.

- [ ] **Step 5: Verify alias and file scope**

Run:

```bash
! rg -i 'Ricchi|りっち' src tests README.md
git diff --check
git status --short
```

Expected: alias scan returns no matches; diff check exits 0; status lists only
intentional Slice A files.

- [ ] **Step 6: Commit**

```bash
git add README.md
git commit -m "docs: describe curriculum foundation privacy"
```

- [ ] **Step 7: Record Slice A gate**

Run:

```bash
git --no-pager log --oneline 03750d6..HEAD
git --no-pager status --short
```

Expected: design, plan, and Slice A commits are present; worktree is clean.
