# Phase 4 release verification — 2026-07-18

Section 21.4 of the master design specification, all eleven items. Every item
below carries the same four fields, each filled from a measurement taken during
this verification. No item is cross-referenced to another for its evidence.

Verified at commit: `9e7894075ad6d73c3856ae697a5682ae9b058b3c` (full 40 characters)

**Verified SHA vs. committing SHA — the gap, stated rather than hidden.**
`9e7894075ad6d73c3856ae697a5682ae9b058b3c` is the SHA at which **every
measurement in this document was taken**. A document that records tree state
cannot contain the SHA of its own commit, so the two necessarily differ; this
note names the gap instead of leaving it invisible. The commit that adds this
document, and any follow-up that corrects this document, **touch only `docs/`
and therefore cannot change the built artifact** — `dist/` is produced from
`src/`, `index.html`, and the build config, none of which these commits modify.
That invariant terminates the regress here rather than deferring it: no
docs-only commit can move a byte a learner downloads. Concretely, item 11's
"79 commits / 102 files changed" is measured at the verified SHA (`9e78940`),
against the basis `ab0c078..<ref>` — `git rev-list --count ab0c078..<ref>` for
the commit count, `git diff --stat ab0c078..<ref>` for files changed. On that
basis the commit that added this document (`ed157e6`) measured **80 commits /
103 files changed**, and the first correcting follow-up (`0f4cfb34`) measured
**81 commits / 103 files changed**. Each docs-only follow-up adds one commit, so
the commit count rises with every correction; a reader who measures a larger
number at whatever ref they hold is seeing that expected growth, not a
discrepancy, and should compute it with the commands above rather than expect
any fixed figure — this record has further follow-ups coming, including the
deploy record. The **files-changed** count corroborates it and is the more
durable of the two figures: it was **103 at both `ed157e6` and `0f4cfb34`** and
holds at 103 across any follow-up that edits only `docs/` paths already in that
set; it would rise only if a follow-up adds a *new* `docs/` path — for instance
the override-ratification decision record tracked as D-6 — which the `git diff
--stat` above would surface as a new line. Finally, this document is **not** the last word on the deployed
tree: **Task 36 re-runs every gate at the final deployed SHA**, and that run —
not this one — certifies what is actually served.

Environment: macOS (Darwin), Node v26, npm workspace at the repository root.
`origin/master` is `ab0c0789236c53b754c591fa1c2cc43c86e4ad0e` and is an ancestor
of HEAD. `dist/` is gitignored, so builds never dirty the tree.

**Referents, stated once so no number below is ambiguous (Section 21.4: "No
aggregate word, verb, lesson, or exercise count is sufficient by itself").**
The A2 release validator prints "60 lessons, 15 modules, 59 Can-dos, 120 kanji"
— those four figures are **A2 only**. The learner-facing corpus totals are
**108 lessons (48 A1 + 60 A2), 27 modules (12 A1 + 15 A2), 74 Can-dos
(15 A1 + 59 A2)**, and 809 realized A2 editorial sentences. The 108 figure
includes A1's four phonetic `sounds` lessons, which are built by a separate
pipeline; the semantic-catalog count of 104 lessons (44 A1 + 60 A2) omits them
and is the wrong referent for any learner-facing claim.

---

## 1. Clean dependency installation
Command: `rm -rf node_modules && npm ci`
Output (verbatim final lines):
```
added 152 packages, and audited 153 packages in 2s

28 packages are looking for funding
  run `npm fund` for details

1 high severity vulnerability

To address all issues (including breaking changes), run:
  npm audit fix --force

Run `npm audit` for details.
```
No `ERR!` line was emitted. 152 packages added, 153 audited. The "1 high
severity vulnerability" line is the react-router advisory examined in item 7;
its presence at install time is expected and does not affect this item.
Verdict: **pass**

## 2. Complete unit and property test suite
Command: `npx vitest run` (read the printed summary; a piped `--reporter=line`
exit code is not trusted)
Output (verbatim summary lines):
```
 Test Files  199 passed (199)
      Tests  3759 passed (3759)
   Duration  8.90s
```
199 test files, 3759 tests, all green. This meets/exceeds the recorded baseline
(199 files / 3759 tests at commit `41f201d`); the plan's Step 2 text citing
"190 files / 3684 tests" is a stale baseline and was not used as the bar.
Verdict: **pass**

## 3. TypeScript and standard Vite production build
Command: `npx tsc --noEmit && npm run build`
Output:
- `npx tsc --noEmit` printed **no output** and exited 0.
- `npm run build` ran its `prebuild` pre-script and then `tsc --noEmit && vite build`:
```
validateA1Release: OK — the A1 release catalog is content-valid (0 errors).
validateA2Release: OK — the A2 release catalog is content-valid (0 errors). 60 lessons, 15 modules, 59 Can-dos, 120 kanji.
lintA2NoJapanese: OK — 0 Japanese-literal violations across 15 A2 content module file(s).

vite v6.4.3 building for production...
✓ 230 modules transformed.
dist/index.html                                  0.98 kB │ gzip:  0.48 kB
dist/assets/style-9iYAhP9t.css                  58.36 kB │ gzip: 10.84 kB
dist/assets/course-foundations-FFo7yljR.js      46.59 kB │ gzip: 13.20 kB
dist/assets/vendor-DrNfcWTL.js                 182.00 kB │ gzip: 59.86 kB
dist/assets/course-a1-CikFG_zU.js              255.30 kB │ gzip: 37.10 kB
dist/assets/index-CQGcYrba.js                  265.65 kB │ gzip: 70.24 kB
dist/assets/course-a2-DRWLSAeA.js              465.09 kB │ gzip: 77.30 kB
✓ built in 623ms
```
(Smaller chunks — RomajiSequence, PracticeHome, guidedToolLink, useSpeech,
lessonRouteResolution, Icon, ReviewQueue, Syllabary, Phrasebook, CourseHome,
Exercise, Lab, LessonPage — all emitted between 0.6 kB and 25.6 kB.) The
`prebuild` figures 60/15/59/120 are **A2 only** (see referents header); the
largest chunk is `course-a2` at 465.09 kB (77.30 kB gzipped).
Verdict: **pass**

## 4. Complete Playwright suite and reviewed screenshots
Command: `npx playwright test` then `ls -la test-results`
Output (verbatim tail):
```
  58 skipped
  400 passed (2.2m)
```
`test-results/` contained only `.last-run.json` (`{"status":"passed","failedTests":[]}`)
— no failure artifacts. 400 passed / 58 skipped / 0 failed. The **58 skip count
matches Task 31's audited total** (`docs/release/2026-07-18-playwright-skip-audit.md`:
"0 failed, 392 passed, 58 skipped" pre-Phase-4; all 58 are legitimate
environment skips).

Visual-baseline tripwire (16 committed PNG baselines validated by the gate):
- 12 baselines in `tests/e2e/screenshots.spec.ts-snapshots/` — all reviewed and
  approved; each differs from `ab0c078` and all 12 appear in the item-11 diff.
- 4 baselines in `tests/e2e/course-visuals.spec.ts-snapshots/` — the speech
  baselines. **They did not move.** Their SHA-256 was identical before and after
  the Playwright run, and `git diff --stat origin/master...HEAD` shows no change
  to that directory. A moved speech baseline would have been a stop-the-line
  blocker; none moved.

Screenshots reviewed (each opened and confirmed to show the surface it claims):
- `course-home-{desktop,mobile}` — A1 course home ("Percorso"): "Costruisci il
  giapponese, un ingranaggio alla volta", A1 with 12 modules / 48 lessons, the
  15 A1 Can-dos under "Cosa sai già fare".
- `a2-course-map-{desktop,mobile}` — A2 course map ("Corso A2"): 15 modules /
  60 lessons and the 59 A2 Can-dos.
- `a2-kanji-revealable-{desktop,mobile}` — A2 revealable kanji stage: each kanji
  shown inside its word with furigana and reveal (`±`) toggles.
- `a2-kanji-assessed-{desktop,mobile}` — A2 assessed kanji stage: reading
  withheld ("sei in fase di verifica, quindi la lettura non è mostrata qui"),
  no romaji/furigana leak on the assessed glyph.
- `a2-lesson-teiru-{desktop,mobile}` — A2 lesson "Sequenze e azioni in corso 3"
  (ている), full Regola/Confronto/Esplora/Ripasso lesson with 10 exercises and
  the optional speech block.
- `lesson-time-past-{desktop,mobile}` — A1 lesson "Passato e negazione 2", full
  lesson with 10 exercises and the optional speech block.
- `lesson-speech-consent-{desktop,mobile}` — the speech consent gate: privacy
  copy ("L'app non salva alcun audio e non conserva il testo riconosciuto") with
  "Ho capito, continua" / "Non ora".
- `lesson-speech-result-{desktop,mobile}` — the speech result: per-token
  "recognized" list and "Your browser recognized the sentence."
Verdict: **pass**

## 5. GITHUB_PAGES=true production build
Command: `GITHUB_PAGES=true npm run build` then `grep -o 'src="[^"]*"' dist/index.html`
and `grep -o 'href="[^"]*"' dist/index.html`
(run immediately before item 6 so the preview serves this exact artifact)
Output:
```
✓ 230 modules transformed.
dist/assets/course-a2-DRWLSAeA.js              465.09 kB │ gzip: 77.30 kB   (largest chunk)
✓ built in 643ms

# grep -o 'src="[^"]*"' dist/index.html
src="/nihongo-practice/assets/index-fgTHUphq.js"

# grep -o 'href="[^"]*"' dist/index.html
href="/nihongo-practice/favicon.svg"
href="/nihongo-practice/assets/vendor-DrNfcWTL.js"
href="/nihongo-practice/assets/course-foundations-FFo7yljR.js"
href="/nihongo-practice/assets/course-a1-CikFG_zU.js"
href="/nihongo-practice/assets/course-a2-DRWLSAeA.js"
href="/nihongo-practice/assets/style-bScKvLqn.css"
```
Every asset reference (the module `src` and all module-preload / stylesheet /
favicon `href`s) carries the `/nihongo-practice/` Pages base path. No bare
`/assets/...` reference remains.
Verdict: **pass**

## 6. Local Pages-base-path smoke tests
Command: `vite preview` (Pages base) then `curl` the base path, then a headless
browser loads an A1 and an A2 lesson and completes one exercise in each.
Output:
- Base-path HTTP status: `curl -sS -o /dev/null -w '%{http_code}' <base>/nihongo-practice/`
  returned **`200`**, and the served HTML carried the same six `/nihongo-practice/`
  asset paths listed in item 5.
- Browser smoke (headless Chromium, all requests observed):
  - A1 `#/percorso/past-negative/past-negative-2`: 10 exercises rendered;
    exercise #2 accepted after selecting a choice; feedback text "Corretto".
  - A2 `#/percorso/connected-conversation/connected-conversation-1`: 10 exercises
    rendered; exercise #1 accepted after selecting a choice; feedback "Corretto".
  - **console errors: 0; page errors: 0; HTTP 404s: 0; requests ≥400: 0;
    total requests observed: 17, all same-origin; non-origin requests: 0.**
- The preview server was stopped afterward with `kill <pid>`.

Environment note (recorded for reproducibility): ports 4173–4174 were already
bound by unrelated processes in this shared host, so this run's own preview
server was bound to a free port and driven there; the base-path behaviour under
test is independent of the port number. A plain `npx vite preview` (without
`GITHUB_PAGES=true`) serves at base `/`, so the Pages-built `index.html` — whose
asset URLs are hard-coded to `/nihongo-practice/...` — 404s every asset in a real
browser even though a `curl` of the base path still returns 200 via SPA
fallback. The preview must therefore be launched with `GITHUB_PAGES=true` for
this item to be a true base-path test; the plan's Step 6 command omits that env
var (recorded in full under "Plan defects found during verification", below).
Verdict: **pass**

## 7. Production and full dependency audits
Command: `npm audit --omit=dev` ; `npm audit`
Output (both audits produced byte-identical reports — the only advisory is on a
production dependency, so `--omit=dev` does not narrow it):
```
# npm audit report

react-router  7.12.0 - 8.2.0
Severity: high
React Router: RSC Mode CSRF Bypass Allows Action Execution Before 400 Response - https://github.com/advisories/GHSA-qwww-vcr4-c8h2
fix available via `npm audit fix --force`
Will install react-router@8.3.0, which is a breaking change
node_modules/react-router

1 high severity vulnerability
```
Both commands exited non-zero. Advisory **GHSA-qwww-vcr4-c8h2**, high, affects
`react-router`, vulnerable range `>=7.12.0 <8.3.0` (npm prints it as
`7.12.0 - 8.2.0`), first patched `8.3.0`. We declare `^7.18.1` and ship
**7.18.1**.

Verdict: **fail** — a high-severity advisory in the production audit blocks the
release per Section 21.4.

**Explicit, narrowly-scoped product-owner override.** Deployment is authorised
to proceed to Task 36 despite this fail, on the evidence below and nothing wider.

**Bottom line, before the apparatus:** the two decisive facts are that this
release changes exposure by **zero** — `react-router` is pinned at `7.18.1` at
both the currently-deployed commit `ab0c078` [as of the override date; see the
deploy-state correction below] and HEAD (point 4) — and that the
advisory's RSC-mode codepath cannot execute here, there being no RSC runtime
installed and no server on a static Pages site (point 2a/2b). A reader can stop
here for the conclusion; the full evidence, in descending strength, is in points
1–6 below.

**Deploy-state correction (added post-deploy).** Three places in this item — the
*Bottom line* above, the *Authoriser* bullet immediately below, and point 4
below — call `ab0c078` "the currently-deployed commit" / "the commit currently
serving learners." Those were accurate **as of the override date, 2026-08-02,
before this release was deployed**, when `ab0c078` was in fact the served commit;
they are preserved as the point-in-time statements they were, not rewritten. The
release has since deployed at **`426cee8`** — recorded under **Deployment** below
(*Release identity* gives the deployed SHA; *Gate re-run at the deployed SHA*
re-gates it), with the click-path regression corrected in *Post-deploy correction
— Task 37* below. This corrects the **label only**: `react-router` is pinned at
`7.18.1` at `426cee8` as well (`git show 426cee8:package-lock.json` →
`"version": "7.18.1"`), so the advisory exposure is unchanged and the override
ruling in this item is **not** reopened.

- **Authoriser:** Riccardo Chiodaroli, repository owner and product owner. The
  attribution is verifiable, not asserted: he is the git author of `ab0c078`, the
  commit currently serving learners [as of the override date, 2026-08-02,
  pre-deploy; see the deploy-state correction above] — `git --no-pager log -1 --format='%an'
  ab0c078` returns `Riccardo Chiodaroli`.
- **Date:** 2026-08-02, during the Phase 4 release-execution session.
- **Scope, verbatim:** the override authorises "deploying *this* release with
  *this* advisory outstanding"; it "is not a standing exemption for high-severity
  production advisories." It covers only GHSA-qwww-vcr4-c8h2 at this commit.
- **Disclosed weakness of this authorisation:** it was given conversationally
  during release execution and is **not** recorded in a tracked issue or pull
  request. That is this record's weakest link, stated rather than omitted: a
  reader cannot today follow a link to the decision. Recommendation: before or
  immediately after Task 36, ratify this override in a durable tracked artifact
  (a GitHub issue or a decision record committed under `docs/`) so the
  authorisation is pinned the way every other load-bearing fact here is. This IOU
  now has a holder: it is tracked as **D-6** in
  `docs/superpowers/backlog/2026-07-18-phase-4-deferred.md`.

Why the override holds — measured, not argued from the manifest:

1. **The production dependency closure is eight packages, not three.** From
   `npm ls --omit=dev --all`:
   `react@18.3.1`, `react-dom@18.3.1`, `react-router@7.18.1`, `cookie@1.1.1`,
   `set-cookie-parser@2.7.2`, `loose-envify@1.4.0`, `js-tokens@4.0.0`,
   `scheduler@0.23.2`. `cookie` and `set-cookie-parser` are react-router's own
   server-side helpers and sit **under** react-router in the tree.

2. **No RSC/streaming or cookie-serialisation strings survive into the shipped
   bundle, and no RSC runtime is installed at all.** The advisory is an RSC-mode
   CSRF bypass, so the question is whether any RSC/server request-handling path
   can reach a learner. The checks below run in descending order of strength —
   (a) and (b) do not depend on grep at all; (c) is a robust literal probe;
   (c′) is a weaker corroborating identifier probe; (d) records the minification
   that makes (c′) weaker than (c) — each with the command that produced it (run
   this session against the item-5 `dist/`):

   **(a) No RSC runtime is installed anywhere in the tree — strongest, and
   independent of the bundler.** RSC requires a `react-server-dom-*` runtime
   (`react-server-dom-webpack`, `-turbopack`, or equivalent). None is installed,
   in production or in dev: `npm ls --all | grep -i server-dom` (the whole tree,
   dev dependencies included) returns **nothing**, and so does the production-only
   `npm ls --omit=dev --all | grep -i server-dom`; the production closure is
   exactly the eight packages in point 1. The dev-inclusive check matters because
   a dev-only RSC runtime could still reach `dist/` through the bundler — but there
   is none, and the bundler is not configured for RSC either: `vite.config.ts`
   uses plain `@vitejs/plugin-react` (`plugins: [react()]`) with no RSC bundler
   plugin and no `@react-router/dev`. These are statements about what is installed
   and configured, not about what survived a grep, so minification cannot weaken
   them. (This is not the discredited manifest argument — that one was wrong
   because it undercounted the closure as three packages; this one is about a
   specific package family being absent from the correct eight-package closure and
   from the whole tree.)

   **(b) There is no server to attack — structural.** This is a static GitHub
   Pages site with hash routing and no server process of any kind; an RSC-mode
   CSRF has no request-handling code path to reach here.

   **(c) Cookie-serialisation option literals are absent from the shipped bytes —
   robust.** These four tokens are option *property names* / header literals — the
   same class the control probe below validates — so a minifier preserves them and
   a 0-file result is real evidence of absence:
   - `grep -rlE 'sameSite|set-cookie|maxAge|partitioned' dist/`
     → **0 files** (cookie-serialiser option names — literals in the source).

   **(c′) RSC/streaming/cookie *function and export names* are absent too — but
   this is corroboration, not robust proof.** These are identifiers, and a
   minifier *can* rename them, so a 0-file result here is weaker than in (c). They
   are recorded without the robustness claim; their categorical exclusion is
   already delivered by layers (a) and (b), which do not depend on grep at all, so
   demoting them costs nothing:
   - `grep -rlE 'splitCookiesString|createStaticHandler|renderToPipeableStream|renderToReadableStream|createFromFetch|RSC' dist/`
     → **0 files**.

   **(d) Evidence that the bundle is minified — the basis for treating (c′) as
   weak and (c) as robust.** The vendor bundle is minified: local identifiers are
   mangled — the file opens `var Ku={exports:{}},_r={},Yu={exports:{}},q={};` and
   defines functions such as `function j(){`, `function ri(){`, `function rt(){`.
   This is why an identifier grep like (c′) returning 0 files proves only that the
   *string* is absent, not that the code is — a bundled function can be renamed to
   `j()` — whereas a property-literal grep like (c) is trustworthy. Layers (a) and
   (b), which do not grep at all, are what carry the weight.

   **Control probe (validates the method for layer (c)).** A negative grep is only
   meaningful once the same method can produce a positive against the same
   minified output. String literals and property names that we *expect* to be
   present are:
   - `grep -rl 'useState' dist/` → **9 files**
   - `grep -rl 'createElement' dist/` → **2 files**
   - `grep -rl 'Minified React error' dist/` → **1 file**

   All present — so terser preserves string literals and property names here, and
   the 0-file results in (c) are genuine absences rather than a broken probe.

3. **Disclosed booby-trap:** `unstable_` **does** appear in
   `dist/assets/vendor-DrNfcWTL.js` — exactly **25** distinct identifiers, all
   React scheduler / react-dom internals, **none an RSC API**:
   `unstable_IdlePriority`, `unstable_ImmediatePriority`, `unstable_LowPriority`,
   `unstable_NormalPriority`, `unstable_UserBlockingPriority` (the five priority
   constants); `unstable_cancelCallback`, `unstable_continueExecution`,
   `unstable_forceFrameRate`, `unstable_getCurrentPriorityLevel`,
   `unstable_getFirstCallbackNode`, `unstable_next`, `unstable_now`,
   `unstable_pauseExecution`, `unstable_requestPaint`, `unstable_runWithPriority`,
   `unstable_scheduleCallback`, `unstable_shouldYield`, `unstable_wrapCallback`,
   `unstable_Profiling` (scheduler timing/callback controls);
   `unstable_act`, `unstable_batchedUpdates`, `unstable_isNewReconciler`,
   `unstable_renderSubtreeIntoContainer`, `unstable_scheduleHydration`,
   `unstable_strictMode` (react-dom internals). Named here so a sceptical reader
   finds it already accounted for.

4. **Exposure change from shipping this release is zero.** `react-router` is
   locked at `7.18.1` in `package-lock.json` at **both** `ab0c078` (the
   currently-deployed commit) [as of the override date; see the deploy-state
   correction above] and HEAD. The advisory is already live in
   production; this release neither adds nor removes it.

5. **The fix was evaluated and declined.** `npm audit fix --force` would install
   `react-router@8.3.0`, a breaking major that requires react ≥ 19.2.7 against
   our 18.3.1 — two coupled major upgrades. Declined for this release; tracked
   for a later dependency-upgrade task.

6. **Why the advisory was not caught earlier: no mechanism established.** Two
   candidate explanations were proposed and both were falsified by direct probing,
   and are recorded here so the falsification is reconfirmable — not to resurrect
   either:
   - **(a) "The advisory feed was ~7 days stale."** Falsified: the evidence
     offered for it measured a different thing entirely — the version of a
     TypeScript nightly build — which says nothing about advisory-feed latency.
     The premise was not supported by what was actually measured.
   - **(b) "Advisories only attach to versions in the `latest` dist-tag
     lineage."** Falsified directly by `react-router@6.30.4`: it resolves under
     the `version-6` dist-tag (`npm view react-router dist-tags` →
     `version-6: 6.30.4`, `latest: 8.3.0`), was published 2026-05-29
     (`npm view react-router@6.30.4 time` → `2026-05-29T19:41:45Z`), and was never
     `latest`, yet it is correctly *excluded* from the advisory's `>=7.12.0`
     range. Advisory attachment plainly does not track the `latest` lineage.

   Both theories failed; neither was partly right. We do not record a
   plausible-but-unverified replacement. The honest state is that we do not know
   why, and the next person should treat that as an open question rather than a
   closed one.

## 8. Generated per-lesson/module/level content QA reports
Command: `npx vite-node scripts/generateContentReports.ts` ;
`npx vite-node scripts/validateA1Release.ts` ;
`npx vite-node scripts/validateA2Release.ts` ;
`npx vite-node scripts/lintA2NoJapanese.ts`
Output (verbatim):
```
generateContentReports: wrote 164 lines to .../docs/release/content-reports/a1-content-report.md
generateContentReports: wrote 331 lines to .../docs/release/content-reports/a2-content-report.md
validateA1Release: OK — the A1 release catalog is content-valid (0 errors).
validateA2Release: OK — the A2 release catalog is content-valid (0 errors). 60 lessons, 15 modules, 59 Can-dos, 120 kanji.
lintA2NoJapanese: OK — 0 Japanese-literal violations across 15 A2 content module file(s).
```
Determinism check: SHA-256 of the two tracked reports was identical before and
after regeneration —
`a1-content-report.md` `f1648db44a787b690eb9dfa2f82f1d3ea35f13051e5a801582a13b2a6fb6c228`,
`a2-content-report.md` `80900702595e9d2ff6fd03b954ce3a4c3fddf5d107deaa08640a039001f1500d` —
and `git status --porcelain docs/release/content-reports/` printed **nothing**.
Regeneration is byte-stable; no finding.

Per-level rows, verbatim from the generated reports:
```
A1:  | a1 | 12 | 48 | 352 | 480 | 220 | 40 | 37 |
       (Level | Modules | Lessons | Models | Exercises | Transfers | Phonetic items | Verb records)
A2:  | a2 | 15 | 60 | 508 | 600 | 300 |
       (Level | Modules | Lessons | Models | Exercises | Transfers)
```
Together: 27 modules, 108 lessons (see referents header).
Verdict: **pass**

## 9. Alias, secret, workflow-trigger and external-request inspection
Command:
```
grep -n 'alias' vite.config.ts tsconfig.json
grep -rniE 'api[_-]?key|secret|token|password|bearer ' src scripts --include='*.ts' --include='*.tsx' | grep -v '\.test\.'
grep -n 'on:' -A 4 .github/workflows/deploy-pages.yml
grep -rnE 'fetch\(|XMLHttpRequest|new WebSocket|navigator\.sendBeacon|https?://' src --include='*.ts' --include='*.tsx' | grep -v '\.test\.'
```
Output:
- **Aliases:** no match in `vite.config.ts` or `tsconfig.json` (grep exit 1).
  There is no path-alias mechanism to escape the repo.
- **Secret-like literals:** 1371 matches, and **every one is the substring
  "token"** from the romaji token data model (`AssembledToken`, `tokenId`, …).
  The keyword breakdown is `api[_-]?key: 0`, `secret: 0`, `password: 0`,
  `bearer : 0`, `token: 1371`. No credential literal exists outside test
  fixtures — none exists at all.
- **Workflow triggers:** `.github/workflows/deploy-pages.yml` declares
  ```
  on:
    workflow_dispatch:
  ```
  and nothing else (no `push`, no `pull_request`). The `validate-ref` job's
  "Require master" step (`if [[ "$GITHUB_REF" != "refs/heads/master" ]]; then …
  exit 1`) is intact, so the deploy job runs only from `master`.
- **External requests:** the exact command returns **no lines** — no `fetch(`,
  `XMLHttpRequest`, `new WebSocket`, `navigator.sendBeacon`, and **0** absolute
  `http(s)://` occurrences in shipped (non-test) source. A follow-up
  `grep -rniE 'fetch|websocket|xmlhttprequest|sendbeacon' src …` (non-test) also
  returns nothing, so there is no runtime external request in shipped source.
Verdict: **pass**

## 10. Standards-language review against Section 3 sources
Command: manual review, recorded separately.
Output: see `docs/release/2026-07-18-standards-language-review.md` (Task 34). All
four Section 3.2 sources (Irodori "about", Japan Foundation Irodori overview, and
the two Council-of-Europe CEFR pages) were consulted on 2026-07-18. Two
learner-facing corrections were applied in that task's commit (level-badge
attribution "our alignment to …"; removal of an alignment tail from four
first-person scenario Can-dos). After them, "every learner-facing claim is
defensible against all four sources without implying external accreditation or
Japan Foundation approval." No curriculum/text/assessment copying; no
approval/endorsement language. That review also independently confirms the
27-module / 108-lesson / 74-Can-do / 809-sentence corpus figures used here.
Verdict: **pass**

## 11. Final tracked-content and Git status review
Command: `git status --short` ; `git --no-pager log --oneline origin/master..HEAD` ;
`git --no-pager diff --stat origin/master...HEAD`
Output:
- `git status --short` printed **nothing** (working tree clean; verification
  scratch files were removed before this check).
- `git log --oneline origin/master..HEAD` lists **79 commits**, from
  `9e78940 docs: measure the shipped bundle for D-5 and correct the baseline count`
  (HEAD) down to `d20c7e6 docs: Phase 4 plan and recorded spec Amendment 1` (the
  plan's first commit) — exactly the commits this phase created.
- `git diff --stat origin/master...HEAD` summary: **102 files changed, 8618
  insertions(+), 796 deletions(-)**. Reading the whole stat, every changed path
  falls inside the plan's file-structure map — top-level breakdown: `src/` 72,
  `tests/` 18, `docs/` 7, `scripts/` 2, `README.md` 1, `package.json` 1,
  `vite.config.ts` 1. A path filter for anything outside
  `{src,tests,scripts,docs,.github}/`, `README.md`, `package.json`,
  `package-lock.json`, `index.html`, `vite.config.ts`, `tsconfig.json`,
  `playwright.config.ts` returned **nothing**. The 12 changed PNG baselines are
  all in `screenshots.spec.ts-snapshots/`; the 4 speech baselines do not appear
  (unchanged), corroborating item 4. `package-lock.json` is unchanged, so the
  react-router version is identical to production.

Supporting invariant (recorded here, measured this run): the A2 editorial golden
`src/course/a2/catalog/a2EditorialSurfaces.golden.json` is at SHA-256
`6ce32b1fd05ead0c10f494549e090d1cf7328734e2cc9041635f320270b2b38f` with **809**
rows — unchanged, as required.
Verdict: **pass**

---

## Plan defects found during verification

Defects in the plan's own Section 21.4 step text, found while executing the
eleven items. Each is a fault in the instructions, not in the code under test;
every empirical measurement above stands.

1. **Step 6's command is broken — a status-only check passes a completely
   broken page.** The plan prescribes `npx vite preview --port 4173` with **no**
   `GITHUB_PAGES=true`. The Pages-built `dist/index.html` hard-codes every asset
   URL under `/nihongo-practice/`; `vite preview` without that env var serves at
   base `/`, so **every asset 404s in a real browser**. A `curl` of
   `http://localhost:<port>/nihongo-practice/` nonetheless returns **`200`**,
   because vite's SPA fallback answers the navigation request with `index.html`
   regardless of whether the assets it references exist. So the plan's prescribed
   check — an HTTP status on the base path — reports success on a page that
   renders nothing. I found this only by **loading the page** and observing the
   asset 404s, not by trusting the 200. I re-ran the smoke test with
   `GITHUB_PAGES=true` set on the preview server, and it then passed cleanly
   (0 console errors, 0 page errors, 0 HTTP 404s), which is the result recorded
   in item 6. Remedy: Step 6 must launch the preview with `GITHUB_PAGES=true`.

2. **Step 2's baseline is stale.** The plan's Step 2 text cites "190 files /
   3684 tests". The real figure at the verified SHA is **199 files / 3759
   tests** (item 2). A floor set at 190/3684 would silently pass a run that had
   lost nine test files or seventy-five tests to a regression; the gate must
   assert the current totals, not the old ones.

3. **Step 10's prose numbering disagrees with the template it hands you.** The
   step text labels the final git-status review "Item 11", while the document
   template it prescribes numbers standards-language review as item 10 and the
   git review as item 11. I followed the template (standards = 10, git = 11),
   which is the numbering Section 21.4 intends; the discrepancy is in the step's
   prose, not the template. Recorded so a reader cross-checking step text against
   section headings is not misled.

No plan defect beyond these three was encountered while executing items 1–11.

---

## Overall verdict

**Release** — proceed to Task 36 (deploy), on Riccardo Chiodaroli's explicit,
narrowly-scoped override of item 7 (authoriser, date, verbatim scope, and the
disclosed weakness that it is not yet in a tracked artifact are recorded under
item 7) and nothing wider.

Ten of the eleven items pass on direct measurement: clean install (1), the full
199-file / 3759-test unit+property suite (2), typecheck + standard build (3),
the 400-passed / 58-skipped / 0-failed Playwright suite with all 16 baselines
reviewed and the four speech baselines provably unmoved (4), the Pages-base build
with every asset under `/nihongo-practice/` (5), the live base-path smoke test
with one exercise completed in an A1 and an A2 lesson and zero console errors /
404s / external requests (6), byte-stable content reports (8), a clean
alias/secret/workflow/external-request inspection (9), a standards-language
review defensible against all four sources (10), and a clean tree whose 79
commits and 102 changed files all fall inside the plan's file map (11).

Item 7 is a **fail** and is recorded as one: high-severity advisory
GHSA-qwww-vcr4-c8h2 in the production audit. The override rests on measured, not
asserted, evidence — a four-layer argument (no RSC runtime installed → no server
to attack → cookie/RSC string literals absent from the shipped bytes, with a
control probe proving the method → minification-limited identifier probes), each
check with its command, set out in full under **item 7** and deliberately not
re-enumerated here so this summary cannot drift out of step with it. The
load-bearing conclusion is that exposure is unchanged by this release. The clean
fix (react-router 8.3.0) requires a second major upgrade (react ≥ 19.2.7 vs. our
18.3.1) and is deferred. Why the advisory escaped earlier detection: **no
mechanism established** — see item 7, point 6.

---

## Deployment

Executed as **Task 36** on **2026-08-02**, the final and only irreversible item
of the Phase 4 plan. This is the deploy of the gated SHA to the live GitHub
Pages site and its post-deploy verification. Each figure sits beside the command
that produced it, and the one live-check concern below is recorded as measured,
not smoothed over.

### Release identity — fast-forward, not merge

- Release SHA (deployed): `426cee86fdf9d4d2ba7fdafbdab981355f806c67` (full 40 characters).
- Pre-release live SHA: `ab0c0789236c53b754c591fa1c2cc43c86e4ad0e`.

`origin/master` was an **ancestor** of HEAD
(`git merge-base --is-ancestor origin/master HEAD` → exit 0), so
`git push origin HEAD:master` is a **fast-forward**: master's tip becomes
*literally* the gated SHA — identity, not a new merge commit carrying an equal
tree. No merge, no merge commit, no `--no-ff`, on Riccardo Chiodaroli's ruling
that the object verified and the object deployed must be the same object.

- Pre-push assertion: `git rev-parse origin/master` = `ab0c0789236c53b754c591fa1c2cc43c86e4ad0e` — unchanged from the value measured at dispatch, so no concurrent push had voided the plan.
- Push: `git push origin HEAD:master` → `ab0c078..426cee8  HEAD -> master`.
- Read-back: `git ls-remote origin master` → `426cee86fdf9d4d2ba7fdafbdab981355f806c67`, equal to the release SHA exactly. Success is taken from this read-back, not inferred from the absence of an error message.

### Gate re-run at the deployed SHA

Item 25 of the verification promised that Task 36 re-runs every gate at the final
deployed SHA; this is that run, at HEAD `426cee8`. All figures carry their
referent.

| Gate | Command | Result (as measured) |
|---|---|---|
| Clean install | `npm ci` | clean — 152 packages added, 153 audited |
| Unit + property suite | `npx vitest run` | **199 files / 3759 tests** passed (A1 + A2) |
| Typecheck | `npx tsc --noEmit` | clean — exit 0, no output |
| Prebuild validator | `npm run prebuild` | **60 lessons, 15 modules, 59 Can-dos, 120 kanji (A2 only)**; **0** Japanese-literal violations |
| Standard build | `npm run build` | succeeded; largest chunk `course-a2` **465.09 kB** |
| Playwright suite | `npx playwright test` | **400 passed / 58 skipped / 0 failed** |

**Tripwire — the four speech baselines.** The 4 PNGs in
`tests/e2e/course-visuals.spec.ts-snapshots/` were captured with `shasum -a 256`
*before* the Playwright run and compared *after*: byte-identical, and
`git status --short` showed no snapshot bytes moved. Only the 12 baselines in
`tests/e2e/screenshots.spec.ts-snapshots/` belong to this phase; none of the 4
speech baselines moved, so the tripwire did not fire and no escalation was
warranted.

### Deployment artifact — `GITHUB_PAGES=true`

`GITHUB_PAGES=true npm run build` produces the artifact that actually ships: the
base path becomes `/nihongo-practice/`, which changes the content — and therefore
the content hash — of 12 of the 23 assets versus a plain `npm run build`. The
load-bearing hashes below are each from `shasum -a 256 dist/assets/<file>` on
**my own** Pages build, not accepted from any document:

| Asset (`GITHUB_PAGES=true` build) | `shasum -a 256` |
|---|---|
| `course-a1-CikFG_zU.js` | `96c19f1b09db6a3ebe088a4e6abd5e25b60feabc31bebb26229875528696f5c2` |
| `course-a2-DRWLSAeA.js` | `7e24cd7a939b81d9c64525a02d83c4e1e831d71ec1c2962787e11ac98edde6f2` |
| `course-foundations-FFo7yljR.js` | `84c6b987580d57f291c33640009bfc69f135ddc8a126ff03b5f1796565470e84` |
| `index-fgTHUphq.js` | `ae2a2adf2ef456460f40feba7bf23d932194664643a59e71a58579d144788fd9` |
| `vendor-DrNfcWTL.js` | `76d8ceb3536841f92229f1c2b5470c479c6ccb08321c12eed52b8fcd22ff057d` |
| `style-bScKvLqn.css` | `99ed13802a2dd090139d56c7aed71d735799f134729f7f2e1ab7bbebcebd2543` |

### Rollback path — recorded before the push, while it cost nothing

`.github/workflows/deploy-pages.yml:19-24` hard-requires `refs/heads/master`, so
rollback is **not** a branch move or force-push. It is a revert commit on master
that restores the pre-release tree `ab0c0789` (moving master *forward*, which
satisfies the workflow's ref gate), followed by a re-dispatch. It must run in the
**master worktree** (`/Users/ricchi/Repos/nihongo-practice`), never in this
Phase-4 worktree. Recorded here verbatim, exactly as written before the deploy:

```
cd /Users/ricchi/Repos/nihongo-practice
git fetch origin
git checkout master
git pull --ff-only origin master
git read-tree -u -m ab0c0789236c53b754c591fa1c2cc43c86e4ad0e
git commit -m "revert: roll back GitHub Pages to ab0c0789 (pre-Phase-4 live)"
git push origin master
gh workflow run "Deploy GitHub Pages" --ref master
gh run watch <id>
```

This path was **recorded but not exercised.** No marker or gate failed at the
deploy, and the single live-check concern below (Check 7) is an in-code defect
**pre-existing relative to the deployment** — present identically in the gated
bytes, so a rollback of the deploy would not fix it (though it was introduced
*earlier within Phase 4 itself*, by `a033a8c`; see *Post-deploy correction —
Task 37* below). Rolling back would delete the whole Task 27 feature rather than
fix it, and a wrong rollback is worse than a fix-forward.

### Dispatch and confirmation

- `gh workflow run "Deploy GitHub Pages" --ref master` → run **30751862964**.
- `gh run watch 30751862964` → every job green.
- `gh run list --workflow "Deploy GitHub Pages" --limit 1 --json headSha,conclusion,url`:
  - `headSha` = `426cee86fdf9d4d2ba7fdafbdab981355f806c67` — equals the release SHA exactly.
  - `conclusion` = `success`.
  - `url` = <https://github.com/unsafecode/nihongo-practice/actions/runs/30751862964>.

A green run proves a job exited zero, not that the site serves the gated bytes.
The markers below are that proof.

### Post-deploy markers — as measured

Base URL: `https://unsafecode.github.io/nihongo-practice/`

**404 property (confirmed, not assumed).** A missing asset returns a *real* 404,
not a `200` carrying an SPA fallback, which is what makes presence meaningful:

- `curl -s -o /dev/null -w "%{http_code}" $BASE/assets/course-a2-DOESNOTEXIST.js` → `404`
- `curl -s -o /dev/null -w "%{http_code}" $BASE/` → `200`

**Marker 1 (primary) — served `course-*` chunk bytes vs. my Pages-build hashes.**
Command per file: `curl -s $BASE/assets/<file> | shasum -a 256`.

| Served chunk | `shasum -a 256` of served bytes | equals build hash above? |
|---|---|---|
| `course-a1-CikFG_zU.js` | `96c19f1b09db6a3ebe088a4e6abd5e25b60feabc31bebb26229875528696f5c2` | yes |
| `course-a2-DRWLSAeA.js` | `7e24cd7a939b81d9c64525a02d83c4e1e831d71ec1c2962787e11ac98edde6f2` | yes |
| `course-foundations-FFo7yljR.js` | `84c6b987580d57f291c33640009bfc69f135ddc8a126ff03b5f1796565470e84` | yes |

All three served hashes equal the corresponding `dist/assets` hashes exactly.
These three chunks are **new files that never existed on the live site**, so no
stale/cached copy can satisfy them — presence, integrity, and gated-byte
identity are proven at once, immune to caching.

**Marker 2 (secondary) — cache-busted `index.html`.**
`curl -s "$BASE/?cachebust=$(date +%s)" | grep -oE 'assets/index-[A-Za-z0-9_]+\.js'`
→ `assets/index-fgTHUphq.js`, the index chunk from my own Pages build. A
`grep -c 'index-DrfSmasq.js'` of the same fetch returns `0`: the previously-live
index chunk (`index-DrfSmasq.js`) is gone.

**Marker 3 (disclosed trap) — the vendor invariant.**
`curl -s $BASE/assets/vendor-DrNfcWTL.js | shasum -a 256` →
`76d8ceb3536841f92229f1c2b5470c479c6ccb08321c12eed52b8fcd22ff057d` (begins
`76d8ceb3`), byte-identical to the pre-release vendor chunk because no dependency
changed. **This marker misleads in both directions and is named here as a trap:**
its being unchanged does **not** mean the deploy failed, and its being present
does **not** mean the new build is live — it was already there under `ab0c0789`.
It proves nothing on its own; Marker 1 is what proves the new build is served.

### Live browser verification — nine checks

Run with the Playwright browser tools against the live URL. Each records what
actually rendered, not merely that the page loaded without error.

**Provenance — observation-only.** These nine checks were measured live with the
Playwright browser tools against the deployed site
(`https://unsafecode.github.io/nihongo-practice/`) at the deployed SHA
`426cee8`, during the release-execution session. Alone among this record's
evidence, they are **not reproducible from the repository at any SHA**: a reader
holding the tree and `git` cannot re-derive them and must open the site to look.
This is provenance, not doubt — they are the strongest evidence here, and this
very class of check — opening the deployed artifact in a browser — is what
caught the Task 37 defect after every gate had passed green.

1. **PASS (Task 29).** Home shows a visible, labelled level control — a `navigation` landmark labelled "Livello del corso" carrying the A1 and A2 selectors.
2. **PASS.** Switched to A1, opened `past-negative-2`, completed Exercise 2 (chose particle に) → "✓ Corretto".
3. **PASS (Task 14).** A2 `connected-conversation-3`: the corrected clarify lines read as vocative address — `えみさん、…` / `そらさん、…` (name + さん + comma), with no は topic marker standing before an interjection.
4. **PASS (Task 15).** `travel-reservations-4`: the front desk is addressed as フロント (4 occurrences in the rendered lesson, measured live); 店員 and 店員さん appear **0** times.
5. **PASS in both IT and EN (Task 26).** An A2 kanji panel shows each taught glyph inside its word with visible emphasis — `.kanji-ruby__word-target` renders at `font-weight: 800` with a 2px orange `rgb(228, 87, 46)` underline — and the intro copy no longer claims the kanji appear in the sentences. This was the release's most serious defect (a false learner-facing claim, live in both languages); it is fixed on the served site.
6. **PASS (Task 28).** Rōmaji script mode at the revealable kanji stage (`sequencing-ongoing-3`): the revealable kanji (毎日 / 寝る / 起きる / 使う / 作る) show **no** reading until the ± control is used; taught kanji still show their readings.
7. **Superseded in part — see *Post-deploy correction — Task 37* below.** Check 7 recorded only the scroll reset; the full harm — including a false "page not found" banner rendered in **both languages** — was traced afterwards, and the concern was then found to be a **Phase 4 regression** (introduced by `a033a8c`), not the pre-existing defect its placement here suggests. The measured observation below stands exactly as recorded; the supersession is added around it, not applied to it. **CONCERN — the check is half-met (Task 27).** The checkpoint section *does* describe how the evidence accrues — "Your checkpoint is met automatically once every scenario lesson is consolidated. There is no separate test to sit." — and its link *does* target the Can-do breakdown (`href="#can-do-summary"`, whose section heading is "What you can do so far"). **But the link does not leave the learner at that breakdown.** Measured: with the link in view (`window.scrollY` 4788, link top 338 px), a real click scrolls natively to the section for one frame (`hashchange` → `#can-do-summary`, `window.scrollY` 4159), then the page immediately resets to the top — `window.scrollY` **0**, the Can-do section left at viewport-relative top 4159 px (out of a 720 px viewport), stable across a 1 s post-click wait and reproduced on a clean reload. Root cause, traced in the *deployed* code: a plain `<a href="#can-do-summary">` makes `HashRouter` parse `can-do-summary` as an unknown route → the catch-all `InvalidRoute` (`src/routing/routes.tsx:238`) issues `<Navigate replace to="/percorso">` (`src/routing/routes.tsx:118-127`), and that redirect drives `RouteScrollManager` — which honours only *validated lesson-section* anchors (`src/routing/scrollPlan.ts`) — to a "reset" plan that runs `window.scrollTo({ top: 0 })` (`src/routing/RouteScrollManager.tsx:69-71`), clobbering the native anchor scroll. This is a deterministic, in-code defect present identically in the gated bytes (Marker 1 proves the deploy shipped exactly those bytes), so it is **not a deployment fault and not a rollback trigger** — it is recorded here for a fix-forward on Task 27's link wiring.
8. **PASS (Section 20 privacy).** On reload, all **18** network requests (`browser_network_requests`) target the Pages origin `unsafecode.github.io` — the app chunks, the self-hosted Manrope `.woff2` fonts, and the favicon. **Zero** third-party requests of any kind.
9. **PASS (Task 25).** Synthesis lesson `a2-synthesis-1` ("Bringing It Together 1") reads as a two-speaker scene: its sentence matrix attributes lines to two distinct speakers — "Me (the learner)" ("I'm planning to go to Kyoto this weekend.") and "A friend" ("Nice. I intend to meet a friend this weekend." / "Sora is planning to swim at the sea this weekend."). The friend's turn reads as a conversational reply, and both the Compare and Recap panels foreground "Who is speaking".

### Final git state and the docs-only follow-up

This record is committed on `unsafecode-execute-phase-4` and then fast-forwarded
to master. Master's tip therefore moves **one docs-only commit past the deployed
SHA `426cee8`** — expected, and it changes nothing a learner downloads: this
commit touches only `docs/`, and `dist/` is built from `src/`, `index.html`, and
the build config, none of which a docs-only commit modifies. The served bytes
remain those of `426cee8`, as Marker 1 proves.

- Deployed SHA: `426cee86fdf9d4d2ba7fdafbdab981355f806c67`.
- Workflow run: <https://github.com/unsafecode/nihongo-practice/actions/runs/30751862964>.
- Live URL: <https://unsafecode.github.io/nihongo-practice/>.
- Date: **2026-08-02**.

---

## Post-deploy correction — Task 37 (out of plan)

Check 7 above ("CONCERN — the check is half-met") was not a pre-existing defect
that survived into Phase 4 — it was a regression **Phase 4 itself introduced**.
It is corrected here as **Task 37**, an out-of-plan corrective task, on commits
`d1bbd47` → `3b46942` → `e8e1b37` → `3e3740c` → `1aa54dc` → `2156c0c` →
`bbf565f`, which passed both a spec-compliance review and a code-quality review.
This section records what happened, what is fixed, and what remains
true-but-unfixed. No production behaviour beyond the checkpoint control changed.

### The defect — precisely

The checkpoint control on the course home rendered as `<a
href="#can-do-summary">` — "Vedi le prove dei tuoi Can-do" / "See your Can-do
evidence". (At the deployed SHA `426cee8`, `CheckpointState.tsx` declared
`readonly linkHref: string` and rendered `<a className="checkpoint-state__link"
href={linkHref}>`.)

The app mounts a **`HashRouter`** (`src/App.tsx:41`), so the URL fragment **is**
the route. Clicking set the hash; the router read path `/can-do-summary`; it
matched no route; it fell to the `*` catch-all (`src/routing/routes.tsx:238`) →
`InvalidRoute` (`src/routing/routes.tsx:118`), which issues `<Navigate replace
to="/percorso" state={{ invalidPath: location.pathname }}>`. That one redirect
has two consequences, both from the same `<Navigate>`:

1. `RouteNotice` — mounted on the course home (`RouteNotice.tsx`, rendered at
   `CourseHome.tsx:172`) — reads `location.state.invalidPath` and renders a
   warning-styled banner (`<Notice tone="warning">`, `RouteNotice.tsx:29`):
   - IT — "Pagina non trovata" / "La pagina “/can-do-summary” non esiste. Sei
     tornato al percorso."
   - EN — "Page not found" / "“/can-do-summary” does not exist. You are back at
     the course."
2. the route transition drives `RouteScrollManager` to reset scroll to the top —
   the scroll-reset facet already recorded in Check 7. Both facets are the one
   redirect; Check 7 saw the reset, this trace adds the banner.

So clicking the site's own link told the learner, in **both languages**, in a
warning banner, that a section rendered **on the very page they were viewing**
does not exist. The `#can-do-summary` section is rendered directly above the
control (`CourseHome.tsx:256-301`; the control at `:303`); it is present, not
missing.

Facts stated precisely, because each was verified and each is easy to get subtly
wrong:

- **Warning-styled, but politely announced — it does not interrupt.** The
  container is `class="notice notice--warning"` with **`role="status"`**, not
  `role="alert"`: `src/components/Notice.tsx:27` computes `const role = tone ===
  "error" ? "alert" : "status"`, and this Notice is `tone="warning"`.
  `role="status"` is a polite live region — announced, but it does not interrupt
  the screen reader.
- **The commit that shipped it.** The defect was introduced by **`a033a8c`**,
  whose subject is *"fix(ui): describe how the checkpoint is actually met"*. The
  commit that fixed a false learner-facing claim shipped a false learner-facing
  claim — the sharpest instance of this release's own thesis.
- **Against Check 5's "most serious defect."** This is the **same class** as the
  kanji-intro claim at Check 5 above — a false learner-facing claim, live in both
  languages — which that check calls *"the release's most serious defect."* The
  two superlatives measure **different axes** and do not compete. Check 5 ranks
  **reach**: the kanji claim sat in the A2 kanji panel's taught-content copy,
  shown without any interaction; this banner misfires only when the one
  checkpoint control is activated (or the fragment is cold-navigated), is
  *politely* announced (`role="status"`), and leaves the named section visible on
  the page. *"Sharpest instance of this release's own thesis"* ranks
  **self-reference** — that the corrective commit `a033a8c` shipped the very
  class it set out to fix. On reach this defect is **narrower** than Check 5's;
  on self-reference it is the release's worst, and unlike Check 5's it cleared
  every gate and was caught only post-deploy.
- **A test asserted the defect.** `src/course/components/CourseHome.test.ts:503`
  (at the deployed SHA `426cee8`) asserted
  `expect(html).toContain('href="#can-do-summary"')` — a test asserting the
  presence of the very attribute that constitutes the defect. It was deleted
  rather than adapted.
- **Neither the gates nor the author caught it.** Every gate was green at
  `426cee8`. It was found by the post-deploy live check (Check 7) — by opening
  the deployed site in a browser. That check existed because someone judged
  verifying the deployed artifact worth the trouble, and it paid for itself on
  its first run.
- **The URL was broken independent of the click.** Navigating cold to
  `https://unsafecode.github.io/nihongo-practice/#can-do-summary`, with no click
  at all, lands on `#/percorso` with the same banner — the same `InvalidRoute`
  redirect, reached without a click (recorded as measured live; the mechanism is
  the code path above).

### The fix

- The control is now a **`<button type="button">`**, not an anchor
  (`CheckpointState.tsx:95-101`). Under a hash router the section has no URL, so
  an `<a href>` advertised a destination that does not exist.
- An earlier iteration (`d1bbd47`) kept the anchor and intercepted the click with
  `preventDefault`. It was **withdrawn** (`2156c0c`), because `preventDefault`
  intercepts a *click*, not an *href*: ⌘/middle-click, "copy link address",
  bookmarking, and session restore all read the attribute and still land on the
  false banner. React Router's own `Link` convention deliberately lets modified
  clicks through so those affordances work; here that correct convention led only
  to the broken URL, while swallowing modified clicks would have broken an
  affordance users expect. When both branches of the convention are wrong, the
  element is wrong.
- The prop was narrowed from `linkHref: string` to `linkTargetId: string`
  (`CheckpointState.tsx:28`): the component now takes an element id, never an
  href, and renders a button, so the trap is closed **by the type** rather than
  by handler logic — the next caller cannot re-arm it.
- **Accessibility.** A native fragment link moves both viewport and focus. The
  handler therefore scrolls the section into view **and** calls `.focus()` on it
  (`CheckpointState.tsx:66-70`); the section carries `tabIndex={-1}` and
  `aria-labelledby` (`CourseHome.tsx:257-260`), so focusing it announces its
  heading. Without this the fix would have worked for a mouse and been inert for
  keyboard and screen-reader users.

### Disclosed residual — unreachable, not valid

A button makes the broken URL **unreachable, not valid**: it removes the href
that consumers copy, bookmark, and restore, but it does **not** make
`#can-do-summary` resolve. Two vectors still reach the banner, and they differ in
duration — "minutes wide" describes only one of them:

- **Hand-typed or restored-by-fragment — permanent.** Anyone typing
  `#can-do-summary` into the address bar, or restoring a bookmark or session that
  holds that fragment, hits the same `InvalidRoute` redirect **indefinitely**,
  even in the fixed state. Removing the href narrows *who* arrives here — no
  in-app control emits the fragment any more — but it does not close the URL.
- **Restored from a link shared during the deploy window — window-bounded.** A
  link someone copied from the pre-fix control's `href` is reachable only for as
  long as such a link exists; *that* vector is minutes wide. I cannot evidence
  that **nobody** holds such a link, so I do not assert it — the checkable claim
  is only that no in-app affordance now produces one and the copy window was
  brief.

Removing the href is still the right trade: it is the thing consumers copy,
bookmark, and restore, and no learner-facing control needs it. But it is a
residual, disclosed rather than discovered.

**Deployment status (as of the Task 37 record `f8fc4f1`).** This fix is **not yet
deployed.** It is verified at `bbf565f` against the full verification-baseline
gate set below, but the live site still serves `426cee8` — whose checkpoint
control is still the pre-fix `<a href="#can-do-summary">` (the "Final git state"
section above records that the served bytes remain `426cee8`'s, proven by
Marker 1). So on the live site the click path **still exhibits the banner**; the
button changes the served bytes only after the next deployment. That redeploy and
its post-deploy markers will be recorded in a separate follow-up, in the same
`docs/`-appended pattern as the `dce5642` deployment record — this section is not
that record.

The complete fix is teaching the router to resolve the fragment; that is
`RouteScrollManager` routing scope and was **explicitly declined twice, for the
same reason both times** — out of scope for a corrective task. Declining it twice
for the same reason is consistency, not timidity. Tracked as **D-7** in
`docs/superpowers/backlog/2026-07-18-phase-4-deferred.md`.

### Second disclosed limitation — the unit assertion is a proxy (found in review)

The replacement unit assertion is `expect(html).not.toMatch(/href="#[^/]/)`
(`src/course/components/CourseHome.test.ts:518`). It forbids a **bare** fragment
(`#` not followed by `/`) and permits `#/…`, because under `HashRouter` a real
route link renders `href="#/percorso"`. Measured on the deployed (pre-fix) course
home: **68 anchors, 67 of the form `href="#/…"`, exactly one bare fragment —
`#can-do-summary`** (the 67-real-links figure is corroborated by `bbf565f`'s
commit message).

The spec reviewer identified, and I confirmed, that this is a **proxy**: it
enforces "no bare fragment" as a stand-in for "no non-route fragment", and the
two diverge on one class — `href="#/<unknown-route>"` would detonate identically
yet is admitted. It is backstopped by the component-level assertion
`expect(html).not.toMatch(/href=/)` (`src/course/components/CheckpointState.test.tsx:33`),
which forbids **any** href on the control itself and was not weakened. The
assertion is recorded here as a proxy with a backstop, not presented as stronger
than it is.

Why the previous form was replaced: `not.toMatch(/href="#/)` passed only because
the unit harness wraps in `MemoryRouter` (renders `href="/percorso"`) while
production mounts `HashRouter` (renders `href="#/percorso"`). It would have
failed against all 67 legitimate production links. An assertion that passes only
because the harness differs from production is a trap: anyone later making the
harness more faithful would see it fail for unrelated reasons and would weaken or
delete it. (Corrected in `bbf565f`.)

### Verification baselines at `bbf565f`

Each figure beside the command that produced it, all re-run at `bbf565f`.

| Gate | Command | Result (as measured) |
|---|---|---|
| Unit + property suite | `npx vitest run` | **199 files / 3759 tests** passed |
| Typecheck | `npx tsc --noEmit` | clean — exit 0, no output |
| Prebuild validator | `npm run prebuild` | **60 lessons, 15 modules, 59 Can-dos, 120 kanji (A2 only)**; **0** Japanese-literal violations |
| Standard build | `npm run build` | ✓ |
| Playwright suite | `npx playwright test` | **404 passed / 58 skipped / 0 failed** |

**The Playwright count moved, and here is why — an unexplained change is exactly
what a reader should challenge.** 404 is **+4** from the 400-passed baseline
recorded above (item 4 and the Task 36 gate re-run at `426cee8`), not a silent
drift. Task 37 added two new e2e tests to `tests/e2e/navigation.spec.ts` — a
click-activation test (added in `d1bbd47`) and a keyboard-(Enter)-activation test
(added in `bbf565f`) — each run across the two viewport projects (`desktop-1440`,
`mobile-390`), i.e. 4 test instances: 400 → 402 after the click test, → 404 after
the keyboard test. Skipped stays **58** (unchanged); 0 failed.

**Unchanged invariants (checked, not assumed).**

- Golden `src/course/a2/catalog/a2EditorialSurfaces.golden.json` sha256
  `6ce32b1fd05ead0c10f494549e090d1cf7328734e2cc9041635f320270b2b38f` — unchanged.
- 16 committed PNG baselines (12 in `tests/e2e/screenshots.spec.ts-snapshots/`,
  4 in `tests/e2e/course-visuals.spec.ts-snapshots/`) — none moved, despite the
  element-type change from `<a>` to `<button>`. `.checkpoint-state__link`
  (`src/course/course.css:391-412`) resets native button chrome (`appearance:
  none`, `border: 0`, `background: transparent`, `font: inherit`) and sets an
  explicit `text-decoration: underline`, so the control renders pixel-identical
  to the anchor it replaces.
