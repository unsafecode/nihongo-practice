/// <reference types="vitest/config" />
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "GITHUB_PAGES");
  return {
    base: env.GITHUB_PAGES === "true" ? "/nihongo-practice/" : "/",
    plugins: [react()],
    server: {
      port: 5173,
      open: false,
    },
    build: {
      // Phase 2 Task 6, finding I3: keep every route's CSS in one file that
      // ships in `index.html`'s initial, render-blocking stylesheet link,
      // even though the route *JS* is lazy-split below. With Vite's default
      // per-chunk CSS splitting, a lazy route's stylesheet is only attached
      // (via a runtime-inserted, non-blocking <link>) once its JS chunk is
      // imported — a real gap in which React can mount and paint the route
      // with no CSS applied at all, so controls briefly render at the
      // browser's unstyled default size (e.g. a bare <input> or <a>, well
      // under the 44px touch target). A direct production-preview repro
      // proved this: it is why introducing lazy routes alone regressed the
      // 44px audit even though the exact same markup passed before. Merging
      // CSS keeps that guarantee intact while still letting the JS chunking
      // reduce what a first-time visitor to any one route downloads.
      cssCodeSplit: false,
      rollupOptions: {
        output: {
          // Phase 2 Task 6, finding I3: split the rarely-changing framework
          // dependencies (react/react-dom/react-router) into their own
          // vendor chunk, separate from the app's own code. This is a pure
          // packaging change — it never touches route/Suspense timing or any
          // runtime behavior a component/e2e test could observe — so it is
          // always safe, unlike lazy route splitting. It also means a
          // browser that already cached the vendor chunk from a previous
          // release does not have to re-download it just because app code
          // changed.
          manualChunks(id: string): string | undefined {
            // Phase 4 Task 30: the A1 and A2 catalogue modules are imported by
            // several lazy route chunks, so Rollup hoists them into the entry
            // chunk (the common ancestor) rather than leaving them in the route
            // chunk that first pulls them in. Naming them here gives each
            // catalogue its own chunk, which drops the entry chunk from ~1,010 kB
            // to ~265 kB and lets a content-only edit to one level invalidate
            // just that level's chunk instead of the whole entry.
            //
            // This is a packaging win, NOT a deferral: `ProgressContext.tsx`
            // renders at the app root and statically imports `a2/catalog/catalog`
            // (`a2SemanticBuiltLessons`), `a1/catalog/canDos`, both checkpoints
            // and `a2/manifest`, so the entry chunk still holds a static import
            // of course-a1/course-a2/course-foundations and first paint still
            // waits on all of them. Making the catalogues genuinely on-demand
            // means breaking that root-level dependency first; until then, do
            // not describe these chunks as lazy.
            //
            // Rollup's absorption algorithm assigns foundations/buildLessonViewModel,
            // foundations/realizeFamily, and romaji/formatRomaji to course-a1 and
            // course-a2 respectively rather than making them auto-shared, because
            // the named-chunk dependency graph is resolved before the shared-chunk
            // graph is finalized.  The result is a cycle:
            //   course-a1 (buildLessonViewModel) → course-a2 (realizeFamily)
            //   course-a2 (a2/catalog) → course-a1 (a1/checkpoint)
            // Naming these modules "course-foundations" breaks the cycle: neither
            // course-a1 nor course-a2 contain any foundation code, so the only
            // inter-named-chunk dependency is the one-way course-a2 → course-a1
            // arc that already exists (a2 catalog intentionally references the
            // A1 checkpoint definition).
            //
            // .tsx and .css files inside foundations/ are deliberately excluded:
            // they import from course/i18n which in turn imports a1/runtimeCopy
            // and a2/runtimeCopy, so they would create foundations → a1/a2 arcs
            // and re-introduce the cycle from the other direction. Those .tsx
            // files are lazy (LessonPage chunk) and need no explicit grouping.
            if (id.includes("/src/romaji/formatRomaji.ts")) return "course-foundations";
            if (
              id.includes("/src/course/foundations/") &&
              !id.endsWith(".tsx") &&
              !id.endsWith(".css")
            ) {
              return "course-foundations";
            }
            if (id.includes("/src/course/a2/")) return "course-a2";
            if (id.includes("/src/course/a1/")) return "course-a1";
            if (id.includes("node_modules")) {
              return "vendor";
            }
            return undefined;
          },
        },
      },
    },
    test: {
      environment: "node",
      // Phase 3 Task 3: KanjiRubyText.test.tsx is the first test file authored
      // directly in JSX (every earlier interactive component test used
      // `createElement` from a `.test.ts` file specifically to avoid needing
      // this). Included alongside the existing `.test.ts` patterns; nothing
      // about the default "node" environment changes; jsdom-dependent files
      // still opt in per-file with `/** @vitest-environment jsdom */`.
      include: [
        "src/**/*.test.ts",
        "src/**/*.test.tsx",
        "scripts/**/*.test.ts",
      ],
    },
  };
});
