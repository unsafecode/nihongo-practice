import { fileURLToPath } from "node:url";
import type { OutputAsset, OutputChunk, RollupOutput, RollupWatcher } from "rollup";
import { build } from "vite";
import { beforeAll, describe, expect, it } from "vitest";

/**
 * Proves the I3 production-bundle architecture actually holds, not just that
 * the source is arranged the way we intend:
 *
 *  - `src/course/data/course.ts` no longer imports the full, content-
 *    cross-referencing `validateA1Release()` gate (2500+ lines across
 *    `validateA1.ts`+`validateFoundations.ts`) at all — it only calls the
 *    small, always-bundled `assertA1CourseShape()` structural check (see
 *    `runtimeShapeAssertion.test.ts` for that check's own fail-closed unit
 *    coverage). Full content validation still runs, in full, as the
 *    `prebuild` npm script (`scripts/validateA1Release.ts`) before every
 *    `vite build` — the fail-closed release gate moves earlier, it is never
 *    removed.
 *  - Because nothing reachable from the production entry point imports
 *    `validateFoundations.ts`/`validateA1.ts` any more, Rollup can (and, this
 *    test proves, does) tree-shake both files' code out of the real shipped
 *    JS chunks entirely.
 *  - The route/vendor splitting introduced alongside it (lazy `CourseHome`/
 *    `LessonPage`/`PracticeHome`/`Lab`/`Syllabary`/`Phrasebook` routes, plus a
 *    `manualChunks` vendor split for `node_modules`) actually produces more
 *    than one JS chunk, not just one renamed one — a real regression guard
 *    against silently losing the split later.
 *
 * This is a real production build via Vite's own `build()` API (`write:
 * false`, so nothing touches disk) — not a source-text/import-graph check —
 * so it fails if a *transitive* import ever reintroduces the validator, even
 * one this suite's authors didn't anticipate.
 */

// A string literal that exists only inside validateFoundations.ts's runtime
// code (used as an actual `error.code` value pushed at runtime — never only
// a type — so it cannot be erased at compile time) and is distinctive enough
// that it could not plausibly appear anywhere else in the app's source.
// See src/course/foundations/validateFoundations.ts's `ValidationErrorCode`.
const VALIDATOR_ONLY_MARKER = "productive-verb-spaced-reuse";

const CONFIG_FILE = fileURLToPath(new URL("../../../vite.config.ts", import.meta.url));

function isRollupOutputArray(
  result: RollupOutput | RollupOutput[] | RollupWatcher,
): result is RollupOutput[] {
  return Array.isArray(result);
}

let jsChunks: OutputChunk[] = [];

function circularChunkPaths(chunks: readonly OutputChunk[]): string[][] {
  const chunksByFileName = new Map(chunks.map((chunk) => [chunk.fileName, chunk]));
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const stack: string[] = [];
  const cycles: string[][] = [];

  const visit = (fileName: string): void => {
    if (visiting.has(fileName)) {
      const start = stack.indexOf(fileName);
      cycles.push([...stack.slice(start), fileName]);
      return;
    }
    if (visited.has(fileName)) return;

    const chunk = chunksByFileName.get(fileName);
    if (!chunk) return;
    visiting.add(fileName);
    stack.push(fileName);
    for (const dependency of chunk.imports) visit(dependency);
    stack.pop();
    visiting.delete(fileName);
    visited.add(fileName);
  };

  for (const chunk of chunks) visit(chunk.fileName);
  return cycles;
}

describe("production bundle — validator tree-shaking + chunk-splitting gate (I3)", () => {
  beforeAll(async () => {
    const result = await build({
      configFile: CONFIG_FILE,
      logLevel: "silent",
      build: {
        write: false,
        minify: true,
        sourcemap: false,
      },
    });

    const outputs: RollupOutput[] = isRollupOutputArray(result)
      ? result
      : [result as RollupOutput];

    jsChunks = outputs.flatMap((output) =>
      output.output.filter(
        (entry: OutputChunk | OutputAsset): entry is OutputChunk => entry.type === "chunk",
      ),
    );
  }, 120_000);

  it("never ships validateFoundations/validateA1 content-validator code in a production JS chunk", () => {
    expect(jsChunks.length).toBeGreaterThan(0);

    const chunksContainingMarker = jsChunks.filter((chunk) =>
      chunk.code.includes(VALIDATOR_ONLY_MARKER),
    );

    expect(chunksContainingMarker.map((chunk) => chunk.fileName)).toEqual([]);
  });

  it("splits the vendor dependencies and the lazy-loaded routes into their own chunks", () => {
    const fileNames = jsChunks.map((chunk) => chunk.fileName);

    expect(fileNames.some((name) => /^assets\/vendor-/.test(name))).toBe(true);
    for (const routeChunkName of [
      "CourseHome",
      "LessonPage",
      "PracticeHome",
      "Lab",
      "Syllabary",
      "Phrasebook",
    ]) {
      expect(
        fileNames.some((name) => name.includes(routeChunkName)),
        `expected a chunk file name containing "${routeChunkName}", got: ${fileNames.join(", ")}`,
      ).toBe(true);
    }
    // Real splitting, not just one renamed chunk: several independently
    // loadable JS files, not a single monolith.
    expect(jsChunks.length).toBeGreaterThan(5);
  });

  it("emits an acyclic static chunk graph so first paint cannot hit a temporal-dead-zone", () => {
    expect(circularChunkPaths(jsChunks)).toEqual([]);
  });
});
