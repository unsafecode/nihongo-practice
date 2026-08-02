/**
 * Fails the build when any single emitted JS chunk exceeds the budget.
 *
 * The Phase 4 baseline was a single ~1,010 kB entry chunk carrying both level
 * catalogues. Those catalogues now live in their own chunks, which keeps any
 * one chunk small enough to cache and re-download independently — but note
 * they are still statically imported by the entry (see `vite.config.ts`), so
 * this budget caps chunk *size*, it does not prove anything is deferred.
 *
 * `course-a2` is the tightest chunk against the ceiling and the one that grows
 * as A2 content is authored. If this script starts failing on it, the fix is to
 * split the A2 catalogue further (a `/src/course/a2/content/` rule ahead of the
 * general A2 rule in `vite.config.ts`), not to raise the budget.
 *
 * Run directly with `npx vite-node scripts/checkBundleBudget.ts` (vite-node
 * ships transitively with `vitest`, already a devDependency — no new
 * tooling), or via `npm run check:bundle` after a build.
 */
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const MAX_CHUNK_BYTES = 500 * 1024;
const assetsDir = fileURLToPath(new URL("../dist/assets", import.meta.url));

let builtAssets: string[];
try {
  builtAssets = readdirSync(assetsDir);
} catch {
  console.error(
    "checkBundleBudget: no build output at dist/assets — run `npm run build` first.",
  );
  process.exit(1);
}

const oversized = builtAssets
  .filter((name) => name.endsWith(".js"))
  .map((name) => ({ name, bytes: statSync(join(assetsDir, name)).size }))
  .filter((chunk) => chunk.bytes > MAX_CHUNK_BYTES)
  .sort((left, right) => right.bytes - left.bytes);

if (oversized.length > 0) {
  for (const chunk of oversized) {
    console.error(
      `chunk too large: ${chunk.name} = ${(chunk.bytes / 1024).toFixed(0)} kB (budget ${MAX_CHUNK_BYTES / 1024} kB)`,
    );
  }
  process.exit(1);
}

console.log(
  `bundle budget OK — every chunk is under ${MAX_CHUNK_BYTES / 1024} kB`,
);
