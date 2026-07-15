# Public Release Remediation — Design Specification

**Status:** Approved on 2026-07-15  
**Target repository:** `unsafecode/nihongo-practice`  
**Target release:** corrected v2.1  
**Deployment:** GitHub Pages, manual only

## 1. Goal

Prepare a release candidate that can be published as a public GitHub repository
and deployed to GitHub Pages without exposing the rejected v2.1 experience or a
known vulnerable dependency version.

The release must retain the existing browser-only architecture. It adds no
backend, account system, recording, analytics, telemetry, external font request,
API key, or automatic deployment trigger.

## 2. Baseline and authority

Commit `4d78cba29dcb19aa88905ccee40ae0eb5e77f985` is not the release baseline. It
contains the visual, navigation, accessibility, curriculum, progress-language,
and linguistic defects documented by the approved corrective redesign.

The corrective branch tip `49c55823342e8907969ec2d49f22bf9a049d63a2`
contains the approved redesign implementation and its expanded test coverage.
Those commits become the new release baseline without rewriting their history.

The following existing decisions remain authoritative:

- static React application built by Vite;
- `HashRouter` routing compatible with GitHub Pages;
- local-only preferences and progress;
- optional browser or operating-system speech synthesis;
- no application backend or runtime API dependency;
- manual-only GitHub Pages deployment.

## 3. Integration design

The release branch will be based on the corrective tip rather than selectively
reconstructing its 22 implementation commits. The remediation specification
commit remains on top of that baseline.

The integrated release includes:

- the corrected responsive shell and self-hosted typography;
- adequate action target sizes and styled controls;
- deterministic route scrolling and guided-tool return behavior;
- phase-based course structure and prerequisite guidance;
- visited-progress semantics and migration;
- corrected curriculum ordering, comparisons, transformations, and bilingual
  linguistic content;
- the corrective Vitest and Playwright acceptance coverage.

No corrective commit will be omitted merely to reduce the public diff. The
approved A1–A22 acceptance contract remains the release-quality gate.

## 4. Release hardening

### 4.1 Dependency security

Upgrade React Router within major version 7 to a version outside all advisories
reported against the current lockfile. Prefer the latest compatible 7.x release
accepted by the existing test suite rather than adopting React Router 8.

Both production-only and complete dependency audits must report zero known
vulnerabilities before release.

### 4.2 License and package metadata

License the project under the MIT License and declare the same license in
`package.json`.

Public package metadata will identify:

- package version `2.1.0`;
- author name without embedding a private email address;
- repository `https://github.com/unsafecode/nihongo-practice`;
- homepage `https://unsafecode.github.io/nihongo-practice/`;
- the Node version supported by the GitHub Actions workflow.

`private: true` remains in place to prevent accidental npm publication; it does
not restrict GitHub repository visibility.

### 4.3 Secret-file prevention

Extend `.gitignore` with explicit patterns for common environment, credential,
certificate, cookie, and local authentication-cache files. Example environment
templates may be tracked only through an explicit negation rule if one is ever
introduced.

This is preventive hardening. The audit found no such sensitive file in the
current tree or reachable history.

### 4.4 Public documentation

Reconcile README and HTML metadata with the corrected v2.1 application:

- describe the route-based course, free practice, and phrasebook accurately;
- remove stale v2 mode-switch and speculative v3 progress wording;
- document the MIT license and public repository metadata;
- preserve the browser-only data and speech disclosure;
- retain exact manual Pages activation and rollback instructions;
- state that the corrective acceptance suite, not only the legacy unit suite,
  defines release readiness.

The tracked design plans, specifications, and mockups remain public because
their inclusion is intentional project documentation and the audit found no
confidential content in them.

## 5. GitHub Pages design

Deployment remains initiated only by `workflow_dispatch`.

The workflow will:

- use the current supported major of the Pages artifact action;
- retain least-privilege `contents: read`, `pages: write`, and
  `id-token: write` permissions;
- retain the `github-pages` environment and deployment URL output;
- retain non-cancelling Pages concurrency;
- build with `GITHUB_PAGES=true`;
- refuse to build or deploy when manually invoked from any ref other than
  `refs/heads/master`.

Repository administrators must still select **GitHub Actions** as the Pages
source before the first run. The workflow will not attempt repository or Pages
enablement with a separate administrative token.

## 6. Verification design

The integrated release is accepted only after fresh execution of:

1. clean `npm ci`;
2. complete Vitest suite;
3. TypeScript and standard Vite production build;
4. `GITHUB_PAGES=true` production build;
5. all corrective Playwright suites and screenshot assertions;
6. production-only and complete `npm audit`;
7. direct dependency and bundled-notice license checks;
8. local Pages smoke tests for root assets, favicon, representative hash deep
   links, console output, and runtime network requests;
9. final tracked-content and Git status checks.

The Pages build must reference all generated assets beneath
`/nihongo-practice/`. Browser checks must report no unexpected console errors,
backend requests, analytics, trackers, service workers, or external runtime
assets.

Generated dependencies, build output, test output, and browser artifacts will
not be committed unless they are already intentional corrective visual
snapshots.

## 7. Error handling and rollback

- Integration conflicts stop the process for an explicit resolution; no
  corrective behavior is silently dropped.
- A failed audit, test, build, visual assertion, or smoke test blocks the
  release-ready claim.
- Pages workflow ref validation fails visibly when the selected ref is not
  `master`.
- The existing GitHub Pages unpublish and previous-deployment rerun procedures
  remain the operational rollback mechanism.

## 8. Completion criteria

The remediation is complete when:

- the release branch contains the full corrective implementation;
- React Router and the lockfile produce zero audit findings;
- MIT licensing and public metadata are present and consistent;
- README, HTML metadata, ignore rules, and the Pages workflow match this design;
- all corrective A1–A22 criteria and the verification sequence pass;
- no secret or new private identifier is introduced;
- the worktree is clean and the final commit is ready for a separate,
  user-approved merge and publication action.

Creating the GitHub repository, configuring remotes, pushing, enabling Pages,
or triggering deployment remains outside this remediation.
