/**
 * The official Base prebuild release gate (Task 17).
 *
 * Runs the full `validateBaseRelease()` gate — the same additive,
 * cross-referencing release validator the test suite exercises via
 * `src/course/base/validateBase.test.ts` — over the real, frozen Base
 * release, and exits non-zero with the complete structured error list if it
 * ever reports invalid.
 *
 * This script is the only production-facing entry point that touches
 * `validateBase.ts`, `reports.ts` and the two editorial review ledgers. The
 * browser runtime (`src/course/data/course.ts`) calls only the small,
 * always-bundled `assertBaseCourseShape()` structural check, so Rollup
 * tree-shakes this whole gate out of the shipped bundle
 * (`src/course/data/prodBundle.test.ts` proves that against a real build).
 * Wired as the first entry in the npm `prebuild` chain, so a bare local
 * `npm run build` and the Pages workflow's `npm run build` step both run it
 * before `vite build` ever starts.
 *
 * ## Deliberate exit behaviour
 *
 * The Base naturalness ledger and the canonical-audio human-ear sign-off are
 * genuinely still `pending`: external review is happening in parallel with
 * this release. This script therefore separates two different things, and
 * treats them differently on purpose:
 *
 *  - **Stale review — exit 1.** If the shipped content no longer matches what
 *    a ledger inventoried (changed Japanese, changed asset hash, drifted
 *    corpus fingerprint), the release is shipping content nobody reviewed
 *    under that identity. `validateBaseRelease()` reports
 *    `naturalness-review-stale` / `audio-review-stale` and the build is
 *    refused.
 *  - **Pending external acceptance — exit 0, reported loudly.** A `pending`
 *    entry only means the external reviewer has not signed off yet. Failing
 *    the build on it would make the gate permanently red for a reason no
 *    change to this repository can fix, and quietly flipping it to `accepted`
 *    would be a fabricated pass. So the count is printed as an explicit
 *    warning *and* carried in the success line as `unresolved=N`. Nothing
 *    here writes, infers or upgrades an acceptance.
 *
 * Run directly with `npx vite-node scripts/validateBaseRelease.ts`.
 */
import { formatDistribution } from "../src/course/base/reports";
import {
  buildBaseReleaseInput,
  validateBaseRelease,
} from "../src/course/base/validateBase";

const result = validateBaseRelease(buildBaseReleaseInput());

if (!result.valid) {
  console.error(
    `validateBaseRelease: refusing to build — ${result.errors.length} release error(s) in the Base release:`,
  );
  for (const error of result.errors) {
    const parts = [error.code];
    if (error.lessonId) parts.push(`lesson=${error.lessonId}`);
    if (error.contentId) parts.push(`contentId=${error.contentId}`);
    if (error.referenceId) parts.push(`ref=${error.referenceId}`);
    if (error.detail) parts.push(`detail=${error.detail}`);
    console.error(`  - ${parts.join(" ")}`);
  }
  process.exit(1);
}

const report = result.report;

if (report.unresolvedFindings > 0) {
  console.warn(
    `validateBaseRelease: ${report.unresolvedFindings} release item(s) are awaiting pending external review ` +
      `(${report.pendingNaturalnessReviews} naturalness, ${report.pendingAudioReviews} canonical audio). ` +
      "Every review ledger is fresh — this is unresolved external acceptance, not a content error, " +
      "and it is neither auto-granted nor treated as a build failure.",
  );
}

console.log(
  `validateBaseRelease: OK (errors=0; modules=${report.modules}; lessons=${report.lessons}; ` +
    `lexemes=${report.lexemes}; examples=${report.examples}; dialogueTurns=${report.dialogueTurns}; ` +
    `activities=${report.activities}; categories=${formatDistribution(report.categories)}; ` +
    `patternCells=${report.patternCells}; references=${report.referenceEntries}; ` +
    `reviewedAudio=${report.reviewedAudio}; unresolved=${report.unresolvedFindings}).`,
);
