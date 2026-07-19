/**
 * Official A2 prebuild content-validation gate (Phase 3 Task 7).
 *
 * Runs the full `validateA2Release()` release gate — the same eight-point
 * structural, cross-referencing, and copy-hygiene validator
 * `validateA2.test.ts` exercises via its injectable `validateA2(input?)`
 * core — over the real, frozen A2 release catalogs, and exits non-zero
 * with the full structured error list if it ever reports invalid.
 *
 * Wired as the second stage of the npm `prebuild` chain (A1 gate, then
 * this A2 gate, then the no-Japanese lint), so both a bare local
 * `npm run build` and the Pages workflow's `npm run build` step run this
 * full A2 content gate — after A1's own — before `vite build` ever starts.
 *
 * Run directly with `npx vite-node scripts/validateA2Release.ts` (vite-node
 * ships transitively with `vitest`, already a devDependency — no new
 * tooling), so it resolves the same TypeScript path/alias configuration as
 * the rest of the app without a separate build step of its own.
 */
import { validateA2Release } from "../src/course/a2/catalog/validateA2";

const result = validateA2Release();

if (!result.valid) {
  console.error(
    `validateA2Release: refusing to build — ${result.errors.length} content error(s) in the A2 release catalog:`,
  );
  for (const error of result.errors) {
    const parts = [error.code];
    if (error.id) parts.push(`id=${error.id}`);
    if (error.dimension) parts.push(`dimension=${error.dimension}`);
    if (error.referenceId) parts.push(`ref=${error.referenceId}`);
    if (error.expected !== undefined) parts.push(`expected=${error.expected}`);
    if (error.actual !== undefined) parts.push(`actual=${error.actual}`);
    if (error.underlyingCode) parts.push(`underlyingCode=${error.underlyingCode}`);
    console.error(`  - ${parts.join(" ")}`);
  }
  process.exit(1);
}

const { reports } = result;
console.log(
  `validateA2Release: OK — the A2 release catalog is content-valid (0 errors). ` +
    `${reports.lessonCount} lessons, ${reports.moduleCount} modules, ${reports.canDos.length} Can-dos, ${reports.kanji.total} kanji.`,
);
