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
"79 commits / 102 files changed" is measured at the verified SHA; the commit that
added this document (`ed157e6`) shows **80 commits / 103 files**, and this
correcting follow-up shows **81 commits / 103 files** (it edits the same `docs/`
file, so the file count does not rise again). A reader reconciling item 11
against `git` at the tip should expect those higher figures and the one extra
`docs/` path. Finally, this document is **not** the last word on the deployed
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

- **Authoriser:** Riccardo Chiodaroli, repository owner and product owner. The
  attribution is verifiable, not asserted: he is the git author of `ab0c078`, the
  commit currently serving learners — `git --no-pager log -1 --format='%an'
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
  authorisation is pinned the way every other load-bearing fact here is.

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
   can reach a learner. Four independent checks, in descending order of strength,
   each with the command that produced it (run this session against the item-5
   `dist/`):

   **(a) No RSC runtime is installed — strongest, and independent of the
   bundler.** RSC requires a `react-server-dom-*` runtime
   (`react-server-dom-webpack`, `-turbopack`, or equivalent). None exists in the
   production closure: `npm ls --omit=dev --all | grep -i server-dom` returns
   **nothing**; the closure is exactly the eight packages in point 1. This is a
   statement about what is installed, not about what survived a grep, so
   minification cannot weaken it. (This is not the discredited manifest argument —
   that one was wrong because it undercounted the closure as three packages; this
   one is about a specific package family being absent from the correct
   eight-package closure.)

   **(b) There is no server to attack — structural.** This is a static GitHub
   Pages site with hash routing and no server process of any kind; an RSC-mode
   CSRF has no request-handling code path to reach here.

   **(c) Cookie-serialisation and RSC/streaming string literals are absent from
   the shipped bytes — robust, because these are literals, not manglable
   identifiers.** Property names and string literals survive this bundler (proven
   by the control probe below), so a 0-file result here is real evidence of
   absence:
   - `grep -rlE 'splitCookiesString|sameSite|set-cookie|maxAge|partitioned' dist/`
     → **0 files** (cookie-serialiser option names — literals in the source).
   - `grep -rlE 'createStaticHandler|renderToPipeableStream|RSC' dist/`
     → **0 files**.
   - `grep -rlE 'renderToReadableStream|createFromFetch' dist/`
     → **0 files**.

   **(d) Identifier-name probes — weakest, and explicitly minification-limited.**
   The vendor bundle is minified: local identifiers are mangled — the file opens
   `var Ku={exports:{}},_r={},Yu={exports:{}},q={};` and defines functions such as
   `function j(){`, `function ri(){`, `function rt(){`. A grep for a *function
   name* returning 0 files therefore proves the **string** is absent, not that the
   **code** is absent — a bundled function can be renamed to `j()`. These probes
   are named here as the least conclusive evidence in the section precisely so the
   stronger layers (a)–(c) carry the weight.

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
   currently-deployed commit) and HEAD. The advisory is already live in
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
