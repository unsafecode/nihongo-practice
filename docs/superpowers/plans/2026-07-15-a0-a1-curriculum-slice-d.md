# A0→A1 Speech and Release Slice D Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add optional, truthful browser speech recognition to every lesson and complete the audited static GitHub Pages release.

**Architecture:** Pure transcript normalization/evaluation resolves shared speech-prompt and example references without browser dependencies. A replaceable `SpeechRecognizer` browser adapter maps Web Speech events into typed outcomes, while a React controller owns explicit consent and the visible state machine; the lesson component consumes only those interfaces and preserves playback/repeat fallback. Final release verification uses injected recognizer stubs, a production Pages-base preview, reviewed desktop/mobile screenshots, and the existing manual deployment workflow.

**Tech Stack:** React 18, TypeScript 5.6, Web Speech API, browser speech synthesis, Vitest 3, React Router 7, Playwright, Vite, GitHub Pages

---

### Task 1: Complete speech prompts and implement pure transcript evaluation

**Files:**
- Create: `src/course/speech/types.ts`
- Create: `src/course/speech/normalizeTranscript.ts`
- Create: `src/course/speech/normalizeTranscript.test.ts`
- Create: `src/course/speech/evaluateTranscript.ts`
- Create: `src/course/speech/evaluateTranscript.test.ts`
- Modify: `src/course/catalog/types.ts`
- Modify: `src/course/catalog/speechPrompts.ts`
- Modify: `src/course/catalog/curriculum.test.ts`
- Modify: `src/course/catalog/validateCurriculum.ts`
- Modify: `src/course/catalog/validateCurriculum.test.ts`

- [ ] **Step 1: Write failing normalization tests**

Define the wished-for transcript API and prove the normalization order without
discarding assessed distinctions:

```ts
const result = normalizeTranscript("  コーヒー、を　のみます。 ");
expect(result).toEqual({
  original: "  コーヒー、を　のみます。 ",
  comparable: "こーひーをのみます",
});

expect(normalizeTranscript("はし").comparable).not.toBe(
  normalizeTranscript("はーし").comparable,
);
expect(normalizeTranscript("いきます").comparable).not.toBe(
  normalizeTranscript("いきません").comparable,
);
```

Cover NFKC, lowercase Latin output, Japanese whitespace, declared punctuation,
katakana-to-hiragana comparison, long vowels, particles, tense/polarity, and
catalog-declared orthographic variants only.

- [ ] **Step 2: Run normalization tests and confirm red**

Run: `npm test -- src/course/speech/normalizeTranscript.test.ts`

Expected: FAIL because `normalizeTranscript.ts` does not exist.

- [ ] **Step 3: Implement immutable speech types and normalization**

Define the browser-independent contracts:

```ts
export type RecognitionFailure =
  | "unsupported"
  | "denied"
  | "no-speech"
  | "aborted"
  | "network-error"
  | "service-error";

export interface NormalizedTranscript {
  readonly original: string;
  readonly comparable: string;
}

export interface TranscriptEvaluation {
  readonly state: "matched" | "close" | "retry";
  readonly transcript: NormalizedTranscript;
  readonly segmentMatches: readonly SegmentMatch[];
}

export interface TranscriptEvaluator {
  normalize(input: string): NormalizedTranscript;
  evaluate(
    transcript: NormalizedTranscript,
    prompt: ResolvedSpeechPrompt,
  ): TranscriptEvaluation;
}
```

Normalization MUST preserve `original` for learner display and transform only
`comparable`. Do not add fuzzy synonym, particle, inflection, or long-vowel
rewrites.

- [ ] **Step 4: Write failing evaluator boundary tests**

Resolve a prompt from shared example segments and assert:

```ts
expect(evaluateTranscript(exact, prompt).state).toBe("matched");
expect(evaluateTranscript(explicitVariant, prompt).state).toBe("matched");
expect(evaluateTranscript(withinThreshold, prompt).state).toBe("close");
expect(evaluateTranscript(outsideThreshold, prompt).state).toBe("retry");
```

Test edit distances immediately below, at, and above
`max(1, floor(targetLength * 0.15))`; require every critical segment to match
for `close`; prove missing particles/endings cannot be `close`; test repeated
segments and katakana comparison. Segment records MUST remain in target order.

- [ ] **Step 5: Run evaluator tests and confirm red**

Run: `npm test -- src/course/speech/evaluateTranscript.test.ts`

Expected: FAIL because prompt resolution and evaluation do not exist.

- [ ] **Step 6: Complete prompt references and implement evaluation**

Extend `SpeechPromptCatalogEntry` with required comparison segments and explicit
accepted transcript variants:

```ts
export interface SpeechPromptCatalogEntry {
  readonly id: SpeechPromptId;
  readonly targetExampleId: ExampleId;
  readonly acceptedTranscriptVariantExampleIds: readonly ExampleId[];
  readonly comparisonSegmentIds: readonly string[];
  readonly criticalSegmentIds: readonly string[];
}
```

Derive all 40 authored prompts from shared examples. Author critical segment
IDs explicitly so particles, tense/polarity endings, quantities, and the
lesson-target word/gear are represented even though the shared segment kind
union is only `word | particle | ending`. Validation MUST reject
missing/duplicate segment references, critical segments outside comparison
segments, variant examples not already declared by the owning lesson, empty
comparison targets, and a prompt whose target is not the owning lesson's spoken
example.

Use deterministic code-point Levenshtein distance. `matched` requires exact
canonical/declared-variant equality. `close` requires all critical segment
records to match and distance within the normative threshold. No percentage or
pronunciation score exists in the result.

- [ ] **Step 7: Run focused tests and commit**

Run:

```bash
npm test -- src/course/speech src/course/catalog/curriculum.test.ts src/course/catalog/validateCurriculum.test.ts
npm run build
git diff --check
```

Commit: `feat: add deterministic transcript evaluation`

### Task 2: Implement the replaceable browser recognizer and state machine

**Files:**
- Create: `src/course/speech/SpeechRecognizer.ts`
- Create: `src/course/speech/browserSpeechRecognizer.ts`
- Create: `src/course/speech/browserSpeechRecognizer.test.ts`
- Create: `src/course/speech/speechStateMachine.ts`
- Create: `src/course/speech/speechStateMachine.test.ts`
- Create: `src/course/speech/SpeechRecognitionContext.tsx`
- Create: `src/course/speech/SpeechRecognitionContext.test.ts`
- Modify: `src/main.tsx`

- [ ] **Step 1: Write failing adapter tests with a fake Web Speech constructor**

Test a dependency-injected minimal recognition factory, never Chromium's real
permission UI or network:

```ts
const recognizer = createBrowserSpeechRecognizer(fakeFactory);
const pending = recognizer.recognize({ lang: "ja-JP" });
fake.emitResult("わたしはゆきです");
await expect(pending).resolves.toEqual({
  kind: "transcript",
  transcript: "わたしはゆきです",
});
```

Assert `continuous = false`, `interimResults = false`, `maxAlternatives = 1`,
`lang = "ja-JP"`, one active request at a time, abort idempotence, cleanup, and
mapping of `not-allowed`, `no-speech`, `aborted`, `network`, unknown errors, and
constructor/start failures. Unknown errors MUST map to `service-error` and log a
development diagnostic without leaking browser event objects to consumers.

- [ ] **Step 2: Run adapter tests and confirm red**

Run: `npm test -- src/course/speech/browserSpeechRecognizer.test.ts`

Expected: FAIL because the adapter does not exist.

- [ ] **Step 3: Implement the browser-independent recognizer interface**

```ts
export interface SpeechRecognizer {
  readonly supported: boolean;
  recognize(request: { readonly lang: "ja-JP" }): Promise<RecognitionOutcome>;
  abort(): void;
}
```

Feature-detect `SpeechRecognition` and `webkitSpeechRecognition`. Keep local
minimal browser-event types in the adapter instead of widening global DOM types.
Settle every request exactly once, detach handlers on every terminal event, and
reject concurrent `recognize` calls as typed `service-error` outcomes.

- [ ] **Step 4: Write failing state-machine tests**

Exercise the complete transition table:

```ts
expect(reduceSpeechState(idle, { type: "CONSENT_REQUESTED" }).status)
  .toBe("requesting-consent");
expect(reduceSpeechState(listening, { type: "TRANSCRIPT", value: "..." }).status)
  .toBe("processing");
expect(reduceSpeechState(processing, { type: "EVALUATED", result }).status)
  .toBe(result.state);
```

Cover idle, requesting-consent, listening, processing, matched, close, retry,
unsupported, denied, no-speech, aborted, network-error, and service-error.
Prove stale outcomes from an aborted/replaced attempt are ignored by attempt ID,
retry returns to listening only after explicit activation, and no failure state
can fabricate a transcript/evaluation.

- [ ] **Step 5: Implement reducer and injected provider**

`SpeechRecognitionProvider` creates the production browser adapter by default
and accepts a `recognizer` prop for unit/E2E stubs. It keeps app-notice consent
in React session memory only; it MUST NOT persist or infer browser permission.
The provider exposes typed `requestConsent`, `consent`, `start`, `abort`, and
`reset` actions using the pure reducer.

- [ ] **Step 6: Run focused tests and commit**

Run:

```bash
npm test -- src/course/speech/browserSpeechRecognizer.test.ts src/course/speech/speechStateMachine.test.ts src/course/speech/SpeechRecognitionContext.test.ts
npm test
npm run build
git diff --check
```

Commit: `feat: add browser speech recognition adapter`

### Task 3: Integrate optional spoken attempts, consent, privacy, and fallback

**Files:**
- Create: `src/course/components/SpokenAttempt.tsx`
- Create: `src/course/components/SpokenAttempt.test.ts`
- Create: `src/course/components/spokenAttemptModel.ts`
- Create: `src/course/components/spokenAttemptModel.test.ts`
- Modify: `src/course/components/LessonPage.tsx`
- Modify: `src/course/course.css`
- Modify: `src/course/i18n/types.ts`
- Modify: `src/course/i18n/it.ts`
- Modify: `src/course/i18n/en.ts`
- Modify: `README.md`

- [ ] **Step 1: Write failing spoken-attempt model/component tests**

For every lesson, resolve its catalog speech prompt, target example, target
segments, romaji, and localized copy. Test explicit consent before `start`,
model playback, repeat-without-score, listening/processing announcements,
recognized transcript display, per-segment text state, matched/close/retry, and
all six failures. Assert runtime copy contains no pronunciation/accuracy/accent/
fluency/phoneme/score claim in either locale.

- [ ] **Step 2: Run tests and confirm red**

Run:

```bash
npm test -- src/course/components/spokenAttemptModel.test.ts src/course/components/SpokenAttempt.test.ts
```

Expected: FAIL because spoken-attempt UI and copy do not exist.

- [ ] **Step 3: Implement the resolved lesson model**

`getSpokenAttemptModel(lessonId, locale)` MUST resolve only stable catalog IDs
and return either a complete model or a structured generation error. It MUST
reuse the lesson target example and current script/romaji helpers; components
must not copy Japanese target strings.

- [ ] **Step 4: Implement consent and privacy UI**

Before the first start in the app session, render an explicit disclosure and
consent-acknowledgement button stating in IT/EN:

- speech is optional;
- the app stores no audio;
- recognized transcripts are not persisted;
- browser/OS/vendor processing may occur;
- denial leaves all other exercises available.

Acknowledging the app notice MUST NOT start recognition or request browser
permission. Only a later explicit microphone action may transition to listening
and invoke `recognize`; that action is disabled/absent until consent is
acknowledged. Dismiss/cancel leaves playback and repeat-without-score usable.

- [ ] **Step 5: Implement visible recognition and fallback states**

Insert `<SpokenAttempt lessonId={lesson.id} />` after `LessonExercises` in the
existing explore section, preserving spoken attempt before recap. Render the
visible target under current hiragana/romaji settings, model playback through
`useSpeech`, mic start/abort/retry controls, a polite status/result live region,
recognized transcript, and ordered segment records.

Unsupported, denied, no-speech, aborted, network-error, and service-error each
use explicit localized copy. Every terminal failure retains target text, model
playback when available, repeat-without-score, and all non-speech exercises.
Mic controls and fallback actions MUST be semantic, keyboard/touch operable,
44px minimum, visibly focused, and reduced-motion safe.

- [ ] **Step 6: Update truthful documentation**

README MUST say recognition reports browser-recognized target similarity, not
pronunciation quality; document no audio/transcript persistence and possible
browser/OS/vendor processing. Remove the stale “Slice D unavailable” statement.
Do not claim every browser supports recognition.

- [ ] **Step 7: Run focused/full tests and commit**

Run:

```bash
npm test -- src/course/components src/course/speech src/course/i18n
npm test
npm run build
GITHUB_PAGES=true npm run build
git diff --check
```

Commit: `feat: integrate optional spoken attempts`

### Task 4: Add stubbed speech acceptance and visual coverage

**Files:**
- Create: `tests/e2e/speech.spec.ts`
- Modify: `tests/e2e/helpers.ts`
- Modify: `tests/e2e/course-visuals.spec.ts`
- Modify: `tests/e2e/navigation.spec.ts`
- Create: `tests/e2e/course-visuals.spec.ts-snapshots/lesson-speech-consent-desktop-1440-darwin.png`
- Create: `tests/e2e/course-visuals.spec.ts-snapshots/lesson-speech-consent-mobile-390-darwin.png`
- Create: `tests/e2e/course-visuals.spec.ts-snapshots/lesson-speech-result-desktop-1440-darwin.png`
- Create: `tests/e2e/course-visuals.spec.ts-snapshots/lesson-speech-result-mobile-390-darwin.png`

- [ ] **Step 1: Add an E2E-only recognizer injection seam**

Expose a typed initializer accepted by `SpeechRecognitionProvider`, populated by
`page.addInitScript` before app boot. Production defaults remain the real
browser adapter. The fake queues deterministic transcript/failure outcomes and
records `recognize`, `abort`, and language calls in page memory.

- [ ] **Step 2: Write failing desktop/mobile Playwright cases**

Cover:

```ts
await consent.click();
expect(fake.calls).toEqual([]); // notice acknowledgement is separate
await microphone.click();
expect(fake.calls[0].lang).toBe("ja-JP");
```

Then test matched, close, retry, unsupported, denied, no-speech, aborted,
network-error, and service-error; consent ordering; abort/retry; model
playback/repeat fallback; transcript non-persistence after reload; no required
speech for lesson/exercise completion; IT/EN; hiragana/romaji; focus/live
regions; 44px targets; reduced motion; Pages hash deep links; no unexpected
console errors; and no real/external speech request.

- [ ] **Step 3: Implement/fix only behavior required by red E2E cases**

Do not weaken network guards or hide expected states. Test adapters MUST use the
same public `SpeechRecognizer` contract as the production adapter and MUST NOT
patch component internals.

- [ ] **Step 4: Capture and review representative screenshots**

Capture consent and matched/close or unsupported fallback at `1440 x 1000` and
`390 x 844`. Include IT/EN and hiragana/romaji across the set. Review hierarchy,
target Japanese, privacy clarity, no color-only meaning, mic status, focus,
reading measure, no dead space/overflow, and touch ergonomics before accepting
new baselines.

- [ ] **Step 5: Run the Slice D acceptance gate and commit**

Run:

```bash
npm test
npm run build
GITHUB_PAGES=true npm run build
npm run test:e2e
git diff --check
```

Commit: `test: verify speech recognition flows`

### Task 5: Execute the complete static release and live-publication gate

**Files:**
- Modify if evidence requires correction: `README.md`
- Inspect: `.github/workflows/deploy-pages.yml`
- Inspect: `dist/**`

- [ ] **Step 1: Reinstall cleanly and run every release gate**

Run:

```bash
npm ci
npm test
npm run build
GITHUB_PAGES=true npm run build
npm run test:e2e
npm audit --omit=dev
npm audit
git diff --check
git status --short
```

Expected: all tests/builds/audits pass, no untracked generated artifacts, and no
unexpected tracked changes after `npm ci`.

- [ ] **Step 2: Inspect release boundaries**

Verify the built output contains no personal runtime alias, secret, backend URL,
tracker, external font request, service worker, pronunciation-quality claim, or
automatic deployment trigger. Confirm the manual Pages workflow still accepts
only `workflow_dispatch` on `master`, and production assets use
`/nihongo-practice/`.

- [ ] **Step 3: Review the production preview live**

Serve the fresh Pages-base build and manually inspect representative course map,
lesson exercises, review queue, speech consent/listening/result/fallback, locale,
script, desktop, and mobile flows using Playwright browser automation. Check
actual computed layout, focus, touch targets, console/runtime errors, and
network requests in addition to screenshots.

- [ ] **Step 4: Obtain independent final spec and quality approval**

Review all changes from the Slice D plan commit through HEAD against the master
spec and static release gate. Fix every release blocker with a new failing test,
repeat the affected and complete gates, and obtain approval before publication.

- [ ] **Step 5: Publish only the approved commit**

Push the feature branch, create/merge the reviewed pull request into `master`,
confirm the merge commit includes the approved Slice A-D history, then manually
dispatch `.github/workflows/deploy-pages.yml` on `master`. Do not dispatch from
the feature branch or publish a dirty/unreviewed commit.

- [ ] **Step 6: Review the public Pages deployment**

Wait for the workflow to succeed, then inspect
`https://unsafecode.github.io/nihongo-practice/` at desktop/mobile widths. Smoke
test representative hash routes, assets, exercises, review, speech unsupported
fallback, locale/script settings, console errors, and unexpected network
requests. If the public site differs from the approved preview, stop and
unpublish or redeploy the last known-good Pages artifact before reporting
success.
