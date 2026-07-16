# Phase 1 Sentence Families, Diversity Validation, and Lesson UX Foundations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the typed sentence-family, discourse, deterministic-practice, diversity-validation, reporting, and compact lesson-UX foundations required to author deep A1 and A2 curricula without changing the current public course inventory.

**Architecture:** A dependency-light `src/course/foundations` package owns level/Can-do/context/role/sense/family/variant semantics, pure family realization, deterministic practice selection, validation, and coverage reports. Representative A1 and A2 fixture lessons exercise every invariant and feed reusable matrix/guided/practice components through a compile-time-gated Playwright harness; the current 40-lesson release remains the public catalog until Phase 2 migrates A1.

**Tech Stack:** React 18, TypeScript 5.6, Vitest 3, existing deterministic exercise engine and romaji formatter/renderer, React Router 7, Playwright, Vite

---

## File structure

- Create `src/course/foundations/types.ts`: level, Can-do, role, context, sense, family, variant, practice-round, validation, and report contracts.
- Create `src/course/foundations/fixtures.ts`: representative A1/A2 semantic catalogs, lessons, invalid-fixture builders, and bilingual fixture copy IDs.
- Create `src/course/foundations/fixtures.test.ts`: reference, parity, no-literal-answer, and no-personal-alias checks.
- Modify `src/romaji/types.ts`: add the traceable `family` token-source domain.
- Modify `src/romaji/formatRomaji.test.ts`: prove family-sourced tokens retain the same boundary contract.
- Create `src/course/foundations/realizeFamily.ts`: pure rule registry and family/variant realizer.
- Create `src/course/foundations/realizeFamily.test.ts`: valid realization, semantic fingerprint, and every structured error.
- Create `src/course/foundations/selectVariants.ts`: deterministic constraint-aware selector and stable seeded ranking.
- Create `src/course/foundations/selectVariants.test.ts`: locale/order independence, reuse limits, transfer, and impossible-set errors.
- Create `src/course/foundations/practiceEngine.ts`: derive existing exercise prompts from realized tokens and selected target metadata.
- Create `src/course/foundations/practiceEngine.test.ts`: canonical answer, tile, blank, choice, transfer, and evaluation derivation.
- Create `src/course/foundations/validateFoundations.ts`: pure reference, depth, diversity, transfer, Can-do, sense, and verb-recurrence validation.
- Create `src/course/foundations/validateFoundations.test.ts`: one invalid fixture per structured error and stable ordering.
- Create `src/course/foundations/reports.ts`: machine-readable lesson/module/level reports and deterministic Markdown tables.
- Create `src/course/foundations/reports.test.ts`: exact coverage rows and stable serialization.
- Create `src/course/components/SentenceMatrix.tsx`: compact semantic list/table with role/context disclosure.
- Create `src/course/components/SentenceMatrix.test.ts`: initial subset, disclosure, labels, script/locale stability, and markup semantics.
- Create `src/course/components/FamilyGuidedConstruction.tsx`: one-family controlled axis comparison using shared realization data.
- Create `src/course/components/FamilyGuidedConstruction.test.ts`: valid boundary, highlight, and unavailable state.
- Create `src/course/components/PracticeRounds.tsx`: two labelled deterministic rounds rendered with existing exercise primitives.
- Create `src/course/components/PracticeRounds.test.ts`: round purpose/order, target metadata, controlled transfer, and error state.
- Create `src/course/foundations/FoundationFixturePage.tsx`: A1/A2 fixture harness composing matrix, guided construction, and rounds.
- Create `src/course/foundations/foundation.css`: responsive, accessible fixture/production-ready foundation styles.
- Modify `src/course/course.css`: import the focused foundation stylesheet.
- Modify `src/course/i18n/types.ts`: typed matrix/guided/round chrome.
- Modify `src/course/i18n/en.ts`: natural English foundation UX copy.
- Modify `src/course/i18n/it.ts`: equivalent Italian foundation UX copy.
- Modify `src/course/i18n/validate.test.ts`: exact new-key parity.
- Modify `src/routing/routes.tsx`: compile-time-gated fixture route only.
- Modify `src/vite-env.d.ts`: type `VITE_FOUNDATION_FIXTURES`.
- Modify `playwright.config.ts`: enable the fixture route only in the Playwright build.
- Create `tests/e2e/foundation-ux.spec.ts`: A1/A2 desktop/mobile disclosure, round, deterministic, accessibility, and overflow checks.
- Modify `src/routing/routes.test.ts`: prove the fixture route is absent from normal release route metadata.

### Task 1: Define semantic foundation catalogs and representative A1/A2 fixtures

**Files:**
- Create: `src/course/foundations/types.ts`
- Create: `src/course/foundations/fixtures.ts`
- Create: `src/course/foundations/fixtures.test.ts`
- Modify: `src/romaji/types.ts`
- Modify: `src/romaji/formatRomaji.test.ts`

- [ ] **Step 1: Write failing type/fixture reference tests**

Import the planned fixture exports and assert two explicit levels, aligned Can-do
metadata, structurally equivalent copy keys, and required lesson budgets:

```ts
expect(foundationCatalogs.levels.map((level) => level.id)).toEqual(["a1", "a2"]);
expect(foundationLessons.map((lesson) => lesson.level)).toEqual(["a1", "a2"]);
for (const lesson of foundationLessons) {
  expect(lesson.modelVariantIds).toHaveLength(8);
  expect(lesson.practice.roundOne.targetCount).toBe(5);
  expect(lesson.practice.roundTwo.targetCount).toBe(5);
  expect(lesson.primaryCanDoId).toBeTruthy();
  expect(lesson.supportingCanDoIds.length).toBeLessThanOrEqual(2);
}
expect(Object.keys(foundationCopy.en).sort()).toEqual(
  Object.keys(foundationCopy.it).sort(),
);
```

Scan serialized semantic data with `validateRuntimeAliases`, assert no Japanese
answer string is stored on `SentenceVariant` or practice definitions, and prove
every referenced level/Can-do/context/role/sense/family/variant ID resolves.

- [ ] **Step 2: Run fixture tests and confirm red**

Run: `npm test -- src/course/foundations/fixtures.test.ts`

Expected: FAIL because the foundation package does not exist.

- [ ] **Step 3: Define closed semantic contracts**

Create the foundation contracts:

```ts
export type CourseLevelId = "a1" | "a2";
export type LearningUse = "productive" | "receptive";
export type VariationAxis =
  | "speaker-person"
  | "predicate-verb"
  | "object"
  | "location"
  | "time"
  | "polarity-tense-form"
  | "context";
export type PedagogicalUse =
  | "model"
  | "guided"
  | "controlled-practice"
  | "transfer"
  | "spoken";

export interface DiscourseFrame {
  readonly speakerRoleId: string;
  readonly addresseeRoleId: string | null;
  readonly subjectReferentId: string | null;
  readonly subjectRealization: "explicit" | "omitted";
  readonly scenarioNoteCopyId: string;
}

export interface SentenceFamily {
  readonly id: string;
  readonly level: CourseLevelId;
  readonly canDoIds: readonly string[];
  readonly slotSchema: readonly SentenceSlotDefinition[];
  readonly permittedAxes: readonly VariationAxis[];
  readonly realizationRuleId: string;
  readonly requiredConceptIds: readonly string[];
}

export interface SentenceVariant {
  readonly id: string;
  readonly sentenceFamilyId: string;
  readonly discourse: DiscourseFrame;
  readonly contextId: string;
  readonly slotValues: Readonly<Record<string, string>>;
  readonly form: FormSelection;
  readonly pedagogicalUse: PedagogicalUse;
}

export interface CanDoEvidenceRule {
  readonly minimumPracticedLessons: number;
  readonly minimumAcceptedTransferTargets: number;
  readonly checkpointRequired: boolean;
}

export interface CourseLevel {
  readonly id: CourseLevelId;
  readonly alignmentLabelCopyId: string;
  readonly moduleIds: readonly string[];
  readonly canDoIds: readonly string[];
  readonly recommendedPrerequisiteCheckpointId: string | null;
}

export interface FoundationModule {
  readonly id: string;
  readonly level: CourseLevelId;
  readonly order: number;
}

export interface CheckpointDefinition {
  readonly id: string;
  readonly level: CourseLevelId;
  readonly sampledCanDoIds: readonly string[];
  readonly minimumAcceptedTransferTargets: number;
}

export interface LessonPositionRecord {
  readonly lessonId: string;
  readonly level: CourseLevelId;
  readonly moduleId: string;
  readonly canonicalPosition: number;
}

export interface CanDo {
  readonly id: string;
  readonly level: CourseLevelId;
  readonly domain:
    | "interaction"
    | "spoken-production"
    | "listening"
    | "reading"
    | "writing";
  readonly descriptorCopyId: string;
  readonly contextIds: readonly string[];
  readonly lessonIds: readonly string[];
  readonly checkpointEvidenceRule: CanDoEvidenceRule;
  readonly sourceNote?: "product-authored-jf-cefr-aligned";
}

export interface PersonRole {
  readonly id: string;
  readonly kind:
    | "persona"
    | "family"
    | "social"
    | "learner"
    | "unnamed";
  readonly labelCopyId: string;
}

export interface Referent {
  readonly id: string;
  readonly roleId: string;
  readonly animacy: "animate" | "inanimate";
}

export interface Context {
  readonly id: string;
  readonly labelCopyId: string;
}

export interface LearningTargetSense {
  readonly id: string;
  readonly lexemeId: string;
  readonly learningUse: LearningUse;
  readonly semanticFrameId: string;
  readonly predicate: boolean;
  readonly argumentRoles: readonly string[];
}

export interface SemanticValue {
  readonly id: string;
  readonly kind:
    | "referent"
    | "predicate-sense"
    | "object"
    | "location"
    | "time";
  readonly senseId?: string;
  readonly animacy?: "animate" | "inanimate";
  readonly tokens: readonly {
    readonly id: string;
    readonly jp: string;
    readonly romaji: string;
    readonly kind: RomajiTokenKind;
    readonly boundaryBefore?: RomajiBoundaryBefore;
    readonly reading?: string;
  }[];
}

export interface SentenceSlotDefinition {
  readonly id: string;
  readonly required: boolean;
  readonly valueKinds: readonly SemanticValue["kind"][];
  readonly variationAxis: VariationAxis;
  readonly requiredAnimacy?: "animate" | "inanimate";
}

export interface FormSelection {
  readonly tense: "nonpast" | "past";
  readonly polarity: "affirmative" | "negative";
}

export interface PracticeRoundDefinition {
  readonly id: string;
  readonly purpose: "guided-controlled" | "transfer";
  readonly candidateVariantIds: readonly string[];
  readonly selectionPolicyId: "balanced-v1";
  readonly exerciseKinds: readonly ExerciseKind[];
  readonly targetCount: number;
}

export interface LessonPracticeDefinition {
  readonly lessonId: string;
  readonly roundOne: PracticeRoundDefinition;
  readonly roundTwo: PracticeRoundDefinition;
}

export interface LessonDiversityConstraints {
  readonly exerciseCount: { readonly min: 8; readonly max: 12 };
  readonly modelCount: { readonly min: 8; readonly max: 12 };
  readonly minimumFamilies: number;
  readonly minimumPredicates: 3;
  readonly minimumRoles: 3;
  readonly minimumContexts: 2;
  readonly minimumUniqueVisibleTargets: 5;
  readonly maximumVisibleTargetReuse: 2;
  readonly minimumTransferTargets: 2;
  readonly requireControlledTransfer: true;
}

export interface FoundationLessonDefinition {
  readonly id: string;
  readonly level: CourseLevelId;
  readonly moduleId: string;
  readonly canonicalPosition: number;
  readonly primaryCanDoId: string;
  readonly supportingCanDoIds: readonly string[];
  readonly introducedConceptIds: readonly string[];
  readonly introducedSenseIds: readonly string[];
  readonly modelVariantIds: readonly string[];
  readonly guidedVariantIds: readonly [string, string];
  readonly spokenVariantId: string;
  readonly practice: LessonPracticeDefinition;
  readonly constraints: LessonDiversityConstraints;
}

export interface VerbUseRecord {
  readonly senseId: string;
  readonly lessonId: string;
  readonly moduleId: string;
  readonly canonicalPosition: number;
  readonly familyId: string;
  readonly variantId: string;
  readonly correctnessBearing: boolean;
  readonly introduction: boolean;
}

export interface FoundationCatalogs {
  readonly catalogVersion: string;
  readonly levels: readonly CourseLevel[];
  readonly modules: readonly FoundationModule[];
  readonly checkpoints: readonly CheckpointDefinition[];
  readonly lessonPositions: readonly LessonPositionRecord[];
  readonly canDos: readonly CanDo[];
  readonly roles: readonly PersonRole[];
  readonly referents: readonly Referent[];
  readonly contexts: readonly Context[];
  readonly senses: readonly LearningTargetSense[];
  readonly values: readonly SemanticValue[];
  readonly families: readonly SentenceFamily[];
  readonly variants: readonly SentenceVariant[];
  readonly copy: {
    readonly en: Readonly<Record<string, string>>;
    readonly it: Readonly<Record<string, string>>;
  };
}

export interface RealizedSentence {
  readonly familyId: string;
  readonly variantId: string;
  readonly tokens: readonly AssembledToken[];
  readonly canonicalJapanese: string;
  readonly visibleTargetKey: string;
  readonly semanticFingerprint: string;
  readonly predicateSenseId: string;
  readonly discourse: DiscourseFrame;
  readonly contextId: string;
  readonly pedagogicalUse: PedagogicalUse;
  readonly usedConceptIds: readonly string[];
  readonly usedLexemeSenseIds: readonly string[];
}
```

Import `ExerciseKind` from the existing exercise types and the romaji types from
`src/romaji/types.ts`. Define the Result/error/report interfaces beside the
operation that owns them in Tasks 2-4. Keep all fields readonly and
locale-independent.

Extend `TokenSourceRef["domain"]` with `"family"` and add a formatter test using
a family source to prove this is source traceability only, not new spacing logic.

- [ ] **Step 4: Author explicit representative fixture semantics**

Author one non-phonetic A1 lesson and one non-phonetic A2 lesson with eight model
variants and ten selected practice targets each. Use these stable fixture IDs:

```ts
export const FOUNDATION_FIXTURE_LESSON_IDS = [
  "fixture-a1-personal-details",
  "fixture-a2-routine-plans",
] as const;

export const foundationModules: readonly FoundationModule[] = [
  { id: "fixture-a1-module", level: "a1", order: 1 },
  { id: "fixture-a2-module", level: "a2", order: 1 },
];

export const foundationCheckpoints: readonly CheckpointDefinition[] = [
  {
    id: "fixture-a1-checkpoint",
    level: "a1",
    sampledCanDoIds: ["fixture-a1-can-do-personal-details"],
    minimumAcceptedTransferTargets: 2,
  },
  {
    id: "fixture-a2-checkpoint",
    level: "a2",
    sampledCanDoIds: ["fixture-a2-can-do-routine-plans"],
    minimumAcceptedTransferTargets: 2,
  },
];
```

The A1 fixture spans:

```text
families: topic-copular, residence-action, object-action
predicates: student/doctor/teacher identity, live, study/do
roles: learner, classmate, teacher, clerk
contexts: first-meeting, language-class, workplace
subject realization: explicit and naturally omitted
```

The A2 fixture spans:

```text
families: time-action, sequence-action, invitation-action
predicates: wake, meet, work, eat, go
roles: colleague, neighbor, friend, traveler
contexts: weekday-routine, after-work, weekend-plan
subject realization: explicit and naturally omitted
```

Use these model IDs in authored order:

| Fixture | Model variant IDs |
|---|---|
| A1 | `fixture-a1-yuki-student-meeting`, `fixture-a1-ken-doctor-meeting`, `fixture-a1-teacher-omitted-class`, `fixture-a1-yuki-live-rome`, `fixture-a1-classmate-live-milan`, `fixture-a1-yuki-study-japanese`, `fixture-a1-classmate-study-english`, `fixture-a1-omitted-work-company` |
| A2 | `fixture-a2-yuki-wake-weekday`, `fixture-a2-colleague-work-morning`, `fixture-a2-friend-meet-after-work`, `fixture-a2-omitted-eat-after-work`, `fixture-a2-neighbor-go-weekend`, `fixture-a2-traveler-go-tomorrow`, `fixture-a2-friend-invite-lunch`, `fixture-a2-colleague-invite-weekend` |

Use these unseen-combination transfer candidates:

```ts
const transferVariantIds = {
  a1: [
    "fixture-a1-transfer-ken-study-japanese",
    "fixture-a1-transfer-yuki-work-company",
    "fixture-a1-transfer-classmate-live-rome",
    "fixture-a1-transfer-omitted-study-english",
    "fixture-a1-transfer-teacher-do-work",
  ],
  a2: [
    "fixture-a2-transfer-neighbor-meet-after-work",
    "fixture-a2-transfer-colleague-go-tomorrow",
    "fixture-a2-transfer-friend-eat-weekend",
    "fixture-a2-transfer-omitted-invite-lunch",
    "fixture-a2-transfer-traveler-work-morning",
  ],
} as const;
```

Semantic values own lexical tokens such as `ゆき`, `がくせい`, `ローマ`,
`にほんご`, `べんきょうし`, `あした`, `ともだち`, and verb stems. Realization
rules own particles and endings. Variants store only semantic value IDs.

Define exact aligned Can-do fixture descriptors:

```text
EN A1: Exchange basic personal details in a short, supported conversation.
IT A1: Scambiare semplici informazioni personali in una breve conversazione guidata.
EN A2: Describe a familiar routine and make a simple plan with another person.
IT A2: Descrivere una routine familiare e fare un semplice programma con un'altra persona.
```

Use source note `"product-authored-jf-cefr-aligned"` and never certified language.

- [ ] **Step 5: Author practice and recurrence metadata without Japanese literals**

Each fixture lesson declares:

```ts
practice: {
  lessonId,
  roundOne: {
    id: `${lessonId}-round-1`,
    purpose: "guided-controlled",
    candidateVariantIds: [...],
    selectionPolicyId: "balanced-v1",
    exerciseKinds: ["choice", "completion", "tile-ordering"],
    targetCount: 5,
  },
  roundTwo: {
    id: `${lessonId}-round-2`,
    purpose: "transfer",
    candidateVariantIds: [...],
    selectionPolicyId: "balanced-v1",
    exerciseKinds: [
      "constrained-construction",
      "transformation",
      "completion",
    ],
    targetCount: 5,
  },
}
```

Add verb-use timelines for `study`, `work`, `meet`, and `go` with two distinct
introduction structures and two later recurrence records, one at least two
canonical positions later and one in a later module. The records reference
family/variant/sense IDs only.

Export deterministic indexes and strict lookup helpers used by later tasks:

```ts
export const foundationFamilyById = new Map(
  foundationCatalogs.families.map((family) => [family.id, family]),
);
export const foundationVariantById = new Map(
  foundationCatalogs.variants.map((variant) => [variant.id, variant]),
);

export function fixtureFamily(id: string): SentenceFamily {
  const family = foundationFamilyById.get(id);
  if (!family) throw new Error(`unknown fixture family ${id}`);
  return family;
}

export function fixtureVariant(id: string): SentenceVariant {
  const variant = foundationVariantById.get(id);
  if (!variant) throw new Error(`unknown fixture variant ${id}`);
  return variant;
}
```

- [ ] **Step 6: Run focused tests and commit**

Run:

```bash
npm test -- src/course/foundations/fixtures.test.ts src/romaji/formatRomaji.test.ts
npx tsc --noEmit
git diff --check
```

Expected: fixture/reference/parity tests PASS and TypeScript PASS.

Commit: `feat: define sentence foundation catalogs`

### Task 2: Implement pure family realization and semantic fingerprints

**Files:**
- Create: `src/course/foundations/realizeFamily.ts`
- Create: `src/course/foundations/realizeFamily.test.ts`

- [ ] **Step 1: Write failing valid-realization tests**

Realize fixture variants and assert tokens, Japanese, traceability, and stable
fingerprints:

```ts
const result = realizeVariant(
  fixtureFamily("fixture-a1-object-action"),
  fixtureVariant("fixture-a1-yuki-study-japanese"),
  foundationCatalogs,
);
expect(result).toMatchObject({
  ok: true,
  sentence: {
    canonicalJapanese: "ゆきはにほんごをべんきょうします",
    familyId: "fixture-a1-object-action",
    variantId: "fixture-a1-yuki-study-japanese",
    usedLexemeSenseIds: ["yuki-name", "japanese-language", "study-language"],
  },
});
if (result.ok) {
  expect(result.sentence.tokens.every((token) => token.source.domain === "family"))
    .toBe(true);
  expect(formatRomaji(result.sentence.tokens)).toMatchObject({
    ok: true,
    text: "yuki wa nihongo o benkyoushimasu",
  });
}
```

Assert the semantic fingerprint is identical when `slotValues` object insertion
order changes and differs when context, role, sense, family, or form changes.

- [ ] **Step 2: Write the structured error matrix**

Create one fixture per code:

```ts
export type FamilyRealizationErrorCode =
  | "missing-slot"
  | "illegal-axis-value"
  | "unmet-concept-requirement"
  | "incompatible-animacy"
  | "invalid-argument-structure"
  | "invalid-conjugation"
  | "unknown-sense"
  | "unresolved-discourse-reference"
  | "unknown-context"
  | "unknown-realization-rule";
```

Require deterministic error order: family/reference errors, discourse/context,
slots in schema order, form, then rule execution.

- [ ] **Step 3: Run realization tests and confirm red**

Run: `npm test -- src/course/foundations/realizeFamily.test.ts`

Expected: FAIL because `realizeFamily.ts` does not exist.

- [ ] **Step 4: Implement the rule registry and resolver**

Implement a pure registry for the fixture-ready reusable rules:

```ts
type RealizationRule = (
  resolved: ResolvedFamilyInput,
) => FamilyRealizationResult;

const RULES: Readonly<Record<string, RealizationRule>> = {
  "topic-copular-v1": realizeTopicCopular,
  "destination-action-v1": realizeDestinationAction,
  "object-action-v1": realizeObjectAction,
  "time-action-v1": realizeTimeAction,
  "sequence-action-v1": realizeSequenceAction,
  "invitation-action-v1": realizeInvitationAction,
};
```

Rules build `AssembledToken[]` from semantic values plus rule-owned
particle/morpheme tokens. Use `boundaryBefore` and `formatRomaji` validation;
never store canonical Japanese on variants. Omitted subjects produce no subject
or topic token while retaining discourse metadata.

- [ ] **Step 5: Generate stable semantic fingerprints**

Serialize a sorted semantic tuple, not object iteration order:

```ts
function semanticFingerprint(
  family: SentenceFamily,
  variant: SentenceVariant,
  predicateSenseId: string,
): string {
  const slots = Object.entries(variant.slotValues)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([slot, value]) => `${slot}=${value}`)
    .join("|");
  return [
    family.id,
    variant.discourse.speakerRoleId,
    variant.discourse.addresseeRoleId ?? "-",
    variant.discourse.subjectReferentId ?? "-",
    variant.discourse.subjectRealization,
    predicateSenseId,
    variant.contextId,
    variant.form.tense,
    variant.form.polarity,
    slots,
  ].join("::");
}
```

Expose a separate visible target key from normalized
`canonicalJapanese`; do not let different hidden semantics create a second
visible target.

- [ ] **Step 6: Run focused tests and commit**

Run:

```bash
npm test -- src/course/foundations/realizeFamily.test.ts src/course/foundations/fixtures.test.ts
npx tsc --noEmit
git diff --check
```

Expected: all realization/error/fingerprint tests PASS.

Commit: `feat: realize sentence family variants`

### Task 3: Implement deterministic target selection and realized-token exercise derivation

**Files:**
- Create: `src/course/foundations/selectVariants.ts`
- Create: `src/course/foundations/selectVariants.test.ts`
- Create: `src/course/foundations/practiceEngine.ts`
- Create: `src/course/foundations/practiceEngine.test.ts`

- [ ] **Step 1: Write failing deterministic-selection tests**

Select the same ordered targets after reversing candidates, rebuilding slot
objects, or changing locale:

```ts
const first = selectVariants(selectionInput({
  seed: "fixture-seed",
  candidates,
}));
const reordered = selectVariants(selectionInput({
  seed: "fixture-seed",
  candidates: [...candidates].reverse(),
}));
expect(first).toEqual(reordered);
expect(first).toEqual(selectVariants(selectionInput({ seed: "fixture-seed", candidates })));
```

Assert a different seed may alter tie order while all constraints still pass.
Assert no visible target is used more than twice and at least five visible
targets are selected across ten lesson exercises.

- [ ] **Step 2: Write failing constraint/error tests**

Cover:

```ts
export type VariantSelectionErrorCode =
  | "duplicate-candidate-id"
  | "unknown-candidate"
  | "insufficient-candidates"
  | "constraint-unsatisfied"
  | "missing-controlled-transfer"
  | "model-duplicate-transfer";
```

Fixtures must fail independently for family, role, predicate, context,
unique-visible-target, max-reuse, transfer-count, and controlled-transfer
constraints.

- [ ] **Step 3: Run selector tests and confirm red**

Run: `npm test -- src/course/foundations/selectVariants.test.ts`

Expected: FAIL because the selector does not exist.

- [ ] **Step 4: Implement stable ranking and bounded backtracking**

Normalize candidate order by ID, compute a deterministic FNV-1a rank from:

```text
catalogVersion | lessonId | roundId | seed | candidateId
```

Then use bounded backtracking over the ranked list to find the first complete
selection satisfying `LessonDiversityConstraints`. Validate constraints on the
final set before assigning exercise kinds. Return a typed error, never a partial
selection, if no solution exists.

- [ ] **Step 5: Write failing exercise-derivation tests**

From a `SelectedPracticeTarget` plus `RealizedSentence`, derive existing
`ExercisePrompt` shapes:

```ts
expect(generateFamilyExercise(choiceTarget, realized, "fixture-seed"))
  .toMatchObject({ ok: true, prompt: { kind: "choice" } });
expect(generateFamilyExercise(constructionTarget, realized, "fixture-seed"))
  .toMatchObject({
    ok: true,
    prompt: {
      kind: "constrained-construction",
      canonicalAnswer: realized.canonicalJapanese,
    },
  });
```

Prove tiles, blanks, options, and canonical answers derive only from realized
tokens. Evaluation must reuse `evaluateExercise` and accept canonical input
with optional whitespace while preserving assessed particles/forms.

- [ ] **Step 6: Implement the adapter to existing exercise primitives**

Convert a realized sentence to an in-memory `ExerciseExample`:

```ts
export function realizedExerciseExample(
  sentence: RealizedSentence,
): ExerciseExample {
  return {
    id: sentence.variantId,
    jp: sentence.canonicalJapanese,
    segments: sentence.tokens.map((token) => ({
      id: token.id,
      jp: token.jp,
      kind: token.kind === "morpheme" ? "ending" : token.kind === "lexical"
        ? "word" : token.kind,
      ...(token.reading ? { reading: token.reading } : {}),
    })),
    lexemeIds: sentence.usedLexemeSenseIds,
    conceptIds: sentence.usedConceptIds,
  };
}
```

Build reference-only exercise definitions from selected variant/token IDs and
pass them to the existing `generateExercise`/`evaluateExercise`. Deterministic
distractors come from other selected realized targets and must differ visibly.

- [ ] **Step 7: Run focused tests and commit**

Run:

```bash
npm test -- src/course/foundations/selectVariants.test.ts src/course/foundations/practiceEngine.test.ts src/course/exercises
npx tsc --noEmit
git diff --check
```

Expected: selector, generation, and evaluation tests PASS.

Commit: `feat: select deterministic family practice`

### Task 4: Implement diversity, transfer, recurrence, Can-do validation, and QA reports

**Files:**
- Create: `src/course/foundations/validateFoundations.ts`
- Create: `src/course/foundations/validateFoundations.test.ts`
- Create: `src/course/foundations/reports.ts`
- Create: `src/course/foundations/reports.test.ts`

- [ ] **Step 1: Write the complete failing validator matrix**

Define structured codes for the Phase 1 release boundary:

```ts
export type FoundationValidationErrorCode =
  | "missing-level-reference"
  | "missing-can-do-reference"
  | "missing-family-reference"
  | "missing-variant-reference"
  | "missing-role-reference"
  | "missing-context-reference"
  | "missing-sense-reference"
  | "invalid-copy-parity"
  | "invalid-model-count"
  | "insufficient-predicate-diversity"
  | "insufficient-role-diversity"
  | "insufficient-context-diversity"
  | "invalid-exercise-count"
  | "insufficient-unique-targets"
  | "target-reuse-exceeded"
  | "duplicate-semantic-target"
  | "insufficient-transfer"
  | "missing-controlled-transfer"
  | "transfer-duplicates-model"
  | "transfer-uses-unintroduced-content"
  | "productive-verb-introduction-structure"
  | "productive-verb-introduction-exercise"
  | "productive-verb-later-reuse"
  | "productive-verb-spaced-reuse"
  | "productive-verb-later-module"
  | "productive-verb-structure-reuse"
  | "receptive-use-insufficient-input"
  | "receptive-use-missing-comprehension"
  | "conflated-sense-context"
  | "can-do-primary-coverage"
  | "can-do-supporting-overflow"
  | "can-do-transfer-coverage"
  | "can-do-checkpoint-coverage"
  | "personal-alias-match";
```

Create one mutation-based fixture per code and assert exact deterministic error
objects, not only `valid: false`.

- [ ] **Step 2: Run validator tests and confirm red**

Run: `npm test -- src/course/foundations/validateFoundations.test.ts`

Expected: FAIL because the validator does not exist.

- [ ] **Step 3: Implement pure staged validation**

Validate in stable stages:

```text
1. duplicate/reference/copy/alias integrity
2. family realization and semantic fingerprints
3. per-lesson model diversity
4. practice selection, visible targets, reuse, and transfer tuples
5. learning-use/sense rules and verb recurrence
6. Can-do lesson/transfer/checkpoint coverage
7. report generation
```

Return every error in deterministic lesson/variant/code order. Do not mutate
input, omit invalid entries, or return success-shaped empty reports.

- [ ] **Step 4: Compute actual coverage reports**

Produce:

```ts
export interface LessonCoverageReport {
  readonly lessonId: string;
  readonly modelCount: number;
  readonly modelSemanticFingerprints: readonly string[];
  readonly familyIds: readonly string[];
  readonly variationAxes: readonly VariationAxis[];
  readonly productiveSenseIds: readonly string[];
  readonly receptiveSenseIds: readonly string[];
  readonly predicateSenseIds: readonly string[];
  readonly roleIds: readonly string[];
  readonly omittedSubjectCount: number;
  readonly contextIds: readonly string[];
  readonly exerciseCount: number;
  readonly visibleTargetCounts: Readonly<Record<string, number>>;
  readonly transferTargetIds: readonly string[];
  readonly primaryCanDoId: string;
  readonly supportingCanDoIds: readonly string[];
}
```

Aggregate `ModuleCoverageReport` and `LevelCoverageReport` from lesson rows; no
authored aggregate count is accepted.

- [ ] **Step 5: Render deterministic review tables**

Implement `foundationReportMarkdown(reports)` with stable sorted tables:

```text
| Lesson | Models | Families | Predicates | Roles | Contexts | Exercises | Unique targets | Max reuse | Transfers | Can-do |
```

Include verb recurrence and Can-do/checkpoint tables. Tests must assert complete
A1/A2 fixture rows and byte-identical output after input reordering.

- [ ] **Step 6: Run focused tests and commit**

Run:

```bash
npm test -- src/course/foundations/validateFoundations.test.ts src/course/foundations/reports.test.ts
npx tsc --noEmit
git diff --check
```

Expected: valid A1/A2 fixtures have no errors; every invalid mutation emits the
expected code; report tests PASS.

Commit: `feat: validate and report lesson diversity`

### Task 5: Build the compact matrix, guided boundary, two-round UX, and gated fixture harness

**Files:**
- Create: `src/course/components/SentenceMatrix.tsx`
- Create: `src/course/components/SentenceMatrix.test.ts`
- Create: `src/course/components/FamilyGuidedConstruction.tsx`
- Create: `src/course/components/FamilyGuidedConstruction.test.ts`
- Create: `src/course/components/PracticeRounds.tsx`
- Create: `src/course/components/PracticeRounds.test.ts`
- Create: `src/course/foundations/FoundationFixturePage.tsx`
- Create: `src/course/foundations/foundation.css`
- Modify: `src/course/course.css`
- Modify: `src/course/i18n/types.ts`
- Modify: `src/course/i18n/en.ts`
- Modify: `src/course/i18n/it.ts`
- Modify: `src/course/i18n/validate.test.ts`
- Modify: `src/routing/routes.tsx`
- Modify: `src/routing/routes.test.ts`
- Modify: `src/vite-env.d.ts`
- Modify: `playwright.config.ts`

- [ ] **Step 1: Write failing matrix component tests**

Render the A1 and A2 view models and assert:

```ts
expect(matrixRows(html)).toHaveLength(3);
expect(html).toContain('aria-expanded="false"');
expect(html).toContain('aria-controls="fixture-a1-personal-details-all-models"');
expect(html).toContain("first meeting");
expect(html).toContain("classmate");
expect(html).not.toContain("random");
```

After invoking the exported pure disclosure reducer/model, assert all eight
rows appear in authored order. Each row must contain adjacent Japanese,
romaji, translation, role, context, and omitted-subject label where applicable.
Use semantic `<ul>`/`<li>` or `<table>` markup; no horizontal-scroll-only access.

- [ ] **Step 2: Write failing guided/practice component tests**

Assert guided construction shows one family, active axis labels, initial/target
sentences from realized variants, and highlighted changed tokens through
`RomajiSequence`. Invalid realization shows the localized content notice.

For practice:

```ts
expect(roundHeadings(html)).toEqual([
  copy.foundation.roundOneTitle,
  copy.foundation.roundTwoTitle,
]);
expect(targetIds(html)).toHaveLength(10);
expect(transferIds(html)).toHaveLength(5);
expect(html).toContain('data-practice-purpose="transfer"');
expect(html).toContain('data-pedagogical-use="transfer"');
```

Round 2 must include a constrained-construction prompt and one additional
transfer kind. Target IDs/fingerprints are DOM metadata for tests/review, never
canonical answers.

- [ ] **Step 3: Run component tests and confirm red**

Run:

```bash
npm test -- src/course/components/SentenceMatrix.test.ts src/course/components/FamilyGuidedConstruction.test.ts src/course/components/PracticeRounds.test.ts
```

Expected: FAIL because the components do not exist.

- [ ] **Step 4: Implement the compact matrix**

`SentenceMatrix` owns only disclosure state. It receives a fully realized,
localized view model. Initial rows are the first three curated model IDs; the
button:

```tsx
<button
  type="button"
  className="action action--secondary sentence-matrix__toggle"
  aria-expanded={expanded}
  aria-controls={allModelsId}
  onClick={() => setExpanded((value) => !value)}
>
  {expanded ? copy.showFewer : copy.showAll}
</button>
```

Keep all row order deterministic across locale/script toggles; use variant IDs
as keys and no random selection in React.

- [ ] **Step 5: Implement guided construction and two practice rounds**

`FamilyGuidedConstruction` receives pre-realized initial/target sentences plus
declared changed token IDs and active axes. Validate both belong to the same
family before rendering; otherwise show `Notice`.

`PracticeRounds` receives the selector result and generated prompts. Render each
prompt through the existing `ExerciseView` and `exerciseState` primitives with
fixture-local token resolvers. Keep the two round headings and purposes outside
the exercise cards. A content error for either round renders a localized notice
and no partial round.

- [ ] **Step 6: Add bilingual UX copy**

Add typed `CourseCopy["foundation"]` strings:

```ts
foundation: {
  matrixTitle: string;
  matrixIntro: string;
  showAll: string;
  showFewer: string;
  speakerLabel: string;
  contextLabel: string;
  omittedSubject: string;
  guidedTitle: string;
  activeAxesLabel: string;
  roundOneTitle: string;
  roundOneIntro: string;
  roundTwoTitle: string;
  roundTwoIntro: string;
  transferLabel: string;
  unavailableTitle: string;
  unavailableBody: string;
}
```

Italian and English must be natural and structurally identical. Do not add
certification/mastery claims.

- [ ] **Step 7: Implement a compile-time-gated fixture page**

Compose the A1/A2 fixtures in `FoundationFixturePage`, selected only by the
fixture ID route parameter. Add:

```ts
const foundationFixturesEnabled =
  import.meta.env.VITE_FOUNDATION_FIXTURES === "true";
```

Only when true, register:

```tsx
<Route
  path="/__fixtures__/foundation/:fixtureId"
  element={<FoundationFixturePage />}
/>
```

Normal and Pages builds leave the route absent and continue redirecting it
through `InvalidRoute`. Type the env variable in `vite-env.d.ts`. Set
`VITE_FOUNDATION_FIXTURES: "true"` only in Playwright `webServer.env`.

- [ ] **Step 8: Add focused responsive/accessibility styles**

Use grid/list layouts that collapse to one column below `700px`, `min-width: 0`,
normal wrapping, existing 44px action controls, visible `:focus-visible`, and
`prefers-reduced-motion`-safe transitions. Do not require horizontal scrolling
or color-only transfer state.

- [ ] **Step 9: Run focused tests and commit**

Run:

```bash
npm test -- src/course/components/SentenceMatrix.test.ts src/course/components/FamilyGuidedConstruction.test.ts src/course/components/PracticeRounds.test.ts src/course/i18n/validate.test.ts src/routing/routes.test.ts
npx tsc --noEmit
npm run build
GITHUB_PAGES=true npm run build
git diff --check
```

Expected: component/copy/route tests and both builds PASS.

Commit: `feat: add deep lesson UX foundations`

### Task 6: Add desktop/mobile acceptance and complete the Phase 1 gate

**Files:**
- Create: `tests/e2e/foundation-ux.spec.ts`

- [ ] **Step 1: Add Playwright coverage for both fixture levels**

For A1 and A2 on both configured projects:

```ts
test("matrix disclosure and two rounds stay deterministic", async ({ page }) => {
  const observers = await setupPageObservers(page);
  await gotoReady(page, fixtureUrl("fixture-a1-personal-details"));
  await expect(page.locator(".sentence-matrix__row")).toHaveCount(3);
  await page.locator(".sentence-matrix__toggle").click();
  await expect(page.locator(".sentence-matrix__row")).toHaveCount(8);
  await expect(page.locator('[data-practice-purpose="transfer"]')).toBeVisible();
  await assertNoRuntimeErrors(page, observers);
  assertLocalOnlyNetwork(observers);
  await assertNoHorizontalOverflow(page);
});
```

Assert exact stable `data-variant-id` and `data-target-id` order before/after
English/Italian and hiragana/romaji setting changes. Assert at least five unique
visible Japanese targets, maximum reuse two, transfer tuples absent from model
fingerprints, and no canonical answer metadata.

- [ ] **Step 2: Add accessibility interaction checks**

Use keyboard-only interaction to:

```text
focus and activate matrix disclosure
reach every matrix row in reading order
operate one round-one choice/tile exercise
operate the round-two controlled-construction input
observe polite text feedback
return focus through Clear/retry controls
```

Run `auditTouchTargets`, verify disclosure `aria-expanded`/`aria-controls`, text
plus shape transfer labels, visible focus, reduced motion, and mobile wrapping.

- [ ] **Step 3: Prove release builds exclude the fixture route**

Add a Playwright/request check against a normal build without
`VITE_FOUNDATION_FIXTURES` in the unit routing test:

```ts
expect(foundationFixturesEnabledFor({})).toBe(false);
expect(foundationFixturesEnabledFor({
  VITE_FOUNDATION_FIXTURES: "true",
})).toBe(true);
```

The gate must run normal and Pages builds without the flag before Playwright's
flagged harness build.

- [ ] **Step 4: Generate and inspect QA reports**

In the report test, write no repository artifact. Print the deterministic
Markdown table only when `FOUNDATION_REPORT=1`:

```bash
FOUNDATION_REPORT=1 npm test -- src/course/foundations/reports.test.ts
```

Capture the A1/A2 rows in the task report and inspect actual family, role,
context, predicate, unique-target, reuse, transfer, Can-do, and recurrence
values.

- [ ] **Step 5: Run the complete Phase 1 verification gate**

Run:

```bash
npm test -- --reporter=dot
npx tsc --noEmit
npm run build
GITHUB_PAGES=true npm run build
npx playwright test
FOUNDATION_REPORT=1 npm test -- src/course/foundations/reports.test.ts
git diff --check
git status --short
```

Expected:

- full Vitest suite PASS;
- TypeScript PASS;
- normal and Pages builds PASS without the fixture route;
- full Playwright desktop/mobile suite PASS with the compile-time fixture flag;
- A1 and A2 report rows satisfy every Phase 1 depth invariant;
- no runtime/console/network/overflow/accessibility regressions;
- clean working tree after removing generated test output.

- [ ] **Step 6: Commit the Phase 1 acceptance tests**

Commit: `test: verify sentence foundation UX`

## Phase 1 self-review against the master specification

- **Scope boundary:** The plan introduces levels, Can-dos, sentence families,
  variants, discourse roles, contexts, learning use, realization, selection,
  validators, reports, and UX foundations without rewriting the release A1
  catalog or shipping A2 content.
- **Depth contract:** Both representative non-phonetic fixtures have eight
  models, at least three predicates, at least three roles, at least two contexts,
  ten exercises, at least five unique visible targets, maximum reuse two, and at
  least two transfer targets including controlled construction.
- **Natural discourse:** Roles and explicit/omitted subject metadata are semantic;
  Japanese variants do not force pronouns. IT/EN copy describes the same facts.
- **Learning-use and recurrence:** Productive/receptive senses and standalone verb
  timelines exercise every introduction/reuse rule without pretending the old
  release catalog already complies.
- **Shared source:** Variants contain semantic IDs only; realization owns Japanese
  tokens; comparison/matrix/guided/spoken/practice adapters receive realized
  sentences and do not copy canonical answers.
- **Determinism:** Candidate normalization, stable seeded ranking, bounded
  backtracking, and final constraint validation make selection independent of
  locale, browser, and object iteration order.
- **Transfer:** Semantic tuple/fingerprint comparison rejects model duplicates and
  unintroduced content; round two requires controlled construction plus another
  transfer target.
- **UX/accessibility:** Matrix disclosure, same-family guided boundary, two labelled
  rounds, keyboard/touch parity, semantic markup, visible focus, 44px controls,
  reduced motion, mobile wrapping, and no horizontal-only access are explicit.
- **Runtime failure:** Family/selection/generation errors are typed and render one
  localized notice without empty or substituted content.
- **Reports:** Stable lesson/module/level structures and Markdown tables expose
  actual families, roles, contexts, predicates, targets, reuse, transfer, Can-do,
  and recurrence data.
- **Release safety:** The fixture harness is compile-time gated and absent from
  normal/Pages builds; existing public routes/content/progress remain unchanged.
- **Placeholder scan:** The plan contains no deferred implementation markers,
  unspecified error handling, or unbounded “similar” steps.
- **Type consistency:** The same `CourseLevelId`, `SentenceFamily`,
  `SentenceVariant`, `RealizedSentence`, `LessonPracticeDefinition`,
  `LessonDiversityConstraints`, selection Result, and report names are used
  throughout.
- **Conservative ambiguity decision:** Phase 1 validates exactly two representative
  deep lessons plus standalone recurrence timelines. It does not apply 48/60
  lesson-count gates to the current release; those become mandatory when Phase 2
  and Phase 3 migrate full levels. This avoids falsely failing the still-public
  40-lesson catalog while proving every new invariant and error code now.
