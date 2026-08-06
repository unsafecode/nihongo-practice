# Base Level Curriculum Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a learner-facing Base (`a0`) course with 10 modules and 40 substantive lessons, preserve A1/A2 routes and evidence, and pass the complete release, accessibility, visual, and independent-review gates.

**Architecture:** Introduce a self-contained `src/course/base/` release layer and a total cross-level ownership/runtime registry. Split the current A1 manifest into Base 10x4 and A1 11x4 without changing published route IDs, migrate progress losslessly to schema V5, and render all three levels through typed configuration rather than binary fallbacks. Keep heavy curriculum validation in prebuild while the browser imports only frozen catalogs, view builders, and lightweight shape assertions.

**Tech Stack:** React 18, TypeScript 5 strict mode, React Router 7, Vite 6, Vitest 3, Playwright 1.61, immutable TypeScript catalogs, browser Web Speech adapters, checked-in audio assets, GitHub Pages.

---

## Locked boundaries and file map

The design at `docs/superpowers/specs/2026-08-06-base-level-curriculum-redesign.md`
is authoritative. These boundaries prevent a 40-lesson content expansion from
becoming one unreviewable file:

| Responsibility | Files |
|---|---|
| Shared level identity and total owner registries | `src/course/levels/types.ts`, `src/course/levels/ownership.ts`, `src/course/levels/runtimeConfig.ts` |
| Base immutable structure | `src/course/base/manifest.ts`, `src/course/base/types.ts`, `src/course/base/releaseIdentity.ts` |
| Base semantic catalogs | `src/course/base/catalog/lexicon.ts`, `concepts.ts`, `firstTeach.ts`, `canDos.ts`, `checkpoint.ts`, `catalog.ts` |
| Form and particle correctness | `src/course/base/forms/verbForms.ts`, `adjectiveForms.ts`, `particleLicensing.ts` |
| Five progressive references | `src/course/base/references/catalog.ts`, `buildReferenceViewModel.ts` |
| Sound inventory and canonical audio | `src/course/base/audio/catalog.ts`, `src/course/base/audio/reviewLedger.ts`, `public/audio/base/*.wav` |
| Lesson content | `src/course/base/content/module01Sounds.ts` through `module10Synthesis.ts`, `src/course/base/content/catalog.ts` |
| Localization | `src/course/base/copy/en.ts`, `src/course/base/copy/it.ts`, shared chrome in `src/course/i18n/types.ts`, `en.ts`, `it.ts` |
| Learner views | `src/course/base/view/buildBaseLessonViewModel.ts`, `buildBasePracticeModel.ts`, `src/course/components/BaseLessonPage.tsx`, `BaseReferencePage.tsx`, `BaseDiagnostic.tsx` |
| Progress V5 | `src/course/progress/progress.ts`, `ProgressContext.tsx`, `src/course/base/migration/v4OwnershipMap.ts`, `v4ActivityMap.ts` |
| Build-only release proof | `src/course/base/validateBase.ts`, `reports.ts`, `scripts/validateBaseRelease.ts` |
| Three-level navigation | `src/routing/routePaths.ts`, `src/routing/routes.tsx`, `src/course/data/course.ts`, `CourseHome.tsx`, `LevelSelector.tsx`, `LessonPage.tsx` |
| Release acceptance | colocated Vitest files, `tests/e2e/base-level.spec.ts`, `base-accessibility.spec.ts`, `base-visuals.spec.ts` |

The A2 source-tree hash before implementation is
`6222eb60ecabe583e491bf9ff44d68238bbbb2135947328245447ec48a242aa3`.
The editorial golden hash is
`6ce32b1fd05ead0c10f494549e090d1cf7328734e2cc9041635f320270b2b38f`.
Final release work must preserve both.

### Task 1: Freeze published identities and capture the V4 migration inventory

**Files:**
- Create: `src/course/base/releaseBaseline.test.ts`
- Create: `src/course/base/migration/v4ActivityInventory.ts`
- Create: `src/course/base/migration/v4ActivityInventory.test.ts`
- Create then remove before commit: `scripts/captureV4BaseActivityInventory.ts`
- Modify: none of the production catalogs in this task

- [ ] **Step 1: Write the failing identity-lock test**

```ts
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { A1_LESSON_IDS_BY_MODULE } from "../a1/manifest";
import { A2_LESSON_IDS } from "../a2/manifest";
import { V4_ACTIVITY_INVENTORY } from "./migration/v4ActivityInventory";

const REHOMED = [
  "sounds",
  "sentence-foundations",
  "topic-questions",
  "polite-verbs",
  "time-movement",
] as const;

describe("pre-Base published identity", () => {
  it("locks the twenty rehomed and forty-four retained A1 routes", () => {
    const rehomed = REHOMED.flatMap((id) => A1_LESSON_IDS_BY_MODULE[id]);
    const retained = Object.entries(A1_LESSON_IDS_BY_MODULE)
      .filter(([id]) => !REHOMED.includes(id as (typeof REHOMED)[number]))
      .flatMap(([, ids]) => ids);
    expect(rehomed).toHaveLength(20);
    expect(retained).toHaveLength(44);
    expect(new Set([...rehomed, ...retained]).size).toBe(64);
    expect(new Set(V4_ACTIVITY_INVENTORY.map((row) => row.lessonId)).size).toBe(20);
  });

  it("locks A2 editorial bytes and route count", () => {
    const bytes = readFileSync(
      new URL("../a2/catalog/a2EditorialSurfaces.golden.json", import.meta.url),
    );
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(
      "6ce32b1fd05ead0c10f494549e090d1cf7328734e2cc9041635f320270b2b38f",
    );
    expect(A2_LESSON_IDS).toHaveLength(60);
  });
});
```

- [ ] **Step 2: Run the identity test and verify red**

Run:

```bash
npx vitest run src/course/base/releaseBaseline.test.ts
```

Expected: FAIL because `./migration/v4ActivityInventory` does not exist.

- [ ] **Step 3: Capture every V4 stable-lesson activity as literal source**

Create a one-use generator that evaluates the current production exercise model
before changing A1 and writes literal rows:

```ts
import { writeFileSync } from "node:fs";
import { getLessonExercises } from "../src/course/components/lessonExerciseModel";
import { reviewKeyFor } from "../src/course/progress/reviewQueue";

const lessonIds = [
  "sounds", "sentence-foundations", "topic-questions", "polite-verbs", "time-movement",
].flatMap((moduleId) => [1, 2, 3, 4].map((n) => `${moduleId}-${n}`));
const rows = lessonIds.flatMap((lessonId) => {
  const model = getLessonExercises(lessonId);
  if (!model || model.errors.length > 0) {
    throw new Error(`Cannot capture V4 activity inventory for ${lessonId}.`);
  }
  return model.exercises.map((exercise) => ({
      lessonId,
      definitionId: exercise.definitionId,
      reviewKey: reviewKeyFor(lessonId, exercise.definitionId),
      practiceFunction: exercise.practiceFunction,
    }));
});

const source = `import { deepFreeze } from "../../foundations/deepFreeze";
export interface V4ActivityInventoryRow {
  readonly lessonId: string;
  readonly definitionId: string;
  readonly reviewKey: string;
  readonly practiceFunction: string | null;
}
export const V4_ACTIVITY_INVENTORY: readonly V4ActivityInventoryRow[] = deepFreeze(
${JSON.stringify(rows, null, 2)} as const,
);
`;
writeFileSync(
  new URL("../src/course/base/migration/v4ActivityInventory.ts", import.meta.url),
  source,
);
```

Run `npx vite-node scripts/captureV4BaseActivityInventory.ts`, inspect the
generated literal, then remove the generator. The committed inventory must not
import any live catalog or rebuild itself after Base activities change.

The test must assert 20 unique lesson IDs, unique definition IDs per lesson,
unique review keys, and non-empty inventory rows for every lesson.

- [ ] **Step 4: Run the frozen baseline tests**

Run:

```bash
npx vitest run src/course/base/releaseBaseline.test.ts src/course/base/migration/v4ActivityInventory.test.ts
```

Expected: PASS with 2 test files and no snapshots updated.

- [ ] **Step 5: Commit the immutable baseline**

```bash
git add src/course/base/releaseBaseline.test.ts src/course/base/migration
git commit -m "test: freeze Base migration identities" \
  -m "Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>"
```

### Task 2: Add three-level types, Base/A1 manifests, and total route ownership

**Files:**
- Create: `src/course/levels/types.ts`
- Create: `src/course/levels/ownership.ts`
- Create: `src/course/levels/ownership.test.ts`
- Create: `src/course/base/types.ts`
- Create: `src/course/base/manifest.ts`
- Create: `src/course/base/manifest.test.ts`
- Create: `src/course/base/releaseIdentity.ts`
- Create: `src/course/base/releaseIdentity.test.ts`
- Create: `src/course/base/catalog/canDos.ts`
- Create: `src/course/base/catalog/checkpoint.ts`
- Modify: `src/course/foundations/types.ts:21`
- Modify: `src/course/a1/manifest.ts:25-84`
- Modify: `src/course/a1/manifest.test.ts`
- Modify: `src/course/a1/types.ts`

- [ ] **Step 1: Write failing manifest and ownership tests**

```ts
import { describe, expect, it } from "vitest";
import {
  BASE_LESSON_IDS,
  BASE_LESSON_IDS_BY_MODULE,
  BASE_MODULE_IDS,
} from "./manifest";
import {
  A1_RETAINED_LESSON_IDS,
  A1_RETAINED_MODULE_IDS,
} from "../a1/manifest";
import {
  currentLessonRouteRegistry,
  lessonOwner,
  moduleOwner,
  publishedRouteAliasRegistry,
} from "../levels/ownership";

describe("Base and retained A1 ownership", () => {
  it("publishes Base 10x4 and A1 11x4", () => {
    expect(BASE_MODULE_IDS).toEqual([
      "sounds", "sentence-foundations", "topic-questions", "polite-verbs",
      "argument-particles", "time-movement", "copula-adjectives",
      "existence-location", "requests-connection", "base-synthesis",
    ]);
    expect(BASE_LESSON_IDS).toHaveLength(40);
    expect(A1_RETAINED_MODULE_IDS).toHaveLength(11);
    expect(A1_RETAINED_LESSON_IDS).toHaveLength(44);
  });

  it("keeps all stable routes and resolves owners without fallback", () => {
    expect(BASE_LESSON_IDS_BY_MODULE.sounds).toEqual([
      "sounds-1", "sounds-2", "sounds-3", "sounds-4",
    ]);
    expect(lessonOwner("sounds-1")).toEqual({ levelId: "a0", moduleId: "sounds" });
    expect(moduleOwner("sounds")).toBe("a0");
    expect(lessonOwner("introductions-1")).toEqual({
      levelId: "a1",
      moduleId: "introductions",
    });
    expect(lessonOwner("not-published")).toBeNull();
    expect(moduleOwner("not-published")).toBeNull();
    expect(currentLessonRouteRegistry.size).toBe(144);
    expect(publishedRouteAliasRegistry.size).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run the tests to verify red**

Run:

```bash
npx vitest run src/course/base/manifest.test.ts src/course/levels/ownership.test.ts
```

Expected: FAIL with unresolved modules under `src/course/base` and
`src/course/levels`.

- [ ] **Step 3: Implement the shared type and immutable manifests**

`src/course/levels/types.ts`:

```ts
export type CourseLevelId = "a0" | "a1" | "a2";
export type CourseLevelParam = "base" | "a1" | "a2";

export const COURSE_LEVEL_IDS: readonly CourseLevelId[] = ["a0", "a1", "a2"];

export function levelParam(level: CourseLevelId): CourseLevelParam {
  return level === "a0" ? "base" : level;
}
```

`src/course/base/types.ts`:

```ts
export type BaseLessonContract = "phonetic" | "content" | "system" | "synthesis";

export interface BaseModuleManifestEntry {
  readonly id: string;
  readonly order: number;
  readonly prerequisiteIds: readonly string[];
  readonly lessonIds: readonly string[];
  readonly outcomeCopyId: string;
}

export interface BaseLessonManifestEntry {
  readonly lessonId: string;
  readonly moduleId: string;
  readonly order: 1 | 2 | 3 | 4;
  readonly position: number;
  readonly contract: BaseLessonContract;
}
```

Build `BASE_MODULE_IDS`, `BASE_LESSON_IDS_BY_MODULE`,
`BASE_LESSON_MANIFEST`, and `BASE_MODULE_MANIFEST` from one declarative order.
Assign `phonetic` to `sounds-*`, `synthesis` to `base-synthesis-*`, `content`
to the five IDs in design Section 8.1, and `system` to the remaining 27 IDs.

Add an immutable retained-runtime partition without changing A1's existing
64-lesson aggregate yet:

```ts
[
  "introductions", "essential-questions", "actions", "routines",
  "past-negative", "places", "people", "descriptions", "shopping",
  "existence-needs", "capstones",
]
```

Export `A1_RETAINED_MODULE_IDS`, `A1_RETAINED_LESSON_IDS_BY_MODULE`, and
`A1_RETAINED_LESSON_IDS`. Keep `A1_MODULE_IDS` and the existing A1 aggregate
catalog intact until Task 16 moves the rehomed source imports; this avoids a
half-migrated release in intermediate commits. The global owner registry and
three-level runtime use only the retained exports, so stable Base lessons have
one active owner.

Preserve these five published rehomed Can-do IDs exactly:

```ts
[
  "a1-can-do-sounds",
  "a1-can-do-sentence-foundations",
  "a1-can-do-topic-questions",
  "a1-can-do-polite-verbs",
  "a1-can-do-time-movement",
]
```

Their `level` becomes `a0`; the historical `a1-` prefix is an immutable ID, not
learner copy. Add `base-can-do-argument-particles`,
`base-can-do-copula-adjectives`, `base-can-do-existence-location`,
`base-can-do-requests-connection`, and `base-can-do-synthesis`, each with its
exact four lesson IDs. Create `base-checkpoint-1` over
`base-synthesis-1..4`. These IDs are used by progress/runtime tasks before the
complete content and copy are authored in Tasks 9-13.

Import `CourseLevelId` from `src/course/levels/types.ts` everywhere instead of
redeclaring the two-level union.

Define `BASE_RELEASE_CATALOG_VERSION = "base-release-v1"` and
`BASE_RELEASE_SEED = "base-release-seed-v1"` in `releaseIdentity.ts`. Every
selection, view builder, exercise model, validator, and review fingerprint uses
those imports rather than redeclaring literals.

- [ ] **Step 4: Implement the total owner registries**

```ts
export interface LessonOwner {
  readonly levelId: CourseLevelId;
  readonly moduleId: string;
}

const LESSON_OWNER_BY_ID = new Map<string, LessonOwner>();
const MODULE_OWNER_BY_ID = new Map<string, CourseLevelId>();

export function lessonOwner(lessonId: string): LessonOwner | null {
  return LESSON_OWNER_BY_ID.get(lessonId) ?? null;
}

export function moduleOwner(moduleId: string): CourseLevelId | null {
  return MODULE_OWNER_BY_ID.get(moduleId) ?? null;
}

export function lessonIdsForLevel(levelId: CourseLevelId): readonly string[] {
  return [...LESSON_OWNER_BY_ID]
    .filter(([, owner]) => owner.levelId === levelId)
    .map(([lessonId]) => lessonId);
}
```

Populate `currentLessonRouteRegistry` from the Base manifest, A1 retained
partition, and unchanged A2 manifest. Populate `publishedRouteAliasRegistry`
separately from `LEGACY_LESSON_ALIASES`, resolving every alias to a canonical
owner. Throw during
module initialization on every duplicate module ID, lesson ID, or route key.

- [ ] **Step 5: Run focused tests and the affected A1 manifest suite**

Run:

```bash
npx vitest run src/course/base/manifest.test.ts \
  src/course/base/releaseIdentity.test.ts \
  src/course/levels/ownership.test.ts src/course/a1/manifest.test.ts
```

Expected: PASS; Base reports 10/40, retained-runtime A1 reports 11/44, and 144
current lesson IDs have exactly one active owner while the old A1 aggregate
remains readable until Task 16.

- [ ] **Step 6: Commit the ownership split**

```bash
git add src/course/levels src/course/base/types.ts src/course/base/manifest.ts \
  src/course/base/manifest.test.ts src/course/base/catalog/canDos.ts \
  src/course/base/catalog/checkpoint.ts src/course/base/releaseIdentity.ts \
  src/course/base/releaseIdentity.test.ts src/course/foundations/types.ts \
  src/course/a1/manifest.ts src/course/a1/manifest.test.ts src/course/a1/types.ts
git commit -m "feat: split Base and A1 ownership" \
  -m "Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>"
```

### Task 3: Implement lossless schema V5 and the explicit V4 ownership/activity maps

**Files:**
- Create: `src/course/base/migration/v4OwnershipMap.ts`
- Create: `src/course/base/migration/v4ActivityMap.ts`
- Create: `src/course/base/migration/v4CanDoMap.ts`
- Create: `src/course/progress/progress.v5.test.ts`
- Modify: `src/course/progress/progress.ts`
- Modify: `src/course/progress/progress.v4.test.ts`
- Modify: `src/course/progress/progress.store.test.ts`

- [ ] **Step 1: Write the evidence-rich failing V4-to-V5 tests**

The fixture must contain one rehomed and one retained A1 lesson, A2 evidence,
attempted and accepted activity IDs, Can-do evidence, a checkpoint attempt,
active and removed review entries, mistake counts, existing orphan IDs, and
timestamps.

```ts
it("retains every V4 evidence record or a typed historical orphan", () => {
  const migrated = migrateV4ToV5(EVIDENCE_RICH_V4, {
    knownLessonIdsByLevel: KNOWN_LESSONS,
    knownReviewKeysByLevel: KNOWN_REVIEW_KEYS,
  });

  expect(migrated.schemaVersion).toBe(5);
  expect(migrated.levels.a0.lessons["sounds-1"]).toEqual(
    EVIDENCE_RICH_V4.levels.a1.lessons["sounds-1"],
  );
  expect(migrated.levels.a1.lessons["sounds-1"]).toBeUndefined();
  expect(migrated.levels.a1.lessons["introductions-1"]).toEqual(
    EVIDENCE_RICH_V4.levels.a1.lessons["introductions-1"],
  );
  expect(migrated.levels.a2).toEqual(EVIDENCE_RICH_V4.levels.a2);
  expect(evidenceAtoms(migrated)).toEqual(evidenceAtoms(EVIDENCE_RICH_V4));
});

it("is pure, deterministic, idempotent, and future-schema fail-closed", () => {
  const frozen = structuredClone(EVIDENCE_RICH_V4);
  const first = migrateV4ToV5(EVIDENCE_RICH_V4, RUNTIME_IDS);
  const second = migrateV4ToV5(EVIDENCE_RICH_V4, RUNTIME_IDS);
  expect(first).toEqual(second);
  expect(EVIDENCE_RICH_V4).toEqual(frozen);
  expect(parseProgress(JSON.stringify(first), RUNTIME_IDS).progress).toBe(first);
  expect(parseProgress('{"schemaVersion":6}', RUNTIME_IDS)).toMatchObject({
    corrupted: true,
    migrated: false,
  });
});

it("preserves A1/A2 reachability when Base has no evidence", () => {
  const migrated = migrateV4ToV5(emptyProgressV4(), RUNTIME_IDS);
  expect(migrated.levels.a0).toEqual(emptyLevelProgressV5());
  expect(lessonIdsForLevel("a1")).toEqual(A1_RETAINED_LESSON_IDS);
  expect(lessonIdsForLevel("a2")).toEqual(A2_LESSON_IDS);
});
```

- [ ] **Step 2: Run the V5 tests to verify red**

Run:

```bash
npx vitest run src/course/progress/progress.v5.test.ts
```

Expected: FAIL because `CourseProgressV5`, `migrateV4ToV5`, and
`evidenceAtoms` do not exist.

- [ ] **Step 3: Add exact ownership and activity dispositions**

`v4OwnershipMap.ts` exports 20 explicit rows:

```ts
export interface V4OwnershipRow {
  readonly sourceLevel: "a1";
  readonly sourceLessonId: string;
  readonly destinationLevel: "a0";
  readonly destinationLessonId: string;
}

export const V4_BASE_OWNERSHIP_MAP: readonly V4OwnershipRow[] =
  V4_REHOMED_LESSON_IDS.map((lessonId) => ({
    sourceLevel: "a1",
    sourceLessonId: lessonId,
    destinationLevel: "a0",
    destinationLessonId: lessonId,
  }));
```

`v4ActivityMap.ts` contains one explicit row for every
`V4_ACTIVITY_INVENTORY` row:

```ts
export interface V4ActivityMapRow {
  readonly sourceLevel: "a1";
  readonly sourceLessonId: string;
  readonly sourceActivityId: string;
  readonly destinationLevel: "a0";
  readonly destinationLessonId: string;
  readonly destinationActivityId: string | null;
  readonly disposition: "same-semantics" | "historical-orphan";
}
```

Use `same-semantics` only where operation, target, accepted-answer semantics, and
required evidence remain identical. Every expanded or repurposed activity is
`historical-orphan` and has `destinationActivityId: null`. The map test compares
all source `(lessonId, definitionId)` pairs with the frozen inventory and fails
on any omission, duplicate, or unrecognized addition.

`v4CanDoMap.ts` explicitly maps the five stable Can-do IDs from Task 2 from A1
to Base without changing the ID. Migration transfers the complete
`CanDoEvidence` record. Scenario Can-dos remain in A1, and every A2 Can-do
remains byte-equal.

- [ ] **Step 4: Add V5 evidence types and migration**

Use these current types:

```ts
export interface HistoricalActivityDisposition {
  readonly sourceLevel: "a1" | "a2";
  readonly lessonId: string;
  readonly activityId: string;
  readonly disposition: "same-semantics" | "historical-orphan";
  readonly orphanedReview: ReviewQueueEntry | null;
}

export interface CanDoEvidenceV5 extends CanDoEvidence {
  readonly historicalCheckpointRefs: readonly {
    readonly sourceLevel: "a1" | "a2";
    readonly attemptId: string;
  }[];
}

export interface LevelProgressV5 {
  readonly lessons: Readonly<Record<LessonId, LessonProgress>>;
  readonly canDos: Readonly<Record<CanDoId, CanDoEvidenceV5>>;
  readonly checkpointAttempts: readonly CheckpointAttempt[];
  readonly lastVisitedLessonId: LessonId | null;
  readonly reviewQueue: readonly ReviewQueueEntry[];
  readonly orphanedLessonIds: readonly string[];
  readonly orphanedReviewKeys: readonly string[];
  readonly orphanedLessonRecords: Readonly<Record<string, LessonProgress>>;
  readonly historicalActivityDispositions: readonly HistoricalActivityDisposition[];
}

export interface BaseOwnershipMigrationNotice {
  readonly fromSchemaVersion: 4;
  readonly movedLessonIds: readonly string[];
  readonly historicalActivityIds: readonly string[];
  readonly resumeLevel: CourseLevelId;
  readonly priorNotice: ProgressMigrationNotice | null;
  readonly acknowledgedAt: string | null;
}

export interface CourseProgressV5 {
  readonly schemaVersion: 5;
  readonly catalogVersion: "base-a1-a2-v1";
  readonly levels: Readonly<Record<CourseLevelId, LevelProgressV5>>;
  readonly migrationNotice: BaseOwnershipMigrationNotice | null;
  readonly updatedAt: string;
}
```

Migrate lesson, Can-do, and active review ownership through exact maps. Preserve
historical checkpoint references with a typed
`{ readonly sourceLevel: "a1"; readonly attemptId: string }` record. Do not
create timestamps.
If V4's last visited lesson moves, set `resumeLevel: "a0"` while deriving A1's
continuation only from retained A1 evidence. Parse V1-V4 through the existing
parsers and then V5; malformed or future input returns empty V5 with
`corrupted: true`.

- [ ] **Step 5: Run progress suites**

Run:

```bash
npx vitest run src/course/progress/progress.test.ts \
  src/course/progress/progress.v3.test.ts \
  src/course/progress/progress.v4.test.ts \
  src/course/progress/progress.v5.test.ts \
  src/course/progress/progress.store.test.ts
```

Expected: PASS with zero evidence-atom drops and A2 deep equality.

- [ ] **Step 6: Commit schema V5**

```bash
git add src/course/base/migration src/course/progress
git commit -m "feat: migrate progress losslessly to V5" \
  -m "Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>"
```

### Task 4: Make progress mutation ownership total and fail closed

**Files:**
- Modify: `src/course/progress/ProgressContext.tsx`
- Create: `src/course/progress/ProgressContext.v5.test.tsx`
- Modify: `src/course/components/LessonExercises.tsx`
- Modify: `src/course/components/ReviewQueue.tsx`

- [ ] **Step 1: Write failing unknown-ID and level-isolation tests**

```tsx
it("notifies and never mutates for an unknown lesson id", async () => {
  render(<ProgressHarness action={() => api.markVisited("unknown-lesson")} />);
  await screen.findByRole("alert");
  expect(screen.getByRole("alert")).toHaveTextContent("unknown-lesson");
  expect(readStoredProgress()).toEqual(emptyProgressV5());
});

it.each(["a0", "a1", "a2"] as const)(
  "mutates only the immutable owner level %s",
  async (level) => {
    const lessonId = FIRST_LESSON_BY_LEVEL[level];
    const before = readStoredProgress();
    await invokeMarkVisited(lessonId);
    const after = readStoredProgress();
    for (const other of COURSE_LEVEL_IDS.filter((id) => id !== level)) {
      expect(after.levels[other]).toEqual(before.levels[other]);
    }
  },
);
```

- [ ] **Step 2: Run the focused context test to verify red**

Run:

```bash
npx vitest run src/course/progress/ProgressContext.v5.test.tsx
```

Expected: FAIL because unknown lessons still default to A1.

- [ ] **Step 3: Replace fallback inference with the owner registry**

```ts
type OwnerResult =
  | { readonly ok: true; readonly level: CourseLevelId; readonly runtime: LevelRuntime }
  | { readonly ok: false; readonly lessonId: string };

function runtimeForLesson(lessonId: string): OwnerResult {
  const owner = lessonOwner(lessonId);
  return owner
    ? { ok: true, level: owner.levelId, runtime: LEVEL_RUNTIME[owner.levelId] }
    : { ok: false, lessonId };
}
```

Build `LEVEL_RUNTIME` known-lesson sets and module outlines directly from the
Base manifest, A1 retained partition, and A2 manifest through
`currentLessonRouteRegistry`; do not wait for or import `courseModulesByLevel`.
Use the structural Base Can-dos/checkpoint from Task 2. This keeps progress
ownership independent from learner-view assembly.

Add `mutationError: string | null` and `dismissMutationError()` to context.
`markVisited`, `recordAttempt`, `resolveReview`, and `lessonEvidence` call
`runtimeForLesson`; an error sets localized-notice state and returns without
calling `setProgressV5`. Never fabricate required exercise IDs for an unknown
lesson.

Expose `progressV5: CourseProgressV5` as the level-aware public field and update
all consumers from `progressV4`. Retain the A1-shaped `progress` projection only
for old A1 components until Task 16; no new Base or A2 code may use it.

- [ ] **Step 4: Render the scoped error and read level-owned evidence**

`LessonExercises` reads `lessonEvidence(lessonId)` instead of A1's compatibility
projection. `ReviewQueue` resolves owner first and rejects an unknown review
entry into historical evidence. Render a `Notice tone="warning"` for
`mutationError` in the course and lesson shells.

- [ ] **Step 5: Run context, review, and exercise tests**

Run:

```bash
npx vitest run src/course/progress/ProgressContext.v5.test.tsx \
  src/course/progress/ProgressContext.render.test.tsx \
  src/course/components/LessonExercises.test.tsx \
  src/course/components/ReviewQueue.test.ts
```

Expected: PASS and no A1/A2 regression.

- [ ] **Step 6: Commit fail-closed mutations**

```bash
git add src/course/progress src/course/components/LessonExercises.tsx \
  src/course/components/ReviewQueue.tsx
git commit -m "fix: make progress ownership fail closed" \
  -m "Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>"
```

### Task 5: Add explicit three-level URL parsing, preference, and fresh/returning defaults

**Files:**
- Create: `src/course/levels/selection.ts`
- Create: `src/course/levels/selection.test.ts`
- Modify: `src/routing/routePaths.ts`
- Modify: `src/routing/routePaths.test.ts`
- Modify: `src/course/components/LevelSelector.tsx`
- Modify: `src/course/components/LevelSelector.test.tsx`
- Modify: `src/course/i18n/types.ts`
- Modify: `src/course/i18n/en.ts`
- Modify: `src/course/i18n/it.ts`

- [ ] **Step 1: Write failing pure-selection tests**

```ts
describe("course level selection", () => {
  it.each([
    ["base", "a0"], ["a1", "a1"], ["a2", "a2"],
  ] as const)("lets explicit %s win", (param, expected) => {
    expect(resolveCourseLevel({
      explicit: parseExplicitCourseLevel(param),
      preference: "a2",
      evidence: { a0: false, a1: true, a2: true },
    })).toBe(expected);
  });

  it("defaults fresh learners to Base", () => {
    expect(resolveCourseLevel({
      explicit: null,
      preference: null,
      evidence: { a0: false, a1: false, a2: false },
    })).toBe("a0");
  });

  it("preserves returning A1/A2 compatibility", () => {
    expect(resolveCourseLevel({
      explicit: null,
      preference: null,
      evidence: { a0: false, a1: false, a2: true },
    })).toBe("a1");
  });
});
```

- [ ] **Step 2: Run selection tests to verify red**

Run:

```bash
npx vitest run src/course/levels/selection.test.ts src/routing/routePaths.test.ts
```

Expected: FAIL because `base`, explicit-null parsing, and preference/evidence
selection are absent.

- [ ] **Step 3: Implement parsing separately from defaulting**

```ts
export function parseExplicitCourseLevel(value: string | null): CourseLevelId | null {
  if (value === "base") return "a0";
  if (value === "a1" || value === "a2") return value;
  return null;
}

export function resolveCourseLevel(input: {
  readonly explicit: CourseLevelId | null;
  readonly preference: CourseLevelId | null;
  readonly evidence: Readonly<Record<CourseLevelId, boolean>>;
}): CourseLevelId {
  if (input.explicit) return input.explicit;
  if (input.preference) return input.preference;
  if (input.evidence.a1 || input.evidence.a2) return "a1";
  return "a0";
}
```

`coursePathForLevel("a0")` returns `/percorso?livello=base`; A1 and A2 return
explicit query URLs too. Keep `courseLevelFromParam` only as a deprecated wrapper
for tests that require old parser compatibility; production uses the two new
functions.

Store the preference under `nihongo.course.level` using the existing storage
helpers. A selected link writes preference after navigation; it never writes
lesson evidence.

- [ ] **Step 4: Render three always-open selector links**

Use this ordered option table:

```ts
const LEVEL_OPTIONS = [
  { level: "a0", labelKey: "base" },
  { level: "a1", labelKey: "a1" },
  { level: "a2", labelKey: "a2" },
] as const;
```

Expose a separate soft recommendation string per option. Keep `aria-current`,
real links, 44px targets, and focus behavior.

Extend `CourseCopy.courseLevels` with `base`, `baseHeading`, `baseBadge`,
`baseRecommendedHint`, and explicit A1/A2 availability hints in both locales.
This task adds only selector/map navigation copy; Task 16 adds deep Base lesson,
reference, diagnostic, migration, and audio chrome.

- [ ] **Step 5: Run selection and selector tests**

Run:

```bash
npx vitest run src/course/levels/selection.test.ts \
  src/routing/routePaths.test.ts \
  src/course/components/LevelSelector.test.tsx
```

Expected: PASS for Base/A1/A2 URL history and fresh/returning selection.

- [ ] **Step 6: Commit three-level selection**

```bash
git add src/course/levels/selection.ts src/course/levels/selection.test.ts \
  src/routing/routePaths.ts src/routing/routePaths.test.ts \
  src/course/components/LevelSelector.tsx src/course/components/LevelSelector.test.tsx \
  src/course/i18n/types.ts src/course/i18n/en.ts src/course/i18n/it.ts
git commit -m "feat: add Base level selection" \
  -m "Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>"
```

### Task 6: Build typed per-level runtime configuration and three-level course data

**Files:**
- Create: `src/course/levels/runtimeConfig.ts`
- Create: `src/course/levels/runtimeConfig.test.ts`
- Modify: `src/course/data/course.ts`
- Modify: `src/course/data/course.test.ts`
- Modify: `src/course/data/runtimeShapeAssertion.ts`
- Modify: `src/course/data/runtimeShapeAssertion.test.ts`
- Modify: `src/course/components/CourseHome.tsx`
- Modify: `src/course/components/CourseHome.test.ts`
- Modify: `src/course/components/CourseHome.a2.test.tsx`
- Create: `src/course/base/copy/en.ts`
- Create: `src/course/base/copy/it.ts`

- [ ] **Step 1: Write the failing runtime configuration tests**

```ts
it("defines a complete runtime configuration for every level", () => {
  expect(Object.keys(LEVEL_RUNTIME_CONFIG)).toEqual(["a0", "a1", "a2"]);
  for (const level of COURSE_LEVEL_IDS) {
    const config = LEVEL_RUNTIME_CONFIG[level];
    expect(config.modules).toBe(courseModulesByLevel[level]);
    expect(config.resolveDescriptor("en", "missing")).toBeNull();
    expect(config.progressLevel).toBe(level);
  }
});

it("assembles 10/40, 11/44, and unchanged 15/60 shapes", () => {
  expect(courseModulesByLevel.a0).toHaveLength(10);
  expect(courseModulesByLevel.a0.flatMap((m) => m.lessons)).toHaveLength(40);
  expect(courseModulesByLevel.a1).toHaveLength(11);
  expect(courseModulesByLevel.a1.flatMap((m) => m.lessons)).toHaveLength(44);
  expect(courseModulesByLevel.a2).toHaveLength(15);
  expect(courseModulesByLevel.a2.flatMap((m) => m.lessons)).toHaveLength(60);
});
```

- [ ] **Step 2: Run focused tests to verify red**

Run:

```bash
npx vitest run src/course/levels/runtimeConfig.test.ts src/course/data/course.test.ts
```

Expected: FAIL because `a0` runtime data and configuration do not exist.

- [ ] **Step 3: Assemble Base navigation metadata and generic shape assertions**

Add `assertCourseShape(level, modules, expected)` with level-specific errors.
Build Base modules from `BASE_MODULE_MANIFEST` and Base Can-do descriptors.
Use the structural Can-do IDs created in Task 2 and add their navigation
descriptor copy to `src/course/base/copy/en.ts` and `it.ts`. Retain
`courseModules` as a deprecated identity alias for
`courseModulesByLevel.a1` only where old tests still import it.

```ts
export const courseModulesByLevel: Readonly<Record<CourseLevelId, readonly CourseModule[]>> = {
  a0: baseCourseModules,
  a1: a1CourseModules,
  a2: a2CourseModules,
};
```

- [ ] **Step 4: Define configuration instead of ternaries**

```ts
export interface CourseLevelRuntimeConfig {
  readonly id: CourseLevelId;
  readonly modules: readonly CourseModule[];
  readonly areas: readonly CourseArea[];
  readonly canDos: readonly CanDo[];
  readonly resolveDescriptor: (locale: Locale, copyId: string) => string | null;
  readonly badgeCopyKey: "baseBadge" | "a1Badge" | "a2Badge";
  readonly headingCopyKey: "baseHeading" | "a1Heading" | "a2Heading";
  readonly checkpointHeadingCopyKey:
    | "baseCheckpointHeading"
    | "a1CheckpointHeading"
    | "a2CheckpointHeading";
  readonly progressLevel: CourseLevelId;
}
```

`CourseHome` indexes this configuration for modules, progress, areas, Can-dos,
descriptor lookup, badge, heading, checkpoint copy, review queue, and reset.
Delete `levelIsA1` and every A1/A2 conditional branch that selects level data.
An unresolved descriptor renders a localized warning; it never becomes `""`.

- [ ] **Step 5: Run course home and data tests**

Run:

```bash
npx vitest run src/course/levels/runtimeConfig.test.ts \
  src/course/data/course.test.ts \
  src/course/data/runtimeShapeAssertion.test.ts \
  src/course/components/CourseHome.test.ts \
  src/course/components/CourseHome.a2.test.tsx
```

Expected: PASS with fresh Base default, explicit level selection, and isolated
progress summaries.

- [ ] **Step 6: Commit typed runtime configuration**

```bash
git add src/course/levels/runtimeConfig.ts src/course/levels/runtimeConfig.test.ts \
  src/course/data src/course/components/CourseHome.tsx \
  src/course/components/CourseHome.test.ts src/course/components/CourseHome.a2.test.tsx
git commit -m "refactor: configure all course levels by type" \
  -m "Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>"
```

### Task 7: Define Base authoring contracts, form engines, particle licensing, and first-teach ownership

**Files:**
- Create: `src/course/base/catalog/types.ts`
- Create: `src/course/base/catalog/lexicon.ts`
- Create: `src/course/base/catalog/concepts.ts`
- Create: `src/course/base/catalog/firstTeach.ts`
- Create: `src/course/base/catalog/firstTeach.test.ts`
- Create: `src/course/base/forms/verbForms.ts`
- Create: `src/course/base/forms/verbForms.test.ts`
- Create: `src/course/base/forms/adjectiveForms.ts`
- Create: `src/course/base/forms/adjectiveForms.test.ts`
- Create: `src/course/base/forms/particleLicensing.ts`
- Create: `src/course/base/forms/particleLicensing.test.ts`
- Create: `src/course/base/validation/lessonRules.ts`
- Create: `src/course/base/validation/sequenceRules.ts`
- Create: `src/course/base/validation/rules.test.ts`

- [ ] **Step 1: Write failing morphology and licensing tests**

```ts
describe("Base verb forms", () => {
  it.each([
    ["かく", "かきます", "かいて"],
    ["およぐ", "およぎます", "およいで"],
    ["はなす", "はなします", "はなして"],
    ["まつ", "まちます", "まって"],
    ["しぬ", "しにます", "しんで"],
    ["あそぶ", "あそびます", "あそんで"],
    ["のむ", "のみます", "のんで"],
    ["かう", "かいます", "かって"],
    ["たべる", "たべます", "たべて"],
    ["する", "します", "して"],
    ["くる", "きます", "きて"],
    ["いく", "いきます", "いって"],
  ] as const)("%s derives polite and te forms", (dictionary, polite, te) => {
    expect(realizeBaseVerbForms(dictionary)).toMatchObject({ polite, te });
  });
});

describe("adjective/coupla separation", () => {
  it("self-conjugates i-adjectives and never emits copula da", () => {
    expect(realizeIAdjective("たかい")).toEqual({
      nonpastAffirmative: "たかいです",
      nonpastNegative: "たかくないです",
      pastAffirmative: "たかかったです",
      pastNegative: "たかくなかったです",
    });
    expect(validateBasePredicate("たかいだ")).toEqual({
      ok: false,
      code: "i-adjective-copula-da",
    });
  });

  it("requires na or a copula for na-adjectives", () => {
    expect(realizeNaAdjective("しずか")).toMatchObject({
      attributive: "しずかな",
      nonpastAffirmative: "しずかです",
    });
  });
});

it("licenses argument particles by predicate sense", () => {
  expect(validateParticleFrame("base-sense-eat", { theme: "o" }).ok).toBe(true);
  expect(validateParticleFrame("base-sense-go", { goal: "ni" }).ok).toBe(true);
  expect(validateParticleFrame("base-sense-study", { location: "de" }).ok).toBe(true);
  expect(validateParticleFrame("base-sense-exist-inanimate", { location: "ni", theme: "ga" }).ok).toBe(true);
  expect(validateParticleFrame("base-sense-eat", { theme: "ni" })).toMatchObject({
    ok: false,
    code: "unlicensed-particle",
  });
});
```

- [ ] **Step 2: Run the form tests to verify red**

Run:

```bash
npx vitest run src/course/base/forms
```

Expected: FAIL with unresolved form modules.

- [ ] **Step 3: Implement closed authoring contracts**

Use these core shapes:

```ts
export type BaseActivityCategory =
  | "meaning-comprehension"
  | "form-function-discrimination"
  | "ordering"
  | "controlled-production"
  | "transformation"
  | "error-diagnosis"
  | "contextual-response"
  | "cumulative-retrieval";

export type BaseInteractionKind =
  | "choice"
  | "tile-ordering"
  | "completion"
  | "transformation"
  | "constrained-construction"
  | "listening"
  | "spoken";

export interface BaseActivityDefinition {
  readonly id: string;
  readonly category: BaseActivityCategory | "listening" | "spoken";
  readonly interactionKind: BaseInteractionKind;
  readonly mode: "non-spoken" | "audio";
  readonly targetId: string;
  readonly instructionCopyId: string;
  readonly acceptedFeedbackCopyId: string;
  readonly retryFeedbackCopyId: string;
}

interface BaseLessonCore {
  readonly lessonId: string;
  readonly contract: BaseLessonContract;
  readonly prerequisiteLessonIds: readonly string[];
  readonly activities: readonly BaseActivityDefinition[];
  readonly recapCopyId: string;
}

export interface BaseSemanticLessonContent extends BaseLessonCore {
  readonly contract: "content" | "system" | "synthesis";
  readonly newLexemeIds: readonly string[];
  readonly introducedConceptIds: readonly string[];
  readonly explanation: {
    readonly mainCopyId: string;
    readonly constructionCopyId: string;
    readonly constraintsCopyId: string;
    readonly commonErrorCopyId: string;
    readonly nearestContrastId: string;
  };
  readonly patternCellIds: readonly string[];
  readonly workedExampleIds: readonly string[];
  readonly dialogueId: string | null;
  readonly referenceSnapshotIds: readonly string[];
}

export interface BasePhoneticLessonContent extends BaseLessonCore {
  readonly contract: "phonetic";
  readonly contrastiveItemIds: readonly string[];
  readonly anchorLexemeIds: readonly string[];
  readonly audioExemplarIds: readonly string[];
  readonly phoneticExplanationCopyId: string;
  readonly contrastMapId: string;
}

export type BaseLessonContent =
  | BaseSemanticLessonContent
  | BasePhoneticLessonContent;
```

Keep canonical Japanese only in semantic values and form tables. Copy files
contain explanation/translation text but no independently-authored Japanese.

- [ ] **Step 4: Implement generic form rules**

Represent verb class explicitly in the lexicon; do not guess every `-iru/-eru`
verb. Godan uses final-kana maps for polite stems and `て` allomorphy. Store
`いく -> いって` in an explicit exception table. Implement:

```ts
export function realizePoliteGrid(lemmaId: string): {
  readonly affirmativeNonpast: string;
  readonly negativeNonpast: string;
  readonly affirmativePast: string;
  readonly negativePast: string;
};

export function realizeTeConstruction(
  lemmaId: string,
  construction: "te" | "request" | "sequence" | "te-imasu",
): readonly AssembledToken[];
```

Adjective and noun-predicate functions are separate overloads with no shared
`stem + copula` shortcut.

- [ ] **Step 5: Implement first-teach and licensing registries**

Every lexeme, concept, form, and reference entry has one row:

```ts
export interface FirstTeachOwner {
  readonly contentId: string;
  readonly levelId: CourseLevelId;
  readonly lessonId: string;
  readonly kind: "lexeme" | "concept" | "form" | "reference-entry";
}
```

Seed required ownership with:

- `base-form-copula-desu` at `sentence-foundations-3`;
- `wa`, `ga` at `topic-questions-1/2`;
- possessive/attributive `no`, additive `mo`, and nominal/listing/companion
  `to` at `topic-questions-3`;
- question `ka` at `topic-questions-4`;
- dictionary classes and polite stems at `polite-verbs-1..3`;
- `o`, goal `ni`, direction `he`, action-place/means `de` at
  `argument-particles-1..3`;
- time `ni`, `kara`, `made`, and four polite tense cells in `time-movement`;
- remaining noun-copula and adjective cells in `copula-adjectives`;
- existence `ni` plus existential `ga` in `existence-location`;
- bounded `te`, request, sequence, and `te-imasu` in `requests-connection`.

The registry constructor throws on duplicate ownership or an owner lesson that
does not exist.

- [ ] **Step 6: Implement reusable depth and sequence rule functions**

These pure functions become the shared seam for module tests and Task 17's
whole-release validator:

```ts
export function validateBaseLessonDepth(
  lesson: BaseLessonContent,
  catalogs: BaseValidationCatalogs,
): readonly BaseValidationError[];

export function validateFirstTeachOrder(
  lessons: readonly BaseLessonContent[],
  owners: Readonly<Record<string, FirstTeachOwner>>,
): readonly BaseValidationError[];

export function visibleJapaneseFor(
  lessons: readonly BaseLessonContent[],
  catalogs: BaseValidationCatalogs,
): string;
```

`validateBaseLessonDepth` applies phonetic/content/system/synthesis ranges,
dialogue-additionality, category limits, pattern cells, and explanation blocks.
`validateFirstTeachOrder` compares manifest positions and returns attributed
`used-before-teach` errors. `visibleJapaneseFor` realizes the exact examples,
dialogues, prompts, and accepted answers a learner can encounter; it is never a
separately-authored string fixture.

- [ ] **Step 7: Run form, first-teach, and shared-foundation tests**

Run:

```bash
npx vitest run src/course/base/forms src/course/base/catalog/firstTeach.test.ts \
  src/course/base/validation \
  src/course/foundations/realizeFamily.test.ts src/course/foundations/fixtures.test.ts
```

Expected: PASS, including `いく -> いって`, four polite tense cells, and
deterministic `たかいだ` rejection.

- [ ] **Step 8: Commit the Base domain engine**

```bash
git add src/course/base/catalog src/course/base/forms src/course/base/validation
git commit -m "feat: add Base grammar domain engine" \
  -m "Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>"
```

### Task 8: Build the five progressive reference surfaces

**Files:**
- Create: `src/course/base/references/catalog.ts`
- Create: `src/course/base/references/catalog.test.ts`
- Create: `src/course/base/references/buildReferenceViewModel.ts`
- Create: `src/course/base/references/buildReferenceViewModel.test.ts`

- [ ] **Step 1: Write failing progression and canonical-cell tests**

```ts
it("publishes exactly five references from canonical forms", () => {
  expect(BASE_REFERENCE_IDS).toEqual([
    "sentence-anatomy",
    "particle-atlas",
    "verb-classes-conjugation",
    "tense-polarity",
    "adjective-copula",
  ]);
  expect(
    referenceById["tense-polarity"].cells.map((cell) =>
      cell.tokens.map((token) => token.jp).join(""),
    ),
  ).toEqual(
    Object.values(realizePoliteGrid("base-lexeme-kaku")),
  );
});

it("reveals only entries owned through the requested lesson", () => {
  const early = buildBaseReferenceViewModel("particle-atlas", "topic-questions-2", "en");
  expect(early.ok && early.model.entries.map((entry) => entry.semanticId)).toEqual([
    "base-particle-wa",
    "base-particle-ga",
  ]);
  const later = buildBaseReferenceViewModel("particle-atlas", "existence-location-3", "en");
  expect(later.ok && later.model.entries).toContainEqual(
    expect.objectContaining({ semanticId: "base-particle-existence-ni" }),
  );
});
```

- [ ] **Step 2: Run reference tests to verify red**

Run:

```bash
npx vitest run src/course/base/references
```

Expected: FAIL because the reference catalog is absent.

- [ ] **Step 3: Implement reference entries and prerequisite closure**

Each entry declares semantic ID, first-teach lesson, prerequisite entry IDs,
copy ID, canonical form cells, contrast IDs, and eligible example IDs. Derive
all forms through Task 7 functions. `buildBaseReferenceViewModel` validates
`throughLessonId` against Base canonical positions and returns:

```ts
type BaseReferenceViewModelResult =
  | { readonly ok: true; readonly model: BaseReferenceViewModel }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: "unknown-reference" | "unknown-through-lesson" | "future-prerequisite";
        readonly referenceId: string;
      };
    };
```

No empty fallback model is allowed.

- [ ] **Step 4: Generate one semantic table and one stacked mobile model**

The view model exposes one set of cells plus generated row cards:

```ts
interface ReferenceGridModel {
  readonly caption: string;
  readonly columns: readonly { id: string; label: string }[];
  readonly rows: readonly {
    id: string;
    header: string;
    cells: readonly { columnId: string; label: string; value: readonly AssembledToken[] }[];
  }[];
}
```

Desktop tables and mobile cards consume the same rows and labels.

- [ ] **Step 5: Run reference tests**

Run:

```bash
npx vitest run src/course/base/references
```

Expected: PASS for all five references, progressive ownership, prerequisite
closure, and canonical form equality.

- [ ] **Step 6: Commit references**

```bash
git add src/course/base/references
git commit -m "feat: add progressive Base references" \
  -m "Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>"
```

### Task 9: Author the complete sound module with verified canonical audio

**Files:**
- Create: `src/course/base/audio/catalog.ts`
- Create: `src/course/base/audio/reviewLedger.ts`
- Create: `src/course/base/audio/catalog.test.ts`
- Create: `src/course/base/content/module01Sounds.ts`
- Create: `src/course/base/content/module01Sounds.test.ts`
- Create: `public/audio/base/*.wav`
- Modify: `src/course/speech/SpeechRecognizer.ts` only if the existing adapter cannot play asset URLs

- [ ] **Step 1: Write failing inventory, lesson-depth, and audio-review tests**

```ts
it("covers the complete modern hiragana foundation", () => {
  expect(new Set(BASIC_HIRAGANA).size).toBe(46);
  expect(DAKUTEN_HIRAGANA).toEqual(expect.arrayContaining(["が", "ざ", "だ", "ば"]));
  expect(HANDAKUTEN_HIRAGANA).toEqual(["ぱ", "ぴ", "ぷ", "ぺ", "ぽ"]);
  expect(YOON_HIRAGANA).toEqual(expect.arrayContaining(["きゃ", "しゃ", "ちゃ", "にゅ", "りょ"]));
});

it("uses reviewed assets for every assessed contrast", () => {
  for (const contrast of assessedSoundContrasts) {
    const audio = baseAudioById[contrast.audioId];
    expect(audio.src).toMatch(/^\/audio\/base\/.+\.wav$/);
    expect(audio.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(baseAudioReviewByFingerprint[audio.sha256]?.status).toMatch(
      /^(pending|accepted)$/,
    );
  }
});

it("meets the phonetic contract without sentence-count padding", () => {
  for (const lesson of baseSoundLessons) {
    expect(lesson.contract).toBe("phonetic");
    expect(lesson.contrastiveItemIds.length).toBeGreaterThanOrEqual(10);
    expect(lesson.contrastiveItemIds.length).toBeLessThanOrEqual(16);
    expect(lesson.audioExemplarIds.length).toBeGreaterThanOrEqual(6);
    expect(lesson.activities.filter((item) => item.mode === "non-spoken")).toHaveLength(6);
    expect(lesson.activities.filter((item) => item.interactionKind === "listening")).toHaveLength(1);
    expect(lesson.activities.filter((item) => item.interactionKind === "spoken")).toHaveLength(1);
  }
});
```

- [ ] **Step 2: Run sound tests to verify red**

Run:

```bash
npx vitest run src/course/base/audio/catalog.test.ts \
  src/course/base/content/module01Sounds.test.ts
```

Expected: FAIL with missing sound/audio catalogs.

- [ ] **Step 3: Author the four exact sound scopes**

Use these lesson allocations:

| Lesson | Canonical scope |
|---|---|
| `sounds-1` | five vowels, unvoiced gojuon rows, 46 basic modern hiragana, mora counting |
| `sounds-2` | dakuten/handakuten, voiced/unvoiced contrasts, `じ/ぢ` and `ず/づ` recognition without false equivalence claims |
| `sounds-3` | long vowels, small `っ`, moraic `ん`, timing contrasts |
| `sounds-4` | common yoon, small `ゃ/ゅ/ょ`, bounded practical katakana bridge |

Each lesson has 10-16 contrastive item IDs, 4-8 meaningful anchor words with
EN/IT meanings, at least six audio exemplars, six distinct non-spoken sound
activities, one listening identification, and one spoken/read-aloud activity.
Do not create sentence predicates for sound counts. State that pitch accent is
outside Base in both locales.

- [ ] **Step 4: Add checked-in PCM assets and immutable review metadata**

Use mono 44.1 kHz PCM WAV files with normalized peak below -1 dBFS. Record each
file's SHA-256, speaker/source note, represented mora sequence, and
`status: "pending"` in `reviewLedger.ts`. Task 13's independent content reviewer
adds reviewer attribution and changes a fingerprint to `accepted` only after
hearing that exact asset. The runtime validates URL and hash metadata but does
not ship reviewer notes in the browser chunk.

`baseAudioById` must expose localized failed/unavailable state IDs. Failure keeps
the kana, mora segmentation, meaning, and retry control visible; it never swaps
to browser TTS as canonical contrast evidence.

- [ ] **Step 5: Run sound tests and verify asset headers**

Run:

```bash
npx vitest run src/course/base/audio/catalog.test.ts \
  src/course/base/content/module01Sounds.test.ts
file public/audio/base/*.wav
```

Expected: PASS; `file` reports RIFF little-endian PCM for every asset.

- [ ] **Step 6: Commit the sound release slice**

```bash
git add src/course/base/audio src/course/base/content/module01Sounds.ts \
  src/course/base/content/module01Sounds.test.ts public/audio/base
git commit -m "feat: teach the complete Base sound system" \
  -m "Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>"
```

### Task 10: Author sentence anatomy and topic/question/nominal-particle modules

**Files:**
- Create: `src/course/base/content/module02SentenceFoundations.ts`
- Create: `src/course/base/content/module02SentenceFoundations.test.ts`
- Create: `src/course/base/content/module03TopicQuestions.ts`
- Create: `src/course/base/content/module03TopicQuestions.test.ts`
- Modify: `src/course/base/catalog/lexicon.ts`
- Modify: `src/course/base/catalog/concepts.ts`
- Modify: `src/course/base/catalog/firstTeach.ts`
- Modify: `src/course/base/copy/en.ts`
- Modify: `src/course/base/copy/it.ts`

- [ ] **Step 1: Write failing lesson-depth and ordering tests**

```ts
it.each([
  ["sentence-foundations-1", "system"],
  ["sentence-foundations-2", "system"],
  ["sentence-foundations-3", "system"],
  ["sentence-foundations-4", "system"],
  ["topic-questions-1", "system"],
  ["topic-questions-2", "system"],
  ["topic-questions-3", "system"],
  ["topic-questions-4", "content"],
] as const)("%s has its exact contract", (lessonId, contract) => {
  const earlyLessons = [...module02Lessons, ...module03Lessons];
  const lesson = new Map(
    earlyLessons.map((item) => [item.lessonId, item]),
  ).get(lessonId)!;
  expect(lesson.contract).toBe(contract);
  expect(validateBaseLessonDepth(lesson, earlyValidationCatalogs)).toEqual([]);
});

it("first-teaches affirmative desu before topic/question use", () => {
  expect(firstTeachByContentId["base-form-copula-desu"].lessonId).toBe(
    "sentence-foundations-3",
  );
  expect(
    validateFirstTeachOrder(
      [...module02Lessons, ...module03Lessons],
      firstTeachByContentId,
    ),
  ).toEqual([]);
});

it("limits no and avoids adjective forward use", () => {
  expect(module03ConceptIds).toContain("base-particle-no-possessive-attributive");
  expect(module03ConceptIds).not.toContain("base-concept-explanatory-no");
  expect(
    visibleJapaneseFor(
      [...module02Lessons, ...module03Lessons],
      earlyValidationCatalogs,
    ),
  ).not.toMatch(
    /んです|のです|たかい|しずか/,
  );
});
```

- [ ] **Step 2: Run the two module tests to verify red**

Run:

```bash
npx vitest run src/course/base/content/module02SentenceFoundations.test.ts \
  src/course/base/content/module03TopicQuestions.test.ts
```

Expected: FAIL because the lesson modules and copy entries do not exist.

- [ ] **Step 3: Author all eight lesson records**

System lessons receive 3-6 substantive new lexemes and 10-14 unique visible
worked examples with complete declared pattern cells. `topic-questions-4`
receives 8-12 new lexemes, 6-10 worked examples, and an additional coherent
4-8-turn clarification dialogue.

Every lesson includes:

```ts
{
  explanation: {
    mainCopyId,
    constructionCopyId,
    constraintsCopyId,
    commonErrorCopyId,
    nearestContrastId,
  },
  referenceSnapshotIds,
  prerequisiteLessonIds,
  recapCopyId,
}
```

Teach predicate-final chunks and recoverable omission without claiming Japanese
has no subjects. First-teach affirmative noun-predicate `です` in
`sentence-foundations-3`. Label verb/adjective predicate categories in the
anatomy reference, but do not show or assess their forms.

Teach `は`, focus/subject `が`, possessive/attributive `の`, additive `も`,
nominal/listing/companion `と`, and question `か` by sense. Keep explanatory
`の`, nominalizer `の`, and `んです` absent.

- [ ] **Step 4: Author natural EN/IT copy and dialogue translations**

Every explanation block, constraint, error, contrast, example translation,
dialogue purpose, activity instruction/feedback, and recap has independent EN
and IT text. Do not use one locale as fallback. Japanese and romaji remain
canonical and locale-independent.

- [ ] **Step 5: Run module, copy, and first-teach tests**

Run:

```bash
npx vitest run src/course/base/content/module02SentenceFoundations.test.ts \
  src/course/base/content/module03TopicQuestions.test.ts \
  src/course/base/catalog/firstTeach.test.ts src/course/i18n/validate.test.ts
```

Expected: PASS with no forward adjective or argument-particle use.

- [ ] **Step 6: Commit the early sentence system**

```bash
git add src/course/base/content/module02SentenceFoundations.ts \
  src/course/base/content/module02SentenceFoundations.test.ts \
  src/course/base/content/module03TopicQuestions.ts \
  src/course/base/content/module03TopicQuestions.test.ts \
  src/course/base/catalog src/course/base/copy
git commit -m "feat: teach Base sentence and topic foundations" \
  -m "Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>"
```

### Task 11: Author verb classes, licensed argument particles, and tense/polarity

**Files:**
- Create: `src/course/base/content/module04PoliteVerbs.ts`
- Create: `src/course/base/content/module04PoliteVerbs.test.ts`
- Create: `src/course/base/content/module05ArgumentParticles.ts`
- Create: `src/course/base/content/module05ArgumentParticles.test.ts`
- Create: `src/course/base/content/module06TimeMovement.ts`
- Create: `src/course/base/content/module06TimeMovement.test.ts`
- Modify: `src/course/base/catalog/lexicon.ts`
- Modify: `src/course/base/catalog/concepts.ts`
- Modify: `src/course/base/catalog/firstTeach.ts`
- Modify: `src/course/base/copy/en.ts`
- Modify: `src/course/base/copy/it.ts`

- [ ] **Step 1: Write failing sequencing and Japanese-correctness tests**

```ts
it("teaches classes before licensed arguments", () => {
  expect(BASE_CANONICAL_POSITIONS["polite-verbs-3"]).toBeLessThan(
    BASE_CANONICAL_POSITIONS["argument-particles-1"],
  );
  expect(
    validateFirstTeachOrder(
      [...module04Lessons, ...module05Lessons, ...module06Lessons],
      firstTeachByContentId,
    ),
  ).toEqual([]);
});

it("covers the four polite tense/polarity cells", () => {
  expect(
    module06Lessons.find((lesson) => lesson.lessonId === "time-movement-3")!
      .patternCellIds,
  ).toEqual([
    "verb-polite-nonpast-affirmative",
    "verb-polite-nonpast-negative",
    "verb-polite-past-affirmative",
    "verb-polite-past-negative",
  ]);
});

it("never glosses dynamic nonpast as ongoing present", () => {
  for (const example of module04to06ValidationCatalogs.examples) {
    if (example.predicateAspect === "dynamic" && example.form.tense === "nonpast") {
      expect(example.translationTags).not.toContain("ongoing-now");
      expect(example.reading).toMatch(/habitual|future/);
    }
  }
});
```

- [ ] **Step 2: Run module tests to verify red**

Run:

```bash
npx vitest run src/course/base/content/module04PoliteVerbs.test.ts \
  src/course/base/content/module05ArgumentParticles.test.ts \
  src/course/base/content/module06TimeMovement.test.ts
```

Expected: FAIL with unresolved modules.

- [ ] **Step 3: Author `polite-verbs`**

`polite-verbs-1..3` are system lessons with 3-6 new lexemes and 10-14 examples;
`polite-verbs-4` is content with 8-12 new lexemes and 6-10 examples plus a
4-8-turn practical dialogue. Cover dictionary lemma, godan/ichidan,
`する`/`くる`, explicit `-iru/-eru` exceptions, and polite stems. Use only known
topic/nominal chunks and recoverable omission before argument particles.

- [ ] **Step 4: Author `argument-particles` by licensing predicate**

All four lessons are system lessons with 3-6 lexemes and 10-14 examples.
Declare pattern cells for:

- transitive theme `を` and topicalized object `は`;
- motion goal `に` versus direction `へ`;
- action place and means `で`;
- mixed predicate-led selection.

Each example references a predicate sense whose `argumentParticleByRole`
licenses the visible particle. Never teach an atomic English-preposition list.

- [ ] **Step 5: Author `time-movement`**

Lessons 1-3 are system; lesson 4 is content with a separate 4-8-turn
schedule/movement dialogue. Teach dynamic nonpast only as habitual/future,
known stative predicates as present state, time `に` versus relative-time
omission, time/motion `から` and `まで`, then the exact four-cell polite grid.
Do not show `〜ています` before module 9.

- [ ] **Step 6: Run content, forms, licensing, and ordering tests**

Run:

```bash
npx vitest run src/course/base/content/module04PoliteVerbs.test.ts \
  src/course/base/content/module05ArgumentParticles.test.ts \
  src/course/base/content/module06TimeMovement.test.ts \
  src/course/base/forms src/course/base/catalog/firstTeach.test.ts
```

Expected: PASS with zero dynamic-ongoing nonpast glosses.

- [ ] **Step 7: Commit the verb/argument/tense system**

```bash
git add src/course/base/content/module04PoliteVerbs.ts \
  src/course/base/content/module04PoliteVerbs.test.ts \
  src/course/base/content/module05ArgumentParticles.ts \
  src/course/base/content/module05ArgumentParticles.test.ts \
  src/course/base/content/module06TimeMovement.ts \
  src/course/base/content/module06TimeMovement.test.ts \
  src/course/base/catalog src/course/base/copy
git commit -m "feat: teach Base verbs particles and tense" \
  -m "Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>"
```

### Task 12: Author copula/adjectives, existence/location, and bounded te constructions

**Files:**
- Create: `src/course/base/content/module07CopulaAdjectives.ts`
- Create: `src/course/base/content/module07CopulaAdjectives.test.ts`
- Create: `src/course/base/content/module08ExistenceLocation.ts`
- Create: `src/course/base/content/module08ExistenceLocation.test.ts`
- Create: `src/course/base/content/module09RequestsConnection.ts`
- Create: `src/course/base/content/module09RequestsConnection.test.ts`
- Modify: `src/course/base/catalog/lexicon.ts`
- Modify: `src/course/base/catalog/concepts.ts`
- Modify: `src/course/base/catalog/firstTeach.ts`
- Modify: `src/course/base/copy/en.ts`
- Modify: `src/course/base/copy/it.ts`

- [ ] **Step 1: Write failing scope and form tests**

```ts
it("first uses adjective tense/polarity only in module 7", () => {
  expect(firstTeachByContentId["base-form-i-adjective-negative"].lessonId).toBe(
    "copula-adjectives-3",
  );
  expect(
    visibleJapaneseFor(
      module02to06Lessons,
      module02to06ValidationCatalogs,
    ),
  ).not.toMatch(
    /くないです|かったです|ではありません/,
  );
});

it("keeps existence ni/ga in the existence module", () => {
  expect(firstTeachByContentId["base-particle-existence-ni"].lessonId).toBe(
    "existence-location-2",
  );
  expect(firstTeachByContentId["base-particle-existential-ga"].lessonId).toBe(
    "existence-location-2",
  );
});

it("bounds Base te constructions exactly", () => {
  expect(module09ConceptIds).toEqual(expect.arrayContaining([
    "base-form-te",
    "base-construction-te-kudasai",
    "base-construction-sequential-te",
    "base-construction-te-imasu",
  ]));
  expect(module09ConceptIds).not.toEqual(expect.arrayContaining([
    "permission-te-mo-ii",
    "prohibition-te-wa-ikenai",
    "conditional-tara",
  ]));
});
```

- [ ] **Step 2: Run module tests to verify red**

Run:

```bash
npx vitest run src/course/base/content/module07CopulaAdjectives.test.ts \
  src/course/base/content/module08ExistenceLocation.test.ts \
  src/course/base/content/module09RequestsConnection.test.ts
```

Expected: FAIL with unresolved modules.

- [ ] **Step 3: Author the adjective/copula grid**

All four lessons are system lessons with 3-6 new lexemes and 10-14 examples.
Review affirmative `です` from `sentence-foundations-3`; teach
`ではありません`, `でした`, `ではありませんでした`, then complete `い` and `な`
adjective grids. Every example is generated by Task 7 form functions.
Translations call polite `です` after an `い` adjective a politeness marker, not
copula `だ`. Include an error-diagnosis activity that rejects `たかいだ`.

- [ ] **Step 4: Author existence/location**

Lessons 1-3 are system; lesson 4 is content with a separate 4-8-turn
finding-place dialogue. Teach `ある` for inanimate and `いる` for animate,
`place に entity が ある/いる`, existence `に` versus action-place `で`, and
existential `が` versus topic `は`. Do not present English "have" as a universal
translation.

- [ ] **Step 5: Author bounded te form, requests, sequence, and `〜ています`**

`requests-connection-1`, `-3`, and `-4` are system; `-2` is content. Cover every
godan allomorph, ichidan, `する`, `くる`, and `いく -> いって`.
Teach `〜てください`, sequential `〜て`, and `〜ています` for bounded ongoing
actions and resulting/current states. `requests-connection-2` includes a
separate coherent 4-8-turn request/response dialogue.
`requests-connection-4` is the only Base lesson that may tag a dynamic predicate
`ongoing-now`; it also includes an additional coherent 4-8-turn exchange.

- [ ] **Step 6: Run all three module and form suites**

Run:

```bash
npx vitest run src/course/base/content/module07CopulaAdjectives.test.ts \
  src/course/base/content/module08ExistenceLocation.test.ts \
  src/course/base/content/module09RequestsConnection.test.ts \
  src/course/base/forms src/course/base/catalog/firstTeach.test.ts
```

Expected: PASS with no forward adjective use or excluded te construction.

- [ ] **Step 7: Commit predicates, existence, and te forms**

```bash
git add src/course/base/content/module07CopulaAdjectives.ts \
  src/course/base/content/module07CopulaAdjectives.test.ts \
  src/course/base/content/module08ExistenceLocation.ts \
  src/course/base/content/module08ExistenceLocation.test.ts \
  src/course/base/content/module09RequestsConnection.ts \
  src/course/base/content/module09RequestsConnection.test.ts \
  src/course/base/catalog src/course/base/copy
git commit -m "feat: complete Base predicate and te systems" \
  -m "Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>"
```

### Task 13: Author synthesis, Can-dos, the aggregate catalog, and the entry diagnostic

**Files:**
- Create: `src/course/base/content/module10Synthesis.ts`
- Create: `src/course/base/content/module10Synthesis.test.ts`
- Create: `src/course/base/content/catalog.ts`
- Create: `src/course/base/content/catalog.test.ts`
- Create: `src/course/base/catalog/catalog.ts`
- Modify: `src/course/base/catalog/canDos.ts`
- Create: `src/course/base/catalog/canDos.test.ts`
- Modify: `src/course/base/catalog/checkpoint.ts`
- Create: `src/course/base/diagnostic/model.ts`
- Create: `src/course/base/diagnostic/model.test.ts`
- Create: `src/course/base/review/naturalnessLedger.ts`
- Create: `src/course/base/review/naturalnessLedger.test.ts`
- Modify: `src/course/base/catalog/firstTeach.ts`
- Modify: `src/course/base/copy/en.ts`
- Modify: `src/course/base/copy/it.ts`

- [ ] **Step 1: Write failing synthesis, aggregate, and diagnostic tests**

```ts
it("makes all four synthesis lessons zero-new and cumulatively deep", () => {
  for (const lesson of baseSynthesisLessons) {
    expect(lesson.contract).toBe("synthesis");
    expect(lesson.newLexemeIds).toEqual([]);
    expect(lesson.introducedConceptIds).toEqual([]);
    expect(lesson.reviewLexemeIds.length).toBeGreaterThanOrEqual(12);
    expect(lesson.retrievedSystemIds.length).toBeGreaterThanOrEqual(4);
    expect(lesson.workedExampleIds.length).toBeGreaterThanOrEqual(6);
    expect(lesson.workedExampleIds.length).toBeLessThanOrEqual(10);
    expect(dialogueById[lesson.dialogueId!].turns.length).toBeGreaterThanOrEqual(4);
  }
});

it("assembles exactly forty lessons under the global lexicon cap", () => {
  expect(baseLessonContents.map((lesson) => lesson.lessonId)).toEqual(BASE_LESSON_IDS);
  expect(baseLexemes.length).toBeGreaterThan(0);
  expect(baseLexemes.length).toBeLessThanOrEqual(250);
  expect(validateBaseRecurrence(baseLessonContents)).toEqual({ ok: true });
});

it("keeps diagnostic results out of learning evidence", () => {
  const result = evaluateBaseDiagnostic(DIAGNOSTIC_RESPONSES);
  expect(result.recommendedLevel).toMatch(/^(a0|a1)$/);
  expect(result.recommendedModuleId).toMatch(/\S/);
  expect(JSON.stringify(result)).not.toMatch(
    /acceptedExercise|canDo|checkpoint|consolidatedAt/,
  );
});
```

- [ ] **Step 2: Run tests to verify red**

Run:

```bash
npx vitest run src/course/base/content/module10Synthesis.test.ts \
  src/course/base/content/catalog.test.ts \
  src/course/base/catalog/canDos.test.ts \
  src/course/base/diagnostic/model.test.ts
```

Expected: FAIL because synthesis, aggregate catalogs, Can-dos, and diagnostic
model do not exist.

- [ ] **Step 3: Author all four synthesis lessons**

Use these scenarios:

| Lesson | Required retrieval |
|---|---|
| `base-synthesis-1` | identity, noun/adjective description, topic continuity, recoverable omission |
| `base-synthesis-2` | routine/plan, licensed arguments, time `に`, `から/まで`, four tense/polarity cells |
| `base-synthesis-3` | existence/location, `に` versus `で`, request, sequential `て` |
| `base-synthesis-4` | all five references, verb classes, adjective/copula, existence, `〜ています`, mixed checkpoint interaction |

Each lesson has 6-10 unique visible examples, an additional 4-8-turn dialogue,
eight non-spoken activities spanning at least six categories with max two per
category, one listening-led activity, and one spoken activity.

- [ ] **Step 4: Assemble immutable aggregate catalogs and recurrence**

`baseLessonContents` concatenates modules 1-10 in manifest order and throws on a
missing, duplicate, or out-of-order ID. Index every lexeme, concept, example,
dialogue, activity, and copy ID with duplicate detection. Recurrence validates
each new lexeme in two later lessons, or two synthesis surfaces for late-module
items. Count meaningful sound anchors in the same unique lexeme cap.

- [ ] **Step 5: Author Base Can-dos and checkpoint**

Create one product-authored Can-do per module plus supporting Can-dos where a
lesson has distinct listening/interaction outcomes. Label them A1-performance
mechanics, never an official CEFR/JF level. `baseCheckpoint` samples all five
references and the four synthesis lessons, records observed evidence only, and
does not unlock A1.

- [ ] **Step 6: Implement the non-blocking diagnostic**

Use four scored dimensions with immutable IDs:

```ts
export type BaseDiagnosticDimension =
  | "mora-timing"
  | "sentence-anatomy"
  | "particle-sense"
  | "polite-verb-form";

export interface BaseDiagnosticResult {
  readonly recommendedLevel: "a0" | "a1";
  readonly recommendedModuleId: string;
  readonly dimensionResults: Readonly<Record<BaseDiagnosticDimension, boolean>>;
}
```

The evaluator is pure and stores no lesson/activity evidence. Skipping returns
`null`; a result only changes recommendation copy. All levels remain links.

- [ ] **Step 7: Obtain independent Japanese and canonical-audio sign-off**

Generate stable fingerprints for every visible Japanese example, dialogue turn,
prompt, accepted answer, and audio string/asset. Give the full fingerprinted
inventory to a fresh reviewer who did not author the content. The reviewer
checks naturalness, discourse continuity, register, particle/form correctness,
translation accuracy, and every canonical sound asset by listening.

Record only explicit accepted fingerprints with reviewer attribution and review
date in `naturalnessLedger.ts` and `audio/reviewLedger.ts`; unresolved entries
remain `pending`. Tests fail stale fingerprints after any Japanese, translation,
audio-byte, or represented-mora change. Reviewer prose findings are also kept
for Task 19's final whole-product content review.

- [ ] **Step 8: Run the complete Base catalog unit tests**

Run:

```bash
npx vitest run src/course/base/content src/course/base/catalog \
  src/course/base/forms src/course/base/references src/course/base/diagnostic \
  src/course/base/review src/course/base/audio
```

Expected: PASS for 10 modules, 40 lessons, lexicon <=250, recurrence, all
classification ranges, reference closure, diagnostic isolation, and zero
pending/stale Japanese or canonical-audio fingerprints.

- [ ] **Step 9: Commit the complete authored catalog**

```bash
git add src/course/base/content src/course/base/catalog \
  src/course/base/diagnostic src/course/base/copy src/course/base/review \
  src/course/base/audio/reviewLedger.ts
git commit -m "feat: assemble the complete Base curriculum" \
  -m "Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>"
```

### Task 14: Build Base view models, 8+2 practice, audio states, and leakage-safe rendering

**Files:**
- Create: `src/course/base/view/buildBaseLessonViewModel.ts`
- Create: `src/course/base/view/buildBaseLessonViewModel.test.ts`
- Create: `src/course/base/view/buildBasePracticeModel.ts`
- Create: `src/course/base/view/buildBasePracticeModel.test.ts`
- Create: `src/course/components/BaseLessonPage.tsx`
- Create: `src/course/components/BaseLessonPage.test.tsx`
- Create: `src/course/components/base/BaseLessonOverview.tsx`
- Create: `src/course/components/base/BaseVocabularySection.tsx`
- Create: `src/course/components/base/BaseExplanation.tsx`
- Create: `src/course/components/base/BaseWorkedExamples.tsx`
- Create: `src/course/components/base/BasePracticeSequence.tsx`
- Create: `src/course/components/base/BaseRecap.tsx`
- Create: `src/course/components/base/BaseListeningActivity.tsx`
- Create: `src/course/components/base/BaseAudioButton.tsx`
- Create: `src/course/components/base/BaseAudioButton.test.tsx`
- Create: `src/course/base/view/testHarness.tsx`
- Modify: `src/course/components/Exercise.tsx`
- Modify: `src/course/components/ExerciseView.tsx`

- [ ] **Step 1: Write failing view-model and leakage tests**

```ts
it.each(BASE_LESSON_IDS)("builds %s in EN/IT without fallback", (lessonId) => {
  for (const locale of ["en", "it"] as const) {
    const result = buildBaseLessonViewModel(lessonId, locale);
    expect(result.ok).toBe(true);
    if (!result.ok) continue;
    expect(result.model.sections).toEqual([
      "rule", "vocabulary", "grammar", "comparison", "explore", "recap",
    ]);
    if (result.model.contract === "phonetic") {
      expect(result.model.phoneticExplanation).not.toBe("");
      expect(result.model.contrastMap.items.length).toBeGreaterThan(0);
    } else {
      expect(result.model.explanation.constraints).not.toBe("");
      expect(result.model.explanation.commonError).not.toBe("");
      expect(result.model.referenceSnapshots.length).toBeGreaterThan(0);
    }
  }
});

it.each(BASE_LESSON_IDS)("builds the required practice for %s", (lessonId) => {
  const result = buildBasePracticeModel(lessonId);
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  const nonSpoken = result.model.activities.filter((item) => item.mode === "non-spoken");
  const contract = BASE_LESSON_MANIFEST[lessonId].contract;
  expect(nonSpoken.length).toBe(contract === "phonetic" ? 6 : 8);
  if (contract !== "phonetic") {
    expect(new Set(nonSpoken.map((item) => item.category)).size).toBeGreaterThanOrEqual(6);
    expect(Math.max(...categoryCounts(nonSpoken))).toBeLessThanOrEqual(2);
  }
  expect(result.model.activities.filter((item) => item.kind === "listening")).toHaveLength(1);
  expect(result.model.activities.filter((item) => item.kind === "spoken")).toHaveLength(1);
});

it("does not leak canonical answers before an attempt", () => {
  const { container } = renderBaseActivity("argument-particles-1", 0);
  const forbidden = canonicalAnswersForActivity("argument-particles-1", 0);
  const disclosed = [
    container.textContent ?? "",
    ...[...container.querySelectorAll("*")].flatMap((node) =>
      [...node.attributes].map((attribute) => attribute.value),
    ),
  ].join("\n");
  for (const answer of forbidden) expect(disclosed).not.toContain(answer);
});
```

- [ ] **Step 2: Run view/practice tests to verify red**

Run:

```bash
npx vitest run src/course/base/view src/course/components/BaseLessonPage.test.tsx
```

Expected: FAIL because Base builders and components are absent.

- [ ] **Step 3: Create the view test harness without answer-bearing markup**

`testHarness.tsx` exports `renderBaseActivity(lessonId, index)`,
`canonicalAnswersForActivity(lessonId, index)`, and `categoryCounts(activities)`.
The first renders the production component inside real locale/script/progress
providers. The second reads canonical answers directly from the authored
catalog for test comparison only and is imported exclusively by `*.test.tsx`;
production modules never import it. `categoryCounts` returns numeric counts in
taxonomy order.

- [ ] **Step 4: Build fail-closed localized view models**

`buildBaseLessonViewModel` resolves semantic values, canonical form tokens,
lexeme meanings, explanations, examples, dialogues, reference snapshots,
activity instructions, and recap copy. Return a structured error on every
missing ID:

```ts
export type BaseLessonViewModelResult =
  | { readonly ok: true; readonly model: BaseLessonViewModel }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | "unknown-lesson"
          | "missing-copy"
          | "unresolved-example"
          | "unresolved-reference"
          | "invalid-practice";
        readonly lessonId: string;
        readonly referenceId: string;
      };
    };
```

Cache immutable results by `(lessonId, locale)` in the component layer.

- [ ] **Step 5: Build deterministic 8+2 practice**

Map authored categories to existing exercise-engine prompt kinds where possible.
Listening receives an audio asset/utterance plus a meaning/form discrimination
prompt. Spoken uses the existing privacy/recognition state machine and records
an attempt only after an evaluated transcript; unavailable/denied uses
listen-and-self-check and never records acceptance automatically.

Activity IDs are content-independent and differ from every changed V4 activity.
Generated exercise fingerprints differ from worked examples and dialogue turns.
Review retrieval changes both category and target fingerprint.

- [ ] **Step 6: Render six stable sections and truthful audio failures**

Keep the stable section anchors:

```ts
["rule", "vocabulary", "grammar", "comparison", "explore", "recap"]
```

Render vocabulary, main explanation, construction, constraints/common error,
nearest contrast, progressive reference snapshot, 6-14 examples according to
contract, separate dialogue, staged 8+2 practice, and cumulative recap.
`BaseAudioButton` exposes localized idle/playing/stopped/unavailable/blocked/
failed states with a polite live region. Failure retains Japanese, meaning,
segmentation, and retry.

- [ ] **Step 7: Keep answers outside pre-attempt markup**

Pass opaque target IDs into DOM metadata. Keep canonical/accepted answers inside
event-handler closures and engine state; do not serialize them into props,
accessible names, descriptions, hidden nodes, `data-*`, or option IDs. Feedback
is created after submit. Speech expected transcripts do not render before
recording.

- [ ] **Step 8: Run Base views, exercises, speech, and leakage tests**

Run:

```bash
npx vitest run src/course/base/view \
  src/course/components/BaseLessonPage.test.tsx \
  src/course/components/base \
  src/course/components/Exercise.test.ts \
  src/course/speech
```

Expected: PASS across 40 lessons, both locales, audio error paths, speech
fallback, and pre-attempt leakage probes.

- [ ] **Step 9: Commit learner views and practice**

```bash
git add src/course/base/view src/course/components/BaseLessonPage.tsx \
  src/course/components/BaseLessonPage.test.tsx src/course/components/base \
  src/course/components/Exercise.tsx src/course/components/ExerciseView.tsx
git commit -m "feat: render deep Base lessons and practice" \
  -m "Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>"
```

### Task 15: Route lessons and references through total ownership and Base-local navigation

**Files:**
- Modify: `src/course/components/LessonPage.tsx`
- Modify: `src/course/components/LessonPage.navigation.test.ts`
- Modify: `src/course/components/LessonPage.render.test.ts`
- Modify: `src/course/components/LessonRail.tsx`
- Modify: `src/course/routing/lessonRouteResolution.ts`
- Modify: `src/course/routing/lessonRouteResolution.test.ts`
- Create: `src/course/components/BaseReferencePage.tsx`
- Create: `src/course/components/BaseReferencePage.test.tsx`
- Create: `src/course/components/BaseDiagnostic.tsx`
- Create: `src/course/components/BaseDiagnostic.test.tsx`
- Modify: `src/routing/routePaths.ts`
- Modify: `src/routing/routes.tsx`
- Modify: `src/routing/routes.test.tsx`

- [ ] **Step 1: Write failing owner, navigation, reference, and diagnostic route tests**

```ts
it("resolves rehomed lessons as Base and keeps previous/next Base-local", () => {
  const route = resolveOwnedLessonRoute("sounds", "sounds-1");
  expect(route).toMatchObject({ kind: "match", levelId: "a0" });
  expect(baseNeighbors("time-movement-4")).toEqual({
    previousLessonId: "time-movement-3",
    nextLessonId: "copula-adjectives-1",
  });
});

it("never defaults an unknown module to A1", () => {
  expect(resolveOwnedLessonRoute("unknown", "sounds-1")).toEqual({
    kind: "invalid",
    reason: "unknown-module",
  });
});

it("routes all five references and rejects an invalid through lesson", async () => {
  renderRoute("/riferimenti/base/particle-atlas?throughLessonId=topic-questions-2");
  expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(/particle/i);
  renderRoute("/riferimenti/base/particle-atlas?throughLessonId=not-real");
  expect(await screen.findByRole("alert")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run route tests to verify red**

Run:

```bash
npx vitest run src/course/components/LessonPage.navigation.test.ts \
  src/course/components/LessonPage.render.test.ts \
  src/course/routing/lessonRouteResolution.test.ts \
  src/course/components/BaseReferencePage.test.tsx \
  src/course/components/BaseDiagnostic.test.tsx
```

Expected: FAIL because module ownership remains binary and Base routes are
absent.

- [ ] **Step 3: Resolve module and lesson owners before route matching**

Replace `a2 ? a2 : a1` logic with:

```ts
const level = moduleOwner(moduleId ?? "");
if (level === null) return INVALID_UNKNOWN_MODULE;
const resolution = resolveLessonRoute(moduleId, lessonId, courseModulesByLevel[level]);
```

`resolveLessonRoute` validates the global alias registry before owner-specific
matching. A current lesson under the wrong module is invalid. An alias redirects
to its canonical module and owner. Base previous/next is calculated only from
the ordered Base list.

- [ ] **Step 4: Dispatch renderers and section lists by a total table**

```ts
const LESSON_RENDERER_BY_LEVEL: Readonly<Record<CourseLevelId, LessonRenderer>> = {
  a0: BaseLessonSection,
  a1: A1LessonSection,
  a2: A2LessonSection,
};
```

Base and A1 use the six stable sections; A2 remains four-section. Lesson copy,
module count, rail map link, and evidence all resolve from level runtime config.

- [ ] **Step 5: Add reference and diagnostic routes**

Add:

```ts
reference: "/riferimenti/base/:referenceId",
diagnostic: "/percorso/diagnostica-base",
```

The reference page uses real captions/headers and generated stacked cards. The
diagnostic is optional, skippable, keyboard/touch operable, and only writes the
separate `nihongo.course.baseDiagnostic` setting.

- [ ] **Step 6: Run routing and component tests**

Run:

```bash
npx vitest run src/course/components/LessonPage*.test.ts* \
  src/course/routing/lessonRouteResolution.test.ts \
  src/course/components/BaseReferencePage.test.tsx \
  src/course/components/BaseDiagnostic.test.tsx \
  src/routing
```

Expected: PASS for all owners, aliases, Base-local navigation, references, and
unknown-ID failures.

- [ ] **Step 7: Commit total lesson/reference routing**

```bash
git add src/course/components/LessonPage.tsx src/course/components/LessonPage*.test.ts* \
  src/course/components/LessonRail.tsx src/course/components/BaseReferencePage.tsx \
  src/course/components/BaseReferencePage.test.tsx \
  src/course/components/BaseDiagnostic.tsx \
  src/course/components/BaseDiagnostic.test.tsx \
  src/course/routing src/routing
git commit -m "feat: route Base lessons and references" \
  -m "Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>"
```

### Task 16: Complete A1 compatibility, localization chrome, responsive CSS, and runtime integration

**Files:**
- Modify: `src/course/a1/catalog/catalog.ts`
- Modify: `src/course/a1/catalog/checkpoint.ts`
- Modify: `src/course/a1/catalog/canDos.ts`
- Modify: `src/course/a1/catalog/validateA1.ts`
- Modify: `src/course/a1/curriculum/catalog.ts`
- Modify: `src/course/a1/areas.ts`
- Modify: `src/course/a1/runtimeCopy.ts`
- Modify: `src/course/base/releaseBaseline.test.ts`
- Modify: `src/course/data/course.ts`
- Modify: `src/course/i18n/types.ts`
- Modify: `src/course/i18n/en.ts`
- Modify: `src/course/i18n/it.ts`
- Modify: `src/course/course.css`
- Modify: `src/course/course.css.test.ts`
- Modify: `vite.config.ts`

- [ ] **Step 1: Write failing A1/A2 containment and UI contract tests**

```ts
it("retains exactly the 44 A1 scenario/synthesis lessons", () => {
  expect(A1_MODULE_IDS).toEqual([
    "introductions", "essential-questions", "actions", "routines",
    "past-negative", "places", "people", "descriptions", "shopping",
    "existence-needs", "capstones",
  ]);
  expect(a1LessonContents.map((lesson) => lesson.lessonId)).toEqual(A1_LESSON_IDS);
  expect(a1LessonContents).toHaveLength(44);
});

it("does not mutate A2 editorial content", () => {
  expect(sha256(a2GoldenBytes)).toBe(
    "6ce32b1fd05ead0c10f494549e090d1cf7328734e2cc9041635f320270b2b38f",
  );
});

it("provides complete three-level EN/IT chrome", () => {
  for (const locale of ["en", "it"] as const) {
    const copy = getCourseCopy(locale);
    expect(copy.courseLevels.base).not.toBe("");
    expect(copy.courseLevels.baseHeading).not.toBe("");
    expect(copy.baseLesson.audio.failed).not.toBe("");
    expect(copy.baseReferences.particleAtlas).not.toBe("");
  }
});
```

- [ ] **Step 2: Run containment and copy tests to verify red**

Run:

```bash
npx vitest run src/course/a1 src/course/i18n src/course/course.css.test.ts \
  src/course/base/releaseBaseline.test.ts
```

Expected: FAIL where A1 aggregate catalogs still import rehomed lessons and
three-level deep copy is incomplete. The Task 1 baseline test is still green at
this point because the physical A1 reduction happens in the next step.

- [ ] **Step 3: Remove Base ownership from A1 aggregates without rewriting scenarios**

Remove sound/foundation imports from A1 aggregate semantic and learner catalogs.
Update A1 Can-do/checkpoint membership, area membership, reports, and validator
fixed totals to 11 modules/44 lessons. Change Base-owned concepts in A1
scenario lessons from `introduced` to `reviewed/applied`; link their recap to
the relevant Base reference snapshot. Keep route IDs, scenario Japanese, and
scenario translations unchanged unless a stronger correctness validator
identifies a concrete defect.

Update `releaseBaseline.test.ts` after the split: derive the rehomed 20 from
`BASE_LESSON_IDS_BY_MODULE`, derive the retained 44 from the now-canonical
`A1_LESSON_IDS_BY_MODULE`, and assert their disjoint union still has 64 original
A1 route IDs. Keep the frozen V4 activity inventory and A2 hash/count locks.

- [ ] **Step 4: Complete typed EN/IT chrome**

Add Base selector/recommendation, map, section, explanation, reference,
diagnostic, activity, audio/speech, migration, historical-evidence, and error
copy to `CourseCopy`. Build-time locale validation compares key structure and
rejects empty strings/fallback identity. Keep canonical Japanese out of these
files.

- [ ] **Step 5: Implement 320px/200%/reduced-motion CSS**

Use one semantic reference table and generated stacked cards at the existing
mobile breakpoint. Ensure:

```css
.base-reference-grid,
.base-practice-sequence,
.base-dialogue,
.level-selector__options {
  min-width: 0;
}

@media (max-width: 40rem) {
  .base-reference-table { display: none; }
  .base-reference-cards { display: grid; }
}

@media (prefers-reduced-motion: reduce) {
  .base-progress,
  .base-activity { scroll-behavior: auto; transition: none; }
}
```

All controls inherit the existing 44px action target. Long Japanese/romaji and
EN/IT copy wrap without whole-page horizontal overflow.

- [ ] **Step 6: Split the Base catalog into its own Vite chunk**

Add a manual-chunk rule for `src/course/base/` before general course rules.
Do not import `validateBase.ts`, reports, naturalness ledger, or audio review
ledger from runtime modules.

- [ ] **Step 7: Run A1, A2 identity, copy, CSS, and production-bundle tests**

Run:

```bash
npx vitest run src/course/a1 src/course/a2/releaseIdentity.test.ts \
  src/course/a2/catalog/editorial.test.ts src/course/i18n \
  src/course/course.css.test.ts src/course/data/prodBundle.test.ts \
  src/course/base/releaseBaseline.test.ts
```

Expected: PASS with A1 11/44 and unchanged A2 golden hash.

- [ ] **Step 8: Commit compatibility and responsive integration**

```bash
git add src/course/a1 src/course/data/course.ts src/course/i18n \
  src/course/course.css src/course/course.css.test.ts \
  src/course/base/releaseBaseline.test.ts vite.config.ts
git commit -m "feat: integrate Base without changing A1 A2 routes" \
  -m "Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>"
```

### Task 17: Add the Base release validator, measured reports, prebuild order, and Pages bundle gate

**Files:**
- Create: `src/course/base/reports.ts`
- Create: `src/course/base/reports.test.ts`
- Create: `src/course/base/validateBase.ts`
- Create: `src/course/base/validateBase.test.ts`
- Create: `src/course/base/validation/mutationFixtures.ts`
- Create: `scripts/validateBaseRelease.ts`
- Create: `scripts/validateBaseRelease.test.ts`
- Modify: `src/course/data/runtimeShapeAssertion.ts`
- Modify: `package.json`
- Modify: `.github/workflows/deploy-pages.yml`
- Modify: `scripts/checkBundleBudget.ts` only if measured Base chunk growth exceeds the existing 500 KiB per-chunk budget after proper splitting

- [ ] **Step 1: Write failing validator mutation tests**

```ts
it.each([
  ["dynamic ongoing nonpast", mutateDynamicNonpastGloss, "dynamic-nonpast-ongoing"],
  ["i adjective copula da", mutateIAdjectiveDa, "i-adjective-copula-da"],
  ["particle without license", mutateParticleFrame, "unlicensed-particle"],
  ["system pattern gap", removePatternCell, "pattern-cell-missing"],
  ["duplicate visible target", duplicateVisibleTarget, "duplicate-visible-fingerprint"],
  ["answer metadata leak", leakAnswerDataAttribute, "pre-attempt-answer-leak"],
  ["stale audio review", changeReviewedAudioHash, "audio-review-stale"],
  ["unreviewed naturalness", changeReviewedJapanese, "naturalness-review-stale"],
] as const)("%s fails with %s", (_label, mutate, code) => {
  const result = validateBaseRelease(mutate(baseReleaseInput));
  expect(result.valid).toBe(false);
  expect(result.errors).toContainEqual(expect.objectContaining({ code }));
});
```

- [ ] **Step 2: Run validator tests to verify red**

Run:

```bash
npx vitest run src/course/base/validateBase.test.ts \
  scripts/validateBaseRelease.test.ts
```

Expected: FAIL because validator/report/script modules are absent.

- [ ] **Step 3: Build immutable one-defect mutation fixtures**

`mutationFixtures.ts` exports `baseReleaseInput` and the eight named mutation
functions used above. Each deep-clones the frozen release input and changes one
field only: gloss tag, adjective realization, licensed particle, pattern-cell
list, visible target, render-probe metadata, audio hash, or Japanese fingerprint.
Each fixture test first proves the unmodified release is valid, then proves the
mutation produces its one expected code without relying on error ordering.

- [ ] **Step 4: Implement additive whole-release validation**

Validate production catalogs and realized learner views for:

- exact 10/40 Base and 11/44 A1;
- global owner/route/alias uniqueness;
- explicit contract and lexeme/example/dialogue/activity ranges;
- <=250 meaningful lexemes and recurrence;
- every system pattern cell;
- first-teach/prerequisite closure;
- particle licensing and form-engine equality;
- dynamic nonpast/adjective/`の`/bounded-`て` hazards;
- five progressive references;
- visible fingerprints across examples/dialogues/activities;
- EN/IT and script parity;
- naturalness and canonical audio review-ledger freshness;
- pre-attempt DOM probe leakage;
- V5 migration inventory/evidence equality;
- Base runtime shape and unchanged A1/A2 identity.

Collect every structured error rather than stopping at the first.

- [ ] **Step 5: Produce real per-lesson and aggregate reports**

Each lesson report contains owner/contract, new/reviewed/recurring lexemes,
example/dialogue/activity fingerprints, explanation blocks, pattern cells,
reference entries, first-teach/prerequisite closure, locale/script render status,
and review fingerprints. Aggregate output includes distributions and unresolved
findings.

The script success line must include real values:

```ts
console.log(
  `validateBaseRelease: OK (errors=0; modules=${report.modules}; lessons=${report.lessons}; ` +
  `lexemes=${report.lexemes}; examples=${report.examples}; dialogueTurns=${report.dialogueTurns}; ` +
  `activities=${report.activities}; categories=${formatDistribution(report.categories)}; ` +
  `patternCells=${report.patternCells}; references=${report.referenceEntries}; ` +
  `reviewedAudio=${report.reviewedAudio}; unresolved=${report.unresolvedFindings}).`,
);
```

- [ ] **Step 6: Wire Base first in prebuild and bundle before upload**

Set:

```json
"prebuild": "vite-node scripts/validateBaseRelease.ts && vite-node scripts/validateA1Release.ts && vite-node scripts/validateA2Release.ts && vite-node scripts/lintA2NoJapanese.ts"
```

In Pages workflow, add after Build for Pages and before Configure/Upload:

```yaml
- name: Check bundle budget
  run: npm run check:bundle
```

The runtime imports only `assertBaseCourseShape`, not the heavy validator.

- [ ] **Step 7: Run validator scripts, strict types, build, and bundle**

Run:

```bash
npx vitest run src/course/base/validateBase.test.ts \
  src/course/base/reports.test.ts scripts/validateBaseRelease.test.ts
npx tsc --noEmit
npm run build
npm run check:bundle
```

Expected: all commands PASS; Base validator prints measured counts and every JS
chunk remains <=500 KiB unless an evidence-backed split-specific budget change
is committed.

- [ ] **Step 8: Commit release gates**

```bash
git add src/course/base/validateBase.ts src/course/base/validateBase.test.ts \
  src/course/base/validation/mutationFixtures.ts \
  src/course/base/reports.ts src/course/base/reports.test.ts \
  scripts/validateBaseRelease.ts scripts/validateBaseRelease.test.ts \
  src/course/data/runtimeShapeAssertion.ts package.json \
  .github/workflows/deploy-pages.yml scripts/checkBundleBudget.ts
git commit -m "build: gate the complete Base release" \
  -m "Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>"
```

### Task 18: Add complete Playwright behavior, accessibility, zoom, and visual acceptance

**Files:**
- Create: `tests/e2e/base-level.spec.ts`
- Create: `tests/e2e/base-accessibility.spec.ts`
- Create: `tests/e2e/base-visuals.spec.ts`
- Create: `tests/e2e/baseFixtures.ts`
- Create: `tests/e2e/base-visuals.spec.ts-snapshots/*.png`
- Modify: `tests/e2e/navigation.spec.ts`
- Modify: `tests/e2e/zoom-a11y.spec.ts`
- Modify: `tests/e2e/speech.spec.ts`
- Modify: `playwright.config.ts`

- [ ] **Step 1: Write failing fresh/returning/route smoke tests**

```ts
test("fresh learner defaults to Base and all levels stay open", async ({ page }) => {
  await gotoReady(page, "/nihongo-practice/#/percorso");
  await expect(page.locator('[data-level="a0"]')).toHaveAttribute("aria-current", "true");
  await expect(page.locator('[data-level="a1"]')).toBeEnabled();
  await expect(page.locator('[data-level="a2"]')).toBeEnabled();
});

for (const route of ALL_144_CURRENT_LESSON_ROUTES) {
  test(`route ${route} is reachable`, async ({ page }) => {
    await gotoReady(page, `/nihongo-practice/#${route}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
}
```

Add evidence-rich V4 localStorage setup and assert rehomed resume, retained A1
reachability, unchanged A2 evidence, historical activity help, and no drops.

- [ ] **Step 2: Run behavior tests to verify red**

Run:

```bash
npx playwright test tests/e2e/base-level.spec.ts --project=desktop-1440
```

Expected: FAIL before the complete Base routing/UI integration is present.

- [ ] **Step 3: Create deterministic E2E fixtures**

`baseFixtures.ts` exports `gotoReady`, `ALL_144_CURRENT_LESSON_ROUTES`, the
evidence-rich serialized V4 payload from Task 3, same-origin request recording,
body-overflow measurement, and screenshot state setup. Derive routes from the
three manifests rather than copying a second list; assert the derived length is
144 before defining smoke tests.

- [ ] **Step 4: Add keyboard, 320px, 200% zoom, and reduced-motion tests**

Test:

- keyboard-only level selection, reference navigation, every activity kind,
  listening retry, speech denial fallback, and diagnostic skip;
- 320x720 and 390x844 viewports;
- `page.evaluate(() => { document.documentElement.style.zoom = "2"; })`;
- no `scrollWidth > clientWidth` on body/document;
- 44x44 minimum bounding boxes;
- logical heading/tab order and polite live regions;
- generated stacked reference grids;
- reduced-motion computed styles.

- [ ] **Step 5: Add leakage and network assertions**

Before every representative activity attempt, inspect text, accessibility
snapshot, hidden nodes, and `data-*` attributes for canonical/alternative
answers. Assert all requests remain same-origin static assets and no audio or
speech data is uploaded.

- [ ] **Step 6: Capture required visual baselines**

Capture desktop/mobile, EN/IT, and script-mode variants where text flow changes
for:

- three-level selector and Base map;
- sentence anatomy;
- complete particle atlas;
- verb/conjugation and adjective/copula grids;
- dialogue and synthesis lessons;
- unchanged A1 and A2 lessons;
- audio unavailable/failure;
- migration notice.

Run:

```bash
npx playwright test tests/e2e/base-visuals.spec.ts --update-snapshots
```

Open every new PNG and judge hierarchy, density, readability, wrapping,
clipping, overflow, table/card equivalence, focus, status clarity, and whether
the surface visibly teaches the promised system. Record the verdict in the
independent review ledger from Task 19.

- [ ] **Step 7: Run the full fresh Playwright suite**

Run:

```bash
rm -rf test-results
npm run test:e2e
```

Expected: PASS with zero conditional skips. `test-results` contains no retained
failure artifacts.

- [ ] **Step 8: Commit acceptance tests and reviewed baselines**

```bash
git add tests/e2e playwright.config.ts
git commit -m "test: cover the complete Base learner journey" \
  -m "Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>"
```

### Task 19: Run fresh release gates, independent reviews, fixes, push, and open the PR

**Files:**
- Create: `docs/reviews/2026-08-06-base-pedagogy-review.md`
- Create: `docs/reviews/2026-08-06-base-content-review.md`
- Create: `docs/reviews/2026-08-06-base-code-quality-review.md`
- Modify: any files identified by fresh gates or independent findings

- [ ] **Step 1: Run all fresh local release gates**

Run in this exact order:

```bash
rm -rf dist test-results
npm test
npx tsc --noEmit
npm run build
npm run check:bundle
GITHUB_PAGES=true npm run build
npm run check:bundle
npm run test:e2e
git diff --check
```

Expected: every command PASS. Capture exact Vitest test-file/test counts,
Playwright project/test counts, Base validator counts/functions, chunk sizes,
and conditional skip count.

- [ ] **Step 2: Recheck immutable scope and clean generated artifacts**

Run:

```bash
test "$(git ls-files src/course/a2 | xargs shasum -a 256 | shasum -a 256 | cut -d' ' -f1)" = \
  "6222eb60ecabe583e491bf9ff44d68238bbbb2135947328245447ec48a242aa3"
test "$(shasum -a 256 src/course/a2/catalog/a2EditorialSurfaces.golden.json | cut -d' ' -f1)" = \
  "6ce32b1fd05ead0c10f494549e090d1cf7328734e2cc9041635f320270b2b38f"
git --no-pager diff --stat master...HEAD
git --no-pager status --short
```

Expected: both hash checks PASS. Remove only named generated directories such
as `dist/` and `test-results/` if untracked; do not remove source assets or
reviewed PNGs.

- [ ] **Step 3: Dispatch an independent whole-range pedagogy/spec review**

Give a fresh reviewer the spec, Base production catalogs, rendered reports,
reviewed PNGs, and these explicit dimensions: 40-lesson dependency sequence,
cognitive load, explanations, constraints, contrasts, progressive references,
active cumulative retrieval, activity taxonomy, synthesis, transition into A1,
open navigation, responsive hierarchy, and whether the product visibly teaches
the promised systems.

Write every finding with reviewer attribution, severity, evidence path/ID, and
resolution into
`docs/reviews/2026-08-06-base-pedagogy-review.md`. A machine-green result
does not replace this review.

- [ ] **Step 4: Dispatch an independent whole-range content review**

Give a second fresh reviewer every visible Japanese surface, accepted answer,
audio string/asset, EN/IT translation, hiragana/romaji realization, the
naturalness/audio ledgers, and representative rendered pages. Check discourse
and register, particles/forms, dynamic nonpast, adjective/copula, bounded te
scope, sound evidence, localization, leakage, accessibility wording, migration
help, A1 containment, and A2 immutability.

Write findings and resolutions into
`docs/reviews/2026-08-06-base-content-review.md`. Compare current fingerprints
with the accepted ledgers; changed content requires fresh acceptance.

- [ ] **Step 5: Dispatch an independent code-quality review**

Give a third fresh reviewer the complete `master...HEAD` diff and ask for
high-confidence bugs in total ownership, migration, canonical-source reuse,
error handling, type safety, leakage, accessibility, tests, bundle/runtime
boundaries, and A1/A2 scope.

Write findings and resolutions into
`docs/reviews/2026-08-06-base-code-quality-review.md`.

- [ ] **Step 6: Fix every blocker/high and resolve every medium**

For each finding:

1. write or identify a failing focused test;
2. run it red;
3. make the smallest coherent fix;
4. run it green plus affected suites;
5. ask the original reviewer to re-review the fix.

No pedagogical correctness, naturalness, evidence loss, leakage, or
accessibility finding may be waived. Commit fixes and review ledgers:

```bash
git add src scripts tests docs/reviews package.json .github
git commit -m "fix: resolve independent Base release findings" \
  -m "Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>"
```

- [ ] **Step 7: Re-run the complete fresh gate after review fixes**

Run the exact Step 1 command block again. Expected: all PASS with no stale
build, no conditional skip, no unreviewed fingerprint, and no worktree changes
except committed source.

- [ ] **Step 8: Push and open a clean PR against `master`**

Run:

```bash
git push -u origin unsafecode-implement-true-base-level
gh pr create --base master --head unsafecode-implement-true-base-level \
  --title "feat: add the complete Base curriculum" \
  --body-file /tmp/base-pr-body.md
```

The PR body contains:

- exact commit range `136fb9f..HEAD`;
- Base/A1/A2 module and lesson counts;
- lexicon/examples/dialogue/activity/reference/audio counts;
- progress V5 evidence-preservation results;
- Vitest/TypeScript/build/bundle/Playwright counts and zero skips;
- visual review verdict;
- independent reviewer attributions and resolved findings;
- A2 source/golden hashes;
- statement that merge/deploy is intentionally left to the coordinator.

- [ ] **Step 9: Verify pushed state and report evidence**

Run:

```bash
git status --short --branch
git rev-parse HEAD
git rev-parse origin/unsafecode-implement-true-base-level
gh pr view --json number,url,baseRefName,headRefName,state,isDraft
```

Expected: clean worktree, local and origin SHAs equal, open non-draft PR with
base `master`, and no merge/deploy action taken.
