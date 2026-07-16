# Phase 0 Semantic Romaji Boundaries Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace learner-facing romaji fragment concatenation with one validated semantic-boundary model so composed sentences render readable spaces while morphology and punctuation remain attached.

**Architecture:** A top-level `src/romaji` package defines semantic tokens, derives explicit boundaries at catalog/Lab adapters, formats immutable text/runs, and renders separators outside highlighted token wrappers. Existing course and Lab surfaces consume the shared formatter instead of joining strings or inventing CSS spacing; invalid sequences return a localized content-error state rather than concatenated fallback text.

**Tech Stack:** React 18, TypeScript 5.6, Vitest 3, React Router 7, Playwright, Vite

---

## File structure

- Create `src/romaji/types.ts`: semantic token, source, boundary, run, result, and structured error contracts.
- Create `src/romaji/formatRomaji.ts`: pure boundary derivation, sequence validation, and formatting.
- Create `src/romaji/formatRomaji.test.ts`: required particles, morphology, punctuation, long-vowel, and invalid-input matrix.
- Create `src/romaji/RomajiSequence.tsx`: shared sequence renderer that keeps separators outside token/highlight wrappers.
- Create `src/romaji/RomajiSequence.test.ts`: beginning/middle/end and mixed-highlight markup regressions.
- Modify `src/course/catalog/examples.ts`: distinguish punctuation from lexical words in authored segments.
- Modify `src/course/catalog/assembleCourse.ts`: convert catalog segments into semantic tokens, format full examples, and reject malformed content.
- Modify `src/course/data/types.ts`: carry semantic token metadata on runtime example segments.
- Modify `src/course/catalog/assembleCourse.test.ts`: prove all assembled examples satisfy the boundary contract.
- Modify `src/course/catalog/curriculum.test.ts`: retain kana/reading and long-vowel invariants under the semantic token model.
- Modify `src/course/components/TransformComparison.tsx`: render romaji through `RomajiSequence`.
- Modify `src/course/components/TransformComparison.test.ts`: prove readable comparison text and highlight-safe separators.
- Modify `src/course/components/GuidedTransformation.tsx`: adapt authored and Lab endpoints to semantic tokens and shared rendering.
- Modify `src/course/components/GuidedTransformation.test.ts`: prove `tabemasu`, particles, and highlighted boundaries.
- Modify `src/lab/engine/japanese.ts`: expose semantic tokens for Lab sentences.
- Modify `src/lab/engine/assemble.ts`: use the shared formatter for whole-sentence romaji.
- Modify `src/lab/engine/assemble.test.ts`: prove morphology attachment and lexical/particle spacing.
- Modify `src/lab/components/Board.tsx`: use the shared renderer for full sentence lines while keeping chips isolated.
- Modify `src/lab/components/Lab.render.test.ts`: prove learner-facing Lab output uses semantic spacing.
- Modify `src/course/components/lessonExerciseModel.ts`: return resolved semantic tokens, not only romaji fragments.
- Modify `src/course/components/ExerciseView.tsx`: use shared sequence rendering for sentence contexts, placed sentence tiles, and transformation sources.
- Modify `src/course/components/LessonExercises.tsx`: pass semantic-token resolvers into the exercise view.
- Modify `src/course/components/LessonExercises.test.ts`: cover choice/completion/source/placed-tile romaji.
- Modify `src/course/components/spokenAttemptModel.ts`: preserve boundary metadata and derive target romaji with the formatter.
- Modify `src/course/components/SpokenAttempt.tsx`: render the spoken target as one semantic sequence.
- Modify `src/course/components/spokenAttemptModel.test.ts`: prove full target formatting and structured failure.
- Modify `src/course/components/SpokenAttempt.test.ts`: prove visible spoken-target spacing.
- Modify `src/course/i18n/types.ts`: add one generic course-content formatting error string.
- Modify `src/course/i18n/en.ts`: add natural English content-error copy.
- Modify `src/course/i18n/it.ts`: add equivalent natural Italian content-error copy.
- Modify `src/course/i18n/validate.test.ts`: prove IT/EN structural parity for the new copy.
- Modify `tests/e2e/navigation.spec.ts`: verify comparison, guided, exercises, spoken target, and Lab romaji in the built app.

### Task 1: Define and validate semantic romaji tokens

**Files:**
- Create: `src/romaji/types.ts`
- Create: `src/romaji/formatRomaji.ts`
- Create: `src/romaji/formatRomaji.test.ts`

- [ ] **Step 1: Write the failing formatter regression matrix**

Create focused fixtures with explicit token sources and assert the normative output:

```ts
const token = (
  id: string,
  jp: string,
  romaji: string,
  kind: RomajiTokenKind,
  boundaryBefore: RomajiBoundaryBefore,
): AssembledToken => ({
  id,
  jp,
  romaji,
  kind,
  boundaryBefore,
  source: { domain: "test", referenceId: id },
});

expect(
  formatRomaji([
    token("w1", "これ", "kore", "lexical", "attach"),
    token("p1", "は", "wa", "particle", "space"),
    token("w2", "コーヒー", "koohii", "lexical", "space"),
    token("m1", "です", "desu", "morpheme", "space"),
    token("p2", "か", "ka", "particle", "space"),
  ]),
).toMatchObject({ ok: true, text: "kore wa koohii desu ka" });

expect(
  formatRomaji([
    token("w1", "たべ", "tabe", "lexical", "attach"),
    token("m1", "ます", "masu", "morpheme", "attach"),
  ]),
).toMatchObject({ ok: true, text: "tabemasu" });

expect(
  formatRomaji([
    token("w1", "ゆき", "yuki", "lexical", "attach"),
    token("p1", "は", "wa", "particle", "space"),
    token("w2", "いき", "iki", "lexical", "space"),
    token("m1", "ます", "masu", "morpheme", "attach"),
    token("x1", "。", ".", "punctuation", "attach"),
  ]),
).toMatchObject({ ok: true, text: "yuki wa ikimasu." });
```

Add cases for `へ -> e`, katakana `koohii`, empty romaji, a first token with `space`, an unresolved empty source reference, punctuation with `space`, and duplicate token IDs.

- [ ] **Step 2: Run the formatter test and confirm red**

Run: `npm test -- src/romaji/formatRomaji.test.ts`

Expected: FAIL because `types.ts` and `formatRomaji.ts` do not exist.

- [ ] **Step 3: Implement the immutable contracts**

Define the source and formatting contracts exactly once:

```ts
export type RomajiBoundaryBefore = "space" | "attach";
export type RomajiTokenKind =
  | "lexical"
  | "particle"
  | "morpheme"
  | "punctuation";

export interface TokenSourceRef {
  readonly domain: "catalog" | "lab" | "exercise" | "speech" | "test";
  readonly referenceId: string;
}

export interface AssembledToken {
  readonly id: string;
  readonly jp: string;
  readonly romaji: string;
  readonly kind: RomajiTokenKind;
  readonly boundaryBefore: RomajiBoundaryBefore;
  readonly source: TokenSourceRef;
  readonly reading?: string;
}

export interface RomajiRun {
  readonly tokenId: string;
  readonly separatorBefore: "" | " ";
  readonly text: string;
}

export type RomajiFormatErrorCode =
  | "empty-sequence"
  | "empty-romaji"
  | "invalid-first-boundary"
  | "unresolved-token"
  | "illegal-punctuation-spacing"
  | "duplicate-token-id";

export interface RomajiFormatError {
  readonly code: RomajiFormatErrorCode;
  readonly tokenId?: string;
}

export type RomajiFormatResult =
  | { readonly ok: true; readonly text: string; readonly runs: readonly RomajiRun[] }
  | { readonly ok: false; readonly errors: readonly RomajiFormatError[] };
```

- [ ] **Step 4: Implement explicit boundary derivation and pure formatting**

Keep semantic defaults in one function and require the adapter to pass sequence position:

```ts
export function boundaryBefore(
  kind: RomajiTokenKind,
  index: number,
  override?: RomajiBoundaryBefore,
): RomajiBoundaryBefore {
  if (override) return override;
  if (index === 0) return "attach";
  return kind === "morpheme" || kind === "punctuation" ? "attach" : "space";
}

export function formatRomaji(
  tokens: readonly AssembledToken[],
): RomajiFormatResult {
  const errors = validateRomajiTokens(tokens);
  if (errors.length > 0) return { ok: false, errors };
  const runs = tokens.map((item, index) => ({
    tokenId: item.id,
    separatorBefore:
      index > 0 && item.boundaryBefore === "space" ? (" " as const) : ("" as const),
    text: item.romaji,
  }));
  return {
    ok: true,
    text: runs.map((run) => run.separatorBefore + run.text).join(""),
    runs,
  };
}
```

Validation must accumulate deterministic errors in token order. The first token must be `attach`; punctuation must be `attach`; every token needs non-empty `id`, `jp`, `romaji`, and `source.referenceId`; IDs must be unique.

- [ ] **Step 5: Run focused tests and commit**

Run:

```bash
npm test -- src/romaji/formatRomaji.test.ts
npx tsc --noEmit
git diff --check
```

Expected: formatter tests PASS, TypeScript PASS, and no whitespace errors.

Commit: `feat: define semantic romaji boundaries`

### Task 2: Assemble catalog and Lab sentences through the formatter

**Files:**
- Modify: `src/course/catalog/examples.ts`
- Modify: `src/course/catalog/assembleCourse.ts`
- Modify: `src/course/data/types.ts`
- Modify: `src/course/catalog/assembleCourse.test.ts`
- Modify: `src/course/catalog/curriculum.test.ts`
- Modify: `src/lab/engine/japanese.ts`
- Modify: `src/lab/engine/assemble.ts`
- Modify: `src/lab/engine/assemble.test.ts`

- [ ] **Step 1: Write failing catalog assembly tests**

Add assertions against real shared examples:

```ts
expect(assembledExamples["essential-questions-1-changed"].romaji).toBe(
  "kore wa koohii desu ka",
);
expect(assembledExamples["actions-1-base"].romaji).toContain("tabemasu");
expect(assembledExamples["capstone-4-say"].romaji).toMatch(/\.$/);

for (const example of Object.values(assembledExamples)) {
  expect(example.segments?.every((segment) => segment.boundaryBefore)).toBe(true);
  expect(example.segments?.every((segment) => segment.tokenKind)).toBe(true);
}
```

`essential-questions-1-changed` is the current stable example ID for
`これはコーヒーですか`; use it directly so a catalog rename cannot weaken the
regression.

- [ ] **Step 2: Run catalog tests and confirm red**

Run: `npm test -- src/course/catalog/assembleCourse.test.ts src/course/catalog/curriculum.test.ts`

Expected: FAIL because runtime segments do not carry semantic token metadata and examples still concatenate romaji.

- [ ] **Step 3: Author semantic boundaries for ambiguous endings and punctuation**

Extend the catalog-only raw segment with explicit semantic metadata:

```ts
type SegmentKind = "word" | "particle" | "ending" | "punctuation";
interface RawSegment {
  readonly jp: string;
  readonly kind: SegmentKind;
  readonly boundaryBefore?: RomajiBoundaryBefore;
  readonly reading?: string;
}

const e = (jp: string): RawSegment => ({
  jp,
  kind: "ending",
  boundaryBefore: "attach",
});
const standalonePredicate = (jp: string): RawSegment => ({
  jp,
  kind: "ending",
  boundaryBefore: "space",
});
const stop = (): RawSegment => ({
  jp: "。",
  kind: "punctuation",
  boundaryBefore: "attach",
});
```

Replace `e("です")` with `standalonePredicate("です")` and
`e("ください")` with `standalonePredicate("ください")`. Split the two existing
composite segments so every visible boundary is represented between tokens:

```ts
// e("たいです")
e("たい"), standalonePredicate("です")

// e("ましょうか")
e("ましょう"), p("か")
```

The helper assigning stable within-example IDs continues to assign IDs after
the split. Speech prompt segment references are derived from the examples, so
they incorporate the added segment deterministically; comparison deltas are
also derived and continue to reference the generated IDs.

Extend the runtime shape without forcing exercise catalog fixtures to author derived fields:

```ts
export interface ExampleSegment {
  readonly id?: string;
  readonly jp: string;
  readonly romaji: string;
  readonly kind: "word" | "particle" | "ending" | "punctuation";
  readonly tokenKind: RomajiTokenKind;
  readonly boundaryBefore: RomajiBoundaryBefore;
  readonly source: TokenSourceRef;
  readonly reading?: string;
}
```

- [ ] **Step 4: Adapt catalog segments and fail closed**

Map authored kinds as follows:

```ts
function semanticKind(kind: CurriculumExampleSegment["kind"]): RomajiTokenKind {
  if (kind === "particle") return "particle";
  if (kind === "ending") return "morpheme";
  if (kind === "punctuation") return "punctuation";
  return "lexical";
}
```

The first segment always derives `attach`; later lexical words and particles
derive `space`; later endings require the authored override from Step 3 and
otherwise derive `attach`; punctuation derives `attach`. Preserve `は -> wa`,
`へ -> e`, and `kanaToRomaji` unchanged. Format the complete runtime example
and throw `CourseAssemblyError` with
`romaji:<exampleId>:<error-code>` entries if formatting fails.

This produces `gakusei desu`, `misete kudasai`, `ikitai desu`,
`ikimashou ka`, and `tabemasu` without relying on a string allowlist in the
adapter. `あります` and `います` remain verb stems plus attached polite
morphology in their existing authored structure, so they format as one word.

- [ ] **Step 5: Write failing Lab formatting tests**

Use the existing Lab fixtures and assert both ordinary and punctuation-free sentences:

```ts
expect(buildJapaneseSentence(selection).sentence.romaji).toBe(
  "kyō rāmen o tabemasu",
);
expect(
  formatRomaji(buildJapaneseSentence(selection).tokens),
).toMatchObject({ ok: true });
```

Also assert that the verb stem token and suffix token are adjacent runs with an empty separator, while a particle run has `" "`.

- [ ] **Step 6: Expose Lab semantic tokens and reuse the formatter**

Add `tokens: readonly AssembledToken[]` to `JapaneseSentenceModel`. Create lexical tokens for times, slots, and verb stems; particle tokens for particles; morpheme tokens for suffixes. `assembleJP` must keep the current Japanese assembly and call `formatRomaji` for romaji:

```ts
const formatted = formatRomaji(tokens);
if (!formatted.ok) {
  throw new Error(
    `invalid Lab romaji: ${formatted.errors.map((error) => error.code).join(",")}`,
  );
}
return { jp, romaji: formatted.text };
```

Do not change the Lab's existing macron-bearing authored values such as `kyō`; Phase 0 preserves each source's current long-vowel policy and changes boundaries only.

- [ ] **Step 7: Run focused tests and commit**

Run:

```bash
npm test -- src/romaji src/course/catalog/assembleCourse.test.ts src/course/catalog/curriculum.test.ts src/lab/engine
npx tsc --noEmit
git diff --check
```

Expected: all focused tests PASS and TypeScript PASS.

Commit: `feat: assemble romaji from semantic tokens`

### Task 3: Add the shared highlight-safe sequence renderer

**Files:**
- Create: `src/romaji/RomajiSequence.tsx`
- Create: `src/romaji/RomajiSequence.test.ts`
- Modify: `src/course/i18n/types.ts`
- Modify: `src/course/i18n/en.ts`
- Modify: `src/course/i18n/it.ts`
- Modify: `src/course/i18n/validate.test.ts`

- [ ] **Step 1: Write failing renderer tests**

Render a mixed sequence and prove separators are sibling text nodes outside marks:

```ts
const html = renderToStaticMarkup(
  <RomajiSequence
    tokens={tokens}
    highlightedTokenIds={new Set(["p1", "w2", "p2"])}
    classNameForHighlight="delta"
    errorText="Content unavailable"
  />,
);

expect(html).toContain('kore <mark class="delta">wa</mark> <mark');
expect(html).toContain('</mark> <mark class="delta">ka</mark>');
expect(html).not.toContain('<mark class="delta"> wa');
```

Add table-driven beginning, middle, end, mixed highlighted/unhighlighted, morphology, punctuation, and isolated single-token cases. Invalid input must render `role="alert"` with the supplied localized error text and never concatenate the invalid fragments.

- [ ] **Step 2: Run renderer tests and confirm red**

Run: `npm test -- src/romaji/RomajiSequence.test.ts`

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement the shared renderer**

Use `formatRomaji` and render each separator before any wrapper:

```tsx
export function RomajiSequence({
  tokens,
  highlightedTokenIds = EMPTY_IDS,
  classNameForHighlight,
  errorText,
  renderToken,
}: RomajiSequenceProps): ReactElement {
  const result = formatRomaji(tokens);
  if (!result.ok) {
    return <span role="alert">{errorText}</span>;
  }
  const byId = new Map(tokens.map((token) => [token.id, token]));
  return (
    <>
      {result.runs.map((run) => {
        const token = byId.get(run.tokenId);
        if (!token) return null;
        const content = renderToken ? renderToken(token) : run.text;
        return (
          <Fragment key={run.tokenId}>
            {run.separatorBefore}
            {highlightedTokenIds.has(run.tokenId) ? (
              <mark className={classNameForHighlight}>{content}</mark>
            ) : (
              content
            )}
          </Fragment>
        );
      })}
    </>
  );
}
```

The component accepts assembled sequences only. Callers rendering an isolated tile pass just that token, so the first-token `attach` contract guarantees no meaningless leading space.

- [ ] **Step 4: Add localized content-error copy**

Add to `CourseCopy["common"]` (or the existing top-level common copy shape used by course components):

```ts
contentUnavailable: string;
```

English: `This Japanese example could not be displayed.`  
Italian: `Non è stato possibile mostrare questo esempio in giapponese.`

Extend the existing parity test to assert the key exists and both strings are non-empty.

- [ ] **Step 5: Run focused tests and commit**

Run:

```bash
npm test -- src/romaji src/course/i18n/validate.test.ts
npx tsc --noEmit
git diff --check
```

Expected: renderer and locale parity tests PASS.

Commit: `feat: render highlight-safe romaji sequences`

### Task 4: Migrate every current learner-facing romaji surface

**Files:**
- Modify: `src/course/components/TransformComparison.tsx`
- Modify: `src/course/components/TransformComparison.test.ts`
- Modify: `src/course/components/GuidedTransformation.tsx`
- Modify: `src/course/components/GuidedTransformation.test.ts`
- Modify: `src/lab/components/Board.tsx`
- Modify: `src/lab/components/Lab.render.test.ts`
- Modify: `src/course/components/lessonExerciseModel.ts`
- Modify: `src/course/components/ExerciseView.tsx`
- Modify: `src/course/components/LessonExercises.tsx`
- Modify: `src/course/components/LessonExercises.test.ts`
- Modify: `src/course/components/spokenAttemptModel.ts`
- Modify: `src/course/components/SpokenAttempt.tsx`
- Modify: `src/course/components/spokenAttemptModel.test.ts`
- Modify: `src/course/components/SpokenAttempt.test.ts`

- [ ] **Step 1: Write failing comparison and guided-board regressions**

Assert real rendered text and mark boundaries:

```ts
expect(stripTags(render(questionComparison))).toContain(
  "kore wa koohii desu ka",
);
expect(render(questionComparison)).not.toMatch(/<mark[^>]*> wa/);
expect(stripTags(render(actionGuided))).toContain("tabemasu");
expect(stripTags(render(actionGuided))).not.toContain("tabe masu");
```

Cover highlights at the first, middle, and last token by using small exported renderer fixtures or real comparisons whose changed IDs occupy those positions.

- [ ] **Step 2: Run component tests and confirm red**

Run:

```bash
npm test -- src/course/components/TransformComparison.test.ts src/course/components/GuidedTransformation.test.ts
```

Expected: FAIL because those components still concatenate segment fragments.

- [ ] **Step 3: Migrate comparison and guided endpoints**

For the romaji field, pass the complete segment/token list to `RomajiSequence`. Keep Japanese rendering through `JapaneseSegmentText`. Map Lab endpoint tokens from `buildJapaneseSentence(...).tokens`; map authored endpoints directly from `StaticExample.segments`. Remove component-local romaji separators and `Fragment`-based fragment concatenation.

The comparison changed IDs feed `highlightedTokenIds`; the renderer emits the separator first, so no `<mark>` contains its preceding space.

- [ ] **Step 4: Write failing Lab board regressions**

Render the real Lab board in both script settings and assert:

```ts
expect(romajiPrimaryHtml).toContain("kyō rāmen o tabemasu");
expect(romajiPrimaryHtml).not.toContain("tabe masu");
expect(hiraganaPrimaryHtml).toContain("kyō rāmen o tabemasu");
```

Keep isolated chip assertions: a particle may appear inside a chip, but no chip begins with a visible whitespace text node.

- [ ] **Step 5: Migrate the Lab board**

Use `RomajiSequence` for the complete main/sub sentence lines. Continue rendering Japanese parts without inserted spaces. Chips remain isolated semantic groups and format only their own lexical+particle or stem+morpheme tokens through the same renderer.

- [ ] **Step 6: Write failing exercise-surface regressions**

Cover:

```ts
expect(renderChoiceInRomaji()).toContain("watashi wa gakusei desu");
expect(renderCompletionInRomaji()).toContain("watashi wa");
expect(renderTransformationSource()).toContain("shukudai o shimasu");
expect(renderPlacedTiles()).toContain("watashi wa gakusei desu");
```

Use real model tokens, not hard-coded `romajiForTile: () => "romaji"` callbacks, for these integration cases. Assert isolated bank options have no leading spaces.

- [ ] **Step 7: Return semantic tokens from the exercise model and migrate the view**

Replace fragment-only helpers with:

```ts
export function segmentToken(tileId: string): AssembledToken | undefined;
export function exampleTokens(exampleId: string): readonly AssembledToken[] | undefined;
```

`SentenceLine` resolves nonblank prompt segments to tokens and uses `RomajiSequence`; blank slots remain explicit UI tokens between formatted contiguous groups. The transformation source uses `exampleTokens`. Tile bank options format one token. The placed answer area formats the ordered placed token sequence semantically, while its move/remove controls remain accessible and unchanged.

Unresolved token references render the localized content-error text; they must not fall back to Japanese or concatenated romaji.

- [ ] **Step 8: Write failing spoken-target regressions**

Assert:

```ts
expect(modelFor("introductions-1").targetRomaji).toBe(
  "watashi no namae wa yuki desu",
);
expect(renderSpokenTarget("introductions-1")).toContain(
  "watashi no namae wa yuki desu",
);
```

Add a malformed injected target whose segment source is unresolved and assert `buildSpokenAttemptModel` returns a structured error instead of partial target romaji.

- [ ] **Step 9: Preserve token metadata in the spoken model and migrate the view**

Make `SpokenSegmentView` carry `tokenKind`, `boundaryBefore`, and `source`. Derive `targetRomaji` with `formatRomaji`; add `"invalid-romaji-sequence"` to `SpokenAttemptModelErrorCode`. Render the complete target through `RomajiSequence`, using `renderToken` to preserve each glyph's Japanese/ruby pair and critical-state styling without swallowing separators.

- [ ] **Step 10: Run all migrated component tests and commit**

Run:

```bash
npm test -- src/romaji src/course/catalog src/course/components src/lab
npx tsc --noEmit
git diff --check
```

Expected: all focused suites PASS and TypeScript PASS.

Commit: `fix: apply semantic romaji spacing to every surface`

### Task 5: Add built-app regressions and complete the Phase 0 exit gate

**Files:**
- Modify: `tests/e2e/navigation.spec.ts`

- [ ] **Step 1: Add failing Playwright coverage for every current composed surface**

Add a `semantic romaji boundaries` describe block. Switch the script setting to romaji through the real settings UI and assert normalized visible text on:

```ts
await expect(page.locator(".lesson-comparison__card").first()).toContainText(
  /kore wa koohii desu ka|watashi wa/,
);
await expect(page.locator(".guided-board")).toContainText(/tabemasu/);
await expect(page.locator(".lesson-exercise").first()).toContainText(/ wa /);
await expect(page.locator(".spoken-attempt")).toContainText(/ wa /);
await expect(page.locator(".board .sentence")).toContainText(/ o tabemasu/);
```

Use the stable lesson IDs that actually contain the required examples. Inspect `<mark>` text content and assert it does not start or end with whitespace. Run on both configured desktop and mobile projects, and reuse `setupPageObservers`, `assertNoRuntimeErrors`, `assertLocalOnlyNetwork`, and `assertNoHorizontalOverflow`.

- [ ] **Step 2: Run the new E2E test and confirm red if any surface still concatenates**

Run: `npx playwright test tests/e2e/navigation.spec.ts --grep "semantic romaji boundaries"`

Expected before the last missing migration is fixed: FAIL with the exact surface's unreadable text. After all Task 4 migrations: PASS on desktop and mobile.

- [ ] **Step 3: Audit source for forbidden learner-facing concatenation**

Run:

```bash
rg 'segments\.map\([^)]*romaji|segment\.romaji\)\.join\(""\)|joinSpaced|field === "romaji" \? " "' src/course src/lab
```

Expected: no learner-facing full-sequence concatenation or component-local separator implementation. Test-fixture Japanese-only joins and the formatter's own run join are allowed; review every reported romaji hit manually.

- [ ] **Step 4: Run the complete Phase 0 verification gate**

Run:

```bash
npm test
npx tsc --noEmit
npm run build
GITHUB_PAGES=true npm run build
npx playwright test
git diff --check
git status --short
```

Expected:

- complete Vitest suite PASS;
- TypeScript PASS;
- standard production build PASS;
- Pages-base production build PASS;
- complete Playwright desktop/mobile suite PASS;
- no whitespace errors;
- only intended Phase 0 files are modified before the task commit.

- [ ] **Step 5: Commit the Phase 0 acceptance gate**

Commit: `test: cover romaji boundaries across course surfaces`

## Phase 0 self-review against the master specification

- **Semantic contract:** Tasks 1-2 define explicit `boundaryBefore`, semantic token kind, source, structured validation, catalog adapters, and Lab adapters.
- **Required output:** Tasks 1-2 directly prove `kore wa koohii desu ka`, `tabemasu`, particle readings, punctuation attachment, and unchanged long-vowel text.
- **One formatter/renderer:** Tasks 1 and 3 create the only formatter and only composed-sequence renderer; Task 5 rejects component-local spacing.
- **Every current surface:** Task 4 covers comparison, guided board, Lab sentence/chips, choice/completion/transformation exercises, placed sentence tiles, spoken targets, and their shared primitives.
- **Highlight safety:** Task 3 proves separators are siblings outside `<mark>` at beginning, middle, end, and mixed runs.
- **Failure behavior:** Tasks 1, 2, 3, and 4 return structured errors and localized visible content errors; no concatenation fallback remains.
- **Static architecture/privacy:** No backend, dependency, account, storage, recording, speech-evaluation, routing, or deployment behavior changes.
- **Accessibility/mobile:** Existing semantic controls remain; Task 5 runs both viewports, runtime/network guards, and overflow checks.
- **Exit gate:** Task 5 runs targeted tests, full unit suite, TypeScript, standard and Pages builds, full Playwright, source audit, and clean-diff checks.
- **Conservative ambiguity decision:** Existing authored `ending` segments mix
  attached inflection, standalone predicates, and two composite forms.
  Phase 0 authors explicit `space` boundaries for `です` and `ください`, keeps
  ordinary inflection attached, and splits `たいです` plus `ましょうか` at their
  semantic boundaries. This is the smallest structural correction that satisfies
  the approved token contract without changing Japanese meaning or long-vowel
  policy.
- **Placeholder scan:** The plan contains no deferred implementation markers or unspecified test steps.
- **Type consistency:** `AssembledToken`, `RomajiBoundaryBefore`, `RomajiTokenKind`, `RomajiFormatResult`, `segmentToken`, and `exampleTokens` use one spelling and signature throughout all tasks.
