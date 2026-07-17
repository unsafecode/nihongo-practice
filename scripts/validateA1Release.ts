/**
 * Official prebuild content-validation gate (Phase 2 Task 6, finding I3).
 *
 * Runs the full `validateA1Release()` release gate — the same structural,
 * cross-referencing content validator the test suite exercises via
 * `validateA1.test.ts` — over the real, frozen release catalogs, and exits
 * non-zero with the full structured error list if it ever reports invalid.
 *
 * This script is the *only* production-facing entry point that still touches
 * `validateA1.ts`/`validateFoundations.ts` (2500+ lines of catalog-
 * cross-referencing content validation): `src/course/data/course.ts` no
 * longer imports the full validator at all, so Rollup can tree-shake both
 * files out of the shipped browser bundle (see `runtimeShapeAssertion.ts` for
 * the small, always-bundled runtime counterpart). Wired as the npm `prebuild`
 * script, so both a bare local `npm run build` and the Pages workflow's
 * `npm run build` step run this full content gate before `vite build` ever
 * starts — the fail-closed guarantee moves earlier (content-invalid catalogs
 * now fail the prebuild step directly), it does not disappear.
 *
 * Run directly with `npx vite-node scripts/validateA1Release.ts` (vite-node
 * ships transitively with `vitest`, already a devDependency — no new
 * tooling), so it resolves the same TypeScript path/alias configuration as
 * the rest of the app without a separate build step of its own.
 */
import { validateA1Release } from "../src/course/a1/catalog/validateA1";

const result = validateA1Release();

if (!result.valid) {
  console.error(
    `validateA1Release: refusing to build — ${result.errors.length} content error(s) in the A1 release catalog:`,
  );
  for (const error of result.errors) {
    const parts = [error.code];
    if (error.id) parts.push(`id=${error.id}`);
    if (error.dimension) parts.push(`dimension=${error.dimension}`);
    if (error.referenceId) parts.push(`ref=${error.referenceId}`);
    console.error(`  - ${parts.join(" ")}`);
  }
  process.exit(1);
}

console.log(
  `validateA1Release: OK — the A1 release catalog is content-valid (0 errors).`,
);
