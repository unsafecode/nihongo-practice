# Base level — independent code-quality review
Reviewer: independent code-quality reviewer (claude-opus-5), 2026-08-12
Scope: master...HEAD (88 commits, 352 files changed, +88,225 / −2,305)
Method: Read-only. `git diff/log/show` across the whole range; targeted reads of
`src/course/base/**`, `src/course/components/Base*.tsx`, `src/course/components/base/**`,
`src/course/progress/**` (incl. the full V1→V5 migration chain), `src/course/levels/**`,
`src/routing/routePaths.ts`, `src/course/a1/**` containment modules, `vite.config.ts`,
`scripts/checkBundleBudget.ts`, `src/course/data/prodBundle.test.ts`, `src/course/course.css`,
and `tests/e2e/{baseFixtures.ts,base-accessibility.spec.ts,base-level.spec.ts}`. Answer-leakage
was checked empirically with a read-only `npx tsx` script that built the practice model for all
40 Base lessons and tabulated correct-option positions and DOM id shapes. Per instructions,
`npm run build`, `npm test` and Playwright were **not** executed; build-gated constraints are
verified by reading the gate's source and asserting on what it measures.

## Verdict
APPROVED WITH FINDINGS

No blockers. Three findings, none of which lose learner data, leak answers, or violate a stated
constraint. F-Q1 is a real user-visible defect on an error path; F-Q2 and F-Q3 are guard tests
that do not actually test the property their own comments claim.

## Findings

### F-Q1 — Spoken activity announces the "Can-do" label as its formatting-error message
- Severity: medium
- Area: 4 — error handling (fail-closed vs silent-drop)
- Evidence: `src/course/components/base/BasePracticeSequence.tsx:372-380`

  ```tsx
  <p className="base-spoken-activity__target" lang="ja">
    <RomajiSequence
      tokens={activity.tokens}
      errorText={baseLessonCopy.recap.canDoLabel}
      renderToken={(token) => (
        <JapaneseSegmentText jp={token.jp} reading={token.reading} />
      )}
    />
  </p>
  ```

  `RomajiSequence` treats `errorText` strictly as error copy — `src/romaji/RomajiSequence.tsx:15-35`:

  ```tsx
  function alertNode(errorText: string) {
    return <span role="alert">{errorText}</span>;
  }
  ...
  if (!formatted.ok) return alertNode(errorText);
  ...
    if (!token) return alertNode(errorText);
  ```

  The value passed is not error copy — `src/course/i18n/en.ts:336-339` /
  `src/course/i18n/it.ts:336-339`:

  ```ts
  recap: {
    heading: "Recap",
    vocabularyHeading: "Vocabulary from this lesson",
    canDoLabel: "You can now",
  },
  ```

  Every other `RomajiSequence` call site on this branch passes the correct key:
  `src/course/components/base/BaseWorkedExamples.tsx:37` —
  `errorText={copy.lesson.contentFormattingError}`; `src/course/components/BaseReferencePage.tsx:99`
  — `const errorText = copy.lesson.contentFormattingError;` (used at lines 165 and 210).
  That string is `"This Japanese example could not be displayed."` (`src/course/i18n/en.ts:143`).
- Finding: If romaji assembly fails for a spoken target — `formatRomaji` returning `!ok`, or a run
  whose token is missing — the spoken card replaces the Japanese sentence the learner is asked to
  say aloud with `<span role="alert">You can now</span>` (IT: `"Ora sai"`). The learner is not told
  anything failed; they are shown a short, grammatical-looking English/Italian fragment inside the
  `lang="ja"` target paragraph, and a screen reader interrupts with an assertive announcement of
  "You can now". This is exactly the "a missing string must not silently render a misleading
  teaching surface" case: the surface degrades into something that looks like content rather than
  into an error. The rest of the card (audio button, record control, submit) stays fully enabled,
  so the learner is invited to speak a sentence that is no longer on screen. Note the failure is
  per-activity, so the page-level fail-closed guard in `BaseLessonPage.tsx:201-218` does not catch
  it — that guard only fires when the whole practice model fails to build.
- Resolution: FIXED — `BasePracticeSequence.tsx` now passes `copy.lesson.contentFormattingError`
  to `RomajiSequence`, matching every other call site. Proven by
  `src/course/components/romajiErrorCopy.test.ts`, which scans every `errorText={...}` call site
  under `src/course/components/` and requires the dedicated formatting-error copy. Verified RED
  first: it reported exactly one offender,
  `course/components/base/BasePracticeSequence.tsx: errorText={baseLessonCopy.recap.canDoLabel}`.

### F-Q2 — The "correct option is not rendered first" leakage guard asserts only that the option exists
- Severity: low
- Area: 8 — test quality
- Evidence: `tests/e2e/base-accessibility.spec.ts:875-883`

  ```ts
  // The DOM order of the options must not simply be "correct first".
  const correctIndex = await page.evaluate(
    ({ sel, correctId }: { sel: string; correctId: string }) =>
      Array.from(
        document.querySelectorAll<HTMLInputElement>(`${sel} input[type=radio]`),
      ).findIndex((input) => input.value === correctId),
    { sel: selector, correctId: (activity as { correctOptionId: string }).correctOptionId },
  );
  expect(correctIndex, `${activity.id}: the correct option is rendered`).toBeGreaterThanOrEqual(0);
  ```

  `correctIndex` is never read again; the `describe` block ends at line 911.
- Finding: The comment states the property under test (correct option must not always be first),
  but `toBeGreaterThanOrEqual(0)` is satisfied by *any* index including `0`. A regression that
  emitted the correct option first in every choice and listening activity — the exact positional
  leak this block exists to prevent — would pass this test unchanged. Contrast the tile-ordering
  guard 14 lines below, which does assert the property (`base-accessibility.spec.ts:897-900`:
  `expect(bankOrder, ...).not.toEqual([...correctTileIds])`). The underlying property does
  currently hold — I tabulated all 40 Base lessons and the correct choice option is at index 0 in
  134 activities and index 1 in 146; listening splits 29/11 — so this is a guard gap, not a live
  leak. Severity is capped at low for that reason, but the guard is the only automated defence
  against positional leakage for `choice`/`listening` and it is currently inert.
- Resolution: FIXED — `tests/e2e/base-accessibility.spec.ts` now accumulates the correct option's
  index per activity and asserts after the loop that the correct answer's position actually varies
  across the rendered set, so a renderer that always emitted the answer first would fail.

### F-Q3 — The attribute-*value* leakage scan re-tests attribute names, never the values
- Severity: low
- Area: 8 — test quality
- Evidence: `tests/e2e/base-accessibility.spec.ts:835-846`

  ```ts
  // 2. No attribute anywhere names an answer/correctness concept.
  const names = await attributeNames(page, selector);
  expect(
    names.filter((name) => FORBIDDEN_ATTRIBUTE_NAMES.test(name)),
    `${activity.id}: answer-revealing attribute names`,
  ).toEqual([]);
  for (const value of [...surface.dataAttributes, ...surface.attributeValues]) {
    expect(
      FORBIDDEN_ATTRIBUTE_NAMES.test(value.split("=")[0] ?? ""),
      `${activity.id}: ${value}`,
    ).toBe(false);
  }
  ```

  The collected entries are `name=value` strings, so `split("=")[0]` yields the **name** —
  `tests/e2e/baseFixtures.ts:482-499`:

  ```ts
  for (const attribute of Array.from(element.attributes)) {
    if (attribute.name.startsWith("data-")) {
      dataAttributes.push(`${attribute.name}=${attribute.value}`);
    } else if ([... "title", "alt", "placeholder", "value", "aria-label", ...].includes(attribute.name)) {
      attributeValues.push(`${attribute.name}=${attribute.value}`);
    }
  }
  ```
- Finding: The loop discards the value half of every entry and re-runs
  `FORBIDDEN_ATTRIBUTE_NAMES` against the name, which the preceding `expect` already covers via
  `attributeNames()`. No attribute *value* is ever tested against the answer-revealing pattern, so
  the second half of the fixture's collected surface (`aria-label`, `title`, `alt`, `value`,
  `data-*` payloads) is unguarded by this check. A regression emitting e.g.
  `aria-label="Correct answer"` or `data-state="is-right"` on the correct option would pass:
  the names `aria-label` / `data-state` do not match the pattern, and check #1 above only compares
  against the exact `acceptedFeedback` / `retryFeedback` strings, not against the pattern. I found
  no such leak in the current build (all option and tile DOM ids go through `opaqueTargetKey()`
  FNV-1a hashing), so this is a guard gap rather than a live leak.
- Resolution: FIXED — the attribute scan in `tests/e2e/base-accessibility.spec.ts` now reads the
  attribute *value* (`value.slice(separator + 1)`) rather than re-testing the attribute name, so an
  answer leaked through an attribute value is detected.

## Areas with no findings

- **1 — Total ownership / single source of truth.** The A1 containment lists are genuinely derived,
  not hand-maintained: `src/course/a1/inheritedBaseConcepts.ts` derives `A1_INHERITED_BASE_CONCEPT_IDS`
  from the learning-note catalog, and `src/course/a1/catalog/inheritedBaseContent.ts` derives senses,
  values and forms by running `realizeVariant` over the rehomed lessons' model variants; the two
  independent derivations are cross-checked in `src/course/a1/curriculum/inheritedBase.test.ts`.
  `BASE_TASK11_LEXEME_RECURRENCE_PLANS` in `src/course/base/catalog/lexicon.ts` is hand-authored,
  but it encodes authoring intent (which lexeme recurs where) that is not derivable from anything
  else, and the closure is derived *from* it rather than duplicated alongside it.
- **2 — Progress migration correctness.** I traced the full `parseProgress` chain
  (`src/course/progress/progress.ts:1684-1787`) and every migration hop into V5. Rehomed lessons are
  moved with `cloneLessonProgress` (`progress.ts:910-918`) under the id-stable
  `v4OwnershipMap.ts`, so no visited/practiced evidence is dropped. Lesson ids unknown to the new
  catalog are quarantined into `orphanedLessonRecords` rather than deleted
  (`reconcileV5LevelCatalog`, `progress.ts:1340-1358`), and retired review keys become
  `historical-orphan` dispositions rather than vanishing (`progress.ts:1360-1386`). Consolidation
  cannot be spuriously granted from carried-over activity ids: all 80 rows in
  `src/course/base/migration/v4ActivityMap.ts` are `historical-orphan`, and the gate at
  `progress.ts:1999` requires `coversAll(acceptedExerciseIds, evidence.requiredExerciseIds)` against
  *current* Base ids, which stale A1 ids cannot satisfy. `resumeLevelForV4Migration`
  (`progress.ts:969-995`) is total over all eight null/non-null combinations and terminates in an
  explicit `?? "a0"`. Corruption is surfaced to the learner rather than silently swallowed
  (`CourseHome.tsx:149-157`), and the corrupted-cleanup write is correctly deferred out of render
  into a once-guarded mount effect (`ProgressContext.tsx:634-641`).
- **3 — Canonical-source reuse.** `buildBasePracticeModel.ts` and `buildBaseLessonViewModel.ts`
  read the canonical catalog and fail closed per copy id (`resolveCommonCopy`,
  `buildBasePracticeModel.ts:182-199`) instead of re-deriving content; `BaseLessonPage.tsx:192-199`
  consumes them through memoized cache lookups and renders a single `Notice` if either fails
  (`BaseLessonPage.tsx:201-218`) rather than a partial lesson.
- **5 — Type safety.** A sweep of `src/course/base/**`, `src/course/levels/**`,
  `src/course/components/base/**` and `src/course/components/Base*.tsx` found no `any`, no `as any`,
  and no `@ts-ignore`; the single `@ts-expect-error`
  (`src/course/base/forms/adjectiveForms.test.ts:346`) is a deliberate negative type assertion in a
  test. There are no non-null assertions in `src/course/base/view/**` or
  `src/course/base/catalog/**`. The one cast on a hot path, `locale as BaseReferenceLocale`
  (`BaseReferencePage.tsx:83`), is a no-op: `Locale = "it" | "en"`
  (`src/i18n/LocaleContext.tsx:11`) and `BaseReferenceLocale = "en" | "it"`
  (`src/course/base/references/catalog.ts:114`) are the same union.
- **6 — Answer leakage.** Verified empirically across all 40 Base lessons (280 choice, 40 listening,
  32 tile-ordering, 40 spoken activities). Correct-option position is well distributed
  (choice 134/146 across index 0/1). All learner-facing option and tile DOM ids are
  `opaqueTargetKey()` FNV-1a hashes, so no Japanese target text reaches `data-*`.
  `deterministicTileBankOrder` (`buildBasePracticeModel.ts:219-230`) sorts tile ids and reverses if
  the sort coincides with `correctTileIds`, so the bank order provably differs from the answer for
  any activity with ≥2 distinct tiles, and the answer strip starts empty. Settled feedback copy
  (`acceptedFeedback` / `retryFeedback`) is not present anywhere in the pre-attempt DOM, including
  `display:none` / `aria-hidden` subtrees. (F-Q2 and F-Q3 concern the *tests* guarding this, not the
  product behaviour.)
- **7 — Accessibility.** Heading order is monotonic: `h1` (`BaseLessonPage.tsx:228`) → `h2` section
  headings (`:242`) → `h3` practice stage headings (`BasePracticeSequence.tsx:559/575/591`) → `h4`
  for the consent dialog title (`:418`) and nested groups. Sections are `aria-labelledby` their own
  heading id (`BaseLessonPage.tsx:236-244`). Settled outcomes use `role="status" aria-live="polite"`
  (`BasePracticeSequence.tsx:44,461`, `BaseListeningActivity.tsx:82`, `BaseAudioButton.tsx:98-99`) —
  polite, not assertive, which is right for per-activity feedback. `CourseHome.tsx:82-89` moves focus
  to the level heading only when the level actually changes, never on first render. The duplicated
  reference presentations are mutually exclusive rather than both exposed: `.base-reference-cards`
  is `display: none` by default (`src/course/course.css:2602-2603`) and the `@media (max-width: 40rem)`
  block (`course.css:2953-2959`) flips exactly one of table/cards on, so the accessibility tree never
  contains the same rows twice.
- **9 — Bundle/runtime boundaries.** `vite.config.ts` splits Base into `course-base-copy`,
  `course-base-content`, `course-base-catalog` and `course-base`, matched ahead of the general
  A1/A2 rules. `src/course/data/prodBundle.test.ts` performs a real Vite production build
  (`write: false`) and asserts source-only markers are absent from every emitted chunk, that the
  expected Base chunks exist, and that the emitted chunk graph is acyclic — the last of these guards
  the first-paint TDZ risk created by the `course-base-catalog` leaf layer.
- **10 — Scope discipline.** The A1 changes are confined to containment
  (`inheritedBaseConcepts.ts`, `catalog/inheritedBaseContent.ts` and the catalog/manifest edits that
  remove the 20 rehomed lessons); A2 is untouched. The route *shape* is unchanged —
  `/percorso/:moduleId/:lessonId` and every A1/A2 module and lesson id are byte-identical, and no
  A1/A2 route id was renamed. `coursePathForLevel` now appends `?livello=a1` where it previously
  returned bare `/percorso`, but bare `/percorso` still resolves: `resolveCourseLevel`
  (`src/course/levels/selection.ts`) falls back explicit → stored preference → migration
  `resumeLevel` → a1-if-evidence → a0, so a returning A1 learner with evidence still lands on A1 and
  a migrating learner is deliberately routed to Base once. I read this as the intended level-selection
  behaviour rather than a route-stability regression, and record it here for the coordinator's
  awareness rather than as a finding.

## Constraint verification
- **A2 immutability: PASS.** `git diff --stat master...HEAD -- src/course/a2/` produces no output —
  zero files changed under `src/course/a2/**`.
- **500 KiB budget unchanged: PASS.** `git diff master...HEAD -- scripts/checkBundleBudget.ts` is
  empty; the file is byte-identical to master and still declares
  `const MAX_CHUNK_BYTES = 500 * 1024;`.
- **testHarness not imported by production: PASS.** `grep -rn "testHarness" src/ tests/` returns
  exactly two hits: the import in `src/course/components/base/BasePracticeSequence.spoken.test.tsx`
  (a test file) and a prose mention inside a doc comment in
  `src/course/components/base/BasePracticeSequence.tsx`. No production module imports
  `src/course/base/view/testHarness.tsx`.
- **Validator/reports tree-shaken: PASS.** `src/course/data/prodBundle.test.ts` runs a real Vite
  production build and asserts the validator/ledger source-only markers (including the
  `c5d03e11acd4469491feac1c50a04d4f91eb4f58a4813bd4ab047c7f666bea3d` sentinel and the
  `base-audio-review-` report prefix) appear in no emitted chunk. The gate asserts on actual build
  output rather than on source text, so it cannot be satisfied by a source-level rename. Verified by
  reading the gate; not executed, per the review constraints.
