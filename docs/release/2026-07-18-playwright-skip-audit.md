# Playwright skip audit — 2026-07-18

## Summary

58 skipped test instances (across two viewport projects: desktop-1440 and
mobile-390), audited individually for the Phase 4 release.

**Measured at commit `1d24415` (Tasks 1–30):** 36 failed, 356 passed, 58 skipped.
**Measured at commit `ab0c078` (pre-Phase 4):** 0 failed, 392 passed, 58 skipped.

All 58 skips originate from 6 skip sites (grep-enumerated), every one of
which already carries a reason string. There are no bare `test.skip()` calls.

### Why the count correctly remains 58

The plan (Step 5) expected the total skipped count to be lower than 58.
That expectation was wrong: every one of the 58 is a legitimate
viewport/project guard. Each guarded test genuinely runs in the *other*
project, and the 48-route exhaust loop in `a1-depth.spec.ts` deliberately
runs once on desktop with a documented comment explaining why. Deleting or
force-enabling any of them would destroy real cross-viewport coverage.
The correct outcome is that all 58 stay, each with verdict `environment`.

### Owner-gated screenshot failures (12 tests, out of scope)

`tests/e2e/screenshots.spec.ts` has 6 screenshot baselines that each run on
both projects (12 test instances total). These fail because the Phase 4
visual changes made the baselines stale. Regenerating them requires the
product owner's visual review, which is pending. These 12 failures are
intentionally left as-is — no `.skip`, no `--update-snapshots`, no file
edits to the snapshots directory.

## Skip inventory

| # | File:line | Test name (skipped project) | Verdict | Action |
| --- | --- | --- | --- | --- |
| 1 | `tests/e2e/a1-depth.spec.ts:135` | sounds-1 (mobile-390) | `environment` | kept — desktop-only describe guard; runs on desktop-1440 |
| 2 | `tests/e2e/a1-depth.spec.ts:135` | sounds-2 (mobile-390) | `environment` | kept — desktop-only describe guard; runs on desktop-1440 |
| 3 | `tests/e2e/a1-depth.spec.ts:135` | sounds-3 (mobile-390) | `environment` | kept — desktop-only describe guard; runs on desktop-1440 |
| 4 | `tests/e2e/a1-depth.spec.ts:135` | sounds-4 (mobile-390) | `environment` | kept — desktop-only describe guard; runs on desktop-1440 |
| 5 | `tests/e2e/a1-depth.spec.ts:135` | introductions-1 (mobile-390) | `environment` | kept — desktop-only describe guard; runs on desktop-1440 |
| 6 | `tests/e2e/a1-depth.spec.ts:135` | introductions-2 (mobile-390) | `environment` | kept — desktop-only describe guard; runs on desktop-1440 |
| 7 | `tests/e2e/a1-depth.spec.ts:135` | introductions-3 (mobile-390) | `environment` | kept — desktop-only describe guard; runs on desktop-1440 |
| 8 | `tests/e2e/a1-depth.spec.ts:135` | introductions-4 (mobile-390) | `environment` | kept — desktop-only describe guard; runs on desktop-1440 |
| 9 | `tests/e2e/a1-depth.spec.ts:135` | essential-questions-1 (mobile-390) | `environment` | kept — desktop-only describe guard; runs on desktop-1440 |
| 10 | `tests/e2e/a1-depth.spec.ts:135` | essential-questions-2 (mobile-390) | `environment` | kept — desktop-only describe guard; runs on desktop-1440 |
| 11 | `tests/e2e/a1-depth.spec.ts:135` | essential-questions-3 (mobile-390) | `environment` | kept — desktop-only describe guard; runs on desktop-1440 |
| 12 | `tests/e2e/a1-depth.spec.ts:135` | essential-questions-4 (mobile-390) | `environment` | kept — desktop-only describe guard; runs on desktop-1440 |
| 13 | `tests/e2e/a1-depth.spec.ts:135` | actions-1 (mobile-390) | `environment` | kept — desktop-only describe guard; runs on desktop-1440 |
| 14 | `tests/e2e/a1-depth.spec.ts:135` | actions-2 (mobile-390) | `environment` | kept — desktop-only describe guard; runs on desktop-1440 |
| 15 | `tests/e2e/a1-depth.spec.ts:135` | actions-3 (mobile-390) | `environment` | kept — desktop-only describe guard; runs on desktop-1440 |
| 16 | `tests/e2e/a1-depth.spec.ts:135` | actions-4 (mobile-390) | `environment` | kept — desktop-only describe guard; runs on desktop-1440 |
| 17 | `tests/e2e/a1-depth.spec.ts:135` | routines-1 (mobile-390) | `environment` | kept — desktop-only describe guard; runs on desktop-1440 |
| 18 | `tests/e2e/a1-depth.spec.ts:135` | routines-2 (mobile-390) | `environment` | kept — desktop-only describe guard; runs on desktop-1440 |
| 19 | `tests/e2e/a1-depth.spec.ts:135` | routines-3 (mobile-390) | `environment` | kept — desktop-only describe guard; runs on desktop-1440 |
| 20 | `tests/e2e/a1-depth.spec.ts:135` | routines-4 (mobile-390) | `environment` | kept — desktop-only describe guard; runs on desktop-1440 |
| 21 | `tests/e2e/a1-depth.spec.ts:135` | past-negative-1 (mobile-390) | `environment` | kept — desktop-only describe guard; runs on desktop-1440 |
| 22 | `tests/e2e/a1-depth.spec.ts:135` | past-negative-2 (mobile-390) | `environment` | kept — desktop-only describe guard; runs on desktop-1440 |
| 23 | `tests/e2e/a1-depth.spec.ts:135` | past-negative-3 (mobile-390) | `environment` | kept — desktop-only describe guard; runs on desktop-1440 |
| 24 | `tests/e2e/a1-depth.spec.ts:135` | past-negative-4 (mobile-390) | `environment` | kept — desktop-only describe guard; runs on desktop-1440 |
| 25 | `tests/e2e/a1-depth.spec.ts:135` | places-1 (mobile-390) | `environment` | kept — desktop-only describe guard; runs on desktop-1440 |
| 26 | `tests/e2e/a1-depth.spec.ts:135` | places-2 (mobile-390) | `environment` | kept — desktop-only describe guard; runs on desktop-1440 |
| 27 | `tests/e2e/a1-depth.spec.ts:135` | places-3 (mobile-390) | `environment` | kept — desktop-only describe guard; runs on desktop-1440 |
| 28 | `tests/e2e/a1-depth.spec.ts:135` | places-4 (mobile-390) | `environment` | kept — desktop-only describe guard; runs on desktop-1440 |
| 29 | `tests/e2e/a1-depth.spec.ts:135` | people-1 (mobile-390) | `environment` | kept — desktop-only describe guard; runs on desktop-1440 |
| 30 | `tests/e2e/a1-depth.spec.ts:135` | people-2 (mobile-390) | `environment` | kept — desktop-only describe guard; runs on desktop-1440 |
| 31 | `tests/e2e/a1-depth.spec.ts:135` | people-3 (mobile-390) | `environment` | kept — desktop-only describe guard; runs on desktop-1440 |
| 32 | `tests/e2e/a1-depth.spec.ts:135` | people-4 (mobile-390) | `environment` | kept — desktop-only describe guard; runs on desktop-1440 |
| 33 | `tests/e2e/a1-depth.spec.ts:135` | descriptions-1 (mobile-390) | `environment` | kept — desktop-only describe guard; runs on desktop-1440 |
| 34 | `tests/e2e/a1-depth.spec.ts:135` | descriptions-2 (mobile-390) | `environment` | kept — desktop-only describe guard; runs on desktop-1440 |
| 35 | `tests/e2e/a1-depth.spec.ts:135` | descriptions-3 (mobile-390) | `environment` | kept — desktop-only describe guard; runs on desktop-1440 |
| 36 | `tests/e2e/a1-depth.spec.ts:135` | descriptions-4 (mobile-390) | `environment` | kept — desktop-only describe guard; runs on desktop-1440 |
| 37 | `tests/e2e/a1-depth.spec.ts:135` | shopping-1 (mobile-390) | `environment` | kept — desktop-only describe guard; runs on desktop-1440 |
| 38 | `tests/e2e/a1-depth.spec.ts:135` | shopping-2 (mobile-390) | `environment` | kept — desktop-only describe guard; runs on desktop-1440 |
| 39 | `tests/e2e/a1-depth.spec.ts:135` | shopping-3 (mobile-390) | `environment` | kept — desktop-only describe guard; runs on desktop-1440 |
| 40 | `tests/e2e/a1-depth.spec.ts:135` | shopping-4 (mobile-390) | `environment` | kept — desktop-only describe guard; runs on desktop-1440 |
| 41 | `tests/e2e/a1-depth.spec.ts:135` | existence-needs-1 (mobile-390) | `environment` | kept — desktop-only describe guard; runs on desktop-1440 |
| 42 | `tests/e2e/a1-depth.spec.ts:135` | existence-needs-2 (mobile-390) | `environment` | kept — desktop-only describe guard; runs on desktop-1440 |
| 43 | `tests/e2e/a1-depth.spec.ts:135` | existence-needs-3 (mobile-390) | `environment` | kept — desktop-only describe guard; runs on desktop-1440 |
| 44 | `tests/e2e/a1-depth.spec.ts:135` | existence-needs-4 (mobile-390) | `environment` | kept — desktop-only describe guard; runs on desktop-1440 |
| 45 | `tests/e2e/a1-depth.spec.ts:135` | capstones-1 (mobile-390) | `environment` | kept — desktop-only describe guard; runs on desktop-1440 |
| 46 | `tests/e2e/a1-depth.spec.ts:135` | capstones-2 (mobile-390) | `environment` | kept — desktop-only describe guard; runs on desktop-1440 |
| 47 | `tests/e2e/a1-depth.spec.ts:135` | capstones-3 (mobile-390) | `environment` | kept — desktop-only describe guard; runs on desktop-1440 |
| 48 | `tests/e2e/a1-depth.spec.ts:135` | capstones-4 (mobile-390) | `environment` | kept — desktop-only describe guard; runs on desktop-1440 |
| 49 | `tests/e2e/navigation.spec.ts:37` | opens without shifting header flow, traps focus, and restores it on close (desktop-1440) | `environment` | kept — mobile-only describe guard; runs on mobile-390 |
| 50 | `tests/e2e/navigation.spec.ts:37` | closes on backdrop click (desktop-1440) | `environment` | kept — mobile-only describe guard; runs on mobile-390 |
| 51 | `tests/e2e/navigation.spec.ts:37` | closes on the explicit close control (desktop-1440) | `environment` | kept — mobile-only describe guard; runs on mobile-390 |
| 52 | `tests/e2e/course-visuals.spec.ts:411` | the closed header measures at most 112px (desktop-1440) | `environment` | kept — mobile-only describe guard; runs on mobile-390 |
| 53 | `tests/e2e/course-visuals.spec.ts:411` | the brand mark stays on a single line (desktop-1440) | `environment` | kept — mobile-only describe guard; runs on mobile-390 |
| 54 | `tests/e2e/course-visuals.spec.ts:411` | the mobile settings trigger is visible (desktop-1440) | `environment` | kept — mobile-only describe guard; runs on mobile-390 |
| 55 | `tests/e2e/course-visuals.spec.ts:387` | brand, nav, and desktop settings never overlap (mobile-390) | `environment` | kept — desktop-only describe guard; runs on desktop-1440 |
| 56 | `tests/e2e/course-visuals.spec.ts:387` | the mobile settings trigger is hidden on desktop (mobile-390) | `environment` | kept — desktop-only describe guard; runs on desktop-1440 |
| 57 | `tests/e2e/course-visuals.spec.ts:547` | reading column 760-860px measure (mobile-390) | `environment` | kept — desktop-only test-level skip; runs on desktop-1440 |
| 58 | `tests/e2e/zoom-a11y.spec.ts:346` | 320px reflow floor (mobile-390) | `environment` | kept — single-project guard; runs on desktop-1440 with forced 320px viewport |
